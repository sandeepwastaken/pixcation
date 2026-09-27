function extractRodArtStyles(scene) {
    const colorAt = (texture, x, y, fallback) => {
        const color = scene.textures.getPixel(x, y, texture);
        return color ? Phaser.Display.Color.GetColor(color.red, color.green, color.blue) : fallback;
    };

    for (const rod of MARKET_RODS) {
        rod.polePalette = [
            colorAt(rod.texture, 19, 4, 0x4c3e32),
            colorAt(rod.texture, 19, 6, 0x6b533b),
            colorAt(rod.texture, 19, 5, 0x806953)
        ];
        rod.linePalette = [
            colorAt(rod.texture, 28, 2, 0xa78178),
            colorAt(rod.texture, 29, 3, 0xb99f92),
            colorAt(rod.texture, 29, 5, 0xc8b8a8),
            colorAt(rod.texture, 30, 9, FISHING_LINE_COLOR)
        ];
        rod.bobberPalette = [
            colorAt(rod.texture, 27, 26, BOBBER_TOP_COLOR),
            colorAt(rod.texture, 25, 26, BOBBER_TOP_COLOR),
            colorAt(rod.texture, 23, 25, BOBBER_BOTTOM_COLOR)
        ];
    }
}

function createShimmerSheet(scene) {
    const source = getTextureSource(scene, 'shimmer-art');
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;

    const context = canvas.getContext('2d');
    context.drawImage(source, 0, 0);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const [fromR, fromG, fromB] = SHIMMER_RECOLOR_FROM;
    const [toR, toG, toB] = SHIMMER_RECOLOR_TO;

    for (let index = 0; index < image.data.length; index += 4) {
        if (image.data[index] === fromR && image.data[index + 1] === fromG && image.data[index + 2] === fromB) {
            image.data[index] = toR;
            image.data[index + 1] = toG;
            image.data[index + 2] = toB;
        }
    }

    context.putImageData(image, 0, 0);
    scene.textures.addSpriteSheet('shimmer', canvas, { frameWidth: 12, frameHeight: 1 });
}

function extractSilhouetteShadow(scene, key) {
    const pixels = getTerrainPixels(scene, key);
    const { width, height } = pixels;
    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && pixels.data[(y * width + x) * 4 + 3] > 0;
    const points = [];

    for (let y = 0; y < height + WOOD_SHADOW_OFFSET; y++) {
        for (let x = 0; x < width + WOOD_SHADOW_OFFSET; x++) {
            if (solid(x - WOOD_SHADOW_OFFSET, y - WOOD_SHADOW_OFFSET) && !solid(x, y)) {
                points.push(x, y);
            }
        }
    }

    return points;
}

function createPropArt(scene) {
    for (const key of ['bush', 'rock', 'boulder']) {
        const source = getTextureSource(scene, key);
        propArt.set(key, { width: source.width, height: source.height, shadow: extractSilhouetteShadow(scene, key) });
    }

    const trunk = getTerrainPixels(scene, 'tree-bare');
    treeVariants.length = 0;

    for (let index = 0; index < TREE_VARIANT_COUNT; index++) {
        const variant = generateTreeVariant(trunk, Math.floor(worldHash(index, 0, 766) * 4294967295));
        variant.key = `tree-${index}`;

        if (!scene.textures.exists(variant.key)) {
            const texture = scene.textures.createCanvas(variant.key, variant.width, variant.height);
            texture.getContext().putImageData(new ImageData(variant.data, variant.width, variant.height), 0, 0);
            texture.refresh();
        }

        treeVariants.push(variant);
    }
}

function createBushSlices(scene) {
    const source = getTextureSource(scene, 'bush');
    const { width, height} = source;

    for (let slice = 0; slice < TILE_SIZE; slice++) {
        const key = `bush-slice-${slice}`;
        if (scene.textures.exists(key)) continue;

        const texture = scene.textures.createCanvas(key, width, height);
        const context = texture.getContext();

        context.drawImage(source, 0, 0);
        const image = context.getImageData(0, 0, width, height);

        for (let y= 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const depth = Math.min(TILE_SIZE - 1, Math.floor(
                    (worldHash(x, y, 761) * 0.7 +
                        (y / (height - 1)) * 0.3) * TILE_SIZE
                ));

                if (depth !== slice) {
                    image.data[(y * width + x) * 4 + 3] = 0;
                }
            }
        }

        context.putImageData(image, 0, 0);
        texture.refresh();
    }
}

