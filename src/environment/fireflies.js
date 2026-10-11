const fireflies = [];
let fireflyGlow = null;

function getNightLevel(clock) {
    const light = blendBiomeStops(SKY_LIGHT_STOPS, clock.hour);
    return Phaser.Math.Clamp((1 - (light[0] + light[1] + light[2]) / 3) / FIREFLY_DARK_LEVEL, 0, 1) * (1 - getRainIntensity(clock));
}

function createFireflies(scene) {
    fireflyGlow = scene.add.graphics().setDepth(SKY_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
}

const isNearFireflyWater = (tileX, tileY) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([stepX, stepY]) => [1, FIREFLY_WATER_TILES].some(reach => getTerrainType(tileX + stepX * reach, tileY + stepY * reach) === 'water'));

function placeFirefly(fly, time) {
    const x = mainCamera.scrollX - FIREFLY_MARGIN + Math.random() * (mainCamera.width + FIREFLY_MARGIN * 2);
    const y = mainCamera.scrollY - FIREFLY_MARGIN + Math.random() * (mainCamera.height + FIREFLY_MARGIN * 2);
    const grassy = getTerrainType(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)) === 'grass' && isNearFireflyWater(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));
    Object.assign(fly, { x, y, grassy, born: time, life: FIREFLY_LIFE_MIN + Math.random() * FIREFLY_LIFE_RANGE, heading: Math.random() * Math.PI * 2, height: FIREFLY_MIN_HEIGHT + Math.random() * FIREFLY_HEIGHT_RANGE, phase: Math.random() * 1000 });
}

function updateFireflies(time, delta) {
    if (!fireflyGlow) return;
    fireflyGlow.clear();
    const night = getNightLevel(getWorldClock());
    if (night <= 0) return;
    const step = Math.min(delta, 50) / 1000;
    const centerX = mainCamera.scrollX + mainCamera.width / 2, centerY = mainCamera.scrollY + mainCamera.height / 2;
    while (fireflies.length < FIREFLY_COUNT) fireflies.push({ born: 0, life: 0, grassy: false });
    for (const fly of fireflies) {
        const age = time - fly.born;
        if (age > fly.life || !fly.grassy) { placeFirefly(fly, time); continue; }
        fly.heading += Math.sin(time * FIREFLY_TURN_RATE + fly.phase) * FIREFLY_TURN * step;
        fly.x += Math.cos(fly.heading) * FIREFLY_SPEED * step;
        fly.y += Math.sin(fly.heading) * FIREFLY_SPEED * step;
        const height = fly.height + Math.sin(time * FIREFLY_BOB_RATE + fly.phase * 3) * FIREFLY_BOB;
        const lift = height / FIREFLY_CAMERA_HEIGHT;
        const screenX = Math.round(fly.x + (fly.x - centerX) * lift);
        const screenY = Math.round(fly.y + (fly.y - centerY) * lift - height);
        const pulse = Math.pow(Math.max(0, Math.sin(time * FIREFLY_PULSE_RATE + fly.phase)), 4);
        const glow = night * Math.min(1, age / FIREFLY_FADE, (fly.life - age) / FIREFLY_FADE) * (FIREFLY_BASE_GLOW + (1 - FIREFLY_BASE_GLOW) * pulse);
        const size = height > FIREFLY_NEAR_HEIGHT ? 2 : 1, groundX = Math.round(fly.x), groundY = Math.round(fly.y);
        fireflyGlow.fillStyle(FIREFLY_POOL_COLOR, glow * FIREFLY_POOL_ALPHA * (1 - height / FIREFLY_MAX_HEIGHT)).fillRect(groundX - 2, groundY - 1, 5, 3).fillRect(groundX - 1, groundY - 2, 3, 5);
        fireflyGlow.fillStyle(FIREFLY_HALO_COLOR, glow * FIREFLY_HALO_ALPHA * 0.4).fillRect(screenX - 2, screenY, size + 4, size).fillRect(screenX, screenY - 2, size, size + 4);
        fireflyGlow.fillStyle(FIREFLY_HALO_COLOR, glow * FIREFLY_HALO_ALPHA).fillRect(screenX - 1, screenY - 1, size + 2, size + 2);
        fireflyGlow.fillStyle(FIREFLY_CORE_COLOR, glow).fillRect(screenX, screenY, size, size);
    }
}
