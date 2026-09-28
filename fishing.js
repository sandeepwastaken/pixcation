function hasRodSelected() {
    return (hotbarItemNames[selectedHotbarSlot] || '').endsWith('Rod');
}

const castDirections = { left: [-1, 0], right: [1, 0], back: [0, -1], front: [0, 1] };
const waterFishingStates = new Set([
    'floating', 'landing', 'approaching', 'inspecting', 'nibbleWait', 'nibbleDip', 'bite', 'hooked', 'minigame', 'snagged'
]);
const rodHandPosition = new Int32Array(2);
const rodTipPosition = new Int32Array(2);
const hookedBobberPosition = new Int32Array(2);
let fishingMinigameVisible = false;

function getSelectedRod() {
    return MARKET_RODS_BY_LABEL.get(hotbarItemNames[selectedHotbarSlot]) || MARKET_RODS[0];
}

function getCastDirection() {
    return castDirections[characterDirection] || castDirections.front;
}

function getRodHand() {
    const [directionX, directionY] = getCastDirection();
    const centerX = Math.round(character.x + CHARACTER_SIZE / 2);

    rodHandPosition[0] = centerX + (directionY === 0 ? directionX * 3 : 3);
    rodHandPosition[1] = Math.round(character.y) + 11;
    return rodHandPosition;
}

function getRodTip(time) {
    const [directionX, directionY] = getCastDirection();
    const [handX, handY] = getRodHand();

    rodTipPosition[0] = directionY === 0 ? handX + directionX * 6 : handX + 1;
    rodTipPosition[1] = directionY === 0 ? handY - 6 : handY + directionY * 7;

    if (!fishing || time === undefined) return rodTipPosition;

    if (fishing.state === 'casting') {
        const phase = Phaser.Math.Clamp((time - fishing.start) / CAST_SWING_DURATION, 0, 1);
        const reach = phase < 0.35 ? -3 * phase / 0.35 : -3 + 6 * (phase - 0.35) / 0.65;
        const lift = Math.round(Math.sin(phase * Math.PI) * 3);

        rodTipPosition[0] += Math.round(directionX * reach + (directionY === 0 ? 0 : lift));
        rodTipPosition[1] += Math.round(directionY * reach - (directionY === 0 ? lift : 0));
    } else if (waterFishingStates.has(fishing.state)) {
        const wobble = Math.sin((time - fishing.start) / 95 + fishing.driftPhase);

        rodTipPosition[0] += directionY === 0 ? 0 : Math.round(wobble);
        rodTipPosition[1] += directionY === 0 ? Math.round(wobble) : 0;
    }

    return rodTipPosition;
}

function isWaterPixel(scene, x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);

    return getTerrainSurface(scene, tile).water[(y - tileY * TILE_SIZE) * TILE_SIZE + x - tileX * TILE_SIZE] === 1;
}

function getBaitLure() {
    return fishing?.bait ? fishing.bait.lure : 1;
}

function findFishForBobber() {
    const lure = getBaitLure();
    const noticeMaxDistanceSquared = FISH_NOTICE_MAX_DISTANCE_SQUARED * lure * lure;
    const noticeDot = FISH_NOTICE_DOT - (lure - 1) * 0.8;
    let nearestFish = null;
    let nearestChunk = null;
    let nearestDistanceSquared = Infinity;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish.state === 'flee' || fish.state === 'lure') continue;

            const dx = fishing.bobberX - fish.x;
            const dy = fishing.bobberY - fish.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < FISH_NOTICE_MIN_DISTANCE_SQUARED || distanceSquared > noticeMaxDistanceSquared) continue;

            const facing = (Math.cos(fish.heading) * dx + Math.sin(fish.heading) * dy) / Math.sqrt(distanceSquared);

            if (
                distanceSquared < nearestDistanceSquared && facing >= noticeDot &&
                isFishPathClear(chunk, fish, fishing.bobberX, fishing.bobberY)
            ) {
                nearestFish = fish;
                nearestChunk = chunk;
                nearestDistanceSquared = distanceSquared;
            }
        }
    }

    return nearestFish ? { fish: nearestFish, chunk: nearestChunk } : null;
}

function releaseTargetFish(flee) {
    if (!fishing || !fishing.targetFish) return;

    const fish = fishing.targetFish;
    const chunk = fishing.targetChunk;
    const awayX = fish.x - fishing.bobberX;
    const awayY = fish.y - fishing.bobberY;

    fishing.targetFish = null;
    fishing.targetChunk = null;

    if (flee && chunk && chooseFishTarget(chunk, fish, awayX, awayY)) {
        startFishFlee(fish, 900);
        return;
    }

    fish.velocity = 0;
    setFishIdle(fish, FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE);
}

