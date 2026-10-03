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
    fishingProgressFill = hudImage('fishing-progress', undefined, 221);
    fishingUiParts = [fishingUiPanel, fishingCatchZoneTop, fishingCatchZoneMiddle, fishingCatchZoneBottom, fishingFishMarker, fishingProgressFill];
}

function startFishingMinigame(time) {
    const zoneHeight = fishing.rod.catchZone + (fishing.bait ? fishing.bait.zoneBonus : 0);
    const zoneY = FISHING_GAME_PLAY_HEIGHT - zoneHeight;
    const fishY = zoneY + zoneHeight / 2;

    setFishingState('minigame', time);
    fishing.game = {
        zoneY,
        zoneHeight,
        zoneVelocity: 0,
        fishY,
        fishVelocity: 0,
        fishTargetY: fishY,
        targetTimer: 0,
        difficulty: FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty,
        progress: 0.22
    };
}

function finishFishingMinigame(scene, time, caught) {
    const fish = fishing.targetFish;
    const chunk = fishing.targetChunk;

    if (!caught) {
        spawnLineSnap(scene, time, fishing.rope);
        releaseTargetFish(true);
        splash(scene, time, fishing.bobberX, fishing.bobberY);
        fishing = null;
        return;
    }

    if (chunk) {
        const index = chunk.fish.indexOf(fish);
        if (index !== -1) chunk.fish.splice(index, 1);
    }

    const species = fish.species || FISH_SPECIES[0];
    addCaughtFish(species);

    fishing.targetFish = null;
    fishing.targetChunk = null;
    startReeling(time);
    showCatchCard(scene, time, species);
}

function spawnLineSnap(scene, time, rope) {
    if (!rope || !rope.points.length) return;

    const stride = Math.max(1, Math.floor(rope.points.length / 9));

    for (let index = stride; index < rope.points.length; index += stride) {
        const point = rope.points[index];
        const amount = index / Math.max(1, rope.points.length - 1);
        const color = samplePalette(fishing?.rod?.linePalette, 1 - Math.abs(amount * 2 - 1));

        spawnParticle(
            scene, worldObjectLayer, time, Math.round(point.x), Math.round(point.y),
            index % 2 ? -1 : 1, 1, 300, color, Math.max(character.depth + 0.2, point.y)
        );
    }
}

function updateFishingMinigame(scene, time, delta) {
    const game = fishing.game;
    const seconds = Math.min(delta, 34) / 1000;
    const difficulty = game.difficulty;
    const fishHalfHeight = fishingFishMarker.height / 2;
    const fishMaxSpeed = Phaser.Math.Linear(28, 72, difficulty);

    game.zoneVelocity += (fishingActionHeld ? -185 : 150) * seconds;
    game.zoneVelocity = Phaser.Math.Clamp(game.zoneVelocity * Math.exp(-2.4 * seconds), -72, 82);
    game.zoneY += game.zoneVelocity * seconds;

    if (game.zoneY < 0) {
        game.zoneY = 0;
        game.zoneVelocity = Math.max(0, game.zoneVelocity * -0.25);
    } else if (game.zoneY + game.zoneHeight > FISHING_GAME_PLAY_HEIGHT) {
        game.zoneY = FISHING_GAME_PLAY_HEIGHT - game.zoneHeight;
        game.zoneVelocity = Math.min(0, game.zoneVelocity * -0.3);
    }

    game.targetTimer -= delta;

    if (game.targetTimer <= 0) {
        game.fishTargetY = 4 + Math.random() * (FISHING_GAME_PLAY_HEIGHT - 8);
        game.targetTimer = Math.max(90, Phaser.Math.Linear(780, 230, difficulty)) * (0.65 + Math.random() * 0.7);
    }

    game.fishVelocity += Math.sign(game.fishTargetY - game.fishY) * Phaser.Math.Linear(75, 220, difficulty) * seconds;
    game.fishVelocity *= Math.exp(-Phaser.Math.Linear(5, 2.4, difficulty) * seconds);
    game.fishVelocity = Phaser.Math.Clamp(game.fishVelocity, -fishMaxSpeed, fishMaxSpeed);
    game.fishY = Phaser.Math.Clamp(game.fishY + game.fishVelocity * seconds, fishHalfHeight, FISHING_GAME_PLAY_HEIGHT - fishHalfHeight);

    const inside = game.fishY >= game.zoneY && game.fishY <= game.zoneY + game.zoneHeight;
    const rate = inside
        ? Phaser.Math.Linear(0.28, 0.17, difficulty)
        : -Phaser.Math.Linear(0.19, 0.35, difficulty) / fishing.rod.lineStrength;

    game.progress = Phaser.Math.Clamp(game.progress + rate * seconds, 0, 1);

    if (game.progress >= 1 || game.progress <= 0) finishFishingMinigame(scene, time, game.progress >= 1);
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
        for (const part of fishingUiParts) part.setVisible(true);
    }

    fishingCatchZoneTop.setPosition(playX, zoneY);
    fishingCatchZoneMiddle.setPosition(playX, zoneY + 3).setDisplaySize(8, Math.max(1, zoneHeight - 6));
    fishingCatchZoneBottom.setPosition(playX, zoneY + zoneHeight - 3);
    fishingFishMarker.setPosition(playX + 4, playY + Math.round(gameState.fishY));
    fishingProgressFill
        .setCrop(0, FISHING_GAME_PLAY_HEIGHT - progressHeight, FISHING_GAME_PROGRESS_WIDTH, progressHeight)
        .setPosition(FISHING_GAME_X + 17, playY);
}
