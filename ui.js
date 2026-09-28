let mapPixels;
let mapPixelWords;
const mapColors = createTileCache(() => new Uint32Array(CHUNK_SIZE * CHUNK_SIZE));

function isMenuOpen() {
    return dialogueOpen || marketOpen || mapOpen || inventoryOpen;
}

function drawPanelFrame(panel, x, width, height) {
    return panel
        .fillStyle(0x230a03, 1)
        .fillRect(x, 0, width, height)
        .fillStyle(0xacccf9, 1)
        .fillRect(x + 1, 1, width - 2, height - 2)
        .fillStyle(0x465989, 1)
        .fillRect(x + 2, 2, width - 4, height - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(x + 3, 3, width - 6, height - 6);
}

const CRISP_TEXT_STYLE = { textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased' };

function createTextLayer(height, style) {
    const layer = document.createElement('div');

    Object.assign(layer.style, {
        position: 'relative',
        width: '320px',
        height: `${height}px`,
        fontFamily: 'm6x11, monospace',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none'
    }, style);

    return layer;
}

function createUIText(layer, x, y, color, width, align, style) {
    const text = document.createElement('div');

    Object.assign(text.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: width ? `${width}px` : 'auto',
        textAlign: align || 'left',
        whiteSpace: 'nowrap'
    }, color && { color }, style);

    layer.appendChild(text);
    return text;
}

function addHudLayer(scene, element, y, depth) {
    const layer = scene.add.dom(0, y, element)
        .setOrigin(0)
        .setDepth(depth)
        .setScrollFactor(0)
        .setVisible(false);

    layer.pointerEvents = 'none';
    return layer;
}

function addPanelContainer(scene, y, depth, children) {
    return scene.add.container(0, y, children)
        .setDepth(depth)
        .setScrollFactor(0)
        .setVisible(false);
}

function appendKeyHints(element, hints) {
    for (const [key, label] of hints) {
        const keycap = document.createElement('span');
        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            margin: '0 4px 0 10px'
        });

        element.append(keycap, label);
    }

    return element;
}

function createGuideDialogueUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, 78)
        .fillStyle(0x465989, 1)
        .fillRect(DIALOGUE_OPTION_X - 7, 8, 1, 62);

    dialogueHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(DIALOGUE_OPTION_X - 3, 0, DIALOGUE_OPTION_WIDTH, DIALOGUE_OPTION_HEIGHT)
        .fillStyle(0x4a2216, 1)
        .fillRect(DIALOGUE_OPTION_X - 2, 1, DIALOGUE_OPTION_WIDTH - 2, DIALOGUE_OPTION_HEIGHT - 2);

    dialoguePortrait = scene.add.image(12, 13, 'guide-portrait-friendly')
        .setOrigin(0);

    const textLayer = createTextLayer(78, CRISP_TEXT_STYLE);

    createUIText(textLayer, 64, 5, '#acccf9').textContent = 'Guide';
    dialogueText = createUIText(textLayer, 64, 21, '#e0f2fd', 146, null, { whiteSpace: 'normal' });
    dialogueOptionTexts = [0, 1, 2].map(index => {
        return createUIText(textLayer, DIALOGUE_OPTION_X + 3, DIALOGUE_OPTION_TOP + 4 + index * DIALOGUE_OPTION_STEP, '#c0a887');
    });

    dialogueContainer = addPanelContainer(scene, DIALOGUE_HIDDEN_Y, 200, [panel, dialogueHighlight, dialoguePortrait]);
    dialogueTextLayer = addHudLayer(scene, textLayer, DIALOGUE_HIDDEN_Y, 201);
}

function createMapUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, MAP_PANEL_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);
    mapPixels = mapTexture.getContext().createImageData(MAP_WIDTH, MAP_HEIGHT);
    mapPixelWords = new Uint32Array(mapPixels.data.buffer);

    mapImage = scene.add.image(12, MAP_TOP, 'map')
        .setOrigin(0);

    const textLayer = createTextLayer(MAP_PANEL_HEIGHT);

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'World Map';
    appendKeyHints(
        createUIText(textLayer, 0, 6, '#8c7358', null, null, { left: 'auto', right: '14px', fontSize: '11px' }),
        [['Scroll', 'Zoom'], ['WASD', 'Pan'], ['M', 'Close']]
    );

    mapTextLayer = addHudLayer(scene, textLayer, MAP_HIDDEN_Y, 203);
    mapContainer = addPanelContainer(scene, MAP_HIDDEN_Y, 202, [panel, mapImage]);
}

