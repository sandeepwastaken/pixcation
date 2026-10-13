const test = require('node:test');
const assert = require('node:assert/strict');
const {createPortraitPeople} = require('./portrait-fixture');
test('alternate makeup overlays render both supported faces without leaking into older portraits', () => {
    const {run} = createPortraitPeople(); run('const makeupLook = createNpc(13,4,null).look; makeupLook[14] = 1; makeupLook[5] = 0; makeupLook[6] = 0; makeupLook[20] = 0;'); for (const face of [0,1,2]) {run('makeupLook[1] = ' + face + '; makeupLook[20] = 0; var ordinaryMakeup = composePersonPortraitPixels(scene,makeupLook); makeupLook[20] = 1; var strongerMakeup = composePersonPortraitPixels(scene,makeupLook);'); assert.equal(run('ordinaryMakeup.data.some((value,index)=>value!==strongerMakeup.data[index])'), face !== 2);}
});
test('both mouth expressions share the resident dental variant and older faces always use ordinary teeth', () => {
    const {run} = createPortraitPeople(); run('const look=[0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0.8,0,undefined,undefined,0]; const ordinaryOpen=composePersonPortraitPixels(scene,look,"openMouth"), ordinaryGrin=composePersonPortraitPixels(scene,look,"grin"); look[19]=1; const canineOpen=composePersonPortraitPixels(scene,look,"openMouth"), canineGrin=composePersonPortraitPixels(scene,look,"grin")');
    assert.equal(run('getPersonMouthLayer(look,"openMouth")'), 'openMouth2'); assert.equal(run('getPersonMouthLayer(look,"grin")'), 'grin2'); assert.equal(run('ordinaryOpen.data.some((value,index)=>value!==canineOpen.data[index])'), true); assert.equal(run('ordinaryGrin.data.some((value,index)=>value!==canineGrin.data[index])'), true);
    run('look[1]=2'); assert.equal(run('getPersonMouthLayer(look,"openMouth")'), 'openMouth1'); assert.equal(run('getPersonMouthLayer(look,"grin")'), 'grin1');
});
const fs = require('node:fs');

test('the guide invitation appears once per session until an actual conversation and uses her joyful portrait', () => {
    const {run} = createPortraitPeople(); run(fs.readFileSync('src/ui/interactions.js', 'utf8'));
    run('guide = {}; dialogueContainer = {}; let invited = 0, shown; isMenuOpen = () => false; beginDialogue = (scene, nodes) => {invited++; shown = nodes;}; updateGuideInteraction(scene, false); updateGuideInteraction(scene, false);');
    assert.equal(run('invited'), 1); assert.equal(run('shown === GUIDE_INVITATION'), true);
    assert.equal(run('shown.intro.text'), "Hey! I'm the Guide. Come talk to me!");
    assert.equal(run('shown.intro.portraitEyesClosed'), true); assert.equal(run('shown.intro.portraitExpression'), 'grin');
    assert.equal(run('guideHasMetPlayer'), false);
    run('guideInvitationShown = false; updateGuideInteraction(scene, false)');
    assert.equal(run('invited'), 2);
    run('guideInvitationShown = false; guideHasMetPlayer = true; updateGuideInteraction(scene, false)');
    assert.equal(run('invited'), 2);
});

test('dismissing the invitation does not count as talking to the guide, but accepting or talking directly does', () => {
    const {run} = createPortraitPeople(); run(fs.readFileSync('src/ui/interactions.js', 'utf8'));
    run(fs.readFileSync('src/runtime/progress.js', 'utf8'));
    run('guide = {}; dialogueContainer = {}; dialogueOpen = true; dialogueNodes = GUIDE_INVITATION; stopDialogueTyping = hideSlidingPanel = () => {}; closeGuideDialogue(scene);');
    assert.equal(run('guideHasMetPlayer'), false);
    run('const next = GUIDE_INVITATION.intro.options[0].action(scene);');
    assert.equal(run('next'), 'intro'); assert.equal(run('dialogueNodes === GUIDE_DIALOGUE'), true);
    assert.equal(run('guideHasMetPlayer'), true); assert.equal(run('saveDirty'), true);
    assert.equal(run('playerStats.conversations'), 1);
    run('guideHasMetPlayer = false; isMenuOpen = () => false; beginDialogue = () => {}; openGuideDialogue(scene)');
    assert.equal(run('guideHasMetPlayer'), true);
});

