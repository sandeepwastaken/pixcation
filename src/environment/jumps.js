const fishJumps = [];
const fishJumpGraphics = [];
let fishJumpRandom = null;
let nextFishJumpAt = 0;

function splashFishJump(scene, time, x, y) {
    idleRipple(scene, time, x, y, scene.children, 1.3);
    for (let index = 0; index < FISH_JUMP_DROPLETS; index++) {
        spawnParticle(scene, scene.children, time, x - 1 + index, y - 1, index - 1, -1, FISH_JUMP_DROPLET_LIFETIME, FISH_JUMP_DROPLET_COLOR, 1.3);
    }
}

function drawFishSilhouette(graphics, fish, centerX, centerY, headingX, headingY, color) {
    const halfLength = fish.length * 0.5, radius = fish.radius, head = halfLength - radius;
    const bound = Math.ceil(halfLength + radius + Math.abs(fish.amplitude) + 1);
    graphics.clear().fillStyle(color, 1);
    for (let y = -bound; y <= bound; y++) {
        for (let x = -bound; x <= bound; x++) {
            const localX = x + 0.5, localY = y + 0.5;
            const along = localX * headingX + localY * headingY;
            const spine = Phaser.Math.Clamp((halfLength - along) / fish.length, 0, 1);
            const across = localX * -headingY + localY * headingX - fish.amplitude * spine * spine * Math.sin(spine * 5.6 - fish.phase);
            const headOffset = along - head;
            const inside = headOffset * headOffset + across * across < radius * radius ||
                along < head && along > -halfLength && Math.abs(across) < radius * (along + halfLength) / (head + halfLength);
            if (inside) graphics.fillRect(centerX + x, centerY + y, 1, 1);
        }
    }
}

function pickJumpingFish() {
    const left = mainCamera.scrollX, top = mainCamera.scrollY;
    let total = 0;
    const candidates = [];
    for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;
        for (const fish of chunk.fish) {
            if (fish.jumping || fish.npcLured || fish === fishing?.targetFish || fish.state === 'lure' || fish.state === 'flee' || (fish.visibility ?? 1) < 1) continue;
            if (fish.x < left || fish.y < top || fish.x > left + mainCamera.width || fish.y > top + mainCamera.height) continue;
            const weight = (fish.size === 'large' || fish.size === 'giant' ? FISH_JUMP_BIG_WEIGHT : 1) * (fish.rumor ? FISH_JUMP_RUMOR_WEIGHT : 1);
            total += weight;
            candidates.push([fish, chunk, weight]);
        }
    }
    let roll = fishJumpRandom() * total;
    for (const candidate of candidates) {
        roll -= candidate[2];
        if (roll <= 0) return candidate;
    }
    return null;
}

function startFishJump(scene, time) {
    const picked = pickJumpingFish();
    if (!picked) return;
    const [fish, chunk] = picked;
    const distance = FISH_JUMP_DISTANCE + fish.length * 0.5;
    let heading = fish.heading;
    let toX = fish.x + Math.cos(heading) * distance, toY = fish.y + Math.sin(heading) * distance;
    if (!canFishSwim(chunk, fish, toX, toY)) {
        heading += Math.PI;
        toX = fish.x + Math.cos(heading) * distance;
        toY = fish.y + Math.sin(heading) * distance;
        if (!canFishSwim(chunk, fish, toX, toY)) return;
    }

    const graphics = fishJumpGraphics.pop() || scene.add.graphics();
    graphics.setVisible(true).setDepth(1.3);
    fish.jumping = true;
    const color = tintMapColor(FISHING_WATER_SHADOW_COLOR, getWaterTint(fish.x, fish.y));
    fishJumps.push({ fish, graphics, color, fromX: fish.x, fromY: fish.y, toX, toY, heading, start: time, height: FISH_JUMP_HEIGHT + fish.length * 0.4 });
    splashFishJump(scene, time, Math.round(fish.x), Math.round(fish.y));
}

function updateFishJumps(scene, time) {
    fishJumpRandom ||= createSeededRandom(Math.imul(WORLD_SEED + 1501, WORLD_HASH_MULTIPLIER));
    if (time >= nextFishJumpAt) {
        nextFishJumpAt = time + FISH_JUMP_MIN + fishJumpRandom() * FISH_JUMP_RANGE;
        startFishJump(scene, time);
    }

    for (let index = fishJumps.length - 1; index >= 0; index--) {
        const jump = fishJumps[index];
        const amount = Math.min(1, (time - jump.start) / FISH_JUMP_TIME);
        const x = jump.fromX + (jump.toX - jump.fromX) * amount;
        const y = jump.fromY + (jump.toY - jump.fromY) * amount - Math.sin(amount * Math.PI) * jump.height;
        const pitch = (amount - 0.5) * FISH_JUMP_TILT * 2;
        const side = Math.cos(jump.heading) < 0 ? -1 : 1;
        const tilt = jump.heading + pitch * side;
        drawFishSilhouette(jump.graphics, jump.fish, Math.round(x), Math.round(y), Math.cos(tilt), Math.sin(tilt), jump.color);
        if (amount < 1) continue;

        jump.fish.x = jump.toX;
        jump.fish.y = jump.toY;
        jump.fish.jumping = false;
        splashFishJump(scene, time, Math.round(jump.toX), Math.round(jump.toY));
        jump.graphics.clear().setVisible(false);
        fishJumpGraphics.push(jump.graphics);
        fishJumps[index] = fishJumps[fishJumps.length - 1];
        fishJumps.pop();
    }
}
