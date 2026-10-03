function createRoundedCliffTextures(scene) {
    const source = key => getTextureSource(scene, key);

    for (let left = 0; left < DIRT_CLIFF_TILES.length; left++) {
        for (let right = 0; right < DIRT_CLIFF_TILES[left].length; right++) {
            const key = DIRT_CLIFF_TILES[left][right];
            const half = TILE_SIZE / 2;

            createCanvasTexture(scene, key, TILE_SIZE, TILE_SIZE, context => {
                context.drawImage(source(DIRT_CLIFF_TILES[left][0]), 0, 0, half, TILE_SIZE, 0, 0, half, TILE_SIZE);
                context.drawImage(source(DIRT_CLIFF_TILES[0][right]), half, 0, half, TILE_SIZE, half, 0, half, TILE_SIZE);
            });

            const cliffKey = left === 1 || right === 1 ? `${key}-trimmed` : key;

            createCanvasTexture(scene, cliffKey, TILE_SIZE, TILE_SIZE, context => {
                context.drawImage(source(key), 0, 0);

                for (const [trim, x] of [[left, 0], [right, TILE_SIZE - 2]]) {
                    if (trim !== 1) continue;
                    context.clearRect(x, TILE_SIZE - 1, 2, 1);
                    context.clearRect(x ? x + 1 : 0, TILE_SIZE - 2, 1, 1);
                }
            });

            for (const corner of ['cornerDirt1', 'cornerDirt2', 'cornerDirt3']) {
                createCanvasTexture(scene, `${cliffKey}-${corner}`, TILE_SIZE, TILE_SIZE, context => {
                    context.drawImage(source(cliffKey), 0, 0);
                    context.clearRect(0, 0, TILE_SIZE, 5);
                    context.drawImage(source(corner), 0, 0, TILE_SIZE, 5, 0, 0, TILE_SIZE, 5);
                });
            }
        }
    }

    for (const base of ['waterDirt', 'waterGrass']) {
        for (const [suffix, left, right] of [['InnerLeft', true, false], ['InnerRight', false, true], ['InnerBoth', true, true]]) {
            createCanvasTexture(scene, `${base}${suffix}`, TILE_SIZE, TILE_SIZE, context => {
                context.drawImage(source(base), 0, 0);
                if (left) context.drawImage(source('waterDirtInnerLeft'), 0, 0, 5, TILE_SIZE, 0, 0, 5, TILE_SIZE);
                if (right) context.drawImage(source('waterDirtInnerRight'), TILE_SIZE - 5, 0, 5, TILE_SIZE, TILE_SIZE - 5, 0, 5, TILE_SIZE);
            });
        }
    }
}
