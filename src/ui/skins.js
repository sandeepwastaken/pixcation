const UI_SKIN_FILES = {backdrop: 'common/backdrop.png', button: 'widgets/button.png', 'button-selected': 'widgets/button-selected.png', input: 'widgets/input.png', 'slider-track': 'widgets/slider-track.png', 'slider-knob': 'widgets/slider-knob.png', 'select-arrow': 'widgets/select-arrow.png', 'arrow-up': 'widgets/arrow-up.png', 'arrow-left': 'widgets/arrow-left.png', 'arrow-right': 'widgets/arrow-right.png', 'creator-panel': 'creator/panel.png', 'sprite-frame': 'creator/sprite-frame.png', 'settings-button': 'settings/button.png', 'settings-panel': 'settings/panel.png', 'volume-track': 'settings/volume-track.png', bite: 'fishing/bite.png'};
function isUiPlaceholder(pixels) {
    for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) {const offset = (y * pixels.width + x) * 4, expected = x === 0 || y === 0 || x === pixels.width - 1 || y === pixels.height - 1 ? 0 : 255; if (pixels.data[offset] !== expected || pixels.data[offset + 1] !== expected || pixels.data[offset + 2] !== expected || pixels.data[offset + 3] !== 255) return false;} return true;
}
function getUiSkinPixels(scene, skin) {
    const cache = scene.uiSkinPixels ||= new Map(); if (cache.has(skin)) return cache.get(skin);
    const pixels = getTerrainPixels(scene, 'ui-skin-' + skin); pixels.placeholder = isUiPlaceholder(pixels); cache.set(skin, pixels); return pixels;
}
function getUiSkinUrl(scene, skin, color = 0x36160d) {
    const pixels = getUiSkinPixels(scene, skin), cache = scene.uiSkinUrls ||= new Map(), id = pixels.placeholder ? skin + ':' + color : skin; if (cache.has(id)) return cache.get(id);
    const canvas = document.createElement('canvas'); canvas.width = pixels.width; canvas.height = pixels.height;
    const context = canvas.getContext('2d'), image = context.createImageData(pixels.width, pixels.height); image.data.set(pixels.data);
    if (pixels.placeholder) for (let offset = 0; offset < image.data.length; offset += 4) if (image.data[offset] === 255) {image.data[offset] = color >> 16 & 255; image.data[offset + 1] = color >> 8 & 255; image.data[offset + 2] = color & 255;}
    context.putImageData(image, 0, 0); const url = canvas.toDataURL(); cache.set(id, url); return url;
}
function uiPngBackground(scene, skin, color = 0x36160d) { const url = getUiSkinUrl(scene, skin, color); return skin === 'button' || skin === 'button-selected' ? {background: 'none', border: '1px solid transparent', borderImage: `url("${url}") 1 fill stretch`, imageRendering: 'pixelated'} : {backgroundColor: 'transparent', backgroundImage: `url("${url}")`, backgroundSize: '100% 100%', imageRendering: 'pixelated', border: '0'}; }
function pngControlStyles(scene, scope) {
    const url = (skin, color) => `url("${getUiSkinUrl(scene, skin, color)}")`, track = scope === '.game-settings' ? 'volume-track' : 'slider-track';
return `${scope} select,${scope} button{font:11px m6x11,monospace;color:#e0f2fd;border:1px solid transparent;border-radius:0;height:18px;box-sizing:border-box;image-rendering:pixelated;background:none;border-image:${url('button')} 1 fill stretch;text-shadow:1px 1px #000}${scope} select{appearance:none;width:92px;padding:0 9px 0 3px;border-image:none;border:0;background-image:${url('select-arrow')},${url('input')};background-size:7px 7px,100% 100%;background-position:right 2px center,0 0;background-repeat:no-repeat}${scope} option{background:#230a03;color:#e0f2fd}${scope} button{cursor:pointer}${scope} button:hover,${scope} button:focus-visible{border-image:${url('button-selected')} 1 fill stretch}${scope} input[type=range]{appearance:none;width:92px;height:6px;border:0;border-radius:0;margin:0;cursor:ew-resize;background:${url(track)} 0 0/100% 100%;image-rendering:pixelated}${scope} input[type=range]::-webkit-slider-thumb{appearance:none;width:5px;height:12px;border:0;border-radius:0;background:${url('slider-knob')} 0 0/100% 100%;image-rendering:pixelated}${scope} input[type=range]::-moz-range-thumb{width:5px;height:12px;border:0;border-radius:0;background:${url('slider-knob')} 0 0/100% 100%;image-rendering:pixelated}${scope} *{scrollbar-width:none}`;
}
const transientUiImages = new Set();
function hideTransientUi() {for (const image of transientUiImages) if (image.visible) image.setVisible(false);}
function showBiteIndicator(scene, x, y, depth) {
    if (!biteIndicator) {const pixels = getUiSkinPixels(scene, 'bite'); biteIndicator = scene.add.container(0, 0); biteIndicator.add(scene.add.image(-Math.floor(pixels.width / 2), -pixels.height, 'ui-skin-bite').setOrigin(0)); worldObjectLayer?.add(biteIndicator); transientUiImages.add(biteIndicator);}
    biteIndicator.setPosition(Math.round(x), Math.round(y)).setDepth(depth).setVisible(true);
}
