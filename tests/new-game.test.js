const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createNewGame(search = '', options = {}) {
    const storage = new Map([['pixcation-save-v1', 'old default save'], ['pixcation-seed', '51'], ['pixcation-save-v1:13', 'old seeded save'], ['pixcation-save-v1:71', 'old destination save']]);
    const navigations = [], removals = [];
    const document = { activeElement: null, createElement: () => ({ style: {}, value: '', setAttribute() {}, addEventListener() {}, appendChild() {}, focus() { document.activeElement = this; }, select() {}, blur() { if (document.activeElement === this) document.activeElement = null; } }) };
    const scene = { time: { now: 100 }, add: {} };
    const object = () => ({ scene, visible: false, fillStyle() { return this; }, fillRect() { return this; }, setDepth() { return this; }, setOrigin() { return this; }, setScrollFactor() { return this; }, setVisible(value) { this.visible = value; return this; } });
    scene.add.graphics = scene.add.container = scene.add.dom = object;
    const uiPngBackground = () => ({});
    const context = vm.createContext({ document, scene, uiPngBackground, TEST_MODE: false, URL, URLSearchParams, window: { location: { href: 'http://localhost:8000/?cheats=true' + search, search: '?cheats=true' + search, assign: value => navigations.push(value) } }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => { if (options.failRemove) throw new Error('Storage unavailable'); removals.push(key); storage.delete(key); } } });
    vm.runInContext(['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'runtime/progress.js', 'ui/elements.js', 'ui/panels.js', 'ui/inventory.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('createNewGameUI(scene); inventoryOpen = true; inventoryTextLayer = {visible: true, setVisible(value) {this.visible = value;}};', context);
    return { storage, navigations, removals, run: code => vm.runInContext(code, context) };
}

test('double N opens the world choice without deleting anything and Escape cancels', () => {
    const session = createNewGame('&seed=13');
    session.run('handleInventoryKey(scene, {key: "n"})');
    assert.equal(session.run('newGameChoice.open'), false);
    session.run('handleInventoryKey(scene, {key: "n"})');
    assert.equal(session.run('newGameChoice.open'), true);
    assert.equal(session.run('newGameChoice.input.value'), '13');
    assert.equal(session.run('inventoryTextLayer.visible'), false);
    assert.equal(session.removals.length, 0);
    session.run('handleNewGameChoiceKey({key: "Escape", preventDefault() {}})');
    assert.equal(session.run('newGameChoice.open'), false);
    assert.equal(session.run('inventoryTextLayer.visible'), true);
    assert.equal(session.removals.length, 0);
});

test('seeded resets preserve the exact long seed and unrelated URL options', () => {
    const session = createNewGame('&seed=13');
    session.run('openNewGameChoice(); newGameChoice.input.value = "1077591386333098394113885770581096027424261406733"; startNewGameChoice()');
    const target = new URL(session.navigations[0]);
    assert.equal(target.searchParams.get('seed'), '1077591386333098394113885770581096027424261406733');
    assert.equal(target.searchParams.get('cheats'), 'true');
    assert.equal(session.storage.get('pixcation-save-v1'), 'old default save');
    assert.equal(session.storage.get('pixcation-seed'), '51');
});

test('unseeded resets remove the URL seed and clear the old default world', () => {
    const session = createNewGame('&seed=13');
    session.run('openNewGameChoice(); handleNewGameChoiceKey({key: "Tab", preventDefault() {}}); startNewGameChoice()');
    assert.equal(new URL(session.navigations[0]).searchParams.has('seed'), false);
    assert.deepEqual(session.removals, ['pixcation-save-v1:13', 'pixcation-save-v1', 'pixcation-seed']);
    assert.equal(session.storage.get('pixcation-save-v1:71'), 'old destination save');
});

test('invalid seeds cannot erase progress or navigate', () => {
    const session = createNewGame();
    for (const seed of ['', '0', '-1', '1.2', 'abc', String(1n << 288n)]) { session.run('openNewGameChoice(); newGameChoice.input.value = ' + JSON.stringify(seed) + '; startNewGameChoice()'); }
    assert.equal(session.removals.length, 0);
    assert.equal(session.navigations.length, 0);
    assert.equal(session.run('newGameResetting'), false);
});

test('reset failures stay in the choice panel and can be retried', () => {
    const options = { failRemove: true }, session = createNewGame('&seed=13', options);
    session.run('openNewGameChoice(); newGameChoice.input.value = "71"; startNewGameChoice()');
    assert.equal(session.navigations.length, 0);
    assert.equal(session.run('newGameResetting'), false);
    assert.equal(session.run('newGameChoice.open'), true);
    options.failRemove = false;
    session.run('startNewGameChoice()');
    assert.equal(new URL(session.navigations[0]).searchParams.get('seed'), '71');
    assert.deepEqual(session.removals, ['pixcation-save-v1:13', 'pixcation-save-v1:71']);
});

test('mouse choices and seed editing preserve mode selection until confirmation', () => {
    const session = createNewGame('&seed=13');
    session.run('openNewGameChoice(); handleNewGameChoicePointer({x: 210, y: 75})');
    assert.equal(session.run('newGameChoice.mode'), 1);
    assert.equal(session.run('newGameChoice.input.style.display'), 'none');
    session.run('handleNewGameChoicePointer({x: 100, y: 75}); newGameChoice.input.focus(); handleNewGameChoiceKey({key: "ArrowLeft"})');
    assert.equal(session.run('newGameChoice.mode'), 0);
    assert.equal(session.run('newGameChoice.input.style.display'), '');
    assert.equal(session.removals.length, 0);
    session.run('newGameChoice.input.value = "71"; handleNewGameChoicePointer({x: 160, y: 140})');
    assert.equal(new URL(session.navigations[0]).searchParams.get('seed'), '71');
});

test('closing the world chooser cannot reveal an already hidden Fishpedia text layer', () => {
    const session = createNewGame();
    session.run('inventoryTextLayer.visible = false; openNewGameChoice(); closeNewGameChoice()');
    assert.equal(session.run('inventoryTextLayer.visible'), false);
    session.run('inventoryTextLayer.visible = true; openNewGameChoice(); inventoryOpen = false; closeNewGameChoice()');
    assert.equal(session.run('inventoryTextLayer.visible'), false);
});
