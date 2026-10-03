function setCharacterTexture(key) {
    if (key === characterTextureKey) return false;

    characterTextureKey = key;
    character.setTexture(key);
    return true;
}

function update(time, delta) {
    if (!character) return;

    let moveX = 0;
    let moveY = 0;

    if (!isMenuOpen()) {
        const left = characterKeys.left.isDown || characterKeys.leftArrow.isDown;
        const right = characterKeys.right.isDown || characterKeys.rightArrow.isDown;
        const up = characterKeys.up.isDown || characterKeys.upArrow.isDown;
        const down = characterKeys.down.isDown || characterKeys.downArrow.isDown;

        moveX = left && right ? horizontalPriority : left ? -1 : right ? 1 : 0;
        moveY = up && down ? verticalPriority : up ? -1 : down ? 1 : 0;
        if (moveX !== 0) characterDirection = moveX < 0 ? 'left' : 'right';
        if (moveY !== 0) characterDirection = moveY < 0 ? 'back' : 'front';
    }

    const isWalking = moveX !== 0 || moveY !== 0;
    characterMoving = isWalking;

    if (!isWalking) {
        characterWalkPhase = 1;
        setCharacterTexture(`character-${characterDirection}`);
    } else {
        const pace = characterKeys.sprint.isDown ? CHARACTER_SPRINT_MULTIPLIER : 1;
        const frameDelta = Math.min(delta, 50);
        const distance = CHARACTER_SPEED * pace * frameDelta / 1000 * (moveX !== 0 && moveY !== 0 ? Math.SQRT1_2 : 1);

        characterPace = pace;
        characterWalkPhase += frameDelta * CHARACTER_ANIMATION_SPEED * pace / 1000;
        characterMoveRemainderX += moveX * distance;
        characterMoveRemainderY += moveY * distance;

        const wholeMoveX = Math.trunc(characterMoveRemainderX);
        const wholeMoveY = Math.trunc(characterMoveRemainderY);

        characterMoveRemainderX -= wholeMoveX;
        characterMoveRemainderY -= wholeMoveY;
        if (!moveCharacterAxis(this, wholeMoveX, 0, moveY === 0)) characterMoveRemainderX = 0;
        if (!moveCharacterAxis(this, 0, wholeMoveY, moveX === 0)) characterMoveRemainderY = 0;

        const walkFrame = CHARACTER_WALK_FRAMES[Math.floor(characterWalkPhase) % 4];

        if (setCharacterTexture(`character-${characterDirection}${walkFrame ? `walk${walkFrame}` : ''}`) && walkFrame) {
            kickUpDust(this, time, moveX, moveY);
        }
    }

    character.x = Math.round(character.x);
    character.y = Math.round(character.y);
    character.setDepth(character.y + CHARACTER_SIZE);
    updateCharacterShadow(this);
    updateParticles(time);
    updateFishing(this, time, delta, isWalking);
    updateChestBubbles(this, time);
    updateBushRustle(this, time, isWalking);

    const guideReach = getGuideReach();
    const marketReach = getMarketReach();
    updateGuideInteraction(this, guideReach < 1);
    updateInteractionPrompt(this, guideReach, marketReach);

    if (mapOpen) updateMapPan(this, delta);

    if (inventoryOpen && newGameConfirmUntil && time >= newGameConfirmUntil) {
        newGameConfirmUntil = 0;
        refreshInventoryUI(time);
    }

    updateLoadedChunks(this);
    buildPendingChunk(this);
    updateCamera(delta);
    updateChunkVisibility();
    updateFish(delta);
    updateChunkWater(time);
}
