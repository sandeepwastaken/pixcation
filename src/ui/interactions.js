function getMarketReach() {
    if (!store) return Infinity;

    const x = character.x + CHARACTER_SIZE / 2 - store.x - STORE_WIDTH / 2;
    const y = character.y + CHARACTER_SIZE / 2 - store.y - STORE_HEIGHT / 2;

    return (x * x + y * y) / MARKET_INTERACTION_DISTANCE_SQUARED;
}

function getGuideReach() {
    if (!guide) return Infinity;

    const x = character.x - guide.x;
    const y = character.y - guide.y;

    return (x * x + y * y) / GUIDE_INTERACTION_DISTANCE_SQUARED;
}

function isMarketNear() {
    return getMarketReach() < 1;
}

function isGuideNear() {
    return getGuideReach() < 1;
}

function getClickedWorldTarget(pointer) {
    const inside = (target, width, height) => pointer.worldX >= target.x && pointer.worldX < target.x + width &&
        pointer.worldY >= target.y && pointer.worldY < target.y + height;

    if (guide && isGuideNear() && inside(guide, GUIDE_SIZE, GUIDE_SIZE)) return 'guide';
    if (store && isMarketNear() && inside(store, STORE_WIDTH, STORE_HEIGHT)) return 'market';
    return null;
}

function getFacingPenalty(targetX, targetY) {
    const x = targetX - character.x - CHARACTER_SIZE / 2;
    const y = targetY - character.y - CHARACTER_SIZE / 2;
    const along = characterDirection === 'left' ? -x
        : characterDirection === 'right' ? x
        : characterDirection === 'back' ? -y
        : y;

    return along > 0 && along * along * 2 >= x * x + y * y ? 0 : 1;
}

function getInteractionTarget(guideAvailable, guideReach, marketReach) {
    guideReach = guideAvailable ? guideReach ?? getGuideReach() : Infinity;
    marketReach ??= getMarketReach();

    if (guideReach >= 1 && marketReach >= 1) return null;
    if (guideReach >= 1) return 'market';
    if (marketReach >= 1) return 'guide';

    const guideScore = guideReach + getFacingPenalty(guide.x + GUIDE_SIZE / 2, guide.y + GUIDE_SIZE / 2);
    const marketScore = marketReach + getFacingPenalty(store.x + STORE_WIDTH / 2, store.y + STORE_HEIGHT / 2);

    return guideScore <= marketScore ? 'guide' : 'market';
}

function refreshGuideDialogueOptions() {
    const options = GUIDE_DIALOGUE[dialogueNode].options;

    dialogueOptionTexts.forEach((optionText, index) => {
        const option = options[index], display = option ? 'block' : 'none';

        if (optionText.style.display !== display) optionText.style.display = display;
        if (!option) return;

        setUITextContent(optionText, option.label);
        optionText.style.color = index === selectedDialogueOption ? '#e0f2fd' : '#c0a887';
    });

    const highlightY = DIALOGUE_OPTION_TOP + selectedDialogueOption * DIALOGUE_OPTION_STEP; if (dialogueHighlight.y !== highlightY) dialogueHighlight.setY(highlightY);
}

function finishGuideDialogueText() {
    if (!stopDialogueTyping()) return false;

    dialogueText.textContent = dialogueFullText;
    return true;
}

function openInteraction(scene, target) {
    if (target === 'guide') openGuideDialogue(scene);
    else if (target === 'market') openMarket(scene);
}

function stopDialogueTyping() {
    if (!dialogueTypingEvent) return false;

    dialogueTypingEvent.remove(false);
    dialogueTypingEvent = null;
    return true;
}

function showGuideDialogueNode(scene, nodeKey) {
    const node = GUIDE_DIALOGUE[nodeKey];
    let characterIndex = 0;

    stopDialogueTyping();
    dialogueNode = nodeKey;
    selectedDialogueOption = 0;
    dialogueFullText = node.text;
    if (dialoguePortrait.texture.key !== node.portrait) dialoguePortrait.setTexture(node.portrait);
    const typingText = document.createTextNode('');
    dialogueText.replaceChildren(typingText);
    refreshGuideDialogueOptions();

    dialogueTypingEvent = scene.time.addEvent({
        delay: 24,
        repeat: dialogueFullText.length - 1,
        callback: () => {
            typingText.appendData(dialogueFullText.charAt(characterIndex));
            characterIndex++;
            if (characterIndex === dialogueFullText.length) dialogueTypingEvent = null;
        }
    });
}

function openGuideDialogue(scene) {
    if (isMenuOpen() || !guide || !dialogueContainer) return;

    dialogueOpen = true;
    stopCharacterForMenu();
    showSlidingPanel(scene, DIALOGUE_HIDDEN_Y, dialogueContainer, dialogueTextLayer);
    showGuideDialogueNode(scene, 'intro');
}

function closeGuideDialogue(scene) {
    if (!dialogueOpen) return;

    dialogueOpen = false;
    guideHasMetPlayer = true;
    saveDirty = true;
    stopDialogueTyping();
    hideSlidingPanel(scene, DIALOGUE_HIDDEN_Y, () => dialogueOpen, dialogueContainer, dialogueTextLayer);
}

function selectGuideDialogueOption(scene) {
    if (finishGuideDialogueText()) return;

    const option = GUIDE_DIALOGUE[dialogueNode].options[selectedDialogueOption];

    if (option.close) {
        closeGuideDialogue(scene);
    } else {
        showGuideDialogueNode(scene, option.next);
    }
}

function moveGuideDialogueSelection(amount) {
    selectedDialogueOption = Phaser.Math.Wrap(selectedDialogueOption + amount, 0, GUIDE_DIALOGUE[dialogueNode].options.length);
    refreshGuideDialogueOptions();
}

function handleGuideDialogueKey(scene, event) {
    const step = getVerticalMenuStep(event);

    if (step) {
        moveGuideDialogueSelection(step);
    } else if (event.key === 'Enter' || event.code === 'Space' || event.key.toLowerCase() === 'e') {
        selectGuideDialogueOption(scene);
    } else if (event.key === 'Escape') {
        closeGuideDialogue(scene);
    }
}

function updateGuideInteraction(scene, guideIsNear) {
    if (guideIsNear && !guideWasNear && !guideHasMetPlayer && !isMenuOpen()) {
        openGuideDialogue(scene);
    }

    guideWasNear = guideIsNear;
}