function getMapPalette(scene) {
    if (mapPalette) return mapPalette;

    const pack = ([r, g, b]) => (r << 16) | (g << 8) | b;
    const grass = getDominantColor(scene, 'grass1');
    const dirt = getDominantColor(scene, 'dirt1');

    mapPalette = {
        grass: pack(grass),
        grassEdge: pack(shadeColor(...grass)),
        dirt: pack(dirt),
        dirtEdge: pack(shadeColor(...dirt)),
        bush: 0x4a7a52,
        rock: pack(getDominantColor(scene, 'rock')),
        boulder: pack(getDominantColor(scene, 'boulder')),
        wood: pack(getDominantColor(scene, 'wood')),
        store: pack(getDominantColor(scene, 'store')),
        water: [0x87bed8, 0x72a8cf, 0x6890ca],
        fog: [0x1a1a1a, 0x2a2a2a],
        guide: 0xacccf9,
        player: 0xf6f5e5,
        outline: 0x230a03
    };

    return mapPalette;
}

function getMapWaterDepth(tileX, tileY) {
    for (let radius = 1; radius <= 2; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (
                    Math.max(Math.abs(offsetX), Math.abs(offsetY)) === radius &&
                    getTerrainType(tileX + offsetX, tileY + offsetY) !== 'water'
                ) {
                    return radius - 1;
                }
            }
        }
    }

    return 2;
}

function toMapPixel(color) {
    return (0xff000000 | (color & 255) << 16 | color & 0xff00 | color >> 16 & 255) >>> 0;
}

function generateMapTileColor(tileX, tileY) {
    const palette = mapPalette;
    const covering = getPropCovering(tileX, tileY);
    let color;

    if (covering) {
        color = covering.type === 'tree' ? getTreeVariant(covering.tileX, tileY).color : palette[covering.type];
    } else {
        const tile = getWorldTile(tileX, tileY);
        const terrain = getTerrainType(tileX, tileY);

        if (tile.key.startsWith('wood')) {
            color = palette.wood;
        } else if (terrain === 'water') {
            color = palette.water[getMapWaterDepth(tileX, tileY)];
        } else if (tile.blocking === 'lower') {
            color = terrain === 'grass' ? palette.grassEdge : palette.dirtEdge;
        } else {
            color = terrain === 'grass' ? palette.grass : palette.dirt;
        }
    }

    return toMapPixel(color);
}

function redrawMap(scene) {
    const palette = getMapPalette(scene);
    const context = mapTexture.getContext();
    const pixels = mapPixelWords;
    const fog = palette.fog.map(toMapPixel);
    const outline = toMapPixel(palette.outline);

    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const zoom = mapZoom;
    const viewWidth = Math.ceil(MAP_WIDTH / zoom);
    const viewHeight = Math.ceil(MAP_HEIGHT / zoom);
    const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);

    const marker = (tileX, tileY, width, height, color) => {
        const x = (tileX - originX) * zoom;
        const y = (tileY - originY) * zoom;
        const pixelWidth = width * zoom;
        const pixelHeight = height * zoom;
        const fill = toMapPixel(color);

        for (let offsetY = -1; offsetY <= pixelHeight; offsetY++) {
            for (let offsetX = -1; offsetX <= pixelWidth; offsetX++) {
                const plotX = x + offsetX;
                const plotY = y + offsetY;
                if (plotX < 0 || plotY < 0 || plotX >= MAP_WIDTH || plotY >= MAP_HEIGHT) continue;

                const inside = offsetX >= 0 && offsetY >= 0 && offsetX < pixelWidth && offsetY < pixelHeight;
                pixels[plotY * MAP_WIDTH + plotX] = inside ? fill : outline;
            }
        }
    };

    for (let viewY = 0; viewY < viewHeight; viewY++) {
        const tileY = originY + viewY;
        const top = viewY * zoom;
        const bottom = Math.min(top + zoom, MAP_HEIGHT);

        for (let viewX = 0; viewX < viewWidth; viewX++) {
            const tileX = originX + viewX;
            const color = isTileDiscovered(tileX, tileY) ? mapColors(tileX, tileY, generateMapTileColor) : -1;
            const left = viewX * zoom;
            const right = Math.min(left + zoom, MAP_WIDTH);

            for (let y = top; y < bottom; y++) {
                for (let x = left; x < right; x++) {
                    pixels[y * MAP_WIDTH + x] = color === -1 ? fog[(x + y) & 1] : color;
                }
            }
        }
    }

    if (store && isTileDiscovered(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE))) {
        marker(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE), STORE_WIDTH_TILES, STORE_HEIGHT_TILES, palette.store);
    }

    if (guide && isTileDiscovered(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE))) {
        marker(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE), 1, 1, palette.guide);
    }

    marker(playerTileX, playerTileY, 1, 1, palette.player);

    context.putImageData(mapPixels, 0, 0);
    mapTexture.refresh();
}

function openMap(scene) {
    if (isMenuOpen() || !mapContainer) return;

    mapOpen = true;
    mapPan.x = 0;
    mapPan.y = 0;
    mapDrag = null;
    mapDirty = false;
    stopCharacterForMenu();
    redrawMap(scene);
    showSlidingPanel(scene, MAP_HIDDEN_Y, mapContainer, mapTextLayer);
}

