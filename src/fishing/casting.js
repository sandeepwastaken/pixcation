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
    recordPlayerStat('casts');

    setCharacterTexture(`character-${characterDirection}`);
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
