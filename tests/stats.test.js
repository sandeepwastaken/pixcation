const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createStats() {
    const context = vm.createContext({ TEST_MODE: false });
    const source = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'runtime/progress.js', 'ui/stats.js', 'fishing/minigame.js'].map(file => fs.readFileSync(`src/${file}`, 'utf8')).join('\n');
    vm.runInContext(source, context);
    return { context, run: source => vm.runInContext(source, context) };
}

test('lifetime catches survive selling inventory and treasure fish do not count as catches', () => {
    const { context, run } = createStats();
    const species = run('FISH_SPECIES[0]');
    context.addCaughtFish(species);
    context.addCaughtFish(species, false);
    assert.equal(run('playerStats.fishCaught'), 1);
    assert.equal(run('fishInventory.get(FISH_SPECIES[0].id)'), 2);
    run("recordPlayerStat('moneyEarned', 50); recordPlayerStat('fishSold', 2); fishInventory.clear()");
    assert.equal(run('playerStats.fishCaught'), 1);
    assert.equal(run('playerStats.moneyEarned'), 50);
    assert.equal(run('playerStats.fishSold'), 2);
    assert.equal(run('saveDirty'), true);
});

test('stats migration keeps known fish and rejects invalid or unsafe amounts', () => {
    const { context, run } = createStats();
    run("fishInventory.set('bluegill', 3)");
    context.restoreSavedStats({ playTimeMs: 3600000, casts: -2, moneyEarned: Infinity, moneySpent: 1.5, fishSold: Number.MAX_SAFE_INTEGER + 1 });
    assert.deepEqual(JSON.parse(run('JSON.stringify(playerStats)')), { fishCaught: 3, playTimeMs: 3600000, moneyEarned: 0, fishSold: 0, casts: 0, moneySpent: 0 });
    context.recordPlayerStat('casts', Number.MAX_SAFE_INTEGER);
    context.recordPlayerStat('casts');
    assert.equal(run('playerStats.casts'), Number.MAX_SAFE_INTEGER);
    assert.equal(context.formatPlayTime(3720000), '1h 02m 00s');
});

test('play time includes slow frames and excludes hidden or unfocused time', () => {
    const { context, run } = createStats();
    let focused = true;
    context.document = { visibilityState: 'visible', hasFocus: () => focused };
    context.updatePlayTime(1000);
    context.updatePlayTime(4500);
    assert.equal(run('playerStats.playTimeMs'), 3500);
    focused = false;
    context.updatePlayTime(5000);
    context.updatePlayTime(7000);
    assert.equal(run('playerStats.playTimeMs'), 3500);
    run('lastPlayTime = null');
    focused = true;
    context.updatePlayTime(9000);
    context.updatePlayTime(9250);
    assert.equal(run('playerStats.playTimeMs'), 3750);
    context.document.visibilityState = 'hidden';
    context.updatePlayTime(12000);
    assert.equal(run('playerStats.playTimeMs'), 3750);
});
