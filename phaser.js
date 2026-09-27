const APP_CACHE_BUSTER = window.APP_CACHE_BUSTER || new Date().toISOString().slice(0, 10);
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
const propPlacementCache = new Map();
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
const FISH_SIZE_CLASSES = {
    small: { label: 'Small', length: 6, radius: 1.5, difficulty: 0.15 },
    medium: { label: 'Medium', length: 10, radius: 2.4, difficulty: 0.48 },
    large: { label: 'Large', length: 14, radius: 3.4, difficulty: 0.78 },
    giant: { label: 'Monstrous', length: 42, radius: 10, difficulty: 1.65 }
};
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
const FISH_NOTICE_SCAN_TIME = 160;
const FISH_LURE_SPEED = 10;
const FISH_LURE_TURN = 5;
const FISH_LURE_PULSE_TIME = 240;
const FISH_INSPECT_MIN = 380;
const FISH_INSPECT_RANGE = 360;
const FISH_NIBBLE_DIP_TIME = 150;
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

let guide;
let shadowLayer;
let characterShadow;
const shadowLut = new Map();
const propArt = new Map();
const treeVariants = [];
const staticShadowCasters = [];
const particlePool = [];
const availableParticles = [];
let fishing = null;
let fishingLine;
const pixelPathX = new Int32Array(1024);
const pixelPathY = new Int32Array(1024);
const pixelPathColor = new Int32Array(1024);
let pixelPathLength = 0;
let inventoryFooterHints;
const OWNED_ROD_TINT = 0x8a7c6e;
const HOOKED_REEL_PULL = 0.55;
const HOOKED_THRASH_RATE = 0.35;
const HOOKED_RADIUS_BASE = 3;
const HOOKED_RADIUS_PER_LENGTH = 0.3;
const HOOKED_SPIN_BASE = 8;
const HOOKED_SPIN_PER_LENGTH = 0.25;
const HOOKED_SPIN_MIN = 4;
const HOOKED_SQUASH = 0.72;
const HOOKED_BEAT = 6;
const HOOKED_SWEEP = 0.22;
const HOOKED_SPLASH_MIN = 180;
const HOOKED_SPLASH_RANGE = 160;
let fishingUiPanel;
let fishingCatchZoneTop;
let fishingCatchZoneMiddle;
let fishingCatchZoneBottom;
let fishingFishMarker;
let fishingProgressFill;
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
const PROP_TYPES = {
    bush: { width: 2, solid: false, onDirt: false, hitbox: null },
    rock: { width: 1, solid: true, onDirt: true, hitbox: [2, 6] },
    boulder: { width: 2, solid: true, onDirt: true, hitbox: [2, 8] },
    tree: { width: 2, solid: true, onDirt: false, hitbox: null }
};
const PROP_SPAWN_CLEARANCE = 3;
const PROP_FOREST_SCALE = 14;
const PROP_FOREST_LEVEL = 0.72;
const TREE_CANOPY_TILES = 4;
const TREE_HITBOX_HEIGHT = 5;
const TREE_VARIANT_COUNT = 24;
const TREE_TONE_SHARES = [0.09, 0.42, 0.75, 0.97];
const TREE_DITHER_SHARE = 0.05;
const TREE_PAD_X = 14;
const TREE_PAD_TOP = 8;
const TREE_LEAF_PALETTES = [
    { weight: 6, colors: [0x376451, 0x4a7a52, 0x6c955d, 0x8eb067, 0xb0c579], extras: [0x7e4332, 0xc0493b] },
    { weight: 2, colors: [0x3f5f3c, 0x587a45, 0x7a9a50, 0x9fb862, 0xc3d27e], extras: [] },
    { weight: 1, colors: [0x2c5348, 0x3a6a55, 0x4f8260, 0x6c9a6a, 0x8db47c], extras: [] },
    { weight: 1, colors: [0x7a4030, 0x9c5634, 0xbd7640, 0xd69a55, 0xe8bd72], extras: [] },
    { weight: 0.8, colors: [0x6b3a3a, 0x8c4a40, 0xae6249, 0xc9825a, 0xdea675], extras: [] },
    { weight: 0.6, colors: [0x8a5a6e, 0xab7085, 0xc98e9e, 0xe0aeb6, 0xf2cdcc], extras: [] }
];
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
let dialoguePortrait;
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
            withCacheBuster(`media/characters/player/${frame}.png`)
        )
    });

    tileKeys.forEach(tileKey => {
        this.load.image(tileKey, withCacheBuster(`media/environment/terrain/${tileKey}.png`));
    });

    this.load.image('hotbar', withCacheBuster('media/ui/hud/hotbar.png'));
    this.load.image('selected', withCacheBuster('media/ui/hud/selected.png'));
    this.load.image('shop-ui', withCacheBuster('media/ui/shop/panel.png'));
    this.load.image('bush', withCacheBuster('media/environment/objects/bush.png'));
    this.load.image('boulder', withCacheBuster('media/environment/objects/boulder.png'));
    this.load.image('rock', withCacheBuster('media/environment/objects/rock.png'));
    this.load.image('tree-bare', withCacheBuster('media/environment/objects/tree-bare.png'));

    this.load.image('guide', withCacheBuster('media/characters/guide/sprite.png'));
    this.load.image('guide-portrait-friendly', withCacheBuster('media/characters/guide/friendly.png'));
    this.load.image('guide-portrait-laughing', withCacheBuster('media/characters/guide/laughing.png'));
    this.load.image('guide-portrait-surprised', withCacheBuster('media/characters/guide/surprised.png'));
    this.load.image('store', withCacheBuster('media/environment/objects/store.png'));
    this.load.image('rod-basic', withCacheBuster('media/items/rods/basic.png'));
    this.load.image('rod-intermediate', withCacheBuster('media/items/rods/intermediate.png'));
    this.load.image('rod-master', withCacheBuster('media/items/rods/master.png'));
    this.load.image('rod-basic-icon', withCacheBuster('media/items/rods/basic-icon.png'));
    this.load.image('rod-intermediate-icon', withCacheBuster('media/items/rods/intermediate-icon.png'));
    this.load.image('rod-master-icon', withCacheBuster('media/items/rods/master-icon.png'));
    this.load.image('fishing-ui', withCacheBuster('media/ui/fishing/panel.png'));
    this.load.image('fishing-catch-zone', withCacheBuster('media/ui/fishing/catch-zone.png'));
    this.load.image('fishing-fish', withCacheBuster('media/ui/fishing/fish.png'));
    this.load.image('fishing-progress', withCacheBuster('media/ui/fishing/progress.png'));

    this.load.image('waterOverlay', withCacheBuster('media/environment/effects/water-overlay.png'));
    this.load.image('shimmer-art', withCacheBuster('media/environment/effects/shimmer.png'));
}

