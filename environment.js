const activeParticles = [];

function poolShimmer(shimmer) {
    shimmer.shimmerChunk = null;
    shimmer.stop().setVisible(false).setActive(false);
    shimmerPool.push(shimmer);
}

function releaseShimmer(chunk, shimmer) {
    const index = chunk.shimmers.indexOf(shimmer);

    if (index !== -1) {
        chunk.shimmers.splice(index, 1);
    }

    poolShimmer(shimmer);
}

function finishShimmer(animation, frame, shimmer) {
    if (shimmer.shimmerChunk) releaseShimmer(shimmer.shimmerChunk, shimmer);
}

function spawnShimmer(scene) {
    const visible = [...loadedShimmerChunks].filter(chunk => chunk.visible);
    if (visible.length === 0) return;

    const chunk = visible[Math.floor(Math.random() * visible.length)];
    const cell = Math.floor(Math.random() * (chunk.waterCells.length / 4)) * 4;
    let shimmer = shimmerPool.pop();

    if (!shimmer) {
        shimmer = scene.add.sprite(0, 0, 'shimmer').setOrigin(0).setDepth(2);
        shimmer.on(Phaser.Animations.Events.ANIMATION_COMPLETE, finishShimmer);
    }

    shimmer.shimmerChunk = chunk;
    shimmer
        .setPosition(
            chunk.waterCells[cell] + Phaser.Math.Between(0, chunk.waterCells[cell + 2] - 12),
            chunk.waterCells[cell + 1] + Phaser.Math.Between(0, chunk.waterCells[cell + 3] - 1)
        )
        .setVisible(true)
        .setActive(true);

    chunk.shimmers.push(shimmer);
    shimmer.play('shimmer');
}

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
            for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
                if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== radius) {
                    continue;
                }

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

function rebakeLoadedShadows(scene) {
    for (const chunk of loadedChunks.values()) {
        const mask = getStaticShadowMask(chunk.chunkX, chunk.chunkY);
        const added = mask && mask.map((value, pixel) => value && !chunk.shadowMask?.[pixel] ? 1 : 0);

        if (!added || !added.includes(1)) continue;

        bakeGroundShadows(scene, chunk.groundTexture.getContext(), chunk.chunkX, chunk.chunkY, added);
        chunk.groundTexture.refresh();
        chunk.shadowMask = mask;
        chunk.pixels = null;
    }
}

function getShapePoints(shape) {
    const points = [];

    for (let row = 0; row < shape.length; row++) {
        for (let column = 0; column < shape[row].length; column++) {
            if (shape[row][column] === '#') points.push(column, row);
        }
    }

    return points;
}

function buildShadowLut(scene) {
    const colors = new Map();

    for (const key of SHADOW_PALETTE_TEXTURES) {
        const pixels = getTerrainPixels(scene, key).data;

        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] < 255) continue;
            colors.set((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2], [
                pixels[index],
                pixels[index + 1],
                pixels[index + 2]
            ]);
        }
    }

    const describe = ([r, g, b]) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let hue = 0;

        if (delta) {
            hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
            hue = (hue * 60 + 360) % 360;
        }

        return { hue, saturation: max ? delta / max : 0, luma: r * 0.299 + g * 0.587 + b * 0.114 };
    };

    const entries = [...colors].map(([key, rgb]) => ({ key, rgb, ...describe(rgb) }));

    for (const color of entries) {
        let best = null;

        for (const other of entries) {
            const hueGap = Math.min(Math.abs(color.hue - other.hue), 360 - Math.abs(color.hue - other.hue));
            const distance = Math.hypot(
                color.rgb[0] - other.rgb[0],
                color.rgb[1] - other.rgb[1],
                color.rgb[2] - other.rgb[2]
            );

            if (
                other.luma < color.luma &&
                hueGap < 24 &&
                Math.abs(color.saturation - other.saturation) < 0.14 &&
                distance < 48 &&
                (!best || other.luma > best.luma)
            ) {
                best = other;
            }
        }

        shadowLut.set(color.key, best ? best.rgb : color.rgb.map(value => Math.round(value * 0.86)));
    }
}

