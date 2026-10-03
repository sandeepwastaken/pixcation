function snapTweenTarget(tween, target) {
    target.y = Math.round(target.y);
}

function stopCharacterForMenu() {
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    setCharacterTexture(`character-${characterDirection}`);
}

function getVerticalMenuStep(event) {
    const key = event.key.toLowerCase();
    return key === 'w' || event.key === 'ArrowUp' ? -1 : key === 's' || event.key === 'ArrowDown' ? 1 : 0;
}

function popIn(scene, image, y) {
    image.setY(y + 2);
    scene.tweens.killTweensOf(image);
    scene.tweens.add({ targets: image, y, duration: 140, ease: 'Quad.Out', onUpdate: snapTweenTarget });
}

function slidePanel(scene, y, duration, ease, targets, onComplete) {
    for (const target of targets) scene.tweens.killTweensOf(target);
    scene.tweens.add({ targets, y, duration, ease, onUpdate: snapTweenTarget, onComplete });
}

function showSlidingPanel(scene, hiddenY, ...targets) {
    for (const target of targets) target.setVisible(true).setY(hiddenY);
    slidePanel(scene, DIALOGUE_VISIBLE_Y, 180, 'Cubic.Out', targets);
}

function hideSlidingPanel(scene, hiddenY, isOpen, ...targets) {
    slidePanel(scene, hiddenY, 140, 'Cubic.In', targets, () => {
        if (!isOpen()) for (const target of targets) target.setVisible(false);
    });
}
