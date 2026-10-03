const EMPTY_TILE_PATCHES = Object.freeze([]);

function getChunkKey(chunkX, chunkY) {
    return getTileId(chunkX, chunkY);
}

function isTileDiscovered(tileX, tileY) {
    return discoveredChunks.has(getTileId(
        Math.floor(tileX / CHUNK_SIZE),
        Math.floor(tileY / CHUNK_SIZE)
    ));
}

function getTextureSource(scene, key) {
    let source = scene.textureSourceCache.get(key);

    if (!source) {
        source = scene.textures.get(key).getSourceImage();
        scene.textureSourceCache.set(key, source);
    }

    return source;
}

function getTerrainPixels(scene, key) {
    const cached = scene.terrainPixelCache.get(key);
    if (cached) return cached;

    const source = getTextureSource(scene, key);
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    scene.terrainPixelCache.set(key, pixels);
    return pixels;
}

function getTerrainSurface(scene, tile) {
    if (tile.surface) return tile.surface;

    const patches = tile.patches || EMPTY_TILE_PATCHES;
    const patchSignature = patches.length
        ? patches.map(patch => `${patch.key},${patch.x},${patch.y},${patch.flipX},${patch.flipY}`).join(';')
        : '';
    const signature = `${tile.key}|${tile.textureKey}|${tile.baseKey}|${tile.rotation}|${patchSignature}`;
    const cached = scene.terrainSurfaceCache.get(signature);

    if (cached) {
        tile.surface = cached;
        return tile.surface;
    }

    const isWater = tile.key.startsWith('water');
    const isWood = tile.key.startsWith('wood');
    const pixels = getTerrainPixels(scene, tile.textureKey || tile.key);
    const land = new Uint8Array(TILE_SIZE * TILE_SIZE);
    const water = new Uint8Array(TILE_SIZE * TILE_SIZE);

    for (let index = 0; index < land.length; index++) {
        const opaque = pixels.data[index * 4 + 3] > 0;
        land[index] = !isWater && !isWood && opaque ? 1 : 0;
        water[index] = isWater || tile.baseKey === 'water' && !opaque ? 1 : 0;
    }

    for (const patch of patches) {
        const pixels = getTerrainPixels(scene, patch.key);

        for (let y = 0; y < pixels.height; y++) {
            const sourceY = patch.flipY ? pixels.height - 1 - y : y;
            const sourceRow = sourceY * pixels.width;
            const targetRow = (patch.y + y) * TILE_SIZE + patch.x;
            for (let x = 0; x < pixels.width; x++) {
                const sourceX = patch.flipX ? pixels.width - 1 - x : x;
                if (!pixels.data[(sourceRow + sourceX) * 4 + 3]) continue;

                const index = targetRow + x;
                land[index] = 1;
                water[index] = 0;
            }
        }
    }

    const surface = { id: scene.terrainSurfaceCache.size, land, water };
    scene.terrainSurfaceCache.set(signature, surface);
    tile.surface = surface;
    return surface;
}

function getTileMaskRuns(mask, mergeRows = false) {
    const cells = [];
    const previous = mergeRows ? [] : null;

    for (let y = 0; y < TILE_SIZE; y++) {
        let x = 0;

        while (x < TILE_SIZE) {
            if (!mask[y * TILE_SIZE + x]) {
                x++;
                continue;
            }

            const start = x;
            while (x < TILE_SIZE && mask[y * TILE_SIZE + x]) x++;
            const key = start * (TILE_SIZE + 1) + x - start;
            const above = previous?.[key];

            if (mergeRows && above && above.y + above.height === y) {
                above.height++;
            } else {
                const cell = { x: start, y, width: x - start, height: 1 };
                cells.push(cell);
                if (previous) previous[key] = cell;
            }
        }
    }

    return cells;
}

