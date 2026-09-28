const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, 'src');
const OUTPUT = path.join(__dirname, 'game.js');
const FIRST = ['game-data.js', 'water-pipeline.js', 'art.js', 'world.js', 'environment.js', 'fish.js', 'fishing.js', 'treasure.js', 'ui.js'];
const LAST = ['automated-tests.js', 'phaser.js'];

function buildBundle() {
    const files = fs.readdirSync(SOURCE).filter(file => file.endsWith('.js'));
    const middle = files.filter(file => !FIRST.includes(file) && !LAST.includes(file)).sort();
    const order = [...FIRST, ...middle, ...LAST].filter(file => files.includes(file));
    const bundle = order
        .map(file => fs.readFileSync(path.join(SOURCE, file), 'utf8'))
        .join('\n')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n');

    fs.writeFileSync(OUTPUT, `${bundle}\n`);
    console.log(`Bundled ${order.length} scripts into game.js (${Math.round(Buffer.byteLength(bundle) / 1024)} KB)`);
}

buildBundle();
