function getTileId(tileX, tileY) {
    return tileX * 67108864 + tileY;
}

function cacheWorldValue(cache, key, value) {
    if (cache.size >= WORLD_CACHE_LIMIT) {
        const keys = cache.keys();
        for (let index = 0; index < 512; index++) cache.delete(keys.next().value);
    }

    cache.set(key, value);
    return value;
}

function coordinateHash(x, y, seedHash) {
    let number = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seedHash;
    
    number ^= number >>> 13;

    number = Math.imul(number, 1274126177);

    return (((number ^ (number >>> 16)) >>> 0) / 4294967295);
}

function worldHash(x, y, salt = 0) {
    return coordinateHash(
        x,
        y,
        Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER)
    );
}

function smoothNoiseAmount(value) {
    return (value * value * (3 - 2 * value));
}

function valueNoise(worldX, worldY, scale, salt) {
    const scaledX = worldX / scale;
    const scaledY = worldY / scale;

    const left = Math.floor(scaledX);
    const top = Math.floor(scaledY);

    const horizontalAmount = smoothNoiseAmount(scaledX - left);
    const verticalAmount = smoothNoiseAmount(scaledY - top);

    const seedHash = Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER);
    const topLeft = coordinateHash(left, top, seedHash);
    const topRight = coordinateHash(left + 1, top, seedHash);
    const bottomLeft = coordinateHash(left, top + 1, seedHash);
    const bottomRight = coordinateHash(left + 1, top + 1, seedHash);

    const topValue = topLeft + (topRight - topLeft) * horizontalAmount;
    const bottomValue = bottomLeft + (bottomRight - bottomLeft) * horizontalAmount;

    return topValue + (bottomValue - topValue) * verticalAmount;
}

function fractalNoise(worldX, worldY, salt) {
    return(valueNoise(worldX, worldY, 48 * WORLD_FEATURE_SCALE, salt) * 0.55 +
        valueNoise(worldX + 83, worldY - 47, 24 * WORLD_FEATURE_SCALE, salt + 1) * 0.30 +
        valueNoise(worldX - 29, worldY + 101, 12 * WORLD_FEATURE_SCALE, salt + 2) * 0.15);
}

function getTerrainType(tileX, tileY) {
    const key = getTileId(tileX, tileY);
    const cached = terrainTypeCache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    let terrain;

    if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
        terrain = 'grass';
    } else {
        const warpScale = 64 * WORLD_FEATURE_SCALE;
        const warpStrength = 24 * WORLD_FEATURE_SCALE;
        const warpX = (valueNoise(tileX, tileY, warpScale, 10) - 0.5) * warpStrength;
        const warpY = (valueNoise(tileX + 200, tileY - 100, warpScale, 11) - 0.5) * warpStrength;

        const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);

        if (elevation < 0.3) {
            terrain = 'water';
        } else {
            const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);
            const localDirt = valueNoise(tileX, tileY, 4, 44);
            const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;

            terrain = elevation < 0.38 || dirtScore > 0.63
                ? 'dirt'
                : 'grass';
        }
    }

    return cacheWorldValue(terrainTypeCache, key, terrain);
}

function isLandTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) !== 'water';
}

function isLocalHashPeak(tileX, tileY, stepX, stepY, radius, salt) {
    const score = worldHash(tileX, tileY, salt);

    if (score < 0.82) {
        return false;
    }

    for (let offset = -radius; offset <= radius; offset++) {
        if (offset === 0) {
            continue;
        }

        const nearbyScore = worldHash(
            tileX + stepX * offset,
            tileY + stepY * offset,
            salt
        );

        if (nearbyScore >= score) {
            return false;
        }
    }

    return true;
}

function findWaterRun(tileX, tileY, stepX, stepY) {
    let waterX = tileX;
    let waterY = tileY;

    if (getTerrainType(waterX, waterY) !== 'water') {
        if (getTerrainType(tileX + stepX, tileY + stepY) === 'water') {
            waterX += stepX;
            waterY += stepY;
        } else if (getTerrainType(tileX - stepX, tileY - stepY) === 'water') {
            waterX -= stepX;
            waterY -= stepY;
        } else {
            return null;
        }
    }

    let startX = waterX;
    let startY = waterY;
    let endX = waterX;
    let endY = waterY;
    let waterLength = 1;

    while (getTerrainType(startX - stepX, startY - stepY) === 'water') {
        startX -= stepX;
        startY -= stepY;
        waterLength += 1;

        if (waterLength > MAX_BRIDGE_WATER_LENGTH) {
            return null;
        }
    }

    while (getTerrainType(endX + stepX, endY + stepY) === 'water') {
        endX += stepX;
        endY += stepY;
        waterLength += 1;

        if (waterLength > MAX_BRIDGE_WATER_LENGTH) {
            return null;
        }
    }

    if (waterLength < MIN_BRIDGE_WATER_LENGTH) {
        return null;
    }

    const startLandX = startX - stepX;
    const startLandY = startY - stepY;
    const endLandX = endX + stepX;
    const endLandY = endY + stepY;

    if (
        !isLandTile(startLandX, startLandY) ||
        !isLandTile(endLandX, endLandY)
    ) {
        return null;
    }

    return {
        startLandX,
        startLandY,
        waterLength
    };
}

