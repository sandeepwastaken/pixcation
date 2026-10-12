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
        const roll = random(); colors.push(choices.length ? choices[Math.floor(roll * choices.length)] : options[0][slot]);
    }
    return colors;
}

function buildInterior(scene, house, render = true) {
    const random = createSeededRandom(Math.floor(worldHash(house.x, house.y, 3301) * 4294967296));
    const width = 8 + Math.floor(random() * 3), height = 5 + Math.floor(random() * 3), exit = Math.floor(width / 2);
    const left = (house.doorX - exit) * TILE_SIZE, top = (house.doorY - height) * TILE_SIZE;
    const room = { house, left, top, right: left + width * TILE_SIZE, bottom: top + height * TILE_SIZE, doorLeft: left + exit * TILE_SIZE, blocked: [], layer: render ? scene.add.layer().setDepth(INTERIOR_DEPTH) : null };
    const place = (key, x, y, depth, flip = false) => render && room.layer.add(scene.add.image(x, y, key).setOrigin(0).setDepth(depth).setFlipX(flip));
    if (render) room.layer.add(scene.add.rectangle(-2000, -2000, 6000, 6000, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(-1e9));
    for (let row = 0; row <= height; row++) for (let column = 0; column < width; column++) if (row < height || column === exit) place('insideFloor', left + column * TILE_SIZE, top + row * TILE_SIZE, -1e8);
    const couchLength = 3 + Math.floor(random() * 2), couchLeft = random() < 0.5, couchColumn = couchLeft ? Math.floor(random() * 2) : width - couchLength - Math.floor(random() * 2), couchPalette = Math.floor(random() * INTERIOR_COUCH_PALETTES.length);
    const couchX = left + couchColumn * TILE_SIZE + (couchLeft ? 3 : -3), rugX = couchX + couchLength * TILE_SIZE / 2 - 24, rugY = top + 2 * TILE_SIZE + 5;
    const rugColors = getRugColors(house, random); if (render) place(getInteriorTexture(scene, `rug-${house.id}`, 'recolorableRug', INTERIOR_RUG_SLOTS, house.rugColors ||= rugColors), rugX, rugY, -1e7);
    if (render) for (let index = 0; index < couchLength; index++) place(getInteriorTexture(scene, `couch-${index % (couchLength - 1) ? 'mid' : 'side'}-${couchPalette}`, index % (couchLength - 1) ? 'couchMid' : 'couchSide', INTERIOR_COUCH_SHADES, INTERIOR_COUCH_PALETTES[couchPalette]), couchX + index * TILE_SIZE, top, top + 2 * TILE_SIZE, index === couchLength - 1);
    room.blocked.push([couchX, top, couchX + couchLength * TILE_SIZE, top + 2 * TILE_SIZE - 4]);
    const zoneStart = couchLeft ? Math.ceil((rugX + 48 - left) / TILE_SIZE) : 0, zoneEnd = couchLeft ? width : Math.floor((rugX - left) / TILE_SIZE);
    const tableLength = 2,tableRow = 2 + Math.floor(random() * (height - 4)), tableX = left + Math.round((zoneStart + zoneEnd) * TILE_SIZE / 2) - TILE_SIZE + Math.round((random() - 0.5) * 6), tableY = top + tableRow * TILE_SIZE + 6;
    for (let index = 0; index < tableLength; index++) place(index ? index === tableLength - 1 ? 'woodRight' : 'wood' : 'woodLeft', tableX + index * TILE_SIZE, tableY, tableY + TILE_SIZE);
    room.blocked.push([tableX, tableY + 4, tableX + tableLength * TILE_SIZE, tableY + TILE_SIZE]);
    const chair = (key, x, bottom) => { place(key, x, bottom - 29, bottom - 0.5); room.blocked.push([x + 2, bottom - 8, x + TILE_SIZE - 2, bottom]); };
    if (random() < 0.85) chair('chairFront', tableX + TILE_SIZE / 2 + Math.round((random() - 0.5) * 10), tableY - 2);
    const residentNpcs = []; for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) if (house.residents.includes(npc.id)) residentNpcs.push(npc);
    room.residents = render ? residentNpcs.map(npc => ({ npc, sprite: scene.add.image(npc.indoor?.sprite.x ?? room.doorLeft, npc.indoor?.sprite.y ?? room.bottom, getNpcTexture(scene, npc.look, npc.indoor?.direction || 'back', 0)).setOrigin(0).setDepth((npc.indoor?.sprite.y ?? room.bottom) + NPC_PART_SIZE).setVisible(npc.state === 'home') })) : [];
    if (render) room.layer.add(room.residents.map(resident => resident.sprite));
    return Object.assign(room, { startX: room.doorLeft, startY: room.bottom - CHARACTER_SIZE });
}

