function loadProgress(scene) {
    let saved;

    try {
        saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    } catch (error) {
        return;
    }

    if (!saved || saved.version !== 1) return;

    const list = value => Array.isArray(value) ? value : [];

    if (Number.isFinite(saved.coins) && saved.coins >= 0) {
        playerCoins = Math.floor(saved.coins);
        coinDisplay.value = playerCoins;
    }

    guideHasMetPlayer = saved.guideMet === true;

    const legacyRodIds = { sturdy: 'intermediate', iron: 'master' };

    for (const savedId of list(saved.rods)) {
        const id = legacyRodIds[savedId] || savedId;
        const rod = MARKET_RODS_BY_ID.get(id);

        if (rod && !ownedRods.has(id)) {
            ownedRods.add(id);
            addHotbarItem(scene, rod.icon, rod.label);
        }
    }

    const legacySpecies = {
        minnow: 'common-minnow',
        carp: 'common-carp',
        bass: 'largemouth-bass',
        catfish: 'channel-catfish',
        koi: 'goldfish'
    };
    const currentSpeciesId = id => legacySpecies[id] || id;

    for (const [savedId, count] of list(saved.fish)) {
        const id = currentSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id) && Number.isInteger(count) && count > 0) {
            fishInventory.set(id, (fishInventory.get(id) || 0) + count);
        }
    }

    for (const savedId of list(saved.catchLog)) {
        const id = currentSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id)) catchLog.add(id);
    }

    for (const tileId of list(saved.explored)) {
        if (Number.isSafeInteger(tileId)) discoveredChunks.add(tileId);
    }

    for (const [id, count] of list(saved.bait)) {
        if (MARKET_BAITS_BY_ID.has(id) && Number.isInteger(count) && count > 0) baitInventory.set(id, count);
    }

    activeBaitId = baitInventory.has(saved.activeBait) ? saved.activeBait : null;

    for (const chestId of list(saved.chests)) {
        if (Number.isSafeInteger(chestId)) openedChests.add(chestId);
    }

    for (const chunk of loadedWaterChunks) {
        if (chunk.chest && openedChests.has(chunk.chest.id)) eraseChestSilhouette(chunk);
    }

    refreshBaitSlot();
    refreshMarketOptions();
    mapDirty = true;
}

function saveProgress() {
    if (newGameResetting || !saveDirty || TEST_MODE) return;

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            version: 1,
            coins: playerCoins,
            rods: [...ownedRods],
            fish: [...fishInventory],
            catchLog: [...catchLog],
            explored: [...discoveredChunks],
            bait: [...baitInventory],
            activeBait: activeBaitId,
            chests: [...openedChests],
            guideMet: guideHasMetPlayer
        }));
        saveDirty = false;
    } catch (error) {
        saveDirty = true;
    }
}
