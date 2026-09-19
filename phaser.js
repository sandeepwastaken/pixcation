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
// add assets to preload here
}

function create() {
    this.add.text(400, 300, 'wassup', {
        fontsize: '32px',
        fill: '#fff'
    }).setOrigin(0.5, 0.5);
}

function update() {
    // loop goes here
}