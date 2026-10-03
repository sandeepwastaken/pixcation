function spawnChunkFish(chunk) {
    const regions = labelFishRegions(chunk);

    for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
        const region = regions[regionIndex];

        if (region.length < FISH_MIN_REGION) continue;

        const count = Math.min(FISH_PER_CHUNK_MAX - chunk.fish.length, Math.max(1, Math.floor(region.length / FISH_WATER_PER_FISH)));

        spawnRegionFish(chunk, region, regionIndex + 1, count, chunk.pixelX, chunk.pixelY);
    }
}

function chooseFishSpecies(waterArea) {
    let totalWeight = 0;

    for (const species of FISH_SPECIES) {
        if (waterArea >= species.minWater) totalWeight += species.weight;
    }

    let roll = Math.random() * totalWeight;

    for (const species of FISH_SPECIES) {
        if (waterArea < species.minWater) continue;
        roll -= species.weight;
        if (roll <= 0) return species;
    }

    return FISH_SPECIES[0];
}

function createFish(species, giantScale) {
    const sizeDefinition = FISH_SIZE_CLASSES[species.size];
    const giant = species.size === 'giant';

    return {
        x: 0,
        y: 0,
        length: giant ? FISH_SIZE_CLASSES.large.length * giantScale : sizeDefinition.length,
        radius: giant ? FISH_SIZE_CLASSES.large.radius * giantScale : sizeDefinition.radius,
        heading: Math.random() * Math.PI * 2,
        topSpeed: 0,
        velocity: 0,
        phase: Math.random() * Math.PI * 2,
        amplitude: 0,
        thrusting: false,
        burstTimer: 0,
        idleTurn: (Math.random() - 0.5) * FISH_IDLE_TURN,
        state: 'idle',
        timer: Math.random() * 2000,
        targetX: 0,
        targetY: 0,
        region: 0,
        size: species.size,
        species
    };
}

function spawnRegionFish(chunk, region, label, count, originX, originY) {
    for (let index = 0; index < count; index++) {
        const species = chooseFishSpecies(region.length);
        const fish = createFish(species, 2 + Math.random() * 3);
        fish.region = label;

        for (let attempt = 0; attempt < 40; attempt++) {
            const pixel = fishRegionPixels[region.start + Math.floor(Math.random() * region.length)];
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
