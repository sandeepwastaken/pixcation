function createGuideDialogueUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, 78)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, 76)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, 74)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, 72)
        .fillStyle(0x465989, 1)
        .fillRect(DIALOGUE_OPTION_X - 7, 8, 1, 62);

    dialogueHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(DIALOGUE_OPTION_X - 3, 0, DIALOGUE_OPTION_WIDTH, DIALOGUE_OPTION_HEIGHT)
        .fillStyle(0x4a2216, 1)
        .fillRect(DIALOGUE_OPTION_X - 2, 1, DIALOGUE_OPTION_WIDTH - 2, DIALOGUE_OPTION_HEIGHT - 2);

    dialoguePortrait = scene.add.image(12, 13, 'guide-portrait-friendly')
        .setOrigin(0);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: '78px',
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
    });

    const createText = (x, y, color, width) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: width ? `${width}px` : 'auto',
            color,
            whiteSpace: width ? 'normal' : 'nowrap'
        });

        textLayer.appendChild(text);
        return text;
    };

    const nameText = createText(64, 5, '#acccf9');
    nameText.textContent = 'Guide';

    dialogueText = createText(64, 21, '#e0f2fd', 146);

    dialogueOptionTexts = [0, 1, 2].map(index => {
        return createText(DIALOGUE_OPTION_X + 3, DIALOGUE_OPTION_TOP + 4 + index * DIALOGUE_OPTION_STEP, '#c0a887');
    });

    dialogueContainer = scene.add.container(
        0,
        DIALOGUE_HIDDEN_Y,
        [
            panel,
            dialogueHighlight,
            dialoguePortrait
        ]
    )
    .setDepth(200)
    .setScrollFactor(0)
    .setVisible(false);

    dialogueTextLayer = scene.add.dom(
        0,
        DIALOGUE_HIDDEN_Y,
        textLayer
    )
    .setOrigin(0)
    .setDepth(201)
    .setScrollFactor(0)
    .setVisible(false);

    dialogueTextLayer.pointerEvents = 'none';
}

function createMapUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, MAP_PANEL_HEIGHT)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, MAP_PANEL_HEIGHT - 2)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, MAP_PANEL_HEIGHT - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, MAP_PANEL_HEIGHT - 6)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);

    mapImage = scene.add.image(12, MAP_TOP, 'map')
        .setOrigin(0);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: `${MAP_PANEL_HEIGHT}px`,
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none'
    });

    const title = document.createElement('div');
    title.textContent = 'World Map';

    Object.assign(title.style, {
        position: 'absolute',
        left: '14px',
        top: '5px',
        color: '#acccf9',
        whiteSpace: 'nowrap'
    });

    const hint = document.createElement('div');

    for (const [key, label] of [['Scroll', 'Zoom'], ['WASD', 'Pan'], ['M', 'Close']]) {
        const keycap = document.createElement('span');
        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            margin: '0 4px 0 10px'
        });

        hint.append(keycap, label);
    }

    Object.assign(hint.style, {
        position: 'absolute',
        right: '14px',
        top: '6px',
        fontSize: '11px',
        color: '#8c7358',
        whiteSpace: 'nowrap'
    });

    textLayer.append(title, hint);

    mapTextLayer = scene.add.dom(0, MAP_HIDDEN_Y, textLayer)
        .setOrigin(0)
        .setDepth(203)
        .setScrollFactor(0)
        .setVisible(false);

    mapTextLayer.pointerEvents = 'none';

    mapContainer = scene.add.container(
        0,
        MAP_HIDDEN_Y,
        [
            panel,
            mapImage
        ]
    )
    .setDepth(202)
    .setScrollFactor(0)
    .setVisible(false);
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

