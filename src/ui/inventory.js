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
    createNewGameUI(scene);
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
        setUITextContent(inventoryNewGameText, 'Press N again to choose a new world');
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
    closeNewGameChoice();
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
        openNewGameChoice();
        newGameConfirmUntil = 0; refreshInventoryUI(scene.time.now);
    } else if (key === 'n') {
        newGameConfirmUntil = scene.time.now + 2500;
        refreshInventoryUI(scene.time.now);
    }
}

function createNewGameUI(scene) {
    const panel = scene.add.graphics();
    drawPanelFrame(panel, 32, 256, 112);
    const text = createTextLayer(112, { textShadow: UI_TEXT_SHADOW });
    createUIText(text, 48, 9, '#e0f2fd', 224, 'center').textContent = 'Start a new world';
    const options = ['Seeded', 'Unseeded'].map((label, index) => createUIText(text, 48 + index * 112, 30, '#e0f2fd', 112, 'center'));
    const input = document.createElement('input');
    input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 49; input.setAttribute('aria-label', 'World seed');
    Object.assign(input.style, { position: 'absolute', left: '48px', top: '53px', width: '224px', height: '18px', boxSizing: 'border-box', background: '#230a03', color: '#e0f2fd', border: '1px solid #465989', borderRadius: '0', fontFamily: 'inherit', fontSize: '11px', padding: '2px 4px', pointerEvents: 'auto' });
    text.appendChild(input);
    const note = createUIText(text, 48, 76, '#c0a887', 224, 'center', { fontSize: '9px' });
    createUIText(text, 48, 94, '#e0f2fd', 224, 'center', { fontSize: '11px' }).textContent = 'Tab - choose   Enter - start   Esc - cancel';
    newGameChoice = { open: false, mode: 0, options, input, note, panel: addPanelContainer(scene, 40, 205, [panel]), text: addHudLayer(scene, text, 40, 206) };
    input.addEventListener('input', () => { newGameChoice.note.textContent = 'Starting over erases progress in this world'; });
    input.addEventListener('keydown', event => { event.stopPropagation(); handleNewGameChoiceKey(event); });
}

function refreshNewGameChoice() {
    for (let index = 0; index < 2; index++) newGameChoice.options[index].textContent = (newGameChoice.mode === index ? '> ' : '') + ['Seeded', 'Unseeded'][index];
    newGameChoice.input.style.display = newGameChoice.mode === 0 ? '' : 'none';
    newGameChoice.note.textContent = newGameChoice.mode === 0 ? 'Starting over erases progress in this world' : 'A fresh random world - existing progress is erased';
    for (let index = 0; index < 2; index++) newGameChoice.options[index].style.color = newGameChoice.mode === index ? '#acccf9' : '#c0a887';
}

function openNewGameChoice() {
    newGameChoice.open = true; newGameChoice.mode = 0;
    newGameChoice.inventoryTextVisible = inventoryTextLayer?.visible || false; inventoryTextLayer?.setVisible(false);
    newGameChoice.input.value = WORLD_SEED_CODE;
    refreshNewGameChoice();
    newGameChoice.panel.setVisible(true); newGameChoice.text.setVisible(true);
    newGameChoice.input.focus(); newGameChoice.input.select();
}

function closeNewGameChoice() {
    if (!newGameChoice) return;
    newGameChoice.open = false;
    newGameChoice.input.blur();
    newGameChoice.panel.setVisible(false); newGameChoice.text.setVisible(false);
    if (inventoryOpen && newGameChoice.inventoryTextVisible) inventoryTextLayer?.setVisible(true);
}

function startNewGameChoice() {
    if (!newGameChoice.open || newGameResetting) return;
    const seed = newGameChoice.mode === 0 ? newGameChoice.input.value.trim() : null;
    if (seed !== null && !isValidWorldSeed(seed)) { newGameChoice.note.textContent = 'Enter a valid positive whole-number seed'; newGameChoice.input.focus(); return; }
    const target = new URL(window.location.href);
    if (seed === null) target.searchParams.delete('seed'); else target.searchParams.set('seed', seed);
    if (!resetProgress(seed)) { newGameChoice.note.textContent = 'Could not erase save - try again'; return; }
    window.location.assign(target.href);
}

function handleNewGameChoiceKey(event) {
    if (event.repeat) return;
    if (event.key === 'Escape') { event.preventDefault(); closeNewGameChoice(); return; }
    if (event.key === 'Enter') { event.preventDefault(); startNewGameChoice(); return; }
    if (event.key === 'Tab') { event.preventDefault(); newGameChoice.input.blur(); newGameChoice.mode = 1 - newGameChoice.mode; refreshNewGameChoice(); return; }
    if (document.activeElement === newGameChoice.input) return;
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) { event.preventDefault(); newGameChoice.mode = 1 - newGameChoice.mode; refreshNewGameChoice(); }
    else if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'u') { newGameChoice.mode = event.key.toLowerCase() === 's' ? 0 : 1; refreshNewGameChoice(); }
    else if (event.key === ' ') { event.preventDefault(); startNewGameChoice(); }
}

function handleNewGameChoicePointer(pointer) {
    if (pointer.y >= 68 && pointer.y < 85 && pointer.x >= 48 && pointer.x < 272) { newGameChoice.input.blur(); newGameChoice.mode = pointer.x < 160 ? 0 : 1; refreshNewGameChoice(); }
    else if (pointer.y >= 130 && pointer.y < 150 && pointer.x >= 48 && pointer.x < 272) startNewGameChoice();
}
