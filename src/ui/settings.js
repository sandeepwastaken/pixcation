function loadGamePreferences(scene) {
    let saved; try {saved = JSON.parse(localStorage.getItem('pixcation-preferences'));} catch (error) {}
    if (saved && typeof saved === 'object') {if (Number.isFinite(saved.volume)) gamePreferences.volume = Math.max(0, Math.min(1, saved.volume)); for (const key of ['uiSpeed', 'textSpeed']) if ([0.75, 1, 1.5, 2].includes(saved[key])) gamePreferences[key] = saved[key]; gamePreferences.reducedMotion = saved.reducedMotion === true;}
    scene.sound?.setVolume(gamePreferences.volume);
}
function saveGamePreferences(scene) {
    scene.sound?.setVolume(gamePreferences.volume); try {localStorage.setItem('pixcation-preferences', JSON.stringify(gamePreferences));} catch (error) {}
}
function isSettingsButtonAt(x, y) { return x >= 212 && x < 260 && y >= 8 && y < 24; }
function createSettingsUI(scene) {
    settingsButton = scene.add.image(212, 8, 'ui-skin-settings-button').setOrigin(0).setScrollFactor(0).setDepth(210);
    const text = createTextLayer(16, {width: '48px', fontSize: '11px', lineHeight: '11px'}); createUIText(text, 0, 2, '#e0f2fd', 48, 'center', {textShadow: '1px 1px #000'}).textContent = 'Settings'; settingsButtonTextLayer = addHudLayer(scene, text, 8, 211).setX(212).setVisible(true);
}
function updateSettingsUI() {
    if (!settingsButton) return; const visible = (!isMenuOpen() || settingsOpen || statsOpen) && !characterCreator && !outfitChange; settingsButton.setVisible(visible); settingsButtonTextLayer.setVisible(visible);
}
function closeSettings() {
    if (!settingsMenu) return; const menu = settingsMenu; settingsMenu = null; settingsOpen = false; menu.layer.destroy(); menu.root.remove(); menu.scene.resetHeldActions?.();
}
function openSettings(scene) {
    if (fishing?.hauling) {showItemLabel(scene, 'Finish hauling before opening settings'); return;}
    if (startup || outfitChange || characterCreator) return; if (settingsOpen) {closeSettings(); return;} if (statsOpen) closeStats(); if (isMenuOpen()) return; stopCharacterForMenu(); scene.resetHeldActions?.(); settingsOpen = true;
    const root = createTextLayer(192, {pointerEvents: 'auto', color: '#e0f2fd', fontSize: '11px', lineHeight: '12px'}); root.className = 'game-settings';
    characterCreatorElement(root, 'div', null, {position: 'absolute', left: '32px', top: '24px', width: '256px', height: '144px', ...uiPngBackground(scene, 'settings-panel', 0x36160d)});
    characterCreatorElement(root, 'style', pngControlStyles(scene, '.game-settings') + '.game-settings select,.game-settings input[type=range]{width:76px}'); createUIText(root, 44, 34, '#e2e4e9', 232, 'center', {fontSize: '16px'}).textContent = 'Settings';
    const row = (label, y) => {const element = characterCreatorElement(root, 'label', null, {position: 'absolute', left: '44px', top: y + 'px', display: 'flex', alignItems: 'center', height: '18px', gap: '4px', lineHeight: '11px', textShadow: UI_TEXT_SHADOW}); characterCreatorElement(element, 'span', label, {width: '152px', color: '#e2e4e9'}); return element;};
    const volume = characterCreatorElement(row('Volume', 58), 'input', null); volume.type = 'range'; volume.min = '0'; volume.max = '100'; volume.step = '1'; volume.value = String(Math.round(gamePreferences.volume * 100)); volume.addEventListener('input', () => {gamePreferences.volume = Number(volume.value) / 100; saveGamePreferences(scene);});
    for (const [label, key, y] of [['Menu animations', 'uiSpeed', 80], ['Dialogue speed', 'textSpeed', 102]]) {const select = characterCreatorElement(row(label, y), 'select', null); for (const [value, name] of [[0.75, 'Relaxed'], [1, 'Normal'], [1.5, 'Fast'], [2, 'Very fast']]) {const option = characterCreatorElement(select, 'option', name); option.value = String(value);} select.value = String(gamePreferences[key]); select.addEventListener('change', () => {gamePreferences[key] = Number(select.value); saveGamePreferences(scene);});}
    const motion = characterCreatorElement(row('Motion', 124), 'select', null); for (const [value, name] of [['0', 'Full'], ['1', 'Reduced']]) {const option = characterCreatorElement(motion, 'option', name); option.value = value;} motion.value = gamePreferences.reducedMotion ? '1' : '0'; motion.addEventListener('change', () => {gamePreferences.reducedMotion = motion.value === '1'; saveGamePreferences(scene);});
    const button = (label, x, width, action) => {const element = characterCreatorElement(root, 'button', label, {position: 'absolute', left: x + 'px', top: '146px', width: width + 'px'}); element.type = 'button'; element.addEventListener('click', action);};
    button('Change appearance', 46, 134, () => {closeSettings(); openCharacterCreator(scene, true);}); button('Close', 204, 70, closeSettings);
    settingsMenu = {scene, root, layer: addHudLayer(scene, root, 0, 240).setVisible(true)};
}
function beginOutfitChange(scene, look) {
    if (outfitChange) return; if (fishing) releaseTargetFish(true); fishing = null; castCharge = null; scene.resetHeldActions?.(); stopCharacterForMenu();
    outfitChange = {phase: 'out', start: scene.time.now, duration: gamePreferences.reducedMotion ? 80 : getUiDuration(240), look: normalizePlayerLook(look)}; character.setVisible(true);
    fishingLine?.clear(); fishingWaterShadow?.clear(); hideTransientUi();
}
function updateOutfitChange(scene, time) {
    const change = outfitChange, amount = Math.max(0, Math.min(1, (time - change.start) / change.duration));
    if (change.phase === 'out') {ditherInCharacter(scene, Math.round((1 - amount) * 16)); if (amount >= 1) {applyPlayerAppearance(scene, change.look); change.phase = 'in'; change.start = time; ditherInCharacter(scene, 0);}}
    else {ditherInCharacter(scene, Math.round(amount * 16)); if (amount >= 1) {ditherInCharacter(scene, 16); outfitChange = null; saveDirty = true;}}
}
