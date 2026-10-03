const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createImporter() {
    const html = fs.readFileSync(path.join(__dirname, '../build.html'), 'utf8');
    const source = html.slice(html.indexOf('function loadMap('), html.indexOf('function importMap('));
    const context = vm.createContext({});
    vm.runInContext(`
        let mapWidth = 3;
        let mapHeight = 1;
        let mapData = [['old', 'map', 'data']];
        let rebuilds = 0;
        function createMap() { rebuilds++; }
    ` + source, context);
    return {
        load: map => context.loadMap(map),
        state: () => JSON.parse(vm.runInContext('JSON.stringify({ width: mapWidth, height: mapHeight, data: mapData, rebuilds })', context))
    };
}

test('empty and malformed maps preserve the existing map and grid', () => {
    const importer = createImporter();
    const initial = importer.state();
    for (const map of [null, {}, { data: [] }, { data: [null] }, { data: [[], []] },
        { width: -1, data: [['grass1']] }, { height: -1, data: [['grass1']] },
        { width: 1.5, data: [['grass1']] }, { height: 'Infinity', data: [['grass1']] }]) {
        assert.throws(() => importer.load(map), /data or tiles array|positive whole numbers/);
        assert.deepEqual(importer.state(), initial);
    }
});

test('inferred and legacy imports keep tile values and copy their rows', () => {
    for (const dimensions of [{}, { width: '2', height: '2' }, { width: 0, height: 0 }]) {
        const importer = createImporter();
        const tiles = [['transition1', 'water'], ['wood', 'grass1']];
        importer.load({ ...dimensions, tiles });
        assert.deepEqual(importer.state(), { width: 2, height: 2, data: tiles, rebuilds: 1 });
        tiles[0][0] = 'changed';
        assert.equal(importer.state().data[0][0], 'transition1');
    }
});

test('mismatched heights and ragged rows cannot replace the current map', () => {
    const importer = createImporter();
    const initial = importer.state();
    for (const map of [{ height: 2, data: [['grass1']] }, { width: 1, data: [['grass1'], null] },
        { data: [['grass1'], ['grass1', 'water']] }]) {
        assert.throws(() => importer.load(map), /height does not match|Every map row/);
        assert.deepEqual(importer.state(), initial);
    }
});
