const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createView() {
    const context = vm.createContext({});
    const source = ['runtime/settings.js', 'runtime/state.js', 'runtime/camera.js', 'ui/map-controls.js', 'ui/startup.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        let redraws = 0;
        let scrolls = 0;
        function redrawMap() { redraws++; }
        characterKeys = Object.fromEntries(['left', 'right', 'up', 'down', 'leftArrow', 'rightArrow', 'upArrow', 'downArrow'].map(key => [key, { isDown: false }]));
        character = { x: 152, y: 88 };
        mainCamera = { width: 320, height: 192, scrollX: 0, scrollY: 0,
            setScroll(x, y) { scrolls++; this.scrollX = x; this.scrollY = y; } };
    `, context);
    return code => vm.runInContext(code, context);
}

test('an idle map still processes a pending redraw exactly once', () => {
    const run = createView();
    run('mapDirty = false; updateMapPan({}, 16)');
    assert.equal(run('redraws'), 0);
    run('mapDirty = true; updateMapPan({}, 16); updateMapPan({}, 16)');
    assert.equal(run('redraws'), 1);
    assert.equal(run('mapDirty'), false);
});

test('map movement keeps its zoom scaling and handles opposing keys', () => {
    const run = createView();
    run('mapZoom = 3; mapDirty = false; characterKeys.right.isDown = true; updateMapPan({}, 50)');
    assert.equal(run('mapPan.x'), 1.5);
    assert.equal(run('redraws'), 1);
    run('characterKeys.left.isDown = true; updateMapPan({}, 50)');
    assert.equal(run('mapPan.x'), 1.5);
    assert.equal(run('redraws'), 1);
});

test('camera scroll updates are skipped when settled and restore external scroll changes', () => {
    const run = createView();
    run('updateCamera(16); updateCamera(16)');
    assert.equal(run('scrolls'), 0);
    run('mainCamera.scrollX = 10; updateCamera(16)');
    assert.equal(run('scrolls'), 1);
    assert.equal(run('mainCamera.scrollX'), 0);
});

test('title animation skips unchanged pixels and restores altered positions', () => {
    const run = createView();
    run("for (const name of ['updateLoadedChunks', 'buildPendingChunk', 'updateCharacterShadow', 'updateBushRustle', 'updateChunkVisibility', 'updateTreeShadows', 'updateParticles', 'updateFish', 'updateChunkWater']) globalThis[name] = () => {}");
    run("let titleWrites = 0; let titleTop = '57px'");
    run("startup = { phase: 'title', start: 0, spawnX: 0, spawnY: 0, logo: { y: 40 }, title: { style: { get top() { return titleTop; }, set top(value) { titleWrites++; titleTop = value; } } } }");
    run('updateStartup({}, 0, 16); updateStartup({}, 16, 16)');
    assert.equal(run('scrolls'), 1);
    assert.equal(run('titleWrites'), 0);
    run('updateStartup({}, 400, 16); updateStartup({}, 401, 16)');
    assert.equal(run('titleWrites'), 1);
    assert.equal(run('scrolls'), 2);
    run("titleTop = '0px'; mainCamera.scrollX = 999; startup.logo.y = 0; updateStartup({}, 401, 16)");
    assert.equal(run('titleWrites'), 2);
    assert.equal(run('scrolls'), 3);
    assert.equal(run('startup.logo.y'), 41);
    assert.equal(run('startup.title.style.top'), '58px');
    assert.equal(run('mainCamera.scrollX'), -60);
    assert.equal(run('mainCamera.scrollY'), -94);
});

test('startup dither uses a bounded tile and skips repeated fade levels', () => {
    const run = createView();
    run('let ditherFills = 0; let ditherRefreshes = 0');
    run('const patternContext = { clearRect() {}, fillRect() { ditherFills++; } }');
    run('const ditherContext = { clearRect() {}, createPattern(canvas, repeat) { return { canvas, repeat }; }, fillRect() { ditherFills++; } }');
    run('startup = { level: -1, pattern: { getContext: () => patternContext }, texture: { getContext: () => ditherContext, refresh() { ditherRefreshes++; } } }');
    run('drawStartupDither(16); drawStartupDither(16)');
    assert.equal(run('ditherFills'), 17);
    assert.equal(run('ditherRefreshes'), 1);
    assert.equal(run('ditherContext.fillStyle.repeat'), 'repeat');
    run('drawStartupDither(0); drawStartupDither(0)');
    assert.equal(run('ditherFills'), 18);
    assert.equal(run('ditherRefreshes'), 2);
});
