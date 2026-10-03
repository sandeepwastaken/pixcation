const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createScene() {
    const context = vm.createContext({});
    const source = fs.readFileSync(path.join(__dirname, '../src/environment/particles.js'), 'utf8');
    vm.runInContext(`
        const particlePool = [];
        const availableParticles = [];
        const layer = { add(image) { image.displayList = this; } };
        const scene = { add: { image() {
            return {
                positions: [],
                setOrigin() { return this; }, setDisplaySize() { return this; },
                setTint() { return this; }, setDepth() { return this; },
                setVisible(value) { this.visible = value; return this; },
                setActive(value) { this.active = value; return this; },
                setPosition(x, y) { this.positions.push([x, y]); return this; }
            };
        } } };
    ` + source, context);
    return code => vm.runInContext(code, context);
}

test('dust moves only at animation steps and expires at its lifetime', () => {
    const run = createScene();
    run('spawnParticle(scene, layer, 0, 10, 20, -1, -1, 300, 0); const image = activeParticles[0]');
    for (let time = 0; time < 300; time += 10) run(`updateParticles(${time})`);
    assert.deepEqual(JSON.parse(run('JSON.stringify(image.positions)')), [[10, 20], [10, 19], [9, 18]]);
    run('updateParticles(300)');
    assert.equal(run('image.active || image.visible'), false);
    assert.equal(run('activeParticles.length'), 0);
    assert.equal(run('availableParticles.length'), 1);
});

test('ring particles expand at birth and pooled particles restart their animation', () => {
    const run = createScene();
    run('spawnParticle(scene, layer, 0, 10, 20, 0, 0, 300, 0, 0, 1, 1, true); const image = activeParticles[0]');
    for (let time = 0; time <= 300; time += 10) run(`updateParticles(${time})`);
    assert.deepEqual(JSON.parse(run('JSON.stringify(image.positions)')), [[10, 20], [12, 21], [14, 22], [16, 23]]);
    run('spawnParticle(scene, layer, 400, 30, 40, 1, -1, 300, 0); updateParticles(400); updateParticles(500)');
    assert.equal(run('particlePool.length'), 1);
    assert.equal(run('activeParticles[0] === image'), true);
    assert.deepEqual(JSON.parse(run('JSON.stringify(image.positions.slice(-2))')), [[30, 40], [30, 39]]);
});

test('releasing a middle particle keeps the others active and does not duplicate pooled objects', () => {
    const run = createScene();
    run('for (let i = 0; i < 3; i++) spawnParticle(scene, layer, 0, i, 0, 0, -1, 300, 0); const middle = activeParticles[1]; releaseParticle(middle); releaseParticle(middle); updateParticles(100)');
    assert.equal(run('activeParticles.length'), 2);
    assert.equal(run('availableParticles.length'), 1);
    assert.equal(run('activeParticles.every(image => image.active && image.positions.at(-1)[1] === -1)'), true);
    run('updateParticles(300)');
    assert.equal(run('availableParticles.length'), 3);
    assert.equal(run('new Set(availableParticles).size'), 3);
});
