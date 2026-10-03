function createStaticShadowCaster(x, y, points) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    for (let point = 0; point < points.length; point += 2) {
        left = Math.min(left, points[point]);
        right = Math.max(right, points[point]);
        top = Math.min(top, points[point + 1]);
        bottom = Math.max(bottom, points[point + 1]);
    }

    return {
        x, y, points,
        left: x + left,
        right: x + right + 1,
        top: y + top,
        bottom: y + bottom + 1
    };
}

function forEachStaticShadowPoint(chunkX, chunkY, callback) {
    const minTileX = chunkX * CHUNK_SIZE - 3;
    const minTileY = chunkY * CHUNK_SIZE - 1;
    const maxTileX = (chunkX + 1) * CHUNK_SIZE;
    const maxTileY = (chunkY + 1) * CHUNK_SIZE + 1;
    const left = chunkX * CHUNK_PIXEL_SIZE;
    const top = chunkY * CHUNK_PIXEL_SIZE;
    const right = left + CHUNK_PIXEL_SIZE;
    const bottom = top + CHUNK_PIXEL_SIZE;

    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
        for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type || type === 'tree') continue;

            const sprite = getPropSprite(tileX, tileY);

            for (let point = 0; point < sprite.shadow.length; point += 2) {
                callback(sprite.x + sprite.shadow[point], sprite.y + sprite.shadow[point + 1]);
            }
        }
    }

    for (const caster of staticShadowCasters) {
        if (caster.right <= left || caster.left >= right || caster.bottom <= top || caster.top >= bottom) continue;
        for (let point = 0; point < caster.points.length; point += 2) {
            callback(caster.x + caster.points[point], caster.y + caster.points[point + 1]);
        }
    }
}

function getStaticShadowMask(chunkX, chunkY) {
    const originX = chunkX * CHUNK_PIXEL_SIZE;
    const originY = chunkY * CHUNK_PIXEL_SIZE;
    let mask = null;

    forEachStaticShadowPoint(chunkX, chunkY, (x, y) => {
        const localX = x - originX;
        const localY = y - originY;

        if (localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE) return;

        mask ||= new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);
        mask[localY * CHUNK_PIXEL_SIZE + localX] = 1;
    });

    return mask;
}

function isFlatShadowTile(tile) {
    return !tile.patches && (tile.key.startsWith('grass') || tile.key === 'dirt1');
}

let detailedShadowScratch;

function bakeGroundShadows(scene, context, chunkX, chunkY, mask) {
    let minX = CHUNK_PIXEL_SIZE;
    let minY = CHUNK_PIXEL_SIZE;
    let maxX = -1;
    let maxY = -1;
    detailedShadowScratch ||= new Uint32Array(mask.length);
    const detailed = detailedShadowScratch;
    let detailedCount = 0;
    let activeStyle = null;

    const fillRun = (style, x, y, width) => {
        if (style !== activeStyle) {
            context.fillStyle = style;
            activeStyle = style;
        }

        context.fillRect(x, y, width, 1);
    };

    for (let localY = 0; localY < CHUNK_PIXEL_SIZE; localY++) {
        const tileY = chunkY * CHUNK_SIZE + Math.floor(localY / TILE_SIZE);
        const surfaceRow = (localY % TILE_SIZE) * TILE_SIZE;
        const pixelRow = localY * CHUNK_PIXEL_SIZE;
        let runStart = -1;
        let runColor = null;
        let column = -1;
        let water = null;
        let flatStyle = null;

        for (let localX = 0; localX < CHUNK_PIXEL_SIZE; localX++) {
            const pixel = pixelRow + localX;
            let color = null;

            if (mask[pixel]) {
                if (column !== Math.floor(localX / TILE_SIZE)) {
                    column = Math.floor(localX / TILE_SIZE);
                    const tile = getWorldTile(chunkX * CHUNK_SIZE + column, tileY);
                    water = getTerrainSurface(scene, tile).water;
                    flatStyle = isFlatShadowTile(tile) ? getShadowStyle(scene, tile.key) : null;
                }

                if (!water[surfaceRow + localX % TILE_SIZE]) {
                    if (flatStyle) {
                        color = flatStyle;
                    } else {
                        detailed[detailedCount++] = pixel;
                        minX = Math.min(minX, localX);
                        minY = Math.min(minY, localY);
                        maxX = Math.max(maxX, localX);
                        maxY = Math.max(maxY, localY);
                    }
                }
            }

            if (color !== runColor || !color) {
                if (runStart !== -1) {
                    fillRun(runColor, runStart, localY, localX - runStart);
                    runStart = -1;
                    runColor = null;
                }
                if (color) {
                    runStart = localX;
                    runColor = color;
                }
            }
        }

        if (runStart !== -1) {
            fillRun(runColor, runStart, localY, CHUNK_PIXEL_SIZE - runStart);
        }
    }

    if (detailedCount === 0) {
        return;
    }

    const width = maxX - minX + 1;
    const image = context.getImageData(minX, minY, width, maxY - minY + 1);

    for (let detail = 0; detail < detailedCount; detail++) {
        const pixel = detailed[detail];
        const index = ((Math.floor(pixel / CHUNK_PIXEL_SIZE) - minY) * width + pixel % CHUNK_PIXEL_SIZE - minX) * 4;
        if (!image.data[index + 3]) continue;

        const shaded = shadeColor(image.data[index], image.data[index + 1], image.data[index + 2]);
        image.data[index] = shaded[0];
        image.data[index + 1] = shaded[1];
        image.data[index + 2] = shaded[2];
    }

    context.putImageData(image, minX, minY);
}
