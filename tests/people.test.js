const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { decodePng } = require('../build-atlas');

function createPeople(seed = '13') {
    const image = decodePng('media/characters/people/parts.png'), storage = new Map();
    const context = vm.createContext({ TEST_MODE: false, URLSearchParams, window: { location: { search: '?seed=' + seed } }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, Phaser: { Math: { Clamp: (value, low, high) => Math.max(low, Math.min(high, value)) } }, getTerrainPixels: () => ({ width: image.width, height: image.height, data: image.rgba }) });
    const files = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'npc-names.js', 'npc-dialogue.js', 'art/people.js', 'world/terrain.js', 'world/decks.js', 'environment/props.js', 'environment/actors.js', 'environment/npcs.js'];
    vm.runInContext(files.map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    return code => vm.runInContext(code, context);
}

function solveRequestedSeed() {
    return createPeople()('makeNpcAppearanceSeed(13, 13, 4, [0, 0, 0, 0, 0, 1, 7, 5, 0, 0, 0, 5, 6, 0, 0, 1, 0, 99, 1])');
}

test('a reversed ordinary seed produces the requested rare resident near spawn', () => {
    const run = createPeople(solveRequestedSeed());
    run('const resident = findCellNpc(1, 0)');
    assert.equal(run('resident.tileX'), 13);
    assert.equal(run('resident.tileY'), 4);
    assert.deepEqual(JSON.parse(run('JSON.stringify(resident.look)')), [5, 0, 1, 7, 5, 1, 5, 5, 0, 6, 8, 1, 6, 6, 1]);
    assert.equal(run('WORLD_SEED'), 13);
    assert.equal(run('getTerrainType(0, 0)'), 'grass');
    assert.equal(run('(() => { const queue = [[0, 0]], seen = new Set(["0,0"]); for (let index = 0; index < queue.length; index++) { const [x, y] = queue[index]; if (x === 13 && y === 4) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, key = nx + "," + ny; if (Math.abs(nx) > 25 || Math.abs(ny) > 25 || seen.has(key) || !isNpcWalkableTile(nx, ny)) continue; seen.add(key); queue.push([nx, ny]); } } return false; })()'), true);
    assert.notEqual(run('JSON.stringify(createNpc(13, 5, null).look)'), run('JSON.stringify(resident.look)'));
});

test('the requested costume renders mixed vanity hair, pants, skin, and clothing colors', () => {
    const run = createPeople(solveRequestedSeed());
    run("const resident = findCellNpc(1, 0), colors = new Set(composePersonPixels({}, resident.look, 'front'));");
    for (const color of ['NPC_HAIR_COLORS[6][1]', 'NPC_ACCESSORY_COLORS[5][2]', 'NPC_SKIN_TONES[5][1]', 'NPC_SHIRT_COLORS[7][1]', 'NPC_PANTS_COLORS[5][1]', 'NPC_PANTS_COLORS[6][1]']) assert.equal(run('colors.has(' + color + ')'), true, color);
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
    for (const invalid of ['0', '-1', '1.5', 'abc', String(1n << 160n)]) assert.equal(createPeople(invalid)('getRequestedWorldSeed()'), null);
});

test('eye weights and wardrobe rarity retain their stated probabilities', () => {
    const run = createPeople();
    assert.deepEqual(JSON.parse(run('JSON.stringify(Array.from({length: 7}, (_, index) => Array.from({length: 100}, (_, roll) => getNpcEyeColor(roll)).filter(color => color === index).length))')), [64, 16, 7, 6, 4, 2, 1]);
    const counts = JSON.parse(run('JSON.stringify(Array.from({length: 10000}, (_, roll) => { const rolls = NPC_APPEARANCE_RADICES.map(() => 0); rolls[0] = roll; rolls[1] = roll % 100; getNpcAppearanceRolls = () => rolls; const npc = createNpc(13, 4, null); return [Number(npc.look[5] === 1 && npc.look[6] === 5), Number(npc.look[0] >= 5), Number(npc.look[3] !== npc.look[10] && npc.look[4] !== npc.look[12])]; }).reduce((counts, row) => counts.map((count, index) => count + row[index]), [0, 0, 0]))'));
    assert.deepEqual(counts, [1, 100, 10000]);
});