function canInteriorResidentStand(resident, x, y, room = resident.room) {
    return canOccupyInterior(x + CHARACTER_HITBOX_X, y + CHARACTER_HITBOX_Y, x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH, y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT, resident.sprite, room);
}

function getNpcIndoorResident(scene, npc) {
    const room = npc.house.indoorRoom ||= buildInterior(scene, npc.house, false);
    if (!npc.indoor) npc.indoor = {npc, room, journey: 'enter', direction: 'back', sprite: {x: room.doorLeft, y: room.bottom, setPosition(x, y) {this.x = x; this.y = y; return this;}, setDepth() {return this;}}};
    if (!room.residents.includes(npc.indoor)) room.residents.push(npc.indoor);
    room.residents = room.residents.filter(resident => resident.npc.indoor === resident && resident.npc.state === 'home' && (resident.npc === npc || activeNpcs.includes(resident.npc)));
    return npc.indoor;
}

function findInteriorResidentPath(resident, targetX, targetY) {
    if (!canInteriorResidentStand(resident, targetX, targetY)) return null;
    const start = [resident.sprite.x, resident.sprite.y], queue = [start], parents = new Map([[start.join(','), null]]);
    for (let index = 0; index < queue.length; index++) {
        const [x, y] = queue[index];
        if (x === targetX && y === targetY) {
            const path = []; let current = [x, y];
            while (parents.get(current.join(','))) {path.push(current); current = parents.get(current.join(','));}
            path.reverse(); const route = []; let previous = start;
            for (const point of path) {const direction = getDirectionToward({x: previous[0], y: previous[1]}, point[0], point[1]); if (route.at(-1)?.direction === direction) Object.assign(route.at(-1), {x: point[0], y: point[1]}); else route.push({x: point[0], y: point[1], direction}); previous = point;}
            return route;
        }
        for (const [, dx, dy] of NPC_DIRECTIONS) {const next = [x + dx, y + dy], key = next.join(','); if (!parents.has(key) && canInteriorResidentStand(resident, next[0], next[1])) {parents.set(key, [x, y]); queue.push(next);}}
    }
    return null;
}

function setInteriorResidentPose(scene, resident, direction, frame) {
    resident.direction = direction; resident.frame = frame;
    if (!resident.display) return; const key = getNpcTexture(scene, resident.npc.look, direction, frame, resident.display.personBlinkState?.closed);
    if (resident.display.texture.key !== key) resident.display.setTexture(key);
}

function chooseInteriorResidentWalk(resident, time) {
    const start = Math.floor(Math.random() * NPC_DIRECTIONS.length);
    for (let attempt = 0; attempt < NPC_DIRECTIONS.length; attempt++) {
        const [direction, dx, dy] = NPC_DIRECTIONS[(start + attempt) % NPC_DIRECTIONS.length], distance = TILE_SIZE * (1 + Math.floor(Math.random() * 2));
        let clear = true;
        for (let step = 1; step <= distance; step++) if (resident.sprite.y + dy * step + NPC_PART_SIZE > resident.room.bottom || !canInteriorResidentStand(resident, resident.sprite.x + dx * step, resident.sprite.y + dy * step)) {clear = false; break;}
        if (clear) {resident.goal = {x: resident.sprite.x + dx * distance, y: resident.sprite.y + dy * distance, direction}; resident.remainder = 0; return;}
    }
    resident.nextWalkAt = time + 500 + Math.random() * 1000;
}

