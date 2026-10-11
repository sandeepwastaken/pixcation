function getPersonPalette(look) {
    const [skin, , , shirtColor, pants, accessory, , topColor] = look;
    const blend = salt => look[16] ? ((Math.imul(look[16] ^ salt, 0x45d9f3b) >>> 0) & 65535) / 65535 : 0;
    return {
        skin: look[15] === undefined ? NPC_SKIN_TONES[skin] : getPersonSkinRamp(skin >= 5, look[15]),
        hair: samplePersonPalette(NPC_HAIR_COLORS, look[9] ?? (accessory ? 0 : topColor), blend(1)), eye: samplePersonPalette(NPC_EYE_PALETTES, look[13] ?? 0, look[13] ? blend(7) : 0)[0],
        pants: samplePersonPalette(NPC_PANTS_COLORS, pants, blend(2)),
        shirt: samplePersonPalette(NPC_SHIRT_COLORS, shirtColor, blend(3)),
        shirtAccent: samplePersonPalette(NPC_SHIRT_COLORS, look[10] ?? shirtColor, blend(5))[1], pantsAccent: samplePersonPalette(NPC_PANTS_COLORS, look[12] ?? pants, blend(6)),
        top: samplePersonPalette(accessory ? NPC_ACCESSORY_COLORS : NPC_HAIR_COLORS, topColor, blend(accessory ? 4 : 1))
    };
}

function samplePersonPalette(palettes, index, amount) {
    const first = palettes[index], next = palettes[(index + 1) % palettes.length];
    return first.map((color, shade) => [16, 8, 0].reduce((result, shift) => result | Math.round(((color >> shift) & 255) * (1 - amount) + ((next[shade] >> shift) & 255) * amount) << shift, 0));
}

function getPersonSkinRamp(pastel, amount) {
    const anchors = pastel ? [NPC_SKIN_TONES[8], [0xc0a478, 0xe8cfaa, 0xffecd2, 0x806746], NPC_SKIN_TONES[7], NPC_SKIN_TONES[6], NPC_SKIN_TONES[5], NPC_SKIN_TONES[8]] : [NPC_SKIN_TONES[4], NPC_SKIN_TONES[3], NPC_SKIN_TONES[2], NPC_SKIN_TONES[0], NPC_SKIN_TONES[1]];
    const value = Math.max(0, Math.min(1, amount)) * (anchors.length - 1), index = Math.min(anchors.length - 2, Math.floor(value));
    return samplePersonPalette(anchors, index, value - index);
}

function getGuideBlinkTexture(scene) {
    if (scene.textures.exists('guide-blink')) return;
    const source = getTerrainPixels(scene, 'guide');
    createCanvasTexture(scene, 'guide-blink', source.width, source.height, context => {
        const image = context.createImageData(source.width, source.height); image.data.set(source.data);
        for (const x of [6, 9]) writeRGBPixel(image.data, 6 * source.width + x, 0xb39777);
        context.putImageData(image, 0, 0);
    });
}

function updatePersonBlink(scene, sprite, look, direction, frame, time) {
    if (!sprite || sprite.visible === false || sprite === character && (startup || spawnReturn)) return;
    const blink = sprite.personBlinkState ||= {next: time + 1800 + Math.random() * 4200, until: 0, closed: false};
    if (time >= blink.next) {blink.until = time + 120; blink.next = time + 2200 + Math.random() * 4200;}
    blink.closed = time < blink.until;
    const base = sprite.texture.key.replace(/-blink$/, ''), key = base + (blink.closed ? '-blink' : '');
    if (sprite.texture.key === key) return;
    if (look) getPersonTexture(scene, key, look, direction, frame, blink.closed); else if (blink.closed) getGuideBlinkTexture(scene);
    sprite.setTexture(key);
    if (sprite === character) characterTextureKey = key;
}

function updateActorBlinks(scene, time) {
    updatePersonBlink(scene, character, PLAYER_LOOK, characterDirection, Number(character.texture.key.match(/walk([12])/)?.[1] || 0), time);
    updatePersonBlink(scene, guide, null, 'front', 0, time);
    for (const chunk of loadedChunks.values()) if (chunk.visible) for (const npc of chunk.npcs || []) if (npc.state !== 'home') updatePersonBlink(scene, npc.sprite, npc.look, npc.direction, npc.frame || 0, time);
}

function composePersonPixels(scene, look, direction, blink = false) {
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
                const sourceColor = (sheet.data[source] << 16) | (sheet.data[source + 1] << 8) | sheet.data[source + 2], color = cellY === 0 && sourceColor === 0x660000 && y >= 6 && y <= 7 ? blink ? palette.skin[1] : palette.eye : colors.get(sourceColor);
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

function getPersonTexture(scene, key, look, direction, frame = 0, blink = false) {
    if (scene.textures.exists(key)) return key;
    const standing = composePersonPixels(scene, look, direction, blink);
    const pixels = frame ? walkPersonPixels(standing, direction, frame, getPersonPalette(look)) : standing;

    createCanvasTexture(scene, key, NPC_PART_SIZE, NPC_PART_SIZE, context => {
        const image = context.createImageData(NPC_PART_SIZE, NPC_PART_SIZE);
        pixels.forEach((color, pixel) => color !== null && writeRGBPixel(image.data, pixel, color));
        context.putImageData(image, 0, 0);
    });
    return key;
}

function createPlayerTextures(scene) {
    for (const direction of ['front', 'back', 'left', 'right']) for (const blink of [false, true]) {
        for (const frame of [0, 1, 2]) getPersonTexture(scene, `character-${direction}${frame ? `walk${frame}` : ''}${blink ? '-blink' : ''}`, PLAYER_LOOK, direction, frame, blink);
    }
}
