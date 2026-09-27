const APP_CACHE_BUSTER = window.APP_CACHE_BUSTER || '1';

const withCacheBuster = (path) => `${path}?v=${APP_CACHE_BUSTER}`;

function getPixelPerfectZoom() {
    const ratio = window.devicePixelRatio || 1;
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    const scale = Math.floor(Math.min(width * ratio / 320, height * ratio / 192));

    return Math.max(1, scale) / ratio;
}

window.addEventListener('resize', () => {
    if (game) {
        game.scale.setZoom(getPixelPerfectZoom());
    }
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
    
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

let game;

document.fonts.load('16px m6x11').finally(() => {
    game = new Phaser.Game(config);
});

const TILE_SIZE = 16;

const DIRT_CLIFF_TILES = [
    ['dirtEdge', 'dirtEdgeOuterRight', 'dirtEdgeInnerRight'],
    ['dirtEdgeOuterLeft', 'dirtEdgeOuterBoth', 'dirtEdgeOuterLeftInnerRight'],
    ['dirtEdgeInnerLeft', 'dirtEdgeInnerLeftOuterRight', 'dirtEdgeInnerBoth']
];

const TERRAIN_CORNER_OFFSETS = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
];

const HOTBAR_X = 43;
const HOTBAR_Y = 155;
const HOTBAR_SLOT_SIZE = 26;

let hotbarSelector;
const hotbarItemImages = [];
const hotbarItemNames = [];
const ITEM_LABEL_DURATION = 1300;
let itemLabelUntil = 0;
let itemPrompt;
let selectedHotbarSlot = 0;
let worldObjectLayer;

const CHUNK_SIZE = 16;
const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE;

const WOOD_MASK_MARGIN = TILE_SIZE;
const WOOD_MASK_SIZE = CHUNK_PIXEL_SIZE + WOOD_MASK_MARGIN;
const WOOD_SHADOW_OFFSET = 2;
const SHORE_DISTANCE_MARGIN_TILES = 2;
const SHORE_DISTANCE_MAX = 24;
const WATER_BASE_COLOR = [0x68, 0x90, 0xca];

const CHUNK_LOAD_RADIUS = 1;
const CHUNK_DISCOVERY_RADIUS = 2;
const WORLD_SEED = 6767676767676;
const WORLD_HASH_MULTIPLIER = 1442695040888963407;
const WORLD_FEATURE_SCALE = 0.42;

const MIN_BRIDGE_WATER_LENGTH = 2;
const MAX_BRIDGE_WATER_LENGTH = 6;

const MIN_PIER_WATER_LENGTH = 4;
const MAX_PIER_WATER_LENGTH = 7;

const WORLD_CACHE_LIMIT = 50000;

const loadedChunks = new Map();
const loadedWaterChunks = new Set();
const loadedShimmerChunks = new Set();
const terrainTypeCache = new Map();
const worldTileCache = new Map();
const bridgeCandidateCache = new Map();
const pierCandidateCache = new Map();
const discoveredChunks = new Set();
const pendingChunks = [];
const pendingWaterChunks = [];
const shimmerPool = [];
const chunkCanvasPool = [];
let chunkCanvasCount = 0;
let waterPipeline;

let activeChunkX = null;
let activeChunkY = null;
let visibleChunkLeft = null;
let visibleChunkRight = null;
let visibleChunkTop = null;
let visibleChunkBottom = null;

let character;
let characterKeys;
let characterDirection = 'front';
let characterWalkPhase = 0;
let characterPace = 1;
let characterMoving = false;
const fishUniforms = new Float32Array(96);
const fishShapeUniforms = new Float32Array(96);
const FISH_MAX_VISIBLE = 24;
const FISH_VIEW_MARGIN = 12;
const FISH_LENGTHS = [5, 6, 8, 10, 12, 14];
const FISH_MIN_DEPTH = 3;
const FISH_PER_CHUNK_MAX = 5;
const FISH_WATER_PER_FISH = 5000;
const FISH_MIN_REGION = 1800;
const FISH_SWIM_SPEED = 13;
const FISH_ACCELERATION = 40;
const FISH_FLEE_ACCELERATION = 220;
const FISH_IDLE_TURN = 0.5;
const FISH_DRAG = 0.6;
const FISH_COAST_DRAG = 1.6;
const FISH_BURST_MIN = 300;
const FISH_BURST_RANGE = 350;
const FISH_COAST_MIN = 350;
const FISH_COAST_RANGE = 700;
const FISH_BEAT_THRUST = 3.2;
const FISH_BEAT_COAST = 0.9;
const FISH_BEAT_IDLE = 0.7;
const FISH_SWEEP_THRUST = 0.16;
const FISH_SWEEP_FLEE = 0.2;
const FISH_SWEEP_COAST = 0.05;
const FISH_SWEEP_IDLE = 0.06;
const FISH_FLEE_SPEED = 42;
const FISH_TURN = 2.2;
const FISH_FLEE_TURN = 7;
const FISH_NOTICE_MIN_DISTANCE = 7;
const FISH_NOTICE_MAX_DISTANCE = 44;
const FISH_NOTICE_DOT = 0.48;
const FISH_LURE_SPEED = 10;
const FISH_LURE_TURN = 5;
const FISH_LURE_PULSE_TIME = 240;
const FISH_INSPECT_MIN = 380;
const FISH_INSPECT_RANGE = 360;
const FISH_NIBBLE_DIP_TIME = 150;
const FISH_BITE_MIN_WINDOW = 280;
const FISH_BITE_MAX_WINDOW = 620;
const FISH_IDLE_MIN = 700;
const FISH_IDLE_RANGE = 2600;
const FISH_SCARE_DISTANCE = 40;
let horizontalPriority = 0;
let lastMenuWheelTime = -Infinity;
let verticalPriority = 0;

const CHARACTER_SIZE = 16;
const CHARACTER_SPEED = 60;
const CHARACTER_ANIMATION_SPEED = 8;
const CHARACTER_SPRINT_MULTIPLIER = 1.65;
const CHARACTER_WALK_FRAMES = [0, 1, 0, 2];
const CHARACTER_HITBOX_X = 4;
const CHARACTER_HITBOX_Y = 12;
const CHARACTER_HITBOX_WIDTH = 8;
const CHARACTER_HITBOX_HEIGHT = 4;
const CHARACTER_CORNER_NUDGE = 4;

const GUIDE_SIZE = 16;
const BUSH_HEIGHT = 22;
const ACTOR_SHADOW_X = 3;
const ACTOR_SHADOW_Y = 14;
const ACTOR_SHADOW_SHAPE = [
    '.########.',
    '##########',
    '..######..'
];
const SHADOW_PALETTE_TEXTURES = [
    'grass1', 'grass2', 'grass3', 'grass4', 'grassEdge', 'dirt1', 'dirtEdge',
    'corner', 'dirtEdgeCorner', 'dirtCliffCorner', 'cornerDirt1', 'cornerDirt2', 'cornerDirt3',
    'transition1', 'transition2', 'transition3', 'transition4', 'wood', 'woodLeft', 'woodRight', 'bush'
];
const GUIDE_INTERACTION_DISTANCE = 26;
const GUIDE_INTERACTION_DISTANCE_SQUARED = GUIDE_INTERACTION_DISTANCE ** 2;
const GUIDE_HITBOX_X = 4;
const GUIDE_HITBOX_Y = 12;
const GUIDE_HITBOX_WIDTH = 8;
const GUIDE_HITBOX_HEIGHT = 4;
const DIALOGUE_HIDDEN_Y = -78;
const DIALOGUE_VISIBLE_Y = 6;
const DIALOGUE_OPTION_X = 222;
const DIALOGUE_OPTION_TOP = 11;
const DIALOGUE_OPTION_STEP = 19;
const DIALOGUE_OPTION_WIDTH = 86;
const DIALOGUE_OPTION_HEIGHT = 17;
const MAP_PANEL_HEIGHT = 142;
const MAP_WIDTH = 296;
const MAP_HEIGHT = 114;
const MAP_TOP = 22;
const MAP_HIDDEN_Y = -MAP_PANEL_HEIGHT;
const INVENTORY_HEIGHT = 142;
const INVENTORY_HIDDEN_Y = -INVENTORY_HEIGHT;

const STORE_WIDTH_TILES = 3;
const STORE_HEIGHT_TILES = 2;
const STORE_WIDTH = STORE_WIDTH_TILES * TILE_SIZE;
const STORE_HEIGHT = STORE_HEIGHT_TILES * TILE_SIZE;
const STORE_HITBOX_X = 2;
const STORE_HITBOX_Y = STORE_HEIGHT - 8;
const STORE_HITBOX_WIDTH = STORE_WIDTH - 4;
const STORE_HITBOX_HEIGHT = 8;

const MARKET_INTERACTION_DISTANCE = 34;
const MARKET_INTERACTION_DISTANCE_SQUARED = MARKET_INTERACTION_DISTANCE ** 2;
const MARKET_HEIGHT = 142;
const MARKET_HIDDEN_Y = -MARKET_HEIGHT;
const MARKET_DIVIDER_Y = 19;
const MARKET_LIST_X = 12;
const MARKET_LIST_Y = 24;
const MARKET_LIST_WIDTH = 160;
const MARKET_ROW_HEIGHT = 20;
const MARKET_DETAIL_X = 178;
const MARKET_DETAIL_WIDTH = 130;
const MARKET_FOOTER_Y = 126;
const PROMPT_Y = HOTBAR_Y - 25;
const SHIMMER_RECOLOR_FROM = [0x87, 0xbe, 0xd8];
const SHIMMER_RECOLOR_TO = [0x78, 0xaf, 0xd3];

const MARKET_RODS = [
    { id: 'basic', label: 'Basic Rod', price: 10, castDistance: 72, chargeTime: 1000, lineStrength: 1, catchZone: 24 },
    { id: 'sturdy', label: 'Sturdy Rod', price: 25, castDistance: 88, chargeTime: 850, lineStrength: 1.35, catchZone: 29 },
    { id: 'iron', label: 'Iron Rod', price: 50, castDistance: 104, chargeTime: 720, lineStrength: 1.75, catchZone: 34 }
];
const MARKET_SELL_INDEX = MARKET_RODS.length;
const MARKET_EXIT_INDEX = MARKET_SELL_INDEX + 1;
const MARKET_ROW_COUNT = MARKET_RODS.length + 2;
const FISH_SPECIES = [
    { id: 'minnow', name: 'Pond Minnow', minSize: 0, maxSize: 1, minWater: 1800, weight: 6, price: 4 },
    { id: 'bluegill', name: 'Bluegill', minSize: 1, maxSize: 3, minWater: 2200, weight: 5, price: 8 },
    { id: 'carp', name: 'Carp', minSize: 2, maxSize: 4, minWater: 4800, weight: 2.5, price: 16 },
    { id: 'bass', name: 'Largemouth Bass', minSize: 3, maxSize: 5, minWater: 7000, weight: 1.5, price: 26 },
    { id: 'catfish', name: 'Catfish', minSize: 4, maxSize: 5, minWater: 8500, weight: 0.9, price: 38 },
    { id: 'koi', name: 'Koi', minSize: 1, maxSize: 4, minWater: 9000, weight: 0.45, price: 52 }
];
const SAVE_KEY = 'pixcation-save-v1';

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
        text: "WASD or arrows walk, Shift runs. E talks or shops, M opens your map, I opens your fishpedia.",
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
let shadowLayer;
let characterShadow;
const shadowLut = new Map();
const bushShadowPoints = [];
const staticShadowCasters = [];
const particlePool = [];
const availableParticles = [];
let fishing = null;
let fishingLine;
let fishingUi;
let fishingActionHeld = false;
const CAST_MIN_DISTANCE = 16;
const CAST_METER_WIDTH = 14;
let castCharge = null;
const CAST_DURATION = 420;
const CAST_ARC = 18;
const CAST_SWING_DURATION = 170;
const CAST_HANG_TIME = 55;
const REEL_DURATION = 220;
const ROPE_SEGMENT_LENGTH = 4;
const ROPE_GRAVITY = 52;
const ROPE_CONSTRAINT_PASSES = 5;
const BOBBER_LAND_TIME = 180;
const BOBBER_BOB_TIME = 450;
const SPLASH_PARTICLES = 8;
const SPLASH_LIFETIME = 300;
const FISHING_LINE_COLOR = 0xf6f5e5;
const FISHING_GAME_X = 286;
const FISHING_GAME_Y = 34;
const FISHING_GAME_WIDTH = 22;
const FISHING_GAME_HEIGHT = 104;
const FISHING_GAME_PROGRESS_WIDTH = 3;
const FISHING_GAME_PLAY_TOP = 5;
const FISHING_GAME_PLAY_HEIGHT = 91;
const CATCH_CARD_Y = 116;
const CATCH_CARD_DURATION = 2400;
const BOBBER_TOP_COLOR = 0xb46044;
const ROD_COLOR = 0xa4694b;
const BOBBER_BOTTOM_COLOR = 0xf6f5e5;
const LEAVES_PER_RUSTLE = 2;
const LEAF_LIFETIME = 420;
const LEAF_COLORS = [0x6c955d, 0x4a7a52];
const BUSH_FOOTPRINT_LEFT = 3;
const BUSH_FOOTPRINT_RIGHT = 29;
const BUSH_FOOTPRINT_HEIGHT = 12;
const BUSH_RUSTLE_PATTERN = [1, 0, -1, 0, 1, 0];
const BUSH_RUSTLE_STEP = 55;
const BUSH_RUSTLE_REPEAT = 420;
const DUST_PER_STEP = 3;
const DUST_LIFETIME = 330;
const DUST_COLORS = [0xa7825a, 0xb69a6c, 0x9f7751];
const GRASS_FLECK_COLORS = [0xb0c579, 0x8eb067];
const GRASS_FLECKS_PER_STEP = 2;
let store;
let guideWasNear = false;
let guideHasMetPlayer = false;
let dialogueContainer;
let dialogueTextLayer;
let dialogueText;
let dialogueOptionTexts = [];
let dialogueHighlight;
let dialogueOpen = false;
let mapOpen = false;
let mapContainer;
let mapImage;
let mapTexture;
let mapTextLayer;
let mapDrag = null;
let mapDirty = false;
const mapPan = { x: 0, y: 0 };
const MAP_PAN_SPEED = 90;
const MAP_MAX_ZOOM = 3;
let mapZoom = 1;
let mapPalette = null;
let inventoryOpen = false;
let inventoryContainer;
let inventoryTextLayer;
let inventorySummaryText;
let inventoryRowTexts = [];
let inventoryCountTexts = [];
let inventoryNewGameText;
let newGameConfirmUntil = 0;
let catchCardContainer;
let catchCardTextLayer;
let catchCardTitle;
let catchCardDetail;
let catchCardHideEvent;
let catchCardUntil = 0;
let marketOpen = false;
let marketContainer;
let marketTextLayer;
let marketOptionTexts = [];
let marketMessageText;
let marketRodImages = [];
let marketPriceTexts = [];
let marketHighlight;
let marketDetailImage;
let marketDetailName;
let marketDetailStatus;
let marketDetailStats;
let marketDetailAction;
let marketFeedback = null;
let selectedMarketOption = 0;
let playerCoins = 100;
const coinDisplay = { value: playerCoins };
const ownedRods = new Set();
const fishInventory = new Map();
const catchLog = new Set();
let saveDirty = false;
let newGameResetting = false;

let interactionPromptLayer;
let marketPrompt;
let guidePrompt;

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

let cameraOffsetX = 0;
let cameraOffsetY = 0;

let promptState = -1;
const promptMotion = { value: 0 };
const PROMPT_SLIDE = 4;

function preload() {
    const tileKeys = [
        'dirt1',
        'dirtEdge',
        'cornerDirt1',
        'cornerDirt2',
        'cornerDirt3',
        'dirtEdgeCorner',
        'dirtEdgeOuterLeft',
        'dirtEdgeOuterRight',
        'dirtEdgeOuterBoth',
        'dirtEdgeInnerLeft',
        'dirtEdgeInnerRight',
        'dirtCliffCorner',
        'waterDirtInnerLeft',
        'waterDirtInnerRight',
        'corner',
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
            withCacheBuster(`media/character/${frame}.png`)
        )
    });

    tileKeys.forEach(tileKey => {
        this.load.image(tileKey, withCacheBuster(`media/${tileKey}.png`));
    });

    this.load.image('hotbar', withCacheBuster('media/hotbar.png'));
    this.load.image('selected', withCacheBuster('media/selected.png'));
    this.load.image('bush', withCacheBuster('media/bush.png'));

    this.load.image('guide', withCacheBuster('media/guide.png'));
    this.load.image('headshot', withCacheBuster('media/headshot.png'));
    this.load.image('store', withCacheBuster('media/store.png'));
    this.load.image('rod', withCacheBuster('media/rod.png'));

    this.load.image('waterOverlay', withCacheBuster('media/waterOverlay.png'));
    this.load.image('shimmer-art', withCacheBuster('media/shimmer.png'));
}

function createShimmerSheet(scene) {
    const source = getTextureSource(scene, 'shimmer-art');
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;

    const context = canvas.getContext('2d');
    context.drawImage(source, 0, 0);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const [fromR, fromG, fromB] = SHIMMER_RECOLOR_FROM;
    const [toR, toG, toB] = SHIMMER_RECOLOR_TO;

    for (let index = 0; index < image.data.length; index += 4) {
        if (image.data[index] === fromR && image.data[index + 1] === fromG && image.data[index + 2] === fromB) {
            image.data[index] = toR;
            image.data[index + 1] = toG;
            image.data[index + 2] = toB;
        }
    }

    context.putImageData(image, 0, 0);
    scene.textures.addSpriteSheet('shimmer', canvas, { frameWidth: 12, frameHeight: 1 });
}

function extractBushShadow(scene) {
    const pixels = getTerrainPixels(scene, 'bush');
    const { width, height } = pixels;
    const colorAt = index => (pixels.data[index * 4] << 16) | (pixels.data[index * 4 + 1] << 8) | pixels.data[index * 4 + 2];
    const seeds = new Set([0x6e8e45, 0xa0bc73]);
    const passable = new Set([0x6e8e45, 0xa0bc73, 0x8eb067, 0xb0c579]);
    const shadow = new Uint8Array(width * height);
    const queue = [];

    for (let index = 0; index < width * height; index++) {
        if (pixels.data[index * 4 + 3] && seeds.has(colorAt(index))) {
            shadow[index] = 1;
            queue.push(index);
        }
    }

    while (queue.length > 0) {
        const index = queue.pop();
        const x = index % width;
        const y = Math.floor(index / width);

        for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
            if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;

            const next = nextY * width + nextX;

            if (!shadow[next] && pixels.data[next * 4 + 3] && passable.has(colorAt(next))) {
                shadow[next] = 1;
                queue.push(next);
            }
        }
    }

    const texture = scene.textures.createCanvas('bush-art', width, height);
    const context = texture.getContext();
    const image = context.createImageData(width, height);

    image.data.set(pixels.data);

    for (let index = 0; index < width * height; index++) {
        if (shadow[index]) {
            image.data[index * 4 + 3] = 0;
        }
    }

    context.putImageData(image, 0, 0);
    texture.refresh();

    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && image.data[(y * width + x) * 4 + 3] > 0;

    bushShadowPoints.length = 0;

    for (let y = 0; y < height + WOOD_SHADOW_OFFSET; y++) {
        for (let x = 0; x < width + WOOD_SHADOW_OFFSET; x++) {
            if (solid(x - WOOD_SHADOW_OFFSET, y - WOOD_SHADOW_OFFSET) && !solid(x, y)) {
                bushShadowPoints.push(x, y);
            }
        }
    }
}

function createBushSlices(scene) {
    const source = getTextureSource(scene, 'bush-art');
    const { width, height} = source;

    for (let slice = 0; slice < TILE_SIZE; slice++) {
        const key = `bush-slice-${slice}`;
        if (scene.textures.exists(key)) continue;

        const texture = scene.textures.createCanvas(key, width, height);
        const context = texture.getContext();

        context.drawImage(source, 0, 0);
        const image = context.getImageData(0, 0, width, height);

        for (let y= 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const depth = Math.min(TILE_SIZE - 1, Math.floor(
                    (worldHash(x, y, 761) * 0.7 +
                        (y / (height - 1)) * 0.3) * TILE_SIZE
                ));

                if (depth !== slice) {
                    image.data[(y * width + x) * 4 + 3] = 0;
                }
            }
        }

        context.putImageData(image, 0, 0);
        texture.refresh();
    }
}

function createRoundedCliffTextures(scene) {
    const source = key => getTextureSource(scene, key);

    for (let left = 0; left < DIRT_CLIFF_TILES.length; left++) {
        for (let right = 0; right < DIRT_CLIFF_TILES[left].length; right++) {
            const key = DIRT_CLIFF_TILES[left][right];

            if (!scene.textures.exists(key)) {
                const texture = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
                const context = texture.getContext();
                const half = TILE_SIZE / 2;

                context.drawImage(
                    source(DIRT_CLIFF_TILES[left][0]),
                    0, 0, half, TILE_SIZE,
                    0, 0, half, TILE_SIZE
                );
                context.drawImage(
                    source(DIRT_CLIFF_TILES[0][right]),
                    half, 0, half, TILE_SIZE,
                    half, 0, half, TILE_SIZE
                );
                texture.refresh();
            }

            const cliffKey = left === 1 || right === 1 ? `${key}-trimmed` : key;

            if (!scene.textures.exists(cliffKey)) {
                const texture = scene.textures.createCanvas(cliffKey, TILE_SIZE, TILE_SIZE);
                const context = texture.getContext();
                context.drawImage(source(key), 0, 0);

                if (left === 1) {
                    context.clearRect(0, TILE_SIZE - 1, 2, 1);
                    context.clearRect(0, TILE_SIZE - 2, 1, 1);
                }

                if (right === 1) {
                    context.clearRect(TILE_SIZE - 2, TILE_SIZE - 1, 2, 1);
                    context.clearRect(TILE_SIZE - 1, TILE_SIZE - 2, 1, 1);
                }

                texture.refresh();
            }

            for (const corner of ['cornerDirt1', 'cornerDirt2', 'cornerDirt3']) {
                const roundedKey = `${cliffKey}-${corner}`;
                if (scene.textures.exists(roundedKey)) continue;

                const texture = scene.textures.createCanvas(roundedKey, TILE_SIZE, TILE_SIZE);
                const context = texture.getContext();

                context.drawImage(source(cliffKey), 0, 0);
                context.clearRect(0, 0, TILE_SIZE, 5);
                context.drawImage(
                    source(corner),
                    0, 0, TILE_SIZE, 5,
                    0, 0, TILE_SIZE, 5
                );
                texture.refresh();
            }
        }
    }

    for (const base of ['waterDirt', 'waterGrass']) {
        for (const [suffix, left, right] of [
            ['InnerLeft', true, false],
            ['InnerRight', false, true],
            ['InnerBoth', true, true]
        ]) {
            const key = `${base}${suffix}`;
            if (scene.textures.exists(key)) continue;

            const texture = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
            const context = texture.getContext();
            context.drawImage(source(base), 0, 0);

            if (left) {
                context.drawImage(
                    source('waterDirtInnerLeft'),
                    0, 0, 5, TILE_SIZE,
                    0, 0, 5, TILE_SIZE
                );
            }

            if (right) {
                context.drawImage(
                    source('waterDirtInnerRight'),
                    TILE_SIZE - 5, 0, 5, TILE_SIZE,
                    TILE_SIZE - 5, 0, 5, TILE_SIZE
                );
            }

            texture.refresh();
        }
    }
}

