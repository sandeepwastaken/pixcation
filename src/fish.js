const fishMigrations = [];
let fishRegionStack;
let fishRegionPixels;

function getChunkPixelIndex(chunk, x, y) {
    const localX = Math.floor(x) - chunk.pixelX;
    const localY = Math.floor(y) - chunk.pixelY;

    return localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE
        ? -1
        : localY * CHUNK_PIXEL_SIZE + localX;
}

function queueFishMigration(chunk, fish) {
    if (getChunkPixelIndex(chunk, fish.x, fish.y) !== -1) return;

    const targetChunk = getFishChunkAt(fish.x, fish.y);
    if (targetChunk && targetChunk !== chunk && loadedWaterChunks.has(targetChunk)) {
        fishMigrations.push(chunk, targetChunk, fish);
    }
}

function getFishDepth(chunk, x, y) {
    const index = getChunkPixelIndex(chunk, x, y);
    return index === -1 ? 0 : chunk.shoreDistances[index];
}

function getFishChunkAt(x, y) {
    return loadedChunks.get(getChunkKey(Math.floor(x / CHUNK_PIXEL_SIZE), Math.floor(y / CHUNK_PIXEL_SIZE)));
}

function getFishRegionAt(chunk, x, y) {
    const index = chunk?.fishRegions ? getChunkPixelIndex(chunk, x, y) : -1;
    return index === -1 ? 0 : chunk.fishRegions[index];
}

function canFishSwim(chunk, fish, x, y) {
    const ownIndex = getChunkPixelIndex(chunk, x, y);
    const targetChunk = ownIndex !== -1 ? chunk : getFishChunkAt(x, y);
    const index = ownIndex !== -1 ? ownIndex : targetChunk?.fishRegions ? getChunkPixelIndex(targetChunk, x, y) : -1;

    if (index === -1 || !targetChunk.fishRegions || targetChunk.shoreDistances[index] < FISH_MIN_DEPTH + fish.radius) {
        return false;
    }

    const targetRegion = targetChunk.fishRegions[index];

    return targetRegion > 0 && (targetChunk !== chunk || targetRegion === fish.region);
}

function labelFishRegions(chunk) {
    const size = CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE;
    const labels = new Uint16Array(size);
    const deep = pixel => !labels[pixel] && chunk.shoreDistances[pixel] >= FISH_MIN_DEPTH;
    const regions = [];
    let pixelCount = 0;

    fishRegionStack ||= new Int32Array(size);
    fishRegionPixels ||= new Uint32Array(size);

    for (let start = 0; start < size; start++) {
        if (!deep(start)) continue;

        const label = regions.length + 1;
        const regionStart = pixelCount;
        let top = 0;

        const visit = pixel => {
            labels[pixel] = label;
            fishRegionStack[top++] = pixel;
        };

        visit(start);

        while (top > 0) {
            const pixel = fishRegionStack[--top];
            const x = pixel % CHUNK_PIXEL_SIZE;

            fishRegionPixels[pixelCount++] = pixel;
            if (x > 0 && deep(pixel - 1)) visit(pixel - 1);
            if (x < CHUNK_PIXEL_SIZE - 1 && deep(pixel + 1)) visit(pixel + 1);
            if (pixel >= CHUNK_PIXEL_SIZE && deep(pixel - CHUNK_PIXEL_SIZE)) visit(pixel - CHUNK_PIXEL_SIZE);
            if (pixel < size - CHUNK_PIXEL_SIZE && deep(pixel + CHUNK_PIXEL_SIZE)) visit(pixel + CHUNK_PIXEL_SIZE);
        }

        regions.push({ start: regionStart, length: pixelCount - regionStart });
    }

    chunk.fishRegions = labels;
    return regions;
}

function isFishPathClear(chunk, fish, targetX, targetY) {
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 3);

    for (let step = 1; step <= steps; step++) {
        if (!canFishSwim(chunk, fish, fish.x + dx * step / steps, fish.y + dy * step / steps)) return false;
    }

    return true;
}

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

