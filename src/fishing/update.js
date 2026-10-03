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
