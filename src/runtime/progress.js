const LEGACY_ROD_IDS = { sturdy: 'intermediate', iron: 'master' };
function normalizePlayerLook(value) {
    const source = Array.isArray(value) ? value : [], defaults = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.75, 0];
    const limits = [9, NPC_FACES, NPC_SHIRTS, NPC_SHIRT_COLORS.length, NPC_PANTS_COLORS.length, 2, source[5] ? NPC_ACCESSORIES : NPC_HAIRSTYLES, NPC_ACCESSORY_COLORS.length, 2, NPC_HAIR_COLORS.length, NPC_SHIRT_COLORS.length, NPC_PANTS_STYLES, NPC_PANTS_COLORS.length, NPC_EYE_COLORS.length, 2];
    const look = defaults.map((fallback, index) => index < 15 ? Number.isInteger(source[index]) && source[index] >= 0 && source[index] < limits[index] ? source[index] : fallback : fallback);
    if (!look[5]) look[7] = Number.isInteger(source[7]) && source[7] >= 0 && source[7] < NPC_HAIR_COLORS.length ? source[7] : look[9];
    if (look[5] && look[6] === 5) look[6] = 0;
    look[15] = Number.isFinite(source[15]) ? Math.max(0, Math.min(1, source[15])) : [0.75, 1, 0.5, 0.25, 0, 0.8, 0.6, 0.4, 0][look[0]];
    look[17] = Array.from({length: 8}, (_, index) => Number.isFinite(source[17]?.[index]) ? Math.max(0, Math.min(1, source[17][index])) : 0);
    look[18] = Number.isInteger(source[18]) && source[18] >= 0 && source[18] < NPC_HAIRSTYLES ? source[18] : look[5] ? undefined : look[6];
    look[19] = look[1] !== 2 && source[19] === 1 ? 1 : 0;
    return look;
}
function loadPlayerAppearance() {
    let saved = null, profile = null; try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (error) {} try { profile = JSON.parse(localStorage.getItem('pixcation-player-look')); } catch (error) {}
    const existing = saved?.version === 1; playerAppearanceChosen = existing && saved.appearanceChosen !== false;
    const look = existing ? saved.appearance || [0, 0, 0, 0, 0, 1, 0, 0] : profile; PLAYER_LOOK.splice(0, PLAYER_LOOK.length, ...normalizePlayerLook(look));
}
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

function restoreSavedStats(stats) {
    let knownFish = 0;
    for (const count of fishInventory.values()) knownFish = Math.min(Number.MAX_SAFE_INTEGER, knownFish + count);
    playerStats.fishCaught = knownFish;
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return;
    for (const key of Object.keys(playerStats)) {
        if (Number.isSafeInteger(stats[key]) && stats[key] >= 0) playerStats[key] = stats[key];
    }
}

function recordPlayerStat(key, amount = 1) {
    playerStats[key] = Math.min(Number.MAX_SAFE_INTEGER, playerStats[key] + amount);
    saveDirty = true;
}

function updatePlayTime(time) {
    if (!TEST_MODE && lastPlayTime !== null && document.visibilityState === 'visible' && document.hasFocus()) {
        recordPlayerStat('playTimeMs', Math.max(0, time - lastPlayTime));
    }
    lastPlayTime = time;
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
    playerAppearanceChosen = saved.appearanceChosen !== false;
    if (character && Array.isArray(saved.position) && saved.position.length === 2 && saved.position.every(Number.isSafeInteger)) character.setPosition(saved.position[0], saved.position[1]);

    restoreSavedRods(scene, saved.rods);
    restoreSavedFish(saved.fish);
    restoreSavedStats(saved.stats);
    restoreSavedCatchLog(saved.catchLog);
    restoreSavedTileIds(discoveredChunks, saved.explored);
    restoreSavedTileIds(peopleMet, saved.people);
    for (const npc of getSavedList(saved.npcs)) if (npc && Number.isSafeInteger(npc.id) && Number.isSafeInteger(npc.visits) && npc.visits > 0) peopleMet.add(npc.id);
    restoreSavedBait(saved.bait);
    activeBaitId = baitInventory.has(saved.activeBait) ? saved.activeBait : null;
    restoreSavedTileIds(openedChests, saved.chests);
    restoreSavedNpcs(scene, saved.npcs);

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
            people: [...peopleMet],
            bait: [...baitInventory],
            activeBait: activeBaitId,
            chests: [...openedChests],
            guideMet: guideHasMetPlayer,
            appearance: PLAYER_LOOK, appearanceChosen: playerAppearanceChosen,
            position: character ? interior ? [interior.house.doorX * TILE_SIZE, interior.house.doorY * TILE_SIZE] : [Math.round(character.x), Math.round(character.y)] : null,
            npcs: mainCamera ? getSavedNpcs(mainCamera.scene.time.now) : [],
            stats: Object.fromEntries(Object.entries(playerStats).map(([key, value]) => [key, Math.floor(value)]))
        }));
        saveDirty = false;
    } catch (error) {
        saveDirty = true;
    }
}

function resetProgress(nextSeed) {
    try {
        localStorage.removeItem(SAVE_KEY);
        const nextKey = nextSeed ? 'pixcation-save-v1:' + nextSeed : 'pixcation-save-v1';
        if (nextSeed !== undefined && nextKey !== SAVE_KEY) localStorage.removeItem(nextKey);
        if (nextSeed === undefined || nextSeed === null || SAVE_KEY === 'pixcation-save-v1') localStorage.removeItem(WORLD_SEED_KEY);
    } catch (error) {
        return false;
    }

    newGameResetting = true;
    saveDirty = false;
    return true;
}
