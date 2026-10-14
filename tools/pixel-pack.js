function pixelArtId(key) {
    if (key === 'character-parts') key = 'characters/people/parts';
    let hash = 2166136261;
    for (let index = 0; index < key.length; index++) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
    return hash >>> 0;
}
function indexPixelArt(data) {
    const bytes = new Uint8Array(data.buffer || data, data.byteOffset || 0, data.byteLength), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), entries = new Map();
    if (bytes.length < 2) throw new Error('Truncated pixel pack');
    let offset = 2;
    for (let index = 0; index < view.getUint16(0, true); index++) {
        if (offset + 14 > bytes.length) throw new Error('Truncated pixel record');
        const id = view.getUint32(offset, true), width = view.getUint16(offset + 4, true), height = view.getUint16(offset + 6, true), colors = view.getUint16(offset + 8, true), runs = view.getUint32(offset + 10, true), palette = offset + 14, end = palette + colors * 4 + runs * 2;
        if (!width || !height || width * height > 1048576 || !colors || colors > 256 || end > bytes.length || entries.has(id)) throw new Error('Invalid pixel record');
        entries.set(id, {width, height, colors, runs, palette}); offset = end;
    }
    if (offset !== bytes.length) throw new Error('Trailing pixel pack data');
    return {bytes, view, entries, littleEndian: new Uint8Array(new Uint32Array([1]).buffer)[0] === 1};
}
function decodePixelArt(pack, key) {
    const entry = pack.entries.get(pixelArtId(key)); if (!entry) return null;
    const {width, height, colors, runs, palette} = entry, data = new Uint8ClampedArray(width * height * 4), words = new Uint32Array(data.buffer);
    let pixel = 0, offset = palette + colors * 4;
    for (let run = 0; run < runs; run++, offset += 2) {
        const count = pack.bytes[offset], color = pack.bytes[offset + 1];
        if (!count || color >= colors || pixel + count > words.length) throw new Error('Invalid pixel run');
        words.fill(pack.view.getUint32(palette + color * 4, pack.littleEndian), pixel, pixel + count); pixel += count;
    }
    if (pixel !== words.length) throw new Error('Incomplete pixel image');
    return {width, height, data};
}
if (typeof module !== 'undefined' && module.exports) module.exports = {pixelArtId, indexPixelArt, decodePixelArt};
