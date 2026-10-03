const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createSpawns(roll = 0) {
    const context = vm.createContext({ roll });
    const source = ['game-data.js', 'fish/spawning.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + 'Math.random = () => roll;', context);
    return code => vm.runInContext(code, context);
}

test('spawn pools share water-area tiers and keep species in their original order', () => {
    const run = createSpawns();
    assert.equal(run('getFishSpawnPool(1800) === getFishSpawnPool(1999)'), true);
    assert.equal(run('getFishSpawnPool(1999) === getFishSpawnPool(2000)'), false);
    assert.deepEqual(JSON.parse(run('JSON.stringify(getFishSpawnPool(1800).species.map(fish => fish.id))')),
        ['bluegill', 'pumpkinseed', 'roach', 'common-dace', 'common-minnow', 'mosquitofish']);
    run('for (let area = 0; area <= 65536; area++) getFishSpawnPool(area)');
    assert.equal(run('fishSpawnPools.size'), run('fishSpawnThresholds.length + 1'));
});

test('weighted choices retain inclusive roll boundaries and the empty-pool fallback', () => {
    const run = createSpawns();
    assert.equal(run('chooseFishSpecies(0).id'), 'bluegill');
    assert.equal(run('roll = 7 / 39; chooseFishSpecies(1800).id'), 'bluegill');
    assert.equal(run('roll = (7 + 0.00001) / 39; chooseFishSpecies(1800).id'), 'pumpkinseed');
    assert.equal(run('roll = 0.9999999999999999; chooseFishSpecies(11999).id'), 'zebra-danio');
    assert.equal(run('chooseFishSpecies(12000).id'), 'sturgeon');
});