function create() {
    this.textureSourceCache = new Map();
    this.terrainPixelCache = new Map();
    this.terrainSurfaceCache = new Map();
    this.shorelineTileCache = new Map();
    shadowLayer = this.add.layer().setDepth(2.5);
    worldObjectLayer = this.add.layer().setDepth(3);
    waterPipeline = this.game.renderer.pipelines.add('WaterWarp', new WaterWarpPipeline(this.game));
    buildShadowLut(this);
    extractBushShadow(this);
    createBushSlices(this);
    createRoundedCliffTextures(this);
    createShimmerSheet(this);

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    createCharacterShadow(this);
    fishingLine = this.add.graphics();
    worldObjectLayer.add(fishingLine);
    fishingUi = this.add.graphics()
        .setDepth(220)
        .setScrollFactor(0);

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
        rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT
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

    const selectHotBarSlot = (slot, immediate = false) => {
        selectedHotbarSlot = Phaser.Math.Wrap(slot, 0, 9);

        this.tweens.killTweensOf(hotbarSelector);
        const selectorX = HOTBAR_X - 2 + selectedHotbarSlot * HOTBAR_SLOT_SIZE;

        if (immediate) {
            hotbarSelector.x = selectorX;
        } else {
            this.tweens.add({
                targets: hotbarSelector,
                x: selectorX,
                duration: 70,
                ease: 'Quad.Out',
                onUpdate: (tween, target) => {
                    target.x = Math.round(target.x);
                }
            });
        }

        const name = hotbarItemNames[selectedHotbarSlot];

        if (name && itemPrompt) {
            itemPrompt.label.textContent = name;
            itemLabelUntil = this.time.now + ITEM_LABEL_DURATION;
        } else {
            itemLabelUntil = 0;
        }
    };

    this.input.on('pointermove', pointer => {
        if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);

            if (row !== -1 && row !== selectedMarketOption) {
                selectedMarketOption = row;
                marketFeedback = null;
                refreshMarketOptions();
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option !== -1 && option !== selectedDialogueOption) {
                selectedDialogueOption = option;
                refreshGuideDialogueOptions();
            }
        } else if (mapOpen && mapDrag && pointer.isDown) {
            mapPan.x = mapDrag.panX + Math.round((mapDrag.x - pointer.x) / mapZoom);
            mapPan.y = mapDrag.panY + Math.round((mapDrag.y - pointer.y) / mapZoom);
            mapDirty = true;
        }

        this.input.setDefaultCursor(
            !marketOpen && !dialogueOpen && !mapOpen && !inventoryOpen && getClickedWorldTarget(pointer) ? 'pointer' : 'default'
        );
    });

    this.input.on('pointerup', () => {
        mapDrag = null;
        fishingActionHeld = false;
        releaseCast(this.time.now);
    });

    this.input.keyboard.on('keyup', event => {
        if (event.code === 'Space') {
            fishingActionHeld = false;
            releaseCast(this.time.now);
        }
    });

    this.input.on('pointerdown', pointer => {
        if (inventoryOpen) {
            if (pointer.y > DIALOGUE_VISIBLE_Y + INVENTORY_HEIGHT) closeInventory(this);
        } else if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);

            if (row !== -1) {
                selectedMarketOption = row;
                buySelectedMarketItem(this);
            } else if (pointer.y > DIALOGUE_VISIBLE_Y + MARKET_HEIGHT) {
                closeMarket(this);
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option === -1) {
                finishGuideDialogueText();
            } else {
                selectedDialogueOption = option;
                selectGuideDialogueOption(this);
            }
        } else if (!mapOpen) {
            const target = getClickedWorldTarget(pointer);

            if (target === 'guide') {
                openGuideDialogue(this);
            } else if (target === 'market') {
                openMarket(this);
            } else {
                fishingActionHeld = true;
                beginCast(this.time.now);
            }
        } else {
            if (pointer.y < DIALOGUE_VISIBLE_Y + MAP_PANEL_HEIGHT) {
                mapDrag = { x: pointer.x, y: pointer.y, panX: mapPan.x, panY: mapPan.y };
            } else {
                closeMap(this);
            }
        }
    });

    this.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        const step = Math.sign(deltaY);

        if (!step) return;

        if (marketOpen || dialogueOpen || mapOpen || inventoryOpen) {
            if (pointer.event.timeStamp - lastMenuWheelTime < 120) return;
            lastMenuWheelTime = pointer.event.timeStamp;
        }

        if (inventoryOpen) {
            return;
        } else if (mapOpen) {
            const zoom = Phaser.Math.Clamp(mapZoom - step, 1, MAP_MAX_ZOOM);

            if (zoom !== mapZoom) {
                mapZoom = zoom;
                mapDirty = true;
            }
        } else if (marketOpen) {
            moveMarketSelection(step);
        } else if (dialogueOpen) {
            moveGuideDialogueSelection(step);
        } else if (!mapOpen) {
            selectHotBarSlot(selectedHotbarSlot + step, true);
        }
    });

    this.input.keyboard.on('keydown', event => {
        if (event.repeat) {
            return;
        }

        const code = event.code;

        if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
        if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
        if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
        if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;

        if (dialogueOpen) {
            handleGuideDialogueKey(this,event);
            return;
        }

        if (inventoryOpen) {
            handleInventoryKey(this, event);
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


        if (event.key.toLowerCase() === 'i') {
            openInventory(this);
            return;
        }

        if (event.code === 'Space') {
            fishingActionHeld = true;
            beginCast(this.time.now);
            return;
        }

        if (event.key.toLowerCase() === 'm') {
            openMap(this);
            return;
        }

        if (event.key.toLowerCase() === 'e') {
            const target = getInteractionTarget(true);

            if (target === 'guide') {
                openGuideDialogue(this);
            } else if (target === 'market') {
                openMarket(this);
            }

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

    spawnGuideAndStore(this);
    updateLoadedChunks(this, true);
    createGuideDialogueUI(this);
    createMapUI(this);
    createMarketUI(this);
    createInventoryUI(this);
    createCatchCardUI(this);
    createInteractionPromptUI(this);
    const testMode = new URLSearchParams(window.location.search).has('test');

    if (testMode) {
        window.PIXCATION_TEST_RESULTS = runAutomatedTests(this);
    } else {
        loadProgress(this);
    }

    for (let index = 0; index < 20; index++) {
        spawnShimmer(this);
    }

    this.time.addEvent({
        delay: 320,
        callback: () => spawnShimmer(this),
        loop: true
    });

    if (!testMode) {
        this.time.addEvent({
            delay: 2000,
            callback: saveProgress,
            loop: true
        });
    }
}

function loadProgress(scene) {
    let saved;

    try {
        saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    } catch (error) {
        return;
    }

    if (!saved || saved.version !== 1) return;

    if (Number.isFinite(saved.coins) && saved.coins >= 0) {
        playerCoins = Math.floor(saved.coins);
        coinDisplay.value = playerCoins;
    }

    guideHasMetPlayer = saved.guideMet === true;

    for (const id of Array.isArray(saved.rods) ? saved.rods : []) {
        const rod = MARKET_RODS.find(candidate => candidate.id === id);

        if (rod && !ownedRods.has(id)) {
            ownedRods.add(id);
            addHotbarItem(scene, 'rod', rod.label);
        }
    }

    for (const [id, count] of Array.isArray(saved.fish) ? saved.fish : []) {
        if (FISH_SPECIES.some(species => species.id === id) && Number.isInteger(count) && count > 0) {
            fishInventory.set(id, count);
        }
    }

    for (const id of Array.isArray(saved.catchLog) ? saved.catchLog : []) {
        if (FISH_SPECIES.some(species => species.id === id)) catchLog.add(id);
    }

    for (const tileId of Array.isArray(saved.explored) ? saved.explored : []) {
        if (Number.isSafeInteger(tileId)) discoveredChunks.add(tileId);
    }

    refreshMarketOptions();
    mapDirty = true;
}

function saveProgress() {
    if (newGameResetting || !saveDirty || new URLSearchParams(window.location.search).has('test')) return;

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            version: 1,
            coins: playerCoins,
            rods: [...ownedRods],
            fish: [...fishInventory],
            catchLog: [...catchLog],
            explored: [...discoveredChunks],
            guideMet: guideHasMetPlayer
        }));
        saveDirty = false;
    } catch (error) {
        saveDirty = true;
    }
}

function runAutomatedTests(scene) {
    const results = [];
    const record = (name, passed, detail) => results.push({ name, passed, detail });
    const rodsImprove = MARKET_RODS.slice(1).every((rod, index) => {
        const previous = MARKET_RODS[index];
        return rod.castDistance > previous.castDistance &&
            rod.chargeTime < previous.chargeTime &&
            rod.lineStrength > previous.lineStrength &&
            rod.catchZone > previous.catchZone;
    });

    record('Rod upgrades improve all fishing stats', rodsImprove, rodsImprove ? 'Distance, speed, strength and zone are monotonic' : 'Rod progression regressed');
    const originalX = character.x;
    const originalY = character.y;
    let seed = 0x51f15e;
    let movementPassed = true;

    const random = () => {
        seed = Math.imul(seed ^ seed >>> 15, 2246822519);
        seed = Math.imul(seed ^ seed >>> 13, 3266489917);
        return ((seed ^= seed >>> 16) >>> 0) / 4294967296;
    };

    for (let step = 0; step < 20000; step++) {
        const axis = random() < 0.5;
        const direction = random() < 0.5 ? -1 : 1;

        stepCharacter(scene, axis ? direction : 0, axis ? 0 : direction, true);

        if (!canCharacterOccupy(scene, character.x, character.y)) {
            movementPassed = false;
            break;
        }
    }

    character.setPosition(originalX, originalY);
    record('20,000 collision-safe movement steps', movementPassed, movementPassed ? 'No water or solid overlap' : 'Invalid player position');

    let fishCount = 0;
    let fishPassed = true;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            fishCount++;
            if (!canFishSwim(chunk, fish, fish.x, fish.y)) fishPassed = false;
        }
    }

    record('Fish remain in valid water regions', fishPassed, `${fishCount} fish checked`);

    let connectedBorders = 0;
    let borderRoutingPassed = true;
    let migrationProbe = null;

    for (const chunk of loadedWaterChunks) {
        for (const [offsetX, offsetY] of [[1, 0], [0, 1]]) {
            const neighbor = loadedChunks.get(getChunkKey(chunk.chunkX + offsetX, chunk.chunkY + offsetY));
            if (!neighbor || !neighbor.fishRegions) continue;

            for (let offset = 0; offset < CHUNK_PIXEL_SIZE; offset++) {
                const sourceX = chunk.chunkX * CHUNK_PIXEL_SIZE + (offsetX ? CHUNK_PIXEL_SIZE - 0.5 : offset + 0.5);
                const sourceY = chunk.chunkY * CHUNK_PIXEL_SIZE + (offsetY ? CHUNK_PIXEL_SIZE - 0.5 : offset + 0.5);
                const targetX = sourceX + offsetX;
                const targetY = sourceY + offsetY;
                const sourceRegion = getFishRegionAt(chunk, sourceX, sourceY);

                if (
                    !sourceRegion ||
                    getFishDepth(chunk, sourceX, sourceY) < FISH_MIN_DEPTH + 1.5 ||
                    getFishDepth(neighbor, targetX, targetY) < FISH_MIN_DEPTH + 1.5
                ) {
                    continue;
                }

                connectedBorders++;
                const probe = { radius: 1.5, region: sourceRegion };
                if (!canFishSwim(chunk, probe, targetX, targetY)) borderRoutingPassed = false;
                if (!migrationProbe) migrationProbe = { chunk, neighbor, sourceRegion, targetX, targetY };
            }
        }
    }

    record(
        'Connected water crosses chunk borders',
        borderRoutingPassed,
        connectedBorders ? `${connectedBorders} deep-water border points checked` : 'No deep-water border in the initial test area'
    );

    if (migrationProbe) {
        const probeFish = {
            x: migrationProbe.targetX,
            y: migrationProbe.targetY,
            region: migrationProbe.sourceRegion
        };

        migrationProbe.chunk.fish.push(probeFish);
        const migrated = migrateFishToChunk(migrationProbe.chunk, migrationProbe.neighbor, probeFish);
        const targetIndex = migrationProbe.neighbor.fish.indexOf(probeFish);
        const migrationPassed = migrated && targetIndex !== -1 && migrationProbe.chunk.fish.indexOf(probeFish) === -1;

        if (targetIndex !== -1) migrationProbe.neighbor.fish.splice(targetIndex, 1);
        record('Fish ownership migrates between chunks', migrationPassed, migrationPassed ? 'Source removed and destination adopted fish' : 'Migration failed');
    }

    const rope = createFishingRope(0, 0, 0, 0, 88);

    for (let frame = 0; frame < 240; frame++) {
        const amount = frame / 239;
        updateFishingRope(rope, 0, 0, 72 * amount, 12 - Math.sin(amount * Math.PI) * 18, 1000 / 60, frame > 180 ? 1 : 0.6);
    }

    const finite = rope.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    const first = rope.points[0];
    const last = rope.points[rope.points.length - 1];
    const anchored = first.x === 0 && first.y === 0 && Math.abs(last.x - 72) < 0.01 && Math.abs(last.y - 12) < 0.01;

    record('Cast rope stays finite and anchored', finite && anchored, `${rope.points.length} simulated points`);

    const activeParticlesBeforeSnap = particlePool.filter(image => image.active).length;
    spawnLineSnap(scene, scene.time.now, rope);
    const activeParticlesAfterSnap = particlePool.filter(image => image.active).length;
    const snapPassed = activeParticlesAfterSnap > activeParticlesBeforeSnap;

    record('Line failure creates visible fragments', snapPassed, `${activeParticlesAfterSnap - activeParticlesBeforeSnap} fragments spawned`);

    for (const image of particlePool) {
        if (image.active && image.particle.born === scene.time.now && image.particle.lifetime === 300) {
            releaseParticle(image);
        }
    }

    const particleCountBeforeReuse = particlePool.length;
    const availableBeforeReuse = availableParticles.length;
    spawnParticle(scene, shadowLayer, {
        born: scene.time.now,
        x: 0,
        y: 0,
        drift: 0,
        rise: 0,
        lifetime: 1
    }, FISHING_LINE_COLOR);
    const reusedParticle = particlePool.length === particleCountBeforeReuse && availableParticles.length === availableBeforeReuse - 1;
    const reusedImage = particlePool.find(image => image.active && image.particle.lifetime === 1);
    if (reusedImage) releaseParticle(reusedImage);
    record('Particle pool reuses objects in constant time', reusedParticle, reusedParticle ? 'Free-list object reused' : 'Unexpected allocation');

    showCatchCard(scene, scene.time.now, FISH_SPECIES[1], 2);
    const catchCardPassed = catchCardTitle.textContent === 'You caught a Bluegill!' &&
        catchCardDetail.textContent.includes('8c') && catchCardContainer.visible;

    record('Catch card presents species and value', catchCardPassed, catchCardPassed ? 'Name, size and price rendered' : 'Catch card content missing');
    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    scene.tweens.killTweensOf(catchCardContainer);
    scene.tweens.killTweensOf(catchCardTextLayer);
    catchCardContainer.setVisible(false);
    catchCardTextLayer.setVisible(false);
    catchCardUntil = 0;

    return {
        passed: results.every(result => result.passed),
        generatedAt: new Date().toISOString(),
        results
    };
}

function getTileId(tileX, tileY) {
    return tileX * 67108864 + tileY;
}

function coordinateHash(x, y, seedHash) {
    let number = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seedHash;
    
    number ^= number >>> 13;

    number = Math.imul(number, 1274126177);

    return (((number ^ (number >>> 16)) >>> 0) / 4294967295);
}

function worldHash(x, y, salt = 0) {
    return coordinateHash(
        x,
        y,
        Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER)
    );
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

    const seedHash = Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER);
    const topLeft = coordinateHash(left, top, seedHash);
    const topRight = coordinateHash(left + 1, top, seedHash);
    const bottomLeft = coordinateHash(left, top + 1, seedHash);
    const bottomRight = coordinateHash(left + 1, top + 1, seedHash);

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
    const key = getTileId(tileX, tileY);
    const cached = terrainTypeCache.get(key);

    if (cached !== undefined) {
        return cached;
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

function cacheBridgeCandidate(key, bridge) {
    if (bridgeCandidateCache.size >= WORLD_CACHE_LIMIT) {
        bridgeCandidateCache.clear();
    }

    bridgeCandidateCache.set(key, bridge);
    return bridge;
}

function getBridgeCandidate(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const key = getTileId(tileX, tileY) * 2 + (salt === 811 ? 1 : 0);
    const cached = bridgeCandidateCache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    const run = findWaterRun(tileX, tileY, stepX, stepY);

    if (!run) {
        return cacheBridgeCandidate(key, null);
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
                return cacheBridgeCandidate(key, null);
            }
        } else if (
            getTerrainType(firstX, firstY) !== 'water' ||
            getTerrainType(secondX, secondY) !== 'water'
        ) {
            return cacheBridgeCandidate(key, null);
        }
    }

    let crossesChannel = false;

    for (let distance = 1; distance < spanLength - 1 && !crossesChannel; distance++) {
        const firstX = run.startLandX + stepX * distance;
        const firstY = run.startLandY + stepY * distance;

        crossesChannel =
            getTerrainType(firstX - widthX, firstY - widthY) === 'water' &&
            getTerrainType(firstX + widthX * 2, firstY + widthY * 2) === 'water';
    }

    if (!crossesChannel || !isLocalHashPeak(
        run.startLandX,
        run.startLandY,
        widthX,
        widthY,
        4,
        salt
    )) {
        return cacheBridgeCandidate(key, null);
    }

    const bridge = {
        startX: run.startLandX,
        startY: run.startLandY,
        stepX,
        stepY,
        widthX,
        widthY,
        spanLength
    };

    return cacheBridgeCandidate(key, bridge);
}

function isTileInBridge(tileX, tileY, bridge) {
    const offsetX = tileX - bridge.startX;
    const offsetY = tileY - bridge.startY;
    const distance = offsetX * bridge.stepX + offsetY * bridge.stepY;
    const width = offsetX * bridge.widthX + offsetY * bridge.widthY;

    return distance >= 0 && distance < bridge.spanLength &&
        (width === 0 || width === 1);
}

function getBridgeTile(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);

    if (
        terrain === 'water' ||
        getTerrainType(tileX, tileY - 1) === 'water' ||
        getTerrainType(tileX, tileY + 1) === 'water'
    ) {
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
                    rotation: 0,
                    bridge: true
                };
            }
        }
    }

    if (
        terrain === 'water' ||
        getTerrainType(tileX - 1, tileY) === 'water' ||
        getTerrainType(tileX + 1, tileY) === 'water'
    ) {
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
                    rotation: Math.PI / 2,
                    bridge: true
                };
            }
        }
    }

    return null;
}

function getPierCandidate(anchorX, anchorY) {
    const key = getTileId(anchorX, anchorY);
    const cached = pierCandidateCache.get(key);

    if (cached !== undefined) {
        return cached;
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
    if (
        getTerrainType(tileX, tileY) !== 'water' &&
        getTerrainType(tileX, tileY + 1) !== 'water'
    ) {
        return null;
    }

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
        return 'dirt1';
    }

    const decoration = worldHash(tileX, tileY, 670);

    if (decoration > 0.80) {
        if (valueNoise(tileX, tileY, 8, 671) > 0.62) {
            return valueNoise(tileX + 149, tileY - 83, 24, 672) > 0.5
                ? 'grass4'
                : 'grass3';
        }

        return 'grass2';
    }

    return 'grass1';
}

function getTerrainTile(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);
    const north = getTerrainType(tileX, tileY - 1);
    const south = getTerrainType(tileX, tileY + 1);
    const west = getTerrainType(tileX - 1, tileY);
    const east = getTerrainType(tileX + 1, tileY);

    const tile = {
        key: getTerrainTileKey(tileX, tileY),
        rotation: 0
    };

    if (terrain === 'dirt' && south === 'water') {
        const left = west === 'water' ? 1
            : getTerrainType(tileX - 1, tileY + 1) !== 'water' ? 2 : 0;
        const right = east === 'water' ? 1
            : getTerrainType(tileX + 1, tileY + 1) !== 'water' ? 2 : 0;

        tile.textureKey = DIRT_CLIFF_TILES[left][right];

        if (left === 1 || right === 1) {
            tile.baseKey = 'water';
            tile.textureKey += '-trimmed';
        }
    }

    if (terrain === 'dirt' && north === 'water') {
        const left = west === 'water';
        const right = east === 'water';

        if (left || right) {
            const corner = left && right ? 'cornerDirt3'
                : left ? 'cornerDirt1' : 'cornerDirt2';

            tile.baseKey = 'water';
            tile.textureKey = south === 'water'
                ? `${tile.textureKey}-${corner}` : corner;
        }
    }

    if (terrain === 'water' && north !== 'water') {
        const left = west !== 'water' &&
            getTerrainType(tileX - 1, tileY - 1) !== 'water';
        const right = east !== 'water' &&
            getTerrainType(tileX + 1, tileY - 1) !== 'water';

        if (left || right) {
            const suffix = left && right ? 'InnerBoth'
                : left ? 'InnerLeft' : 'InnerRight';

            tile.textureKey = `${tile.key}${suffix}`;
        }
    }

    for (const [dx, dy] of TERRAIN_CORNER_OFFSETS) {
        const horizontal = dx < 0 ? west : east;
        const vertical = dy < 0 ? north : south;

        let key;
        let size;

        if (
            terrain === 'dirt' &&
            horizontal === 'grass' &&
            vertical === 'grass'
        ) {
            key = 'corner';
            size = 7;
        } else if (
            terrain === 'grass' &&
            horizontal === 'dirt' &&
            vertical === 'dirt'
        ) {
            key = 'dirtEdgeCorner';
            size = 5;
        } else if (
            terrain === 'water' &&
            horizontal !== 'water' &&
            vertical !== 'water' &&
            getTerrainType(tileX + dx, tileY + dy) !== 'water'
        ) {
            key = dy < 0 ? 'dirtCliffCorner' : 'dirtEdgeCorner';
            size = 5;
        } else {
            continue;
        }

        tile.patches ||= [];
        tile.patches.push({
            key,
            x: dx < 0 ? 0 : TILE_SIZE - size,
            y: dy < 0 ? 0 : TILE_SIZE - size,
            size,
            flipX: dx > 0,
            flipY: dy > 0
        });
    }

    return tile;
}

