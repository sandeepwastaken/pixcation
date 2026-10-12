const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('opening player conversations records a lasting conversation count', () => {
    const {context, run} = createStats();
    run(fs.readFileSync('src/ui/interactions.js', 'utf8'));
    run('stopCharacterForMenu = showSlidingPanel = showGuideDialogueNode = () => {}; setUITextContent = () => {}; beginDialogue({}, {}, null, "Guide", null); beginDialogue({}, {}, null, "Visitor", {id: 1});');
    assert.equal(run('playerStats.conversations'), 2);
    assert.equal(run('saveDirty'), true);
});

test('expanded stats scroll through all rows and clamp at either end', () => {
    const {context, run} = createStats();
    context.setUITextContent = (element, value) => {element.textContent = String(value);};
    run('statsValueTexts.push(...Array.from({length: 9}, () => ({}))); statsLabelTexts.push(...Array.from({length: 9}, () => ({}))); peopleMet.add(1); peopleMet.add(2); guideHasMetPlayer = true; playerStats.conversations = 5; playerStats.distanceWalked = 160; playerStats.casts = 4; playerStats.fishCaught = 3; refreshStatsUI(); scrollStats(999);');
    assert.equal(run('statsScroll'), 9);
    assert.equal(run('statsLabelTexts[0].textContent'), 'People met');
    assert.equal(run('statsValueTexts[0].textContent'), '3');
    assert.equal(run('statsValueTexts[1].textContent'), '5');
    assert.equal(run('statsValueTexts[3].textContent'), '10 tiles');
    assert.equal(run('statsValueTexts[8].textContent'), '75%');
    run('scrollStats(-999)');
    assert.equal(run('statsScroll'), 0);
    assert.equal(run('statsLabelTexts[0].textContent'), 'Fish caught');
    assert.equal(run('statsValueTexts[0].textContent'), '3');
});

test('only actual catches increment large and giant catch counters', () => {
    const {context, run} = createStats();
    context.addCaughtFish(run('FISH_SPECIES.find(species => species.size === "large")'));
    context.addCaughtFish(run('FISH_SPECIES.find(species => species.size === "giant")'));
    context.addCaughtFish(run('FISH_SPECIES.find(species => species.size === "giant")'), false);
    assert.equal(run('playerStats.largeCaught'), 1);
    assert.equal(run('playerStats.giantCaught'), 1);
});

test('stats header arrow hitboxes match the pixel-grid positions', () => {
    const {context} = createStats();
    assert.equal(context.getStatsScrollAt(254, 38), -1);
    assert.equal(context.getStatsScrollAt(274, 38), 1);
    assert.equal(context.getStatsScrollAt(254, 75), 0);
});

function createStats() {
    const context = vm.createContext({ TEST_MODE: false });
    const source = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'runtime/progress.js', 'ui/stats.js', 'ui/market-controls.js', 'fishing/minigame.js'].map(file => fs.readFileSync(`src/${file}`, 'utf8')).join('\n');
    vm.runInContext(source, context);
    return { context, run: source => vm.runInContext(source, context) };
}

test('lifetime catches survive selling inventory and treasure fish do not count as catches', () => {
    const { context, run } = createStats();
    const species = run('FISH_SPECIES[0]');
    context.addCaughtFish(species);
    context.addCaughtFish(species, false);
    assert.equal(run('playerStats.fishCaught'), 1);
    assert.equal(run('fishInventory.get(FISH_SPECIES[0].id)'), 2);
    run("recordPlayerStat('moneyEarned', 50); recordPlayerStat('fishSold', 2); fishInventory.clear()");
    assert.equal(run('playerStats.fishCaught'), 1);
    assert.equal(run('playerStats.moneyEarned'), 50);
    assert.equal(run('playerStats.fishSold'), 2);
    assert.equal(run('saveDirty'), true);
});

test('catching fish cannot overflow its saved inventory count', () => { const { context, run } = createStats(); run("fishInventory.set(FISH_SPECIES[0].id, Number.MAX_SAFE_INTEGER)"); context.addCaughtFish(run('FISH_SPECIES[0]')); assert.equal(run('fishInventory.get(FISH_SPECIES[0].id)'), Number.MAX_SAFE_INTEGER); });
test('stats migration keeps known fish and rejects invalid or unsafe amounts', () => {
    const { context, run } = createStats();
    run("fishInventory.set('bluegill', 3)");
    context.restoreSavedStats({ playTimeMs: 3600000, casts: -2, moneyEarned: Infinity, moneySpent: 1.5, fishSold: Number.MAX_SAFE_INTEGER + 1 });
    assert.deepEqual(JSON.parse(run('JSON.stringify(playerStats)')), { fishCaught: 3, playTimeMs: 3600000, moneyEarned: 0, fishSold: 0, casts: 0, moneySpent: 0, conversations: 0, npcTrades: 0, distanceWalked: 0, largeCaught: 0, giantCaught: 0 });
    context.recordPlayerStat('casts', Number.MAX_SAFE_INTEGER);
    context.recordPlayerStat('casts');
    assert.equal(run('playerStats.casts'), Number.MAX_SAFE_INTEGER);
    assert.equal(context.formatPlayTime(3720000), '1h 02m 00s');
});

