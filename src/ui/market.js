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

    marketOptionTexts[MARKET_SELL_INDEX].textContent = 'Sell fish';
    marketOptionTexts[MARKET_EXIT_INDEX].textContent = 'Leave';

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

    for (const hint of [['A/D', 'Tab'], ['W/S', 'Select'], ['Enter', 'Buy'], ['E', 'Close']]) {
        const span = appendKeyHints(document.createElement('span'), [hint]);
        span.firstChild.style.marginLeft = '0';
        footer.appendChild(span);
    }

    marketContainer = addPanelContainer(scene, MARKET_HIDDEN_Y, 203, [panel, marketHighlight, ...marketItemImages, marketDetailImage]);
    marketTextLayer = addHudLayer(scene, textLayer, MARKET_HIDDEN_Y, 204);

    refreshMarketOptions();
}
