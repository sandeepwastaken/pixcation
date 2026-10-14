const fs = require('node:fs');
const path = require('node:path');
const {buildBundle} = require('./build-bundle');
const {buildAtlas} = require('./build-atlas');
function copyPublicMedia(source, output, relative = '') {
    for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
        const name = path.posix.join(relative, entry.name);
        if (name === 'characters/people' || entry.name === 'legacy' || entry.name === 'legacy.png' || entry.name.startsWith('.') || /\.(psd|md)$/i.test(entry.name)) continue;
        const from = path.join(source, entry.name), to = path.join(output, entry.name);
        if (entry.isDirectory()) {fs.mkdirSync(to, {recursive: true}); copyPublicMedia(from, to, name);}
        else if (entry.isFile()) fs.copyFileSync(from, to);
    }
}
function buildSite({output = path.join(__dirname, 'dist'), rebuild = true} = {}) {
    const root = path.resolve(output);
    if (fs.existsSync(root) && fs.readdirSync(root).length) throw new Error('Publish directory must be empty; choose a new output directory');
    if (rebuild) {buildAtlas(); buildBundle();}
    fs.mkdirSync(path.join(root, 'media'), {recursive: true});
    for (const file of ['index.html', 'game.js']) fs.copyFileSync(path.join(__dirname, file), path.join(root, file));
    copyPublicMedia(path.join(__dirname, 'media'), path.join(root, 'media'));
    return root;
}
if (require.main === module) console.log('Publish files ready at ' + buildSite());
module.exports = {buildSite, copyPublicMedia};
