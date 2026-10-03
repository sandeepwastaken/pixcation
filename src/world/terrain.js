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

function createTileCache(createChunk) {
    const chunks = new Map();
    let lastKey = null;
    let lastChunk = null;

    return (tileX, tileY, generate) => {
        const chunkX = Math.floor(tileX / CHUNK_SIZE);
        const chunkY = Math.floor(tileY / CHUNK_SIZE);
        const key = getTileId(chunkX, chunkY);

        if (key !== lastKey) {
            lastChunk = chunks.get(key);

            if (!lastChunk) {
                if (chunks.size >= TILE_CACHE_CHUNK_LIMIT) chunks.delete(chunks.keys().next().value);
                lastChunk = createChunk();
                chunks.set(key, lastChunk);
            }

            lastKey = key;
        }

        return lastChunk[(tileY - chunkY * CHUNK_SIZE) * CHUNK_SIZE + tileX - chunkX * CHUNK_SIZE] ||= generate(tileX, tileY);
    };
}

const TERRAIN_TYPES = [null, 'grass', 'dirt', 'water'];
const terrainTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const worldTiles = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function getTerrainType(tileX, tileY) {
    return TERRAIN_TYPES[terrainTiles(tileX, tileY, generateTerrainCode)];
}

function generateTerrainCode(tileX, tileY) {
    return TERRAIN_TYPES.indexOf(generateTerrainType(tileX, tileY));
}

function generateTerrainType(tileX, tileY) {
    if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
        return 'grass';
    }

    const warpScale = 64 * WORLD_FEATURE_SCALE;
    const warpStrength = 24 * WORLD_FEATURE_SCALE;
    const warpX = (valueNoise(tileX, tileY, warpScale, 10) - 0.5) * warpStrength;
    const warpY = (valueNoise(tileX + 200, tileY - 100, warpScale, 11) - 0.5) * warpStrength;
    const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);

    if (elevation < 0.3) {
        return 'water';
    }

    const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);
    const localDirt = valueNoise(tileX, tileY, 4, 44);
    const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;

    return elevation < 0.38 || dirtScore > 0.63 ? 'dirt' : 'grass';
}

function isLandTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) !== 'water';
}

function isLocalHashPeak(tileX, tileY, stepX, stepY, radius, salt) {
    const score = worldHash(tileX, tileY, salt);
    if (score < 0.82) return false;

    for (let offset = -radius; offset <= radius; offset++) {
        if (offset !== 0 && worldHash(tileX + stepX * offset, tileY + stepY * offset, salt) >= score) return false;
    }

    return true;
}

function findWaterRun(tileX, tileY, stepX, stepY) {
    const isWater = offset => getTerrainType(tileX + stepX * offset, tileY + stepY * offset) === 'water';
    const origin = isWater(0) ? 0 : isWater(1) ? 1 : isWater(-1) ? -1 : null;

    if (origin === null) return null;

    let start = origin;
    let end = origin;

    while (end - start < MAX_BRIDGE_WATER_LENGTH && isWater(start - 1)) start--;
    while (end - start < MAX_BRIDGE_WATER_LENGTH && isWater(end + 1)) end++;

    const waterLength = end - start + 1;

    if (waterLength < MIN_BRIDGE_WATER_LENGTH || waterLength > MAX_BRIDGE_WATER_LENGTH) return null;

    return {
        startLandX: tileX + stepX * (start - 1),
        startLandY: tileY + stepY * (start - 1),
        waterLength
    };
}

function getBridgeCandidate(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const key = getTileId(tileX, tileY) * 2 + (salt === 811 ? 1 : 0);
    const cached = bridgeCandidateCache.get(key);

    return cached !== undefined
        ? cached
        : cacheWorldValue(bridgeCandidateCache, key, findBridge(tileX, tileY, stepX, stepY, widthX, widthY, salt));
}

function findBridge(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const run = findWaterRun(tileX, tileY, stepX, stepY);
    if (!run) return null;

    const spanLength = run.waterLength + 2;
    const isWater = (distance, width) => getTerrainType(
        run.startLandX + stepX * distance + widthX * width,
        run.startLandY + stepY * distance + widthY * width
    ) === 'water';
    let crossesChannel = false;

    for (let distance = 0; distance < spanLength; distance++) {
        const middle = distance > 0 && distance < spanLength - 1;

        if (isWater(distance, 0) !== middle || isWater(distance, 1) !== middle) return null;
        crossesChannel ||= middle && isWater(distance, -1) && isWater(distance, 2);
    }

    if (!crossesChannel || !isLocalHashPeak(run.startLandX, run.startLandY, widthX, widthY, 4, salt)) return null;

    return { startX: run.startLandX, startY: run.startLandY, stepX, stepY, widthX, widthY, spanLength };
}