function getWorldTile(tileX, tileY) {
    const key = getTileId(tileX, tileY);
    const cached = worldTileCache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    const tile = getBridgeTile(tileX, tileY) || getPierTile(tileX, tileY) || getTerrainTile(tileX, tileY);
    const name = tile.key.toLowerCase();

    tile.blocking = name.includes('water') ? 'full'
        : name.includes('edge') || name.includes('left') || name.includes('right') ? 'lower'
        : null;

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

function isTileDiscovered(tileX, tileY) {
    return discoveredChunks.has(getTileId(
        Math.floor(tileX / CHUNK_SIZE),
        Math.floor(tileY / CHUNK_SIZE)
    ));
}

function getTextureSource(scene, key) {
    let source = scene.textureSourceCache.get(key);

    if (!source) {
        source = scene.textures.get(key).getSourceImage();
        scene.textureSourceCache.set(key, source);
    }

    return source;
}

function getTerrainPixels(scene, key) {
    const cached = scene.terrainPixelCache.get(key);
    if (cached) return cached;

    const source = getTextureSource(scene, key);
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    scene.terrainPixelCache.set(key, pixels);
    return pixels;
}

function getTerrainSurface(scene, tile) {
    if (tile.surface) return tile.surface;

    const signature = JSON.stringify([
        tile.key, tile.textureKey, tile.baseKey, tile.rotation, tile.patches
    ]);
    const cached = scene.terrainSurfaceCache.get(signature);

    if (cached) {
        tile.surface = cached;
        return tile.surface;
    }

    const isWater = tile.key.startsWith('water');
    const isWood = tile.key.startsWith('wood');
    const pixels = getTerrainPixels(scene, tile.textureKey || tile.key);
    const land = new Uint8Array(TILE_SIZE * TILE_SIZE);
    const water = new Uint8Array(TILE_SIZE * TILE_SIZE);

    for (let index = 0; index < land.length; index++) {
        const opaque = pixels.data[index * 4 + 3] > 0;
        land[index] = !isWater && !isWood && opaque ? 1 : 0;
        water[index] = isWater || tile.baseKey === 'water' && !opaque ? 1 : 0;
    }

    for (const patch of tile.patches || []) {
        const pixels = getTerrainPixels(scene, patch.key);

        for (let y = 0; y < pixels.height; y++) {
            for (let x = 0; x < pixels.width; x++) {
                const sourceX = patch.flipX ? pixels.width - 1 - x : x;
                const sourceY = patch.flipY ? pixels.height - 1 - y : y;
                if (!pixels.data[(sourceY * pixels.width + sourceX) * 4 + 3]) continue;

                const index = (patch.y + y) * TILE_SIZE + patch.x + x;
                land[index] = 1;
                water[index] = 0;
            }
        }
    }

    const surface = { signature, land, water };
    scene.terrainSurfaceCache.set(signature, surface);
    tile.surface = surface;
    return surface;
}

function getShorelineTile(scene, tile, northTile) {
    const surface = getTerrainSurface(scene, tile);
    const north = getTerrainSurface(scene, northTile);
    const signature = `${surface.signature}|${north.signature}`;
    const cached = scene.shorelineTileCache.get(signature);
    if (cached) return cached;

    const textureKey = `shoreline-${scene.shorelineTileCache.size}`;
    const texture = scene.textures.createCanvas(textureKey, TILE_SIZE, TILE_SIZE);
    const context = texture.getContext();
    const image = context.createImageData(TILE_SIZE, TILE_SIZE);
    const base = getTerrainPixels(scene, 'water');
    const waterTile = tile.key.startsWith('water') && tile.key !== 'water';
    const shadowKey = waterTile ? tile.textureKey || tile.key
        : tile.key.startsWith('grass') || northTile.key.includes('Grass') ||
            northTile.key.startsWith('grass') ? 'waterGrass' : 'waterDirt';
    const shadow = getTerrainPixels(scene, shadowKey);
    const edges = new Uint8Array(TILE_SIZE * TILE_SIZE);

    for (let x = 0; x < TILE_SIZE; x++) {
        let distance = TILE_SIZE;

        for (let y = TILE_SIZE - 1; y >= 0; y--) {
            if (north.land[y * TILE_SIZE + x]) {
                distance = TILE_SIZE - 2 - y;
                break;
            }
        }

        let shadowOffset = 0;
        if (waterTile) {
            while (shadowOffset < TILE_SIZE &&
                surface.land[shadowOffset * TILE_SIZE + x]) {
                shadowOffset++;
            }
        }

        for (let y = 0; y < TILE_SIZE; y++) {
            const index = y * TILE_SIZE + x;

            if (surface.land[index]) {
                distance = -1;
                continue;
            }

            distance++;
            if (!surface.water[index]) continue;

            const shadowY = distance + shadowOffset;
            const shaded = shadowY < TILE_SIZE;
            const source = shaded ? shadow.data : base.data;
            const sourceIndex = ((shaded ? shadowY : y) * TILE_SIZE + x) * 4;
            const targetIndex = index * 4;
            image.data[targetIndex] = source[sourceIndex];
            image.data[targetIndex + 1] = source[sourceIndex + 1];
            image.data[targetIndex + 2] = source[sourceIndex + 2];
            image.data[targetIndex + 3] = source[sourceIndex + 3];
            edges[index] = distance === 0 ? 1 : 0;
        }
    }

    context.putImageData(image, 0, 0);
    texture.refresh();

    const runs = (mask, mergeRows = false) => {
        const cells = [];
        const previous = new Map();

        for (let y = 0; y < TILE_SIZE; y++) {
            let x = 0;

            while (x < TILE_SIZE) {
                if (!mask[y * TILE_SIZE + x]) {
                    x++;
                    continue;
                }

                const start = x;
                while (x < TILE_SIZE && mask[y * TILE_SIZE + x]) x++;
                const key = start * (TILE_SIZE + 1) + x - start;
                const above = previous.get(key);

                if (mergeRows && above && above.y + above.height === y) {
                    above.height++;
                } else {
                    const cell = { x: start, y, width: x - start, height: 1 };
                    cells.push(cell);
                    previous.set(key, cell);
                }
            }
        }

        return cells;
    };

    const shoreline = {
        textureKey,
        waterCells: runs(surface.water, true),
        edgeCells: runs(edges)
    };
    scene.shorelineTileCache.set(signature, shoreline);
    return shoreline;
}

function gatherNearbyWoodTiles(chunkX, chunkY, woodTiles) {
    const tiles = woodTiles.slice();

    for (let localY = -1; localY <= CHUNK_SIZE; localY++) {
        const edgeRow = localY === -1 || localY === CHUNK_SIZE;

        for (let localX = -1; localX <= CHUNK_SIZE; localX += edgeRow ? 1 : CHUNK_SIZE + 1) {
            const tile = getWorldTile(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);

            if (tile.key.startsWith('wood')) {
                tiles.push(localX, localY, tile);
            }
        }
    }

    return tiles;
}

function getChunkWoodMask(scene, tiles) {
    if (tiles.length === 0) {
        return null;
    }

    const mask = new Uint8Array(WOOD_MASK_SIZE * WOOD_MASK_SIZE);

    for (let index = 0; index < tiles.length; index += 3) {
        if (tiles[index] === CHUNK_SIZE || tiles[index + 1] === CHUNK_SIZE) continue;

        const tile = tiles[index + 2];
        const deck = getDeckBounds(scene, tile.key);
        const rotated = Boolean(tile.rotation);
        const left = rotated ? TILE_SIZE - deck.bottom : deck.left;
        const right = rotated ? TILE_SIZE - deck.top : deck.right;
        const top = rotated ? deck.left : deck.top;
        const bottom = rotated ? deck.right : deck.bottom;
        const originX = tiles[index] * TILE_SIZE + WOOD_MASK_MARGIN;
        const originY = tiles[index + 1] * TILE_SIZE + WOOD_MASK_MARGIN;

        for (let y = top - 1; y <= bottom; y++) {
            for (let x = left - 1; x <= right; x++) {
                const maskIndex = (originY + y) * WOOD_MASK_SIZE + originX + x;
                const core = x >= left && x < right && y >= top && y < bottom;

                if (core) {
                    mask[maskIndex] = 2;
                } else if (mask[maskIndex] === 0 && ((x + y) & 1) === 0) {
                    mask[maskIndex] = 1;
                }
            }
        }
    }

    return mask;
}

function getDeckBounds(scene, key) {
    scene.deckBoundsCache ||= new Map();

    const cached = scene.deckBoundsCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const bounds = { left: TILE_SIZE, right: 0, top: TILE_SIZE, bottom: 0 };

    for (let y = 0; y < TILE_SIZE; y++) {
        let opaque = 0;
        let rowLeft = TILE_SIZE;
        let rowRight = 0;

        for (let x = 0; x < TILE_SIZE; x++) {
            if (pixels[(y * TILE_SIZE + x) * 4 + 3]) {
                opaque++;
                rowLeft = Math.min(rowLeft, x);
                rowRight = x + 1;
            }
        }

        if (opaque * 2 < TILE_SIZE) continue;

        bounds.top = Math.min(bounds.top, y);
        bounds.bottom = y + 1;
        bounds.left = Math.min(bounds.left, rowLeft);
        bounds.right = Math.max(bounds.right, rowRight);
    }

    scene.deckBoundsCache.set(key, bounds);
    return bounds;
}

function getShoreDistances(scene, chunkX, chunkY) {
    const margin = SHORE_DISTANCE_MARGIN_TILES * TILE_SIZE;
    const size = CHUNK_PIXEL_SIZE + margin * 2;
    const distances = new Uint16Array(size * size);

    for (let localY = -SHORE_DISTANCE_MARGIN_TILES; localY < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localY++) {
        for (let localX = -SHORE_DISTANCE_MARGIN_TILES; localX < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;
            let tile = getWorldTile(tileX, tileY);

            if (tile.key.startsWith('wood')) {
                tile = getTerrainTile(tileX, tileY);
            }

            const water = getTerrainSurface(scene, tile).water;
            const originX = localX * TILE_SIZE + margin;
            const originY = localY * TILE_SIZE + margin;

            for (let y = 0; y < TILE_SIZE; y++) {
                const row = (originY + y) * size + originX;

                for (let x = 0; x < TILE_SIZE; x++) {
                    distances[row + x] = water[y * TILE_SIZE + x] ? 65535 : 0;
                }
            }
        }
    }

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const index = y * size + x;
            let value = distances[index];
            if (value === 0) continue;

            if (x > 0) value = Math.min(value, distances[index - 1] + 3);
            if (y > 0) {
                value = Math.min(value, distances[index - size] + 3);
                if (x > 0) value = Math.min(value, distances[index - size - 1] + 4);
                if (x < size - 1) value = Math.min(value, distances[index - size + 1] + 4);
            }

            distances[index] = value;
        }
    }

    for (let y = size - 1; y >= 0; y--) {
        for (let x = size - 1; x >= 0; x--) {
            const index = y * size + x;
            let value = distances[index];
            if (value === 0) continue;

            if (x < size - 1) value = Math.min(value, distances[index + 1] + 3);
            if (y < size - 1) {
                value = Math.min(value, distances[index + size] + 3);
                if (x < size - 1) value = Math.min(value, distances[index + size + 1] + 4);
                if (x > 0) value = Math.min(value, distances[index + size - 1] + 4);
            }

            distances[index] = value;
        }
    }

    const result = new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        const row = (y + margin) * size + margin;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            result[y * CHUNK_PIXEL_SIZE + x] = Math.min(SHORE_DISTANCE_MAX, Math.round(distances[row + x] / 3));
        }
    }

    return result;
}

function forEachStaticShadowPoint(chunkX, chunkY, callback) {
    const minTileX = chunkX * CHUNK_SIZE - 2;
    const minTileY = chunkY * CHUNK_SIZE - 1;
    const maxTileX = (chunkX + 1) * CHUNK_SIZE;
    const maxTileY = (chunkY + 1) * CHUNK_SIZE + 1;

    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
        for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
            if (!hasBushAt(tileX, tileY)) continue;

            const originX = tileX * TILE_SIZE;
            const originY = (tileY + 1) * TILE_SIZE - BUSH_HEIGHT;

            for (let point = 0; point < bushShadowPoints.length; point += 2) {
                callback(originX + bushShadowPoints[point], originY + bushShadowPoints[point + 1]);
            }
        }
    }

    for (const caster of staticShadowCasters) {
        for (let row = 0; row < caster.shape.length; row++) {
            for (let column = 0; column < caster.shape[row].length; column++) {
                if (caster.shape[row][column] === '#') {
                    callback(caster.x + column, caster.y + row);
                }
            }
        }
    }
}

function getStaticShadowMask(chunkX, chunkY) {
    const originX = chunkX * CHUNK_PIXEL_SIZE;
    const originY = chunkY * CHUNK_PIXEL_SIZE;
    let mask = null;

    forEachStaticShadowPoint(chunkX, chunkY, (x, y) => {
        const localX = x - originX;
        const localY = y - originY;

        if (localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE) return;

        mask ||= new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);
        mask[localY * CHUNK_PIXEL_SIZE + localX] = 1;
    });

    return mask;
}

function isFlatShadowTile(tile) {
    return !tile.patches && (tile.key.startsWith('grass') || tile.key === 'dirt1');
}

function bakeGroundShadows(scene, context, chunkX, chunkY, mask) {
    let minX = CHUNK_PIXEL_SIZE;
    let minY = CHUNK_PIXEL_SIZE;
    let maxX = -1;
    let maxY = -1;
    const detailed = [];

    for (let localY = 0; localY < CHUNK_PIXEL_SIZE; localY++) {
        let runStart = -1;
        let runColor = null;

        const flush = end => {
            if (runStart === -1) return;
            context.fillStyle = runColor;
            context.fillRect(runStart, localY, end - runStart, 1);
            runStart = -1;
        };

        for (let localX = 0; localX < CHUNK_PIXEL_SIZE; localX++) {
            const pixel = localY * CHUNK_PIXEL_SIZE + localX;
            let color = null;

            if (mask[pixel]) {
                const tile = getWorldTile(
                    chunkX * CHUNK_SIZE + Math.floor(localX / TILE_SIZE),
                    chunkY * CHUNK_SIZE + Math.floor(localY / TILE_SIZE)
                );

                if (!getTerrainSurface(scene, tile).water[(localY % TILE_SIZE) * TILE_SIZE + localX % TILE_SIZE]) {
                    if (isFlatShadowTile(tile)) {
                        color = getShadowStyle(scene, tile.key);
                    } else {
                        detailed.push(pixel);
                        minX = Math.min(minX, localX);
                        minY = Math.min(minY, localY);
                        maxX = Math.max(maxX, localX);
                        maxY = Math.max(maxY, localY);
                    }
                }
            }

            if (color !== runColor || !color) {
                flush(localX);
                if (color) {
                    runStart = localX;
                    runColor = color;
                }
            }
        }

        flush(CHUNK_PIXEL_SIZE);
    }

    if (detailed.length === 0) {
        return;
    }

    const width = maxX - minX + 1;
    const image = context.getImageData(minX, minY, width, maxY - minY + 1);

    for (const pixel of detailed) {
        const index = ((Math.floor(pixel / CHUNK_PIXEL_SIZE) - minY) * width + pixel % CHUNK_PIXEL_SIZE - minX) * 4;
        if (!image.data[index + 3]) continue;

        const shaded = shadeColor(image.data[index], image.data[index + 1], image.data[index + 2]);
        image.data[index] = shaded[0];
        image.data[index + 1] = shaded[1];
        image.data[index + 2] = shaded[2];
    }

    context.putImageData(image, minX, minY);
}

function getShadowStyle(scene, key) {
    scene.shadowStyleCache ||= new Map();

    let style = scene.shadowStyleCache.get(key);

    if (!style) {
        const base = getDominantColor(scene, key);
        const shaded = shadeColor(base[0], base[1], base[2]);
        style = `rgb(${shaded[0]}, ${shaded[1]}, ${shaded[2]})`;
        scene.shadowStyleCache.set(key, style);
    }

    return style;
}

function getWaterMaskBase(scene) {
    if (scene.waterMaskBase) return scene.waterMaskBase;

    const pattern = getTerrainPixels(scene, 'waterOverlay');
    const base = new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            const alpha = pattern.data[((y % pattern.height) * pattern.width + x % pattern.width) * 4 + 3];
            base[index + 1] = alpha > 192 ? 2 : alpha > 64 ? 1 : 0;
            base[index + 3] = 255;
        }
    }

    scene.waterMaskBase = base;
    return base;
}

function createReadableCanvasTexture(scene, key, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d', { willReadFrequently: true });

    return scene.textures.addCanvas(key, canvas);
}

function acquireChunkCanvas(scene) {
    const texture = chunkCanvasPool.pop() || createReadableCanvasTexture(
        scene,
        `chunk-canvas-${chunkCanvasCount++}`,
        CHUNK_PIXEL_SIZE,
        CHUNK_PIXEL_SIZE
    );
    const context = texture.getContext();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    context.imageSmoothingEnabled = false;

    return texture;
}

function drawChunkTexture(context, scene, key, x, y, rotation = 0, flipX = false, flipY = false) {
    const source = getTextureSource(scene, key);
    const { width, height } = source;

    if (rotation) {
        const cos = Math.round(Math.cos(rotation));
        const sin = Math.round(Math.sin(rotation));

        context.setTransform(cos, sin, -sin, cos, x + width / 2, y + height / 2);
        context.drawImage(source, -width / 2, -height / 2);
    } else if (flipX || flipY) {
        context.setTransform(
            flipX ? -1 : 1, 0, 0, flipY ? -1 : 1,
            flipX ? x + width : x,
            flipY ? y + height : y
        );
        context.drawImage(source, 0, 0);
    } else {
        context.drawImage(source, x, y);
        return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
}

function createChunkLayer(scene, texture, x, y, depth) {
    texture.refresh();

    return scene.add.image(x, y, texture.key)
        .setOrigin(0)
        .setDepth(depth);
}

function createWorldChunk(scene, chunkX, chunkY, deferWater = false) {
    const key = getChunkKey(chunkX, chunkY);

    if (loadedChunks.has(key)) {
        return;
    }

    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;

    const tileSprites = [];
    const waterCells = [];
    const waterMaskCells = [];
    const edgeCells = [];
    const woodTiles = [];
    const bushes = [];
    const shorelineTiles = [];
    const groundTexture = acquireChunkCanvas(scene);
    const groundContext = groundTexture.getContext();
    let upperTexture = null;
    let upperContext = null;

    const getUpperContext = () => {
        if (!upperContext) {
            upperTexture = acquireChunkCanvas(scene);
            upperContext = upperTexture.getContext();
        }

        return upperContext;
    };

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;

            const worldTile = getWorldTile(tileX, tileY);
            const terrainTile = worldTile.bridge
                ? getTerrainTile(tileX, tileY)
                : worldTile;
            const tileKey = terrainTile.key;
            const isWater = tileKey.startsWith('water');
            let shoreline = null;

            if (isWater || terrainTile.baseKey === 'water') {
                const northWorldTile = getWorldTile(tileX, tileY - 1);
                const northTile = northWorldTile.bridge
                    ? getTerrainTile(tileX, tileY - 1)
                    : northWorldTile;
                shoreline = getShorelineTile(scene, terrainTile, northTile);
                shorelineTiles.push(localX, localY, shoreline.textureKey);
            }

            const drawX = localX * TILE_SIZE;
            const drawY = localY * TILE_SIZE;

            if (terrainTile.baseKey) {
                drawChunkTexture(
                    groundContext,
                    scene,
                    shoreline ? shoreline.textureKey : terrainTile.baseKey,
                    drawX,
                    drawY
                );
            }

            drawChunkTexture(
                terrainTile.baseKey === 'water' ? getUpperContext() : groundContext,
                scene,
                isWater ? shoreline.textureKey : terrainTile.textureKey || tileKey,
                drawX,
                drawY,
                terrainTile.rotation
            );

            for (const patch of terrainTile.patches || []) {
                drawChunkTexture(
                    getUpperContext(),
                    scene,
                    patch.key,
                    drawX + patch.x,
                    drawY + patch.y,
                    0,
                    patch.flipX,
                    patch.flipY
                );
            }

            if (worldTile.bridge) {
                drawChunkTexture(
                    getUpperContext(),
                    scene,
                    worldTile.key,
                    drawX,
                    drawY,
                    worldTile.rotation
                );

            }

            if (worldTile.key.startsWith('wood')) {
                woodTiles.push(localX, localY, worldTile);
            }

            if (hasBushAt(tileX, tileY)) {
                const baseY = (tileY + 1) * TILE_SIZE;
                const bush = { x: tileX * TILE_SIZE, y: baseY, slices: [], rustleStart: -Infinity, touching: false, offset: 0 };

                for (let slice = 0; slice < TILE_SIZE; slice++) {
                    const image = scene.add.image(
                        bush.x, baseY, `bush-slice-${slice}`
                    )
                        .setOrigin(0, 1)
                        .setDepth(baseY - TILE_SIZE + slice + 0.5);

                    worldObjectLayer.add(image);
                    tileSprites.push(image);
                    bush.slices.push(image);
                }

                bushes.push(bush);
            }

            if (shoreline) {
                const worldX = tileX * TILE_SIZE;
                const worldY = tileY * TILE_SIZE;

                for (const cell of shoreline.waterCells) {
                    const positioned = {
                        x: worldX + cell.x,
                        y: worldY + cell.y,
                        width: cell.width,
                        height: cell.height
                    };

                    waterMaskCells.push(positioned);
                    if (isWater && cell.width >= 12) waterCells.push(positioned);
                }

                for (const cell of shoreline.edgeCells) {
                    edgeCells.push(worldX + cell.x, worldY + cell.y, cell.width);
                }
            }
        }
    }

    const shadowMask = getStaticShadowMask(chunkX, chunkY);
    if (shadowMask) {
        bakeGroundShadows(scene, groundContext, chunkX, chunkY, shadowMask);
    }
    const groundLayer = createChunkLayer(scene, groundTexture, pixelX, pixelY, 0);
    const upperLayer = upperTexture
        ? createChunkLayer(scene, upperTexture, pixelX, pixelY, 1.5)
        : null;

    const chunk = {
        key,
        chunkX,
        chunkY,
        tileSprites,
        groundLayer,
        groundTexture,
        upperLayer,
        upperTexture,
        waterCells,
        visible: true,
        shimmers: [],
        overlay: null,
        waterTexture: null,
        shadowMask,
        bushes,
        fish: [],
        pixels: null,
        waterBuild: waterMaskCells.length > 0
            ? { waterMaskCells, edgeCells, woodTiles, shorelineTiles }
            : null
    };

    loadedChunks.set(key, chunk);
    if (waterCells.length > 0) loadedShimmerChunks.add(chunk);

    if (chunk.waterBuild) {
        if (deferWater) {
            pendingWaterChunks.push(chunk);
        } else {
            buildChunkWater(scene, chunk);
        }
    }
}

