const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createPortraitPeople} = require('./portrait-fixture');
test('heterochromia and blindness recolor both map and portrait eyes', () => {const {run}=createPortraitPeople();run('const look=createNpc(13,4,null).look;look[8]=0;look[13]=1;look[17]=new Array(8).fill(0);look[23]=1;const varied=getPersonPalette(look),sprite=composePersonPixels(scene,look,"front"),portrait=composePersonPortraitPixels(scene,look);look[23]=2;const blind=getPersonPalette(look),blindSprite=composePersonPixels(scene,look,"front"),blindPortrait=composePersonPortraitPixels(scene,look)');assert.notEqual(run('varied.eye'),run('varied.eye2'));assert.equal(run('new Set([sprite[6*NPC_PART_SIZE+6],sprite[6*NPC_PART_SIZE+9]]).size'),2);assert.equal(run('blind.eye'),run('NPC_BLIND_EYE_COLOR'));assert.equal(run('blind.eye2'),run('NPC_BLIND_EYE_COLOR'));assert.equal(run('blindSprite[6*NPC_PART_SIZE+6]'),run('NPC_BLIND_EYE_COLOR'));assert.notDeepEqual(run('Array.from(portrait.data)'),run('Array.from(blindPortrait.data)'));});
test('blind portraits lighten the black center pupils without whitening the darker iris shade', () => {const {run}=createPortraitPeople();run('const look=createNpc(13,4,null).look;look[8]=0;look[14]=0;look[23]=2;const palette=getPersonPalette(look),colors=getPortraitColorMap(look),portrait=composePersonPortraitPixels(scene,look),rgb=(x,y)=>portrait.data[(y*portrait.width+x)*4]<<16|portrait.data[(y*portrait.width+x)*4+1]<<8|portrait.data[(y*portrait.width+x)*4+2]');assert.ok(run('getNpcColorValue(rgb(20,26))')>150);assert.ok(run('getNpcColorValue(rgb(20,26))')<run('getNpcColorValue(palette.eye)'));assert.ok(run('getNpcColorValue(colors.get(0x660000))')<run('getNpcColorValue(palette.eye)'));});
test('new clothing and headwear obey their age and gender rules', () => {
    const {run}=createPortraitPeople();
    for(const profile of ['male','female','youngMale','youngFemale','olderMale','olderFemale']) {
        for(const shirt of [16,18]) assert.equal(run('NPC_STYLE_WEIGHTS.shirt.'+profile+'['+shirt+']>0'),profile==='female');
        assert.equal(run('NPC_STYLE_WEIGHTS.shirt.'+profile+'[17]>0'),!profile.startsWith('older'));
        assert.equal(run('NPC_STYLE_WEIGHTS.vanity.'+profile+'[8]>0'),profile==='male'||profile==='female');
        assert.equal(run('NPC_STYLE_WEIGHTS.vanity.'+profile+'[9]>0'),profile==='female');
    }
    assert.ok(run('NPC_STYLE_WEIGHTS.vanity.female[8]/NPC_STYLE_WEIGHTS.vanity.female.reduce((a,b)=>a+b,0)>NPC_STYLE_WEIGHTS.vanity.male[8]/NPC_STYLE_WEIGHTS.vanity.male.reduce((a,b)=>a+b,0)'));
    for(const [male,female] of [['male','female'],['youngMale','youngFemale']]) assert.ok(run('NPC_STYLE_WEIGHTS.shirt.'+male+'[17]/NPC_STYLE_WEIGHTS.shirt.'+male+'.reduce((a,b)=>a+b,0)>NPC_STYLE_WEIGHTS.shirt.'+female+'[17]/NPC_STYLE_WEIGHTS.shirt.'+female+'.reduce((a,b)=>a+b,0)'));
});
test('glasses never mix age groups and generated frames remain distinct from skin', () => {
    const {run}=createPortraitPeople(); assert.equal(run('(()=>{for(let i=0;i<10000;i++){const npc=createNpc(i*17-90000,i*31-140000,null),look=npc.look,palette=getPersonPalette(look);if(look[21]&&(look[1]===2?look[21]!==2:look[21]!==1))return false;if(look[21]&&!areNpcColorsSeparated(palette.extra[1],palette.skin[1],18,40))return false;const profile=getNpcStyleProfile(look[1],!!look[14]);if(!NPC_STYLE_WEIGHTS.shirt[profile][look[2]])return false;if(look[5]&&look[6]!==5&&!NPC_STYLE_WEIGHTS.vanity[profile][look[6]])return false;}return true;})()'),true);
});
test('both glasses styles and all new parts render across expressions and map directions', () => {
    const {run}=createPortraitPeople(); run('const look=createNpc(13,4,null).look;look[5]=0;look[6]=9;look[22]=0;look[17]=new Array(8).fill(0)');
    for(const extra of [0,1,2]) {run('look[21]='+extra);for(const expression of ['normal','openMouth','grin']) {const image=run('composePersonPortraitPixels(scene,look,'+JSON.stringify(expression)+')');assert.equal(image.data.length,55*62*4);}for(const direction of ['front','back','left','right'])for(const blink of [false,true]) assert.equal(run('composePersonPixels(scene,look,'+JSON.stringify(direction)+','+blink+').length'),256);}
    for(const shirt of [16,17,18]) {run('look[2]='+shirt);run('composePersonPortraitPixels(scene,look)');for(const direction of ['front','back','left','right'])run('composePersonPixels(scene,look,'+JSON.stringify(direction)+')');}
    for(const vanity of [8,9]) {run('look[5]=1;look[6]='+vanity);run('composePersonPortraitPixels(scene,look)');for(const direction of ['front','back','left','right'])run('composePersonPixels(scene,look,'+JSON.stringify(direction)+')');}
});
test('glasses align to the shifted map section, preserve eyes and stay behind hair', () => {
    const {run}=createPortraitPeople();run('const look=createNpc(13,4,null).look;look[8]=0;look[5]=0;look[6]=9;look[21]=0;look[22]=0;look[17]=new Array(8).fill(0);const bare=composePersonPixels(scene,look,"front");look[21]=1;const glasses=composePersonPixels(scene,look,"front"), palette=getPersonPalette(look)');
    assert.equal(run('glasses.some((color,index)=>color!==bare[index]&&color===palette.extra[1])'),true);assert.equal(run('glasses.filter(color=>color===palette.eye).length'),run('bare.filter(color=>color===palette.eye).length'));
    run('const portrait=composePersonPortraitPixels(scene,look), hair=getTerrainPixels(scene,"characters/people/portraits/hair10"), colors=getPortraitColorMap(look)');
    assert.equal(run('(()=>{for(let p=0;p<55*62;p++){const o=p*4;if(!hair.data[o+3])continue;const c=(hair.data[o]<<16)|(hair.data[o+1]<<8)|hair.data[o+2], expected=colors.get(c), actual=(portrait.data[o]<<16)|(portrait.data[o+1]<<8)|portrait.data[o+2];if(expected!==actual)return false;}return true;})()'),true);
});
test('appearance normalization preserves extra style and color and defaults old saves to none', () => {
    const {run}=createPortraitPeople();run(fs.readFileSync('src/runtime/progress.js','utf8'));run('const old=normalizePlayerLook([0,0,0,0,0,1,0,0]), selected=old.slice();selected[21]=2;selected[22]=7;selected[17][7]=0.5;const restored=normalizePlayerLook(JSON.parse(JSON.stringify(selected)))');
    const eyeTraits = run('(()=>{const normal=normalizePlayerLook([0,0,0,0,0,1,0,0]),selected=normal.slice();selected[23]=2;return [normal[23],normalizePlayerLook(selected)[23]]})()'); assert.deepEqual([...eyeTraits],[0,2]);
    assert.equal(run('old[21]'),0);assert.equal(run('restored[21]'),2);assert.equal(run('restored[22]'),7);assert.equal(run('restored[17][7]'),0.5);run('selected[21]=99;selected[22]=-1');assert.equal(run('normalizePlayerLook(selected)[21]'),0);assert.equal(run('normalizePlayerLook(selected)[22]'),0);
});
test('creator exposes every new part, none for extras and an independent frame-color slider', () => {
    const {run}=createPortraitPeople();run(fs.readFileSync('src/runtime/progress.js','utf8'));run(fs.readFileSync('src/ui/character-creator.js','utf8'));
    run('document={activeElement:null};const choices=new Map(),sliders=new Map();characterCreatorStepper=(label,options,current,change)=>choices.set(label,{options,change});characterCreatorSlider=(label,value,max,gradient,change)=>{const slider={style:{},change,max};sliders.set(label,slider);return slider;};updateCharacterCreatorScrollbar=()=>{};paintCharacterCreator=()=>{};characterCreator={scene,tab:1,tabs:[],controls:{scrollTop:0,replaceChildren(){}},look:normalizePlayerLook(PLAYER_LOOK)};refreshCharacterCreator()');
    assert.equal(run('choices.get("Shirt").options.length'),19);assert.equal(run('choices.get("Style").options.some(option=>option[0]===8)&&choices.get("Style").options.some(option=>option[0]===9)'),true);assert.equal(run('JSON.stringify(choices.get("Extra").options.map(option=>option[0]))'),'[0,1,2]');
    run('choices.get("Extra").change(2);characterCreator.tab=2;refreshCharacterCreator();sliders.get("Glasses").change(7500)');assert.equal(run('characterCreator.look[21]'),2);assert.equal(run('characterCreator.look[22]'),7);assert.equal(run('characterCreator.look[17][7]'),0.5);assert.equal(run('sliders.get("Glasses").disabled'),undefined);
    run('characterCreator.look[21]=0;refreshCharacterCreator()');assert.equal(run('sliders.get("Glasses").disabled'),true);
});
