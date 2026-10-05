const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createWorld(waterPixels, tileOptions = {}) {
    const context = vm.createContext({ waterPixels, tileOptions });
    const source = ['runtime/settings.js', 'runtime/state.js', 'world/surfaces.js', 'runtime/character.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        const tiles = new Map();
        function getWorldTile(x, y) {
            const key = x + ',' + y;
            if (!tiles.has(key)) {
                const water = new Uint8Array(TILE_SIZE * TILE_SIZE);
                for (const [px, py] of waterPixels) {
                    if (Math.floor(px / TILE_SIZE) === x && Math.floor(py / TILE_SIZE) === y) {
                        water[(py - y * TILE_SIZE) * TILE_SIZE + px - x * TILE_SIZE] = 1;
                    }
                }
                tiles.set(key, { baseKey: 'water', surface: { water }, ...tileOptions });
            }
            return tiles.get(key);
        }
        function getPropAt() { return null; }
    `, context);
    return code => vm.runInContext(code, context);
}

test('water collisions match the hitbox across negative coordinates and tile edges', () => {
    const waterPixels = [[-17,-17],[-16,-16],[-1,-1],[0,0],[15,15],[16,16],[31,31]];
    const run = createWorld(waterPixels);
    for (let y = -35; y <= 35; y++) {
        for (let x = -35; x <= 35; x++) {
            const blocked = waterPixels.some(([px, py]) => px >= x + 4 && px < x + 12 && py >= y + 12 && py < y + 16);
            assert.equal(run(`canCharacterOccupy(null, ${x}, ${y})`), !blocked, `position ${x},${y}`);
        }
    }
});

test('fractional positions keep pixel-array sampling behavior', () => {
    const run = createWorld([[0,0]]);
    assert.equal(run('canCharacterOccupy(null, -4, -12)'), false);
    assert.equal(run('canCharacterOccupy(null, -4.25, -12)'), false);
    assert.equal(run('canCharacterOccupy(null, -3.75, -12)'), true);
    assert.equal(run('canCharacterOccupy(null, -4, -11.75)'), true);
});

test('solid tiles block and patched tiles use their remaining water pixels', () => {
    assert.equal(createWorld([], { blocking: 'full' })('canCharacterOccupy(null, 0, 0)'), false);
    assert.equal(createWorld([], { blocking: 'full', patches: [{}] })('canCharacterOccupy(null, 0, 0)'), true);
    assert.equal(createWorld([[4,12]], { blocking: 'full', patches: [{}] })('canCharacterOccupy(null, 0, 0)'), false);
});

test('diagonal input slides up and around a one pixel corner', () => {
    const waterPixels = [];
    for (let y = -64; y < 64; y++) for (let x = -64; x < (y < 0 ? 1 : 0); x++) waterPixels.push([x, y]);
    const run = createWorld(waterPixels);
    run('character = { x: -4, y: -12 }; characterMoveRemainderX = 0; characterMoveRemainderY = 0;');
    assert.equal(run('canCharacterOccupy(null, character.x, character.y)'), true);
    assert.equal(run('canCharacterOccupy(null, character.x, character.y - 1)'), false);
    assert.equal(run('canCharacterOccupy(null, character.x - 1, character.y)'), false);
    for (let frame = 0; frame < 30; frame++) run('moveCharacterBy(null, -1, -1, -1, -1)');
    assert.ok(run('character.y') <= -12 - 20, `stuck at ${run('character.y')}`);
});

test('diagonal input against a forty five degree shore does not slide', () => {
    const waterPixels = [];
    for (let y = -64; y < 64; y++) for (let x = -64; x < 64; x++) if (x + y < 0) waterPixels.push([x, y]);
    const run = createWorld(waterPixels);
    run('character = { x: -8, y: -8 }; characterMoveRemainderX = 0; characterMoveRemainderY = 0;');
    assert.equal(run('canCharacterOccupy(null, character.x, character.y)'), true);
    for (let frame = 0; frame < 30; frame++) run('moveCharacterBy(null, -1, -1, -1, -1)');
    assert.deepEqual([run('character.x'), run('character.y')], [-8, -8]);
});