function updateInteriorResident(scene, resident, time, delta) {
    if (resident.npc.talking || isMenuOpen()) { setInteriorResidentPose(scene, resident, resident.npc.talking ? getDirectionToward(resident.sprite, character.x, character.y) : resident.direction || 'front', 0); return; }
    if (resident.journey === 'enter' && resident.sprite.x === resident.room.doorLeft && resident.sprite.y === resident.room.bottom - TILE_SIZE && !resident.goal) resident.journey = null; if (!resident.goal && resident.journey && time >= (resident.nextWalkAt || 0)) {resident.route = findInteriorResidentPath(resident, resident.room.doorLeft, resident.room.bottom - (resident.journey === 'enter' ? TILE_SIZE : 0)); resident.goal = resident.route?.shift() || null; resident.nextWalkAt = time + 750;} else if (!resident.goal && !resident.journey && time >= (resident.nextWalkAt ??= time + 500 + Math.random() * 1500)) chooseInteriorResidentWalk(resident, time);
    if (!resident.goal) {setInteriorResidentPose(scene, resident, resident.direction || 'front', 0); return;}
    const goal = resident.goal, dx = Math.sign(goal.x - resident.sprite.x), dy = Math.sign(goal.y - resident.sprite.y), frameDelta = Math.min(delta, 50);
    resident.remainder = (resident.remainder || 0) + CHARACTER_SPEED * resident.npc.speed * frameDelta / 1000;
    const steps = Math.min(Math.trunc(resident.remainder), Math.abs(goal.x - resident.sprite.x) + Math.abs(goal.y - resident.sprite.y)); resident.remainder -= steps;
    for (let step = 0; step < steps; step++) {
        const x = resident.sprite.x + dx, y = resident.sprite.y + dy;
        if (!canInteriorResidentStand(resident, x, y)) {resident.goal = null; resident.route = null; resident.remainder = 0; resident.nextWalkAt = time + 500; break;}
        resident.sprite.setPosition(x, y); saveDirty = true; if (resident.sprite.depth !== y + NPC_PART_SIZE) resident.sprite.setDepth(y + NPC_PART_SIZE);
    }
    resident.walkPhase = (resident.walkPhase || 0) + frameDelta * CHARACTER_ANIMATION_SPEED * resident.npc.speed / 1000;
    setInteriorResidentPose(scene, resident, goal.direction, CHARACTER_WALK_FRAMES[Math.floor(resident.walkPhase) % 4]);
    if (resident.sprite.x === goal.x && resident.sprite.y === goal.y) {resident.goal = resident.route?.shift() || null; if (!resident.goal) {resident.remainder = 0; resident.nextWalkAt = resident.journey === 'exit' ? time : time + 800 + Math.random() * 2200; if (resident.journey === 'enter' && resident.sprite.x === resident.room.doorLeft && resident.sprite.y === resident.room.bottom - TILE_SIZE) resident.journey = null; setInteriorResidentPose(scene, resident, goal.direction, 0);}}
}

function updateInteriorResidents(scene, time, delta) {
    for (const resident of interior.residents) {
        const visible = resident.npc.state === 'home'; if (resident.sprite.visible !== visible) resident.sprite.setVisible(visible);
        if (!visible) {resident.goal = null; continue;}
        const model = resident.npc.indoor; if (!model) continue; model.display = resident.sprite; resident.sprite.setPosition(model.sprite.x, model.sprite.y).setDepth(model.sprite.y + NPC_PART_SIZE); setInteriorResidentPose(scene, model, model.direction || 'back', model.frame || 0);
        updatePersonBlink(scene, resident.sprite, resident.npc.look, model.direction || 'back', model.frame || 0, time);
    }
}

function canOccupyInterior(left, top, right, bottom, ignoreSprite = null, room = interior) {
    const inside = left >= room.left && right <= room.right && top >= room.top && bottom <= room.bottom;
    const doorway = left >= room.doorLeft && right <= room.doorLeft + TILE_SIZE && top >= room.top && bottom <= room.bottom + TILE_SIZE;
    const residents = ignoreSprite ? room.residents : room.residents.filter(resident => resident.sprite.visible); return (!ignoreSprite || interior?.house !== room.house || !(left < character.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH && right > character.x + CHARACTER_HITBOX_X && top < character.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT && bottom > character.y + CHARACTER_HITBOX_Y)) && (inside || doorway) && !room.blocked.some(([blockLeft, blockTop, blockRight, blockBottom]) => left < blockRight && right > blockLeft && top < blockBottom && bottom > blockTop) && !residents.some(({ npc, sprite }) => npc.state === 'home' && sprite !== ignoreSprite && left < sprite.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH && right > sprite.x + CHARACTER_HITBOX_X && top < sprite.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT && bottom > sprite.y + CHARACTER_HITBOX_Y);
}

