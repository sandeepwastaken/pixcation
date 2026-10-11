const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createWindow(fontLoad, hasFonts = true) {
    const listeners = new Map();
    const documentListeners = new Map();
    const frames = [];
    const timers = [];
    let start;
    let zoomWrites = 0;
    let starts = 0;
    let saves = 0;
    const window = {
        APP_CACHE_BUSTER: 'test', location: { search: '' }, devicePixelRatio: 1,
        addEventListener(name, callback) { listeners.set(name, callback); }
    };
    const document = {
        visibilityState: 'visible',
        addEventListener(name, callback) { documentListeners.set(name, callback); },
        documentElement: { clientWidth: 1280, clientHeight: 768 },
        fonts: hasFonts ? { load() { return fontLoad || { then(callback) { start = callback; } }; } } : null
    };
    const context = vm.createContext({
        window, document, URLSearchParams,
        lastPlayTime: 123,
        requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
        setTimeout(callback) { timers.push(callback); return timers.length; },
        saveProgress() { saves++; }, preload() {}, create() {}, update() {},
        Phaser: { AUTO: 0, Scale: { NONE: 0, NO_CENTER: 0 }, Game: class {
            constructor(config) {
                starts++;
                this.scale = { zoom: config.scale.zoom, setZoom(zoom) { zoomWrites++; this.zoom = zoom; } };
            }
        } }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/runtime/bootstrap.js'), 'utf8'), context);
    return {
        start: () => start(),
        hide: () => listeners.get('pagehide')(),
        visibility: state => { document.visibilityState = state; documentListeners.get('visibilitychange')(); },
        resize(width, height, ratio = window.devicePixelRatio) {
            document.documentElement.clientWidth = width;
            document.documentElement.clientHeight = height;
            window.devicePixelRatio = ratio;
            listeners.get('resize')();
        },
        flush: () => frames.splice(0).forEach(callback => callback()),
        timeout: () => timers.shift()?.(),
        queued: () => frames.length,
        writes: () => zoomWrites,
        starts: () => starts,
        saves: () => saves,
        clock: () => vm.runInContext('lastPlayTime', context),
        zoom: () => vm.runInContext('game.scale.zoom', context)
    };
}

test('startup uses a viewport resized while fonts were loading', () => {
    const screen = createWindow();
    screen.resize(360, 220);
    screen.flush();
    screen.start();
    assert.equal(screen.zoom(), 1);
});

test('font loading success and failure start one game with the current zoom', async () => {
    for (const load of [() => Promise.resolve([]), () => Promise.reject(new Error('Font unavailable'))]) {
        const screen = createWindow(load());
        screen.resize(640, 384);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(screen.starts(), 1);
        assert.equal(screen.zoom(), 2);
    }
});

test('resize bursts coalesce and unchanged pixel zoom avoids scale writes', () => {
    const screen = createWindow();
    screen.start();
    screen.resize(1290, 780);
    screen.resize(1300, 800);
    assert.equal(screen.queued(), 1);
    screen.flush();
    assert.equal(screen.writes(), 0);
    screen.resize(640, 384);
    screen.flush();
    assert.equal(screen.zoom(), 2);
    assert.equal(screen.writes(), 1);
});

test('fractional pixel ratios and small viewports keep whole physical pixels', () => {
    const screen = createWindow();
    screen.start();
    screen.resize(900, 550, 1.5);
    screen.flush();
    assert.equal(screen.zoom(), 4 / 1.5);
    screen.resize(100, 100, 2);
    screen.flush();
    assert.equal(screen.zoom(), 0.5);
});

test('page hiding saves progress before the browser discards the game', () => {
    const screen = createWindow();
    screen.hide();
    assert.equal(screen.saves(), 1);
});

test('tab visibility pauses play time and saves hidden progress', () => {
    const screen = createWindow();
    screen.visibility('hidden');
    assert.equal(screen.clock(), null);
    assert.equal(screen.saves(), 1);
});

test('a stalled font load falls back without starting the game twice', () => {
    const screen = createWindow();
    screen.timeout();
    assert.equal(screen.starts(), 1);
    screen.start();
    assert.equal(screen.starts(), 1);
});
test('startup works without the font loading API', () => assert.equal(createWindow(undefined, false).starts(), 1));
