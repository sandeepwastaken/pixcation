const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
test('landmark labels stay inside the map and hide when their landmark is off-screen', () => {
    const run = createMap(); run('const label = {style: {}}; positionMapLandmarkLabel(label, 100, 40)');
    assert.equal(run('label.style.display'), 'block'); assert.equal(run('label.style.top'), '86px');
    run('positionMapLandmarkLabel(label, -20, 40)'); assert.equal(run('label.style.display'), 'none');
    run('positionMapLandmarkLabel(label, 100, MAP_HEIGHT - 1)'); assert.equal(run('label.style.display'), 'none');
});
function createMap() {
    const context = vm.createContext({ createTileCache: () => () => 0 });
    vm.runInContext(['runtime/settings.js', 'runtime/state.js', 'ui/map-render.js', 'ui/map-controls.js'].map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n'), context);
    vm.runInContext(`character = { x: 0, y: 0 }; mapContainer = { y: 6 }; function isMenuOpen() { return false; } let redraws = 0; redrawMap = () => redraws++; function showSlidingPanel() {} function hideSlidingPanel() {} function setUITextContent(element, text) { element.textContent = text; } mapWaypointText = {}; mapWaypointLayer = { setVisible(value) { this.visible = value; } };`, context);
    return code => vm.runInContext(code, context);
}
test('off-map player markers follow the correct edge rather than disappearing or choosing a corner', () => {
    const run = createMap();
    for (const [x, y, edge] of [[1000, 52, 'right'], [-1000, 52, 'left'], [148, 1000, 'bottom'], [148, -1000, 'top']]) {
        const marker = JSON.parse(run(`JSON.stringify(getMapEdgeMarker(${x}, ${y}))`)); assert.equal(marker.outside, true);
        if (edge === 'right') assert.equal(marker.x, 288); if (edge === 'left') assert.equal(marker.x, 8); if (edge === 'bottom') assert.equal(marker.y, 96); if (edge === 'top') assert.equal(marker.y, 8);
    }
    assert.equal(run('getMapEdgeMarker(148, 52).outside'), false);
    run('const pixels = new Uint32Array(MAP_WIDTH * MAP_HEIGHT); drawMapArrow(pixels, getMapEdgeMarker(-1000, -1000), 0xffffff)'); assert.ok(run('pixels.some(pixel => pixel === toMapPixel(0xffffff))'));
});
test('map badges use artwork pixels, preserve transparency, and clip safely at the edges', () => {
    const run = createMap(); run('function getTerrainPixels() { return { width: 2, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 0]) }; } const pixels = new Uint32Array(MAP_WIDTH * MAP_HEIGHT); drawMapSprite({}, pixels, "guide", 10, 10, 2)');
    assert.equal(run('pixels[9 * MAP_WIDTH + 9]'), run('toMapPixel(0xff0000)')); assert.equal(run('pixels[9 * MAP_WIDTH + 10]'), run('toMapPixel(0x36160d)'));
    assert.doesNotThrow(() => run('drawMapSprite({}, pixels, "guide", -1000, -1000, 16)'));
});
test('waypoint guidance updates its bearing, hides behind dialogue, and clears on arrival', () => {
    const run = createMap(); run('mapWaypoint = { x: 20, y: 0 }; updateMapWaypoint()'); assert.equal(run('mapWaypointText.textContent'), 'Waypoint: E  20 tiles'); assert.equal(run('mapWaypointLayer.visible'), true);
    run('dialogueOpen = true; updateMapWaypoint()'); assert.equal(run('mapWaypointLayer.visible'), false);
    run('dialogueOpen = false; character.x = 20 * TILE_SIZE; updateMapWaypoint()'); assert.equal(run('mapWaypoint'), null); assert.equal(run('mapWaypointLayer.visible'), false);
});
test('walking leaves the map center fixed and opening it recenters on the player', () => {
    const run = createMap(); run('character.x = 152; character.y = 88; openMap({})'); assert.equal(run('mapCenter.x'), 10); assert.equal(run('mapCenter.y'), 6);
    run('character.x += 320'); assert.equal(run('mapCenter.x'), 10); run('closeMap({}); openMap({})'); assert.equal(run('mapCenter.x'), 30);
});
test('map clicks account for the panel offset, zoom, center and panning', () => {
    const run = createMap(); run('mapCenter.x = 10; mapCenter.y = 20; mapZoom = 2; mapPan.x = 4; mapPan.y = -3; setMapWaypoint({ x: 112, y: 82 })');
    assert.deepEqual(JSON.parse(run('JSON.stringify(mapWaypoint)')), { x: -10, y: 11 });
    run('mapDirty = false; setMapWaypoint({ x: 0, y: 0 })'); assert.equal(run('mapDirty'), false);
    run("handleMapKey({}, { key: 'r' })"); assert.equal(run('mapWaypoint'), null);
});