function cacheBridgeCandidate(key, bridge) {
    return cacheWorldValue(bridgeCandidateCache, key, bridge);
}

function getBridgeCandidate(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const key = getTileId(tileX, tileY) * 2 + (salt === 811 ? 1 : 0);
    const cached = bridgeCandidateCache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    const run = findWaterRun(tileX, tileY, stepX, stepY);

    if (!run) {
        return cacheBridgeCandidate(key, null);
    }

    const spanLength = run.waterLength + 2;

    for (let distance = 0; distance < spanLength; distance++) {
        const firstX = run.startLandX + stepX * distance;
        const firstY = run.startLandY + stepY * distance;
        const secondX = firstX + widthX;
        const secondY = firstY + widthY;
        const shouldBeLand = distance === 0 || distance === spanLength - 1;

        if (shouldBeLand) {
            if (!isLandTile(firstX, firstY) || !isLandTile(secondX, secondY)) {
                return cacheBridgeCandidate(key, null);
            }
        } else if (
            getTerrainType(firstX, firstY) !== 'water' ||
            getTerrainType(secondX, secondY) !== 'water'
        ) {
            return cacheBridgeCandidate(key, null);
        }
    }

    let crossesChannel = false;

    for (let distance = 1; distance < spanLength - 1 && !crossesChannel; distance++) {
        const firstX = run.startLandX + stepX * distance;
        const firstY = run.startLandY + stepY * distance;

        crossesChannel =
            getTerrainType(firstX - widthX, firstY - widthY) === 'water' &&
            getTerrainType(firstX + widthX * 2, firstY + widthY * 2) === 'water';
    }

    if (!crossesChannel || !isLocalHashPeak(
        run.startLandX,
        run.startLandY,
        widthX,
        widthY,
        4,
        salt
    )) {
        return cacheBridgeCandidate(key, null);
    }

    const bridge = {
        startX: run.startLandX,
        startY: run.startLandY,
        stepX,
        stepY,
        widthX,
        widthY,
        spanLength
    };

    return cacheBridgeCandidate(key, bridge);
}

function isTileInBridge(tileX, tileY, bridge) {
    const offsetX = tileX - bridge.startX;
    const offsetY = tileY - bridge.startY;
    const distance = offsetX * bridge.stepX + offsetY * bridge.stepY;
    const width = offsetX * bridge.widthX + offsetY * bridge.widthY;

    return distance >= 0 && distance < bridge.spanLength &&
        (width === 0 || width === 1);
}

function getBridgeTile(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);

    if (
        terrain === 'water' ||
        getTerrainType(tileX, tileY - 1) === 'water' ||
        getTerrainType(tileX, tileY + 1) === 'water'
    ) {
        for (let firstColumn = tileX - 1; firstColumn <= tileX; firstColumn++) {
            const bridge = getBridgeCandidate(
                firstColumn,
                tileY,
                0,
                1,
                1,
                0,
                810
            );

            if (bridge && isTileInBridge(tileX, tileY, bridge)) {
                return {
                    key: 'wood',
                    rotation: 0,
                    bridge: true
                };
            }
        }
    }

    if (
        terrain === 'water' ||
        getTerrainType(tileX - 1, tileY) === 'water' ||
        getTerrainType(tileX + 1, tileY) === 'water'
    ) {
        for (let firstRow = tileY - 1; firstRow <= tileY; firstRow++) {
            const bridge = getBridgeCandidate(
                tileX,
                firstRow,
                1,
                0,
                0,
                1,
                811
            );

            if (bridge && isTileInBridge(tileX, tileY, bridge)) {
                return {
                    key: 'wood',
                    rotation: Math.PI / 2,
                    bridge: true
                };
            }
        }
    }

    return null;
}

function getPierCandidate(anchorX, anchorY) {
    const key = getTileId(anchorX, anchorY);
    const cached = pierCandidateCache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    let pier = null;

    if (
        isLandTile(anchorX, anchorY) &&
        isLandTile(anchorX + 1, anchorY) &&
        isLocalHashPeak(anchorX, anchorY, 1, 0, 5, 920)
    ) {
        const lengthRange = MAX_PIER_WATER_LENGTH - MIN_PIER_WATER_LENGTH + 1;
        const waterLength = MIN_PIER_WATER_LENGTH + Math.floor(
            worldHash(anchorX, anchorY, 921) * lengthRange
        );
        let hasWaterPath = true;

        for (let distance = 1; distance <= waterLength + 2; distance++) {
            if (
                getTerrainType(anchorX, anchorY + distance) !== 'water' ||
                getTerrainType(anchorX + 1, anchorY + distance) !== 'water'
            ) {
                hasWaterPath = false;
                break;
            }
        }

        if (hasWaterPath) {
            let openWaterTiles = 0;
            let checkedTiles = 0;

            for (let y = waterLength; y <= waterLength + 2; y++) {
                for (let x = -2; x <= 3; x++) {
                    checkedTiles += 1;

                    if (getTerrainType(anchorX + x, anchorY + y) === 'water') {
                        openWaterTiles += 1;
                    }
                }
            }

            if (openWaterTiles / checkedTiles >= 0.8) {
                pier = {
                    anchorX,
                    anchorY,
                    waterLength
                };
            }
        }
    }

    return cacheWorldValue(pierCandidateCache, key, pier);
}

