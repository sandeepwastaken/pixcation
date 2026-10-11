const rainDrops = [];
let skyOverlay = null;
let skyColor = -1;
let rainGraphics = null;
let rainRandom = null;
let rainSpawnCarry = 0;
let lightningFlash = null, lightningAt = -Infinity;
let rainDrift = 0;
let worldClockText = null, worldClockLayer = null;

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
    if (!window || isSnowDay(clock.day)) return 0;
    return Phaser.Math.Clamp(Math.min(clock.hour - window[0], window[1] - clock.hour) / RAIN_FADE_HOURS, 0, 1);
}

const isSnowDay = day => getWeatherHash(day, 4, 1401) < SNOW_CHANCE;
const getSnowWindow = clock => isSnowDay(clock.day) ? getRainWindow(clock.day) : null;
const getSnowfall = (clock, window = getSnowWindow(clock)) => window ? Phaser.Math.Clamp(Math.min(clock.hour - window[0], window[1] - clock.hour) / RAIN_FADE_HOURS, 0, 1) : 0;

function createSky(scene) {
    const clockLayer = createTextLayer(28, { fontSize: '11px', color: '#e0f2fd', textShadow: '1px 1px rgba(0, 0, 0, 0.65)' });
    worldClockText = createUIText(clockLayer, 8, 8, '#e0f2fd', 144);
    createUIText(clockLayer, 8, 20, '#e0f2fd', 144).textContent = 'H - return to spawn';
    worldClockLayer = addHudLayer(scene, clockLayer, 0, 211).setVisible(true);
    skyOverlay = scene.add.rectangle(0, 0, mainCamera.width, mainCamera.height, 0xffffff)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(SKY_DEPTH)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    rainGraphics = scene.add.graphics().setDepth(RAIN_DEPTH);
    lightningFlash = scene.add.rectangle(0, 0, mainCamera.width, mainCamera.height, RAIN_COLOR).setOrigin(0).setScrollFactor(0).setDepth(SKY_DEPTH + 0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    rainRandom = createSeededRandom(Math.imul(WORLD_SEED + 1402, WORLD_HASH_MULTIPLIER));
}

function landRainDrop(scene, time, x, y) {
    if (isWaterPixel(scene, x, y)) {
        spawnParticle(scene, shadowLayer, time, x, y, 0, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR, 0, -1, 0, true);
        spawnParticle(scene, shadowLayer, time, x, y, 0, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR, 0, 1, 0, true);
        spawnParticle(scene, shadowLayer, time, x, y, 0, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR, 0, 0, Math.random() < 0.5 ? -1 : 1, true);
    } else {
        spawnParticle(scene, shadowLayer, time, x, y, 0, -1, RAIN_FLECK_LIFETIME, RAIN_COLOR);
    }
}

function updateRain(scene, time, delta, intensity) {
    rainSpawnCarry += intensity * RAIN_DROPS_PER_SECOND * Math.min(delta, 50) / 1000;
    while (rainSpawnCarry >= 1) {
        rainSpawnCarry--;
        const landX = Math.round(mainCamera.scrollX - RAIN_DRIFT + rainRandom() * (mainCamera.width + RAIN_DRIFT * 4));
        const landY = Math.round(mainCamera.scrollY + rainRandom() * mainCamera.height);
        const duration = (RAIN_FALL_MIN + rainRandom() * RAIN_FALL_RANGE) / RAIN_SPEED * 1000;
        rainDrops.push({ landX, landY, born: time, duration, near: rainRandom() < RAIN_NEAR_SHARE });
    }

    rainGraphics.clear();
    if (!rainDrops.length) return;
    const drift = rainDrift, slant = drift / RAIN_SPEED;
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
        const length = drop.near ? RAIN_NEAR_STREAK : RAIN_STREAK, headX = Math.round(drop.landX - drift * seconds), headY = Math.round(drop.landY - RAIN_SPEED * seconds);
        rainGraphics.fillStyle(RAIN_COLOR, drop.near ? RAIN_ALPHA : RAIN_ALPHA * RAIN_FAR_ALPHA);
        for (let pixel = 1; pixel <= length; pixel++) rainGraphics.fillRect(headX - Math.round(pixel * slant), headY - pixel, 1, 1);
    }
}

function updateLightning(time, delta, clock, rain) {
    if (!lightningFlash) return;
    if (rain > 0.8 && getWeatherHash(clock.day, 3, 1401) < STORM_CHANCE && rainRandom() < LIGHTNING_PER_SECOND * Math.min(delta, 50) / 1000) lightningAt = time;
    const age = time - lightningAt;
    const alpha = age < LIGHTNING_TIME ? Math.round((1 - age / LIGHTNING_TIME) * (age % 140 < 70 ? 1 : 0.3) * LIGHTNING_ALPHA * 8) / 8 : 0;
    if (lightningFlash.alpha !== alpha) lightningFlash.setAlpha(alpha);
    if (lightningFlash.width !== mainCamera.width || lightningFlash.height !== mainCamera.height) lightningFlash.setSize(mainCamera.width, mainCamera.height);
}

function updateSky(scene, time, delta) {
    if (!skyOverlay) return;
    if (worldClockLayer) worldClockLayer.setVisible(!startup && !isMenuOpen() && !spawnReturn);
    const clock = getWorldClock();
    if (worldClockText) setUITextContent(worldClockText, `${String(Math.floor(clock.hour)).padStart(2, '0')}:${String(Math.floor(clock.hour * 60) % 60).padStart(2, '0')}`);
    const rain = getRainIntensity(clock);
    const storm = getWeatherHash(clock.day, 3, 1401) < STORM_CHANCE ? rain : 0;
    rainDrift = RAIN_DRIFT * (1 + Math.sin(time * RAIN_GUST_RATE) * RAIN_GUST) + storm * (STORM_WIND + (Math.sin(time * STORM_GUST_RATE) + Math.sin(time * STORM_GUST_RATE * 2.7 + 1.3) * 0.5) * STORM_GUST);
    weatherWind = 1 + storm * (STORM_TREE_WIND - 1);
    const light = blendBiomeStops(SKY_LIGHT_STOPS, clock.hour);
    const dim = 1 - rain * RAIN_DIM;
    const color = light.reduce((total, value, channel) => total | Math.round(255 * Phaser.Math.Clamp(value * (dim + rain * RAIN_COOL * (channel - 1)), 0, 1)) << (16 - channel * 8), 0);

    if (color !== skyColor) {
        skyColor = color;
        skyOverlay.setFillStyle(color);
    }
    if (skyOverlay.width !== mainCamera.width || skyOverlay.height !== mainCamera.height) skyOverlay.setSize(mainCamera.width, mainCamera.height);
    updateRain(scene, time, delta, rain * (getWeatherHash(clock.day, 3, 1401) < STORM_CHANCE ? STORM_RAIN : 1));
    updateLightning(time, delta, clock, rain);
}
