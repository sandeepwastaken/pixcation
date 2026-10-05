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
        if (index % 3 === 0) spawnParticle(scene, shadowLayer, time, centerX + Math.round(directionX * 2), centerY - 1, Math.sign(directionX), -1, 260, 0xd2edf1);

        spawnParticle(
            scene, shadowLayer, time, centerX, centerY, 0, 0, SPLASH_LIFETIME,
            index % 2 ? 0x87bed8 : 0x78afd3, 0, directionX, directionY, true
        );
    }
}

function groundLandingPuff(scene, time, x, y) {
    for (let index = 0; index < 3; index++) {
        spawnParticle(scene, shadowLayer, time, x - 1 + index, y, index - 1, -1, 220, DUST_COLORS[index]);
    }
}

function nibbleRipple(scene, time, x, y) {
    for (let index = 0; index < 4; index++) {
        const horizontal = index < 2;
        const side = index % 2 === 0 ? -1 : 1;

        spawnParticle(
            scene, shadowLayer, time,
            x + (horizontal ? side * 2 : 0), y + (horizontal ? 0 : side),
            horizontal ? side : 0, 0, 180, index % 2 ? 0x78afd3 : 0x87bed8
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
