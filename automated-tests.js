function runAutomatedTests(scene) {
    const results = [];
    const record = (name, passed, detail) => results.push({ name, passed, detail });
    const speciesIds = new Set(FISH_SPECIES.map(species => species.id));
    const ordinarySizesValid = FISH_SPECIES
        .filter(species => species.id !== 'sturgeon')
        .every(species => species.size === 'small' || species.size === 'medium' || species.size === 'large');
    const sturgeon = FISH_SPECIES_BY_ID.get('sturgeon');
    const speciesPassed = FISH_SPECIES.length === 26 && speciesIds.size === 26 && ordinarySizesValid && sturgeon?.size === 'giant';
    record('Fish species have fixed size classes', speciesPassed, speciesPassed ? '26 unique species; sturgeon is the giant exception' : 'Species size table is invalid');
    const diagonalGrassPatch = getTerrainCornerPatch('grass', 'dirt', 'dirt', 'grass', 1);
    const solidDirtPatch = getTerrainCornerPatch('grass', 'dirt', 'dirt', 'dirt', 1);
    const terrainCornersPassed = diagonalGrassPatch === null && solidDirtPatch === 'dirtEdgeCorner';
    record('Diagonal grass connections stay clean', terrainCornersPassed, terrainCornersPassed ? 'Dirt corners yield to connected grass' : 'Diagonal terrain rule regressed');
    let crowdedProps = 0;
    let sampledProps = 0;

    for (let tileY = -96; tileY <= 96; tileY++) {
        for (let tileX = -96; tileX <= 96; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type) continue;
            sampledProps++;

            for (let offsetY = 0; offsetY <= TREE_CANOPY_TILES; offsetY++) {
                for (let offsetX = -3; offsetX <= 3; offsetX++) {
                    if (offsetY === 0 && offsetX <= 0) continue;

                    const nearby = getPropAt(tileX + offsetX, tileY + offsetY);
                    if (nearby && propsConflict(type, tileX, tileY, nearby, tileX + offsetX, tileY + offsetY)) crowdedProps++;
                }
            }
        }
    }

    record('Props keep a clear tile gap', crowdedProps === 0, `${sampledProps} generated props checked`);
    const leafyTrees = treeVariants.length === TREE_VARIANT_COUNT && treeVariants.every(variant =>
        scene.textures.exists(variant.key) && variant.hitRight > variant.hitLeft && variant.shadowPoints.length > 0
    );
    record('Trees grow seeded leaves', leafyTrees, leafyTrees ? `${treeVariants.length} canopy variants generated` : 'Tree variant generation failed');
    const fishingTextures = ['fishing-ui', 'fishing-catch-zone', 'fishing-fish', 'fishing-progress'];
    const texturesPassed = fishingTextures.every(key => scene.textures.exists(key));
    record('Fishing minigame PNGs are loaded', texturesPassed, texturesPassed ? 'Frame, zone, fish and progress assets found' : 'A fishing UI texture is missing');
    const rodArtPassed = MARKET_RODS.every(rod =>
        scene.textures.exists(rod.texture) && scene.textures.exists(rod.icon) && rod.polePalette?.length === 3 &&
        rod.linePalette?.length === 4 && rod.bobberPalette?.length === 3
    ) && new Set(MARKET_RODS.map(rod => rod.linePalette.join(','))).size === MARKET_RODS.length;
    record('Rod art palettes are extracted', rodArtPassed, rodArtPassed ? 'Three distinct rod, line and bobber palettes found' : 'Rod artwork or palette extraction failed');
    const rodsImprove = MARKET_RODS.slice(1).every((rod, index) => {
        const previous = MARKET_RODS[index];
        return rod.castDistance > previous.castDistance &&
            rod.chargeTime < previous.chargeTime &&
            rod.lineStrength > previous.lineStrength &&
            rod.catchZone > previous.catchZone;
    });

    record('Rod upgrades improve all fishing stats', rodsImprove, rodsImprove ? 'Distance, speed, strength and zone are monotonic' : 'Rod progression regressed');
    const originalX = character.x;
    const originalY = character.y;
    let seed = 0x51f15e;
    let movementPassed = true;

    const random = () => {
        seed = Math.imul(seed ^ seed >>> 15, 2246822519);
        seed = Math.imul(seed ^ seed >>> 13, 3266489917);
        return ((seed ^= seed >>> 16) >>> 0) / 4294967296;
    };

    for (let step = 0; step < 20000; step++) {
        const axis = random() < 0.5;
        const direction = random() < 0.5 ? -1 : 1;

        stepCharacter(scene, axis ? direction : 0, axis ? 0 : direction, true);

        if (!canCharacterOccupy(scene, character.x, character.y)) {
            movementPassed = false;
            break;
        }
    }

    character.setPosition(originalX, originalY);
    record('20,000 collision-safe movement steps', movementPassed, movementPassed ? 'No water or solid overlap' : 'Invalid player position');

    let fishCount = 0;
    let fishPassed = true;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            fishCount++;
            if (!canFishSwim(chunk, fish, fish.x, fish.y)) fishPassed = false;
        }
    }

    record('Fish remain in valid water regions', fishPassed, `${fishCount} fish checked`);

    let connectedBorders = 0;
    let borderRoutingPassed = true;
    let migrationProbe = null;

    for (const chunk of loadedWaterChunks) {
        for (const [offsetX, offsetY] of [[1, 0], [0, 1]]) {
            const neighbor = loadedChunks.get(getChunkKey(chunk.chunkX + offsetX, chunk.chunkY + offsetY));
            if (!neighbor || !neighbor.fishRegions) continue;

            for (let offset = 0; offset < CHUNK_PIXEL_SIZE; offset++) {
                const sourceX = chunk.chunkX * CHUNK_PIXEL_SIZE + (offsetX ? CHUNK_PIXEL_SIZE - 0.5 : offset + 0.5);
                const sourceY = chunk.chunkY * CHUNK_PIXEL_SIZE + (offsetY ? CHUNK_PIXEL_SIZE - 0.5 : offset + 0.5);
                const targetX = sourceX + offsetX;
                const targetY = sourceY + offsetY;
                const sourceRegion = getFishRegionAt(chunk, sourceX, sourceY);

                if (
                    !sourceRegion ||
                    getFishDepth(chunk, sourceX, sourceY) < FISH_MIN_DEPTH + 1.5 ||
                    getFishDepth(neighbor, targetX, targetY) < FISH_MIN_DEPTH + 1.5
                ) {
                    continue;
                }

                connectedBorders++;
                const probe = { radius: 1.5, region: sourceRegion };
                if (!canFishSwim(chunk, probe, targetX, targetY)) borderRoutingPassed = false;
                if (!migrationProbe) migrationProbe = { chunk, neighbor, sourceRegion, targetX, targetY };
            }
        }
    }

    record(
        'Connected water crosses chunk borders',
        borderRoutingPassed,
        connectedBorders ? `${connectedBorders} deep-water border points checked` : 'No deep-water border in the initial test area'
    );

    if (migrationProbe) {
        const probeFish = {
            x: migrationProbe.targetX,
            y: migrationProbe.targetY,
            region: migrationProbe.sourceRegion
        };

        migrationProbe.chunk.fish.push(probeFish);
        const migrated = migrateFishToChunk(migrationProbe.chunk, migrationProbe.neighbor, probeFish);
        const targetIndex = migrationProbe.neighbor.fish.indexOf(probeFish);
        const migrationPassed = migrated && targetIndex !== -1 && migrationProbe.chunk.fish.indexOf(probeFish) === -1;

        if (targetIndex !== -1) migrationProbe.neighbor.fish.splice(targetIndex, 1);
        record('Fish ownership migrates between chunks', migrationPassed, migrationPassed ? 'Source removed and destination adopted fish' : 'Migration failed');
    }

    const rope = createFishingRope(0, 0, 0, 0, 88);

    for (let frame = 0; frame < 240; frame++) {
        const amount = frame / 239;
        updateFishingRope(rope, 0, 0, 72 * amount, 12 - Math.sin(amount * Math.PI) * 18, 1000 / 60, frame > 180 ? 1 : 0.6);
    }

    const finite = rope.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    const first = rope.points[0];
    const last = rope.points[rope.points.length - 1];
    const anchored = first.x === 0 && first.y === 0 && Math.abs(last.x - 72) < 0.01 && Math.abs(last.y - 12) < 0.01;

    record('Cast rope stays finite and anchored', finite && anchored, `${rope.points.length} simulated points`);

    const activeParticlesBeforeSnap = particlePool.filter(image => image.active).length;
    spawnLineSnap(scene, scene.time.now, rope);
    const activeParticlesAfterSnap = particlePool.filter(image => image.active).length;
    const snapPassed = activeParticlesAfterSnap > activeParticlesBeforeSnap;

    record('Line failure creates visible fragments', snapPassed, `${activeParticlesAfterSnap - activeParticlesBeforeSnap} fragments spawned`);

    for (const image of particlePool) {
        if (image.active && image.particle.born === scene.time.now && image.particle.lifetime === 300) {
            releaseParticle(image);
        }
    }

    const particleCountBeforeReuse = particlePool.length;
    const availableBeforeReuse = availableParticles.length;
    spawnParticle(scene, shadowLayer, {
        born: scene.time.now,
        x: 0,
        y: 0,
        drift: 0,
        rise: 0,
        lifetime: 1
    }, FISHING_LINE_COLOR);
    const reusedParticle = particlePool.length === particleCountBeforeReuse && availableParticles.length === availableBeforeReuse - 1;
    const reusedImage = particlePool.find(image => image.active && image.particle.lifetime === 1);
    if (reusedImage) releaseParticle(reusedImage);
    record('Particle pool reuses objects in constant time', reusedParticle, reusedParticle ? 'Free-list object reused' : 'Unexpected allocation');

    showCatchCard(scene, scene.time.now, FISH_SPECIES[0]);
    const catchCardPassed = catchCardTitle.textContent === 'You caught a Bluegill!' &&
        catchCardDetail.textContent.includes('7c') && catchCardContainer.visible;

    record('Catch card presents species and value', catchCardPassed, catchCardPassed ? 'Name and price rendered' : 'Catch card content missing');
    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    scene.tweens.killTweensOf(catchCardContainer);
    scene.tweens.killTweensOf(catchCardTextLayer);
    catchCardContainer.setVisible(false);
    catchCardTextLayer.setVisible(false);
    catchCardUntil = 0;

    return {
        passed: results.every(result => result.passed),
        generatedAt: new Date().toISOString(),
        results
    };
}
