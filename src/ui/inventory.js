function createInventoryUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, INVENTORY_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, 19, 296, 1)
        .fillRect(12, 127, 296, 1)
        .fillRect(FISHPEDIA_DETAIL_X - 4, 23, 1, 101)
        .fillRect(FISHPEDIA_DETAIL_X + 28, 24, 36, 36)
        .fillStyle(0x230a03, 1)
        .fillRect(FISHPEDIA_DETAIL_X + 29, 25, 34, 34);

    inventoryHighlight = scene.add.graphics()
        .fillStyle(0x4a2216, 1)
        .fillRect(0, 0, FISHPEDIA_COLUMN_WIDTH - 2, FISHPEDIA_ROW_HEIGHT);
    inventoryDetailImage = scene.add.image(FISHPEDIA_DETAIL_X + 30, 26, 'fish/placeholder').setOrigin(0);

    const textLayer = createTextLayer(INVENTORY_HEIGHT, { color: '#c0a887' });
    const rowStyle = { fontSize: '9px', lineHeight: '8px' };
    const detailStyle = { fontSize: '8px', lineHeight: '8px' };

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'Fishpedia';
    inventorySummaryText = createUIText(textLayer, 145, 5, null, 161, 'right', { fontSize: '11px' });

    inventoryRowTexts = [];
    inventoryCountTexts = [];

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const x = FISHPEDIA_LIST_X + 2 + Math.floor(index / FISHPEDIA_ROWS) * FISHPEDIA_COLUMN_WIDTH;
        const y = FISHPEDIA_LIST_Y + (index % FISHPEDIA_ROWS) * FISHPEDIA_ROW_HEIGHT;
        inventoryRowTexts.push(createUIText(textLayer, x, y, null, 76, null, rowStyle));
        inventoryCountTexts.push(createUIText(textLayer, x + 76, y, null, 18, 'right', detailStyle));
    }

    const detail = createUIText(textLayer, FISHPEDIA_DETAIL_X, 63, null, FISHPEDIA_DETAIL_WIDTH, 'center', { whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '2px' });
    inventoryDetailTexts = ['#e0f2fd', '#acccf9', '#e8c170', '#8fbf7a'].map((color, index) => {
        const line = document.createElement('div');
        Object.assign(line.style, { color }, index && { fontSize: '11px', lineHeight: '9px' });
        detail.appendChild(line);
        return line;
    });

    inventoryNewGameText = createUIText(textLayer, 12, 128, '#8c7358', 296, 'center', { fontSize: '11px' });
    inventoryFooterHints = appendKeyHints(document.createElement('span'), [['I/Esc', 'Close'], ['N', 'New Game']]);

    inventoryContainer = addPanelContainer(scene, INVENTORY_HIDDEN_Y, 203, [panel, inventoryHighlight, inventoryDetailImage]);
    inventoryTextLayer = addHudLayer(scene, textLayer, INVENTORY_HIDDEN_Y, 204);
    refreshInventoryUI(scene.time.now);
}

function refreshInventoryUI(time) {
    if (!inventorySummaryText) return;

    const summary = getFishInventorySummary();
    setUITextContent(inventorySummaryText, `${catchLog.size}/${FISH_SPECIES.length} caught · ${summary.count} fish · ${summary.value}c`);
    inventorySummaryText.style.color = summary.count ? '#e8c170' : '#8c7358';

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const species = FISH_SPECIES[index], caught = catchLog.has(species.id);
        const count = fishInventory.get(species.id) || 0, rowText = inventoryRowTexts[index], countText = inventoryCountTexts[index];

        setUITextContent(rowText, caught ? species.name : '???');
        rowText.style.color = caught ? '#e0f2fd' : '#6f5b49';
        setUITextContent(countText, caught ? `x${count}` : '-');
        countText.style.color = count ? '#8fbf7a' : caught ? '#8c7358' : '#6f5b49';
        if (index === selectedFishIndex) rowText.style.color = caught ? '#acccf9' : '#8c7358';
    }

    refreshFishpediaDetail();

    const confirming = time < newGameConfirmUntil;

    if (confirming) {
        setUITextContent(inventoryNewGameText, 'Press N again to erase all progress');
    } else if (inventoryNewGameText.firstChild !== inventoryFooterHints) {
        inventoryNewGameText.replaceChildren(inventoryFooterHints);
    }

    inventoryNewGameText.style.color = confirming ? '#d9745b' : '#8c7358';
}