function hookFish(time) {
    if (!fishing || fishing.state !== 'bite' || time > fishing.biteDeadline) return false;

    setFishingState('hooked', time);
    fishing.bobberY = fishing.toY + 2;
    useBait(fishing.bait);
    return true;
}

function beginCast(time) {
    const active = fishing;

    if (fishing?.state === 'snagged') {
        haulChest(time);
    } else if (fishing && fishing.state !== 'minigame' && fishing.state !== 'hooked' && !hookFish(time)) {
        reelIn(time);
    }

    if (active || !hasRodSelected() || isMenuOpen() || castCharge) return;

    castCharge = { start: time, rod: getSelectedRod() };
}

function getCastPower(time) {
    const cycle = ((time - castCharge.start) / castCharge.rod.chargeTime) % 2;
    return cycle <= 1 ? cycle : 2 - cycle;
}

function releaseCast(time) {
    if (!castCharge) return;

    const power = getCastPower(time);
    castCharge = null;

    if (!hasRodSelected() || isMenuOpen()) return;

    const rod = getSelectedRod();
    const [directionX, directionY] = getCastDirection();
    const [tipX, tipY] = getRodTip();
    const distance = CAST_MIN_DISTANCE + (rod.castDistance - CAST_MIN_DISTANCE) * power;

    fishing = {
        state: 'casting',
        start: time,
        releaseAt: time + CAST_SWING_DURATION + CAST_HANG_TIME,
        power,
        rod,
        bait: getActiveBait(),
        duration: CAST_DURATION * (0.6 + power * 0.6),
        arc: CAST_ARC * (0.5 + power * 0.7),
        fromX: tipX,
        fromY: tipY,
        toX: Math.round(character.x + CHARACTER_SIZE / 2 + directionX * distance),
        toY: Math.round(character.y + CHARACTER_SIZE - 2 + directionY * distance),
        bobberX: tipX,
        bobberY: tipY,
        driftPhase: Math.random() * Math.PI * 2,
        rope: null
    };

    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);
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

function reelIn(time) {
    if (!fishing || fishing.state === 'reeling') return;

    if (fishing.state === 'casting') {
        fishing = null;
        return;
    }

    releaseTargetFish(true);
    startReeling(time);
}

function startReeling(time) {
    setFishingState('reeling', time);
    fishing.fromX = fishing.bobberX;
    fishing.fromY = fishing.bobberY;
}

function splash(scene, time, x, y) {
    scatterFishFromSplash(x, y);

    for (let index = 0; index < SPLASH_PARTICLES; index++) {
        const angle = index / SPLASH_PARTICLES * Math.PI * 2;

        spawnParticle(
            scene, shadowLayer, time, Math.round(x), Math.round(y), 0, 0, SPLASH_LIFETIME,
            index % 2 ? 0x87bed8 : 0x78afd3, 0, Math.cos(angle), Math.sin(angle), true
        );
    }
}

function groundLandingPuff(scene, time, x, y) {
    for (let index = 0; index < 3; index++) {
        spawnParticle(scene, shadowLayer, time, x - 1 + index, y, index - 1, -1, 220, DUST_COLORS[index]);
    }
}

function nibbleRipple(scene, time, x, y) {
    for (let index = 0; index < 4; index++) {
        const horizontal = index < 2;
        const side = index % 2 === 0 ? -1 : 1;

        spawnParticle(
            scene, shadowLayer, time,
            x + (horizontal ? side * 2 : 0), y + (horizontal ? 0 : side),
            horizontal ? side : 0, 0, 180, index % 2 ? 0x78afd3 : 0x87bed8
        );
    }
}

function startFishApproach(time) {
    const match = findFishForBobber();

    if (!match) {
        if (fishing.state !== 'floating') fishing.start = time;
        fishing.state = 'floating';
        fishing.nextFishScanAt = time + FISH_NOTICE_SCAN_TIME;
        return;
    }

    setFishingState('approaching', time);
    fishing.targetFish = match.fish;
    fishing.targetChunk = match.chunk;
    match.fish.state = 'lure';
    match.fish.lureTime = 0;
    match.fish.velocity *= 0.4;
}

function addCaughtFish(species) {
    fishInventory.set(species.id, (fishInventory.get(species.id) || 0) + 1);
    catchLog.add(species.id);
    saveDirty = true;
}

