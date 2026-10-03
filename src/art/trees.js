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

function readTreePixel(data, pixel) {
    const index = pixel * 4;
    return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
}

function createTreeCanopyMask(puffs, width, height, edgeSalt) {
    const owner = new Int16Array(width * height).fill(-1);
    const extent = (axis, sign) => Math.floor(Math.max(...puffs.map(puff => sign * puff[axis] + puff.radius + 1)) * sign);
    const minY = Math.max(0, extent('y', -1) - 1);
    const maxY = Math.min(height - 1, extent('y', 1));
    const minX = Math.max(0, extent('x', -1) - 1);
    const maxX = Math.min(width - 1, extent('x', 1));

    for (let y = minY; y <= maxY; y++) {
        const row = y * width;
        for (let x = minX; x <= maxX; x++) {
            const edge = (leafHash(x, y, edgeSalt) - 0.5) * 1.2;
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
        const edge = (leafHash(x, y, edgeSalt) - 0.5) * 1.2;

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

function createTreeShadow(puffs, centerX, centerY, height, edgeSalt) {
    const shadow = new Set();
    const groundY = height - 1;

    for (const puff of puffs) {
        const shadowX = centerX + (puff.x - centerX) * 0.8 + 3;
        const shadowY = groundY + (puff.y - centerY) * 0.35;
        const reachX = puff.radius * 0.85;
        const reachY = puff.radius * 0.55;

        for (let y = Math.floor(shadowY - reachY); y <= Math.ceil(shadowY + reachY); y++) {
            const dy = (y + 0.5 - shadowY) / reachY;
            for (let x = Math.floor(shadowX - reachX); x <= Math.ceil(shadowX + reachX); x++) {
                const dx = (x + 0.5 - shadowX) / reachX;
                if (dx * dx + dy * dy <= 1 + (leafHash(x, y, edgeSalt + 1) - 0.5) * 0.25) shadow.add(y * 1024 + x);
            }
        }
    }

    const points = [];
    for (const point of shadow) points.push(point % 1024, Math.floor(point / 1024));
    return points;
}

function generateTreeVariant(trunk, seed) {
    const random = createSeededRandom(seed);
    const flip = random() < 0.5;
    const width = trunk.width + TREE_PAD_X * 2;
    const height = trunk.height + TREE_PAD_TOP;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < trunk.height; y++) {
        const sourceRow = y * trunk.width;
        const targetRow = (y + TREE_PAD_TOP) * width + TREE_PAD_X;
        for (let x = 0; x < trunk.width; x++) {
            const source = (sourceRow + (flip ? trunk.width - 1 - x : x)) * 4;
            if (!trunk.data[source + 3]) continue;

            const pixel = targetRow + x;
            writeRGBPixel(data, pixel, (trunk.data[source] << 16) | (trunk.data[source + 1] << 8) | trunk.data[source + 2]);
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

        puffs.push({ x: centerX + Math.cos(angle) * (radiusX - radius), y: centerY + Math.sin(angle) * (radiusY - radius), radius, core: false });
    }

    const innerCount = 3 + Math.floor(random() * 3);

    for (let index = 0; index < innerCount; index++) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * 0.5;

        puffs.push({ x: centerX + Math.cos(angle) * distance * radiusX, y: centerY + Math.sin(angle) * distance * radiusY + 2, radius: 7 + random() * 3, core: false });
    }

    puffs.sort((a, b) => (a.core ? -1 : b.core ? 1 : a.y - b.y));

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
            const lift = puff.radius * puff.radius - dx * dx - dy * dy;
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
        const lit = (-0.5 * nx - 0.65 * ny + 0.57 * 1.6) / length * 0.5 + (local * 0.5 + 0.3) * 0.5;
        const global = -0.2 * (x + 0.5 - centerX) / radiusX - 0.6 * (depth - 0.45);
        let value = (lit - 0.62) * 1.9 + global;

        const speck = leafHash((x + (y & 1)) >> 1, y >> 1, textureSalt);
        if (speck > 0.8) value += 0.28;
        else if (speck < 0.2) value -= 0.28;

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

    for (let pixel = 0; pixel < (bottom - 3) * width; pixel++) {
        if (owner[pixel] < 0) data[pixel * 4 + 3] = 0;
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

    const shadowPoints = createTreeShadow(puffs, centerX, centerY, height, edgeSalt);

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
