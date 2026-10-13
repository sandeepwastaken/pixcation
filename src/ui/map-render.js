let mapPixels;
let mapPixelWords;
let mapFog;
const mapColors = createTileCache(() => new Uint32Array(CHUNK_SIZE * CHUNK_SIZE));
function positionMapLandmarkLabel(label, x, y) {
    if (!label) return;
    label.style.display = x >= 8 && y >= 8 && x < MAP_WIDTH - 8 && y < MAP_HEIGHT - 20 ? 'block' : 'none'; label.style.left = `${Math.round(Math.max(12, Math.min(MAP_WIDTH - 36, 12 + x - 24)))}px`; label.style.top = `${MAP_TOP + Math.round(y) + 10}px`;
}
function setMapWaypoint(pointer) {
    const x = Math.floor(pointer.x - 12), y = Math.floor(pointer.y - mapContainer.y - MAP_TOP);
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;
    mapWaypoint = { x: mapCenter.x - Math.floor(MAP_WIDTH / mapZoom / 2) + Math.round(mapPan.x) + Math.floor(x / mapZoom), y: mapCenter.y - Math.floor(MAP_HEIGHT / mapZoom / 2) + Math.round(mapPan.y) + Math.floor(y / mapZoom) }; mapDirty = true;
}
function updateMapWaypoint() {
    if (!mapWaypointLayer) return;
    mapWaypointArrow?.setVisible(false);
    if (!mapWaypoint) { mapWaypointLayer.setVisible(false); return; }
    const dx = mapWaypoint.x * TILE_SIZE + TILE_SIZE / 2 - character.x - CHARACTER_SIZE / 2, dy = mapWaypoint.y * TILE_SIZE + TILE_SIZE / 2 - character.y - CHARACTER_SIZE / 2, distance = Math.round(Math.hypot(dx, dy) / TILE_SIZE);
    if (distance <= 1 && !interior) { mapWaypoint = null; mapDirty = true; mapWaypointLayer.setVisible(false); return; }
    const directions = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'], bearing = directions[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
    setUITextContent(mapWaypointText, `Waypoint: ${bearing}  ${distance} tiles`); mapWaypointLayer.setVisible(!startup && !dialogueOpen && !marketOpen && !inventoryOpen && !statsOpen && !mapOpen && !spawnReturn && !interior);
    if (mapWaypointArrow && mapWaypointLayer.visible) { const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4; mapWaypointArrow.setVisible(true).clear().fillStyle(0xe0f2fd, 1); for (let forward = -3; forward <= 3; forward++) for (let side = -(3 - forward) / 2; side <= (3 - forward) / 2; side++) mapWaypointArrow.fillRect(Math.round(7 + Math.cos(angle) * forward - Math.sin(angle) * side), Math.round(35 + Math.sin(angle) * forward + Math.cos(angle) * side), 1, 1); }
}
function getMapEdgeMarker(x, y, margin = 8) {
    const cx = MAP_WIDTH / 2, cy = MAP_HEIGHT / 2, dx = x - cx, dy = y - cy;
    const outside = x < margin || y < margin || x >= MAP_WIDTH - margin || y >= MAP_HEIGHT - margin;
    const scale = outside ? Math.min((cx - margin) / Math.max(0.001, Math.abs(dx)), (cy - margin) / Math.max(0.001, Math.abs(dy))) : 1;
    return { x: Math.round(cx + dx * scale), y: Math.round(cy + dy * scale), outside, angle: Math.atan2(dy, dx) };
}
function drawMapArrow(pixels, marker, color) {
    drawMapMarker(pixels, marker.x - 3, marker.y - 3, 7, 7, toMapPixel(0x230a03), toMapPixel(0x230a03));
    for (let forward = -3; forward <= 3; forward++) for (let side = -(3 - forward) / 2; side <= (3 - forward) / 2; side++) {
        const x = Math.round(marker.x + Math.cos(marker.angle) * forward - Math.sin(marker.angle) * side), y = Math.round(marker.y + Math.sin(marker.angle) * forward + Math.cos(marker.angle) * side);
        if (x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT) pixels[y * MAP_WIDTH + x] = toMapPixel(color);
    }
}
function drawMapSprite(scene, pixels, key, x, y, size = 16) {
    const source = getTerrainPixels(scene, key), left = Math.round(x - size / 2), top = Math.round(y - size / 2);
    drawMapMarker(pixels, left, top, size, size, toMapPixel(0x36160d), toMapPixel(0xacccf9));
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
        const sx = Math.floor(px * source.width / size), sy = Math.floor(py * source.height / size), offset = (sy * source.width + sx) * 4;
        if (source.data[offset + 3] < 128 || left + px < 0 || top + py < 0 || left + px >= MAP_WIDTH || top + py >= MAP_HEIGHT) continue;
        pixels[(top + py) * MAP_WIDTH + left + px] = toMapPixel(source.data[offset] << 16 | source.data[offset + 1] << 8 | source.data[offset + 2]);
    }
}

