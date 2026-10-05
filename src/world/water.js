function getWaterMaskBase(scene) {
    if (scene.waterMaskBase) return scene.waterMaskBase;

    const pattern = getTerrainPixels(scene, 'waterOverlay');
    const base = new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        const patternRow = (y % pattern.height) * pattern.width * 4 + 3;
        let index = y * CHUNK_PIXEL_SIZE * 4;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
            const alpha = pattern.data[patternRow + (x % pattern.width) * 4];
            base[index + 1] = alpha > 192 ? 2 : alpha > 64 ? 1 : 0;
            base[index + 3] = 255;
        }
    }

    scene.waterMaskBase = base;
    return base;
}

function markWaterCells(data, cells, pixelX, pixelY) {
    for (let cell = 0; cell < cells.length; cell += 4) {
        const localX = cells[cell] - pixelX;
        const localY = cells[cell + 1] - pixelY;
        const width = cells[cell + 2];
        const height = cells[cell + 3];
        const bottom = localY + height;

        for (let y = localY; y < bottom; y++) {
            let index = (y * CHUNK_PIXEL_SIZE + localX) * 4;
            for (let x = 0; x < width; x++, index += 4) data[index] = 255;
        }
    }
}

function shadeWaterDepth(data, shoreDistances, shadowMask) {
    for (let pixel = 0, index = 0; pixel < shoreDistances.length; pixel++, index += 4) {
        if (!data[index]) continue;

        data[index + 1] += shoreDistances[pixel] * 3;
        if (shadowMask?.[pixel]) data[index] = 128;
    }
}

function shadeWaterShorelines(scene, data, shorelineTiles) {
    const [waterRed, waterGreen, waterBlue] = WATER_BASE_COLOR;
    for (let tile = 0; tile < shorelineTiles.length; tile += 3) {
        const art = getTerrainPixels(scene, shorelineTiles[tile + 2]).data;
        const originX = shorelineTiles[tile] * TILE_SIZE;
        const originY = shorelineTiles[tile + 1] * TILE_SIZE;

        for (let y = 0; y < TILE_SIZE; y++) {
            let source = y * TILE_SIZE * 4;
            let target = ((originY + y) * CHUNK_PIXEL_SIZE + originX) * 4;

            for (let x = 0; x < TILE_SIZE; x++, source += 4, target += 4) {
                if (!data[target] || !art[source + 3]) continue;
                const baseWater = art[source] === waterRed && art[source + 1] === waterGreen &&
                    art[source + 2] === waterBlue;

                if (!baseWater) data[target] = 128;
            }
        }
    }
}

function shadeWaterWood(data, woodMask) {
    const maskOffset = WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET;
    for (let y = 0; woodMask && y < CHUNK_PIXEL_SIZE; y++) {
        const maskRow = (y + maskOffset) * WOOD_MASK_SIZE + maskOffset;
        let index = y * CHUNK_PIXEL_SIZE * 4;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
            if (woodMask[maskRow + x] && data[index]) data[index] = 128;
        }
    }
}

function markWaterEdges(data, edgeCells, pixelX, pixelY) {
    for (let cell = 0; cell < edgeCells.length; cell += 3) {
        let index = ((edgeCells[cell + 1] - pixelY) * CHUNK_PIXEL_SIZE + edgeCells[cell] - pixelX) * 4 + 2;
        for (let x = 0; x < edgeCells[cell + 2]; x++, index += 4) data[index] = 255;
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
    markWaterCells(data, waterMaskCells, pixelX, pixelY);

    const shoreDistances = getShoreDistances(scene, chunkX, chunkY);
    chunk.shoreDistances = shoreDistances;
    chunk.fish = [];
    spawnChunkFish(chunk);

    shadeWaterDepth(data, shoreDistances, shadowMask);
    shadeWaterShorelines(scene, data, shorelineTiles);
    shadeWaterWood(data, getChunkWoodMask(scene, gatherNearbyWoodTiles(chunkX, chunkY, woodTiles)));
    bakeChestSilhouette(chunk, data);
    markWaterEdges(data, edgeCells, pixelX, pixelY);

    context.putImageData(image, 0, 0);
    chunk.waterShadowBase = new Uint8ClampedArray(data);
    waterTexture.refresh();

    chunk.waterTexture = waterTexture;
    chunk.overlay = scene.add.image(pixelX, pixelY, waterTexture.key)
        .setOrigin(0)
        .setDepth(1)
        .setVisible(chunk.visible)
        .setPipeline('WaterWarp');
    loadedWaterChunks.add(chunk);
}
