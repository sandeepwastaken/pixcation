const splashDirections = Array.from({ length: SPLASH_PARTICLES }, (_, index) => {
    const angle = index / SPLASH_PARTICLES * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
});
function splash(scene, time, x, y) {
    scatterFishFromSplash(x, y);
    const centerX = Math.round(x);
    const centerY = Math.round(y);

    for (let index = 0; index < SPLASH_PARTICLES; index++) {
        const [directionX, directionY] = splashDirections[index];
        if (index % 3 === 0) spawnParticle(scene, shadowLayer, time, centerX + Math.round(directionX * 2), centerY - 1, Math.sign(directionX), -1, 260, 0xbce6eb);

        spawnParticle(
            scene, shadowLayer, time, centerX, centerY, 0, 0, SPLASH_LIFETIME,
            index % 2 ? 0x7bbbd9 : 0x6aaad6, 0, directionX, directionY, true
        );
    }
}

function catchBurst(scene, time, x, y) {
    splash(scene, time, x, y);
    for (let index = 0; index < CATCH_SPARKLES; index++) {
        const offset = index - CATCH_SPARKLES / 2;
        spawnParticle(scene, worldObjectLayer, time, Math.round(x) + offset, Math.round(y) - 2 - (index % 2) * 2, Math.sign(offset + 0.5), -2, CATCH_SPARKLE_LIFETIME, CHEST_SPARKLE_COLORS[index % CHEST_SPARKLE_COLORS.length], Math.max(character.depth + 0.2, y));
    }
}

function groundLandingPuff(scene, time, x, y) {
    for (let index = 0; index < 3; index++) {
        spawnParticle(scene, shadowLayer, time, x - 1 + index, y, index - 1, -1, 220, DUST_COLORS[index]);
    }
}

let nextFishRiseAt = 0;

function spawnFishRise(scene, time) {
    if (time < nextFishRiseAt) return;
    nextFishRiseAt = time + FISH_RISE_MIN + Math.random() * FISH_RISE_RANGE;
    const left = mainCamera.scrollX, top = mainCamera.scrollY;
    const candidates = [];
    for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;
        for (const fish of chunk.fish) {
            if (fish.state !== 'flee' && fish.x > left && fish.x < left + mainCamera.width && fish.y > top && fish.y < top + mainCamera.height) candidates.push(fish);
        }
    }
    const fish = candidates[Math.floor(Math.random() * candidates.length)];
    if (fish && fish !== fishing?.targetFish) nibbleRipple(scene, time, Math.round(fish.x), Math.round(fish.y));
}

function nibbleRipple(scene, time, x, y) {
    for (let index = 0; index < 4; index++) {
        const horizontal = index < 2;
        const side = index % 2 === 0 ? -1 : 1;

        spawnParticle(
            scene, shadowLayer, time,
            x + (horizontal ? side * 2 : 0), y + (horizontal ? 0 : side),
            horizontal ? side : 0, 0, 180, index % 2 ? 0x6aaad6 : 0x7bbbd9
        );
    }
}

function spawnLineSnap(scene, time, rope) {
    if (!rope || !rope.points.length) return;

    const points = rope.points;
    const lastIndex = Math.max(1, points.length - 1);
    const stride = Math.max(1, Math.floor(points.length / 9));
    const palette = fishing?.rod?.linePalette, minimumDepth = character.depth + 0.2;

    for (let index = stride; index < points.length; index += stride) {
        const point = points[index];
        const amount = index / lastIndex;
        const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));

        spawnParticle(
            scene, worldObjectLayer, time, Math.round(point.x), Math.round(point.y),
            index % 2 ? -1 : 1, 1, 300, color, Math.max(minimumDepth, point.y)
        );
    }
}
