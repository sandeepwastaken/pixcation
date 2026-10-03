let mapPixels;
let mapPixelWords;
let mapFog;
const mapColors = createTileCache(() => new Uint32Array(CHUNK_SIZE * CHUNK_SIZE));

function getMapPalette(scene) {
    if (mapPalette) return mapPalette;

    const pack = ([r, g, b]) => (r << 16) | (g << 8) | b;
    const grass = getDominantColor(scene, 'grass1');
    const dirt = getDominantColor(scene, 'dirt1');

    mapPalette = {
        grass: pack(grass),
        grassEdge: pack(shadeColor(...grass)),
        dirt: pack(dirt),
        dirtEdge: pack(shadeColor(...dirt)),
        bush: 0x4a7a52,
        rock: pack(getDominantColor(scene, 'rock')),
        boulder: pack(getDominantColor(scene, 'boulder')),
        wood: pack(getDominantColor(scene, 'wood')),
        store: pack(getDominantColor(scene, 'store')),
        water: [0x87bed8, 0x72a8cf, 0x6890ca],
        fog: [0x1a1a1a, 0x2a2a2a],
        guide: 0xacccf9,
        player: 0xf6f5e5,
        outline: 0x230a03
    };

    return mapPalette;
}

function getMapWaterDepth(tileX, tileY) {
    for (let radius = 1; radius <= 2; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (
                    Math.max(Math.abs(offsetX), Math.abs(offsetY)) === radius &&
                    getTerrainType(tileX + offsetX, tileY + offsetY) !== 'water'
                ) {
                    return radius - 1;
                }
            }
        }
    }

    return 2;
}

function toMapPixel(color) {
    return (0xff000000 | (color & 255) << 16 | color & 0xff00 | color >> 16 & 255) >>> 0;
}

function generateMapTileColor(tileX, tileY) {
    const palette = mapPalette;
    const covering = getPropCovering(tileX, tileY);
    let color;

    if (covering) {
        color = covering.type === 'tree' ? getTreeVariant(covering.tileX, tileY).color : palette[covering.type];
    } else {
        const tile = getWorldTile(tileX, tileY);
        const terrain = getTerrainType(tileX, tileY);

        if (tile.key.startsWith('wood')) {
            color = palette.wood;
        } else if (terrain === 'water') {
            color = palette.water[getMapWaterDepth(tileX, tileY)];
        } else if (tile.blocking === 'lower') {
            color = terrain === 'grass' ? palette.grassEdge : palette.dirtEdge;
        } else {
            color = terrain === 'grass' ? palette.grass : palette.dirt;
        }
    }

    return toMapPixel(color);
}

function getMapFogPixels(fog) {
    if (mapFog && mapFog.colors[0] === fog[0] && mapFog.colors[1] === fog[1]) return mapFog.pixels;

    const pixels = new Uint32Array(MAP_WIDTH * MAP_HEIGHT);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = y * MAP_WIDTH;
        for (let x = 0; x < MAP_WIDTH; x++) pixels[row + x] = fog[(x + y) & 1];
    }

    mapFog = { colors: fog, pixels };
    return pixels;
}

function drawMapTerrain(pixels, originX, originY, zoom) {
    const viewWidth = Math.ceil(MAP_WIDTH / zoom);
    const viewHeight = Math.ceil(MAP_HEIGHT / zoom);

    for (let viewY = 0; viewY < viewHeight; viewY++) {
        const tileY = originY + viewY;
        const top = viewY * zoom;
        const bottom = Math.min(top + zoom, MAP_HEIGHT);

        for (let viewX = 0; viewX < viewWidth; viewX++) {
            const tileX = originX + viewX;
            if (!isTileDiscovered(tileX, tileY)) continue;

            const color = mapColors(tileX, tileY, generateMapTileColor);
            const left = viewX * zoom;
            const right = Math.min(left + zoom, MAP_WIDTH);

            for (let y = top; y < bottom; y++) {
                const row = y * MAP_WIDTH;

                for (let x = left; x < right; x++) pixels[row + x] = color;
            }
        }
    }
}

function drawMapMarker(pixels, x, y, width, height, fill, outline) {
    const left = Math.max(0, x - 1);
    const right = Math.min(MAP_WIDTH, x + width + 1);
    const top = Math.max(0, y - 1);
    const bottom = Math.min(MAP_HEIGHT, y + height + 1);
    if (left >= right || top >= bottom) return;

    const insideLeft = Math.max(0, x);
    const insideRight = Math.min(MAP_WIDTH, x + width);

    for (let plotY = top; plotY < bottom; plotY++) {
        const row = plotY * MAP_WIDTH;
        pixels.fill(outline, row + left, row + right);

        if (plotY >= y && plotY < y + height && insideLeft < insideRight) {
            pixels.fill(fill, row + insideLeft, row + insideRight);
        }
    }
}

function redrawMap(scene) {
    const palette = getMapPalette(scene);
    const context = mapTexture.getContext();
    const pixels = mapPixelWords;
    const fog = palette.fog.map(toMapPixel);
    const outline = toMapPixel(palette.outline);
    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const zoom = mapZoom;
    const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);
    const marker = (tileX, tileY, width, height, color) => drawMapMarker(
        pixels, (tileX - originX) * zoom, (tileY - originY) * zoom,
        width * zoom, height * zoom, toMapPixel(color), outline
    );

    pixels.set(getMapFogPixels(fog));
    drawMapTerrain(pixels, originX, originY, zoom);

    if (store && isTileDiscovered(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE))) {
        marker(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE), STORE_WIDTH_TILES, STORE_HEIGHT_TILES, palette.store);
    }

    if (guide && isTileDiscovered(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE))) {
        marker(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE), 1, 1, palette.guide);
    }

    marker(playerTileX, playerTileY, 1, 1, palette.player);

    context.putImageData(mapPixels, 0, 0);
    mapTexture.refresh();
}
