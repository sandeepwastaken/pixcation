const test = require('node:test');
const assert = require('node:assert/strict');
test('corrected shirt order keeps decorative trim on thirteen and neutral fastenings on fourteen and fifteen', () => {
    const run = createPeople(); run('const orderedRolls=NPC_APPEARANCE_RADICES.map(()=>0); orderedRolls[14]=29; const orderedLook=[5,0,12,7,5,1,5,5,0,6,8,1,6,0,1,0.8,0,new Array(8).fill(0),undefined,1,1]; balanceNpcAppearance(orderedLook,orderedRolls);'); assert.equal(run('orderedLook[10]'), 8); for(const shirt of [13,14]) {run('orderedLook[2]=' + shirt + ';orderedLook[10]=8;balanceNpcAppearance(orderedLook,orderedRolls);'); assert.equal(run('[9,10].includes(orderedLook[10])'), true);}
});
test('contrast balancing avoids hair highlights, skin-colored fabric, and headwear that merges into the forehead', () => {
    const run = createPeople(); assert.equal(run('(() => {for(const pastel of [0,5]) for(const face of [0,1,2]) for(const blend of [0,0.08]) for(let step=0;step<=256;step++){const rolls=NPC_APPEARANCE_RADICES.map(()=>0),look=createNpc(step,face,null).look; look[0]=pastel;look[1]=face;look[15]=step/256;look[5]=1;look[7]=step%NPC_ACCESSORY_COLORS.length;look[9]=step%NPC_HAIR_COLORS.length;look[3]=step%NPC_SHIRT_COLORS.length;look[17]=new Array(8).fill(blend);balanceNpcAppearance(look,rolls);const p=getPersonPalette(look);if(!isNpcHairDistinct(p.hair,p.skin)||!isNpcFabricDistinct(p.shirt[1],p.skin)||!areNpcColorsSeparated(p.top[2],p.skin[2],18,40)||!areNpcColorsSeparated(p.shirt[1],p.shirtAccent))return false;}return true;})()'), true);
});
test('generated appearance contrast uses actual blended palettes without changing the shared player renderer', () => {
    const run = createPeople(); assert.equal(run('(() => {for(let index=0;index<5000;index++){const npc=createNpc(index*19-40000,index*23-50000,null),p=getPersonPalette(npc.look); if(!areNpcColorsSeparated(p.hair[1],p.skin[1],18,40) || !areNpcColorsSeparated(p.shirt[1],p.shirtAccent) || !areNpcColorsSeparated(p.pants[1],p.pantsAccent[1],24) || [4,13,14].includes(npc.look[2]) && ![9,10].includes(npc.look[10]) || npc.look.some(value=>typeof value === "number" && !Number.isFinite(value)))return false;} return true;})()'), true);
    run('const unrestrictedLook=[0,0,4,1,1,0,1,1,0,1,1,0,1,0,0,0.5,0,new Array(8).fill(0)]; const unrestrictedPalette=getPersonPalette(unrestrictedLook);'); assert.equal(run('unrestrictedPalette.shirt[1] === unrestrictedPalette.shirtAccent'), true); assert.equal(run('unrestrictedPalette.pants[1] === unrestrictedPalette.pantsAccent[1]'), true);
});
test('detailed shirts outweigh basic tops while stated gender preferences hold after normalization', () => {
    const run = createPeople(); for(const profile of ['male','female','youngMale','youngFemale']) assert.equal(run('(() => {const weights=NPC_STYLE_WEIGHTS.shirt.' + profile + '; return weights[7]+weights[9]+weights[10]+weights[12]+weights[14] > weights[0]+weights[2];})()'), true); for(const [male,female,indices] of [['male','female',[10,11,14]],['youngMale','youngFemale',[10]]]) for(const index of indices) assert.equal(run('(() => {const male=NPC_STYLE_WEIGHTS.shirt.' + male + ',female=NPC_STYLE_WEIGHTS.shirt.' + female + '; return female[' + index + ']/female.reduce((sum,weight)=>sum+weight,0) > male[' + index + ']/male.reduce((sum,weight)=>sum+weight,0);})()'), true);
});
test('muted NPC colors and compatible shirt accents are favored without limiting player palettes', () => {
    const run = createPeople(); assert.equal(run('NPC_SHIRT_COLOR_WEIGHTS[7]'), 1); assert.equal(run('NPC_SHIRT_COLORS.length'), 16); assert.equal(run('NPC_SHIRT_ACCENT_NEUTRALS.length'), 16); for(const primary of [8,9,10,12]) {run('var outfitRolls=NPC_APPEARANCE_RADICES.map(()=>0); var primaryRoll=Array.from({length:100},(_,roll)=>roll).find(roll=>getNpcWeightedIndex(roll,NPC_SHIRT_COLOR_WEIGHTS)===' + primary + '); outfitRolls[6]=primaryRoll;'); assert.equal(run('Array.from({length:100},(_,roll)=>{outfitRolls[14]=roll; return getNpcOutfitColors(outfitRolls).shirtAccent;}).filter(accent=>accent===11).length > 60'), true);}
});
test('expanded fair skin includes warm and cool highlights with clearly separated shading', () => {
    const run = createPeople(); assert.equal(run('(() => {const value=color=>(color>>16&255)*0.2126+(color>>8&255)*0.7152+(color&255)*0.0722; for(let step=0;step<=100;step++){const skin=getPersonSkinRamp(false,5/6+step/600); if(value(skin[2])-value(skin[1])<34 || value(skin[1])-value(skin[0])<40 || value(skin[0])-value(skin[3])<40) return false;} return true;})()'), true); assert.equal(run('getPersonSkinRamp(false,1)[2]'), 0xfff0e9); assert.equal(run('getPersonSkinRamp(false,0.75).every((color,index)=>color===NPC_SKIN_TONES[0][index])'), true);
    assert.equal(run('(() => {for(let step=1;step<=1000;step++){const first=getPersonSkinRamp(false,(step-1)/1000),second=getPersonSkinRamp(false,step/1000); for(let shade=0;shade<4;shade++) for(const shift of [16,8,0]) if(Math.abs((first[shade]>>shift&255)-(second[shade]>>shift&255))>2)return false;} return true;})()'), true);
});
test('expanded accessory palettes stay reachable for seeded residents and shared player palettes', () => {
    const run = createPeople(); assert.equal(run('NPC_ACCESSORY_COLORS.length'), 13); assert.equal(run('NPC_HEADWEAR_COLOR_WEIGHTS.length'), 13); assert.equal(run('new Set(Array.from({length:100},(_,roll)=>getNpcWeightedIndex(roll,NPC_HEADWEAR_COLOR_WEIGHTS))).size'), 13); run('const paletteLook=createNpc(13,4,null).look; paletteLook[5]=1; paletteLook[17]=new Array(8).fill(0);'); for(let index=0;index<13;index++){run('paletteLook[7]=' + index); assert.equal(run('JSON.stringify(getPersonPalette(paletteLook).top)'), run('JSON.stringify(NPC_ACCESSORY_COLORS[' + index + '])'));}
});
test('new shirt and hair rows render in every map direction on the enlarged parts sheet', () => {
    const run = createPeople(); assert.equal(run('getTerrainPixels({}, "character-parts").height >= (NPC_SHIRTS + 1) * NPC_PART_SIZE'), true); run('const expandedLook = createNpc(13,4,null).look; expandedLook[5] = 0;'); for (const direction of ['front','back','left','right']) for (const [slot, count] of [[2,16],[6,13]]) for (let part = 0; part < count; part++) {run('expandedLook[' + slot + '] = ' + part + '; var expandedPixels = composePersonPixels({}, expandedLook, ' + JSON.stringify(direction) + ')'); assert.equal(run('expandedPixels.length'), 256); assert.ok(run('expandedPixels.filter(pixel=>pixel!==null).length') > 20);}
});
test('new wardrobe rows follow explicit age and gender rules with softer young outfit exceptions', () => {
    const run = createPeople(); for (const profile of ['male','female','youngMale','youngFemale','olderMale','olderFemale']) {assert.equal(run('NPC_STYLE_WEIGHTS.hair.' + profile + '.length'), 13); assert.equal(run('NPC_STYLE_WEIGHTS.shirt.' + profile + '.length'), 16); for (const index of [10,11,12]) assert.equal(run('NPC_STYLE_WEIGHTS.hair.' + profile + '[' + index + '] > 0'), profile === 'female');}
    for (const [index, profiles] of [[9,['male','female','youngMale','youngFemale']],[10,['male','female','youngMale','youngFemale']],[11,['male','female']],[12,['female','youngFemale']],[13,['male','female','youngMale','youngFemale','olderMale','olderFemale']],[14,['male','female']],[15,['female','youngFemale']]]) for (const profile of ['male','female','youngMale','youngFemale','olderMale','olderFemale']) assert.equal(run('NPC_STYLE_WEIGHTS.shirt.' + profile + '[' + index + '] > 0'), profiles.includes(profile));
    for (const index of [10,11,14]) assert.ok(run('NPC_STYLE_WEIGHTS.shirt.female[' + index + ']') > run('NPC_STYLE_WEIGHTS.shirt.male[' + index + ']')); for (const index of [12,15]) assert.ok(run('NPC_STYLE_WEIGHTS.shirt.youngFemale[' + index + ']') < run('NPC_STYLE_WEIGHTS.shirt.female[' + index + ']'));
});
test('stronger makeup is deterministic, adult weighted, uncommon for young residents, and absent for older residents', () => {
    const run = createPeople(); assert.equal(run('JSON.stringify([0,1,2].map(face => Array.from({length:100},(_,seed)=>getNpcMakeupVariant(face,true,seed)).reduce((sum,value)=>sum+value,0)))'), JSON.stringify([30,8,0])); assert.equal(run('Array.from({length:100},(_,seed)=>getNpcMakeupVariant(0,false,seed)).every(value=>value===0)'), true);
});
test('pronounced canines use independent seeded chances and never occur on older residents', () => {
    const run = createPeople(); assert.equal(run('JSON.stringify([0,1,2].map(face=>Array.from({length:100},(_,roll)=>getNpcMouthVariant(face,roll)).reduce((sum,value)=>sum+value,0)))'), JSON.stringify([5,8,0]));
    run('const rolls=NPC_APPEARANCE_RADICES.map(()=>0); rolls[0]=100; rolls[22]=9999; getNpcAppearanceRolls=()=>rolls;'); for(const faceRoll of [0,65,90]) for(let mouthRoll=0;mouthRoll<100;mouthRoll++) {run('rolls[4]=' + faceRoll + '; rolls[24]=' + mouthRoll + '; constNpc=createNpc(13,4,null)'); assert.equal(run('constNpc.look[19]'), run('getNpcMouthVariant(constNpc.look[1],' + mouthRoll + ')'));}
});
test('pastel skin shades retain clear value separation throughout the continuous hue ramp', () => {
    const run = createPeople(); assert.equal(run('(() => {const value = color => (color >> 16 & 255) * 0.2126 + (color >> 8 & 255) * 0.7152 + (color & 255) * 0.0722; for(let index=0;index<=255;index++) {const skin=getPersonSkinRamp(true,index/255); if(value(skin[2])-value(skin[1]) < 35 || value(skin[1])-value(skin[0]) < 35 || value(skin[0])-value(skin[3]) < 20) return false;} return true;})()'), true);
});
test('young and older wardrobes exclude adult party cuts while older hair colors favor gray', () => {
    const run = createPeople(); for(const profile of ['youngFemale','olderFemale']) for(const index of [1,3,5]) assert.equal(run('NPC_STYLE_WEIGHTS.shirt.' + profile + '[' + index + ']'), 0); for(const profile of ['olderMale','olderFemale']) assert.equal(run('NPC_STYLE_WEIGHTS.vanity.' + profile + '[7]'), 0); assert.equal(run('NPC_STYLE_WEIGHTS.pants.olderFemale[1]'), 0);
    run('const rolls=NPC_APPEARANCE_RADICES.map(()=>0); const grayCounts=[0,0,0]; for(let face=0;face<3;face++) for(let roll=0;roll<100;roll++) {rolls[12]=roll; if(getNpcOutfitColors(rolls,face).hair===4) grayCounts[face]++;}'); assert.equal(run('JSON.stringify(grayCounts)'), JSON.stringify([5,1,30]));
});
test('older wardrobes exclude crop tops, bikinis, shirt six, short-cut pants, and oversized bows', () => {
    const run = createPeople(); for (const gender of ['Male','Female']) {const profile = 'older' + gender; for (const index of [1,3,5]) assert.equal(run('NPC_STYLE_WEIGHTS.shirt.' + profile + '[' + index + ']'), 0); assert.equal(run('NPC_STYLE_WEIGHTS.pants.' + profile + '[4]'), 0);}
    assert.equal(run('NPC_STYLE_WEIGHTS.vanity.olderFemale[7]'), 0); assert.ok(run('NPC_STYLE_WEIGHTS.hair.olderFemale[7]') > run('NPC_STYLE_WEIGHTS.hair.olderFemale[8]'));
});
test('generation applies the age profile to every ordinary wardrobe category', () => {
    const run = createPeople(); run('const rolls = NPC_APPEARANCE_RADICES.map(() => 0); rolls[0] = 100; rolls[22] = 9999; getNpcAppearanceRolls = () => rolls;'); for(const face of [0,1,2]) for(const feminine of [0,1]) for(let roll=0;roll<720;roll++) {run('rolls[4]=' + [0,65,90][face] + '; rolls[18]=' + feminine + '; rolls[5]=' + roll + '; constNpc = createNpc(13,4,null)'); const profile = (face===1?'young':face===2?'older':'') + (face===0?(feminine?'female':'male'):(feminine?'Female':'Male')); assert.ok(run('NPC_STYLE_WEIGHTS.shirt.' + profile + '[constNpc.look[2]]') > 0);}
});
test('accent selection preserves weighted results without temporary palette arrays', () => {
    const run = createPeople(); assert.equal(run('(() => {for(const count of [7,16]) for(let primary=0;primary<count;primary++) for(let neutral=0;neutral<count;neutral++) for(let roll=0;roll<100;roll++) {const weights=Array.from({length:count},(_,index)=>index===neutral?60:index===primary?20:1); if(getNpcAccentColor(roll,primary,neutral,count)!==getNpcWeightedIndex(roll,weights)) return false;} return true;})()'), true);
});
test('style weights favor everyday hairstyles and shirt six while keeping unusual styles reachable', () => {
    const run = createPeople(); run('const hairCounts = Array.from({length:120},(_,roll)=>getNpcWeightedIndex(roll,NPC_STYLE_WEIGHTS.hair.male,120)).reduce((counts,index)=>{counts[index]++;return counts;},new Array(NPC_HAIRSTYLES).fill(0)); const shirtCounts = Array.from({length:720},(_,roll)=>getNpcWeightedIndex(roll,NPC_STYLE_WEIGHTS.shirt.female,720)).reduce((counts,index)=>{counts[index]++;return counts;},new Array(NPC_SHIRTS).fill(0))');
    assert.equal(run('hairCounts[3]'), 1); assert.ok(run('hairCounts[0]') > 30); assert.ok(run('hairCounts[9]') > 20); assert.ok(run('shirtCounts[5]') > run('shirtCounts[3]') * 8); assert.equal(run('shirtCounts.every(count=>count > 0)'), true);
});
test('all valid gender and age style options remain reachable with existing seed radices', () => {
    const run = createPeople(); for(const [category, radix] of [['hair',120],['shirt',720],['vanity',143],['pants',20]]) for(const key of JSON.parse(run('JSON.stringify(Object.keys(NPC_STYLE_WEIGHTS.' + category + '))'))) {const weights = 'NPC_STYLE_WEIGHTS.' + category + '.' + key; assert.equal(run('new Set(Array.from({length:' + radix + '},(_,roll)=>getNpcWeightedIndex(roll,' + weights + ',' + radix + '))).size'), run(weights + '.filter(weight=>weight > 0).length'));}
});
test('natural wardrobe weights favor everyday colors while every palette remains reachable', () => {
    const run = createPeople(), counts = JSON.parse(run('JSON.stringify(Array.from({length: 100}, (_, roll) => getNpcWeightedIndex(roll, NPC_HAIR_COLOR_WEIGHTS)).reduce((counts, index) => {counts[index]++; return counts;}, new Array(NPC_HAIR_COLORS.length).fill(0)))'));
    assert.deepEqual(counts, [36, 31, 10, 12, 5, 5, 1]); for (const weights of ['NPC_SHIRT_COLOR_WEIGHTS', 'NPC_PANTS_COLOR_WEIGHTS', 'NPC_HEADWEAR_COLOR_WEIGHTS']) assert.equal(run('new Set(Array.from({length:100},(_,roll)=>getNpcWeightedIndex(roll,' + weights + '))).size'), run(weights + '.length'));
    assert.equal(run('NPC_SHIRT_COLORS.length'), 16); assert.equal(run('Array.from({length: 100}, (_, roll) => getNpcAccentColor(roll, 7, 10, NPC_SHIRT_COLORS.length)).filter(color => color === 10).length > 60'), true);
});
test('seeded residents keep small color variations without drifting into adjacent bright palettes', () => {
    const run = createPeople(); assert.equal(run('Array.from({length:200},(_,i)=>createNpc(i*19-800,i*23-500,null)).every(npc=>npc.look[17].length === 7 && npc.look[17].every(value=>value >= 0 && value <= 0.08))'), true);
});
const fs = require('node:fs');
const vm = require('node:vm');
const { decodePng } = require('../build-atlas');

