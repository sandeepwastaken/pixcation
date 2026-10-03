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