function updateMapPan(scene, delta) {
    const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
        (characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
    const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
        (characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);
    const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
    const beforeX = Math.round(mapPan.x);
    const beforeY = Math.round(mapPan.y);

    mapPan.x += panX * distance;
    mapPan.y += panY * distance;
    mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;

    if (mapDirty) {
        mapDirty = false;
        redrawMap(scene);
    }
}

function snapTweenTarget(tween, target) {
    target.y = Math.round(target.y);
}

function stopCharacterForMenu() {
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    setCharacterTexture(`character-${characterDirection}`);
}

function getVerticalMenuStep(event) {
    const key = event.key.toLowerCase();
    return key === 'w' || event.key === 'ArrowUp' ? -1 : key === 's' || event.key === 'ArrowDown' ? 1 : 0;
}

function popIn(scene, image, y) {
    image.setY(y + 2);
    scene.tweens.killTweensOf(image);
    scene.tweens.add({ targets: image, y, duration: 140, ease: 'Quad.Out', onUpdate: snapTweenTarget });
}

function slidePanel(scene, y, duration, ease, targets, onComplete) {
    for (const target of targets) scene.tweens.killTweensOf(target);
    scene.tweens.add({ targets, y, duration, ease, onUpdate: snapTweenTarget, onComplete });
}

function showSlidingPanel(scene, hiddenY, ...targets) {
    for (const target of targets) target.setVisible(true).setY(hiddenY);
    slidePanel(scene, DIALOGUE_VISIBLE_Y, 180, 'Cubic.Out', targets);
}

function hideSlidingPanel(scene, hiddenY, isOpen, ...targets) {
    slidePanel(scene, hiddenY, 140, 'Cubic.In', targets, () => {
        if (!isOpen()) for (const target of targets) target.setVisible(false);
    });
}

function closeMap(scene) {
    if (!mapOpen) return;

    mapOpen = false;
    hideSlidingPanel(scene, MAP_HIDDEN_Y, () => mapOpen, mapContainer, mapTextLayer);
}

function handleMapKey(scene, event) {
    if (event.key.toLowerCase() === 'm' || event.key === 'Escape') closeMap(scene);
}

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
        newGameResetting = true;
        saveDirty = false;
        localStorage.removeItem(SAVE_KEY);
        window.location.reload();
    } else if (key === 'n') {
        newGameConfirmUntil = scene.time.now + 2500;
        refreshInventoryUI(scene.time.now);
    }
}

function createCatchCardUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 40, 240, 30);

    const textLayer = createTextLayer(30);

    catchCardTitle = createUIText(textLayer, 43, 4, '#e0f2fd', 234, 'center');
    catchCardDetail = createUIText(textLayer, 43, 16, '#e8c170', 234, 'center', { fontSize: '11px', lineHeight: '9px' });

    catchCardContainer = addPanelContainer(scene, CATCH_CARD_Y + 8, 205, [panel]);
    catchCardTextLayer = addHudLayer(scene, textLayer, CATCH_CARD_Y + 8, 206);
}

function showCatchCard(scene, time, species) {
    showRewardCard(scene, time, `You caught a ${species.name}!`, `${species.price}c`);
}

function showRewardCard(scene, time, title, detail) {
    catchCardTitle.textContent = title;
    catchCardDetail.textContent = detail;
    catchCardUntil = time + CATCH_CARD_DURATION;
    itemLabelUntil = 0;

    const card = [catchCardContainer, catchCardTextLayer];

    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    for (const target of card) target.setVisible(true).setY(CATCH_CARD_Y + 8);
    slidePanel(scene, CATCH_CARD_Y, 180, 'Cubic.Out', card);

    catchCardHideEvent = scene.time.delayedCall(CATCH_CARD_DURATION - 180, () => {
        slidePanel(scene, CATCH_CARD_Y + 8, 180, 'Cubic.In', card, () => {
            for (const target of card) target.setVisible(false);
        });
    });
}

function createInteractionPromptUI(scene) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    wrapper.appendChild(row);

    Object.assign(row.style, {
        width: '320px',
        height: '18px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
        fontFamily: 'm6x11, monospace',
        fontSize: '11px',
        lineHeight: '11px',
        color: '#c0a887',
        whiteSpace: 'nowrap',
    });

    const makePrompt = (key, label) => {
        const box = document.createElement('div');

        Object.assign(box.style, {
            display: 'none',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 6px',
            background: '#36160d',
            borderRadius: '0',
            boxShadow: 'inset 0 0 0 1px #465989, 0 0 0 1px #230a03'
        });

        const keycap = document.createElement('span');
        keycap.textContent = key || '';

        Object.assign(keycap.style, {
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '10px',
            padding: '0 1px',
            color: '#e0f2fd',
            background: '#465989',
            borderRadius: '0'
        });

        const text = document.createElement('span');
        text.textContent = label;

        box.append(...(key ? [keycap, text] : [text]));
        box.label = text;
        row.appendChild(box);

        return box;
    };

    marketPrompt = makePrompt('E', 'Market');
    guidePrompt = makePrompt('E', 'Talk to the Guide');
    itemPrompt = makePrompt(null, '');

    interactionPromptLayer = addHudLayer(scene, wrapper, PROMPT_Y, 103);
}

