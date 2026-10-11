function getPersonPalette(look) {
    const [skin, , , shirtColor, pants, accessory, , topColor] = look;
    return {
        skin: NPC_SKIN_TONES[skin],
        hair: NPC_HAIR_COLORS[look[9] ?? (accessory ? 0 : topColor)], eye: NPC_EYE_COLORS[look[13] ?? 0],
        pants: NPC_PANTS_COLORS[pants],
        shirt: NPC_SHIRT_COLORS[shirtColor],
        shirtAccent: NPC_SHIRT_COLORS[look[10] ?? shirtColor][1], pantsAccent: NPC_PANTS_COLORS[look[12] ?? pants],
        top: accessory ? NPC_ACCESSORY_COLORS[topColor] : NPC_HAIR_COLORS[topColor]
    };
}

function composePersonPixels(scene, look, direction) {
    const [, face, shirt, , , accessory, top] = look;
    const palette = getPersonPalette(look);
    const column = direction === 'back' ? 0 : direction === 'front' ? 1 : 2;
    const mirror = direction === 'right';
    const colors = new Map();
    const assign = (sources, targets) => sources.forEach((source, index) => colors.set(source, targets[index]));
    assign(NPC_PART_COLORS.skin, palette.skin);
    assign(NPC_PART_COLORS.pants, [palette.pants[0], palette.pants[1]]);
    assign(NPC_PART_COLORS.shirt, palette.shirt);
    assign(NPC_PART_COLORS.shirtAccent, [palette.shirtAccent]); assign(NPC_PART_COLORS.pantsAccent, [palette.pantsAccent[1]]);
    assign(NPC_PART_COLORS.hair, palette.hair);
    assign(accessory ? NPC_PART_COLORS.accessory : NPC_PART_COLORS.hair, palette.top);
    const layers = [[face * 3 + column, 0], [9 + column, 2 + (look[11] ?? 0), 8], [6 + column, 1 + shirt], [(accessory ? 0 : 3) + column, 1 + top]];
    const sheet = getTerrainPixels(scene, 'character-parts');
    const pixels = new Array(NPC_PART_SIZE * NPC_PART_SIZE).fill(null);

    for (const [cellX, cellY, offsetY = 0] of layers) {
        for (let y = 0; y < NPC_PART_SIZE; y++) {
            for (let x = 0; x < NPC_PART_SIZE; x++) {
                const source = ((cellY * NPC_PART_SIZE + y) * sheet.width + cellX * NPC_PART_SIZE + (mirror ? NPC_PART_SIZE - 1 - x : x)) * 4;
                if (!sheet.data[source + 3]) continue;
                const sourceColor = (sheet.data[source] << 16) | (sheet.data[source + 1] << 8) | sheet.data[source + 2], color = cellY === 0 && sourceColor === 0x660000 && y >= 6 && y <= 7 ? palette.eye : colors.get(sourceColor);
                if (color !== undefined && y + offsetY < NPC_PART_SIZE) pixels[(y + offsetY) * NPC_PART_SIZE + x] = color;
            }
        }
    }
    return look[8] && direction !== 'left' && direction !== 'right' ? mirrorPersonPixels(pixels) : pixels;
}

function mirrorPersonPixels(pixels) {
    return pixels.map((_, index) => pixels[index - index % NPC_PART_SIZE + NPC_PART_SIZE - 1 - index % NPC_PART_SIZE]);
}

function walkPersonPixels(pixels, direction, frame, palette) {
    const size = NPC_PART_SIZE;
    if (direction === 'right') return mirrorPersonPixels(walkPersonPixels(mirrorPersonPixels(pixels), 'left', frame, palette));

    const walked = pixels.slice();
    const get = (x, y) => x < 0 || y < 0 || x >= size || y >= size ? null : pixels[y * size + x];
    const set = (x, y, color) => {
        if (x >= 0 && y >= 0 && x < size && y < size) walked[y * size + x] = color;
    };
    const filledColumns = y => Array.from({ length: size }, (_, x) => x).filter(x => get(x, y) !== null);

    if (direction === 'left') {
        const step = frame === 1 ? 1 : -1;
        for (let y = PERSON_LEG_TOP; y < size; y++) {
            const columns = filledColumns(y);
            if (!columns.length) continue;
            for (const x of columns) set(x, y, null);
            for (const x of columns) set(x + step, y, get(x, y));
            set(step > 0 ? columns[0] + step - 1 : columns[columns.length - 1] + step + 1, y, palette.pants[0]);
        }
        const columns = filledColumns(PERSON_HAND_ROW);
        const hand = columns.filter(x => get(x, PERSON_HAND_ROW) !== palette.shirt[0]);
        for (const x of hand) set(x, PERSON_HAND_ROW, palette.shirt[0]);
        for (const x of hand) set(x - step, PERSON_HAND_ROW, get(x, PERSON_HAND_ROW));
        set(step > 0 ? columns[columns.length - 1] + 1 : columns[0] - 1, PERSON_HAND_ROW, palette.skin[0]);
        return walked;
    }

    const leftLeads = (direction === 'front') === (frame === 1);
    const [armUp, armDown, legUp] = leftLeads
        ? [PERSON_LEFT_ARM, PERSON_RIGHT_ARM, PERSON_LEFT_LEG]
        : [PERSON_RIGHT_ARM, PERSON_LEFT_ARM, PERSON_RIGHT_LEG];
    for (const x of armUp) for (let y = PERSON_ARM_TOP; y <= PERSON_ARM_BOTTOM; y++) set(x, y, get(x, y + 1));
    for (const x of armDown) for (let y = PERSON_ARM_BOTTOM + 1; y >= PERSON_FOREARM_TOP; y--) set(x, y, get(x, y - 1));
    for (const x of legUp) {
        const bottom = PERSON_INNER_LEG_COLUMNS.includes(x) ? PERSON_LEG_TOP + 1 : size;
        for (let y = PERSON_LEG_TOP; y < bottom; y++) set(x, y, get(x, y + 1));
    }
    return walked;
}

function getPersonTexture(scene, key, look, direction, frame = 0) {
    if (scene.textures.exists(key)) return key;
    const standing = composePersonPixels(scene, look, direction);
    const pixels = frame ? walkPersonPixels(standing, direction, frame, getPersonPalette(look)) : standing;

    createCanvasTexture(scene, key, NPC_PART_SIZE, NPC_PART_SIZE, context => {
        const image = context.createImageData(NPC_PART_SIZE, NPC_PART_SIZE);
        pixels.forEach((color, pixel) => color !== null && writeRGBPixel(image.data, pixel, color));
        context.putImageData(image, 0, 0);
    });
    return key;
}

function createPlayerTextures(scene) {
    for (const direction of ['front', 'back', 'left', 'right']) {
        for (const frame of [0, 1, 2]) getPersonTexture(scene, `character-${direction}${frame ? `walk${frame}` : ''}`, PLAYER_LOOK, direction, frame);
    }
}
