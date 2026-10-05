const playTimeFormatCache = { seconds: null, label: '' };
const statsValueCache = new WeakMap();
const statsValues = new Array(9);

function createSlicedTexture(scene, key, width, height) {
    const source = getTextureSource(scene, 'ui-button');
    createCanvasTexture(scene, key, width, height, context => {
        for (const [sx, sw, dx, dw] of [[0, 16, 0, 16], [40, 16, 16, width - 32], [80, 16, width - 16, 16]]) {
            for (const [sy, sh, dy, dh] of [[0, 6, 0, 6], [8, 4, 6, height - 12], [14, 6, height - 6, 6]]) {
                for (let y = 0; y < dh; y += sh) for (let x = 0; x < dw; x += sw) context.drawImage(source, sx, sy, Math.min(sw, dw - x), Math.min(sh, dh - y), dx + x, dy + y, Math.min(sw, dw - x), Math.min(sh, dh - y));
            }
        }
    });
}

function createStatsUI(scene) {
    createSlicedTexture(scene, 'ui-stats-button', 48, 16);
    createSlicedTexture(scene, 'ui-stats-panel', 256, 144);
    statsButton = scene.add.image(264, 8, 'ui-stats-button').setOrigin(0).setScrollFactor(0).setDepth(210);
    const buttonText = createTextLayer(16, { width: '48px', fontSize: '11px', lineHeight: '11px' });
    createUIText(buttonText, 0, 2, '#d4d7dd', 48, 'center', { textShadow: '1px 1px #4a5059' }).textContent = 'Stats';
    statsButtonTextLayer = addHudLayer(scene, buttonText, 8, 211).setX(264).setVisible(true);
    statsContainer = scene.add.image(32, 24, 'ui-stats-panel').setOrigin(0).setScrollFactor(0).setDepth(220).setVisible(false);
    const text = createTextLayer(144, { color: '#a8afbd', fontSize: '11px', lineHeight: '11px', textShadow: '1px 1px #4a5059' });
    createUIText(text, 44, 10, '#e2e4e9', 232, 'center', { fontSize: '16px', textShadow: '1px 1px #4a5059' }).textContent = 'Your stats';
    const labels = ['Fish caught', 'Species discovered', 'Time playing', 'Total money earned', 'Fish sold', 'Casts made', 'Total money spent', 'Chests opened', 'Areas explored'];
    for (let index = 0; index < labels.length; index++) {
        createUIText(text, 44, 30 + index * 11, '#a8afbd', 156, 'left', { textShadow: '1px 1px #4a5059' }).textContent = labels[index];
        statsValueTexts.push(createUIText(text, 200, 30 + index * 11, '#d4d7dd', 76, 'right', { textShadow: '1px 1px #4a5059' }));
    }
    createUIText(text, 44, 129, '#a8afbd', 232, 'center', { fontSize: '9px', textShadow: '1px 1px #4a5059' }).textContent = 'Tab / Esc / Click outside to close';
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
        const element = statsValueTexts[index], value = values[index];
        if (statsValueCache.get(element) === value) continue;
        setUITextContent(element, formatStatsValue(index, value));
        statsValueCache.set(element, value);
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
