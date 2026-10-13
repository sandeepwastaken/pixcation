const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('dialogue avoids repeating the same line twice even when random rolls repeat', () => {
    const run = createNpcs();
    run('npcRandom = () => 0; const lines = ["One.", "Two.", "Three."], choices = []; for (let index = 0; index < 20; index++) choices.push(pickNpcDialogueLine(first, lines));');
    assert.equal(run('choices.every((line, index) => !index || line !== choices[index - 1])'), true);
    run('npcRandom = () => 1; const chosen = pickNpcDialogueLine(first, lines);');
    assert.equal(run('chosen'), 'Three.');
});

test('home dialogue acknowledges being indoors instead of saying the resident is outside again', () => {
    const run = createNpcs();
    run('findNearestRumor = getMysteryShopRumor = () => null; first.state = "home"; first.lastActivity = "rest"; const text = buildNpcDialogue(scene, first).chat.text;');
    assert.equal(run('NPC_ACTIVITY_LINES.home.includes(text)'), true);
    assert.equal(run('text.includes("outside again")'), false);
});

test('housemates passing in opposite directions use a real sidestep route instead of deadlocking at the door', () => {
    const run = createNpcs();
    run('first.house = second.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); enterNpcHouse(second); const resident = getNpcIndoorResident(scene, first), other = getNpcIndoorResident(scene, second); resident.sprite.setPosition(48, 32); other.sprite.setPosition(48, 48); resident.journey = "exit"; other.journey = "enter"; let overlap = false, exited = false, sidestepped = false; for (let time = 100; time < 8000; time += 50) {if (!exited) {updateInteriorResident(scene, resident, time, 50); sidestepped ||= resident.sprite.x !== 48; if (resident.sprite.x === 48 && resident.sprite.y === 48) {exited = true; first.state = "idle";}} updateInteriorResident(scene, other, time, 50); if (!exited) overlap ||= !canInteriorResidentStand(resident, resident.sprite.x, resident.sprite.y); if (exited && other.journey === null) break;}');
    assert.equal(run('overlap'), false); assert.equal(run('sidestepped'), true);
    assert.equal(run('exited'), true); assert.equal(run('other.journey'), null);
    assert.ok(run('other.sprite.y + NPC_PART_SIZE <= other.room.bottom'));
});

test('house entry clears overlapping residents and the doorway without placing anyone in furniture', () => {
    const run = createNpcs();
    run('first.house = second.house = {doorX: 3, doorY: 3}; character.x = 48; character.y = 32; enterNpcHouse(first); enterNpcHouse(second); const resident = getNpcIndoorResident(scene, first), other = getNpcIndoorResident(scene, second); resident.sprite.setPosition(48, 32); other.sprite.setPosition(48, 48); resident.room.blocked = [[48, 12, 64, 32]]; interior = {...resident.room, residents: [{npc: first}, {npc: second}]}; updateInteriorResidents = () => {}; clearInteriorEntrance(scene);');
    assert.ok(run('canInteriorResidentStand(resident, resident.sprite.x, resident.sprite.y)'));
    assert.ok(run('canInteriorResidentStand(other, other.sprite.x, other.sprite.y)'));
    assert.ok(run('resident.sprite.x !== 48 || resident.sprite.y < 16'));
    assert.ok(run('other.sprite.x !== 48 || other.sprite.y < 16'));
    assert.ok(run('resident.sprite.y + NPC_PART_SIZE <= resident.room.bottom && other.sprite.y + NPC_PART_SIZE <= resident.room.bottom'));
    assert.equal(run('saveDirty'), true);
});

test('entering a house leaves unobstructing residents in their own positions', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; character.x = 48; character.y = 32; enterNpcHouse(first); const resident = getNpcIndoorResident(scene, first); resident.sprite.setPosition(0, 0); interior = {...resident.room, residents: [{npc: first}]}; updateInteriorResidents = () => {}; clearInteriorEntrance(scene);');
    assert.equal(run('resident.sprite.x'), 0); assert.equal(run('resident.sprite.y'), 0);
});

test('an indoor exit replans immediately when a moving housemate blocks its remaining route', () => {
    const run = createNpcs();
    run('first.house = second.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); enterNpcHouse(second); const resident = getNpcIndoorResident(scene, first), other = getNpcIndoorResident(scene, second); resident.sprite.setPosition(0, 0); other.sprite.setPosition(80, 0); resident.journey = "exit"; other.journey = null; updateInteriorResident(scene, resident, 100, 50); const routeBefore = JSON.stringify([resident.goal, resident.route]); other.sprite.setPosition(32, 0); resident.room.occupancyVersion++; updateInteriorResident(scene, resident, 150, 50);');
    assert.notEqual(run('JSON.stringify([resident.goal, resident.route])'), run('routeBefore'));
    assert.equal(run('isInteriorResidentRouteClear(resident)'), true);
    assert.ok(run('Math.abs(resident.sprite.x) + Math.abs(resident.sprite.y) <= Math.ceil(CHARACTER_SPEED * first.speed * 0.1)'));
});

test('an indoor exit retries on the next frame when a blocked door clears instead of waiting on a timer', () => {
    const run = createNpcs();
    run('first.house = second.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); enterNpcHouse(second); const resident = getNpcIndoorResident(scene, first), other = getNpcIndoorResident(scene, second); resident.sprite.setPosition(0, 0); other.sprite.setPosition(48, 48); resident.journey = "exit"; other.journey = null; updateInteriorResident(scene, resident, 100, 50);');
    assert.equal(run('resident.goal'), null); assert.ok(run('resident.nextWalkAt > 116'));
    run('other.sprite.setPosition(80, 0); resident.room.occupancyVersion = (resident.room.occupancyVersion || 0) + 1; updateInteriorResident(scene, resident, 116, 16)');
    assert.ok(run('resident.goal !== null'));
    run('updateInteriorResident(scene, resident, 148, 32)');
    assert.ok(run('resident.sprite.x !== 0 || resident.sprite.y !== 0'));
});

test('house transitions switch environments only under full black and reveal them afterward', () => {
    const run = createNpcs();
    run('let clears = 0, resets = 0, draws = [], switches = [], cameraUpdates = 0; const canvas = {style: {}, getContext() {return context;}}; const context = {canvas, clearRect() {clears++; draws = [];}, fillRect(...rect) {draws.push(rect);}}; const overlay = {setVisible() {return this;}, destroy() {this.destroyed = true;}}; document = {createElement: () => canvas}; addHudLayer = (scene, node, y, depth) => {overlay.node = node; overlay.depth = depth; return overlay;}; scene.resetHeldActions = () => resets++; enterInterior = (scene, house) => {switches.push([house.id, interiorTransition.level]); interior = {house};}; leaveInterior = () => {switches.push([null, interiorTransition.level]); interior = null;}; updateCamera = () => cameraUpdates++; const house = {id: 1}; beginInteriorTransition(scene, house)');
    assert.equal(run('resets'), 1);
    assert.equal(run('overlay.node'), run('canvas'));
    assert.equal(run('overlay.depth'), 10000);
    assert.equal(run('canvas.style.imageRendering'), 'pixelated');
    assert.equal(run('canvas.width'), run('mainCamera.width'));
    assert.equal(run('canvas.height'), run('mainCamera.height'));
    run('updateInteriorTransition(scene, 220)');
    assert.equal(run('switches.length'), 0);
    assert.equal(run('interiorTransition.level'), 8);
    run('updateInteriorTransition(scene, 340)');
    assert.equal(run('JSON.stringify(switches)'), '[[1,16]]');
    assert.equal(run('interiorTransition.phase'), 'in');
    assert.equal(run('cameraUpdates'), 1);
    run('updateInteriorTransition(scene, 460)');
    assert.equal(run('interiorTransition.level'), 8);
    run('updateInteriorTransition(scene, 580)');
    assert.equal(run('interiorTransition'), null);
    assert.equal(run('overlay.destroyed'), true);
    run('scene.time.now = 600; beginInteriorTransition(scene); updateInteriorTransition(scene, 840)');
    assert.equal(run('JSON.stringify(switches)'), '[[1,16],[null,16]]');
    assert.equal(run('interior'), null);
    run('updateInteriorTransition(scene, 1080)');
    assert.equal(run('interiorTransition'), null);
});

test('house transition dithering stays on integer pixels and skips unchanged levels', () => {
    const run = createNpcs();
    run('mainCamera.width = mainCamera.height = 4; let clears = 0, draws = []; const transition = {level: -1, context: {canvas: {width: 4, height: 4}, clearRect() {clears++; draws = [];}, fillRect(...rect) {draws.push(rect);}}}; drawInteriorTransition(transition, 8)');
    assert.equal(run('draws.length'), 8);
    assert.ok(run('draws.every(rect => rect.every(Number.isInteger) && rect[2] === 1 && rect[3] === 1)'));
    run('drawInteriorTransition(transition, 8)');
    assert.equal(run('clears'), 1);
    run('drawInteriorTransition(transition, 16)');
    assert.equal(run('JSON.stringify(draws)'), '[[0,0,4,4]]');
    run('drawInteriorTransition(transition, 0)');
    assert.equal(run('draws.length'), 0);
});

test('door transitions ignore duplicate requests and cannot overlap a spawn return', () => {
    const run = createNpcs();
    run('let overlays = 0; scene.resetHeldActions = () => {}; document = {createElement: () => ({style: {}, getContext() {return {};}})}; addHudLayer = () => {overlays++; return {setVisible() {return this;}};}; const house = {id: 1}; beginInteriorTransition(scene);');
    assert.equal(run('overlays'), 0);
    run('spawnReturn = {}; beginInteriorTransition(scene, house)');
    assert.equal(run('overlays'), 0);
    run('spawnReturn = null; beginInteriorTransition(scene, house); beginInteriorTransition(scene, house)');
    assert.equal(run('overlays'), 1);
});

test('residents walk through the interior doorway instead of appearing on the rug', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; getWorldClock = () => ({hour: 23, day: 1}); enterNpcHouse(first); updateNpcHome(scene, first, 100, 50)');
    assert.equal(run('first.indoor.sprite.x'), 48);
    assert.ok(run('first.indoor.sprite.y < 48 && first.indoor.sprite.y > 32'));
    assert.equal(run('first.sprite.visible'), false);
    run('for (let time = 150; time <= 1000; time += 50) updateNpcHome(scene, first, time, 50)');
    assert.equal(run('first.indoor.journey'), null);
    assert.equal(run('first.indoor.sprite.y'), 32);
});

test('residents route around furniture to leave without teleporting when the player leaves', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; canNpcOccupy = () => true; enterNpcHouse(first); const resident = getNpcIndoorResident(scene, first); resident.sprite.setPosition(0, -16); resident.journey = null; resident.room.blocked = [[24, -16, 40, 36]]; const route = findInteriorResidentPath(resident, 48, 48)');
    assert.ok(run('route.length > 1'));
    run('const startX = resident.sprite.x, startY = resident.sprite.y; updateNpcHome(scene, first, 100, 50)');
    assert.ok(run('Math.abs(resident.sprite.x - startX) + Math.abs(resident.sprite.y - startY) <= CHARACTER_SPEED * first.speed * 0.05'));
    assert.equal(run('first.state'), 'home');
    run('let crossedFurniture = false; for (let time = 150; time < 12000 && first.state === "home"; time += 50) {updateNpcHome(scene, first, time, 50); if (first.state === "home") crossedFurniture ||= !canInteriorResidentStand(resident, resident.sprite.x, resident.sprite.y);}');
    assert.equal(run('crossedFurniture'), false);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('resident.sprite.x'), 48);
    assert.equal(run('resident.sprite.y'), 48);
    assert.equal(run('first.goal'), 'leaveHome');
});

test('indoor residents retain saved positions and continue moving while the player is outside', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); const resident = getNpcIndoorResident(scene, first); resident.sprite.setPosition(16, -16); resident.journey = null; npcMemory.set(first.id, JSON.parse(JSON.stringify(serializeNpc(first, 100)))); restoreNpc(scene, first)');
    assert.equal(run('first.indoor.sprite.x'), 16);
    assert.equal(run('first.indoor.sprite.y'), -16);
    run('getWorldClock = () => ({hour: 23, day: 1}); first.indoor.goal = {x: 32, y: -16, direction: "right"}; updateNpcHome(scene, first, 1000, 50)');
    assert.ok(run('first.indoor.sprite.x > 16 && first.indoor.sprite.x < 32'));
    assert.equal(run('first.state'), 'home');
    assert.equal(run('interior'), null);
});

test('residents wait for a blocked interior doorway and resume their actual route when it clears', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; canNpcOccupy = () => true; enterNpcHouse(first); const resident = getNpcIndoorResident(scene, first); resident.sprite.setPosition(16, 0); resident.journey = null; interior = resident.room; character.x = character.y = 48; updateNpcHome(scene, first, 100, 50)');
    assert.equal(run('first.state'), 'home');
    assert.equal(run('resident.sprite.x'), 16);
    run('character.x = character.y = -100; for (let time = 1000; time < 6000 && first.state === "home"; time += 50) updateNpcHome(scene, first, time, 50)');
    assert.equal(run('first.state'), 'walk');
});

test('malformed indoor save coordinates cannot move residents outside their room', () => {
    for (const indoor of [[99999, 99999, 'front', null], [48.5, 32, 'front', null], [48, '32', 'front', null], [], [null, null, 'front', null]]) {
        const run = createNpcs();
        run('first.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); npcMemory.set(first.id, {...serializeNpc(first, 100), indoor: ' + JSON.stringify(indoor) + '}); restoreNpc(scene, first)');
        assert.equal(run('first.indoor.sprite.x'), 48);
        assert.equal(run('first.indoor.sprite.y'), 48);
    }
});

