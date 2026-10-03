const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function placeBeside(type, neighbor, x, y, priority = 0.6) {
    const context = vm.createContext({
        createTileCache: () => () => {},
        worldHash: (tileX, tileY) => tileX === 0 && tileY === 0 ? 0.5 : priority
    });
    const settings = fs.readFileSync(path.join(__dirname, '../src/runtime/settings.js'), 'utf8');
    const props = fs.readFileSync(path.join(__dirname, '../src/environment/props.js'), 'utf8');
    vm.runInContext(settings + '\n' + props, context);
    context.getPropCandidate = (tileX, tileY) => tileX === 0 && tileY === 0 ? type
        : tileX === x && tileY === y ? neighbor : null;
    return vm.runInContext('placeProp(0, 0)', context);
}

test('tree canopies reach smaller props above them only within the horizontal footprint', () => {
    for (const type of ['bush', 'rock', 'boulder']) {
        assert.equal(placeBeside(type, 'tree', -2, 4), null);
        assert.equal(placeBeside(type, 'tree', -3, 4), type);
        assert.equal(placeBeside(type, 'tree', 0, 5), type);
        assert.equal(placeBeside(type, 'tree', 0, -2), type);
        assert.equal(placeBeside(type, 'rock', 0, 2), type);
    }
    assert.equal(placeBeside('rock', 'tree', 1, 4), null);
    assert.equal(placeBeside('rock', 'tree', 2, 4), 'rock');
    assert.equal(placeBeside('boulder', 'tree', 2, 4), null);
    assert.equal(placeBeside('boulder', 'tree', 3, 4), 'boulder');
});

test('adjacent props retain their clear tile gap and tree candidates check both canopy directions', () => {
    assert.equal(placeBeside('rock', 'boulder', -2, -1), null);
    assert.equal(placeBeside('rock', 'boulder', -3, -1), 'rock');
    assert.equal(placeBeside('tree', 'rock', -1, -4), null);
    assert.equal(placeBeside('tree', 'tree', -2, 4), null);
});

test('equal prop priorities keep the earlier row and then the earlier column', () => {
    assert.equal(placeBeside('rock', 'rock', 0, -1, 0.5), null);
    assert.equal(placeBeside('rock', 'rock', -1, 0, 0.5), null);
    assert.equal(placeBeside('rock', 'rock', 1, 0, 0.5), 'rock');
    assert.equal(placeBeside('rock', 'tree', 0, 4, 0.5), 'rock');
    assert.equal(placeBeside('rock', 'tree', 0, 4, 0.4), 'rock');
});
