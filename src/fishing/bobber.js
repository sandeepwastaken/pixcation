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
            if (!(distanceSquared < nearestDistanceSquared)) continue;

            const facing = (Math.cos(fish.heading) * dx + Math.sin(fish.heading) * dy) / Math.sqrt(distanceSquared);

            if (facing >= noticeDot && isFishPathClear(chunk, fish, fishing.bobberX, fishing.bobberY)) {
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

function startFishBite(scene, time) {
    setFishingState('bite', time);
    fishing.biteDeadline = time + Phaser.Math.Linear(1050, 720, FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty);
    splash(scene, time, fishing.bobberX, fishing.bobberY);
}
