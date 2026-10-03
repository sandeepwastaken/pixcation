const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createSession() {
    const context = vm.createContext({});
    const source = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'fishing/rod.js', 'fishing/bobber.js', 'fishing/update.js', 'ui/hotbar.js', 'ui/fishing.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        const water = new Uint8Array(TILE_SIZE * TILE_SIZE);
        water[0] = water[water.length - 1] = 1;
        let tileReads = 0;
        let tileCoordinates;
        let surfaceTile;
        function getWorldTile(x, y) { tileReads++; tileCoordinates = [x, y]; return { key: 'water' }; }
        function getTerrainSurface(scene, tile) { surfaceTile = tile; return { water }; }
    `, context);
    return code => vm.runInContext(code, context);
}

test('water checks handle negative coordinates and reuse a supplied tile', () => {
    const run = createSession();
    assert.equal(run('isWaterPixel({}, -1, -17)'), true);
    assert.deepEqual(JSON.parse(run('JSON.stringify(tileCoordinates)')), [-1, -2]);
    assert.equal(run('isWaterPixel({}, 0, 0)'), true);
    assert.equal(run('isWaterPixel({}, 1, 0)'), false);
    const before = run('tileReads');
    run("const supplied = { key: 'bridge' }");
    assert.equal(run('isWaterPixel({}, -1, -17, supplied)'), true);
    assert.equal(run('surfaceTile === supplied'), true);
    assert.equal(run('tileReads'), before);
});

test('rod selection recognizes only available rods', () => {
    const run = createSession();
    assert.equal(run('hasRodSelected()'), false);
    assert.equal(run('MARKET_RODS.every(rod => { hotbarItemNames[0] = rod.label; return hasRodSelected() && getSelectedRod() === rod; })'), true);
    assert.equal(run("hotbarItemNames[0] = 'Unknown Rod'; hasRodSelected()"), false);
});

test('using the last bait equips another owned bait and ignores missing bait', () => {
    const run = createSession();
    run("baitInventory.set('novice', 1); baitInventory.set('trainer', 2); activeBaitId = 'novice'; useBait(MARKET_BAITS[0])");
    assert.equal(run("baitInventory.has('novice')"), false);
    assert.equal(run('activeBaitId'), 'trainer');
    run('useBait(MARKET_BAITS[1])');
    assert.equal(run("baitInventory.get('trainer')"), 1);
    run('useBait(MARKET_BAITS[1]); useBait(MARKET_BAITS[1]); useBait(null)');
    assert.equal(run('baitInventory.size'), 0);
    assert.equal(run('activeBaitId'), null);
});


test('bobbers keep the nearest reachable fish and skip distant chunks', () => {
    const run = createSession();
    run(`
        fishing = { bobberX: 0, bobberY: 0 };
        const nearby = { pixelX: 0, pixelY: 0, fish: [] };
        const farther = { x: 20, y: 0, heading: Math.PI, state: 'idle' };
        const nearest = { x: 10, y: 0, heading: Math.PI, state: 'idle' };
        const fleeing = { x: 8, y: 0, heading: Math.PI, state: 'flee' };
        const distant = { pixelX: CHUNK_PIXEL_SIZE * 4, pixelY: 0, fish: [] };
        distant.fish.push({ x: distant.pixelX + 10, y: 0, heading: Math.PI, state: 'idle' });
        nearby.fish.push(farther, nearest, fleeing);
        loadedWaterChunks.add(distant);
        loadedWaterChunks.add(nearby);
        const pathChecks = [];
        function isFishPathClear(chunk, fish) { pathChecks.push(fish); return true; }
        const match = findFishForBobber();
    `);
    assert.equal(run('match.fish === nearest && match.chunk === nearby'), true);
    assert.equal(run('pathChecks.includes(distant.fish[0])'), false);
    assert.equal(run('pathChecks.includes(fleeing)'), false);
    run('nearby.fish.length = 0');
    assert.equal(run('findFishForBobber()'), null);
});

test('bobbers find fish across negative chunk borders and with bait range', () => {
    const run = createSession();
    run(`
        fishing = { bobberX: 0, bobberY: 0 };
        const west = { pixelX: -CHUNK_PIXEL_SIZE, pixelY: -CHUNK_PIXEL_SIZE, fish: [{ x: -10, y: -1, heading: 0, state: 'idle' }] };
        const east = { pixelX: CHUNK_PIXEL_SIZE, pixelY: 0, fish: [{ x: CHUNK_PIXEL_SIZE + 5, y: 0, heading: Math.PI, state: 'idle' }] };
        function isFishPathClear() { return true; }
        loadedWaterChunks.add(west);
        loadedWaterChunks.add(east);
    `);
    assert.equal(run('findFishForBobber().chunk === west'), true);
    run('loadedWaterChunks.delete(west)');
    assert.equal(run('findFishForBobber()'), null);
    run('fishing.bait = { lure: 10 }');
    assert.equal(run('findFishForBobber().chunk === east'), true);
});


test('fish approach switches to inspection at the reach boundary', () => {
    const run = createSession();
    run(`
        const scene = {};
        const fish = { x: 6, y: 0, radius: 2, state: 'lure', velocity: 5 };
        fishing = { state: 'approaching', start: 100, toX: 0, toY: 0, driftPhase: 0, targetFish: fish };
        updateWaterFishing(scene, 100, 16);
    `);
    assert.equal(run('fishing.state'), 'inspecting');
    assert.equal(run('fish.velocity'), 0);
    run("fish.x = 6.1; fish.velocity = 5; fishing.state = 'approaching'; updateWaterFishing(scene, 100, 16)");
    assert.equal(run('fishing.state'), 'approaching');
    assert.equal(run('fish.velocity'), 5);
    run("fishing.targetFish = null; updateWaterFishing(scene, 100, 16)");
    assert.equal(run('fishing.state'), 'floating');
});


test('minigame sprites skip unchanged pixels and refresh changed dimensions and visibility', () => {
    const run = createSession();
    run(`
        function image() {
            return {
                crops: [], positions: [], sizes: [],
                setOrigin() { return this; }, setDepth() { return this; }, setScrollFactor() { return this; },
                setVisible(value) { this.visible = value; return this; },
                setDisplaySize(width, height) { this.sizes.push([width, height]); this.displayWidth = width; this.displayHeight = height; return this; },
                setPosition(x, y) { this.positions.push([x, y]); this.x = x; this.y = y; return this; },
                setCrop(...crop) { this.crops.push(crop); return this; }
            };
        }
        const scene = { textures: { get() { return { add() {} }; } }, add: { image } };
        createFishingUI(scene);
        fishing = { state: 'minigame', game: { zoneY: 10, zoneHeight: 24, fishY: 16, progress: 0.25 } };
        drawFishingMinigame();
        const firstHeight = fishingProgressFill.crops[0][3];
        drawFishingMinigame();
    `);
    assert.equal(run('fishingProgressFill.crops.length'), 1);
    assert.equal(run('fishingProgressFill.positions.length'), 1);
    assert.equal(run('fishingCatchZoneTop.positions.length'), 1);
    assert.equal(run('fishingCatchZoneMiddle.positions.length'), 1);
    assert.equal(run('fishingCatchZoneBottom.positions.length'), 1);
    assert.equal(run('fishingFishMarker.positions.length'), 1);
    assert.equal(run('fishingCatchZoneMiddle.sizes.length'), 1);
    run('fishing.game.zoneY = 10.1; fishing.game.fishY = 16.1; drawFishingMinigame()');
    assert.equal(run('fishingCatchZoneTop.positions.length'), 1);
    assert.equal(run('fishingFishMarker.positions.length'), 1);
    run('fishing.game.zoneY = 11; fishing.game.fishY = 17; fishing.game.zoneHeight = 29; drawFishingMinigame()');
    assert.equal(run('fishingCatchZoneTop.positions.length'), 2);
    assert.equal(run('fishingFishMarker.positions.length'), 2);
    assert.deepEqual(JSON.parse(run('JSON.stringify(fishingCatchZoneMiddle.sizes)')), [[8, 18], [8, 23]]);
    assert.equal(run('fishingCatchZoneBottom.y - fishingCatchZoneTop.y'), 26);
    assert.equal(run('fishingUiParts.every(part => part.visible)'), true);
    run('fishing.game.progress = 0.75; drawFishingMinigame()');
    assert.equal(run('fishingProgressFill.crops.length'), 2);
    assert.equal(run('fishingProgressFill.crops[1][3] > firstHeight'), true);
    run("fishing.state = 'reeling'; drawFishingMinigame()");
    assert.equal(run('fishingUiParts.some(part => part.visible)'), false);
    run("fishing.state = 'minigame'; drawFishingMinigame()");
    assert.equal(run('fishingProgressFill.crops.length'), 3);
    assert.equal(run('fishingUiParts.every(part => part.visible)'), true);
});
