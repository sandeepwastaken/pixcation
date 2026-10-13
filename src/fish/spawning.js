const fishSpawnPools = new Map();
const fishSpawnThresholds = [...new Set(FISH_SPECIES.map(species => species.minWater))].sort((a, b) => b - a);
let fishSpawnRandom = null;
function updateFishSurface(chunk, fish, delta) {
    if (fish.jumping || fish.npcLured || fish.state === 'lure' || fish === fishing?.targetFish) { fish.visibility = 1; fish.surfacePhase = 'visible'; fish.surfaceTimer = fish.surfaceDuration || 30000; return false; }
    fish.surfacePhase ||= 'visible'; fish.surfaceTimer ??= 20000 + Math.random() * 40000; fish.visibility ??= 1; fish.surfaceTimer -= Math.min(delta, 50);
    if (fish.surfacePhase === 'visible' && fish.surfaceTimer <= 0) { fish.surfacePhase = 'sinking'; fish.surfaceTimer = 1400; }
    else if (fish.surfacePhase === 'sinking') { fish.visibility = Math.max(0, fish.surfaceTimer / 1400); if (fish.surfaceTimer <= 0) { fish.surfacePhase = 'submerged'; fish.surfaceTimer = 4000 + Math.random() * 8000; } }
    else if (fish.surfacePhase === 'submerged' && fish.surfaceTimer <= 0) { if (chooseFishTarget(chunk, fish)) { fish.x = fish.targetX; fish.y = fish.targetY; } fish.surfacePhase = 'rising'; fish.surfaceTimer = 1400; setFishIdle(fish, 600); }
    else if (fish.surfacePhase === 'rising') { fish.visibility = Math.min(1, Math.max(0, 1 - fish.surfaceTimer / 1400)); if (fish.surfaceTimer <= 0) { fish.surfacePhase = 'visible'; fish.surfaceTimer = fish.surfaceDuration || 30000; } }
    return fish.surfacePhase === 'submerged';
}

function fishRandom() {
    return fishSpawnRandom ? fishSpawnRandom() : Math.random();
}

function spawnChunkFish(chunk) {
    fishSpawnRandom = createSeededRandom(coordinateHash(chunk.pixelX, chunk.pixelY, Math.imul(WORLD_SEED + 91, WORLD_HASH_MULTIPLIER)) * 4294967295);
    const regions = labelFishRegions(chunk);

    for (let regionIndex = 0; regionIndex < regions.length && chunk.fish.length < FISH_PER_CHUNK_MAX; regionIndex++) {
        const region = regions[regionIndex];

        if (region.length < FISH_MIN_REGION) continue;

        const richness = 0.85 + coordinateHash(Math.floor(chunk.pixelX / TILE_SIZE), Math.floor(chunk.pixelY / TILE_SIZE), 1789 + regionIndex) * 0.9, desired = Math.max(2, Math.floor(region.length / FISH_WATER_PER_FISH * richness)), existing = chunk.fish.filter(fish => fish.region === regionIndex + 1).length, count = Math.min(FISH_PER_CHUNK_MAX - chunk.fish.length, Math.max(0, desired - existing));

        spawnRegionFish(chunk, region, regionIndex + 1, count, chunk.pixelX, chunk.pixelY);
    }
    fishSpawnRandom = null;
}

function getFishSpawnPool(waterArea) {
    let threshold;
    for (const minWater of fishSpawnThresholds) if (waterArea >= minWater) { threshold = minWater; break; }
    const cached = fishSpawnPools.get(threshold);
    if (cached) return cached;

    const species = FISH_SPECIES.filter(species => waterArea >= species.minWater);
    const pool = { species, totalWeight: 0 };
    for (const fish of species) pool.totalWeight += fish.weight;
    fishSpawnPools.set(threshold, pool);
    return pool;
}

function chooseFishSpecies(waterArea, pool = getFishSpawnPool(waterArea)) {
    const { species: candidates, totalWeight } = pool;
    let roll = fishRandom() * totalWeight;

    for (const species of candidates) {
        roll -= species.weight;
        if (roll <= 0) return species;
    }

    return FISH_SPECIES[0];
}

function createFish(species, giantScale) {
    const giant = species.size === 'giant';
    const scale = giant ? giantScale : 1;
    const sizeDefinition = FISH_SIZE_CLASSES[giant ? 'large' : species.size];

    return {
        x: 0,
        y: 0,
        length: sizeDefinition.length * scale,
        radius: sizeDefinition.radius * scale,
        heading: fishRandom() * Math.PI * 2,
        topSpeed: 0,
        velocity: 0,
        phase: fishRandom() * Math.PI * 2,
        amplitude: 0,
        thrusting: false,
        burstTimer: 0,
        idleTurn: (fishRandom() - 0.5) * FISH_IDLE_TURN,
        state: 'idle',
        timer: fishRandom() * 2000,
        surfacePhase: 'rising', surfaceTimer: 1400, visibility: 0, surfaceDuration: 20000 + fishRandom() * 40000,
        targetX: 0,
        targetY: 0,
        region: 0,
        size: species.size,
        species
    };
}

function getRumorSpawnChance(chunk, rumor) {
    if (!rumor) return 0;
    if (rumor.species.size !== 'giant') return RUMOR_SPAWN_CHANCE;
    return chunk.fish.some(fish => fish.size === 'giant') ? 0 : RUMOR_GIANT_SPAWN_CHANCE;
}
function spawnRegionFish(chunk, region, label, count, originX, originY) {
    const pool = getFishSpawnPool(region.length);
    const rumor = getChunkRumor(Math.floor(originX / CHUNK_PIXEL_SIZE), Math.floor(originY / CHUNK_PIXEL_SIZE));
    for (let index = 0; index < count; index++) {
        const rumored = rumor && region.length >= rumor.species.minWater && fishRandom() < getRumorSpawnChance(chunk, rumor);
        const species = rumored ? rumor.species : chooseFishSpecies(region.length, pool);
        const fish = createFish(species, 2 + fishRandom() * 3);
        fish.rumor = rumored;
        fish.region = label;

        for (let attempt = 0; attempt < 40; attempt++) {
            const pixel = fishRegionPixels[region.start + Math.floor(fishRandom() * region.length)];
            const x = originX + pixel % CHUNK_PIXEL_SIZE + 0.5;
            const y = originY + Math.floor(pixel / CHUNK_PIXEL_SIZE) + 0.5;

            if (canFishSwim(chunk, fish, x, y)) {
                fish.x = x;
                fish.y = y;
                chunk.fish.push(fish);
                break;
            }
        }
    }
}

function spawnSturgeonAtCursor(scene) {
    const pointer = scene.input.activePointer;
    pointer.updateWorldPoint(mainCamera);

    const x = pointer.worldX;
    const y = pointer.worldY;
    const chunk = getFishChunkAt(x, y);
    const region = getFishRegionAt(chunk, x, y);

    if (!region) {
        showItemLabel(scene, 'No fish water there');
        return;
    }

    const species = FISH_SPECIES_BY_ID.get('sturgeon');

    for (let scale = 5; scale >= 1; scale -= 0.5) {
        const fish = createFish(species, scale);
        fish.region = region;

        if (canFishSwim(chunk, fish, x, y)) {
            fish.x = x;
            fish.y = y;
            chunk.fish.push(fish);
            showItemLabel(scene, 'Spawned a Sturgeon');
            return;
        }
    }

    showItemLabel(scene, 'Too shallow for a Sturgeon');
}
