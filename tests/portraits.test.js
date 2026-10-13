const test = require('node:test');
const assert = require('node:assert/strict');
const {createPortraitPeople} = require('./portrait-fixture');
const fs = require('node:fs');

test('native-size portraits fit the dialogue panel without overlapping the name, text, or options', () => {
    const {run} = createPortraitPeople();
    run(fs.readFileSync('src/ui/guide-panel.js', 'utf8'));
    run(fs.readFileSync('src/ui/elements.js', 'utf8'));
    run('const graphics = () => ({fillStyle() {return this;}, fillRect() {return this;}}); scene.add = {graphics, image(x, y, key) {return {x, y, texture: {key}, setOrigin() {return this;}};}}; drawPanelFrame = panel => panel; createTextLayer = () => ({}); createUIText = (layer, x, y, color, width) => ({x, y, width, style: {}}); addPanelContainer = (scene, y, depth, children) => ({y, depth, children}); addHudLayer = () => ({}); createGuideDialogueUI(scene);');
    const portrait = run('dialoguePortrait'), texture = run('scene.textures.exists(dialoguePortrait.texture.key)');
    assert.equal(texture, true); assert.equal(portrait.x, 12); assert.equal(portrait.y, 8);
    assert.ok(run('dialogueName.x >= dialoguePortrait.x + 55 + 8'));
    assert.ok(run('dialogueText.x + dialogueText.width < DIALOGUE_OPTION_X - 7'));
    assert.ok(portrait.y + 62 < 75);
});

test('portrait frames stay in front of shoulders and all layers without covering their interior', () => {
    const {run, read} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look; look[8] = 0; const portrait = composePersonPortraitPixels(scene, look);');
    const portrait = run('portrait'), background = read('characters/people/portraits/background');
    for (let pixel = 0; pixel < 55 * 62; pixel++) {const i = pixel * 4, color = background.data[i] << 16 | background.data[i + 1] << 8 | background.data[i + 2]; if (color !== 0x32180f) assert.deepEqual([...portrait.data.slice(i, i + 4)], [...background.data.slice(i, i + 4)]);}
});

test('the new appearance seed naturally produces Emz with a matching layered portrait near spawn', () => {
    const {run} = createPortraitPeople();
    const seed = run('makeNpcAppearanceSeed(13, 13, 4, [0, 0, 0, 52428, 0, 1, 7, 5, 0, 0, 0, 5, 6, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], 2n)');
    const reversed = createPortraitPeople(seed);
    reversed.run('const resident = findCellNpc(1, 0), portrait = composePersonPortraitPixels(scene, resident.look);');
    assert.equal(reversed.run('resident.name'), 'Emz');
    assert.equal(reversed.run('resident.tileX'), 13); assert.equal(reversed.run('resident.tileY'), 4);
    assert.deepEqual(JSON.parse(reversed.run('JSON.stringify(resident.look)')), [5, 0, 1, 7, 5, 1, 5, 5, 0, 6, 8, 1, 6, 0, 1, 0.8, 0]);
    assert.equal(reversed.run('WORLD_SEED'), 13);
    assert.equal(reversed.run('portrait.width'), 55); assert.equal(reversed.run('portrait.height'), 62);
});

test('dialogue animates speaking mouths and settles back to the node expression for NPCs and guides', () => {
    const {run} = createPortraitPeople();
    run(fs.readFileSync('src/ui/interactions.js', 'utf8'));
    run('const look = createNpc(13, 4, null).look, writes = [], callbacks = []; scene.time = {delayedCall(delay, callback) {callbacks.push(callback); return {remove() {callbacks.length = 0;}};}}; dialoguePortrait = {texture: {key: "old"}, setTexture(key) {this.texture.key = key; writes.push(key); return this;}, setScale(scale) {this.scale = scale;}}; dialogueText = {replaceChildren() {}}; dialogueOptionTexts = []; dialogueHighlight = {setVisible() {}}; document = {createTextNode() {return {appendData() {}};}}; layoutDialogueText = refreshGuideDialogueOptions = () => {}; dialogueNodes = {intro: {portraitLook: look, portraitExpression: "grin", text: "Hello friend!", options: []}}; showGuideDialogueNode(scene, "intro"); while (callbacks.length) callbacks.shift()();');
    assert.ok(run('writes.some(key => key.endsWith("-openMouth"))'));
    assert.ok(run('dialoguePortrait.texture.key.endsWith("-grin")'));
    assert.equal(run('dialoguePortrait.scale'), 1); assert.equal(run('dialoguePortrait.y'), 8);
    run('dialogueNodes = GUIDE_DIALOGUE; showGuideDialogueNode(scene, "greet"); while (callbacks.length) callbacks.shift()();');
    assert.ok(run('dialoguePortrait.texture.key.startsWith("portrait-")'));
    assert.ok(run('dialoguePortrait.texture.key.endsWith("-grin")'));
    assert.equal(run('getGuidePortraitLook(scene)'), run('getGuidePortraitLook(scene)'));
});

