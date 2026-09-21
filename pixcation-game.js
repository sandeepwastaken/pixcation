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

    dom: {
        createContainer: true
    },
    
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
                    vec2 pixel = floor(outTexCoord * 256.0);

                    float x = floor(sin(floor(uv.y * grid.y) * 0.78539816339 + uTime) * 0.51);
                    float y = floor(cos(floor(uv.x * grid.x) * 0.58904862255 + uTime * 0.8) * 0.51);
                    float light =
                        sin((pixel.x + pixel.y * 2.0) * 0.09817477042 + uTime * 0.35) * 0.5 +
                        cos((pixel.x * 3.0 - pixel.y) * 0.04908738521 - uTime * 0.28) * 0.35 +
                        sin((pixel.x * 5.0 + pixel.y * 3.0) * 0.02454369261 + uTime * 0.18) * 0.15;
                    float brightness = 0.7 + floor((light + 1.0) * 4.0) * 0.0625;

                    uv += vec2(x, y) / grid;

                    uv = (floor(uv * grid) + 0.5) / grid;

                    vec4 color = texture2D(uMainSampler, uv);
                    color.rgb *= outTint.rgb * uOpacity * brightness;
                    color.a = 1.0;
                    gl_FragColor = color;
                }
            `
        });
    }
}

let game;

document.fonts.load('16px m6x11').finally(() => {
    game = new Phaser.Game(config);
});

const TILE_SIZE = 16;

const DIRT_TRANSITIONS = {
    3: 'transition1',
    6: 'transition2',
    12: 'transition3',
    9: 'transition4'
};

const HOTBAR_X = 43;
const HOTBAR_Y = 155;
const HOTBAR_SLOT_SIZE = 26;

let hotbarSelector;
let selectedHotbarSlot = 0;
let worldObjectLayer;
let edgeShimmerFrame = -1;

const CHUNK_SIZE = 16;
const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE;

const CHUNK_LOAD_RADIUS = 2;
const WORLD_SEED = 6767676767676;
const WORLD_FEATURE_SCALE = 0.42;

const MIN_BRIDGE_WATER_LENGTH = 2;
const MAX_BRIDGE_WATER_LENGTH = 6;

const MIN_PIER_WATER_LENGTH = 4;
const MAX_PIER_WATER_LENGTH = 7;

const WORLD_CACHE_LIMIT = 50000;

const loadedChunks = new Map();
const terrainTypeCache = new Map();
const worldTileCache = new Map();
const pierCandidateCache = new Map();
const discoveredTiles = new Set();

let activeChunkX = null;
let activeChunkY = null;

let character;
let characterKeys;
let characterDirection = 'front';

const CHARACTER_SIZE = 16;
const CHARACTER_SPEED = 60;
const CHARACTER_ANIMATION_SPEED = 8;

const GUIDE_SIZE = 16;
const GUIDE_INTERACTION_DISTANCE = 26;
const DIALOGUE_HIDDEN_Y = -78;
const DIALOGUE_VISIBLE_Y = 6;
const MAP_WIDTH = 296;
const MAP_HEIGHT = 144;
const MAP_HIDDEN_Y = -160;

const STORE_WIDTH_TILES = 3;
const STORE_HEIGHT_TILES = 2;
const STORE_WIDTH = STORE_WIDTH_TILES * TILE_SIZE;
const STORE_HEIGHT = STORE_HEIGHT_TILES * TILE_SIZE;

const MARKET_INTERACTION_DISTANCE = 34;
const MARKET_HIDDEN_Y = -130;
const PROMPT_Y = 142;

const MARKET_RODS = [
    { id: 'basic', label: 'Basic Rod', price: 10 },
    { id: 'sturdy', label: 'Sturdy Rod', price: 25 },
    { id: 'iron', label: 'Iron Rod', price: 50 }
];

const GUIDE_DIALOGUE = {
    intro: {
        text: "Hey! Need something?",
        options: [
            {label: 'Help', next: 'help'},
            {label: 'Greet', next: 'greet'},
            {label: 'Exit', close: true}
        ]
    },
    help: {
        text: "You can move around using WASD or the arrow keys. Scroll or press 1-9 to select items.",
        options: [
            {label: 'Back', next: 'intro'},
            {label: 'Exit', close: true}
        ]
    },
    greet: {
        text: "Hello there! I'm your guide. It's nice to meet you. Enjoy your adventure!",
        options: [
            {label: 'Back', next: 'intro'},
            {label: 'Exit', close: true}
        ]
    }
};

let guide;
let store;
let guideWasNear = false;
let guideHasMetPlayer = false;
let dialogueContainer;
let dialogueTextLayer;
let dialogueText;
let dialogueOptionTexts = [];
let dialogueOpen = false;
let mapOpen = false;
let mapContainer;
let mapImage;
let mapTexture;
let marketOpen = false;
let marketContainer;
let marketTextLayer;
let marketOptionTexts = [];
let marketMessageText;
let marketRodImages = [];
let selectedMarketOption = 0;
let playerCoins = 100;
const ownedRods = new Set();
let interactionPromptLayer;
let interactionPromptText;
let dialogueNode = 'intro';
let selectedDialogueOption = 0;
let dialogueTypingEvent = null;
let dialogueFullText = '';

let characterMoveRemainderX = 0;
let characterMoveRemainderY = 0;
let characterTextureKey = 'character-front';

let mainCamera;

let cameraScrollX = 0;
let cameraScrollY = 0;

const CAMERA_EASE = 2;

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
        'woodRight',
        'transition1',
        'transition2',
        'transition3',
        'transition4'
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

    this.load.image('hotbar', `media/hotbar.png?v=${assetVersion}`);
    this.load.image('selected', `media/selected.png?v=${assetVersion}`);
    this.load.image('bush', `media/bush.png?v=${assetVersion}`);

    this.load.image('guide', `media/guide.png?v=${assetVersion}`);
    this.load.image('headshot', `media/headshot.png?v=${assetVersion}`);
    this.load.image('store', `media/store.png?v=${assetVersion}`);
    this.load.image('rod', `media/rod.png?v=${assetVersion}`);

    this.load.image('waterOverlay', `media/waterOverlay.png?v=${assetVersion}`);
    this.load.spritesheet('shimmer', `media/shimmer.png?v=${assetVersion}`, {
        frameWidth: 12,
        frameHeight: 1
    });
}

function create() {
    worldObjectLayer = this.add.layer().setDepth(3);
    this.game.renderer.pipelines.add('WaterWarp', new WaterWarpPipeline(this.game));

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    character = this.add.sprite(0, 0, 'character-front')
        .setOrigin(0)
        .setDepth(CHARACTER_SIZE);
    worldObjectLayer.add(character);

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

    this.add.image(HOTBAR_X, HOTBAR_Y, 'hotbar')
        .setOrigin(0)
        .setDepth(100)
        .setScrollFactor(0);

    hotbarSelector = this.add.image(
        HOTBAR_X - 2,
        HOTBAR_Y - 3,
        'selected'
    )
        .setOrigin(0)
        .setDepth(101)
        .setScrollFactor(0);

    const selectHotBarSlot = slot => {
        selectedHotbarSlot = Phaser.Math.Wrap(slot, 0, 9);
        hotbarSelector.x = HOTBAR_X - 2 + selectedHotbarSlot * HOTBAR_SLOT_SIZE;
    };

    this.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        if (!dialogueOpen && !mapOpen && !marketOpen) {
            selectHotBarSlot(selectedHotbarSlot + Math.sign(deltaY));
        }
    });

    this.input.keyboard.on('keydown', event => {
        if (event.repeat) {
            return;
        }

        if (dialogueOpen) {
            handleGuideDialogueKey(this,event);
            return;
        }

        if (mapOpen) {
            handleMapKey(this, event);
            return;
        }

        if (marketOpen) {
            handleMarketKey(this, event);
            return;
        }

        if (event.key.toLowerCase() === 'm') {
            if (isMarketNear()) {
                openMarket(this);
            } else {
                openMap(this);
            }
            return;
        }

        if (event.key.toLowerCase() === 'e' && isGuideNear()) {
            openGuideDialogue(this);
            return;
        }

        const slot = Number(event.key) - 1;

        if (slot >= 0 && slot < 9) {
            selectHotBarSlot(slot);
        }
    });

    mainCamera = this.cameras.main;
    
    mainCamera.setZoom(1);
    mainCamera.removeBounds();
    mainCamera.setRoundPixels(true);

    cameraScrollX = mainCamera.scrollX;
    cameraScrollY = mainCamera.scrollY;

    updateLoadedChunks(this, true);

    spawnGuideAndStore(this);
    createGuideDialogueUI(this);
    createMapUI(this);
    createMarketUI(this);
    createInteractionPromptUI(this);

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
    return(valueNoise(worldX, worldY, 48 * WORLD_FEATURE_SCALE, salt) * 0.55 +
        valueNoise(worldX + 83, worldY - 47, 24 * WORLD_FEATURE_SCALE, salt + 1) * 0.30 +
        valueNoise(worldX - 29, worldY + 101, 12 * WORLD_FEATURE_SCALE, salt + 2) * 0.15);
}

function getTerrainType(tileX, tileY) {
    const key = `${tileX},${tileY}`;

    if (terrainTypeCache.has(key)) {
        return terrainTypeCache.get(key);
    }

    let terrain;

    if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
        terrain = 'grass';
    } else {
        const warpScale = 64 * WORLD_FEATURE_SCALE;
        const warpStrength = 24 * WORLD_FEATURE_SCALE;
        const warpX = (valueNoise(tileX, tileY, warpScale, 10) - 0.5) * warpStrength;
        const warpY = (valueNoise(tileX + 200, tileY - 100, warpScale, 11) - 0.5) * warpStrength;

        const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);

        if (elevation < 0.3) {
            terrain = 'water';
        } else {
            const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);
            const localDirt = valueNoise(tileX, tileY, 4, 44);
            const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;

            terrain = elevation < 0.38 || dirtScore > 0.63
                ? 'dirt'
                : 'grass';
        }
    }

    if (terrainTypeCache.size >= WORLD_CACHE_LIMIT) {
        terrainTypeCache.clear();
    }

    terrainTypeCache.set(key, terrain);

    return terrain;
}

function isLandTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) !== 'water';
}

function isLocalHashPeak(tileX, tileY, stepX, stepY, radius, salt) {
    const score = worldHash(tileX, tileY, salt);

    if (score < 0.82) {
        return false;
    }

    for (let offset = -radius; offset <= radius; offset++) {
        if (offset === 0) {
            continue;
        }

        const nearbyScore = worldHash(
            tileX + stepX * offset,
            tileY + stepY * offset,
            salt
        );

        if (nearbyScore >= score) {
            return false;
        }
    }

    return true;
}

function findWaterRun(tileX, tileY, stepX, stepY) {
    let waterX = tileX;
    let waterY = tileY;

    if (getTerrainType(waterX, waterY) !== 'water') {
        if (getTerrainType(tileX + stepX, tileY + stepY) === 'water') {
            waterX += stepX;
            waterY += stepY;
        } else if (getTerrainType(tileX - stepX, tileY - stepY) === 'water') {
            waterX -= stepX;
            waterY -= stepY;
        } else {
            return null;
        }
    }

    let startX = waterX;
    let startY = waterY;
    let endX = waterX;
    let endY = waterY;
    let waterLength = 1;

    while (getTerrainType(startX - stepX, startY - stepY) === 'water') {
        startX -= stepX;
        startY -= stepY;
        waterLength += 1;

        if (waterLength > MAX_BRIDGE_WATER_LENGTH) {
            return null;
        }
    }

    while (getTerrainType(endX + stepX, endY + stepY) === 'water') {
        endX += stepX;
        endY += stepY;
        waterLength += 1;

        if (waterLength > MAX_BRIDGE_WATER_LENGTH) {
            return null;
        }
    }

    if (waterLength < MIN_BRIDGE_WATER_LENGTH) {
        return null;
    }

    const startLandX = startX - stepX;
    const startLandY = startY - stepY;
    const endLandX = endX + stepX;
    const endLandY = endY + stepY;

    if (
        !isLandTile(startLandX, startLandY) ||
        !isLandTile(endLandX, endLandY)
    ) {
        return null;
    }

    return {
        startLandX,
        startLandY,
        waterLength
    };
}

function getBridgeCandidate(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const run = findWaterRun(tileX, tileY, stepX, stepY);

    if (!run) {
        return null;
    }

    const spanLength = run.waterLength + 2;

    for (let distance = 0; distance < spanLength; distance++) {
        const firstX = run.startLandX + stepX * distance;
        const firstY = run.startLandY + stepY * distance;
        const secondX = firstX + widthX;
        const secondY = firstY + widthY;
        const shouldBeLand = distance === 0 || distance === spanLength - 1;

        if (shouldBeLand) {
            if (!isLandTile(firstX, firstY) || !isLandTile(secondX, secondY)) {
                return null;
            }
        } else if (
            getTerrainType(firstX, firstY) !== 'water' ||
            getTerrainType(secondX, secondY) !== 'water'
        ) {
            return null;
        }
    }

    if (!isLocalHashPeak(
        run.startLandX,
        run.startLandY,
        widthX,
        widthY,
        4,
        salt
    )) {
        return null;
    }

    return {
        startX: run.startLandX,
        startY: run.startLandY,
        stepX,
        stepY,
        widthX,
        widthY,
        spanLength
    };
}

function isTileInBridge(tileX, tileY, bridge) {
    for (let distance = 0; distance < bridge.spanLength; distance++) {
        const bridgeX = bridge.startX + bridge.stepX * distance;
        const bridgeY = bridge.startY + bridge.stepY * distance;

        if (
            (tileX === bridgeX && tileY === bridgeY) ||
            (
                tileX === bridgeX + bridge.widthX &&
                tileY === bridgeY + bridge.widthY
            )
        ) {
            return true;
        }
    }

    return false;
}

function getBridgeTile(tileX, tileY) {
    for (let firstColumn = tileX - 1; firstColumn <= tileX; firstColumn++) {
        const bridge = getBridgeCandidate(
            firstColumn,
            tileY,
            0,
            1,
            1,
            0,
            810
        );

        if (bridge && isTileInBridge(tileX, tileY, bridge)) {
            return {
                key: 'wood',
                rotation: 0
            };
        }
    }

    for (let firstRow = tileY - 1; firstRow <= tileY; firstRow++) {
        const bridge = getBridgeCandidate(
            tileX,
            firstRow,
            1,
            0,
            0,
            1,
            811
        );

        if (bridge && isTileInBridge(tileX, tileY, bridge)) {
            return {
                key: 'wood',
                rotation: Math.PI / 2
            };
        }
    }

    return null;
}

function getPierCandidate(anchorX, anchorY) {
    const key = `${anchorX},${anchorY}`;

    if (pierCandidateCache.has(key)) {
        return pierCandidateCache.get(key);
    }

    let pier = null;

    if (
        isLandTile(anchorX, anchorY) &&
        isLandTile(anchorX + 1, anchorY) &&
        isLocalHashPeak(anchorX, anchorY, 1, 0, 5, 920)
    ) {
        const lengthRange = MAX_PIER_WATER_LENGTH - MIN_PIER_WATER_LENGTH + 1;
        const waterLength = MIN_PIER_WATER_LENGTH + Math.floor(
            worldHash(anchorX, anchorY, 921) * lengthRange
        );
        let hasWaterPath = true;

        for (let distance = 1; distance <= waterLength + 2; distance++) {
            if (
                getTerrainType(anchorX, anchorY + distance) !== 'water' ||
                getTerrainType(anchorX + 1, anchorY + distance) !== 'water'
            ) {
                hasWaterPath = false;
                break;
            }
        }

        if (hasWaterPath) {
            let openWaterTiles = 0;
            let checkedTiles = 0;

            for (let y = waterLength; y <= waterLength + 2; y++) {
                for (let x = -2; x <= 3; x++) {
                    checkedTiles += 1;

                    if (getTerrainType(anchorX + x, anchorY + y) === 'water') {
                        openWaterTiles += 1;
                    }
                }
            }

            if (openWaterTiles / checkedTiles >= 0.8) {
                pier = {
                    anchorX,
                    anchorY,
                    waterLength
                };
            }
        }
    }

    if (pierCandidateCache.size >= WORLD_CACHE_LIMIT) {
        pierCandidateCache.clear();
    }

    pierCandidateCache.set(key, pier);

    return pier;
}

function getPierTile(tileX, tileY) {
    for (let distance = 0; distance <= MAX_PIER_WATER_LENGTH; distance++) {
        for (let side = 0; side <= 1; side++) {
            const anchorX = tileX - side;
            const anchorY = tileY - distance;
            const pier = getPierCandidate(anchorX, anchorY);

            if (!pier || distance > pier.waterLength) {
                continue;
            }

            if (distance === pier.waterLength) {
                return {
                    key: side === 0 ? 'woodLeft' : 'woodRight',
                    rotation: 0,
                    baseKey: 'water'
                };
            }

            return {
                key: 'wood',
                rotation: 0
            };
        }
    }

    return null;
}

function getTerrainTileKey(tileX, tileY) {
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
        const grassMask =
        (getTerrainType(tileX, tileY - 1) === 'grass' ? 1 : 0) |
        (getTerrainType(tileX + 1, tileY) === 'grass' ? 2 : 0) |
        (getTerrainType(tileX, tileY + 1) === 'grass' ? 4 : 0) |
        (getTerrainType(tileX - 1, tileY) === 'grass' ? 8 : 0);

        return DIRT_TRANSITIONS[grassMask] || 'dirt1';
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

function getWorldTile(tileX, tileY) {
    const key = `${tileX},${tileY}`;

    if (worldTileCache.has(key)) {
        return worldTileCache.get(key);
    }

    const tile = getBridgeTile(tileX, tileY) ||
        getPierTile(tileX, tileY) || {
            key: getTerrainTileKey(tileX, tileY),
            rotation: 0
        };

    if (worldTileCache.size >= WORLD_CACHE_LIMIT) {
        worldTileCache.clear();
    }

    worldTileCache.set(key, tile);

    return tile;
}

function getWorldTileKey(tileX, tileY) {
    return getWorldTile(tileX, tileY).key;
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
    const edgeCells = [];

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;
            discoveredTiles.add(`${tileX},${tileY}`);

            const worldTile = getWorldTile(tileX, tileY);
            const tileKey = worldTile.key;

            if (worldTile.baseKey) {
                const baseSprite = scene.add.image(
                    tileX * TILE_SIZE,
                    tileY * TILE_SIZE,
                    worldTile.baseKey
                )
                    .setOrigin(0)
                    .setDepth(0);

                tileSprites.push(baseSprite);
            }

            const tileSprite = scene.add.image(
                tileX * TILE_SIZE + TILE_SIZE / 2,
                tileY * TILE_SIZE + TILE_SIZE / 2,
                tileKey
            )
                .setOrigin(0.5)
                .setRotation(worldTile.rotation)
                .setDepth(0);

            tileSprites.push(tileSprite);

            if (tileKey === 'waterDirt' || tileKey === 'waterGrass') {
                const leftExtension = getWorldTileKey(tileX - 1, tileY) === 'water' ? 4 : 0;
                const rightExtension = getWorldTileKey(tileX + 1, tileY) === 'water' ? 4 : 0;
                edgeCells.push({x: tileX * TILE_SIZE - leftExtension, y: tileY * TILE_SIZE, width: TILE_SIZE + leftExtension + rightExtension});
            }

            if (getTerrainType(tileX, tileY) === 'grass' && getTerrainType(tileX + 1, tileY) === 'grass' && worldHash(tileX, tileY, 760) > 0.992) {
                const bush = scene.add.image(tileX * TILE_SIZE, tileY * TILE_SIZE + TILE_SIZE, 'bush').setOrigin(0, 1).setDepth(tileY * TILE_SIZE + TILE_SIZE);
                worldObjectLayer.add(bush);
                tileSprites.push(bush);
            }

            if (tileKey.toLowerCase().includes('water')) {
                waterCells.push({x: tileX * TILE_SIZE, y: tileY * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE});
            }
        }
    }

    const edgeShimmer = edgeCells.length > 0 ? scene.add.graphics().setDepth(2) : null;

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

        overlay.setPipeline('WaterWarp');

        overlay.pipeline.set1f('uOpacity', 0.2);
    }

    loadedChunks.set(key, {
        key,
        chunkX,
        chunkY,
        tileSprites,
        waterCells,
        edgeCells,
        edgeShimmer,
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

    if (chunk.edgeShimmer) {
        chunk.edgeShimmer.destroy();
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

function updateChunkWater(time) {
    for (const chunk of loadedChunks.values()) {
        if (!chunk.overlay) continue;

        chunk.overlay.pipeline.set1f('uTime', time * 0.003);
        chunk.overlay.tilePositionX = time * 0.01;
        chunk.overlay.tilePositionY = time * 0.006;
    }
}

function updateEdgeShimmers(time) {
    const frame = Math.floor(time * 12 / 1000);

    if (frame === edgeShimmerFrame) return;

    edgeShimmerFrame = frame;

    for (const chunk of loadedChunks.values()) {
        if (!chunk.edgeShimmer) continue;

        chunk.edgeShimmer.clear();
        let activeColor = 0;

        for (const cell of chunk.edgeCells) {
            for (let pixelX = cell.x; pixelX < cell.x + cell.width; pixelX++) {
                const noise = valueNoise(pixelX - frame, cell.y + frame * 0.25, 24, 780);
                const color = noise >= 0.76 ? 0xd1edf1 : noise >= 0.5 || noise >= 0.39 && noise < 0.42 ? 0x87bed8 : 0;

                if (color === 0) continue;

                if (color !== activeColor) {
                    chunk.edgeShimmer.fillStyle(color, 1);
                    activeColor = color;
                }

                chunk.edgeShimmer.fillRect(pixelX, cell.y, 1, 1);
            }
        }
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

function hasBushAt(tileX, tileY) {
    return(getTerrainType(tileX, tileY) === 'grass' && getTerrainType(tileX + 1, tileY) === 'grass' && worldHash(tileX, tileY, 760) > 0.992);
}

function isGuideSpawnTile(tileX, tileY) {
    const tileKey = getWorldTileKey(tileX, tileY).toLowerCase();

    return ((getTerrainType(tileX, tileY) !== 'water' &&
        !tileKey.includes('edge') &&
        !tileKey.includes('wood') &&
        !tileKey.includes('water') &&
        !hasBushAt(tileX, tileY)) &&
        !hasBushAt(tileX - 1, tileY));
}

function canPlaceStoreAt(storeTileX, storeTileY) {
    for (let localY = 0; localY < STORE_HEIGHT_TILES; localY += 1) {
        for (let localX = 0; localX < STORE_WIDTH_TILES; localX += 1) {
            if (!isGuideSpawnTile(storeTileX + localX, storeTileY + localY)) {
                return false;
            }
        }
    }

    return true;
}

function findGuideAndStoreSpawn() {
    const centerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const centerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);

    for (let radius = 3; radius <= 8; radius += 1) {
        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
            for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
                if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== radius) {
                    continue;
                }

                const guideTileX = centerTileX + offsetX;
                const guideTileY = centerTileY + offsetY;
                const storeTileX = guideTileX - 1;
                const storeTileY = guideTileY - STORE_HEIGHT_TILES;

                if (!isGuideSpawnTile(guideTileX, guideTileY)) {
                    continue;
                }

                if (!canPlaceStoreAt(storeTileX, storeTileY)) {
                    continue;
                }

                return {
                    guideTileX,
                    guideTileY,
                    storeTileX,
                    storeTileY
                };
            }
        }
    }

    return null;
}

function spawnGuideAndStore(scene) {
    const spawn = findGuideAndStoreSpawn();

    if (!spawn) {
        return;
    }

    store = scene.add.image(
        spawn.storeTileX * TILE_SIZE,
        spawn.storeTileY * TILE_SIZE,
        'store'
    )
        .setOrigin(0)
        .setDepth(spawn.storeTileY * TILE_SIZE + STORE_HEIGHT);

    worldObjectLayer.add(store);

    guide = scene.add.image(
        spawn.guideTileX * TILE_SIZE,
        spawn.guideTileY * TILE_SIZE,
        'guide'
    )
        .setOrigin(0)
        .setDepth(spawn.guideTileY * TILE_SIZE + GUIDE_SIZE);

    worldObjectLayer.add(guide);
}

function createGuideDialogueUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, 78)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, 76)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, 74)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, 72);

    const portrait = scene.add.image(12, 13, 'headshot')
    .setOrigin(0);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: '78px',
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
    });

    const createText = (x, y, color, width) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: width ? `${width}px` : 'auto',
            color,
            whiteSpace: width ? 'normal' : 'nowrap'
        });

        textLayer.appendChild(text);
        return text;
    };

    const nameText = createText(64, 5, '#acccf9');
    nameText.textContent = 'Guide';

    dialogueText = createText(64, 21, '#e0f2fd', 154);

    dialogueOptionTexts = [0, 1, 2].map(index => {
        return createText(222, 14 + index * 17, '#c0a887');
    });

    dialogueContainer = scene.add.container(
        0,
        DIALOGUE_HIDDEN_Y,
        [
            panel,
            portrait
        ]
    )
    .setDepth(200)
    .setScrollFactor(0)
    .setVisible(false);

    dialogueTextLayer = scene.add.dom(
        0,
        DIALOGUE_HIDDEN_Y,
        textLayer
    )
    .setOrigin(0)
    .setDepth(201)
    .setScrollFactor(0)
    .setVisible(false);
}

function createMapUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, 160)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, 158)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, 156)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, 154);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);

    mapImage = scene.add.image(12, 8, 'map')
        .setOrigin(0);

    mapContainer = scene.add.container(
        0,
        MAP_HIDDEN_Y,
        [
            panel,
            mapImage
        ]
    )
    .setDepth(202)
    .setScrollFactor(0)
    .setVisible(false);
}

function redrawMap() {
    const context = mapTexture.getContext();
    const image = context.createImageData(MAP_WIDTH, MAP_HEIGHT);
    const pixels = image.data;

    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const originX = playerTileX - Math.floor(MAP_WIDTH / 2);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / 2);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileX = originX + x;
            const tileY = originY + y;
            const index = (y * MAP_WIDTH + x) * 4;

            let color;

            if (!discoveredTiles.has(`${tileX},${tileY}`)) {
                color = (x + y) & 1 ? 0x1a1a1a : 0x2a2a2a;
            } else if (hasBushAt(tileX, tileY) || hasBushAt(tileX - 1, tileY)) {
                color = 0x2f5c2a;
            } else {
                const tileKey = getWorldTileKey(tileX, tileY).toLowerCase();

                if (tileKey.includes('wood')) {
                    color = 0xc0a887;
                } else if (tileKey.includes('water')) {
                    color = 0x87bed8;
                } else if (tileKey.includes('grass')) {
                    color = 0x4f8f45;
                } else {
                    color = 0x8a5a32;
                }
            }

            pixels[index] = (color >> 16) & 255;
            pixels[index + 1] = (color >> 8) & 255;
            pixels[index + 2] = color & 255;
            pixels[index + 3] = 255;
        }
    }

    if (guide) {
        const guideTileX = Math.floor(guide.x / TILE_SIZE);
        const guideTileY = Math.floor(guide.y / TILE_SIZE);

        if (discoveredTiles.has(`${guideTileX},${guideTileY}`)) {
            const x = guideTileX - originX;
            const y = guideTileY - originY;

            if (x >= 0 && y >= 0 && x < MAP_WIDTH - 1 && y < MAP_HEIGHT - 1) {
                for (const [offsetX, offsetY] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
                    const index = ((y + offsetY) * MAP_WIDTH + (x + offsetX)) * 4;

                    pixels[index] = 0xac;
                    pixels[index + 1] = 0xcc;
                    pixels[index + 2] = 0xf9;
                    pixels[index + 3] = 255;
                }
            }
        }
    }

    context.putImageData(image, 0, 0);
    mapTexture.refresh();
}

function openMap(scene) {
    if (mapOpen || dialogueOpen || marketOpen || !mapContainer) {
        return;
    }

    mapOpen = true;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    redrawMap();

    mapContainer
        .setVisible(true)
        .setY(MAP_HIDDEN_Y);

    scene.tweens.killTweensOf(mapContainer);

    scene.tweens.add({
        targets: mapContainer,
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out'
    });
}

function closeMap(scene) {
    if (!mapOpen) {
        return;
    }

    mapOpen = false;

    scene.tweens.killTweensOf(mapContainer);

    scene.tweens.add({
        targets: mapContainer,
        y: MAP_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onComplete: () => {
            if (!mapOpen) {
                mapContainer.setVisible(false);
            }
        }
    });
}

function handleMapKey(scene, event) {
    const key = event.key.toLowerCase();

    if (key === 'm' || event.key === 'Escape') {
        closeMap(scene);
    }
}

function createInteractionPromptUI(scene) {
    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: '12px',
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        textAlign: 'center',
        color: '#d1edf1',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
    });

    interactionPromptText = document.createElement('div');
    interactionPromptText.textContent = '';
    textLayer.appendChild(interactionPromptText);

    interactionPromptLayer = scene.add.dom(0, PROMPT_Y, textLayer)
        .setOrigin(0)
        .setDepth(103)
        .setScrollFactor(0)
        .setVisible(false);
}

function updateInteractionPrompt() {
    if (!interactionPromptLayer || !interactionPromptText) {
        return;
    }

    if (dialogueOpen || mapOpen || marketOpen) {
        interactionPromptLayer.setVisible(false);
        return;
    }

    if (store && isMarketNear()) {
        interactionPromptText.textContent = 'M - see market';
        interactionPromptLayer.setVisible(true);
        return;
    }

    if (guide && guideHasMetPlayer && isGuideNear()) {
        interactionPromptText.textContent = 'E - Interact with Guide';
        interactionPromptLayer.setVisible(true);
        return;
    }

    interactionPromptLayer.setVisible(false);
}

function createMarketUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, 130)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, 128)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, 126)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, 124);

    marketRodImages = MARKET_RODS.map((rod, index) => {
        return scene.add.image(16, 18 + index * 34, 'rod')
            .setOrigin(0)
            .setDisplaySize(32, 32);
    });

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: '130px',
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
    });

    const createText = (x, y, color) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            color,
            whiteSpace: 'nowrap'
        });

        textLayer.appendChild(text);
        return text;
    };

    marketMessageText = createText(56, 5, '#acccf9');
    marketMessageText.textContent = `Coins: ${playerCoins}`;

    marketOptionTexts = MARKET_RODS.map((rod, index) => {
        return createText(56, 22 + index * 34, '#c0a887');
    });

    const exitText = createText(56, 22 + MARKET_RODS.length * 34, '#c0a887');
    marketOptionTexts.push(exitText);

    marketContainer = scene.add.container(
        0,
        MARKET_HIDDEN_Y,
        [
            panel,
            ...marketRodImages
        ]
    )
    .setDepth(203)
    .setScrollFactor(0)
    .setVisible(false);

    marketTextLayer = scene.add.dom(
        0,
        MARKET_HIDDEN_Y,
        textLayer
    )
    .setOrigin(0)
    .setDepth(204)
    .setScrollFactor(0)
    .setVisible(false);

    refreshMarketOptions();
}

function refreshMarketOptions() {
    if (!marketMessageText) {
        return;
    }

    marketMessageText.textContent = `Coins: ${playerCoins}`;

    MARKET_RODS.forEach((rod, index) => {
        const optionText = marketOptionTexts[index];
        const owned = ownedRods.has(rod.id);

        optionText.textContent = `${index === selectedMarketOption ? '> ' : '  '}${rod.label} - ${rod.price}c${owned ? ' (owned)' : ''}`;
        optionText.style.color = index === selectedMarketOption
            ? '#d1edf1'
            : '#c0a887';
    });

    const exitIndex = MARKET_RODS.length;
    const exitText = marketOptionTexts[exitIndex];

    exitText.textContent = `${exitIndex === selectedMarketOption ? '> ' : '  '}Exit`;
    exitText.style.color = exitIndex === selectedMarketOption
        ? '#d1edf1'
        : '#c0a887';
}

function buySelectedMarketItem(scene) {
    if (selectedMarketOption >= MARKET_RODS.length) {
        closeMarket(scene);
        return;
    }

    const rod = MARKET_RODS[selectedMarketOption];

    if (ownedRods.has(rod.id)) {
        return;
    }

    if (playerCoins < rod.price) {
        return;
    }

    playerCoins -= rod.price;
    ownedRods.add(rod.id);
    refreshMarketOptions();
}

function moveMarketSelection(amount) {
    selectedMarketOption = Phaser.Math.Wrap(
        selectedMarketOption + amount,
        0,
        MARKET_RODS.length + 1
    );

    refreshMarketOptions();
}

function openMarket(scene) {
    if (
        marketOpen ||
        mapOpen ||
        dialogueOpen ||
        !marketContainer ||
        !marketTextLayer ||
        !isMarketNear()
    ) {
        return;
    }

    marketOpen = true;
    selectedMarketOption = 0;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    refreshMarketOptions();

    marketContainer
        .setVisible(true)
        .setY(MARKET_HIDDEN_Y);

    marketTextLayer
        .setVisible(true)
        .setY(MARKET_HIDDEN_Y);

    scene.tweens.killTweensOf(marketContainer);
    scene.tweens.killTweensOf(marketTextLayer);

    scene.tweens.add({
        targets: [marketContainer, marketTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out'
    });
}

function closeMarket(scene) {
    if (!marketOpen) {
        return;
    }

    marketOpen = false;

    scene.tweens.killTweensOf(marketContainer);
    scene.tweens.killTweensOf(marketTextLayer);

    scene.tweens.add({
        targets: [marketContainer, marketTextLayer],
        y: MARKET_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onComplete: () => {
            if (!marketOpen) {
                marketContainer.setVisible(false);
                marketTextLayer.setVisible(false);
            }
        }
    });
}

function handleMarketKey(scene, event) {
    const key = event.key.toLowerCase();

    if (
        key === 'w' ||
        event.key === 'ArrowUp'
    ) {
        moveMarketSelection(-1);
        return;
    }

    if (
        key === 's' ||
        event.key === 'ArrowDown'
    ) {
        moveMarketSelection(1);
        return;
    }

    if (
        event.key === 'Enter' ||
        event.code === 'Space'
    ) {
        buySelectedMarketItem(scene);
        return;
    }

    if (key === 'm' || event.key === 'Escape') {
        closeMarket(scene);
    }
}

function isMarketNear() {
    if (!store) {
        return false;
    }

    return Phaser.Math.Distance.Between(
        character.x + CHARACTER_SIZE / 2,
        character.y + CHARACTER_SIZE / 2,
        store.x + STORE_WIDTH / 2,
        store.y + STORE_HEIGHT / 2
    ) < MARKET_INTERACTION_DISTANCE;
}

function isGuideNear() {
    if (!guide) {
        return false;
    }

    return Phaser.Math.Distance.Between(
        character.x + CHARACTER_SIZE / 2,
        character.y + CHARACTER_SIZE / 2,
        guide.x + GUIDE_SIZE / 2,
        guide.y + GUIDE_SIZE / 2
    ) < GUIDE_INTERACTION_DISTANCE;
}

function refreshGuideDialogueOptions() {
    const options = GUIDE_DIALOGUE[dialogueNode].options;

    dialogueOptionTexts.forEach((optionText, index) => {
        const option = options[index];
        
        if (!option) {
            optionText.style.display = 'none';
            return;
        }

        optionText.style.display = 'block';
        optionText.textContent = `${index === selectedDialogueOption ? '> ' : '  '}${option.label}`;
        optionText.style.color = index === selectedDialogueOption
            ? '#d1edf1'
            : '#c0a887';
    });
}

function finishGuideDialogueText() {
    if (!dialogueTypingEvent) {
        return false;
    }

    dialogueTypingEvent.remove(false);
    dialogueTypingEvent = null;
    dialogueText.textContent = dialogueFullText;

    return true;
}

function showGuideDialogueNode(scene, nodeKey) {
    if (dialogueTypingEvent) {
        dialogueTypingEvent.remove(false);
        dialogueTypingEvent = null;
    }

    dialogueNode = nodeKey;
    selectedDialogueOption = 0;
    dialogueFullText = GUIDE_DIALOGUE[nodeKey].text;

    dialogueText.textContent = '';
    refreshGuideDialogueOptions();

    let characterIndex = 0;

    dialogueTypingEvent = scene.time.addEvent({
        delay: 24,
        repeat: dialogueFullText.length - 1,
        callback: () => {
            characterIndex += 1;

            dialogueText.textContent = dialogueFullText.slice(
                0,
                characterIndex
            );

            if (characterIndex === dialogueFullText.length) {
                dialogueTypingEvent = null;
            }
        }
    });
}

function openGuideDialogue(scene) {
    if (
        marketOpen ||
        mapOpen ||
        dialogueOpen ||
        !guide ||
        !dialogueContainer ||
        !dialogueTextLayer
    ) {
        return;
    }

    dialogueOpen = true;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    dialogueContainer
        .setVisible(true)
        .setY(DIALOGUE_HIDDEN_Y);

    dialogueTextLayer
        .setVisible(true)
        .setY(DIALOGUE_HIDDEN_Y);

    scene.tweens.killTweensOf(dialogueContainer);
    scene.tweens.killTweensOf(dialogueTextLayer);

    scene.tweens.add({
        targets: [dialogueContainer, dialogueTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out'
    });

    showGuideDialogueNode(scene, 'intro');
}

function closeGuideDialogue(scene) {
    if (!dialogueOpen) {
        return;
    }

    dialogueOpen = false;
    guideHasMetPlayer = true;

    if (dialogueTypingEvent) {
        dialogueTypingEvent.remove(false);
        dialogueTypingEvent = null;
    }

    scene.tweens.killTweensOf(dialogueContainer);
    scene.tweens.killTweensOf(dialogueTextLayer);

    scene.tweens.add({
        targets: [dialogueContainer, dialogueTextLayer],
        y: DIALOGUE_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onComplete: () => {
            if (!dialogueOpen) {
                dialogueContainer.setVisible(false);
                dialogueTextLayer.setVisible(false);
            }
        }
    });
}

function selectGuideDialogueOption(scene) {
    if (finishGuideDialogueText()) {
        return;
    }

    const option =
        GUIDE_DIALOGUE[dialogueNode]
            .options[selectedDialogueOption];

    if (option.close) {
        closeGuideDialogue(scene);
        return;
    }

    showGuideDialogueNode(
        scene,
        option.next
    );
}

function moveGuideDialogueSelection(amount) {
    const options =
        GUIDE_DIALOGUE[dialogueNode].options;

    selectedDialogueOption =
        Phaser.Math.Wrap(
            selectedDialogueOption + amount,
            0,
            options.length
        );

    refreshGuideDialogueOptions();
}

function handleGuideDialogueKey(scene, event) {
    const key = event.key.toLowerCase();

    if (
        key === 'w' ||
        event.key === 'ArrowUp'
    ) {
        moveGuideDialogueSelection(-1);
        return;
    }

    if (
        key === 's' ||
        event.key === 'ArrowDown'
    ) {
        moveGuideDialogueSelection(1);
        return;
    }

    if (
        event.key === 'Enter' ||
        event.code === 'Space'
    ) {
        selectGuideDialogueOption(scene);
        return;
    }

    if (event.key === 'Escape') {
        closeGuideDialogue(scene);
    }
}

function updateGuideInteraction(scene) {
    const guideIsNear = isGuideNear();

    if (
        guideIsNear &&
        !guideWasNear &&
        !guideHasMetPlayer &&
        !dialogueOpen &&
        !mapOpen &&
        !marketOpen
    ) {
        openGuideDialogue(scene);
    }

    guideWasNear = guideIsNear;
}

function canCharacterOccupy(x, y) {

    if (guide && x < guide.x + GUIDE_SIZE && x + CHARACTER_SIZE > guide.x && y < guide.y + GUIDE_SIZE && y + CHARACTER_SIZE > guide.y) {
        return false;
    }

    if (store && x < store.x + STORE_WIDTH && x + CHARACTER_SIZE > store.x && y < store.y + STORE_HEIGHT && y + CHARACTER_SIZE > store.y) {
        return false;
    }

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

    if (!dialogueOpen && !mapOpen && !marketOpen) {
        if (
            characterKeys.left.isDown ||
            characterKeys.leftArrow.isDown
        ) {
            moveX -= 1;
            characterDirection = 'left';
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
    }

    const isWalking = moveX !== 0 || moveY !== 0;

    if (isWalking) {
        characterMoveRemainderX += moveX * CHARACTER_SPEED * delta / 1000;
        characterMoveRemainderY += moveY * CHARACTER_SPEED * delta / 1000;
        const wholeMoveX = Math.trunc(characterMoveRemainderX);
        const wholeMoveY = Math.trunc(characterMoveRemainderY);

        characterMoveRemainderX -= wholeMoveX;
        characterMoveRemainderY -= wholeMoveY;

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

        const walkFrame = [0, 1, 0, 2][Math.floor(time * (CHARACTER_ANIMATION_SPEED / 1000)) % 4];

        const frameSuffix = walkFrame === 0 ? '' : `walk${walkFrame}`;
        const nextTextureKey = `character-${characterDirection}${frameSuffix}`;

        if (nextTextureKey !== characterTextureKey) {
            characterTextureKey = nextTextureKey;
            character.setTexture(characterTextureKey);
        }
    }    
    
    character.x = Math.round(character.x);
    character.y = Math.round(character.y);
    character.setDepth(character.y + CHARACTER_SIZE);

    updateGuideInteraction(this);
    updateInteractionPrompt();

    updateLoadedChunks(this);
    updateChunkWater(time);
    updateEdgeShimmers(time);
    updateCamera(delta);
}