function updateInteractionPrompt(scene, guideReach, marketReach) {
    if (!interactionPromptLayer) return;

    const available = !isMenuOpen() && scene.time.now >= catchCardUntil;
    const target = available && (guideReach < 1 || marketReach < 1)
        ? getInteractionTarget(guideHasMetPlayer, guideReach, marketReach)
        : null;
    const showItem = available && !target && scene.time.now < itemLabelUntil;
    const state = (target === 'market' ? 1 : 0) | (target === 'guide' ? 2 : 0) | (showItem ? 4 : 0);

    if (state === promptState) return;

    const wasShowing = promptState > 0;
    promptState = state;
    scene.tweens.killTweensOf(promptMotion);

    if (state === 0) {
        scene.tweens.add({
            targets: promptMotion,
            value: 0,
            duration: 90,
            onUpdate: applyPromptMotion,
            onComplete: () => promptState === 0 && interactionPromptLayer.setVisible(false)
        });
        return;
    }

    marketPrompt.style.display = state & 1 ? 'flex' : 'none';
    guidePrompt.style.display = state & 2 ? 'flex' : 'none';
    itemPrompt.style.display = state & 4 ? 'flex' : 'none';
    interactionPromptLayer.setVisible(true);
    if (!wasShowing) promptMotion.value = 0;
    applyPromptMotion();
    scene.tweens.add({ targets: promptMotion, value: 1, duration: 140, ease: 'Cubic.Out', onUpdate: applyPromptMotion });
}

function applyPromptMotion() {
    interactionPromptLayer
        .setY(PROMPT_Y + Math.round((1 - promptMotion.value) * PROMPT_SLIDE))
        .setVisible(promptMotion.value > 0.05);
}

function createMarketUI(scene) {
    const panel = scene.add.image(0, 0, 'shop-ui').setOrigin(0);

    marketHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(MARKET_LIST_X, 0, MARKET_LIST_WIDTH, MARKET_ROW_HEIGHT - 2)
        .fillStyle(0x4a2216, 1)
        .fillRect(MARKET_LIST_X + 1, 1, MARKET_LIST_WIDTH - 2, MARKET_ROW_HEIGHT - 4);

    marketItemImages = MARKET_RODS.map((rod, index) => {
        return scene.add.image(MARKET_LIST_X + 3, MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 2, rod.icon)
            .setOrigin(0);
    });

    marketDetailImage = scene.add.image(
        MARKET_DETAIL_X + 50,
        MARKET_LIST_Y + 4,
        MARKET_RODS[0].texture
    )
        .setOrigin(0);

    const textLayer = createTextLayer(MARKET_HEIGHT, CRISP_TEXT_STYLE);
    const createText = (x, y, color, width, align, style) => createUIText(textLayer, x, y, color, width, align, style);

    marketTabTexts = MARKET_PAGES.map((page, index) => {
        const tab = createText(MARKET_TAB_X + index * MARKET_TAB_WIDTH, MARKET_TAB_Y, '#6f5b49');
        tab.textContent = page.title;
        return tab;
    });
    marketMessageText = createText(160, 5, '#e8c170', 146, 'right');

    marketOptionTexts = [];
    marketPriceTexts = [];

    for (let index = 0; index < MARKET_ROW_COUNT; index++) {
        const rowY = MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 6;
        const isAction = index >= MARKET_ITEM_ROWS;

        marketOptionTexts.push(createText(isAction ? MARKET_LIST_X + 6 : MARKET_LIST_X + 24, rowY, '#c0a887'));

        if (!isAction) {
            marketPriceTexts.push(createText(MARKET_LIST_X, rowY, '#c0a887', MARKET_LIST_WIDTH - 5, 'right'));
        }
    }

    const detailTextX = MARKET_DETAIL_X + 4;
    const detailTextWidth = MARKET_DETAIL_WIDTH - 8;

    marketDetailName = createText(detailTextX, MARKET_LIST_Y + 39, '#e0f2fd', detailTextWidth, 'center');
    marketDetailStatus = createText(detailTextX, MARKET_LIST_Y + 51, '#c0a887', detailTextWidth, 'center');
    marketDetailAction = createText(detailTextX, MARKET_LIST_Y + 66, '#acccf9', detailTextWidth, 'center');

    const footer = createText(12, MARKET_FOOTER_Y, '#8c7358', 296, 'center', {
        fontSize: '11px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
    });

    for (const [key, label] of [['A/D', 'Tab'], ['W/S', 'Select'], ['Enter', 'Buy'], ['E', 'Close']]) {
        const hint = document.createElement('span');
        const keycap = document.createElement('span');

        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            marginRight: '4px'
        });

        hint.append(keycap, label);
        footer.appendChild(hint);
    }

    marketContainer = addPanelContainer(scene, MARKET_HIDDEN_Y, 203, [panel, marketHighlight, ...marketItemImages, marketDetailImage]);
    marketTextLayer = addHudLayer(scene, textLayer, MARKET_HIDDEN_Y, 204);

    refreshMarketOptions();
}