test('opening and closing the house view never resets resident coordinates or their route', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); const resident = getNpcIndoorResident(scene, first); resident.sprite.setPosition(16, -16); resident.goal = {x: 32, y: -16, direction: "right"}; resident.journey = null; const display = {visible: true, texture: {key: "portrait"}, setPosition(x, y) {this.x = x; this.y = y; return this;}, setDepth() {return this;}}; interior = {...resident.room, residents: [{npc: first, sprite: display}], layer: {destroy() {display.destroyed = true;}}}; updatePersonBlink = () => {}; updateInteriorResidents(scene, 100, 16)');
    assert.equal(run('display.x'), 16);
    run('worldObjectLayer = {add() {}}; character.setPosition = function(x, y) {this.x = x; this.y = y;}; characterShadow = {image: {setVisible() {}}}; setCharacterTexture = snapInteriorCamera = () => {}; leaveInterior()');
    assert.equal(run('resident.sprite.x'), 16);
    assert.equal(run('resident.sprite.y'), -16);
    assert.equal(run('resident.goal.x'), 32);
    assert.equal(run('resident.display'), null);
    assert.equal(run('first.state'), 'home');
    run('interior = {...resident.room, residents: [{npc: first, sprite: display}]}; updateInteriorResidents(scene, 200, 16)');
    assert.equal(run('display.x'), 16);
    assert.equal(run('display.y'), -16);
});

test('generated furniture and room layouts are identical with and without a rendered house view', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/environment/interiors.js', 'utf8'));
    run('getInteriorTexture = (scene, key) => key; const image = () => ({setOrigin() {return this;}, setDepth() {return this;}, setFlipX() {return this;}, setScrollFactor() {return this;}}); scene.add = {layer: () => ({setDepth() {return this;}, add() {}}), image, rectangle: image}; character.x = character.y = -100');
    for (let seed = 1; seed <= 30; seed++) {
        run('worldHash = () => ' + seed + ' / 31; first.house = {id: 1, x: 2, y: 1, doorX: 3, doorY: 3, residents: [1]}; first.indoor = null; enterNpcHouse(first); var logicalRoom = buildInterior(scene, first.house, false), shownRoom = buildInterior(scene, first.house, true); first.house.indoorRoom = logicalRoom; var generatedResident = getNpcIndoorResident(scene, first);');
        assert.equal(run('JSON.stringify(logicalRoom.blocked)'), run('JSON.stringify(shownRoom.blocked)'));
        assert.ok(run('findInteriorResidentPath(generatedResident, logicalRoom.doorLeft, logicalRoom.bottom - TILE_SIZE)?.length > 0'));
    }
});

test('indoor walks do not pass through a housemate or wander out through the doorway', () => {
    const run = createNpcs();
    run('first.house = second.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); enterNpcHouse(second); const resident = getNpcIndoorResident(scene, first), other = getNpcIndoorResident(scene, second); resident.sprite.setPosition(16, 0); other.sprite.setPosition(32, 0); resident.journey = other.journey = null; resident.goal = {x: 48, y: 0, direction: "right"}; for (let time = 100; time < 1500 && resident.goal; time += 50) updateInteriorResident(scene, resident, time, 50)');
    assert.ok(run('resident.sprite.x <= 24'));
    assert.equal(run('canInteriorResidentStand(resident, 32, 0)'), false);
    run('resident.sprite.setPosition(48, 32); for (let attempt = 0; attempt < 100; attempt++) {resident.goal = null; chooseInteriorResidentWalk(resident, 100); if (resident.goal && resident.goal.y + NPC_PART_SIZE > resident.room.bottom) throw new Error("wandering left the house");}');
});

test('changing the daily plan redirects an indoor exit through the doorway without repositioning', () => {
    const run = createNpcs();
    run('first.house = {doorX: 3, doorY: 3}; character.x = character.y = -100; enterNpcHouse(first); const resident = getNpcIndoorResident(scene, first); resident.sprite.setPosition(16, 0); resident.journey = null; updateNpcHome(scene, first, 100, 50); const beforeX = resident.sprite.x, beforeY = resident.sprite.y; getWorldClock = () => ({hour: 23, day: 1}); updateNpcHome(scene, first, 150, 50)');
    assert.equal(run('resident.journey'), 'enter');
    assert.ok(run('Math.abs(resident.sprite.x - beforeX) + Math.abs(resident.sprite.y - beforeY) <= Math.ceil(CHARACTER_SPEED * first.speed * 0.05)'));
    assert.equal(run('first.state'), 'home');
});

test('NPCs start moving immediately at their normal speed instead of accelerating or waiting to turn', () => {
    const run = createNpcs();
    run('Object.assign(first, {path: [[4, 3]], speed: 0.5, walkSpeed: 0, turnUntil: 999999, remainderX: 0, remainderY: 0, walkPhase: 1}); canNpcOccupy = () => true; stepNpc(scene, first, 100, 50)');
    assert.equal(run('first.walkSpeed'), 0.5);
    assert.ok(run('first.x > 48'));
    assert.ok(run('Number.isInteger(first.x) && Number.isInteger(first.y)'));
});

test('completed waypoints do not introduce an extra idle frame or a turn delay', () => {
    const run = createNpcs();
    run('Object.assign(first, {x: 64, path: [[4, 3], [4, 4]], speed: 0.5, travelDirection: "right", remainderX: 0, remainderY: 0, walkPhase: 1}); canNpcOccupy = () => true; stepNpc(scene, first, 100, 50)');
    assert.ok(run('first.y > 48'));
    assert.equal(run('first.direction'), 'front');
    assert.equal(run('first.walkSpeed'), 0.5);
});

test('subpixel walking progress and horizontal steps avoid redundant sprite depth sorting', () => {
    const run = createNpcs();
    run('let positionWrites = 0, depthWrites = 0; Object.assign(first.sprite, {x: 48, y: 48, depth: 64, setPosition(x, y) {positionWrites++; this.x = x; this.y = y;}, setDepth(depth) {depthWrites++; this.depth = depth;}}); Object.assign(first, {path: [[4, 3]], travelDirection: "right", turnUntil: 0, remainderX: 0, remainderY: 0, walkPhase: 1}); canNpcOccupy = () => true; stepNpc(scene, first, 101, 1)');
    assert.equal(run('positionWrites'), 0);
    assert.equal(run('depthWrites'), 0);
    run('first.remainderX = 1; stepNpc(scene, first, 102, 1)');
    assert.equal(run('positionWrites'), 1);
    assert.equal(run('depthWrites'), 0);
    assert.equal(run('first.sprite.x'), 49);
});

test('unchanged speech bubbles skip redundant text, transform, visibility, and depth writes', () => {
    const run = createNpcs();
    run('const writes = {text: 0, position: 0, depth: 0, visible: 0}; first.state = "social"; first.speech = "Hello!"; first.speechFrom = 100; first.speechUntil = 2000; first.bubble = {visible: false, setVisible(value) {writes.visible++; this.visible = value;}, setText(text) {writes.text++; this.text = text;}, setPosition(x, y) {writes.position++; this.x = x; this.y = y;}, setDepth(depth) {writes.depth++; this.depth = depth;}}; updateNpcBubble(first, 100); updateNpcBubble(first, 116);');
    assert.deepEqual(JSON.parse(run('JSON.stringify(writes)')), {text: 1, position: 1, depth: 1, visible: 1});
    run('first.x++; updateNpcBubble(first, 132)');
    assert.equal(run('writes.position'), 2);
    assert.equal(run('writes.depth'), 1);
    run('updateNpcBubble(first, 2001); updateNpcBubble(first, 2017)');
    assert.equal(run('writes.visible'), 2);
    assert.equal(run('writes.text'), 1);
});

test('valid saved fishing casts retain rod reach and their remaining wait', () => {
    const run = createNpcs();
    run('findNpcWater = () => ({direction: "front"}); getNpcRodTip = () => [55, 48]; first.rod = {castDistance: 240}; npcMemory.set(first.id, {...serializeNpc(first, 100), spot: [5, 3], bobber: [200, 64, 12000]}); restoreNpc(scene, first)');
    assert.equal(run('first.state'), 'fishing');
    assert.equal(run('first.fishing.bobberX'), 200);
    assert.equal(run('first.fishing.reelAt'), 12100);
});

test('malformed saved waits cannot freeze a restored resident indefinitely', () => {
    for (const wait of ['6000', -1, Infinity, NaN, 1.5, Number.MAX_SAFE_INTEGER]) {
        const run = createNpcs();
        run('npcMemory.set(first.id, {...serializeNpc(first, 100), wait: ' + (Number.isNaN(wait) ? 'NaN' : wait === Infinity ? 'Infinity' : JSON.stringify(wait)) + '}); restoreNpc(scene, first)');
        assert.ok(run('Number.isSafeInteger(first.until) && first.until >= scene.time.now && first.until <= scene.time.now + NPC_IDLE_MIN + NPC_IDLE_RANGE'));
    }
});

test('malformed saved bobbers leave the remembered fishing spot usable without restoring a broken cast', () => {
    for (const bobber of ['bad', {}, [80, 64], [null, 64, 1000], [80, 64, -1], [80, 64, '1000'], [80, 64, 9999999], [1000000, 64, 1000]]) {
        const run = createNpcs();
        run('findNpcWater = () => ({direction: "front"}); npcMemory.set(first.id, {...serializeNpc(first, 100), spot: [5, 3], bobber: ' + JSON.stringify(bobber) + '}); restoreNpc(scene, first)');
        assert.equal(run('first.fishing'), null);
        assert.equal(run('first.state'), 'idle');
        assert.equal(run('first.spot.tileX'), 5);
    }
});

test('malformed saved routes are ignored without pathfinding or inventing blocked plans', () => {
    for (const goal of ['bad', {}, [4, 3], [4, null, 'wander'], [4.5, 3, 'wander'], [4000, 3, 'wander'], [4, 3, {}]]) {
        const run = createNpcs();
        run('let routes = 0; findNpcRoute = () => {routes++; return null;}; npcMemory.set(first.id, {...serializeNpc(first, 100), goal: ' + JSON.stringify(goal) + '}); restoreNpc(scene, first)');
        assert.equal(run('routes'), 0);
        assert.equal(run('first.pausedActivity'), null);
        assert.equal(run('first.state'), 'idle');
    }
});

test('the nearest selectable resident must have an unobstructed conversation path', () => {
    const run = createNpcs();
    run('first.x = 64; second.x = 48; second.y = 64; loadedChunks.set(0, {npcs: [first, second]}); updateNpc = () => {}; isNpcWalkableTile = (x, y) => x !== 4; updateNpcs(scene, 100, 16);');
    assert.equal(run('nearestNpc.id'), 2);
    run('isNpcWalkableTile = () => false; updateNpcs(scene, 116, 16)');
    assert.equal(run('nearestNpc'), null);
});

test('stale interaction targets cannot open dialogue after entering home or leaving reach', () => {
    for (const condition of ['first.state = "home"', 'first.x = 88', 'first.x = 64; isNpcWalkableTile = () => false']) {
        const run = createNpcs();
        run('nearestNpc = first; dialogueContainer = {}; isMenuOpen = () => false; let opened = 0; beginDialogue = () => opened++; ' + condition + '; talkToNearestNpc(scene)');
        assert.equal(run('opened'), 0);
        assert.equal(run('first.playerVisits'), undefined);
    }
});

test('inclusive seeded rolls keep trade species, trade amounts, and dialogue personalities valid', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/game-data.js', 'utf8'));
    run('coordinateHash = npcHash = () => 1; findNearestRumor = getMysteryShopRumor = () => null; const edgeTrade = getNpcTrade(first); const edgeDialogue = buildNpcDialogue(scene, first);');
    assert.equal(run('edgeTrade.species.id'), run('FISH_SPECIES.at(-1).id'));
    assert.ok(run('edgeTrade.count >= 1 && edgeTrade.count <= 3'));
    assert.equal(run('typeof edgeDialogue.chat.text'), 'string');
    assert.equal(run('getNpcConnection(first).kind'), 'close');
    assert.equal(run('getNpcConnection(second).kind'), 'close');
    run('FISH_SPECIES.splice(0, FISH_SPECIES.length, {id: "test", price: 5}); const smallTrade = getNpcTrade(first);');
    assert.equal(run('smallTrade.count'), 3);
});

test('new residents start at staggered times while restored routines keep their saved delay', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/game-data.js', 'utf8'));
    run(fs.readFileSync('src/world/terrain.js', 'utf8'));
    run('const phasedHomes = [createNpc(3, 3, null), createNpc(4, 3, null)]; getNpcAt = (x, y) => phasedHomes.find(home => home.tileX === x && home.tileY === y); getNpcHouse = () => null');
    run('const spriteStub = () => ({ setOrigin() { return this; }, setDepth() { return this; }, setVisible() { return this; }, setPosition() { return this; }, setTexture() { return this; } }); scene.add = { image: spriteStub, text: spriteStub, graphics: spriteStub }; worldObjectLayer = shadowLayer = { add() {} }; const freshResidents = spawnChunkNpcs(scene, 0, 0, [])');
    assert.equal(run('freshResidents.length'), 2);
    assert.ok(run('freshResidents.every(npc => npc.until >= scene.time.now && npc.until <= scene.time.now + NPC_IDLE_MIN)'));
    assert.ok(run('freshResidents.every(npc => npc.lookAt >= scene.time.now && npc.lookAt <= scene.time.now + NPC_LOOK_MIN)'));
    assert.notEqual(run('freshResidents[0].until'), run('freshResidents[1].until'));
    assert.notEqual(run('freshResidents[0].lookAt'), run('freshResidents[1].lookAt'));
    run('npcMemory.set(phasedHomes[0].id, { id: phasedHomes[0].id, x: 48, y: 48, rng: 1, wait: 2400 }); const restoredResidents = spawnChunkNpcs(scene, 0, 0, [])');
    assert.equal(run('restoredResidents[0].until'), run('scene.time.now + 2400'));
});

test('residents remember a break at home instead of claiming their old greeting just happened', () => {
    const run = createNpcs();
    run("findNearestRumor = getMysteryShopRumor = () => null; first.lastActivity = 'greeting'; first.lastNeighbor = second.name; enterNpcHouse(first)");
    assert.equal(run('first.lastActivity'), 'rest');
    run('npcMemory.set(first.id, { ...serializeNpc(first, 100), home: false }); restoreNpc(scene, first)');
    assert.equal(run('first.lastActivity'), 'rest');
    assert.ok(run('NPC_ACTIVITY_LINES.rest.includes(buildNpcDialogue(scene, first).chat.text)'));
    assert.equal(run('buildNpcDialogue(scene, first).chat.text.includes("just said hello")'), false);
});

