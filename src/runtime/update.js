function update(time, delta) {
    if (!character) return;
    if (interiorTransition) { lastPlayTime = null; updateInteriorTransition(this, time); return; }
    if (spawnReturn) { updateSpawnReturn(this, time, delta); return; }
    if (startup) {
        lastPlayTime = null;
        updateStartup(this, time, delta);
        return;
    }

    const beforeX = character.x, beforeY = character.y;
    const isWalking = updateCharacter(this, time, delta);
    const travelled = Math.hypot(character.x - beforeX, character.y - beforeY); if (travelled > 0) recordPlayerStat('distanceWalked', travelled);
    updateInterior(this, time, delta);
    updatePlayTime(time);

    character.x = Math.round(character.x);
    character.y = Math.round(character.y);
    const characterDepth = character.y + CHARACTER_SIZE; if (character.depth !== characterDepth) character.setDepth(characterDepth);
    updateCharacterShadow(this);
    updateParticles(time);
    updateFishing(this, time, delta, isWalking);
    updateChestBubbles(this, time);
    updateBushRustle(this, time, isWalking);

    const guideReach = getGuideReach();
    const marketReach = getMarketReach();
    updateGuideInteraction(this, guideReach < 1);
    updateInteractionPrompt(this, guideReach, marketReach);
    updateStatsUI();

    if (mapOpen) updateMapPan(this, delta);

    if (inventoryOpen && newGameConfirmUntil && time >= newGameConfirmUntil) {
        newGameConfirmUntil = 0;
        refreshInventoryUI(time);
    }

    updateLoadedChunks(this);
    buildPendingChunk(this);
    updateCamera(delta);
    updateChunkVisibility();
    updateTreeShadows(this, time);
    updateFish(delta);
    spawnFishRise(this, time);
    spawnMeadowMote(this, time);
    updateNpcs(this, time, delta); if (interior) updateInteriorResidents(this, time, delta);
    updateActorBlinks(this, time);
    updateDialoguePortraitBlink(this, time);
    updateActorShading(this);
    updateFishJumps(this, time);
    updateSky(this, time, delta);
    updateFireflies(time, delta);
    updateSnow(this, time, delta);
    updateChunkWater(time);
}