function extractRodArtStyles(scene) {
    const colorAt = (texture, x, y, fallback) => {
        const color = scene.textures.getPixel(x, y, texture);
        return color ? Phaser.Display.Color.GetColor(color.red, color.green, color.blue) : fallback;
    };

    for (const rod of MARKET_RODS) {
        rod.polePalette = [
            colorAt(rod.texture, 19, 4, 0x4c3e32),
            colorAt(rod.texture, 19, 6, 0x6b533b),
            colorAt(rod.texture, 19, 5, 0x806953)
        ];
        rod.linePalette = [
            colorAt(rod.texture, 28, 2, 0xa78178),
            colorAt(rod.texture, 29, 3, 0xb99f92),
            colorAt(rod.texture, 29, 5, 0xc8b8a8),
            colorAt(rod.texture, 30, 9, FISHING_LINE_COLOR)
        ];
        rod.bobberPalette = [
            colorAt(rod.texture, 27, 26, BOBBER_TOP_COLOR),
            colorAt(rod.texture, 25, 26, BOBBER_TOP_COLOR),
            colorAt(rod.texture, 23, 25, BOBBER_BOTTOM_COLOR)
        ];
    }
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

function extractSilhouetteShadow(scene, key) {
    const pixels = getTerrainPixels(scene, key);
    const { width, height } = pixels;
    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && pixels.data[(y * width + x) * 4 + 3] > 0;
    const points = [];

    for (let y = 0; y < height + WOOD_SHADOW_OFFSET; y++) {
        for (let x = 0; x < width + WOOD_SHADOW_OFFSET; x++) {
            if (solid(x - WOOD_SHADOW_OFFSET, y - WOOD_SHADOW_OFFSET) && !solid(x, y)) {
                points.push(x, y);
            }
        }
    }

    return points;
}

function createPropArt(scene) {
    for (const key of ['bush', 'rock', 'boulder']) {
        const source = getTextureSource(scene, key);
        propArt.set(key, { width: source.width, height: source.height, shadow: extractSilhouetteShadow(scene, key) });
    }

    const trunk = getTerrainPixels(scene, 'tree-bare');
    treeVariants.length = 0;

    for (let index = 0; index < TREE_VARIANT_COUNT; index++) {
        const variant = generateTreeVariant(trunk, Math.floor(worldHash(index, 0, 766) * 4294967295));
        variant.key = `tree-${index}`;

        if (!scene.textures.exists(variant.key)) {
            const texture = scene.textures.createCanvas(variant.key, variant.width, variant.height);
            texture.getContext().putImageData(new ImageData(variant.data, variant.width, variant.height), 0, 0);
            texture.refresh();
        }

        treeVariants.push(variant);
    }
}

function createBushSlices(scene) {
    const source = getTextureSource(scene, 'bush');
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

function createSeededRandom(seed) {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = Math.imul(state ^ (state >>> 15), state | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function leafHash(x, y, salt) {
    return coordinateHash(x, y, Math.imul(salt, 2246822519));
}

function pickTreePalette(random) {
    const total = TREE_LEAF_PALETTES.reduce((sum, palette) => sum + palette.weight, 0);
    let roll = random() * total;

    for (const palette of TREE_LEAF_PALETTES) {
        roll -= palette.weight;
        if (roll < 0) return palette;
    }

    return TREE_LEAF_PALETTES[0];
}

function writeTreePixel(data, pixel, color) {
    data[pixel * 4] = color >> 16;
    data[pixel * 4 + 1] = (color >> 8) & 255;
    data[pixel * 4 + 2] = color & 255;
    data[pixel * 4 + 3] = 255;
}

function readTreePixel(data, pixel) {
    return (data[pixel * 4] << 16) | (data[pixel * 4 + 1] << 8) | data[pixel * 4 + 2];
}

function generateTreeVariant(trunk, seed) {
    const random = createSeededRandom(seed);
    const flip = random() < 0.5;
    const width = trunk.width + TREE_PAD_X * 2;
    const height = trunk.height + TREE_PAD_TOP;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < trunk.height; y++) {
        for (let x = 0; x < trunk.width; x++) {
            const source = (y * trunk.width + (flip ? trunk.width - 1 - x : x)) * 4;
            if (!trunk.data[source + 3]) continue;

            const pixel = (y + TREE_PAD_TOP) * width + x + TREE_PAD_X;
            writeTreePixel(data, pixel, (trunk.data[source] << 16) | (trunk.data[source + 1] << 8) | trunk.data[source + 2]);
        }
    }

    const palette = pickTreePalette(random);
    const colors = palette.colors;
    const radiusX = 23 + random() * 5;
    const radiusY = 17 + random() * 3;
    const centerX = width / 2 + (flip ? -1 : 1) + (random() - 0.5) * 3;
    const centerY = TREE_PAD_TOP + 22 + random() * 2;
    const puffs = [{ x: centerX, y: centerY, radius: Math.min(radiusX, radiusY) - 4, core: true }];
    const ringCount = 7 + Math.floor(random() * 3);
    const ringPhase = random() * Math.PI * 2;

    for (let index = 0; index < ringCount; index++) {
        const angle = ringPhase + index / ringCount * Math.PI * 2 + (random() - 0.5) * 0.5;
        const radius = 6.5 + random() * 3;

        puffs.push({
            x: centerX + Math.cos(angle) * (radiusX - radius),
            y: centerY + Math.sin(angle) * (radiusY - radius),
            radius,
            core: false
        });
    }

    const innerCount = 3 + Math.floor(random() * 3);

    for (let index = 0; index < innerCount; index++) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * 0.5;

        puffs.push({
            x: centerX + Math.cos(angle) * distance * radiusX,
            y: centerY + Math.sin(angle) * distance * radiusY + 2,
            radius: 7 + random() * 3,
            core: false
        });
    }

    puffs.sort((a, b) => (a.core ? -1 : b.core ? 1 : a.y - b.y));

    const owner = new Int16Array(width * height).fill(-1);
    const edgeSalt = Math.floor(random() * 100000);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const edge = (leafHash(x, y, edgeSalt) - 0.5) * 1.2;

            for (let index = puffs.length - 1; index >= 0; index--) {
                const puff = puffs[index];
                const dx = x + 0.5 - puff.x;
                const dy = y + 0.5 - puff.y;
                const reach = puff.radius + edge;

                if (dx * dx + dy * dy <= reach * reach) {
                    if (index > 0 && ((x + y) & 1) && Math.sqrt(dx * dx + dy * dy) > reach - 1 && owner[y * width + x] === -1) {
                        owner[y * width + x] = -3;
                        continue;
                    }

                    owner[y * width + x] = index;
                    break;
                }
            }
        }
    }

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] !== -3) continue;

        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let front = -1;

        for (let index = puffs.length - 1; index >= 0 && front < 0; index--) {
            const dx = x + 0.5 - puffs[index].x;
            const dy = y + 0.5 - puffs[index].y;
            const reach = puffs[index].radius + (leafHash(x, y, edgeSalt) - 0.5) * 1.2;
            if (dx * dx + dy * dy <= reach * reach) front = index;
        }

        owner[pixel] = front;
    }

    for (let pass = 0; pass < 2; pass++) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const pixel = y * width + x;
                let count = 0;
                let front = -1;

                for (const next of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
                    if (owner[next] < 0) continue;
                    count++;
                    front = Math.max(front, owner[next]);
                }

                if (owner[pixel] >= 0 && count <= 1) owner[pixel] = -1;
                else if (owner[pixel] < 0 && count >= 3) owner[pixel] = front;
            }
        }
    }

    let top = height;
    let bottom = 0;

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] < 0) continue;
        top = Math.min(top, Math.floor(pixel / width));
        bottom = Math.max(bottom, Math.floor(pixel / width));
    }

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (owner[pixel] < 0) continue;

            let best = 0;

            for (const puff of puffs) {
                const dx = x + 0.5 - puff.x;
                const dy = y + 0.5 - puff.y;
                const lift = puff.radius * puff.radius - dx * dx - dy * dy;
                if (lift > 0) best = Math.max(best, Math.sqrt(lift) * (puff.core ? 0.8 : 1));
            }

            heights[pixel] = best;
        }
    }

    const smooth = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (owner[pixel] < 0) continue;

            let total = 0;
            let count = 0;

            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    const sampleX = x + offsetX;
                    const sampleY = y + offsetY;
                    if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) continue;
                    total += heights[sampleY * width + sampleX];
                    count++;
                }
            }

            smooth[pixel] = total / count;
        }
    }

    const textureSalt = Math.floor(random() * 100000);
    const levels = new Int8Array(width * height).fill(-1);
    const values = new Float32Array(width * height);
    const span = Math.max(1, bottom - top);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (owner[pixel] < 0) continue;

            const depth = (y - top) / span;
            const left = x > 0 ? smooth[pixel - 1] : 0;
            const right = x + 1 < width ? smooth[pixel + 1] : 0;
            const up = y > 0 ? smooth[pixel - width] : 0;
            const down = y + 1 < height ? smooth[pixel + width] : 0;
            const nx = (left - right) * 0.5;
            const ny = (up - down) * 0.5;
            const length = Math.hypot(nx, ny, 1.6);
            const puff = puffs[owner[pixel]];
            const puffX = (x + 0.5 - puff.x) / puff.radius;
            const puffY = (y + 0.5 - puff.y) / puff.radius;
            const puffZ = Math.sqrt(Math.max(0, 1 - puffX * puffX - puffY * puffY));
            const local = puff.core ? 0.5 : -0.45 * puffX - 0.7 * puffY + 0.35 * puffZ;
            const lit = (-0.5 * nx - 0.65 * ny + 0.57 * 1.6) / length * 0.5 + (local * 0.5 + 0.3) * 0.5;
            const global = -0.2 * (x + 0.5 - centerX) / radiusX - 0.6 * (depth - 0.45);
            let value = (lit - 0.62) * 1.9 + global;

            const speck = leafHash((x + (y & 1)) >> 1, y >> 1, textureSalt);
            if (speck > 0.8) value += 0.28;
            else if (speck < 0.2) value -= 0.28;

            values[pixel] = value;
        }
    }

    const sorted = [];
    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] >= 0) sorted.push(values[pixel]);
    }

    sorted.sort((a, b) => a - b);

    const quantile = amount => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(amount * sorted.length)))];
    const bands = TREE_TONE_SHARES.map(share => [quantile(share - TREE_DITHER_SHARE), quantile(share + TREE_DITHER_SHARE)]);

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] < 0) continue;

        const value = values[pixel];
        const checker = (pixel % width + Math.floor(pixel / width)) & 1;
        let level = 0;

        for (const [low, high] of bands) {
            if (value >= high || (value >= low && checker)) level++;
        }

        levels[pixel] = level;
    }

    for (let y = 0; y < bottom - 3; y++) {
        for (let x = 0; x < width; x++) {
            if (owner[y * width + x] < 0) data[(y * width + x) * 4 + 3] = 0;
        }
    }

    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0) writeTreePixel(data, pixel, colors[levels[pixel]]);
    }

    if (palette.extras.length && random() < 0.4) {
        const extra = palette.extras[Math.floor(random() * palette.extras.length)];
        const count = 5 + Math.floor(random() * 6);

        for (let attempt = 0, placed = 0; attempt < 500 && placed < count; attempt++) {
            const pixel = Math.floor(random() * levels.length);
            if (levels[pixel] < 1 || levels[pixel] > 2 || levels[pixel + 1] < 0 || levels[pixel - width] < 0) continue;

            writeTreePixel(data, pixel, extra);
            placed++;
        }
    }

    const bark = [];

    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0 || !data[pixel * 4 + 3]) continue;
        const color = readTreePixel(data, pixel);
        if (!bark.includes(color)) bark.push(color);
    }

    const luma = color => (color >> 16) * 0.299 + ((color >> 8) & 255) * 0.587 + (color & 255) * 0.114;
    bark.sort((a, b) => luma(a) - luma(b));

    for (let x = 0; x < width; x++) {
        let shade = 0;

        for (let y = 0; y < height; y++) {
            const pixel = y * width + x;

            if (levels[pixel] >= 0) {
                shade = 4;
                continue;
            }

            if (shade > 0 && data[pixel * 4 + 3] && (shade > 2 || (x + y) & 1)) {
                writeTreePixel(data, pixel, bark[Math.max(0, bark.indexOf(readTreePixel(data, pixel)) - 1)]);
            }

            shade--;
        }
    }

    const shadow = new Set();
    const groundY = height - 1;

    for (const puff of puffs) {
        const shadowX = centerX + (puff.x - centerX) * 0.8 + 3;
        const shadowY = groundY + (puff.y - centerY) * 0.35;
        const reachX = puff.radius * 0.85;
        const reachY = puff.radius * 0.55;

        for (let y = Math.floor(shadowY - reachY); y <= Math.ceil(shadowY + reachY); y++) {
            for (let x = Math.floor(shadowX - reachX); x <= Math.ceil(shadowX + reachX); x++) {
                const dx = (x + 0.5 - shadowX) / reachX;
                const dy = (y + 0.5 - shadowY) / reachY;
                if (dx * dx + dy * dy <= 1 + (leafHash(x, y, edgeSalt + 1) - 0.5) * 0.25) shadow.add(y * 1024 + x);
            }
        }
    }

    const shadowPoints = [];
    for (const point of shadow) shadowPoints.push(point % 1024, Math.floor(point / 1024));

    let hitLeft = width;
    let hitRight = 0;

    for (let y = height - 12; y < height - 8; y++) {
        for (let x = 0; x < width; x++) {
            if (!data[(y * width + x) * 4 + 3]) continue;
            hitLeft = Math.min(hitLeft, x);
            hitRight = Math.max(hitRight, x + 1);
        }
    }

    return { width, height, data, flip, shadowPoints, hitLeft, hitRight, color: colors[2] };
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
    createPropArt(this);
    createBushSlices(this);
    createRoundedCliffTextures(this);
    createShimmerSheet(this);
    extractRodArtStyles(this);

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    createCharacterShadow(this);
    fishingLine = this.add.graphics();
    worldObjectLayer.add(fishingLine);
    fishingUiPanel = this.add.image(FISHING_GAME_X, FISHING_GAME_Y, 'fishing-ui')
        .setOrigin(0).setDepth(220).setScrollFactor(0).setVisible(false);
    const catchZoneTexture = this.textures.get('fishing-catch-zone');
    catchZoneTexture.add('top', 0, 0, 0, 8, 3);
    catchZoneTexture.add('middle', 0, 0, 3, 8, 2);
    catchZoneTexture.add('bottom', 0, 0, 5, 8, 3);
    fishingCatchZoneTop = this.add.image(0, 0, 'fishing-catch-zone', 'top')
        .setOrigin(0).setDepth(221).setScrollFactor(0).setVisible(false);
    fishingCatchZoneMiddle = this.add.image(0, 0, 'fishing-catch-zone', 'middle')
        .setOrigin(0).setDepth(221).setScrollFactor(0).setVisible(false);
    fishingCatchZoneBottom = this.add.image(0, 0, 'fishing-catch-zone', 'bottom')
        .setOrigin(0).setDepth(221).setScrollFactor(0).setVisible(false);
    fishingFishMarker = this.add.image(0, 0, 'fishing-fish')
        .setOrigin(0.5).setDepth(222).setScrollFactor(0).setVisible(false);
    fishingProgressFill = this.add.image(0, 0, 'fishing-progress')
        .setOrigin(0).setDepth(221).setScrollFactor(0).setVisible(false);

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

        if (CHEATS_ENABLED && event.key.toLowerCase() === 's') {
            spawnSturgeonAtCursor(this);
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
    if (TEST_MODE) {
        try {
            window.PIXCATION_TEST_RESULTS = runAutomatedTests(this);
        } catch (error) {
            window.PIXCATION_TEST_RESULTS = {
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                results: []
            };
        }
        document.documentElement.dataset.testResults = JSON.stringify(window.PIXCATION_TEST_RESULTS);
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

    if (!TEST_MODE) {
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

    const legacyRodIds = { sturdy: 'intermediate', iron: 'master' };

    for (const savedId of Array.isArray(saved.rods) ? saved.rods : []) {
        const id = legacyRodIds[savedId] || savedId;
        const rod = MARKET_RODS_BY_ID.get(id);

        if (rod && !ownedRods.has(id)) {
            ownedRods.add(id);
            addHotbarItem(scene, rod.icon, rod.label);
        }
    }

    const legacySpecies = {
        minnow: 'common-minnow',
        carp: 'common-carp',
        bass: 'largemouth-bass',
        catfish: 'channel-catfish',
        koi: 'goldfish'
    };
    const currentSpeciesId = id => legacySpecies[id] || id;

    for (const [savedId, count] of Array.isArray(saved.fish) ? saved.fish : []) {
        const id = currentSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id) && Number.isInteger(count) && count > 0) {
            fishInventory.set(id, (fishInventory.get(id) || 0) + count);
        }
    }

    for (const savedId of Array.isArray(saved.catchLog) ? saved.catchLog : []) {
        const id = currentSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id)) catchLog.add(id);
    }

    for (const tileId of Array.isArray(saved.explored) ? saved.explored : []) {
        if (Number.isSafeInteger(tileId)) discoveredChunks.add(tileId);
    }

    refreshMarketOptions();
    mapDirty = true;
}

function saveProgress() {
    if (newGameResetting || !saveDirty || TEST_MODE) return;

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

function createCharacterShadow(scene) {
    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const texture = scene.textures.createCanvas('character-shadow', width, height);
    const image = scene.add.image(0, 0, texture.key).setOrigin(0);

    shadowLayer.add(image);
    const context = texture.getContext();
    characterShadow = { texture, image, context, pixels: context.createImageData(width, height), x: null, y: null };
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

    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const image = characterShadow.pixels;
    image.data.fill(0);

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

    characterShadow.context.putImageData(image, 0, 0);
    characterShadow.texture.refresh();
}

function isBlockedByProp(left, top, right, bottom) {
    const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);
    const rightTile = Math.floor((right - 1) / TILE_SIZE);

    for (let tileY = Math.floor(top / TILE_SIZE); tileY <= bottomTile; tileY++) {
        for (let tileX = Math.floor(left / TILE_SIZE) - 1; tileX <= rightTile; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type || !PROP_TYPES[type].solid) continue;

            if (propBlocksRect(type, tileX, tileY, left, top, right, bottom)) return true;
        }
    }

    return false;
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

    if (isBlockedByProp(left, top, right, bottom)) {
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