test('restoring fishing memories does not reuse stale or invalid spots', () => {
    for (const spot of [null, [30, 30], [NaN, 3], 'bad', [5, 3]]) {
        const run = createNpcs();
        run("first.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; findNpcWater = () => null");
        run(`npcMemory.set(first.id, { ...serializeNpc(first, 100), spot: ${JSON.stringify(spot)}, bobber: [80, 64, 1000] }); restoreNpc(scene, first)`);
        assert.equal(run('first.spot'), null);
        assert.equal(run('first.fishing'), null);
        assert.equal(run('first.state'), 'idle');
    }
});

test('a remembered failed spot is not restored as a usable fishing location', () => {
    const run = createNpcs();
    run("first.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; first.failedSpots = new Set([getTileId(5, 3)]); findNpcWater = () => ({ direction: 'front' }); npcMemory.set(first.id, serializeNpc(first, 100)); restoreNpc(scene, first)");
    assert.equal(run('first.spot'), null);
    assert.equal(run('first.failedSpots.has(getTileId(5, 3))'), true);
});

test('social approaches have a deadline and finish the current walk when a neighbor keeps moving', () => {
    const run = createNpcs();
    run("second.x = 112; second.state = 'walk'; second.goal = 'wander'; canNpcOccupy = () => true; npcRandom = () => 0; tryNpcSocialPlan(scene, first, 100)");
    assert.equal(run('first.goal'), 'follow');
    assert.equal(run('first.socialApproachUntil'), run('100 + NPC_SOCIAL_APPROACH_TIME'));
    run("first.x = 56; first.walkPhase = 1; first.path = [[4, 3], [5, 3]]; first.stuckSince = first.socialApproachUntil; updateNpc(scene, first, first.socialApproachUntil + 1, 16)");
    assert.equal(run('first.goal'), 'wander');
    assert.equal(run('first.socialPartner'), null);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.path.at(-1)[0]'), 5);
});

test('fishers sometimes explore a new spot while still preferring familiar water', () => {
    const run = createNpcs();
    run("first.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; first.failedSpots = new Set(); canNpcOccupy = () => true; tryNpcSocialPlan = () => false; findNpcWater = () => ({ direction: 'front' }); isNpcStandingTile = () => true; rollNpcTile = () => [6, 3]; let choices = [0, 0.99]; npcRandom = () => choices.shift() ?? 0; chooseNpcPlan(scene, first, 100)");
    assert.equal(run('first.goal'), 'fish');
    assert.equal(run('first.spot.tileX'), 6);
    run("first.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; npcRandom = () => 0; chooseNpcPlan(scene, first, 1000)");
    assert.equal(run('first.spot.tileX'), 5);
});

test('failed fishing spots survive a save and reload without growing unbounded', () => {
    const run = createNpcs();
    run('first.failedSpots = new Set(Array.from({ length: 40 }, (_, index) => getTileId(index, 3))); const savedFisher = JSON.parse(JSON.stringify(serializeNpc(first, 100))); npcMemory.set(first.id, savedFisher); first.failedSpots.clear(); restoreNpc(scene, first)');
    assert.equal(run('savedFisher.failedSpots.length'), run('NPC_FAILED_SPOT_LIMIT'));
    assert.equal(run('first.failedSpots.size'), run('NPC_FAILED_SPOT_LIMIT'));
    assert.equal(run('first.failedSpots.has(getTileId(39, 3))'), true);
    assert.equal(run('first.failedSpots.has(getTileId(0, 3))'), false);
});

test('old saves and malformed fishing memories restore safely', () => {
    const run = createNpcs();
    run('npcMemory.set(first.id, { ...serializeNpc(first, 100), failedSpots: [NaN, Infinity, null, "bad", {}, 1.5, getTileId(5, 3)] }); restoreNpc(scene, first)');
    assert.equal(run('first.failedSpots.size'), 1);
    assert.equal(run('first.failedSpots.has(getTileId(5, 3))'), true);
    run('const oldMemory = serializeNpc(first, 100); delete oldMemory.failedSpots; npcMemory.set(first.id, oldMemory); restoreNpc(scene, first)');
    assert.equal(run('first.failedSpots.size'), 0);
});

test('an inclusive world hash never selects an invalid appearance row or name', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/game-data.js', 'utf8'));
    run('npcHash = () => 1; const edgeResident = createNpc(3, 3, null)');
    assert.ok(run('(edgeResident.look[14] ? NPC_FEMININE_FIRST_NAMES : NPC_MASCULINE_FIRST_NAMES).includes(edgeResident.name.split(" ")[0])'));
    assert.ok(run('edgeResident.look[1] >= 0 && edgeResident.look[1] < NPC_FACES'));
    assert.ok(run('edgeResident.look[2] >= 0 && edgeResident.look[2] < NPC_SHIRTS'));
    assert.ok(run('edgeResident.look[6] >= 0 && edgeResident.look[6] < (edgeResident.look[5] ? NPC_ACCESSORIES : NPC_HAIRSTYLES)'));
    assert.ok(run('[0, 1].includes(edgeResident.look[8])'));
    assert.ok(run('edgeResident.rodIndex < MARKET_RODS.length'));
});

test('shared walks reconnect partial steps before taking tile-aligned routes', () => {
    const run = createNpcs();
    run("first.x = 56; second.x = 88; homes[1].tileX = second.tileX = 5; first.walkInvitation = true; first.dailyPlan = second.dailyPlan = 'day'; first.state = second.state = 'social'; canNpcOccupy = () => true; rollNpcTile = () => [4, 4]");
    assert.equal(run('tryNpcSharedWalk(scene, first, second, 100)'), true);
    assert.equal(run('first.path[0][1]'), 3);
    assert.equal(run('second.path[0][1]'), 3);
    assert.equal(run('first.goal'), 'stroll');
    assert.equal(run('second.goal'), 'stroll');
    assert.equal(run('first.path.every(([x, y], index) => { const previous = index ? first.path[index - 1].map(value => value * TILE_SIZE) : [first.x, first.y]; return previous[0] === x * TILE_SIZE || previous[1] === y * TILE_SIZE; })'), true);
    assert.equal(run('second.path.every(([x, y], index) => { const previous = index ? second.path[index - 1].map(value => value * TILE_SIZE) : [second.x, second.y]; return previous[0] === x * TILE_SIZE || previous[1] === y * TILE_SIZE; })'), true);
});

test('new walks and fishing trips avoid occupied routes before setting off', () => {
    for (const goal of ['wander', 'fish']) {
        const run = createNpcs();
        run("first.failedSpots = new Set(); tryNpcSocialPlan = () => false; rollNpcTile = () => [5, 3]; findNpcWater = () => ({ direction: 'front' }); isNpcStandingTile = () => true; canNpcOccupy = (scene, npc, x, y) => !(x >= 60 && x <= 68 && y === 48)");
        run(`npcRandom = () => ${goal === 'fish' ? 0 : 0.99}; chooseNpcPlan(scene, first, 100)`);
        assert.equal(run('first.goal'), goal);
        assert.equal(run('first.state'), 'walk');
        assert.ok(run('first.path.some(([, y]) => y !== 3)'));
        assert.equal(run('first.path.at(-1)[0]'), 5);
        assert.equal(run('first.path.at(-1)[1]'), 3);
        assert.equal(run('first.path.every(([x, y], index) => { const previous = index ? first.path[index - 1].map(value => value * TILE_SIZE) : [first.x, first.y]; return canNpcTraverse(scene, first, ...previous, x * TILE_SIZE, y * TILE_SIZE); })'), true);
    }
});

test('residents wait instead of starting a walk when every route is occupied', () => {
    const run = createNpcs();
    run('tryNpcSocialPlan = () => false; npcRandom = () => 0.99; rollNpcTile = () => [5, 3]; canNpcOccupy = () => false; chooseNpcPlan(scene, first, 100)');
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.path.length'), 0);
    assert.ok(run('first.until > 100'));
});

test('idle glances notice visible neighbors without looking through obstacles or into houses', () => {
    const run = createNpcs();
    run("first.direction = 'left'; character.x = 32; second.x = 80; npcRandom = () => 0.5; isNpcWalkableTile = (x, y) => x !== 2");
    assert.equal(run('getNpcIdleDirection(first)'), 'right');
    run("second.state = 'home'");
    assert.equal(run('getNpcIdleDirection(first)'), 'left');
    run("isNpcWalkableTile = () => true; character.visible = false; second.state = 'idle'");
    assert.equal(run('getNpcIdleDirection(first)'), 'right');
    run('character.visible = true');
    assert.equal(run('getNpcIdleDirection(first)'), 'left');
    run('character.x = 200; second.x = 96');
    assert.equal(run('getNpcIdleDirection(first)'), 'left');
    run('second.x = 80; first.lookAt = 100; updateNpc(scene, first, 100, 16)');
    assert.equal(run('first.direction'), 'right');
    run('second.x = 32; updateNpc(scene, first, 116, 16)');
    assert.equal(run('first.direction'), 'right');
});

test('seeded names and sprite rows stay consistent across feminine, masculine, and young looks', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/game-data.js', 'utf8'));
    run(fs.readFileSync('src/world/terrain.js', 'utf8'));
    run('const generatedResidents = []; for (let y = -30; y < 30; y++) for (let x = -30; x < 30; x++) generatedResidents.push(createNpc(x, y, null))');
    assert.equal(run('generatedResidents.every(npc => (npc.look[14] ? NPC_FEMININE_FIRST_NAMES : NPC_MASCULINE_FIRST_NAMES).includes(npc.name.split(" ")[0]))'), true);
    assert.equal(run('generatedResidents.every(npc => npc.look[5] || (npc.look[14] ? [0, 2, 7, 8, 9, 10, 11, 12].includes(npc.look[6]) : [0, 1, 3, 4, 5, 6, 8, 9].includes(npc.look[6])))'), true);
    assert.equal(run('generatedResidents.every(npc => npc.look[14] || ![1, 3, 5, 12, 15].includes(npc.look[2]))'), true);
    assert.equal(run('generatedResidents.every(npc => npc.look[1] !== 1 || npc.look[2] !== 3 && (npc.look[5] || ![3, 4].includes(npc.look[6])))'), true);
    assert.ok(run('generatedResidents.some(npc => npc.look[1] === 2 && !npc.look[5] && npc.look[6] === 4)'));
    assert.ok(run('generatedResidents.some(npc => npc.look[2] === 3)'));
    assert.ok(run('generatedResidents.some(npc => npc.look[5] && npc.look[6] === 3)'));
    assert.equal(run('generatedResidents.every(npc => JSON.stringify(npc) === JSON.stringify(createNpc(npc.tileX, npc.tileY, null)))'), true);
});

test('loaded houses appear before NPC simulation and dither only while hiding the visible player', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/environment/bushes.js', 'utf8'));
    run("getSeeThroughTexture = (scene, key, level) => key + '-see' + level; first.house = second.house = { id: 1, x: 2, y: 1 }; loadedChunks.set('0', { npcs: [first, second] }); activeNpcs.length = 0; let houseAdds = 0; worldObjectLayer = { add() { houseAdds++; } }; scene.add = { image(x, y, key) { return { x, y, key, setOrigin() { return this; }, setDepth() { return this; }, setTexture(key) { this.key = key; }, destroy() { this.destroyed = true; } }; } }");
    run('character.visible = false; updateNpcHouses(scene, 100)');
    assert.equal(run('houseAdds'), 1);
    assert.equal(run('npcHouseSprites.get(1).key'), 'house');
    run('character.visible = true; character.x = 40; character.y = 16; for (let time = 200; time < 1200; time += 50) updateNpcHouses(scene, time)');
    assert.equal(run('npcHouseSprites.get(1).seeLevel'), run('SEE_THROUGH_LEVEL'));
    assert.equal(run('npcHouseSprites.get(1).key'), run("'house-see' + SEE_THROUGH_LEVEL"));
    run('character.y = 32; for (let time = 1200; time < 2200; time += 50) updateNpcHouses(scene, time)');
    assert.equal(run('npcHouseSprites.get(1).key'), 'house');
    run('character.x = 80; character.y = 16; for (let time = 2200; time < 3200; time += 50) updateNpcHouses(scene, time)');
    assert.equal(run('npcHouseSprites.get(1).key'), 'house');
    run('const oldHouse = npcHouseSprites.get(1); loadedChunks.clear(); updateNpcHouses(scene, 3200)');
    assert.equal(run('npcHouseSprites.size'), 0);
    assert.equal(run('oldHouse.destroyed'), true);
});

test('finishing a step aside resumes a fishing trip without aiming before reaching the water', () => {
    const run = createNpcs();
    run("first.x = 64; first.failedSpots = new Set(); first.pausedActivity = { x: 5, y: 3, goal: 'fish' }; canNpcOccupy = () => true; findNpcWater = () => ({ direction: 'front' }); startNpcPath(first, [], 'yield', 100); updateNpc(scene, first, 116, 16)");
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'fish');
    assert.equal(run('first.path.at(-1)[0]'), 5);
    assert.equal(run('first.x'), 64);
});

test('a restored blocked trip stays remembered and retries when the route clears', () => {
    const run = createNpcs();
    run("canNpcOccupy = () => false; startNpcPath(first, [[4, 3]], 'wander', 100); npcMemory.set(first.id, serializeNpc(first, 100)); restoreNpc(scene, first)");
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.pausedActivity?.goal'), 'wander');
    run('canNpcOccupy = () => true; updateNpc(scene, first, 850, 16)');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'wander');
    assert.equal(run('first.path.at(-1)[0]'), 4);
    assert.equal(run('first.blockedPlanUntil'), 0);
});

