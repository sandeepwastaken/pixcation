const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
test('richer regions hold more fish and restocking fills only missing slots', () => {
    const run = createSpawns(0);
    run('function createSeededRandom() { return () => roll; } function coordinateHash() { return roll; } function labelFishRegions() { return [{ start: 0, length: 20000 }]; } function spawnRegionFish(chunk, region, label, count) { for(let index = 0; index < count; index++) chunk.fish.push({region: label}); } const chunk = {pixelX: 0, pixelY: 0, fish: []}; spawnChunkFish(chunk)');
    const lean = run('chunk.fish.length'); run('spawnChunkFish(chunk)'); assert.equal(run('chunk.fish.length'), lean);
    run('chunk.fish.pop(); spawnChunkFish(chunk)'); assert.equal(run('chunk.fish.length'), lean);
    run('roll = 1; chunk.fish = []; spawnChunkFish(chunk)'); assert.ok(run('chunk.fish.length') > lean); assert.ok(run('chunk.fish.length') <= run('FISH_PER_CHUNK_MAX'));
});
test('fish fade down, stay submerged, and rise again without moving while visible', () => {
    const run = createSpawns(0.5);
    run("const fish = { x: 1, y: 2, surfacePhase: 'visible', surfaceTimer: 1, visibility: 1 }; let relocations = 0; function chooseFishTarget(chunk, fish) { relocations++; fish.targetX = 20; fish.targetY = 30; return true; } function setFishIdle() {} updateFishSurface({}, fish, 50)");
    assert.equal(run('fish.surfacePhase'), 'sinking');
    run('for (let step = 0; step < 14; step++) updateFishSurface({}, fish, 50)'); assert.equal(run('fish.visibility'), 0.5); assert.equal(run('relocations'), 0);
    run('for (let step = 0; step < 14; step++) updateFishSurface({}, fish, 50)'); assert.equal(run('fish.surfacePhase'), 'submerged'); assert.equal(run('fish.visibility'), 0);
    assert.equal(run('updateFishSurface({}, fish, 50)'), true);
    run('for (let step = 0; step < 159; step++) updateFishSurface({}, fish, 50)'); assert.equal(run('fish.surfacePhase'), 'rising'); assert.equal(run('relocations'), 1); assert.equal(run('fish.x'), 20);
    run('for (let step = 0; step < 28; step++) updateFishSurface({}, fish, 50)'); assert.equal(run('fish.visibility'), 1); assert.equal(run('fish.surfacePhase'), 'visible');
});
test('fish involved in fishing and jumping never submerge mid-animation', () => {
    const run = createSpawns();
    run("const fish = { surfacePhase: 'sinking', surfaceTimer: 1, visibility: 0.5, state: 'lure' }; updateFishSurface({}, fish, 50)");
    assert.equal(run('fish.visibility'), 1); assert.equal(run('fish.surfacePhase'), 'visible');
    run("fish.state = 'idle'; fish.jumping = true; updateFishSurface({}, fish, 50)"); assert.equal(run('fish.visibility'), 1);
    run('fish.jumping = false; fish.npcLured = true; updateFishSurface({}, fish, 50)'); assert.equal(run('fish.visibility'), 1);
});

