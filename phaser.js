const config = {
    type: Phaser.AUTO,
    
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
    this.load.image('grass', 'media/grass.png');
}

function create() {
    const tileSize = 16;
    const gap = 0;
    const spacing = tileSize + gap;

    for (let y = 0; y < this.scale.height; y += spacing) {
        for (let x = 0; x < this.scale.width; x += spacing) {
            this.add.image(x, y, 'grass').setOrigin(0);
        }
    }
}

function update() {
    // loop goes here
}