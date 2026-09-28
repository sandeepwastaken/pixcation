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

let resizeFrame = 0;

window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        if (game) game.scale.setZoom(getPixelPerfectZoom());
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
const TILE_CACHE_CHUNK_LIMIT = 256;

const loadedChunks = new Map();
const loadedWaterChunks = new Set();
const loadedShimmerChunks = new Set();
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
const FISH_NOTICE_MIN_DISTANCE_SQUARED = FISH_NOTICE_MIN_DISTANCE * FISH_NOTICE_MIN_DISTANCE;
const FISH_NOTICE_MAX_DISTANCE_SQUARED = FISH_NOTICE_MAX_DISTANCE * FISH_NOTICE_MAX_DISTANCE;
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
const FISH_SCARE_DISTANCE_SQUARED = FISH_SCARE_DISTANCE * FISH_SCARE_DISTANCE;
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
const MARKET_TAB_Y = 5;
const MARKET_TAB_X = 14;
const MARKET_TAB_WIDTH = 34;
const BAIT_SLOT_X = HOTBAR_X + 9 * HOTBAR_SLOT_SIZE + 4;
const CHEST_SALT = 7331;
const CHEST_CHANCE = 0.4;
const CHEST_PLACEMENT_ATTEMPTS = 24;
const CHEST_MIN_DEPTH = 8;
const CHEST_SNAG_MARGIN = 2;
const CHEST_REEL_DURATION = 560;
const CHEST_FISH_CHANCE = 0.55;
const CHEST_FISH_WATER = 8000;
const CHEST_BUBBLE_MIN = 1400;
const CHEST_BUBBLE_RANGE = 2600;
const CHEST_BUBBLE_LIFETIME = 540;
const CHEST_BUBBLE_COLOR = 0xa9d4e4;
const CHEST_SPARKLE_COLORS = [0xe8c170, 0xf6f5e5, 0xd69a55];
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
let fishingUiParts = [];
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
let marketItemImages = [];
let marketPriceTexts = [];
let marketHighlight;
let marketDetailImage;
let marketDetailName;
let marketDetailStatus;
let marketDetailAction;
let marketFeedback = null;
let selectedMarketOption = 0;
let marketPage = 0;
let marketTabTexts = [];
let playerCoins = 100;
const coinDisplay = { value: playerCoins };
const ownedRods = new Set();
const fishInventory = new Map();
const catchLog = new Set();
const baitInventory = new Map();
const openedChests = new Set();
let activeBaitId = null;
let baitSlotImage;
let baitCountText;
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
    const load = (key, path) => this.load.image(key, withCacheBuster(`media/${path}.png`));
    const tileKeys = [
        'dirt1', 'dirtEdge', 'cornerDirt1', 'cornerDirt2', 'cornerDirt3', 'dirtEdgeCorner',
        'dirtEdgeOuterLeft', 'dirtEdgeOuterRight', 'dirtEdgeOuterBoth', 'dirtEdgeInnerLeft', 'dirtEdgeInnerRight',
        'dirtCliffCorner', 'waterDirtInnerLeft', 'waterDirtInnerRight', 'corner',
        'grass1', 'grass2', 'grass3', 'grass4', 'grassEdge', 'water', 'waterDirt', 'waterGrass',
        'wood', 'woodLeft', 'woodRight', 'transition1', 'transition2', 'transition3', 'transition4'
    ];

    for (const direction of ['front', 'back', 'left', 'right']) {
        for (const step of ['', 'walk1', 'walk2']) {
            load(`character-${direction}${step}`, `characters/player/${direction}${step}`);
        }
    }

    for (const tileKey of tileKeys) {
        load(tileKey, `environment/terrain/${tileKey}`);
    }

    for (const key of ['bush', 'boulder', 'rock', 'tree-bare', 'store']) {
        load(key, `environment/objects/${key}`);
    }

    for (const mood of ['friendly', 'laughing', 'surprised']) {
        load(`guide-portrait-${mood}`, `characters/guide/${mood}`);
    }

    for (const rod of MARKET_RODS) {
        load(rod.texture, `items/rods/${rod.id}`);
        load(rod.icon, `items/rods/${rod.id}-icon`);
    }

    for (const bait of MARKET_BAITS) {
        load(bait.texture, `items/baits/${bait.id}Bait`);
        load(bait.icon, `items/baits/${bait.id}-icon`);
    }

    load('hotbar', 'ui/hud/hotbar');
    load('selected', 'ui/hud/selected');
    load('shop-ui', 'ui/shop/panel');
    load('guide', 'characters/guide/sprite');
    load('chest', 'items/chest');
    load('fishing-ui', 'ui/fishing/panel');
    load('fishing-catch-zone', 'ui/fishing/catch-zone');
    load('fishing-fish', 'ui/fishing/fish');
    load('fishing-progress', 'ui/fishing/progress');
    load('waterOverlay', 'environment/effects/water-overlay');
    load('shimmer-art', 'environment/effects/shimmer');
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
    createChestSilhouette(this);

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    createCharacterShadow(this);
    fishingLine = this.add.graphics();
    worldObjectLayer.add(fishingLine);
    const catchZoneTexture = this.textures.get('fishing-catch-zone');
    const hudImage = (key, frame, depth, origin = 0) => this.add.image(0, 0, key, frame)
        .setOrigin(origin).setDepth(depth).setScrollFactor(0).setVisible(false);

    catchZoneTexture.add('top', 0, 0, 0, 8, 3);
    catchZoneTexture.add('middle', 0, 0, 3, 8, 2);
    catchZoneTexture.add('bottom', 0, 0, 5, 8, 3);
    fishingUiPanel = hudImage('fishing-ui', undefined, 220).setPosition(FISHING_GAME_X, FISHING_GAME_Y);
    fishingCatchZoneTop = hudImage('fishing-catch-zone', 'top', 221);
    fishingCatchZoneMiddle = hudImage('fishing-catch-zone', 'middle', 221);
    fishingCatchZoneBottom = hudImage('fishing-catch-zone', 'bottom', 221);
    fishingFishMarker = hudImage('fishing-fish', undefined, 222, 0.5);
    fishingProgressFill = hudImage('fishing-progress', undefined, 221);
    fishingUiParts = [fishingUiPanel, fishingCatchZoneTop, fishingCatchZoneMiddle, fishingCatchZoneBottom, fishingFishMarker, fishingProgressFill];

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

    createBaitSlotUI(this);

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

        if (name) {
            showItemLabel(this, name);
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
            !isMenuOpen() && getClickedWorldTarget(pointer) ? 'pointer' : 'default'
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
            const tab = getMarketTabAt(pointer.x, pointer.y);

            if (tab !== -1) {
                setMarketPage(tab);
            } else if (row !== -1) {
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

            if (target) {
                openInteraction(this, target);
            } else if (isBaitSlotAt(pointer.x, pointer.y)) {
                cycleBait(this);
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

        if (isMenuOpen()) {
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
        const key = event.key.toLowerCase();

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


        if (key === 'i') {
            openInventory(this);
            return;
        }

        if (event.code === 'Space') {
            fishingActionHeld = true;
            beginCast(this.time.now);
            return;
        }

        if (key === 'm') {
            openMap(this);
            return;
        }

        if (key === 'b') {
            cycleBait(this);
            return;
        }

        if (CHEATS_ENABLED && key === 's') {
            spawnSturgeonAtCursor(this);
        }

        if (key === 'e') {
            openInteraction(this, getInteractionTarget(true));
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

    const list = value => Array.isArray(value) ? value : [];

    if (Number.isFinite(saved.coins) && saved.coins >= 0) {
        playerCoins = Math.floor(saved.coins);
        coinDisplay.value = playerCoins;
    }

    guideHasMetPlayer = saved.guideMet === true;

    const legacyRodIds = { sturdy: 'intermediate', iron: 'master' };

    for (const savedId of list(saved.rods)) {
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

    for (const [savedId, count] of list(saved.fish)) {
        const id = currentSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id) && Number.isInteger(count) && count > 0) {
            fishInventory.set(id, (fishInventory.get(id) || 0) + count);
        }
    }

    for (const savedId of list(saved.catchLog)) {
        const id = currentSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id)) catchLog.add(id);
    }

    for (const tileId of list(saved.explored)) {
        if (Number.isSafeInteger(tileId)) discoveredChunks.add(tileId);
    }

    for (const [id, count] of list(saved.bait)) {
        if (MARKET_BAITS_BY_ID.has(id) && Number.isInteger(count) && count > 0) baitInventory.set(id, count);
    }

    activeBaitId = baitInventory.has(saved.activeBait) ? saved.activeBait : null;

    for (const chestId of list(saved.chests)) {
        if (Number.isSafeInteger(chestId)) openedChests.add(chestId);
    }

    for (const chunk of loadedWaterChunks) {
        if (chunk.chest && openedChests.has(chunk.chest.id)) eraseChestSilhouette(chunk);
    }

    refreshBaitSlot();
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
            bait: [...baitInventory],
            activeBait: activeBaitId,
            chests: [...openedChests],
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

    if (!isMenuOpen()) {
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
    updateChestBubbles(this, time);
    updateBushRustle(this, time, isWalking);

    const guideReach = getGuideReach();
    const marketReach = getMarketReach();
    updateGuideInteraction(this, guideReach < 1);
    updateInteractionPrompt(this, guideReach, marketReach);

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