function addHotbarItem(scene, textureKey, name) {
    const slot = hotbarItemImages.length;
    if (slot >= 9) return;

    const image = scene.add.image(HOTBAR_X + slot * HOTBAR_SLOT_SIZE + 13, 0, textureKey)
        .setDepth(100.5)
        .setScrollFactor(0)
        .setDisplaySize(16, 16);

    hotbarItemNames[slot] = name;
    hotbarItemImages.push(image);
    popIn(scene, image, HOTBAR_Y + 13);
}

function createBaitSlotUI(scene) {
    scene.textures.get('hotbar').add('slot', 0, 0, 0, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);
    scene.add.image(BAIT_SLOT_X, HOTBAR_Y, 'hotbar', 'slot')
        .setOrigin(0)
        .setDepth(100)
        .setScrollFactor(0);

    baitSlotImage = scene.add.image(BAIT_SLOT_X + 13, HOTBAR_Y + 13, MARKET_BAITS[0].icon)
        .setDepth(100.5)
        .setScrollFactor(0)
        .setVisible(false);

    const layer = createTextLayer(9, { width: `${HOTBAR_SLOT_SIZE}px`, fontSize: '11px', lineHeight: '9px' });

    baitCountText = createUIText(layer, 0, 0, '#e0f2fd', HOTBAR_SLOT_SIZE - 3, 'right', { textShadow: '1px 0 #230a03, 0 1px #230a03' });
    addHudLayer(scene, layer, 0, 100.6).setPosition(BAIT_SLOT_X, HOTBAR_Y + 15).setVisible(true);
}

function refreshBaitSlot() {
    if (!baitSlotImage) return;

    const bait = getActiveBait();

    baitSlotImage.setVisible(Boolean(bait));
    baitCountText.textContent = bait ? baitInventory.get(bait.id) : '';

    if (bait && baitSlotImage.texture.key !== bait.icon) {
        popIn(baitSlotImage.scene, baitSlotImage.setTexture(bait.icon), HOTBAR_Y + 13);
    }
}

function getActiveBait() {
    return baitInventory.get(activeBaitId) ? MARKET_BAITS_BY_ID.get(activeBaitId) : null;
}

function addBait(bait, amount, equip) {
    baitInventory.set(bait.id, (baitInventory.get(bait.id) || 0) + amount);
    if (equip || !getActiveBait()) activeBaitId = bait.id;
    saveDirty = true;
    refreshBaitSlot();
}

function useBait(bait) {
    if (!bait || !baitInventory.get(bait.id)) return;

    const left = baitInventory.get(bait.id) - 1;

    if (left) {
        baitInventory.set(bait.id, left);
    } else {
        baitInventory.delete(bait.id);
        if (activeBaitId === bait.id) activeBaitId = MARKET_BAITS.find(other => baitInventory.has(other.id))?.id ?? null;
    }

    saveDirty = true;
    refreshBaitSlot();
}

function cycleBait(scene) {
    const owned = MARKET_BAITS.filter(bait => baitInventory.has(bait.id));

    if (!owned.length) {
        showItemLabel(scene, 'No bait - buy some at the shop');
        return;
    }

    const current = owned.indexOf(getActiveBait());
    const next = current + 1 < owned.length ? owned[current + 1] : null;

    activeBaitId = next ? next.id : null;
    saveDirty = true;
    refreshBaitSlot();
    showItemLabel(scene, next ? `${next.label} x${baitInventory.get(next.id)}` : 'No bait');
}

function showItemLabel(scene, text) {
    if (!itemPrompt) return;

    itemPrompt.label.textContent = text;
    itemLabelUntil = scene.time.now + ITEM_LABEL_DURATION;
}

function isBaitSlotAt(x, y) {
    return x >= BAIT_SLOT_X && x < BAIT_SLOT_X + HOTBAR_SLOT_SIZE && y >= HOTBAR_Y && y < HOTBAR_Y + HOTBAR_SLOT_SIZE;
}

function getMarketTabAt(x, y) {
    const localY = y - DIALOGUE_VISIBLE_Y - MARKET_TAB_Y;
    const tab = Math.floor((x - MARKET_TAB_X) / MARKET_TAB_WIDTH);

    return localY >= -2 && localY < 12 && x >= MARKET_TAB_X && tab < MARKET_PAGES.length ? tab : -1;
}

