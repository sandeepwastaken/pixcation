function openMap(scene) {
    if (isMenuOpen() || !mapContainer) return;

    mapOpen = true;
    mapPan.x = 0;
    mapPan.y = 0;
    mapDrag = null;
    mapDirty = false;
    stopCharacterForMenu();
    redrawMap(scene);
    showSlidingPanel(scene, MAP_HIDDEN_Y, mapContainer, mapTextLayer);
}

function closeMap(scene) {
    if (!mapOpen) return;

    mapOpen = false;
    hideSlidingPanel(scene, MAP_HIDDEN_Y, () => mapOpen, mapContainer, mapTextLayer);
}

function handleMapKey(scene, event) {
    if (event.key.toLowerCase() === 'm' || event.key === 'Escape') closeMap(scene);
}

function updateMapPan(scene, delta) {
    const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
        (characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
    const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
        (characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);
    if (!panX && !panY && !mapDirty) return;

    const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
    const beforeX = Math.round(mapPan.x);
    const beforeY = Math.round(mapPan.y);

    mapPan.x += panX * distance;
    mapPan.y += panY * distance;
    mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;

    if (mapDirty) {
        mapDirty = false;
        redrawMap(scene);
    }
}
