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

    setCharacterTexture(`character-${characterDirection}`);
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
