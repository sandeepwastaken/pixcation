function createHotbarUI(scene) {
    scene.add.image(HOTBAR_X, HOTBAR_Y, 'hotbar')
        .setOrigin(0)
        .setDepth(100)
        .setScrollFactor(0);

    hotbarSelector = scene.add.image(
        HOTBAR_X - 2,
        HOTBAR_Y - 3,
        'selected'
    )
        .setOrigin(0)
        .setDepth(101)
        .setScrollFactor(0);

    createBaitSlotUI(scene);
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
    const count = bait && baitInventory.get(bait.id);
    if (!count) return;

    const left = count - 1;

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
    const current = MARKET_BAITS.findIndex(bait => bait.id === activeBaitId && baitInventory.has(bait.id));
    const next = MARKET_BAITS.find((bait, index) => index > current && baitInventory.has(bait.id)) || null;

    if (current === -1 && !next) {
        showItemLabel(scene, 'No bait - buy some at the shop');
        return;
    }

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

function selectHotbarSlot(scene, slot, immediate = false) {
    selectedHotbarSlot = Phaser.Math.Wrap(slot, 0, 9);

    scene.tweens.killTweensOf(hotbarSelector);
    const selectorX = HOTBAR_X - 2 + selectedHotbarSlot * HOTBAR_SLOT_SIZE;

    if (immediate) {
        hotbarSelector.x = selectorX;
    } else {
        scene.tweens.add({
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
        showItemLabel(scene, name);
    } else {
        itemLabelUntil = 0;
    }
}
