const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

function createInput() {
    const input = new EventEmitter();
    input.keyboard = new EventEmitter();
    const events = new EventEmitter();
    const gameEvents = new EventEmitter();
    const context = vm.createContext({
        scene: { input, events, game: { events: gameEvents }, time: { now: 100 } },
        Phaser: { Core: { Events: { BLUR: 'blur' } }, Scenes: { Events: { SHUTDOWN: 'shutdown' } } },
        CHEATS_ENABLED: false
    });
    const source = ['runtime/settings.js', 'runtime/state.js', 'runtime/input.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        let presses = 0;
        let releases = 0;
        function beginCast() { presses++; castCharge = { start: 100 }; }
        function releaseCast() { releases++; castCharge = null; }
        function getClickedWorldTarget() { return null; }
        function isBaitSlotAt() { return false; }
        function isMenuOpen() { return false; }
        bindGameInput(scene);
    `, context);
    return { input, events, gameEvents, run: code => vm.runInContext(code, context) };
}

const space = { key: ' ', code: 'Space', repeat: false };
const left = { button: 0, x: 0, y: 180 };

test('mouse and keyboard holds release a cast only when both are released', () => {
    const { input, run } = createInput();
    input.emit('pointerdown', left);
    input.keyboard.emit('keydown', space);
    assert.equal(run('presses'), 1);
    input.emit('pointerup', left);
    assert.equal(run('fishingActionHeld'), true);
    assert.equal(run('releases'), 0);
    input.keyboard.emit('keyup', space);
    assert.equal(run('fishingActionHeld'), false);
    assert.equal(run('releases'), 1);
    input.emit('pointerup', left);
    assert.equal(run('releases'), 1);
});

test('right clicks do not cast or release a held left click', () => {
    const { input, run } = createInput();
    input.emit('pointerdown', { ...left, button: 2 });
    assert.equal(run('presses'), 0);
    input.emit('pointerdown', left);
    input.emit('pointerup', { ...left, button: 2 });
    assert.equal(run('fishingActionHeld'), true);
    assert.equal(run('releases'), 0);
    input.emit('pointerup', left);
    assert.equal(run('releases'), 1);
});

test('losing focus cancels a charge and drag without casting on return', () => {
    const { input, gameEvents, run } = createInput();
    input.keyboard.emit('keydown', space);
    run('mapDrag = { x: 10, y: 10 }');
    gameEvents.emit('blur');
    assert.equal(run('fishingActionHeld'), false);
    assert.equal(run('castCharge'), null);
    assert.equal(run('mapDrag'), null);
    input.keyboard.emit('keyup', space);
    assert.equal(run('releases'), 0);
    input.keyboard.emit('keydown', space);
    assert.equal(run('presses'), 2);
});

test('scene shutdown removes its game focus handler and clears held input', () => {
    const { input, events, gameEvents, run } = createInput();
    input.emit('pointerdown', left);
    assert.equal(gameEvents.listenerCount('blur'), 1);
    events.emit('shutdown');
    assert.equal(gameEvents.listenerCount('blur'), 0);
    assert.equal(run('fishingActionHeld'), false);
    assert.equal(run('castCharge'), null);
});
