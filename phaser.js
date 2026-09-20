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

const TILE_SIZE = 16;

const CHUNK_SIZE = 16;
const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE;

const CHUNK_LOAD_RADIUS = 2;
const WORLD_SEED = 6767676767676;

const loadedChunks = new Map();

let activeChunkX = null;
let activeChunkY = null;

let character;
let characterKeys;
let characterDirection = 'front';

const CHARACTER_SIZE = 16;
const CHARACTER_SPEED = 60;
const CHARACTER_ANIMATION_SPEED = 8;

let characterMoveRemainderX = 0;
let characterMoveRemainderY = 0;
let characterTextureKey = 'character-front';

let mainCamera;

let cameraScollX = 0;
let cameraScrollY = 0;

const CAMERA_EASE = 8;

const cameraTargetScroll = new Phaser.Math.Vector2();

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

    const characterFrames = [
        'front',
        'frontwalk1',
        'frontwalk2',
        'back',
        'backwalk1',
        'backwalk2',
        'left',
        'leftwalk1',
        'leftwalk2',
        'right',
        'rightwalk1',
        'rightwalk2'
    ];

    characterFrames.forEach(frame => {
        this.load.image(
            `character-${frame}`,
            `media/character/${frame}.png?v=${assetVersion}`
        )
    });

    tileKeys.forEach(tileKey => {
        this.load.image(tileKey, `media/${tileKey}.png?v=${assetVersion}`);
    });

    this.load.image('waterOverlay', `media/waterOverlay.png?v=${assetVersion}`);
    this.load.spritesheet('shimmer', `media/shimmer.png?v=${assetVersion}`, {
        frameWidth: 12,
        frameHeight: 1
    });
}

function create() {
    this.game.renderer.pipelines.add('WaterWarp', new WaterWarpPipeline(this.game));

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    character = this.add.sprite(0, 0, 'character-front')
        .setOrigin(0)
        .setDepth(10);

    characterKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
        downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
        leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
        rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });

    mainCamera = this.cameras.main;
    
    mainCamera.setZoom(1);
    mainCamera.removeBounds();
    mainCamera.setRoundPixels(true);

    cameraScrollX = mainCamera.scrollX;
    cameraScrollY = mainCamera.scrollY;

    updateLoadedChunks();

    for (let index = 0; index < 10; index++) {
        spawnShimmer(this);
    }

    this.time.addEvent({
        delay: 450,
        callback: () => spawnShimmer(this),
        loop: true
    });
}

function worldHash(x, y, salt = 0) {
    let number = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(WORLD_SEED + salt, 1442695040888963407);
    
    number ^= number >>> 13;

    number = Math.imul(number, 1274126177);

    return (((number ^ (number >>> 16)) >>> 0) / 4294967295);
}

function smoothNoiseAmount(value) {
    return (value * value * (3 - 2 * value));
}

function valueNoise(worldX, worldY, scale, salt) {
    const scaledX = worldX / scale;
    const scaledY = worldY / scale;

    const left = Math.floor(scaledX);
    const top = Math.floor(scaledY);

    const horizontalAmount = smoothNoiseAmount(scaledX - left);
    const verticalAmount = smoothNoiseAmount(scaledY - top);

    const topLeft = worldHash(left, top, salt);
    const topRight = worldHash(left + 1, top, salt);
    const bottomLeft = worldHash(left, top + 1, salt);
    const bottomRight = worldHash(left + 1, top + 1, salt);

    const topValue = topLeft + (topRight - topLeft) * horizontalAmount;
    const bottomValue = bottomLeft + (bottomRight - bottomLeft) * horizontalAmount;

    return topValue + (bottomValue - topValue) * verticalAmount;
}

function fractalNoise(worldX, worldY, salt) {
    return(valueNoise(worldX, worldY, 48, salt) * 0.55 +
        valueNoise(worldX + 83, worldY - 47, 24, salt + 1) * 0.30 +
        valueNoise(worldX - 29, worldY + 101, 12, salt + 2) * 0.15);
}

function getTerrainType(tileX, tileY) {
    if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
        return 'grass';
    }

    const warpX = (valueNoise(tileX, tileY, 64, 10) - 0.5) * 24;
    const warpY = (valueNoise(tileX + 200, tileY - 100, 64, 11) - 0.5) * 24;

    const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);

    if (elevation < 0.3) {
        return 'water';
    }

    const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);

    const localDirt = valueNoise(tileX, tileY, 4, 44);

    const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;

    if (elevation < 0.38 || dirtScore > 0.63) {
        return 'dirt';
    }

    return 'grass';
}