function startFishBite(scene, time) {
    setFishingState('bite', time);
    fishing.biteDeadline = time + Phaser.Math.Linear(1050, 720, FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty);
    splash(scene, time, fishing.bobberX, fishing.bobberY);
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

function samplePalette(palette, amount) {
    if (!palette || palette.length === 0) return FISHING_LINE_COLOR;

    return palette[Math.round(Phaser.Math.Clamp(amount, 0, 1) * (palette.length - 1))];
}

function beginPixelPath() {
    pixelPathLength = 0;
}

function addPixelPathPoint(x, y, color) {
    if (pixelPathLength > 0 && pixelPathX[pixelPathLength - 1] === x && pixelPathY[pixelPathLength - 1] === y) {
        return;
    }

    if (pixelPathLength >= 2) {
        const previousX = pixelPathX[pixelPathLength - 2];
        const previousY = pixelPathY[pixelPathLength - 2];

        if (Math.abs(x - previousX) === 1 && Math.abs(y - previousY) === 1) {
            pixelPathLength--;
        }
    }

    if (pixelPathLength >= pixelPathX.length) {
        return;
    }

    pixelPathX[pixelPathLength] = x;
    pixelPathY[pixelPathLength] = y;
    pixelPathColor[pixelPathLength] = color;
    pixelPathLength++;
}

function drawPixelPath() {
    let activeColor = -1;

    for (let index = 0; index < pixelPathLength; index++) {
        if (pixelPathColor[index] !== activeColor) {
            activeColor = pixelPathColor[index];
            fishingLine.fillStyle(activeColor, 1);
        }

        fishingLine.fillRect(pixelPathX[index], pixelPathY[index], 1, 1);
    }
}

function plotFishingLine(fromX, fromY, toX, toY, sag, palette) {
    const controlX = (fromX + toX) / 2;
    const controlY = (fromY + toY) / 2 + sag;
    const steps = Math.max(2, Math.ceil(Math.hypot(toX - fromX, toY - fromY) * 1.5));
    const color = palette ? 0 : fishingLine.defaultFillColor;

    beginPixelPath();

    for (let step = 0; step <= steps; step++) {
        const amount = step / steps;
        const inverse = 1 - amount;
        const x = Math.round(inverse * inverse * fromX + 2 * inverse * amount * controlX + amount * amount * toX);
        const y = Math.round(inverse * inverse * fromY + 2 * inverse * amount * controlY + amount * amount * toY);

        addPixelPathPoint(x, y, palette ? samplePalette(palette, amount) : color);
    }

    drawPixelPath();
}

function createFishingRope(fromX, fromY, toX, toY, lineLength) {
    const segmentCount = Math.max(2, Math.ceil(lineLength / ROPE_SEGMENT_LENGTH));
    const points = [];

    for (let index = 0; index <= segmentCount; index++) {
        const amount = index / segmentCount;
        const x = fromX + (toX - fromX) * amount;
        const y = fromY + (toY - fromY) * amount;

        points.push({ x, y, oldX: x, oldY: y });
    }

    return { points, length: lineLength, segmentLength: lineLength / segmentCount };
}

function updateFishingRope(rope, fromX, fromY, toX, toY, delta, tautness) {
    const seconds = Math.min(delta, 34) / 1000;
    const targetLength = Math.max(Math.hypot(toX - fromX, toY - fromY) + (1 - tautness) * 7, ROPE_SEGMENT_LENGTH);

    rope.length += (targetLength - rope.length) * Math.min(1, seconds * (tautness ? 14 : 5));
    rope.segmentLength = rope.length / (rope.points.length - 1);

    for (let index = 1; index < rope.points.length - 1; index++) {
        const point = rope.points[index];
        const velocityX = (point.x - point.oldX) * 0.985;
        const velocityY = (point.y - point.oldY) * 0.985;

        point.oldX = point.x;
        point.oldY = point.y;
        point.x += velocityX;
        point.y += velocityY + ROPE_GRAVITY * seconds * seconds;
    }

    for (let pass = 0; pass < ROPE_CONSTRAINT_PASSES; pass++) {
        rope.points[0].x = fromX;
        rope.points[0].y = fromY;
        rope.points[rope.points.length - 1].x = toX;
        rope.points[rope.points.length - 1].y = toY;

        for (let index = 0; index < rope.points.length - 1; index++) {
            const first = rope.points[index];
            const second = rope.points[index + 1];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const distance = Math.max(0.001, Math.hypot(dx, dy));
            const correction = (distance - rope.segmentLength) / distance;
            const firstFixed = index === 0;
            const secondFixed = index + 1 === rope.points.length - 1;

            if (!firstFixed) {
                const share = secondFixed ? 1 : 0.5;
                first.x += dx * correction * share;
                first.y += dy * correction * share;
            }

            if (!secondFixed) {
                const share = firstFixed ? 1 : 0.5;
                second.x -= dx * correction * share;
                second.y -= dy * correction * share;
            }
        }
    }
}

function drawFishingRope(rope, palette) {
    beginPixelPath();

    for (let index = 0; index < rope.points.length - 1; index++) {
        const first = rope.points[index];
        const second = rope.points[index + 1];
        const distance = Math.max(1, Math.ceil(Math.hypot(second.x - first.x, second.y - first.y)));
        const amount = index / Math.max(1, rope.points.length - 2);
        const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));

        for (let step = 0; step <= distance; step++) {
            const blend = step / distance;
            addPixelPathPoint(
                Math.round(first.x + (second.x - first.x) * blend),
                Math.round(first.y + (second.y - first.y) * blend),
                color
            );
        }
    }

    drawPixelPath();
}

