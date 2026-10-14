const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {decodePng} = require('../build-atlas');
test('tree canopies contain only leaf shades without isolated decorative dots', () => {
    const png = decodePng('media/environment/objects/tree-bare.png');
    const context = vm.createContext({TEST_MODE:false,trunk:{width:png.width,height:png.height,data:png.rgba}});
    vm.runInContext(['runtime/settings.js','runtime/state.js','world/terrain.js','art/textures.js','art/trees.js'].map(file=>fs.readFileSync('src/'+file,'utf8')).join('\n'),context);
    assert.equal(vm.runInContext('(()=>{for(let palette=0;palette<TREE_LEAF_PALETTES.length;palette++)for(let seed=0;seed<20;seed++){const tree=generateTreeVariant(trunk,seed,palette),allowed=new Set(TREE_LEAF_PALETTES[palette].colors);for(let pixel=0;pixel<tree.width*tree.height;pixel++)if(tree.canopyData[pixel*4+3]&&!allowed.has(readTreePixel(tree.canopyData,pixel)))return false;}return true;})()',context),true);
});

test('birch bark variations are reproducible and change existing trunk markings without changing its footprint', () => {
    const png = decodePng('media/environment/objects/tree-bare.png');
    const context = vm.createContext({TEST_MODE: false, trunk: {width: png.width, height: png.height, data: png.rgba}});
    vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'world/terrain.js', 'art/textures.js', 'art/trees.js'].map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext('TREE_LEAF_PALETTES[0].trunk = 1; const random = createSeededRandom; createSeededRandom = seed => {const roll = random(seed); let first = true; return () => {const value = roll(); if(first) {first = false; return 0.6;} return value;};}; const a = generateTreeVariant(trunk, 11, 0), repeat = generateTreeVariant(trunk, 11, 0), b = generateTreeVariant(trunk, 12, 0);', context);
    assert.equal(vm.runInContext('a.trunkData.every((value, index) => value === repeat.trunkData[index])', context), true);
    assert.equal(vm.runInContext('a.hitLeft === b.hitLeft && a.hitRight === b.hitRight', context), true);
    assert.equal(vm.runInContext('(() => {let different = 0; for(let y = trunk.height - 12; y < trunk.height; y++) for(let x = 0; x < trunk.width; x++) {const source = (y * trunk.width + x) * 4, target = ((y + TREE_PAD_TOP) * a.width + x + TREE_PAD_X) * 4; if(!trunk.data[source + 3]) continue; if(a.trunkData[target] !== b.trunkData[target] || a.trunkData[target + 1] !== b.trunkData[target + 1]) different++;} return different > 0;})()', context), true);
});
