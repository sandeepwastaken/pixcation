let chestSilhouette;
let chestSprite;

function createChestSilhouette(scene) {
    const source = getTerrainPixels(scene, 'chest');
    const width = source.width / 2;
    const height = source.height / 2;
    const image = new ImageData(width, height);
    const points = [];
    let top = height;
    let bottom = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const counts = new Map();
            let cover = 0;
            let best = -1;

            for (let offset = 0; offset < 4; offset++) {
                const index = ((y * 2 + (offset >> 1)) * source.width + x * 2 + (offset & 1)) * 4;
                if (!source.data[index + 3]) continue;

                const color = source.data[index] << 16 | source.data[index + 1] << 8 | source.data[index + 2];
                const count = (counts.get(color) || 0) + 1;
                const brightness = source.data[index] + source.data[index + 1] + source.data[index + 2];
                const bestBrightness = (best >> 16 & 255) + (best >> 8 & 255) + (best & 255);

                counts.set(color, count);
                cover++;

                if (best === -1 || count > counts.get(best) || count === counts.get(best) && brightness < bestBrightness) {
                    best = color;
                }
            }

            if (cover < 3) continue;

            writeRGBPixel(image.data, y * width + x, best);
            points.push(x, y);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
    }

    createCanvasTexture(scene, 'chest-small', width, height, context => context.putImageData(image, 0, 0));

    chestSilhouette = { width, top, bottom, points };
    chestSprite = scene.add.image(0, 0, 'chest-small').setOrigin(0.5, 1).setVisible(false);
    worldObjectLayer.add(chestSprite);
}

function findChunkChest(chunk) {
    const { chunkX, chunkY, shoreDistances } = chunk;
    const id = getTileId(chunkX, chunkY);

    if (openedChests.has(id) || worldHash(chunkX, chunkY, CHEST_SALT) > CHEST_CHANCE) return null;

    const { width, bottom, points } = chestSilhouette;

    for (let attempt = 0; attempt < CHEST_PLACEMENT_ATTEMPTS; attempt++) {
        const localX = Math.floor(worldHash(chunkX * CHEST_PLACEMENT_ATTEMPTS + attempt, chunkY, CHEST_SALT + 1) * (CHUNK_PIXEL_SIZE - width));
        const localY = Math.floor(worldHash(chunkX, chunkY * CHEST_PLACEMENT_ATTEMPTS + attempt, CHEST_SALT + 2) * (CHUNK_PIXEL_SIZE - bottom - 1));
        let deep = true;

        for (let point = 0; point < points.length && deep; point += 2) {
            deep = shoreDistances[(localY + points[point + 1]) * CHUNK_PIXEL_SIZE + localX + points[point]] >= CHEST_MIN_DEPTH;
        }

        if (deep) {
            return { id, localX, localY, x: chunk.pixelX + localX, y: chunk.pixelY + localY, original: new Uint8Array(points.length / 2), nextBubbleAt: 0 };
        }
    }

    return null;
}

function bakeChestSilhouette(chunk, data) {
    const chest = chunk.chest = findChunkChest(chunk);
    if (!chest) return;

    const points = chestSilhouette.points;

    for (let point = 0; point < points.length; point += 2) {
        const index = ((chest.localY + points[point + 1]) * CHUNK_PIXEL_SIZE + chest.localX + points[point]) * 4;
        chest.original[point / 2] = data[index];
        data[index] = 128;
    }
}

function eraseChestSilhouette(chunk) {
    const chest = chunk.chest;
    const { width, top, bottom, points } = chestSilhouette;
    const height = bottom - top + 1;
    const context = chunk.waterTexture.getContext();
    const image = context.getImageData(chest.localX, chest.localY + top, width, height);

    for (let point = 0; point < points.length; point += 2) {
        image.data[((points[point + 1] - top) * width + points[point]) * 4] = chest.original[point / 2];
    }

    context.putImageData(image, chest.localX, chest.localY + top);
    chunk.waterTexture.refresh();
    chunk.chest = null;
}

function findChestAt(x, y) {
    const { width, top, bottom } = chestSilhouette;

    for (const chunk of loadedWaterChunks) {
        const chest = chunk.chest;

        if (
            chest && x >= chest.x - CHEST_SNAG_MARGIN && x < chest.x + width + CHEST_SNAG_MARGIN &&
            y >= chest.y + top - CHEST_SNAG_MARGIN && y <= chest.y + bottom + CHEST_SNAG_MARGIN
        ) {
            return chunk;
        }
    }

    return null;
}

function snagChest(scene, time, chunk) {
    setFishingState('snagged', time);
    fishing.chestChunk = chunk;
    fishing.bobberY = fishing.toY + 3;
    splash(scene, time, fishing.toX, fishing.toY);
}

function haulChest(time) {
    const chunk = fishing.chestChunk;
    fishing.chestChunk = null;

    if (!chunk?.chest || !loadedWaterChunks.has(chunk)) return reelIn(time);

    openedChests.add(chunk.chest.id);
    eraseChestSilhouette(chunk);
    saveDirty = true;
    startReeling(time);
    fishing.hauling = true;
    splash(mainCamera.scene, time, fishing.bobberX, fishing.bobberY);
}

function drawHauledChest(amount) {
    const lift = Math.round(Math.sin(amount * Math.PI) * 6);

    chestSprite
        .setPosition(Math.round(fishing.bobberX), Math.round(fishing.bobberY + 6 - lift))
        .setDepth(Math.max(character.depth + 0.3, fishing.bobberY))
        .setVisible(true);
}

function pickChestBait() {
    let roll = Math.random() * CHEST_BAIT_WEIGHT_TOTAL;

    for (let index = 0; index < MARKET_BAITS.length; index++) {
        roll -= CHEST_BAIT_WEIGHTS[index];
        if (roll <= 0) return MARKET_BAITS[index];
    }

    return MARKET_BAITS[0];
}

function openHauledChest(scene, time, x, y) {
    chestSprite.setVisible(false);

    const bait = pickChestBait();
    const amount = bait === MARKET_BAITS[MARKET_BAITS.length - 1] ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
    const rewards = [`+${amount} ${bait.label}`];

    addBait(bait, amount);

    if (Math.random() < CHEST_FISH_CHANCE) {
        const species = chooseFishSpecies(CHEST_FISH_WATER);
        addCaughtFish(species);
        rewards.push(species.name);
    }

    for (let index = 0; index < CHEST_SPARKLE_COLORS.length * 2; index++) {
        spawnParticle(
            scene, worldObjectLayer, time, x - 3 + index, y - 4 - (index % 2) * 2,
            index % 2 ? 1 : -1, -1, 360, CHEST_SPARKLE_COLORS[index % CHEST_SPARKLE_COLORS.length], character.depth + 0.4
        );
    }

    showRewardCard(scene, time, 'You found a treasure chest!', rewards.join(' · '));
}

function updateChestBubbles(scene, time) {
    const { width, top } = chestSilhouette;

    for (const chunk of loadedWaterChunks) {
        const chest = chunk.chest;
        if (!chest || !chunk.visible || time < chest.nextBubbleAt) continue;

        chest.nextBubbleAt = time + CHEST_BUBBLE_MIN + Math.random() * CHEST_BUBBLE_RANGE;
        spawnParticle(scene, shadowLayer, time, chest.x + 2 + Math.floor(Math.random() * (width - 4)), chest.y + top, 0, -1, CHEST_BUBBLE_LIFETIME, CHEST_BUBBLE_COLOR);
    }
}
