const windRowCache = new Map();

function getWindOffset(time, x, y, strength = 1, gust = 0.7 + 0.3 * Math.sin(time / 7100)) {
    const phase = x * 0.013 + y * 0.007;
    return Math.round((Math.sin(time / 1700 + phase) + 0.35 * Math.sin(time / 530 + phase)) * gust * strength);
}

function getWindRowOffset(offset, y, height) {
    return Math.round(offset * (height - 1 - y) / Math.max(1, height - 1));
}

function getWindRows(offset, height) {
    let offsets = windRowCache.get(height);
    if (!offsets) windRowCache.set(height, offsets = new Map());
    const cached = offsets.get(offset);
    if (cached) return cached;
    const rows = Int8Array.from({ length: height }, (_, y) => getWindRowOffset(offset, y, height));
    offsets.set(offset, rows);
    return rows;
}

function getWindTexture(scene, key, offset) {
    const name = `${key}-wind-${offset}`;
    if (scene.textures.exists(name)) return name;
    const source = getTextureSource(scene, key);
    const shifts = getWindRows(offset, source.height);
    createCanvasTexture(scene, name, source.width + 6, source.height, context => {
        context.imageSmoothingEnabled = false;
        for (let y = 0; y < source.height; y++) {
            const shift = shifts[y];
            context.drawImage(source, 0, y, source.width, 1, 3 + shift, y, source.width, 1);
        }
    });
    return name;
}

function getBushWindTextures(scene, offset, count) {
    const cache = scene.bushWindTextureCache ||= new Map();
    let textures = cache.get(offset);
    if (!textures) cache.set(offset, textures = []);
    for (let index = textures.length; index < count; index++) textures.push(getWindTexture(scene, `bush-slice-${index}`, offset));
    return textures;
}
function updateBushRustle(scene, time, isWalking) {
    const gust = 0.7 + 0.3 * Math.sin(time / 7100);
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
            const rustle = age < BUSH_RUSTLE_DURATION
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)]
                : 0;

            const offset = rustle + getWindOffset(time, bush.x, bush.y, 1, gust);
            if (offset === bush.offset) continue;

            bush.offset = offset;
            const textures = getBushWindTextures(scene, offset, bush.slices.length);
            const x = bush.x - 3;

            for (let index = 0; index < bush.slices.length; index++) {
                bush.slices[index].setTexture(textures[index]);
                bush.slices[index].x = x;
            }
        }
        for (const tree of chunk.trees) {
            const centerX = tree.x + tree.width / 2;
            const touching = left < centerX + 8 && right > centerX - 8 &&
                top < tree.baseY + 2 && bottom > tree.baseY - 12;
            if (touching && isWalking && !tree.touching) tree.rustleStart = time;
            tree.touching = touching;
            const age = time - tree.rustleStart;
            const rustle = age < BUSH_RUSTLE_DURATION
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)] : 0;
            const offset = getWindOffset(time, tree.x, tree.baseY, 1.6, gust) + rustle;
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
    const trees = scene.treeShadowTrees ||= [];
    trees.length = 0;
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
        const left = chunk.pixelX;
        const top = chunk.pixelY;
        const right = left + CHUNK_PIXEL_SIZE;
        const bottom = top + CHUNK_PIXEL_SIZE;
        const shadowTrees = trees.filter(tree => !(tree.x + tree.width + 3 < left || tree.x - 3 > right || tree.baseY + 32 < top || tree.baseY - 32 > bottom));
        const nextShadowSignature = (chunk.waterTexture ? 'w:' : 'land:') + shadowTrees.map(tree => `${tree.x},${tree.y},${tree.offset};`).join('');
        if (chunk.treeShadowSignature === nextShadowSignature) continue;
        const points = new Set();
        for (const tree of shadowTrees) {
            const x = tree.x;
            const shifts = getWindRows(tree.offset, tree.shadowHeight);
            for (let point = 0; point < tree.shadow.length; point += 2) {
                const shift = shifts[tree.shadow[point + 1] - tree.shadowTop];
                const localX = x + tree.shadow[point] + shift - left;
                const localY = tree.y + tree.shadow[point + 1] - top;
                if (localX >= 0 && localY >= 0 && localX < CHUNK_PIXEL_SIZE && localY < CHUNK_PIXEL_SIZE) points.add(localY * CHUNK_PIXEL_SIZE + localX);
            }
        }
        if (!points.size && !chunk.treeShadowTexture) continue;
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
            const worldX = left + pixel % CHUNK_PIXEL_SIZE;
            const worldY = top + Math.floor(pixel / CHUNK_PIXEL_SIZE);
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
