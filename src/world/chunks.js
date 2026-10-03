function getWaterMaskBase(scene) {
    if (scene.waterMaskBase) return scene.waterMaskBase;

    const pattern = getTerrainPixels(scene, 'waterOverlay');
    const base = new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            const alpha = pattern.data[((y % pattern.height) * pattern.width + x % pattern.width) * 4 + 3];
            base[index + 1] = alpha > 192 ? 2 : alpha > 64 ? 1 : 0;
            base[index + 3] = 255;
        }
    }

    scene.waterMaskBase = base;
    return base;
}

function createChunkCanvas(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = CHUNK_PIXEL_SIZE;
    canvas.height = CHUNK_PIXEL_SIZE;
    canvas.getContext('2d', { willReadFrequently: true });

    return scene.textures.addCanvas(`chunk-canvas-${chunkCanvasCount++}`, canvas);
}

function acquireChunkCanvas(scene) {
    const texture = chunkCanvasPool.pop() || createChunkCanvas(scene);
    const context = texture.getContext();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    context.imageSmoothingEnabled = false;

    return texture;
}

function drawChunkTexture(context, scene, key, x, y, rotation = 0, flipX = false, flipY = false) {
    const source = getTextureSource(scene, key);
    const { width, height } = source;

    if (rotation) {
        const cos = Math.round(Math.cos(rotation));
        const sin = Math.round(Math.sin(rotation));

        context.setTransform(cos, sin, -sin, cos, x + width / 2, y + height / 2);
        context.drawImage(source, -width / 2, -height / 2);
    } else if (flipX || flipY) {
        context.setTransform(flipX ? -1 : 1, 0, 0, flipY ? -1 : 1, flipX ? x + width : x, flipY ? y + height : y);
        context.drawImage(source, 0, 0);
    } else {
        context.drawImage(source, x, y);
        return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
}

function createChunkLayer(scene, texture, x, y, depth) {
    texture.refresh();
    return scene.add.image(x, y, texture.key).setOrigin(0).setDepth(depth);
}

function createWorldChunk(scene, chunkX, chunkY, deferWater = false) {
    const key = getChunkKey(chunkX, chunkY);

    if (loadedChunks.has(key)) {
        return;
    }

    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;

    const tileSprites = [];
    const waterCells = [];
    const waterMaskCells = [];
    const edgeCells = [];
    const woodTiles = [];
    const bushes = [];
    const shorelineTiles = [];
    const groundTexture = acquireChunkCanvas(scene);
    const groundContext = groundTexture.getContext();
    let upperTexture = null;
    let upperContext = null;

    const getUpperContext = () => {
        if (!upperContext) {
            upperTexture = acquireChunkCanvas(scene);
            upperContext = upperTexture.getContext();
        }

        return upperContext;
    };

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;

            const worldTile = getWorldTile(tileX, tileY);
            const terrainTile = worldTile.bridge ? getTerrainTile(tileX, tileY) : worldTile;
            const tileKey = terrainTile.key;
            const isWater = tileKey.startsWith('water');
            const drawX = localX * TILE_SIZE;
            const drawY = localY * TILE_SIZE;
            let shoreline = null;

            if (isWater || terrainTile.baseKey === 'water') {
                const northWorldTile = getWorldTile(tileX, tileY - 1);
                const northTile = northWorldTile.bridge ? getTerrainTile(tileX, tileY - 1) : northWorldTile;
                shoreline = getShorelineTile(scene, terrainTile, northTile);
                shorelineTiles.push(localX, localY, shoreline.textureKey);
            }

            if (terrainTile.baseKey) {
                drawChunkTexture(groundContext, scene, shoreline ? shoreline.textureKey : terrainTile.baseKey, drawX, drawY);
            }

            drawChunkTexture(
                terrainTile.baseKey === 'water' ? getUpperContext() : groundContext,
                scene,
                isWater ? shoreline.textureKey : terrainTile.textureKey || tileKey,
                drawX,
                drawY,
                terrainTile.rotation
            );

            for (const patch of terrainTile.patches || []) {
                drawChunkTexture(getUpperContext(), scene, patch.key, drawX + patch.x, drawY + patch.y, 0, patch.flipX, patch.flipY);
            }

            if (worldTile.bridge) {
                drawChunkTexture(getUpperContext(), scene, worldTile.key, drawX, drawY, worldTile.rotation);
            }

            if (worldTile.key.startsWith('wood')) {
                woodTiles.push(localX, localY, worldTile);
            }

            const prop = getPropAt(tileX, tileY);

            if (prop === 'bush') {
                const baseY = (tileY + 1) * TILE_SIZE;
                const bush = { x: tileX * TILE_SIZE, y: baseY, slices: [], rustleStart: -Infinity, touching: false, offset: 0 };

                for (let slice = 0; slice < TILE_SIZE; slice++) {
                    const image = scene.add.image(bush.x, baseY, `bush-slice-${slice}`)
                        .setOrigin(0, 1)
                        .setDepth(baseY - TILE_SIZE + slice + 0.5);

                    worldObjectLayer.add(image);
                    tileSprites.push(image);
                    bush.slices.push(image);
                }

                bushes.push(bush);
            } else if (prop) {
                const sprite = getPropSprite(tileX, tileY);
                const image = scene.add.image(sprite.x, sprite.y, sprite.texture)
                    .setOrigin(0)
                    .setDepth((tileY + 1) * TILE_SIZE);

                worldObjectLayer.add(image);
                tileSprites.push(image);
            }

            if (shoreline) {
                const worldX = tileX * TILE_SIZE;
                const worldY = tileY * TILE_SIZE;

                for (const cell of shoreline.waterCells) {
                    const x = worldX + cell.x;
                    const y = worldY + cell.y;
                    waterMaskCells.push(x, y, cell.width, cell.height);
                    if (isWater && !worldTile.bridge && cell.width >= 12) waterCells.push(x, y, cell.width, cell.height);
                }

                for (const cell of shoreline.edgeCells) {
                    edgeCells.push(worldX + cell.x, worldY + cell.y, cell.width);
                }
            }
        }
    }

    const shadowMask = getStaticShadowMask(chunkX, chunkY);
    if (shadowMask) bakeGroundShadows(scene, groundContext, chunkX, chunkY, shadowMask);

    const groundLayer = createChunkLayer(scene, groundTexture, pixelX, pixelY, 0);
    const upperLayer = upperTexture ? createChunkLayer(scene, upperTexture, pixelX, pixelY, 1.5) : null;

    const chunk = {
        key,
        chunkX,
        chunkY,
        pixelX,
        pixelY,
        tileSprites,
        groundLayer,
        groundTexture,
        upperLayer,
        upperTexture,
        waterCells,
        visible: true,
        shimmers: [],
        overlay: null,
        waterTexture: null,
        shadowMask,
        bushes,
        fish: [],
        pixels: null,
        waterBuild: waterMaskCells.length > 0 ? { waterMaskCells, edgeCells, woodTiles, shorelineTiles } : null
    };

    loadedChunks.set(key, chunk);
    if (waterCells.length > 0) loadedShimmerChunks.add(chunk);

    if (chunk.waterBuild && deferWater) {
        pendingWaterChunks.push(chunk);
    } else if (chunk.waterBuild) {
        buildChunkWater(scene, chunk);
    }
}

