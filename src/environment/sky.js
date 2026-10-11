const rainDrops = [];
let skyOverlay = null;
let skyColor = -1;
let rainGraphics = null;
let rainRandom = null;
let rainSpawnCarry = 0;

function getWorldClock(now = Date.now()) {
    const days = now / (DAY_LENGTH_MINUTES * 60000) + (WORLD_SEED % 997) / 997;
    const day = Math.floor(days);
    return { day, hour: (days - day) * 24 };
}

function getWeatherHash(day, index, salt) {
    return coordinateHash(day, index, Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER));
}

function getRainWindow(day) {
    if (getWeatherHash(day, 0, 1401) >= RAIN_CHANCE) return null;
    const start = RAIN_EARLIEST_HOUR + getWeatherHash(day, 1, 1401) * (RAIN_LATEST_START_HOUR - RAIN_EARLIEST_HOUR);
    return [start, Math.min(RAIN_LATEST_END_HOUR, start + RAIN_MIN_HOURS + getWeatherHash(day, 2, 1401) * RAIN_HOUR_RANGE)];
}

function getRainIntensity(clock) {
    const window = getRainWindow(clock.day);
    if (!window) return 0;
    return Phaser.Math.Clamp(Math.min(clock.hour - window[0], window[1] - clock.hour) / RAIN_FADE_HOURS, 0, 1);
}

function createSky(scene) {
    skyOverlay = scene.add.rectangle(0, 0, mainCamera.width, mainCamera.height, 0xffffff)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(SKY_DEPTH)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    rainGraphics = scene.add.graphics().setDepth(RAIN_DEPTH);
    rainRandom = createSeededRandom(Math.imul(WORLD_SEED + 1402, WORLD_HASH_MULTIPLIER));
}

function landRainDrop(scene, time, x, y) {
    if (isWaterPixel(scene, x, y)) {
        spawnParticle(scene, shadowLayer, time, x - 1, y, -1, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR);
        spawnParticle(scene, shadowLayer, time, x + 1, y, 1, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR);
    } else {
        spawnParticle(scene, shadowLayer, time, x, y, 0, -1, RAIN_FLECK_LIFETIME, RAIN_COLOR);
    }
}

function updateRain(scene, time, delta, intensity) {
    rainSpawnCarry += intensity * RAIN_DROPS_PER_SECOND * Math.min(delta, 50) / 1000;
    while (rainSpawnCarry >= 1) {
        rainSpawnCarry--;
        const landX = Math.round(mainCamera.scrollX + rainRandom() * (mainCamera.width + RAIN_DRIFT));
        const landY = Math.round(mainCamera.scrollY + rainRandom() * mainCamera.height);
        const duration = (RAIN_FALL_MIN + rainRandom() * RAIN_FALL_RANGE) / RAIN_SPEED * 1000;
        rainDrops.push({ landX, landY, born: time, duration });
    }

    rainGraphics.clear();
    if (!rainDrops.length) return;
    rainGraphics.fillStyle(RAIN_COLOR, RAIN_ALPHA);
    for (let index = rainDrops.length - 1; index >= 0; index--) {
        const drop = rainDrops[index];
        const remaining = 1 - (time - drop.born) / drop.duration;
        if (remaining <= 0) {
            landRainDrop(scene, time, drop.landX, drop.landY);
            rainDrops[index] = rainDrops[rainDrops.length - 1];
            rainDrops.pop();
            continue;
        }
        const seconds = remaining * drop.duration / 1000;
        rainGraphics.fillRect(Math.round(drop.landX - RAIN_DRIFT * seconds), Math.round(drop.landY - RAIN_SPEED * seconds) - RAIN_STREAK, 1, RAIN_STREAK);
    }
}

function updateSky(scene, time, delta) {
    if (!skyOverlay) return;
    const clock = getWorldClock();
    const rain = getRainIntensity(clock);
    const light = blendBiomeStops(SKY_LIGHT_STOPS, clock.hour);
    const dim = 1 - rain * RAIN_DIM;
    const color = light.reduce((total, value, channel) => total | Math.round(255 * Phaser.Math.Clamp(value * dim, 0, 1)) << (16 - channel * 8), 0);

    if (color !== skyColor) {
        skyColor = color;
        skyOverlay.setFillStyle(color);
    }
    if (skyOverlay.width !== mainCamera.width || skyOverlay.height !== mainCamera.height) skyOverlay.setSize(mainCamera.width, mainCamera.height);
    updateRain(scene, time, delta, rain);
}
