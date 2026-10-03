const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createImporter() {
    const html = fs.readFileSync(path.join(__dirname, '../build.html'), 'utf8');
    const source = html.slice(html.indexOf('function loadMap('), html.indexOf('function exportMap('));
    const readers = [];
    const alerts = [];
    const importInput = { value: '' };
    class FileReader {
        constructor() { this.listeners = new Map(); readers.push(this); }
        addEventListener(type, callback) { this.listeners.set(type, callback); }
        readAsText(file) { this.file = file; }
        abort() { this.aborted = true; }
        finish(result) { this.result = result; this.listeners.get('load')(); }
        fail(error) { this.error = error; this.listeners.get('error')?.(); }
    }
    const context = vm.createContext({ FileReader, importInput, window: { alert: message => alerts.push(message) } });
    vm.runInContext(`
        let mapWidth = 3;
        let mapHeight = 1;
        let mapData = [['old', 'map', 'data']];
        let rebuilds = 0;
        let mapImportReader = null;
        function createMap() { rebuilds++; }
    ` + source, context);
    return {
        load: map => context.loadMap(map),
        select: file => {
            importInput.value = file.name;
            context.importMap({ target: { files: [file] } });
            return readers.at(-1);
        },
        alerts, importInput,
        pending: () => vm.runInContext('mapImportReader !== null', context),
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

test('failed file reads report the reason, retain the map, and allow another import', () => {
    const importer = createImporter();
    const initial = importer.state();
    importer.select({ name: 'unreadable.json' }).fail({ message: 'Permission denied' });
    assert.deepEqual(importer.state(), initial);
    assert.deepEqual(importer.alerts, ['Could not load map: Permission denied']);
    assert.equal(importer.importInput.value, '');
    assert.equal(importer.pending(), false);
    importer.select({ name: 'unknown-error.json' }).fail(null);
    assert.equal(importer.alerts.at(-1), 'Could not load map: The file could not be read.');
    importer.select({ name: 'retry.json' }).finish(JSON.stringify({ data: [['water']] }));
    assert.deepEqual(importer.state(), { width: 1, height: 1, data: [['water']], rebuilds: 1 });
    assert.equal(importer.pending(), false);
});

test('a newer import cancels the old reader and ignores its queued completion or error', () => {
    const importer = createImporter();
    const old = importer.select({ name: 'old.json' });
    const next = importer.select({ name: 'new.json' });
    assert.equal(old.aborted, true);
    old.finish(JSON.stringify({ data: [['dirt1']] }));
    old.fail({ message: 'Stale failure' });
    assert.equal(importer.state().rebuilds, 0);
    assert.equal(importer.importInput.value, 'new.json');
    assert.equal(importer.pending(), true);
    assert.deepEqual(importer.alerts, []);
    next.finish(JSON.stringify({ data: [['wood']] }));
    old.finish(JSON.stringify({ data: [['grass1']] }));
    assert.deepEqual(importer.state(), { width: 1, height: 1, data: [['wood']], rebuilds: 1 });
    assert.equal(importer.importInput.value, '');
    assert.equal(importer.pending(), false);
});
