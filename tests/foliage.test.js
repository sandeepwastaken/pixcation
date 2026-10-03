const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('wind stays on the pixel grid and rustling keeps tree trunks anchored', () => {
    const tree = { x: -40, y: -64, baseY: 0, width: 64, canopy: { x: -40, setTexture(key) { this.key = key; } }, rustleStart: -Infinity, touching: false };
    const bush = { x: -16, y: 0, slices: [{ x: -16, setTexture() {} }], rustleStart: -Infinity, touching: false, offset: 0 };
    const context = vm.createContext({ character: { x: -16, y: -16 }, loadedChunks: new Map([['0', { trees: [tree], bushes: [bush] }]]), dropLeaves() {} });
    vm.runInContext(fs.readFileSync('src/runtime/settings.js', 'utf8') + fs.readFileSync('src/environment/bushes.js', 'utf8'), context);
    context.getWindTexture = (scene, key, offset) => `${offset}`;
    const positions = new Set();
    for (let time = 0; time < 20000; time += 17) {
        context.updateBushRustle({}, time, true);
        assert.ok(Number.isInteger(tree.canopy.x));
        assert.ok(Number.isInteger(bush.slices[0].x));
        assert.equal(tree.x, -40);
        assert.equal(tree.y, -64);
        assert.equal(tree.baseY, 0);
        positions.add(tree.canopy.key);
    }
    assert.ok(positions.size >= 3);
    assert.ok(Number.isFinite(tree.rustleStart));
    assert.ok(Number.isFinite(bush.rustleStart));
});

test('tree shadows move across chunk borders and restore uncovered water', () => {
    class PixelImage {
        constructor(data, width, height) {
            this.data = data;
            this.width = width;
            this.height = height;
        }
    }
    const size = 256;
    const base = new Uint8ClampedArray(size * size * 4);
    for (let index = 0; index < base.length; index += 4) {
        base[index] = 255;
        base[index + 1] = 12;
        base[index + 3] = 255;
    }
    base[4] = 128;
    const makeTexture = () => {
        const texture = { key: 'test', refresh() { this.refreshCount = (this.refreshCount || 0) + 1; } };
        texture.getContext = () => ({ createImageData: () => new PixelImage(new Uint8ClampedArray(base.length), size, size), putImageData: image => { texture.image = image; } });
        return texture;
    };
    const tree = { x: 255, y: 0, baseY: 0, width: 64, shadow: [0, 0, 1, 0], shadowTop: 0, shadowHeight: 2, offset: 0 };
    const distant = { ...tree, x: 1024 };
    const left = { key: 'left', pixelX: 0, pixelY: 0, trees: [tree, distant], visible: true };
    const right = { key: 'right', pixelX: 256, pixelY: 0, trees: [], visible: true, waterTexture: makeTexture(), waterShadowBase: base };
    const context = vm.createContext({ ImageData: PixelImage, CHUNK_PIXEL_SIZE: size, loadedChunks: new Map([['left', left], ['right', right]]), acquireChunkCanvas: makeTexture, createChunkLayer: () => ({ setVisible() {} }), isWaterPixel: (scene, x) => x >= 256, getGroundShadowColor: () => [10, 20, 30], writeRGBPixel: (data, pixel, color) => { data.set([color >> 16, color >> 8 & 255, color & 255, 255], pixel * 4); } });
    vm.runInContext(fs.readFileSync('src/environment/bushes.js', 'utf8'), context);
    const scene = {};
    context.updateTreeShadows(scene, 0);
    assert.deepEqual(Array.from(left.treeShadowImage.data.slice(255 * 4, 256 * 4)), [10, 20, 30, 255]);
    assert.equal(right.waterTexture.image.data[0], 128);
    assert.equal(right.waterTexture.image.data[1], 12);
    const firstWaterImage = right.waterTexture.image;
    tree.offset = 2;
    base[16] = 128;
    base[17] = 21;
    context.updateTreeShadows(scene, 100);
    assert.deepEqual(Array.from(tree.shadowRows.get(2)), [2, 0]);
    assert.equal(right.waterTexture.image, firstWaterImage);
    assert.equal(left.treeShadowImage.data[255 * 4 + 3], 0);
    assert.equal(right.waterTexture.image.data[0], 255);
    assert.equal(right.waterTexture.image.data[4], 128);
    assert.equal(right.waterTexture.image.data[8], 128);
    assert.equal(right.waterTexture.image.data[16], 128);
    assert.equal(right.waterTexture.image.data[17], 21);
    assert.equal(base[0], 255);
    const refreshCount = right.waterTexture.refreshCount;
    let shadowReads = 0;
    tree.shadow = new Proxy(tree.shadow, { get(target, key) { if (typeof key === 'string' && /^\d+$/.test(key)) shadowReads++; return Reflect.get(target, key); } });
    distant.offset = 1;
    context.updateTreeShadows(scene, 200);
    assert.equal(shadowReads, 0);
    assert.equal(right.waterTexture.refreshCount, refreshCount);
    base[17] = 25;
    right.treeShadowSignature = null;
    scene.treeShadowSignature = null;
    context.updateTreeShadows(scene, 300);
    assert.ok(shadowReads > 0);
    assert.equal(right.waterTexture.image.data[17], 25);
    assert.equal(right.waterTexture.refreshCount, refreshCount + 1);
});
