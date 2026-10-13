function mixPortraitColor(first, second, amount) {
    return samplePersonPalette([[first], [second]], 0, amount)[0];
}

function getPortraitColorMap(look, expression = false) {
    const palette = getPersonPalette(look), mix = mixPortraitColor;
    const colors = new Map([[0xff0000, palette.skin[2]], [0xe90000, mix(palette.skin[1], palette.skin[2], 0.5)], [0xd20000, palette.skin[1]], [0xa40000, palette.skin[0]], [0xff2d1c, mix(palette.skin[2], 0xffffff, 0.12)]]);
    for (const [source, target] of [[0xd07d00, palette.hair[0]], [0xe88b00, mix(palette.hair[0], palette.hair[1], 0.6)], [0xff9900, palette.hair[1]], [0xffdeab, palette.hair[2]]]) colors.set(source, target);
    for (const [source, target] of [[0x004a16, palette.top[0]], [0x00ac34, palette.top[1]], [0x00d540, mix(palette.top[1], palette.top[2], 0.5)], [0x00ff4d, palette.top[2]], [0x8affad, palette.top[3]]]) colors.set(source, target);
    for (const [source, target] of [[0x00129e, palette.shirt[0]], [0x0018cf, mix(palette.shirt[0], palette.shirt[1], 0.5)], [0x001eff, palette.shirt[1]], [0x364df7, mix(palette.shirt[1], 0xffffff, 0.18)], [0x00d9ff, palette.shirtAccent], [0x00c3e5, mix(palette.shirtAccent, 0x000000, 0.16)]]) colors.set(source, target);
    for (const [source, target] of [[0x000000, 0x000000], [0x660000, expression ? palette.skin[3] : mix(palette.eye, 0x000000, 0.25)], [0x8f1010, palette.eye], [0xb72323, mix(palette.eye, 0xffffff, 0.2)], [0x1a0000, mix(expression ? palette.skin[3] : palette.hair[0], 0x000000, 0.45)], [0x3b0000, mix(palette.hair[0], 0x000000, 0.2)], [0xffffff, 0xffffff], [0xf9dede, 0xf2efec], [0xf2bdbd, 0xdcd6d0], [0xc78888, 0xb7aba1]]) colors.set(source, target);
    return colors;
}

function composePersonPortraitPixels(scene, look, expression = 'normal') {
    if (!['normal', 'openMouth', 'grin'].includes(expression)) throw new Error('Unknown portrait expression');
    const prefix = 'characters/people/portraits/', background = getTerrainPixels(scene, prefix + 'background');
    const {width, height} = background, data = new Uint8ClampedArray(background.data), colors = getPortraitColorMap(look);
    const layers = ['base' + (look[1] + 1), ...(look[14] ? ['base' + (look[1] + 1) + 'F'] : []), ...(expression === 'normal' ? [] : [expression]), 'shirt' + (look[2] + 1), (look[5] ? 'vanity' : 'hair') + (look[6] + 1)];
    for (const layer of layers) {
        const source = getTerrainPixels(scene, prefix + layer), mapping = layer === 'openMouth' || layer === 'grin' ? getPortraitColorMap(look, true) : colors;
        if (source.width !== width || source.height !== height) throw new Error('Portrait layer dimensions do not match: ' + layer);
        for (let pixel = 0; pixel < width * height; pixel++) {
            const offset = pixel * 4; if (!source.data[offset + 3]) continue;
            const original = (source.data[offset] << 16) | (source.data[offset + 1] << 8) | source.data[offset + 2], color = mapping.get(original);
            if (color === undefined) throw new Error('Unmapped portrait color: ' + original.toString(16) + ' in ' + layer);
            data[offset] = color >> 16 & 255; data[offset + 1] = color >> 8 & 255; data[offset + 2] = color & 255; data[offset + 3] = source.data[offset + 3];
        }
    }
    if (look[8]) for (let y = 0; y < height; y++) for (let x = 0; x < Math.floor(width / 2); x++) {const first = (y * width + x) * 4, second = (y * width + width - 1 - x) * 4; for (let channel = 0; channel < 4; channel++) [data[first + channel], data[second + channel]] = [data[second + channel], data[first + channel]];}
    for (let pixel = 0; pixel < width * height; pixel++) {const offset = pixel * 4, color = background.data[offset] << 16 | background.data[offset + 1] << 8 | background.data[offset + 2]; if (color !== 0x32180f) data.set(background.data.subarray(offset, offset + 4), offset);}
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