test('normal and young NPCs walk at 40 to 105 percent speed while older NPCs keep 35 to 55 percent', () => {
    const run = createPeople();
    run('const rolls = NPC_APPEARANCE_RADICES.map(() => 0); getNpcAppearanceRolls = () => rolls;');
    for (const [roll, minimum, maximum] of [[0, 0.4, 1.05], [65, 0.4, 1.05], [90, 0.35, 0.55]]) {
        for (const amount of [0, 0.5, 1]) {
            run('rolls[4] = ' + roll + '; npcHash = () => ' + amount + ';');
            assert.ok(Math.abs(run('createNpc(13, 4, null).speed') - (minimum + amount * (maximum - minimum))) < 1e-12);
        }
    }
});

test('face selection gives older residents a ten percent chance while keeping all three ages', () => {
    const run = createPeople();
    run('const counts = [0, 0, 0]; for (let roll = 0; roll < NPC_APPEARANCE_RADICES[4]; roll++) counts[getNpcFace(roll)]++;');
    assert.deepEqual(JSON.parse(run('JSON.stringify(counts)')), [65, 25, 10]);
});

test('every pastel hue remains continuous and colorful without whitening its highlights', () => {
    const run = createPeople();
    for (const amount of [0, 0.2, 0.4, 0.6, 0.8]) {
        run('var ramp = getPersonSkinRamp(true, ' + amount + '), light = ramp[2], channels = [light >> 16 & 255, light >> 8 & 255, light & 255];');
        assert.ok(run('Math.max(...channels) - Math.min(...channels) >= 30'));
        assert.ok(run('Math.min(...channels) < 225'));
    }
    run('const purple = getPersonSkinRamp(true, 0.8)[2];');
    assert.ok(run('(purple & 255) > (purple >> 16 & 255) && (purple >> 16 & 255) > (purple >> 8 & 255)'));
});

