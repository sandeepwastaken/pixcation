function characterCreatorElement(parent, tag, text, style = {}) {
    const element = document.createElement(tag); if (text !== null) element.textContent = text; Object.assign(element.style, {pointerEvents: 'auto'}, style); parent.appendChild(element); return element;
}
function characterCreatorRow(label) {
    const row = characterCreatorElement(characterCreator.controls, 'label', null, {display: 'flex', alignItems: 'center', gap: '4px', height: characterCreator.tab === 2 ? '12px' : '16px'});
    characterCreatorElement(row, 'span', label, {width: '62px', flexShrink: '0', color: '#c0a887'}); return row;
}
function characterCreatorSelect(label, options, value, change) {
    const select = characterCreatorElement(characterCreatorRow(label), 'select', null);
    for (const [id, name] of options) { const option = characterCreatorElement(select, 'option', name); option.value = String(id); } select.value = String(value);
    select.addEventListener('change', () => {change(Number(select.value)); refreshCharacterCreator();}); return select;
}
function characterCreatorStepper(label, options, value, change) {
    const row = characterCreatorRow(label), current = Math.max(0, options.findIndex(option => option[0] === value)), group = characterCreatorElement(row, 'span', null, {display: 'flex', width: '92px', alignItems: 'center', gap: '2px'});
    const arrow = (direction) => {const button = characterCreatorElement(group, 'button', null, {width: '14px', height: '14px', padding: '2px', flexShrink: '0'}); button.type = 'button'; button.setAttribute('aria-label', (direction < 0 ? 'Previous ' : 'Next ') + label); const image = characterCreatorElement(button, 'img', null, {width: '8px', height: '8px', display: 'block', transform: `rotate(${direction < 0 ? -90 : 90}deg)`}); image.src = getUiSkinUrl(characterCreator.scene, 'arrow-up'); button.addEventListener('click', () => {change(options[(current + direction + options.length) % options.length][0]); refreshCharacterCreator();});};
    arrow(-1); characterCreatorElement(group, 'span', options[current][1], {width: '60px', textAlign: 'center', color: '#e0f2fd'}); arrow(1);
}
function characterCreatorSlider(label, value, max, gradient, change) {
    const slider = characterCreatorElement(characterCreatorRow(label), 'input', null); slider.type = 'range'; slider.min = '0'; slider.max = String(max); slider.step = '1'; slider.value = String(value); slider.style.backgroundImage = `url("${getUiSkinUrl(characterCreator.scene, 'slider-track', 0xffffff)}"), ${gradient}`; slider.style.backgroundBlendMode = 'multiply';
    slider.addEventListener('input', () => {change(Number(slider.value)); paintCharacterCreator();}); return slider;
}
function characterColorGradient(palettes, shade = 1) {
    return 'linear-gradient(to right, ' + [...palettes, palettes[0]].map(palette => '#' + palette[Math.min(shade, palette.length - 1)].toString(16).padStart(6, '0')).join(', ') + ')';
}
function refreshCharacterCreator() {
    const creator = characterCreator, look = creator.look, scroll = creator.controls.scrollTop, focused = document.activeElement?.closest('label')?.querySelector('span')?.textContent; creator.controls.replaceChildren();
    for (const [index, tab] of creator.tabs.entries()) {Object.assign(tab.style, uiPngBackground(creator.scene, index === creator.tab ? 'button-selected' : 'button')); tab.setAttribute('aria-pressed', String(index === creator.tab));}
    if (creator.tab === 0) {
    characterCreatorSelect('Gender', [[0, 'Male'], [1, 'Female']], look[14], value => { look[14] = value; });
    characterCreatorSelect('Face', [[0, 'Normal'], [1, 'Young'], [2, 'Older']], look[1], value => { look[1] = value; });
    } if (creator.tab === 1) {
    const parts = count => Array.from({length: count}, (_, index) => [index, 'Style ' + (index + 1)]);
    characterCreatorStepper('Head', [[0, 'Hair'], [1, 'Headwear']], look[5], value => {if (!look[5]) look[18] = look[6]; else creator.headwear = look[6]; look[5] = value; look[6] = value ? creator.headwear ?? 0 : look[18] ?? 0; look[7] = value ? look[7] % NPC_ACCESSORY_COLORS.length : look[9];});
    const headwear = [0, 1, 2, 3, 4, 6, 7].map((id, index) => [id, 'Style ' + (index + 1)]);
    characterCreatorStepper('Style', look[5] ? headwear : parts(NPC_HAIRSTYLES), look[6], value => {look[6] = value; if (look[5]) creator.headwear = value; else look[18] = value;});
    characterCreatorStepper('Shirt', parts(NPC_SHIRTS), look[2], value => { look[2] = value; });
    characterCreatorStepper('Pants', parts(NPC_PANTS_STYLES), look[11], value => { look[11] = value; });
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
    creator.controls.scrollTop = scroll; for (const button of creator.scrollButtons || []) button.style.display = creator.tab === 2 ? 'block' : 'none'; if (focused) [...creator.controls.querySelectorAll('label')].find(row => row.querySelector('span').textContent === focused)?.querySelector('select,input')?.focus(); paintCharacterCreator();
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
function closeCharacterCreator(returnToSettings = true) {
    if (!characterCreator) return; const creator = characterCreator; characterCreator = null; creator.layer.destroy(); creator.root.remove(); creator.scene.resetHeldActions?.();
    if (startup) {startup.logo.setVisible(true); startup.logoShadow.setVisible(true); startup.button.setVisible(true); startup.textLayer.setVisible(true);}
    else if (creator.editing && returnToSettings) openSettings(creator.scene);
}
function acceptCharacterCreator() {
    if (!characterCreator) return; const {scene, look, editing} = characterCreator; if (editing) {closeCharacterCreator(false); beginOutfitChange(scene, look); return;} applyPlayerAppearance(scene, look); closeCharacterCreator(false); beginStartup(scene.time.now);
}
function openCharacterCreator(scene, editing = false) {
    if (characterCreator) return; scene.resetHeldActions?.();
    const root = createTextLayer(192, {pointerEvents: 'auto', color: '#e0f2fd', fontSize: '11px', lineHeight: '11px'}); root.className = 'character-creator';
    characterCreatorElement(root, 'div', null, {position: 'absolute', left: '32px', top: '24px', width: '256px', height: '144px', ...uiPngBackground(scene, 'creator-panel')});
    characterCreatorElement(root, 'style', pngControlStyles(scene, '.character-creator'));
    createUIText(root, 44, 34, '#acccf9', 232, 'center', {fontSize: '16px'}).textContent = 'Your character';
    characterCreatorElement(root, 'style', '.character-creator select{height:14px}.character-creator input[type=range]{height:6px}');
    const portrait = characterCreatorElement(root, 'canvas', null, {position: 'absolute', left: '46px', top: '54px', width: '55px', height: '62px', imageRendering: 'pixelated'}); portrait.width = 55; portrait.height = 62;
    const sprite = characterCreatorElement(root, 'canvas', null, {position: 'absolute', left: '65px', top: '124px', width: '16px', height: '16px', imageRendering: 'pixelated'}); sprite.width = 16; sprite.height = 16;
    const controls = characterCreatorElement(root, 'div', null, {position: 'absolute', left: '112px', top: '77px', width: '162px', height: '66px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px', boxSizing: 'border-box'});
    const initial = normalizePlayerLook(PLAYER_LOOK); characterCreator = {scene, root, controls, portrait, sprite, initial, editing, tab: 0, look: normalizePlayerLook(initial), layer: addHudLayer(scene, root, 0, 850).setVisible(true)};
    characterCreator.tabs = ['Look', 'Parts', 'Colors'].map((label, index) => {const tab = characterCreatorElement(root, 'button', label, {position: 'absolute', left: 112 + index * 56 + 'px', top: '56px', width: '52px'}); tab.type = 'button'; tab.addEventListener('click', () => {characterCreator.tab = index; characterCreator.controls.scrollTop = 0; refreshCharacterCreator();}); return tab;});
    const button = (label, x, width, action) => {const element = characterCreatorElement(root, 'button', label, {position: 'absolute', left: x + 'px', top: '147px', width: width + 'px'}); element.type = 'button'; element.addEventListener('click', action); return element;};
    button('Reset', 112, 46, () => {characterCreator.look = normalizePlayerLook(characterCreator.initial); refreshCharacterCreator();}); button('Back', 162, 46, () => closeCharacterCreator()); button(editing ? 'Wear this' : "Let's go!", 212, 66, acceptCharacterCreator); button('Flip', 46, 55, () => {characterCreator.look[8] = characterCreator.look[8] ? 0 : 1; paintCharacterCreator();});
    if (startup) {startup.logo.setVisible(false); startup.logoShadow.setVisible(false); startup.button.setVisible(false); startup.textLayer.setVisible(false);}
    characterCreator.scrollButtons = [-1, 1].map(direction => {const arrow = characterCreatorElement(root, 'button', null, {position: 'absolute', left: '276px', top: direction < 0 ? '78px' : '129px', width: '10px', height: '14px', padding: '0'}); arrow.type = 'button'; arrow.setAttribute('aria-label', direction < 0 ? 'Scroll colors up' : 'Scroll colors down'); const image = characterCreatorElement(arrow, 'img', null, {width: '8px', height: '8px', transform: direction < 0 ? 'none' : 'scaleY(-1)'}); image.src = getUiSkinUrl(scene, 'arrow-up'); arrow.addEventListener('click', () => {controls.scrollTop += direction * 24;}); return arrow;});
    refreshCharacterCreator(); controls.querySelector('select')?.focus();
}
