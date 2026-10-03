function bindGameInput(scene) {
    const heldActions = new Set();
    scene.input.on('pointermove', pointer => {
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

        scene.input.setDefaultCursor(!isMenuOpen() && getClickedWorldTarget(pointer) ? 'pointer' : 'default');
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
    };
    scene.game.events.on(Phaser.Core.Events.BLUR, resetActions);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.game.events.off(Phaser.Core.Events.BLUR, resetActions);
        resetActions();
    });

    scene.input.on('pointerup', pointer => {
        if (pointer.button !== 0) return;
        mapDrag = null;
        releaseAction('pointer');
    });

    scene.input.keyboard.on('keyup', event => event.code === 'Space' && releaseAction('keyboard'));

    scene.input.on('pointerdown', pointer => {
        if (pointer.button !== 0) return;
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
            selectHotbarSlot(scene, selectedHotbarSlot + step, true);
        }
    });

    scene.input.keyboard.on('keydown', event => {
        if (event.repeat) return;

        const code = event.code;
        const key = event.key.toLowerCase();
        const slot = Number(event.key) - 1;

        if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
        if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
        if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
        if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;

        if (dialogueOpen) handleGuideDialogueKey(scene, event);
        else if (inventoryOpen) handleInventoryKey(scene, event);
        else if (mapOpen) handleMapKey(scene, event);
        else if (marketOpen) handleMarketKey(scene, event);
        else if (key === 'i') openInventory(scene);
        else if (code === 'Space') pressAction('keyboard');
        else if (key === 'm') openMap(scene);
        else if (key === 'b') cycleBait(scene);
        else if (key === 'e') openInteraction(scene, getInteractionTarget(true));
        else if (CHEATS_ENABLED && key === 's') spawnSturgeonAtCursor(scene);
        else if (slot >= 0 && slot < 9) selectHotbarSlot(scene, slot);
    });
}
