const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createSampler(pixels) {
    const context = vm.createContext({ pixels: new Uint8ClampedArray(pixels.flat()) });
    const source = fs.readFileSync(path.join(__dirname, '../src/environment/shadows.js'), 'utf8');
    vm.runInContext(source + `
        let textureReads = 0;
        function getTerrainPixels() { textureReads++; return { data: pixels }; }
        const scene = {};
    `, context);
    return code => vm.runInContext(code, context);
}

test('transparent padding cannot outweigh visible texture colors', () => {
    const blue = [104, 144, 202, 255];
    const run = createSampler([...Array(10).fill([0, 0, 0, 0]), ...Array(10).fill([255, 0, 0, 0]), blue, blue]);
    assert.deepEqual(JSON.parse(run("JSON.stringify(getDominantColor(scene, 'sample'))")), blue.slice(0, 3));
});

test('visible black pixels and existing tie order are retained', () => {
    const black = [0, 0, 0, 255];
    const white = [255, 255, 255, 255];
    const run = createSampler([black, white, white, black]);
    assert.deepEqual(JSON.parse(run("JSON.stringify(getDominantColor(scene, 'sample'))")), [255, 255, 255]);
    const dark = createSampler([black, white, black]);
    assert.deepEqual(JSON.parse(dark("JSON.stringify(getDominantColor(scene, 'sample'))")), [0, 0, 0]);
});

test('empty textures keep the fallback and repeated samples reuse cached colors', () => {
    const run = createSampler([[255, 255, 255, 0]]);
    run("const color = getDominantColor(scene, 'sample')");
    assert.deepEqual(JSON.parse(run('JSON.stringify(color)')), [0, 0, 0]);
    assert.equal(run("getDominantColor(scene, 'sample') === color"), true);
    assert.equal(run('textureReads'), 1);
});
