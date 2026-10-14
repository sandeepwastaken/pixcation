function mixPortraitColor(first, second, amount) {
    return samplePersonPalette([[first], [second]], 0, amount)[0];
}

function getPortraitColorMap(look, expression = false, makeup = false, palette = getPersonPalette(look)) {
    const mix = mixPortraitColor;
    const colors = new Map([[0xff0000, palette.skin[2]], [0xe90000, mix(palette.skin[1], palette.skin[2], 0.5)], [0xd20000, palette.skin[1]], [0xa40000, palette.skin[0]], [0xff2d1c, mix(palette.skin[2], 0xffffff, 0.12)]]);
    for (const [source, target] of [[0xd07d00, palette.hair[0]], [0xe88b00, mix(palette.hair[0], palette.hair[1], 0.6)], [0xff9900, palette.hair[1]], [0xffdeab, palette.hair[2]]]) colors.set(source, target);
    for (const [source, target] of [[0x004a16, palette.top[0]], [0x00ac34, palette.top[1]], [0x00d540, mix(palette.top[1], palette.top[2], 0.5)], [0x00ff4d, palette.top[2]], [0x8affad, palette.top[3]]]) colors.set(source, target);
    for (const [source, target] of [[0x00129e, palette.shirt[0]], [0x0018cf, mix(palette.shirt[0], palette.shirt[1], 0.5)], [0x001eff, palette.shirt[1]], [0x364df7, mix(palette.shirt[1], 0xffffff, 0.18)], [0x00d9ff, palette.shirtAccent], [0x00c3e5, mix(palette.shirtAccent, 0x000000, 0.16)]]) colors.set(source, target);
    for (const [source, target] of [[0x000000, 0x000000], [0x660000, expression ? palette.skin[3] : mix(palette.eye, 0x000000, 0.25)], [0x8f1010, palette.eye], [0xb72323, mix(palette.eye, 0xffffff, 0.2)], [0x1a0000, mix(expression ? palette.skin[3] : palette.hair[0], 0x000000, 0.45)], [0x3b0000, mix(palette.hair[0], 0x000000, 0.2)], [0xffffff, 0xffffff], [0xf9dede, 0xf2efec], [0xf2bdbd, 0xdcd6d0], [0xc78888, 0xb7aba1]]) colors.set(source, target);
    colors.set(0xe2d700, palette.extra[0]); colors.set(0xfff200, palette.extra[1]);
    if (makeup) {colors.set(0x660000, palette.skin[3]); colors.set(0x8f1010, palette.skin[0]);}
    return colors;
}

function getPersonMouthLayer(look, expression) {return expression + (look[1] !== 2 && look[19] === 1 ? '2' : '1');}
function composePersonPortraitPixels(scene, look, expression = 'normal') {
    if (!['normal', 'openMouth', 'grin'].includes(expression)) throw new Error('Unknown portrait expression');
    const prefix = 'characters/people/portraits/', background = getTerrainPixels(scene, prefix + 'background');
    const {width, height} = background, data = new Uint8ClampedArray(background.data.length), palette = getPersonPalette(look), colors = getPortraitColorMap(look, false, false, palette);
    const layers = ['base' + (look[1] + 1), ...(look[14] ? ['base' + (look[1] + 1) + (look[1] !== 2 && look[20] === 1 ? 'FF' : 'F')] : []), ...(expression === 'normal' ? [] : [getPersonMouthLayer(look, expression)]), 'shirt' + (look[2] + 1), ...(look[21] ? ['extra' + look[21]] : []), (look[5] ? 'vanity' : 'hair') + (look[6] + 1)];
    for (const layer of layers) {
        const source = getTerrainPixels(scene, prefix + layer), mapping = layer.startsWith('openMouth') || layer.startsWith('grin') ? getPortraitColorMap(look, true, false, palette) : layer.endsWith('FF') ? getPortraitColorMap(look, false, true, palette) : colors;
        if (source.width !== width || source.height !== height) throw new Error('Portrait layer dimensions do not match: ' + layer);
        for (let pixel = 0; pixel < width * height; pixel++) {
            const offset = pixel * 4; if (!source.data[offset + 3]) continue;
            const original = (source.data[offset] << 16) | (source.data[offset + 1] << 8) | source.data[offset + 2], color = look[23] === 2 && /^base\d$/.test(layer) && original === 0x000000 && [20, 30].includes(pixel % width) && pixel / width >= 25 && pixel / width < 29 ? mixPortraitColor(palette.eye, 0x000000, 0.12) : !layer.endsWith('FF') && pixel % width >= width / 2 && original === 0x660000 ? mixPortraitColor(palette.eye2, 0x000000, 0.25) : !layer.endsWith('FF') && pixel % width >= width / 2 && original === 0x8f1010 ? palette.eye2 : !layer.endsWith('FF') && pixel % width >= width / 2 && original === 0xb72323 ? mixPortraitColor(palette.eye2, 0xffffff, 0.2) : mapping.get(original);
            if (color === undefined) throw new Error('Unmapped portrait color: ' + original.toString(16) + ' in ' + layer);
            data[offset] = color >> 16 & 255; data[offset + 1] = color >> 8 & 255; data[offset + 2] = color & 255; data[offset + 3] = source.data[offset + 3];
        }
    }
    if (look[8]) for (let y = 0; y < height; y++) for (let x = 0; x < Math.floor(width / 2); x++) {const first = (y * width + x) * 4, second = (y * width + width - 1 - x) * 4; for (let channel = 0; channel < 4; channel++) [data[first + channel], data[second + channel]] = [data[second + channel], data[first + channel]];}
    for (let pixel = 0; pixel < width * height; pixel++) {const offset = pixel * 4, x = pixel % width, y = Math.floor(pixel / width); if (!data[offset + 3] || x < 3 || y < 3 || x >= width - 3 || y >= height - 3) data.set(background.data.subarray(offset, offset + 4), offset);}
    return {width, height, data};
}

