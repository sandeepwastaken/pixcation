const windRowCache = new Map();
let weatherWind = 1;

function getWindOffset(time, x, y, strength = 1, gust = 0.7 + 0.3 * Math.sin(time / 7100)) {
    const phase = x * 0.013 + y * 0.007;
    return Math.round((Math.sin(time / 1700 + phase) + 0.35 * Math.sin(time / 530 + phase)) * gust * strength);
}

function getWindRowOffset(offset, y, height) {
    return Math.round(offset * ((height - 1 - y) / Math.max(1, height - 1)) ** 2);
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

function getSeeThroughPattern(context, level) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const pattern = canvas.getContext('2d');
    for (let index = 0; index < 16; index++) if (SEE_THROUGH_RANKS[index] < level) pattern.fillRect(index & 3, index >> 2, 1, 1);
    return context.createPattern(canvas, 'repeat');
}

function getSeeThroughTexture(scene, key, level) {
    const name = `${key}-see${level}`;
    if (scene.textures.exists(name)) return name;
    const source = getTextureSource(scene, key);
    createCanvasTexture(scene, name, source.width, source.height, context => {
        context.drawImage(source, 0, 0);
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = getSeeThroughPattern(context, level);
        context.fillRect(0, 0, source.width, source.height);
    });
    return name;
}

function stepSeeThrough(target, hiding, time) {
    const goal = hiding ? SEE_THROUGH_LEVEL : 0;
    if ((target.seeLevel ??= 0) === goal || time < (target.seeStepAt ?? 0)) return false;
    target.seeLevel += Math.sign(goal - target.seeLevel);
    target.seeStepAt = time + SEE_THROUGH_STEP;
    return true;
}

function seeThrough(scene, key, level) {
    return level ? getSeeThroughTexture(scene, key, level) : key;
}

function getBushWindTextures(scene, offset, count) {
    const cache = scene.bushWindTextureCache ||= new Map();
    let textures = cache.get(offset);
    if (!textures) cache.set(offset, textures = []);
    for (let index = textures.length; index < count; index++) textures.push(getWindTexture(scene, `bush-slice-${index}`, offset));
    return textures;
}
function updateBushRustle(scene, time, isWalking) {
    const gust = (0.7 + 0.3 * Math.sin(time / 7100)) * weatherWind;
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
            if (stepSeeThrough(bush, right > bush.x + 4 && left < bush.x + 28 && bottom > bush.y - 20 && bottom < bush.y + 1, time)) bush.offset = null;

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
                bush.slices[index].setTexture(seeThrough(scene, textures[index], bush.seeLevel));
                bush.slices[index].x = x;
            }
        }
        for (const tree of chunk.trees) {
            const centerX = tree.x + tree.width / 2;
            const touching = left < centerX + 8 && right > centerX - 8 &&
                top < tree.baseY + 2 && bottom > tree.baseY - 12;
            if (touching && isWalking && !tree.touching) tree.rustleStart = time;
            tree.touching = touching;
            if (tree.color && chunk.visible && time >= (tree.nextLeafAt ??= time + Math.random() * TREE_LEAF_RANGE)) {
                tree.nextLeafAt = time + TREE_LEAF_MIN + Math.random() * TREE_LEAF_RANGE;
                spawnParticle(scene, worldObjectLayer, time, tree.x + 14 + Math.floor(Math.random() * (tree.width - 28)), tree.y + 40 + Math.floor(Math.random() * 8), Math.random() < 0.5 ? -1 : 1, 2, TREE_LEAF_LIFETIME, tree.color, tree.baseY + 0.2);
            }
            const hiding = right > tree.x + 10 && left < tree.x + tree.width - 10 && bottom > tree.y + 12 && bottom < tree.baseY - 2;
            if (tree.trunk && stepSeeThrough(tree, hiding, time)) {
                tree.offset = null;
                tree.trunk.setTexture(seeThrough(scene, tree.trunkTexture, tree.seeLevel));
            }
            const age = time - tree.rustleStart;
            const rustle = age < BUSH_RUSTLE_DURATION
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)] : 0;
            const offset = getWindOffset(time, tree.x, tree.baseY, 1.6, gust) + rustle;
            if (tree.offset === offset) continue;
            tree.offset = offset;
            const windTexture = getWindTexture(scene, tree.texture, offset);
            tree.canopy.setTexture(seeThrough(scene, windTexture, tree.seeLevel));
            tree.canopy.x = tree.x - 3;
        }
    }
    if (store) {
        const hiding = right > store.x + 4 && left < store.x + STORE_WIDTH - 4 && bottom > store.y + 4 && bottom < store.y + STORE_HITBOX_Y;
        if (stepSeeThrough(store, hiding, time)) store.setTexture(seeThrough(scene, 'store', store.seeLevel));
    }
}