function getShadowStyle(scene, key) {
    scene.shadowStyleCache ||= new Map();

    let style = scene.shadowStyleCache.get(key);

    if (!style) {
        const base = getDominantColor(scene, key);
        const shaded = shadeColor(base[0], base[1], base[2]);
        style = `rgb(${shaded[0]}, ${shaded[1]}, ${shaded[2]})`;
        scene.shadowStyleCache.set(key, style);
    }

    return style;
}

function shadeColor(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    let shaded = shadowLut.get(key);

    if (!shaded) {
        shaded = [Math.round(r * 0.86), Math.round(g * 0.86), Math.round(b * 0.86)];
        shadowLut.set(key, shaded);
    }

    return shaded;
}

function getDominantColor(scene, key) {
    scene.dominantColorCache ||= new Map();

    const cached = scene.dominantColorCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const counts = new Map();
    let best = 0;
    let bestCount = 0;

    for (let index = 0; index < pixels.length; index += 4) {
        const color = (pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2];
        const count = (counts.get(color) || 0) + 1;

        counts.set(color, count);

        if (count > bestCount) {
            best = color;
            bestCount = count;
        }
    }

    const dominant = [best >> 16, (best >> 8) & 255, best & 255];
    scene.dominantColorCache.set(key, dominant);
    return dominant;
}

function getChunkPixels(chunk) {
    chunk.pixels ||= { ground: null, upper: null, upperRead: false };

    if (!chunk.pixels.ground) {
        chunk.pixels.ground = chunk.groundTexture.getContext()
            .getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data;
    }

    if (!chunk.pixels.upperRead) {
        chunk.pixels.upperRead = true;
        chunk.pixels.upper = chunk.upperTexture
            ? chunk.upperTexture.getContext().getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data
            : null;
    }

    return chunk.pixels;
}

function getGroundShadowColor(scene, worldX, worldY) {
    if (isWaterPixel(scene, worldX, worldY)) return null;

    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);
    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const chunk = loadedChunks.get(getChunkKey(chunkX, chunkY));
    const pixel = (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE;
    const flatShade = () => shadeColor(...getDominantColor(scene, tile.key));

    if (!chunk || chunk.shadowMask?.[pixel]) return null;
    if (isFlatShadowTile(tile)) return flatShade();

    const { upper, ground } = getChunkPixels(chunk);
    const index = pixel * 4;

    if (upper && upper[index + 3]) return shadeColor(upper[index], upper[index + 1], upper[index + 2]);
    if (!ground[index + 3]) return null;
    if (tile.key.startsWith('grass') || tile.key === 'dirt1') return flatShade();

    return shadeColor(ground[index], ground[index + 1], ground[index + 2]);
}

function kickUpDust(scene, time, moveX, moveY) {
    const footX = character.x + CHARACTER_SIZE / 2;
    const footY = character.y + CHARACTER_SIZE - 1;
    const tileX = Math.floor(footX / TILE_SIZE);
    const tileY = Math.floor(footY / TILE_SIZE);
    const terrain = getTerrainType(tileX, tileY);
    const colors = getWorldTile(tileX, tileY).key.startsWith('wood') ? null
        : terrain === 'dirt' ? DUST_COLORS
        : terrain === 'grass' && characterPace > 1 ? GRASS_FLECK_COLORS
        : null;

    if (!colors) return;

    for (let index = 0; index < (colors === DUST_COLORS ? DUST_PER_STEP : GRASS_FLECKS_PER_STEP); index++) {
        const side = index % 2 === 0 ? -1 : 1;
        const spread = Math.floor(Math.random() * 2);
        const offsetX = moveX !== 0 ? -moveX * (5 + spread + index) : side * (5 + spread);
        const offsetY = moveY < 0 ? 1 + spread : moveX !== 0 ? -spread : -1 - spread;

        spawnParticle(
            scene, shadowLayer, time, Math.round(footX + offsetX), footY + offsetY,
            moveX !== 0 ? -moveX : side, -1, DUST_LIFETIME, colors[index % colors.length]
        );
    }
}

