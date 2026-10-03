const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function findPierWithDryTiles(dryPoints) {
    const context = vm.createContext({ dryPoints });
    const source = ['runtime/settings.js', 'world/decks.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        const dry = new Set(dryPoints.map(([x, y]) => x + ',' + y));
        let tileReads = 0;
        function worldHash() { return 0; }
        isLocalHashPeak = () => true;
        function getTerrainType(x, y) {
            tileReads++;
            return y === 0 || dry.has(x + ',' + y) ? 'dirt' : 'water';
        }
        const pier = findPier(0, 0);
    `, context);
    return { pier: JSON.parse(vm.runInContext('JSON.stringify(pier)', context)), tileReads: vm.runInContext('tileReads', context) };
}

test('pier clearance accepts fifteen water tiles and rejects fourteen', () => {
    const dry = [[-2,4],[-1,4],[2,4]];
    assert.deepEqual(findPierWithDryTiles(dry).pier, { anchorX: 0, anchorY: 0, waterLength: 4 });
    const rejected = findPierWithDryTiles([...dry, [3,4]]);
    assert.equal(rejected.pier, null);
    assert.equal(rejected.tileReads < findPierWithDryTiles(dry).tileReads, true);
});

test('pier placement still rejects land beneath the deck', () => {
    assert.equal(findPierWithDryTiles([[0,2]]).pier, null);
    assert.equal(findPierWithDryTiles([]).pier !== null, true);
});