function setMarketPage(page) {
    marketPage = Phaser.Math.Wrap(page, 0, MARKET_PAGES.length);
    marketFeedback = null;
    refreshMarketOptions();
}

function getMarketRowAt(x, y) {
    const localY = y - DIALOGUE_VISIBLE_Y - MARKET_LIST_Y;
    const row = Math.floor(localY / MARKET_ROW_HEIGHT);
    const inside = x >= MARKET_LIST_X && x < MARKET_LIST_X + MARKET_LIST_WIDTH && localY >= 0 &&
        row < MARKET_ROW_COUNT && localY - row * MARKET_ROW_HEIGHT < MARKET_ROW_HEIGHT - 2;

    return inside ? row : -1;
}

function getDialogueOptionAt(x, y) {
    const option = Math.floor((y - DIALOGUE_VISIBLE_Y - DIALOGUE_OPTION_TOP) / DIALOGUE_OPTION_STEP);
    const inside = x >= DIALOGUE_OPTION_X - 3 && x < DIALOGUE_OPTION_X - 3 + DIALOGUE_OPTION_WIDTH &&
        option >= 0 && option < GUIDE_DIALOGUE[dialogueNode].options.length;

    return inside ? option : -1;
}

function isMarketItemOwned(item) {
    return !item.bundle && ownedRods.has(item.id);
}

function getMarketItemStatus(item) {
    if (isMarketItemOwned(item)) {
        return { text: 'Owned', color: '#8fbf7a' };
    }

    if (playerCoins < item.price) {
        return { text: `Need ${item.price - playerCoins}c more`, color: '#d9745b' };
    }

    return { text: item.bundle ? `${item.bundle} for ${item.price}c` : `${item.price}c`, color: '#e8c170' };
}

function getFishInventorySummary() {
    let count = 0;
    let value = 0;

    for (const [id, amount] of fishInventory) {
        const species = FISH_SPECIES_BY_ID.get(id);
        if (!species) continue;
        count += amount;
        value += amount * species.price;
    }

    return { count, value };
}

function setMarketDetail(name, status, statusColor, action, actionColor = '#acccf9') {
    marketDetailName.textContent = name;
    marketDetailStatus.textContent = status;
    marketDetailStatus.style.color = statusColor;
    marketDetailAction.textContent = marketFeedback ? marketFeedback.text : action;
    marketDetailAction.style.color = marketFeedback ? marketFeedback.color : actionColor;
}

function refreshMarketOptions() {
    if (!marketMessageText) return;

    const items = MARKET_PAGES[marketPage].items;
    const rowColor = index => index === selectedMarketOption ? '#e0f2fd' : '#c0a887';

    marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
    marketHighlight.setY(MARKET_LIST_Y + selectedMarketOption * MARKET_ROW_HEIGHT);
    marketTabTexts.forEach((tab, index) => tab.style.color = index === marketPage ? '#acccf9' : '#6f5b49');

    for (let index = 0; index < MARKET_ITEM_ROWS; index++) {
        const item = items[index];
        const owned = item && isMarketItemOwned(item);
        const priceText = marketPriceTexts[index];

        marketOptionTexts[index].textContent = item ? item.label : '';
        marketOptionTexts[index].style.color = owned && index !== selectedMarketOption ? '#7a6450' : rowColor(index);
        priceText.textContent = !item ? '' : owned ? 'Owned' : `${item.price}c`;
        priceText.style.color = owned ? '#8fbf7a' : item && playerCoins >= item.price ? '#e8c170' : '#9a5a47';
        marketItemImages[index].setVisible(Boolean(item));
        if (item) marketItemImages[index].setTexture(item.icon).setTint(owned ? OWNED_ROD_TINT : 0xffffff);
    }

    marketOptionTexts[MARKET_SELL_INDEX].textContent = 'Sell fish';
    marketOptionTexts[MARKET_SELL_INDEX].style.color = rowColor(MARKET_SELL_INDEX);
    marketOptionTexts[MARKET_EXIT_INDEX].textContent = 'Leave';
    marketOptionTexts[MARKET_EXIT_INDEX].style.color = rowColor(MARKET_EXIT_INDEX);

    const item = items[selectedMarketOption];
    marketDetailImage.setVisible(Boolean(item));

    if (selectedMarketOption === MARKET_SELL_INDEX) {
        const { count, value } = getFishInventorySummary();
        setMarketDetail('Sell fish', count ? `${count} fish · ${value}c` : 'No fish to sell', count ? '#e8c170' : '#c0a887', count ? 'Enter - Sell all' : '');
    } else if (selectedMarketOption === MARKET_EXIT_INDEX) {
        setMarketDetail('Leave shop', '', '#c0a887', 'Enter - Leave');
    } else if (!item) {
        setMarketDetail('', '', '#c0a887', '');
    } else {
        const status = getMarketItemStatus(item);
        const owned = isMarketItemOwned(item);
        const held = baitInventory.get(item.id);

        marketDetailImage.setTexture(item.texture).setTint(owned ? OWNED_ROD_TINT : 0xffffff);
        setMarketDetail(
            item.label,
            item.bundle && held ? `Have ${held} · ${status.text}` : status.text,
            status.color,
            owned || playerCoins < item.price ? '' : 'Enter - Buy'
        );
    }
}

