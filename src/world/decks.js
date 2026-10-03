const bridgeCandidateCache = new Map();
const pierCandidateCache = new Map();

function isLocalHashPeak(tileX, tileY, stepX, stepY, radius, salt) {
    const seedHash = Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER);
    const score = coordinateHash(tileX, tileY, seedHash);
    if (score < 0.82) return false;

    for (let offset = -radius; offset <= radius; offset++) {
        if (offset !== 0 && coordinateHash(tileX + stepX * offset, tileY + stepY * offset, seedHash) >= score) return false;
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
    // At least 15 of the 18 tiles beyond the deck must be water.
    let dryTiles = 0;

    for (let distance = 1; distance <= waterLength + 2; distance++) {
        if (!isWater(0, distance) || !isWater(1, distance)) return null;
    }

    for (let y = waterLength; y <= waterLength + 2; y++) {
        for (let x = -2; x <= 3; x++) {
            if (!isWater(x, y) && ++dryTiles > 3) return null;
        }
    }

    return { anchorX, anchorY, waterLength };
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