test('both contributors name additions survive merging the weighted name generator', () => {
    const run = createPeople();
    for (const name of ['Ansel', 'Arham']) assert.equal(run('NPC_FIRST_NAMES.filter(name => name === ' + JSON.stringify(name) + ').length'), 1);
});

test('uncommon names use generic weighted data rather than character-specific generation branches', () => {
    const run = createPeople();
    run('NPC_NAME_WEIGHTS.set("Other", 2)');
    assert.equal(run('getNpcRareName(0.0001)'), 'Other');
    assert.equal(run('getNpcRareName(0.0002)'), 'Other');
    assert.equal(run('getNpcRareName(0.0004)'), null);
});

test('natural and pastel skin ramps interpolate across hundreds of distinct palettes', () => {
    const run = createPeople();
    for (const pastel of [false, true]) {
        assert.ok(run('new Set(Array.from({length: 256}, (_, index) => JSON.stringify(getPersonSkinRamp(' + pastel + ', index / 255)))).size') > 200);
        assert.deepEqual(JSON.parse(run('JSON.stringify(getPersonSkinRamp(' + pastel + ', 0.8))')), JSON.parse(run('JSON.stringify(getPersonSkinRamp(' + pastel + ', 52428 / 65535))')));
    }
    run('const varied = createNpc(13, 4, null).look; varied[17] = undefined; const basic = getPersonPalette(varied); varied[16] = 18928771; const blended = getPersonPalette(varied);');
    assert.notEqual(run('JSON.stringify(basic.shirt)'), run('JSON.stringify(blended.shirt)'));
    assert.notEqual(run('JSON.stringify(basic.hair)'), run('JSON.stringify(blended.hair)'));
});