function setFishingState(state, time) {
    fishing.state = state;
    fishing.start = time;
}

function resumeFloating(time) {
    setFishingState('floating', time);
    fishing.nextFishScanAt = time + FISH_NOTICE_SCAN_TIME;
}

function updateWaterFishing(scene, time, delta) {
    const age = time - fishing.start;
    const state = fishing.state;
    const candidateX = fishing.toX + Math.round(Math.sin(age / 1300 + fishing.driftPhase));
    const candidateY = fishing.toY + Math.round(Math.sin(age / 1700 + fishing.driftPhase * 0.7));
    const drifts = state !== 'bite' && state !== 'hooked' && state !== 'snagged' && isWaterPixel(scene, candidateX, candidateY);

    fishing.bobberX = drifts ? candidateX : fishing.toX;
    fishing.bobberY = (drifts ? candidateY : fishing.toY) + (Math.floor(age / BOBBER_BOB_TIME) % 2);

    if (state === 'floating' && time >= (fishing.nextFishScanAt || 0)) {
        startFishApproach(time);
    } else if (state === 'approaching') {
        const fish = fishing.targetFish;

        if (!fish || fish.state !== 'lure') {
            releaseTargetFish(false);
            resumeFloating(time);
        } else if (Math.hypot(fish.x - fishing.bobberX, fish.y - fishing.bobberY) <= fish.radius + 4) {
            setFishingState('inspecting', time);
            fishing.inspectDuration = (FISH_INSPECT_MIN + Math.random() * FISH_INSPECT_RANGE) / getBaitLure();
            fish.velocity = 0;
        }
    } else if (state === 'inspecting' && age >= fishing.inspectDuration) {
        setFishingState('nibbleWait', time);
        fishing.nibblesRemaining = Math.floor(Math.random() * 5 / getBaitLure());
        fishing.nextNibbleAt = time + 300 + Math.random() * 420;
    } else if (state === 'nibbleWait' && time >= fishing.nextNibbleAt) {
        if (fishing.nibblesRemaining > 0) {
            setFishingState('nibbleDip', time);
            fishing.nibbleRippleShown = false;
        } else {
            startFishBite(scene, time);
        }
    } else if (state === 'nibbleDip') {
        fishing.bobberY += Math.round(Math.sin(Math.min(1, age / FISH_NIBBLE_DIP_TIME) * Math.PI) * 2);

        if (!fishing.nibbleRippleShown && age >= FISH_NIBBLE_DIP_TIME * 0.25) {
            fishing.nibbleRippleShown = true;
            nibbleRipple(scene, time, fishing.bobberX, fishing.bobberY);
        }

        if (age >= FISH_NIBBLE_DIP_TIME) {
            setFishingState('nibbleWait', time);
            fishing.nibblesRemaining--;
            fishing.nextNibbleAt = time + 260 + Math.random() * 380;
        }
    } else if (state === 'bite' || state === 'snagged') {
        fishing.bobberY = fishing.toY + 3;

        if (state === 'bite' && time > fishing.biteDeadline) {
            releaseTargetFish(true);
            resumeFloating(time);
        }
    } else if (state === 'hooked' || state === 'minigame') {
        const hooked = getHookedBobber();

        if (hooked) {
            [fishing.bobberX, fishing.bobberY] = hooked;
        } else {
            fishing.bobberY = fishing.toY + 2;
        }

        if (state === 'minigame') {
            updateFishingMinigame(scene, time, delta);
        } else if (age >= 220) {
            startFishingMinigame(time);
        }
    }
}