function getPierTile(tileX, tileY) {
    if (
        getTerrainType(tileX, tileY) !== 'water' &&
        getTerrainType(tileX, tileY + 1) !== 'water'
    ) {
        return null;
    }

    for (let distance = 0; distance <= MAX_PIER_WATER_LENGTH; distance++) {
        for (let side = 0; side <= 1; side++) {
            const anchorX = tileX - side;
            const anchorY = tileY - distance;
            const pier = getPierCandidate(anchorX, anchorY);

            if (!pier || distance > pier.waterLength) {
                continue;
            }

            if (distance === pier.waterLength) {
                return {
                    key: side === 0 ? 'woodLeft' : 'woodRight',
                    rotation: 0,
                    baseKey: 'water'
                };
            }

            return {
                key: 'wood',
                rotation: 0
            };
        }
    }

    return null;
}

function getTerrainTileKey(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);

    if (terrain === 'water') {
        const northernTerrain = getTerrainType(tileX, tileY - 1);
        
        if (northernTerrain === 'dirt') {
            return 'waterDirt';
        }

        if (northernTerrain === 'grass') {
            return 'waterGrass';
        }

        return 'water';
    }

    const southernTerrain = getTerrainType(tileX, tileY + 1);

    if (southernTerrain === 'water') {
        if (terrain === 'dirt') {
            return 'dirtEdge';
        }

        return 'grassEdge';
    }

    if (terrain === 'dirt') {
        return 'dirt1';
    }

    const decoration = worldHash(tileX, tileY, 670);

    if (decoration > 0.80) {
        if (valueNoise(tileX, tileY, 8, 671) > 0.62) {
            return valueNoise(tileX + 149, tileY - 83, 24, 672) > 0.5
                ? 'grass4'
                : 'grass3';
        }

        return 'grass2';
    }

    return 'grass1';
}

function getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy) {
    if (terrain === 'dirt' && horizontal === 'grass' && vertical === 'grass') {
        return 'corner';
    }

    if (terrain === 'grass' && horizontal === 'dirt' && vertical === 'dirt' && diagonal === 'dirt') {
        return 'dirtEdgeCorner';
    }

    if (terrain === 'water' && horizontal !== 'water' && vertical !== 'water' && diagonal !== 'water') {
        return dy < 0 ? 'dirtCliffCorner' : 'dirtEdgeCorner';
    }

    return null;
}

function getTerrainTile(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);
    const north = getTerrainType(tileX, tileY - 1);
    const south = getTerrainType(tileX, tileY + 1);
    const west = getTerrainType(tileX - 1, tileY);
    const east = getTerrainType(tileX + 1, tileY);

    const tile = {
        key: getTerrainTileKey(tileX, tileY),
        rotation: 0
    };

    if (terrain === 'dirt' && south === 'water') {
        const left = west === 'water' ? 1
            : getTerrainType(tileX - 1, tileY + 1) !== 'water' ? 2 : 0;
        const right = east === 'water' ? 1
            : getTerrainType(tileX + 1, tileY + 1) !== 'water' ? 2 : 0;

        tile.textureKey = DIRT_CLIFF_TILES[left][right];

        if (left === 1 || right === 1) {
            tile.baseKey = 'water';
            tile.textureKey += '-trimmed';
        }
    }

    if (terrain === 'dirt' && north === 'water') {
        const left = west === 'water';
        const right = east === 'water';

        if (left || right) {
            const corner = left && right ? 'cornerDirt3'
                : left ? 'cornerDirt1' : 'cornerDirt2';

            tile.baseKey = 'water';
            tile.textureKey = south === 'water'
                ? `${tile.textureKey}-${corner}` : corner;
        }
    }

    if (terrain === 'water' && north !== 'water') {
        const left = west !== 'water' &&
            getTerrainType(tileX - 1, tileY - 1) !== 'water';
        const right = east !== 'water' &&
            getTerrainType(tileX + 1, tileY - 1) !== 'water';

        if (left || right) {
            const suffix = left && right ? 'InnerBoth'
                : left ? 'InnerLeft' : 'InnerRight';

            tile.textureKey = `${tile.key}${suffix}`;
        }
    }

    for (const [dx, dy] of TERRAIN_CORNER_OFFSETS) {
        const horizontal = dx < 0 ? west : east;
        const vertical = dy < 0 ? north : south;
        const diagonal = getTerrainType(tileX + dx, tileY + dy);
        const patchKey = getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy);

        if (!patchKey) continue;

        const size = patchKey === 'corner' ? 7 : 5;

        tile.patches ||= [];
        tile.patches.push({
            key: patchKey,
            x: dx < 0 ? 0 : TILE_SIZE - size,
            y: dy < 0 ? 0 : TILE_SIZE - size,
            size,
            flipX: dx > 0,
            flipY: dy > 0
        });
    }

    return tile;
}

