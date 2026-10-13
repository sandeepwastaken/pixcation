function characterCreatorElement(parent, tag, text, style = {}) {
    const element = document.createElement(tag); if (text !== null) element.textContent = text; Object.assign(element.style, {pointerEvents: 'auto'}, style); parent.appendChild(element); return element;
}
function characterCreatorRow(label) {
    const row = characterCreatorElement(characterCreator.controls, 'label', null, {display: 'flex', alignItems: 'center', gap: '4px', height: characterCreator.tab === 2 ? '14px' : '20px'});
    characterCreatorElement(row, 'span', label, {width: '62px', flexShrink: '0', color: '#c0a887'}); return row;
}
function characterCreatorSelect(label, options, value, change) {
    const select = characterCreatorElement(characterCreatorRow(label), 'select', null);
    for (const [id, name] of options) { const option = characterCreatorElement(select, 'option', name); option.value = String(id); } select.value = String(value);
    select.addEventListener('change', () => {change(Number(select.value)); refreshCharacterCreator();}); return select;
}
function characterCreatorSlider(label, value, max, gradient, change) {
    const slider = characterCreatorElement(characterCreatorRow(label), 'input', null); slider.type = 'range'; slider.min = '0'; slider.max = String(max); slider.step = '1'; slider.value = String(value); slider.style.background = gradient;
    slider.addEventListener('input', () => {change(Number(slider.value)); paintCharacterCreator();}); return slider;
}
function characterColorGradient(palettes, shade = 1) {
    return 'linear-gradient(to right, ' + [...palettes, palettes[0]].map(palette => '#' + palette[Math.min(shade, palette.length - 1)].toString(16).padStart(6, '0')).join(', ') + ')';
}
function refreshCharacterCreator() {
    const creator = characterCreator, look = creator.look, scroll = creator.controls.scrollTop, focused = document.activeElement?.closest('label')?.querySelector('span')?.textContent; creator.controls.replaceChildren();
    for (const [index, tab] of creator.tabs.entries()) {tab.style.background = index === creator.tab ? '#465989' : '#230a03'; tab.setAttribute('aria-pressed', String(index === creator.tab));}
    if (creator.tab === 0) {
    characterCreatorSelect('Gender', [[0, 'Male'], [1, 'Female']], look[14], value => { look[14] = value; });
    characterCreatorSelect('Face', [[0, 'Normal'], [1, 'Young'], [2, 'Older']], look[1], value => { look[1] = value; });
    characterCreatorSelect('Facing', [[0, 'Original'], [1, 'Flipped']], look[8], value => { look[8] = value; });
    } if (creator.tab === 1) {
    const parts = count => Array.from({length: count}, (_, index) => [index, 'Style ' + (index + 1)]);
    characterCreatorSelect('Hair', parts(NPC_HAIRSTYLES), look[18] ?? 0, value => { look[18] = value; if (!look[5]) look[6] = value; });
    const headwear = [-1, 0, 1, 2, 3, 4, 6, 7].map((id, index) => [id, index ? 'Style ' + index : 'None']);
    characterCreatorSelect('Headwear', headwear, look[5] ? look[6] : -1, value => { look[5] = value >= 0 ? 1 : 0; look[6] = value >= 0 ? value : look[18] ?? 0; look[7] = look[5] ? look[7] % NPC_ACCESSORY_COLORS.length : look[9]; });
    characterCreatorSelect('Shirt', parts(NPC_SHIRTS), look[2], value => { look[2] = value; });
    characterCreatorSelect('Pants', parts(NPC_PANTS_STYLES), look[11], value => { look[11] = value; });
    } if (creator.tab === 0) {
    characterCreatorSelect('Palette', [[0, 'Natural'], [5, 'Pastel']], look[0] >= 5 ? 5 : 0, value => { look[0] = value; });
    const skinColors = Array.from({length: 17}, (_, index) => '#' + getPersonSkinRamp(look[0] >= 5, index / 16)[1].toString(16).padStart(6, '0'));
    characterCreatorSlider('Tone', Math.round(look[15] * 1000), 1000, 'linear-gradient(to right, ' + skinColors.join(', ') + ')', value => {look[15] = value / 1000;});
    } if (creator.tab === 2) {
    const colors = [['Hair', 9, 1, NPC_HAIR_COLORS], ['Headwear', 7, 4, NPC_ACCESSORY_COLORS], ['Shirt', 3, 3, NPC_SHIRT_COLORS], ['Shirt trim', 10, 5, NPC_SHIRT_COLORS], ['Pants', 4, 2, NPC_PANTS_COLORS], ['Pants trim', 12, 6, NPC_PANTS_COLORS], ['Eyes', 13, 7, NPC_EYE_PALETTES]];
    for (const [label, index, salt, palettes] of colors) {
        const current = index === 7 && !look[5] ? 0 : look[index];
        const slider = characterCreatorSlider(label, Math.round((current + look[17][salt - 1]) * 1000), palettes.length * 1000 - 1, characterColorGradient(palettes), value => {look[index] = Math.floor(value / 1000); look[17][salt - 1] = value % 1000 / 1000; if (index === 9 && !look[5]) look[7] = look[9];});
        if (index === 7 && !look[5]) {slider.disabled = true; slider.style.opacity = '0.35';}
    }
    }
    creator.controls.scrollTop = scroll; if (focused) [...creator.controls.querySelectorAll('label')].find(row => row.querySelector('span').textContent === focused)?.querySelector('select,input')?.focus(); paintCharacterCreator();
}
function paintCharacterCreator() {
    const creator = characterCreator, portrait = composePersonPortraitPixels(creator.scene, creator.look, 'normal'), context = creator.portrait.getContext('2d'), image = context.createImageData(portrait.width, portrait.height);
    image.data.set(portrait.data); context.putImageData(image, 0, 0);
    const sprite = creator.sprite.getContext('2d'), pixels = composePersonPixels(creator.scene, creator.look, 'front'), frame = sprite.createImageData(16, 16);
    pixels.forEach((color, index) => color !== null && writeRGBPixel(frame.data, index, color)); sprite.putImageData(frame, 0, 0);
}
function applyPlayerAppearance(scene, look) {
    PLAYER_LOOK.splice(0, PLAYER_LOOK.length, ...normalizePlayerLook(look));
    for (const direction of ['front', 'back', 'left', 'right']) for (const blink of [false, true]) for (const frame of [0, 1, 2]) {const key = `character-${direction}${frame ? `walk${frame}` : ''}${blink ? '-blink' : ''}`; if (scene.textures.exists(key)) scene.textures.remove(key); scene.textureSourceCache?.delete(key); scene.terrainPixelCache?.delete(key);}
    createPlayerTextures(scene); characterTextureKey = null; if (character) {character.personBlinkState = null; setCharacterTexture(`character-${characterDirection}`);}
    playerAppearanceChosen = true; saveDirty = true; try { localStorage.setItem('pixcation-player-look', JSON.stringify(PLAYER_LOOK)); } catch (error) {} saveProgress();
}
function closeCharacterCreator() {
    if (!characterCreator) return; const creator = characterCreator; characterCreator = null; creator.layer.destroy(); creator.root.remove(); creator.scene.resetHeldActions?.();
    if (startup) {startup.logo.setVisible(true); startup.logoShadow.setVisible(true); startup.button.setVisible(true); startup.textLayer.setVisible(true);}
}
function acceptCharacterCreator() {
    if (!characterCreator) return; const {scene, look} = characterCreator; applyPlayerAppearance(scene, look); closeCharacterCreator(); beginStartup(scene.time.now);
}
function openCharacterCreator(scene) {
    if (characterCreator) return; scene.resetHeldActions?.();
    const root = createTextLayer(192, {background: '#230a03', pointerEvents: 'auto', color: '#e0f2fd', fontSize: '11px', lineHeight: '12px'}); root.className = 'character-creator';
    characterCreatorElement(root, 'div', null, {position: 'absolute', left: '6px', top: '8px', width: '308px', height: '176px', boxSizing: 'border-box', border: '1px solid #acccf9', background: '#36160d'});
    const style = characterCreatorElement(root, 'style', '.character-creator select,.character-creator button{font:11px m6x11,monospace;color:#e0f2fd;background:#230a03;border:1px solid #465989;border-radius:0;height:18px;box-sizing:border-box}.character-creator select{width:92px;padding:0 2px}.character-creator button{cursor:pointer}.character-creator button:hover,.character-creator button:focus-visible{background:#465989;outline:1px solid #acccf9}.character-creator input[type=range]{appearance:none;width:92px;height:6px;border:1px solid #230a03;border-radius:0;margin:0;cursor:ew-resize}.character-creator input[type=range]::-webkit-slider-thumb{appearance:none;width:5px;height:12px;background:#f6f5e5;border:1px solid #230a03;border-radius:0}.character-creator input[type=range]::-moz-range-thumb{width:4px;height:10px;background:#f6f5e5;border:1px solid #230a03;border-radius:0}.character-creator input:focus-visible,.character-creator select:focus-visible{outline:1px solid #acccf9}.character-creator *{scrollbar-width:thin;scrollbar-color:#465989 #230a03}');
    createUIText(root, 14, 16, '#acccf9', null, null, {fontSize: '16px'}).textContent = 'Your character';
    createUIText(root, 136, 19, '#c0a887', null, null, {fontSize: '11px'}).textContent = 'Make yourself at home';
    const portrait = characterCreatorElement(root, 'canvas', null, {position: 'absolute', left: '14px', top: '35px', width: '110px', height: '124px', imageRendering: 'pixelated'}); portrait.width = 55; portrait.height = 62;
    const sprite = characterCreatorElement(root, 'canvas', null, {position: 'absolute', left: '90px', top: '125px', width: '32px', height: '32px', imageRendering: 'pixelated', background: '#36160d', border: '1px solid #acccf9'}); sprite.width = 16; sprite.height = 16;
    const controls = characterCreatorElement(root, 'div', null, {position: 'absolute', left: '136px', top: '55px', width: '166px', height: '100px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px', boxSizing: 'border-box'});
    const initial = normalizePlayerLook(PLAYER_LOOK); characterCreator = {scene, root, controls, portrait, sprite, initial, tab: 0, look: normalizePlayerLook(initial), layer: addHudLayer(scene, root, 0, 850).setVisible(true)};
    characterCreator.tabs = ['Look', 'Parts', 'Colors'].map((label, index) => {const tab = characterCreatorElement(root, 'button', label, {position: 'absolute', left: 136 + index * 56 + 'px', top: '35px', width: '52px'}); tab.type = 'button'; tab.addEventListener('click', () => {characterCreator.tab = index; characterCreator.controls.scrollTop = 0; refreshCharacterCreator();}); return tab;});
    const button = (label, x, width, action) => {const element = characterCreatorElement(root, 'button', label, {position: 'absolute', left: x + 'px', top: '165px', width: width + 'px'}); element.type = 'button'; element.addEventListener('click', action); return element;};
    button('Reset', 136, 46, () => {characterCreator.look = normalizePlayerLook(characterCreator.initial); refreshCharacterCreator();}); button('Back', 186, 46, closeCharacterCreator); button("Let's go!", 236, 66, acceptCharacterCreator);
    if (startup) {startup.logo.setVisible(false); startup.logoShadow.setVisible(false); startup.button.setVisible(false); startup.textLayer.setVisible(false);}
    refreshCharacterCreator(); controls.querySelector('select')?.focus();
}