function createSeededRandom(seed) {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = Math.imul(state ^ (state >>> 15), state | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function leafHash(x, y, salt) {
    return coordinateHash(x, y, Math.imul(salt, 2246822519));
}

function pickTreePalette(random) {
    const total = TREE_LEAF_PALETTES.reduce((sum, palette) => sum + palette.weight, 0);
    let roll = random() * total;

    for (const palette of TREE_LEAF_PALETTES) {
        roll -= palette.weight;
        if (roll < 0) return palette;
    }

    return TREE_LEAF_PALETTES[0];
}

function writeTreePixel(data, pixel, color) {
    data[pixel * 4] = color >> 16;
    data[pixel * 4 + 1] = (color >> 8) & 255;
    data[pixel * 4 + 2] = color & 255;
    data[pixel * 4 + 3] = 255;
}

function readTreePixel(data, pixel) {
    return (data[pixel * 4] << 16) | (data[pixel * 4 + 1] << 8) | data[pixel * 4 + 2];
}

function generateTreeVariant(trunk, seed) {
    const random = createSeededRandom(seed);
    const flip = random() < 0.5;
    const width = trunk.width + TREE_PAD_X * 2;
    const height = trunk.height + TREE_PAD_TOP;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < trunk.height; y++) {
        for (let x = 0; x < trunk.width; x++) {
            const source = (y * trunk.width + (flip ? trunk.width - 1 - x : x)) * 4;
            if (!trunk.data[source + 3]) continue;

            const pixel = (y + TREE_PAD_TOP) * width + x + TREE_PAD_X;
            writeTreePixel(data, pixel, (trunk.data[source] << 16) | (trunk.data[source + 1] << 8) | trunk.data[source + 2]);
        }
    }

    const palette = pickTreePalette(random);
    const colors = palette.colors;
    const radiusX = 23 + random() * 5;
    const radiusY = 17 + random() * 3;
    const centerX = width / 2 + (flip ? -1 : 1) + (random() - 0.5) * 3;
    const centerY = TREE_PAD_TOP + 22 + random() * 2;
    const puffs = [{ x: centerX, y: centerY, radius: Math.min(radiusX, radiusY) - 4, core: true }];
    const ringCount = 7 + Math.floor(random() * 3);
    const ringPhase = random() * Math.PI * 2;

    for (let index = 0; index < ringCount; index++) {
        const angle = ringPhase + index / ringCount * Math.PI * 2 + (random() - 0.5) * 0.5;
        const radius = 6.5 + random() * 3;

        puffs.push({
            x: centerX + Math.cos(angle) * (radiusX - radius),
            y: centerY + Math.sin(angle) * (radiusY - radius),
            radius,
            core: false
        });
    }

    const innerCount = 3 + Math.floor(random() * 3);

    for (let index = 0; index < innerCount; index++) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * 0.5;

        puffs.push({
            x: centerX + Math.cos(angle) * distance * radiusX,
            y: centerY + Math.sin(angle) * distance * radiusY + 2,
            radius: 7 + random() * 3,
            core: false
        });
    }

    puffs.sort((a, b) => (a.core ? -1 : b.core ? 1 : a.y - b.y));

    const owner = new Int16Array(width * height).fill(-1);
    const edgeSalt = Math.floor(random() * 100000);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const edge = (leafHash(x, y, edgeSalt) - 0.5) * 1.2;

            for (let index = puffs.length - 1; index >= 0; index--) {
                const puff = puffs[index];
                const dx = x + 0.5 - puff.x;
                const dy = y + 0.5 - puff.y;
                const reach = puff.radius + edge;

                if (dx * dx + dy * dy <= reach * reach) {
                    if (index > 0 && ((x + y) & 1) && Math.sqrt(dx * dx + dy * dy) > reach - 1 && owner[y * width + x] === -1) {
                        owner[y * width + x] = -3;
                        continue;
                    }

                    owner[y * width + x] = index;
                    break;
                }
            }
        }
    }

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] !== -3) continue;

        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let front = -1;

        for (let index = puffs.length - 1; index >= 0 && front < 0; index--) {
            const dx = x + 0.5 - puffs[index].x;
            const dy = y + 0.5 - puffs[index].y;
            const reach = puffs[index].radius + (leafHash(x, y, edgeSalt) - 0.5) * 1.2;
            if (dx * dx + dy * dy <= reach * reach) front = index;
        }

        owner[pixel] = front;
    }

    for (let pass = 0; pass < 2; pass++) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const pixel = y * width + x;
                let count = 0;
                let front = -1;

                for (const next of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
                    if (owner[next] < 0) continue;
                    count++;
                    front = Math.max(front, owner[next]);
                }

                if (owner[pixel] >= 0 && count <= 1) owner[pixel] = -1;
                else if (owner[pixel] < 0 && count >= 3) owner[pixel] = front;
            }
        }
    }

    let top = height;
    let bottom = 0;

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] < 0) continue;
        top = Math.min(top, Math.floor(pixel / width));
        bottom = Math.max(bottom, Math.floor(pixel / width));
    }

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (owner[pixel] < 0) continue;

            let best = 0;

            for (const puff of puffs) {
                const dx = x + 0.5 - puff.x;
                const dy = y + 0.5 - puff.y;
                const lift = puff.radius * puff.radius - dx * dx - dy * dy;
                if (lift > 0) best = Math.max(best, Math.sqrt(lift) * (puff.core ? 0.8 : 1));
            }

            heights[pixel] = best;
        }
    }

    const smooth = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (owner[pixel] < 0) continue;

            let total = 0;
            let count = 0;

            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    const sampleX = x + offsetX;
                    const sampleY = y + offsetY;
                    if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) continue;
                    total += heights[sampleY * width + sampleX];
                    count++;
                }
            }

            smooth[pixel] = total / count;
        }
    }

    const textureSalt = Math.floor(random() * 100000);
    const levels = new Int8Array(width * height).fill(-1);
    const values = new Float32Array(width * height);
    const span = Math.max(1, bottom - top);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (owner[pixel] < 0) continue;

            const depth = (y - top) / span;
            const left = x > 0 ? smooth[pixel - 1] : 0;
            const right = x + 1 < width ? smooth[pixel + 1] : 0;
            const up = y > 0 ? smooth[pixel - width] : 0;
            const down = y + 1 < height ? smooth[pixel + width] : 0;
            const nx = (left - right) * 0.5;
            const ny = (up - down) * 0.5;
            const length = Math.hypot(nx, ny, 1.6);
            const puff = puffs[owner[pixel]];
            const puffX = (x + 0.5 - puff.x) / puff.radius;
            const puffY = (y + 0.5 - puff.y) / puff.radius;
            const puffZ = Math.sqrt(Math.max(0, 1 - puffX * puffX - puffY * puffY));
            const local = puff.core ? 0.5 : -0.45 * puffX - 0.7 * puffY + 0.35 * puffZ;
            const lit = (-0.5 * nx - 0.65 * ny + 0.57 * 1.6) / length * 0.5 + (local * 0.5 + 0.3) * 0.5;
            const global = -0.2 * (x + 0.5 - centerX) / radiusX - 0.6 * (depth - 0.45);
            let value = (lit - 0.62) * 1.9 + global;

            const speck = leafHash((x + (y & 1)) >> 1, y >> 1, textureSalt);
            if (speck > 0.8) value += 0.28;
            else if (speck < 0.2) value -= 0.28;

            values[pixel] = value;
        }
    }

    const sorted = [];
    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] >= 0) sorted.push(values[pixel]);
    }

    sorted.sort((a, b) => a - b);

    const quantile = amount => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(amount * sorted.length)))];
    const bands = TREE_TONE_SHARES.map(share => [quantile(share - TREE_DITHER_SHARE), quantile(share + TREE_DITHER_SHARE)]);

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] < 0) continue;

        const value = values[pixel];
        const checker = (pixel % width + Math.floor(pixel / width)) & 1;
        let level = 0;

        for (const [low, high] of bands) {
            if (value >= high || (value >= low && checker)) level++;
        }

        levels[pixel] = level;
    }

    for (let y = 0; y < bottom - 3; y++) {
        for (let x = 0; x < width; x++) {
            if (owner[y * width + x] < 0) data[(y * width + x) * 4 + 3] = 0;
        }
    }

    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0) writeTreePixel(data, pixel, colors[levels[pixel]]);
    }

    if (palette.extras.length && random() < 0.4) {
        const extra = palette.extras[Math.floor(random() * palette.extras.length)];
        const count = 5 + Math.floor(random() * 6);

        for (let attempt = 0, placed = 0; attempt < 500 && placed < count; attempt++) {
            const pixel = Math.floor(random() * levels.length);
            if (levels[pixel] < 1 || levels[pixel] > 2 || levels[pixel + 1] < 0 || levels[pixel - width] < 0) continue;

            writeTreePixel(data, pixel, extra);
            placed++;
        }
    }

    const bark = [];

    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0 || !data[pixel * 4 + 3]) continue;
        const color = readTreePixel(data, pixel);
        if (!bark.includes(color)) bark.push(color);
    }

    const luma = color => (color >> 16) * 0.299 + ((color >> 8) & 255) * 0.587 + (color & 255) * 0.114;
    bark.sort((a, b) => luma(a) - luma(b));

    for (let x = 0; x < width; x++) {
        let shade = 0;

        for (let y = 0; y < height; y++) {
            const pixel = y * width + x;

            if (levels[pixel] >= 0) {
                shade = 4;
                continue;
            }

            if (shade > 0 && data[pixel * 4 + 3] && (shade > 2 || (x + y) & 1)) {
                writeTreePixel(data, pixel, bark[Math.max(0, bark.indexOf(readTreePixel(data, pixel)) - 1)]);
            }

            shade--;
        }
    }

    const shadow = new Set();
    const groundY = height - 1;

    for (const puff of puffs) {
        const shadowX = centerX + (puff.x - centerX) * 0.8 + 3;
        const shadowY = groundY + (puff.y - centerY) * 0.35;
        const reachX = puff.radius * 0.85;
        const reachY = puff.radius * 0.55;

        for (let y = Math.floor(shadowY - reachY); y <= Math.ceil(shadowY + reachY); y++) {
            for (let x = Math.floor(shadowX - reachX); x <= Math.ceil(shadowX + reachX); x++) {
                const dx = (x + 0.5 - shadowX) / reachX;
                const dy = (y + 0.5 - shadowY) / reachY;
                if (dx * dx + dy * dy <= 1 + (leafHash(x, y, edgeSalt + 1) - 0.5) * 0.25) shadow.add(y * 1024 + x);
            }
        }
    }

    const shadowPoints = [];
    for (const point of shadow) shadowPoints.push(point % 1024, Math.floor(point / 1024));

    let hitLeft = width;
    let hitRight = 0;

    for (let y = height - 12; y < height - 8; y++) {
        for (let x = 0; x < width; x++) {
            if (!data[(y * width + x) * 4 + 3]) continue;
            hitLeft = Math.min(hitLeft, x);
            hitRight = Math.max(hitRight, x + 1);
        }
    }

    return { width, height, data, flip, shadowPoints, hitLeft, hitRight, color: colors[2] };
}