function getWorldTile(tileX, tileY) {
    const key = getTileId(tileX, tileY);
    const cached = worldTileCache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    const tile = getBridgeTile(tileX, tileY) || getPierTile(tileX, tileY) || getTerrainTile(tileX, tileY);
    const name = tile.key.toLowerCase();

    tile.blocking = name.includes('water') ? 'full'
        : name.includes('edge') || name.includes('left') || name.includes('right') ? 'lower'
        : null;

    return cacheWorldValue(worldTileCache, key, tile);
}

function getWorldTileKey(tileX, tileY) {
    return getWorldTile(tileX, tileY).key;
}

function getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
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

    const signature = JSON.stringify([
        tile.key, tile.textureKey, tile.baseKey, tile.rotation, tile.patches
    ]);
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

    for (const patch of tile.patches || []) {
        const pixels = getTerrainPixels(scene, patch.key);

        for (let y = 0; y < pixels.height; y++) {
            for (let x = 0; x < pixels.width; x++) {
                const sourceX = patch.flipX ? pixels.width - 1 - x : x;
                const sourceY = patch.flipY ? pixels.height - 1 - y : y;
                if (!pixels.data[(sourceY * pixels.width + sourceX) * 4 + 3]) continue;

                const index = (patch.y + y) * TILE_SIZE + patch.x + x;
                land[index] = 1;
                water[index] = 0;
            }
        }
    }

    const surface = { signature, land, water };
    scene.terrainSurfaceCache.set(signature, surface);
    tile.surface = surface;
    return surface;
}

function getShorelineTile(scene, tile, northTile) {
    const surface = getTerrainSurface(scene, tile);
    const north = getTerrainSurface(scene, northTile);
    const signature = `${surface.signature}|${north.signature}`;
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

    const runs = (mask, mergeRows = false) => {
        const cells = [];
        const previous = new Map();

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
                const above = previous.get(key);

                if (mergeRows && above && above.y + above.height === y) {
                    above.height++;
                } else {
                    const cell = { x: start, y, width: x - start, height: 1 };
                    cells.push(cell);
                    previous.set(key, cell);
                }
            }
        }

        return cells;
    };

    const shoreline = {
        textureKey,
        waterCells: runs(surface.water, true),
        edgeCells: runs(edges)
    };
    scene.shorelineTileCache.set(signature, shoreline);
    return shoreline;
}

function gatherNearbyWoodTiles(chunkX, chunkY, woodTiles) {
    const tiles = woodTiles.slice();

    for (let localY = -1; localY <= CHUNK_SIZE; localY++) {
        const edgeRow = localY === -1 || localY === CHUNK_SIZE;

        for (let localX = -1; localX <= CHUNK_SIZE; localX += edgeRow ? 1 : CHUNK_SIZE + 1) {
            const tile = getWorldTile(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);

            if (tile.key.startsWith('wood')) {
                tiles.push(localX, localY, tile);
            }
        }
    }

    return tiles;
}

function getChunkWoodMask(scene, tiles) {
    if (tiles.length === 0) {
        return null;
    }

    const mask = new Uint8Array(WOOD_MASK_SIZE * WOOD_MASK_SIZE);

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
            for (let x = left - 1; x <= right; x++) {
                const maskIndex = (originY + y) * WOOD_MASK_SIZE + originX + x;
                const core = x >= left && x < right && y >= top && y < bottom;

                if (core) {
                    mask[maskIndex] = 2;
                } else if (mask[maskIndex] === 0 && ((x + y) & 1) === 0) {
                    mask[maskIndex] = 1;
                }
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
            if (pixels[(y * TILE_SIZE + x) * 4 + 3]) {
                opaque++;
                rowLeft = Math.min(rowLeft, x);
                rowRight = x + 1;
            }
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
    const distances = new Uint16Array(size * size);

    for (let localY = -SHORE_DISTANCE_MARGIN_TILES; localY < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localY++) {
        for (let localX = -SHORE_DISTANCE_MARGIN_TILES; localX < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;
            let tile = getWorldTile(tileX, tileY);

            if (tile.key.startsWith('wood')) {
                tile = getTerrainTile(tileX, tileY);
            }

            const water = getTerrainSurface(scene, tile).water;
            const originX = localX * TILE_SIZE + margin;
            const originY = localY * TILE_SIZE + margin;

            for (let y = 0; y < TILE_SIZE; y++) {
                const row = (originY + y) * size + originX;

                for (let x = 0; x < TILE_SIZE; x++) {
                    distances[row + x] = water[y * TILE_SIZE + x] ? 65535 : 0;
                }
            }
        }
    }

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const index = y * size + x;
            let value = distances[index];
            if (value === 0) continue;

            if (x > 0) value = Math.min(value, distances[index - 1] + 3);
            if (y > 0) {
                value = Math.min(value, distances[index - size] + 3);
                if (x > 0) value = Math.min(value, distances[index - size - 1] + 4);
                if (x < size - 1) value = Math.min(value, distances[index - size + 1] + 4);
            }

            distances[index] = value;
        }
    }

    for (let y = size - 1; y >= 0; y--) {
        for (let x = size - 1; x >= 0; x--) {
            const index = y * size + x;
            let value = distances[index];
            if (value === 0) continue;

            if (x < size - 1) value = Math.min(value, distances[index + 1] + 3);
            if (y < size - 1) {
                value = Math.min(value, distances[index + size] + 3);
                if (x < size - 1) value = Math.min(value, distances[index + size + 1] + 4);
                if (x > 0) value = Math.min(value, distances[index + size - 1] + 4);
            }

            distances[index] = value;
        }
    }

    const result = new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        const row = (y + margin) * size + margin;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            result[y * CHUNK_PIXEL_SIZE + x] = Math.min(SHORE_DISTANCE_MAX, Math.round(distances[row + x] / 3));
        }
    }

    return result;
}

