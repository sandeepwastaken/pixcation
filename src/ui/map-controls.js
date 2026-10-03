function closeMap(scene) {
    if (!mapOpen) return;

    mapOpen = false;
    hideSlidingPanel(scene, MAP_HIDDEN_Y, () => mapOpen, mapContainer, mapTextLayer);
}

function handleMapKey(scene, event) {
    if (event.key.toLowerCase() === 'm' || event.key === 'Escape') closeMap(scene);
}
