function isChunkNear(chunkX, chunkY, radius) {
    return Math.abs(chunkX - activeChunkX) <= radius && Math.abs(chunkY - activeChunkY) <= radius;
}

function updateLoadedChunks(scene, force = false) {
    const centerChunkX = Math.floor((startup ? mainCamera.scrollX + mainCamera.width / 2 : character.x + CHARACTER_SIZE / 2) / CHUNK_PIXEL_SIZE);
    const centerChunkY = Math.floor((startup ? mainCamera.scrollY + mainCamera.height / 2 : character.y + CHARACTER_SIZE / 2) / CHUNK_PIXEL_SIZE);

    if (!force && centerChunkX === activeChunkX && centerChunkY === activeChunkY) return;

    const discoveredBefore = discoveredChunks.size;

    activeChunkX = centerChunkX;
    activeChunkY = centerChunkY;
    visibleChunkLeft = null;
    pendingChunks.length = 0;

    for (let offsetY = -CHUNK_DISCOVERY_RADIUS; !startup && offsetY <= CHUNK_DISCOVERY_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_DISCOVERY_RADIUS; offsetX <= CHUNK_DISCOVERY_RADIUS; offsetX++) {
            discoveredChunks.add(getTileId(centerChunkX + offsetX, centerChunkY + offsetY));
        }
    }

    if (discoveredChunks.size !== discoveredBefore) {
        saveDirty = true;
        mapDirty = true;
    }

    for (let offsetY = -CHUNK_LOAD_RADIUS; offsetY <= CHUNK_LOAD_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_LOAD_RADIUS; offsetX <= CHUNK_LOAD_RADIUS; offsetX++) {
            const chunkX = centerChunkX + offsetX;
            const chunkY = centerChunkY + offsetY;

            if (force || offsetX === 0 && offsetY === 0) {
                createWorldChunk(scene, chunkX, chunkY);
            } else if (!loadedChunks.has(getChunkKey(chunkX, chunkY))) {
                pendingChunks.push(chunkX, chunkY);
            }
        }
    }

    for (const [key, chunk] of loadedChunks) {
        if (!isChunkNear(chunk.chunkX, chunk.chunkY, CHUNK_LOAD_RADIUS)) destroyWorldChunk(key);
    }

    // Keep unloaded chunks and their pixel buffers out of the deferred work queue.
    let pendingCount = 0;
    for (const chunk of pendingWaterChunks) {
        if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) pendingWaterChunks[pendingCount++] = chunk;
    }
    pendingWaterChunks.length = pendingCount;
}

function buildPendingChunk(scene) {
    while (pendingChunks.length > 0) {
        const chunkY = pendingChunks.pop();
        const chunkX = pendingChunks.pop();

        if (isChunkNear(chunkX, chunkY, CHUNK_LOAD_RADIUS) && !loadedChunks.has(getChunkKey(chunkX, chunkY))) {
            createWorldChunk(scene, chunkX, chunkY, true);
            visibleChunkLeft = null;
            return;
        }
    }

    while (pendingWaterChunks.length > 0) {
        const chunk = pendingWaterChunks.pop();

        if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) {
            buildChunkWater(scene, chunk);
            return;
        }
    }
}

function updateChunkVisibility() {
    const chunkLeft = Math.floor(mainCamera.scrollX / CHUNK_PIXEL_SIZE);
    const chunkRight = Math.ceil((mainCamera.scrollX + mainCamera.width) / CHUNK_PIXEL_SIZE) - 1;
    const chunkTop = Math.floor(mainCamera.scrollY / CHUNK_PIXEL_SIZE);
    const chunkBottom = Math.ceil((mainCamera.scrollY + mainCamera.height) / CHUNK_PIXEL_SIZE) - 1;

    if (
        chunkLeft === visibleChunkLeft && chunkRight === visibleChunkRight &&
        chunkTop === visibleChunkTop && chunkBottom === visibleChunkBottom
    ) {
        return;
    }

    visibleChunkLeft = chunkLeft;
    visibleChunkRight = chunkRight;
    visibleChunkTop = chunkTop;
    visibleChunkBottom = chunkBottom;

    for (const chunk of loadedChunks.values()) {
        const visible = chunk.chunkX >= chunkLeft && chunk.chunkX <= chunkRight && chunk.chunkY >= chunkTop && chunk.chunkY <= chunkBottom;
        if (visible === chunk.visible) continue;

        chunk.visible = visible;
        chunk.groundLayer.setVisible(visible);
        if (chunk.upperLayer) chunk.upperLayer.setVisible(visible);
        if (chunk.overlay) chunk.overlay.setVisible(visible);
        if (chunk.treeShadowLayer) chunk.treeShadowLayer.setVisible(visible);
    }
}

function updateChunkWater(time) {
    if (!waterPipeline || loadedWaterChunks.size === 0) return;

    waterPipeline.set1f('uTime', time / 1000);
    waterPipeline.set2f('uScroll', mainCamera.scrollX, mainCamera.scrollY);
    waterPipeline.set1f('uViewHeight', mainCamera.height);

    const left = mainCamera.scrollX - FISH_VIEW_MARGIN;
    const top = mainCamera.scrollY - FISH_VIEW_MARGIN;
    const right = mainCamera.scrollX + mainCamera.width + FISH_VIEW_MARGIN;
    const bottom = mainCamera.scrollY + mainCamera.height + FISH_VIEW_MARGIN;
    let count = 0;

    fishChunks: for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;

        for (const fish of chunk.fish) {
            if (count >= FISH_MAX_VISIBLE) break fishChunks;
            const x = fish.x, y = fish.y;
            if (x < left || x > right || y < top || y > bottom) continue;
            const offset = count * 4;

            fishUniforms[offset] = Math.round(x);
            fishUniforms[offset + 1] = Math.round(y);
            fishUniforms[offset + 2] = Math.cos(fish.heading);
            fishUniforms[offset + 3] = Math.sin(fish.heading);
            fishShapeUniforms[offset] = fish.length;
            fishShapeUniforms[offset + 1] = fish.radius;
            fishShapeUniforms[offset + 2] = fish.phase;
            fishShapeUniforms[offset + 3] = fish.amplitude;
            count++;
        }
    }

    if (count > 0) waterPipeline.set4fv('uFish', fishUniforms);
    if (count > 0) waterPipeline.set4fv('uFishShape', fishShapeUniforms);
    waterPipeline.set1f('uFishCount', count);
}