function chooseFishTarget(chunk, fish, awayX, awayY) {
    for (let attempt = 0; attempt < 8; attempt++) {
        const fleeing = awayX !== undefined;
        const angle = fleeing ? Math.atan2(awayY, awayX) + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2;
        const distance = fleeing ? 28 + Math.random() * 20 : 12 + Math.random() * 34;
        const targetX = fish.x + Math.cos(angle) * distance;
        const targetY = fish.y + Math.sin(angle) * distance;

        if (isFishPathClear(chunk, fish, targetX, targetY)) {
            fish.targetX = targetX;
            fish.targetY = targetY;
            return true;
        }
    }

    return false;
}

function setFishIdle(fish, timer) {
    fish.state = 'idle';
    fish.thrusting = false;
    fish.timer = timer;
}

function moveFishForward(chunk, fish, seconds) {
    const nextX = fish.x + Math.cos(fish.heading) * fish.velocity * seconds;
    const nextY = fish.y + Math.sin(fish.heading) * fish.velocity * seconds;

    if (!canFishSwim(chunk, fish, nextX, nextY)) return false;

    fish.x = nextX;
    fish.y = nextY;
    return true;
}

function turnFishToward(fish, heading, maxTurn) {
    const turn = Math.atan2(Math.sin(heading - fish.heading), Math.cos(heading - fish.heading));
    fish.heading += Phaser.Math.Clamp(turn, -maxTurn, maxTurn);
    return turn;
}

function startFishFlee(fish, burst) {
    fish.state = 'flee';
    fish.topSpeed = FISH_FLEE_SPEED;
    fish.thrusting = true;
    fish.burstTimer = burst;
}

function animateFishTail(fish, seconds, beat, sweep, response) {
    fish.phase = (fish.phase + Math.PI * 2 * beat * seconds) % (Math.PI * 2);
    fish.amplitude += (fish.length * sweep - fish.amplitude) * Math.min(1, seconds * response);
}

function scatterFishFromSplash(x, y) {
    const radius = 12;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fishing && fishing.targetFish === fish) continue;

            const awayX = fish.x - x;
            const awayY = fish.y - y;

            if (
                awayX * awayX + awayY * awayY > radius * radius ||
                !chooseFishTarget(chunk, fish, awayX, awayY)
            ) {
                continue;
            }

            startFishFlee(fish, 700);
        }
    }
}

function updateHookedFish(fish, seconds, delta) {
    const scene = mainCamera.scene;
    const spin = fishing.spin || (fishing.spin = {
        angle: Math.atan2(fish.y - fishing.toY, fish.x - fishing.toX),
        direction: Math.random() < 0.5 ? -1 : 1,
        centerX: fishing.toX,
        centerY: fishing.toY,
        splashTimer: 0
    });
    const progress = fishing.game ? fishing.game.progress : 0;
    const [tipX, tipY] = getRodTip();
    const pull = progress * HOOKED_REEL_PULL;
    const targetX = fishing.toX + (tipX - fishing.toX) * pull;
    const targetY = fishing.toY + (tipY - fishing.toY) * pull;
    const nextCenterX = spin.centerX + (targetX - spin.centerX) * Math.min(1, seconds * 2);
    const nextCenterY = spin.centerY + (targetY - spin.centerY) * Math.min(1, seconds * 2);

    if (isWaterPixel(scene, Math.round(nextCenterX), Math.round(nextCenterY))) {
        spin.centerX = nextCenterX;
        spin.centerY = nextCenterY;
    }

    if (Math.random() < seconds * HOOKED_THRASH_RATE) spin.direction *= -1;

    const radius = HOOKED_RADIUS_BASE + fish.length * HOOKED_RADIUS_PER_LENGTH;
    const speed = Phaser.Math.Clamp(HOOKED_SPIN_BASE - fish.length * HOOKED_SPIN_PER_LENGTH, HOOKED_SPIN_MIN, HOOKED_SPIN_BASE);

    spin.angle += spin.direction * speed * seconds;

    const nextX = spin.centerX + Math.cos(spin.angle) * radius;
    const nextY = spin.centerY + Math.sin(spin.angle) * radius * HOOKED_SQUASH;

    if (isWaterPixel(scene, Math.round(nextX), Math.round(nextY))) {
        fish.x = nextX;
        fish.y = nextY;
    }

    fish.heading = Math.atan2(
        Math.cos(spin.angle) * radius * HOOKED_SQUASH * spin.direction,
        -Math.sin(spin.angle) * radius * spin.direction
    );
    fish.thrusting = true;
    fish.velocity = speed * radius;
    animateFishTail(fish, seconds, HOOKED_BEAT, HOOKED_SWEEP, 8);

    spin.splashTimer -= delta;

    if (spin.splashTimer <= 0) {
        spin.splashTimer = HOOKED_SPLASH_MIN + Math.random() * HOOKED_SPLASH_RANGE;
        splash(scene, scene.time.now, Math.round(fish.x - Math.cos(fish.heading) * fish.length * 0.5), Math.round(fish.y - Math.sin(fish.heading) * fish.length * 0.5));
    }
}

