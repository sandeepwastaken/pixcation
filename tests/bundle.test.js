const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { buildBundle } = require('../build-bundle');

function fixture(t, files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pixcation-bundle-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'src');
    const output = path.join(root, 'game.js');
    fs.mkdirSync(source);
    for (const [file, contents] of Object.entries(files)) {
        const target = path.join(source, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents);
    }
    fs.writeFileSync(output, 'previous bundle');
    return { source, output };
}

test('bundling preserves multiline strings, comments, and dependency order', t => {
    const files = {
        'first.js': 'function getText() {\n    return `first\n  indented\n\nlast`; // trailing comment\n}',
        'nested/second.js': 'globalThis.result = getText();'
    };
    const options = fixture(t, files);
    const stats = buildBundle({ ...options, order: Object.keys(files) });
    const bundle = fs.readFileSync(options.output, 'utf8');
    assert.equal(bundle, Object.values(files).join('\n') + '\n');
    const context = vm.createContext({});
    vm.runInContext(bundle, context);
    assert.equal(context.result, 'first\n  indented\n\nlast');
    assert.equal(stats.scripts, 2);
    assert.equal(stats.bytes, Buffer.byteLength(bundle));
    assert.deepEqual(fs.readdirSync(path.dirname(options.output)).sort(), ['game.js', 'src']);
});

test('invalid manifests leave the previous bundle intact', t => {
    const options = fixture(t, { 'first.js': 'const first = 1;', 'second.js': 'const second = 2;' });
    for (const order of [null, {}, [], [7], ['first.js'], ['first.js', 'missing.js'], ['first.js', 'second.js', 'first.js'], ['../first.js', 'second.js']]) {
        assert.throws(() => buildBundle({ ...options, order }), /Bundle order|Invalid bundle order/);
        assert.equal(fs.readFileSync(options.output, 'utf8'), 'previous bundle');
    }
});

test('invalid syntax and duplicate shared declarations leave the previous bundle intact', t => {
    const options = fixture(t, { 'first.js': 'const shared = 1;', 'second.js': 'const shared = 2;' });
    const order = ['first.js', 'second.js'];
    assert.throws(() => buildBundle({ ...options, order }), SyntaxError);
    fs.writeFileSync(path.join(options.source, 'second.js'), 'function broken( {');
    assert.throws(() => buildBundle({ ...options, order }), SyntaxError);
    assert.equal(fs.readFileSync(options.output, 'utf8'), 'previous bundle');
});

test('an incomplete filesystem write preserves the previous bundle and removes staging files', t => {
    const options = fixture(t, { 'first.js': 'const first = 1;' });
    const write = fs.writeFileSync;
    t.mock.method(fs, 'writeFileSync', file => {
        write(file, 'partial bundle');
        throw new Error('Write failed');
    });
    assert.throws(() => buildBundle({ ...options, order: ['first.js'] }), /Write failed/);
    assert.equal(fs.readFileSync(options.output, 'utf8'), 'previous bundle');
    assert.deepEqual(fs.readdirSync(path.dirname(options.output)).sort(), ['game.js', 'src']);
});

test('a failed replacement preserves the previous bundle and removes staging files', t => {
    const options = fixture(t, { 'first.js': 'const first = 1;' });
    t.mock.method(fs, 'renameSync', () => { throw new Error('Rename failed'); });
    assert.throws(() => buildBundle({ ...options, order: ['first.js'] }), /Rename failed/);
    assert.equal(fs.readFileSync(options.output, 'utf8'), 'previous bundle');
    assert.deepEqual(fs.readdirSync(path.dirname(options.output)).sort(), ['game.js', 'src']);
});
