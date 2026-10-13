const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {decodePng} = require('../build-atlas');

function createPortraitPeople(seed = '13') {
    const sourceImages = new Map(), textures = new Map(), root = path.join(__dirname, '..');
    const read = key => {if (!sourceImages.has(key)) {const image = decodePng(path.join(root, 'media', key === 'character-parts' ? 'characters/people/parts.png' : key + '.png')); sourceImages.set(key, {width: image.width, height: image.height, data: image.rgba});} return sourceImages.get(key);};
    const scene = {textures: {exists: key => textures.has(key), createCanvas(key, width, height) {const texture = {width, height, getContext() {return {createImageData: (w, h) => ({width: w, height: h, data: new Uint8ClampedArray(w * h * 4)}), putImageData(image) {texture.data = image.data;}};}, refresh() {}}; textures.set(key, texture); return texture;}}};
    const context = vm.createContext({TEST_MODE: false, URLSearchParams, Uint8ClampedArray, scene, window: {location: {search: '?seed=' + seed}}, localStorage: {getItem() {return null;}, setItem() {}}, Phaser: {Math: {Clamp: (value, low, high) => Math.max(low, Math.min(high, value))}}, getTerrainPixels: (scene, key) => read(key)});
    const files = ['game-data.js', 'runtime/settings.js', 'runtime/state.js', 'npc-names.js', 'npc-dialogue.js', 'art/textures.js', 'art/people.js', 'art/portraits.js', 'world/terrain.js', 'world/decks.js', 'environment/props.js', 'environment/actors.js', 'environment/npcs.js'];
    vm.runInContext(files.map(file => fs.readFileSync(path.join(root, 'src', file), 'utf8')).join('\n'), context);
    return {run: code => vm.runInContext(code, context), read, textures, scene};
}

module.exports = {createPortraitPeople};