function redrawMap(scene) {
    const palette = getMapPalette(scene);
    const context = mapTexture.getContext();
    const image = context.createImageData(MAP_WIDTH, MAP_HEIGHT);
    const pixels = image.data;

    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const zoom = mapZoom;
    const viewWidth = Math.ceil(MAP_WIDTH / zoom);
    const viewHeight = Math.ceil(MAP_HEIGHT / zoom);
    const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);

    const plot = (x, y, color) => {
        if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;

        const index = (y * MAP_WIDTH + x) * 4;
        pixels[index] = (color >> 16) & 255;
        pixels[index + 1] = (color >> 8) & 255;
        pixels[index + 2] = color & 255;
        pixels[index + 3] = 255;
    };

    const marker = (tileX, tileY, width, height, color) => {
        const x = (tileX - originX) * zoom;
        const y = (tileY - originY) * zoom;
        const pixelWidth = width * zoom;
        const pixelHeight = height * zoom;

        for (let offsetY = -1; offsetY <= pixelHeight; offsetY++) {
            for (let offsetX = -1; offsetX <= pixelWidth; offsetX++) {
                const inside = offsetX >= 0 && offsetY >= 0 && offsetX < pixelWidth && offsetY < pixelHeight;
                plot(x + offsetX, y + offsetY, inside ? color : palette.outline);
            }
        }
    };

    for (let viewY = 0; viewY < viewHeight; viewY++) {
        for (let viewX = 0; viewX < viewWidth; viewX++) {
            const tileX = originX + viewX;
            const tileY = originY + viewY;
            const covering = isTileDiscovered(tileX, tileY) ? getPropCovering(tileX, tileY) : null;
            let color;

            if (!isTileDiscovered(tileX, tileY)) {
                color = -1;
            } else if (covering) {
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

            for (let offsetY = 0; offsetY < zoom; offsetY++) {
                for (let offsetX = 0; offsetX < zoom; offsetX++) {
                    const x = viewX * zoom + offsetX;
                    const y = viewY * zoom + offsetY;
                    plot(x, y, color === -1 ? palette.fog[(x + y) & 1] : color);
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

    context.putImageData(image, 0, 0);
    mapTexture.refresh();
}

function openMap(scene) {
    if (mapOpen || dialogueOpen || marketOpen || inventoryOpen || !mapContainer) {
        return;
    }

    mapOpen = true;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    mapPan.x = 0;
    mapPan.y = 0;
    mapDrag = null;
    redrawMap(scene);

    mapContainer
        .setVisible(true)
        .setY(MAP_HIDDEN_Y);

    mapTextLayer
        .setVisible(true)
        .setY(MAP_HIDDEN_Y);

    scene.tweens.killTweensOf(mapContainer);
    scene.tweens.killTweensOf(mapTextLayer);

    scene.tweens.add({
        targets: [mapContainer, mapTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });
}

function updateMapPan(scene, delta) {
    const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
        (characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
    const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
        (characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);

    if (panX || panY) {
        const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
        const beforeX = Math.round(mapPan.x);
        const beforeY = Math.round(mapPan.y);

        mapPan.x += panX * distance;
        mapPan.y += panY * distance;

        if (Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY) {
            mapDirty = true;
        }
    }

    if (mapDirty) {
        mapDirty = false;
        redrawMap(scene);
    }
}

function snapTweenTarget(tween, target) {
    target.y = Math.round(target.y);
}

function closeMap(scene) {
    if (!mapOpen) {
        return;
    }

    mapOpen = false;

    scene.tweens.killTweensOf(mapContainer);
    scene.tweens.killTweensOf(mapTextLayer);

    scene.tweens.add({
        targets: [mapContainer, mapTextLayer],
        y: MAP_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onUpdate: snapTweenTarget,
        onComplete: () => {
            if (!mapOpen) {
                mapContainer.setVisible(false);
                mapTextLayer.setVisible(false);
            }
        }
    });
}

function handleMapKey(scene, event) {
    const key = event.key.toLowerCase();

    if (key === 'm' || event.key === 'Escape') {
        closeMap(scene);
    }
}

function createInventoryUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, INVENTORY_HEIGHT)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, INVENTORY_HEIGHT - 2)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, INVENTORY_HEIGHT - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, INVENTORY_HEIGHT - 6)
        .fillStyle(0x465989, 1)
        .fillRect(12, 19, 296, 1)
        .fillRect(12, 127, 296, 1)
        .fillRect(159, 23, 1, 101);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: `${INVENTORY_HEIGHT}px`,
        fontFamily: 'm6x11, monospace',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none',
        color: '#c0a887',
        whiteSpace: 'nowrap'
    });

    const createText = (x, y, width, align) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: width ? `${width}px` : 'auto',
            textAlign: align || 'left'
        });

        textLayer.appendChild(text);
        return text;
    };

    const title = createText(14, 5);
    title.textContent = 'Fishpedia';
    title.style.color = '#acccf9';
    inventorySummaryText = createText(145, 5, 161, 'right');
    inventorySummaryText.style.fontSize = '11px';

    inventoryRowTexts = [];
    inventoryCountTexts = [];

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const column = Math.floor(index / 13);
        const row = index % 13;
        const x = 14 + column * 152;
        const y = 22 + row * 8;
        const name = createText(x, y, 84);
        const detail = createText(x + 84, y, 55, 'right');
        name.style.fontSize = '9px';
        name.style.lineHeight = '8px';
        detail.style.fontSize = '8px';
        detail.style.lineHeight = '8px';
        inventoryRowTexts.push(name);
        inventoryCountTexts.push(detail);
    }

    const footer = createText(12, 128, 296, 'center');
    footer.style.fontSize = '11px';
    footer.style.color = '#8c7358';
    inventoryNewGameText = footer;
    inventoryFooterHints = document.createElement('span');

    for (const [key, label] of [['I/Esc', 'Close'], ['N', 'New Game']]) {
        const keycap = document.createElement('span');
        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            margin: '0 4px 0 10px'
        });

        inventoryFooterHints.append(keycap, label);
    }

    inventoryContainer = scene.add.container(0, INVENTORY_HIDDEN_Y, [panel])
        .setDepth(203)
        .setScrollFactor(0)
        .setVisible(false);

    inventoryTextLayer = scene.add.dom(0, INVENTORY_HIDDEN_Y, textLayer)
        .setOrigin(0)
        .setDepth(204)
        .setScrollFactor(0)
        .setVisible(false);

    inventoryTextLayer.pointerEvents = 'none';
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
    if (inventoryOpen || mapOpen || marketOpen || dialogueOpen || !inventoryContainer) return;

    inventoryOpen = true;
    newGameConfirmUntil = 0;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    refreshInventoryUI(scene.time.now);

    inventoryContainer.setVisible(true).setY(INVENTORY_HIDDEN_Y);
    inventoryTextLayer.setVisible(true).setY(INVENTORY_HIDDEN_Y);
    scene.tweens.killTweensOf(inventoryContainer);
    scene.tweens.killTweensOf(inventoryTextLayer);
    scene.tweens.add({
        targets: [inventoryContainer, inventoryTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });
}

