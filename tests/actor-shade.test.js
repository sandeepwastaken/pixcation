const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createShade() {
    const context = vm.createContext({ TEST_MODE: false });
    vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'world/terrain.js', 'world/surfaces.js', 'environment/shadows.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('const scene = {}; let writes = 0; const sprite = {x: 0, y: 0, visible: true, setTint(tint) { writes++; this.tint = tint; }}; const chunk = {treeShadePoints: new Set(), visible: true}; loadedChunks.set(getChunkKey(0, 0), chunk);', context);
    return code => vm.runInContext(code, context);
}

test('actors darken progressively under tree shade and return to their original colors', () => {
    const run = createShade();
    run('updateActorShade(scene, sprite)');
    assert.equal(run('sprite.tint'), 0xffffff);
    run('for(let y = 12; y < 16; y++) for(let x = 4; x < 8; x++) chunk.treeShadePoints.add(y * 256 + x); scene.actorShadeVersion = 1; updateActorShade(scene, sprite)');
    assert.equal(run('getActorShadeCoverage(0, 0)'), 0.5);
    const partial = run('sprite.tint');
    run('for(let y = 12; y < 16; y++) for(let x = 8; x < 12; x++) chunk.treeShadePoints.add(y * 256 + x); scene.actorShadeVersion++; updateActorShade(scene, sprite)');
    assert.equal(run('sprite.tint'), 0xdbdbdb);
    assert.ok(partial > run('sprite.tint') && partial < 0xffffff);
    run('sprite.x = 16; updateActorShade(scene, sprite)');
    assert.equal(run('sprite.tint'), 0xffffff);
});

test('unchanged actor shade skips mask reads and tint writes while wind invalidates it', () => {
    const run = createShade();
    run('let reads = 0; chunk.treeShadePoints.has = () => {reads++; return false;}; updateActorShade(scene, sprite);');
    assert.equal(run('reads'), 32);
    run('updateActorShade(scene, sprite); sprite.x = 0.4; updateActorShade(scene, sprite)');
    assert.equal(run('reads'), 32);
    assert.equal(run('writes'), 1);
    run('scene.actorShadeVersion = 1; updateActorShade(scene, sprite)');
    assert.equal(run('reads'), 64);
    assert.equal(run('writes'), 1);
});

test('tree shade crosses negative chunk borders without counting actors own ground shadows', () => {
    const run = createShade();
    run('sprite.x = -8; const left = {shadowMask: new Uint8Array(256 * 256), treeShadePoints: new Set()}; loadedChunks.set(getChunkKey(-1, 0), left); for(let y = 12; y < 16; y++) for(let x = 252; x < 256; x++) {left.shadowMask[y * 256 + x] = 1; left.treeShadePoints.add(y * 256 + x);} updateActorShade(scene, sprite)');
    assert.equal(run('getActorShadeCoverage(-8, 0)'), 0.5);
    run('left.treeShadePoints.clear(); scene.actorShadeVersion = 1; updateActorShade(scene, sprite)');
    assert.equal(run('sprite.tint'), 0xffffff);
    assert.equal(run('getActorShadeCoverage(-256, -256)'), 0);
});

test('hidden actors are skipped and visible residents share the player shading rule', () => {
    const run = createShade();
    run('character = sprite; guide = null; const hidden = {...sprite, visible: false}; chunk.npcs = [{state: "home", sprite}, {state: "idle", sprite: hidden}]; sprite.visible = false; updateActorShading(scene)');
    assert.equal(run('writes'), 0);
    run('sprite.visible = true; updateActorShading(scene)');
    assert.equal(run('writes'), 1);
});