function buildChunkWater(scene, chunk) {
    const { chunkX, chunkY, shadowMask } = chunk;
    const { waterMaskCells, edgeCells, woodTiles, shorelineTiles } = chunk.waterBuild;
    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;

    chunk.waterBuild = null;

    const waterTexture = acquireChunkCanvas(scene);
    const context = waterTexture.getContext();
    const image = context.createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    const data = image.data;

    data.set(getWaterMaskBase(scene));

    for (const cell of waterMaskCells) {
        const localX = cell.x - pixelX;
        const localY = cell.y - pixelY;

        for (let y = localY; y < localY + cell.height; y++) {
            let index = (y * CHUNK_PIXEL_SIZE + localX) * 4;

            for (let x = 0; x < cell.width; x++, index += 4) {
                data[index] = 255;
            }
        }
    }

    const shoreDistances = getShoreDistances(scene, chunkX, chunkY);
    chunk.shoreDistances = shoreDistances;
    chunk.fish = [];
    spawnChunkFish(chunk);

    for (let pixel = 0, index = 0; pixel < shoreDistances.length; pixel++, index += 4) {
        if (data[index]) {
            data[index + 1] += shoreDistances[pixel] * 3;
        }
    }

    for (let tile = 0; tile < shorelineTiles.length; tile += 3) {
        const art = getTerrainPixels(scene, shorelineTiles[tile + 2]).data;
        const originX = shorelineTiles[tile] * TILE_SIZE;
        const originY = shorelineTiles[tile + 1] * TILE_SIZE;

        for (let y = 0; y < TILE_SIZE; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const source = (y * TILE_SIZE + x) * 4;
                const target = ((originY + y) * CHUNK_PIXEL_SIZE + originX + x) * 4;

                if (
                    data[target] &&
                    art[source + 3] &&
                    (art[source] !== WATER_BASE_COLOR[0] ||
                        art[source + 1] !== WATER_BASE_COLOR[1] ||
                        art[source + 2] !== WATER_BASE_COLOR[2])
                ) {
                    data[target] = 128;
                }
            }
        }
    }

    if (shadowMask) {
        for (let pixel = 0, index = 0; pixel < shadowMask.length; pixel++, index += 4) {
            if (shadowMask[pixel] && data[index]) {
                data[index] = 128;
            }
        }
    }

    const nearbyWood = gatherNearbyWoodTiles(chunkX, chunkY, woodTiles);
    const woodMask = getChunkWoodMask(scene, nearbyWood);

    if (woodMask) {
        for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
            const maskRow = (y + WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET) * WOOD_MASK_SIZE +
                WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET;
            let index = y * CHUNK_PIXEL_SIZE * 4;

            for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
                if (data[index] && woodMask[maskRow + x]) {
                    data[index] = 128;
                }
            }
        }
    }

    for (let cell = 0; cell < edgeCells.length; cell += 3) {
        let index = ((edgeCells[cell + 1] - pixelY) * CHUNK_PIXEL_SIZE + edgeCells[cell] - pixelX) * 4 + 2;

        for (let x = 0; x < edgeCells[cell + 2]; x++, index += 4) {
            data[index] = 255;
        }
    }

    context.putImageData(image, 0, 0);
    waterTexture.refresh();

    chunk.waterTexture = waterTexture;
    chunk.overlay = scene.add.image(pixelX, pixelY, waterTexture.key)
        .setOrigin(0)
        .setDepth(1)
        .setVisible(chunk.visible)
        .setPipeline('WaterWarp');
    loadedWaterChunks.add(chunk);
}


function destroyWorldChunk(key) {
    const chunk = loadedChunks.get(key);

    if (!chunk) {
        return;
    }

    for (const shimmer of chunk.shimmers.slice()) {
        shimmer.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
        releaseShimmer(chunk, shimmer);
    }

    for (const tileSprite of chunk.tileSprites) {
        tileSprite.destroy();
    }

    chunk.groundLayer.destroy();
    chunkCanvasPool.push(chunk.groundTexture);

    if (chunk.upperLayer) {
        chunk.upperLayer.destroy();
        chunkCanvasPool.push(chunk.upperTexture);
    }

    if (chunk.overlay) {
        chunk.overlay.destroy();
    }



    if (chunk.waterTexture) {
        chunkCanvasPool.push(chunk.waterTexture);
    }

    loadedWaterChunks.delete(chunk);
    loadedShimmerChunks.delete(chunk);
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

    const discoveredBefore = discoveredChunks.size;

    for (let offsetY = -CHUNK_DISCOVERY_RADIUS; offsetY <= CHUNK_DISCOVERY_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_DISCOVERY_RADIUS; offsetX <= CHUNK_DISCOVERY_RADIUS; offsetX++) {
            discoveredChunks.add(getTileId(
                centerChunkX + offsetX,
                centerChunkY + offsetY
            ));
        }
    }

    if (discoveredChunks.size !== discoveredBefore) saveDirty = true;

    pendingChunks.length = 0;

    for (let offsetY = -CHUNK_LOAD_RADIUS; offsetY <= CHUNK_LOAD_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_LOAD_RADIUS; offsetX <= CHUNK_LOAD_RADIUS; offsetX++) {
            const chunkX = centerChunkX + offsetX;
            const chunkY = centerChunkY + offsetY;

            if (force || offsetX === 0 && offsetY === 0) {
                createWorldChunk(scene, chunkX, chunkY);
            } else if (!loadedChunks.has(getChunkKey(chunkX, chunkY))) {
                pendingChunks.push(chunkX, chunkY);
            }
        }
    }

    for (const [key, chunk] of loadedChunks) {
        if (
            Math.abs(chunk.chunkX - centerChunkX) > CHUNK_LOAD_RADIUS ||
            Math.abs(chunk.chunkY - centerChunkY) > CHUNK_LOAD_RADIUS
        ) {
            destroyWorldChunk(key);
        }
    }

    activeChunkX = centerChunkX;
    activeChunkY = centerChunkY;
    visibleChunkLeft = null;
}

function buildPendingChunk(scene) {
    while (pendingChunks.length > 0) {
        const chunkY = pendingChunks.pop();
        const chunkX = pendingChunks.pop();

        if (
            Math.abs(chunkX - activeChunkX) > CHUNK_LOAD_RADIUS ||
            Math.abs(chunkY - activeChunkY) > CHUNK_LOAD_RADIUS ||
            loadedChunks.has(getChunkKey(chunkX, chunkY))
        ) {
            continue;
        }

        createWorldChunk(scene, chunkX, chunkY, true);
        visibleChunkLeft = null;
        return;
    }

    while (pendingWaterChunks.length > 0) {
        const chunk = pendingWaterChunks.shift();

        if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) {
            buildChunkWater(scene, chunk);
            return;
        }
    }
}

function updateChunkVisibility() {
    const left = mainCamera.scrollX;
    const top = mainCamera.scrollY;
    const right = left + mainCamera.width;
    const bottom = top + mainCamera.height;
    const chunkLeft = Math.floor(left / CHUNK_PIXEL_SIZE);
    const chunkRight = Math.ceil(right / CHUNK_PIXEL_SIZE) - 1;
    const chunkTop = Math.floor(top / CHUNK_PIXEL_SIZE);
    const chunkBottom = Math.ceil(bottom / CHUNK_PIXEL_SIZE) - 1;

    if (
        chunkLeft === visibleChunkLeft &&
        chunkRight === visibleChunkRight &&
        chunkTop === visibleChunkTop &&
        chunkBottom === visibleChunkBottom
    ) {
        return;
    }

    visibleChunkLeft = chunkLeft;
    visibleChunkRight = chunkRight;
    visibleChunkTop = chunkTop;
    visibleChunkBottom = chunkBottom;

    for (const chunk of loadedChunks.values()) {
        const visible = chunk.chunkX >= visibleChunkLeft &&
            chunk.chunkX <= visibleChunkRight &&
            chunk.chunkY >= visibleChunkTop &&
            chunk.chunkY <= visibleChunkBottom;

        if (visible === chunk.visible) continue;

        chunk.visible = visible;
        chunk.groundLayer.setVisible(visible);
        if (chunk.upperLayer) chunk.upperLayer.setVisible(visible);
        if (chunk.overlay) chunk.overlay.setVisible(visible);
    }
}

function updateChunkWater(time) {
    if (!waterPipeline || loadedWaterChunks.size === 0) return;

    waterPipeline.set1f('uTime', time / 1000);
    waterPipeline.set2f('uScroll', mainCamera.scrollX, mainCamera.scrollY);
    waterPipeline.set1f('uViewHeight', mainCamera.height);

    const left = mainCamera.scrollX - FISH_VIEW_MARGIN;
    const top = mainCamera.scrollY - FISH_VIEW_MARGIN;
    const right = mainCamera.scrollX + mainCamera.width + FISH_VIEW_MARGIN;
    const bottom = mainCamera.scrollY + mainCamera.height + FISH_VIEW_MARGIN;
    let count = 0;

    fishChunks: for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;

        for (const fish of chunk.fish) {
            if (count >= FISH_MAX_VISIBLE) break fishChunks;
            if (fish.x < left || fish.x > right || fish.y < top || fish.y > bottom) continue;

            fishUniforms[count * 4] = Math.round(fish.x);
            fishUniforms[count * 4 + 1] = Math.round(fish.y);
            fishUniforms[count * 4 + 2] = Math.cos(fish.heading);
            fishUniforms[count * 4 + 3] = Math.sin(fish.heading);
            fishShapeUniforms[count * 4] = fish.length;
            fishShapeUniforms[count * 4 + 1] = fish.radius;
            fishShapeUniforms[count * 4 + 2] = fish.phase;
            fishShapeUniforms[count * 4 + 3] = fish.amplitude;
            count++;
        }
    }

    waterPipeline.set4fv('uFish', fishUniforms);
    waterPipeline.set4fv('uFishShape', fishShapeUniforms);
    waterPipeline.set1f('uFishCount', count);
}

function getFishDepth(chunk, x, y) {
    const localX = Math.floor(x) - chunk.chunkX * CHUNK_PIXEL_SIZE;
    const localY = Math.floor(y) - chunk.chunkY * CHUNK_PIXEL_SIZE;

    if (localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE) {
        return 0;
    }

    return chunk.shoreDistances[localY * CHUNK_PIXEL_SIZE + localX];
}

function getFishChunkAt(x, y) {
    return loadedChunks.get(getChunkKey(
        Math.floor(x / CHUNK_PIXEL_SIZE),
        Math.floor(y / CHUNK_PIXEL_SIZE)
    ));
}

function getFishRegionAt(chunk, x, y) {
    if (!chunk || !chunk.fishRegions) return 0;

    const localX = Math.floor(x) - chunk.chunkX * CHUNK_PIXEL_SIZE;
    const localY = Math.floor(y) - chunk.chunkY * CHUNK_PIXEL_SIZE;

    if (localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE) return 0;
    return chunk.fishRegions[localY * CHUNK_PIXEL_SIZE + localX];
}

function canFishSwim(chunk, fish, x, y) {
    const left = chunk.chunkX * CHUNK_PIXEL_SIZE;
    const top = chunk.chunkY * CHUNK_PIXEL_SIZE;
    const targetChunk = x >= left && x < left + CHUNK_PIXEL_SIZE && y >= top && y < top + CHUNK_PIXEL_SIZE
        ? chunk
        : getFishChunkAt(x, y);

    if (!targetChunk || !targetChunk.fishRegions || getFishDepth(targetChunk, x, y) < FISH_MIN_DEPTH + fish.radius) {
        return false;
    }

    const targetRegion = getFishRegionAt(targetChunk, x, y);

    return targetRegion > 0 && (targetChunk !== chunk || targetRegion === fish.region);
}

function labelFishRegions(chunk) {
    const size = CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE;
    const labels = new Uint16Array(size);
    const stack = new Int32Array(size);
    const regions = [];

    for (let start = 0; start < size; start++) {
        if (labels[start] || chunk.shoreDistances[start] < FISH_MIN_DEPTH) continue;

        const label = regions.length + 1;
        const pixels = [];
        let top = 0;

        stack[top++] = start;
        labels[start] = label;

        while (top > 0) {
            const pixel = stack[--top];
            const x = pixel % CHUNK_PIXEL_SIZE;
            pixels.push(pixel);

            if (x > 0 && !labels[pixel - 1] && chunk.shoreDistances[pixel - 1] >= FISH_MIN_DEPTH) {
                labels[pixel - 1] = label;
                stack[top++] = pixel - 1;
            }

            if (x < CHUNK_PIXEL_SIZE - 1 && !labels[pixel + 1] && chunk.shoreDistances[pixel + 1] >= FISH_MIN_DEPTH) {
                labels[pixel + 1] = label;
                stack[top++] = pixel + 1;
            }

            if (pixel >= CHUNK_PIXEL_SIZE && !labels[pixel - CHUNK_PIXEL_SIZE] && chunk.shoreDistances[pixel - CHUNK_PIXEL_SIZE] >= FISH_MIN_DEPTH) {
                labels[pixel - CHUNK_PIXEL_SIZE] = label;
                stack[top++] = pixel - CHUNK_PIXEL_SIZE;
            }

            if (pixel < size - CHUNK_PIXEL_SIZE && !labels[pixel + CHUNK_PIXEL_SIZE] && chunk.shoreDistances[pixel + CHUNK_PIXEL_SIZE] >= FISH_MIN_DEPTH) {
                labels[pixel + CHUNK_PIXEL_SIZE] = label;
                stack[top++] = pixel + CHUNK_PIXEL_SIZE;
            }
        }

        regions.push(pixels);
    }

    chunk.fishRegions = labels;
    return regions;
}

function isFishPathClear(chunk, fish, targetX, targetY) {
    const distance = Math.hypot(targetX - fish.x, targetY - fish.y);
    const steps = Math.ceil(distance / 3);

    for (let step = 1; step <= steps; step++) {
        const amount = step / steps;

        if (!canFishSwim(chunk, fish, fish.x + (targetX - fish.x) * amount, fish.y + (targetY - fish.y) * amount)) {
            return false;
        }
    }

    return true;
}

function spawnChunkFish(chunk) {
    const originX = chunk.chunkX * CHUNK_PIXEL_SIZE;
    const originY = chunk.chunkY * CHUNK_PIXEL_SIZE;
    const regions = labelFishRegions(chunk);

    for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
        const region = regions[regionIndex];

        if (region.length < FISH_MIN_REGION) continue;

        const count = Math.min(
            FISH_PER_CHUNK_MAX - chunk.fish.length,
            Math.max(1, Math.floor(region.length / FISH_WATER_PER_FISH))
        );

        spawnRegionFish(chunk, region, regionIndex + 1, count, originX, originY);
    }
}

function chooseFishSpecies(size, waterArea) {
    const candidates = FISH_SPECIES.filter(species =>
        size >= species.minSize && size <= species.maxSize && waterArea >= species.minWater
    );
    const totalWeight = candidates.reduce((total, species) => total + species.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const species of candidates) {
        roll -= species.weight;
        if (roll <= 0) return species;
    }

    return candidates[0] || FISH_SPECIES[0];
}

function spawnRegionFish(chunk, region, label, count, originX, originY) {
    for (let index = 0; index < count; index++) {
        const size = Math.floor(Math.random() * FISH_LENGTHS.length);
        const fish = {
            x: 0,
            y: 0,
            length: FISH_LENGTHS[size],
            radius: Math.max(1.5, FISH_LENGTHS[size] * 0.24),
            heading: Math.random() * Math.PI * 2,
            topSpeed: 0,
            velocity: 0,
            phase: Math.random() * Math.PI * 2,
            amplitude: 0,
            thrusting: false,
            burstTimer: 0,
            idleTurn: (Math.random() - 0.5) * FISH_IDLE_TURN,
            state: 'idle',
            timer: Math.random() * 2000,
            targetX: 0,
            targetY: 0,
            region: label,
            size,
            species: chooseFishSpecies(size, region.length)
        };

        for (let attempt = 0; attempt < 40; attempt++) {
            const pixel = region[Math.floor(Math.random() * region.length)];
            const x = originX + pixel % CHUNK_PIXEL_SIZE + 0.5;
            const y = originY + Math.floor(pixel / CHUNK_PIXEL_SIZE) + 0.5;

            if (canFishSwim(chunk, fish, x, y)) {
                fish.x = x;
                fish.y = y;
                chunk.fish.push(fish);
                break;
            }
        }
    }
}

function chooseFishTarget(chunk, fish, awayX, awayY) {
    for (let attempt = 0; attempt < 8; attempt++) {
        let angle = Math.random() * Math.PI * 2;
        let distance = 12 + Math.random() * 34;

        if (awayX !== undefined) {
            angle = Math.atan2(awayY, awayX) + (Math.random() - 0.5) * 1.2;
            distance = 28 + Math.random() * 20;
        }

        const targetX = fish.x + Math.cos(angle) * distance;
        const targetY = fish.y + Math.sin(angle) * distance;

        if (isFishPathClear(chunk, fish, targetX, targetY)) {
            fish.targetX = targetX;
            fish.targetY = targetY;
            return true;
        }
    }

    return false;
}

function scatterFishFromSplash(x, y) {
    const radius = 12;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fishing && fishing.targetFish === fish) continue;

            const awayX = fish.x - x;
            const awayY = fish.y - y;

            if (
                awayX * awayX + awayY * awayY > radius * radius ||
                !chooseFishTarget(chunk, fish, awayX, awayY)
            ) {
                continue;
            }

            fish.state = 'flee';
            fish.topSpeed = FISH_FLEE_SPEED;
            fish.thrusting = true;
            fish.burstTimer = 700;
        }
    }
}

function updateLuredFish(chunk, fish, delta) {
    if (!fishing || fishing.targetFish !== fish) {
        fish.state = 'idle';
        fish.thrusting = false;
        fish.timer = FISH_IDLE_MIN;
        return false;
    }

    const seconds = Math.min(delta, 50) / 1000;
    const dx = fishing.bobberX - fish.x;
    const dy = fishing.bobberY - fish.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    let targetHeading = Math.atan2(dy, dx);

    fish.lureTime = (fish.lureTime || 0) + delta;

    if (
        fishing.state === 'inspecting' ||
        fishing.state === 'nibbleWait' ||
        fishing.state === 'nibbleDip' ||
        fishing.state === 'bite' ||
        fishing.state === 'hooked' ||
        fishing.state === 'minigame'
    ) {
        targetHeading += Math.sin(fish.lureTime / 180) * 0.32;
        fish.thrusting = false;
        fish.velocity *= Math.exp(-5 * seconds);
    } else {
        const pulsing = Math.floor(fish.lureTime / FISH_LURE_PULSE_TIME) % 2 === 0;

        fish.thrusting = pulsing;
        fish.velocity += pulsing ? FISH_ACCELERATION * 0.55 * seconds : 0;
        fish.velocity = Math.min(FISH_LURE_SPEED, fish.velocity);
        fish.velocity *= Math.exp(-(pulsing ? FISH_DRAG : FISH_COAST_DRAG * 1.8) * seconds);
    }

    let turn = targetHeading - fish.heading;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    fish.heading += Phaser.Math.Clamp(turn, -FISH_LURE_TURN * seconds, FISH_LURE_TURN * seconds);

    if (distance > fish.radius + 3 && fish.velocity > 0.05) {
        const nextX = fish.x + Math.cos(fish.heading) * fish.velocity * seconds;
        const nextY = fish.y + Math.sin(fish.heading) * fish.velocity * seconds;

        if (canFishSwim(chunk, fish, nextX, nextY)) {
            fish.x = nextX;
            fish.y = nextY;
        }
    }

    const beat = fish.thrusting ? FISH_BEAT_THRUST + fish.velocity * 0.12 : FISH_BEAT_IDLE;
    const sweep = fish.thrusting ? FISH_SWEEP_THRUST : FISH_SWEEP_IDLE;

    fish.phase = (fish.phase + Math.PI * 2 * beat * seconds) % (Math.PI * 2);
    fish.amplitude += (fish.length * sweep - fish.amplitude) * Math.min(1, seconds * 6);
    return true;
}

function migrateFishToChunk(chunk, targetChunk, fish) {
    const index = chunk.fish.indexOf(fish);
    const region = getFishRegionAt(targetChunk, fish.x, fish.y);

    if (index === -1 || !region) return false;

    chunk.fish.splice(index, 1);
    fish.region = region;
    targetChunk.fish.push(fish);

    if (fishing && fishing.targetFish === fish) fishing.targetChunk = targetChunk;
    return true;
}

