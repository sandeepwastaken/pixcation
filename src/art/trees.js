function createSeededRandom(seed) {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = Math.imul(state ^ (state >>> 15), state | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function createLeafHash(salt) {
    const seedHash = Math.imul(salt, 2246822519);
    return (x, y) => coordinateHash(x, y, seedHash);
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

function readTreePixel(data, pixel) {
    const index = pixel * 4;
    return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
}

function mapTrunkTone(data, source, curve, shade) {
    const value = data[source] * 0.299 + data[source + 1] * 0.587 + data[source + 2] * 0.114;
    const stops = [61, 77, 91, 108, 119];
    let band = 0;
    while (band < stops.length - 2 && value > stops[band + 1]) band++;
    const amount = Math.max(0, Math.min(1, (value - stops[band]) / (stops[band + 1] - stops[band])));
    return [16, 8, 0].map(shift => Math.min(255, Math.round((((curve[band] >> shift) & 255) * (1 - amount) + ((curve[band + 1] >> shift) & 255) * amount) * shade)));
}

function createTreeCanopyMask(puffs, width, height, edgeSalt) {
    const edgeHash = createLeafHash(edgeSalt);
    const owner = new Int16Array(width * height).fill(-1);
    const extent = (axis, sign) => {
        let bound = -Infinity;
        for (const puff of puffs) bound = Math.max(bound, sign * puff[axis] + puff.radius + 1);
        return Math.floor(bound * sign);
    };
    const minY = Math.max(0, extent('y', -1) - 1);
    const maxY = Math.min(height - 1, extent('y', 1));
    const minX = Math.max(0, extent('x', -1) - 1);
    const maxX = Math.min(width - 1, extent('x', 1));

    for (let y = minY; y <= maxY; y++) {
        const row = y * width;
        for (let x = minX; x <= maxX; x++) {
            const edge = (edgeHash(x, y) - 0.5) * 1.2;
            const pixel = row + x;

            for (let index = puffs.length - 1; index >= 0; index--) {
                const puff = puffs[index];
                const dx = x + 0.5 - puff.x;
                const dy = y + 0.5 - puff.y;
                const reach = puff.radius + edge;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared <= reach * reach) {
                    if (index > 0 && ((x + y) & 1) && distanceSquared > (reach - 1) * (reach - 1) && owner[pixel] === -1) {
                        owner[pixel] = -3;
                        continue;
                    }

                    owner[pixel] = index;
                    break;
                }
            }
        }
    }

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] !== -3) continue;

        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const edge = (edgeHash(x, y) - 0.5) * 1.2;

        owner[pixel] = puffs.findLastIndex(puff => {
            const reach = puff.radius + edge;
            return (x + 0.5 - puff.x) ** 2 + (y + 0.5 - puff.y) ** 2 <= reach * reach;
        });
    }

    const neighbors = [-1, 1, -width, width];

    for (let pass = 0; pass < 2; pass++) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const pixel = y * width + x;
                let count = 0;
                let front = -1;

                for (const offset of neighbors) {
                    const next = pixel + offset;
                    if (owner[next] < 0) continue;
                    count++;
                    front = Math.max(front, owner[next]);
                }

                if (owner[pixel] >= 0 && count <= 1) owner[pixel] = -1;
                else if (owner[pixel] < 0 && count >= 3) owner[pixel] = front;
            }
        }
    }

    return owner;
}

function createTreeShadow(owner, width, height, centerY, salt) {
    const groundY = height - 1;
    let top = height;
    let bottom = -1;
    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] < 0) continue;
        const y = Math.floor(pixel / width);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
    }
    const shadow = new Set();
    for (let y = Math.floor(groundY + TREE_SHADOW_DROP + (top - centerY) * TREE_SHADOW_SQUASH); y <= Math.ceil(groundY + TREE_SHADOW_DROP + (bottom - centerY) * TREE_SHADOW_SQUASH); y++) {
        const sourceY = Math.round(centerY + (y - groundY - TREE_SHADOW_DROP) / TREE_SHADOW_SQUASH);
        if (sourceY < 0 || sourceY >= height) continue;
        for (let x = TREE_SHADOW_SHIFT; x < width + TREE_SHADOW_SHIFT; x++) {
            if (owner[sourceY * width + x - TREE_SHADOW_SHIFT] >= 0) shadow.add(y * 1024 + x);
        }
    }
    const dapple = createLeafHash(salt);
    const points = [];
    for (const point of shadow) {
        const x = point % 1024, y = point >> 10;
        let open = 0;
        for (const offset of [-1, 1, -1024, 1024, -2, 2, -2048, 2048]) open += !shadow.has(point + offset);
        if (dapple(x >> 1, y) >= TREE_SHADOW_DAPPLE + open * TREE_SHADOW_EDGE_DAPPLE) points.push(x, y);
    }
    return points;
}

