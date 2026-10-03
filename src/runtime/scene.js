function create() {
    unpackAtlas(this);
    this.textureSourceCache = new Map();
    this.terrainPixelCache = new Map();
    this.terrainSurfaceCache = new Map();
    this.shorelineTileCache = new Map();
    shadowLayer = this.add.layer().setDepth(2.5);
    worldObjectLayer = this.add.layer().setDepth(3);
    waterPipeline = this.game.renderer.pipelines.add('WaterWarp', new WaterWarpPipeline(this.game));
    buildShadowLut(this);
    createPropArt(this);
    createBushSlices(this);
    createRoundedCliffTextures(this);
    createShimmerSheet(this);
    extractRodArtStyles(this);
    createChestSilhouette(this);

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    createCharacterShadow(this);
    fishingLine = this.add.graphics();
    worldObjectLayer.add(fishingLine);
    const catchZoneTexture = this.textures.get('fishing-catch-zone');
    const hudImage = (key, frame, depth, origin = 0) => this.add.image(0, 0, key, frame)
        .setOrigin(origin).setDepth(depth).setScrollFactor(0).setVisible(false);

    catchZoneTexture.add('top', 0, 0, 0, 8, 3);
    catchZoneTexture.add('middle', 0, 0, 3, 8, 2);
    catchZoneTexture.add('bottom', 0, 0, 5, 8, 3);
    fishingUiPanel = hudImage('fishing-ui', undefined, 220).setPosition(FISHING_GAME_X, FISHING_GAME_Y);
    fishingCatchZoneTop = hudImage('fishing-catch-zone', 'top', 221);
    fishingCatchZoneMiddle = hudImage('fishing-catch-zone', 'middle', 221);
    fishingCatchZoneBottom = hudImage('fishing-catch-zone', 'bottom', 221);
    fishingFishMarker = hudImage('fishing-fish', undefined, 222, 0.5);
    fishingProgressFill = hudImage('fishing-progress', undefined, 221);
    fishingUiParts = [fishingUiPanel, fishingCatchZoneTop, fishingCatchZoneMiddle, fishingCatchZoneBottom, fishingFishMarker, fishingProgressFill];

    character = this.add.sprite(0, 0, 'character-front')
        .setOrigin(0)
        .setDepth(CHARACTER_SIZE);
    worldObjectLayer.add(character);

    characterKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
        downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
        leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
        rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    this.add.image(HOTBAR_X, HOTBAR_Y, 'hotbar')
        .setOrigin(0)
        .setDepth(100)
        .setScrollFactor(0);

    hotbarSelector = this.add.image(
        HOTBAR_X - 2,
        HOTBAR_Y - 3,
        'selected'
    )
        .setOrigin(0)
        .setDepth(101)
        .setScrollFactor(0);

    createBaitSlotUI(this);

    const selectHotBarSlot = (slot, immediate = false) => {
        selectedHotbarSlot = Phaser.Math.Wrap(slot, 0, 9);

        this.tweens.killTweensOf(hotbarSelector);
        const selectorX = HOTBAR_X - 2 + selectedHotbarSlot * HOTBAR_SLOT_SIZE;

        if (immediate) {
            hotbarSelector.x = selectorX;
        } else {
            this.tweens.add({
                targets: hotbarSelector,
                x: selectorX,
                duration: 70,
                ease: 'Quad.Out',
                onUpdate: (tween, target) => {
                    target.x = Math.round(target.x);
                }
            });
        }

        const name = hotbarItemNames[selectedHotbarSlot];

        if (name) {
            showItemLabel(this, name);
        } else {
            itemLabelUntil = 0;
        }
    };

    this.input.on('pointermove', pointer => {
        if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);

            if (row !== -1 && row !== selectedMarketOption) {
                selectedMarketOption = row;
                marketFeedback = null;
                refreshMarketOptions();
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option !== -1 && option !== selectedDialogueOption) {
                selectedDialogueOption = option;
                refreshGuideDialogueOptions();
            }
        } else if (mapOpen && mapDrag && pointer.isDown) {
            mapPan.x = mapDrag.panX + Math.round((mapDrag.x - pointer.x) / mapZoom);
            mapPan.y = mapDrag.panY + Math.round((mapDrag.y - pointer.y) / mapZoom);
            mapDirty = true;
        }

        this.input.setDefaultCursor(!isMenuOpen() && getClickedWorldTarget(pointer) ? 'pointer' : 'default');
    });

    const releaseAction = () => {
        fishingActionHeld = false;
        releaseCast(this.time.now);
    };

    const pressAction = () => {
        fishingActionHeld = true;
        beginCast(this.time.now);
    };

    this.input.on('pointerup', () => {
        mapDrag = null;
        releaseAction();
    });

    this.input.keyboard.on('keyup', event => event.code === 'Space' && releaseAction());

    this.input.on('pointerdown', pointer => {
        if (inventoryOpen) {
            if (pointer.y > DIALOGUE_VISIBLE_Y + INVENTORY_HEIGHT) closeInventory(this);
        } else if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);
            const tab = getMarketTabAt(pointer.x, pointer.y);

            if (tab !== -1) {
                setMarketPage(tab);
            } else if (row !== -1) {
                selectedMarketOption = row;
                buySelectedMarketItem(this);
            } else if (pointer.y > DIALOGUE_VISIBLE_Y + MARKET_HEIGHT) {
                closeMarket(this);
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option === -1) {
                finishGuideDialogueText();
            } else {
                selectedDialogueOption = option;
                selectGuideDialogueOption(this);
            }
        } else if (!mapOpen) {
            const target = getClickedWorldTarget(pointer);

            if (target) {
                openInteraction(this, target);
            } else if (isBaitSlotAt(pointer.x, pointer.y)) {
                cycleBait(this);
            } else {
                pressAction();
            }
        } else if (pointer.y < DIALOGUE_VISIBLE_Y + MAP_PANEL_HEIGHT) {
            mapDrag = { x: pointer.x, y: pointer.y, panX: mapPan.x, panY: mapPan.y };
        } else {
            closeMap(this);
        }
    });

    this.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        const step = Math.sign(deltaY);

        if (!step || inventoryOpen) return;

        if (isMenuOpen()) {
            if (pointer.event.timeStamp - lastMenuWheelTime < 120) return;
            lastMenuWheelTime = pointer.event.timeStamp;
        }

        if (mapOpen) {
            const zoom = Phaser.Math.Clamp(mapZoom - step, 1, MAP_MAX_ZOOM);
            mapDirty ||= zoom !== mapZoom;
            mapZoom = zoom;
        } else if (marketOpen) {
            moveMarketSelection(step);
        } else if (dialogueOpen) {
            moveGuideDialogueSelection(step);
        } else {
            selectHotBarSlot(selectedHotbarSlot + step, true);
        }
    });

    this.input.keyboard.on('keydown', event => {
        if (event.repeat) return;

        const code = event.code;
        const key = event.key.toLowerCase();
        const slot = Number(event.key) - 1;

        if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
        if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
        if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
        if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;

        if (dialogueOpen) handleGuideDialogueKey(this, event);
        else if (inventoryOpen) handleInventoryKey(this, event);
        else if (mapOpen) handleMapKey(this, event);
        else if (marketOpen) handleMarketKey(this, event);
        else if (key === 'i') openInventory(this);
        else if (code === 'Space') pressAction();
        else if (key === 'm') openMap(this);
        else if (key === 'b') cycleBait(this);
        else if (key === 'e') openInteraction(this, getInteractionTarget(true));
        else if (CHEATS_ENABLED && key === 's') spawnSturgeonAtCursor(this);
        else if (slot >= 0 && slot < 9) selectHotBarSlot(slot);
    });

    mainCamera = this.cameras.main;

    mainCamera.setZoom(1);
    mainCamera.removeBounds();
    mainCamera.setRoundPixels(true);

    cameraScrollX = mainCamera.scrollX;
    cameraScrollY = mainCamera.scrollY;

    spawnGuideAndStore(this);
    updateLoadedChunks(this, true);
    createGuideDialogueUI(this);
    createMapUI(this);
    createMarketUI(this);
    createInventoryUI(this);
    createCatchCardUI(this);
    createInteractionPromptUI(this);
    if (TEST_MODE) {
        try {
            window.PIXCATION_TEST_RESULTS = runAutomatedTests(this);
        } catch (error) {
            window.PIXCATION_TEST_RESULTS = {
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                results: []
            };
        }
        document.documentElement.dataset.testResults = JSON.stringify(window.PIXCATION_TEST_RESULTS);
    } else {
        loadProgress(this);
    }

    for (let index = 0; index < 20; index++) {
        spawnShimmer(this);
    }

    this.time.addEvent({
        delay: 320,
        callback: () => spawnShimmer(this),
        loop: true
    });

    if (!TEST_MODE) {
        this.time.addEvent({
            delay: 2000,
            callback: saveProgress,
            loop: true
        });
    }
}