function closeInventory(scene) {
    if (!inventoryOpen) return;

    inventoryOpen = false;
    newGameConfirmUntil = 0;
    scene.tweens.killTweensOf(inventoryContainer);
    scene.tweens.killTweensOf(inventoryTextLayer);
    scene.tweens.add({
        targets: [inventoryContainer, inventoryTextLayer],
        y: INVENTORY_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onUpdate: snapTweenTarget,
        onComplete: () => {
            if (!inventoryOpen) {
                inventoryContainer.setVisible(false);
                inventoryTextLayer.setVisible(false);
            }
        }
    });
}

function handleInventoryKey(scene, event) {
    const key = event.key.toLowerCase();

    if (key === 'i' || event.key === 'Escape') {
        closeInventory(scene);
        return;
    }

    if (key !== 'n') return;

    if (scene.time.now < newGameConfirmUntil) {
        newGameResetting = true;
        saveDirty = false;
        localStorage.removeItem(SAVE_KEY);
        window.location.reload();
        return;
    }

    newGameConfirmUntil = scene.time.now + 2500;
    refreshInventoryUI(scene.time.now);
}

function createCatchCardUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(40, 0, 240, 30)
        .fillStyle(0xacccf9, 1)
        .fillRect(41, 1, 238, 28)
        .fillStyle(0x465989, 1)
        .fillRect(42, 2, 236, 26)
        .fillStyle(0x36160d, 1)
        .fillRect(43, 3, 234, 24);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: '30px',
        fontFamily: 'm6x11, monospace',
        textAlign: 'center',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
    });

    catchCardTitle = document.createElement('div');
    catchCardDetail = document.createElement('div');

    Object.assign(catchCardTitle.style, {
        position: 'absolute',
        top: '4px',
        left: '43px',
        width: '234px',
        color: '#e0f2fd',
        fontSize: '16px',
        lineHeight: '11px'
    });

    Object.assign(catchCardDetail.style, {
        position: 'absolute',
        top: '16px',
        left: '43px',
        width: '234px',
        color: '#e8c170',
        fontSize: '11px',
        lineHeight: '9px'
    });

    textLayer.append(catchCardTitle, catchCardDetail);

    catchCardContainer = scene.add.container(0, CATCH_CARD_Y + 8, [panel])
        .setDepth(205)
        .setScrollFactor(0)
        .setVisible(false);

    catchCardTextLayer = scene.add.dom(0, CATCH_CARD_Y + 8, textLayer)
        .setOrigin(0)
        .setDepth(206)
        .setScrollFactor(0)
        .setVisible(false);

    catchCardTextLayer.pointerEvents = 'none';
}