test('walkers finish opposing trips through a narrow lane with real terrain and actor collisions', () => {
    const run = createNpcs();
    run(fs.readFileSync('src/world/surfaces.js', 'utf8'));
    run('homes[1].tileX = second.tileX = 6; second.x = 96; first.walkPhase = second.walkPhase = 1; character.x = character.y = -100; npcRandom = () => 0.75');
    run("const landSurface = { water: new Uint8Array(TILE_SIZE * TILE_SIZE) }; const worldTiles = new Map(); getPropAt = () => null; isNpcWalkableTile = (x, y) => x >= 2 && x <= 7 && (y === 3 || y === 4) && !(x === 5 && y === 3); getWorldTile = (x, y) => { const key = getTileId(x, y); if (!worldTiles.has(key)) worldTiles.set(key, { blocking: isNpcWalkableTile(x, y) ? null : 'full', surface: landSurface }); return worldTiles.get(key); }");
    run("startNpcPath(first, [[4, 3], [5, 3], [6, 3]], 'wander', 100); startNpcPath(second, [[5, 3], [4, 3], [3, 3]], 'wander', 100)");
    run('let invalid = false; for (let time = 116; time < 30000; time += 16) { updateNpc(scene, first, time, 16); updateNpc(scene, second, time, 16); invalid ||= !canCharacterOccupy(scene, first.x, first.y, first) || !canCharacterOccupy(scene, second.x, second.y, second); if (first.x === 96 && second.x === 48 && first.state === "idle" && second.state === "idle") break; }');
    assert.equal(run('invalid'), false);
    assert.equal(run('first.x'), 96);
    assert.equal(run('second.x'), 48);
    assert.equal(run('first.y'), 48);
    assert.equal(run('second.y'), 48);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
});

test('a walker waits briefly for a blocked route and resumes the remembered destination', () => {
    const run = createNpcs();
    run("first.walkPhase = 1; canNpcOccupy = () => false; startNpcPath(first, [[4, 3]], 'wander', 100); updateNpc(scene, first, 800, 16)");
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.pausedActivity?.goal'), 'wander');
    assert.equal(run('JSON.stringify(serializeNpc(first, 800).goal)'), '[4,3,"wander"]');
    run('pauseNpcActivity(first)');
    assert.equal(run('first.pausedActivity?.x'), 4);
    run('canNpcOccupy = () => true; updateNpc(scene, first, 1550, 16)');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.path.at(-1)[0]'), 4);
    assert.equal(run('first.blockedPlanUntil'), 0);
});

test('a permanently blocked destination does not trap a resident in endless retries', () => {
    const run = createNpcs();
    run("first.walkPhase = 1; npcRandom = () => 0.75; canNpcOccupy = () => false; startNpcPath(first, [[4, 3]], 'wander', 100); updateNpc(scene, first, 800, 16)");
    assert.ok(run('first.blockedPlanUntil > 800'));
    run('isNpcWalkableTile = () => false; updateNpc(scene, first, 6800, 16)');
    assert.equal(run('first.pausedActivity'), null);
    assert.equal(run('first.blockedPlanUntil'), 0);
    assert.equal(run('first.state'), 'idle');
});

test('residents remember a passing hello in dialogue and across a saved routine', () => {
    const run = createNpcs();
    run("findNearestRumor = getMysteryShopRumor = () => null; canNpcOccupy = () => true; startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); second.state = 'fishing'; second.fishing = { state: 'floating' }; tryNpcPassingGreeting(first, 100)");
    assert.equal(run('first.lastActivity'), 'greeting');
    assert.equal(run('first.lastNeighbor'), 'Eli Moss');
    assert.equal(run('second.lastNeighbor'), 'Ada Reed');
    assert.ok(run('NPC_ACTIVITY_LINES.greeting.map(line => line.replace("{neighbor}", "Eli")).includes(buildNpcDialogue(scene, first).chat.text)'));
    assert.ok(run('NPC_ACTIVITY_LINES.greeting.map(line => line.replace("{neighbor}", "Ada")).includes(buildNpcDialogue(scene, second).chat.text)'));
    run('npcMemory.set(first.id, serializeNpc(first, 100)); first.lastActivity = null; first.lastNeighbor = null; restoreNpc(scene, first)');
    assert.equal(run('first.lastActivity'), 'greeting');
    assert.equal(run('first.lastNeighbor'), 'Eli Moss');
    assert.equal(run('first.goal'), 'wander');
});

test('a passing walker does not initiate small talk while speaking to the player or seeking shelter', () => {
    for (const busy of ['talking', 'needsShelter']) {
        const run = createNpcs();
        run("startNpcPath(first, [[4, 3]], 'wander', 100); second.state = 'fishing'; second.fishing = { state: 'floating' }");
        run(`first.${busy} = true`);
        assert.equal(run('tryNpcPassingGreeting(first, 100)'), false);
        assert.equal(run('second.speech'), undefined);
        assert.equal(run('first.nextGreetingAt'), undefined);
    }
});

test('passing greeting bubbles take turns and hide when a fishing resident talks to the player', () => {
    const run = createNpcs();
    run("const bubble = () => ({ setVisible(value) { this.visible = value; return this; }, setText() { return this; }, setPosition() { return this; }, setDepth() { return this; } }); first.bubble = bubble(); second.bubble = bubble(); first.walkPhase = 1; canNpcOccupy = () => true; updateNpcFishing = () => {}; startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); second.state = 'fishing'; second.fishing = { state: 'floating' }; updateNpc(scene, first, 100, 16); updateNpc(scene, second, 100, 16)");
    assert.equal(run('first.bubble.visible'), true);
    assert.equal(run('second.bubble.visible'), false);
    run('updateNpc(scene, first, 1600, 16); updateNpc(scene, second, 1700, 16)');
    assert.equal(run('first.bubble.visible'), false);
    assert.equal(run('second.bubble.visible'), true);
    run('second.talking = true; updateNpc(scene, second, 1800, 16)');
    assert.equal(run('second.bubble.visible'), false);
    assert.equal(run('second.fishing.state'), 'floating');
});

test('restoring a resident clears speech that belongs to an old passing greeting', () => {
    const run = createNpcs();
    run('first.greetingUntil = 5000; first.speechFrom = 100; first.speechUntil = 5000; first.bubble = { visible: true, setVisible(value) { this.visible = value; return this; } }; npcMemory.set(first.id, serializeNpc(first, 100)); restoreNpc(scene, first)');
    assert.equal(run('first.greetingUntil'), 0);
    assert.equal(run('first.bubble.visible'), false);
});

test('a passing greeting leaves a walk and a neighbor fishing routine uninterrupted', () => {
    const run = createNpcs();
    run("first.socialPartner = null; startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); second.state = 'fishing'; second.fishing = { state: 'floating' }; getWorldClock = () => ({ hour: 8, day: 1 })");
    assert.equal(run('tryNpcPassingGreeting(first, 100)'), true);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.path.length'), 2);
    assert.equal(run('second.state'), 'fishing');
    assert.equal(run('second.fishing.state'), 'floating');
    assert.equal(run('first.speech'), 'Morning, Eli.');
    assert.equal(run('second.speech'), 'Morning, Ada.');
    assert.ok(run('first.speechUntil <= second.speechFrom'));
    assert.equal(run('tryNpcPassingGreeting(first, 200)'), false);
    assert.equal(run('first.speechFrom'), 100);
});

test('passing greetings respect obstacles, distance, and a busy angler', () => {
    for (const reason of ['wall', 'far', 'talking', 'reeling']) {
        const run = createNpcs();
        run("startNpcPath(first, [[4, 3]], 'wander', 100); second.state = 'fishing'; second.fishing = { state: 'floating' }");
        run({ wall: 'isNpcWalkableTile = () => false', far: 'second.x = 160', talking: 'second.talking = true', reeling: "second.fishing.state = 'reeling'" }[reason]);
        assert.equal(run('tryNpcPassingGreeting(first, 100)'), false);
        assert.equal(run('first.state'), 'walk');
        assert.equal(run('second.speech'), undefined);
    }
});

test('indoor residents retry a blocked exit at a measured pace', () => {
    const run = createNpcs();
    run('first.house = { doorX: 3, doorY: 3 }; canNpcOccupy = () => true; enterNpcHouse(first); let exitSearches = 0; findNpcExitPath = () => { exitSearches++; return null; }; updateNpcHome(scene, first, 100)');
    run('for (let time = 116; time < 850; time += 16) updateNpcHome(scene, first, time)');
    assert.equal(run('exitSearches'), 1);
    assert.equal(run('first.state'), 'home');
    run('findNpcExitPath = () => { exitSearches++; return [[3, 4]]; }; updateNpcHome(scene, first, 850)');
    assert.equal(run('exitSearches'), 2);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'leaveHome');
    assert.equal(run('first.sprite.visible'), true);
});

test('meeting spots leave comfortable space around a listener standing between tiles', () => {
    const run = createNpcs();
    run('second.x = 72; canNpcOccupy = () => true; const meeting = findNpcMeetingPath(first, second, scene).at(-1); const distance = Math.hypot(meeting[0] * TILE_SIZE - second.x, meeting[1] * TILE_SIZE - second.y)');
    assert.ok(run('distance >= 12'));
    assert.ok(run('distance <= TILE_SIZE * 2'));
});

test('residents avoid starting a conversation while their sprites are crowded together', () => {
    const run = createNpcs();
    run('second.x = 56');
    assert.equal(run('startNpcConversation(scene, first, second, 100)'), false);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
    run('second.x = 64');
    assert.equal(run('startNpcConversation(scene, first, second, 200)'), true);
});

test('neighbors do not chat through an obstacle or lose the walk it interrupted', () => {
    const run = createNpcs();
    run("second.x = 80; isNpcWalkableTile = (x, y) => x !== 4 || y !== 3; startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100)");
    assert.equal(run('startNpcConversation(scene, first, second, 100)'), false);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.path.length'), 2);
    assert.equal(run('first.pausedActivity'), undefined);
    run('isNpcWalkableTile = () => true');
    assert.equal(run('startNpcConversation(scene, first, second, 200)'), true);
    assert.equal(run('first.pausedActivity.goal'), 'wander');
});

test('diagonally placed residents do not talk through a blocked corner', () => {
    const run = createNpcs();
    run('second.x = second.y = 64; isNpcWalkableTile = (x, y) => !(x === 4 && y === 3) && !(x === 3 && y === 4)');
    assert.equal(run('startNpcConversation(scene, first, second, 100)'), false);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
});

test('all resident personalities keep their own rainy and dry fishing voice', () => {
    for (let index = 0; index < 6; index++) {
        const run = createNpcs();
        run(`npcHash = () => (${index} + 0.1) / 6; npcRandom = () => 0; findNearestRumor = getMysteryShopRumor = () => null; first.fishing = { state: 'floating' }; getRainIntensity = () => 0.5`);
        assert.equal(run('buildNpcDialogue(scene, first).tips.text'), run(`NPC_PERSONALITIES[${index}].rainFishing[0]`));
        run('getRainIntensity = () => 0');
        assert.equal(run('buildNpcDialogue(scene, first).tips.text'), run(`NPC_PERSONALITIES[${index}].fishing[0]`));
    }
});

test('fishing dialogue notices rain and distinguishes bringing a line in from waiting for bites', () => {
    const run = createNpcs();
    run("findNearestRumor = getMysteryShopRumor = () => null; npcRandom = () => 0; getRainIntensity = () => 0.5; first.fishing = { state: 'floating' }");
    assert.equal(run('buildNpcDialogue(scene, first).tips.text'), 'A little rain just makes the challenge more interesting. I can wait.');
    run("first.fishing.state = 'reeling'; first.needsShelter = true; first.dailyPlan = 'late'");
    assert.equal(run('buildNpcDialogue(scene, first).tips.text'), 'I am bringing my line in and getting out of this rain for a while.');
    run('first.needsShelter = false');
    assert.equal(run('buildNpcDialogue(scene, first).tips.text'), 'I am bringing my line in. I will try another cast after a short break.');
});

test('a neighbor exchange does not interrupt either resident sheltering or already walking home', () => {
    for (const resident of ['first', 'second']) for (const routine of ['shelter', 'home']) {
        const run = createNpcs();
        run(routine === 'shelter' ? `${resident}.needsShelter = true` : `startNpcPath(${resident}, [[4, 3]], 'home', 100)`);
        const before = run(`${resident}.state`);
        assert.equal(run('startNpcConversation(scene, first, second, 100)'), false);
        assert.equal(run(`${resident}.state`), before);
        assert.equal(run('first.lastActivity'), undefined);
        assert.equal(run('second.lastActivity'), undefined);
    }
});

test('a visit updates its meeting spot for a moving listener without replanning every frame', () => {
    const run = createNpcs();
    run("first.walkPhase = 1; first.socialPartner = 2; second.x = 112; canNpcOccupy = () => true; startNpcPath(first, [[4, 3], [5, 3]], 'visit', 100); updateNpc(scene, first, 116, 16)");
    assert.equal(run('first.path.at(-1)[0]'), 6);
    assert.equal(run('first.followRefreshAt'), 1316);
    run('second.x = 128; updateNpc(scene, first, 500, 16)');
    assert.equal(run('first.path.at(-1)[0]'), 6);
    run('updateNpc(scene, first, 1317, 16)');
    assert.equal(run('first.path.at(-1)[0]'), 7);
    assert.ok(run('first.path.every(([x, y]) => isNpcInHomeArea(first, x, y))'));
});

test('visitors and followers respect a neighbor becoming busy or going indoors', () => {
    for (const goal of ['visit', 'follow']) for (const reason of ['talking', 'fishing', 'home', 'shelter', 'gone']) {
        const run = createNpcs();
        run("first.walkPhase = 1; first.socialPartner = 2; canNpcOccupy = () => true; npcRandom = () => 0.75");
        run(`startNpcPath(first, [[4, 3], [5, 3]], '${goal}', 100)`);
        run({ talking: 'second.talking = true', fishing: 'second.fishing = {}', home: "second.state = 'home'", shelter: 'second.needsShelter = true', gone: 'activeNpcs.pop()' }[reason]);
        run('updateNpc(scene, first, 116, 16)');
        assert.equal(run('first.goal'), 'wander');
        assert.equal(run('first.socialPartner'), null);
        assert.equal(run('first.state'), 'walk');
        assert.equal(run('first.path.at(-1)[0]'), 5);
    }
});

