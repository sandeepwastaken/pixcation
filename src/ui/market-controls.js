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
