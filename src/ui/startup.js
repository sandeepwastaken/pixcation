const STARTUP_DITHER_RANKS = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const startupMaskCache = new Map();

function getStartupMask(level) {
    let url = startupMaskCache.get(level);
    if (url) return url;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const context = canvas.getContext('2d');
    for (let index = 0; index < 16; index++) if (STARTUP_DITHER_RANKS[index] >= level) context.fillRect(index % 4, index >> 2, 1, 1);
    startupMaskCache.set(level, url = `url(${canvas.toDataURL()})`);
    return url;
}

function maskStartupText(layer, level) {
    const style = layer.node.style;
    style.maskImage = style.webkitMaskImage = getStartupMask(level);
    style.maskSize = style.webkitMaskSize = '4px 4px';
    style.maskPosition = style.webkitMaskPosition = `${(4 - layer.x % 4) % 4}px ${(4 - layer.y % 4) % 4}px`;
    style.imageRendering = 'pixelated';
}

function clearStartupMask(layer) {
    layer.node.style.maskImage = layer.node.style.webkitMaskImage = '';
}

function createStartup(scene) {
    const hud = scene.children.list.filter(child => child.depth >= 100).map(child => [child, child.visible]);
    for (const [child] of hud) child.setVisible(false);
    character.setVisible(false);
    characterShadow.image.setVisible(false);
    const logoX = Math.round((320 - scene.textures.get('title-logo').getSourceImage().width) / 2);
    const logoShadow = scene.add.image(logoX + 2, 42, 'title-logo').setOrigin(0).setScrollFactor(0).setDepth(799).setTintFill(0xc4c4c4).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const logo = scene.add.image(logoX, 40, 'title-logo').setOrigin(0).setScrollFactor(0).setDepth(800);
    const button = scene.add.image(112, 124, 'ui-button').setOrigin(0).setScrollFactor(0).setDepth(800);
    const text = createTextLayer(192);
    createUIText(text, 112, 127, '#d4d7dd', 96, 'center', { textShadow: '1px 1px #4a5059' }).textContent = 'Start';
    createUIText(text, 0, 154, '#e0f2fd', 320, 'center', { fontSize: '11px', textShadow: '1px 1px rgba(35, 10, 3, 0.45)' }).textContent = 'Enter / Space / Click to begin';
    const textLayer = addHudLayer(scene, text, 0, 801).setVisible(true);
    const texture = scene.textures.createCanvas('startup-dither', 320, 192);
    const pattern = document.createElement('canvas');
    pattern.width = 4;
    pattern.height = 4;
    const fade = scene.add.image(0, 0, texture.key).setOrigin(0).setScrollFactor(0).setDepth(1000);
    startup = { phase: 'title', start: scene.time.now, hud, logo, logoShadow, button, textLayer, texture, pattern, fade, level: -1, spawnX: character.x, spawnY: character.y };
}

function beginStartup(time) {
    if (!startup || startup.phase !== 'title') return;
    startup.phase = 'closing';
    startup.start = time;
}

function drawStartupDither(level) {
    if (startup.level === level) return;
    startup.level = level;
    if (startup.phase === 'closing') maskStartupText(startup.textLayer, level);
    if (startup.phase === 'opening') for (const [child] of startup.hud) if (child.type === 'DOMElement') maskStartupText(child, level);
    const ranks = STARTUP_DITHER_RANKS;
    const context = startup.texture.getContext();
    const patternContext = startup.pattern.getContext('2d');
    patternContext.clearRect(0, 0, 4, 4);
    context.clearRect(0, 0, 320, 192);
    patternContext.fillStyle = '#000000';
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (ranks[y * 4 + x] < level) patternContext.fillRect(x, y, 1, 1);
        }
    }
    context.fillStyle = context.createPattern(startup.pattern, 'repeat');
    context.fillRect(0, 0, 320, 192);
    startup.texture.refresh();
}

function updateStartup(scene, time, delta) {
    const age = time - startup.start;
    if (startup.phase === 'title') {
        const angle = age / 18000;
        const scrollX = Math.round(startup.spawnX + Math.cos(angle) * 100 - 160);
        const scrollY = Math.round(startup.spawnY + Math.sin(angle) * 72 - 96);
        if (mainCamera.scrollX !== scrollX || mainCamera.scrollY !== scrollY) mainCamera.setScroll(scrollX, scrollY);
        const hover = Math.round(Math.sin(age / 1000) * 2);
        if (startup.logo.y !== 40 + hover) startup.logoShadow.y = (startup.logo.y = 40 + hover) + 2;
    } else if (startup.phase === 'closing') {
        drawStartupDither(Math.min(16, Math.floor(age / 45)));
        if (age >= 850) {
            character.setPosition(startup.spawnX, startup.spawnY).setVisible(true);
            characterShadow.image.setVisible(true);
            mainCamera.setScroll(character.x + CHARACTER_SIZE / 2 - 160, character.y + CHARACTER_SIZE / 2 - 96);
            cameraScrollX = mainCamera.scrollX;
            cameraScrollY = mainCamera.scrollY;
            cameraOffsetX = 0;
            cameraOffsetY = 0;
            startup.logo.setVisible(false); startup.logoShadow.setVisible(false);
            startup.button.setVisible(false);
            for (const [child, visible] of startup.hud) {
                if (child.type === 'DOMElement') maskStartupText(child, 16);
                child.setVisible(visible);
            }
            startup.phase = 'opening';
            startup.start = time;
            updateLoadedChunks(scene, true);
        }
    } else {
        drawStartupDither(Math.max(0, 16 - Math.floor(age / 45)));
        if (age >= 760) {
            for (const [child, visible] of startup.hud) {
                if (child.type === 'DOMElement') clearStartupMask(child);
                child.setVisible(visible);
            }
            for (const child of [startup.logo, startup.logoShadow, startup.button, startup.textLayer, startup.fade]) child.destroy();
            scene.textures.remove('startup-dither');
            startup = null;
            return;
        }
    }
    updateLoadedChunks(scene);
    buildPendingChunk(scene);
    updateCharacterShadow(scene);
    updateBushRustle(scene, time, false);
    updateChunkVisibility();
    updateTreeShadows(scene, time);
    updateParticles(time);
    updateFish(delta);
    updateChunkWater(time);
}
