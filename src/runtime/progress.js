const LEGACY_ROD_IDS = { sturdy: 'intermediate', iron: 'master' };
const LEGACY_SPECIES_IDS = {
    minnow: 'common-minnow',
    carp: 'common-carp',
    bass: 'largemouth-bass',
    catfish: 'channel-catfish',
    koi: 'goldfish'
};

function getSavedList(value) {
    return Array.isArray(value) ? value : [];
}

function getSavedSpeciesId(id) {
    return typeof id === 'string' ? LEGACY_SPECIES_IDS[id] || id : null;
}

function getSavedInventory(value) {
    return getSavedList(value).filter(entry => Array.isArray(entry) && entry.length === 2 &&
        typeof entry[0] === 'string' && Number.isSafeInteger(entry[1]) && entry[1] > 0);
}

function restoreSavedRods(scene, rods) {
    for (const savedId of getSavedList(rods)) {
        if (typeof savedId !== 'string') continue;
        const id = LEGACY_ROD_IDS[savedId] || savedId;
        const rod = MARKET_RODS_BY_ID.get(id);

        if (rod && !ownedRods.has(id)) {
            ownedRods.add(id);
            addHotbarItem(scene, rod.icon, rod.label);
        }
    }
}

function restoreSavedFish(fish) {
    for (const [savedId, count] of getSavedInventory(fish)) {
        const id = getSavedSpeciesId(savedId);
        const total = (fishInventory.get(id) || 0) + count;
        if (FISH_SPECIES_BY_ID.has(id) && Number.isSafeInteger(total)) fishInventory.set(id, total);
    }
}

function restoreSavedCatchLog(ids) {
    for (const savedId of getSavedList(ids)) {
        const id = getSavedSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id)) catchLog.add(id);
    }
}

function restoreSavedTileIds(target, ids) {
    for (const id of getSavedList(ids)) {
        if (Number.isSafeInteger(id)) target.add(id);
    }
}

function restoreSavedBait(bait) {
    for (const [id, count] of getSavedInventory(bait)) {
        if (MARKET_BAITS_BY_ID.has(id)) baitInventory.set(id, count);
    }
}

function loadProgress(scene) {
    let saved;

    try {
        saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    } catch (error) {
        return;
    }

    if (!saved || saved.version !== 1) return;

    if (typeof saved.coins === 'number' && saved.coins >= 0 && Number.isSafeInteger(Math.floor(saved.coins))) {
        playerCoins = Math.floor(saved.coins);
        coinDisplay.value = playerCoins;
    }

    guideHasMetPlayer = saved.guideMet === true;

    restoreSavedRods(scene, saved.rods);
    restoreSavedFish(saved.fish);
    restoreSavedCatchLog(saved.catchLog);
    restoreSavedTileIds(discoveredChunks, saved.explored);
    restoreSavedBait(saved.bait);
    activeBaitId = baitInventory.has(saved.activeBait) ? saved.activeBait : null;
    restoreSavedTileIds(openedChests, saved.chests);

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

function resetProgress() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (error) {
        return false;
    }

    newGameResetting = true;
    saveDirty = false;
    return true;
}