function getHookedBobber() {
    const fish = fishing.targetFish;

    if (!fish || !fishing.spin) return null;

    hookedBobberPosition[0] = Math.round(fish.x + Math.cos(fish.heading) * fish.length * 0.5);
    hookedBobberPosition[1] = Math.round(fish.y + Math.sin(fish.heading) * fish.length * 0.5) + 1;
    return hookedBobberPosition;
}

function updateLuredFish(chunk, fish, delta) {
    if (!fishing || fishing.targetFish !== fish) {
        setFishIdle(fish, FISH_IDLE_MIN);
        return false;
    }

    const seconds = Math.min(delta, 50) / 1000;

    if (fishing.state === 'hooked' || fishing.state === 'minigame') {
        updateHookedFish(fish, seconds, delta);
        return true;
    }

    const dx = fishing.bobberX - fish.x;
    const dy = fishing.bobberY - fish.y;
    const stopDistance = fish.radius + 3;
    let targetHeading = Math.atan2(dy, dx);

    fish.lureTime = (fish.lureTime || 0) + delta;

    if (fishing.state === 'inspecting' || fishing.state === 'nibbleWait' || fishing.state === 'nibbleDip' || fishing.state === 'bite') {
        targetHeading += Math.sin(fish.lureTime / 180) * 0.32;
        fish.thrusting = false;
        fish.velocity *= Math.exp(-5 * seconds);
    } else {
        const pulsing = Math.floor(fish.lureTime / FISH_LURE_PULSE_TIME) % 2 === 0;

        fish.thrusting = pulsing;
        fish.velocity += pulsing ? FISH_ACCELERATION * 0.55 * seconds : 0;
        fish.velocity = Math.min(FISH_LURE_SPEED * getBaitLure(), fish.velocity);
        fish.velocity *= Math.exp(-(pulsing ? FISH_DRAG : FISH_COAST_DRAG * 1.8) * seconds);
    }

    turnFishToward(fish, targetHeading, FISH_LURE_TURN * seconds);

    if (dx * dx + dy * dy > stopDistance * stopDistance && fish.velocity > 0.05) {
        moveFishForward(chunk, fish, seconds);
    }

    animateFishTail(
        fish, seconds,
        fish.thrusting ? FISH_BEAT_THRUST + fish.velocity * 0.12 : FISH_BEAT_IDLE,
        fish.thrusting ? FISH_SWEEP_THRUST : FISH_SWEEP_IDLE,
        6
    );
    return true;
}

function migrateFishToChunk(chunk, targetChunk, fish) {
    const index = chunk.fish.indexOf(fish);
    const region = getFishRegionAt(targetChunk, fish.x, fish.y);

    if (index === -1 || !region) return false;

    chunk.fish.splice(index, 1);
    fish.region = region;
    targetChunk.fish.push(fish);

    if (fishing && fishing.targetFish === fish) fishing.targetChunk = targetChunk;
    return true;
}

