const test = require('node:test');
const assert = require('node:assert/strict');
const {createPortraitPeople} = require('./portrait-fixture');
const {scanSeedResidents, inspectSeed, reconstructWorldSeed} = require('../tools/seed-runtime');
function donor(x = 13, y = 4) {return createPortraitPeople().run('createNpc(' + x + ',' + y + ',null)');}
function sharedSeed(designs, variant = 0) {return createPortraitPeople().run('makeNpcWorldSeed(13,' + JSON.stringify(designs) + ',' + variant + 'n)');}
test('natural appearances round-trip across ages, names, skin ramps and outfit rules', () => {
    const {run} = createPortraitPeople(); assert.equal(run('(()=>{for(let i=0;i<2500;i++){const npc=createNpc(i*7-5000,i*11-12000,null), rank=encodeNpcWorldDesign(npc), copy=createNpc(0,0,null,getNpcWorldRolls(decodeNpcWorldGenes(rank)));if(npc.name!==copy.name||JSON.stringify(npc.look)!==JSON.stringify(copy.look))return false;}return true;})()'), true);
});
test('a shared world uses existing spawn slots and preserves terrain and individual behavior', () => {
    const npc = donor(), seed = sharedSeed([{npc,count:0}], 3), points = scanSeedResidents(13, 200), actual = inspectSeed(seed, points);
    assert.equal(actual.length, 200); assert.equal(actual.every(person => person.matched && person.name === npc.name && JSON.stringify(person.look) === JSON.stringify(npc.look)), true);
    assert.deepEqual(scanSeedResidents(seed, 200), points); assert.equal(BigInt(seed) & 0xffffffffn, 13n);
    const {run} = createPortraitPeople(seed), people = points.map(point => run('createNpc(' + point.x + ',' + point.y + ',null)'));
    assert.equal(new Set(people.map(person => person.id)).size, 200); assert.ok(new Set(people.map(person => person.speed)).size > 100); assert.ok(new Set(people.map(person => person.seed)).size > 100);
    for (const point of [[10000,-10000],[-9000,8000]]) {const far = run('createNpc(...' + JSON.stringify(point) + ',null)'); assert.equal(far.name,npc.name); assert.equal(JSON.stringify(far.look),JSON.stringify(npc.look));}
});
test('two nearby quotas are deterministic and leave other residents on ordinary generation', () => {
    const first = donor(), second = donor(-18,-13), seed = sharedSeed([{npc:first,count:12},{npc:second,count:8}]), points = scanSeedResidents(13, 40);
    for (let reload = 0; reload < 2; reload++) {const {run} = createPortraitPeople(seed);
        points.forEach((point,index) => {const person = run('createNpc(' + point.x + ',' + point.y + ',null)'); if(index<20){const expected=index<12?first:second; assert.equal(person.name,expected.name); assert.equal(JSON.stringify(person.look),JSON.stringify(expected.look));} else {
            const ordinary = run('(()=>{let word=getNpcAppearanceWord(' + point.x + ',' + point.y + ');const rolls=NPC_APPEARANCE_RADICES.map(radix=>{const roll=Number(word%BigInt(radix));word/=BigInt(radix);return roll;});return createNpc(' + point.x + ',' + point.y + ',null,rolls);})()'); assert.equal(person.name,ordinary.name); assert.deepEqual(person.look,ordinary.look);
        }});
    }
});
test('changing one valid trait adds a fixed numeric offset while preserving terrain', () => {
    const npc = donor(); npc.look[8] = 0; const seed = sharedSeed([{npc,count:0}]), {run} = createPortraitPeople(seed), offset = BigInt(run('getNpcWorldFeatureOffset(16)'));
    const changed = BigInt.asUintN(288, BigInt(seed) + offset).toString(), expected = JSON.parse(JSON.stringify(npc)); expected.look[8] = 1;
    assert.equal(sharedSeed([{npc:expected,count:0}]), changed); assert.equal(BigInt(changed) & 0xffffffffn,13n);
    const actual = inspectSeed(changed,[{x:13,y:4}])[0]; assert.equal(actual.name,expected.name); assert.equal(JSON.stringify(actual.look),JSON.stringify(expected.look));
});
test('impossible natural designs and invalid group sizes are rejected', () => {
    const npc = donor(), impossible = JSON.parse(JSON.stringify(npc)); impossible.look[2] = 999;
    assert.throws(()=>sharedSeed([{npc:impossible,count:0}]), /natural NPC trait space/); assert.throws(()=>sharedSeed([{npc,count:128}]), /127/); assert.throws(()=>sharedSeed([{npc,count:0},{npc,count:1}]), /127/); assert.throws(()=>sharedSeed([{npc,count:1},{npc,count:1},{npc,count:1}]), /one or two/);
});
test('ordinary numeric seeds keep their existing appearance rolls', () => {
    for (const seed of ['13','6767676767676']) {const {run} = createPortraitPeople(seed); assert.equal(run('getNpcWorldAppearancePlan()'),null); assert.equal(run('(()=>{let word=getNpcAppearanceWord(-18,-13);const rolls=NPC_APPEARANCE_RADICES.map(radix=>{const roll=Number(word%BigInt(radix));word/=BigInt(radix);return roll;});return JSON.stringify(rolls)===JSON.stringify(getNpcAppearanceRolls(-18,-13));})()'),true);}
});
test('developer reconstruction independently verifies the requested nearby counts', () => {
    const result = reconstructWorldSeed({worldSeed:13,designs:[{sourceSeed:'13',x:13,y:4,count:12},{sourceSeed:'13',x:-18,y:-13,count:8}]});
    assert.deepEqual(result.verifiedCounts,[12,8]); assert.equal(result.examinedResidents,20); assert.equal(result.worldWide,false);
});
