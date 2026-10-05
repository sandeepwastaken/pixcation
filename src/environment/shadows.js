function rebakeLoadedShadows(scene) {
    for (const chunk of loadedChunks.values()) {
        const mask = getStaticShadowMask(chunk.chunkX, chunk.chunkY);
        let added = null;
        if (mask) {
            for (let pixel = 0; pixel < mask.length; pixel++) {
                if (!mask[pixel] || chunk.shadowMask?.[pixel]) continue;
                added ||= new Uint8Array(mask.length);
                added[pixel] = 1;
            }
        }

        if (!added) continue;

        bakeGroundShadows(scene, chunk.groundTexture.getContext(), chunk.chunkX, chunk.chunkY, added);
        chunk.groundTexture.refresh();
        chunk.shadowMask = mask;
        chunk.pixels = null;
        chunk.treeShadowSignature = null;
        scene.treeShadowSignature = null;
    }
}

function getShapePoints(shape) {
    const points = [];

    for (let row = 0; row < shape.length; row++) {
        const cells = shape[row];
        for (let column = 0; column < cells.length; column++) {
            if (cells[column] === '#') points.push(column, row);
        }
    }

    return points;
}

function buildShadowLut(scene) {
    const colors = new Map();

    for (const key of SHADOW_PALETTE_TEXTURES) {
        const pixels = getTerrainPixels(scene, key).data;

        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] < 255) continue;
            const color = (pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2];
            if (colors.has(color)) continue;
            colors.set(color, [
                pixels[index],
                pixels[index + 1],
                pixels[index + 2]
            ]);
        }
    }

    const describe = ([r, g, b]) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let hue = 0;

        if (delta) {
            hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
            hue = (hue * 60 + 360) % 360;
        }

        return { hue, saturation: max ? delta / max : 0, luma: r * 0.299 + g * 0.587 + b * 0.114 };
    };

    const entries = [...colors].map(([key, rgb]) => ({ key, rgb, ...describe(rgb) }));

    for (const color of entries) {
        let best = null;

        for (const other of entries) {
            if (other.luma >= color.luma || best && other.luma <= best.luma) continue;
            if (Math.abs(color.saturation - other.saturation) >= 0.14) continue;

            const hueDifference = Math.abs(color.hue - other.hue), hueGap = Math.min(hueDifference, 360 - hueDifference);
            if (hueGap >= 24) continue;

            const dr = color.rgb[0] - other.rgb[0];
            const dg = color.rgb[1] - other.rgb[1];
            const db = color.rgb[2] - other.rgb[2];

            if (dr * dr + dg * dg + db * db < 48 * 48) best = other;
        }

        shadowLut.set(color.key, best ? best.rgb : color.rgb.map(value => Math.round(value * 0.86)));
    }
}

function getShadowStyle(scene, key) {
    scene.shadowStyleCache ||= new Map();

    let style = scene.shadowStyleCache.get(key);

    if (!style) {
        const base = getDominantColor(scene, key);
        const shaded = shadeColor(base[0], base[1], base[2]);
        style = `rgb(${shaded[0]}, ${shaded[1]}, ${shaded[2]})`;
        scene.shadowStyleCache.set(key, style);
    }

    return style;
}

function shadeColor(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    let shaded = shadowLut.get(key);

    if (!shaded) {
        shaded = [Math.round(r * 0.86), Math.round(g * 0.86), Math.round(b * 0.86)];
        shadowLut.set(key, shaded);
    }

    return shaded;
}

function getDominantColor(scene, key) {
    scene.dominantColorCache ||= new Map();

    const cached = scene.dominantColorCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const counts = new Map();
    let best = 0;
    let bestCount = 0;

    for (let index = 0; index < pixels.length; index += 4) {
        if (!pixels[index + 3]) continue;
        const color = (pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2];
        const count = (counts.get(color) || 0) + 1;

        counts.set(color, count);

        if (count > bestCount) {
            best = color;
            bestCount = count;
        }
    }

    const dominant = [best >> 16, (best >> 8) & 255, best & 255];
    scene.dominantColorCache.set(key, dominant);
    return dominant;
}

function getChunkPixels(chunk) {
    chunk.pixels ||= { ground: null, upper: null, upperRead: false };

    if (!chunk.pixels.ground) {
        chunk.pixels.ground = chunk.groundTexture.getContext()
            .getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data;
    }

    if (!chunk.pixels.upperRead) {
        chunk.pixels.upperRead = true;
        chunk.pixels.upper = chunk.upperTexture
            ? chunk.upperTexture.getContext().getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data
            : null;
    }

    return chunk.pixels;
}

function getGroundShadowColor(scene, worldX, worldY) {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);
    if (isWaterPixel(scene, worldX, worldY, tile)) return null;

    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const chunk = loadedChunks.get(getChunkKey(chunkX, chunkY));
    const pixel = chunk ? (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE : 0;

    if (!chunk || chunk.shadowMask?.[pixel]) return null;
    if (isFlatShadowTile(tile)) return getTileShadowColor(scene, tile);

    const { upper, ground } = getChunkPixels(chunk);
    const index = pixel * 4;

    if (upper && upper[index + 3]) return shadeColor(upper[index], upper[index + 1], upper[index + 2]);
    if (!ground[index + 3]) return null;
    if (tile.key.startsWith('grass')) return getTileShadowColor(scene, tile);

    return shadeColor(ground[index], ground[index + 1], ground[index + 2]);
}

function getTileShadowColor(scene, tile) {
    return shadeColor(...getDominantColor(scene, tile.key));
}