test('Emz occurs on exactly one of ten thousand independent name rolls', () => {
    const run = createPeople();
    run('const rareNames = NPC_APPEARANCE_RADICES.map(() => 0); rareNames[0] = 1; rareNames[8] = 99; getNpcAppearanceRolls = () => rareNames; let emz = 0; for(let index = 0; index < 10000; index++) {rareNames[22] = index; rareNames[19] = index; if(createNpc(13, 4, null).name.split(" ")[0] === "Emz") emz++;}');
    assert.equal(run('emz'), 1);
});

test('blink eyelids use the mid skin tone and retain every other source pixel', () => {
    const run = createPeople(solveRequestedSeed());
    run('const resident = findCellNpc(1, 0), open = composePersonPixels({}, resident.look, "front"), closed = composePersonPixels({}, resident.look, "front", true), mid = getPersonPalette(resident.look).skin[1];');
    assert.equal(run('closed[6 * 16 + 6]'), run('mid'));
    assert.equal(run('open[6 * 16 + 6]'), run('NPC_EYE_COLORS[0]'));
    assert.equal(run('open.every((color, index) => closed[index] === color || color === NPC_EYE_COLORS[0] && closed[index] === mid)'), true);
});

test('blink timing closes and reopens without changing facing, animation frame, or tint', () => {
    const run = createPeople();
    run('const actor = {x: 0, y: 0, visible: true, tint: 0xdbdbdb, texture: {key: "character-frontwalk1"}, personBlinkState: {next: 100, until: 0, closed: false}, setTexture(key) {this.texture.key = key;}}; const scene = {textures: {exists: () => true}}; character = actor;');
    run('updatePersonBlink(scene, actor, PLAYER_LOOK, "front", 1, 100)');
    assert.equal(run('actor.texture.key'), 'character-frontwalk1-blink');
    run('updatePersonBlink(scene, actor, PLAYER_LOOK, "front", 1, 220)');
    assert.equal(run('actor.texture.key'), 'character-frontwalk1');
    assert.equal(run('actor.tint'), 0xdbdbdb);
});