function getMapPalette(scene) {
    if (mapPalette) return mapPalette;

    const pack = ([r, g, b]) => (r << 16) | (g << 8) | b;
    const grass = getDominantColor(scene, 'grass1');
    const dirt = getDominantColor(scene, 'dirt1');

    mapPalette = {
        grass: pack(grass),
        dirt: pack(dirt),
        dirtEdge: pack(shadeColor(...dirt)),
        bush: 0x4a7a52,
        rock: pack(getDominantColor(scene, 'rock')),
        boulder: pack(getDominantColor(scene, 'boulder')),
        wood: pack(getDominantColor(scene, 'wood')),
        store: pack(getDominantColor(scene, 'store')),
        trunk: pack(getDominantColor(scene, 'tree-bare')),
        water: [0x7bbbd9, 0x5e9bd3, 0x5181c4],
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
            const edgeRow = offsetY === -radius || offsetY === radius, nearbyY = tileY + offsetY, stride = edgeRow ? 1 : radius * 2;
            for (let offsetX = -radius; offsetX <= radius; offsetX += stride) {
                if (getTerrainType(tileX + offsetX, nearbyY) !== 'water') {
                    return radius - 1;
                }
            }
        }
    }

    return 2;
}

function getMapTreeAt(tileX, tileY) {
    for (const [offsetY, left, right, tone] of MAP_TREE_SHAPE) {
        for (let treeX = tileX - right; treeX <= tileX - left; treeX++) {
            if (getPropAt(treeX, tileY + offsetY) === 'tree') return [getTreeVariant(treeX, tileY + offsetY).color, tone];
        }
    }
    return null;
}

function shadeMapColor(color) {
    return (([r, g, b]) => (r << 16) | (g << 8) | b)(shadeColor(color >> 16, color >> 8 & 255, color & 255));
}

function getMapEdgeDistance(tileX, tileY) {
    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const localX = tileX - chunkX * CHUNK_SIZE + 0.5;
    const localY = tileY - chunkY * CHUNK_SIZE + 0.5;
    const inside = discoveredChunks.has(getTileId(chunkX, chunkY));
    let distance = MAP_FOG_EDGE;
    if (discoveredChunks.has(getTileId(chunkX - 1, chunkY)) !== inside) distance = Math.min(distance, localX);
    if (discoveredChunks.has(getTileId(chunkX + 1, chunkY)) !== inside) distance = Math.min(distance, CHUNK_SIZE - localX);
    if (discoveredChunks.has(getTileId(chunkX, chunkY - 1)) !== inside) distance = Math.min(distance, localY);
    if (discoveredChunks.has(getTileId(chunkX, chunkY + 1)) !== inside) distance = Math.min(distance, CHUNK_SIZE - localY);
    return inside ? distance : -distance;
}

function tintMapColor(color, tint) {
    return tint.reduce((total, value, channel) => total | Math.min(255, Math.round((color >> (16 - channel * 8) & 255) * value)) << (16 - channel * 8), 0);
}

function toMapPixel(color) {
    return (0xff000000 | (color & 255) << 16 | color & 0xff00 | color >> 16 & 255) >>> 0;
}

