const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createWorld() {
    const context = vm.createContext({});
    const source = ['runtime/settings.js', 'runtime/state.js', 'fish/regions.js', 'fish/movement.js', 'fish/update.js']
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
test('stationary fish skip trigonometry while still checking valid water', () => {
    const run = createWorld();
    run("let trigCalls = 0; for (const name of ['sin', 'cos']) { const original = Math[name]; Math[name] = value => { trigCalls++; return original(value); }; } fish.heading = 1; fish.velocity = 0");
    assert.equal(run('moveFishForward(chunk, fish, 0.05)'), true);
    assert.equal(run('swimChecks'), 1);
    assert.equal(run('trigCalls'), 0);
    assert.deepEqual(JSON.parse(run('JSON.stringify([fish.x, fish.y])')), [1.5, 1.5]);
    run('chunk.shoreDistances[getChunkPixelIndex(chunk, fish.x, fish.y)] = 0');
    assert.equal(run('moveFishForward(chunk, fish, 0.05)'), false);
    run('fish.velocity = 3');
    assert.equal(run('moveFishForward(chunk, fish, 0)'), false);
    assert.equal(run('trigCalls'), 0);
    assert.equal(run('swimChecks'), 3);
    run('chunk.shoreDistances[getChunkPixelIndex(chunk, fish.x, fish.y)] = 30');
    assert.equal(run('moveFishForward(chunk, fish, 0.05)'), true);
    assert.equal(run('trigCalls'), 2);
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
test('splashes reach neighbouring chunks at the exact radius and skip far fish', () => {
    const run = createWorld();
    run('const west = addChunk(-1, -1); const east = addChunk(0, -1); const south = addChunk(-1, 0); const far = addChunk(4, 4)');
    run("west.fish = [{ id: 'west', x: -13, y: -1, state: 'idle' }, { id: 'target', x: -1, y: -1, state: 'idle' }, { id: 'outside', x: -14, y: -1, state: 'idle' }]");
    run("east.fish = [{ id: 'east', x: 11, y: -1, state: 'idle' }, { id: 'blocked', x: 0, y: -1, state: 'idle' }]");
    run("south.fish = [{ id: 'south', x: -1, y: 11, state: 'idle' }]; chunk.fish = [{ id: 'diagonal', x: 8, y: 8, state: 'idle' }]");
    run('far.fish = [{ get x() { throw new Error("Distant fish inspected"); }, y: 1024, state: "idle" }]');
    run('const empty = addChunk(8, 8); empty.fish = []; Object.defineProperty(empty, "pixelX", { get() { throw new Error("Empty chunk bounds inspected"); } })');
    run('for (const loaded of [west, east, south, chunk, far, empty]) loadedWaterChunks.add(loaded)');
    run('fishing = { targetFish: west.fish[1] }; const frightened = []');
    run('function chooseFishTarget(chunk, fish, x, y) { frightened.push([fish.id, x, y]); return fish.id !== "blocked"; }');
    assert.doesNotThrow(() => run('scatterFishFromSplash(-1, -1)'));
    assert.deepEqual(JSON.parse(run('JSON.stringify(frightened)')), [['west', -12, 0], ['east', 12, 0], ['blocked', 1, 0], ['south', 0, 12]]);
    assert.deepEqual(JSON.parse(run('JSON.stringify(west.fish.map(fish => fish.state))')), ['flee', 'idle', 'idle']);
    assert.deepEqual(JSON.parse(run('JSON.stringify(east.fish.map(fish => fish.state))')), ['flee', 'idle']);
    assert.equal(run('south.fish[0].state'), 'flee');
    assert.equal(run('chunk.fish[0].state'), 'idle');
    run('loadedWaterChunks.clear(); loadedWaterChunks.add(chunk); frightened.length = 0; chunk.fish = [{ id: "edge", x: 0, y: 0, state: "idle" }]');
    run('scatterFishFromSplash(-12, 0)');
    assert.deepEqual(JSON.parse(run('JSON.stringify(frightened)')), [['edge', 12, 0]]);
    run('frightened.length = 0; chunk.fish = [{ get x() { throw new Error("Distant corner inspected"); }, y: 0, state: "idle" }]');
    assert.doesNotThrow(() => run('scatterFishFromSplash(-9, -9)'));
    assert.deepEqual(JSON.parse(run('JSON.stringify(frightened)')), []);
});
test('swimming fish retain acceleration at right-angle boundaries without cosine calls', () => {
    const run = createWorld();
    run('let testTurn = 0; let cosineCalls = 0; const originalCosine = Math.cos; Math.cos = value => { cosineCalls++; return originalCosine(value); }; function turnFishToward() { return testTurn; }');
    run('fish.state = "swim"; fish.thrusting = true; fish.burstTimer = 1000; fish.topSpeed = 100; fish.targetX = fish.x + 10; fish.targetY = fish.y');
    const quarterTurn = Math.PI / 2;
    for (const angle of [-Math.PI, -quarterTurn - Number.EPSILON, -quarterTurn, -quarterTurn + Number.EPSILON, 0, quarterTurn - Number.EPSILON, quarterTurn, quarterTurn + Number.EPSILON, Math.PI, NaN]) {
        run(`testTurn = ${angle}; fish.velocity = 1; updateSwimmingFish(chunk, fish, 0.05, 50)`);
        assert.equal(run('fish.velocity'), Math.cos(angle) > 0 ? 1 + run('FISH_ACCELERATION') * 0.05 : 1);
    }
    assert.equal(run('cosineCalls'), 0);
});
