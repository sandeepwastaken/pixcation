const fishJumps = [];
const fishJumpSprites = [];
let fishJumpRandom = null;
let nextFishJumpAt = 0;

function splashFishJump(scene, time, x, y) {
    idleRipple(scene, time, x, y);
    for (let index = 0; index < FISH_JUMP_DROPLETS; index++) {
        spawnParticle(scene, shadowLayer, time, x - 1 + index, y - 1, index - 1, -1, FISH_JUMP_DROPLET_LIFETIME, FISH_JUMP_DROPLET_COLOR);
    }
}

function pickJumpingFish() {
    const left = mainCamera.scrollX, top = mainCamera.scrollY;
    let total = 0;
    const candidates = [];
    for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;
        for (const fish of chunk.fish) {
            if (fish.jumping || fish.npcLured || fish === fishing?.targetFish || fish.state === 'lure' || fish.state === 'flee') continue;
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

    const sprite = fishJumpSprites.pop() || scene.add.image(0, 0, 'fishing-fish').setTint(FISH_JUMP_TINT);
    worldObjectLayer.add(sprite);
    sprite.setVisible(true).setFlipX(Math.cos(heading) < 0).setDepth(Math.max(fish.y, toY) + FISH_JUMP_DEPTH);
    fish.jumping = true;
    fishJumps.push({ fish, sprite, fromX: fish.x, fromY: fish.y, toX, toY, start: time, height: FISH_JUMP_HEIGHT + fish.length * 0.4, side: Math.cos(heading) < 0 ? -1 : 1 });
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
        jump.sprite.setPosition(Math.round(x), Math.round(y)).setRotation((amount < 0.35 ? -FISH_JUMP_TILT : amount > 0.65 ? FISH_JUMP_TILT : 0) * jump.side);
        if (amount < 1) continue;

        jump.fish.x = jump.toX;
        jump.fish.y = jump.toY;
        jump.fish.jumping = false;
        splashFishJump(scene, time, Math.round(jump.toX), Math.round(jump.toY));
        jump.sprite.setVisible(false);
        fishJumpSprites.push(jump.sprite);
        fishJumps[index] = fishJumps[fishJumps.length - 1];
        fishJumps.pop();
    }
}