function getFishpediaRowPosition(index) {
    return [FISHPEDIA_LIST_X + Math.floor(index / FISHPEDIA_ROWS) * FISHPEDIA_COLUMN_WIDTH, FISHPEDIA_LIST_Y + (index % FISHPEDIA_ROWS) * FISHPEDIA_ROW_HEIGHT];
}

function getFishpediaRowAt(x, y) {
    const column = Math.floor((x - FISHPEDIA_LIST_X) / FISHPEDIA_COLUMN_WIDTH);
    const row = Math.floor((y - DIALOGUE_VISIBLE_Y - FISHPEDIA_LIST_Y) / FISHPEDIA_ROW_HEIGHT);
    const index = column * FISHPEDIA_ROWS + row;
    return x >= FISHPEDIA_LIST_X && column < 2 && row >= 0 && row < FISHPEDIA_ROWS && index < FISHPEDIA_ROWS * 2 && index < FISH_SPECIES.length ? index : -1;
}

function refreshFishpediaDetail() {
    const species = FISH_SPECIES[selectedFishIndex], caught = catchLog.has(species.id);
    const [x, y] = getFishpediaRowPosition(selectedFishIndex);
    inventoryHighlight.setPosition(x, y);
    const key = getFishArtKey(inventoryDetailImage.scene, species);
    if (inventoryDetailImage.texture.key !== key) popIn(inventoryDetailImage.scene, inventoryDetailImage.setTexture(key), 26);
    if (caught) inventoryDetailImage.clearTint();
    else inventoryDetailImage.setTintFill(0x4a2216);
    const [name, size, price, count] = inventoryDetailTexts;
    setUITextContent(name, caught ? species.name : '???');
    setUITextContent(size, caught ? FISH_SIZE_CLASSES[species.size].label : 'Not caught yet');
    setUITextContent(price, caught ? `Value: ${species.price}c` : '');
    setUITextContent(count, caught ? `Holding ${fishInventory.get(species.id) || 0}` : '');
}

function selectFishpediaEntry(index) {
    selectedFishIndex = Phaser.Math.Wrap(index, 0, FISH_SPECIES.length);
    refreshInventoryUI(inventoryDetailImage.scene.time.now);
}

function openInventory(scene) {
    if (isMenuOpen() || !inventoryContainer) return;

    inventoryOpen = true;
    newGameConfirmUntil = 0;
    stopCharacterForMenu();
    refreshInventoryUI(scene.time.now);
    showSlidingPanel(scene, INVENTORY_HIDDEN_Y, inventoryContainer, inventoryTextLayer);
}

function closeInventory(scene) {
    if (!inventoryOpen) return;

    inventoryOpen = false;
    newGameConfirmUntil = 0;
    hideSlidingPanel(scene, INVENTORY_HIDDEN_Y, () => inventoryOpen, inventoryContainer, inventoryTextLayer);
}

function handleInventoryKey(scene, event) {
    const key = event.key.toLowerCase();

    const step = getVerticalMenuStep(event, key);
    const column = key === 'a' || event.key === 'ArrowLeft' || key === 'd' || event.key === 'ArrowRight';

    if (step) {
        selectFishpediaEntry(selectedFishIndex + step);
    } else if (column) {
        selectFishpediaEntry((selectedFishIndex + FISHPEDIA_ROWS) % (FISHPEDIA_ROWS * 2));
    } else if (key === 'i' || event.key === 'Escape') {
        closeInventory(scene);
    } else if (key === 'n' && scene.time.now < newGameConfirmUntil) {
        if (resetProgress()) {
            window.location.reload();
        } else {
            newGameConfirmUntil = 0;
            inventoryNewGameText.textContent = 'Could not erase save - press N to retry';
            inventoryNewGameText.style.color = '#d9745b';
        }
    } else if (key === 'n') {
        newGameConfirmUntil = scene.time.now + 2500;
        refreshInventoryUI(scene.time.now);
    }
}
