const activeParticles = [];

function poolShimmer(shimmer) {
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

function spawnShimmer(scene) {
    let visibleCount = 0;

    for (const candidate of loadedShimmerChunks) {
        if (candidate.visible) visibleCount++;
    }

    if (visibleCount === 0) {
        return;
    }

    let pick = Math.floor(Math.random() * visibleCount);
    let chunk;

    for (chunk of loadedShimmerChunks) {
        if (chunk.visible && pick-- === 0) break;
    }

    const cell = chunk.waterCells[Math.floor(Math.random() * chunk.waterCells.length)];
    const shimmer = shimmerPool.pop() || scene.add.sprite(0, 0, 'shimmer')
        .setOrigin(0)
        .setDepth(2);

    shimmer
        .setPosition(
            cell.x + Phaser.Math.Between(0, cell.width - 12),
            cell.y + Phaser.Math.Between(0, cell.height - 1)
        )
        .setVisible(true)
        .setActive(true);

    chunk.shimmers.push(shimmer);
    shimmer.play('shimmer');
    shimmer.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => releaseShimmer(chunk, shimmer));
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

function cachePropPlacement(key, value) {
    return cacheWorldValue(propPlacementCache, key, value);
}

function getPropAt(tileX, tileY) {
    const key = getTileId(tileX, tileY);
    const cached = propPlacementCache.get(key);

    if (cached !== undefined) return cached;

    const type = getPropCandidate(tileX, tileY);
    if (!type) return cachePropPlacement(key, null);

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

            if (nearbyWins) return cachePropPlacement(key, null);
        }
    }

    return cachePropPlacement(key, type);
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

function getPropSprite(type, tileX, tileY) {
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
    const baseY = (tileY + 1) * TILE_SIZE;
    let hitLeft;
    let hitRight;
    let hitHeight;

    if (type === 'tree') {
        const variant = getTreeVariant(tileX, tileY);
        const x = tileX * TILE_SIZE + TILE_SIZE - variant.width / 2;
        hitLeft = x + variant.hitLeft;
        hitRight = x + variant.hitRight;
        hitHeight = TREE_HITBOX_HEIGHT;
    } else {
        const art = propArt.get(type);
        const hitbox = PROP_TYPES[type].hitbox;
        const x = tileX * TILE_SIZE + Math.floor((PROP_TYPES[type].width * TILE_SIZE - art.width) / 2);
        hitLeft = x + hitbox[0];
        hitRight = x + art.width - hitbox[0];
        hitHeight = hitbox[1];
    }

    return left < hitRight && right > hitLeft && top < baseY && bottom > baseY - hitHeight;
}