function generateMapTileColor(tileX, tileY) {
    const palette = mapPalette;
    const covering = getPropCovering(tileX, tileY);
    let color;

    if (covering && covering.type !== 'rock') {
        color = covering.type === 'tree' ? palette.trunk : palette[covering.type];
        if (covering.type === 'bush') color = tintMapColor(color, getGrassTint(tileX, tileY));
    } else {
        const tile = getWorldTile(tileX, tileY);
        if (tile.key.startsWith('wood')) return toMapPixel(palette.wood);
        const terrain = getTerrainType(tileX, tileY);
        const tree = terrain === 'water' ? null : getMapTreeAt(tileX, tileY);

        if (tree && tree[1] !== 'shadow') {
            color = tree[1] === 'canopy' ? tree[0] : shadeMapColor(tree[0]);
        } else if (terrain === 'water') {
            color = tintMapColor(palette.water[getMapWaterDepth(tileX, tileY)], getWaterTint(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2));
        } else {
            color = terrain === 'grass' ? tintMapColor(palette.grass, getGrassTint(tileX, tileY)) : tintMapColor(palette.dirt, getDirtTint(tileX, tileY));
            if (tile.blocking === 'lower' || tree || getTerrainType(tileX, tileY + 1) === 'water') color = shadeMapColor(color);
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
            if (getMapEdgeDistance(tileX, tileY) <= (coordinateHash(tileX, tileY, MAP_FOG_SALT) - 0.5) * MAP_FOG_EDGE) continue;

            const color = mapColors(tileX, tileY, generateMapTileColor);
            const left = viewX * zoom;
            const right = Math.min(left + zoom, MAP_WIDTH), singlePixel = right - left === 1;

            for (let y = top; y < bottom; y++) {
                const row = y * MAP_WIDTH;

                if (singlePixel) pixels[row + left] = color; else pixels.fill(color, row + left, row + right);
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
    const insideRight = Math.min(MAP_WIDTH, x + width), insideBottom = y + height;

    for (let plotY = top; plotY < bottom; plotY++) {
        const row = plotY * MAP_WIDTH;
        pixels.fill(outline, row + left, row + right);

        if (plotY >= y && plotY < insideBottom && insideLeft < insideRight) {
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
    const originX = mapCenter.x - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = mapCenter.y - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);
    const marker = (tileX, tileY, width, height, color) => drawMapMarker(
        pixels, (tileX - originX) * zoom, (tileY - originY) * zoom,
        width * zoom, height * zoom, toMapPixel(color), outline
    );

    pixels.set(getMapFogPixels(fog));
    drawMapTerrain(pixels, originX, originY, zoom);
    if (mapGuideLabel) mapGuideLabel.style.display = 'none'; if (mapMarketLabel) mapMarketLabel.style.display = 'none';
    for (const house of npcHouseCache.values()) if (house && isTileDiscovered(house.x, house.y)) drawMapSprite(scene, pixels, 'house', (house.x + 1 - originX) * zoom, (house.y + 1 - originY) * zoom, 12);

    if (store && isTileDiscovered(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE))) {
        drawMapSprite(scene, pixels, 'store', (store.x / TILE_SIZE + STORE_WIDTH_TILES / 2 - originX) * zoom, (store.y / TILE_SIZE + STORE_HEIGHT_TILES / 2 - originY) * zoom);
        positionMapLandmarkLabel(mapMarketLabel, (store.x / TILE_SIZE + STORE_WIDTH_TILES / 2 - originX) * zoom, (store.y / TILE_SIZE + STORE_HEIGHT_TILES / 2 - originY) * zoom);
    }

    if (guide && isTileDiscovered(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE))) {
        drawMapSprite(scene, pixels, 'guide', (Math.floor(guide.x / TILE_SIZE) - originX) * zoom, (Math.floor(guide.y / TILE_SIZE) - originY) * zoom);
        positionMapLandmarkLabel(mapGuideLabel, (Math.floor(guide.x / TILE_SIZE) - originX) * zoom, (Math.floor(guide.y / TILE_SIZE) - originY) * zoom);
    }

    for (const rumor of heardRumors.values()) {
        if (rumor.day === getWorldClock().day) marker((rumor.chunkX + 0.5) * CHUNK_SIZE, (rumor.chunkY + 0.5) * CHUNK_SIZE, 1, 1, RUMOR_MAP_COLOR);
    }

    const playerMarker = getMapEdgeMarker((playerTileX - originX) * zoom, (playerTileY - originY) * zoom); if (!playerMarker.outside) playerMarker.angle = { right: 0, front: Math.PI / 2, left: Math.PI, back: -Math.PI / 2 }[characterDirection]; drawMapArrow(pixels, playerMarker, palette.player);
    if (mapWaypoint) { const point = getMapEdgeMarker((mapWaypoint.x - originX) * zoom, (mapWaypoint.y - originY) * zoom, 4); if (point.outside) drawMapArrow(pixels, point, RUMOR_MAP_COLOR); else { drawMapMarker(pixels, point.x - 2, point.y - 2, 5, 5, toMapPixel(RUMOR_MAP_COLOR), outline); drawMapMarker(pixels, point.x, point.y, 1, 1, toMapPixel(palette.outline), toMapPixel(RUMOR_MAP_COLOR)); } }

    context.putImageData(mapPixels, 0, 0);
    mapTexture.refresh();
}
