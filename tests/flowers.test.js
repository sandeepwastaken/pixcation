const test = require('node:test');
const assert = require('node:assert/strict');
const {createPortraitPeople} = require('./portrait-fixture');
const {decodePng} = require('../build-atlas');
function createFlowers() {
    const fixture = createPortraitPeople(); fixture.run("const originalPixels = getTerrainPixels; getTerrainPixels = (scene, key) => originalPixels(scene, 'environment/terrain/' + key)"); return fixture;
}
test('flower extraction includes every flower pixel and its pixel-below shadow without altering the source', () => {
    const {run} = createFlowers();
    for (const key of ['grass3', 'grass4']) {
        run(`const source${key} = getTerrainPixels(scene, '${key}'), layers${key} = extractGrassFlowerPixels(source${key}, getTerrainPixels(scene, 'grass2'));`);
        const result = run(`(() => { const source = source${key}, layers = layers${key}; let petals = 0, shadows = 0; for(let pixel = 0; pixel < source.width * source.height; pixel++) {const offset = pixel * 4, color = source.data[offset] << 16 | source.data[offset + 1] << 8 | source.data[offset + 2]; if(FLOWER_COLORS.has(color) || color === FLOWER_PATCH_SOURCE) {petals++; if(!layers.flowers.data[offset + 3]) return false; const below = offset + source.width * 4; if(below < source.data.length) {shadows++; if(!layers.flowers.data[below + 3]) return false;}} for(let channel = 0; channel < 4; channel++) if((layers.flowers.data[offset + 3] ? layers.flowers.data : layers.grass.data)[offset + channel] !== source.data[offset + channel]) return false;} return petals === 20 && shadows === 20; })()`);
        assert.equal(result, true);
        assert.equal(run(`(() => {const data = layers${key}.grass.data; for(let offset = 0; offset < data.length; offset += 4) {const color = data[offset] << 16 | data[offset + 1] << 8 | data[offset + 2]; if(FLOWER_COLORS.has(color) || color === FLOWER_PATCH_SOURCE) return false;} return true;})()`), true);
        const png = decodePng(`media/environment/terrain/${key}.png`); assert.deepEqual([...run(`source${key}.data`)], [...png.rgba]);
    }
});
test('flower and plain grass textures retain native dimensions and transparency', () => {
    const {run, textures} = createFlowers(); run('createGrassFlowerTextures(scene)');
    for(const key of ['grass3', 'grass4']) { const plain = textures.get(key + '-plain'), flowers = textures.get(key + '-flowers'); assert.equal(plain.width, 16); assert.equal(flowers.width, 16); assert.equal(flowers.height, 16); assert.ok(flowers.data.some((value, index) => index % 4 === 3 && value === 0)); assert.ok(plain.data.every((value, index) => index % 4 !== 3 || value === 255)); }
    const count = textures.size; run('createGrassFlowerTextures(scene)'); assert.equal(textures.size, count);
});
test('seeded flower flips repeat without shifting or clipping', () => {
    const {run} = createFlowers();
    const placements = run('(() => {const values = new Set(); for(let y = -20; y < 20; y++) for(let x = -20; x < 20; x++) {const a = getGrassFlowerPlacement(x, y), b = getGrassFlowerPlacement(x, y); if(JSON.stringify(a) !== JSON.stringify(b) || a.x !== 0 || a.y !== 0) return -1; values.add(JSON.stringify(a));} return values.size;})()');
    assert.equal(placements, 2);
});
