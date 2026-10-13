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

function drawFishSilhouette(graphics, fish, centerX, centerY, headingX, headingY, color, bend = 0, waterline = Infinity, opacity = 1) {
    const halfLength = fish.length * 0.5, radius = fish.radius, head = halfLength - radius;
    const bound = Math.ceil(halfLength + radius + Math.abs(fish.amplitude) + Math.abs(bend) + 1);
    graphics.clear().fillStyle(color, opacity);
    for (let y = -bound; y <= bound; y++) {
        for (let x = -bound; x <= bound; x++) {
            const localX = x + 0.5, localY = y + 0.5;
            const along = localX * headingX + localY * headingY;
            if (along <= -halfLength || along >= halfLength) continue;
            const spine = Phaser.Math.Clamp((halfLength - along) / fish.length, 0, 1);
            const across = localX * -headingY + localY * headingX + bend * Math.sin(spine * Math.PI) * headingX - fish.amplitude * spine * spine * Math.sin(spine * 5.6 - fish.phase);
            const headOffset = along - head;
            const inside = headOffset * headOffset + across * across < radius * radius ||
                along < head && along > -halfLength && Math.abs(across) < radius * (along + halfLength) / (head + halfLength);
            if (inside && centerY + y < waterline) graphics.fillRect(centerX + x, centerY + y, 1, 1);
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
            const weight = (fish.size === 'giant' ? 0.25 : fish.size === 'large' ? 1.5 : 1) * (fish.rumor ? FISH_JUMP_RUMOR_WEIGHT : 1);
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
    const distance = FISH_JUMP_DISTANCE + fish.length * 0.8;
    let heading = fish.heading;
    let toX = fish.x + Math.cos(heading) * distance, toY = fish.y + Math.sin(heading) * distance;
    if (!canFishSwim(chunk, fish, toX, toY)) {
        heading += Math.PI;
        toX = fish.x + Math.cos(heading) * distance;
        toY = fish.y + Math.sin(heading) * distance;
        if (!canFishSwim(chunk, fish, toX, toY)) return;
    }

    if (![0.25, 0.5, 0.75].every(amount => canFishSwim(chunk, fish, fish.x + (toX - fish.x) * amount, fish.y + (toY - fish.y) * amount))) return;
    const graphics = fishJumpGraphics.pop() || scene.add.graphics();
    graphics.setVisible(true).setDepth(1.3);
    fish.jumping = true;
    const color = tintMapColor(FISHING_WATER_SHADOW_COLOR, getWaterTint(fish.x, fish.y));
    fishJumps.push({fish, graphics, color, fromX: fish.x, fromY: fish.y, toX, toY, heading, start: time, height: FISH_JUMP_HEIGHT + Math.min(9, fish.length * 0.2), anticipation: 140 + Math.min(140, fish.length * 4), airborne: FISH_JUMP_TIME + Math.min(300, fish.length * 6), settling: 220 + Math.min(150, fish.length * 3), launched: false, landed: false});
    idleRipple(scene, time, Math.round(fish.x), Math.round(fish.y), scene.children, 1.3);
}

function getFishJumpPose(jump, time) {
    const elapsed = Math.max(0, time - jump.start), progress = Math.max(0, Math.min(1, (elapsed - jump.anticipation) / jump.airborne)), surfaceX = jump.fromX + (jump.toX - jump.fromX) * progress, surfaceY = jump.fromY + (jump.toY - jump.fromY) * progress;
    if (elapsed < jump.anticipation) {const preparation = elapsed / jump.anticipation; return {phase: 'anticipation', x: jump.fromX, y: jump.fromY + Math.sin(preparation * Math.PI) * 2, heading: jump.heading, bend: -Math.sin(preparation * Math.PI) * Math.min(3, jump.fish.length * 0.12), waterline: Infinity, opacity: 1 - Math.sin(preparation * Math.PI) * 0.35};}
    if (elapsed < jump.anticipation + jump.airborne) return {phase: 'airborne', x: surfaceX, y: surfaceY - 4 * progress * (1 - progress) * jump.height, heading: Math.atan2(jump.toY - jump.fromY - 4 * (1 - 2 * progress) * jump.height, jump.toX - jump.fromX), bend: Math.sin(progress * Math.PI) * Math.min(6, jump.fish.length * 0.18), waterline: surfaceY, opacity: 1};
    const settling = Math.min(1, (elapsed - jump.anticipation - jump.airborne) / jump.settling); return {phase: settling < 1 ? 'settling' : 'done', x: jump.toX, y: jump.toY + Math.sin(settling * Math.PI) * Math.min(4, jump.fish.radius), heading: jump.heading, bend: -Math.sin(settling * Math.PI) * Math.min(2, jump.fish.length * 0.08), waterline: Infinity, opacity: 0.35 + settling * 0.65};
}
function updateFishJumps(scene, time) {
    fishJumpRandom ||= createSeededRandom(Math.imul(WORLD_SEED + 1501, WORLD_HASH_MULTIPLIER));
    if (time >= nextFishJumpAt) {
        nextFishJumpAt = time + FISH_JUMP_MIN + fishJumpRandom() * FISH_JUMP_RANGE;
        startFishJump(scene, time);
    }

    for (let index = fishJumps.length - 1; index >= 0; index--) {
        const jump = fishJumps[index];
        const pose = getFishJumpPose(jump, time);
        if (!jump.launched && pose.phase !== 'anticipation') {jump.launched = true; splashFishJump(scene, time, Math.round(jump.fromX), Math.round(jump.fromY));}
        if (!jump.landed && (pose.phase === 'settling' || pose.phase === 'done')) {jump.landed = true; splashFishJump(scene, time, Math.round(jump.toX), Math.round(jump.toY));}
        drawFishSilhouette(jump.graphics, jump.fish, Math.round(pose.x), Math.round(pose.y), Math.cos(pose.heading), Math.sin(pose.heading), jump.color, pose.bend, Math.round(pose.waterline), pose.opacity);
        if (pose.phase !== 'done') continue;

        jump.fish.x = jump.toX;
        jump.fish.y = jump.toY;
        jump.fish.jumping = false;
        jump.graphics.clear().setVisible(false);
        fishJumpGraphics.push(jump.graphics);
        fishJumps[index] = fishJumps[fishJumps.length - 1];
        fishJumps.pop();
    }
}
