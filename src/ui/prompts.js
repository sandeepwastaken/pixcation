function createInteractionPromptUI(scene) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    wrapper.appendChild(row);

    Object.assign(row.style, {
        width: '320px',
        height: '18px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
        fontFamily: 'm6x11, monospace',
        fontSize: '11px',
        lineHeight: '11px',
        color: '#c0a887',
        whiteSpace: 'nowrap',
    });

    const makePrompt = (key, label) => {
        const box = document.createElement('div');

        Object.assign(box.style, {
            display: 'none',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 6px',
            background: '#36160d',
            borderRadius: '0',
            boxShadow: 'inset 0 0 0 1px #465989, 0 0 0 1px #230a03'
        });

        const keycap = document.createElement('span');
        keycap.textContent = key || '';

        Object.assign(keycap.style, {
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '10px',
            padding: '0 1px',
            color: '#e0f2fd',
            background: '#465989',
            borderRadius: '0'
        });

        const text = document.createElement('span');
        text.textContent = label;

        box.append(...(key ? [keycap, text] : [text]));
        box.label = text;
        row.appendChild(box);

        return box;
    };

    marketPrompt = makePrompt('E', 'Market');
    guidePrompt = makePrompt('E', 'Talk to the Guide');
    itemPrompt = makePrompt(null, '');

    interactionPromptLayer = addHudLayer(scene, wrapper, PROMPT_Y, 103);
}

function updateInteractionPrompt(scene, guideReach, marketReach) {
    if (!interactionPromptLayer) return;

    const time = scene.time.now, available = !isMenuOpen() && time >= catchCardUntil;
    const target = available && (guideReach < 1 || marketReach < 1)
        ? getInteractionTarget(guideHasMetPlayer, guideReach, marketReach)
        : null;
    const showItem = available && !target && time < itemLabelUntil;
    const state = (target === 'market' ? 1 : 0) | (target === 'guide' ? 2 : 0) | (showItem ? 4 : 0);

    if (state === promptState) return;

    const wasShowing = promptState > 0;
    promptState = state;
    scene.tweens.killTweensOf(promptMotion);

    if (state === 0) {
        scene.tweens.add({
            targets: promptMotion,
            value: 0,
            duration: 90,
            onUpdate: applyPromptMotion,
            onComplete: () => promptState === 0 && interactionPromptLayer.setVisible(false)
        });
        return;
    }

    marketPrompt.style.display = state & 1 ? 'flex' : 'none';
    guidePrompt.style.display = state & 2 ? 'flex' : 'none';
    itemPrompt.style.display = state & 4 ? 'flex' : 'none';
    interactionPromptLayer.setVisible(true);
    if (!wasShowing) promptMotion.value = 0;
    applyPromptMotion();
    scene.tweens.add({ targets: promptMotion, value: 1, duration: 140, ease: 'Cubic.Out', onUpdate: applyPromptMotion });
}

function applyPromptMotion() {
    interactionPromptLayer
        .setY(PROMPT_Y + Math.round((1 - promptMotion.value) * PROMPT_SLIDE))
        .setVisible(promptMotion.value > 0.05);
}
