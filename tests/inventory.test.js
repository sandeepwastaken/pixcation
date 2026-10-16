const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createInventory() {
    const context = vm.createContext({});
    for (const file of ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'ui/panels.js', 'ui/inventory.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context, { filename: file });
    }
    vm.runInContext("selectedFishIndex = 0; let selectedEntries = []; selectFishpediaEntry = function(index) { selectedFishIndex = index; selectedEntries.push(index); };", context);
    return {
        run: code => vm.runInContext(code, context),
        press: key => vm.runInContext("handleInventoryKey({ time: { now: 1000 } }, { key: '" + key + "' })", context)
    };
}

test('Fishpedia U skips discovered species and wraps to the next unknown entry', () => {
    const inventory = createInventory();
    inventory.run("catchLog.clear(); FISH_SPECIES.forEach((species, index) => { if (index !== 2 && index !== 5) catchLog.add(species.id); }); selectedFishIndex = 3;");
    inventory.press('u');
    assert.equal(inventory.run('selectedFishIndex'), 5);
    inventory.run('selectedFishIndex = FISH_SPECIES.length - 1;');
    inventory.press('u');
    assert.equal(inventory.run('selectedFishIndex'), 2);
});

test('Fishpedia U leaves the selection alone after every species is discovered', () => {
    const inventory = createInventory();
    inventory.run("catchLog.clear(); FISH_SPECIES.forEach(species => catchLog.add(species.id)); selectedFishIndex = 4;");
    inventory.press('u');
    assert.equal(inventory.run('selectedFishIndex'), 4);
    assert.equal(inventory.run('selectedEntries.length'), 0);
});
