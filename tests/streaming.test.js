const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createWorld() {
    const context = vm.createContext({});
    const source = ['runtime/settings.js', 'runtime/state.js', 'world/streaming.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        character = { x: 0, y: 0 };
        const scene = {};
        const builtWater = [];
        function getTileId(x, y) { return x * 67108864 + y; }
        function getChunkKey(x, y) { return x + ',' + y; }
        function createWorldChunk(scene, chunkX, chunkY, deferWater = false) {
            const key = getChunkKey(chunkX, chunkY);
            if (loadedChunks.has(key)) return;
            const chunk = { key, chunkX, chunkY, waterBuild: deferWater ? {} : null };
            loadedChunks.set(key, chunk);
            if (deferWater) pendingWaterChunks.push(chunk);
        }
        function destroyWorldChunk(key) { loadedChunks.delete(key); }
        function buildChunkWater(scene, chunk) { builtWater.push(chunk); chunk.waterBuild = null; }
    `, context);
    return code => vm.runInContext(code, context);
}

test('discovering new chunks invalidates the map and save only when needed', () => {
    const run = createWorld();
    run('updateLoadedChunks(scene, true)');
    assert.equal(run('saveDirty && mapDirty'), true);
    assert.equal(run('discoveredChunks.size'), 25);
    run('saveDirty = false; mapDirty = false; updateLoadedChunks(scene)');
    assert.equal(run('saveDirty || mapDirty'), false);
    run('character.x += CHUNK_PIXEL_SIZE; updateLoadedChunks(scene)');
    assert.equal(run('saveDirty && mapDirty'), true);
    assert.equal(run('discoveredChunks.size'), 30);
    run('saveDirty = false; mapDirty = false; character.x = 0; updateLoadedChunks(scene)');
    assert.equal(run('saveDirty || mapDirty'), false);
});

test('moving between chunks discards stale water jobs and keeps valid deferred builds', () => {
    const run = createWorld();
    run(`
        updateLoadedChunks(scene, true);
        const needed = loadedChunks.get('0,0'); needed.waterBuild = {};
        const unloaded = loadedChunks.get('-1,0'); unloaded.waterBuild = {};
        const finished = loadedChunks.get('1,1');
        const replaced = { key: needed.key, chunkX: 0, chunkY: 0, waterBuild: {} };
        pendingWaterChunks.push(unloaded, needed, finished, replaced);
        character.x = CHUNK_PIXEL_SIZE;
        updateLoadedChunks(scene);
    `);
    assert.equal(run('pendingWaterChunks.length'), 1);
    assert.equal(run('pendingWaterChunks[0] === needed'), true);
    run('while (pendingChunks.length) buildPendingChunk(scene); while (pendingWaterChunks.length) buildPendingChunk(scene)');
    assert.equal(run('loadedChunks.size'), 9);
    assert.equal(run('builtWater.includes(needed)'), true);
    assert.equal(run('builtWater.includes(unloaded) || builtWater.includes(finished) || builtWater.includes(replaced)'), false);
    assert.equal(run('[...loadedChunks.values()].every(chunk => chunk.waterBuild === null)'), true);
});
