const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const {decodePng} = require('../build-atlas');
const {encodePersonArt} = require('../build-person-art');
const {pixelArtId, indexPixelArt, decodePixelArt} = require('../src/art/pixel-pack');
const {buildSite} = require('../build-site');
const files = ['media/characters/people/parts.png', ...fs.readdirSync('media/characters/people/portraits').filter(file => file.endsWith('.png')).map(file => 'media/characters/people/portraits/' + file)];
test('runtime pixel reads decode lazily, reuse cached data, and never touch source textures', () => {
    const binary = fs.readFileSync('media/person-art.bin'), context = vm.createContext({binary});
    vm.runInContext(['src/art/pixel-pack.js','src/world/surfaces.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n'), context);
    vm.runInContext('let reads=0; const scene={cache:{binary:{get() {reads++; return binary;}}},terrainPixelCache:new Map(),textureSourceCache:new Map(),textures:{get() {throw new Error("Unexpected source texture lookup");}}}; const first=getTerrainPixels(scene,"character-parts"), second=getTerrainPixels(scene,"character-parts")', context);
    assert.equal(vm.runInContext('first === second',context),true); assert.equal(vm.runInContext('reads',context),1); assert.equal(vm.runInContext('scene.terrainPixelCache.size',context),1);
});
test('packed artwork reproduces every original RGBA pixel, including transparent colors', () => {
    const bytes = fs.readFileSync('media/person-art.bin'), pack = indexPixelArt(bytes);
    assert.equal(pack.entries.size, files.length);
    for (const file of files) {const source = decodePng(file), key = file.slice(6, -4), image = decodePixelArt(pack, key); assert.equal(image.width, source.width); assert.equal(image.height, source.height); assert.deepEqual(Buffer.from(image.data), source.rgba);}
    assert.equal(decodePixelArt(pack, 'unknown'), null); assert.equal(bytes.includes(Buffer.from('vanity6')), false);
    assert.equal(pixelArtId('character-parts'), pixelArtId('characters/people/parts'));
});
test('legacy character art remains editable but is omitted from the runtime pack', () => {
    assert.equal(fs.existsSync('media/characters/people/legacy/portraits/shirt10.png'), true); assert.equal(decodePixelArt(indexPixelArt(fs.readFileSync('media/person-art.bin')), 'characters/people/legacy/portraits/shirt10'), null);
});
test('the main atlas no longer contains any NPC source artwork', () => {
    const atlas = JSON.parse(fs.readFileSync('media/atlas.json', 'utf8')); assert.equal(Object.keys(atlas.frames).some(key => key.startsWith('characters/people/')), false);
});
test('indexed runs preserve long spans and nonopaque alpha', () => {
    const rgba = Buffer.alloc(512 * 4); for (let pixel = 0; pixel < 512; pixel++) rgba.set(pixel < 300 ? [90, 80, 70, 0] : [10, 20, 30, 128], pixel * 4);
    const bytes = encodePersonArt([{key: 'sample', width:512, height:1, rgba}]), image = decodePixelArt(indexPixelArt(bytes), 'sample'); assert.deepEqual(Buffer.from(image.data), rgba);
    assert.ok(bytes.length < rgba.length);
});
test('corrupt headers, palette references, and incomplete runs fail before returning pixels', () => {
    const bytes = encodePersonArt([{key:'sample',width:2,height:1,rgba:Buffer.from([1,2,3,255,1,2,3,255])}]);
    assert.throws(() => indexPixelArt(bytes.subarray(0,1)), /Truncated/); assert.throws(() => indexPixelArt(bytes.subarray(0,-1)), /Invalid/);
    const invalidCount = Buffer.from(bytes); invalidCount[invalidCount.length - 2] = 0; assert.throws(() => decodePixelArt(indexPixelArt(invalidCount), 'sample'), /Invalid pixel run/);
    const invalidColor = Buffer.from(bytes); invalidColor[invalidColor.length - 1] = 255; assert.throws(() => decodePixelArt(indexPixelArt(invalidColor), 'sample'), /Invalid pixel run/);
    const incomplete = Buffer.from(bytes); incomplete[incomplete.length - 2] = 1; assert.throws(() => decodePixelArt(indexPixelArt(incomplete), 'sample'), /Incomplete/);
});
test('duplicate records and oversized palettes are rejected during encoding', () => {
    const image = {key:'same',width:1,height:1,rgba:Buffer.from([1,2,3,255])}; assert.throws(() => encodePersonArt([image,image]), /Invalid source/);
    const rgba = Buffer.alloc(257 * 4); for (let pixel=0;pixel<257;pixel++) rgba.writeUInt32LE(pixel, pixel * 4); assert.throws(() => encodePersonArt([{key:'palette',width:257,height:1,rgba}]), /palette limit/);
});
test('publish builds contain runtime data but no editable NPC images, PSDs, source scripts, or tests', t => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'pixcation-public-')); t.after(() => fs.rmSync(output, {recursive:true,force:true})); buildSite({output,rebuild:false});
    assert.equal(fs.existsSync(path.join(output,'media/person-art.bin')), true); assert.equal(fs.existsSync(path.join(output,'media/characters/people')), false); assert.equal(fs.existsSync(path.join(output,'src')), false); assert.equal(fs.existsSync(path.join(output,'tests')), false);
    assert.deepEqual(fs.readdirSync(output).sort(), ['game.js','index.html','media']); assert.throws(() => buildSite({output,rebuild:false}), /must be empty/);
});
