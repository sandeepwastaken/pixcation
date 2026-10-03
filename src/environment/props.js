function canHoldProp(type, tileX, tileY) {
    for (let offsetX = 0; offsetX < PROP_TYPES[type].width; offsetX++) {
        const terrain = getTerrainType(tileX + offsetX, tileY);
        if (terrain !== 'grass' && (terrain !== 'dirt' || !PROP_TYPES[type].onDirt)) return false;
        if (type === 'bush') continue;

        const tile = getWorldTile(tileX + offsetX, tileY);
        if (tile.blocking || tile.bridge || tile.key.startsWith('wood')) return false;
    }

    return true;
}

function getPropCandidate(tileX, tileY) {
    if (Math.abs(tileX) <= PROP_SPAWN_CLEARANCE && Math.abs(tileY) <= PROP_SPAWN_CLEARANCE) return null;

    const score = worldHash(tileX, tileY, 760);
    let type = null;

    if (score > 0.992) {
        type = 'bush';
    } else if (score > 0.985) {
        const roll = worldHash(tileX, tileY, 763);
        type = roll < 0.4 ? 'rock' : roll < 0.65 ? 'boulder' : 'tree';
    } else if (score > 0.94 && valueNoise(tileX, tileY, PROP_FOREST_SCALE, 764) > PROP_FOREST_LEVEL) {
        type = 'tree';
    }

    return type && canHoldProp(type, tileX, tileY) ? type : null;
}

function isUnderCanopy(treeX, treeY, otherX, otherY, otherWidth) {
    return otherY < treeY && otherY >= treeY - TREE_CANOPY_TILES &&
        otherX < treeX + 3 && otherX + otherWidth > treeX - 1;
}

function propsConflict(typeA, ax, ay, typeB, bx, by) {
    const widthA = PROP_TYPES[typeA].width;
    const widthB = PROP_TYPES[typeB].width;
    const apart = bx >= ax + widthA + 1 || ax >= bx + widthB + 1;

    if (Math.abs(ay - by) <= 1 && !apart) return true;

    return typeA === 'tree' && isUnderCanopy(ax, ay, bx, by, widthB) ||
        typeB === 'tree' && isUnderCanopy(bx, by, ax, ay, widthA);
}

const PROP_CODES = [undefined, null, 'bush', 'rock', 'boulder', 'tree'];
const propTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const propSprites = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function getPropAt(tileX, tileY) {
    return PROP_CODES[propTiles(tileX, tileY, generatePropCode)];
}

function generatePropCode(tileX, tileY) {
    return PROP_CODES.indexOf(placeProp(tileX, tileY));
}

function placeProp(tileX, tileY) {
    const type = getPropCandidate(tileX, tileY);
    if (!type) return null;

    const priority = worldHash(tileX, tileY, 765);

    for (let offsetY = -TREE_CANOPY_TILES; offsetY <= TREE_CANOPY_TILES; offsetY++) {
        for (let offsetX = -3; offsetX <= 3; offsetX++) {
            if (offsetX === 0 && offsetY === 0) continue;

            const nearbyX = tileX + offsetX;
            const nearbyY = tileY + offsetY;
            const nearby = getPropCandidate(nearbyX, nearbyY);

            if (!nearby || !propsConflict(type, tileX, tileY, nearby, nearbyX, nearbyY)) continue;

            const nearbyPriority = worldHash(nearbyX, nearbyY, 765);
            const nearbyWins = nearbyPriority > priority || nearbyPriority === priority &&
                (nearbyY < tileY || nearbyY === tileY && nearbyX < tileX);

            if (nearbyWins) return null;
        }
    }

    return type;
}

function getPropCovering(tileX, tileY) {
    const here = getPropAt(tileX, tileY);
    if (here) return { type: here, tileX };

    const left = getPropAt(tileX - 1, tileY);
    return left && PROP_TYPES[left].width > 1 ? { type: left, tileX: tileX - 1 } : null;
}

function isTileClearOfProps(tileX, tileY) {
    if (getPropCovering(tileX, tileY)) return false;

    for (let offsetY = 1; offsetY <= TREE_CANOPY_TILES; offsetY++) {
        for (let treeX = tileX - 2; treeX <= tileX + 1; treeX++) {
            if (getPropAt(treeX, tileY + offsetY) === 'tree') return false;
        }
    }

    return true;
}

function getTreeVariant(tileX, tileY) {
    const index = Math.floor(worldHash(tileX, tileY, 766) * treeVariants.length);
    return treeVariants[Math.min(index, treeVariants.length - 1)];
}

function getPropSprite(tileX, tileY) {
    return propSprites(tileX, tileY, createPropSprite);
}

function createPropSprite(tileX, tileY) {
    const type = getPropAt(tileX, tileY);
    const baseY = (tileY + 1) * TILE_SIZE;

    if (type === 'tree') {
        const variant = getTreeVariant(tileX, tileY);
        const x = tileX * TILE_SIZE + TILE_SIZE - variant.width / 2;

        return {
            texture: variant.key,
            x,
            y: baseY - variant.height,
            shadow: variant.shadowPoints,
            hitLeft: x + variant.hitLeft,
            hitRight: x + variant.hitRight,
            hitHeight: TREE_HITBOX_HEIGHT
        };
    }

    const art = propArt.get(type);
    const x = tileX * TILE_SIZE + Math.floor((PROP_TYPES[type].width * TILE_SIZE - art.width) / 2);
    const hitbox = PROP_TYPES[type].hitbox;

    return {
        texture: type,
        x,
        y: baseY - art.height,
        shadow: art.shadow,
        hitLeft: hitbox ? x + hitbox[0] : x,
        hitRight: hitbox ? x + art.width - hitbox[0] : x,
        hitHeight: hitbox ? hitbox[1] : 0
    };
}

function propBlocksRect(type, tileX, tileY, left, top, right, bottom) {
    const sprite = getPropSprite(tileX, tileY);
    const baseY = (tileY + 1) * TILE_SIZE;

    return left < sprite.hitRight && right > sprite.hitLeft && top < baseY && bottom > baseY - sprite.hitHeight;
}
