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

function updateIdleFish(chunk, fish, seconds, delta) {
    fish.timer -= delta;
    fish.heading += fish.idleTurn * seconds;

    if (fish.timer <= 0) {
        if (!chooseFishTarget(chunk, fish)) {
            fish.timer = 500;
        } else {
            fish.state = 'swim';
            fish.topSpeed = FISH_SWIM_SPEED * (0.7 + Math.random() * 0.6);
            fish.thrusting = true;
            fish.burstTimer = FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE;
        }
    }
}

function updateSwimmingFish(chunk, fish, seconds, delta) {
    fish.burstTimer -= delta;

    if (fish.burstTimer <= 0) {
        if (fish.state === 'swim') {
            fish.thrusting = !fish.thrusting;
            fish.burstTimer = fish.thrusting ? FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE : FISH_COAST_MIN + Math.random() * FISH_COAST_RANGE;
        } else {
            fish.state = 'swim';
            fish.topSpeed = FISH_SWIM_SPEED;
        }
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

        if (fish.thrusting && Math.abs(turn) <= Math.PI / 2) {
            const acceleration = fish.state === 'flee' ? FISH_FLEE_ACCELERATION : FISH_ACCELERATION;
            fish.velocity = Math.min(fish.topSpeed, fish.velocity + acceleration * seconds);
        }
    }
}

function updateFish(delta) {
    fishMigrations.length = 0;
    if (loadedWaterChunks.size === 0) return;
    const seconds = Math.min(delta, 50) / 1000;
    const thrustDrag = Math.exp(-FISH_DRAG * seconds);
    const coastDrag = Math.exp(-FISH_COAST_DRAG * seconds);
    const playerX = character.x + CHARACTER_SIZE / 2;
    const playerY = character.y + CHARACTER_SIZE - 2;
    const running = characterPace > 1 && characterMoving;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish.state === 'lure' && updateLuredFish(chunk, fish, delta)) {
                queueFishMigration(chunk, fish);
                continue;
            }

            if (running && fish.state !== 'flee') {
                const awayX = fish.x - playerX;
                const awayY = fish.y - playerY;

                if (awayX * awayX + awayY * awayY < FISH_SCARE_DISTANCE_SQUARED && chooseFishTarget(chunk, fish, awayX, awayY)) {
                    startFishFlee(fish, 900);
                }
            }

            if (fish.state === 'idle') {
                updateIdleFish(chunk, fish, seconds, delta);
            } else {
                updateSwimmingFish(chunk, fish, seconds, delta);
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
