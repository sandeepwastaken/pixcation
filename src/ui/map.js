function createMapUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, MAP_PANEL_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);
    mapPixels = mapTexture.getContext().createImageData(MAP_WIDTH, MAP_HEIGHT);
    mapPixelWords = new Uint32Array(mapPixels.data.buffer);

    mapImage = scene.add.image(12, MAP_TOP, 'map')
        .setOrigin(0);

    const textLayer = createTextLayer(MAP_PANEL_HEIGHT);

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'World Map';
    appendKeyHints(
        createUIText(textLayer, 0, 6, '#8c7358', null, null, { left: 'auto', right: '14px', fontSize: '11px' }),
        [['Scroll', 'Zoom'], ['M', 'Close']]
    );

    mapTextLayer = addHudLayer(scene, textLayer, MAP_HIDDEN_Y, 203);
    createUIText(textLayer, 14, 21, '#e0f2fd', null, null, { fontSize: '11px' }).textContent = 'WASD walk  Arrows/drag pan  Click mark  R clear';
    const waypointHud = createTextLayer(12); mapWaypointText = createUIText(waypointHud, 14, 0, '#e0f2fd', null, null, { fontSize: '11px', textShadow: '1px 1px rgba(0,0,0,0.65)' }); mapWaypointLayer = addHudLayer(scene, waypointHud, 30, 103);
    mapWaypointArrow = scene.add.graphics().setScrollFactor(0).setDepth(103).setVisible(false);
    mapContainer = addPanelContainer(scene, MAP_HIDDEN_Y, 202, [panel, mapImage]);
}