test('a chat approach completes a partial step and chooses a reachable spot beside its listener', () => {
    const run = createNpcs();
    run('first.x = 56; second.x = 80; second.y = 48; character.x = character.y = -100; canNpcOccupy = () => true');
    assert.equal(run('findNpcMeetingPath(first, second, scene)[0]?.[0]'), 4);
    run('canNpcOccupy = (scene, npc, x, y) => x !== 64 || y !== 48');
    assert.ok(run('findNpcMeetingPath(first, second, scene)?.length > 0'));
    assert.ok(run('findNpcMeetingPath(first, second, scene).every(([x, y]) => x !== 4 || y !== 3)'));
});

test('friends part by finishing their current walk rather than abandoning a partial step', () => {
    for (const ending of ['timeout', 'talking', 'gone', 'home', 'fishing', 'plans']) {
        const run = createNpcs();
        run("first.x = 56; first.walkPhase = 1; first.walkPartner = 2; first.walkEnds = 10000; second.goal = 'stroll'; second.state = 'walk'; canNpcOccupy = () => true; npcRandom = () => 0.75; startNpcPath(first, [[4, 3], [5, 3]], 'stroll', 100)");
        run({ timeout: 'first.walkEnds = 200', talking: 'second.talking = true', gone: 'activeNpcs.pop()', home: "second.state = 'home'", fishing: 'second.fishing = {}', plans: "second.goal = 'wander'" }[ending]);
        run('updateNpc(scene, first, 216, 16)');
        assert.equal(run('first.state'), 'walk');
        assert.equal(run('first.goal'), 'wander');
        assert.equal(run('first.walkPartner'), null);
        assert.equal(run('first.path.at(-1)[0]'), 5);
        run('for (let time = 232; time < 5000 && first.state === "walk"; time += 16) updateNpc(scene, first, time, 16)');
        assert.equal(run('first.x'), 80);
        assert.equal(run('first.y'), 48);
        assert.equal(run('first.state'), 'idle');
        assert.equal(run('first.lastActivity'), 'walk');
    }
});

test('restoring an outdoor routine makes a previously indoor resident visible again', () => {
    const run = createNpcs();
    run("first.house = { doorX: 4, doorY: 3 }; canNpcOccupy = () => true; enterNpcHouse(first); npcMemory.set(first.id, { ...serializeNpc(first, 100), home: false, x: 56, y: 48, goal: [4, 3, 'leaveHome'] }); restoreNpc(scene, first)");
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'leaveHome');
    assert.equal(run('first.sprite.visible'), true);
});

test('restoring a walk finishes a partial tile instead of considering the rounded destination reached', () => {
    const run = createNpcs();
    run("first.x = 56; first.walkPhase = 1; canNpcOccupy = () => true; startNpcPath(first, [[4, 3]], 'wander', 100); npcMemory.set(first.id, serializeNpc(first, 100)); restoreNpc(scene, first)");
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.path[0]?.[0]'), 4);
    run('for (let time = 116; time < 5000 && first.state === "walk"; time += 16) updateNpc(scene, first, time, 16)');
    assert.equal(run('first.x'), 64);
    assert.equal(run('first.y'), 48);
});

test('restored positions stay on the pixel grid and never start an inaccessible route', () => {
    const run = createNpcs();
    run("canNpcOccupy = () => false; npcMemory.set(first.id, { ...serializeNpc(first, 100), x: 55.8, y: 47.9, goal: [4, 3, 'wander'] }); restoreNpc(scene, first)");
    assert.equal(run('first.x'), 56);
    assert.equal(run('first.y'), 48);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.path.length'), 0);
});

test('a conversation does not pull a housemate away from bedtime or rain shelter', () => {
    const run = createNpcs();
    run("findNearestRumor = getMysteryShopRumor = () => null; findNpcMeetingPath = () => [[4, 3]]; dialogueContainer = {}; isMenuOpen = () => false; beginDialogue = () => {}; nearestNpc = first; second.house = { doorX: 5, doorY: 3 }; second.dailyPlan = 'home'; startNpcPath(second, [[5, 3]], 'home', 100); talkToNearestNpc(scene)");
    assert.equal(run('second.goal'), 'home');
    assert.equal(run('second.joining'), undefined);
    run("second.state = 'idle'; second.goal = null; second.dailyPlan = 'day'; second.needsShelter = true; talkToNearestNpc(scene)");
    assert.equal(run('second.state'), 'idle');
    assert.equal(run('second.joining'), undefined);
});

test('residents describe their housemate actual routine without inventing an unseen location', () => {
    const run = createNpcs();
    run("first.house = { residents: [1, 2] }; const connection = { companion: second, kind: 'close' }; second.state = 'home'");
    assert.equal(run('describeNpcConnection(first, connection)'), "I'm close to Eli. We share a home nearby. Eli is at home for now.");
    run("second.state = 'walk'; second.goal = 'home'");
    assert.ok(run('describeNpcConnection(first, connection).endsWith("Eli is on the way home.")'));
    run("second.fishing = { state: 'floating' }");
    assert.ok(run('describeNpcConnection(first, connection).endsWith("Eli is fishing at the moment.")'));
    run('activeNpcs.splice(1, 1)');
    assert.equal(run('describeNpcConnection(first, connection)'), "I'm close to Eli. We share a home nearby.");
});

test('asking about company refreshes the answer after a companion changes plans', () => {
    const run = createNpcs();
    run("findNearestRumor = getMysteryShopRumor = () => null; second.state = 'walk'; second.goal = 'join'; second.joining = first.id; const nodes = buildNpcDialogue(scene, first)");
    assert.ok(run('nodes.company.text.endsWith("Eli is coming over to say hello.")'));
    run("second.state = 'talk'; second.talking = true; second.joinedConversation = first.id");
    assert.equal(run('nodes.chat.options.find(option => option.label === "Your company?").action()'), 'company');
    assert.ok(run('nodes.company.text.endsWith("Eli is here with us.")'));
});

test('a resident waits outside a blocked doorway and retries when it clears', () => {
    const run = createNpcs();
    run('first.x = 32; second.x = 160; first.house = { doorX: 3, doorY: 3 }; getWorldClock = () => ({ hour: 23, day: 1 }); canCharacterOccupy = () => true');
    assert.equal(run('updateNpcHome(scene, first, 100)'), false);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.x'), 32);
    run('character.x = character.y = -100; updateNpcHome(scene, first, 1000)');
    assert.equal(run('first.state'), 'idle');
    run('updateNpcHome(scene, first, 4101)');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'home');
    assert.equal(run('first.path.at(-1)[0]'), 3);
});

test('winding down still finishes the final partial step toward home', () => {
    const run = createNpcs();
    run("first.x = 56; first.house = { doorX: 4, doorY: 3 }; first.dailyPlan = 'evening'; canNpcOccupy = () => true; npcRandom = () => 0; chooseNpcPlan(scene, first, 100)");
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'windDown');
    assert.equal(run('first.path[0][0]'), 4);
});

test('a night routine reaches the doorway before hiding a resident indoors', () => {
    const run = createNpcs();
    run("first.x = 56; first.walkPhase = 1; first.house = { doorX: 4, doorY: 3 }; canNpcOccupy = () => true; getWorldClock = () => ({ hour: 23, day: 1 }); npcRandom = () => 0.75");
    assert.equal(run('updateNpcHome(scene, first, 100)'), false);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.path[0][0]'), 4);
    run('for (let time = 116; time < 5000 && first.state !== "home"; time += 16) updateNpc(scene, first, time, 16)');
    assert.equal(run('first.x'), 64);
    assert.equal(run('first.state'), 'home');
    assert.equal(run('first.sprite.visible'), false);
});

test('resuming between tiles uses a clear anchor when a neighbor blocks the rounded tile', () => {
    const run = createNpcs();
    run("first.x = 56; second.x = 64; character.x = character.y = -100; first.pausedActivity = { x: 5, y: 3, goal: 'wander' }; isNpcWalkableTile = (x, y) => x >= 2 && x <= 7 && (y === 3 || y === 4)");
    run('canCharacterOccupy = (scene, x, y, ignore) => !isBlockedByNpc(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, ignore)');
    assert.equal(run('canNpcOccupy(scene, first, 64, 48)'), false);
    assert.equal(run('resumeNpcActivity(scene, first, 100)'), true);
    assert.equal(run('first.path[0][0]'), 3);
    assert.ok(run('first.path.some(([x, y]) => y === 4)'));
    assert.equal(run('first.path.at(-1)[0]'), 5);
});

test('resuming a blocked partial step never snaps to an inaccessible tile', () => {
    const run = createNpcs();
    run("first.x = 56; first.pausedActivity = { x: 4, y: 3, goal: 'wander' }; canNpcOccupy = (scene, npc, x, y) => x === 56 && y === 48");
    assert.equal(run('resumeNpcActivity(scene, first, 100)'), false);
    assert.equal(run('first.x'), 56);
    assert.equal(run('first.y'), 48);
    assert.equal(run('first.state'), 'idle');
});

test('an interrupted walk finishes its last partial tile without backing up or stopping early', () => {
    const run = createNpcs();
    run("first.x = 56; first.walkPhase = 1; second.x = 160; character.x = character.y = -100; canNpcOccupy = () => true; first.pausedActivity = { x: 4, y: 3, goal: 'wander' }; npcRandom = () => 0.75");
    assert.equal(run('resumeNpcActivity(scene, first, 100)'), true);
    assert.equal(run('first.path[0]?.[0]'), 4);
    run('for (let time = 116; time < 5000 && first.state === "walk"; time += 16) updateNpc(scene, first, time, 16)');
    assert.equal(run('first.x'), 64);
    assert.equal(run('first.y'), 48);
    assert.equal(run('first.state'), 'idle');
});

test('dynamic routes check the whole segment even when its endpoint is clear', () => {
    const run = createNpcs();
    run('first.x = 64; second.x = 72; character.x = character.y = -100; isNpcWalkableTile = (x, y) => x >= 2 && x <= 7 && (y === 3 || y === 4)');
    run('canCharacterOccupy = (scene, x, y, ignore) => !isBlockedByNpc(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, ignore)');
    assert.equal(run('canNpcOccupy(scene, first, 80, 48)'), true);
    assert.equal(run('canNpcTraverse(scene, first, 64, 48, 80, 48)'), false);
    assert.equal(run('canNpcTraverse(scene, first, 64, 48, 64, 64)'), true);
    assert.equal(run('findNpcPath(4, 3, 6, 3, first, scene)[0][1]'), 4);
});

test('yielding to a moving neighbor is brief and falls back to a safe route', () => {
    const run = createNpcs();
    run('first.x = 64; second.x = 72; character.x = character.y = -100; isNpcWalkableTile = (x, y) => x >= 2 && x <= 7 && (y === 3 || y === 4)');
    run('canCharacterOccupy = (scene, x, y, ignore) => !isBlockedByNpc(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, ignore)');
    run("homes[1].tileX = second.tileX = 6; startNpcPath(first, [[5, 3]], 'wander', 100); startNpcPath(second, [[4, 3], [3, 3]], 'wander', 100)");
    assert.equal(run('getNpcBlockingNeighbor(second).id'), 1);
    assert.equal(run('rerouteNpc(scene, second, 800)'), true);
    assert.equal(run('second.path[0][0]'), 4);
    assert.equal(run('second.stuckSince'), 100);
    assert.equal(run('rerouteNpc(scene, second, 2400)'), true);
    assert.equal(run('second.path[0][0]'), 5);
    assert.equal(run('second.stuckSince'), 2400);
});

test('walkers pass head-on through a nearby clear lane instead of replanning into each other forever', () => {
    const run = createNpcs();
    run('homes[1].tileX = second.tileX = 6; second.x = 96; first.walkPhase = second.walkPhase = 1; character.x = character.y = -100; npcRandom = () => 0.75; isNpcWalkableTile = (x, y) => x >= 2 && x <= 7 && (y === 3 || y === 4)');
    run('canCharacterOccupy = (scene, x, y, ignore) => !isBlockedByNpc(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, ignore)');
    run("startNpcPath(first, [[4, 3], [5, 3], [6, 3]], 'wander', 100); startNpcPath(second, [[5, 3], [4, 3], [3, 3]], 'wander', 100)");
    run('let overlap = false; for (let time = 116; time < 20000; time += 16) { updateNpc(scene, first, time, 16); updateNpc(scene, second, time, 16); overlap ||= isBlockedByNpc(first.x + CHARACTER_HITBOX_X, first.y + CHARACTER_HITBOX_Y, first.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, first.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, first); if (first.state === "idle" && second.state === "idle") break; }');
    assert.equal(run('overlap'), false);
    assert.equal(run('first.x'), 96);
    assert.equal(run('second.x'), 48);
    assert.equal(run('first.y'), 48);
    assert.equal(run('second.y'), 48);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
});

test('morning and evening neighbor exchanges match the listener routine', () => {
    const run = createNpcs();
    run("first.dailyPlan = second.dailyPlan = 'day'; second.water = {}; getWorldClock = () => ({ hour: 8, day: 1 }); startNpcConversation(scene, first, second, 100)");
    assert.ok(run('first.speech.startsWith("Morning, Eli")'));
    assert.ok(run('second.speech.includes("by the water")'));
    run("first.state = second.state = 'idle'; second.dailyPlan = 'evening'; startNpcConversation(scene, first, second, 6000)");
    assert.ok(run('first.speech.includes("this evening")'));
    assert.equal(run('first.walkInvitation'), false);
});