function buildChunkWater(scene, chunk) {
    const { chunkX, chunkY, shadowMask } = chunk;
    const { waterMaskCells, edgeCells, woodTiles, shorelineTiles } = chunk.waterBuild;
    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;

    chunk.waterBuild = null;

    const waterTexture = acquireChunkCanvas(scene);
    const context = waterTexture.getContext();
    scene.waterChunkImage ||= context.createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    const image = scene.waterChunkImage;
    const data = image.data;

    data.set(getWaterMaskBase(scene));

    for (let cell = 0; cell < waterMaskCells.length; cell += 4) {
        const localX = waterMaskCells[cell] - pixelX;
        const localY = waterMaskCells[cell + 1] - pixelY;
        const width = waterMaskCells[cell + 2];
        const height = waterMaskCells[cell + 3];

        for (let y = localY; y < localY + height; y++) {
            let index = (y * CHUNK_PIXEL_SIZE + localX) * 4;
            for (let x = 0; x < width; x++, index += 4) data[index] = 255;
        }
    }

    const shoreDistances = getShoreDistances(scene, chunkX, chunkY);
    chunk.shoreDistances = shoreDistances;
    chunk.fish = [];
    spawnChunkFish(chunk);

    for (let pixel = 0, index = 0; pixel < shoreDistances.length; pixel++, index += 4) {
        if (!data[index]) continue;

        data[index + 1] += shoreDistances[pixel] * 3;
        if (shadowMask?.[pixel]) data[index] = 128;
    }

    for (let tile = 0; tile < shorelineTiles.length; tile += 3) {
        const art = getTerrainPixels(scene, shorelineTiles[tile + 2]).data;
        const originX = shorelineTiles[tile] * TILE_SIZE;
        const originY = shorelineTiles[tile + 1] * TILE_SIZE;

        for (let y = 0; y < TILE_SIZE; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const source = (y * TILE_SIZE + x) * 4;
                const target = ((originY + y) * CHUNK_PIXEL_SIZE + originX + x) * 4;
                const baseWater = art[source] === WATER_BASE_COLOR[0] && art[source + 1] === WATER_BASE_COLOR[1] &&
                    art[source + 2] === WATER_BASE_COLOR[2];

                if (data[target] && art[source + 3] && !baseWater) data[target] = 128;
            }
        }
    }

    const woodMask = getChunkWoodMask(scene, gatherNearbyWoodTiles(chunkX, chunkY, woodTiles));

    for (let y = 0; woodMask && y < CHUNK_PIXEL_SIZE; y++) {
        const maskRow = (y + WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET) * WOOD_MASK_SIZE + WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET;
        let index = y * CHUNK_PIXEL_SIZE * 4;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
            if (data[index] && woodMask[maskRow + x]) data[index] = 128;
        }
    }

    bakeChestSilhouette(chunk, data);

    for (let cell = 0; cell < edgeCells.length; cell += 3) {
        let index = ((edgeCells[cell + 1] - pixelY) * CHUNK_PIXEL_SIZE + edgeCells[cell] - pixelX) * 4 + 2;
        for (let x = 0; x < edgeCells[cell + 2]; x++, index += 4) data[index] = 255;
    }

    context.putImageData(image, 0, 0);
    waterTexture.refresh();

    chunk.waterTexture = waterTexture;
    chunk.overlay = scene.add.image(pixelX, pixelY, waterTexture.key)
        .setOrigin(0)
        .setDepth(1)
        .setVisible(chunk.visible)
        .setPipeline('WaterWarp');
    loadedWaterChunks.add(chunk);
}

function destroyWorldChunk(key) {
    const chunk = loadedChunks.get(key);
    if (!chunk) return;

    while (chunk.shimmers.length) poolShimmer(chunk.shimmers.pop());
    for (const sprite of chunk.tileSprites) sprite.destroy();

    for (const [layer, texture] of [[chunk.groundLayer, chunk.groundTexture], [chunk.upperLayer, chunk.upperTexture], [chunk.overlay, chunk.waterTexture]]) {
        if (layer) layer.destroy();
        if (texture) chunkCanvasPool.push(texture);
    }

    loadedWaterChunks.delete(chunk);
    loadedShimmerChunks.delete(chunk);
    loadedChunks.delete(key);
}
