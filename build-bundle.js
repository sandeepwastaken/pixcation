const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = path.join(__dirname, 'src');
const OUTPUT = path.join(__dirname, 'game.js');
const ORDER = require('./bundle-order.json');

function getSourceFiles(directory, prefix = '') {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = prefix + entry.name;
        if (entry.isDirectory()) return getSourceFiles(path.join(directory, entry.name), `${file}/`);
        return entry.isFile() && file.endsWith('.js') ? [file] : [];
    });
}

function validateBundleOrder(files, order) {
    if (!Array.isArray(order) || !order.length || order.some(file => typeof file !== 'string' || !file.endsWith('.js'))) {
        throw new Error('Bundle order must be a nonempty list of JavaScript source paths');
    }

    const sources = new Set(files);
    const listed = new Set(order);
    const missing = order.filter(file => !sources.has(file));
    const unlisted = files.filter(file => !listed.has(file));

    if (listed.size !== order.length || missing.length || unlisted.length) {
        throw new Error(`Invalid bundle order: duplicate entries=${order.length - listed.size}, missing=[${missing.join(', ')}], unlisted=[${unlisted.join(', ')}]`);
    }
}

function buildBundle({ source = SOURCE, output = OUTPUT, order = ORDER } = {}) {
    validateBundleOrder(getSourceFiles(source), order);
    const bundle = order.map(file => fs.readFileSync(path.join(source, file), 'utf8')).join('\n') + '\n';

    // Check the shared script scope before replacing the playable bundle.
    new vm.Script(bundle, { filename: output });
    fs.writeFileSync(output, bundle);
    return { scripts: order.length, bytes: Buffer.byteLength(bundle) };
}

if (require.main === module) {
    const { scripts, bytes } = buildBundle();
    console.log(`Bundled ${scripts} scripts into game.js (${Math.round(bytes / 1024)} KB)`);
}

module.exports = { buildBundle };