test('weather greetings preserve personality and familiarity without claiming sunshine', () => {
    const run = createNpcs();
    run('findNearestRumor = getMysteryShopRumor = () => null; getRainIntensity = () => 0.5; getWorldClock = () => ({ hour: 8, day: 1 })');
    assert.ok(run('NPC_PERSONALITIES[4].rainGreetings.slice(0, 5).map(line => line.replace("{first}", "Ada")).includes(buildNpcDialogue(scene, first).intro.text.slice(9))'));
    run('first.playerVisits = 1; getWorldClock = () => ({ hour: 19, day: 1 })');
    assert.ok(run('NPC_PERSONALITIES[4].rainGreetings.slice(5).includes(buildNpcDialogue(scene, first).intro.text.slice(9))'));
    run('getRainIntensity = () => 0; getWorldClock = () => ({ hour: 12, day: 1 })');
    assert.ok(run('NPC_PERSONALITIES[4].familiar.includes(buildNpcDialogue(scene, first).intro.text)'));
});

test('a neighbor chat pauses a fishing trip and returns the listener to it afterward', () => {
    const run = createNpcs();
    run("homes[1].tileX = second.tileX = 4; first.dailyPlan = second.dailyPlan = 'day'; getNpcConnection = () => null; second.failedSpots = new Set(); second.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; findNpcWater = () => ({ direction: 'front' }); canNpcOccupy = () => true; startNpcPath(second, [[5, 3]], 'fish', 100); startNpcConversation(scene, first, second, 100)");
    assert.equal(run('second.pausedActivity.goal'), 'fish');
    assert.equal(run('first.speech'), 'Off to the water?');
    run('updateNpc(scene, first, 5200, 16); updateNpc(scene, second, 5200, 16)');
    assert.equal(run('second.state'), 'walk');
    assert.equal(run('second.goal'), 'fish');
    assert.equal(run('second.path.at(-1)[0]'), 5);
    assert.equal(run('second.pausedActivity'), null);
});

test('player interruption of a neighbor chat keeps the original task underneath it', () => {
    const run = createNpcs();
    run("startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); startNpcConversation(scene, first, second, 100); findNearestRumor = getMysteryShopRumor = () => null; nearestNpc = first; dialogueContainer = {}; isMenuOpen = () => false; canNpcOccupy = () => true; beginDialogue = (scene, nodes, ignored, name, npc) => { dialogueNpc = npc; dialogueOpen = true; }; talkToNearestNpc(scene)");
    assert.equal(run('first.pausedActivity.x'), 5);
    assert.equal(run('first.pausedActivity.goal'), 'wander');
    run('scene.time.now = 1000; releaseDialogueNpc(scene)');
    assert.equal(run('first.goal'), 'wander');
    assert.equal(run('first.path.at(-1)[0]'), 5);
});

test('residents wait indoors when no exit is safe and use a side exit when the front is blocked', () => {
    const run = createNpcs();
    run('first.house = { doorX: 3, doorY: 3 }; canNpcOccupy = () => true; enterNpcHouse(first); isNpcWalkableTile = () => false');
    assert.equal(run('updateNpcHome(scene, first, 1000)'), true);
    assert.equal(run('first.state'), 'home');
    assert.equal(run('first.sprite.visible'), false);
    run('isNpcWalkableTile = (x, y) => x !== 3 || y < 4 || y > 5; updateNpcHome(scene, first, 2000)');
    assert.equal(run('first.goal'), 'leaveHome');
    assert.equal(run('first.path.at(-1)[1]'), 3);
    assert.ok(run('first.path.at(-1)[0] < 3'));
});

test('home exits keep their purpose through interruption and stay within the home boundary', () => {
    const run = createNpcs();
    run('first.house = { doorX: 3, doorY: 7 }; first.x = 48; first.y = 112; canNpcOccupy = () => true; enterNpcHouse(first); updateNpcHome(scene, first, 1000)');
    assert.ok(run('first.path.every(([x, y]) => isNpcInHomeArea(first, x, y))'));
    assert.equal(run('first.path.at(-1)[1]'), 7);
    run('pauseNpcActivity(first); settleNpc(scene, first, 1000, 0)');
    assert.ok(run('describeNpcPlans(first).includes("stepping outside")'));
    assert.equal(run('resumeNpcActivity(scene, first, 2000)'), true);
    assert.equal(run('first.goal'), 'leaveHome');
    run('npcMemory.set(first.id, serializeNpc(first, 2000)); restoreNpc(scene, first)');
    assert.equal(run('first.goal'), 'leaveHome');
});

test('housemates leave in sequence without overlapping or choosing the same exit destination', () => {
    const run = createNpcs();
    run('homes[1].tileX = second.tileX = 4; first.house = second.house = { id: 1, x: 2, y: 1, doorX: 3, doorY: 3, residents: [1, 2] }; first.x = second.x = 48; first.y = second.y = 48; first.walkPhase = second.walkPhase = 1; character.x = character.y = -100; enterNpcHouse(first); enterNpcHouse(second)');
    run('canCharacterOccupy = (scene, x, y, ignore) => !isBlockedByNpc(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, ignore)');
    run('updateNpc(scene, first, 100, 16); updateNpc(scene, second, 100, 16)');
    assert.equal(run('first.goal'), 'leaveHome');
    assert.equal(run('second.state'), 'home');
    run('let overlap = false; for (let time = 116; time < 10000; time += 16) { updateNpc(scene, first, time, 16); updateNpc(scene, second, time, 16); if (first.state !== "home" && second.state !== "home") overlap ||= isBlockedByNpc(first.x + CHARACTER_HITBOX_X, first.y + CHARACTER_HITBOX_Y, first.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, first.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, first); if (first.state === "idle" && second.state === "idle") break; }');
    assert.equal(run('overlap'), false);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
    assert.notEqual(run('first.y'), run('second.y'));
    assert.ok(run('Number.isInteger(first.x) && Number.isInteger(second.y)'));
});

test('night fishers tolerate light rain but take shelter in a heavy shower', () => {
    const run = createNpcs();
    run('first.water = {}; first.house = { doorX: 5, doorY: 3 }; canNpcOccupy = () => true; npcHash = () => 0.1; getWorldClock = () => ({ hour: 23, day: 1 }); getRainIntensity = () => 0.4; updateNpcHome(scene, first, 100)');
    assert.equal(run('first.dailyPlan'), 'late');
    assert.equal(run('first.needsShelter'), false);
    assert.equal(run('first.state'), 'idle');
    run('getRainIntensity = () => 0.8; updateNpcHome(scene, first, 1000)');
    assert.equal(run('first.needsShelter'), true);
    assert.equal(run('first.goal'), 'home');
});

test('residents shelter from heavy rain and stay indoors until it eases', () => {
    const run = createNpcs();
    run('first.house = { doorX: 3, doorY: 3 }; first.x = 32; canNpcOccupy = () => true; getRainIntensity = () => 0.8; updateNpcHome(scene, first, 100)');
    assert.equal(run('first.goal'), 'home');
    assert.equal(run('first.needsShelter'), true);
    assert.ok(run('describeNpcPlans(first).includes("rain")'));
    run('first.x = 48; first.path = []; updateNpc(scene, first, 116, 16)');
    assert.equal(run('first.state'), 'home');
    run('getRainIntensity = () => 0.4');
    assert.equal(run('updateNpcHome(scene, first, 1000)'), true);
    assert.equal(run('first.state'), 'home');
    run('getRainIntensity = () => 0.2; updateNpcHome(scene, first, 2000)');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'leaveHome');
    assert.equal(run('first.needsShelter'), false);
    run('getRainIntensity = () => 0.4; updateNpcHome(scene, first, 3000)');
    assert.equal(run('first.state'), 'walk');
});

test('rain changes interrupted plans and canceled shelter trips do not enter an empty house', () => {
    const run = createNpcs();
    run("first.house = { doorX: 5, doorY: 3 }; startNpcPath(first, [[4, 3]], 'wander', 100); pauseNpcActivity(first); settleNpc(scene, first, 100, 0); canNpcOccupy = () => true; getRainIntensity = () => 0.8");
    assert.equal(run('resumeNpcActivity(scene, first, 1000)'), false);
    run('updateNpcHome(scene, first, 1016)');
    assert.equal(run('first.goal'), 'home');
    run('getRainIntensity = () => 0; updateNpcHome(scene, first, 2000)');
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.goal'), null);
});

test('social plans leave a neighbor who is already walking home alone', () => {
    const run = createNpcs();
    run("startNpcPath(second, [[5, 3]], 'home', 100); npcRandom = () => 0");
    assert.equal(run('tryNpcSocialPlan(scene, first, 1000)'), false);
    assert.equal(run('second.goal'), 'home');
    assert.equal(run('second.state'), 'walk');
});

test('evening destinations survive a conversation and a save without losing their purpose', () => {
    const run = createNpcs();
    run("first.dailyPlan = 'evening'; first.house = { doorX: 5, doorY: 3 }; canNpcOccupy = () => true; npcRandom = () => 0; getWorldClock = () => ({ hour: 21, day: 1 }); chooseNpcPlan(scene, first, 100); pauseNpcActivity(first); settleNpc(scene, first, 100, 0)");
    assert.equal(run('first.pausedActivity.goal'), 'windDown');
    assert.equal(run('resumeNpcActivity(scene, first, 1000)'), true);
    assert.equal(run('first.goal'), 'windDown');
    run('npcMemory.set(first.id, serializeNpc(first, 1000)); restoreNpc(scene, first)');
    assert.equal(run('first.goal'), 'windDown');
    assert.equal(run('first.path.at(-1)[0]'), 5);
});

test('residents wind down near home before their individual bedtime', () => {
    const run = createNpcs();
    assert.equal(run('getNpcDailyPlan(first, { hour: 19, day: 1 })'), 'day');
    assert.equal(run('getNpcDailyPlan(first, { hour: 21, day: 1 })'), 'evening');
    assert.equal(run('getNpcDailyPlan(first, { hour: 22, day: 1 })'), 'home');
    run("first.dailyPlan = 'evening'; first.house = { doorX: 5, doorY: 3 }; canNpcOccupy = () => true; npcRandom = () => 0; chooseNpcPlan(scene, first, 100)");
    assert.equal(run('first.goal'), 'windDown');
    assert.equal(run('first.path.at(-1)[0]'), 5);
    assert.ok(run('describeNpcPlans(first).includes("winding down")'));
    run('first.x = 80; settleNpc(scene, first, 100, 0); chooseNpcPlan(scene, first, 1000)');
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.until'), 7000);
});

test('bedtime route retries do not start new wandering, socializing, or casts', () => {
    const run = createNpcs();
    run("first.house = { doorX: 5, doorY: 3 }; first.state = 'charge'; first.charge = { start: 50 }; getWorldClock = () => ({ hour: 23, day: 1 }); isNpcWalkableTile = () => false; updateNpcHome(scene, first, 100)");
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.charge'), null);
    run('let socialAttempts = 0; tryNpcSocialPlan = () => { socialAttempts++; return true; }; chooseNpcPlan(scene, first, 1100)');
    assert.equal(run('socialAttempts'), 0);
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.until'), 2100);
});

test('saved journeys home resume at night but expire when loaded during the day', () => {
    const run = createNpcs();
    run("first.house = { doorX: 5, doorY: 3 }; canNpcOccupy = () => true; startNpcPath(first, [[4, 3], [5, 3]], 'home', 100); pauseNpcActivity(first); const journeyHome = serializeNpc(first, 100); npcMemory.set(first.id, journeyHome); getWorldClock = () => ({ hour: 23, day: 1 }); restoreNpc(scene, first)");
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'home');
    run('npcMemory.set(first.id, journeyHome); getWorldClock = () => ({ hour: 12, day: 2 }); restoreNpc(scene, first)');
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('first.goal'), null);
});

test('NPCs explain the task interrupted by the player through the plans dialogue', () => {
    const run = createNpcs();
    run('findNearestRumor = getMysteryShopRumor = () => null; first.pausedActivity = { x: 5, y: 3, goal: "wander" }; const plansDialogue = buildNpcDialogue(scene, first)');
    assert.ok(run('plansDialogue.plans.text.includes("finish my walk after we chat")'));
    assert.ok(run('plansDialogue.chat.options.some(option => option.label === "Your plans?" && option.next === "plans")'));
    run('first.pausedActivity.goal = "stroll"');
    assert.ok(run('describeNpcPlans(first).includes("walk together")'));
    run('first.pausedActivity.goal = "fish"');
    assert.ok(run('describeNpcPlans(first).includes("ready to fish")'));
    run('first.pausedActivity.goal = "home"');
    assert.ok(run('describeNpcPlans(first).includes("heading home")'));
});

test('both friends resume their shared walk after group dialogue closes', () => {
    const run = createNpcs();
    run("homes[1].tileX = second.tileX = 4; nearestNpc = first; dialogueContainer = {}; isMenuOpen = () => false; findNearestRumor = getMysteryShopRumor = () => null; canNpcOccupy = () => true; beginDialogue = (scene, nodes, ignored, name, npc) => { dialogueNpc = npc; dialogueOpen = true; }");
    run("startNpcPath(first, [[4, 3], [5, 3]], 'stroll', 100); startNpcPath(second, [[4, 4], [5, 4]], 'stroll', 100); first.walkPartner = 2; second.walkPartner = 1; first.strollSpeed = second.strollSpeed = 0.35; first.walkEnds = second.walkEnds = 20000; talkToNearestNpc(scene)");
    assert.equal(run('first.pausedActivity.goal'), 'stroll');
    assert.equal(run('second.pausedActivity.goal'), 'stroll');
    run('scene.time.now = 1000; releaseDialogueNpc(scene)');
    assert.equal(run('first.goal'), 'stroll');
    assert.equal(run('second.goal'), 'stroll');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('second.state'), 'walk');
    assert.equal(run('first.walkEnds'), 21000);
    run('pauseNpcActivity(first); settleNpc(scene, first, 1000, 0); activeNpcs.pop()');
    assert.equal(run('resumeNpcActivity(scene, first, 1500)'), true);
    assert.equal(run('first.goal'), 'wander');
});

test('saving during a conversation restores the remembered destination without reopening dialogue', () => {
    const run = createNpcs();
    run("canNpcOccupy = () => true; startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); pauseNpcActivity(first); settleNpc(scene, first, 100, 0); first.state = 'talk'; npcMemory.set(first.id, serializeNpc(first, 100)); restoreNpc(scene, first)");
    assert.equal(run('first.pausedActivity'), null);
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'wander');
    assert.equal(run('first.path.at(-1)[0]'), 5);
    assert.equal(run('dialogueOpen'), false);
});