function getWorldTileKey(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);

    if (terrain === 'water') {
        const northernTerrain = getTerrainType(tileX, tileY - 1);
        
        if (northernTerrain === 'dirt') {
            return 'waterDirt';
        }

        if (northernTerrain === 'grass') {
            return 'waterGrass';
        }

        return 'water';
    }

    const southernTerrain = getTerrainType(tileX, tileY + 1);

    if (southernTerrain === 'water') {
        if (terrain === 'dirt') {
            return 'dirtEdge';
        }

        return 'grassEdge';
    }

    if (terrain === 'dirt') {
        return 'dirt1';
    }

    const decoration = worldHash(tileX, tileY, 670);

    if (decoration > 0.985) {
        return 'grass4';
    }

    if (decoration > 0.95) {
        return 'grass3';
    }

    if (decoration > 0.80) {
        return 'grass2';
    }

    return 'grass1';
}

function getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
}  

function createWorldChunk(scene, chunkX, chunkY) {
    const key = getChunkKey(chunkX, chunkY);

    if (loadedChunks.has(key)) {
        return;
    }

    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;

    const tileSprites = [];
    const waterCells = [];

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;

            const tileKey = getWorldTileKey(tileX, tileY);

            const tileSprite = scene.add.image(
                tileX * TILE_SIZE,
                tileY * TILE_SIZE,
                tileKey
            )
                .setOrigin(0)
                .setDepth(0);

            tileSprites.push(tileSprite);

            if (tileKey.toLowerCase().includes('water')) {
                waterCells.push({x: tileX * TILE_SIZE, y: tileY * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE});
            }
        }
    }

    let overlay = null;
    let maskGraphics = null;
    let mask = null;

    if (waterCells.length > 0) {
        maskGraphics = scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        maskGraphics.fillStyle(0xffffff, 1);

        for (const cell of waterCells) {
            maskGraphics.fillRect(cell.x, cell.y, cell.width, cell.height);
        }

        mask = maskGraphics.createGeometryMask();

        overlay = scene.add.tileSprite(
            pixelX,
            pixelY,
            CHUNK_PIXEL_SIZE,
            CHUNK_PIXEL_SIZE,
            'waterOverlay'
        )
            .setOrigin(0)
            .setDepth(1)
            .setAlpha(1)
            .setBlendMode(Phaser.BlendModes.SCREEN)
            .setMask(mask);

        overlay.setPipeline = 'WaterWarp';

        overlay.pipeline.set1f('uOpacity', 0.2);
    }

    loadedChunks.set(key, {
        key,
        chunkX,
        chunkY,
        tileSprites,
        waterCells,
        shimmers: [],
        overlay,
        maskGraphics,
        mask
    });
}

function destroyWorldChunk(key) {
    const chunk = loadedChunks.get(key);

    if (!chunk) {
        return;
    }

    for (const shimmer of chunk.shimmers) {
        shimmer.destroy();
    }

    for (const tileSprite of chunk.tileSprites) {
        tileSprite.destroy();
    }

    if (chunk.overlay) {
        chunk.overlay.destroy();
    }

    if (chunk.mask) {
        chunk.mask.destroy();
    }

    if (chunk.maskGraphics) {
        chunk.maskGraphics.destroy();
    }

    loadedChunks.delete(key);
}

function updateLoadedChunks(scene, force = false) {
    const characterCenterX = character.x + CHARACTER_SIZE / 2;
    const characterCenterY = character.y + CHARACTER_SIZE / 2;

    const characterTileX = Math.floor(characterCenterX / TILE_SIZE);
    const characterTileY = Math.floor(characterCenterY / TILE_SIZE);

    const centerChunkX = Math.floor(characterTileX / CHUNK_SIZE);
    const centerChunkY = Math.floor(characterTileY / CHUNK_SIZE);

    if (!force && centerChunkX === activeChunkX && centerChunkY === activeChunkY) {
        return;
    }

    const desiredChunkKeys = new Set();

    for (let offsetY = -CHUNK_LOAD_RADIUS; offsetY <= CHUNK_LOAD_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_LOAD_RADIUS; offsetX <= CHUNK_LOAD_RADIUS; offsetX++) {
            const chunkX = centerChunkX + offsetX;
            const chunkY = centerChunkY + offsetY;

            const key = getChunkKey(chunkX, chunkY);
            desiredChunkKeys.add(key);
            createWorldChunk(scene, chunkX, chunkY);
        }
    }

    for (const key of Array.from(loadedChunks.keys())) {
        if (!desiredChunkKeys.has(key)) {
            destroyWorldChunk(key);
        }
    }

    activeChunkX = centerChunkX;
    activeChunkY = centerChunkY;
}

function updateChunkWater(time, delta) {
    for (const chunk of loadedChunks.values()) {
        if (!chunk.overlay) continue;

        chunk.overlay.pipeline.set1f('uTime', time * 0.003);
        chunk.overlay.tilePositionX += delta * 0.01;
        chunk.overlay.tilePositionY += delta * 0.006;
    }
}

