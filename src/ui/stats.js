const playTimeFormatCache = { seconds: null, label: '' };
const statsValueCache = new WeakMap();
const STATS_LABELS = ['Fish caught', 'Species discovered', 'Time playing', 'Total money earned', 'Fish sold', 'Casts made', 'Total money spent', 'Chests opened', 'Areas explored', 'People met', 'Conversations', 'NPC trades', 'Distance walked', 'Large fish caught', 'Giant fish caught', 'Rods owned', 'Bait types held', 'Catch rate'];
const statsValues = new Array(STATS_LABELS.length);

function createSlicedTexture(scene, key, width, height) {
    const source = getTextureSource(scene, 'ui-button');
    createCanvasTexture(scene, key, width, height, context => {
        for (const [sx, sw, dx, dw] of [[0, 16, 0, 16], [40, 16, 16, width - 32], [80, 16, width - 16, 16]]) {
            for (const [sy, sh, dy, dh] of [[0, 6, 0, 6], [8, 4, 6, height - 12], [14, 6, height - 6, 6]]) {
                for (let y = 0; y < dh; y += sh) for (let x = 0; x < dw; x += sw) {
                    const tileWidth = Math.min(sw, dw - x);
                    const tileHeight = Math.min(sh, dh - y);
                    context.drawImage(source, sx, sy, tileWidth, tileHeight, dx + x, dy + y, tileWidth, tileHeight);
                }
            }
        }
    });
}

function createStatsUI(scene) {
    createSlicedTexture(scene, 'ui-stats-button', 48, 16);
    createSlicedTexture(scene, 'ui-stats-panel', 256, 144);
    statsButton = scene.add.image(264, 8, 'ui-stats-button').setOrigin(0).setScrollFactor(0).setDepth(210);
    const buttonText = createTextLayer(16, { width: '48px', fontSize: '11px', lineHeight: '11px' });
    createUIText(buttonText, 0, 2, '#d4d7dd', 48, 'center', { textShadow: UI_TEXT_SHADOW }).textContent = 'Stats';
    statsButtonTextLayer = addHudLayer(scene, buttonText, 8, 211).setX(264).setVisible(true);
    statsContainer = scene.add.image(32, 24, 'ui-stats-panel').setOrigin(0).setScrollFactor(0).setDepth(220).setVisible(false);
    const text = createTextLayer(144, { color: '#a8afbd', fontSize: '11px', lineHeight: '11px', textShadow: UI_TEXT_SHADOW });
    createUIText(text, 44, 10, '#e2e4e9', 232, 'center', { fontSize: '16px', textShadow: UI_TEXT_SHADOW }).textContent = 'Your stats';
    for (let index = 0; index < 2; index++) { const arrow = createUIText(text, 250 + index * 18, 10, '#acccf9', 16, 'center'); arrow.textContent = index ? 'v' : '^'; statsArrowTexts.push(arrow); }
    const labels = STATS_LABELS;
    for (let index = 0; index < 9; index++) {
        statsLabelTexts.push(createUIText(text, 44, 30 + index * 11, '#a8afbd', 156, 'left', { textShadow: UI_TEXT_SHADOW }));
        statsValueTexts.push(createUIText(text, 200, 30 + index * 11, '#d4d7dd', 76, 'right', { textShadow: UI_TEXT_SHADOW }));
    }
    statsScrollText = createUIText(text, 44, 129, '#a8afbd', 232, 'center', { fontSize: '9px', textShadow: UI_TEXT_SHADOW });
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
    if (index === 2) return formatPlayTime(value * 1000); if (index === 12) return `${Math.floor(value / TILE_SIZE)} tiles`; if (index === 17) return `${value}%`;
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
    values[9] = peopleMet.size + Number(guideHasMetPlayer); values[10] = playerStats.conversations; values[11] = playerStats.npcTrades;
    values[12] = playerStats.distanceWalked; values[13] = playerStats.largeCaught; values[14] = playerStats.giantCaught;
    values[15] = ownedRods.size; values[16] = baitInventory.size; values[17] = playerStats.casts ? Math.min(100, Math.round(playerStats.fishCaught / playerStats.casts * 1000) / 10) : 0;
    if (statsScrollText) setUITextContent(statsScrollText, `${statsScroll + 1}-${statsScroll + 9} / ${STATS_LABELS.length} · Scroll / Up / Down · Esc to close`);
    for (let index = 0; index < statsArrowTexts.length; index++) statsArrowTexts[index].style.color = (index ? statsScroll < STATS_LABELS.length - 9 : statsScroll > 0) ? '#acccf9' : '#6f5b49';
    for (let index = 0; index < statsValueTexts.length; index++) {
        const sourceIndex = statsScroll + index, element = statsValueTexts[index], value = values[sourceIndex], cacheKey = `${sourceIndex}:${value}`;
        if (statsLabelTexts[index]) setUITextContent(statsLabelTexts[index], STATS_LABELS[sourceIndex]); if (statsValueCache.get(element) === cacheKey) continue;
        setUITextContent(element, formatStatsValue(sourceIndex, value));
        statsValueCache.set(element, cacheKey);
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

function scrollStats(step) {
    const next = Math.max(0, Math.min(STATS_LABELS.length - 9, statsScroll + step));
    if (next === statsScroll) return;
    statsScroll = next; refreshStatsUI();
}

function getStatsScrollAt(x, y) {
    return y >= 32 && y < 50 && x >= 248 && x < 284 ? (x < 266 ? -1 : 1) : 0;
}
