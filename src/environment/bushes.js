function getWindOffset(time, x, y, strength = 1) {
    const phase = x * 0.013 + y * 0.007;
    const gust = 0.7 + 0.3 * Math.sin(time / 7100);
    return Math.round((Math.sin(time / 1700 + phase) + 0.35 * Math.sin(time / 530 + phase)) * gust * strength);
}

function getWindRowOffset(offset, y, height) {
    return Math.round(offset * (height - 1 - y) / Math.max(1, height - 1));
}

function getWindTexture(scene, key, offset) {
    const name = `${key}-wind-${offset}`;
    if (scene.textures.exists(name)) return name;
    const source = getTextureSource(scene, key);
    createCanvasTexture(scene, name, source.width + 6, source.height, context => {
        context.imageSmoothingEnabled = false;
        for (let y = 0; y < source.height; y++) {
            const shift = getWindRowOffset(offset, y, source.height);
            context.drawImage(source, 0, y, source.width, 1, 3 + shift, y, source.width, 1);
        }
    });
    return name;
}

function updateBushRustle(scene, time, isWalking) {
    const left = character.x + CHARACTER_HITBOX_X;
    const top = character.y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    for (const chunk of loadedChunks.values()) {
        for (const bush of chunk.bushes) {
            const touching =
                left < bush.x + BUSH_FOOTPRINT_RIGHT &&
                right > bush.x + BUSH_FOOTPRINT_LEFT &&
                top < bush.y &&
                bottom > bush.y - BUSH_FOOTPRINT_HEIGHT;

            if (touching && isWalking && (!bush.touching || time - bush.rustleStart > BUSH_RUSTLE_REPEAT)) {
                bush.rustleStart = time;
                dropLeaves(scene, time, bush);
            }

            bush.touching = touching;

            const age = time - bush.rustleStart;
            const rustle = age < BUSH_RUSTLE_PATTERN.length * BUSH_RUSTLE_STEP
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)]
                : 0;

            const offset = rustle + getWindOffset(time, bush.x, bush.y);
            if (offset === bush.offset) continue;

            bush.offset = offset;

            for (let index = 0; index < bush.slices.length; index++) {
                bush.slices[index].setTexture(getWindTexture(scene, `bush-slice-${index}`, offset));
                bush.slices[index].x = bush.x - 3;
            }
        }
        for (const tree of chunk.trees) {
            const touching = left < tree.x + tree.width / 2 + 8 && right > tree.x + tree.width / 2 - 8 &&
                top < tree.baseY + 2 && bottom > tree.baseY - 12;
            if (touching && isWalking && !tree.touching) tree.rustleStart = time;
            tree.touching = touching;
            const age = time - tree.rustleStart;
            const rustle = age < BUSH_RUSTLE_PATTERN.length * BUSH_RUSTLE_STEP
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)] : 0;
            const offset = getWindOffset(time, tree.x, tree.baseY, 1.6) + rustle;
            if (tree.offset === offset) continue;
            tree.offset = offset;
            tree.canopy.setTexture(getWindTexture(scene, tree.texture, offset));
            tree.canopy.x = tree.x - 3;
        }
    }
}

function updateTreeShadows(scene, time) {
    if (time < (scene.nextTreeShadowAt || 0)) return;
    scene.nextTreeShadowAt = time + 80;
    const trees = [];
    let signature = '';
    for (const chunk of loadedChunks.values()) {
        signature += `${chunk.key}:`;
        for (const tree of chunk.trees) {
            trees.push(tree);
            signature += `${tree.offset},`;
        }
        signature += chunk.waterTexture ? 'w' : '';
    }
    if (signature === scene.treeShadowSignature) return;
    scene.treeShadowSignature = signature;
    for (const chunk of loadedChunks.values()) {
        const shadowTrees = trees.filter(tree => !(tree.x + tree.width + 3 < chunk.pixelX || tree.x - 3 > chunk.pixelX + CHUNK_PIXEL_SIZE || tree.baseY + 32 < chunk.pixelY || tree.baseY - 32 > chunk.pixelY + CHUNK_PIXEL_SIZE));
        const nextShadowSignature = (chunk.waterTexture ? 'w:' : 'land:') + shadowTrees.map(tree => `${tree.x},${tree.y},${tree.offset};`).join('');
        if (chunk.treeShadowSignature === nextShadowSignature) continue;
        const points = [];
        for (const tree of shadowTrees) {
            const x = tree.x;
            const rows = tree.shadowRows ||= new Map();
            if (!rows.has(tree.offset)) rows.set(tree.offset, Int8Array.from({ length: tree.shadowHeight }, (_, y) => getWindRowOffset(tree.offset, y, tree.shadowHeight)));
            const shifts = rows.get(tree.offset);
            for (let point = 0; point < tree.shadow.length; point += 2) {
                const shift = shifts[tree.shadow[point + 1] - tree.shadowTop];
                const localX = x + tree.shadow[point] + shift - chunk.pixelX;
                const localY = tree.y + tree.shadow[point + 1] - chunk.pixelY;
                if (localX >= 0 && localY >= 0 && localX < CHUNK_PIXEL_SIZE && localY < CHUNK_PIXEL_SIZE) points.push(localY * CHUNK_PIXEL_SIZE + localX);
            }
        }
        if (!points.length && !chunk.treeShadowTexture) continue;
        chunk.treeShadowSignature = nextShadowSignature;
        if (!chunk.treeShadowTexture) {
            chunk.treeShadowTexture = acquireChunkCanvas(scene);
            chunk.treeShadowLayer = createChunkLayer(scene, chunk.treeShadowTexture, chunk.pixelX, chunk.pixelY, 2);
            chunk.treeShadowImage = chunk.treeShadowTexture.getContext().createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
        }
        const image = chunk.treeShadowImage;
        image.data.fill(0);
        const water = chunk.waterShadowBase ? (chunk.treeWaterShadowImage ||= new ImageData(new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4), CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE)) : null;
        if (water) water.data.set(chunk.waterShadowBase);
        for (const pixel of points) {
            const worldX = chunk.pixelX + pixel % CHUNK_PIXEL_SIZE;
            const worldY = chunk.pixelY + Math.floor(pixel / CHUNK_PIXEL_SIZE);
            if (water?.data[pixel * 4] && isWaterPixel(scene, worldX, worldY)) {
                water.data[pixel * 4] = 128;
                continue;
            }
            const color = getGroundShadowColor(scene, worldX, worldY);
            if (color !== null) writeRGBPixel(image.data, pixel, (color[0] << 16) | (color[1] << 8) | color[2]);
        }
        chunk.treeShadowTexture.getContext().putImageData(image, 0, 0);
        chunk.treeShadowTexture.refresh();
        chunk.treeShadowLayer.setVisible(chunk.visible);
        if (water) {
            chunk.waterTexture.getContext().putImageData(water, 0, 0);
            chunk.waterTexture.refresh();
        }
    }
}