function updateFish(delta) {
    const seconds = Math.min(delta, 50) / 1000;
    const playerX = character.x + CHARACTER_SIZE / 2;
    const playerY = character.y + CHARACTER_SIZE - 2;
    const running = characterPace > 1 && characterMoving;
    const migrations = [];

    const queueMigration = (chunk, fish) => {
        const targetChunk = getFishChunkAt(fish.x, fish.y);
        if (targetChunk && targetChunk !== chunk && loadedWaterChunks.has(targetChunk)) {
            migrations.push({ chunk, targetChunk, fish });
        }
    };

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish.state === 'lure' && updateLuredFish(chunk, fish, delta)) {
                queueMigration(chunk, fish);
                continue;
            }

            const awayX = fish.x - playerX;
            const awayY = fish.y - playerY;

            if (
                running &&
                fish.state !== 'flee' &&
                awayX * awayX + awayY * awayY < FISH_SCARE_DISTANCE * FISH_SCARE_DISTANCE &&
                chooseFishTarget(chunk, fish, awayX, awayY)
            ) {
                fish.state = 'flee';
                fish.topSpeed = FISH_FLEE_SPEED;
                fish.thrusting = true;
                fish.burstTimer = 900;
            }

            if (fish.state === 'idle') {
                fish.timer -= delta;
                fish.heading += fish.idleTurn * seconds;

                if (fish.timer <= 0) {
                    if (chooseFishTarget(chunk, fish)) {
                        fish.state = 'swim';
                        fish.topSpeed = FISH_SWIM_SPEED * (0.7 + Math.random() * 0.6);
                        fish.thrusting = true;
                        fish.burstTimer = FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE;
                    } else {
                        fish.timer = 500;
                    }
                }
            } else {
                fish.burstTimer -= delta;

                if (fish.burstTimer <= 0 && fish.state === 'swim') {
                    fish.thrusting = !fish.thrusting;
                    fish.burstTimer = fish.thrusting
                        ? FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE
                        : FISH_COAST_MIN + Math.random() * FISH_COAST_RANGE;
                } else if (fish.burstTimer <= 0) {
                    fish.state = 'swim';
                    fish.topSpeed = FISH_SWIM_SPEED;
                }

                const dx = fish.targetX - fish.x;
                const dy = fish.targetY - fish.y;
                const distance = Math.hypot(dx, dy);

                if (distance < 2) {
                    fish.state = 'idle';
                    fish.thrusting = false;
                    fish.timer = FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE;
                    fish.idleTurn = (Math.random() - 0.5) * FISH_IDLE_TURN;
                } else {
                    let turn = Math.atan2(dy, dx) - fish.heading;
                    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
                    const maxTurn = (fish.state === 'flee' ? FISH_FLEE_TURN : FISH_TURN) * seconds *
                        (0.4 + Math.min(1, fish.velocity / FISH_SWIM_SPEED) * 0.6);
                    fish.heading += Phaser.Math.Clamp(turn, -maxTurn, maxTurn);

                    if (fish.thrusting && Math.cos(turn) > 0) {
                        const acceleration = fish.state === 'flee' ? FISH_FLEE_ACCELERATION : FISH_ACCELERATION;
                        fish.velocity = Math.min(fish.topSpeed, fish.velocity + acceleration * seconds);
                    }
                }
            }

            fish.velocity *= Math.exp(-(fish.thrusting ? FISH_DRAG : FISH_COAST_DRAG) * seconds);

            const beat = fish.thrusting
                ? FISH_BEAT_THRUST + fish.velocity * 0.12
                : fish.state === 'idle' ? FISH_BEAT_IDLE : FISH_BEAT_COAST;
            const sweep = fish.thrusting
                ? (fish.state === 'flee' ? FISH_SWEEP_FLEE : FISH_SWEEP_THRUST)
                : fish.state === 'idle' ? FISH_SWEEP_IDLE : FISH_SWEEP_COAST;

            fish.phase = (fish.phase + Math.PI * 2 * beat * seconds) % (Math.PI * 2);
            fish.amplitude += (fish.length * sweep - fish.amplitude) * Math.min(1, seconds * 6);

            const nextX = fish.x + Math.cos(fish.heading) * fish.velocity * seconds;
            const nextY = fish.y + Math.sin(fish.heading) * fish.velocity * seconds;

            if (canFishSwim(chunk, fish, nextX, nextY)) {
                fish.x = nextX;
                fish.y = nextY;
            } else {
                fish.velocity = 0;
                fish.state = 'idle';
                fish.thrusting = false;
                fish.timer = FISH_IDLE_MIN;
            }

            queueMigration(chunk, fish);
        }
    }

    for (const migration of migrations) {
        migrateFishToChunk(migration.chunk, migration.targetChunk, migration.fish);
    }
}

function releaseShimmer(chunk, shimmer) {
    const index = chunk.shimmers.indexOf(shimmer);

    if (index !== -1) {
        chunk.shimmers.splice(index, 1);
    }

    shimmer.stop().setVisible(false).setActive(false);
    shimmerPool.push(shimmer);
}

function spawnShimmer(scene) {
    let visibleCount = 0;

    for (const candidate of loadedShimmerChunks) {
        if (candidate.visible) visibleCount++;
    }

    if (visibleCount === 0) {
        return;
    }

    let pick = Math.floor(Math.random() * visibleCount);
    let chunk;

    for (chunk of loadedShimmerChunks) {
        if (chunk.visible && pick-- === 0) break;
    }

    const cell = chunk.waterCells[Math.floor(Math.random() * chunk.waterCells.length)];
    const shimmer = shimmerPool.pop() || scene.add.sprite(0, 0, 'shimmer')
        .setOrigin(0)
        .setDepth(2);

    shimmer
        .setPosition(
            cell.x + Phaser.Math.Between(0, cell.width - 12),
            cell.y + Phaser.Math.Between(0, cell.height - 1)
        )
        .setVisible(true)
        .setActive(true);

    chunk.shimmers.push(shimmer);
    shimmer.play('shimmer');
    shimmer.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => releaseShimmer(chunk, shimmer));
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

    staticShadowCasters.push(
        { x: guide.x + ACTOR_SHADOW_X, y: guide.y + ACTOR_SHADOW_Y, shape: ACTOR_SHADOW_SHAPE },
        { x: store.x + WOOD_SHADOW_OFFSET, y: store.y + WOOD_SHADOW_OFFSET, shape: getStoreShadowShape() }
    );
}

function getStoreShadowShape() {
    const rows = [];

    for (let y = 0; y < STORE_HEIGHT; y++) {
        let row = '';

        for (let x = 0; x < STORE_WIDTH; x++) {
            row += x < STORE_WIDTH - WOOD_SHADOW_OFFSET && y < STORE_HEIGHT - WOOD_SHADOW_OFFSET ? '.' : '#';
        }

        rows.push(row);
    }

    return rows;
}

function buildShadowLut(scene) {
    const colors = new Map();

    for (const key of SHADOW_PALETTE_TEXTURES) {
        const pixels = getTerrainPixels(scene, key).data;

        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] < 255) continue;
            colors.set((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2], [
                pixels[index],
                pixels[index + 1],
                pixels[index + 2]
            ]);
        }
    }

    const describe = ([r, g, b]) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let hue = 0;

        if (delta) {
            hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
            hue = (hue * 60 + 360) % 360;
        }

        return { hue, saturation: max ? delta / max : 0, luma: r * 0.299 + g * 0.587 + b * 0.114 };
    };

    const entries = [...colors].map(([key, rgb]) => ({ key, rgb, ...describe(rgb) }));

    for (const color of entries) {
        let best = null;

        for (const other of entries) {
            const hueGap = Math.min(Math.abs(color.hue - other.hue), 360 - Math.abs(color.hue - other.hue));
            const distance = Math.hypot(
                color.rgb[0] - other.rgb[0],
                color.rgb[1] - other.rgb[1],
                color.rgb[2] - other.rgb[2]
            );

            if (
                other.luma < color.luma &&
                hueGap < 24 &&
                Math.abs(color.saturation - other.saturation) < 0.14 &&
                distance < 48 &&
                (!best || other.luma > best.luma)
            ) {
                best = other;
            }
        }

        shadowLut.set(color.key, best ? best.rgb : color.rgb.map(value => Math.round(value * 0.86)));
    }
}

function shadeColor(r, g, b) {
    return shadowLut.get((r << 16) | (g << 8) | b) || [
        Math.round(r * 0.86),
        Math.round(g * 0.86),
        Math.round(b * 0.86)
    ];
}

function getDominantColor(scene, key) {
    scene.dominantColorCache ||= new Map();

    const cached = scene.dominantColorCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const counts = new Map();
    let best = 0;
    let bestCount = 0;

    for (let index = 0; index < pixels.length; index += 4) {
        const color = (pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2];
        const count = (counts.get(color) || 0) + 1;

        counts.set(color, count);

        if (count > bestCount) {
            best = color;
            bestCount = count;
        }
    }

    const dominant = [best >> 16, (best >> 8) & 255, best & 255];
    scene.dominantColorCache.set(key, dominant);
    return dominant;
}

function getChunkPixels(chunk) {
    chunk.pixels ||= { ground: null, upper: null, upperRead: false };

    if (!chunk.pixels.ground) {
        chunk.pixels.ground = chunk.groundTexture.getContext()
            .getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data;
    }

    if (!chunk.pixels.upperRead) {
        chunk.pixels.upperRead = true;
        chunk.pixels.upper = chunk.upperTexture
            ? chunk.upperTexture.getContext().getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data
            : null;
    }

    return chunk.pixels;
}

function getGroundShadowColor(scene, worldX, worldY) {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);

    if (getTerrainSurface(scene, tile).water[(worldY - tileY * TILE_SIZE) * TILE_SIZE + worldX - tileX * TILE_SIZE]) {
        return null;
    }

    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const chunk = loadedChunks.get(getChunkKey(chunkX, chunkY));

    if (!chunk) {
        return null;
    }

    const pixel = (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE;

    if (chunk.shadowMask && chunk.shadowMask[pixel]) {
        return null;
    }

    if (isFlatShadowTile(tile)) {
        const base = getDominantColor(scene, tile.key);
        return shadeColor(base[0], base[1], base[2]);
    }

    const pixels = getChunkPixels(chunk);
    const index = pixel * 4;

    if (pixels.upper && pixels.upper[index + 3]) {
        return shadeColor(pixels.upper[index], pixels.upper[index + 1], pixels.upper[index + 2]);
    }

    if (!pixels.ground[index + 3]) {
        return null;
    }

    const base = tile.key.startsWith('grass') || tile.key === 'dirt1'
        ? getDominantColor(scene, tile.key)
        : pixels.ground.subarray(index, index + 3);

    return shadeColor(base[0], base[1], base[2]);
}

function kickUpDust(scene, time, moveX, moveY) {
    const footX = character.x + CHARACTER_SIZE / 2;
    const footY = character.y + CHARACTER_SIZE - 1;
    const tileX = Math.floor(footX / TILE_SIZE);
    const tileY = Math.floor(footY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);

    const terrain = getTerrainType(tileX, tileY);
    const colors = tile.key.startsWith('wood') ? null
        : terrain === 'dirt' ? DUST_COLORS
        : terrain === 'grass' && characterPace > 1 ? GRASS_FLECK_COLORS
        : null;

    if (!colors) {
        return;
    }

    for (let index = 0; index < (colors === DUST_COLORS ? DUST_PER_STEP : GRASS_FLECKS_PER_STEP); index++) {
        const side = index % 2 === 0 ? -1 : 1;
        const spread = Math.floor(Math.random() * 2);
        const offsetX = moveX !== 0
            ? -moveX * (5 + spread + index)
            : side * (5 + spread);
        const offsetY = moveY < 0
            ? 1 + spread
            : moveX !== 0 ? -spread : -1 - spread;

        spawnParticle(scene, shadowLayer, {
            born: time,
            x: Math.round(footX + offsetX),
            y: footY + offsetY,
            drift: moveX !== 0 ? -moveX : side,
            rise: -1,
            lifetime: DUST_LIFETIME
        }, colors[index % colors.length]);
    }
}

function dropLeaves(scene, time, bush) {
    for (let index = 0; index < LEAVES_PER_RUSTLE; index++) {
        spawnParticle(scene, worldObjectLayer, {
            born: time,
            x: bush.x + BUSH_FOOTPRINT_LEFT + Math.floor(Math.random() * (BUSH_FOOTPRINT_RIGHT - BUSH_FOOTPRINT_LEFT)),
            y: bush.y - BUSH_FOOTPRINT_HEIGHT + Math.floor(Math.random() * 4),
            drift: Math.random() < 0.5 ? -1 : 1,
            rise: 1,
            lifetime: LEAF_LIFETIME,
            depth: bush.y + 1
        }, LEAF_COLORS[index % LEAF_COLORS.length]);
    }
}

function spawnParticle(scene, layer, particle, color) {
    let image = availableParticles.pop();

    if (!image) {
        image = scene.add.image(0, 0, '__WHITE')
            .setOrigin(0)
            .setDisplaySize(1, 1);
        particlePool.push(image);
    }

    if (image.displayList !== layer) {
        layer.add(image);
    }

    image.particle = particle;
    image
        .setTint(color)
        .setDepth(particle.depth || 0)
        .setPosition(particle.x, particle.y)
        .setActive(true)
        .setVisible(true);
}

function updateParticles(time) {
    for (const image of particlePool) {
        if (!image.active) continue;

        const particle = image.particle;
        const age = time - particle.born;

        if (age >= particle.lifetime) {
            releaseParticle(image);
            continue;
        }

        const step = Math.floor(age / (particle.lifetime / 3));

        if (particle.ring) {
            const radius = 2 + step * 2;
            image.setPosition(
                particle.x + Math.round(particle.directionX * radius),
                particle.y + Math.round(particle.directionY * radius * 0.5)
            );
        } else {
            image.setPosition(particle.x + (step > 1 ? particle.drift : 0), particle.y + step * particle.rise);
        }
    }
}

function releaseParticle(image) {
    if (!image.active) return;
    image.setActive(false).setVisible(false);
    availableParticles.push(image);
}

function updateBushRustle(scene, time, isWalking) {
    const left = character.x + CHARACTER_HITBOX_X;
    const top = character.y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    for (const chunk of loadedChunks.values()) {
        for (const bush of chunk.bushes) {
            const touching =
                left < bush.x + BUSH_FOOTPRINT_RIGHT &&
                right > bush.x + BUSH_FOOTPRINT_LEFT &&
                top < bush.y &&
                bottom > bush.y - BUSH_FOOTPRINT_HEIGHT;

            if (touching && isWalking && (!bush.touching || time - bush.rustleStart > BUSH_RUSTLE_REPEAT)) {
                bush.rustleStart = time;
                dropLeaves(scene, time, bush);
            }

            bush.touching = touching;

            const age = time - bush.rustleStart;
            const offset = age < BUSH_RUSTLE_PATTERN.length * BUSH_RUSTLE_STEP
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)]
                : 0;

            if (offset === bush.offset) continue;

            bush.offset = offset;

            for (const slice of bush.slices) {
                slice.x = bush.x + offset;
            }
        }
    }
}

function hasRodSelected() {
    return (hotbarItemNames[selectedHotbarSlot] || '').endsWith('Rod');
}

function getSelectedRod() {
    const name = hotbarItemNames[selectedHotbarSlot];
    return MARKET_RODS.find(rod => rod.label === name) || MARKET_RODS[0];
}

function getCastDirection() {
    return characterDirection === 'left' ? [-1, 0]
        : characterDirection === 'right' ? [1, 0]
        : characterDirection === 'back' ? [0, -1]
        : [0, 1];
}

function getRodHand() {
    const [directionX, directionY] = getCastDirection();
    const centerX = Math.round(character.x + CHARACTER_SIZE / 2);

    return directionY === 0
        ? [centerX + directionX * 3, Math.round(character.y) + 11]
        : [centerX + 3, Math.round(character.y) + 11];
}

function getRodTip(time) {
    const [directionX, directionY] = getCastDirection();
    const [handX, handY] = getRodHand();

    const tip = directionY === 0
        ? [handX + directionX * 6, handY - 6]
        : [handX + 1, handY + directionY * 7];

    if (!fishing || time === undefined) {
        return tip;
    }

    if (fishing.state === 'casting') {
        const phase = Phaser.Math.Clamp((time - fishing.start) / CAST_SWING_DURATION, 0, 1);
        const reach = phase < 0.35
            ? -3 * phase / 0.35
            : -3 + 6 * (phase - 0.35) / 0.65;
        const lift = Math.round(Math.sin(phase * Math.PI) * 3);

        tip[0] += Math.round(directionX * reach + (directionY === 0 ? 0 : lift));
        tip[1] += Math.round(directionY * reach - (directionY === 0 ? lift : 0));
    } else if (
        fishing.state === 'floating' ||
        fishing.state === 'landing' ||
        fishing.state === 'approaching' ||
        fishing.state === 'inspecting' ||
        fishing.state === 'nibbleWait' ||
        fishing.state === 'nibbleDip' ||
        fishing.state === 'bite' ||
        fishing.state === 'hooked' ||
        fishing.state === 'minigame'
    ) {
        const wobble = Math.sin((time - fishing.start) / 95 + fishing.driftPhase);

        tip[0] += directionY === 0 ? 0 : Math.round(wobble);
        tip[1] += directionY === 0 ? Math.round(wobble) : 0;
    }

    return tip;
}

function isWaterPixel(scene, x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);

    return getTerrainSurface(scene, tile).water[(y - tileY * TILE_SIZE) * TILE_SIZE + x - tileX * TILE_SIZE] === 1;
}

function findFishForBobber() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish.state === 'flee' || fish.state === 'lure') continue;

            const dx = fishing.bobberX - fish.x;
            const dy = fishing.bobberY - fish.y;
            const distance = Math.hypot(dx, dy);

            if (distance < FISH_NOTICE_MIN_DISTANCE || distance > FISH_NOTICE_MAX_DISTANCE) continue;

            const facing = (Math.cos(fish.heading) * dx + Math.sin(fish.heading) * dy) / distance;

            if (facing < FISH_NOTICE_DOT || !isFishPathClear(chunk, fish, fishing.bobberX, fishing.bobberY)) {
                continue;
            }

            if (distance < nearestDistance) {
                nearest = { fish, chunk };
                nearestDistance = distance;
            }
        }
    }

    return nearest;
}

function releaseTargetFish(flee) {
    if (!fishing || !fishing.targetFish) return;

    const fish = fishing.targetFish;
    const chunk = fishing.targetChunk;
    const awayX = fish.x - fishing.bobberX;
    const awayY = fish.y - fishing.bobberY;

    fishing.targetFish = null;
    fishing.targetChunk = null;

    if (flee && chunk && chooseFishTarget(chunk, fish, awayX, awayY)) {
        fish.state = 'flee';
        fish.topSpeed = FISH_FLEE_SPEED;
        fish.thrusting = true;
        fish.burstTimer = 900;
        return;
    }

    fish.state = 'idle';
    fish.thrusting = false;
    fish.velocity = 0;
    fish.timer = FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE;
}

function hookFish(time) {
    if (!fishing || fishing.state !== 'bite' || time > fishing.biteDeadline) {
        return false;
    }

    fishing.state = 'hooked';
    fishing.start = time;
    fishing.bobberY = fishing.toY + 2;
    return true;
}

function beginCast(time) {
    if (fishing) {
        if (fishing.state === 'minigame' || fishing.state === 'hooked') {
            return;
        }

        if (hookFish(time)) {
            return;
        }

        const scared = fishing.targetFish && (
            fishing.state === 'approaching' ||
            fishing.state === 'inspecting' ||
            fishing.state === 'nibbleWait' ||
            fishing.state === 'nibbleDip'
        );

        if (scared) {
            releaseTargetFish(true);
        }

        reelIn(time);
        return;
    }

    if (!hasRodSelected() || dialogueOpen || marketOpen || mapOpen || inventoryOpen || castCharge) {
        return;
    }

    castCharge = { start: time, rod: getSelectedRod() };
}

function getCastPower(time) {
    const cycle = ((time - castCharge.start) / castCharge.rod.chargeTime) % 2;
    return cycle <= 1 ? cycle : 2 - cycle;
}

function releaseCast(time) {
    if (!castCharge) return;

    const power = getCastPower(time);
    castCharge = null;

    if (!hasRodSelected() || dialogueOpen || marketOpen || mapOpen || inventoryOpen) {
        return;
    }

    const rod = getSelectedRod();
    const [directionX, directionY] = getCastDirection();
    const [tipX, tipY] = getRodTip();
    const distance = CAST_MIN_DISTANCE + (rod.castDistance - CAST_MIN_DISTANCE) * power;

    fishing = {
        state: 'casting',
        start: time,
        releaseAt: time + CAST_SWING_DURATION + CAST_HANG_TIME,
        power,
        rod,
        duration: CAST_DURATION * (0.6 + power * 0.6),
        arc: CAST_ARC * (0.5 + power * 0.7),
        fromX: tipX,
        fromY: tipY,
        toX: Math.round(character.x + CHARACTER_SIZE / 2 + directionX * distance),
        toY: Math.round(character.y + CHARACTER_SIZE - 2 + directionY * distance),
        bobberX: tipX,
        bobberY: tipY,
        driftPhase: Math.random() * Math.PI * 2,
        rope: null
    };

    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);
}

function drawCastCharge(time) {
    if (!castCharge) return;

    const power = getCastPower(time);
    const x = Math.round(character.x + CHARACTER_SIZE / 2 - CAST_METER_WIDTH / 2);
    const y = Math.round(character.y) - 5;
    const filled = Math.round((CAST_METER_WIDTH - 2) * power);

    fishingLine.setDepth(character.depth + 1);
    fishingLine.fillStyle(0x230a03, 1);
    fishingLine.fillRect(x, y, CAST_METER_WIDTH, 4);
    fishingLine.fillStyle(0x36160d, 1);
    fishingLine.fillRect(x + 1, y + 1, CAST_METER_WIDTH - 2, 2);
    fishingLine.fillStyle(power > 0.9 ? 0xd1edf1 : 0x78afd3, 1);
    fishingLine.fillRect(x + 1, y + 1, filled, 2);
}

