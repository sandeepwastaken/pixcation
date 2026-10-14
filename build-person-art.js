const fs = require('node:fs');
const path = require('node:path');
const {pixelArtId} = require('./tools/pixel-pack');
function isPersonArt(file, media) {return path.relative(media, file).replace(/\\/g, '/').startsWith('characters/people/');}
function encodePersonArt(images) {
    if (images.length > 65535) throw new Error('Too many pixel records');
    const header = Buffer.alloc(2), records = [], ids = new Set(); header.writeUInt16LE(images.length);
    for (const {key, width, height, rgba} of images) {
        const id = pixelArtId(key), palette = [], colors = new Map(), runs = []; let last = -1, count = 0;
        if (!width || !height || width > 65535 || height > 65535 || width * height > 1048576 || rgba.length !== width * height * 4 || ids.has(id)) throw new Error('Invalid source image');
        ids.add(id);
        for (let offset = 0; offset < rgba.length; offset += 4) {
            const color = rgba.readUInt32LE(offset);
            if (!colors.has(color)) {colors.set(color, palette.length); palette.push(color);}
            if (color !== last || count === 255) {if (count) runs.push(count, colors.get(last)); last = color; count = 0;}
            count++;
        }
        if (count) runs.push(count, colors.get(last));
        if (palette.length > 256) throw new Error('Pixel image exceeds indexed palette limit');
        const record = Buffer.alloc(14 + palette.length * 4 + runs.length);
        record.writeUInt32LE(id); record.writeUInt16LE(width, 4); record.writeUInt16LE(height, 6); record.writeUInt16LE(palette.length, 8); record.writeUInt32LE(runs.length / 2, 10);
        palette.forEach((color, index) => record.writeUInt32LE(color, 14 + index * 4)); record.set(runs, 14 + palette.length * 4); records.push(record);
    }
    return Buffer.concat([header, ...records]);
}
function buildPersonArt(files, media, decode) {
    const images = files.filter(file => !path.relative(media, file).replace(/\\/g, '/').split('/').includes('legacy')).sort().map(file => ({key: path.relative(media, file).replace(/\\/g, '/').replace(/\.png$/, ''), ...decode(file)}));
    const pack = encodePersonArt(images); fs.writeFileSync(path.join(media, 'person-art.bin'), pack); return pack.length;
}
module.exports = {isPersonArt, encodePersonArt, buildPersonArt};