function showCatchCard(scene, time, species) {
    catchCardTitle.textContent = `You caught a ${species.name}!`;
    catchCardDetail.textContent = `${species.price}c`;
    catchCardUntil = time + CATCH_CARD_DURATION;
    itemLabelUntil = 0;

    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    scene.tweens.killTweensOf(catchCardContainer);
    scene.tweens.killTweensOf(catchCardTextLayer);

    for (const target of [catchCardContainer, catchCardTextLayer]) {
        target.setVisible(true).setY(CATCH_CARD_Y + 8);
    }

    scene.tweens.add({
        targets: [catchCardContainer, catchCardTextLayer],
        y: CATCH_CARD_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });

    catchCardHideEvent = scene.time.delayedCall(CATCH_CARD_DURATION - 180, () => {
        scene.tweens.add({
            targets: [catchCardContainer, catchCardTextLayer],
            y: CATCH_CARD_Y + 8,
            duration: 180,
            ease: 'Cubic.In',
            onUpdate: snapTweenTarget,
            onComplete: () => {
                catchCardContainer.setVisible(false);
                catchCardTextLayer.setVisible(false);
            }
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

    interactionPromptLayer = scene.add.dom(0, PROMPT_Y, wrapper)
        .setOrigin(0)
        .setDepth(103)
        .setScrollFactor(0)
        .setVisible(false);

    interactionPromptLayer.pointerEvents = 'none';
}

function updateInteractionPrompt(scene, guideIsNear) {
    if (!interactionPromptLayer || !marketPrompt || !guidePrompt) return;

    const available = !dialogueOpen && !marketOpen && !mapOpen && !inventoryOpen && scene.time.now >= catchCardUntil;
    const target = available && (guideIsNear || isMarketNear())
        ? getInteractionTarget(guideHasMetPlayer)
        : null;
    const showMarket = target === 'market';
    const showGuide = target === 'guide';
    const showItem = available && !target && scene.time.now < itemLabelUntil;

    const state = (showMarket ? 1 : 0) | (showGuide ? 2 : 0) | (showItem ? 4 : 0);

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
            onComplete: () => {
                if (promptState === 0) {
                    interactionPromptLayer.setVisible(false);
                }
            }
        });
        return;
    }

    marketPrompt.style.display = showMarket ? 'flex' : 'none';
    guidePrompt.style.display = showGuide ? 'flex' : 'none';
    itemPrompt.style.display = showItem ? 'flex' : 'none';
    interactionPromptLayer.setVisible(true);

    if (!wasShowing) {
        promptMotion.value = 0;
    }

    applyPromptMotion();
    scene.tweens.add({
        targets: promptMotion,
        value: 1,
        duration: 140,
        ease: 'Cubic.Out',
        onUpdate: applyPromptMotion
    });
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

    marketRodImages = MARKET_RODS.map((rod, index) => {
        return scene.add.image(MARKET_LIST_X + 3, MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 2, rod.icon)
            .setOrigin(0)
            .setDisplaySize(16, 16);
    });

    marketDetailImage = scene.add.image(
        MARKET_DETAIL_X + 50,
        MARKET_LIST_Y + 4,
        MARKET_RODS[0].texture
    )
        .setOrigin(0)
        .setDisplaySize(31, 32);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: `${MARKET_HEIGHT}px`,
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
    });

    const createText = (x, y, color, width, align, size) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: width ? `${width}px` : 'auto',
            textAlign: align || 'left',
            fontSize: size ? `${size}px` : '',
            color,
            whiteSpace: 'nowrap'
        });

        textLayer.appendChild(text);
        return text;
    };

    createText(14, 5, '#acccf9').textContent = 'Rod Shop';
    marketMessageText = createText(160, 5, '#e8c170', 146, 'right');

    marketOptionTexts = [];
    marketPriceTexts = [];

    for (let index = 0; index < MARKET_ROW_COUNT; index++) {
        const rowY = MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 6;
        const isAction = index >= MARKET_RODS.length;

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

    const footer = createText(12, MARKET_FOOTER_Y, '#8c7358', 296, 'center', 11);

    Object.assign(footer.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
    });

    for (const [key, label] of [['W/S', 'Select'], ['Enter', 'Buy'], ['E', 'Close']]) {
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

    marketContainer = scene.add.container(
        0,
        MARKET_HIDDEN_Y,
        [
            panel,
            marketHighlight,
            ...marketRodImages,
            marketDetailImage
        ]
    )
    .setDepth(203)
    .setScrollFactor(0)
    .setVisible(false);

    marketTextLayer = scene.add.dom(
        0,
        MARKET_HIDDEN_Y,
        textLayer
    )
    .setOrigin(0)
    .setDepth(204)
    .setScrollFactor(0)
    .setVisible(false);

    marketTextLayer.pointerEvents = 'none';

    refreshMarketOptions();
}

