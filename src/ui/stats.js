const playTimeFormatCache = { seconds: null, label: '' };
const statsValueCache = new WeakMap();
const statsValues = new Array(9);

function createStatsUI(scene) {
    statsButton = scene.add.image(264, 8, 'ui-button').setDisplaySize(48, 16).setOrigin(0).setScrollFactor(0).setDepth(210);
    const buttonText = createTextLayer(16, { width: '48px', fontSize: '11px', lineHeight: '11px' });
    createUIText(buttonText, 0, 2, '#e0f2fd', 48, 'center', { textShadow: '1px 1px #230a03' }).textContent = 'Stats';
    statsButtonTextLayer = addHudLayer(scene, buttonText, 8, 211).setX(264).setVisible(true);
    statsContainer = scene.add.image(32, 24, 'stats-panel').setOrigin(0).setScrollFactor(0).setDepth(220).setVisible(false);
    const text = createTextLayer(144, { color: '#000000', fontSize: '11px', lineHeight: '11px' });
    createUIText(text, 44, 10, '#000000', 232, 'center', { fontSize: '16px' }).textContent = 'Your stats';
    const labels = ['Fish caught', 'Species discovered', 'Time playing', 'Total money earned', 'Fish sold', 'Casts made', 'Total money spent', 'Chests opened', 'Areas explored'];
    for (let index = 0; index < labels.length; index++) {
        createUIText(text, 44, 30 + index * 11, '#000000', 156).textContent = labels[index];
        statsValueTexts.push(createUIText(text, 200, 30 + index * 11, '#000000', 76, 'right'));
    }
    createUIText(text, 44, 129, '#000000', 232, 'center', { fontSize: '9px' }).textContent = 'Tab / Esc / Click outside to close';
    statsTextLayer = addHudLayer(scene, text, 24, 221);
    refreshStatsUI();
}

function formatPlayTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    if (playTimeFormatCache.seconds === seconds) return playTimeFormatCache.label;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    playTimeFormatCache.seconds = seconds;
    return playTimeFormatCache.label = `${hours}h ${String(minutes % 60).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function formatStatsValue(index, value) {
    if (index === 1) return `${value}/${FISH_SPECIES.length}`;
    if (index === 2) return formatPlayTime(value * 1000);
    return index === 3 || index === 6 ? `${value}c` : value;
}
function refreshStatsUI() {
    const values = statsValues;
    values[0] = playerStats.fishCaught;
    values[1] = catchLog.size;
    values[2] = Math.floor(playerStats.playTimeMs / 1000);
    values[3] = playerStats.moneyEarned;
    values[4] = playerStats.fishSold;
    values[5] = playerStats.casts;
    values[6] = playerStats.moneySpent;
    values[7] = openedChests.size;
    values[8] = discoveredChunks.size;
    for (let index = 0; index < statsValueTexts.length; index++) {
        const element = statsValueTexts[index];
        if (statsValueCache.get(element) === values[index]) continue;
        setUITextContent(element, formatStatsValue(index, values[index]));
        statsValueCache.set(element, values[index]);
    }
}

function updateStatsUI() {
    const visible = !isMenuOpen() || statsOpen;
    if (statsButton.visible !== visible) statsButton.setVisible(visible);
    if (statsButtonTextLayer.visible !== visible) statsButtonTextLayer.setVisible(visible);
    if (statsOpen) refreshStatsUI();
}

function isStatsButtonAt(x, y) {
    return x >= 264 && x < 312 && y >= 8 && y < 24;
}

function openStats() {
    if (isMenuOpen() || startup) return;
    statsOpen = true;
    stopCharacterForMenu();
    refreshStatsUI();
    statsContainer.setVisible(true);
    statsTextLayer.setVisible(true);
}

function closeStats() {
    statsOpen = false;
    statsContainer.setVisible(false);
    statsTextLayer.setVisible(false);
}