function reelIn(time) {
    if (!fishing || fishing.state === 'reeling') return;

    if (fishing.state === 'casting') {
        fishing = null;
        return;
    }

    releaseTargetFish(true);

    fishing.state = 'reeling';
    fishing.start = time;
    fishing.fromX = fishing.bobberX;
    fishing.fromY = fishing.bobberY;
}

function splash(scene, time, x, y) {
    scatterFishFromSplash(x, y);

    for (let index = 0; index < SPLASH_PARTICLES; index++) {
        const angle = index / SPLASH_PARTICLES * Math.PI * 2;

        spawnParticle(scene, shadowLayer, {
            born: time,
            x: Math.round(x),
            y: Math.round(y),
            ring: true,
            directionX: Math.cos(angle),
            directionY: Math.sin(angle),
            lifetime: SPLASH_LIFETIME
        }, index % 2 ? 0x87bed8 : 0x78afd3);
    }
}

function groundLandingPuff(scene, time, x, y) {
    for (let index = 0; index < 3; index++) {
        spawnParticle(scene, shadowLayer, {
            born: time,
            x: x - 1 + index,
            y,
            drift: index - 1,
            rise: -1,
            lifetime: 220
        }, DUST_COLORS[index]);
    }
}

function nibbleRipple(scene, time, x, y) {
    for (let index = 0; index < 4; index++) {
        const horizontal = index < 2;
        const side = index % 2 === 0 ? -1 : 1;

        spawnParticle(scene, shadowLayer, {
            born: time,
            x: x + (horizontal ? side * 2 : 0),
            y: y + (horizontal ? 0 : side),
            drift: horizontal ? side : 0,
            rise: 0,
            lifetime: 180
        }, index % 2 ? 0x78afd3 : 0x87bed8);
    }
}

function startFishApproach(time) {
    const match = findFishForBobber();

    if (!match) {
        fishing.state = 'floating';
        fishing.start = time;
        return;
    }

    fishing.state = 'approaching';
    fishing.start = time;
    fishing.targetFish = match.fish;
    fishing.targetChunk = match.chunk;
    match.fish.state = 'lure';
    match.fish.lureTime = 0;
    match.fish.velocity *= 0.4;
}

function startFishBite(scene, time) {
    const fish = fishing.targetFish;
    const difficulty = Phaser.Math.Clamp((fish.length - FISH_LENGTHS[0]) / (FISH_LENGTHS[FISH_LENGTHS.length - 1] - FISH_LENGTHS[0]), 0, 1);
    const window = Phaser.Math.Linear(FISH_BITE_MAX_WINDOW, FISH_BITE_MIN_WINDOW, difficulty);

    fishing.state = 'bite';
    fishing.start = time;
    fishing.biteDeadline = time + window;
    splash(scene, time, fishing.bobberX, fishing.bobberY);
}

function startFishingMinigame(time) {
    const fish = fishing.targetFish;
    const size = FISH_LENGTHS.indexOf(fish.length);
    const difficulty = size / (FISH_LENGTHS.length - 1);
    const zoneHeight = fishing.rod.catchZone;

    fishing.state = 'minigame';
    fishing.start = time;
    fishing.game = {
        zoneY: FISHING_GAME_PLAY_HEIGHT - zoneHeight,
        zoneHeight,
        zoneVelocity: 0,
        fishY: FISHING_GAME_PLAY_HEIGHT * 0.5,
        fishVelocity: 0,
        fishTargetY: FISHING_GAME_PLAY_HEIGHT * 0.5,
        targetTimer: 0,
        difficulty,
        progress: 0.22
    };
}

function finishFishingMinigame(scene, time, caught) {
    const fish = fishing.targetFish;
    const chunk = fishing.targetChunk;

    if (!caught) {
        spawnLineSnap(scene, time, fishing.rope);
        releaseTargetFish(true);
        splash(scene, time, fishing.bobberX, fishing.bobberY);
        fishing = null;
        return;
    }

    if (chunk) {
        const index = chunk.fish.indexOf(fish);
        if (index !== -1) chunk.fish.splice(index, 1);
    }

    const species = fish.species || FISH_SPECIES[0];
    fishInventory.set(species.id, (fishInventory.get(species.id) || 0) + 1);
    catchLog.add(species.id);
    saveDirty = true;

    fishing.targetFish = null;
    fishing.targetChunk = null;
    fishing.state = 'reeling';
    fishing.start = time;
    fishing.fromX = fishing.bobberX;
    fishing.fromY = fishing.bobberY;

    showCatchCard(scene, time, species, fish.size);
}

function spawnLineSnap(scene, time, rope) {
    if (!rope || !rope.points.length) return;

    const stride = Math.max(1, Math.floor(rope.points.length / 9));

    for (let index = stride; index < rope.points.length; index += stride) {
        const point = rope.points[index];

        spawnParticle(scene, worldObjectLayer, {
            born: time,
            x: Math.round(point.x),
            y: Math.round(point.y),
            drift: index % 2 ? -1 : 1,
            rise: 1,
            lifetime: 300,
            depth: Math.max(character.depth + 0.2, point.y)
        }, FISHING_LINE_COLOR);
    }
}

function updateFishingMinigame(scene, time, delta) {
    const gameState = fishing.game;
    const frameSeconds = Math.min(delta, 34) / 1000;
    const difficulty = gameState.difficulty;
    const zoneAcceleration = fishingActionHeld ? -185 : 150;

    gameState.zoneVelocity += zoneAcceleration * frameSeconds;
    gameState.zoneVelocity *= Math.exp(-2.4 * frameSeconds);
    gameState.zoneVelocity = Phaser.Math.Clamp(gameState.zoneVelocity, -72, 82);
    gameState.zoneY += gameState.zoneVelocity * frameSeconds;

    if (gameState.zoneY < 0) {
        gameState.zoneY = 0;
        gameState.zoneVelocity = Math.max(0, gameState.zoneVelocity * -0.25);
    } else if (gameState.zoneY + gameState.zoneHeight > FISHING_GAME_PLAY_HEIGHT) {
        gameState.zoneY = FISHING_GAME_PLAY_HEIGHT - gameState.zoneHeight;
        gameState.zoneVelocity = Math.min(0, gameState.zoneVelocity * -0.3);
    }

    gameState.targetTimer -= delta;

    if (gameState.targetTimer <= 0) {
        const margin = 4;
        gameState.fishTargetY = margin + Math.random() * (FISHING_GAME_PLAY_HEIGHT - margin * 2);
        gameState.targetTimer = Phaser.Math.Linear(780, 230, difficulty) * (0.65 + Math.random() * 0.7);
    }

    const fishAcceleration = Phaser.Math.Linear(75, 220, difficulty);
    const fishMaxSpeed = Phaser.Math.Linear(28, 72, difficulty);
    const fishDirection = Math.sign(gameState.fishTargetY - gameState.fishY);

    gameState.fishVelocity += fishDirection * fishAcceleration * frameSeconds;
    gameState.fishVelocity *= Math.exp(-Phaser.Math.Linear(5, 2.4, difficulty) * frameSeconds);
    gameState.fishVelocity = Phaser.Math.Clamp(gameState.fishVelocity, -fishMaxSpeed, fishMaxSpeed);
    gameState.fishY = Phaser.Math.Clamp(
        gameState.fishY + gameState.fishVelocity * frameSeconds,
        2,
        FISHING_GAME_PLAY_HEIGHT - 2
    );

    const inside = gameState.fishY >= gameState.zoneY && gameState.fishY <= gameState.zoneY + gameState.zoneHeight;
    const gainRate = Phaser.Math.Linear(0.28, 0.17, difficulty);
    const drainRate = Phaser.Math.Linear(0.19, 0.35, difficulty) / fishing.rod.lineStrength;

    gameState.progress = Phaser.Math.Clamp(
        gameState.progress + (inside ? gainRate : -drainRate) * frameSeconds,
        0,
        1
    );

    if (gameState.progress >= 1) {
        finishFishingMinigame(scene, time, true);
    } else if (gameState.progress <= 0) {
        finishFishingMinigame(scene, time, false);
    }
}

function drawFishingMinigame() {
    if (!fishing || fishing.state !== 'minigame') return;

    const gameState = fishing.game;
    const x = FISHING_GAME_X;
    const y = FISHING_GAME_Y;
    const playX = x + 5;
    const playY = y + FISHING_GAME_PLAY_TOP;

    fishingUi
        .fillStyle(0x230a03, 1)
        .fillRect(x, y, FISHING_GAME_WIDTH, FISHING_GAME_HEIGHT)
        .fillStyle(0xacccf9, 1)
        .fillRect(x + 1, y + 1, FISHING_GAME_WIDTH - 2, FISHING_GAME_HEIGHT - 2)
        .fillStyle(0x36160d, 1)
        .fillRect(x + 2, y + 2, FISHING_GAME_WIDTH - 4, FISHING_GAME_HEIGHT - 4)
        .fillStyle(0x465989, 1)
        .fillRect(playX - 1, playY - 1, 10, FISHING_GAME_PLAY_HEIGHT + 2)
        .fillStyle(0x230a03, 1)
        .fillRect(playX, playY, 8, FISHING_GAME_PLAY_HEIGHT)
        .fillStyle(0x78afd3, 0.9)
        .fillRect(playX, playY + Math.round(gameState.zoneY), 8, Math.round(gameState.zoneHeight))
        .fillStyle(0xe0f2fd, 1)
        .fillRect(playX + 2, playY + Math.round(gameState.fishY) - 1, 4, 2)
        .fillRect(playX + 1, playY + Math.round(gameState.fishY), 1, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(x + 17, playY, FISHING_GAME_PROGRESS_WIDTH, FISHING_GAME_PLAY_HEIGHT)
        .fillStyle(0x8fbf7a, 1)
        .fillRect(
            x + 17,
            playY + Math.round(FISHING_GAME_PLAY_HEIGHT * (1 - gameState.progress)),
            FISHING_GAME_PROGRESS_WIDTH,
            Math.round(FISHING_GAME_PLAY_HEIGHT * gameState.progress)
        );
}

function plotFishingLine(fromX, fromY, toX, toY, sag) {
    const controlX = (fromX + toX) / 2;
    const controlY = (fromY + toY) / 2 + sag;
    const steps = Math.max(2, Math.ceil(Math.hypot(toX - fromX, toY - fromY) * 1.5));
    let lastX = null;
    let lastY = null;

    for (let step = 0; step <= steps; step++) {
        const amount = step / steps;
        const inverse = 1 - amount;
        const x = Math.round(inverse * inverse * fromX + 2 * inverse * amount * controlX + amount * amount * toX);
        const y = Math.round(inverse * inverse * fromY + 2 * inverse * amount * controlY + amount * amount * toY);

        if (x === lastX && y === lastY) continue;

        fishingLine.fillRect(x, y, 1, 1);
        lastX = x;
        lastY = y;
    }
}

function createFishingRope(fromX, fromY, toX, toY, lineLength) {
    const segmentCount = Math.max(2, Math.ceil(lineLength / ROPE_SEGMENT_LENGTH));
    const points = [];

    for (let index = 0; index <= segmentCount; index++) {
        const amount = index / segmentCount;
        const x = fromX + (toX - fromX) * amount;
        const y = fromY + (toY - fromY) * amount;

        points.push({ x, y, oldX: x, oldY: y });
    }

    return { points, length: lineLength, segmentLength: lineLength / segmentCount };
}

function updateFishingRope(rope, fromX, fromY, toX, toY, delta, tautness) {
    const seconds = Math.min(delta, 34) / 1000;
    const targetLength = Math.max(Math.hypot(toX - fromX, toY - fromY) + (1 - tautness) * 7, ROPE_SEGMENT_LENGTH);

    rope.length += (targetLength - rope.length) * Math.min(1, seconds * (tautness ? 14 : 5));
    rope.segmentLength = rope.length / (rope.points.length - 1);

    for (let index = 1; index < rope.points.length - 1; index++) {
        const point = rope.points[index];
        const velocityX = (point.x - point.oldX) * 0.985;
        const velocityY = (point.y - point.oldY) * 0.985;

        point.oldX = point.x;
        point.oldY = point.y;
        point.x += velocityX;
        point.y += velocityY + ROPE_GRAVITY * seconds * seconds;
    }

    for (let pass = 0; pass < ROPE_CONSTRAINT_PASSES; pass++) {
        rope.points[0].x = fromX;
        rope.points[0].y = fromY;
        rope.points[rope.points.length - 1].x = toX;
        rope.points[rope.points.length - 1].y = toY;

        for (let index = 0; index < rope.points.length - 1; index++) {
            const first = rope.points[index];
            const second = rope.points[index + 1];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const distance = Math.max(0.001, Math.hypot(dx, dy));
            const correction = (distance - rope.segmentLength) / distance;
            const firstFixed = index === 0;
            const secondFixed = index + 1 === rope.points.length - 1;

            if (!firstFixed) {
                const share = secondFixed ? 1 : 0.5;
                first.x += dx * correction * share;
                first.y += dy * correction * share;
            }

            if (!secondFixed) {
                const share = firstFixed ? 1 : 0.5;
                second.x -= dx * correction * share;
                second.y -= dy * correction * share;
            }
        }
    }
}

function drawFishingRope(rope) {
    let lastX = null;
    let lastY = null;

    for (let index = 0; index < rope.points.length - 1; index++) {
        const first = rope.points[index];
        const second = rope.points[index + 1];
        const distance = Math.max(1, Math.ceil(Math.hypot(second.x - first.x, second.y - first.y)));

        for (let step = 0; step <= distance; step++) {
            const amount = step / distance;
            const x = Math.round(first.x + (second.x - first.x) * amount);
            const y = Math.round(first.y + (second.y - first.y) * amount);

            if (x === lastX && y === lastY) continue;

            fishingLine.fillRect(x, y, 1, 1);
            lastX = x;
            lastY = y;
        }
    }
}

function updateFishing(scene, time, delta, isWalking) {
    fishingLine.clear();
    fishingUi.clear();

    if (castCharge && (isWalking || dialogueOpen || marketOpen || mapOpen || inventoryOpen || !hasRodSelected())) {
        castCharge = null;
    }

    drawCastCharge(time);

    if (!fishing) return;

    if (fishing.state !== 'reeling' && (isWalking || dialogueOpen || marketOpen || mapOpen || inventoryOpen || !hasRodSelected())) {
        reelIn(time);

        if (!fishing) {
            return;
        }
    }

    let [tipX, tipY] = getRodTip(time);
    const age = time - fishing.start;

    if (fishing.state === 'casting') {
        fishing.bobberX = tipX;
        fishing.bobberY = tipY;

        if (time >= fishing.releaseAt) {
            fishing.state = 'flying';
            fishing.start = time;
            fishing.fromX = tipX;
            fishing.fromY = tipY;
            const lineLength = Math.hypot(fishing.toX - tipX, fishing.toY - tipY) + fishing.arc * 0.8 + 5;
            fishing.rope = createFishingRope(tipX, tipY, tipX, tipY - 2, lineLength);
        }
    } else if (fishing.state === 'flying') {
        const amount = Math.min(1, age / fishing.duration);

        fishing.bobberX = Math.round(fishing.fromX + (fishing.toX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (fishing.toY - fishing.fromY) * amount - Math.sin(amount * Math.PI) * fishing.arc);

        if (amount >= 1) {
            if (isWaterPixel(scene, fishing.toX, fishing.toY)) {
                fishing.state = 'landing';
                fishing.start = time;
                splash(scene, time, fishing.toX, fishing.toY);
            } else {
                groundLandingPuff(scene, time, fishing.toX, fishing.toY);
                fishing = null;
                return;
            }
        }
    } else if (fishing.state === 'landing') {
        const amount = Math.min(1, age / BOBBER_LAND_TIME);

        fishing.bobberX = fishing.toX;
        fishing.bobberY = fishing.toY - Math.round(Math.sin(amount * Math.PI) * 2 * (1 - amount));

        if (amount >= 1) {
            fishing.state = 'floating';
            fishing.start = time;
            startFishApproach(time);
        }
    } else if (
        fishing.state === 'floating' ||
        fishing.state === 'approaching' ||
        fishing.state === 'inspecting' ||
        fishing.state === 'nibbleWait' ||
        fishing.state === 'nibbleDip' ||
        fishing.state === 'bite' ||
        fishing.state === 'hooked' ||
        fishing.state === 'minigame'
    ) {
        const stateAge = time - fishing.start;
        const driftX = Math.round(Math.sin(age / 1300 + fishing.driftPhase));
        const driftY = Math.round(Math.sin(age / 1700 + fishing.driftPhase * 0.7));
        const candidateX = fishing.toX + driftX;
        const candidateY = fishing.toY + driftY;
        const canDrift = fishing.state !== 'bite' && fishing.state !== 'hooked';
        const baseX = canDrift && isWaterPixel(scene, candidateX, candidateY) ? candidateX : fishing.toX;
        const baseY = canDrift && isWaterPixel(scene, candidateX, candidateY) ? candidateY : fishing.toY;

        fishing.bobberX = baseX;
        fishing.bobberY = baseY + (Math.floor(age / BOBBER_BOB_TIME) % 2);

        if (fishing.state === 'approaching') {
            const fish = fishing.targetFish;

            if (!fish || fish.state !== 'lure') {
                releaseTargetFish(false);
                fishing.state = 'floating';
                fishing.start = time;
            } else if (Math.hypot(fish.x - fishing.bobberX, fish.y - fishing.bobberY) <= fish.radius + 4) {
                fishing.state = 'inspecting';
                fishing.start = time;
                fishing.inspectDuration = FISH_INSPECT_MIN + Math.random() * FISH_INSPECT_RANGE;
                fish.velocity = 0;
            }
        } else if (fishing.state === 'inspecting' && stateAge >= fishing.inspectDuration) {
            fishing.nibblesRemaining = Math.floor(Math.random() * 5);
            fishing.state = 'nibbleWait';
            fishing.start = time;
            fishing.nextNibbleAt = time + 300 + Math.random() * 420;
        } else if (fishing.state === 'nibbleWait' && time >= fishing.nextNibbleAt) {
            if (fishing.nibblesRemaining > 0) {
                fishing.state = 'nibbleDip';
                fishing.start = time;
                fishing.nibbleRippleShown = false;
            } else {
                startFishBite(scene, time);
            }
        } else if (fishing.state === 'nibbleDip') {
            const dipAmount = Math.sin(Math.min(1, stateAge / FISH_NIBBLE_DIP_TIME) * Math.PI);

            fishing.bobberY += Math.round(dipAmount * 2);

            if (!fishing.nibbleRippleShown && stateAge >= FISH_NIBBLE_DIP_TIME * 0.25) {
                fishing.nibbleRippleShown = true;
                nibbleRipple(scene, time, fishing.bobberX, fishing.bobberY);
            }

            if (stateAge >= FISH_NIBBLE_DIP_TIME) {
                fishing.nibblesRemaining--;
                fishing.state = 'nibbleWait';
                fishing.start = time;
                fishing.nextNibbleAt = time + 260 + Math.random() * 380;
            }
        } else if (fishing.state === 'bite') {
            fishing.bobberY = fishing.toY + 3;

            if (time > fishing.biteDeadline) {
                releaseTargetFish(true);
                fishing.state = 'floating';
                fishing.start = time;
            }
        } else if (fishing.state === 'hooked') {
            const fish = fishing.targetFish;

            fishing.bobberY = fishing.toY + 2;

            if (fish) {
                fish.velocity = 0;
                fish.thrusting = false;
            }

            if (stateAge >= 220) {
                startFishingMinigame(time);
            }
        } else if (fishing.state === 'minigame') {
            fishing.bobberY = fishing.toY + 2;
            updateFishingMinigame(scene, time, delta);

            if (!fishing) {
                return;
            }
        }
    } else {
        const amount = Math.min(1, age / REEL_DURATION);

        fishing.bobberX = Math.round(fishing.fromX + (tipX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (tipY - fishing.fromY) * amount);

        if (amount >= 1) {
            fishing = null;
            return;
        }
    }

    [tipX, tipY] = getRodTip(time);
    fishingLine.setDepth(fishing.state === 'flying' || fishing.state === 'casting' ? character.depth + 1 : Math.max(character.depth + 0.2, fishing.bobberY));
    const [handX, handY] = getRodHand();

    fishingLine.fillStyle(ROD_COLOR, 1);
    plotFishingLine(handX, handY, tipX, tipY, 0);

    if (fishing.state === 'casting') {
        return;
    }

    if (!fishing.rope) {
        const distance = Math.hypot(fishing.bobberX - tipX, fishing.bobberY - 2 - tipY);
        fishing.rope = createFishingRope(tipX, tipY, fishing.bobberX, fishing.bobberY - 2, distance + 5);
    }

    fishingLine.fillStyle(FISHING_LINE_COLOR, 1);
    updateFishingRope(
        fishing.rope,
        tipX,
        tipY,
        fishing.bobberX,
        fishing.bobberY - 2,
        delta,
        fishing.state === 'reeling' || fishing.state === 'bite' || fishing.state === 'hooked' || fishing.state === 'minigame'
            ? 1
            : fishing.state === 'flying' ? 0.7 : 0
    );
    drawFishingRope(fishing.rope);
    drawFishingMinigame();
    fishingLine.fillStyle(BOBBER_TOP_COLOR, 1);
    fishingLine.fillRect(fishing.bobberX - 1, fishing.bobberY - 2, 2, 1);
    fishingLine.fillStyle(BOBBER_BOTTOM_COLOR, 1);
    fishingLine.fillRect(fishing.bobberX - 1, fishing.bobberY - 1, 2, 1);
}

function createCharacterShadow(scene) {
    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const texture = scene.textures.createCanvas('character-shadow', width, height);
    const image = scene.add.image(0, 0, texture.key).setOrigin(0);

    shadowLayer.add(image);
    characterShadow = { texture, image, x: null, y: null };
}

function updateCharacterShadow(scene) {
    const x = character.x + ACTOR_SHADOW_X;
    const y = character.y + ACTOR_SHADOW_Y;

    if (characterShadow.x === x && characterShadow.y === y) {
        return;
    }

    characterShadow.x = x;
    characterShadow.y = y;
    characterShadow.image.setPosition(x, y);

    const context = characterShadow.texture.getContext();
    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const image = context.createImageData(width, height);

    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            if (ACTOR_SHADOW_SHAPE[row][column] !== '#') continue;

            const shaded = getGroundShadowColor(scene, x + column, y + row);
            if (!shaded) continue;

            const index = (row * width + column) * 4;
            image.data[index] = shaded[0];
            image.data[index + 1] = shaded[1];
            image.data[index + 2] = shaded[2];
            image.data[index + 3] = 255;
        }
    }

    context.putImageData(image, 0, 0);
    characterShadow.texture.refresh();
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
        .fillRect(8, 3, 304, 72)
        .fillStyle(0x465989, 1)
        .fillRect(DIALOGUE_OPTION_X - 7, 8, 1, 62);

    dialogueHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(DIALOGUE_OPTION_X - 3, 0, DIALOGUE_OPTION_WIDTH, DIALOGUE_OPTION_HEIGHT)
        .fillStyle(0x4a2216, 1)
        .fillRect(DIALOGUE_OPTION_X - 2, 1, DIALOGUE_OPTION_WIDTH - 2, DIALOGUE_OPTION_HEIGHT - 2);

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

    dialogueText = createText(64, 21, '#e0f2fd', 146);

    dialogueOptionTexts = [0, 1, 2].map(index => {
        return createText(DIALOGUE_OPTION_X + 3, DIALOGUE_OPTION_TOP + 4 + index * DIALOGUE_OPTION_STEP, '#c0a887');
    });

    dialogueContainer = scene.add.container(
        0,
        DIALOGUE_HIDDEN_Y,
        [
            panel,
            dialogueHighlight,
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

    dialogueTextLayer.pointerEvents = 'none';
}

function createMapUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, MAP_PANEL_HEIGHT)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, MAP_PANEL_HEIGHT - 2)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, MAP_PANEL_HEIGHT - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, MAP_PANEL_HEIGHT - 6)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);

    mapImage = scene.add.image(12, MAP_TOP, 'map')
        .setOrigin(0);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: `${MAP_PANEL_HEIGHT}px`,
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none'
    });

    const title = document.createElement('div');
    title.textContent = 'World Map';

    Object.assign(title.style, {
        position: 'absolute',
        left: '14px',
        top: '5px',
        color: '#acccf9',
        whiteSpace: 'nowrap'
    });

    const hint = document.createElement('div');

    for (const [key, label] of [['Scroll', 'Zoom'], ['WASD', 'Pan'], ['M', 'Close']]) {
        const keycap = document.createElement('span');
        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            margin: '0 4px 0 10px'
        });

        hint.append(keycap, label);
    }

    Object.assign(hint.style, {
        position: 'absolute',
        right: '14px',
        top: '6px',
        fontSize: '11px',
        color: '#8c7358',
        whiteSpace: 'nowrap'
    });

    textLayer.append(title, hint);

    mapTextLayer = scene.add.dom(0, MAP_HIDDEN_Y, textLayer)
        .setOrigin(0)
        .setDepth(203)
        .setScrollFactor(0)
        .setVisible(false);

    mapTextLayer.pointerEvents = 'none';

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

