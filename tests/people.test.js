const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { decodePng } = require('../build-atlas');

test('both contributors name additions survive merging the weighted name generator', () => {
    const run = createPeople();
    for (const name of ['Ansel', 'Arham']) assert.equal(run('NPC_FIRST_NAMES.filter(name => name === ' + JSON.stringify(name) + ').length'), 1);
});

test('uncommon names use generic weighted data rather than character-specific generation branches', () => {
    const run = createPeople();
    run('NPC_NAME_WEIGHTS.set("Other", 2)');
    assert.equal(run('getNpcRareName(0.0001)'), 'Other');
    assert.equal(run('getNpcRareName(0.0002)'), 'Other');
    assert.equal(run('getNpcRareName(0.0004)'), null);
});

test('natural and pastel skin ramps interpolate across hundreds of distinct palettes', () => {
    const run = createPeople();
    for (const pastel of [false, true]) {
        assert.ok(run('new Set(Array.from({length: 256}, (_, index) => JSON.stringify(getPersonSkinRamp(' + pastel + ', index / 255)))).size') > 200);
        assert.deepEqual(JSON.parse(run('JSON.stringify(getPersonSkinRamp(' + pastel + ', 0.8))')), JSON.parse(run('JSON.stringify(getPersonSkinRamp(' + pastel + ', 52428 / 65535))')));
    }
    run('const varied = createNpc(13, 4, null).look; const basic = getPersonPalette(varied); varied[16] = 18928771; const blended = getPersonPalette(varied);');
    assert.notEqual(run('JSON.stringify(basic.shirt)'), run('JSON.stringify(blended.shirt)'));
    assert.notEqual(run('JSON.stringify(basic.hair)'), run('JSON.stringify(blended.hair)'));
});

test('Emz occurs on exactly one of ten thousand independent name rolls', () => {
    const run = createPeople();
    run('const rareNames = NPC_APPEARANCE_RADICES.map(() => 0); rareNames[0] = 1; rareNames[8] = 99; getNpcAppearanceRolls = () => rareNames; let emz = 0; for(let index = 0; index < 10000; index++) {rareNames[22] = index; rareNames[19] = index; if(createNpc(13, 4, null).name.split(" ")[0] === "Emz") emz++;}');
    assert.equal(run('emz'), 1);
});

test('blink eyelids use the mid skin tone and retain every other source pixel', () => {
    const run = createPeople(solveRequestedSeed());
    run('const resident = findCellNpc(1, 0), open = composePersonPixels({}, resident.look, "front"), closed = composePersonPixels({}, resident.look, "front", true), mid = getPersonPalette(resident.look).skin[1];');
    assert.equal(run('closed[6 * 16 + 6]'), run('mid'));
    assert.equal(run('open[6 * 16 + 6]'), run('NPC_EYE_COLORS[0]'));
    assert.equal(run('open.every((color, index) => closed[index] === color || color === NPC_EYE_COLORS[0] && closed[index] === mid)'), true);
});

test('blink timing closes and reopens without changing facing, animation frame, or tint', () => {
    const run = createPeople();
    run('const actor = {x: 0, y: 0, visible: true, tint: 0xdbdbdb, texture: {key: "character-frontwalk1"}, personBlinkState: {next: 100, until: 0, closed: false}, setTexture(key) {this.texture.key = key;}}; const scene = {textures: {exists: () => true}}; character = actor;');
    run('updatePersonBlink(scene, actor, PLAYER_LOOK, "front", 1, 100)');
    assert.equal(run('actor.texture.key'), 'character-frontwalk1-blink');
    run('updatePersonBlink(scene, actor, PLAYER_LOOK, "front", 1, 220)');
    assert.equal(run('actor.texture.key'), 'character-frontwalk1');
    assert.equal(run('actor.tint'), 0xdbdbdb);
});

function createPeople(seed = '13') {
    const image = decodePng('media/characters/people/parts.png'), storage = new Map();
    const context = vm.createContext({ TEST_MODE: false, URLSearchParams, window: { location: { search: '?seed=' + seed } }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, Phaser: { Math: { Clamp: (value, low, high) => Math.max(low, Math.min(high, value)) } }, getTerrainPixels: () => ({ width: image.width, height: image.height, data: image.rgba }) });
    const files = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'npc-names.js', 'npc-dialogue.js', 'art/people.js', 'world/terrain.js', 'world/decks.js', 'environment/props.js', 'environment/actors.js', 'environment/npcs.js'];
    vm.runInContext(files.map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    return code => vm.runInContext(code, context);
}

function solveRequestedSeed() {
    return createPeople()('makeNpcAppearanceSeed(13, 13, 4, [0, 0, 0, 52428, 0, 1, 7, 5, 0, 0, 0, 5, 6, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0])');
}