test('joyful closed-eye expressions persist through speech and blinking, then reset on an ordinary line', () => {
    const {run} = createPortraitPeople();
    run('dialogueOpen = true; dialoguePortrait = {texture: {key: "none"}, portraitEyesClosed: true, portraitBlinkState: {next: 100, until: 0, closed: false}, setTexture(key) {this.texture.key = key; return this;}}; setDialoguePortraitPose(scene, null, "grin"); updateDialoguePortraitBlink(scene, 10000);');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-grin-closed');
    run('setDialoguePortraitPose(scene, null, "openMouth"); updateDialoguePortraitBlink(scene, 20000);');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-openMouth-closed');
    run('dialoguePortrait.portraitEyesClosed = false; setDialoguePortraitPose(scene, null, "normal");');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-normal-open');
});

test('guide mouth poses and eyelids compose all six independent cached combinations', () => {
    const {run, read, textures} = createPortraitPeople();
    for (const expression of ['normal', 'grin', 'openMouth']) for (const closed of [false, true]) {
        const portrait = run('composeGuidePortraitPixels(scene, ' + JSON.stringify(expression) + ', ' + closed + ')');
        assert.equal(portrait.width, 55); assert.equal(portrait.height, 62);
        if (closed) {const eyes = read('characters/guide/portraits/eyes-closed'); for (let i = 0; i < eyes.data.length; i += 4) if (eyes.data[i + 3]) assert.deepEqual([...portrait.data.slice(i, i + 4)], [...eyes.data.slice(i, i + 4)]);}
        run('getGuidePortraitTexture(scene, ' + JSON.stringify(expression) + ', ' + closed + '); getGuidePortraitTexture(scene, ' + JSON.stringify(expression) + ', ' + closed + ');');
    }
    assert.equal(textures.size, 6);
    const eyes = read('characters/guide/portraits/eyes-closed');
    for (const mouth of ['grin', 'open-mouth']) {const pixels = read('characters/guide/portraits/' + mouth); for (let i = 3; i < eyes.data.length; i += 4) assert.ok(!eyes.data[i] || !pixels.data[i]);}
});

test('guide blinking preserves her speaking pose and reopens her eyes after a short blink', () => {
    const {run} = createPortraitPeople();
    run('dialogueOpen = true; dialoguePortrait = {texture: {key: "none"}, portraitBlinkState: {next: 100, until: 0, closed: false}, setTexture(key) {this.texture.key = key; return this;}}; setDialoguePortraitPose(scene, null, "grin"); updateDialoguePortraitBlink(scene, 100);');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-grin-closed');
    run('setDialoguePortraitPose(scene, null, "openMouth");');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-openMouth-closed');
    run('updateDialoguePortraitBlink(scene, 221)');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-openMouth-open');
    run('dialogueNpc = {id: 1}; updateDialoguePortraitBlink(scene, 999999)');
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-openMouth-open');
});

test('scenic backgrounds remain behind NPC faces instead of hiding their colors', () => {
    const {run} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look; look[1] = 0; look[8] = 0; const portrait = composePersonPortraitPixels(scene, look), background = getTerrainPixels(scene, "characters/people/portraits/background");');
    assert.equal(run('Array.from(portrait.data.slice((30 * 55 + 24) * 4, (30 * 55 + 24) * 4 + 3)).join() === Array.from(background.data.slice((30 * 55 + 24) * 4, (30 * 55 + 24) * 4 + 3)).join()'), false);
});

test('four-choice dialogue renders every label and keeps mouse targets and highlights inside the panel', () => {
    const {run} = createPortraitPeople();
    for (const file of ['src/ui/elements.js', 'src/ui/panels.js', 'src/ui/guide-panel.js', 'src/ui/interactions.js', 'src/ui/market-controls.js']) run(fs.readFileSync(file, 'utf8'));
    run('const rectangles = [], graphics = () => ({scene, clear() {rectangles.length = 0; return this;}, fillStyle() {return this;}, fillRect(x, y, width, height) {rectangles.push({x, y, width, height}); return this;}}); scene.tweens = {killTweensOf() {}, add(config) {config.targets.y = config.y;}}; scene.add = {graphics, image(x, y, key) {return {x, y, texture: {key}, setOrigin() {return this;}};}}; drawPanelFrame = panel => panel; createTextLayer = () => ({}); createUIText = (layer, x, y, color, width) => ({x, y, width, style: {}}); addPanelContainer = () => ({}); addHudLayer = () => ({}); createGuideDialogueUI(scene); dialogueNode = "chat"; dialogueNodes = {chat: {options: [{label: "Any rumors?"}, {label: "Your company?"}, {label: "Your plans?"}, {label: "Bye"}]}};');
    for (const selected of [0, 1, 2, 3]) {
        run('selectedDialogueOption = ' + selected + '; refreshGuideDialogueOptions();');
        assert.equal(run('dialogueOptionTexts.length'), 4);
        assert.equal(run('dialogueOptionTexts[3].textContent'), 'Bye');
        assert.ok(run('dialogueHighlight.y + dialogueHighlight.optionHeight <= 74'));
        assert.equal(run('getDialogueOptionAt(230, DIALOGUE_VISIBLE_Y + dialogueHighlight.y + 4)'), selected);
    }
    assert.ok(run('dialogueOptionTexts.every(text => parseInt(text.style.top) + parseInt(text.style.fontSize) <= 74)'));
    assert.equal(run('getDialogueOptionAt(230, DIALOGUE_VISIBLE_Y + 77)'), -1);
    run('dialogueNodes.chat.options.pop(); selectedDialogueOption = 2; refreshGuideDialogueOptions();');
    assert.equal(run('dialogueOptionTexts[3].style.display'), 'none');
    assert.equal(run('dialogueOptionTexts[0].style.fontSize'), '16px');
    assert.equal(run('dialogueHighlight.optionHeight'), 17);
    assert.equal(run('getDialogueOptionAt(230, DIALOGUE_VISIBLE_Y + dialogueHighlight.y + 4)'), 2);
});

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
    for (let pixel = 0; pixel < 55 * 62; pixel++) {const i = pixel * 4, x = pixel % 55, y = Math.floor(pixel / 55); if (x < 3 || y < 3 || x >= 52 || y >= 59) assert.deepEqual([...portrait.data.slice(i, i + 4)], [...background.data.slice(i, i + 4)]);}
});

