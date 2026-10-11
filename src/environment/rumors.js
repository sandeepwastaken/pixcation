const rumorCache = new Map();
const heardRumors = new Map();
const RUMOR_SPECIES = FISH_SPECIES.filter(species => species.size === 'large' || species.size === 'giant');
const RUMOR_DIRECTIONS = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];

function getRumorHotspot(cellX, cellY, day) {
    const key = `${getTileId(cellX, cellY)}:${day}`;
    const cached = rumorCache.get(key);
    if (cached !== undefined) return cached;

    const salt = Math.imul(WORLD_SEED + 1601 + day * 7919, WORLD_HASH_MULTIPLIER);
    let hotspot = null;
    for (let attempt = 0; attempt < RUMOR_ATTEMPTS && !hotspot; attempt++) {
        const chunkX = cellX * RUMOR_CELL_CHUNKS + Math.min(RUMOR_CELL_CHUNKS - 1, Math.floor(coordinateHash(cellX * 31 + attempt, cellY, salt) * RUMOR_CELL_CHUNKS));
        const chunkY = cellY * RUMOR_CELL_CHUNKS + Math.min(RUMOR_CELL_CHUNKS - 1, Math.floor(coordinateHash(cellX, cellY * 31 + attempt, salt) * RUMOR_CELL_CHUNKS));
        let waterTiles = 0;
        for (let y = 0; y < CHUNK_SIZE; y += 2) {
            for (let x = 0; x < CHUNK_SIZE; x += 2) {
                if (getTerrainType(chunkX * CHUNK_SIZE + x, chunkY * CHUNK_SIZE + y) === 'water') waterTiles += 4;
            }
        }
        const area = waterTiles * TILE_SIZE * TILE_SIZE;
        const options = RUMOR_SPECIES.filter(species => area >= species.minWater);
        if (!options.length) continue;
        hotspot = { key, day, chunkX, chunkY, species: options[Math.min(options.length - 1, Math.floor(coordinateHash(chunkX, chunkY, salt) * options.length))] };
    }
    return cacheWorldValue(rumorCache, key, hotspot);
}

function getChunkRumor(chunkX, chunkY) {
    const day = getWorldClock().day;
    const hotspot = getRumorHotspot(Math.floor(chunkX / RUMOR_CELL_CHUNKS), Math.floor(chunkY / RUMOR_CELL_CHUNKS), day);
    return hotspot && Math.abs(hotspot.chunkX - chunkX) <= 1 && Math.abs(hotspot.chunkY - chunkY) <= 1 ? hotspot : null;
}

function findNearestRumor(tileX, tileY) {
    const day = getWorldClock().day;
    const chunkX = Math.floor(tileX / CHUNK_SIZE), chunkY = Math.floor(tileY / CHUNK_SIZE);
    const cellX = Math.floor(chunkX / RUMOR_CELL_CHUNKS), cellY = Math.floor(chunkY / RUMOR_CELL_CHUNKS);
    let nearest = null;
    let nearestDistance = Infinity;
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            const hotspot = getRumorHotspot(cellX + offsetX, cellY + offsetY, day);
            if (!hotspot) continue;
            const x = (hotspot.chunkX + 0.5) * CHUNK_SIZE - tileX, y = (hotspot.chunkY + 0.5) * CHUNK_SIZE - tileY;
            const distance = Math.hypot(x, y);
            if (distance < nearestDistance) [nearest, nearestDistance] = [{ hotspot, x, y, distance }, distance];
        }
    }
    return nearest;
}

function describeRumor(rumor, line) {
    const direction = RUMOR_DIRECTIONS[(Math.round(Math.atan2(rumor.y, rumor.x) / (Math.PI / 4)) + 8) % 8];
    const distance = rumor.distance < RUMOR_NEAR_TILES ? 'just' : rumor.distance < RUMOR_FAR_TILES ? 'a short walk' : 'a long walk';
    return line.replaceAll('{species}', rumor.hotspot.species.name).replaceAll('{where}', `${distance} to the ${direction}`);
}

function hearRumor(rumor) {
    heardRumors.set(rumor.hotspot.key, rumor.hotspot);
    mapDirty = true;
}