function createTreeContactShadow(left, right, height) {
    const centerX = (left + right) / 2;
    const radius = (right - left) / 2 + TREE_CONTACT_SHADOW_SPREAD;
    const points = [];
    for (let y = height - 2; y <= height; y++) {
        const reach = Math.round(radius * (y === height - 1 ? 1 : 0.8));
        for (let x = Math.round(centerX - reach); x < Math.round(centerX + reach); x++) points.push(x, y);
    }
    return points;
}

function generateTreeVariant(trunk, seed, paletteIndex) {
    const random = createSeededRandom(seed);
    const flip = random() < 0.5;
    const width = trunk.width + TREE_PAD_X * 2;
    const height = trunk.height + TREE_PAD_TOP;
    const data = new Uint8ClampedArray(width * height * 4);
    const trunkShade = TREE_TRUNK_SHADES[Math.floor(createSeededRandom(seed ^ 0x5bd1e995)() * TREE_TRUNK_SHADES.length)];
    const picked = pickTreePalette(random);
    const palette = TREE_LEAF_PALETTES[paletteIndex] ?? picked;
    const trunkCurve = TREE_TRUNK_CURVES[palette.trunk ?? Math.floor(createSeededRandom(seed ^ 0x27d4eb2d)() * TREE_TRUNK_CURVES.length)];

    for (let y = 0; y < trunk.height; y++) {
        const sourceRow = y * trunk.width;
        const targetRow = (y + TREE_PAD_TOP) * width + TREE_PAD_X;
        for (let x = 0; x < trunk.width; x++) {
            const source = (sourceRow + (flip ? trunk.width - 1 - x : x)) * 4;
            if (!trunk.data[source + 3]) continue;

            const pixel = targetRow + x;
            const patternRow = Math.max(0, Math.min(trunk.height - 1, y + Math.floor(coordinateHash(x >> 2, y >> 3, seed ^ 0x762b9) * 9) - 4)), patternSource = (patternRow * trunk.width + (flip ? trunk.width - 1 - x : x)) * 4;
            const [red, green, blue] = mapTrunkTone(trunk.data, trunkCurve === TREE_TRUNK_CURVES[1] && trunk.data[patternSource + 3] ? patternSource : source, trunkCurve, trunkShade);
            writeRGBPixel(data, pixel, (red << 16) | (green << 8) | blue);
        }
    }

    const bareData = new Uint8ClampedArray(data);
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

        puffs.push({ x: centerX + Math.cos(angle) * (radiusX - radius), y: centerY + Math.sin(angle) * (radiusY - radius), radius, core: false });
    }

    const innerCount = 3 + Math.floor(random() * 3);

    for (let index = 0; index < innerCount; index++) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * 0.5;

        puffs.push({ x: centerX + Math.cos(angle) * distance * radiusX, y: centerY + Math.sin(angle) * distance * radiusY + 2, radius: 7 + random() * 3, core: false });
    }

    puffs.sort((a, b) => (a.core ? -1 : b.core ? 1 : a.y - b.y));
    for (const puff of puffs) puff.radiusSquared = puff.radius * puff.radius;

    const edgeSalt = Math.floor(random() * 100000);
    const owner = createTreeCanopyMask(puffs, width, height, edgeSalt);

    const filled = [];
    const heights = new Float32Array(width * height);
    const smooth = new Float32Array(width * height);

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] >= 0) filled.push(pixel);
    }

    const top = Math.floor(filled[0] / width);
    const bottom = Math.floor(filled[filled.length - 1] / width);

    for (const pixel of filled) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let best = 0;

        for (const puff of puffs) {
            const dx = x + 0.5 - puff.x;
            const dy = y + 0.5 - puff.y;
            const lift = puff.radiusSquared - dx * dx - dy * dy;
            if (lift > 0) best = Math.max(best, Math.sqrt(lift) * (puff.core ? 0.8 : 1));
        }

        heights[pixel] = best;
    }

    for (const pixel of filled) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let total = 0;
        let count = 0;
        const lastX = Math.min(width - 1, x + 1);
        const lastY = Math.min(height - 1, y + 1);

        for (let sampleY = Math.max(0, y - 1); sampleY <= lastY; sampleY++) {
            const row = sampleY * width;
            for (let sampleX = Math.max(0, x - 1); sampleX <= lastX; sampleX++) {
                total += heights[row + sampleX];
                count++;
            }
        }

        smooth[pixel] = total / count;
    }

    const textureSalt = Math.floor(random() * 100000);
    const textureHash = createLeafHash(textureSalt);
    const levels = new Int8Array(width * height).fill(-1);
    const values = new Float32Array(width * height);
    const span = Math.max(1, bottom - top);

    for (const pixel of filled) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
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
        const lit = (-0.5 * nx - 0.65 * ny + 0.57 * 1.6) / length * 0.3 + (local * 0.5 + 0.3) * 0.7;
        const global = -0.12 * (x + 0.5 - centerX) / radiusX - 0.3 * (depth - 0.45);
        let value = (lit - 0.62) * 1.9 + global;

        const speck = textureHash(x >> 1, y);
        if (speck > 0.86) value += 0.22;
        else if (speck < 0.14) value -= 0.22;

        values[pixel] = value;
    }

    const sorted = Float32Array.from(filled, pixel => values[pixel]).sort();

    const quantile = amount => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(amount * sorted.length)))];
    const bands = TREE_TONE_SHARES.map(share => [quantile(share - TREE_DITHER_SHARE), quantile(share + TREE_DITHER_SHARE)]);

    for (const pixel of filled) {
        const checker = (pixel % width + Math.floor(pixel / width)) & 1;
        let level = 0;

        for (const [low, high] of bands) {
            if (values[pixel] >= high || values[pixel] >= low && checker) level++;
        }

        levels[pixel] = level;
    }

    const columnBottom = new Int16Array(width).fill(-1), stemRow = (bottom - 3) * width;
    for (const pixel of filled) columnBottom[pixel % width] = Math.max(columnBottom[pixel % width], Math.floor(pixel / width));
    for (let pixel = 0; pixel < (bottom - 3) * width; pixel++) {
        if (owner[pixel] < 0 && (!data[(stemRow + pixel % width) * 4 + 3] || Math.floor(pixel / width) < columnBottom[pixel % width])) data[pixel * 4 + 3] = 0;
    }

    for (const pixel of filled) writeRGBPixel(data, pixel, colors[levels[pixel]]);

    if (palette.extras.length && random() < 0.4) {
        const extra = palette.extras[Math.floor(random() * palette.extras.length)];
        const count = 5 + Math.floor(random() * 6);

        for (let attempt = 0, placed = 0; attempt < 500 && placed < count; attempt++) {
            const pixel = Math.floor(random() * levels.length);
            if (levels[pixel] < 1 || levels[pixel] > 2 || levels[pixel + 1] < 0 || levels[pixel - width] < 0) continue;

            writeRGBPixel(data, pixel, extra);
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
                writeRGBPixel(data, pixel, bark[Math.max(0, bark.indexOf(readTreePixel(data, pixel)) - 1)]);
            }

            shade--;
        }
    }

    const shadowPoints = createTreeShadow(owner, width, height, centerY, edgeSalt + 1);

    let hitLeft = width;
    let hitRight = 0;

    for (let y = height - 12; y < height - 8; y++) {
        for (let x = 0; x < width; x++) {
            if (!data[(y * width + x) * 4 + 3]) continue;
            hitLeft = Math.min(hitLeft, x);
            hitRight = Math.max(hitRight, x + 1);
        }
    }

    const trunkData = new Uint8ClampedArray(data);
    const canopyData = new Uint8ClampedArray(data);
    let shadowTop = Infinity;
    let shadowBottom = -Infinity;
    for (let point = 1; point < shadowPoints.length; point += 2) {
        shadowTop = Math.min(shadowTop, shadowPoints[point]);
        shadowBottom = Math.max(shadowBottom, shadowPoints[point]);
    }
    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0) trunkData[pixel * 4 + 3] = 0;
        else canopyData[pixel * 4 + 3] = 0;
    }

    return { width, height, data, trunkData, canopyData, bareData, shadowTop, shadowHeight: shadowBottom - shadowTop + 1, flip, shadowPoints, contactShadow: createTreeContactShadow(hitLeft, hitRight, height), hitLeft, hitRight, color: colors[2] };
}