test('interrupted casting restarts aiming safely at a still-valid fishing spot', () => {
    const run = createNpcs();
    run("first.state = 'charge'; first.charge = { start: 50 }; first.spot = { tileX: 3, tileY: 3, water: { direction: 'front' } }; first.failedSpots = new Set(); findNpcWater = () => ({ direction: 'front' }); canNpcOccupy = () => true; pauseNpcActivity(first); settleNpc(scene, first, 100, 0)");
    assert.equal(run('JSON.stringify(serializeNpc(first, 100).goal)'), '[3,3,"fish"]');
    assert.equal(run('resumeNpcActivity(scene, first, 1000)'), true);
    run('updateNpc(scene, first, 1016, 16)');
    assert.equal(run('first.state'), 'aim');
    assert.equal(run('first.pausedActivity'), null);
});

test('resuming respects blocked routes and a bedtime reached during the chat', () => {
    const run = createNpcs();
    run("startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); pauseNpcActivity(first); settleNpc(scene, first, 100, 0); isNpcWalkableTile = () => false; canNpcOccupy = () => true");
    assert.equal(run('resumeNpcActivity(scene, first, 1000)'), false);
    assert.equal(run('first.state'), 'idle');
    run("isNpcWalkableTile = () => true; first.house = { doorX: 3, doorY: 3 }; startNpcPath(first, [[4, 3]], 'wander', 1000); pauseNpcActivity(first); settleNpc(scene, first, 1000, 0); getWorldClock = () => ({ hour: 23, day: 1 })");
    assert.equal(run('resumeNpcActivity(scene, first, 2000)'), false);
    run('updateNpcHome(scene, first, 2016)');
    assert.equal(run('first.state'), 'home');
});

test('a player conversation pauses a destination and resumes it on a fresh bounded route', () => {
    const run = createNpcs();
    run('findNearestRumor = getMysteryShopRumor = () => null; nearestNpc = first; dialogueContainer = {}; isMenuOpen = () => false; canNpcOccupy = () => true; beginDialogue = (scene, nodes, ignored, name, npc) => { dialogueNpc = npc; dialogueOpen = true; }');
    run("startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); talkToNearestNpc(scene)");
    assert.equal(run('first.state'), 'talk');
    assert.equal(run('first.pausedActivity.x'), 5);
    assert.equal(run('JSON.stringify(serializeNpc(first, 100).goal)'), '[5,3,"wander"]');
    run('first.x = 64; scene.time.now = 5000; releaseDialogueNpc(scene)');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'wander');
    assert.equal(run('JSON.stringify(first.path)'), '[[5,3]]');
    assert.equal(run('first.pausedActivity'), null);
    assert.equal(run('first.talking'), false);
});

test('joining friends remember their old task rather than saving their dialogue approach', () => {
    const run = createNpcs();
    run("homes[1].tileX = second.tileX = 4; findNearestRumor = getMysteryShopRumor = () => null; nearestNpc = first; dialogueContainer = {}; isMenuOpen = () => false; canNpcOccupy = () => true; beginDialogue = (scene, nodes, ignored, name, npc) => { dialogueNpc = npc; dialogueOpen = true; }; startNpcPath(second, [[5, 3], [6, 3]], 'wander', 100); talkToNearestNpc(scene)");
    assert.equal(run('second.goal'), 'join');
    assert.equal(run('second.pausedActivity.x'), 6);
    assert.equal(run('JSON.stringify(serializeNpc(second, 100).goal)'), '[6,3,"wander"]');
    run('scene.time.now = 1000; releaseDialogueNpc(scene)');
    assert.equal(run('second.goal'), 'wander');
    assert.equal(run('second.state'), 'walk');
    assert.equal(run('second.path.at(-1)[0]'), 6);
});

test('walkers keep a constant speed at corners and arrivals without easing', () => {
    const run = createNpcs();
    run("startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); first.x = 63; first.travelDirection = 'right'; first.turnUntil = 0; first.walkPhase = 1; first.walkSpeed = 0.5; canNpcOccupy = () => true; stepNpc(scene, first, 116, 16)");
    assert.equal(run('first.walkSpeed'), 0.5);
    run('first.path = [[4, 3], [4, 4]]; first.x = 63; first.walkSpeed = 0.5; stepNpc(scene, first, 132, 16)');
    assert.equal(run('first.walkSpeed'), 0.5);
    run('first.path = [[4, 3]]; first.x = 63; first.walkSpeed = 0.5; stepNpc(scene, first, 148, 16)');
    assert.equal(run('first.walkSpeed'), 0.5);
    run('let arrived = false; for (let time = 164; time < 1000; time += 16) { arrived = stepNpc(scene, first, time, 16); if (arrived) break; }');
    assert.equal(run('arrived'), true);
    assert.equal(run('first.x'), 64);
    assert.equal(run('first.y'), 48);
});

test('a full shared walk respects both NPC hitboxes while reaching adjacent destinations', () => {
    const run = createNpcs();
    run("homes[1].tileX = second.tileX = 4; first.dailyPlan = second.dailyPlan = 'day'; character.x = character.y = -100; first.walkPhase = second.walkPhase = 1; npcRandom = () => 0.75");
    run('canCharacterOccupy = (scene, x, y, ignore) => !isBlockedByNpc(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, ignore)');
    run('startNpcConversation(scene, first, second, 100)');
    assert.equal(run('tryNpcSharedWalk(scene, first, second, 5200)'), true);
    run('let overlap = false; for (let time = 5216; time < 24000; time += 16) { updateNpc(scene, first, time, 16); updateNpc(scene, second, time, 16); overlap ||= isBlockedByNpc(first.x + CHARACTER_HITBOX_X, first.y + CHARACTER_HITBOX_Y, first.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, first.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, first); if (first.state === "idle" && second.state === "idle") break; }');
    assert.equal(run('overlap'), false);
    assert.equal(run('first.lastActivity'), 'walk');
    assert.equal(run('second.lastActivity'), 'walk');
    assert.equal(run('Math.abs(first.x - second.x) + Math.abs(first.y - second.y)'), 16);
});

test('shared walkers wait for a lagging friend without both waiting on equal routes', () => {
    const run = createNpcs();
    run("first.goal = second.goal = 'stroll'; first.state = second.state = 'walk'; first.walkPartner = 2; first.walkEnds = 10000; first.path = [[5, 3]]; second.path = [[4, 3], [5, 3], [6, 3]]; second.x = 112; first.walkSpeed = 0.5");
    assert.equal(run('waitForNpcWalkPartner(scene, first, 1000)'), true);
    assert.equal(run('first.walkSpeed'), 0);
    assert.equal(run('first.stuckSince'), 1000);
    run('first.path = [...second.path]');
    assert.equal(run('waitForNpcWalkPartner(scene, first, 1016)'), false);
    run('second.talking = true');
    assert.equal(run('waitForNpcWalkPartner(scene, first, 1032)'), false);
    assert.equal(run('first.state'), 'walk');
});

test('shared walks do not start at night or when every possible route is blocked', () => {
    const run = createNpcs();
    run("homes[1].tileX = second.tileX = 4; first.dailyPlan = 'home'; second.dailyPlan = 'day'; canNpcOccupy = () => true; startNpcConversation(scene, first, second, 100)");
    assert.equal(run('first.walkInvitation'), false);
    assert.equal(run('tryNpcSharedWalk(scene, first, second, 5100)'), false);
    run("first.dailyPlan = 'day'; first.walkInvitation = true; canNpcOccupy = () => false");
    assert.equal(run('tryNpcSharedWalk(scene, first, second, 5200)'), false);
    assert.equal(run('first.state'), 'social');
    assert.equal(run('second.state'), 'social');
    assert.equal(run('first.walkInvitation'), false);
});

test('close neighbors follow a daytime conversation with a bounded shared walk', () => {
    const run = createNpcs();
    run("homes[1].tileX = second.tileX = 4; first.dailyPlan = second.dailyPlan = 'day'; first.speed = 0.5; second.speed = 0.35; canNpcOccupy = () => true; npcRandom = () => 0.75; startNpcConversation(scene, first, second, 100)");
    assert.equal(run('first.walkInvitation'), true);
    run('updateNpc(scene, second, 5200, 16); updateNpc(scene, first, 5200, 16)');
    assert.equal(run('first.goal'), 'stroll');
    assert.equal(run('second.goal'), 'stroll');
    assert.equal(run('first.walkPartner'), 2);
    assert.equal(run('second.walkPartner'), 1);
    assert.equal(run('first.strollSpeed'), 0.35);
    assert.equal(run('second.strollSpeed'), 0.35);
    assert.ok(run('first.path.every(([x, y]) => isNpcInHomeArea(first, x, y)) && second.path.every(([x, y]) => isNpcInHomeArea(second, x, y))'));
    assert.equal(run('Math.abs(first.path.at(-1)[0] - second.path.at(-1)[0]) + Math.abs(first.path.at(-1)[1] - second.path.at(-1)[1])'), 1);
    run('first.walkPhase = second.walkPhase = 1; for (let time = 5216; time < 22000; time += 16) { updateNpc(scene, first, time, 16); updateNpc(scene, second, time, 16); if (first.state === "idle" && second.state === "idle") break; }');
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
    assert.equal(run('first.lastActivity'), 'walk');
    assert.equal(run('second.lastActivity'), 'walk');
    assert.ok(run('Number.isInteger(first.x) && Number.isInteger(second.x)'));
});

test('habitual fishers revisit safe spots but abandon locations with failed casts', () => {
    const run = createNpcs();
    run("first.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; first.failedSpots = new Set(); canNpcOccupy = () => true; tryNpcSocialPlan = () => false; npcRandom = () => 0; findNpcWater = () => ({ direction: 'front' }); isNpcStandingTile = () => true; chooseNpcPlan(scene, first, 100)");
    assert.equal(run('first.goal'), 'fish');
    assert.equal(run('first.spot.tileX'), 5);
    assert.equal(run('first.spot.tileY'), 3);
    run('first.failedSpots.add(getTileId(5, 3)); chooseNpcPlan(scene, first, 1000)');
    assert.ok(run('first.spot.tileX !== 5 || first.spot.tileY !== 3'));
    assert.ok(run('first.path.every(([x, y]) => isNpcInHomeArea(first, x, y))'));
});

test('residents without a safe house still follow their night fishing preference', () => {
    const run = createNpcs();
    run('first.water = {}; npcHash = () => 0.1; getWorldClock = () => ({ hour: 23, day: 4 }); updateNpcHome(scene, first, 100)');
    assert.equal(run('first.dailyPlan'), 'late');
});

test('saved memories are bounded with active residents taking priority', () => {
    const run = createNpcs();
    run('restoreSavedNpcs(scene, Array.from({ length: 300 }, (_, id) => ({ id: id + 10, x: 0, y: 0 }))); loadedChunks.set(1, { npcs: [first] })');
    assert.equal(run('npcMemory.size'), 200);
    run('restoreSavedNpcs(scene, Array.from({ length: 300 }, (_, id) => ({ id: id + 1000, x: 0, y: 0 })))');
    assert.equal(run('npcMemory.size'), 200);
    assert.equal(run('getSavedNpcs(100).length'), 200);
    assert.equal(run('getSavedNpcs(100).at(-1).id'), 1);
});

test('NPCs recognize repeat visits and recall the neighbor they spoke with', () => {
    const run = createNpcs();
    run('findNearestRumor = getMysteryShopRumor = () => null; nearestNpc = first; dialogueContainer = {}; isMenuOpen = () => false; const encounters = []; beginDialogue = (scene, nodes) => encounters.push(nodes.intro.text)');
    run('talkToNearestNpc(scene); first.talking = false; talkToNearestNpc(scene)');
    assert.equal(run('peopleMet.size'), 1);
    assert.equal(run('first.playerVisits'), 2);
    assert.ok(run('encounters[0] !== encounters[1]'));
    assert.ok(run('NPC_PERSONALITIES[4].familiar.includes(encounters[1])'));
    run("first.talking = false; first.state = second.state = 'idle'; startNpcConversation(scene, first, second, 100)");
    assert.ok(run('buildNpcDialogue(scene, first).chat.text.includes("Eli")'));
    run("first.lastActivity = 'fishing'");
    assert.ok(run('NPC_ACTIVITY_LINES.fishing.includes(buildNpcDialogue(scene, first).chat.text)'));
    run("first.lastActivity = 'walk'");
    assert.ok(run('NPC_ACTIVITY_LINES.walk.includes(buildNpcDialogue(scene, first).chat.text)'));
});

test('NPC memories survive unloading and saving without duplicating active residents', () => {
    const run = createNpcs();
    run("first.playerVisits = 3; first.lastActivity = 'social'; first.lastNeighbor = second.name; rememberChunkNpcs({ npcs: [first] }, 100); loadedChunks.clear()");
    assert.equal(run('getSavedNpcs(100)[0].visits'), 3);
    run('first.playerVisits = 4; loadedChunks.set(1, { npcs: [first] })');
    assert.equal(run('getSavedNpcs(100).length'), 1);
    assert.equal(run('getSavedNpcs(100)[0].visits'), 4);
    run('first.playerVisits = 0; first.lastNeighbor = null; restoreSavedNpcs(scene, [{ ...serializeNpc(first, 100), visits: 5, activity: "social", neighbor: "Eli Moss" }])');
    assert.equal(run('first.playerVisits'), 5);
    assert.equal(run('first.lastNeighbor'), 'Eli Moss');
    run('npcMemory.set(first.id, { ...serializeNpc(first, 100), visits: Infinity, activity: "bogus", neighbor: {} }); restoreNpc(scene, first)');
    assert.equal(run('first.playerVisits'), 0);
    assert.equal(run('first.lastActivity'), null);
    assert.equal(run('first.lastNeighbor'), null);
});

