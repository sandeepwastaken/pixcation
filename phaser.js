const config = {
    type: Phaser.AUTO,

    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    parent: 'game-container',
    
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

const game = new Phaser.Game(config);

function preload() {
    const tileKeys = [
        'dirt1',
        'dirtEdge',
        'grass1',
        'grass2',
        'grass3',
        'grass4',
        'grassEdge',
        'water',
        'waterDirt',
        'waterGrass',
        'wood',
        'woodLeft',
        'woodRight'
    ];

    tileKeys.forEach(tileKey => {
        this.load.image(tileKey, `media/${tileKey}.png`);
    });

    this.load.json('map', 'map.json');
}

function create() {
    const map = this.cache.json.get('map');

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tileKey = map.data[y][x];
            if (tileKey == null) continue;

            this.add.image(x * map.tileSize, y * map.tileSize, tileKey)
            .setOrigin(0);
        }
    }
}

function update() {

}