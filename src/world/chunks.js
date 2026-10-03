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
    const originTileX = chunkX * CHUNK_SIZE;
    const originTileY = chunkY * CHUNK_SIZE;

    const tileSprites = [];
    const waterCells = [];
    const waterMaskCells = [];
    const edgeCells = [];
    const woodTiles = [];
    const bushes = [];
    const trees = [];
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
        const tileY = originTileY + localY;
        const drawY = localY * TILE_SIZE;
        const baseY = (tileY + 1) * TILE_SIZE;
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = originTileX + localX;

            const worldTile = getWorldTile(tileX, tileY);
            const terrainTile = worldTile.bridge ? getTerrainTile(tileX, tileY) : worldTile;
            const tileKey = terrainTile.key;
            const isWater = tileKey.startsWith('water');
            const drawX = localX * TILE_SIZE;
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

            for (const patch of terrainTile.patches || EMPTY_TILE_PATCHES) {
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
            } else if (prop === 'tree') {
                const sprite = getPropSprite(tileX, tileY);
                const trunk = scene.add.image(sprite.x, sprite.y, `${sprite.texture}-trunk`).setOrigin(0).setDepth(baseY);
                const canopy = scene.add.image(sprite.x, sprite.y, `${sprite.texture}-canopy`).setOrigin(0).setDepth(baseY + 0.1);
                worldObjectLayer.add([trunk, canopy]);
                tileSprites.push(trunk, canopy);
                const variant = getTreeVariant(tileX, tileY);
                trees.push({ x: sprite.x, y: sprite.y, baseY, width: variant.width, texture: `${sprite.texture}-canopy`, canopy, shadow: sprite.shadow, shadowTop: variant.shadowTop, shadowHeight: variant.shadowHeight, offset: 0, rustleStart: -Infinity, touching: false });
            } else if (prop) {
                const sprite = getPropSprite(tileX, tileY);
                const image = scene.add.image(sprite.x, sprite.y, sprite.texture)
                    .setOrigin(0)
                    .setDepth(baseY);

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
        trees,
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

function destroyWorldChunk(key) {
    const chunk = loadedChunks.get(key);
    if (!chunk) return;

    while (chunk.shimmers.length) poolShimmer(chunk.shimmers.pop());
    for (const sprite of chunk.tileSprites) sprite.destroy();

    for (const [layer, texture] of [[chunk.groundLayer, chunk.groundTexture], [chunk.upperLayer, chunk.upperTexture], [chunk.overlay, chunk.waterTexture], [chunk.treeShadowLayer, chunk.treeShadowTexture]]) {
        if (layer) layer.destroy();
        if (texture) chunkCanvasPool.push(texture);
    }

    loadedWaterChunks.delete(chunk);
    loadedShimmerChunks.delete(chunk);
    loadedChunks.delete(key);
}
