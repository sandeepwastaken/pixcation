const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createShadows() {
    const casters = [];
    const context = vm.createContext({ staticShadowCasters: casters, getPropAt: () => null });
    const source = ['runtime/settings.js', 'world/shadows.js']
        .map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\n');
    vm.runInContext(source, context);
    return { casters, context };
}

test('actor shadow bounds preserve pixels across negative and positive chunk edges', () => {
    const { casters, context } = createShadows();
    const points = [0, 0, 1, 1, 255, 255, 256, 256, 257, 257];
    casters.push(context.createStaticShadowCaster(-1, -1, points));
    for (let chunkY = -2; chunkY <= 2; chunkY++) for (let chunkX = -2; chunkX <= 2; chunkX++) {
        const expected = new Uint8Array(256 * 256);
        for (let point = 0; point < points.length; point += 2) {
            const x = points[point] - 1 - chunkX * 256;
            const y = points[point + 1] - 1 - chunkY * 256;
            if (x >= 0 && x < 256 && y >= 0 && y < 256) expected[y * 256 + x] = 1;
        }
        const mask = context.getStaticShadowMask(chunkX, chunkY);
        if (expected.includes(1)) assert.deepEqual(Buffer.from(mask), Buffer.from(expected));
        else assert.equal(mask, null);
    }
});

test('distant and empty actor shadows cannot create masks or visit their points', () => {
    const { casters, context } = createShadows();
    casters.push(context.createStaticShadowCaster(256, 256, [0, 0, 4, 2]));
    casters.push(context.createStaticShadowCaster(0, 0, []));
    let visits = 0;
    context.forEachStaticShadowPoint(0, 0, () => visits++);
    assert.equal(visits, 0);
    assert.equal(context.getStaticShadowMask(0, 0), null);
    context.forEachStaticShadowPoint(1, 1, () => visits++);
    assert.equal(visits, 2);
});
