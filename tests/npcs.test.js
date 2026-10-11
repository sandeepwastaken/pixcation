const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createNpcs() {
    const context = vm.createContext({ TEST_MODE: true, getTileId: (x, y) => (x + 1000) * 10000 + y, coordinateHash: () => 0.7, cacheWorldValue: (cache, key, value) => (cache.set(key, value), value), getPersonTexture: () => 'portrait' });
    const files = ['runtime/settings.js', 'runtime/state.js', 'environment/npcs.js', 'runtime/character.js', 'art/trees.js'];
    vm.runInContext(files.map(file => fs.readFileSync('src/' + file, 'utf8')).join('\n'), context);
    vm.runInContext(`
        const homes = [{ id: 1, tileX: 3, tileY: 3, name: 'Ada Reed' }, { id: 2, tileX: 13, tileY: 3, name: 'Eli Moss' }];
        findCellNpc = (x, y) => y === 0 && x < 2 && x >= 0 ? homes[x] : null;
        isNpcWalkableTile = () => true;
        drawNpcRod = drawNpcShadow = () => {};
        mainCamera = { scrollX: 0, scrollY: 0, width: 320, height: 192 };
        character = { x: 48, y: 48 };
        const scene = { time: { now: 100 } };
        const actor = home => ({ ...home, look: [], x: 48, y: 48, state: 'idle', direction: 'front', frame: 0, rng: 1, speed: 0.5, path: [], until: 1000, sprite: { setTexture() { return this; }, setPosition() { return this; }, setDepth() { return this; } } });
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
