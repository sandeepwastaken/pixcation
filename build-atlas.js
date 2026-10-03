const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MEDIA = path.join(__dirname, 'media');
const OUTPUT_IMAGE = path.join(MEDIA, 'atlas.png');
const OUTPUT_DATA = path.join(MEDIA, 'atlas.json');
const PADDING = 1;
const MAX_WIDTH = 1024;
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, byte) => {
    let crc = byte;
    for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0);
    return crc;
});

function findImages(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) return findImages(file);
        return entry.name.endsWith('.png') && file !== OUTPUT_IMAGE ? [file] : [];
    });
}

function getFilterPrediction(filter, left, up, corner) {
    if (filter === 0) return 0;
    if (filter === 1) return left;
    if (filter === 2) return up;
    if (filter === 3) return (left + up) >> 1;
    if (filter !== 4) throw new Error(`Unsupported PNG row filter: ${filter}`);

    const estimate = left + up - corner;
    const leftDistance = Math.abs(estimate - left);
    const upDistance = Math.abs(estimate - up);
    const cornerDistance = Math.abs(estimate - corner);

    return leftDistance <= upDistance && leftDistance <= cornerDistance
        ? left
        : upDistance <= cornerDistance ? up : corner;
}

function decodePng(file) {
    const buffer = fs.readFileSync(file);
    const chunks = [];
    let width, height, depth, type, interlace, palette, transparency;

    for (let offset = 8; offset < buffer.length;) {
        const length = buffer.readUInt32BE(offset);
        const name = buffer.toString('ascii', offset + 4, offset + 8);
        const data = buffer.subarray(offset + 8, offset + 8 + length);

        if (name === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            [depth, type] = [data[8], data[9]];
            interlace = data[12];
        } else if (name === 'PLTE') {
            palette = data;
        } else if (name === 'tRNS') {
            transparency = data;
        } else if (name === 'IDAT') {
            chunks.push(data);
        }

        offset += length + 12;
    }

    if (depth !== 8 || interlace || !(type in CHANNELS)) {
        throw new Error(`${path.relative(__dirname, file)} must be an 8-bit, non-interlaced PNG`);
    }

    const channels = CHANNELS[type];
    const stride = width * channels;
    const raw = zlib.inflateSync(Buffer.concat(chunks));
    if (raw.length !== (stride + 1) * height) {
        throw new Error(`${path.relative(__dirname, file)} has an invalid PNG scanline length`);
    }
    const pixels = Buffer.alloc(stride * height);

    for (let y = 0; y < height; y++) {
        const sourceRow = y * (stride + 1) + 1;
        const filter = raw[sourceRow - 1];
        const row = y * stride;

        if (filter === 0) {
            raw.copy(pixels, row, sourceRow, sourceRow + stride);
            continue;
        }

        for (let x = 0; x < stride; x++) {
            const value = raw[sourceRow + x];
            const left = x >= channels ? pixels[row + x - channels] : 0;
            const up = y ? pixels[row - stride + x] : 0;
            const corner = x >= channels && y ? pixels[row - stride + x - channels] : 0;
            pixels[row + x] = value + getFilterPrediction(filter, left, up, corner);
        }
    }

    if (type === 6) return { width, height, rgba: pixels };

    const rgba = Buffer.alloc(width * height * 4);
    const transparentGray = type === 0 && transparency ? transparency.readUInt16BE(0) & 255 : -1;
    const transparentRGB = type === 2 && transparency
        ? [transparency.readUInt16BE(0) & 255, transparency.readUInt16BE(2) & 255, transparency.readUInt16BE(4) & 255] : null;

    for (let pixel = 0; pixel < width * height; pixel++) {
        const source = pixel * channels;
        const target = pixel * 4;

        if (type === 3) {
            const index = pixels[source];
            palette.copy(rgba, target, index * 3, index * 3 + 3);
            rgba[target + 3] = transparency && index < transparency.length ? transparency[index] : 255;
        } else if (type === 0 || type === 4) {
            rgba.fill(pixels[source], target, target + 3);
            rgba[target + 3] = type === 4 ? pixels[source + 1] : pixels[source] === transparentGray ? 0 : 255;
        } else {
            pixels.copy(rgba, target, source, source + 3);
            rgba[target + 3] = transparentRGB && pixels[source] === transparentRGB[0] &&
                pixels[source + 1] === transparentRGB[1] && pixels[source + 2] === transparentRGB[2] ? 0 : 255;
        }
    }

    return { width, height, rgba };
}

function crc32(buffer) {
    let crc = -1;

    for (const byte of buffer) {
        crc = crc >>> 8 ^ CRC_TABLE[(crc ^ byte) & 255];
    }

    return (crc ^ -1) >>> 0;
}

function encodePng(width, height, rgba) {
    const chunk = (name, data) => {
        const header = Buffer.alloc(8);
        const footer = Buffer.alloc(4);
        header.writeUInt32BE(data.length);
        header.write(name, 4, 'ascii');
        footer.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), data])));
        return Buffer.concat([header, data, footer]);
    };
    const info = Buffer.alloc(13);
    const raw = Buffer.alloc((width * 4 + 1) * height);

    info.writeUInt32BE(width);
    info.writeUInt32BE(height, 4);
    info.set([8, 6, 0, 0, 0], 8);

    for (let y = 0; y < height; y++) {
        rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    }

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', info),
        chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

function buildAtlas() {
    const images = findImages(MEDIA)
        .map(file => ({ name: path.relative(MEDIA, file).replace(/\\/g, '/').replace(/\.png$/, ''), ...decodePng(file) }))
        .sort((a, b) => b.height - a.height || b.width - a.width || a.name.localeCompare(b.name));
    const area = images.reduce((total, image) => total + (image.width + PADDING) * (image.height + PADDING), 0);
    const width = Math.min(MAX_WIDTH, Math.max(Math.ceil(Math.sqrt(area) * 1.15), ...images.map(image => image.width)));
    let x = 0;
    let y = 0;
    let shelf = 0;

    for (const image of images) {
        if (x + image.width > width) {
            x = 0;
            y += shelf + PADDING;
            shelf = 0;
        }

        Object.assign(image, { x, y });
        x += image.width + PADDING;
        shelf = Math.max(shelf, image.height);
    }

    const height = y + shelf;
    const rgba = Buffer.alloc(width * height * 4);
    const frames = {};

    for (const image of images) {
        for (let row = 0; row < image.height; row++) {
            image.rgba.copy(rgba, ((image.y + row) * width + image.x) * 4, row * image.width * 4, (row + 1) * image.width * 4);
        }

        frames[image.name] = {
            frame: { x: image.x, y: image.y, w: image.width, h: image.height },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: image.width, h: image.height },
            sourceSize: { w: image.width, h: image.height }
        };
    }

    fs.writeFileSync(OUTPUT_IMAGE, encodePng(width, height, rgba));
    fs.writeFileSync(OUTPUT_DATA, JSON.stringify({ frames, meta: { image: 'atlas.png', size: { w: width, h: height }, scale: 1 } }, null, 1));
    console.log(`Packed ${images.length} images into media/atlas.png (${width}x${height})`);
}

if (require.main === module) buildAtlas();

module.exports = { buildAtlas, decodePng, encodePng };
