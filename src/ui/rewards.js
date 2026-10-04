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
    setUITextContent(catchCardTitle, title);
    setUITextContent(catchCardDetail, detail);
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
