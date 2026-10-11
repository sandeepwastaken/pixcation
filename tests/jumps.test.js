const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

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
