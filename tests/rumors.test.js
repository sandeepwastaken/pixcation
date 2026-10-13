const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('only large fish and the current mystery bait target enter rumor candidates', () => {
    const run = createRumors();
    assert.equal(run('RUMOR_SPECIES.every(species => species.size === "large" || species.size === "giant")'), true);
    run('let cycle = 1; getMysteryCycle = () => cycle; getCurrentMysteryBait = () => ({attracts: FISH_SPECIES.find(species => species.size === "small")}); const smallHint = getRumorHotspot(0, 0, 1);');
    assert.equal(run('smallHint.species === getCurrentMysteryBait().attracts'), true);
    run('cycle++; getCurrentMysteryBait = () => ({attracts: FISH_SPECIES.find(species => species.size === "medium")}); const mediumHint = getRumorHotspot(0, 0, 1);');
    assert.equal(run('mediumHint.species === getCurrentMysteryBait().attracts'), true);
    assert.notEqual(run('smallHint.key'), run('mediumHint.key'));
});

test('giant rumors boost only their center chunk while other rumors cover neighboring chunks', () => {
    const run=createRumors(); run('getWorldClock=()=>({day:1}); let species=FISH_SPECIES_BY_ID.get("sturgeon"); getRumorHotspot=()=>({chunkX:2,chunkY:2,species})');
    assert.ok(run('getChunkRumor(2,2)')); for(const point of [[1,2],[3,2],[2,1],[2,3],[1,1],[3,3]]) assert.equal(run('getChunkRumor(...'+JSON.stringify(point)+')'),null);
    run('species=FISH_SPECIES.find(fish=>fish.size==="large")'); assert.ok(run('getChunkRumor(1,1)')); assert.equal(run('getChunkRumor(0,2)'),null);
    run('species=FISH_SPECIES.find(fish=>fish.size==="small")'); assert.ok(run('getChunkRumor(3,3)'));
});

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
