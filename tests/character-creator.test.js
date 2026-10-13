const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createPortraitPeople} = require('./portrait-fixture');
test('creator exposes selectable teeth for both supported ages, previews a grin, and saves the choice', () => {
    const {run} = createCreator(); run('const choices = new Map(); characterCreator = {}; characterCreatorSelect = characterCreatorStepper = (label,options,value,change) => choices.set(label,{options,value,change}); characterCreatorSlider = () => {}; const dentalAppearance = normalizePlayerLook(PLAYER_LOOK);'); for (const face of [0,1]) {run('dentalAppearance[1] = ' + face + '; choices.clear(); createCharacterCreatorLookControls(dentalAppearance); choices.get("Teeth").change(1);'); assert.equal(run('JSON.stringify(choices.get("Teeth").options)'), JSON.stringify([[0,'Normal'],[1,'Canines']])); assert.equal(run('dentalAppearance[19]'), 1); assert.equal(run('characterCreator.previewExpression'), 'grin');}
    run('storage.set("pixcation-player-look",JSON.stringify(dentalAppearance)); loadPlayerAppearance();'); assert.equal(run('PLAYER_LOOK[19]'), 1); run('choices.get("Face").change(2); choices.clear(); createCharacterCreatorLookControls(dentalAppearance);'); assert.equal(run('choices.has("Teeth")'), false); assert.equal(run('dentalAppearance[19]'), 0);
});
test('creator paints the selected tooth preview expression rather than forcing a closed mouth', () => {
    const {run} = createCreator(); run('const expressions = []; composePersonPortraitPixels = (scene,look,expression) => {expressions.push(expression); return {width:1,height:1,data:new Uint8ClampedArray(4)};}; composePersonPixels = () => [null]; const canvas = {getContext() {return {createImageData() {return {data:new Uint8ClampedArray(4)};},putImageData(){}};}}; characterCreator = {scene,look:PLAYER_LOOK,portrait:canvas,sprite:canvas}; paintCharacterCreator(); characterCreator.previewExpression = "grin"; paintCharacterCreator();'); assert.equal(run('JSON.stringify(expressions)'), JSON.stringify(['normal','grin']));
});
test('creator steppers use dedicated editable arrow images without CSS rotation', () => {
    const {run} = createCreator(); run('const arrowImages = []; characterCreator = {scene}; characterCreatorRow = () => ({}); characterCreatorElement = (parent,tag,text,style={}) => {const element={style,setAttribute(){},addEventListener(){}}; if(tag === "img") arrowImages.push(element); return element;}; getUiSkinUrl = (scene,key) => key; characterCreatorStepper("Makeup",[[0,"Soft"],[1,"Full"]],0,()=>{});'); assert.equal(run('JSON.stringify(arrowImages.map(image=>image.src))'), JSON.stringify(['arrow-left','arrow-right'])); assert.equal(run('arrowImages.every(image=>image.style.transform === undefined && image.style.width === "8px" && image.style.height === "8px")'), true);
});
test('creator exposes both eye bases for female normal and young faces and clears unsupported selections', () => {
    const {run} = createCreator(); run('const choices = new Map(); characterCreatorSelect = characterCreatorStepper = (label,options,value,change) => choices.set(label,{options,value,change}); characterCreatorSlider = () => {}; const makeupAppearance = normalizePlayerLook(PLAYER_LOOK); makeupAppearance[14] = 1;'); for (const face of [0,1]) {run('makeupAppearance[1] = ' + face + '; choices.clear(); createCharacterCreatorLookControls(makeupAppearance); choices.get("Makeup").change(1);'); assert.equal(run('JSON.stringify(choices.get("Makeup").options)'), JSON.stringify([[0,'Soft'],[1,'Full']])); assert.equal(run('makeupAppearance[20]'), 1);}
    run('choices.get("Face").change(2); choices.clear(); createCharacterCreatorLookControls(makeupAppearance)'); assert.equal(run('choices.has("Makeup")'), false); assert.equal(run('makeupAppearance[20]'), 0); run('makeupAppearance[1] = 0; makeupAppearance[20] = 1; createCharacterCreatorLookControls(makeupAppearance); choices.get("Gender").change(0); choices.clear(); createCharacterCreatorLookControls(makeupAppearance)'); assert.equal(run('choices.has("Makeup")'), false); assert.equal(run('makeupAppearance[20]'), 0);
});
test('selected eye bases survive saved appearance reloads and visibly change the portrait', () => {
    const {run} = createCreator(); run('const makeupAppearance = normalizePlayerLook(PLAYER_LOOK); makeupAppearance[14] = 1; makeupAppearance[5] = 0; makeupAppearance[6] = 0; const softPortrait = composePersonPortraitPixels(scene,makeupAppearance); makeupAppearance[20] = 1; const fullPortrait = composePersonPortraitPixels(scene,makeupAppearance); storage.set("pixcation-player-look",JSON.stringify(makeupAppearance)); loadPlayerAppearance();'); assert.equal(run('PLAYER_LOOK[20]'), 1); assert.equal(run('softPortrait.data.some((value,index)=>value!==fullPortrait.data[index])'), true); run('storage.set(SAVE_KEY,JSON.stringify({version:1,appearance:PLAYER_LOOK,appearanceChosen:true})); PLAYER_LOOK[20] = 0; loadPlayerAppearance();'); assert.equal(run('PLAYER_LOOK[20]'), 1);
});
test('saved dental variants normalize safely and older player faces retain ordinary teeth', () => {
    const {run} = createCreator(); run('const appearance=normalizePlayerLook(PLAYER_LOOK); appearance[19]=1; const selected=normalizePlayerLook(appearance); appearance[1]=2; const older=normalizePlayerLook(appearance); appearance[19]=Infinity; const malformed=normalizePlayerLook(appearance)'); assert.equal(run('selected[19]'), 1); assert.equal(run('older[19]'), 0); assert.equal(run('malformed[19]'), 0);
});
test('scrollbar pointer mapping preserves clipping, drag offsets, and display scaling', () => {
    const {run} = createCreator(); assert.equal(run('(() => {for(const scale of [1,2,3,4]) for(const height of [12,32,51,66]) for(const drag of [null,0,4,12]) for(let y=-20;y<=300;y+=7) {const bounds={top:20,height:66*scale}, position=Math.max(0,Math.min(66-height,(y-bounds.top)*66/bounds.height-(drag??height/2))), expected=Math.round(position/Math.max(1,66-height)*18); if(getCharacterCreatorScrollPosition(y,bounds,height,drag,18)!==expected) return false;}return true;})()'), true);
});
test('scrollbar geometry preserves pixel-aligned endpoints and hides without overflow', () => {
    const {run} = createCreator(); assert.equal(run('JSON.stringify(getCharacterCreatorScrollLayout(66, 84, 0))'), JSON.stringify({maximum:18,height:51,top:0})); assert.equal(run('JSON.stringify(getCharacterCreatorScrollLayout(66, 84, 18))'), JSON.stringify({maximum:18,height:51,top:15})); assert.equal(run('getCharacterCreatorScrollLayout(66, 66, 0).maximum'), 0);
});
test('unchanged settings button visibility skips redundant scene writes', () => {
    const {run} = createCreator(); run(fs.readFileSync('src/ui/settings.js', 'utf8')); run('function isMenuOpen() {return false;} const visibilityWrites = []; settingsButton = {visible:true, setVisible(value) {this.visible = value; visibilityWrites.push(value);}}; settingsButtonTextLayer = {visible:true, setVisible(value) {this.visible = value; visibilityWrites.push(value);}}; updateSettingsUI(); updateSettingsUI()');
    assert.equal(run('visibilityWrites.length'), 0); run('characterCreator = {}; updateSettingsUI(); updateSettingsUI()'); assert.equal(run('visibilityWrites.length'), 2);
});
test('already hidden transient UI skips redundant visibility writes', () => {
    const {run} = createCreator(); run(fs.readFileSync('src/ui/skins.js', 'utf8')); run('let visibilityWrites = 0; const indicator = {visible:true, setVisible(value) {this.visible = value; visibilityWrites++;}}; transientUiImages.add(indicator); hideTransientUi(); hideTransientUi()'); assert.equal(run('visibilityWrites'), 1);
});
test('finished PNG skins share one cached URL regardless of unused tint requests', () => {
    const {run} = createCreator(); run(fs.readFileSync('src/ui/skins.js', 'utf8')); run('let canvasCount = 0; getTerrainPixels = () => ({width:2,height:2,data:new Uint8ClampedArray(16).fill(127)}); document = {createElement() {canvasCount++; return {getContext() {return {createImageData() {return {data:new Uint8ClampedArray(16)};}, putImageData() {}};}, toDataURL() {return "rendered-png";}};}}; const first = getUiSkinUrl(scene, "button", 0xff0000), second = getUiSkinUrl(scene, "button", 0x0000ff)');
    assert.equal(run('first === second'), true); assert.equal(run('canvasCount'), 1);
});
test('settings clamp saved preferences and retain valid independent speeds', () => {
    const {run, scene} = createCreator(); scene.sound = {setVolume(value) {this.volume = value;}}; run(fs.readFileSync('src/ui/settings.js', 'utf8')); run('storage.set("pixcation-preferences", JSON.stringify({volume: 2, uiSpeed: 2, textSpeed: 17, reducedMotion: true})); loadGamePreferences(scene); saveGamePreferences(scene)');
    assert.equal(scene.sound.volume, 1); assert.equal(run('gamePreferences.uiSpeed'), 2); assert.equal(run('gamePreferences.textSpeed'), 1); assert.equal(run('JSON.parse(storage.get("pixcation-preferences")).reducedMotion'), true);
});
test('outfit changes replace the appearance only when fully dithered out', () => {
    const {run} = createCreator(); run(fs.readFileSync('src/ui/settings.js', 'utf8')); run('const frames = [], applied = []; function ditherInCharacter(scene, level) {frames.push(level);} applyPlayerAppearance = (scene, look) => applied.push(look); outfitChange = {phase: "out", start: 0, duration: 240, look: [1]}; updateOutfitChange(scene, 120)');
    assert.equal(run('frames.at(-1)'), 8); assert.equal(run('applied.length'), 0); run('updateOutfitChange(scene, 240)'); assert.equal(run('applied.length'), 1); assert.equal(run('frames.at(-1)'), 0); run('updateOutfitChange(scene, 360)'); assert.equal(run('frames.at(-1)'), 8); run('updateOutfitChange(scene, 480)'); assert.equal(run('outfitChange'), null); assert.equal(run('frames.at(-1)'), 16);
});
test('headwear never adds a separate hair layer in either preview', () => {
    const {run} = createCreator(); run('const look = normalizePlayerLook(PLAYER_LOOK); look[5] = 1; look[6] = 0; look[18] = 0; const firstPortrait = composePersonPortraitPixels(scene, look), firstSprite = composePersonPixels(scene, look, "front"); look[18] = 8; const secondPortrait = composePersonPortraitPixels(scene, look), secondSprite = composePersonPixels(scene, look, "front")');
    assert.equal(run('firstPortrait.data.every((value, index) => value === secondPortrait.data[index]) && firstSprite.every((value, index) => value === secondSprite[index])'), true);
});
test('creator controls remain clickable above the noninteractive HUD parent', () => {
    const {run} = createCreator(); run('document = {createElement() {return {style: {}};}}; const parent = {appendChild() {}}; const button = characterCreatorElement(parent, "button", "Parts")');
    assert.equal(run('button.style.pointerEvents'), 'auto');
});
test('confirmation rebuilds player textures, clears cached pixels, and saves the selected look', () => {
    const {run, scene, textures} = createCreator(); scene.textures.remove = key => textures.delete(key);
    run('createPlayerTextures(scene); scene.terrainPixelCache = new Map([["character-front", "stale"]]); character = {x:0,y:0}; function setCharacterTexture(key) {character.texture = {key};} const selected = normalizePlayerLook(PLAYER_LOOK); selected[14] = 1; selected[15] = 0.6; applyPlayerAppearance(scene, selected)');
    assert.equal(run('playerAppearanceChosen'), true); assert.equal(run('PLAYER_LOOK[14]'), 1); assert.equal(run('scene.terrainPixelCache.has("character-front")'), false);
    assert.equal(run('JSON.parse(storage.get(SAVE_KEY)).appearanceChosen'), true); assert.equal(run('JSON.parse(storage.get("pixcation-player-look"))[15]'), 0.6); assert.equal(textures.size, 24);
});
function createCreator() {
    const fixture = createPortraitPeople(); fixture.run(fs.readFileSync('src/runtime/progress.js', 'utf8')); fixture.run(fs.readFileSync('src/ui/character-creator.js', 'utf8'));
    fixture.run('const storage = new Map(); localStorage.getItem = key => storage.get(key) || null; localStorage.setItem = (key, value) => storage.set(key, value)'); return fixture;
}
test('the default creator design exactly preserves the original player pixels and portrait', () => {
    const {run} = createCreator();
    assert.equal(run("(() => {const original = [0,0,0,0,0,1,0,0], normalized = normalizePlayerLook(original); for(const direction of ['front','back','left','right']) for(const blink of [false,true]) {const a = composePersonPixels(scene, original, direction, blink), b = composePersonPixels(scene, normalized, direction, blink); if(a.some((pixel,index) => pixel !== b[index])) return false;} const a = composePersonPortraitPixels(scene, original), b = composePersonPortraitPixels(scene, normalized); return a.data.every((pixel,index) => pixel === b.data[index]);})()"), true);
});
test('new worlds inherit the current design but still require character confirmation', () => {
    const {run} = createCreator(); run("const profile = normalizePlayerLook([5,0,1,7,5,1,4,5,1,6,8,1,6,0,1,0.8]); storage.set('pixcation-player-look', JSON.stringify(profile)); loadPlayerAppearance()");
    assert.equal(run('playerAppearanceChosen'), false); assert.equal(run('PLAYER_LOOK[14]'), 1); assert.equal(run('PLAYER_LOOK[15]'), 0.8); assert.equal(run('PLAYER_LOOK[8]'), 1);
    run("storage.set(SAVE_KEY, JSON.stringify({version: 1, appearance: PLAYER_LOOK, appearanceChosen: true})); loadPlayerAppearance()"); assert.equal(run('playerAppearanceChosen'), true);
    run("storage.set(SAVE_KEY, JSON.stringify({version: 1, appearance: PLAYER_LOOK, appearanceChosen: false})); loadPlayerAppearance()"); assert.equal(run('playerAppearanceChosen'), false);
});
test('older saves keep their original player and do not reopen the creator', () => {
    const {run} = createCreator(); run("storage.set('pixcation-player-look', JSON.stringify([5,2,1,7,5,1,4,5,1,6,8,1,6,0,1,0.8])); storage.set(SAVE_KEY, JSON.stringify({version: 1})); loadPlayerAppearance()");
    assert.equal(run('playerAppearanceChosen'), true); assert.equal(run('PLAYER_LOOK[0]'), 0); assert.equal(run('PLAYER_LOOK[14]'), 0);
});
test('malformed appearances are safe, color sliders are clamped, and excluded headwear is never restored', () => {
    const {run} = createCreator(); run('const malformed = new Array(19).fill(Infinity); malformed[5] = 1; malformed[6] = 5; malformed[15] = -2; malformed[17] = [-2, 7, NaN]; const look = normalizePlayerLook(malformed)');
    assert.equal(run('look[6]'), 0); assert.equal(run('look[15]'), 0); assert.equal(run('look[17][0]'), 0); assert.equal(run('look[17][1]'), 1);
    assert.doesNotThrow(() => run('composePersonPixels(scene, look, "front"); composePersonPortraitPixels(scene, look)'));
});
test('all ordinary hair or headwear parts render in map sprites and portraits', () => {
    const {run} = createCreator();
    assert.doesNotThrow(() => run('const look = normalizePlayerLook(PLAYER_LOOK); for(let gender = 0; gender < 2; gender++) for(let face = 0; face < NPC_FACES; face++) for(let hair = 0; hair < NPC_HAIRSTYLES; hair++) {look[14] = gender; look[1] = face; look[18] = hair; look[5] = 0; look[6] = hair; composePersonPortraitPixels(scene, look); composePersonPixels(scene, look, "front");} for(const hat of [0,1,2,3,4,6,7]) {look[5] = 1; look[6] = hat; composePersonPortraitPixels(scene, look); composePersonPixels(scene, look, "front");} for(let shirt = 0; shirt < NPC_SHIRTS; shirt++) {look[2] = shirt; composePersonPortraitPixels(scene, look);} for(let pants = 0; pants < NPC_PANTS_STYLES; pants++) {look[11] = pants; composePersonPixels(scene, look, "front");}'));
});
test('independent color sliders change shared portrait and sprite palettes without altering NPC ramps', () => {
    const {run} = createCreator(); run('const look = normalizePlayerLook(PLAYER_LOOK), before = getPersonPalette(look); look[17][0] = 0.5; const after = getPersonPalette(look)');
    assert.notEqual(run('before.hair[1]'), run('after.hair[1]')); assert.equal(run('before.shirt[1]'), run('after.shirt[1]'));
    run('look[17][2] = 0.5'); assert.notEqual(run('getPersonPalette(look).shirt[1]'), run('after.shirt[1]'));
});