function getMapPalette(scene) {
    if (mapPalette) return mapPalette;

    const pack = ([r, g, b]) => (r << 16) | (g << 8) | b;
    const grass = getDominantColor(scene, 'grass1');
    const dirt = getDominantColor(scene, 'dirt1');

    mapPalette = {
        grass: pack(grass),
        grassEdge: pack(shadeColor(...grass)),
        dirt: pack(dirt),
        dirtEdge: pack(shadeColor(...dirt)),
        bush: 0x4a7a52,
        wood: pack(getDominantColor(scene, 'wood')),
        store: pack(getDominantColor(scene, 'store')),
        water: [0x87bed8, 0x72a8cf, 0x6890ca],
        fog: [0x1a1a1a, 0x2a2a2a],
        guide: 0xacccf9,
        player: 0xf6f5e5,
        outline: 0x230a03
    };

    return mapPalette;
}

function getMapWaterDepth(tileX, tileY) {
    for (let radius = 1; radius <= 2; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (
                    Math.max(Math.abs(offsetX), Math.abs(offsetY)) === radius &&
                    getTerrainType(tileX + offsetX, tileY + offsetY) !== 'water'
                ) {
                    return radius - 1;
                }
            }
        }
    }

    return 2;
}

function redrawMap(scene) {
    const palette = getMapPalette(scene);
    const context = mapTexture.getContext();
    const image = context.createImageData(MAP_WIDTH, MAP_HEIGHT);
    const pixels = image.data;

    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const zoom = mapZoom;
    const viewWidth = Math.ceil(MAP_WIDTH / zoom);
    const viewHeight = Math.ceil(MAP_HEIGHT / zoom);
    const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);

    const plot = (x, y, color) => {
        if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;

        const index = (y * MAP_WIDTH + x) * 4;
        pixels[index] = (color >> 16) & 255;
        pixels[index + 1] = (color >> 8) & 255;
        pixels[index + 2] = color & 255;
        pixels[index + 3] = 255;
    };

    const marker = (tileX, tileY, width, height, color) => {
        const x = (tileX - originX) * zoom;
        const y = (tileY - originY) * zoom;
        const pixelWidth = width * zoom;
        const pixelHeight = height * zoom;

        for (let offsetY = -1; offsetY <= pixelHeight; offsetY++) {
            for (let offsetX = -1; offsetX <= pixelWidth; offsetX++) {
                const inside = offsetX >= 0 && offsetY >= 0 && offsetX < pixelWidth && offsetY < pixelHeight;
                plot(x + offsetX, y + offsetY, inside ? color : palette.outline);
            }
        }
    };

    for (let viewY = 0; viewY < viewHeight; viewY++) {
        for (let viewX = 0; viewX < viewWidth; viewX++) {
            const tileX = originX + viewX;
            const tileY = originY + viewY;
            let color;

            if (!isTileDiscovered(tileX, tileY)) {
                color = -1;
            } else if (hasBushAt(tileX, tileY) || hasBushAt(tileX - 1, tileY)) {
                color = palette.bush;
            } else {
                const tile = getWorldTile(tileX, tileY);
                const terrain = getTerrainType(tileX, tileY);

                if (tile.key.startsWith('wood')) {
                    color = palette.wood;
                } else if (terrain === 'water') {
                    color = palette.water[getMapWaterDepth(tileX, tileY)];
                } else if (tile.blocking === 'lower') {
                    color = terrain === 'grass' ? palette.grassEdge : palette.dirtEdge;
                } else {
                    color = terrain === 'grass' ? palette.grass : palette.dirt;
                }
            }

            for (let offsetY = 0; offsetY < zoom; offsetY++) {
                for (let offsetX = 0; offsetX < zoom; offsetX++) {
                    const x = viewX * zoom + offsetX;
                    const y = viewY * zoom + offsetY;
                    plot(x, y, color === -1 ? palette.fog[(x + y) & 1] : color);
                }
            }
        }
    }

    if (store && isTileDiscovered(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE))) {
        marker(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE), STORE_WIDTH_TILES, STORE_HEIGHT_TILES, palette.store);
    }

    if (guide && isTileDiscovered(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE))) {
        marker(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE), 1, 1, palette.guide);
    }

    marker(playerTileX, playerTileY, 1, 1, palette.player);

    context.putImageData(image, 0, 0);
    mapTexture.refresh();
}

function openMap(scene) {
    if (mapOpen || dialogueOpen || marketOpen || inventoryOpen || !mapContainer) {
        return;
    }

    mapOpen = true;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    mapPan.x = 0;
    mapPan.y = 0;
    mapDrag = null;
    redrawMap(scene);

    mapContainer
        .setVisible(true)
        .setY(MAP_HIDDEN_Y);

    mapTextLayer
        .setVisible(true)
        .setY(MAP_HIDDEN_Y);

    scene.tweens.killTweensOf(mapContainer);
    scene.tweens.killTweensOf(mapTextLayer);

    scene.tweens.add({
        targets: [mapContainer, mapTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });
}

function updateMapPan(scene, delta) {
    const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
        (characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
    const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
        (characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);

    if (panX || panY) {
        const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
        const beforeX = Math.round(mapPan.x);
        const beforeY = Math.round(mapPan.y);

        mapPan.x += panX * distance;
        mapPan.y += panY * distance;

        if (Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY) {
            mapDirty = true;
        }
    }

    if (mapDirty) {
        mapDirty = false;
        redrawMap(scene);
    }
}

function snapTweenTarget(tween, target) {
    target.y = Math.round(target.y);
}

function closeMap(scene) {
    if (!mapOpen) {
        return;
    }

    mapOpen = false;

    scene.tweens.killTweensOf(mapContainer);
    scene.tweens.killTweensOf(mapTextLayer);

    scene.tweens.add({
        targets: [mapContainer, mapTextLayer],
        y: MAP_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onUpdate: snapTweenTarget,
        onComplete: () => {
            if (!mapOpen) {
                mapContainer.setVisible(false);
                mapTextLayer.setVisible(false);
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

function createInventoryUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, INVENTORY_HEIGHT)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, INVENTORY_HEIGHT - 2)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, INVENTORY_HEIGHT - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, INVENTORY_HEIGHT - 6)
        .fillStyle(0x465989, 1)
        .fillRect(12, 19, 296, 1)
        .fillRect(12, 121, 296, 1);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: `${INVENTORY_HEIGHT}px`,
        fontFamily: 'm6x11, monospace',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none',
        color: '#c0a887',
        whiteSpace: 'nowrap'
    });

    const createText = (x, y, width, align) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: width ? `${width}px` : 'auto',
            textAlign: align || 'left'
        });

        textLayer.appendChild(text);
        return text;
    };

    const title = createText(14, 5);
    title.textContent = 'Fishpedia';
    title.style.color = '#acccf9';
    inventorySummaryText = createText(145, 5, 161, 'right');
    inventorySummaryText.style.fontSize = '11px';

    inventoryRowTexts = [];
    inventoryCountTexts = [];

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const y = 25 + index * 15;
        inventoryRowTexts.push(createText(16, y, 190));
        inventoryCountTexts.push(createText(205, y, 101, 'right'));
    }

    const footer = createText(12, 126, 296, 'center');
    footer.style.fontSize = '11px';
    footer.style.color = '#8c7358';
    footer.textContent = 'I / Esc  Close     N  New Game';
    inventoryNewGameText = footer;

    inventoryContainer = scene.add.container(0, INVENTORY_HIDDEN_Y, [panel])
        .setDepth(203)
        .setScrollFactor(0)
        .setVisible(false);

    inventoryTextLayer = scene.add.dom(0, INVENTORY_HIDDEN_Y, textLayer)
        .setOrigin(0)
        .setDepth(204)
        .setScrollFactor(0)
        .setVisible(false);

    inventoryTextLayer.pointerEvents = 'none';
    refreshInventoryUI(scene.time.now);
}

function refreshInventoryUI(time) {
    if (!inventorySummaryText) return;

    const summary = getFishInventorySummary();
    inventorySummaryText.textContent = `${catchLog.size}/${FISH_SPECIES.length} caught · ${summary.count} fish · ${summary.value}c`;
    inventorySummaryText.style.color = summary.count ? '#e8c170' : '#8c7358';

    FISH_SPECIES.forEach((species, index) => {
        const caught = catchLog.has(species.id);
        const count = fishInventory.get(species.id) || 0;

        inventoryRowTexts[index].textContent = caught ? species.name : '???';
        inventoryRowTexts[index].style.color = caught ? '#e0f2fd' : '#6f5b49';
        inventoryCountTexts[index].textContent = caught ? `x${count}   ${species.price}c` : 'Undiscovered';
        inventoryCountTexts[index].style.color = count ? '#8fbf7a' : caught ? '#8c7358' : '#6f5b49';
    });

    const confirming = time < newGameConfirmUntil;
    inventoryNewGameText.textContent = confirming
        ? 'Press N again to erase all progress'
        : 'I / Esc  Close     N  New Game';
    inventoryNewGameText.style.color = confirming ? '#d9745b' : '#8c7358';
}

function openInventory(scene) {
    if (inventoryOpen || mapOpen || marketOpen || dialogueOpen || !inventoryContainer) return;

    inventoryOpen = true;
    newGameConfirmUntil = 0;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    refreshInventoryUI(scene.time.now);

    inventoryContainer.setVisible(true).setY(INVENTORY_HIDDEN_Y);
    inventoryTextLayer.setVisible(true).setY(INVENTORY_HIDDEN_Y);
    scene.tweens.killTweensOf(inventoryContainer);
    scene.tweens.killTweensOf(inventoryTextLayer);
    scene.tweens.add({
        targets: [inventoryContainer, inventoryTextLayer],
        y: DIALOGUE_VISIBLE_Y,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });
}

function closeInventory(scene) {
    if (!inventoryOpen) return;

    inventoryOpen = false;
    newGameConfirmUntil = 0;
    scene.tweens.killTweensOf(inventoryContainer);
    scene.tweens.killTweensOf(inventoryTextLayer);
    scene.tweens.add({
        targets: [inventoryContainer, inventoryTextLayer],
        y: INVENTORY_HIDDEN_Y,
        duration: 140,
        ease: 'Cubic.In',
        onUpdate: snapTweenTarget,
        onComplete: () => {
            if (!inventoryOpen) {
                inventoryContainer.setVisible(false);
                inventoryTextLayer.setVisible(false);
            }
        }
    });
}

function handleInventoryKey(scene, event) {
    const key = event.key.toLowerCase();

    if (key === 'i' || event.key === 'Escape') {
        closeInventory(scene);
        return;
    }

    if (key !== 'n') return;

    if (scene.time.now < newGameConfirmUntil) {
        newGameResetting = true;
        saveDirty = false;
        localStorage.removeItem(SAVE_KEY);
        window.location.reload();
        return;
    }

    newGameConfirmUntil = scene.time.now + 2500;
    refreshInventoryUI(scene.time.now);
}

function createCatchCardUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(40, 0, 240, 30)
        .fillStyle(0xacccf9, 1)
        .fillRect(41, 1, 238, 28)
        .fillStyle(0x465989, 1)
        .fillRect(42, 2, 236, 26)
        .fillStyle(0x36160d, 1)
        .fillRect(43, 3, 234, 24);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: '30px',
        fontFamily: 'm6x11, monospace',
        textAlign: 'center',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
    });

    catchCardTitle = document.createElement('div');
    catchCardDetail = document.createElement('div');

    Object.assign(catchCardTitle.style, {
        position: 'absolute',
        top: '4px',
        left: '43px',
        width: '234px',
        color: '#e0f2fd',
        fontSize: '16px',
        lineHeight: '11px'
    });

    Object.assign(catchCardDetail.style, {
        position: 'absolute',
        top: '16px',
        left: '43px',
        width: '234px',
        color: '#e8c170',
        fontSize: '11px',
        lineHeight: '9px'
    });

    textLayer.append(catchCardTitle, catchCardDetail);

    catchCardContainer = scene.add.container(0, CATCH_CARD_Y + 8, [panel])
        .setDepth(205)
        .setScrollFactor(0)
        .setAlpha(0)
        .setVisible(false);

    catchCardTextLayer = scene.add.dom(0, CATCH_CARD_Y + 8, textLayer)
        .setOrigin(0)
        .setDepth(206)
        .setScrollFactor(0)
        .setAlpha(0)
        .setVisible(false);

    catchCardTextLayer.pointerEvents = 'none';
}

function showCatchCard(scene, time, species, size) {
    const sizeLabels = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Giant'];

    catchCardTitle.textContent = `You caught a ${species.name}!`;
    catchCardDetail.textContent = `${sizeLabels[size] || 'Unknown'} shadow · ${species.price}c`;
    catchCardUntil = time + CATCH_CARD_DURATION;
    itemLabelUntil = 0;

    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    scene.tweens.killTweensOf(catchCardContainer);
    scene.tweens.killTweensOf(catchCardTextLayer);

    for (const target of [catchCardContainer, catchCardTextLayer]) {
        target.setVisible(true).setAlpha(0).setY(CATCH_CARD_Y + 8);
    }

    scene.tweens.add({
        targets: [catchCardContainer, catchCardTextLayer],
        y: CATCH_CARD_Y,
        alpha: 1,
        duration: 180,
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });

    catchCardHideEvent = scene.time.delayedCall(CATCH_CARD_DURATION - 180, () => {
        scene.tweens.add({
            targets: [catchCardContainer, catchCardTextLayer],
            y: CATCH_CARD_Y - 4,
            alpha: 0,
            duration: 180,
            ease: 'Cubic.In',
            onUpdate: snapTweenTarget,
            onComplete: () => {
                catchCardContainer.setVisible(false);
                catchCardTextLayer.setVisible(false);
            }
        });
    });
}

function createInteractionPromptUI(scene) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    wrapper.appendChild(row);

    Object.assign(row.style, {
        width: '320px',
        height: '18px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
        fontFamily: 'm6x11, monospace',
        fontSize: '11px',
        lineHeight: '11px',
        color: '#c0a887',
        whiteSpace: 'nowrap',
    });

    const makePrompt = (key, label) => {
        const box = document.createElement('div');

        Object.assign(box.style, {
            display: 'none',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 6px',
            background: '#36160d',
            borderRadius: '0',
            boxShadow: 'inset 0 0 0 1px #465989, 0 0 0 1px #230a03'
        });

        const keycap = document.createElement('span');
        keycap.textContent = key || '';

        Object.assign(keycap.style, {
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '10px',
            padding: '0 1px',
            color: '#e0f2fd',
            background: '#465989',
            borderRadius: '0'
        });

        const text = document.createElement('span');
        text.textContent = label;

        box.append(...(key ? [keycap, text] : [text]));
        box.label = text;
        row.appendChild(box);

        return box;
    };

    marketPrompt = makePrompt('E', 'Market');
    guidePrompt = makePrompt('E', 'Talk to the Guide');
    itemPrompt = makePrompt(null, '');

    interactionPromptLayer = scene.add.dom(0, PROMPT_Y, wrapper)
        .setOrigin(0)
        .setDepth(103)
        .setScrollFactor(0)
        .setVisible(false);

    interactionPromptLayer.pointerEvents = 'none';
}

function updateInteractionPrompt(scene, guideIsNear) {
    if (!interactionPromptLayer || !marketPrompt || !guidePrompt) return;

    const available = !dialogueOpen && !marketOpen && !mapOpen && !inventoryOpen && scene.time.now >= catchCardUntil;
    const target = available && (guideIsNear || isMarketNear())
        ? getInteractionTarget(guideHasMetPlayer)
        : null;
    const showMarket = target === 'market';
    const showGuide = target === 'guide';
    const showItem = available && !target && scene.time.now < itemLabelUntil;

    const state = (showMarket ? 1 : 0) | (showGuide ? 2 : 0) | (showItem ? 4 : 0);

    if (state === promptState) return;

    const wasShowing = promptState > 0;
    promptState = state;

    scene.tweens.killTweensOf(promptMotion);

    if (state === 0) {
        scene.tweens.add({
            targets: promptMotion,
            value: 0,
            duration: 90,
            onUpdate: applyPromptMotion,
            onComplete: () => {
                if (promptState === 0) {
                    interactionPromptLayer.setVisible(false);
                }
            }
        });
        return;
    }

    marketPrompt.style.display = showMarket ? 'flex' : 'none';
    guidePrompt.style.display = showGuide ? 'flex' : 'none';
    itemPrompt.style.display = showItem ? 'flex' : 'none';
    interactionPromptLayer.setVisible(true);

    if (!wasShowing) {
        promptMotion.value = 0;
    }

    applyPromptMotion();
    scene.tweens.add({
        targets: promptMotion,
        value: 1,
        duration: 140,
        ease: 'Cubic.Out',
        onUpdate: applyPromptMotion
    });
}

function applyPromptMotion() {
    interactionPromptLayer
        .setY(PROMPT_Y + Math.round((1 - promptMotion.value) * PROMPT_SLIDE))
        .setAlpha(promptMotion.value);
}