function forEachStaticShadowPoint(chunkX, chunkY, callback) {
    const minTileX = chunkX * CHUNK_SIZE - 3;
    const minTileY = chunkY * CHUNK_SIZE - 1;
    const maxTileX = (chunkX + 1) * CHUNK_SIZE;
    const maxTileY = (chunkY + 1) * CHUNK_SIZE + 1;

    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
        for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type) continue;

            const sprite = getPropSprite(type, tileX, tileY);

            for (let point = 0; point < sprite.shadow.length; point += 2) {
                callback(sprite.x + sprite.shadow[point], sprite.y + sprite.shadow[point + 1]);
            }
        }
    }

    for (const caster of staticShadowCasters) {
        for (let point = 0; point < caster.points.length; point += 2) {
            callback(caster.x + caster.points[point], caster.y + caster.points[point + 1]);
        }
    }
}

function getStaticShadowMask(chunkX, chunkY) {
    const originX = chunkX * CHUNK_PIXEL_SIZE;
    const originY = chunkY * CHUNK_PIXEL_SIZE;
    let mask = null;

    forEachStaticShadowPoint(chunkX, chunkY, (x, y) => {
        const localX = x - originX;
        const localY = y - originY;

        if (localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE) return;

        mask ||= new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);
        mask[localY * CHUNK_PIXEL_SIZE + localX] = 1;
    });

    return mask;
}

function isFlatShadowTile(tile) {
    return !tile.patches && (tile.key.startsWith('grass') || tile.key === 'dirt1');
}

function bakeGroundShadows(scene, context, chunkX, chunkY, mask) {
    let minX = CHUNK_PIXEL_SIZE;
    let minY = CHUNK_PIXEL_SIZE;
    let maxX = -1;
    let maxY = -1;
    const detailed = [];

    for (let localY = 0; localY < CHUNK_PIXEL_SIZE; localY++) {
        let runStart = -1;
        let runColor = null;

        const flush = end => {
            if (runStart === -1) return;
            context.fillStyle = runColor;
            context.fillRect(runStart, localY, end - runStart, 1);
            runStart = -1;
            runColor = null;
        };

        for (let localX = 0; localX < CHUNK_PIXEL_SIZE; localX++) {
            const pixel = localY * CHUNK_PIXEL_SIZE + localX;
            let color = null;

            if (mask[pixel]) {
                const tile = getWorldTile(
                    chunkX * CHUNK_SIZE + Math.floor(localX / TILE_SIZE),
                    chunkY * CHUNK_SIZE + Math.floor(localY / TILE_SIZE)
                );

                if (!getTerrainSurface(scene, tile).water[(localY % TILE_SIZE) * TILE_SIZE + localX % TILE_SIZE]) {
                    if (isFlatShadowTile(tile)) {
                        color = getShadowStyle(scene, tile.key);
                    } else {
                        detailed.push(pixel);
                        minX = Math.min(minX, localX);
                        minY = Math.min(minY, localY);
                        maxX = Math.max(maxX, localX);
                        maxY = Math.max(maxY, localY);
                    }
                }
            }

            if (color !== runColor || !color) {
                flush(localX);
                if (color) {
                    runStart = localX;
                    runColor = color;
                }
            }
        }

        flush(CHUNK_PIXEL_SIZE);
    }

    if (detailed.length === 0) {
        return;
    }

    const width = maxX - minX + 1;
    const image = context.getImageData(minX, minY, width, maxY - minY + 1);

    for (const pixel of detailed) {
        const index = ((Math.floor(pixel / CHUNK_PIXEL_SIZE) - minY) * width + pixel % CHUNK_PIXEL_SIZE - minX) * 4;
        if (!image.data[index + 3]) continue;

        const shaded = shadeColor(image.data[index], image.data[index + 1], image.data[index + 2]);
        image.data[index] = shaded[0];
        image.data[index + 1] = shaded[1];
        image.data[index + 2] = shaded[2];
    }

    context.putImageData(image, minX, minY);
}

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