function getShorelineTile(scene, tile, northTile) {
    const surface = getTerrainSurface(scene, tile);
    const north = getTerrainSurface(scene, northTile);
    const signature = surface.id * 65536 + north.id;
    const cached = scene.shorelineTileCache.get(signature);
    if (cached) return cached;

    const textureKey = `shoreline-${scene.shorelineTileCache.size}`;
    const texture = scene.textures.createCanvas(textureKey, TILE_SIZE, TILE_SIZE);
    const context = texture.getContext();
    const image = context.createImageData(TILE_SIZE, TILE_SIZE);
    const base = getTerrainPixels(scene, 'water');
    const waterTile = tile.key.startsWith('water') && tile.key !== 'water';
    const shadowKey = waterTile ? tile.textureKey || tile.key
        : tile.key.startsWith('grass') || northTile.key.includes('Grass') ||
            northTile.key.startsWith('grass') ? 'waterGrass' : 'waterDirt';
    const shadow = getTerrainPixels(scene, shadowKey);
    const edges = new Uint8Array(TILE_SIZE * TILE_SIZE);

    for (let x = 0; x < TILE_SIZE; x++) {
        let distance = TILE_SIZE;

        for (let y = TILE_SIZE - 1; y >= 0; y--) {
            if (north.land[y * TILE_SIZE + x]) {
                distance = TILE_SIZE - 2 - y;
                break;
            }
        }

        let shadowOffset = 0;
        if (waterTile) {
            while (shadowOffset < TILE_SIZE &&
                surface.land[shadowOffset * TILE_SIZE + x]) {
                shadowOffset++;
            }
        }

        for (let y = 0; y < TILE_SIZE; y++) {
            const index = y * TILE_SIZE + x;

            if (surface.land[index]) {
                distance = -1;
                continue;
            }

            distance++;
            if (!surface.water[index]) continue;

            const shadowY = distance + shadowOffset;
            const shaded = shadowY < TILE_SIZE;
            const source = shaded ? shadow.data : base.data;
            const sourceIndex = ((shaded ? shadowY : y) * TILE_SIZE + x) * 4;
            const targetIndex = index * 4;
            image.data[targetIndex] = source[sourceIndex];
            image.data[targetIndex + 1] = source[sourceIndex + 1];
            image.data[targetIndex + 2] = source[sourceIndex + 2];
            image.data[targetIndex + 3] = source[sourceIndex + 3];
            edges[index] = distance === 0 ? 1 : 0;
        }
    }

    context.putImageData(image, 0, 0);
    texture.refresh();
    scene.terrainPixelCache.set(textureKey, image);

    const shoreline = {
        textureKey,
        waterCells: getTileMaskRuns(surface.water, true),
        edgeCells: getTileMaskRuns(edges)
    };
    scene.shorelineTileCache.set(signature, shoreline);
    return shoreline;
}

function gatherNearbyWoodTiles(chunkX, chunkY, woodTiles) {
    for (let localY = -1; localY <= CHUNK_SIZE; localY++) {
        const edgeRow = localY === -1 || localY === CHUNK_SIZE;

        for (let localX = -1; localX <= CHUNK_SIZE; localX += edgeRow ? 1 : CHUNK_SIZE + 1) {
            const tile = getWorldTile(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);
            if (tile.key.startsWith('wood')) woodTiles.push(localX, localY, tile);
        }
    }

    return woodTiles;
}

let woodMaskScratch;

function getChunkWoodMask(scene, tiles) {
    if (tiles.length === 0) return null;

    woodMaskScratch ||= new Uint8Array(WOOD_MASK_SIZE * WOOD_MASK_SIZE);
    const mask = woodMaskScratch;
    mask.fill(0);

    for (let index = 0; index < tiles.length; index += 3) {
        if (tiles[index] === CHUNK_SIZE || tiles[index + 1] === CHUNK_SIZE) continue;

        const tile = tiles[index + 2];
        const deck = getDeckBounds(scene, tile.key);
        const rotated = Boolean(tile.rotation);
        const left = rotated ? TILE_SIZE - deck.bottom : deck.left;
        const right = rotated ? TILE_SIZE - deck.top : deck.right;
        const top = rotated ? deck.left : deck.top;
        const bottom = rotated ? deck.right : deck.bottom;
        const originX = tiles[index] * TILE_SIZE + WOOD_MASK_MARGIN;
        const originY = tiles[index + 1] * TILE_SIZE + WOOD_MASK_MARGIN;

        for (let y = top - 1; y <= bottom; y++) {
            const row = (originY + y) * WOOD_MASK_SIZE + originX;
            for (let x = left - 1; x <= right; x++) {
                const core = x >= left && x < right && y >= top && y < bottom;
                if (core || ((x + y) & 1) === 0) mask[row + x] = 1;
            }
        }
    }

    return mask;
}

