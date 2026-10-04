function bindGameInput(scene) {
    const heldActions = new Set();
    let cursor = null;
    const setCursor = nextCursor => {
        if (nextCursor === cursor) return;
        scene.input.setDefaultCursor(nextCursor);
        cursor = nextCursor;
    };
    scene.input.on('pointermove', pointer => {
        if (startup) {
            setCursor(startup.phase === 'title' && pointer.x >= 112 && pointer.x < 208 && pointer.y >= 124 && pointer.y < 144 ? 'pointer' : 'default');
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
    scene.game.events.on(Phaser.Core.Events.FOCUS, resetPlayClock);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.game.events.off(Phaser.Core.Events.BLUR, resetActions);
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
        if (startup) {
            if (pointer.x >= 112 && pointer.x < 208 && pointer.y >= 124 && pointer.y < 144) beginStartup(scene.time.now);
            return;
        }
        if (statsOpen) {
            if (pointer.x < 32 || pointer.x >= 288 || pointer.y < 24 || pointer.y >= 168) closeStats();
            return;
        }
        if (!isMenuOpen() && isStatsButtonAt(pointer.x, pointer.y)) {
            openStats();
            return;
        }
        if (inventoryOpen) {
            if (pointer.y > DIALOGUE_VISIBLE_Y + INVENTORY_HEIGHT) closeInventory(scene);
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
                openInteraction(scene, target);
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
        if (event.repeat) return;
        if (startup) {
            if (event.code === 'Enter' || event.code === 'Space') beginStartup(scene.time.now);
            return;
        }

        const code = event.code;
        const key = event.key.toLowerCase();
        const slot = Number(event.key) - 1;
        if (code === 'Tab') event.preventDefault();

        if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
        if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
        if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
        if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;

        if (statsOpen) {
            if (code === 'Escape' || code === 'Tab') closeStats();
        } else if (dialogueOpen) handleGuideDialogueKey(scene, event);
        else if (inventoryOpen) handleInventoryKey(scene, event);
        else if (mapOpen) handleMapKey(scene, event);
        else if (marketOpen) handleMarketKey(scene, event);
        else if (key === 'i') openInventory(scene);
        else if (code === 'Tab') openStats();
        else if (code === 'Space') pressAction('keyboard');
        else if (key === 'm') openMap(scene);
        else if (key === 'b') cycleBait(scene);
        else if (key === 'e') openInteraction(scene, getInteractionTarget(true));
        else if (CHEATS_ENABLED && key === 's') spawnSturgeonAtCursor(scene);
        else if (slot >= 0 && slot < 9) selectHotbarSlot(scene, slot);
    });
}