function createPeople(seed = '13') {
    const image = decodePng('media/characters/people/parts.png'), storage = new Map();
    const context = vm.createContext({ TEST_MODE: false, URLSearchParams, window: { location: { search: '?seed=' + seed } }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, Phaser: { Math: { Clamp: (value, low, high) => Math.max(low, Math.min(high, value)) } }, getTerrainPixels: () => ({ width: image.width, height: image.height, data: image.rgba }) });
    const files = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'npc-names.js', 'npc-dialogue.js', 'art/people.js', 'world/terrain.js', 'world/decks.js', 'environment/props.js', 'environment/actors.js', 'environment/npcs.js', 'environment/npc-worlds.js'];
    vm.runInContext(files.map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    return code => vm.runInContext(code, context);
}

function solveRequestedSeed() {
    return createPeople()('makeNpcAppearanceSeed(13, 13, 4, [0, 0, 0, 52428, 0, 45, 58, 90, 0, 0, 0, 64, 99, 0, 29, 8, 99, 0, 1, 0, 0, 0, 0, 0, 1])');
}

test('a reversed ordinary seed produces the requested rare resident near spawn', () => {
    const run = createPeople(solveRequestedSeed());
    run('const resident = findCellNpc(1, 0)');
    assert.equal(run('resident.tileX'), 13);
    assert.equal(run('resident.tileY'), 4);
    assert.equal(run('resident.name'), 'Emz');
    assert.deepEqual(JSON.parse(run('JSON.stringify(resident.look)')), [5, 0, 1, 7, 5, 1, 5, 5, 0, 6, 8, 1, 6, 0, 1, 0.8, 0, [0, 0, 0, 0, 0, 0, 0], null, 1, 1]);
    assert.equal(run('WORLD_SEED'), 13);
    assert.equal(run('getTerrainType(0, 0)'), 'grass');
    assert.equal(run('(() => { const queue = [[0, 0]], seen = new Set(["0,0"]); for (let index = 0; index < queue.length; index++) { const [x, y] = queue[index]; if (x === 13 && y === 4) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, key = nx + "," + ny; if (Math.abs(nx) > 25 || Math.abs(ny) > 25 || seen.has(key) || !isNpcWalkableTile(nx, ny)) continue; seen.add(key); queue.push([nx, ny]); } } return false; })()'), true);
    assert.notEqual(run('JSON.stringify(createNpc(13, 5, null).look)'), run('JSON.stringify(resident.look)'));
});