function snapInteriorCamera() {
    mainCamera.setScroll(character.x + CHARACTER_SIZE / 2 - mainCamera.width / 2, character.y + CHARACTER_SIZE / 2 - mainCamera.height / 2);
    cameraScrollX = mainCamera.scrollX; cameraScrollY = mainCamera.scrollY; cameraOffsetX = 0; cameraOffsetY = 0;
}

function beginInteriorTransition(scene, house = null) {
    if (interiorTransition || spawnReturn || !house && !interior) return;
    scene.resetHeldActions(); characterSlide = null;
    const canvas = document.createElement('canvas'); canvas.width = Math.ceil(mainCamera.width); canvas.height = Math.ceil(mainCamera.height); canvas.style.imageRendering = 'pixelated'; const overlay = addHudLayer(scene, canvas, 0, 10000).setVisible(true);
    interiorTransition = {house, overlay, context: canvas.getContext('2d'), phase: 'out', start: scene.time.now, level: -1};
}

function drawInteriorTransition(transition, level) {
    if (transition.level === level) return;
    transition.level = level; const context = transition.context, width = context.canvas.width, height = context.canvas.height;
    context.clearRect(0, 0, width, height); if (!level) return; context.fillStyle = '#000000';
    if (level === 16) {context.fillRect(0, 0, width, height); return;}
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (SEE_THROUGH_RANKS[(y & 3) * 4 + (x & 3)] < level) context.fillRect(x, y, 1, 1);
}

function updateInteriorTransition(scene, time) {
    const transition = interiorTransition, age = Math.max(0, time - transition.start), progress = Math.min(1, age / 240);
    drawInteriorTransition(transition, Math.round((transition.phase === 'out' ? progress : 1 - progress) * 16));
    if (progress < 1) return;
    if (transition.phase === 'out') {
        if (transition.house) enterInterior(scene, transition.house); else leaveInterior();
        updateCamera(0); transition.phase = 'in'; transition.start = time;
    } else {transition.overlay.destroy(); interiorTransition = null; lastPlayTime = null;}
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
    for (const resident of interior.residents) if (resident.npc.indoor) resident.npc.indoor.display = null; interior.layer.destroy();
    interior = null; interiorTalkNpc = null;
    characterShadow.image.setVisible(true);
    characterDirection = 'front';
    setCharacterTexture('character-front');
    snapInteriorCamera();
}

function talkToInteriorNpc(scene) {
    if (!interiorTalkNpc || !dialogueContainer) return;
    interiorTalkNpc.talking = true; interiorTalkNpc.playerVisits = Math.min(100000, (interiorTalkNpc.playerVisits || 0) + 1); saveDirty = true;
    peopleMet.add(interiorTalkNpc.id);
    beginDialogue(scene, buildNpcDialogue(scene, interiorTalkNpc), null, interiorTalkNpc.name, interiorTalkNpc);
}

function updateInterior(scene, time = scene.time.now, delta = 16) {
    if (spawnReturn || interiorTransition || isMenuOpen()) return;
    const top = character.y + CHARACTER_HITBOX_Y, centerX = character.x + CHARACTER_HITBOX_X + CHARACTER_HITBOX_WIDTH / 2;
    if (interior) for (const { npc, sprite } of interior.residents) if (sprite.visible !== (npc.state === 'home')) sprite.setVisible(npc.state === 'home');
    if (interior) interiorTalkNpc = interior.residents.find(({ sprite }) => sprite.visible && (sprite.x - character.x) ** 2 + (sprite.y - character.y) ** 2 < NPC_TALK_DISTANCE_SQUARED)?.npc || null;
    if (interior) { if (top + CHARACTER_HITBOX_HEIGHT > interior.bottom + 6) beginInteriorTransition(scene); return; }
    if (!characterKeys.up.isDown && !characterKeys.upArrow.isDown) return;
    for (const house of npcHouseCache.values()) if (house && npcHouseSprites.has(house.id) && Math.abs(centerX - (house.doorX + 0.5) * TILE_SIZE) < 5 && top >= house.doorY * TILE_SIZE - 1 && top <= house.doorY * TILE_SIZE + 2) return beginInteriorTransition(scene, house);
}