function getDeckBounds(scene, key) {
    scene.deckBoundsCache ||= new Map();

    const cached = scene.deckBoundsCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const bounds = { left: TILE_SIZE, right: 0, top: TILE_SIZE, bottom: 0 };

    for (let y = 0; y < TILE_SIZE; y++) {
        let opaque = 0;
        let rowLeft = TILE_SIZE;
        let rowRight = 0;

        for (let x = 0; x < TILE_SIZE; x++) {
            if (!pixels[(y * TILE_SIZE + x) * 4 + 3]) continue;

            opaque++;
            rowLeft = Math.min(rowLeft, x);
            rowRight = x + 1;
        }

        if (opaque * 2 < TILE_SIZE) continue;

        bounds.top = Math.min(bounds.top, y);
        bounds.bottom = y + 1;
        bounds.left = Math.min(bounds.left, rowLeft);
        bounds.right = Math.max(bounds.right, rowRight);
    }

    scene.deckBoundsCache.set(key, bounds);
    return bounds;
}

function getShoreDistances(scene, chunkX, chunkY) {
    const margin = SHORE_DISTANCE_MARGIN_TILES * TILE_SIZE;
    const size = CHUNK_PIXEL_SIZE + margin * 2;
    const stride = size + 2;

    if (!scene.shoreDistanceScratch) {
        scene.shoreDistanceScratch = new Uint16Array(stride * stride);
        scene.shoreDistanceScratch.fill(65535);
    }

    const distances = scene.shoreDistanceScratch;

    for (let localY = -SHORE_DISTANCE_MARGIN_TILES; localY < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localY++) {
        for (let localX = -SHORE_DISTANCE_MARGIN_TILES; localX < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;
            let tile = getWorldTile(tileX, tileY);

            if (tile.key.startsWith('wood')) {
                tile = getTerrainTile(tileX, tileY);
            }

            const water = getTerrainSurface(scene, tile).water;
            const originX = localX * TILE_SIZE + margin + 1;
            const originY = localY * TILE_SIZE + margin + 1;

            for (let y = 0; y < TILE_SIZE; y++) {
                const row = (originY + y) * stride + originX;
                const sourceRow = y * TILE_SIZE;

                for (let x = 0; x < TILE_SIZE; x++) {
                    distances[row + x] = water[sourceRow + x] ? 65535 : 0;
                }
            }
        }
    }

    for (let direction = 1; direction >= -1; direction -= 2) {
        const back = direction * stride;

        for (let step = 0; step < size; step++) {
            const y = direction > 0 ? step : size - 1 - step;
            const row = (y + 1) * stride + (direction > 0 ? 1 : size);

            for (let column = 0, index = row; column < size; column++, index += direction) {
                const value = distances[index];
                if (value === 0) continue;

                distances[index] = Math.min(
                    value,
                    distances[index - direction] + 3,
                    distances[index - back] + 3,
                    distances[index - back - 1] + 4,
                    distances[index - back + 1] + 4
                );
            }
        }
    }

    const result = new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        const row = (y + margin + 1) * stride + margin + 1;
        const resultRow = y * CHUNK_PIXEL_SIZE;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            result[resultRow + x] = Math.min(SHORE_DISTANCE_MAX, Math.round(distances[row + x] / 3));
        }
    }

    return result;
}
