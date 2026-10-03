const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createWorld() {
    const context = vm.createContext({});
    const source = ['runtime/settings.js', 'runtime/state.js', 'fish/regions.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        function getChunkKey(x, y) { return x + ',' + y; }
        function addChunk(x, y, region = 1) {
            const chunk = { pixelX: x * CHUNK_PIXEL_SIZE, pixelY: y * CHUNK_PIXEL_SIZE,
                shoreDistances: new Uint16Array(CHUNK_PIXEL_SIZE ** 2).fill(30),
                fishRegions: new Uint16Array(CHUNK_PIXEL_SIZE ** 2).fill(region) };
            loadedChunks.set(getChunkKey(x, y), chunk);
            return chunk;
        }
        const chunk = addChunk(0, 0);
        const fish = { x: 1.5, y: 1.5, region: 1, radius: 2 };
        let swimChecks = 0;
        const checkWater = canFishSwim;
        canFishSwim = (...args) => { swimChecks++; return checkWater(...args); };
    `, context);
    return code => vm.runInContext(code, context);
}

test('invalid destinations reject a route with one water check', () => {
    const run = createWorld();
    run('chunk.shoreDistances[getChunkPixelIndex(chunk, 31.5, 1.5)] = 0');
    assert.equal(run('isFishPathClear(chunk, fish, 31.5, 1.5)'), false);
    assert.equal(run('swimChecks'), 1);
});

test('a valid destination cannot bypass shallow water or another region along the route', () => {
    for (const array of ['shoreDistances', 'fishRegions']) {
        const run = createWorld();
        run(`chunk.${array}[getChunkPixelIndex(chunk, 7.5, 1.5)] = 0`);
        assert.equal(run('isFishPathClear(chunk, fish, 31.5, 1.5)'), false);
    }
    assert.equal(createWorld()('isFishPathClear(chunk, fish, 31.5, 1.5)'), true);
});

test('routes cross negative chunk borders, allowing local region labels to differ', () => {
    const run = createWorld();
    run('const west = addChunk(-1, 0, 2); fish.x = -4.5; fish.region = 2');
    assert.equal(run('isFishPathClear(west, fish, 4.5, 1.5)'), true);
    run("loadedChunks.delete('0,0')");
    assert.equal(run('isFishPathClear(west, fish, 4.5, 1.5)'), false);
});

test('zero-length routes retain their existing behavior and small routes check once', () => {
    const run = createWorld();
    assert.equal(run('isFishPathClear(chunk, fish, fish.x, fish.y)'), true);
    assert.equal(run('swimChecks'), 0);
    assert.equal(run('isFishPathClear(chunk, fish, fish.x + 0.01, fish.y)'), true);
    assert.equal(run('swimChecks'), 1);
});
