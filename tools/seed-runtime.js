const fs = require('node:fs');
const {createPortraitPeople} = require('../tests/portrait-fixture');
function getSeedModel(worldSeed) {
    if (!Number.isInteger(worldSeed) || worldSeed < 1 || worldSeed > 0xffffffff) throw new Error('Invalid terrain seed');
    const {run} = createPortraitPeople(String(worldSeed)), literals = run('getNpcUnfoldedAppearanceWord.toString()').match(/0x[\da-f]+n/gi);
    if (!literals || literals.length !== 4) throw new Error('Appearance hash changed; update the solver model before searching');
    return {family: JSON.parse(run('JSON.stringify({period:getNpcWorldGenePeriod().toString(), span:(NPC_WORLD_COUNT_RADIX*NPC_WORLD_COUNT_RADIX).toString(), interval:NPC_WORLD_FAMILY_INTERVAL.toString(), mark:NPC_WORLD_FAMILY_MARK.toString()})')), radices: JSON.parse(run('JSON.stringify(NPC_APPEARANCE_RADICES)')), constants: literals.slice(1).map(value => BigInt(value.slice(0, -1)).toString()), styles: JSON.parse(run('JSON.stringify(NPC_STYLE_WEIGHTS.shirt)')), faces: JSON.parse(run('JSON.stringify(NPC_FACE_WEIGHTS)')), rareNames: JSON.parse(run('JSON.stringify(Object.fromEntries([...NPC_NAME_WEIGHTS.keys()].map(name => [name,Array.from({length:NPC_APPEARANCE_RADICES[22]},(_,roll)=>roll).filter(roll=>getNpcRareName(roll/NPC_APPEARANCE_RADICES[22])===name)])))'))};
}
function inspectSeed(seed, targets) {
    const {run} = createPortraitPeople(String(seed)), cellSize = run('NPC_CELL_SIZE'); if (!run('isValidWorldSeed(' + JSON.stringify(String(seed)) + ')')) throw new Error('Invalid numeric seed');
    return targets.map(target => {
        const point = JSON.stringify([target.x, target.y]), rolls = run('getNpcAppearanceRolls(...' + point + ')'), npc = run('createNpc(...' + point + ',null)'), spawned = run('findCellNpc(' + Math.floor(target.x / cellSize) + ',' + Math.floor(target.y / cellSize) + ')');
        const matched = (target.spawned === false || spawned?.tileX === target.x && spawned?.tileY === target.y) && (!target.name || npc.name === target.name) && (!target.firstName || npc.name.split(' ')[0] === target.firstName) && Object.entries(target.look || {}).every(([index, value]) => JSON.stringify(npc.look[index]) === JSON.stringify(value));
        return {x: target.x, y: target.y, matched, name: npc.name, look: npc.look, rolls};
    });
}
function scanSeedResidents(worldSeed, count, radius = 20) {
    if (!Number.isInteger(count) || count < 1 || count > 256 || !Number.isInteger(radius) || radius < 0 || radius > 64) throw new Error('Invalid resident scan bounds');
    const {run} = createPortraitPeople(String(worldSeed)), targets = [];
    for (let ring = 0; ring <= radius && targets.length < count; ring++) for (let y = -ring; y <= ring && targets.length < count; y++) for (let x = -ring; x <= ring && targets.length < count; x++) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== ring) continue; const npc = run('findCellNpc(' + x + ',' + y + ')'); if (npc) targets.push({x: npc.tileX, y: npc.tileY});
    }
    return targets;
}
function reconstructWorldSeed(request) {
    if (!Array.isArray(request.designs) || !request.designs.length || request.designs.length > 2) throw new Error('Provide one or two design references');
    const references = request.designs.map(design => {if (!Number.isInteger(design.x) || !Number.isInteger(design.y)) throw new Error('Invalid source location'); const source = inspectSeed(design.sourceSeed, [{x:design.x,y:design.y,spawned:false}])[0]; return {npc:{name:source.name,look:source.look},count:design.count ?? 0};});
    const {run} = createPortraitPeople(String(request.worldSeed)); const seed = run('makeNpcWorldSeed(' + JSON.stringify(request.worldSeed) + ',' + JSON.stringify(references) + ',' + BigInt(request.variant || 0) + 'n)');
    const points = scanSeedResidents(request.worldSeed, references.reduce((sum,design)=>sum+design.count,0) || 100), actual = inspectSeed(seed, points), counts = references.map(reference => actual.filter(npc => npc.name === reference.npc.name && JSON.stringify(npc.look) === JSON.stringify(reference.npc.look)).length);
    return {seed, verifiedCounts:counts, examinedResidents:actual.length, worldWide:references.length===1 && references[0].count===0};
}
function handleSeedRequest(request) {
    if (request.action === 'world') return reconstructWorldSeed(request);
    if (request.action === 'model') return getSeedModel(request.worldSeed);
    if (request.action === 'verify') return inspectSeed(request.seed, request.targets);
    if (request.action === 'scan') return scanSeedResidents(request.worldSeed, request.count, request.radius);
    throw new Error('Unknown seed-tool action');
}
if (require.main === module) {try {process.stdout.write(JSON.stringify(handleSeedRequest(JSON.parse(fs.readFileSync(0, 'utf8')))) + '\n');} catch (error) {process.stderr.write(error.message + '\n'); process.exitCode = 1;}}
module.exports = {getSeedModel, inspectSeed, scanSeedResidents, reconstructWorldSeed, handleSeedRequest};
