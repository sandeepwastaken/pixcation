const fishMigrations = [];
let fishRegionStack;
let fishRegionPixels;

function getChunkPixelIndex(chunk, x, y) {
    const localX = Math.floor(x) - chunk.pixelX;
    const localY = Math.floor(y) - chunk.pixelY;

    return localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE
        ? -1
        : localY * CHUNK_PIXEL_SIZE + localX;
}

function queueFishMigration(chunk, fish) {
    if (getChunkPixelIndex(chunk, fish.x, fish.y) !== -1) return;

    const targetChunk = getFishChunkAt(fish.x, fish.y);
    if (targetChunk && targetChunk !== chunk && loadedWaterChunks.has(targetChunk)) {
        fishMigrations.push(chunk, targetChunk, fish);
    }
}

function getFishDepth(chunk, x, y) {
    const index = getChunkPixelIndex(chunk, x, y);
    return index === -1 ? 0 : chunk.shoreDistances[index];
}

function getFishChunkAt(x, y) {
    return loadedChunks.get(getChunkKey(Math.floor(x / CHUNK_PIXEL_SIZE), Math.floor(y / CHUNK_PIXEL_SIZE)));
}

function getFishRegionAt(chunk, x, y) {
    const index = chunk?.fishRegions ? getChunkPixelIndex(chunk, x, y) : -1;
    return index === -1 ? 0 : chunk.fishRegions[index];
}

function canFishSwim(chunk, fish, x, y) {
    const ownIndex = getChunkPixelIndex(chunk, x, y);
    const targetChunk = ownIndex !== -1 ? chunk : getFishChunkAt(x, y);
    const index = ownIndex !== -1 ? ownIndex : targetChunk?.fishRegions ? getChunkPixelIndex(targetChunk, x, y) : -1;

    if (index === -1 || !targetChunk.fishRegions || targetChunk.shoreDistances[index] < FISH_MIN_DEPTH + fish.radius) {
        return false;
    }

    const targetRegion = targetChunk.fishRegions[index];

    return targetRegion > 0 && (targetChunk !== chunk || targetRegion === fish.region);
}

function labelFishRegions(chunk) {
    const size = CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE;
    const labels = new Uint16Array(size);
    const deep = pixel => !labels[pixel] && chunk.shoreDistances[pixel] >= FISH_MIN_DEPTH;
    const regions = [];
    let pixelCount = 0;

    fishRegionStack ||= new Int32Array(size);
    fishRegionPixels ||= new Uint32Array(size);

    for (let start = 0; start < size; start++) {
        if (!deep(start)) continue;

        const label = regions.length + 1;
        const regionStart = pixelCount;
        let top = 0;

        const visit = pixel => {
            labels[pixel] = label;
            fishRegionStack[top++] = pixel;
        };

        visit(start);

        while (top > 0) {
            const pixel = fishRegionStack[--top];
            const x = pixel % CHUNK_PIXEL_SIZE;

            fishRegionPixels[pixelCount++] = pixel;
            if (x > 0 && deep(pixel - 1)) visit(pixel - 1);
            if (x < CHUNK_PIXEL_SIZE - 1 && deep(pixel + 1)) visit(pixel + 1);
            if (pixel >= CHUNK_PIXEL_SIZE && deep(pixel - CHUNK_PIXEL_SIZE)) visit(pixel - CHUNK_PIXEL_SIZE);
            if (pixel < size - CHUNK_PIXEL_SIZE && deep(pixel + CHUNK_PIXEL_SIZE)) visit(pixel + CHUNK_PIXEL_SIZE);
        }

        regions.push({ start: regionStart, length: pixelCount - regionStart });
    }

    chunk.fishRegions = labels;
    return regions;
}

function isFishPathClear(chunk, fish, targetX, targetY) {
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 3);

    for (let step = 1; step <= steps; step++) {
        if (!canFishSwim(chunk, fish, fish.x + dx * step / steps, fish.y + dy * step / steps)) return false;
    }

    return true;
}
