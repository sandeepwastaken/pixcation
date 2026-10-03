function createInventoryUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, INVENTORY_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, 19, 296, 1)
        .fillRect(12, 127, 296, 1)
        .fillRect(159, 23, 1, 101);

    const textLayer = createTextLayer(INVENTORY_HEIGHT, { color: '#c0a887' });
    const rowStyle = { fontSize: '9px', lineHeight: '8px' };
    const detailStyle = { fontSize: '8px', lineHeight: '8px' };

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'Fishpedia';
    inventorySummaryText = createUIText(textLayer, 145, 5, null, 161, 'right', { fontSize: '11px' });

    inventoryRowTexts = [];
    inventoryCountTexts = [];

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const column = Math.floor(index / 13);
        const row = index % 13;
        const x = 14 + column * 152;
        const y = 22 + row * 8;
        inventoryRowTexts.push(createUIText(textLayer, x, y, null, 84, null, rowStyle));
        inventoryCountTexts.push(createUIText(textLayer, x + 84, y, null, 55, 'right', detailStyle));
    }

    inventoryNewGameText = createUIText(textLayer, 12, 128, '#8c7358', 296, 'center', { fontSize: '11px' });
    inventoryFooterHints = appendKeyHints(document.createElement('span'), [['I/Esc', 'Close'], ['N', 'New Game']]);

    inventoryContainer = addPanelContainer(scene, INVENTORY_HIDDEN_Y, 203, [panel]);
    inventoryTextLayer = addHudLayer(scene, textLayer, INVENTORY_HIDDEN_Y, 204);
    refreshInventoryUI(scene.time.now);
}

function refreshInventoryUI(time) {
    if (!inventorySummaryText) return;

    const summary = getFishInventorySummary();
    inventorySummaryText.textContent = `${catchLog.size}/${FISH_SPECIES.length} caught · ${summary.count} fish · ${summary.value}c`;
    inventorySummaryText.style.color = summary.count ? '#e8c170' : '#8c7358';

    FISH_SPECIES.forEach((species, index) => {
        const caught = catchLog.has(species.id);
        const count = fishInventory.get(species.id) || 0;

        inventoryRowTexts[index].textContent = caught ? species.name : '???';
        inventoryRowTexts[index].style.color = caught ? '#e0f2fd' : '#6f5b49';
        inventoryCountTexts[index].textContent = caught ? `x${count} ${species.price}c` : '—';
        inventoryCountTexts[index].style.color = count ? '#8fbf7a' : caught ? '#8c7358' : '#6f5b49';
    });

    const confirming = time < newGameConfirmUntil;

    if (confirming) {
        inventoryNewGameText.textContent = 'Press N again to erase all progress';
    } else if (inventoryNewGameText.firstChild !== inventoryFooterHints) {
        inventoryNewGameText.replaceChildren(inventoryFooterHints);
    }

    inventoryNewGameText.style.color = confirming ? '#d9745b' : '#8c7358';
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

    if (key === 'i' || event.key === 'Escape') {
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
