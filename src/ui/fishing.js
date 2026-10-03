let fishingMinigameVisible = false;
let fishingProgressHeight = -1;

function createFishingUI(scene) {
    const catchZoneTexture = scene.textures.get('fishing-catch-zone');
    const hudImage = (key, frame, depth, origin = 0) => scene.add.image(0, 0, key, frame)
        .setOrigin(origin).setDepth(depth).setScrollFactor(0).setVisible(false);

    catchZoneTexture.add('top', 0, 0, 0, 8, 3);
    catchZoneTexture.add('middle', 0, 0, 3, 8, 2);
    catchZoneTexture.add('bottom', 0, 0, 5, 8, 3);
    fishingUiPanel = hudImage('fishing-ui', undefined, 220).setPosition(FISHING_GAME_X, FISHING_GAME_Y);
    fishingCatchZoneTop = hudImage('fishing-catch-zone', 'top', 221);
    fishingCatchZoneMiddle = hudImage('fishing-catch-zone', 'middle', 221);
    fishingCatchZoneBottom = hudImage('fishing-catch-zone', 'bottom', 221);
    fishingFishMarker = hudImage('fishing-fish', undefined, 222, 0.5);
    fishingProgressFill = hudImage('fishing-progress', undefined, 221)
        .setPosition(FISHING_GAME_X + 17, FISHING_GAME_Y + FISHING_GAME_PLAY_TOP);
    fishingUiParts = [fishingUiPanel, fishingCatchZoneTop, fishingCatchZoneMiddle, fishingCatchZoneBottom, fishingFishMarker, fishingProgressFill];
}

function drawCastCharge(time) {
    if (!castCharge) return;

    const power = getCastPower(time);
    const palette = castCharge.rod.polePalette || [0x78afd3, 0xd1edf1];
    const x = Math.round(character.x + CHARACTER_SIZE / 2 - CAST_METER_WIDTH / 2);
    const y = Math.round(character.y) - 5;
    const filled = Math.round((CAST_METER_WIDTH - 2) * power);

    fishingLine.setDepth(character.depth + 1)
        .fillStyle(0x230a03, 1)
        .fillRect(x, y, CAST_METER_WIDTH, 4)
        .fillStyle(0x36160d, 1)
        .fillRect(x + 1, y + 1, CAST_METER_WIDTH - 2, 2)
        .fillStyle(power > 0.9 ? palette[palette.length - 1] : palette[1] || palette[0], 1)
        .fillRect(x + 1, y + 1, filled, 2);
}

function drawFishingMinigame() {
    if (!fishing || fishing.state !== 'minigame') {
        if (!fishingMinigameVisible) return;

        fishingMinigameVisible = false;
        for (const part of fishingUiParts) part.setVisible(false);
        return;
    }

    const gameState = fishing.game;
    const playX = FISHING_GAME_X + 5;
    const playY = FISHING_GAME_Y + FISHING_GAME_PLAY_TOP;
    const progressHeight = Math.max(1, Math.round(FISHING_GAME_PLAY_HEIGHT * gameState.progress));
    const zoneY = playY + Math.round(gameState.zoneY);
    const zoneHeight = Math.round(gameState.zoneHeight);

    if (!fishingMinigameVisible) {
        fishingMinigameVisible = true;
        fishingProgressHeight = -1;
        for (const part of fishingUiParts) part.setVisible(true);
    }

    fishingCatchZoneTop.setPosition(playX, zoneY);
    fishingCatchZoneMiddle.setPosition(playX, zoneY + 3).setDisplaySize(8, Math.max(1, zoneHeight - 6));
    fishingCatchZoneBottom.setPosition(playX, zoneY + zoneHeight - 3);
    fishingFishMarker.setPosition(playX + 4, playY + Math.round(gameState.fishY));
    if (progressHeight !== fishingProgressHeight) {
        fishingProgressHeight = progressHeight;
        fishingProgressFill.setCrop(0, FISHING_GAME_PLAY_HEIGHT - progressHeight, FISHING_GAME_PROGRESS_WIDTH, progressHeight);
    }
}
