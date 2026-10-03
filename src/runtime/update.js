function update(time, delta) {
    if (!character) return;
    if (startup) {
        lastPlayTime = null;
        updateStartup(this, time, delta);
        return;
    }

    const isWalking = updateCharacter(this, time, delta);
    updatePlayTime(time);

    character.x = Math.round(character.x);
    character.y = Math.round(character.y);
    if (character.depth !== character.y + CHARACTER_SIZE) character.setDepth(character.y + CHARACTER_SIZE);
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
    updateChunkWater(time);
}
