const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const source = ['runtime/settings.js', 'runtime/state.js', 'world/surfaces.js', 'world/chunks.js', 'environment/shimmers.js']
    .map(file => fs.readFileSync(path.join(ROOT, 'src', file), 'utf8')).join('\n');

function createWorld(includeOpenWater = true) {
    const context = vm.createContext({ includeOpenWater });
    vm.runInContext(source + `
        const tiles = new Map([
            ['0,0', { key: 'wood', bridge: true, rotation: Math.PI / 2 }],
            ['1,0', { key: 'wood', bridge: true, rotation: 0 }],
            ['2,0', { key: 'wood', rotation: 0 }],
            ['3,0', { key: 'water' }],
            ['0,1', { key: 'woodLeft', baseKey: 'water', rotation: 0 }],
            ['1,1', { key: 'woodRight', baseKey: 'water', rotation: 0 }],
            ['3,1', { key: 'water' }]
        ]);
        if (!includeOpenWater) {
            tiles.delete('3,0');
            tiles.delete('3,1');
        }
        function getChunkKey(x, y) { return x + ',' + y; }
        function getWorldTile(x, y) { return tiles.get(x + ',' + y) || { key: 'grass1' }; }
        function getTerrainTile() { return { key: 'water' }; }
        function getTextureSource() { return { width: 16, height: 16 }; }
        function getShorelineTile() { return { textureKey: 'shoreline', waterCells: [{ x: 0, y: 0, width: 16, height: 16 }], edgeCells: [] }; }
        function getPropAt() { return null; }
        function getStaticShadowMask() { return null; }
        function drawingContext() { return { setTransform() {}, clearRect() {}, drawImage() {} }; }
        const document = { createElement: () => ({ getContext: drawingContext }) };
        function sprite() {
            return {
                listeners: [],
                setOrigin() { return this; },
                setDepth(depth) { this.depth = depth; return this; },
                setPosition(x, y) { this.x = x; this.y = y; return this; },
                setVisible(visible) { this.visible = visible; return this; },
                setActive(active) { this.active = active; return this; },
                on(event, callback) { this.listeners.push([event, callback]); return this; },
                play() { return this; },
                stop() { return this; }
            };
        }
        const Phaser = { Math: { Between: (min, max) => min }, Animations: { Events: { ANIMATION_COMPLETE: 'complete' } } };
        const scene = {
            textures: { addCanvas: (key, canvas) => ({ key, getContext: drawingContext, refresh() {} }) },
            add: { image: sprite, sprite }
        };
        createWorldChunk(scene, 0, 0, true);
        const chunk = loadedChunks.get('0,0');
    `, context);
    return code => vm.runInContext(code, context);
}

test('sparkle spawn regions exclude both bridge orientations and pier decks', () => {
    const run = createWorld();
    const cells = JSON.parse(run('JSON.stringify(chunk.waterCells)'));
    assert.deepEqual(cells, [48, 0, 16, 16, 48, 16, 16, 16]);
    assert.equal(run('chunk.waterBuild.waterMaskCells.length'), 6 * 4);
    assert.equal(run('loadedShimmerChunks.has(chunk)'), true);
});

test('chunks with only covered water cannot be selected for sparkles', () => {
    const run = createWorld(false);
    assert.equal(run('chunk.waterCells.length'), 0);
    assert.equal(run('loadedShimmerChunks.has(chunk)'), false);
    assert.equal(run('chunk.waterBuild.waterMaskCells.length'), 4 * 4);
    run('spawnShimmer(scene)');
    assert.equal(run('chunk.shimmers.length'), 0);
});

test('sparkles remain below decks when sprites are created and reused', () => {
    const run = createWorld();
    run('spawnChunkShimmer(scene, chunk); const first = chunk.shimmers[0]');
    assert.equal(run('first.depth > 1 && first.depth < chunk.upperLayer.depth'), true);
    assert.equal(run('getWorldTile(Math.floor(first.x / TILE_SIZE), Math.floor(first.y / TILE_SIZE)).key'), 'water');
    run('finishShimmer(null, null, first)');
    assert.equal(run('first.active'), false);
    run('spawnChunkShimmer(scene, chunk)');
    assert.equal(run('chunk.shimmers[0] === first'), true);
    assert.equal(run('first.depth > 1 && first.depth < chunk.upperLayer.depth'), true);
    assert.equal(run('first.listeners.length'), 1);
});
