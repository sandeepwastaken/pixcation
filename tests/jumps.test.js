const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('silhouette pixel coverage stays identical across sizes, headings, bends, and clipping', () => {
    const run = jumpFixture(); run('const coverage = [], graphics = {clear() {return this;}, fillStyle() {return this;}, fillRect(x,y) {coverage.push([x,y]);}}; for (const length of [6,10,14,42]) for (const heading of [0,0.3,1.2,Math.PI]) for (const bend of [0,4]) drawFishSilhouette(graphics, {length, radius:length * 0.22, amplitude:1, phase:0.75}, 30, 30, Math.cos(heading), Math.sin(heading), 0x123456, bend, 35)');
    assert.equal(require('node:crypto').createHash('sha256').update(run('JSON.stringify(coverage)')).digest('hex'), 'ab64fccb3d0aa6c46f58e4ff885412e8dffd05c88672c1d023518e6baef93a5b');
});
function jumpFixture() {
    const context = vm.createContext({TEST_MODE: false, Phaser: {Math: {Clamp: (value, min, max) => Math.max(min, Math.min(max, value))}}}); vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'environment/jumps.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context); return code => vm.runInContext(code, context);
}
test('fish jumps anticipate, follow an arcing tangent, bend their bodies, and settle at the original depth', () => {
    const run = jumpFixture(); run('const jump = {fromX: 0, fromY: 30, toX: 30, toY: 30, heading: 0, height: 10, anticipation: 200, airborne: 800, settling: 300, start: 0, fish: {length: 30, radius: 6}}');
    assert.equal(run('getFishJumpPose(jump, 100).phase'), 'anticipation'); assert.ok(run('getFishJumpPose(jump, 100).opacity') < 1); assert.ok(run('getFishJumpPose(jump, 201).heading') < 0); assert.ok(run('getFishJumpPose(jump, 999).heading') > 0);
    assert.equal(run('getFishJumpPose(jump, 600).y'), 20); assert.ok(run('getFishJumpPose(jump, 600).bend') > 5); assert.equal(run('getFishJumpPose(jump, 600).waterline'), 30); assert.equal(run('getFishJumpPose(jump, 1000).phase'), 'settling');
    assert.equal(run('getFishJumpPose(jump, 1300).phase'), 'done'); assert.equal(run('getFishJumpPose(jump, 1300).y'), 30); assert.equal(run('getFishJumpPose(jump, 1300).opacity'), 1);
});
test('airborne fish pixels are clipped at the water surface as they emerge and reenter', () => {
    const run = jumpFixture(); run('const pixels = [], graphics = {clear() {return this;}, fillStyle() {return this;}, fillRect(x,y) {pixels.push([x,y]);}}; drawFishSilhouette(graphics, {length: 24, radius: 5, amplitude: 1, phase: 0}, 20, 20, 1, 0, 0x123456, 4, 20)');
    assert.ok(run('pixels.length') > 0); assert.equal(run('pixels.every(pixel => pixel[1] < 20)'), true);
});

test('jump silhouettes and their splash particles stay on the water side of the deck layer', () => {
    const effects = [], scene = {children: {}, add: {graphics: () => ({setVisible() {return this;}, setDepth(depth) {this.depth = depth; return this;}})}};
    const context = vm.createContext({TEST_MODE: false, scene, spawnParticle: (...args) => effects.push(args), idleRipple: (...args) => effects.push(args), getWaterTint: () => [1, 1, 1], tintMapColor: color => color});
    vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'environment/jumps.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('const fish = {x: 8, y: 8, length: 8, heading: 0}; pickJumpingFish = () => [fish, {}]; canFishSwim = () => true; worldObjectLayer = {add() {throw new Error("Jump cannot enter actor layer");}}; startFishJump(scene, 100);', context);
    assert.equal(vm.runInContext('fishJumps[0].graphics.depth', context), 1.3);
    assert.equal(effects.every(args => args[1] === scene.children || args[4] === scene.children), true);
    assert.equal(effects[0][5], 1.3);
    for (const effect of effects.slice(1)) assert.equal(effect[9], 1.3);
});