function createReadableCanvasTexture(scene, key, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d', { willReadFrequently: true });

    return scene.textures.addCanvas(key, canvas);
}

function acquireChunkCanvas(scene) {
    const texture = chunkCanvasPool.pop() || createReadableCanvasTexture(
        scene,
        `chunk-canvas-${chunkCanvasCount++}`,
        CHUNK_PIXEL_SIZE,
        CHUNK_PIXEL_SIZE
    );
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
        context.setTransform(
            flipX ? -1 : 1, 0, 0, flipY ? -1 : 1,
            flipX ? x + width : x,
            flipY ? y + height : y
        );
        context.drawImage(source, 0, 0);
    } else {
        context.drawImage(source, x, y);
        return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
}

function createChunkLayer(scene, texture, x, y, depth) {
    texture.refresh();

    return scene.add.image(x, y, texture.key)
        .setOrigin(0)
        .setDepth(depth);
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
            const terrainTile = worldTile.bridge
                ? getTerrainTile(tileX, tileY)
                : worldTile;
            const tileKey = terrainTile.key;
            const isWater = tileKey.startsWith('water');
            let shoreline = null;

            if (isWater || terrainTile.baseKey === 'water') {
                const northWorldTile = getWorldTile(tileX, tileY - 1);
                const northTile = northWorldTile.bridge
                    ? getTerrainTile(tileX, tileY - 1)
                    : northWorldTile;
                shoreline = getShorelineTile(scene, terrainTile, northTile);
                shorelineTiles.push(localX, localY, shoreline.textureKey);
            }

            const drawX = localX * TILE_SIZE;
            const drawY = localY * TILE_SIZE;

            if (terrainTile.baseKey) {
                drawChunkTexture(
                    groundContext,
                    scene,
                    shoreline ? shoreline.textureKey : terrainTile.baseKey,
                    drawX,
                    drawY
                );
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
                drawChunkTexture(
                    getUpperContext(),
                    scene,
                    patch.key,
                    drawX + patch.x,
                    drawY + patch.y,
                    0,
                    patch.flipX,
                    patch.flipY
                );
            }

            if (worldTile.bridge) {
                drawChunkTexture(
                    getUpperContext(),
                    scene,
                    worldTile.key,
                    drawX,
                    drawY,
                    worldTile.rotation
                );

            }

            if (worldTile.key.startsWith('wood')) {
                woodTiles.push(localX, localY, worldTile);
            }

            const prop = getPropAt(tileX, tileY);

            if (prop === 'bush') {
                const baseY = (tileY + 1) * TILE_SIZE;
                const bush = { x: tileX * TILE_SIZE, y: baseY, slices: [], rustleStart: -Infinity, touching: false, offset: 0 };

                for (let slice = 0; slice < TILE_SIZE; slice++) {
                    const image = scene.add.image(
                        bush.x, baseY, `bush-slice-${slice}`
                    )
                        .setOrigin(0, 1)
                        .setDepth(baseY - TILE_SIZE + slice + 0.5);

                    worldObjectLayer.add(image);
                    tileSprites.push(image);
                    bush.slices.push(image);
                }

                bushes.push(bush);
            } else if (prop) {
                const sprite = getPropSprite(prop, tileX, tileY);
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
                    const positioned = {
                        x: worldX + cell.x,
                        y: worldY + cell.y,
                        width: cell.width,
                        height: cell.height
                    };

                    waterMaskCells.push(positioned);
                    if (isWater && cell.width >= 12) waterCells.push(positioned);
                }

                for (const cell of shoreline.edgeCells) {
                    edgeCells.push(worldX + cell.x, worldY + cell.y, cell.width);
                }
            }
        }
    }

    const shadowMask = getStaticShadowMask(chunkX, chunkY);
    if (shadowMask) {
        bakeGroundShadows(scene, groundContext, chunkX, chunkY, shadowMask);
    }
    const groundLayer = createChunkLayer(scene, groundTexture, pixelX, pixelY, 0);
    const upperLayer = upperTexture
        ? createChunkLayer(scene, upperTexture, pixelX, pixelY, 1.5)
        : null;

    const chunk = {
        key,
        chunkX,
        chunkY,
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
        waterBuild: waterMaskCells.length > 0
            ? { waterMaskCells, edgeCells, woodTiles, shorelineTiles }
            : null
    };

    loadedChunks.set(key, chunk);
    if (waterCells.length > 0) loadedShimmerChunks.add(chunk);

    if (chunk.waterBuild) {
        if (deferWater) {
            pendingWaterChunks.push(chunk);
        } else {
            buildChunkWater(scene, chunk);
        }
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
    const image = context.createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    const data = image.data;

    data.set(getWaterMaskBase(scene));

    for (const cell of waterMaskCells) {
        const localX = cell.x - pixelX;
        const localY = cell.y - pixelY;

        for (let y = localY; y < localY + cell.height; y++) {
            let index = (y * CHUNK_PIXEL_SIZE + localX) * 4;

            for (let x = 0; x < cell.width; x++, index += 4) {
                data[index] = 255;
            }
        }
    }

    const shoreDistances = getShoreDistances(scene, chunkX, chunkY);
    chunk.shoreDistances = shoreDistances;
    chunk.fish = [];
    spawnChunkFish(chunk);

    for (let pixel = 0, index = 0; pixel < shoreDistances.length; pixel++, index += 4) {
        if (data[index]) {
            data[index + 1] += shoreDistances[pixel] * 3;
        }
    }

    for (let tile = 0; tile < shorelineTiles.length; tile += 3) {
        const art = getTerrainPixels(scene, shorelineTiles[tile + 2]).data;
        const originX = shorelineTiles[tile] * TILE_SIZE;
        const originY = shorelineTiles[tile + 1] * TILE_SIZE;

        for (let y = 0; y < TILE_SIZE; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const source = (y * TILE_SIZE + x) * 4;
                const target = ((originY + y) * CHUNK_PIXEL_SIZE + originX + x) * 4;

                if (
                    data[target] &&
                    art[source + 3] &&
                    (art[source] !== WATER_BASE_COLOR[0] ||
                        art[source + 1] !== WATER_BASE_COLOR[1] ||
                        art[source + 2] !== WATER_BASE_COLOR[2])
                ) {
                    data[target] = 128;
                }
            }
        }
    }

    if (shadowMask) {
        for (let pixel = 0, index = 0; pixel < shadowMask.length; pixel++, index += 4) {
            if (shadowMask[pixel] && data[index]) {
                data[index] = 128;
            }
        }
    }

    const nearbyWood = gatherNearbyWoodTiles(chunkX, chunkY, woodTiles);
    const woodMask = getChunkWoodMask(scene, nearbyWood);

    if (woodMask) {
        for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
            const maskRow = (y + WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET) * WOOD_MASK_SIZE +
                WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET;
            let index = y * CHUNK_PIXEL_SIZE * 4;

            for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
                if (data[index] && woodMask[maskRow + x]) {
                    data[index] = 128;
                }
            }
        }
    }

    for (let cell = 0; cell < edgeCells.length; cell += 3) {
        let index = ((edgeCells[cell + 1] - pixelY) * CHUNK_PIXEL_SIZE + edgeCells[cell] - pixelX) * 4 + 2;

        for (let x = 0; x < edgeCells[cell + 2]; x++, index += 4) {
            data[index] = 255;
        }
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

    if (!chunk) {
        return;
    }

    for (const shimmer of chunk.shimmers.slice()) {
        shimmer.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
        releaseShimmer(chunk, shimmer);
    }

    for (const tileSprite of chunk.tileSprites) {
        tileSprite.destroy();
    }

    chunk.groundLayer.destroy();
    chunkCanvasPool.push(chunk.groundTexture);

    if (chunk.upperLayer) {
        chunk.upperLayer.destroy();
        chunkCanvasPool.push(chunk.upperTexture);
    }

    if (chunk.overlay) {
        chunk.overlay.destroy();
    }



    if (chunk.waterTexture) {
        chunkCanvasPool.push(chunk.waterTexture);
    }

    loadedWaterChunks.delete(chunk);
    loadedShimmerChunks.delete(chunk);
    loadedChunks.delete(key);
}