test('giant rumor boosts stop after one successful giant without reducing population', () => {
    const run = createSpawns(0); run('const target=FISH_SPECIES_BY_ID.get("sturgeon"); function getChunkRumor(){return {species:target};} let fishRegionPixels=new Uint32Array(20000); function canFishSwim(){return true;} const chunk={fish:[]}, region={start:0,length:20000}; spawnRegionFish(chunk,region,1,9,0,0)');
    assert.equal(run('chunk.fish.length'),9); assert.equal(run('chunk.fish.filter(fish=>fish.size==="giant").length'),1); assert.equal(run('chunk.fish.filter(fish=>fish.rumor).length'),1);
    run('spawnRegionFish(chunk,region,2,9,0,0)'); assert.equal(run('chunk.fish.filter(fish=>fish.size==="giant").length'),1);
});
test('existing giants block bonus spawns and failed placements do not consume a bonus', () => {
    const run=createSpawns(0); run('const rumor={species:FISH_SPECIES_BY_ID.get("sturgeon")}, chunk={fish:[]}; function getChunkRumor(){return rumor;} let fishRegionPixels=new Uint32Array(20000); let fits=false; function canFishSwim(){return fits;} spawnRegionFish(chunk,{start:0,length:20000},1,1,0,0)');
    assert.equal(run('chunk.fish.length'),0); assert.equal(run('getRumorSpawnChance(chunk,rumor)'),0.05); run('fits=true;spawnRegionFish(chunk,{start:0,length:20000},1,1,0,0)'); assert.equal(run('getRumorSpawnChance(chunk,rumor)'),0);
});
test('rumor chance boundaries distinguish giant bonuses from other hints', () => {
    const run=createSpawns(0.05); run('let target=FISH_SPECIES_BY_ID.get("sturgeon"); function getChunkRumor(){return {species:target};} let fishRegionPixels=new Uint32Array(20000); function canFishSwim(){return true;} const chunk={fish:[]}, region={start:0,length:20000}; spawnRegionFish(chunk,region,1,1,0,0)');
    assert.equal(run('chunk.fish[0].rumor'),false); run('roll=0.049;chunk.fish=[];spawnRegionFish(chunk,region,1,1,0,0)'); assert.equal(run('chunk.fish[0].rumor'),true);
    run('target=FISH_SPECIES.find(species=>species.size==="large");roll=0.12;chunk.fish=[];spawnRegionFish(chunk,region,1,1,0,0)'); assert.equal(run('chunk.fish[0].rumor'),false); run('roll=0.119;chunk.fish=[];spawnRegionFish(chunk,region,1,1,0,0)'); assert.equal(run('chunk.fish[0].rumor'),true);
});
test('ordinary spawning retains its weighted species even when giants are already present', () => {
    const run=createSpawns(0.9999); run('function getChunkRumor(){return null;} let fishRegionPixels=new Uint32Array(20000); function canFishSwim(){return true;} const chunk={fish:[]}; spawnRegionFish(chunk,{start:0,length:20000},1,2,0,0)');
    assert.equal(run('chunk.fish.every(fish=>fish.size==="giant"&&!fish.rumor)'),true); assert.equal(run('chunk.fish.length'),2);
});

function createSpawns(roll = 0) {
    const context = vm.createContext({ roll });
    const source = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'fish/spawning.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + 'Math.random = () => roll;', context);
    return code => vm.runInContext(code, context);
}

test('spawn pools share water-area tiers and keep species in their original order', () => {
    const run = createSpawns();
    assert.equal(run('getFishSpawnPool(1800) === getFishSpawnPool(1999)'), true);
    assert.equal(run('getFishSpawnPool(1999) === getFishSpawnPool(2000)'), false);
    assert.deepEqual(JSON.parse(run('JSON.stringify(getFishSpawnPool(1800).species.map(fish => fish.id))')),
        ['bluegill', 'pumpkinseed', 'roach', 'common-dace', 'common-minnow', 'mosquitofish']);
    run('for (let area = 0; area <= 65536; area++) getFishSpawnPool(area)');
    assert.equal(run('fishSpawnPools.size'), run('fishSpawnThresholds.length + 1'));
});

test('weighted choices retain inclusive roll boundaries and the empty-pool fallback', () => {
    const run = createSpawns();
    assert.equal(run('chooseFishSpecies(0).id'), 'bluegill');
    assert.equal(run('roll = 7 / 39; chooseFishSpecies(1800).id'), 'bluegill');
    assert.equal(run('roll = (7 + 0.00001) / 39; chooseFishSpecies(1800).id'), 'pumpkinseed');
    assert.equal(run('roll = 0.9999999999999999; chooseFishSpecies(11999).id'), 'zebra-danio');
    assert.equal(run('chooseFishSpecies(12000).id'), 'sturgeon');
});