test('a reversed ordinary seed produces the requested rare resident near spawn', () => {
    const run = createPeople(solveRequestedSeed());
    run('const resident = findCellNpc(1, 0)');
    assert.equal(run('resident.tileX'), 13);
    assert.equal(run('resident.tileY'), 4);
    assert.equal(run('resident.name'), 'Emz');
    assert.deepEqual(JSON.parse(run('JSON.stringify(resident.look)')), [5, 0, 1, 7, 5, 1, 5, 5, 0, 6, 8, 1, 6, 0, 1, 0.8, 0]);
    assert.equal(run('WORLD_SEED'), 13);
    assert.equal(run('getTerrainType(0, 0)'), 'grass');
    assert.equal(run('(() => { const queue = [[0, 0]], seen = new Set(["0,0"]); for (let index = 0; index < queue.length; index++) { const [x, y] = queue[index]; if (x === 13 && y === 4) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, key = nx + "," + ny; if (Math.abs(nx) > 25 || Math.abs(ny) > 25 || seen.has(key) || !isNpcWalkableTile(nx, ny)) continue; seen.add(key); queue.push([nx, ny]); } } return false; })()'), true);
    assert.notEqual(run('JSON.stringify(createNpc(13, 5, null).look)'), run('JSON.stringify(resident.look)'));
});

test('the requested costume renders mixed vanity hair, pants, skin, and clothing colors', () => {
    const run = createPeople(solveRequestedSeed());
    run("const resident = findCellNpc(1, 0), colors = new Set(composePersonPixels({}, resident.look, 'front'));");
    for (const color of ['NPC_HAIR_COLORS[6][1]', 'NPC_ACCESSORY_COLORS[5][2]', 'NPC_SKIN_TONES[5][1]', 'NPC_SHIRT_COLORS[7][1]', 'NPC_PANTS_COLORS[5][0]', 'NPC_PANTS_COLORS[5][1]', 'NPC_PANTS_COLORS[6][1]', 'NPC_EYE_COLORS[0]']) assert.equal(run('colors.has(' + color + ')'), true, color);
});

test('eyes recolor independently from skin shadows and survive mirroring', () => {
    const run = createPeople();
    run("const look = [0, 1, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 1, 5, 0], front = composePersonPixels({}, look, 'front'), left = composePersonPixels({}, look, 'left'), right = composePersonPixels({}, look, 'right')");
    assert.equal(run('front[6 * NPC_PART_SIZE + 6]'), run('NPC_EYE_COLORS[5]'));
    assert.equal(run('front[7 * NPC_PART_SIZE + 6]'), run('NPC_EYE_COLORS[5]'));
    assert.deepEqual(JSON.parse(run('JSON.stringify(right)')), JSON.parse(run('JSON.stringify(mirrorPersonPixels(left))')));
});

test('appearance seeds reverse arbitrary combinations and preserve isolated saves', () => {
    const run = createPeople();
    run('const rolls = NPC_APPEARANCE_RADICES.map((radix, index) => (index * 17 + 3) % radix)');
    const seed = run('makeNpcAppearanceSeed(71, -8, 29, rolls, 41n)');
    const reversed = createPeople(seed);
    assert.deepEqual(JSON.parse(reversed('JSON.stringify(getNpcAppearanceRolls(-8, 29))')), JSON.parse(run('JSON.stringify(rolls)')));
    assert.equal(reversed('WORLD_SEED'), 71);
    assert.equal(reversed('SAVE_KEY'), 'pixcation-save-v1:' + seed);
    assert.notEqual(reversed('SAVE_KEY'), run('SAVE_KEY'));
    for (const invalid of ['0', '-1', '1.5', 'abc', String(1n << 288n)]) assert.equal(createPeople(invalid)('getRequestedWorldSeed()'), null);
});

test('eye weights and wardrobe rarity retain their stated probabilities', () => {
    const run = createPeople();
    assert.deepEqual(JSON.parse(run('JSON.stringify(Array.from({length: 7}, (_, index) => Array.from({length: 100}, (_, roll) => getNpcEyeColor(roll)).filter(color => color === index).length))')), [64, 16, 7, 6, 4, 2, 1]);
    const counts = JSON.parse(run('JSON.stringify(Array.from({length: 10000}, (_, roll) => { const rolls = NPC_APPEARANCE_RADICES.map(() => 0); rolls[0] = roll; rolls[1] = roll % 100; getNpcAppearanceRolls = () => rolls; const npc = createNpc(13, 4, null); return [Number(npc.look[5] === 1 && npc.look[6] === 5), Number(npc.look[0] >= 5), Number(npc.look[3] !== npc.look[10] && npc.look[4] !== npc.look[12])]; }).reduce((counts, row) => counts.map((count, index) => count + row[index]), [0, 0, 0]))'));
    assert.deepEqual(counts, [1, 100, 10000]);
});