test('the requested costume renders mixed vanity hair, pants, skin, and clothing colors', () => {
    const run = createPeople(solveRequestedSeed());
    run("const resident = findCellNpc(1, 0), colors = new Set(composePersonPixels({}, resident.look, 'front'));");
    for (const color of ['NPC_HAIR_COLORS[6][1]', 'NPC_ACCESSORY_COLORS[5][2]', 'NPC_SKIN_TONES[5][1]', 'NPC_SHIRT_COLORS[7][1]', 'NPC_PANTS_COLORS[5][0]', 'NPC_PANTS_COLORS[5][1]', 'NPC_PANTS_COLORS[6][1]', 'NPC_EYE_COLORS[0]']) assert.equal(run('colors.has(' + color + ')'), true, color);
});

test('eyes recolor independently from skin shadows and survive mirroring', () => {
    const run = createPeople();
    run("const look = [0, 1, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 1, 5, 0], front = composePersonPixels({}, look, 'front'), left = composePersonPixels({}, look, 'left'), right = composePersonPixels({}, look, 'right')");
    assert.equal(run('front[6 * NPC_PART_SIZE + 6]'), run('NPC_EYE_COLORS[5]'));
    assert.equal(run('front[7 * NPC_PART_SIZE + 6]'), run('NPC_EYE_COLORS[5]'));
    assert.deepEqual(JSON.parse(run('JSON.stringify(right)')), JSON.parse(run('JSON.stringify(mirrorPersonPixels(left))')));
});