function addHotbarItem(scene, textureKey, name) {
    const slot = hotbarItemImages.length;

    if (slot >= 9) {
        return;
    }

    hotbarItemNames[slot] = name;

    const centerX = HOTBAR_X + slot * HOTBAR_SLOT_SIZE + 13;
    const centerY = HOTBAR_Y + 13;
    const image = scene.add.image(centerX, centerY, textureKey)
        .setDepth(100.5)
        .setScrollFactor(0)
        .setDisplaySize(16, 16)
        .setPosition(centerX, centerY + 2);
    hotbarItemImages.push(image);

    scene.tweens.add({
        targets: image,
        y: centerY,
        duration: 140,
        ease: 'Quad.Out',
        onUpdate: snapTweenTarget
    });
}

function getMarketRowAt(x, y) {
    const localY = y - DIALOGUE_VISIBLE_Y - MARKET_LIST_Y;
    const row = Math.floor(localY / MARKET_ROW_HEIGHT);

    if (
        x < MARKET_LIST_X ||
        x >= MARKET_LIST_X + MARKET_LIST_WIDTH ||
        localY < 0 ||
        row >= MARKET_ROW_COUNT ||
        localY - row * MARKET_ROW_HEIGHT >= MARKET_ROW_HEIGHT - 2
    ) {
        return -1;
    }

    return row;
}

function getDialogueOptionAt(x, y) {
    const option = Math.floor((y - DIALOGUE_VISIBLE_Y - DIALOGUE_OPTION_TOP) / DIALOGUE_OPTION_STEP);

    if (
        x < DIALOGUE_OPTION_X - 3 ||
        x >= DIALOGUE_OPTION_X - 3 + DIALOGUE_OPTION_WIDTH ||
        option < 0 ||
        option >= GUIDE_DIALOGUE[dialogueNode].options.length
    ) {
        return -1;
    }

    return option;
}