function getPersonPortraitTexture(scene, look, expression = 'normal') {
    const key = `portrait-${look.join('-')}-${expression}`;
    if (!scene.textures.exists(key)) {
        const pixels = composePersonPortraitPixels(scene, look, expression);
        createCanvasTexture(scene, key, pixels.width, pixels.height, context => {const image = context.createImageData(pixels.width, pixels.height); image.data.set(pixels.data); context.putImageData(image, 0, 0);});
    }
    return key;
}

function getGuidePortraitLook(scene) {
    return scene.guidePortraitLook ||= createNpc(-2, 2, null).look;
}

function composeGuidePortraitPixels(scene, expression = 'normal', eyesClosed = false) {
    if (!['normal', 'openMouth', 'grin'].includes(expression)) throw new Error('Unknown guide expression');
    const prefix = 'characters/guide/portraits/', base = getTerrainPixels(scene, prefix + 'base'), data = new Uint8ClampedArray(base.data);
    for (const layer of [...(expression === 'normal' ? [] : [expression === 'openMouth' ? 'open-mouth' : expression]), ...(eyesClosed ? ['eyes-closed'] : [])]) {
        const source = getTerrainPixels(scene, prefix + layer); if (source.width !== base.width || source.height !== base.height) throw new Error('Guide portrait layer dimensions do not match');
        for (let pixel = 0; pixel < base.width * base.height; pixel++) {const offset = pixel * 4; if (source.data[offset + 3]) data.set(source.data.subarray(offset, offset + 4), offset);}
    }
    return {width: base.width, height: base.height, data};
}

function getGuidePortraitTexture(scene, expression = 'normal', eyesClosed = false) {
    const key = `guide-portrait-${expression}-${eyesClosed ? 'closed' : 'open'}`;
    if (!scene.textures.exists(key)) {const pixels = composeGuidePortraitPixels(scene, expression, eyesClosed); createCanvasTexture(scene, key, pixels.width, pixels.height, context => {const image = context.createImageData(pixels.width, pixels.height); image.data.set(pixels.data); context.putImageData(image, 0, 0);});}
    return key;
}

function setDialoguePortraitPose(scene, look, expression) {
    dialoguePortrait.portraitScene = scene; dialoguePortrait.portraitLook = look; dialoguePortrait.portraitExpression = expression;
    const key = look ? getPersonPortraitTexture(scene, look, expression) : getGuidePortraitTexture(scene, expression, dialoguePortrait.portraitEyesClosed || dialoguePortrait.portraitBlinkState?.closed);
    if (dialoguePortrait.texture.key !== key) dialoguePortrait.setTexture(key);
}

function updateDialoguePortraitBlink(scene, time) {
    if (!dialogueOpen || dialogueNpc || !dialoguePortrait || dialoguePortrait.portraitEyesClosed) return;
    const blink = dialoguePortrait.portraitBlinkState ||= {next: time + 1800 + Math.random() * 4200, until: 0, closed: false};
    if (time >= blink.next) {blink.until = time + 120; blink.next = time + 2200 + Math.random() * 4200;}
    const closed = time < blink.until; if (closed === blink.closed) return; blink.closed = closed;
    setDialoguePortraitPose(scene, null, dialoguePortrait.portraitExpression || 'normal');
}
