const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createRumors() {
    const context = vm.createContext({ TEST_MODE: false });
    vm.runInContext(['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'world/terrain.js', 'environment/rumors.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('let terrainReads = 0; coordinateHash = () => 1; getTerrainType = () => {terrainReads++; return "water";};', context);
    return code => vm.runInContext(code, context);
}

test('inclusive rumor rolls stay within their cell and select a valid fish', () => {
    const run = createRumors();
    run('const hotspot = getRumorHotspot(-2, 3, 7)');
    assert.equal(run('hotspot.chunkX'), -6);
    assert.equal(run('hotspot.chunkY'), 19);
    assert.equal(run('RUMOR_SPECIES.includes(hotspot.species)'), true);
    assert.equal(run('getRumorHotspot(-2, 3, 7) === hotspot'), true);
    assert.equal(run('terrainReads'), 64);
});

test('rumor caches cannot alias another cell after thirty-one days', () => {
    const run = createRumors();
    run('const first = getRumorHotspot(0, 0, 32), second = getRumorHotspot(0, 1, 1)');
    assert.notEqual(run('first.key'), run('second.key'));
    assert.equal(run('first.day'), 32);
    assert.equal(run('second.day'), 1);
    assert.notEqual(run('first.chunkY'), run('second.chunkY'));
});