let treeShadowChunkCount = 0;

function updateTreeShadows(scene, time) {
    if (time < (scene.nextTreeShadowAt || 0)) return;
    scene.nextTreeShadowAt = time + 80;
    const trees = scene.treeShadowTrees ||= [];
    trees.length = 0;
    let signature = 17;
    for (const chunk of loadedChunks.values()) {
        signature = Math.imul(signature, 31) + (chunk.shadowId ||= ++treeShadowChunkCount) | 0;
        for (const tree of chunk.trees) {
            trees.push(tree);
            signature = Math.imul(signature, 31) + (tree.offset ?? 97) | 0;
        }
        signature = Math.imul(signature, 31) + (chunk.waterTexture ? 2 : 0) + (chunk.visible ? 1 : 0) | 0;
    }
    if (signature === scene.treeShadowSignature) return;
    scene.treeShadowSignature = signature;
    scene.actorShadeVersion = (scene.actorShadeVersion || 0) + 1;
    for (const chunk of loadedChunks.values()) {
        if (!chunk.visible) continue;
        const left = chunk.pixelX;
        const top = chunk.pixelY;
        const right = left + CHUNK_PIXEL_SIZE;
        const bottom = top + CHUNK_PIXEL_SIZE;
        const shadowTrees = trees.filter(tree => !(tree.x + tree.width + TREE_SHADOW_SHIFT < left || tree.x - 3 > right || tree.baseY + 32 < top || tree.baseY - 32 > bottom));
        const nextShadowSignature = (chunk.waterTexture ? 'w:' : 'land:') + shadowTrees.map(tree => `${tree.x},${tree.y},${tree.offset};`).join('');
        if (chunk.treeShadowSignature === nextShadowSignature) continue;
        const points = new Set();
        const contact = new Set();
        for (const tree of shadowTrees) {
            const x = tree.x, y = tree.y;
            const shifts = getWindRows(tree.offset, tree.shadowHeight);
            for (let point = 0; point < tree.shadow.length; point += 2) {
                const shadowY = tree.shadow[point + 1], shift = shifts[shadowY - tree.shadowTop];
                const localX = x + tree.shadow[point] + shift - left;
                const localY = y + shadowY - top;
                if (localX >= 0 && localY >= 0 && localX < CHUNK_PIXEL_SIZE && localY < CHUNK_PIXEL_SIZE) points.add(localY * CHUNK_PIXEL_SIZE + localX);
            }
            for (let point = 0; point < tree.contactShadow.length; point += 2) {
                const localX = x + tree.contactShadow[point] - left;
                const localY = y + tree.contactShadow[point + 1] - top;
                if (localX >= 0 && localY >= 0 && localX < CHUNK_PIXEL_SIZE && localY < CHUNK_PIXEL_SIZE) contact.add(localY * CHUNK_PIXEL_SIZE + localX);
            }
        }
        chunk.treeShadePoints = points; chunk.treeShadowSignature = nextShadowSignature; if (!points.size && !chunk.treeShadowTexture) continue;
        if (!chunk.treeShadowTexture) {
            chunk.treeShadowTexture = acquireChunkCanvas(scene);
            chunk.treeShadowLayer = createChunkLayer(scene, chunk.treeShadowTexture, chunk.pixelX, chunk.pixelY, 2);
            chunk.treeShadowImage = chunk.treeShadowTexture.getContext().createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
        }
        const image = chunk.treeShadowImage;
        image.data.fill(0);
        const water = chunk.waterShadowBase ? (chunk.treeWaterShadowImage ||= new ImageData(new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4), CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE)) : null;
        if (water) water.data.set(chunk.waterShadowBase);
        for (const pixel of contact) points.add(pixel);
        const colors = chunk.treeShadowColors ||= new Int32Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE).fill(-2);
        for (const pixel of points) {
            const worldX = left + pixel % CHUNK_PIXEL_SIZE;
            const worldY = top + Math.floor(pixel / CHUNK_PIXEL_SIZE);
            if (water?.data[pixel * 4] && isWaterPixel(scene, worldX, worldY)) {
                water.data[pixel * 4] = 128;
                continue;
            }
            if (colors[pixel] === -2) {
                const ground = getGroundShadowColor(scene, worldX, worldY);
                colors[pixel] = ground ? (ground[0] << 16) | (ground[1] << 8) | ground[2] : -1;
            }
            const packed = colors[pixel];
            if (packed < 0) continue;
            const color = contact.has(pixel) ? shadeColor(packed >> 16, packed >> 8 & 255, packed & 255) : null;
            writeRGBPixel(image.data, pixel, color ? (color[0] << 16) | (color[1] << 8) | color[2] : packed);
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
