const snowflakes = [];
let snowGraphics = null, snowSpawnCarry = 0;

function createSnow(scene) {
    snowGraphics = scene.add.graphics().setDepth(RAIN_DEPTH);
}

function spawnSnowflake() {
    const x = mainCamera.scrollX - SNOW_MARGIN + Math.random() * (mainCamera.width + SNOW_MARGIN * 2);
    const y = mainCamera.scrollY + Math.random() * (mainCamera.height + SNOW_HEIGHT_MIN + SNOW_HEIGHT_RANGE);
    snowflakes.push({ x, y, height: SNOW_HEIGHT_MIN + Math.random() * SNOW_HEIGHT_RANGE, near: Math.random() < SNOW_NEAR_SHARE, phase: Math.random() * 1000, landed: 0 });
}

function updateSnow(scene, time, delta) {
    if (!snowGraphics) return;
    const clock = getWorldClock(), step = Math.min(delta, 50) / 1000;
    snowSpawnCarry += getSnowfall(clock) * SNOW_FLAKES_PER_SECOND * step;
    for (; snowSpawnCarry >= 1; snowSpawnCarry--) spawnSnowflake();
    snowGraphics.clear();
    const centerX = mainCamera.scrollX + mainCamera.width / 2, centerY = mainCamera.scrollY + mainCamera.height / 2;
    for (let index = snowflakes.length - 1; index >= 0; index--) {
        const flake = snowflakes[index];
        if (flake.landed && time - flake.landed > SNOW_SETTLE) { snowflakes[index] = snowflakes[snowflakes.length - 1]; snowflakes.pop(); continue; }
        if (!flake.landed) { flake.height -= (flake.near ? SNOW_NEAR_SPEED : SNOW_FALL_SPEED) * step; flake.x += (SNOW_WIND * weatherWind + Math.sin(time * SNOW_SWAY_RATE + flake.phase) * SNOW_SWAY) * step; }
        if (!flake.landed && flake.height <= 0) Object.assign(flake, { height: 0, landed: isWaterPixel(scene, Math.round(flake.x), Math.round(flake.y)) ? -Infinity : time });
        const lift = flake.height / SNOW_CAMERA_HEIGHT, size = flake.near ? 2 : 1;
        const x = Math.round(flake.x + (flake.x - centerX) * lift), y = Math.round(flake.y + (flake.y - centerY) * lift - flake.height);
        snowGraphics.fillStyle(flake.near ? SNOW_COLOR : SNOW_TINT, flake.landed ? Math.max(0, 1 - (time - flake.landed) / SNOW_SETTLE) : 1).fillRect(x, y, size, size);
    }
}
