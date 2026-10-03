function createGuideDialogueUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, 78)
        .fillStyle(0x465989, 1)
        .fillRect(DIALOGUE_OPTION_X - 7, 8, 1, 62);

    dialogueHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(DIALOGUE_OPTION_X - 3, 0, DIALOGUE_OPTION_WIDTH, DIALOGUE_OPTION_HEIGHT)
        .fillStyle(0x4a2216, 1)
        .fillRect(DIALOGUE_OPTION_X - 2, 1, DIALOGUE_OPTION_WIDTH - 2, DIALOGUE_OPTION_HEIGHT - 2);

    dialoguePortrait = scene.add.image(12, 13, 'guide-portrait-friendly')
        .setOrigin(0);

    const textLayer = createTextLayer(78, CRISP_TEXT_STYLE);

    createUIText(textLayer, 64, 5, '#acccf9').textContent = 'Guide';
    dialogueText = createUIText(textLayer, 64, 21, '#e0f2fd', 146, null, { whiteSpace: 'normal' });
    dialogueOptionTexts = [0, 1, 2].map(index => {
        return createUIText(textLayer, DIALOGUE_OPTION_X + 3, DIALOGUE_OPTION_TOP + 4 + index * DIALOGUE_OPTION_STEP, '#c0a887');
    });

    dialogueContainer = addPanelContainer(scene, DIALOGUE_HIDDEN_Y, 200, [panel, dialogueHighlight, dialoguePortrait]);
    dialogueTextLayer = addHudLayer(scene, textLayer, DIALOGUE_HIDDEN_Y, 201);
}
