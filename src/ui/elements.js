function isMenuOpen() {
    return dialogueOpen || marketOpen || mapOpen || inventoryOpen || statsOpen;
}

function drawPanelFrame(panel, x, width, height) {
    return panel
        .fillStyle(0x230a03, 1)
        .fillRect(x, 0, width, height)
        .fillStyle(0xacccf9, 1)
        .fillRect(x + 1, 1, width - 2, height - 2)
        .fillStyle(0x465989, 1)
        .fillRect(x + 2, 2, width - 4, height - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(x + 3, 3, width - 6, height - 6);
}

const CRISP_TEXT_STYLE = { textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased' };

function createTextLayer(height, style) {
    const layer = document.createElement('div');

    Object.assign(layer.style, {
        position: 'relative',
        width: '320px',
        height: `${height}px`,
        fontFamily: 'm6x11, monospace',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none'
    }, style);

    return layer;
}

function createUIText(layer, x, y, color, width, align, style) {
    const text = document.createElement('div');

    Object.assign(text.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: width ? `${width}px` : 'auto',
        textAlign: align || 'left',
        whiteSpace: 'nowrap'
    }, color && { color }, style);

    layer.appendChild(text);
    return text;
}

function setUITextContent(element, content) {
    const text = content == null ? '' : String(content);
    if (element.textContent !== text) element.textContent = text;
}

function addHudLayer(scene, element, y, depth) {
    const layer = scene.add.dom(0, y, element)
        .setOrigin(0)
        .setDepth(depth)
        .setScrollFactor(0)
        .setVisible(false);

    layer.pointerEvents = 'none';
    return layer;
}

function addPanelContainer(scene, y, depth, children) {
    return scene.add.container(0, y, children)
        .setDepth(depth)
        .setScrollFactor(0)
        .setVisible(false);
}

function appendKeyHints(element, hints) {
    for (const [key, label] of hints) {
        const keycap = document.createElement('span');
        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            margin: '0 4px 0 10px'
        });

        element.append(keycap, label);
    }

    return element;
}
