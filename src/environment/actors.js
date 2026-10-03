function isGuideSpawnTile(tileX, tileY) {
    const tileKey = getWorldTile(tileX, tileY).key.toLowerCase();

    return getTerrainType(tileX, tileY) !== 'water' &&
        !tileKey.includes('edge') &&
        !tileKey.includes('wood') &&
        !tileKey.includes('water') &&
        isTileClearOfProps(tileX, tileY);
}

function canPlaceStoreAt(storeTileX, storeTileY) {
    for (let localY = 0; localY < STORE_HEIGHT_TILES; localY += 1) {
        for (let localX = 0; localX < STORE_WIDTH_TILES; localX += 1) {
            if (!isGuideSpawnTile(storeTileX + localX, storeTileY + localY)) {
                return false;
            }
        }
    }

    return true;
}

function findGuideAndStoreSpawn() {
    const centerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const centerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);

    for (let radius = 3; radius <= 8; radius += 1) {
        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
            const edgeRow = offsetY === -radius || offsetY === radius;
            for (let offsetX = -radius; offsetX <= radius; offsetX += edgeRow ? 1 : radius * 2) {
                const guideTileX = centerTileX + offsetX;
                const guideTileY = centerTileY + offsetY;
                const storeTileX = guideTileX - 1;
                const storeTileY = guideTileY - STORE_HEIGHT_TILES;

                if (!isGuideSpawnTile(guideTileX, guideTileY) || !canPlaceStoreAt(storeTileX, storeTileY)) {
                    continue;
                }

                return {
                    guideTileX,
                    guideTileY,
                    storeTileX,
                    storeTileY
                };
            }
        }
    }

    return null;
}

function spawnGuideAndStore(scene) {
    const spawn = findGuideAndStoreSpawn();
    if (!spawn) return;

    store = scene.add.image(spawn.storeTileX * TILE_SIZE, spawn.storeTileY * TILE_SIZE, 'store')
        .setOrigin(0)
        .setDepth(spawn.storeTileY * TILE_SIZE + STORE_HEIGHT);
    guide = scene.add.image(spawn.guideTileX * TILE_SIZE, spawn.guideTileY * TILE_SIZE, 'guide')
        .setOrigin(0)
        .setDepth(spawn.guideTileY * TILE_SIZE + GUIDE_SIZE);
    worldObjectLayer.add([store, guide]);

    staticShadowCasters.push(
        { x: guide.x + ACTOR_SHADOW_X, y: guide.y + ACTOR_SHADOW_Y, points: getShapePoints(ACTOR_SHADOW_SHAPE) },
        { x: store.x, y: store.y, points: extractSilhouetteShadow(scene, 'store') }
    );
    rebakeLoadedShadows(scene);
}
