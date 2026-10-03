const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { decodePng, encodePng } = require('../build-atlas');

const pixels = Buffer.from([
    10, 20, 30, 255, 40, 50, 60, 128,
    70, 80, 90, 64, 100, 110, 120, 0
]);

function pngChunk(name, data) {
    const header = Buffer.alloc(8);
    header.writeUInt32BE(data.length);
    header.write(name, 4);
    const payload = Buffer.concat([header.subarray(4), data]);
    let crc = -1;
    for (const byte of payload) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0);
    }
    const footer = Buffer.alloc(4);
    footer.writeUInt32BE((crc ^ -1) >>> 0);
    return Buffer.concat([header, data, footer]);
}

function withScanlines(raw, check, { type = 6, transparency = null } = {}) {
    const encoded = encodePng(2, 2, pixels);
    const idat = 33; // Signature and the IHDR chunk emitted by encodePng.
    const end = idat + encoded.readUInt32BE(idat) + 12;
    const header = Buffer.from(encoded.subarray(16, 29));
    header[9] = type;
    const fixture = Buffer.concat([
        encoded.subarray(0, 8), pngChunk('IHDR', header),
        ...(transparency ? [pngChunk('tRNS', transparency)] : []),
        pngChunk('IDAT', zlib.deflateSync(raw)), encoded.subarray(end)
    ]);
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pixcation-png-'));
    const file = path.join(directory, 'fixture.png');
    try {
        fs.writeFileSync(file, fixture);
        check(file);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

test('RGBA decoding preserves colors and alpha through all five row filters', () => {
    const filteredRows = [
        [70, 80, 90, 64, 100, 110, 120, 0],
        [70, 80, 90, 64, 30, 30, 30, 192],
        [60, 60, 60, 65, 60, 60, 60, 128],
        [65, 70, 75, 193, 45, 45, 45, 160],
        [60, 60, 60, 65, 30, 30, 30, 192]
    ];
    filteredRows.forEach((row, filter) => {
        const raw = Buffer.from([0, ...pixels.subarray(0, 8), filter, ...row]);
        withScanlines(raw, file => {
            const image = decodePng(file);
            assert.equal(image.width, 2);
            assert.equal(image.height, 2);
            assert.deepEqual(image.rgba, pixels);
        });
    });
});

test('unsupported PNG row filters fail instead of producing zeroed pixels', () => {
    for (const filter of [5, 255]) {
        withScanlines(Buffer.from([0, ...pixels.subarray(0, 8), filter, ...pixels.subarray(8)]), file => {
            assert.throws(() => decodePng(file), /Unsupported PNG row filter/);
        });
    }
});

test('truncated and excess inflated scanlines are rejected', () => {
    const complete = Buffer.from([0, ...pixels.subarray(0, 8), 0, ...pixels.subarray(8)]);
    for (const raw of [Buffer.alloc(0), complete.subarray(0, -1), Buffer.concat([complete, Buffer.from([0])])]) {
        withScanlines(raw, file => assert.throws(() => decodePng(file), /invalid PNG scanline length/));
    }
});

test('grayscale color keys retain gray values and make only matching pixels transparent', () => {
    const raw = Buffer.from([0, 0, 80, 0, 81, 80]);
    for (const transparentGray of [0, 80, 255, 0x1250]) {
        const transparency = Buffer.alloc(2);
        transparency.writeUInt16BE(transparentGray);
        const expected = Buffer.from([0, 80, 81, 80].flatMap(gray => [gray, gray, gray, gray === (transparentGray & 255) ? 0 : 255]));
        withScanlines(raw, file => assert.deepEqual(decodePng(file).rgba, expected), { type: 0, transparency });
    }
    withScanlines(raw, file => assert.deepEqual(decodePng(file).rgba, Buffer.from([
        0, 0, 0, 255, 80, 80, 80, 255, 81, 81, 81, 255, 80, 80, 80, 255
    ])), { type: 0 });
});

test('RGB color keys require all three channels to match and retain opaque neighbors', () => {
    const colors = [[10, 20, 30], [10, 20, 31], [10, 21, 30], [11, 20, 30]];
    const raw = Buffer.from([0, ...colors[0], ...colors[1], 0, ...colors[2], ...colors[3]]);
    const transparency = Buffer.from([0, 10, 0, 20, 0, 30]);
    const expected = Buffer.from(colors.flatMap((color, index) => [...color, index === 0 ? 0 : 255]));
    withScanlines(raw, file => assert.deepEqual(decodePng(file).rgba, expected), { type: 2, transparency });
    withScanlines(raw, file => assert.deepEqual(decodePng(file).rgba, expected), {
        type: 2, transparency: Buffer.from([1, 10, 2, 20, 3, 30])
    });
    withScanlines(raw, file => assert.deepEqual(decodePng(file).rgba, Buffer.from(
        colors.flatMap(color => [...color, 255])
    )), { type: 2 });
});
