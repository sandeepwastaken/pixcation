const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createView() {
    const context = vm.createContext({});
    const source = ['runtime/settings.js', 'runtime/state.js', 'runtime/camera.js', 'ui/map-controls.js']
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