function animateCoinTotal(scene) {
    scene.tweens.killTweensOf(coinDisplay);
    scene.tweens.add({
        targets: coinDisplay,
        value: playerCoins,
        duration: 260,
        ease: 'Quad.Out',
        onUpdate: () => marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`
    });
}

function buySelectedMarketItem(scene) {
    const item = MARKET_PAGES[marketPage].items[selectedMarketOption];

    if (selectedMarketOption === MARKET_EXIT_INDEX) {
        closeMarket(scene);
        return;
    }

    if (selectedMarketOption === MARKET_SELL_INDEX) {
        const summary = getFishInventorySummary();
        if (!summary.count) return;

        playerCoins += summary.value;
        fishInventory.clear();
        marketFeedback = { text: `Sold for ${summary.value}c!`, color: '#8fbf7a' };
    } else if (!item || isMarketItemOwned(item) || playerCoins < item.price) {
        return;
    } else if (item.bundle) {
        playerCoins -= item.price;
        addBait(item, item.bundle, true);
        marketFeedback = { text: `+${item.bundle} ${item.label}!`, color: '#8fbf7a' };
    } else {
        playerCoins -= item.price;
        ownedRods.add(item.id);
        addHotbarItem(scene, item.icon, item.label);
        marketFeedback = { text: 'Purchased!', color: '#8fbf7a' };
    }

    saveDirty = true;
    animateCoinTotal(scene);
    refreshMarketOptions();
}

function moveMarketSelection(amount) {
    selectedMarketOption = Phaser.Math.Wrap(selectedMarketOption + amount, 0, MARKET_ROW_COUNT);
    marketFeedback = null;
    refreshMarketOptions();
}

function openMarket(scene) {
    if (isMenuOpen() || !marketContainer || !isMarketNear()) return;

    marketOpen = true;
    selectedMarketOption = 0;
    marketPage = 0;
    marketFeedback = null;
    coinDisplay.value = playerCoins;
    stopCharacterForMenu();
    refreshMarketOptions();
    showSlidingPanel(scene, MARKET_HIDDEN_Y, marketContainer, marketTextLayer);
}

function closeMarket(scene) {
    if (!marketOpen) return;

    marketOpen = false;
    hideSlidingPanel(scene, MARKET_HIDDEN_Y, () => marketOpen, marketContainer, marketTextLayer);
}

function handleMarketKey(scene, event) {
    const key = event.key.toLowerCase();
    const step = getVerticalMenuStep(event);
    const page = key === 'a' || event.key === 'ArrowLeft' ? -1 : key === 'd' || event.key === 'ArrowRight' ? 1 : 0;

    if (step) {
        moveMarketSelection(step);
    } else if (page) {
        setMarketPage(marketPage + page);
    } else if (event.key === 'Enter' || event.code === 'Space') {
        buySelectedMarketItem(scene);
    } else if (key === 'e' || event.key === 'Escape') {
        closeMarket(scene);
    }
}

function getMarketReach() {
    if (!store) return Infinity;

    const x = character.x + CHARACTER_SIZE / 2 - store.x - STORE_WIDTH / 2;
    const y = character.y + CHARACTER_SIZE / 2 - store.y - STORE_HEIGHT / 2;

    return (x * x + y * y) / MARKET_INTERACTION_DISTANCE_SQUARED;
}

function getGuideReach() {
    if (!guide) return Infinity;

    const x = character.x - guide.x;
    const y = character.y - guide.y;

    return (x * x + y * y) / GUIDE_INTERACTION_DISTANCE_SQUARED;
}

function isMarketNear() {
    return getMarketReach() < 1;
}

function isGuideNear() {
    return getGuideReach() < 1;
}

function getClickedWorldTarget(pointer) {
    const inside = (target, width, height) => pointer.worldX >= target.x && pointer.worldX < target.x + width &&
        pointer.worldY >= target.y && pointer.worldY < target.y + height;

    if (guide && isGuideNear() && inside(guide, GUIDE_SIZE, GUIDE_SIZE)) return 'guide';
    if (store && isMarketNear() && inside(store, STORE_WIDTH, STORE_HEIGHT)) return 'market';
    return null;
}

function getFacingPenalty(targetX, targetY) {
    const x = targetX - character.x - CHARACTER_SIZE / 2;
    const y = targetY - character.y - CHARACTER_SIZE / 2;
    const along = characterDirection === 'left' ? -x
        : characterDirection === 'right' ? x
        : characterDirection === 'back' ? -y
        : y;

    return along > 0 && along * along * 2 >= x * x + y * y ? 0 : 1;
}

function getInteractionTarget(guideAvailable, guideReach, marketReach) {
    guideReach = guideAvailable ? guideReach ?? getGuideReach() : Infinity;
    marketReach ??= getMarketReach();

    if (guideReach >= 1 && marketReach >= 1) return null;
    if (guideReach >= 1) return 'market';
    if (marketReach >= 1) return 'guide';

    const guideScore = guideReach + getFacingPenalty(guide.x + GUIDE_SIZE / 2, guide.y + GUIDE_SIZE / 2);
    const marketScore = marketReach + getFacingPenalty(store.x + STORE_WIDTH / 2, store.y + STORE_HEIGHT / 2);

    return guideScore <= marketScore ? 'guide' : 'market';
}

function refreshGuideDialogueOptions() {
    const options = GUIDE_DIALOGUE[dialogueNode].options;

    dialogueOptionTexts.forEach((optionText, index) => {
        const option = options[index];

        optionText.style.display = option ? 'block' : 'none';
        if (!option) return;

        optionText.textContent = option.label;
        optionText.style.color = index === selectedDialogueOption ? '#e0f2fd' : '#c0a887';
    });

    dialogueHighlight.setY(DIALOGUE_OPTION_TOP + selectedDialogueOption * DIALOGUE_OPTION_STEP);
}

function finishGuideDialogueText() {
    if (!stopDialogueTyping()) return false;

    dialogueText.textContent = dialogueFullText;
    return true;
}

function openInteraction(scene, target) {
    if (target === 'guide') openGuideDialogue(scene);
    else if (target === 'market') openMarket(scene);
}

function stopDialogueTyping() {
    if (!dialogueTypingEvent) return false;

    dialogueTypingEvent.remove(false);
    dialogueTypingEvent = null;
    return true;
}

function showGuideDialogueNode(scene, nodeKey) {
    const node = GUIDE_DIALOGUE[nodeKey];
    let characterIndex = 0;

    stopDialogueTyping();
    dialogueNode = nodeKey;
    selectedDialogueOption = 0;
    dialogueFullText = node.text;
    dialoguePortrait.setTexture(node.portrait);
    dialogueText.textContent = '';
    refreshGuideDialogueOptions();

    dialogueTypingEvent = scene.time.addEvent({
        delay: 24,
        repeat: dialogueFullText.length - 1,
        callback: () => {
            characterIndex++;
            dialogueText.textContent = dialogueFullText.slice(0, characterIndex);
            if (characterIndex === dialogueFullText.length) dialogueTypingEvent = null;
        }
    });
}

function openGuideDialogue(scene) {
    if (isMenuOpen() || !guide || !dialogueContainer) return;

    dialogueOpen = true;
    stopCharacterForMenu();
    showSlidingPanel(scene, DIALOGUE_HIDDEN_Y, dialogueContainer, dialogueTextLayer);
    showGuideDialogueNode(scene, 'intro');
}

function closeGuideDialogue(scene) {
    if (!dialogueOpen) return;

    dialogueOpen = false;
    guideHasMetPlayer = true;
    saveDirty = true;
    stopDialogueTyping();
    hideSlidingPanel(scene, DIALOGUE_HIDDEN_Y, () => dialogueOpen, dialogueContainer, dialogueTextLayer);
}

function selectGuideDialogueOption(scene) {
    if (finishGuideDialogueText()) return;

    const option = GUIDE_DIALOGUE[dialogueNode].options[selectedDialogueOption];

    if (option.close) {
        closeGuideDialogue(scene);
    } else {
        showGuideDialogueNode(scene, option.next);
    }
}

function moveGuideDialogueSelection(amount) {
    selectedDialogueOption = Phaser.Math.Wrap(selectedDialogueOption + amount, 0, GUIDE_DIALOGUE[dialogueNode].options.length);
    refreshGuideDialogueOptions();
}

function handleGuideDialogueKey(scene, event) {
    const step = getVerticalMenuStep(event);

    if (step) {
        moveGuideDialogueSelection(step);
    } else if (event.key === 'Enter' || event.code === 'Space' || event.key.toLowerCase() === 'e') {
        selectGuideDialogueOption(scene);
    } else if (event.key === 'Escape') {
        closeGuideDialogue(scene);
    }
}

function updateGuideInteraction(scene, guideIsNear) {
    if (guideIsNear && !guideWasNear && !guideHasMetPlayer && !isMenuOpen()) {
        openGuideDialogue(scene);
    }

    guideWasNear = guideIsNear;
}
