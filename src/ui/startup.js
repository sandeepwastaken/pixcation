function createStartup(scene) {
    const hud = scene.children.list.filter(child => child.depth >= 100).map(child => [child, child.visible, child.y]);
    for (const [child] of hud) child.setVisible(false);
    character.setVisible(false);
    characterShadow.image.setVisible(false);
    const logoX = Math.round((320 - scene.textures.get('title-logo').getSourceImage().width) / 2);
    const logoShadow = scene.add.image(logoX + 2, 42, 'title-logo').setOrigin(0).setScrollFactor(0).setDepth(799).setTintFill(0xc4c4c4).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const logo = scene.add.image(logoX, 40, 'title-logo').setOrigin(0).setScrollFactor(0).setDepth(800);
    const button = scene.add.image(112, 124, 'ui-button').setOrigin(0).setScrollFactor(0).setDepth(800);
    const text = createTextLayer(192);
    createUIText(text, 112, 127, '#d4d7dd', 96, 'center', { textShadow: UI_TEXT_SHADOW }).textContent = 'Start';
    const hint = createUIText(text, 0, 154, '#e0f2fd', 320, 'center', { fontSize: '11px', textShadow: '1px 1px rgba(35, 10, 3, 0.45)' });
    hint.textContent = 'Enter / Space / Click to begin';
    const textLayer = addHudLayer(scene, text, 0, 801).setVisible(true);
    startup = { phase: 'title', start: scene.time.now, hud, logo, logoShadow, button, textLayer, hint, spawnX: character.x, spawnY: character.y };
}

function ditherPixels(source, originX, originY, level) {
    const image = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    for (let y = 0; y < source.height; y++) {
        for (let x = 0; x < source.width; x++) {
            if (SEE_THROUGH_RANKS[((originY + y) & 3) * 4 + ((originX + x) & 3)] >= level) image.data[(y * source.width + x) * 4 + 3] = 0;
        }
    }
    return image;
}

function ditherInCharacter(scene, level) {
    if (level >= 16) {
        characterTextureKey = null;
        setCharacterTexture(`character-${characterDirection}`);
        characterShadow.context.putImageData(characterShadow.pixels, 0, 0);
        characterShadow.texture.refresh();
        return;
    }
    const source = getTerrainPixels(scene, `character-${characterDirection}`);
    if (!scene.textures.exists('character-dither')) scene.textures.createCanvas('character-dither', source.width, source.height);
    const texture = scene.textures.get('character-dither');
    texture.getContext().putImageData(ditherPixels(source, Math.round(character.x), Math.round(character.y), level), 0, 0);
    texture.refresh();
    characterTextureKey = 'character-dither';
    character.setTexture('character-dither');
    characterShadow.context.putImageData(ditherPixels(characterShadow.pixels, characterShadow.x, characterShadow.y, level), 0, 0);
    characterShadow.texture.refresh();
}

function isStartButtonAt(x, y) {
    return x >= 112 && x < 208 && y >= 124 && y < 144;
}

function beginStartup(time) {
    if (!startup || startup.phase !== 'title') return;
    startup.phase = 'closing';
    startup.start = time;
    startup.from = [mainCamera.scrollX, mainCamera.scrollY];
    character.setPosition(startup.spawnX, startup.spawnY).setVisible(true);
    characterShadow.image.setVisible(true);
}

function updateStartup(scene, time, delta) {
    const age = time - startup.start;
    if (startup.phase === 'title') {
        const angle = age / 6000;
        const scrollX = Math.round(startup.spawnX + Math.cos(angle) * 100 - 160);
        const scrollY = Math.round(startup.spawnY + Math.sin(angle) * 72 - 96);
        if (mainCamera.scrollX !== scrollX || mainCamera.scrollY !== scrollY) mainCamera.setScroll(scrollX, scrollY);
        const hover = Math.round(Math.sin(age / 1000) * 2);
        if (startup.logo.y !== 40 + hover) startup.logoShadow.y = (startup.logo.y = 40 + hover) + 2;
        const hintVisibility = '';
        if (startup.hint && startup.hint.style.visibility !== hintVisibility) startup.hint.style.visibility = hintVisibility;
    } else if (startup.phase === 'closing') {
        const t = Math.min(1, age / 900);
        startup.dither = Math.max(0, Math.min(16, Math.round((t * 2 - 1) * 16)));
        const lift = Math.round(t * t * 160);
        startup.logoShadow.y = (startup.logo.y = 40 - lift) + 2;
        startup.textLayer.y = (startup.button.y = 124 - lift) - 124;
        const pan = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2;
        mainCamera.setScroll(Math.round(startup.from[0] + (character.x + CHARACTER_SIZE / 2 - 160 - startup.from[0]) * pan), Math.round(startup.from[1] + (character.y + CHARACTER_SIZE / 2 - 96 - startup.from[1]) * pan));
        if (t >= 1) {
            mainCamera.setScroll(character.x + CHARACTER_SIZE / 2 - 160, character.y + CHARACTER_SIZE / 2 - 96);
            cameraScrollX = mainCamera.scrollX;
            cameraScrollY = mainCamera.scrollY;
            cameraOffsetX = 0;
            cameraOffsetY = 0;
            startup.logo.setVisible(false); startup.logoShadow.setVisible(false);
            startup.button.setVisible(false); startup.textLayer.setVisible(false);
            for (const [child, visible, y] of startup.hud) {
                child.y = y + (y < 96 ? -40 : 40);
                child.setVisible(visible);
            }
            startup.phase = 'opening';
            startup.start = time;
            updateLoadedChunks(scene, true);
        }
    } else {
        const t = Math.min(1, age / 450);
        const drop = Math.round(Math.pow(1 - t, 3) * 40);
        for (const [child, , y] of startup.hud) child.y = y + (y < 96 ? -drop : drop);
        if (t >= 1) {
            for (const child of [startup.logo, startup.logoShadow, startup.button, startup.textLayer]) child.destroy();
            startup = null;
            return;
        }
    }
    updateLoadedChunks(scene);
    buildPendingChunk(scene);
    updateNpcHouses(scene, time);
    updateCharacterShadow(scene);
    if (startup.phase !== 'title' && startup.dither !== startup.ditherShown) ditherInCharacter(scene, startup.ditherShown = startup.dither);
    updateBushRustle(scene, time, false);
    updateChunkVisibility();
    updateTreeShadows(scene, time);
    updateParticles(time);
    updateFish(delta);
    updateChunkWater(time);
    updateSky(scene, time, delta);
}