test('the new appearance seed naturally produces Emz with a matching layered portrait near spawn', () => {
    const {run} = createPortraitPeople();
    const seed = run('makeNpcAppearanceSeed(13, 13, 4, [0, 0, 0, 52428, 0, 87, 52, 90, 0, 0, 0, 64, 99, 0, 29, 8, 99, 0, 1, 0, 0, 0, 0, 0, 1], 2n)');
    const reversed = createPortraitPeople(seed);
    reversed.run('const resident = findCellNpc(1, 0), portrait = composePersonPortraitPixels(scene, resident.look);');
    assert.equal(reversed.run('resident.name'), 'Emz');
    assert.equal(reversed.run('resident.tileX'), 13); assert.equal(reversed.run('resident.tileY'), 4);
    assert.deepEqual(JSON.parse(reversed.run('JSON.stringify(resident.look)')), [5, 0, 1, 7, 5, 1, 5, 5, 0, 6, 8, 1, 6, 0, 1, 0.8, 0, [0, 0, 0, 0, 0, 0, 0], null, 1, 1]);
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
    assert.ok(run('dialoguePortrait.texture.key.startsWith("guide-portrait-")'));
    assert.equal(run('dialoguePortrait.portraitEyesClosed'), true);
    assert.ok(run('dialoguePortrait.texture.key.endsWith("-closed")'));
    assert.ok(run('dialoguePortrait.texture.key.includes("-grin-")'));
    assert.equal(run('getGuidePortraitTexture(scene, "grin")'), run('getGuidePortraitTexture(scene, "grin")'));
    run('showGuideDialogueNode(scene, "intro"); while (callbacks.length) callbacks.shift()();');
    assert.equal(run('dialoguePortrait.portraitEyesClosed'), false);
    assert.equal(run('dialoguePortrait.texture.key'), 'guide-portrait-normal-open');
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
    assert.equal(run('(() => {for (let pixel = 0; pixel < 55 * 62; pixel++) {const i = pixel * 4, x = pixel % 55, y = Math.floor(pixel / 55); if (!head.data[i + 3] || x < 3 || y < 3 || x >= 52 || y >= 59) continue; const expected = colors.get(head.data[i] << 16 | head.data[i + 1] << 8 | head.data[i + 2]); const actual = portrait.data[i] << 16 | portrait.data[i + 1] << 8 | portrait.data[i + 2]; if (expected !== actual) return false;} return true;})()'), true);
});

test('portrait mirroring follows the map appearance and expressions preserve the same outfit', () => {
    const {run} = createPortraitPeople();
    run('const look = createNpc(13, 4, null).look; look[8] = 0; const first = composePersonPortraitPixels(scene, look); look[8] = 1; const flipped = composePersonPortraitPixels(scene, look);');
    assert.equal(run('(() => {const background = getTerrainPixels(scene, "characters/people/portraits/background"), original = background.data; background.data = new Uint8ClampedArray(original.length); look[8] = 0; const foreground = composePersonPortraitPixels(scene, look); background.data = original; return flipped.data.every((value, index) => {const pixel = Math.floor(index / 4), x = pixel % 55, y = Math.floor(pixel / 55), mirrored = (y * 55 + 54 - x) * 4; return value === (foreground.data[mirrored + 3] && x >= 3 && x < 52 && y >= 3 && y < 59 ? foreground.data[mirrored + index % 4] : original[index]);});})()'), true);
});
