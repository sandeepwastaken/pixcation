function getTileId(tileX, tileY) {
    return tileX * 67108864 + tileY;
}

function cacheWorldValue(cache, key, value) {
    if (cache.size >= WORLD_CACHE_LIMIT) {
        const keys = cache.keys();
        for (let index = 0; index < 512; index++) cache.delete(keys.next().value);
    }

    cache.set(key, value);
    return value;
}

function coordinateHash(x, y, seedHash) {
    let number = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seedHash;

    number ^= number >>> 13;

    number = Math.imul(number, 1274126177);

    return (((number ^ (number >>> 16)) >>> 0) / 4294967295);
}

function worldHash(x, y, salt = 0) {
    return coordinateHash(
        x,
        y,
        Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER)
    );
}

function smoothNoiseAmount(value) {
    return (value * value * (3 - 2 * value));
}

function valueNoise(worldX, worldY, scale, salt) {
    const scaledX = worldX / scale;
    const scaledY = worldY / scale;

    const left = Math.floor(scaledX);
    const top = Math.floor(scaledY), right = left + 1, bottom = top + 1;

    const horizontalAmount = smoothNoiseAmount(scaledX - left);
    const verticalAmount = smoothNoiseAmount(scaledY - top);

    const seedHash = Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER);
    const topLeft = coordinateHash(left, top, seedHash);
    const topRight = coordinateHash(right, top, seedHash);
    const bottomLeft = coordinateHash(left, bottom, seedHash);
    const bottomRight = coordinateHash(right, bottom, seedHash);

    const topValue = topLeft + (topRight - topLeft) * horizontalAmount;
    const bottomValue = bottomLeft + (bottomRight - bottomLeft) * horizontalAmount;

    return topValue + (bottomValue - topValue) * verticalAmount;
}

function fractalNoise(worldX, worldY, salt) {
    return(valueNoise(worldX, worldY, 48 * WORLD_FEATURE_SCALE, salt) * 0.55 +
        valueNoise(worldX + 83, worldY - 47, 24 * WORLD_FEATURE_SCALE, salt + 1) * 0.30 +
        valueNoise(worldX - 29, worldY + 101, 12 * WORLD_FEATURE_SCALE, salt + 2) * 0.15);
}

function createTileCache(createChunk) {
    const chunks = new Map();
    let lastKey = null;
    let lastChunk = null;

    return (tileX, tileY, generate) => {
        const chunkX = Math.floor(tileX / CHUNK_SIZE);
        const chunkY = Math.floor(tileY / CHUNK_SIZE);
        const key = getTileId(chunkX, chunkY);

        if (key !== lastKey) {
            lastChunk = chunks.get(key);

            if (!lastChunk) {
                if (chunks.size >= TILE_CACHE_CHUNK_LIMIT) chunks.delete(chunks.keys().next().value);
                lastChunk = createChunk();
                chunks.set(key, lastChunk);
            }

            lastKey = key;
        }

        return lastChunk[(tileY - chunkY * CHUNK_SIZE) * CHUNK_SIZE + tileX - chunkX * CHUNK_SIZE] ||= generate(tileX, tileY);
    };
}

const TERRAIN_TYPES = [null, 'grass', 'dirt', 'water'];
const terrainTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const worldTiles = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function getTerrainType(tileX, tileY) {
    return TERRAIN_TYPES[terrainTiles(tileX, tileY, generateTerrainCode)];
}

function generateTerrainCode(tileX, tileY) {
    const terrain = generateTerrainType(tileX, tileY);
    const surround = terrain === 'dirt' ? 'grass' : terrain === 'grass' ? 'dirt' : null;
    return TERRAIN_TYPES.indexOf(surround && isThinTerrain(tileX, tileY, surround) ? surround : terrain);
}

function isThinTerrain(tileX, tileY, surround) {
    const outside = (offsetX, offsetY) => generateTerrainType(tileX + offsetX, tileY + offsetY) === surround;
    return outside(-1, 0) && outside(1, 0) || outside(0, -1) && outside(0, 1);
}

function generateTerrainType(tileX, tileY) {
    if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
        return 'grass';
    }

    const warpScale = 64 * WORLD_FEATURE_SCALE;
    const warpStrength = 24 * WORLD_FEATURE_SCALE;
    const warpX = (valueNoise(tileX, tileY, warpScale, 10) - 0.5) * warpStrength;
    const warpY = (valueNoise(tileX + 200, tileY - 100, warpScale, 11) - 0.5) * warpStrength;
    const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);

    if (elevation < 0.3) {
        return 'water';
    }

    if (elevation < 0.38) return 'dirt';

    const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);
    const localDirt = valueNoise(tileX, tileY, 4, 44);
    const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;

    return dirtScore > 0.63 ? 'dirt' : 'grass';
}

function isLandTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) !== 'water';
}

function getTerrainTileKey(tileX, tileY, terrain = getTerrainType(tileX, tileY), north, south) {
    if (terrain === 'water') {
        north ??= getTerrainType(tileX, tileY - 1);
        return north === 'dirt' ? 'waterDirt' : north === 'grass' ? 'waterGrass' : 'water';
    }

    south ??= getTerrainType(tileX, tileY + 1);
    if (south === 'water') return terrain === 'dirt' ? 'dirtEdge' : 'grassEdge';
    if (terrain === 'dirt') return 'dirt1';
    if (worldHash(tileX, tileY, 670) <= 0.80) return 'grass1';
    if (valueNoise(tileX, tileY, 8, 671) <= 0.62) return 'grass2';

    return valueNoise(tileX + 149, tileY - 83, 24, 672) > 0.5 ? 'grass4' : 'grass3';
}

function getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy) {
    if (terrain === 'dirt' && horizontal === 'grass' && vertical === 'grass') {
        return 'corner';
    }

    if (terrain === 'grass' && horizontal === 'dirt' && vertical === 'dirt' && diagonal === 'dirt') {
        return 'dirtEdgeCorner';
    }

    if (terrain === 'water' && horizontal !== 'water' && vertical !== 'water' && diagonal !== 'water') {
        return dy < 0 ? 'dirtCliffCorner' : 'dirtEdgeCorner';
    }

    return null;
}

function getTerrainTile(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);
    const north = getTerrainType(tileX, tileY - 1);
    const south = getTerrainType(tileX, tileY + 1);
    const west = getTerrainType(tileX - 1, tileY);
    const east = getTerrainType(tileX + 1, tileY);

    const tile = {
        key: getTerrainTileKey(tileX, tileY, terrain, north, south),
        rotation: 0
    };

    if (terrain === 'dirt' && south === 'water') {
        const left = west === 'water' ? 1
            : getTerrainType(tileX - 1, tileY + 1) !== 'water' ? 2 : 0;
        const right = east === 'water' ? 1
            : getTerrainType(tileX + 1, tileY + 1) !== 'water' ? 2 : 0;

        tile.textureKey = DIRT_CLIFF_TILES[left][right];

        if (left === 1 || right === 1) {
            tile.baseKey = 'water';
            tile.textureKey += '-trimmed';
        }
    }

    if (terrain === 'dirt' && north === 'water') {
        const left = west === 'water';
        const right = east === 'water';

        if (left || right) {
            const corner = left && right ? 'cornerDirt3'
                : left ? 'cornerDirt1' : 'cornerDirt2';

            tile.baseKey = 'water';
            tile.textureKey = south === 'water'
                ? `${tile.textureKey}-${corner}` : corner;
        }
    }

    if (terrain === 'water' && north !== 'water') {
        const left = west !== 'water' &&
            getTerrainType(tileX - 1, tileY - 1) !== 'water';
        const right = east !== 'water' &&
            getTerrainType(tileX + 1, tileY - 1) !== 'water';

        if (left || right) {
            const suffix = left && right ? 'InnerBoth'
                : left ? 'InnerLeft' : 'InnerRight';

            tile.textureKey = `${tile.key}${suffix}`;
        }
    }

    for (const [dx, dy] of TERRAIN_CORNER_OFFSETS) {
        const horizontal = dx < 0 ? west : east;
        const vertical = dy < 0 ? north : south;
        const dirtCorner = terrain === 'grass' && horizontal === 'dirt' && vertical === 'dirt';
        // Dirt corners ignore diagonals; other corners need both sides to differ from this tile.
        const diagonal = dirtCorner || terrain === 'water' && horizontal !== terrain && vertical !== terrain
            ? getTerrainType(tileX + dx, tileY + dy) : null;
        const patchKey = getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy);

        if (!patchKey) continue;

        const size = patchKey === 'corner' ? 7 : 5;

        tile.patches ||= [];
        tile.patches.push({
            key: patchKey,
            x: dx < 0 ? 0 : TILE_SIZE - size,
            y: dy < 0 ? 0 : TILE_SIZE - size,
            size,
            flipX: dx > 0,
            flipY: dy > 0
        });
    }

    return tile;
}

function getWorldTile(tileX, tileY) {
    return worldTiles(tileX, tileY, generateWorldTile);
}

function generateWorldTile(tileX, tileY) {
    const tile = getBridgeTile(tileX, tileY) || getPierTile(tileX, tileY) || getTerrainTile(tileX, tileY);
    const name = tile.key.toLowerCase();

    tile.blocking = name.includes('water') ? 'full'
        : name.includes('edge') || name.includes('left') || name.includes('right') ? 'lower'
        : null;

    return tile;
}

const grassTints = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function getGrassBiome(tileX, tileY) {
    const noise = valueNoise(tileX, tileY, GRASS_BIOME_SCALE, 901) * 0.75 + valueNoise(tileX + 57, tileY - 31, GRASS_BIOME_SCALE / 3, 902) * 0.25;
    return Math.min(1, Math.max(0, (noise - 0.5) * GRASS_BIOME_CONTRAST + 0.5));
}

function computeGrassTint(tileX, tileY) {
    const biome = getGrassBiome(tileX + 0.5, tileY + 0.5);
    let index = 1;
    while (index < GRASS_TINTS.length - 1 && GRASS_TINTS[index][0] < biome) index++;
    const [fromAt, ...from] = GRASS_TINTS[index - 1];
    const [toAt, ...to] = GRASS_TINTS[index];
    const amount = Math.min(1, Math.max(0, (biome - fromAt) / (toAt - fromAt)));
    return from.map((value, channel) => value + (to[channel] - value) * amount);
}

function getGrassTint(tileX, tileY) {
    return grassTints(tileX, tileY, computeGrassTint);
}

function tintGrassColor(color, tileX, tileY) {
    const tint = getGrassTint(tileX, tileY);
    return color.map((value, channel) => Math.min(255, Math.round(value * tint[channel])));
}

function tintChunkGrass(context, originTileX, originTileY) {
    const image = context.getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    const data = image.data;
    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        let tint = null;
        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            if (x % TILE_SIZE === 0) tint = getGrassTint(originTileX + x / TILE_SIZE, originTileY + Math.floor(y / TILE_SIZE));
            const red = data[index], green = data[index + 1], blue = data[index + 2];
            if (!data[index + 3] || green <= red + 4 || green <= blue + 8) continue;
            data[index] = Math.min(255, Math.round(red * tint[0]));
            data[index + 1] = Math.min(255, Math.round(green * tint[1]));
            data[index + 2] = Math.min(255, Math.round(blue * tint[2]));
        }
    }
    context.putImageData(image, 0, 0);
}
