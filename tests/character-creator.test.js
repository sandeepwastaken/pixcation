const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createPortraitPeople} = require('./portrait-fixture');
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