function updateLoadedChunks(scene, force = false) {
    const characterCenterX = character.x + CHARACTER_SIZE / 2;
    const characterCenterY = character.y + CHARACTER_SIZE / 2;

    const characterTileX = Math.floor(characterCenterX / TILE_SIZE);
    const characterTileY = Math.floor(characterCenterY / TILE_SIZE);

    const centerChunkX = Math.floor(characterTileX / CHUNK_SIZE);
    const centerChunkY = Math.floor(characterTileY / CHUNK_SIZE);

    if (!force && centerChunkX === activeChunkX && centerChunkY === activeChunkY) {
        return;
    }

    const discoveredBefore = discoveredChunks.size;

    for (let offsetY = -CHUNK_DISCOVERY_RADIUS; offsetY <= CHUNK_DISCOVERY_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_DISCOVERY_RADIUS; offsetX <= CHUNK_DISCOVERY_RADIUS; offsetX++) {
            discoveredChunks.add(getTileId(
                centerChunkX + offsetX,
                centerChunkY + offsetY
            ));
        }
    }

    if (discoveredChunks.size !== discoveredBefore) saveDirty = true;

    pendingChunks.length = 0;

    for (let offsetY = -CHUNK_LOAD_RADIUS; offsetY <= CHUNK_LOAD_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_LOAD_RADIUS; offsetX <= CHUNK_LOAD_RADIUS; offsetX++) {
            const chunkX = centerChunkX + offsetX;
            const chunkY = centerChunkY + offsetY;

            if (force || offsetX === 0 && offsetY === 0) {
                createWorldChunk(scene, chunkX, chunkY);
            } else if (!loadedChunks.has(getChunkKey(chunkX, chunkY))) {
                pendingChunks.push(chunkX, chunkY);
            }
        }
    }

    for (const [key, chunk] of loadedChunks) {
        if (
            Math.abs(chunk.chunkX - centerChunkX) > CHUNK_LOAD_RADIUS ||
            Math.abs(chunk.chunkY - centerChunkY) > CHUNK_LOAD_RADIUS
        ) {
            destroyWorldChunk(key);
        }
    }

    activeChunkX = centerChunkX;
    activeChunkY = centerChunkY;
    visibleChunkLeft = null;
}

