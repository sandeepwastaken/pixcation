function extractRodArtStyles(scene) {
    const colorAt = (texture, [x, y, fallback]) => {
        const color = scene.textures.getPixel(x, y, texture);
        return color ? Phaser.Display.Color.GetColor(color.red, color.green, color.blue) : fallback;
    };
    const sample = (rod, points) => points.map(point => colorAt(rod.texture, point));

    for (const rod of MARKET_RODS) {
        rod.polePalette = sample(rod, [[19, 4, 0x4c3e32], [19, 6, 0x6b533b], [19, 5, 0x806953]]);
        rod.linePalette = sample(rod, [[28, 2, 0xa78178], [29, 3, 0xb99f92], [29, 5, 0xc8b8a8], [30, 9, FISHING_LINE_COLOR]]);
        rod.bobberPalette = sample(rod, [[27, 26, BOBBER_TOP_COLOR], [25, 26, BOBBER_TOP_COLOR], [23, 25, BOBBER_BOTTOM_COLOR]]);
    }
}

function createShimmerSheet(scene) {
    const source = getTerrainPixels(scene, 'shimmer-art');
    const image = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    const canvas = document.createElement('canvas');
    const [fromR, fromG, fromB] = SHIMMER_RECOLOR_FROM;

    for (let index = 0; index < image.data.length; index += 4) {
        if (image.data[index] === fromR && image.data[index + 1] === fromG && image.data[index + 2] === fromB) {
            image.data.set(SHIMMER_RECOLOR_TO, index);
        }
    }

    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext('2d').putImageData(image, 0, 0);
    scene.textures.addSpriteSheet('shimmer', canvas, { frameWidth: 12, frameHeight: 1 });
}

function createCanvasTexture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return;

    const texture = scene.textures.createCanvas(key, width, height);
    draw(texture.getContext());
    texture.refresh();
}

function extractSilhouetteShadow(scene, key) {
    const pixels = getTerrainPixels(scene, key);
    const { width, height } = pixels;
    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && pixels.data[(y * width + x) * 4 + 3] > 0;
    const points = [];

    for (let y = 0; y < height + WOOD_SHADOW_OFFSET; y++) {
        for (let x = 0; x < width + WOOD_SHADOW_OFFSET; x++) {
            if (solid(x - WOOD_SHADOW_OFFSET, y - WOOD_SHADOW_OFFSET) && !solid(x, y)) points.push(x, y);
        }
    }

    return points;
}

function createPropArt(scene) {
    for (const key of ['bush', 'rock', 'boulder']) {
        const source = getTextureSource(scene, key);
        propArt.set(key, { width: source.width, height: source.height, shadow: extractSilhouetteShadow(scene, key) });
    }

    const trunk = getTerrainPixels(scene, 'tree-bare');
    treeVariants.length = 0;

    for (let index = 0; index < TREE_VARIANT_COUNT; index++) {
        const variant = generateTreeVariant(trunk, Math.floor(worldHash(index, 0, 766) * 4294967295));
        variant.key = `tree-${index}`;
        createCanvasTexture(scene, variant.key, variant.width, variant.height, context => {
            context.putImageData(new ImageData(variant.data, variant.width, variant.height), 0, 0);
        });
        treeVariants.push(variant);
    }
}

function createBushSlices(scene) {
    const source = getTerrainPixels(scene, 'bush');
    const { width, height } = source;
    const depths = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            depths[y * width + x] = Math.min(TILE_SIZE - 1, Math.floor(
                (worldHash(x, y, 761) * 0.7 + (y / (height - 1)) * 0.3) * TILE_SIZE
            ));
        }
    }

    for (let slice = 0; slice < TILE_SIZE; slice++) {
        createCanvasTexture(scene, `bush-slice-${slice}`, width, height, context => {
            const image = new ImageData(new Uint8ClampedArray(source.data), width, height);

            for (let pixel = 0; pixel < depths.length; pixel++) {
                if (depths[pixel] !== slice) image.data[pixel * 4 + 3] = 0;
            }

            context.putImageData(image, 0, 0);
        });
    }
}