test('appearance seeds reverse arbitrary combinations and preserve isolated saves', () => {
    const run = createPeople();
    run('const rolls = NPC_APPEARANCE_RADICES.map((radix, index) => (index * 17 + 3) % radix)');
    const seed = run('makeNpcAppearanceSeed(71, -8, 29, rolls, 41n)');
    const reversed = createPeople(seed);
    assert.deepEqual(JSON.parse(reversed('JSON.stringify(getNpcAppearanceRolls(-8, 29))')), JSON.parse(run('JSON.stringify(rolls)')));
    assert.equal(reversed('WORLD_SEED'), 71);
    assert.equal(reversed('SAVE_KEY'), 'pixcation-save-v1:' + seed);
    assert.notEqual(reversed('SAVE_KEY'), run('SAVE_KEY'));
    for (const invalid of ['0', '-1', '1.5', 'abc', String(1n << 288n)]) assert.equal(createPeople(invalid)('getRequestedWorldSeed()'), null);
});

test('eye weights and wardrobe rarity retain their stated probabilities', () => {
    const run = createPeople();
    assert.deepEqual(JSON.parse(run('JSON.stringify(Array.from({length: 7}, (_, index) => Array.from({length: 100}, (_, roll) => getNpcEyeColor(roll)).filter(color => color === index).length))')), [64, 16, 7, 6, 4, 2, 1]);
    const counts = JSON.parse(run('JSON.stringify(Array.from({length: 10000}, (_, roll) => { const rolls = NPC_APPEARANCE_RADICES.map(() => 0); rolls[0] = roll; rolls[1] = roll % 100; getNpcAppearanceRolls = () => rolls; const npc = createNpc(13, 4, null); return [Number(npc.look[5] === 1 && npc.look[6] === 5), Number(npc.look[0] >= 5), Number(npc.look[3] !== npc.look[10] && npc.look[4] !== npc.look[12])]; }).reduce((counts, row) => counts.map((count, index) => count + row[index]), [0, 0, 0]))'));
    assert.deepEqual(counts, [1, 100, 10000]);
});

test('all pants styles shade their primary color separately from the pink-purple accent', () => {
    const run = createPeople();
    for (let style = 0; style < 5; style++) for (const direction of ['back', 'front', 'left', 'right']) {
        run('constituentLook = [0, 0, 0, 0, 5, 1, 0, 0, 0, 0, 1, ' + style + ', 6, 0, 0]; composed = composePersonPixels({}, constituentLook, ' + JSON.stringify(direction) + ');');
        assert.equal(run('(() => { const sheet = getTerrainPixels({}, "character-parts"), column = ' + JSON.stringify(direction) + ' === "back" ? 0 : ' + JSON.stringify(direction) + ' === "front" ? 1 : 2, mirror = ' + JSON.stringify(direction) + ' === "right", colors = new Map([[0x4a0067, NPC_PANTS_COLORS[5][0]], [0xb700ff, NPC_PANTS_COLORS[5][1]], [0xdf8fff, NPC_PANTS_COLORS[6][1]]]); for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { const source = ((' + (style + 2) + ' * 16 + y) * sheet.width + (9 + column) * 16 + (mirror ? 15 - x : x)) * 4, color = sheet.data[source] << 16 | sheet.data[source + 1] << 8 | sheet.data[source + 2]; if (colors.has(color) && composed[(y + 8) * 16 + x] !== colors.get(color)) return false; } return true; })()'), true, 'pants ' + (style + 1) + ' ' + direction);
    }
});

