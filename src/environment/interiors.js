function getInteriorTexture(scene, key, source, from, to) {
    if (scene.textures.exists(key)) return key;
    const { width, height, data } = getTerrainPixels(scene, source), pixels = new ImageData(new Uint8ClampedArray(data), width, height);
    for (let pixel = 0; pixel < width * height; pixel++) {
        const slot = from.indexOf(readTreePixel(pixels.data, pixel));
        if (slot >= 0 && pixels.data[pixel * 4 + 3]) writeRGBPixel(pixels.data, pixel, to[slot]);
    }
    createCanvasTexture(scene, key, width, height, context => context.putImageData(pixels, 0, 0));
    return key;
}

function getRugColors(house, random) {
    const options = [];
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) if (house.residents.includes(npc.id)) options.push((palette => [palette.shirt[1], palette.pants[1], palette.skin[1], palette.hair[1], palette.top[1], palette.shirtAccent, palette.pantsAccent[1]])(getPersonPalette(npc.look)));
    if (!options.length) options.push(INTERIOR_COUCH_PALETTES.map(ramp => ramp[4]));
    const colors = [];
    for (let slot = 0; slot < INTERIOR_RUG_SLOTS.length; slot++) {
        const choices = options[slot % options.length].filter(color => !colors.includes(color));
        colors.push(choices.length ? choices[Math.floor(random() * choices.length)] : options[0][slot]);
    }
    return colors;
}

function buildInterior(scene, house) {
    const random = createSeededRandom(Math.floor(worldHash(house.x, house.y, 3301) * 4294967296));
    const width = 8 + Math.floor(random() * 3), height = 5 + Math.floor(random() * 3), exit = Math.floor(width / 2);
    const left = (house.doorX - exit) * TILE_SIZE, top = (house.doorY - height) * TILE_SIZE;
    const room = { house, left, top, right: left + width * TILE_SIZE, bottom: top + height * TILE_SIZE, doorLeft: left + exit * TILE_SIZE, blocked: [], layer: scene.add.layer().setDepth(INTERIOR_DEPTH) };
    const place = (key, x, y, depth, flip = false) => room.layer.add(scene.add.image(x, y, key).setOrigin(0).setDepth(depth).setFlipX(flip));
    room.layer.add(scene.add.rectangle(-2000, -2000, 6000, 6000, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(-1e9));
    for (let row = 0; row <= height; row++) for (let column = 0; column < width; column++) if (row < height || column === exit) place('insideFloor', left + column * TILE_SIZE, top + row * TILE_SIZE, -1e8);
    const couchLength = 3 + Math.floor(random() * 2), couchLeft = random() < 0.5, couchColumn = couchLeft ? Math.floor(random() * 2) : width - couchLength - Math.floor(random() * 2), couchPalette = Math.floor(random() * INTERIOR_COUCH_PALETTES.length);
    const couchX = left + couchColumn * TILE_SIZE + (couchLeft ? 3 : -3), rugX = couchX + couchLength * TILE_SIZE / 2 - 24, rugY = top + 2 * TILE_SIZE + 5;
    place(getInteriorTexture(scene, `rug-${house.id}`, 'recolorableRug', INTERIOR_RUG_SLOTS, getRugColors(house, random)), rugX, rugY, -1e7);
    for (let index = 0; index < couchLength; index++) place(getInteriorTexture(scene, `couch-${index % (couchLength - 1) ? 'mid' : 'side'}-${couchPalette}`, index % (couchLength - 1) ? 'couchMid' : 'couchSide', INTERIOR_COUCH_SHADES, INTERIOR_COUCH_PALETTES[couchPalette]), couchX + index * TILE_SIZE, top, top + 2 * TILE_SIZE, index === couchLength - 1);
    room.blocked.push([couchX, top, couchX + couchLength * TILE_SIZE, top + 2 * TILE_SIZE - 4]);
    const zoneStart = couchLeft ? Math.ceil((rugX + 48 - left) / TILE_SIZE) : 0, zoneEnd = couchLeft ? width : Math.floor((rugX - left) / TILE_SIZE);
    const tableLength = 2,tableRow = 2 + Math.floor(random() * (height - 4)), tableX = left + Math.round((zoneStart + zoneEnd) * TILE_SIZE / 2) - TILE_SIZE + Math.round((random() - 0.5) * 6), tableY = top + tableRow * TILE_SIZE + 6;
    for (let index = 0; index < tableLength; index++) place(index ? index === tableLength - 1 ? 'woodRight' : 'wood' : 'woodLeft', tableX + index * TILE_SIZE, tableY, tableY + TILE_SIZE);
    room.blocked.push([tableX, tableY + 4, tableX + tableLength * TILE_SIZE, tableY + TILE_SIZE]);
    const chair = (key, x, bottom) => { place(key, x, bottom - 29, bottom - 0.5); room.blocked.push([x + 2, bottom - 8, x + TILE_SIZE - 2, bottom]); };
    if (random() < 0.85) chair('chairFront', tableX + TILE_SIZE / 2 + Math.round((random() - 0.5) * 10), tableY - 2);
    return Object.assign(room, { startX: room.doorLeft, startY: room.bottom - CHARACTER_SIZE });
}

function canOccupyInterior(left, top, right, bottom) {
    const inside = left >= interior.left && right <= interior.right && top >= interior.top && bottom <= interior.bottom;
    const doorway = left >= interior.doorLeft && right <= interior.doorLeft + TILE_SIZE && top >= interior.top && bottom <= interior.bottom + TILE_SIZE;
    return (inside || doorway) && !interior.blocked.some(([blockLeft, blockTop, blockRight, blockBottom]) => left < blockRight && right > blockLeft && top < blockBottom && bottom > blockTop);
}

function snapInteriorCamera() {
    mainCamera.setScroll(character.x + CHARACTER_SIZE / 2 - mainCamera.width / 2, character.y + CHARACTER_SIZE / 2 - mainCamera.height / 2);
    cameraScrollX = mainCamera.scrollX; cameraScrollY = mainCamera.scrollY; cameraOffsetX = 0; cameraOffsetY = 0;
}

function enterInterior(scene, house) {
    interior = buildInterior(scene, house);
    interior.layer.add(character);
    characterShadow.image.setVisible(false);
    character.setPosition(interior.startX, interior.startY);
    characterDirection = 'back';
    setCharacterTexture('character-back');
    snapInteriorCamera();
}

function leaveInterior() {
    if (!interior) return;
    worldObjectLayer.add(character);
    character.setPosition(interior.house.doorX * TILE_SIZE, interior.house.doorY * TILE_SIZE);
    interior.layer.destroy();
    interior = null;
    characterShadow.image.setVisible(true);
    characterDirection = 'front';
    setCharacterTexture('character-front');
    snapInteriorCamera();
}

function updateInterior(scene) {
    if (spawnReturn || isMenuOpen()) return;
    const top = character.y + CHARACTER_HITBOX_Y, centerX = character.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH / 2;
    if (interior) { if (top + CHARACTER_HITBOX_HEIGHT > interior.bottom + 6) leaveInterior(); return; }
    if (!characterKeys.up.isDown && !characterKeys.upArrow.isDown) return;
    for (const house of npcHouseCache.values()) if (house && npcHouseSprites.has(house.id) && Math.abs(centerX - (house.doorX + 0.5) * TILE_SIZE) < 5 && top >= house.doorY * TILE_SIZE - 1 && top <= house.doorY * TILE_SIZE + 2) return enterInterior(scene, house);
}
