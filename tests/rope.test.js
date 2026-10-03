const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createRenderer() {
    const context = vm.createContext({ Phaser: { Math: { Clamp: (value, min, max) => Math.max(min, Math.min(max, value)) } } });
    const source = ['runtime/settings.js', 'runtime/state.js', 'fishing/bobber.js', 'fishing/rope.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source + `
        const rectangles = [];
        const pixels = new Map();
        fishingLine = {
            defaultFillColor: 0xffffff,
            fillStyle(color) { this.defaultFillColor = color; },
            fillRect(x, y, width, height) {
                rectangles.push([x, y, width, height, this.defaultFillColor]);
                for (let row = y; row < y + height; row++) for (let column = x; column < x + width; column++) {
                    pixels.set(column + ',' + row, this.defaultFillColor);
                }
            }
        };
    `, context);
    return {
        run: code => vm.runInContext(code, context),
        draw(points) {
            context.inputPoints = points;
            vm.runInContext(`
                pixelPathLength = inputPoints.length;
                inputPoints.forEach(([x,y,color],i) => { pixelPathX[i]=x; pixelPathY[i]=y; pixelPathColor[i]=color; });
                drawPixelPath();
            `, context);
            return {
                pixels: JSON.parse(vm.runInContext('JSON.stringify([...pixels])', context)),
                rectangles: JSON.parse(vm.runInContext('JSON.stringify(rectangles)', context))
            };
        }
    };
}

test('horizontal pixel runs batch in either direction', () => {
    for (const points of [[[0,0,1],[1,0,1],[2,0,1]], [[2,0,1],[1,0,1],[0,0,1]]]) {
        const result = createRenderer().draw(points);
        assert.deepEqual(result.rectangles, [[0,0,3,1,1]]);
        assert.deepEqual(result.pixels, [['0,0',1],['1,0',1],['2,0',1]]);
    }
});

test('batching preserves gaps, row changes, reversals, and overpainted colors', () => {
    for (const points of [
        [[0,0,1],[2,0,1],[2,1,1]],
        [[0,0,1],[1,0,1],[2,0,2],[3,0,2]],
        [[3,0,1],[2,0,1],[3,0,1],[4,0,1]],
        [[0,0,1],[1,0,1],[0,0,2]],
        [[-3,-2,1],[-2,-2,1],[-1,-2,1],[0,-1,2]]
    ]) {
        const expected = new Map(points.map(([x,y,color]) => [x+','+y,color]));
        const result = createRenderer().draw(points);
        assert.deepEqual(new Map(result.pixels), expected);
    }
});

test('an empty path emits no graphics commands', () => {
    assert.deepEqual(createRenderer().draw([]), { pixels: [], rectangles: [] });
});

test('fishing shadows project whole pixels onto water and skip land', () => {
    const renderer = createRenderer();
    renderer.run(`
        const shadowPixels = [];
        fishingWaterShadow = { fillStyle() {}, fillRect(x, y, width, height) { shadowPixels.push([x, y, width, height]); } };
        function getTerrainSurface(scene, tile) { return { water: Uint8Array.from({ length: TILE_SIZE * TILE_SIZE }, (_, pixel) => tile.tileX * TILE_SIZE + pixel % TILE_SIZE >= 2 && tile.tileY * TILE_SIZE + Math.floor(pixel / TILE_SIZE) >= 2 ? 1 : 0) }; }
        function getWorldTile(tileX, tileY) { return { tileX, tileY }; }
        pixelPathLength = 4;
        pixelPathX.set([0, 1, 2, 3]);
        pixelPathY.set([0, 0, 0, 0]);
        drawFishingWaterShadow({}, 6, 2);
    `);
    const pixels = JSON.parse(renderer.run('JSON.stringify(shadowPixels)'));
    assert.ok(pixels.length > 0);
    for (const [x, y, width, height] of pixels) {
        assert.ok(Number.isInteger(x) && Number.isInteger(y));
        assert.ok(x >= 2 && y >= 2);
        assert.equal((x + y) % 2, 0);
        assert.equal(width, 1);
        assert.equal(height, 1);
    }
});
test('fishing shadows reuse tiles across negative borders without drawing onto land', () => {
    const renderer = createRenderer();
    renderer.run('const shadowPixels = []; const tileReads = []; let surfaceReads = 0');
    renderer.run('fishingWaterShadow = { fillStyle() {}, fillRect(x, y) { shadowPixels.push([x, y]); } }');
    renderer.run('function getWorldTile(x, y) { tileReads.push([x, y]); return { x, water: x < 1 }; }');
    renderer.run('function getTerrainSurface(scene, tile) { surfaceReads++; return { water: Uint8Array.from({ length: TILE_SIZE * TILE_SIZE }, (_, pixel) => tile.water && (tile.x !== 0 || pixel % TILE_SIZE < 10) ? 1 : 0) }; }');
    renderer.run('pixelPathLength = 41; for (let index = 0; index < 41; index++) { pixelPathX[index] = index - 20; pixelPathY[index] = -1; }');
    renderer.run('drawFishingWaterShadow({}, 0, 0)');
    assert.deepEqual(JSON.parse(renderer.run('JSON.stringify(tileReads)')), [[-2, -1], [-1, -1], [0, -1], [1, -1]]);
    assert.equal(renderer.run('surfaceReads'), 4);
    assert.deepEqual(JSON.parse(renderer.run('JSON.stringify(shadowPixels)')), Array.from({ length: 15 }, (_, index) => [-19 + index * 2, -1]));
});
test('duplicate shadow projections draw once and empty paths skip graphics work', () => {
    const renderer = createRenderer();
    renderer.run('fishingWaterShadow = { fillStyle() { throw new Error("Empty shadow attempted graphics work"); } }');
    assert.doesNotThrow(() => renderer.run('drawFishingWaterShadow({}, 6, 0)'));
    renderer.run('const shadowPixels = []; let tileReads = 0; let waterEnabled = true');
    renderer.run('fishingWaterShadow = { fillStyle() {}, fillRect(x, y) { shadowPixels.push([x, y]); } }');
    renderer.run('function getWorldTile() { tileReads++; return {}; }');
    renderer.run('function getTerrainSurface() { return { water: new Uint8Array(TILE_SIZE * TILE_SIZE).fill(waterEnabled ? 1 : 0) }; }');
    renderer.run('pixelPathLength = 13; pixelPathX.fill(0); for (let index = 0; index < 13; index++) pixelPathY[index] = index');
    renderer.run('drawFishingWaterShadow({}, 6, 0)');
    assert.deepEqual(JSON.parse(renderer.run('JSON.stringify(shadowPixels)')), [[1, 7], [1, 9], [0, 10], [0, 12]]);
    assert.equal(renderer.run('tileReads'), 1);
    renderer.run('shadowPixels.length = 0; pixelPathLength = 1; pixelPathX[0] = 1; pixelPathY[0] = 0; drawFishingWaterShadow({}, 6, 0)');
    assert.deepEqual(JSON.parse(renderer.run('JSON.stringify(shadowPixels)')), [[2, 6]]);
    assert.equal(renderer.run('tileReads'), 2);
    renderer.run('waterEnabled = false; shadowPixels.length = 0; drawFishingWaterShadow({}, 6, 0)');
    assert.deepEqual(JSON.parse(renderer.run('JSON.stringify(shadowPixels)')), []);
    assert.equal(renderer.run('tileReads'), 3);
});