test('neighbors speak in turns and acknowledge a shared evening routine', () => {
    const run = createNpcs();
    run("first.dailyPlan = second.dailyPlan = 'home'; first.house = second.house = { id: 1 }; startNpcConversation(scene, first, second, 100)");
    assert.equal(run('first.speech'), 'Heading home soon?');
    assert.equal(run('second.speech'), "Yes, I'll see you at home.");
    assert.ok(run('first.speechUntil < second.speechFrom'));
    run('first.bubble = { visible: false, setVisible(value) { this.visible = value; return this; }, setText() { return this; }, setPosition() { return this; }, setDepth() { return this; } }; second.bubble = { ...first.bubble }; updateNpcHome = () => false');
    run('updateNpc(scene, first, 500, 16); updateNpc(scene, second, 500, 16)');
    assert.equal(run('first.bubble.visible'), true);
    assert.equal(run('second.bubble.visible'), false);
    run('updateNpc(scene, first, 3000, 16); updateNpc(scene, second, 3000, 16)');
    assert.equal(run('first.bubble.visible'), false);
    assert.equal(run('second.bubble.visible'), true);
    run("first.state = second.state = 'idle'; first.dailyPlan = 'day'; second.dailyPlan = 'late'; startNpcConversation(scene, first, second, 6000)");
    assert.equal(run('first.speech'), 'Still fishing tonight?');
});

test('house placement leaves two dry tiles around the building and doorway', () => {
    const run = createNpcs();
    run('getTerrainType = (x, y) => x === 0 ? "water" : "grass"');
    assert.equal(run('isNpcHouseSetbackClear(2, 3)'), false);
    assert.equal(run('isNpcHouseSetbackClear(3, 3)'), true);
    run('isNpcStandingTile = () => true; getNpcAt = () => null; first.house = getNpcHouse(first)');
    assert.ok(run('first.house && first.house.x >= 3'));
    run('npcHouseCache.clear(); npcHouseTiles.clear(); getTerrainType = () => "water"');
    assert.equal(run('getNpcHouse(first)'), null);
});

test('blocked walkers stand still without hiding how long they have waited', () => {
    const run = createNpcs();
    run("startNpcPath(first, [[4, 3]], 'wander', 100); first.travelDirection = 'right'; first.turnUntil = 0; first.walkPhase = 1; canNpcOccupy = () => false");
    run('stepNpc(scene, first, 500, 16); stepNpc(scene, first, 900, 16)');
    assert.equal(run('first.x'), 48);
    assert.equal(run('first.frame'), 0);
    assert.equal(run('first.walkSpeed'), 0);
    assert.equal(run('first.stuckSince'), 100);
    run('canNpcOccupy = () => true; for (let time = 916; time < 1400; time += 16) stepNpc(scene, first, time, 16)');
    assert.ok(run('first.x > 48 && Number.isInteger(first.x)'));
});

test('blocked routes go around occupied tiles without losing their purpose or home bounds', () => {
    const run = createNpcs();
    run("startNpcPath(first, [[4, 3], [5, 3]], 'home', 100); canNpcOccupy = (scene, npc, x, y) => x !== 64 || y !== 48");
    assert.equal(run('rerouteNpc(scene, first, 800)'), true);
    assert.equal(run('first.goal'), 'home');
    assert.equal(run('first.stuckSince'), 800);
    assert.ok(run('first.path.every(([x, y]) => (x !== 4 || y !== 3) && isNpcInHomeArea(first, x, y))'));
    assert.equal(run('JSON.stringify(first.path.at(-1))'), '[5,3]');
    run('canNpcOccupy = () => false');
    assert.equal(run('rerouteNpc(scene, first, 1500)'), false);
});

function createNpcs() {
    const context = vm.createContext({ TEST_MODE: true, getTileId: (x, y) => (x + 1000) * 10000 + y, coordinateHash: () => 0.7, cacheWorldValue: (cache, key, value) => (cache.set(key, value), value), getPersonTexture: () => 'portrait', getPersonPortraitTexture: () => 'headshot' });
    const files = ['runtime/settings.js', 'runtime/state.js', 'npc-names.js', 'npc-dialogue.js', 'environment/npcs.js', 'environment/interiors.js', 'runtime/character.js', 'art/trees.js'];
    vm.runInContext(files.map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext(`
        const homes = [{ id: 1, tileX: 3, tileY: 3, name: 'Ada Reed' }, { id: 2, tileX: 13, tileY: 3, name: 'Eli Moss' }];
        findCellNpc = (x, y) => y === 0 && x < 2 && x >= 0 ? homes[x] : null;
        isNpcWalkableTile = () => true;
        getTerrainType = () => 'grass';
        getWorldClock = () => ({ hour: 12, day: 1 });
        getRainIntensity = () => 0;
        drawNpcRod = drawNpcShadow = () => {}; isMenuOpen = () => false; buildInterior = (scene, house) => ({house, left: house.doorX * TILE_SIZE - 64, right: house.doorX * TILE_SIZE + 64, top: house.doorY * TILE_SIZE - 96, bottom: house.doorY * TILE_SIZE, doorLeft: house.doorX * TILE_SIZE, blocked: [], residents: []});
        mainCamera = { scrollX: 0, scrollY: 0, width: 320, height: 192 };
        character = { x: 48, y: 48 };
        const scene = { time: { now: 100 } };
        const actor = home => ({ ...home, look: [], x: 48, y: 48, state: 'idle', direction: 'front', frame: 0, rng: 1, speed: 0.5, path: [], until: 1000, shadow: { clear() {} }, sprite: { setTexture() { return this; }, setPosition() { return this; }, setDepth() { return this; }, setVisible(value) { this.visible = value; return this; } } });
        const first = actor(homes[0]), second = actor(homes[1]); second.x = 64;
        activeNpcs.push(first, second);
    `, context);
    return code => vm.runInContext(code, context);
}

test('seeded connections are mutual and survive rebuilding the NPC cache', () => {
    const run = createNpcs();
    assert.equal(run('getNpcConnection(first).companion.id'), 2);
    assert.equal(run('getNpcConnection(second).companion.id'), 1);
    const kind = run('getNpcConnection(first).kind');
    assert.equal(run('getNpcConnection(second).kind'), kind);
    run('npcCache.clear()');
    assert.equal(run('getNpcConnection(first).kind'), kind);
});

test('nearby connected residents share one clear house within both home areas', () => {
    const run = createNpcs();
    run('homes[0].tileX = first.tileX = 7; homes[1].tileX = second.tileX = 12; isNpcStandingTile = () => true; getNpcAt = () => null; first.house = getNpcHouse(first); second.house = getNpcHouse(second)');
    assert.equal(run('first.house === second.house'), true);
    assert.equal(run('first.house.residents.length'), 2);
    assert.ok(run('isNpcInHomeArea(first, first.house.doorX, first.house.doorY) && isNpcInHomeArea(second, first.house.doorX, first.house.doorY)'));
    assert.equal(run('npcHouseTiles.size'), 3);
    assert.equal(run('isBlockedByNpc(first.house.x * TILE_SIZE, (first.house.y + 1) * TILE_SIZE, first.house.x * TILE_SIZE + 1, (first.house.y + 1) * TILE_SIZE + 1)'), true);
});

test('night routines send residents home and allow some fishers to stay out overnight', () => {
    const run = createNpcs();
    assert.equal(run('getNpcDailyPlan(first, { hour: 23, day: 4 })'), 'home');
    assert.equal(run('getNpcDailyPlan(first, { hour: 12, day: 4 })'), 'day');
    run('first.water = {}; const nightSalts = []; npcHash = (x, y, salt) => { if (salt >= 1340) nightSalts.push(salt); return 0.1; }');
    assert.equal(run('getNpcDailyPlan(first, { hour: 23, day: 4 })'), 'late');
    assert.equal(run('getNpcDailyPlan(first, { hour: 1, day: 5 })'), 'late');
    assert.equal(run('nightSalts[0] === nightSalts[1]'), true);
});

test('residents enter at night, restore indoors, and wait for a clear doorway in the morning', () => {
    const run = createNpcs();
    run('first.house = { id: 1, x: 2, y: 1, doorX: 3, doorY: 3, residents: [1] }; first.x = 32; canNpcOccupy = () => true; getWorldClock = () => ({ hour: 23, day: 4 }); updateNpcHome(scene, first, 100)');
    assert.equal(run('first.goal'), 'home');
    assert.ok(run('first.path.every(([x, y]) => isNpcInHomeArea(first, x, y))'));
    run('first.x = 48; first.path = []; updateNpc(scene, first, 116, 16)');
    assert.equal(run('first.state'), 'home');
    assert.equal(run('first.sprite.visible'), false);
    assert.equal(run('saveDirty'), true);
    run("const savedHome = serializeNpc(first, 116); npcMemory.set(first.id, savedHome); first.state = 'idle'; first.sprite.visible = true; restoreNpc(scene, first)");
    assert.equal(run('first.state'), 'home');
    assert.equal(run('first.sprite.visible'), false);
    run('getWorldClock = () => ({ hour: 12, day: 5 }); canNpcOccupy = () => false; updateNpcHome(scene, first, 200)');
    assert.equal(run('first.state'), 'home');
    run('canNpcOccupy = () => true; updateNpcHome(scene, first, 950)');
    assert.equal(run('first.state'), 'walk');
    assert.equal(run('first.goal'), 'leaveHome');
    assert.equal(run('first.sprite.visible'), true);
});

test('NPC paths cannot leave the home area even to bypass an obstacle', () => {
    const run = createNpcs();
    assert.equal(run('findNpcPath(3, 3, 9, 3, first)'), null);
    assert.ok(run('findNpcPath(3, 3, 6, 3, first).every(([x, y]) => isNpcInHomeArea(first, x, y))'));
    run('isNpcWalkableTile = (x, y) => x !== 4 || y < -1 || y > 7');
    assert.equal(run('findNpcPath(3, 3, 6, 3, first)'), null);
});

test('neighbors pause to chat, face each other, and release after the conversation', () => {
    const run = createNpcs();
    assert.equal(run('startNpcConversation(scene, first, second, 100)'), true);
    assert.equal(run('first.state'), 'social');
    assert.equal(run('second.state'), 'social');
    assert.equal(run('first.direction'), 'right');
    assert.equal(run('second.direction'), 'left');
    run('updateNpc(scene, first, 5200, 16); updateNpc(scene, second, 5200, 16)');
    assert.equal(run('first.state'), 'idle');
    assert.equal(run('second.state'), 'idle');
});

test('closing group dialogue releases both arrived and approaching companions', () => {
    const run = createNpcs();
    run("dialogueNpc = first; first.state = 'talk'; first.talking = true; second.joining = first.id; second.state = 'walk'; releaseDialogueNpc(scene)");
    assert.equal(run('first.talking'), false);
    assert.equal(run('second.state'), 'idle');
    assert.equal(run('second.joining'), null);
    run("dialogueNpc = first; second.joinedConversation = first.id; second.talking = true; second.state = 'talk'; releaseDialogueNpc(scene)");
    assert.equal(run('second.talking'), false);
    assert.equal(run('second.joinedConversation'), null);
});

test('an arriving companion waits for typed dialogue before speaking once', () => {
    const run = createNpcs();
    run("dialogueNpc = first; dialogueOpen = true; dialogueNodes = { companion: {} }; dialogueTypingEvent = {}; let spoken = 0; showGuideDialogueNode = () => spoken++; second.joining = first.id; startNpcPath(second, [], 'join', 100); updateNpc(scene, second, 100, 16)");
    assert.equal(run('second.joinedConversation'), 1);
    run('updateNpc(scene, second, 116, 16)');
    assert.equal(run('spoken'), 0);
    run('dialogueTypingEvent = null; updateNpc(scene, second, 132, 16); updateNpc(scene, second, 148, 16)');
    assert.equal(run('spoken'), 1);
});

test('bark curves preserve white highlights and give pink trees darker muted wood', () => {
    const run = createNpcs();
    const white = Array.from(run('mapTrunkTone(new Uint8Array([142, 115, 82]), 0, TREE_TRUNK_CURVES[1], 1)'));
    const pink = Array.from(run('mapTrunkTone(new Uint8Array([142, 115, 82]), 0, TREE_TRUNK_CURVES[3], 1)'));
    assert.ok(Math.min(...white) >= 225);
    assert.ok(Math.max(...pink) < 142);
    assert.ok(Math.max(...pink) - Math.min(...pink) < 40);
});

test('returning to spawn dithers out before panning and dithers back in afterward', () => {
    const run = createNpcs();
    run(`
        character = { x: 320, y: 64, setPosition(x, y) { this.x = x; this.y = y; return this; } };
        mainCamera = { scrollX: 160, scrollY: 0, width: 320, height: 192, setScroll(x, y) { this.scrollX = x; this.scrollY = y; } };
        const levels = []; ditherInCharacter = (scene, level) => levels.push(level);
        updateCharacterShadow = updateLoadedChunks = buildPendingChunk = updateChunkVisibility = updateTreeShadows = updateActorShading = updateActorBlinks = updateParticles = updateNpcs = updateFish = updateSky = updateChunkWater = drawFishingMinigame = stopCharacterForMenu = () => {};
        canCharacterOccupy = () => true; fishingLine = fishingWaterShadow = { clear() {} };
        returnToSpawn(scene);
    `);
    assert.equal(run('character.x'), 320);
    assert.equal(run('mainCamera.scrollX'), 160);
    run('updateSpawnReturn(scene, 350, 16)');
    assert.equal(run('character.x'), 0);
    assert.equal(run('levels.at(-1)'), 0);
    assert.equal(run('mainCamera.scrollX'), 160);
    run('updateSpawnReturn(scene, 800, 16)');
    assert.equal(run('mainCamera.scrollX'), 4);
    assert.ok(run('Number.isInteger(mainCamera.scrollY)'));
    run('updateSpawnReturn(scene, 1250, 16)');
    assert.equal(run('spawnReturn.phase'), 'in');
    run('updateSpawnReturn(scene, 1500, 16)');
    assert.equal(run('levels.at(-1)'), 16);
    assert.equal(run('spawnReturn'), null);
});
