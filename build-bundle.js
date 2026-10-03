const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, 'src');
const OUTPUT = path.join(__dirname, 'game.js');
const ORDER = require('./bundle-order.json');

function getSourceFiles(directory = SOURCE, prefix = '') {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = prefix + entry.name;
        if (entry.isDirectory()) return getSourceFiles(path.join(directory, entry.name), `${file}/`);
        return entry.isFile() && file.endsWith('.js') ? [file] : [];
    });
}

function validateBundleOrder(files) {
    const sources = new Set(files);
    const listed = new Set(ORDER);
    const missing = ORDER.filter(file => !sources.has(file));
    const unlisted = files.filter(file => !listed.has(file));

    if (listed.size !== ORDER.length || missing.length || unlisted.length) {
        throw new Error(`Invalid bundle order: duplicate entries=${ORDER.length - listed.size}, missing=[${missing.join(', ')}], unlisted=[${unlisted.join(', ')}]`);
    }
}

function buildBundle() {
    validateBundleOrder(getSourceFiles());
    const bundle = ORDER
        .map(file => fs.readFileSync(path.join(SOURCE, file), 'utf8'))
        .join('\n')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n');

    fs.writeFileSync(OUTPUT, `${bundle}\n`);
    console.log(`Bundled ${ORDER.length} scripts into game.js (${Math.round(Buffer.byteLength(bundle) / 1024)} KB)`);
}

buildBundle();
