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
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    parent: 'game-container',
    
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

class WaterWarpPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game) {
        super({
            game,
            fragShader: `
                precision mediump float;

                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform float uOpacity;
                varying vec2 outTexCoord;
                varying vec4 outTint;

                void main() {
                    vec2 uv = outTexCoord;
                    vec2 grid = vec2(32.0);

                    float x = floor(sin(floor(uv.y * grid.y) * 0.8 + uTime) * 0.51);
                    float y = floor(cos(floor(uv.x * grid.x) * 0.7 + uTime * 0.8) * 0.51);

                    uv += vec2(x, y) / grid;

                    uv = (floor(uv * grid) + 0.5) / grid;

                    vec4 color = texture2D(uMainSampler, uv);
                    color.rgb *= outTint.rgb * uOpacity;
                    color.a = 1.0;
                    gl_FragColor = color;
                }
            `
        });
    }
}

const game = new Phaser.Game(config);
let waterOverlay;
let waterCells = [];

function preload() {
    const assetVersion = Date.now();
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
        this.load.image(tileKey, `media/${tileKey}.png?v=${assetVersion}`);
    });

    this.load.image('waterOverlay', `media/waterOverlay.png?v=${assetVersion}`);
    this.load.spritesheet('shimmer', `media/shimmer.png?v=${assetVersion}`, {
        frameWidth: 12,
        frameHeight: 1
    });

    this.load.json('map', `map.json?v=${Date.now()}`); // cache-buster
}

function create() {
    const map = this.cache.json.get('map');

    this.game.renderer.pipelines.add(
        'WaterWarp',
        new WaterWarpPipeline(this.game)
    );

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tileKey = map.data[y][x];
            if (tileKey == null) continue;
            if (tileKey == 'woodLeft' || tileKey == 'woodRight'){
                this.add.image(x * map.tileSize, y * map.tileSize, 'water')
                .setOrigin(0);
            };
            this.add.image(x * map.tileSize, y * map.tileSize, tileKey)
            .setOrigin(0);

            if (tileKey.toLowerCase().includes('water')) {
                waterCells.push({
                    x: x * map.tileSize,
                    y: y * map.tileSize,
                    width: map.tileSize,
                    height: map.tileSize
                 });
            }
        }
    }

    const waterMaskGraphics = this.make.graphics({
        x: 0,
        y: 0,
        add: false
    });

    waterCells.forEach((cell) => {
        waterMaskGraphics.fillRect(cell.x, cell.y, cell.width, cell.height);
    });

    waterOverlay = this.add.tileSprite(
        0,
        0,
        map.width * map.tileSize,
        map.height * map.tileSize,
        'waterOverlay'
    )
        .setOrigin(0)
        .setAlpha(1)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setMask(waterMaskGraphics.createGeometryMask());

    waterOverlay.setPipeline('WaterWarp');
    waterOverlay.pipeline.set1f('uOpacity', 0.2);

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    })

    for (let index = 0; index < 8; index++) {
        spawnShimmer(this);
    }

    this.time.addEvent({
        delay: 450,
        loop: true,
        callback: () => spawnShimmer(this)
    });
}

function spawnShimmer(scene) {
    if (waterCells.length === 0) return;

    const cell = Phaser.Utils.Array.GetRandom(waterCells);
    const shimmer = scene.add.sprite(
        cell.x + Phaser.Math.Between(0, cell.width - 12),
        cell.y + Phaser.Math.Between(0, cell.height - 1),
        'shimmer',
        0
    )
        .setOrigin(0)
        .setBlendMode(Phaser.BlendModes.NORMAL);

    shimmer.play('shimmer');
    shimmer.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        () => shimmer.destroy()
    );
}

function update(time, delta) {
    if (!waterOverlay) return;

    waterOverlay.pipeline.set1f('uTime', time * 0.003);
    waterOverlay.tilePositionX += delta * 0.01;
    waterOverlay.tilePositionY += delta * 0.006;
}