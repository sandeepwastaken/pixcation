function createMapUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, MAP_PANEL_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);
    mapPixels = mapTexture.getContext().createImageData(MAP_WIDTH, MAP_HEIGHT);
    mapPixelWords = new Uint32Array(mapPixels.data.buffer);

    mapImage = scene.add.image(12, MAP_TOP, 'map')
        .setOrigin(0);

    const textLayer = createTextLayer(MAP_PANEL_HEIGHT);

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'World Map';
    appendKeyHints(
        createUIText(textLayer, 0, 6, '#8c7358', null, null, { left: 'auto', right: '14px', fontSize: '11px' }),
        [['Scroll', 'Zoom'], ['WASD', 'Pan'], ['M', 'Close']]
    );

    mapTextLayer = addHudLayer(scene, textLayer, MAP_HIDDEN_Y, 203);
    mapContainer = addPanelContainer(scene, MAP_HIDDEN_Y, 202, [panel, mapImage]);
}

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

function redrawMap(scene) {
    const palette = getMapPalette(scene);
    const context = mapTexture.getContext();
    const pixels = mapPixelWords;
    const fog = palette.fog.map(toMapPixel);
    const outline = toMapPixel(palette.outline);

    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const zoom = mapZoom;
    const viewWidth = Math.ceil(MAP_WIDTH / zoom);
    const viewHeight = Math.ceil(MAP_HEIGHT / zoom);
    const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);

    const marker = (tileX, tileY, width, height, color) => {
        const x = (tileX - originX) * zoom;
        const y = (tileY - originY) * zoom;
        const pixelWidth = width * zoom;
        const pixelHeight = height * zoom;
        const fill = toMapPixel(color);

        for (let offsetY = -1; offsetY <= pixelHeight; offsetY++) {
            for (let offsetX = -1; offsetX <= pixelWidth; offsetX++) {
                const plotX = x + offsetX;
                const plotY = y + offsetY;
                if (plotX < 0 || plotY < 0 || plotX >= MAP_WIDTH || plotY >= MAP_HEIGHT) continue;

                const inside = offsetX >= 0 && offsetY >= 0 && offsetX < pixelWidth && offsetY < pixelHeight;
                pixels[plotY * MAP_WIDTH + plotX] = inside ? fill : outline;
            }
        }
    };

    for (let viewY = 0; viewY < viewHeight; viewY++) {
        const tileY = originY + viewY;
        const top = viewY * zoom;
        const bottom = Math.min(top + zoom, MAP_HEIGHT);

        for (let viewX = 0; viewX < viewWidth; viewX++) {
            const tileX = originX + viewX;
            const color = isTileDiscovered(tileX, tileY) ? mapColors(tileX, tileY, generateMapTileColor) : -1;
            const left = viewX * zoom;
            const right = Math.min(left + zoom, MAP_WIDTH);

            for (let y = top; y < bottom; y++) {
                for (let x = left; x < right; x++) {
                    pixels[y * MAP_WIDTH + x] = color === -1 ? fog[(x + y) & 1] : color;
                }
            }
        }
    }

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

function openMap(scene) {
    if (isMenuOpen() || !mapContainer) return;

    mapOpen = true;
    mapPan.x = 0;
    mapPan.y = 0;
    mapDrag = null;
    mapDirty = false;
    stopCharacterForMenu();
    redrawMap(scene);
    showSlidingPanel(scene, MAP_HIDDEN_Y, mapContainer, mapTextLayer);
}

function updateMapPan(scene, delta) {
    const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
        (characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
    const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
        (characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);
    const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
    const beforeX = Math.round(mapPan.x);
    const beforeY = Math.round(mapPan.y);

    mapPan.x += panX * distance;
    mapPan.y += panY * distance;
    mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;

    if (mapDirty) {
        mapDirty = false;
        redrawMap(scene);
    }
}