function isTileInBridge(tileX, tileY, bridge) {
    const offsetX = tileX - bridge.startX;
    const offsetY = tileY - bridge.startY;
    const distance = offsetX * bridge.stepX + offsetY * bridge.stepY;
    const width = offsetX * bridge.widthX + offsetY * bridge.widthY;

    return distance >= 0 && distance < bridge.spanLength &&
        (width === 0 || width === 1);
}

const BRIDGE_ORIENTATIONS = [
    { stepX: 0, stepY: 1, widthX: 1, widthY: 0, salt: 810, rotation: 0 },
    { stepX: 1, stepY: 0, widthX: 0, widthY: 1, salt: 811, rotation: Math.PI / 2 }
];

function getBridgeTile(tileX, tileY) {
    const onWater = getTerrainType(tileX, tileY) === 'water';

    for (const { stepX, stepY, widthX, widthY, salt, rotation } of BRIDGE_ORIENTATIONS) {
        if (
            !onWater &&
            getTerrainType(tileX - stepX, tileY - stepY) !== 'water' &&
            getTerrainType(tileX + stepX, tileY + stepY) !== 'water'
        ) {
            continue;
        }

        for (let offset = -1; offset <= 0; offset++) {
            const bridge = getBridgeCandidate(tileX + widthX * offset, tileY + widthY * offset, stepX, stepY, widthX, widthY, salt);

            if (bridge && isTileInBridge(tileX, tileY, bridge)) {
                return { key: 'wood', rotation, bridge: true };
            }
        }
    }

    return null;
}

function getPierCandidate(anchorX, anchorY) {
    const key = getTileId(anchorX, anchorY);
    const cached = pierCandidateCache.get(key);

    return cached !== undefined ? cached : cacheWorldValue(pierCandidateCache, key, findPier(anchorX, anchorY));
}

function findPier(anchorX, anchorY) {
    const isWater = (x, y) => getTerrainType(anchorX + x, anchorY + y) === 'water';

    if (isWater(0, 0) || isWater(1, 0) || !isLocalHashPeak(anchorX, anchorY, 1, 0, 5, 920)) return null;

    const lengthRange = MAX_PIER_WATER_LENGTH - MIN_PIER_WATER_LENGTH + 1;
    const waterLength = MIN_PIER_WATER_LENGTH + Math.floor(worldHash(anchorX, anchorY, 921) * lengthRange);
    let openWaterTiles = 0;

    for (let distance = 1; distance <= waterLength + 2; distance++) {
        if (!isWater(0, distance) || !isWater(1, distance)) return null;
    }

    for (let y = waterLength; y <= waterLength + 2; y++) {
        for (let x = -2; x <= 3; x++) {
            if (isWater(x, y)) openWaterTiles++;
        }
    }

    return openWaterTiles / 18 >= 0.8 ? { anchorX, anchorY, waterLength } : null;
}

function getPierTile(tileX, tileY) {
    if (getTerrainType(tileX, tileY) !== 'water' && getTerrainType(tileX, tileY + 1) !== 'water') return null;

    for (let distance = 0; distance <= MAX_PIER_WATER_LENGTH; distance++) {
        for (let side = 0; side <= 1; side++) {
            const pier = getPierCandidate(tileX - side, tileY - distance);
            if (!pier || distance > pier.waterLength) continue;

            return distance === pier.waterLength
                ? { key: side === 0 ? 'woodLeft' : 'woodRight', rotation: 0, baseKey: 'water' }
                : { key: 'wood', rotation: 0 };
        }
    }

    return null;
}

function getTerrainTileKey(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);

    if (terrain === 'water') {
        const north = getTerrainType(tileX, tileY - 1);
        return north === 'dirt' ? 'waterDirt' : north === 'grass' ? 'waterGrass' : 'water';
    }

    if (getTerrainType(tileX, tileY + 1) === 'water') return terrain === 'dirt' ? 'dirtEdge' : 'grassEdge';
    if (terrain === 'dirt') return 'dirt1';
    if (worldHash(tileX, tileY, 670) <= 0.80) return 'grass1';
    if (valueNoise(tileX, tileY, 8, 671) <= 0.62) return 'grass2';

    return valueNoise(tileX + 149, tileY - 83, 24, 672) > 0.5 ? 'grass4' : 'grass3';
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
    return worldTiles(tileX, tileY, generateWorldTile);
}

function generateWorldTile(tileX, tileY) {
    const tile = getBridgeTile(tileX, tileY) || getPierTile(tileX, tileY) || getTerrainTile(tileX, tileY);
    const name = tile.key.toLowerCase();

    tile.blocking = name.includes('water') ? 'full'
        : name.includes('edge') || name.includes('left') || name.includes('right') ? 'lower'
        : null;

    return tile;
}