function createRoundedCliffTextures(scene) {
    const source = key => getTextureSource(scene, key);

    for (let left = 0; left < DIRT_CLIFF_TILES.length; left++) {
        for (let right = 0; right < DIRT_CLIFF_TILES[left].length; right++) {
            const key = DIRT_CLIFF_TILES[left][right];

            if (!scene.textures.exists(key)) {
                const texture = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
                const context = texture.getContext();
                const half = TILE_SIZE / 2;

                context.drawImage(
                    source(DIRT_CLIFF_TILES[left][0]),
                    0, 0, half, TILE_SIZE,
                    0, 0, half, TILE_SIZE
                );
                context.drawImage(
                    source(DIRT_CLIFF_TILES[0][right]),
                    half, 0, half, TILE_SIZE,
                    half, 0, half, TILE_SIZE
                );
                texture.refresh();
            }

            const cliffKey = left === 1 || right === 1 ? `${key}-trimmed` : key;

            if (!scene.textures.exists(cliffKey)) {
                const texture = scene.textures.createCanvas(cliffKey, TILE_SIZE, TILE_SIZE);
                const context = texture.getContext();
                context.drawImage(source(key), 0, 0);

                if (left === 1) {
                    context.clearRect(0, TILE_SIZE - 1, 2, 1);
                    context.clearRect(0, TILE_SIZE - 2, 1, 1);
                }

                if (right === 1) {
                    context.clearRect(TILE_SIZE - 2, TILE_SIZE - 1, 2, 1);
                    context.clearRect(TILE_SIZE - 1, TILE_SIZE - 2, 1, 1);
                }

                texture.refresh();
            }

            for (const corner of ['cornerDirt1', 'cornerDirt2', 'cornerDirt3']) {
                const roundedKey = `${cliffKey}-${corner}`;
                if (scene.textures.exists(roundedKey)) continue;

                const texture = scene.textures.createCanvas(roundedKey, TILE_SIZE, TILE_SIZE);
                const context = texture.getContext();

                context.drawImage(source(cliffKey), 0, 0);
                context.clearRect(0, 0, TILE_SIZE, 5);
                context.drawImage(
                    source(corner),
                    0, 0, TILE_SIZE, 5,
                    0, 0, TILE_SIZE, 5
                );
                texture.refresh();
            }
        }
    }

    for (const base of ['waterDirt', 'waterGrass']) {
        for (const [suffix, left, right] of [
            ['InnerLeft', true, false],
            ['InnerRight', false, true],
            ['InnerBoth', true, true]
        ]) {
            const key = `${base}${suffix}`;
            if (scene.textures.exists(key)) continue;

            const texture = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
            const context = texture.getContext();
            context.drawImage(source(base), 0, 0);

            if (left) {
                context.drawImage(
                    source('waterDirtInnerLeft'),
                    0, 0, 5, TILE_SIZE,
                    0, 0, 5, TILE_SIZE
                );
            }

            if (right) {
                context.drawImage(
                    source('waterDirtInnerRight'),
                    TILE_SIZE - 5, 0, 5, TILE_SIZE,
                    TILE_SIZE - 5, 0, 5, TILE_SIZE
                );
            }

            texture.refresh();
        }
    }
}