test('fish sale summaries stay within safe integer limits', () => { const { run } = createStats(); run("fishInventory.set('bluegill', Number.MAX_SAFE_INTEGER); fishInventory.set('roach', Number.MAX_SAFE_INTEGER)"); assert.deepEqual(JSON.parse(run('JSON.stringify(getFishInventorySummary())')), { count: Number.MAX_SAFE_INTEGER, value: Number.MAX_SAFE_INTEGER }); });
test('fish sales cannot overflow the coin balance', () => { const { context, run } = createStats(); context.animateCoinTotal = () => {}; context.refreshMarketOptions = () => {}; context.sparkleOverPlayer = () => {}; run("playerCoins = Number.MAX_SAFE_INTEGER; fishInventory.set('bluegill', 1); selectedMarketOption = MARKET_SELL_INDEX; buySelectedMarketItem({})"); assert.equal(run('playerCoins'), Number.MAX_SAFE_INTEGER); });
test('play time includes slow frames and excludes hidden or unfocused time', () => {
    const { context, run } = createStats();
    let focused = true;
    context.document = { visibilityState: 'visible', hasFocus: () => focused };
    context.updatePlayTime(1000);
    context.updatePlayTime(4500);
    assert.equal(run('playerStats.playTimeMs'), 3500);
    focused = false;
    context.updatePlayTime(5000);
    context.updatePlayTime(7000);
    assert.equal(run('playerStats.playTimeMs'), 3500);
    run('lastPlayTime = null');
    focused = true;
    context.updatePlayTime(9000);
    context.updatePlayTime(9250);
    assert.equal(run('playerStats.playTimeMs'), 3750);
    context.document.visibilityState = 'hidden';
    context.updatePlayTime(12000);
    assert.equal(run('playerStats.playTimeMs'), 3750);
});

test('play time labels reuse a displayed second and refresh across boundaries and resets', () => {
    const { context } = createStats();
    let floorCalls = 0;
    const math = Object.create(Math);
    math.floor = value => { floorCalls++; return Math.floor(value); };
    context.Math = math;
    assert.equal(context.formatPlayTime(0), '0h 00m 00s');
    assert.equal(floorCalls, 3);
    assert.equal(context.formatPlayTime(999), '0h 00m 00s');
    assert.equal(floorCalls, 4);
    assert.equal(context.formatPlayTime(1000), '0h 00m 01s');
    assert.equal(floorCalls, 7);
    assert.equal(context.formatPlayTime(59999), '0h 00m 59s');
    assert.equal(context.formatPlayTime(60000), '0h 01m 00s');
    assert.equal(context.formatPlayTime(3599999), '0h 59m 59s');
    assert.equal(context.formatPlayTime(3600000), '1h 00m 00s');
    assert.equal(context.formatPlayTime(86400123), '24h 00m 00s');
    assert.equal(context.formatPlayTime(0), '0h 00m 00s');
});

test('stats refresh only changed rows and populate replacement text elements', () => {
    const { context, run } = createStats();
    const updates = [];
    context.setUITextContent = (element, value) => { updates.push([element.index, String(value)]); element.textContent = String(value); };
    run('statsValueTexts.push(...Array.from({ length: 9 }, (_, index) => ({ index })))');
    context.refreshStatsUI();
    assert.equal(updates.splice(0).length, 9);
    run('playerStats.playTimeMs = 999; refreshStatsUI()');
    assert.deepEqual(updates, []);
    run('playerStats.playTimeMs = 1000; refreshStatsUI()');
    assert.deepEqual(updates.splice(0), [[2, '0h 00m 01s']]);
    run("recordPlayerStat('moneyEarned', 50); catchLog.add('bluegill'); openedChests.add(1); discoveredChunks.add(1); refreshStatsUI()");
    assert.deepEqual(updates.splice(0), [[1, `1/${run('FISH_SPECIES.length')}`], [3, '50c'], [7, '1'], [8, '1']]);
    run('statsValueTexts[0] = { index: 0 }; refreshStatsUI()');
    assert.deepEqual(updates.splice(0), [[0, '0']]);
    run("recordPlayerStat('fishCaught', 2); recordPlayerStat('fishSold', 3); recordPlayerStat('casts', 4); recordPlayerStat('moneySpent', 10); refreshStatsUI()");
    assert.deepEqual(updates.splice(0), [[0, '2'], [4, '3'], [5, '4'], [6, '10c']]);
    run('playerStats.playTimeMs = 0; refreshStatsUI()');
    assert.deepEqual(updates.splice(0), [[2, '0h 00m 00s']]);
    run('statsValueTexts[1] = { index: 1 }; refreshStatsUI()');
    assert.deepEqual(updates.splice(0), [[1, `1/${run('FISH_SPECIES.length')}`]]);
});