function spawnShimmer(scene) {
    const waterChunks = Array.from(loadedChunks.values()).filter(chunk => chunk.waterCells.length > 0);

    if (waterChunks.length === 0) {
        return;
    }

    const chunk = Phaser.Utils.Array.GetRandom(waterChunks);

    const cell = Phaser.Utils.Array.GetRandom(chunk.waterCells);

    const shimmer = scene.add.sprite(
        cell.x + Phaser.Math.Between(0, cell.width - 12),
        cell.y + Phaser.Math.Between(0, cell.height - 1),
        'shimmer'
    )
        .setOrigin(0)
        .setDepth(2)
        .setBlendMode(Phaser.BlendModes.NORMAL);

    chunk.shimmers.push(shimmer);

    shimmer.play('shimmer');

    shimmer.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        const index = chunk.shimmers.indexOf(shimmer);
        if (index !== -1) {
            chunk.shimmers.splice(index, 1);
        }
        shimmer.destroy();
    });
}

function canCharacterOccupy(x, y) {
    const leftTile =
        Math.floor(x / TILE_SIZE);

    const rightTile =
        Math.floor(
            (
                x +
                CHARACTER_SIZE -
                1
            ) / TILE_SIZE
        );

    const topTile =
        Math.floor(y / TILE_SIZE);

    const bottomTile =
        Math.floor(
            (
                y +
                CHARACTER_SIZE -
                1
            ) / TILE_SIZE
        );

    const characterBottomY =
        y + CHARACTER_SIZE;

    for (
        let tileY = topTile;
        tileY <= bottomTile;
        tileY += 1
    ) {
        for (
            let tileX = leftTile;
            tileX <= rightTile;
            tileX += 1
        ) {
            const tileKey =
                getWorldTileKey(
                    tileX,
                    tileY
                );

            const tileName =
                tileKey.toLowerCase();

            if (tileName.includes('water')) {
                return false;
            }

            const tileTop =
                tileY * TILE_SIZE;

            if (
                (
                    tileName.includes('edge') ||
                    tileName.includes('left') ||
                    tileName.includes('right')
                ) &&
                characterBottomY >
                    tileTop +
                    TILE_SIZE / 2
            ) {
                return false;
            }
        }
    }

    return true;
}

function updateCamera(delta) {
    mainCamera.getScroll(
        character.x + CHARACTER_SIZE / 2,
        character.y + CHARACTER_SIZE / 2,
        cameraTargetScroll
    );

    const followAmount =
        1 - Math.exp(-CAMERA_EASE * delta / 1000);

    cameraScrollX =
        Phaser.Math.Linear(
            cameraScrollX,
            cameraTargetScroll.x,
            followAmount
        );
    cameraScrollY =
        Phaser.Math.Linear(
            cameraScrollY,
            cameraTargetScroll.y,
            followAmount
        );

    mainCamera.setScroll(
        Math.round(cameraScrollX),
        Math.round(cameraScrollY)
    );
}

function update(time, delta) {
    if (!character) {
        return;
    }

    let moveX = 0;
    let moveY = 0;

    if (
        characterKeys.left.isDown ||
        characterKeys.leftArrow.isDown
    ) {
        moveX -= 1;
        character.Direction = 'left';
    } else if (
        characterKeys.right.isDown ||
        characterKeys.rightArrow.isDown
    ) {
        moveX += 1;
        characterDirection = 'right';
    }

    if (
        characterKeys.up.isDown ||
        characterKeys.upArrow.isDown
    ) {
        moveY -= 1;
        characterDirection = 'back';
    } else if (
        characterKeys.down.isDown ||
        characterKeys.downArrow.isDown
    ) {
        moveY += 1;
        characterDirection = 'front';
    }

    const isWalking = moveX !== 0 || moveY !== 0;

    if (isWalking) {
        characterMoveRemainderX += moveX * CHARACTER_SPEED * delta / 1000;
        characterMoveRemainderY += moveY * CHARACTER_SPEED * delta / 1000;
        const wholeMoveX = Math.trunc(characterMoveRemainderX);
        const wholeMoveY = Math.trunc(characterMoveRemainderY);

        character.MoveRemainderX -= wholeMoveX;
        character.MoveRemainderY -= wholeMoveY;

        const nextX = character.x + wholeMoveX;
        const nextY = character.y + wholeMoveY;

        if (canCharacterOccupy(nextX, character.y)) {
            character.x = nextX;
        } else {
            characterMoveRemainderX = 0;
        }

        if (canCharacterOccupy(character.x, nextY)) {
            character.y = nextY;
        } else {
            characterMoveRemainderY = 0;
        }

        const walkFrame = Math.floor(time * (CHARACTER_ANIMATION_SPEED / 1000)) % 3;
        
        const nextTextureKey = `character-${characterDirection}${walkFrame}`;

        if (nextTextureKey !== characterTextureKey) {
            characterTextureKey = nextTextureKey;
            character.setTexture(characterTextureKey);
        } else {
            const idleTextureKey = `character-${characterDirection}`;

            if (characterTextureKey !== idleTextureKey) {
                characterTextureKey = idleTextureKey;
                character.setTexture(characterTextureKey);
            }
        }
    }    
    
    character.x = Math.round(character.x);
    character.y = Math.round(character.y);

    updateLoadedChunks(this);
    updateChunkWater(time, delta);
    updateCamera(delta);
}