test('all pants styles shade their primary color separately from the pink-purple accent', () => {
    const run = createPeople();
    for (let style = 0; style < 5; style++) for (const direction of ['back', 'front', 'left', 'right']) {
        run('constituentLook = [0, 0, 0, 0, 5, 1, 0, 0, 0, 0, 1, ' + style + ', 6, 0, 0]; composed = composePersonPixels({}, constituentLook, ' + JSON.stringify(direction) + ');');
        assert.equal(run('(() => { const sheet = getTerrainPixels({}, "character-parts"), column = ' + JSON.stringify(direction) + ' === "back" ? 0 : ' + JSON.stringify(direction) + ' === "front" ? 1 : 2, mirror = ' + JSON.stringify(direction) + ' === "right", colors = new Map([[0x4a0067, NPC_PANTS_COLORS[5][0]], [0xb700ff, NPC_PANTS_COLORS[5][1]], [0xdf8fff, NPC_PANTS_COLORS[6][1]]]); for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { const source = ((' + (style + 2) + ' * 16 + y) * sheet.width + (9 + column) * 16 + (mirror ? 15 - x : x)) * 4, color = sheet.data[source] << 16 | sheet.data[source + 1] << 8 | sheet.data[source + 2]; if (colors.has(color) && composed[(y + 8) * 16 + x] !== colors.get(color)) return false; } return true; })()'), true, 'pants ' + (style + 1) + ' ' + direction);
    }
});

test('exactly one of five surname rolls produces a first name only', () => {
    const run = createPeople();
    run('const nameRolls = NPC_APPEARANCE_RADICES.map(() => 0); nameRolls[18] = 1; nameRolls[19] = NPC_FEMININE_FIRST_NAMES.indexOf("Emz"); getNpcAppearanceRolls = () => nameRolls;');
    const names = Array.from({length: 5}, (_, roll) => run('nameRolls[20] = ' + roll + '; createNpc(13, 4, null).name'));
    assert.equal(names.filter(name => !name.includes(' ')).length, 1);
    assert.equal(names[0], 'Emz');
    assert.equal(names.slice(1).every(name => name.startsWith('Emz ')), true);
});

test('all specified hair, clothing, and pants rows obey their gender rules and remain available', () => {
    for (const feminine of [0, 1]) {
        const run = createPeople();
        run('const wardrobeRolls = NPC_APPEARANCE_RADICES.map(() => 0); wardrobeRolls[0] = 1; wardrobeRolls[22] = 1; wardrobeRolls[8] = 99; wardrobeRolls[18] = ' + feminine + '; getNpcAppearanceRolls = () => wardrobeRolls; const looks = []; for(let roll = 0; roll < 720; roll++) {wardrobeRolls[5] = roll; wardrobeRolls[10] = roll % 120; wardrobeRolls[15] = roll % 20; looks.push(createNpc(13, 4, null).look);}');
        for (const [index, allowed] of [[6, feminine ? [0, 2, 7, 8, 9] : [0, 1, 3, 4, 5, 6, 8, 9]], [2, feminine ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 2, 4, 6, 7, 8]], [11, feminine ? [0, 1, 2, 3, 4] : [0, 2, 3, 4]]]) assert.deepEqual(JSON.parse(run('JSON.stringify([...new Set(looks.map(look => look[' + index + ']))].sort((a, b) => a - b))')), allowed);
    }
});

test('unisex vanity preferences retain both genders without admitting female-only rows to men', () => {
    const counts = [];
    for (const feminine of [0, 1]) {
        const run = createPeople();
        run('const vanityRolls = NPC_APPEARANCE_RADICES.map(() => 0); vanityRolls[0] = 1; vanityRolls[22] = 1; vanityRolls[18] = ' + feminine + '; getNpcAppearanceRolls = () => vanityRolls; const counts = new Array(7).fill(0); for(let roll = 0; roll < 143; roll++) {vanityRolls[9] = roll; counts[createNpc(13, 4, null).look[6]]++;}');
        counts.push(JSON.parse(run('JSON.stringify(counts)')));
    }
    assert.equal(counts[0][4], 0); assert.equal(counts[0][5], 0);
    assert.ok(counts[1][4] > 0);
    assert.ok(counts[1][3] > counts[0][3] && counts[0][3] > 0);
    assert.ok(counts[0][6] > counts[1][6] && counts[1][6] > 0);
    const rare = createPeople();
    rare('const rareRolls = NPC_APPEARANCE_RADICES.map(() => 0); getNpcAppearanceRolls = () => rareRolls; const resident = createNpc(13, 4, null);');
    assert.equal(rare('resident.look[14]'), 1); assert.equal(rare('resident.look[6]'), 5);
    assert.equal(rare('NPC_FEMININE_FIRST_NAMES.includes(resident.name.split(" ")[0])'), true);
});