function createMarketUI(scene) {
    const panel = scene.add.graphics();

    panel
        .fillStyle(0x230a03, 1)
        .fillRect(5, 0, 310, MARKET_HEIGHT)
        .fillStyle(0xacccf9, 1)
        .fillRect(6, 1, 308, MARKET_HEIGHT - 2)
        .fillStyle(0x465989, 1)
        .fillRect(7, 2, 306, MARKET_HEIGHT - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(8, 3, 304, MARKET_HEIGHT - 6)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillRect(12, MARKET_FOOTER_Y - 3, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(MARKET_DETAIL_X, MARKET_LIST_Y, MARKET_DETAIL_WIDTH, MARKET_ROW_HEIGHT * MARKET_ROW_COUNT - 2)
        .fillStyle(0x2a0f07, 1)
        .fillRect(MARKET_DETAIL_X + 1, MARKET_LIST_Y + 1, MARKET_DETAIL_WIDTH - 2, MARKET_ROW_HEIGHT * MARKET_ROW_COUNT - 4);

    marketHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(MARKET_LIST_X, 0, MARKET_LIST_WIDTH, MARKET_ROW_HEIGHT - 2)
        .fillStyle(0x4a2216, 1)
        .fillRect(MARKET_LIST_X + 1, 1, MARKET_LIST_WIDTH - 2, MARKET_ROW_HEIGHT - 4);

    marketRodImages = MARKET_RODS.map((rod, index) => {
        return scene.add.image(MARKET_LIST_X + 3, MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 2, 'rod')
            .setOrigin(0)
            .setDisplaySize(16, 16);
    });

    marketDetailImage = scene.add.image(
        MARKET_DETAIL_X + (MARKET_DETAIL_WIDTH - 32) / 2,
        MARKET_LIST_Y + 8,
        'rod'
    )
        .setOrigin(0)
        .setDisplaySize(32, 32);

    const textLayer = document.createElement('div');

    Object.assign(textLayer.style, {
        position: 'relative',
        width: '320px',
        height: `${MARKET_HEIGHT}px`,
        fontFamily: 'm6x11',
        fontSize: '16px',
        lineHeight: '11px',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
    });

    const createText = (x, y, color, width, align, size) => {
        const text = document.createElement('div');

        Object.assign(text.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: width ? `${width}px` : 'auto',
            textAlign: align || 'left',
            fontSize: size ? `${size}px` : '',
            color,
            whiteSpace: 'nowrap'
        });

        textLayer.appendChild(text);
        return text;
    };

    createText(14, 5, '#acccf9').textContent = 'Rod Shop';
    marketMessageText = createText(160, 5, '#e8c170', 146, 'right');

    marketOptionTexts = [];
    marketPriceTexts = [];

    for (let index = 0; index < MARKET_ROW_COUNT; index++) {
        const rowY = MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 6;
        const isAction = index >= MARKET_RODS.length;

        marketOptionTexts.push(createText(isAction ? MARKET_LIST_X + 6 : MARKET_LIST_X + 24, rowY, '#c0a887'));

        if (!isAction) {
            marketPriceTexts.push(createText(MARKET_LIST_X, rowY, '#c0a887', MARKET_LIST_WIDTH - 5, 'right'));
        }
    }

    const detailTextX = MARKET_DETAIL_X + 4;
    const detailTextWidth = MARKET_DETAIL_WIDTH - 8;

    marketDetailName = createText(detailTextX, MARKET_LIST_Y + 44, '#e0f2fd', detailTextWidth, 'center');
    marketDetailStatus = createText(detailTextX, MARKET_LIST_Y + 57, '#c0a887', detailTextWidth, 'center');
    marketDetailStats = createText(detailTextX, MARKET_LIST_Y + 70, '#8c7358', detailTextWidth, 'center', 11);
    marketDetailStats.style.whiteSpace = 'pre';
    marketDetailStats.style.lineHeight = '9px';
    marketDetailAction = createText(detailTextX, MARKET_LIST_Y + 88, '#acccf9', detailTextWidth, 'center');

    const footer = createText(12, MARKET_FOOTER_Y, '#8c7358', 296, 'center', 11);

    Object.assign(footer.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
    });

    for (const [key, label] of [['W/S', 'Select'], ['Enter', 'Buy'], ['E', 'Close']]) {
        const hint = document.createElement('span');
        const keycap = document.createElement('span');

        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: 'rgba(255, 255, 255, 0.14)',
            padding: '0 2px',
            marginRight: '4px'
        });

        hint.append(keycap, label);
        footer.appendChild(hint);
    }

    marketContainer = scene.add.container(
        0,
        MARKET_HIDDEN_Y,
        [
            panel,
            marketHighlight,
            ...marketRodImages,
            marketDetailImage
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

    marketTextLayer.pointerEvents = 'none';

    refreshMarketOptions();
}

function addHotbarItem(scene, textureKey, name) {
    const slot = hotbarItemImages.length;

    if (slot >= 9) {
        return;
    }

    hotbarItemNames[slot] = name;

    const centerX = HOTBAR_X + slot * HOTBAR_SLOT_SIZE + 13;
    const centerY = HOTBAR_Y + 13;
    const image = scene.add.image(centerX, centerY, textureKey)
        .setDepth(100.5)
        .setScrollFactor(0);
    const grow = { size: 10 };

    const applySize = () => {
        const size = Math.round(grow.size / 2) * 2;
        image.setDisplaySize(size, size).setPosition(centerX, centerY);
    };

    applySize();
    hotbarItemImages.push(image);

    scene.tweens.add({
        targets: grow,
        size: 16,
        duration: 200,
        ease: 'Back.Out',
        onUpdate: applySize,
        onComplete: applySize
    });
}

function getMarketRowAt(x, y) {
    const localY = y - DIALOGUE_VISIBLE_Y - MARKET_LIST_Y;
    const row = Math.floor(localY / MARKET_ROW_HEIGHT);

    if (
        x < MARKET_LIST_X ||
        x >= MARKET_LIST_X + MARKET_LIST_WIDTH ||
        localY < 0 ||
        row >= MARKET_ROW_COUNT ||
        localY - row * MARKET_ROW_HEIGHT >= MARKET_ROW_HEIGHT - 2
    ) {
        return -1;
    }

    return row;
}

function getDialogueOptionAt(x, y) {
    const option = Math.floor((y - DIALOGUE_VISIBLE_Y - DIALOGUE_OPTION_TOP) / DIALOGUE_OPTION_STEP);

    if (
        x < DIALOGUE_OPTION_X - 3 ||
        x >= DIALOGUE_OPTION_X - 3 + DIALOGUE_OPTION_WIDTH ||
        option < 0 ||
        option >= GUIDE_DIALOGUE[dialogueNode].options.length
    ) {
        return -1;
    }

    return option;
}

function getMarketRodStatus(rod) {
    if (ownedRods.has(rod.id)) {
        return { text: 'Owned', color: '#8fbf7a' };
    }

    if (playerCoins < rod.price) {
        return { text: `Need ${rod.price - playerCoins}c more`, color: '#d9745b' };
    }

    return { text: `${rod.price}c`, color: '#e8c170' };
}

function getFishInventorySummary() {
    let count = 0;
    let value = 0;

    for (const [id, amount] of fishInventory) {
        const species = FISH_SPECIES.find(candidate => candidate.id === id);
        if (!species) continue;
        count += amount;
        value += amount * species.price;
    }

    return { count, value };
}

function refreshMarketOptions() {
    if (!marketMessageText) {
        return;
    }

    marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
    marketHighlight.setY(MARKET_LIST_Y + selectedMarketOption * MARKET_ROW_HEIGHT);

    MARKET_RODS.forEach((rod, index) => {
        const selected = index === selectedMarketOption;
        const owned = ownedRods.has(rod.id);
        const affordable = playerCoins >= rod.price;
        const priceText = marketPriceTexts[index];

        marketOptionTexts[index].textContent = rod.label;
        marketOptionTexts[index].style.color = selected ? '#e0f2fd' : owned ? '#7a6450' : '#c0a887';
        priceText.textContent = owned ? 'Owned' : `${rod.price}c`;
        priceText.style.color = owned ? '#8fbf7a' : affordable ? '#e8c170' : '#9a5a47';
        marketRodImages[index].setAlpha(owned ? 0.45 : 1);
    });

    const sellSummary = getFishInventorySummary();
    const sellText = marketOptionTexts[MARKET_SELL_INDEX];
    const exitText = marketOptionTexts[MARKET_EXIT_INDEX];

    sellText.textContent = 'Sell fish';
    sellText.style.color = MARKET_SELL_INDEX === selectedMarketOption ? '#e0f2fd' : '#c0a887';
    exitText.textContent = 'Leave';
    exitText.style.color = MARKET_EXIT_INDEX === selectedMarketOption ? '#e0f2fd' : '#c0a887';

    const rod = MARKET_RODS[selectedMarketOption];

    if (!rod) {
        marketDetailImage.setVisible(false);
        marketDetailStats.textContent = '';

        if (selectedMarketOption === MARKET_SELL_INDEX) {
            marketDetailName.textContent = 'Sell fish';
            marketDetailStatus.textContent = sellSummary.count
                ? `${sellSummary.count} fish · ${sellSummary.value}c`
                : 'No fish to sell';
            marketDetailStatus.style.color = sellSummary.count ? '#e8c170' : '#c0a887';
            marketDetailAction.textContent = marketFeedback
                ? marketFeedback.text
                : sellSummary.count ? 'Enter - Sell all' : '';
            marketDetailAction.style.color = marketFeedback ? marketFeedback.color : '#acccf9';
        } else {
            marketDetailName.textContent = 'Leave shop';
            marketDetailStatus.textContent = 'Come back soon!';
            marketDetailStatus.style.color = '#c0a887';
            marketDetailAction.textContent = 'Enter - Leave';
            marketDetailAction.style.color = '#acccf9';
        }

        return;
    }

    const status = getMarketRodStatus(rod);

    marketDetailImage.setVisible(true).setAlpha(ownedRods.has(rod.id) ? 0.45 : 1);
    marketDetailName.textContent = rod.label;
    marketDetailStatus.textContent = status.text;
    marketDetailStatus.style.color = status.color;
    marketDetailStats.textContent = `Cast ${(rod.castDistance / TILE_SIZE).toFixed(1)}t · Charge ${(rod.chargeTime / 1000).toFixed(2)}s\nLine ${rod.lineStrength.toFixed(2)}x · Zone ${rod.catchZone}`;

    if (marketFeedback) {
        marketDetailAction.textContent = marketFeedback.text;
        marketDetailAction.style.color = marketFeedback.color;
    } else if (ownedRods.has(rod.id) || playerCoins < rod.price) {
        marketDetailAction.textContent = '';
    } else {
        marketDetailAction.textContent = 'Enter - Buy';
        marketDetailAction.style.color = '#acccf9';
    }
}

function buySelectedMarketItem(scene) {
    if (selectedMarketOption === MARKET_EXIT_INDEX) {
        closeMarket(scene);
        return;
    }

    if (selectedMarketOption === MARKET_SELL_INDEX) {
        const summary = getFishInventorySummary();

        if (!summary.count) return;

        playerCoins += summary.value;
        fishInventory.clear();
        saveDirty = true;
        marketFeedback = { text: `Sold for ${summary.value}c!`, color: '#8fbf7a' };

        scene.tweens.killTweensOf(coinDisplay);
        scene.tweens.add({
            targets: coinDisplay,
            value: playerCoins,
            duration: 260,
            ease: 'Quad.Out',
            onUpdate: () => {
                marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
            }
        });

        refreshMarketOptions();
        return;
    }

    const rod = MARKET_RODS[selectedMarketOption];

    if (ownedRods.has(rod.id) || playerCoins < rod.price) {
        return;
    }

    playerCoins -= rod.price;
    ownedRods.add(rod.id);
    saveDirty = true;

    scene.tweens.killTweensOf(coinDisplay);
    scene.tweens.add({
        targets: coinDisplay,
        value: playerCoins,
        duration: 260,
        ease: 'Quad.Out',
        onUpdate: () => {
            marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
        }
    });
    addHotbarItem(scene, 'rod', rod.label);
    marketFeedback = { text: 'Purchased!', color: '#8fbf7a' };

    refreshMarketOptions();
}

function moveMarketSelection(amount) {
    selectedMarketOption = Phaser.Math.Wrap(
        selectedMarketOption + amount,
        0,
        MARKET_ROW_COUNT
    );
    marketFeedback = null;

    refreshMarketOptions();
}

function openMarket(scene) {
    if (
        marketOpen ||
        mapOpen ||
        dialogueOpen ||
        inventoryOpen ||
        !marketContainer ||
        !marketTextLayer ||
        !isMarketNear()
    ) {
        return;
    }

    marketOpen = true;
    selectedMarketOption = 0;
    marketFeedback = null;
    coinDisplay.value = playerCoins;
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
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
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
        onUpdate: snapTweenTarget,
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

    if (key === 'e' || event.key === 'Escape') {
        closeMarket(scene);
    }
}

function getMarketReach() {
    if (!store) {
        return Infinity;
    }

    const x = character.x + CHARACTER_SIZE / 2 - store.x - STORE_WIDTH / 2;
    const y = character.y + CHARACTER_SIZE / 2 - store.y - STORE_HEIGHT / 2;

    return (x * x + y * y) / MARKET_INTERACTION_DISTANCE_SQUARED;
}

function getGuideReach() {
    if (!guide) {
        return Infinity;
    }

    const x = character.x - guide.x;
    const y = character.y - guide.y;

    return (x * x + y * y) / GUIDE_INTERACTION_DISTANCE_SQUARED;
}

function isMarketNear() {
    return getMarketReach() < 1;
}

function isGuideNear() {
    return getGuideReach() < 1;
}

function getClickedWorldTarget(pointer) {
    const x = pointer.worldX;
    const y = pointer.worldY;

    if (
        guide && isGuideNear() &&
        x >= guide.x && x < guide.x + GUIDE_SIZE &&
        y >= guide.y && y < guide.y + GUIDE_SIZE
    ) {
        return 'guide';
    }

    if (
        store && isMarketNear() &&
        x >= store.x && x < store.x + STORE_WIDTH &&
        y >= store.y && y < store.y + STORE_HEIGHT
    ) {
        return 'market';
    }

    return null;
}

function getFacingPenalty(targetX, targetY) {
    const x = targetX - character.x - CHARACTER_SIZE / 2;
    const y = targetY - character.y - CHARACTER_SIZE / 2;
    const along = characterDirection === 'left' ? -x
        : characterDirection === 'right' ? x
        : characterDirection === 'back' ? -y
        : y;

    return along > 0 && along * along * 2 >= x * x + y * y ? 0 : 1;
}

function getInteractionTarget(guideAvailable) {
    const guideReach = guideAvailable ? getGuideReach() : Infinity;
    const marketReach = getMarketReach();

    if (guideReach >= 1 && marketReach >= 1) {
        return null;
    }

    if (guideReach >= 1) return 'market';
    if (marketReach >= 1) return 'guide';

    const guideScore = guideReach + getFacingPenalty(guide.x + GUIDE_SIZE / 2, guide.y + GUIDE_SIZE / 2);
    const marketScore = marketReach + getFacingPenalty(store.x + STORE_WIDTH / 2, store.y + STORE_HEIGHT / 2);

    return guideScore <= marketScore ? 'guide' : 'market';
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
        optionText.textContent = option.label;
        optionText.style.color = index === selectedDialogueOption
            ? '#e0f2fd'
            : '#c0a887';
    });

    dialogueHighlight.setY(DIALOGUE_OPTION_TOP + selectedDialogueOption * DIALOGUE_OPTION_STEP);
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
        inventoryOpen ||
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
        ease: 'Cubic.Out',
        onUpdate: snapTweenTarget
    });

    showGuideDialogueNode(scene, 'intro');
}

function closeGuideDialogue(scene) {
    if (!dialogueOpen) {
        return;
    }

    dialogueOpen = false;
    guideHasMetPlayer = true;
    saveDirty = true;

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
        onUpdate: snapTweenTarget,
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
        event.code === 'Space' ||
        key === 'e'
    ) {
        selectGuideDialogueOption(scene);
        return;
    }

    if (event.key === 'Escape') {
        closeGuideDialogue(scene);
    }
}

function updateGuideInteraction(scene, guideIsNear) {
    if (
        guideIsNear &&
        !guideWasNear &&
        !guideHasMetPlayer &&
        !dialogueOpen &&
        !mapOpen &&
        !marketOpen &&
        !inventoryOpen
    ) {
        openGuideDialogue(scene);
    }

    guideWasNear = guideIsNear;
}

function canCharacterOccupy(scene, x, y) {
    const left = x + CHARACTER_HITBOX_X;
    const top = y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    if (
        guide &&
        left < guide.x + GUIDE_HITBOX_X + GUIDE_HITBOX_WIDTH &&
        right > guide.x + GUIDE_HITBOX_X &&
        top < guide.y + GUIDE_HITBOX_Y + GUIDE_HITBOX_HEIGHT &&
        bottom > guide.y + GUIDE_HITBOX_Y
    ) {
        return false;
    }

    if (
        store &&
        left < store.x + STORE_HITBOX_X + STORE_HITBOX_WIDTH &&
        right > store.x + STORE_HITBOX_X &&
        top < store.y + STORE_HITBOX_Y + STORE_HITBOX_HEIGHT &&
        bottom > store.y + STORE_HITBOX_Y
    ) {
        return false;
    }

    const leftTile = Math.floor(left / TILE_SIZE);
    const rightTile = Math.floor((right - 1) / TILE_SIZE);
    const topTile = Math.floor(top / TILE_SIZE);
    const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);

    for (let tileY = topTile; tileY <= bottomTile; tileY += 1) {
        for (let tileX = leftTile; tileX <= rightTile; tileX += 1) {
            const tile = getWorldTile(tileX, tileY);

            if (tile.blocking === 'full' && !tile.patches?.length) {
                return false;
            }

            if (tile.blocking === 'lower' && bottom > tileY * TILE_SIZE + TILE_SIZE / 2) {
                return false;
            }

            if (
                tile.blocking !== 'full' && tile.baseKey !== 'water' ||
                tile.blocking === 'lower'
            ) {
                continue;
            }

            const water = getTerrainSurface(scene, tile).water;
            const startX = Math.max(left, tileX * TILE_SIZE) - tileX * TILE_SIZE;
            const endX = Math.min(right, (tileX + 1) * TILE_SIZE) - tileX * TILE_SIZE;
            const startY = Math.max(top, tileY * TILE_SIZE) - tileY * TILE_SIZE;
            const endY = Math.min(bottom, (tileY + 1) * TILE_SIZE) - tileY * TILE_SIZE;

            for (let pixelY = startY; pixelY < endY; pixelY += 1) {
                for (let pixelX = startX; pixelX < endX; pixelX += 1) {
                    if (water[pixelY * TILE_SIZE + pixelX]) return false;
                }
            }
        }
    }

    return true;
}

function stepCharacter(scene, stepX, stepY, allowNudge) {
    if (canCharacterOccupy(scene, character.x + stepX, character.y + stepY)) {
        character.x += stepX;
        character.y += stepY;
        return true;
    }

    if (!allowNudge) {
        return false;
    }

    for (let offset = 1; offset <= CHARACTER_CORNER_NUDGE; offset++) {
        for (let side = -1; side <= 1; side += 2) {
            const nudgeX = stepX === 0 ? side * offset : 0;
            const nudgeY = stepY === 0 ? side * offset : 0;

            if (
                canCharacterOccupy(scene, character.x + nudgeX + stepX, character.y + nudgeY + stepY) &&
                canCharacterOccupy(scene, character.x + Math.sign(nudgeX), character.y + Math.sign(nudgeY))
            ) {
                character.x += Math.sign(nudgeX);
                character.y += Math.sign(nudgeY);
                return true;
            }
        }
    }

    return false;
}

function moveCharacterAxis(scene, amountX, amountY, allowNudge) {
    const steps = Math.abs(amountX + amountY);
    const stepX = Math.sign(amountX);
    const stepY = Math.sign(amountY);

    for (let step = 0; step < steps; step++) {
        if (!stepCharacter(scene, stepX, stepY, allowNudge)) {
            return false;
        }
    }

    return true;
}

function followCameraAxis(offset, lag) {
    return Math.abs(lag - offset) > 0.6 ? Math.round(lag) : offset;
}

function updateCamera(delta) {
    const baseScrollX = character.x + CHARACTER_SIZE / 2 - mainCamera.width / 2;
    const baseScrollY = character.y + CHARACTER_SIZE / 2 - mainCamera.height / 2;
    const targetX = baseScrollX + characterMoveRemainderX;
    const targetY = baseScrollY + characterMoveRemainderY;
    const followAmount = 1 - Math.exp(-CAMERA_EASE * characterPace * delta / 1000);

    cameraScrollX += (targetX - cameraScrollX) * followAmount;
    cameraScrollY += (targetY - cameraScrollY) * followAmount;

    cameraOffsetX = followCameraAxis(cameraOffsetX, cameraScrollX - targetX);
    cameraOffsetY = followCameraAxis(cameraOffsetY, cameraScrollY - targetY);

    mainCamera.setScroll(baseScrollX + cameraOffsetX, baseScrollY + cameraOffsetY);
}

function update(time, delta) {
    if (!character) {
        return;
    }

    let moveX = 0;
    let moveY = 0;

    if (!dialogueOpen && !mapOpen && !marketOpen && !inventoryOpen) {
        const left = characterKeys.left.isDown || characterKeys.leftArrow.isDown;
        const right = characterKeys.right.isDown || characterKeys.rightArrow.isDown;
        const up = characterKeys.up.isDown || characterKeys.upArrow.isDown;
        const down = characterKeys.down.isDown || characterKeys.downArrow.isDown;

        moveX = left && right ? horizontalPriority : left ? -1 : right ? 1 : 0;
        moveY = up && down ? verticalPriority : up ? -1 : down ? 1 : 0;

        if (moveX !== 0) {
            characterDirection = moveX < 0 ? 'left' : 'right';
        }

        if (moveY !== 0) {
            characterDirection = moveY < 0 ? 'back' : 'front';
        }
    }

    const isWalking = moveX !== 0 || moveY !== 0;
    characterMoving = isWalking;

    if (!isWalking) {
        characterWalkPhase = 1;

        const idleTextureKey = `character-${characterDirection}`;

        if (idleTextureKey !== characterTextureKey) {
            characterTextureKey = idleTextureKey;
            character.setTexture(characterTextureKey);
        }
    }

    if (isWalking) {
        const pace = characterKeys.sprint.isDown ? CHARACTER_SPRINT_MULTIPLIER : 1;
        characterPace = pace;
        const frameDelta = Math.min(delta, 50);
        const distance = CHARACTER_SPEED * pace * frameDelta / 1000 *
            (moveX !== 0 && moveY !== 0 ? Math.SQRT1_2 : 1);

        characterWalkPhase += frameDelta * CHARACTER_ANIMATION_SPEED * pace / 1000;

        characterMoveRemainderX += moveX * distance;
        characterMoveRemainderY += moveY * distance;
        const wholeMoveX = Math.trunc(characterMoveRemainderX);
        const wholeMoveY = Math.trunc(characterMoveRemainderY);

        characterMoveRemainderX -= wholeMoveX;
        characterMoveRemainderY -= wholeMoveY;

        if (!moveCharacterAxis(this, wholeMoveX, 0, moveY === 0)) {
            characterMoveRemainderX = 0;
        }

        if (!moveCharacterAxis(this, 0, wholeMoveY, moveX === 0)) {
            characterMoveRemainderY = 0;
        }

        const walkFrame = CHARACTER_WALK_FRAMES[Math.floor(characterWalkPhase) % 4];

        const frameSuffix = walkFrame === 0 ? '' : `walk${walkFrame}`;
        const nextTextureKey = `character-${characterDirection}${frameSuffix}`;

        if (nextTextureKey !== characterTextureKey) {
            if (walkFrame !== 0) {
                kickUpDust(this, time, moveX, moveY);
            }

            characterTextureKey = nextTextureKey;
            character.setTexture(characterTextureKey);
        }
    }    
    
    character.x = Math.round(character.x);
    character.y = Math.round(character.y);
    character.setDepth(character.y + CHARACTER_SIZE);
    updateCharacterShadow(this);
    updateParticles(time);
    updateFishing(this, time, delta, isWalking);
    updateBushRustle(this, time, isWalking);

    const guideIsNear = isGuideNear();
    updateGuideInteraction(this, guideIsNear);
    updateInteractionPrompt(this, guideIsNear);

    if (mapOpen) {
        updateMapPan(this, delta);
    }

    if (inventoryOpen && newGameConfirmUntil && time >= newGameConfirmUntil) {
        newGameConfirmUntil = 0;
        refreshInventoryUI(time);
    }

    updateLoadedChunks(this);
    buildPendingChunk(this);
    updateCamera(delta);
    updateChunkVisibility();
    updateFish(delta);
    updateChunkWater(time);
}
