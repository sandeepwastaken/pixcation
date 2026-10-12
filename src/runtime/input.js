function bindGameInput(scene) {
    const heldActions = new Set();
    let cursor = null;
    const setCursor = nextCursor => {
        if (nextCursor === cursor) return;
        scene.input.setDefaultCursor(nextCursor);
        cursor = nextCursor;
    };
    const openMenu = open => { setCursor('default'); open(); };
    scene.input.on('pointermove', pointer => {
        if (newGameChoice?.open) { setCursor(pointer.x >= 48 && pointer.x < 272 && ((pointer.y >= 68 && pointer.y < 85) || (pointer.y >= 130 && pointer.y < 150)) ? 'pointer' : 'default'); return; }
        if (startup) {
            setCursor(startup.phase === 'title' && isStartButtonAt(pointer.x, pointer.y) ? 'pointer' : 'default');
            return;
        }
        const menuOpen = isMenuOpen();
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
            const beforeX = Math.round(mapPan.x);
            const beforeY = Math.round(mapPan.y);
            mapPan.x = mapDrag.panX + Math.round((mapDrag.x - pointer.x) / mapZoom);
            mapPan.y = mapDrag.panY + Math.round((mapDrag.y - pointer.y) / mapZoom);
            mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;
        }

        const overStats = (!menuOpen || statsOpen) && isStatsButtonAt(pointer.x, pointer.y);
        const overActor = !menuOpen && getClickedWorldTarget(pointer);
        setCursor(overStats || overActor ? 'pointer' : 'default');
    });

    const releaseAction = source => {
        if (!heldActions.delete(source)) return;
        fishingActionHeld = heldActions.size > 0;
        if (!fishingActionHeld) releaseCast(scene.time.now);
    };

    const pressAction = source => {
        if (interior) return;
        if (catchCardUntil === Infinity) hideCatchCard(scene);
        const wasHeld = heldActions.size > 0;
        heldActions.add(source);
        fishingActionHeld = true;
        if (!wasHeld) beginCast(scene.time.now);
    };

    const resetActions = () => {
        heldActions.clear();
        fishingActionHeld = false;
        castCharge = null;
        mapDrag = null;
        lastPlayTime = null;
    };
    const resetPlayClock = () => { lastPlayTime = null; };
    scene.game.events.on(Phaser.Core.Events.BLUR, resetActions);
    document.addEventListener('visibilitychange', resetActions);
    scene.game.events.on(Phaser.Core.Events.FOCUS, resetPlayClock);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.game.events.off(Phaser.Core.Events.BLUR, resetActions);
        document.removeEventListener('visibilitychange', resetActions);
        scene.game.events.off(Phaser.Core.Events.FOCUS, resetPlayClock);
        resetActions();
    });

    const releasePointer = pointer => {
        if (pointer.button !== 0) return;
        mapDrag = null;
        releaseAction('pointer');
    };
    scene.input.on('pointerup', releasePointer);
    scene.input.on('pointerupoutside', releasePointer);

    scene.input.keyboard.on('keyup', event => event.code === 'Space' && releaseAction('keyboard'));

    scene.input.on('pointerdown', pointer => {
        if (pointer.button !== 0) return;
        if (spawnReturn) return;
        if (newGameChoice?.open) { setCursor('default'); handleNewGameChoicePointer(pointer); return; }
        if (startup) {
            if (isStartButtonAt(pointer.x, pointer.y)) { setCursor('default'); beginStartup(scene.time.now); }
            return;
        }
        if (statsOpen) {
            if (pointer.x < 32 || pointer.x >= 288 || pointer.y < 24 || pointer.y >= 168) closeStats();
            return;
        }
        if (!isMenuOpen() && isStatsButtonAt(pointer.x, pointer.y)) {
            openMenu(openStats);
            return;
        }
        if (inventoryOpen) {
            const entry = getFishpediaRowAt(pointer.x, pointer.y);
            if (entry !== -1) selectFishpediaEntry(entry);
            else if (pointer.y > DIALOGUE_VISIBLE_Y + INVENTORY_HEIGHT) closeInventory(scene);
        } else if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);
            const tab = getMarketTabAt(pointer.x, pointer.y);

            if (tab !== -1) {
                setMarketPage(tab);
            } else if (row !== -1) {
                selectedMarketOption = row;
                buySelectedMarketItem(scene);
            } else if (pointer.y > DIALOGUE_VISIBLE_Y + MARKET_HEIGHT) {
                closeMarket(scene);
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option === -1) {
                finishGuideDialogueText();
            } else {
                selectedDialogueOption = option;
                selectGuideDialogueOption(scene);
            }
        } else if (!mapOpen) {
            const target = getClickedWorldTarget(pointer);

            if (target) {
                openMenu(() => openInteraction(scene, target));
            } else if (isBaitSlotAt(pointer.x, pointer.y)) {
                cycleBait(scene);
            } else {
                pressAction('pointer');
            }
        } else if (pointer.y < DIALOGUE_VISIBLE_Y + MAP_PANEL_HEIGHT) {
            mapDrag = { x: pointer.x, y: pointer.y, panX: mapPan.x, panY: mapPan.y };
        } else {
            closeMap(scene);
        }
    });

    scene.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        if (newGameChoice?.open) return;
        const step = Math.sign(deltaY);

        if (!step || inventoryOpen || startup || statsOpen) return;

        if (isMenuOpen()) {
            if (pointer.event.timeStamp - lastMenuWheelTime < 120) return;
            lastMenuWheelTime = pointer.event.timeStamp;
        }

        if (mapOpen) {
            const zoom = Phaser.Math.Clamp(mapZoom - step, 1, MAP_MAX_ZOOM);
            mapDirty ||= zoom !== mapZoom;
            if (zoom !== mapZoom) mapDrag = null;
            mapZoom = zoom;
        } else if (marketOpen) {
            moveMarketSelection(step);
        } else if (dialogueOpen) {
            moveGuideDialogueSelection(step);
        } else {
            selectHotbarSlot(scene, selectedHotbarSlot + step, true);
        }
    });

    scene.input.keyboard.on('keydown', event => {
        if (newGameChoice?.open) { setCursor('default'); handleNewGameChoiceKey(event); return; }
        if (event.code === 'Tab' || event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
        if (event.repeat) return;
        if (spawnReturn) return;
        if (startup) {
            if (event.code === 'Enter' || event.code === 'Space') { setCursor('default'); beginStartup(scene.time.now); }
            return;
        }

        const code = event.code;
        const key = event.key.toLowerCase();
        const slot = Number(event.key) - 1;

        if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
        if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
        if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
        if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;

        if (code === 'Enter' && !isMenuOpen() && hideCatchCard(scene)) return;
        if (statsOpen) {
            if (code === 'Escape' || code === 'Tab') closeStats();
        } else if (dialogueOpen) handleGuideDialogueKey(scene, event);
        else if (inventoryOpen) handleInventoryKey(scene, event);
        else if (mapOpen && code !== 'KeyH') handleMapKey(scene, event);
        else if (marketOpen) handleMarketKey(scene, event);
        else if (key === 'i') openMenu(() => openInventory(scene));
        else if (code === 'Tab') openMenu(openStats);
        else if (code === 'Space') pressAction('keyboard');
        else if (key === 'm') openMenu(() => openMap(scene));
        else if (key === 'b') cycleBait(scene);
        else if (code === 'KeyH') { closeMap(scene); leaveInterior(); resetActions(); returnToSpawn(scene); }
        else if (key === 'e') openMenu(() => interior ? talkToInteriorNpc(scene) : openInteraction(scene, getInteractionTarget(true)));
        else if (CHEATS_ENABLED && key === 's') spawnSturgeonAtCursor(scene);
        else if (slot >= 0 && slot < 9) selectHotbarSlot(scene, slot);
    });
}
