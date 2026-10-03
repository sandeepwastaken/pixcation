const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createRenderer() {
    const context = vm.createContext({ Phaser: { Math: { Clamp: (value, min, max) => Math.max(min, Math.min(max, value)) } } });
    const source = ['runtime/settings.js', 'runtime/state.js', 'fishing/rope.js']
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
        function isWaterPixel(scene, x, y) { return x >= 2 && y >= 2; }
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