function buildPendingChunk(scene) {
    while (pendingChunks.length > 0) {
        const chunkY = pendingChunks.pop();
        const chunkX = pendingChunks.pop();

        if (
            Math.abs(chunkX - activeChunkX) > CHUNK_LOAD_RADIUS ||
            Math.abs(chunkY - activeChunkY) > CHUNK_LOAD_RADIUS ||
            loadedChunks.has(getChunkKey(chunkX, chunkY))
        ) {
            continue;
        }

        createWorldChunk(scene, chunkX, chunkY, true);
        visibleChunkLeft = null;
        return;
    }

    while (pendingWaterChunks.length > 0) {
        const chunk = pendingWaterChunks.shift();

        if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) {
            buildChunkWater(scene, chunk);
            return;
        }
    }
}

function updateChunkVisibility() {
    const left = mainCamera.scrollX;
    const top = mainCamera.scrollY;
    const right = left + mainCamera.width;
    const bottom = top + mainCamera.height;
    const chunkLeft = Math.floor(left / CHUNK_PIXEL_SIZE);
    const chunkRight = Math.ceil(right / CHUNK_PIXEL_SIZE) - 1;
    const chunkTop = Math.floor(top / CHUNK_PIXEL_SIZE);
    const chunkBottom = Math.ceil(bottom / CHUNK_PIXEL_SIZE) - 1;

    if (
        chunkLeft === visibleChunkLeft &&
        chunkRight === visibleChunkRight &&
        chunkTop === visibleChunkTop &&
        chunkBottom === visibleChunkBottom
    ) {
        return;
    }

    visibleChunkLeft = chunkLeft;
    visibleChunkRight = chunkRight;
    visibleChunkTop = chunkTop;
    visibleChunkBottom = chunkBottom;

    for (const chunk of loadedChunks.values()) {
        const visible = chunk.chunkX >= visibleChunkLeft &&
            chunk.chunkX <= visibleChunkRight &&
            chunk.chunkY >= visibleChunkTop &&
            chunk.chunkY <= visibleChunkBottom;

        if (visible === chunk.visible) continue;

        chunk.visible = visible;
        chunk.groundLayer.setVisible(visible);
        if (chunk.upperLayer) chunk.upperLayer.setVisible(visible);
        if (chunk.overlay) chunk.overlay.setVisible(visible);
    }
}

function updateChunkWater(time) {
    if (!waterPipeline || loadedWaterChunks.size === 0) return;

    waterPipeline.set1f('uTime', time / 1000);
    waterPipeline.set2f('uScroll', mainCamera.scrollX, mainCamera.scrollY);
    waterPipeline.set1f('uViewHeight', mainCamera.height);

    const left = mainCamera.scrollX - FISH_VIEW_MARGIN;
    const top = mainCamera.scrollY - FISH_VIEW_MARGIN;
    const right = mainCamera.scrollX + mainCamera.width + FISH_VIEW_MARGIN;
    const bottom = mainCamera.scrollY + mainCamera.height + FISH_VIEW_MARGIN;
    let count = 0;

    fishChunks: for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;

        for (const fish of chunk.fish) {
            if (count >= FISH_MAX_VISIBLE) break fishChunks;
            if (fish.x < left || fish.x > right || fish.y < top || fish.y > bottom) continue;

            fishUniforms[count * 4] = Math.round(fish.x);
            fishUniforms[count * 4 + 1] = Math.round(fish.y);
            fishUniforms[count * 4 + 2] = Math.cos(fish.heading);
            fishUniforms[count * 4 + 3] = Math.sin(fish.heading);
            fishShapeUniforms[count * 4] = fish.length;
            fishShapeUniforms[count * 4 + 1] = fish.radius;
            fishShapeUniforms[count * 4 + 2] = fish.phase;
            fishShapeUniforms[count * 4 + 3] = fish.amplitude;
            count++;
        }
    }

    waterPipeline.set4fv('uFish', fishUniforms);
    waterPipeline.set4fv('uFishShape', fishShapeUniforms);
    waterPipeline.set1f('uFishCount', count);
}
