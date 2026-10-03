function createCharacterShadow(scene) {
    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const texture = scene.textures.createCanvas('character-shadow', width, height);
    const image = scene.add.image(0, 0, texture.key).setOrigin(0);

    shadowLayer.add(image);
    const context = texture.getContext();
    characterShadow = { texture, image, context, pixels: context.createImageData(width, height), x: null, y: null };
}

function updateCharacterShadow(scene) {
    const x = character.x + ACTOR_SHADOW_X;
    const y = character.y + ACTOR_SHADOW_Y;

    if (characterShadow.x === x && characterShadow.y === y) return;

    characterShadow.x = x;
    characterShadow.y = y;
    characterShadow.image.setPosition(x, y);

    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const image = characterShadow.pixels;
    image.data.fill(0);

    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            if (ACTOR_SHADOW_SHAPE[row][column] !== '#') continue;

            const shaded = getGroundShadowColor(scene, x + column, y + row);
            if (!shaded) continue;

            const index = (row * width + column) * 4;
            image.data[index] = shaded[0];
            image.data[index + 1] = shaded[1];
            image.data[index + 2] = shaded[2];
            image.data[index + 3] = 255;
        }
    }

    characterShadow.context.putImageData(image, 0, 0);
    characterShadow.texture.refresh();
}

function isBlockedByProp(left, top, right, bottom) {
    const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);
    const rightTile = Math.floor((right - 1) / TILE_SIZE);

    for (let tileY = Math.floor(top / TILE_SIZE); tileY <= bottomTile; tileY++) {
        for (let tileX = Math.floor(left / TILE_SIZE) - 1; tileX <= rightTile; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type || !PROP_TYPES[type].solid) continue;

            if (propBlocksRect(type, tileX, tileY, left, top, right, bottom)) return true;
        }
    }

    return false;
}

function actorBlocksRect(actor, hitX, hitY, width, height, left, top, right, bottom) {
    return actor && left < actor.x + hitX + width && right > actor.x + hitX &&
        top < actor.y + hitY + height && bottom > actor.y + hitY;
}

function canCharacterOccupy(scene, x, y) {
    const left = x + CHARACTER_HITBOX_X;
    const top = y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    if (
        actorBlocksRect(guide, GUIDE_HITBOX_X, GUIDE_HITBOX_Y, GUIDE_HITBOX_WIDTH, GUIDE_HITBOX_HEIGHT, left, top, right, bottom) ||
        actorBlocksRect(store, STORE_HITBOX_X, STORE_HITBOX_Y, STORE_HITBOX_WIDTH, STORE_HITBOX_HEIGHT, left, top, right, bottom) ||
        isBlockedByProp(left, top, right, bottom)
    ) {
        return false;
    }

    const leftTile = Math.floor(left / TILE_SIZE);
    const rightTile = Math.floor((right - 1) / TILE_SIZE);
    const topTile = Math.floor(top / TILE_SIZE);
    const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);

    for (let tileY = topTile; tileY <= bottomTile; tileY++) {
        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
            const tile = getWorldTile(tileX, tileY);

            if (tile.blocking === 'full' && !tile.patches?.length) return false;
            if (tile.blocking === 'lower' && bottom > tileY * TILE_SIZE + TILE_SIZE / 2) return false;
            if (tile.blocking === 'lower' || tile.blocking !== 'full' && tile.baseKey !== 'water') continue;

            const water = getTerrainSurface(scene, tile).water;
            const startX = Math.max(left, tileX * TILE_SIZE) - tileX * TILE_SIZE;
            const endX = Math.min(right, (tileX + 1) * TILE_SIZE) - tileX * TILE_SIZE;
            const startY = Math.max(top, tileY * TILE_SIZE) - tileY * TILE_SIZE;
            const endY = Math.min(bottom, (tileY + 1) * TILE_SIZE) - tileY * TILE_SIZE;

            for (let pixelY = startY; pixelY < endY; pixelY++) {
                for (let pixelX = startX; pixelX < endX; pixelX++) {
                    if (water[pixelY * TILE_SIZE + pixelX]) return false;
                }
            }
        }
    }

    return true;
}

function stepCharacter(scene, stepX, stepY, allowNudge) {
    if (canCharacterOccupy(scene, character.x + stepX, character.y + stepY)) {
        character.x += stepX;
        character.y += stepY;
        return true;
    }

    if (!allowNudge) return false;

    for (let offset = 1; offset <= CHARACTER_CORNER_NUDGE; offset++) {
        for (let side = -1; side <= 1; side += 2) {
            const nudgeX = stepX === 0 ? side * offset : 0;
            const nudgeY = stepY === 0 ? side * offset : 0;

            if (
                canCharacterOccupy(scene, character.x + nudgeX + stepX, character.y + nudgeY + stepY) &&
                canCharacterOccupy(scene, character.x + Math.sign(nudgeX), character.y + Math.sign(nudgeY))
            ) {
                character.x += Math.sign(nudgeX);
                character.y += Math.sign(nudgeY);
                return true;
            }
        }
    }

    return false;
}

function moveCharacterAxis(scene, amountX, amountY, allowNudge) {
    const steps = Math.abs(amountX + amountY);
    const stepX = Math.sign(amountX);
    const stepY = Math.sign(amountY);

    for (let step = 0; step < steps; step++) {
        if (!stepCharacter(scene, stepX, stepY, allowNudge)) return false;
    }

    return true;
}