function dropLeaves(scene, time, bush) {
    for (let index = 0; index < LEAVES_PER_RUSTLE; index++) {
        spawnParticle(
            scene, worldObjectLayer, time,
            bush.x + BUSH_FOOTPRINT_LEFT + Math.floor(Math.random() * (BUSH_FOOTPRINT_RIGHT - BUSH_FOOTPRINT_LEFT)),
            bush.y - BUSH_FOOTPRINT_HEIGHT + Math.floor(Math.random() * 4),
            Math.random() < 0.5 ? -1 : 1, 1, LEAF_LIFETIME,
            LEAF_COLORS[index % LEAF_COLORS.length], bush.y + 1
        );
    }
}

function spawnParticle(scene, layer, born, x, y, drift, rise, lifetime, color, depth = 0, directionX = 0, directionY = 0, ring = false) {
    let image = availableParticles.pop();

    if (!image) {
        image = scene.add.image(0, 0, '__WHITE')
            .setOrigin(0)
            .setDisplaySize(1, 1);
        particlePool.push(image);
    }

    if (image.displayList !== layer) {
        layer.add(image);
    }

    image.particleBorn = born;
    image.particleX = x;
    image.particleY = y;
    image.particleDrift = drift;
    image.particleRise = rise;
    image.particleLifetime = lifetime;
    image.particleDirectionX = directionX;
    image.particleDirectionY = directionY;
    image.particleRing = ring;
    image.activeParticleIndex = activeParticles.length;
    activeParticles.push(image);
    image
        .setTint(color)
        .setDepth(depth)
        .setPosition(x, y)
        .setActive(true)
        .setVisible(true);
}

function updateParticles(time) {
    for (let index = activeParticles.length - 1; index >= 0; index--) {
        const image = activeParticles[index];
        const age = time - image.particleBorn;

        if (age >= image.particleLifetime) {
            releaseParticle(image);
            continue;
        }

        const step = Math.floor(age / (image.particleLifetime / 3));

        if (image.particleRing) {
            const radius = 2 + step * 2;
            image.setPosition(
                image.particleX + Math.round(image.particleDirectionX * radius),
                image.particleY + Math.round(image.particleDirectionY * radius * 0.5)
            );
        } else {
            image.setPosition(
                image.particleX + (step > 1 ? image.particleDrift : 0),
                image.particleY + step * image.particleRise
            );
        }
    }
}

function releaseParticle(image) {
    if (!image.active) return;
    const index = image.activeParticleIndex;
    const last = activeParticles.pop();
    if (last !== image) {
        activeParticles[index] = last;
        last.activeParticleIndex = index;
    }
    image.activeParticleIndex = -1;
    image.setActive(false).setVisible(false);
    availableParticles.push(image);
}

function updateBushRustle(scene, time, isWalking) {
    const left = character.x + CHARACTER_HITBOX_X;
    const top = character.y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    for (const chunk of loadedChunks.values()) {
        if (!chunk.visible) continue;
        for (const bush of chunk.bushes) {
            const touching =
                left < bush.x + BUSH_FOOTPRINT_RIGHT &&
                right > bush.x + BUSH_FOOTPRINT_LEFT &&
                top < bush.y &&
                bottom > bush.y - BUSH_FOOTPRINT_HEIGHT;

            if (touching && isWalking && (!bush.touching || time - bush.rustleStart > BUSH_RUSTLE_REPEAT)) {
                bush.rustleStart = time;
                dropLeaves(scene, time, bush);
            }

            bush.touching = touching;

            const age = time - bush.rustleStart;
            const offset = age < BUSH_RUSTLE_PATTERN.length * BUSH_RUSTLE_STEP
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)]
                : 0;

            if (offset === bush.offset) continue;

            bush.offset = offset;

            for (const slice of bush.slices) {
                slice.x = bush.x + offset;
            }
        }
    }
}