function isGuideSpawnTile(tileX, tileY) {
    const tileKey = getWorldTileKey(tileX, tileY).toLowerCase();

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

                if (!isGuideSpawnTile(guideTileX, guideTileY)) {
                    continue;
                }

                if (!canPlaceStoreAt(storeTileX, storeTileY)) {
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

    if (!spawn) {
        return;
    }

    store = scene.add.image(
        spawn.storeTileX * TILE_SIZE,
        spawn.storeTileY * TILE_SIZE,
        'store'
    )
        .setOrigin(0)
        .setDepth(spawn.storeTileY * TILE_SIZE + STORE_HEIGHT);

    worldObjectLayer.add(store);

    guide = scene.add.image(
        spawn.guideTileX * TILE_SIZE,
        spawn.guideTileY * TILE_SIZE,
        'guide'
    )
        .setOrigin(0)
        .setDepth(spawn.guideTileY * TILE_SIZE + GUIDE_SIZE);

    worldObjectLayer.add(guide);

    staticShadowCasters.push(
        { x: guide.x + ACTOR_SHADOW_X, y: guide.y + ACTOR_SHADOW_Y, points: getShapePoints(ACTOR_SHADOW_SHAPE) },
        { x: store.x, y: store.y, points: extractSilhouetteShadow(scene, 'store') }
    );
    rebakeLoadedShadows(scene);
}

function rebakeLoadedShadows(scene) {
    for (const chunk of loadedChunks.values()) {
        const mask = getStaticShadowMask(chunk.chunkX, chunk.chunkY);
        if (!mask) continue;

        const added = new Uint8Array(mask.length);
        let changed = false;

        for (let pixel = 0; pixel < mask.length; pixel++) {
            if (mask[pixel] && !chunk.shadowMask?.[pixel]) {
                added[pixel] = 1;
                changed = true;
            }
        }

        if (!changed) continue;

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
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);

    if (getTerrainSurface(scene, tile).water[(worldY - tileY * TILE_SIZE) * TILE_SIZE + worldX - tileX * TILE_SIZE]) {
        return null;
    }

    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const chunk = loadedChunks.get(getChunkKey(chunkX, chunkY));

    if (!chunk) {
        return null;
    }

    const pixel = (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE;

    if (chunk.shadowMask && chunk.shadowMask[pixel]) {
        return null;
    }

    if (isFlatShadowTile(tile)) {
        const base = getDominantColor(scene, tile.key);
        return shadeColor(base[0], base[1], base[2]);
    }

    const pixels = getChunkPixels(chunk);
    const index = pixel * 4;

    if (pixels.upper && pixels.upper[index + 3]) {
        return shadeColor(pixels.upper[index], pixels.upper[index + 1], pixels.upper[index + 2]);
    }

    if (!pixels.ground[index + 3]) {
        return null;
    }

    if (tile.key.startsWith('grass') || tile.key === 'dirt1') {
        const base = getDominantColor(scene, tile.key);
        return shadeColor(base[0], base[1], base[2]);
    }

    return shadeColor(pixels.ground[index], pixels.ground[index + 1], pixels.ground[index + 2]);
}

function kickUpDust(scene, time, moveX, moveY) {
    const footX = character.x + CHARACTER_SIZE / 2;
    const footY = character.y + CHARACTER_SIZE - 1;
    const tileX = Math.floor(footX / TILE_SIZE);
    const tileY = Math.floor(footY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);

    const terrain = getTerrainType(tileX, tileY);
    const colors = tile.key.startsWith('wood') ? null
        : terrain === 'dirt' ? DUST_COLORS
        : terrain === 'grass' && characterPace > 1 ? GRASS_FLECK_COLORS
        : null;

    if (!colors) {
        return;
    }

    for (let index = 0; index < (colors === DUST_COLORS ? DUST_PER_STEP : GRASS_FLECKS_PER_STEP); index++) {
        const side = index % 2 === 0 ? -1 : 1;
        const spread = Math.floor(Math.random() * 2);
        const offsetX = moveX !== 0
            ? -moveX * (5 + spread + index)
            : side * (5 + spread);
        const offsetY = moveY < 0
            ? 1 + spread
            : moveX !== 0 ? -spread : -1 - spread;

        spawnParticle(scene, shadowLayer, {
            born: time,
            x: Math.round(footX + offsetX),
            y: footY + offsetY,
            drift: moveX !== 0 ? -moveX : side,
            rise: -1,
            lifetime: DUST_LIFETIME
        }, colors[index % colors.length]);
    }
}

function dropLeaves(scene, time, bush) {
    for (let index = 0; index < LEAVES_PER_RUSTLE; index++) {
        spawnParticle(scene, worldObjectLayer, {
            born: time,
            x: bush.x + BUSH_FOOTPRINT_LEFT + Math.floor(Math.random() * (BUSH_FOOTPRINT_RIGHT - BUSH_FOOTPRINT_LEFT)),
            y: bush.y - BUSH_FOOTPRINT_HEIGHT + Math.floor(Math.random() * 4),
            drift: Math.random() < 0.5 ? -1 : 1,
            rise: 1,
            lifetime: LEAF_LIFETIME,
            depth: bush.y + 1
        }, LEAF_COLORS[index % LEAF_COLORS.length]);
    }
}

function spawnParticle(scene, layer, particle, color) {
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

    image.particle = particle;
    image.activeParticleIndex = activeParticles.length;
    activeParticles.push(image);
    image
        .setTint(color)
        .setDepth(particle.depth || 0)
        .setPosition(particle.x, particle.y)
        .setActive(true)
        .setVisible(true);
}

function updateParticles(time) {
    for (let index = activeParticles.length - 1; index >= 0; index--) {
        const image = activeParticles[index];
        const particle = image.particle;
        const age = time - particle.born;

        if (age >= particle.lifetime) {
            releaseParticle(image);
            continue;
        }

        const step = Math.floor(age / (particle.lifetime / 3));

        if (particle.ring) {
            const radius = 2 + step * 2;
            image.setPosition(
                particle.x + Math.round(particle.directionX * radius),
                particle.y + Math.round(particle.directionY * radius * 0.5)
            );
        } else {
            image.setPosition(particle.x + (step > 1 ? particle.drift : 0), particle.y + step * particle.rise);
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