test('every portrait part, face, gender modifier, and expression composes without unmapped colors', () => {
    const {run} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look; look[8] = 0;');
    for (const face of [0, 1, 2]) for (const feminine of [0, 1]) for (const expression of ['normal', 'openMouth', 'grin']) for (const accessory of [0, 1]) {
        run('look[1] = ' + face + '; look[14] = ' + feminine + '; look[5] = ' + accessory + '; look[7] = 0');
        for (let part = 0; part < (accessory ? 8 : 10); part++) {
            run('look[6] = ' + part + '; look[2] = ' + (part % 10));
            const portrait = run('composePersonPortraitPixels(scene, look, ' + JSON.stringify(expression) + ')');
            assert.equal(portrait.width, 55); assert.equal(portrait.height, 62);
            assert.ok(portrait.data.every((value, index) => index % 4 !== 3 || value === 0 || value === 255));
        }
    }
});

test('portrait palettes retain independent clothing accents and iris shades with hair-colored eyelashes', () => {
    const {run} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look, palette = getPersonPalette(look), colors = getPortraitColorMap(look);');
    assert.equal(run('colors.get(0x001eff)'), run('palette.shirt[1]'));
    assert.equal(run('colors.get(0x00d9ff)'), run('palette.shirtAccent'));
    assert.notEqual(run('colors.get(0x00c3e5)'), run('colors.get(0x00d9ff)'));
    assert.equal(run('colors.get(0x8f1010)'), run('palette.eye'));
    assert.notEqual(run('colors.get(0x660000)'), run('colors.get(0xb72323)'));
    assert.equal(run('colors.get(0x1a0000)'), run('mixPortraitColor(palette.hair[0], 0, 0.45)'));
    assert.equal(run('colors.get(0xe90000)'), run('mixPortraitColor(palette.skin[1], palette.skin[2], 0.5)'));
});

test('portraits cache expressions separately and reuse textures for repeated dialogue nodes', () => {
    const {run, textures} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look; getPersonPortraitTexture(scene, look); getPersonPortraitTexture(scene, look); getPersonPortraitTexture(scene, look, "grin"); getPersonPortraitTexture(scene, look, "openMouth");');
    assert.equal(textures.size, 3);
    assert.ok([...textures.values()].every(texture => texture.width === 55 && texture.height === 62));
});

test('masked vanity is layered over expressions instead of drawing a mouth over the mask', () => {
    const {run} = createPortraitPeople();
    run('const look = [5, 0, 1, 7, 5, 1, 5, 5, 0, 6, 8, 1, 6, 0, 1, 0.8, 0], portrait = composePersonPortraitPixels(scene, look, "grin"), head = getTerrainPixels(scene, "characters/people/portraits/vanity6"), background = getTerrainPixels(scene, "characters/people/portraits/background"), colors = getPortraitColorMap(look);');
    assert.equal(run('(() => {for (let pixel = 0; pixel < 55 * 62; pixel++) {const i = pixel * 4; if (!head.data[i + 3] || (background.data[i] << 16 | background.data[i + 1] << 8 | background.data[i + 2]) !== 0x32180f) continue; const expected = colors.get(head.data[i] << 16 | head.data[i + 1] << 8 | head.data[i + 2]); const actual = portrait.data[i] << 16 | portrait.data[i + 1] << 8 | portrait.data[i + 2]; if (expected !== actual) return false;} return true;})()'), true);
});

test('portrait mirroring follows the map appearance and expressions preserve the same outfit', () => {
    const {run} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look; look[8] = 0; const first = composePersonPortraitPixels(scene, look); look[8] = 1; const flipped = composePersonPortraitPixels(scene, look);');
    assert.equal(run('first.data.every((value, index) => value === flipped.data[(Math.floor(index / 4 / 55) * 55 + 54 - Math.floor(index / 4) % 55) * 4 + index % 4])'), true);
});
