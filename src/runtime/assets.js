function preload() {
    this.load.atlas('atlas', withCacheBuster('media/atlas.png'), withCacheBuster('media/atlas.json'));
}

function getTextureAliases() {
    const aliases = [];
    const alias = (key, path) => aliases.push([key, path]);
    const tileKeys = [
        'dirt1', 'dirtEdge', 'cornerDirt1', 'cornerDirt2', 'cornerDirt3', 'dirtEdgeCorner',
        'dirtEdgeOuterLeft', 'dirtEdgeOuterRight', 'dirtEdgeOuterBoth', 'dirtEdgeInnerLeft', 'dirtEdgeInnerRight',
        'dirtCliffCorner', 'waterDirtInnerLeft', 'waterDirtInnerRight', 'corner',
        'grass1', 'grass2', 'grass3', 'grass4', 'grassEdge', 'water', 'waterDirt', 'waterGrass',
        'wood', 'woodLeft', 'woodRight', 'transition1', 'transition2', 'transition3', 'transition4'
    ];

    for (const direction of ['front', 'back', 'left', 'right']) {
        for (const step of ['', 'walk1', 'walk2']) {
            alias(`character-${direction}${step}`, `characters/player/${direction}${step}`);
        }
    }

    for (const tileKey of tileKeys) {
        alias(tileKey, `environment/terrain/${tileKey}`);
    }

    for (const key of ['bush', 'boulder', 'rock', 'tree-bare', 'store']) {
        alias(key, `environment/objects/${key}`);
    }

    for (const mood of ['friendly', 'laughing', 'surprised']) {
        alias(`guide-portrait-${mood}`, `characters/guide/${mood}`);
    }

    for (const rod of MARKET_RODS) {
        alias(rod.texture, `items/rods/${rod.id}`);
        alias(rod.icon, `items/rods/${rod.id}-icon`);
    }

    for (const bait of MARKET_BAITS) {
        alias(bait.texture, `items/baits/${bait.id}Bait`);
        alias(bait.icon, `items/baits/${bait.id}-icon`);
    }

    alias('hotbar', 'ui/hud/hotbar');
    alias('selected', 'ui/hud/selected');
    alias('shop-ui', 'ui/shop/panel');
    alias('guide', 'characters/guide/sprite');
    alias('chest', 'items/chest');
    alias('fishing-ui', 'ui/fishing/panel');
    alias('fishing-catch-zone', 'ui/fishing/catch-zone');
    alias('fishing-fish', 'ui/fishing/fish');
    alias('fishing-progress', 'ui/fishing/progress');
    alias('waterOverlay', 'environment/effects/water-overlay');
    alias('shimmer-art', 'environment/effects/shimmer');
    return aliases;
}

function unpackAtlas(scene) {
    const atlas = scene.textures.get('atlas');
    const source = atlas.getSourceImage();
    const paths = new Map(getTextureAliases().map(([key, path]) => [path, key]));

    for (const path of atlas.getFrameNames()) {
        const frame = atlas.get(path);
        const canvas = document.createElement('canvas');

        canvas.width = frame.cutWidth;
        canvas.height = frame.cutHeight;
        canvas.getContext('2d').drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
        scene.textures.addCanvas(paths.get(path) || path, canvas);
    }

    scene.textures.remove('atlas');
}
