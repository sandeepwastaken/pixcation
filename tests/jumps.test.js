const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('landing carries coordinates, heading, and tail phase into the normal renderer', () => {
    const run = jumpFixture(); run('nextFishJumpAt=Infinity; fishJumpRandom=()=>0.5; function splashFishJump() {} const graphics={clear() {return this;},fillStyle() {return this;},fillRect() {},setVisible() {return this;}}; const fish={x:10,y:30,heading:0,phase:0.7,length:42,radius:10,amplitude:1,jumping:true}; const jump={fish,graphics,color:0x4770b0,fromX:10,fromY:30,toX:40,toY:30,heading:0,fromHeading:0,height:10,anticipation:200,airborne:800,settling:300,start:0,lastTime:0,launched:false,landed:false}; fishJumps.push(jump); updateFishJumps({},1150)');
    assert.equal(run('fish.x'), 40); assert.equal(run('fish.y'), 30); assert.equal(run('fish.jumpWaterOpacity'), 0.5); assert.ok(run('fish.heading') > 0); assert.notEqual(run('fish.phase'), 0.7); run('updateFishJumps({},1300)');
    assert.equal(run('fish.jumping'), false); assert.equal(run('fish.heading'), 0); assert.equal(run('fish.jumpWaterOpacity'), undefined); assert.equal(run('fishJumps.length'), 0); assert.equal(run('fishJumpGraphics.length'), 1);
});
test('launch and landing preserve heading, geometry, and opacity at phase boundaries', () => {
    const run = jumpFixture(); run('const jump={fromX:10,fromY:30,toX:40,toY:30,heading:0,fromHeading:0,height:10,anticipation:200,airborne:800,settling:300,start:0,fish:{length:42,radius:10}}');
    for(const time of [200,1000]) for(const property of ['x','y','heading','bend','waterline','opacity','waterOpacity']) assert.ok(run('Math.abs(getFishJumpPose(jump,' + (time - 0.00001) + ').' + property + '-getFishJumpPose(jump,' + time + ').' + property + ')') < 0.001, property);
    assert.equal(run('getFishJumpPose(jump,1150).waterOpacity'), 0.5); assert.equal(run('getFishJumpPose(jump,1150).opacity'), 0.5);
});
test('fish jump poses remain stable across sizes and directions at every sampled frame', () => {
    const run = jumpFixture(); run('const poses = []; for(const length of [6,10,14,42]) for(const heading of [0,0.3,1.2,Math.PI]) {const jump={fromX:10,fromY:30,toX:10+Math.cos(heading)*30,toY:30+Math.sin(heading)*30,heading,height:10,anticipation:200,airborne:800,settling:300,start:0,fish:{length,radius:length*0.22}}; for(let time=0;time<=1400;time+=17) poses.push(getFishJumpPose(jump,time));}');
    assert.equal(require('node:crypto').createHash('sha256').update(run('JSON.stringify(poses)')).digest('hex'), '54ecedb371925382b467050fc886999616668667c1e9101ebdea24bddd7d95c2');
});
test('silhouette pixel coverage stays identical across sizes, headings, bends, and clipping', () => {
    const run = jumpFixture(); run('const coverage = [], graphics = {clear() {return this;}, fillStyle() {return this;}, fillRect(x,y) {coverage.push([x,y]);}}; for (const length of [6,10,14,42]) for (const heading of [0,0.3,1.2,Math.PI]) for (const bend of [0,4]) drawFishSilhouette(graphics, {length, radius:length * 0.22, amplitude:1, phase:0.75}, 30, 30, Math.cos(heading), Math.sin(heading), 0x123456, bend, 35)');
    assert.equal(require('node:crypto').createHash('sha256').update(run('JSON.stringify(coverage)')).digest('hex'), '8d567c25cb910e29da964256af358b6c16f2bfd2c06df4baab91803fd481d5b6');
});
function jumpFixture() {
    const context = vm.createContext({TEST_MODE: false, Phaser: {Math: {Clamp: (value, min, max) => Math.max(min, Math.min(max, value))}}}); vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'environment/jumps.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context); return code => vm.runInContext(code, context);
}
test('fish jumps anticipate, follow an arcing tangent, bend their bodies, and settle at the original depth', () => {
    const run = jumpFixture(); run('const jump = {fromX: 0, fromY: 30, toX: 30, toY: 30, heading: 0, height: 10, anticipation: 200, airborne: 800, settling: 300, start: 0, fish: {length: 30, radius: 6}}');
    assert.equal(run('getFishJumpPose(jump, 100).phase'), 'anticipation'); assert.ok(run('getFishJumpPose(jump, 100).opacity') < 1); assert.ok(run('getFishJumpPose(jump, 201).heading') < 0); assert.ok(run('getFishJumpPose(jump, 999).heading') > 0);
    assert.equal(run('getFishJumpPose(jump, 600).y'), 20); assert.ok(run('getFishJumpPose(jump, 600).bend') > 5); assert.equal(run('getFishJumpPose(jump, 600).waterline'), 30); assert.equal(run('getFishJumpPose(jump, 1000).phase'), 'settling');
    assert.equal(run('getFishJumpPose(jump, 1300).phase'), 'done'); assert.equal(run('getFishJumpPose(jump, 1300).waterHeading'), 0); assert.equal(run('getFishJumpPose(jump, 1300).opacity'), 0); assert.equal(run('getFishJumpPose(jump, 1300).waterOpacity'), 1);
});
test('airborne fish pixels fade across the water surface instead of using a hard cut', () => {
    const run = jumpFixture(); run('const pixels = []; let alpha = 1; const graphics = {clear() {return this;}, fillStyle(color, value) {alpha = value; return this;}, fillRect(x,y) {pixels.push([x,y,alpha]);}}; drawFishSilhouette(graphics, {length: 24, radius: 5, amplitude: 1, phase: 0}, 20, 20, 1, 0, 0x123456, 4, 20)');
    assert.ok(run('pixels.length') > 0); assert.equal(run('pixels.every(pixel => pixel[1] < 22.5)'), true); assert.equal(run('pixels.some(pixel => pixel[2] > 0 && pixel[2] < 1)'), true);
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