function updateFish(delta) {
    const seconds = Math.min(delta, 50) / 1000;
    const thrustDrag = Math.exp(-FISH_DRAG * seconds);
    const coastDrag = Math.exp(-FISH_COAST_DRAG * seconds);
    const playerX = character.x + CHARACTER_SIZE / 2;
    const playerY = character.y + CHARACTER_SIZE - 2;
    const running = characterPace > 1 && characterMoving;
    fishMigrations.length = 0;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish.state === 'lure' && updateLuredFish(chunk, fish, delta)) {
                queueFishMigration(chunk, fish);
                continue;
            }

            const awayX = fish.x - playerX;
            const awayY = fish.y - playerY;

            if (running && fish.state !== 'flee' && awayX * awayX + awayY * awayY < FISH_SCARE_DISTANCE_SQUARED && chooseFishTarget(chunk, fish, awayX, awayY)) {
                startFishFlee(fish, 900);
            }

            if (fish.state === 'idle') {
                fish.timer -= delta;
                fish.heading += fish.idleTurn * seconds;

                if (fish.timer <= 0 && !chooseFishTarget(chunk, fish)) {
                    fish.timer = 500;
                } else if (fish.timer <= 0) {
                    fish.state = 'swim';
                    fish.topSpeed = FISH_SWIM_SPEED * (0.7 + Math.random() * 0.6);
                    fish.thrusting = true;
                    fish.burstTimer = FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE;
                }
            } else {
                fish.burstTimer -= delta;

                if (fish.burstTimer <= 0 && fish.state === 'swim') {
                    fish.thrusting = !fish.thrusting;
                    fish.burstTimer = fish.thrusting ? FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE : FISH_COAST_MIN + Math.random() * FISH_COAST_RANGE;
                } else if (fish.burstTimer <= 0) {
                    fish.state = 'swim';
                    fish.topSpeed = FISH_SWIM_SPEED;
                }

                const dx = fish.targetX - fish.x;
                const dy = fish.targetY - fish.y;
                if (dx * dx + dy * dy < 4) {
                    setFishIdle(fish, FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE);
                    fish.idleTurn = (Math.random() - 0.5) * FISH_IDLE_TURN;
                } else {
                    const maxTurn = (fish.state === 'flee' ? FISH_FLEE_TURN : FISH_TURN) * seconds *
                        (0.4 + Math.min(1, fish.velocity / FISH_SWIM_SPEED) * 0.6);
                    const turn = turnFishToward(fish, Math.atan2(dy, dx), maxTurn);

                    if (fish.thrusting && Math.cos(turn) > 0) {
                        const acceleration = fish.state === 'flee' ? FISH_FLEE_ACCELERATION : FISH_ACCELERATION;
                        fish.velocity = Math.min(fish.topSpeed, fish.velocity + acceleration * seconds);
                    }
                }
            }

            fish.velocity *= fish.thrusting ? thrustDrag : coastDrag;

            const beat = fish.thrusting
                ? FISH_BEAT_THRUST + fish.velocity * 0.12
                : fish.state === 'idle' ? FISH_BEAT_IDLE : FISH_BEAT_COAST;
            const sweep = fish.thrusting
                ? (fish.state === 'flee' ? FISH_SWEEP_FLEE : FISH_SWEEP_THRUST)
                : fish.state === 'idle' ? FISH_SWEEP_IDLE : FISH_SWEEP_COAST;

            animateFishTail(fish, seconds, beat, sweep, 6);

            if (!moveFishForward(chunk, fish, seconds)) {
                fish.velocity = 0;
                setFishIdle(fish, FISH_IDLE_MIN);
            }

            queueFishMigration(chunk, fish);
        }
    }

    for (let index = 0; index < fishMigrations.length; index += 3) {
        migrateFishToChunk(fishMigrations[index], fishMigrations[index + 1], fishMigrations[index + 2]);
    }
}
