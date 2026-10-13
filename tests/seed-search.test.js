const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {getSeedModel, inspectSeed, scanSeedResidents} = require('../tools/seed-runtime');
const {createPortraitPeople} = require('./portrait-fixture');
const {createHash} = require('node:crypto');
const python = path.join(__dirname, '../.venv/bin/python');
const available = fs.existsSync(python) && spawnSync(python, ['-c', 'import z3']).status === 0;
function search(request) {
    const result = spawnSync(python, ['tools/seed-search.py'], {input: JSON.stringify(request), encoding: 'utf8', timeout: 20000});
    assert.equal(result.error, undefined); assert.equal(result.status, 0, result.stderr || result.stdout); return JSON.parse(result.stdout);
}
test('seed model reads the current generator rather than maintaining a separate hash or radix table', () => {
    const files = ['src/runtime/settings.js','src/environment/npcs.js','game.js'], fingerprint = () => createHash('sha256').update(files.map(file=>fs.readFileSync(file)).join('')).digest('hex'), before = fingerprint(); getSeedModel(13); inspectSeed('13',[{x:13,y:4}]); assert.equal(fingerprint(),before);
    const model = getSeedModel(13), {run} = createPortraitPeople('13');
    assert.deepEqual(model.radices, JSON.parse(run('JSON.stringify(NPC_APPEARANCE_RADICES)'))); assert.equal(model.constants.length, 3); assert.deepEqual(model.styles, JSON.parse(run('JSON.stringify(NPC_STYLE_WEIGHTS.shirt)')));
});
test('resident scans identify naturally occupied cells, while verification rejects absent spawn locations', () => {
    const points = scanSeedResidents(13, 12); assert.equal(points.length, 12); assert.equal(new Set(points.map(p => p.x + ',' + p.y)).size, 12); assert.equal(inspectSeed('13', points).every(p => p.matched), true); assert.equal(inspectSeed('13', [{x:0,y:0}])[0].matched, false);
});
test('a numeric candidate cannot pass verification through matching raw rolls alone', () => {
    const result = inspectSeed('13', [{x:13,y:4,name:'not a generated name'}]); assert.equal(result[0].matched, false); assert.equal(Array.isArray(result[0].rolls), true);
});
test('multi-target reconstruction finds an ordinary decimal seed and checks every NPC in the unchanged runtime', {skip: !available}, () => {
    const targets = scanSeedResidents(13, 2).map(p => ({...p,rolls:{0:[0,100]}})), result = search({worldSeed:13,targets,timeoutSeconds:5});
    assert.equal(result.status, 'sat'); assert.match(result.seed, /^[1-9][0-9]{0,86}$/); assert.equal(BigInt(result.seed) & 0xffffffffn, 13n); assert.equal(result.verifiedMatches, 2); assert.equal(inspectSeed(result.seed, targets).every(p => p.matched && p.rolls[0] <= 100), true);
});
test('contradictory requirements return unsat rather than modifying generation or inventing a seed', {skip: !available}, () => {
    const targets = [{x:13,y:4,rolls:{0:0}},{x:13,y:4,rolls:{0:1}}], result = search({worldSeed:13,targets,timeoutSeconds:5,sampleCandidates:0}); assert.equal(result.status, 'unsat'); assert.equal(result.seed, undefined);
});
test('fixed-seed symbolic modeling reproduces actual rolls including signed coordinates', {skip: !available}, () => {
    const {run} = createPortraitPeople(); const seed = run('makeNpcAppearanceSeed(13,-18,-13,NPC_APPEARANCE_RADICES.map((radix,index)=>(index*17+3)%radix),41n)'), actual = inspectSeed(seed,[{x:-18,y:-13,spawned:false}])[0];
    const result = search({worldSeed:13,fixedSeed:seed,targets:[{x:-18,y:-13,spawned:false,rolls:Object.fromEntries(actual.rolls.map((roll,index)=>[index,roll]))}],timeoutSeconds:5}); assert.equal(result.status, 'sat'); assert.equal(result.seed, seed);
});
test('bounded searches distinguish unknown from impossible and preserve independently verified best candidates', {skip: !available}, () => {
    const result = search({worldSeed:13,targets:[{x:13,y:4,name:'no such generated name'}],timeoutSeconds:5,maxCandidates:1,sampleCandidates:0}); assert.equal(result.status,'unknown'); assert.equal(result.seed,undefined); assert.equal(result.rejectedCandidates,1);
});
