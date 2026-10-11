function createCatchCardUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, CATCH_CARD_X, CATCH_CARD_WIDTH, CATCH_CARD_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(CATCH_CARD_X + 6, 6, 36, 36)
        .fillStyle(0x230a03, 1)
        .fillRect(CATCH_CARD_X + 7, 7, 34, 34);

    catchCardImage = scene.add.image(CATCH_CARD_X + 8, 8, 'fish/placeholder').setOrigin(0);

    const textLayer = createTextLayer(CATCH_CARD_HEIGHT);
    const textX = CATCH_CARD_X + 48, textWidth = CATCH_CARD_WIDTH - 54, clip = { overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '4px' };

    catchCardKicker = createUIText(textLayer, textX, 8, '#c0a887', textWidth, null, { fontSize: '11px', lineHeight: '9px', ...clip });
    catchCardTitle = createUIText(textLayer, textX, 18, '#e0f2fd', textWidth, null, clip);
    catchCardDetail = createUIText(textLayer, textX, 32, '#e8c170', textWidth, null, { fontSize: '11px', lineHeight: '9px', ...clip });

    const hint = createUIText(textLayer, CATCH_CARD_X + CATCH_CARD_WIDTH - 60, 8, '#8c7358', 54, 'right', { fontSize: '11px', lineHeight: '9px' });
    appendKeyHints(hint, [['Enter', 'OK']]).firstChild.style.marginLeft = '0';
    catchCardContainer = addPanelContainer(scene, CATCH_CARD_Y + 8, 205, [panel, catchCardImage]);
    catchCardTextLayer = addHudLayer(scene, textLayer, CATCH_CARD_Y + 8, 206);
}

function showCatchCard(scene, time, species, first) {
    const kicker = first ? 'New species!' : 'You caught a';
    const detail = `${FISH_SIZE_CLASSES[species.size].label} · ${species.price}c`;
    showRewardCard(scene, time, kicker, species.name, detail, getFishArtKey(scene, species), first ? '#8fbf7a' : '#c0a887');
}

function showRewardCard(scene, time, kicker, title, detail, image, kickerColor = '#c0a887') {
    setUITextContent(catchCardKicker, kicker);
    catchCardKicker.style.color = kickerColor;
    setUITextContent(catchCardTitle, title);
    setUITextContent(catchCardDetail, detail);
    catchCardImage.setTexture(image);
    catchCardUntil = Infinity;
    itemLabelUntil = 0;

    const card = [catchCardContainer, catchCardTextLayer], hiddenY = CATCH_CARD_Y + 8;

    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    for (const target of card) target.setVisible(true).setY(hiddenY);
    slidePanel(scene, CATCH_CARD_Y, 180, 'Cubic.Out', card);
    popIn(scene, catchCardImage, 4);
    scene.tweens.add({ targets: catchCardImage, y: 8, delay: 140, duration: 220, ease: 'Bounce.Out', onUpdate: snapTweenTarget });

}

function hideCatchCard(scene) {
    if (catchCardUntil !== Infinity) return false;
    catchCardUntil = 0;
    const card = [catchCardContainer, catchCardTextLayer];
    slidePanel(scene, CATCH_CARD_Y + 8, 180, 'Cubic.In', card, () => {
        for (const target of card) target.setVisible(false);
    });
    return true;
}
