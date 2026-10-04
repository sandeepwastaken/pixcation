const activeParticles = [];

function kickUpDust(scene, time, moveX, moveY) {
    const footX = character.x + CHARACTER_SIZE / 2;
    const footY = character.y + CHARACTER_SIZE - 1;
    const tileX = Math.floor(footX / TILE_SIZE);
    const tileY = Math.floor(footY / TILE_SIZE);
    if (getWorldTile(tileX, tileY).key.startsWith('wood')) return;
    const terrain = getTerrainType(tileX, tileY);
    const colors = terrain === 'dirt' ? DUST_COLORS
        : terrain === 'grass' && characterPace > 1 ? GRASS_FLECK_COLORS
        : null;

    if (!colors) return;
    const count = colors === DUST_COLORS ? DUST_PER_STEP : GRASS_FLECKS_PER_STEP;

    for (let index = 0; index < count; index++) {
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
    image.particleStepDuration = lifetime / 3;
    image.particleDirectionX = directionX;
    image.particleDirectionY = directionY;
    image.particleRing = ring;
    image.particleStep = ring ? -1 : 0;
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

        const step = Math.floor(age / image.particleStepDuration);
        if (step === image.particleStep) continue;
        image.particleStep = step;

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
