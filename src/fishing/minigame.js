function startFishingMinigame(time) {
    const zoneHeight = fishing.rod.catchZone + (fishing.bait ? fishing.bait.zoneBonus : 0);
    const zoneY = FISHING_GAME_PLAY_HEIGHT - zoneHeight;
    const fishY = zoneY + zoneHeight / 2;
    const difficulty = FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty;

    setFishingState('minigame', time);
    fishing.game = {
        zoneY,
        zoneHeight,
        zoneVelocity: 0,
        fishY,
        fishVelocity: 0,
        fishTargetY: fishY,
        targetTimer: 0,
        difficulty,
        progress: 0.22,
        tuning: {
            maxSpeed: Phaser.Math.Linear(28, 72, difficulty),
            acceleration: Phaser.Math.Linear(75, 220, difficulty),
            drag: Phaser.Math.Linear(5, 2.4, difficulty),
            targetInterval: Math.max(90, Phaser.Math.Linear(780, 230, difficulty)),
            gainRate: Phaser.Math.Linear(0.28, 0.17, difficulty),
            lossRate: Phaser.Math.Linear(0.19, 0.35, difficulty)
        }
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

function addCaughtFish(species, caught = true) {
    fishInventory.set(species.id, (fishInventory.get(species.id) || 0) + 1);
    catchLog.add(species.id);
    if (caught) recordPlayerStat('fishCaught');
    saveDirty = true;
}

function updateFishingMinigame(scene, time, delta) {
    const game = fishing.game;
    const seconds = Math.min(delta, 34) / 1000;
    const tuning = game.tuning, zoneHeight = game.zoneHeight;
    const fishHalfHeight = fishingFishMarker.height / 2;

    game.zoneVelocity += (fishingActionHeld ? -185 : 150) * seconds;
    game.zoneVelocity = Phaser.Math.Clamp(game.zoneVelocity * Math.exp(-2.4 * seconds), -72, 82);
    game.zoneY += game.zoneVelocity * seconds;

    if (game.zoneY < 0) {
        game.zoneY = 0;
        game.zoneVelocity = Math.max(0, game.zoneVelocity * -0.25);
    } else if (game.zoneY + zoneHeight > FISHING_GAME_PLAY_HEIGHT) {
        game.zoneY = FISHING_GAME_PLAY_HEIGHT - zoneHeight;
        game.zoneVelocity = Math.min(0, game.zoneVelocity * -0.3);
    }

    game.targetTimer -= delta;

    if (game.targetTimer <= 0) {
        game.fishTargetY = 4 + Math.random() * (FISHING_GAME_PLAY_HEIGHT - 8);
        game.targetTimer = tuning.targetInterval * (0.65 + Math.random() * 0.7);
    }

    game.fishVelocity += Math.sign(game.fishTargetY - game.fishY) * tuning.acceleration * seconds;
    game.fishVelocity *= Math.exp(-tuning.drag * seconds);
    game.fishVelocity = Phaser.Math.Clamp(game.fishVelocity, -tuning.maxSpeed, tuning.maxSpeed);
    game.fishY = Phaser.Math.Clamp(game.fishY + game.fishVelocity * seconds, fishHalfHeight, FISHING_GAME_PLAY_HEIGHT - fishHalfHeight);

    const inside = game.fishY >= game.zoneY && game.fishY <= game.zoneY + zoneHeight;
    const rate = inside
        ? tuning.gainRate
        : -tuning.lossRate / fishing.rod.lineStrength;

    game.progress = Phaser.Math.Clamp(game.progress + rate * seconds, 0, 1);

    if (game.progress >= 1 || game.progress <= 0) finishFishingMinigame(scene, time, game.progress >= 1);
}
