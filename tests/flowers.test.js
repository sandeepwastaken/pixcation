const test = require('node:test');
const assert = require('node:assert/strict');
const {createPortraitPeople} = require('./portrait-fixture');
const {decodePng} = require('../build-atlas');
test('flower placement avoids bridges, water, dirt, and grass dirt-corner footprints', () => {
    const {run} = createFlowers();
    for (const tile of [{key:'dirt1'}, {key:'water'}, {key:'grassEdge'}, {key:'wood',bridge:true}]) assert.equal(run('getGrassFlowerPlacement(4,5,' + JSON.stringify(tile) + ').length'), 0);
    assert.equal(run('(()=>{for(let y=-30;y<30;y++)for(let x=-30;x<30;x++){const corners=[{x:0,y:0,size:7},{x:11,y:11,size:5}],flowers=getGrassFlowerPlacement(x,y,{key:"grass2",patches:corners});for(const p of flowers)if(corners.some(c=>p.x<c.x+c.size&&p.x+3>c.x&&p.y<c.y+c.size&&p.y+4>c.y))return false;}return true;})()'), true);
});
test('the single flower preserves the original petal and shadow pixels exactly', () => {
    const {run} = createFlowers();
    assert.equal(run('(()=>{const source=extractGrassFlowerPixels(getTerrainPixels(scene,"grass3"),getTerrainPixels(scene,"grass2")).flowers,flower=extractSingleGrassFlower(source);for(let y=0;y<4;y++)for(let x=0;x<3;x++)for(let c=0;c<4;c++)if(flower.data[(y*3+x)*4+c]!==source.data[(y*16+x)*4+c])return false;return true;})()'), true);
});
test('flower patch positions respond to the world seed and use ordinary grass tiles too', () => {
    const first = createPortraitPeople('13'), second = createPortraitPeople('14');
    const sample = 'JSON.stringify(Array.from({length:400},(_,i)=>getGrassFlowerPlacement(i%20,Math.floor(i/20),{key:"grass1"})))';
    assert.notEqual(first.run(sample), second.run(sample));
});
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
test('flower textures contain one native-size flower while grass stays tile-sized', () => {
    const {run, textures} = createFlowers(); run('createGrassFlowerTextures(scene)');
    for(const key of ['grass3', 'grass4']) { const plain = textures.get(key + '-plain'), flowers = textures.get(key + '-flowers'); assert.equal(plain.width, 16); assert.equal(flowers.width, 3); assert.equal(flowers.height, 4); assert.equal(flowers.data.filter((value, index) => index % 4 === 3 && value !== 0).length, 8); assert.ok(plain.data.every((value, index) => index % 4 !== 3 || value === 255)); }
    const count = textures.size; run('createGrassFlowerTextures(scene)'); assert.equal(textures.size, count);
});
test('seeded single-flower patches vary in density and position without clipping', () => {
    const {run} = createFlowers();
    const placements = run('(() => {const values = new Set(), counts = new Set(); for(let y = -20; y < 20; y++) for(let x = -20; x < 20; x++) {const tile={key:"grass1"},a = getGrassFlowerPlacement(x, y,tile), b = getGrassFlowerPlacement(x, y,tile); if(JSON.stringify(a) !== JSON.stringify(b) || a.some(p=>!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x+3>TILE_SIZE||p.y+4>TILE_SIZE)) return -1;counts.add(a.length);for(const p of a)values.add(JSON.stringify(p));}return counts.size>4?values.size:-1;})()');
    assert.ok(placements > 50);
});
