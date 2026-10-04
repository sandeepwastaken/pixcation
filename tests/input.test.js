const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

function createInput() {
    const input = new EventEmitter();
    input.keyboard = new EventEmitter();
    const cursorUpdates = [];
    input.setDefaultCursor = cursor => cursorUpdates.push(cursor);
    const events = new EventEmitter();
    const gameEvents = new EventEmitter();
    const context = vm.createContext({
        scene: { input, events, game: { events: gameEvents }, time: { now: 100 } },
        Phaser: { Core: { Events: { BLUR: 'blur', FOCUS: 'focus' } }, Scenes: { Events: { SHUTDOWN: 'shutdown' } } },
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
        function isStatsButtonAt(x, y) { return x >= 264 && x < 312 && y >= 8 && y < 24; }
        function openStats() { statsOpen = true; }
        function closeStats() { statsOpen = false; }
        function isMenuOpen() { return false; }
        bindGameInput(scene);
    `, context);
    return { input, events, gameEvents, cursorUpdates, run: code => vm.runInContext(code, context) };
}

const space = { key: ' ', code: 'Space', repeat: false };
const left = { button: 0, x: 0, y: 180 };
test('cursor updates follow button boundaries and menu visibility without repeated writes', () => {
    const { input, run, cursorUpdates } = createInput();
    run("startup = { phase: 'title' }");
    input.emit('pointermove', { x: 111, y: 127 });
    input.emit('pointermove', { x: 112, y: 127 });
    input.emit('pointermove', { x: 207, y: 143 });
    input.emit('pointermove', { x: 208, y: 143 });
    assert.deepEqual(cursorUpdates, ['default', 'pointer', 'default']);
    run('startup = null');
    input.emit('pointermove', { x: 280, y: 12 });
    input.emit('pointermove', { x: 281, y: 13 });
    run('statsOpen = true; isMenuOpen = () => statsOpen');
    input.emit('pointermove', { x: 280, y: 12 });
    input.emit('pointermove', { x: 150, y: 80 });
    run("statsOpen = false; getClickedWorldTarget = () => 'guide'");
    input.emit('pointermove', { x: 150, y: 80 });
    run('statsOpen = true');
    input.emit('pointermove', { x: 150, y: 80 });
    assert.deepEqual(cursorUpdates, ['default', 'pointer', 'default', 'pointer', 'default', 'pointer', 'default']);
});

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

test('the stats button and Tab open stats without casting and Escape closes it', () => {
    const { input, run } = createInput();
    input.emit('pointerdown', { button: 0, x: 280, y: 12 });
    assert.equal(run('statsOpen'), true);
    assert.equal(run('presses'), 0);
    input.keyboard.emit('keydown', { key: 'Escape', code: 'Escape', repeat: false });
    assert.equal(run('statsOpen'), false);
    let prevented = false;
    const tab = { key: 'Tab', code: 'Tab', repeat: false, preventDefault() { prevented = true; } };
    input.keyboard.emit('keydown', tab);
    assert.equal(run('statsOpen'), true);
    assert.equal(prevented, true);
    input.emit('pointerdown', { button: 0, x: 280, y: 12 });
    assert.equal(run('statsOpen'), false);
    assert.equal(run('presses'), 0);
});

test('outside mouse releases clear drags and release a held cast only once', () => {
    const { input, run } = createInput();
    input.emit('pointerdown', left);
    run('mapDrag = { x: 10, y: 10 }');
    input.emit('pointerupoutside', { ...left, button: 2 });
    assert.equal(run('fishingActionHeld'), true);
    assert.equal(run('mapDrag !== null'), true);
    input.emit('pointerupoutside', left);
    assert.equal(run('fishingActionHeld'), false);
    assert.equal(run('castCharge'), null);
    assert.equal(run('mapDrag'), null);
    input.emit('pointerup', left);
    assert.equal(run('releases'), 1);
});

test('outside mouse releases preserve a simultaneous keyboard hold', () => {
    const { input, run } = createInput();
    input.emit('pointerdown', left);
    input.keyboard.emit('keydown', space);
    input.emit('pointerupoutside', left);
    assert.equal(run('fishingActionHeld'), true);
    assert.equal(run('releases'), 0);
    input.keyboard.emit('keyup', space);
    assert.equal(run('fishingActionHeld'), false);
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

test('map drags redraw only after the displayed tile changes and keep fractional anchors', () => {
    for (const zoom of [1, 2, 3]) {
        const { input, run } = createInput();
        run(`mapOpen = true; mapZoom = ${zoom}; mapPan.x = -0.25; mapPan.y = 0.25;
            mapDrag = { x: 10, y: 10, panX: -0.25, panY: 0.25 }; mapDirty = false;`);
        input.emit('pointermove', { x: 10 - 0.4 * zoom, y: 10 + 0.4 * zoom, isDown: true });
        assert.equal(run('mapDirty'), false);
        assert.equal(run('mapPan.x'), -0.25);
        assert.equal(run('mapPan.y'), 0.25);
        input.emit('pointermove', { x: 10 - 0.6 * zoom, y: 10 + 0.6 * zoom, isDown: true });
        assert.equal(run('mapDirty'), true);
        assert.equal(run('mapPan.x'), 0.75);
        assert.equal(run('mapPan.y'), -0.75);
        run('mapDirty = false');
        input.emit('pointermove', { x: 10 - 0.7 * zoom, y: 10 + 0.7 * zoom, isDown: true });
        assert.equal(run('mapDirty'), false);
        run('mapDirty = true');
        input.emit('pointermove', { x: 10 - 0.7 * zoom, y: 10 + 0.7 * zoom, isDown: true });
        assert.equal(run('mapDirty'), true);
        run('mapDirty = false');
        input.emit('pointermove', { x: 0, y: 0, isDown: false });
        assert.equal(run('mapDirty'), false);
        assert.equal(run('mapPan.x'), 0.75);
        assert.equal(run('mapPan.y'), -0.75);
    }
});
