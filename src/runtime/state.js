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