function updateFishing(scene, time, delta, isWalking) {
    const interrupted = isWalking || isMenuOpen() || !hasRodSelected();

    fishingLine.clear();
    if (castCharge && interrupted) castCharge = null;
    drawCastCharge(time);

    if (fishing && fishing.state !== 'reeling' && interrupted) reelIn(time);

    if (!fishing) {
        drawFishingMinigame();
        return;
    }

    let [tipX, tipY] = getRodTip(time);
    const age = time - fishing.start;

    if (fishing.state === 'casting') {
        fishing.bobberX = tipX;
        fishing.bobberY = tipY;

        if (time >= fishing.releaseAt) {
            setFishingState('flying', time);
            fishing.fromX = tipX;
            fishing.fromY = tipY;
            fishing.rope = createFishingRope(tipX, tipY, tipX, tipY - 2, Math.hypot(fishing.toX - tipX, fishing.toY - tipY) + fishing.arc * 0.8 + 5);
        }
    } else if (fishing.state === 'flying') {
        const amount = Math.min(1, age / fishing.duration);

        fishing.bobberX = Math.round(fishing.fromX + (fishing.toX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (fishing.toY - fishing.fromY) * amount - Math.sin(amount * Math.PI) * fishing.arc);

        if (amount >= 1 && !isWaterPixel(scene, fishing.toX, fishing.toY)) {
            groundLandingPuff(scene, time, fishing.toX, fishing.toY);
            fishing = null;
            return;
        }

        if (amount >= 1) {
            setFishingState('landing', time);
            splash(scene, time, fishing.toX, fishing.toY);
        }
    } else if (fishing.state === 'landing') {
        const amount = Math.min(1, age / BOBBER_LAND_TIME);

        fishing.bobberX = fishing.toX;
        fishing.bobberY = fishing.toY - Math.round(Math.sin(amount * Math.PI) * 2 * (1 - amount));

        if (amount >= 1) {
            const chestChunk = findChestAt(fishing.toX, fishing.toY);

            setFishingState('floating', time);
            if (chestChunk) snagChest(scene, time, chestChunk); else startFishApproach(time);
        }
    } else if (waterFishingStates.has(fishing.state)) {
        updateWaterFishing(scene, time, delta);
    } else {
        const amount = Math.min(1, age / (fishing.hauling ? CHEST_REEL_DURATION : REEL_DURATION));

        fishing.bobberX = Math.round(fishing.fromX + (tipX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (tipY - fishing.fromY) * amount);
        if (fishing.hauling) drawHauledChest(amount);

        if (amount >= 1) {
            if (fishing.hauling) openHauledChest(scene, time, tipX, tipY);
            fishing = null;
        }
    }

    drawFishingMinigame();
    if (!fishing) return;

    [tipX, tipY] = getRodTip(time);
    const [handX, handY] = getRodHand();
    const { polePalette, linePalette, bobberPalette } = fishing.rod;
    const taut = fishing.state === 'reeling' || fishing.state === 'bite' || fishing.state === 'hooked' ||
        fishing.state === 'minigame' || fishing.state === 'snagged';

    fishingLine.setDepth(fishing.state === 'flying' || fishing.state === 'casting' ? character.depth + 1 : Math.max(character.depth + 0.2, fishing.bobberY));
    plotFishingLine(handX, handY, tipX, tipY, 0, polePalette);

    if (fishing.state === 'casting') return;

    fishing.rope ||= createFishingRope(tipX, tipY, fishing.bobberX, fishing.bobberY - 2, Math.hypot(fishing.bobberX - tipX, fishing.bobberY - 2 - tipY) + 5);
    updateFishingRope(fishing.rope, tipX, tipY, fishing.bobberX, fishing.bobberY - 2, delta, taut ? 1 : fishing.state === 'flying' ? 0.7 : 0);
    drawFishingRope(fishing.rope, linePalette);
    fishingLine
        .fillStyle(bobberPalette?.[2] || BOBBER_BOTTOM_COLOR, 1)
        .fillRect(fishing.bobberX - 1, fishing.bobberY - 2, 2, 1)
        .fillStyle(bobberPalette?.[1] || BOBBER_TOP_COLOR, 1)
        .fillRect(fishing.bobberX - 1, fishing.bobberY - 1, 1, 1)
        .fillStyle(bobberPalette?.[0] || BOBBER_TOP_COLOR, 1)
        .fillRect(fishing.bobberX, fishing.bobberY - 1, 1, 1);
}