function getMarketRodStatus(rod) {
    if (ownedRods.has(rod.id)) {
        return { text: 'Owned', color: '#8fbf7a' };
    }

    if (playerCoins < rod.price) {
        return { text: `Need ${rod.price - playerCoins}c more`, color: '#d9745b' };
    }

    return { text: `${rod.price}c`, color: '#e8c170' };
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

function refreshMarketOptions() {
    if (!marketMessageText) {
        return;
    }

    marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
    marketHighlight.setY(MARKET_LIST_Y + selectedMarketOption * MARKET_ROW_HEIGHT);

    MARKET_RODS.forEach((rod, index) => {
        const selected = index === selectedMarketOption;
        const owned = ownedRods.has(rod.id);
        const affordable = playerCoins >= rod.price;
        const priceText = marketPriceTexts[index];

        marketOptionTexts[index].textContent = rod.label;
        marketOptionTexts[index].style.color = selected ? '#e0f2fd' : owned ? '#7a6450' : '#c0a887';
        priceText.textContent = owned ? 'Owned' : `${rod.price}c`;
        priceText.style.color = owned ? '#8fbf7a' : affordable ? '#e8c170' : '#9a5a47';
        if (owned) marketRodImages[index].setTint(OWNED_ROD_TINT); else marketRodImages[index].clearTint();
    });

    const sellSummary = getFishInventorySummary();
    const sellText = marketOptionTexts[MARKET_SELL_INDEX];
    const exitText = marketOptionTexts[MARKET_EXIT_INDEX];

    sellText.textContent = 'Sell fish';
    sellText.style.color = MARKET_SELL_INDEX === selectedMarketOption ? '#e0f2fd' : '#c0a887';
    exitText.textContent = 'Leave';
    exitText.style.color = MARKET_EXIT_INDEX === selectedMarketOption ? '#e0f2fd' : '#c0a887';

    const rod = MARKET_RODS[selectedMarketOption];

    if (!rod) {
        marketDetailImage.setVisible(false);

        if (selectedMarketOption === MARKET_SELL_INDEX) {
            marketDetailName.textContent = 'Sell fish';
            marketDetailStatus.textContent = sellSummary.count
                ? `${sellSummary.count} fish · ${sellSummary.value}c`
                : 'No fish to sell';
            marketDetailStatus.style.color = sellSummary.count ? '#e8c170' : '#c0a887';
            marketDetailAction.textContent = marketFeedback
                ? marketFeedback.text
                : sellSummary.count ? 'Enter - Sell all' : '';
            marketDetailAction.style.color = marketFeedback ? marketFeedback.color : '#acccf9';
        } else {
            marketDetailName.textContent = 'Leave shop';
            marketDetailStatus.textContent = '';
            marketDetailAction.textContent = 'Enter - Leave';
            marketDetailAction.style.color = '#acccf9';
        }

        return;
    }

    const status = getMarketRodStatus(rod);

    marketDetailImage
        .setTexture(rod.texture)
        .setVisible(true)
        .setTint(ownedRods.has(rod.id) ? OWNED_ROD_TINT : 0xffffff);
    marketDetailName.textContent = rod.label;
    marketDetailStatus.textContent = status.text;
    marketDetailStatus.style.color = status.color;

    if (marketFeedback) {
        marketDetailAction.textContent = marketFeedback.text;
        marketDetailAction.style.color = marketFeedback.color;
    } else if (ownedRods.has(rod.id) || playerCoins < rod.price) {
        marketDetailAction.textContent = '';
    } else {
        marketDetailAction.textContent = 'Enter - Buy';
        marketDetailAction.style.color = '#acccf9';
    }
}

function buySelectedMarketItem(scene) {
    if (selectedMarketOption === MARKET_EXIT_INDEX) {
        closeMarket(scene);
        return;
    }

    if (selectedMarketOption === MARKET_SELL_INDEX) {
        const summary = getFishInventorySummary();

        if (!summary.count) return;

        playerCoins += summary.value;
        fishInventory.clear();
        saveDirty = true;
        marketFeedback = { text: `Sold for ${summary.value}c!`, color: '#8fbf7a' };

        scene.tweens.killTweensOf(coinDisplay);
        scene.tweens.add({
            targets: coinDisplay,
            value: playerCoins,
            duration: 260,
            ease: 'Quad.Out',
            onUpdate: () => {
                marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
            }
        });

        refreshMarketOptions();
        return;
    }

    const rod = MARKET_RODS[selectedMarketOption];

    if (ownedRods.has(rod.id) || playerCoins < rod.price) {
        return;
    }

    playerCoins -= rod.price;
    ownedRods.add(rod.id);
    saveDirty = true;

    scene.tweens.killTweensOf(coinDisplay);
    scene.tweens.add({
        targets: coinDisplay,
        value: playerCoins,
        duration: 260,
        ease: 'Quad.Out',
        onUpdate: () => {
            marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
        }
    });
    addHotbarItem(scene, rod.icon, rod.label);
    marketFeedback = { text: 'Purchased!', color: '#8fbf7a' };

    refreshMarketOptions();
}

function moveMarketSelection(amount) {
    selectedMarketOption = Phaser.Math.Wrap(
        selectedMarketOption + amount,
        0,
        MARKET_ROW_COUNT
    );
    marketFeedback = null;

    refreshMarketOptions();
}

function openMarket(scene) {
    if (
        marketOpen ||
        mapOpen ||
        dialogueOpen ||
        inventoryOpen ||
        !marketContainer ||
        !marketTextLayer ||
        !isMarketNear()
    ) {
        return;
    }

    marketOpen = true;
    selectedMarketOption = 0;
    marketFeedback = null;
    coinDisplay.value = playerCoins;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    refreshMarketOptions();

    marketContainer
        .setVisible(true)
        .setY(MARKET_HIDDEN_Y);

    marketTextLayer
        .setVisible(true)
        .setY(MARKET_HIDDEN_Y);

    scene.tweens.killTweensOf(marketContainer);
    scene.tweens.killTweensOf(marketTextLayer);

    scene.tweens.add({
        targets: [marketContainer, marketTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });
}

function closeMarket(scene) {
    if (!marketOpen) {
        return;
    }

    marketOpen = false;

    scene.tweens.killTweensOf(marketContainer);
    scene.tweens.killTweensOf(marketTextLayer);

    scene.tweens.add({
        targets: [marketContainer, marketTextLayer],
        y: MARKET_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onUpdate: snapTweenTarget,
        onComplete: () => {
            if (!marketOpen) {
                marketContainer.setVisible(false);
                marketTextLayer.setVisible(false);
            }
        }
    });
}

function handleMarketKey(scene, event) {
    const key = event.key.toLowerCase();

    if (
        key === 'w' ||
        event.key === 'ArrowUp'
    ) {
        moveMarketSelection(-1);
        return;
    }

    if (
        key === 's' ||
        event.key === 'ArrowDown'
    ) {
        moveMarketSelection(1);
        return;
    }

    if (
        event.key === 'Enter' ||
        event.code === 'Space'
    ) {
        buySelectedMarketItem(scene);
        return;
    }

    if (key === 'e' || event.key === 'Escape') {
        closeMarket(scene);
    }
}

function getMarketReach() {
    if (!store) {
        return Infinity;
    }

    const x = character.x + CHARACTER_SIZE / 2 - store.x - STORE_WIDTH / 2;
    const y = character.y + CHARACTER_SIZE / 2 - store.y - STORE_HEIGHT / 2;

    return (x * x + y * y) / MARKET_INTERACTION_DISTANCE_SQUARED;
}

function getGuideReach() {
    if (!guide) {
        return Infinity;
    }

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
    const x = pointer.worldX;
    const y = pointer.worldY;

    if (
        guide && isGuideNear() &&
        x >= guide.x && x < guide.x + GUIDE_SIZE &&
        y >= guide.y && y < guide.y + GUIDE_SIZE
    ) {
        return 'guide';
    }

    if (
        store && isMarketNear() &&
        x >= store.x && x < store.x + STORE_WIDTH &&
        y >= store.y && y < store.y + STORE_HEIGHT
    ) {
        return 'market';
    }

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

function getInteractionTarget(guideAvailable) {
    const guideReach = guideAvailable ? getGuideReach() : Infinity;
    const marketReach = getMarketReach();

    if (guideReach >= 1 && marketReach >= 1) {
        return null;
    }

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
        
        if (!option) {
            optionText.style.display = 'none';
            return;
        }

        optionText.style.display = 'block';
        optionText.textContent = option.label;
        optionText.style.color = index === selectedDialogueOption
            ? '#e0f2fd'
            : '#c0a887';
    });

    dialogueHighlight.setY(DIALOGUE_OPTION_TOP + selectedDialogueOption * DIALOGUE_OPTION_STEP);
}

function finishGuideDialogueText() {
    if (!dialogueTypingEvent) {
        return false;
    }

    dialogueTypingEvent.remove(false);
    dialogueTypingEvent = null;
    dialogueText.textContent = dialogueFullText;

    return true;
}

function showGuideDialogueNode(scene, nodeKey) {
    if (dialogueTypingEvent) {
        dialogueTypingEvent.remove(false);
        dialogueTypingEvent = null;
    }

    dialogueNode = nodeKey;
    selectedDialogueOption = 0;
    const node = GUIDE_DIALOGUE[nodeKey];
    dialogueFullText = node.text;
    dialoguePortrait.setTexture(node.portrait);

    dialogueText.textContent = '';
    refreshGuideDialogueOptions();

    let characterIndex = 0;

    dialogueTypingEvent = scene.time.addEvent({
        delay: 24,
        repeat: dialogueFullText.length - 1,
        callback: () => {
            characterIndex += 1;

            dialogueText.textContent = dialogueFullText.slice(
                0,
                characterIndex
            );

            if (characterIndex === dialogueFullText.length) {
                dialogueTypingEvent = null;
            }
        }
    });
}

function openGuideDialogue(scene) {
    if (
        marketOpen ||
        mapOpen ||
        dialogueOpen ||
        inventoryOpen ||
        !guide ||
        !dialogueContainer ||
        !dialogueTextLayer
    ) {
        return;
    }

    dialogueOpen = true;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    dialogueContainer
        .setVisible(true)
        .setY(DIALOGUE_HIDDEN_Y);

    dialogueTextLayer
        .setVisible(true)
        .setY(DIALOGUE_HIDDEN_Y);

    scene.tweens.killTweensOf(dialogueContainer);
    scene.tweens.killTweensOf(dialogueTextLayer);

    scene.tweens.add({
        targets: [dialogueContainer, dialogueTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });

    showGuideDialogueNode(scene, 'intro');
}

function closeGuideDialogue(scene) {
    if (!dialogueOpen) {
        return;
    }

    dialogueOpen = false;
    guideHasMetPlayer = true;
    saveDirty = true;

    if (dialogueTypingEvent) {
        dialogueTypingEvent.remove(false);
        dialogueTypingEvent = null;
    }

    scene.tweens.killTweensOf(dialogueContainer);
    scene.tweens.killTweensOf(dialogueTextLayer);

    scene.tweens.add({
        targets: [dialogueContainer, dialogueTextLayer],
        y: DIALOGUE_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onUpdate: snapTweenTarget,
        onComplete: () => {
            if (!dialogueOpen) {
                dialogueContainer.setVisible(false);
                dialogueTextLayer.setVisible(false);
            }
        }
    });
}

function selectGuideDialogueOption(scene) {
    if (finishGuideDialogueText()) {
        return;
    }

    const option =
        GUIDE_DIALOGUE[dialogueNode]
            .options[selectedDialogueOption];

    if (option.close) {
        closeGuideDialogue(scene);
        return;
    }

    showGuideDialogueNode(
        scene,
        option.next
    );
}

function moveGuideDialogueSelection(amount) {
    const options =
        GUIDE_DIALOGUE[dialogueNode].options;

    selectedDialogueOption =
        Phaser.Math.Wrap(
            selectedDialogueOption + amount,
            0,
            options.length
        );

    refreshGuideDialogueOptions();
}

function handleGuideDialogueKey(scene, event) {
    const key = event.key.toLowerCase();

    if (
        key === 'w' ||
        event.key === 'ArrowUp'
    ) {
        moveGuideDialogueSelection(-1);
        return;
    }

    if (
        key === 's' ||
        event.key === 'ArrowDown'
    ) {
        moveGuideDialogueSelection(1);
        return;
    }

    if (
        event.key === 'Enter' ||
        event.code === 'Space' ||
        key === 'e'
    ) {
        selectGuideDialogueOption(scene);
        return;
    }

    if (event.key === 'Escape') {
        closeGuideDialogue(scene);
    }
}

function updateGuideInteraction(scene, guideIsNear) {
    if (
        guideIsNear &&
        !guideWasNear &&
        !guideHasMetPlayer &&
        !dialogueOpen &&
        !mapOpen &&
        !marketOpen &&
        !inventoryOpen
    ) {
        openGuideDialogue(scene);
    }

    guideWasNear = guideIsNear;
}
