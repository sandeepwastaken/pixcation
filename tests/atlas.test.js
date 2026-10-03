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

function withScanlines(raw, check) {
    const encoded = encodePng(2, 2, pixels);
    const idat = 33; // Signature and the IHDR chunk emitted by encodePng.
    const end = idat + encoded.readUInt32BE(idat) + 12;
    const fixture = Buffer.concat([encoded.subarray(0, idat), pngChunk('IDAT', zlib.deflateSync(raw)), encoded.subarray(end)]);
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