test('exactly one of five surname rolls produces a first name only', () => {
    const run = createPeople();
    run('const nameRolls = NPC_APPEARANCE_RADICES.map(() => 0); nameRolls[18] = 1; nameRolls[19] = NPC_FEMININE_FIRST_NAMES.indexOf("Emz"); getNpcAppearanceRolls = () => nameRolls;');
    const names = Array.from({length: 5}, (_, roll) => run('nameRolls[20] = ' + roll + '; createNpc(13, 4, null).name'));
    assert.equal(names.filter(name => !name.includes(' ')).length, 1);
    assert.equal(names[0], 'Emz');
    assert.equal(names.slice(1).every(name => name.startsWith('Emz ')), true);
});

test('all specified hair, clothing, and pants rows obey their gender rules and remain available', () => {
    for (const feminine of [0, 1]) {
        const run = createPeople();
        run('const wardrobeRolls = NPC_APPEARANCE_RADICES.map(() => 0); wardrobeRolls[0] = 1; wardrobeRolls[22] = 1; wardrobeRolls[8] = 99; wardrobeRolls[18] = ' + feminine + '; getNpcAppearanceRolls = () => wardrobeRolls; const looks = []; for(let roll = 0; roll < 720; roll++) {wardrobeRolls[5] = roll; wardrobeRolls[10] = roll % 120; wardrobeRolls[15] = roll % 20; looks.push(createNpc(13, 4, null).look);}');
        for (const [index, allowed] of [[6, feminine ? [0, 2, 7, 8, 9, 10, 11, 12] : [0, 1, 3, 4, 5, 6, 8, 9]], [2, feminine ? Array.from({length: 16}, (_, index) => index) : [0, 2, 4, 6, 7, 8, 9, 10, 11, 13, 14]], [11, feminine ? [0, 1, 2, 3, 4] : [0, 2, 3, 4]]]) assert.deepEqual(JSON.parse(run('JSON.stringify([...new Set(looks.map(look => look[' + index + ']))].sort((a, b) => a - b))')), allowed);
    }
});

test('unisex vanity preferences retain both genders without admitting female-only rows to men', () => {
    const counts = [];
    for (const feminine of [0, 1]) {
        const run = createPeople();
        run('const vanityRolls = NPC_APPEARANCE_RADICES.map(() => 0); vanityRolls[0] = 1; vanityRolls[22] = 1; vanityRolls[18] = ' + feminine + '; getNpcAppearanceRolls = () => vanityRolls; const counts = new Array(8).fill(0); for(let roll = 0; roll < 143; roll++) {vanityRolls[9] = roll; counts[createNpc(13, 4, null).look[6]]++;}');
        counts.push(JSON.parse(run('JSON.stringify(counts)')));
    }
    assert.equal(counts[0][4], 0); assert.equal(counts[0][5], 0);
    assert.equal(counts[1][2], 0); assert.ok(counts[0][2] > 0);
    assert.ok(counts[0][7] > 0 && counts[1][7] > 0);
    assert.ok(counts[1][4] > 0);
    assert.equal(counts[0][3], 0); assert.ok(counts[1][3] > 0);
    assert.ok(counts[0][6] > counts[1][6] && counts[1][6] > 0);
    const rare = createPeople();
    rare('const rareRolls = NPC_APPEARANCE_RADICES.map(() => 0); getNpcAppearanceRolls = () => rareRolls; const resident = createNpc(13, 4, null);');
    assert.equal(rare('resident.look[14]'), 1); assert.equal(rare('resident.look[6]'), 5);
    assert.equal(rare('NPC_FEMININE_FIRST_NAMES.includes(resident.name.split(" ")[0])'), true);
});
