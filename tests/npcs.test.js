const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('walkers brake for corners and arrival without slowing at straight tile boundaries', () => {
    const run = createNpcs();
    run("startNpcPath(first, [[4, 3], [5, 3]], 'wander', 100); first.x = 63; first.travelDirection = 'right'; first.turnUntil = 0; first.walkPhase = 1; first.walkSpeed = 0.5; canNpcOccupy = () => true; stepNpc(scene, first, 116, 16)");
    assert.equal(run('first.walkSpeed'), 0.5);
    run('first.path = [[4, 3], [4, 4]]; first.x = 63; first.walkSpeed = 0.5; stepNpc(scene, first, 132, 16)');
    assert.ok(run('first.walkSpeed > 0 && first.walkSpeed < 0.5'));
    run('first.path = [[4, 3]]; first.x = 63; first.walkSpeed = 0.5; stepNpc(scene, first, 148, 16)');
    assert.ok(run('first.walkSpeed > 0 && first.walkSpeed < 0.5'));
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
    assert.equal(run('waitForNpcWalkPartner(scene, first, 1032)'), true);
    assert.equal(run('first.state'), 'idle');
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
    run("first.spot = { tileX: 5, tileY: 3, water: { direction: 'front' } }; first.failedSpots = new Set(); tryNpcSocialPlan = () => false; npcRandom = () => 0; findNpcWater = () => ({ direction: 'front' }); isNpcStandingTile = () => true; chooseNpcPlan(scene, first, 100)");
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
    assert.equal(run('first.playerVisits'), 2);
    assert.ok(run('encounters[0] !== encounters[1]'));
    assert.ok(run('NPC_PERSONALITIES[4].familiar.includes(encounters[1])'));
    run("first.talking = false; first.state = second.state = 'idle'; startNpcConversation(scene, first, second, 100)");
    assert.ok(run('buildNpcDialogue(scene, first).chat.text.includes("Eli")'));
    run("first.lastActivity = 'fishing'");
    assert.ok(run('buildNpcDialogue(scene, first).chat.text.includes("rod away")'));
    run("first.lastActivity = 'walk'");
    assert.ok(run('buildNpcDialogue(scene, first).chat.text.includes("walk around the neighborhood")'));
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
    const context = vm.createContext({ TEST_MODE: true, getTileId: (x, y) => (x + 1000) * 10000 + y, coordinateHash: () => 0.7, cacheWorldValue: (cache, key, value) => (cache.set(key, value), value), getPersonTexture: () => 'portrait' });
    const files = ['runtime/settings.js', 'runtime/state.js', 'npc-dialogue.js', 'environment/npcs.js', 'runtime/character.js', 'art/trees.js'];
    vm.runInContext(files.map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext(`
        const homes = [{ id: 1, tileX: 3, tileY: 3, name: 'Ada Reed' }, { id: 2, tileX: 13, tileY: 3, name: 'Eli Moss' }];
        findCellNpc = (x, y) => y === 0 && x < 2 && x >= 0 ? homes[x] : null;
        isNpcWalkableTile = () => true;
        getTerrainType = () => 'grass';
        getWorldClock = () => ({ hour: 12, day: 1 });
        drawNpcRod = drawNpcShadow = () => {};
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
    assert.equal(run('npcHouseTiles.size'), 2);
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
    run('first.house = { id: 1, x: 2, y: 1, doorX: 3, doorY: 3, residents: [1] }; first.x = 32; getWorldClock = () => ({ hour: 23, day: 4 }); updateNpcHome(scene, first, 100)');
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
    run('canNpcOccupy = () => true; updateNpcHome(scene, first, 216)');
    assert.equal(run('first.state'), 'idle');
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
        updateCharacterShadow = updateLoadedChunks = buildPendingChunk = updateChunkVisibility = updateTreeShadows = updateParticles = updateNpcs = updateFish = updateSky = updateChunkWater = drawFishingMinigame = stopCharacterForMenu = () => {};
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
