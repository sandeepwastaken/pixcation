const APP_CACHE_BUSTER = window.APP_CACHE_BUSTER;
const APP_QUERY = new URLSearchParams(window.location.search);
const TEST_MODE = APP_QUERY.has('test');
const CHEATS_ENABLED = APP_QUERY.get('cheats') === 'true';

const withCacheBuster = (path) => `${path}?v=${APP_CACHE_BUSTER}`;

function getPixelPerfectZoom() {
    const ratio = window.devicePixelRatio || 1;
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    const scale = Math.floor(Math.min(width * ratio / 320, height * ratio / 192));

    return Math.max(1, scale) / ratio;
}

let resizeFrame = 0;

window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        if (game) {
            const zoom = getPixelPerfectZoom();
            if (game.scale.zoom !== zoom) game.scale.setZoom(zoom);
        }
    });
});

window.addEventListener('beforeunload', saveProgress);

const config = {
    type: Phaser.AUTO,

    width: 320,
    height: 192,

    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },

    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
        zoom: getPixelPerfectZoom()
    },

    parent: 'game-container',

    dom: {
        createContainer: true
    },

    loader: {
        maxParallelDownloads: 6
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

let game;

document.fonts.load('16px m6x11').finally(() => {
    config.scale.zoom = getPixelPerfectZoom();
    game = new Phaser.Game(config);
});
