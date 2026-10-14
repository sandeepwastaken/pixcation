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
const ITEM_LABEL_DURATION = 1300;

const CHUNK_SIZE = 16;
const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE;
const WOOD_MASK_MARGIN = TILE_SIZE;
const WOOD_MASK_SIZE = CHUNK_PIXEL_SIZE + WOOD_MASK_MARGIN;
const WOOD_SHADOW_OFFSET = 2;
const SHORE_DISTANCE_MARGIN_TILES = 2;
const SHORE_DISTANCE_MAX = 24;
const WATER_BASE_COLOR = [0x68, 0x90, 0xca];
const WATER_FOAM_OFFSETS = [[0, -1], [-1, 0], [1, 0]];
const WATER_BANK_OFFSETS = [[0, -1], [0, -2], [0, -3], [-1, -1], [-1, 0]];
const CHUNK_LOAD_RADIUS = 1;
const MIN_POND_TILES = 4;
const CHUNK_DISCOVERY_RADIUS = 2;
const DEFAULT_WORLD_SEED = 6767676767676;
const WORLD_SEED_KEY = 'pixcation-seed';
const WORLD_SEED = loadWorldSeed();
const WORLD_SEED_CODE = getRequestedWorldSeed() || String(WORLD_SEED);
const WORLD_HASH_MULTIPLIER = 1442695040888963407;
const WORLD_FEATURE_SCALE = 0.42;
const MIN_BRIDGE_WATER_LENGTH = 2;
const MAX_BRIDGE_WATER_LENGTH = 6;
const MIN_PIER_WATER_LENGTH = 4;
const MAX_PIER_WATER_LENGTH = 7;
const WORLD_CACHE_LIMIT = 50000;
const TILE_CACHE_CHUNK_LIMIT = 256;

const FISH_MAX_VISIBLE = 24;
const FISH_VIEW_MARGIN = 12;
const FISH_SIZE_CLASSES = {
    small: { label: 'Small', length: 6, radius: 1.5, difficulty: 0.15 },
    medium: { label: 'Medium', length: 10, radius: 2.4, difficulty: 0.48 },
    large: { label: 'Large', length: 14, radius: 3.4, difficulty: 0.78 },
    giant: { label: 'Monstrous', length: 42, radius: 10, difficulty: 1.65 }
};
const FISH_MIN_DEPTH = 3;
const FISH_PER_CHUNK_MAX = 9;
const FISH_WATER_PER_FISH = 3000;
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
const DIALOGUE_TYPE_DELAY = 24;
function getUiDuration(duration) { return Math.max(16, Math.round(duration / gamePreferences.uiSpeed)); }
const DIALOGUE_PORTRAIT_Y = 8;

const MAP_PANEL_HEIGHT = 156;
const MAP_WIDTH = 296;
const MAP_HEIGHT = 104;
const MAP_TOP = 36;
const MAP_HIDDEN_Y = -MAP_PANEL_HEIGHT;

const INVENTORY_HEIGHT = 142;
const INVENTORY_HIDDEN_Y = -INVENTORY_HEIGHT;
const FISHPEDIA_ROWS = 13;
const FISHPEDIA_LIST_X = 12;
const FISHPEDIA_LIST_Y = 22;
const FISHPEDIA_ROW_HEIGHT = 8;
const FISHPEDIA_COLUMN_WIDTH = 100;
const FISHPEDIA_DETAIL_X = 216;
const FISHPEDIA_DETAIL_WIDTH = 92;

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
const SHIMMER_TINT_STEPS = 12;
const FISHING_WATER_SHADOW_COLOR = 0x4770b0;

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

const CAST_MIN_DISTANCE = 16;
const CAST_METER_WIDTH = 14;
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

const SPLASH_LIFETIME = 300;
const CATCH_SPARKLES = 6;
const FISH_RISE_MIN = 1800;
const MOTE_INTERVAL = 260;
const MOTE_LIFETIME = 1800;
const MOTE_COLORS = [0xf6f5e5, 0xe1dc7a];
const FLOWER_PETAL_COLOR = 0xf6f5e5;
const PETAL_KICK_CHANCE = 0.6;
const PETAL_LIFETIME = 520;
const WOOD_DUST_CHANCE = 0.45;
const BOBBER_RIPPLE_INTERVAL = 1400;
const BOBBER_RIPPLE_LIFETIME = 420;
const BOBBER_RIPPLE_COLOR = 0x9bd2e1;
const WOOD_DUST_COLORS = [0xb88b61, 0xae7d57];
const FISH_RISE_RANGE = 2600;
const CATCH_SPARKLE_LIFETIME = 420;

const FISHING_LINE_COLOR = 0xf6f5e5;

const FISHING_GAME_X = 286;
const FISHING_GAME_Y = 34;
const FISHING_GAME_PROGRESS_WIDTH = 3;
const FISHING_GAME_PLAY_TOP = 5;
const FISHING_GAME_PLAY_HEIGHT = 91;

const CATCH_CARD_X = 60;
const CATCH_CARD_WIDTH = 200;
const CATCH_CARD_HEIGHT = 48;
const CATCH_CARD_Y = HOTBAR_Y - CATCH_CARD_HEIGHT - 4;
const CATCH_CARD_DURATION = 2400;

const BOBBER_TOP_COLOR = 0xb46044;
const BOBBER_BOTTOM_COLOR = 0xf6f5e5;

const LEAVES_PER_RUSTLE = 2;
const LEAF_LIFETIME = 420;
const LEAF_COLORS = [0x6c955d, 0x4a7a52];
const SEE_THROUGH_LEVEL = 8;
const SEE_THROUGH_STEP = 25;
const SEE_THROUGH_RANKS = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const TREE_LEAF_MIN = 4000;
const TREE_LEAF_RANGE = 6000;
const TREE_LEAF_LIFETIME = 1500;

const BUSH_FOOTPRINT_LEFT = 3;
const BUSH_FOOTPRINT_RIGHT = 29;
const BUSH_FOOTPRINT_HEIGHT = 12;
const BUSH_RUSTLE_PATTERN = [1, 0, -1, 0, 1, 0];
const BUSH_RUSTLE_STEP = 55;
const BUSH_RUSTLE_DURATION = BUSH_RUSTLE_PATTERN.length * BUSH_RUSTLE_STEP;
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
const TREE_BARE_CHANCE = 0.05;
const TREE_TONE_SHARES = [0.09, 0.42, 0.75, 0.97];
const TREE_DITHER_SHARE = 0.015;
const TREE_TRUNK_SHADES = [0.8, 0.88, 0.94, 1, 1.07];
const TREE_TRUNK_CURVES = [[0x553527, 0x674430, 0x75543c, 0x846549, 0x8e7352], [0x454643, 0x92978e, 0xc6cabe, 0xe0e4d8, 0xf2f1e4], [0x3d3834, 0x554e46, 0x716859, 0x8b826e, 0xa69c85], [0x343030, 0x47403d, 0x5b514c, 0x71635b, 0x87776b]];
const TREE_PAD_X = 14;
const TREE_PAD_TOP = 8;
const TREE_SHADOW_SHIFT = 7;
const TREE_SHADOW_DROP = 6;
const TREE_SHADOW_SQUASH = 0.5;
const TREE_SHADOW_DAPPLE = 0.03;
const TREE_SHADOW_EDGE_DAPPLE = 0.13;
const TREE_CONTACT_SHADOW_SPREAD = 3;
const TREE_LEAF_PALETTES = [
    { weight: 6, colors: [0x376451, 0x4a7a52, 0x6c955d, 0x8eb067, 0xb0c579], extras: [] },
    { weight: 2, colors: [0x3f5f3c, 0x587a45, 0x7a9a50, 0x9fb862, 0xc3d27e], extras: [] },
    { weight: 1, colors: [0x2c5348, 0x3a6a55, 0x4f8260, 0x6c9a6a, 0x8db47c], extras: [] },
    { weight: 1, colors: [0x7a4030, 0x9c5634, 0xbd7640, 0xd69a55, 0xe8bd72], extras: [] },
    { weight: 0.8, colors: [0x6b3a3a, 0x8c4a40, 0xae6249, 0xc9825a, 0xdea675], extras: [] },
    { weight: 0.6, colors: [0x8a5a6e, 0xab7085, 0xc98e9e, 0xe0aeb6, 0xf2cdcc], extras: [], trunk: 3 }
];

const DUST_PER_STEP = 3;
const DUST_LIFETIME = 330;
const DUST_COLORS = [0xa7825a, 0xb69a6c, 0x9f7751];
const GRASS_FLECK_COLORS = [0xb0c579, 0x8eb067];
const GRASS_FLECKS_PER_STEP = 2;

const MAP_PAN_SPEED = 90;
const MAP_MAX_ZOOM = 3;
const MAP_FOG_EDGE = 3;
const MAP_FOG_SALT = 9137;
const WATER_BIOME_SCALE = 600;
const WATER_BIOME_OFFSET = [WORLD_SEED % 997, Math.floor(WORLD_SEED / 997) % 991];
const WATER_TINTS = [[0.85, 1.05, 0.96], [1, 1, 1], [0.82, 0.93, 1]];
const FLOWER_COLORS = new Set([0xf6f5e5, 0xe1dc7a, 0xe69d66]);
const FLOWER_PATCH_SOURCE = 0xb46044;
const FLOWER_PATCH_SCALE = 10;
const FLOWER_PATCH_COLORS = [[180, 96, 68], [88, 118, 186], [146, 98, 176], [214, 118, 158]];
const DIRT_BIOME_SCALE = 50;
const DIRT_TINTS = [
    [0, 1.07, 0.98, 0.93],
    [0.5, 1, 1, 1],
    [1, 0.93, 0.95, 0.98]
];
const TREE_PALETTE_WEIGHTS = [
    [0, [1, 3, 0, 3, 2, 0]],
    [0.5, [6, 2, 1, 0.3, 0, 0]],
    [1, [3, 0.5, 4, 0, 0, 2]]
];
const GRASS_BIOME_SCALE = 50;
const GRASS_BIOME_CONTRAST = 1.9;
const GRASS_TINTS = [
    [0, 1.1, 0.98, 1.03],
    [0.28, 1.05, 1.01, 1.02],
    [0.5, 1, 1, 1],
    [0.76, 0.88, 0.98, 0.97],
    [1, 0.75, 0.92, 0.94]
];
const MAP_TREE_SHAPE = [
    [3, 0, 1, 'canopy'],
    [2, -1, 2, 'canopy'],
    [1, -1, 2, 'under'],
    [0, 2, 3, 'shadow'],
    [-1, 0, 3, 'shadow']
];

const CAMERA_EASE = 2;

const PROMPT_SLIDE = 4;

function isValidWorldSeed(value) {
    if (!/^[1-9][0-9]{0,86}$/.test(value)) return false;
    const seed = BigInt(value);
    return seed < (1n << 288n) && (seed <= BigInt(Number.MAX_SAFE_INTEGER) || (seed & 0xffffffffn) !== 0n);
}

function getRequestedWorldSeed() {
    if (typeof window === 'undefined' || !window.location?.search) return null;
    const value = new URLSearchParams(window.location.search).get('seed');
    if (!value || !isValidWorldSeed(value)) return null;
    const seed = BigInt(value);
    return seed < (1n << 288n) && (seed <= BigInt(Number.MAX_SAFE_INTEGER) || (seed & 0xffffffffn) !== 0n) ? value : null;
}

function loadWorldSeed() {
    const requested = getRequestedWorldSeed();
    if (requested) return BigInt(requested) > BigInt(Number.MAX_SAFE_INTEGER) ? Number(BigInt(requested) & 0xffffffffn) : Number(requested);
    try {
        if (TEST_MODE) return DEFAULT_WORLD_SEED;
        const saved = Number(localStorage.getItem(WORLD_SEED_KEY));
        if (Number.isSafeInteger(saved) && saved > 0) return saved;
        const seed = localStorage.getItem(SAVE_KEY) === null ? 1 + Math.floor(Math.random() * 2147483646) : DEFAULT_WORLD_SEED;
        localStorage.setItem(WORLD_SEED_KEY, String(seed));
        return seed;
    } catch (error) {
        return DEFAULT_WORLD_SEED;
    }
}

const NPC_PART_SIZE = 16;
const NPC_FACES = 3;
const NPC_CANINE_CHANCE = [0.05, 0.08, 0];
const NPC_MAKEUP_CHANCE = [0.3, 0.08, 0];
const NPC_FACE_WEIGHTS = [65, 25, 10];
const NPC_ACCESSORIES = 10;
const NPC_STYLE_WEIGHTS = {
    hair: {male: [38, 28, 0, 1, 7, 6, 5, 0, 3, 27, 0, 0, 0], youngMale: [40, 30, 0, 0, 0, 8, 3, 0, 4, 29, 0, 0, 0], olderMale: [34, 24, 0, 2, 27, 0, 15, 0, 0, 18, 0, 0, 0], female: [22, 0, 18, 0, 0, 0, 0, 22, 2, 14, 28, 32, 28], youngFemale: [25, 0, 34, 0, 0, 0, 0, 18, 4, 14, 0, 0, 0], olderFemale: [48, 0, 20, 0, 0, 0, 0, 30, 0, 2, 0, 0, 0]},
    shirt: {male: [12, 0, 10, 0, 16, 0, 9, 22, 5, 24, 16, 2, 0, 14, 6, 0, 0, 16, 0], female: [8, 8, 7, 1, 12, 28, 8, 18, 4, 18, 28, 5, 26, 8, 16, 12, 16, 5, 16], youngMale: [16, 0, 12, 0, 14, 0, 12, 18, 5, 26, 24, 0, 0, 6, 0, 0, 0, 20, 0], youngFemale: [16, 0, 8, 0, 12, 0, 12, 18, 4, 24, 34, 0, 4, 6, 0, 2, 0, 4, 0], olderMale: [14, 0, 20, 0, 32, 0, 4, 18, 4, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0], olderFemale: [16, 0, 20, 0, 28, 0, 5, 18, 4, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0]},
    vanity: {male: [36, 28, 22, 0, 0, 0, 10, 4, 8, 0], female: [32, 24, 0, 26, 14, 0, 2, 2, 18, 16], youngMale: [48, 32, 16, 0, 0, 0, 0, 4, 0, 0], youngFemale: [40, 27, 0, 18, 9, 0, 0, 6, 0, 0], olderMale: [20, 26, 36, 0, 0, 0, 18, 0, 0, 0], olderFemale: [18, 22, 0, 42, 18, 0, 0, 0, 0, 0]},
    pants: {male: [56, 0, 30, 10, 4], female: [42, 22, 24, 8, 4], youngMale: [45, 0, 25, 20, 10], youngFemale: [35, 20, 20, 15, 10], olderMale: [60, 0, 35, 5, 0], olderFemale: [65, 0, 30, 5, 0]}
};
const NPC_HAIRSTYLES = 13;
const NPC_AGE_HAIR_COLOR_WEIGHTS = {young: [40, 32, 9, 11, 1, 6, 1], older: [24, 24, 6, 10, 30, 5, 1]};
const NPC_SHIRTS = 19;
const NPC_EXTRAS = 2, NPC_EXTRA_START_Y = 24;
const NPC_EXTRA_WEIGHTS = [[75, 25, 0], [85, 15, 0], [50, 0, 50]];
const NPC_EXTRA_COLORS = [[0x141820, 0x303640], [0x332219, 0x634734], [0x725326, 0xa98b4d], [0x667078, 0xaeb6bf], [0x172338, 0x354b68], [0x472430, 0x754553], [0x35402d, 0x687052], [0xa99d87, 0xe2d4b6]];
const NPC_EXTRA_COLOR_WEIGHTS = [45, 14, 8, 12, 8, 7, 4, 2];
const NPC_ACCESSORY_CHANCE = 0.25;
const NPC_RARE_VANITY_CHANCE = 0.0001, NPC_PASTEL_SKIN_CHANCE = 0.01, NPC_PANTS_STYLES = 5;
const NPC_EYE_COLORS = [0x191820, 0x633d2b, 0x46758b, 0x527349, 0x77794a, 0xadcddd, 0xb18c53], NPC_EYE_WEIGHTS = [0.64, 0.16, 0.07, 0.06, 0.04, 0.02, 0.01];
const NPC_EYE_PALETTES = NPC_EYE_COLORS.map(color => [color]), NPC_EYE_TRAITS = ['Normal', 'Heterochromia', 'Blind'], NPC_BLIND_EYE_COLOR = 0xd8d9d2;
const NPC_APPEARANCE_RADICES = [10000, 100, 65536, 65536, 100, 720, 100, 100, 100, 143, 120, 100, 100, 2, 100, 20, 100, 100, 2, 65536, 5, 65536, 10000, 4294967296, 100];
const NPC_WORLD_FAMILY_INTERVAL = 1048576n, NPC_WORLD_FAMILY_MARK = 335674n, NPC_WORLD_COUNT_RADIX = 128n;
const NPC_CELL_SIZE = 10;
const NPC_CELL_MARGIN = 2;
const NPC_CELL_CHANCE = 0.45;
const NPC_FISHER_CHANCE = 0.5;
const NPC_TRADER_CHANCE = 0.4;
const NPC_SPAWN_CLEARANCE = 10;
const NPC_TALK_DISTANCE_SQUARED = 24 * 24;
const NPC_TRADE_PERIOD = 60 * 60 * 1000;
const NPC_SKIN_TONES = [
    [0x83645a, 0x9d856f, 0xb5a58b, 0x443c38],
    [0xb07a62, 0xd3a383, 0xe8c4a0, 0x4a3530],
    [0x8c5a3c, 0xb07a52, 0xc99a6c, 0x3a2620],
    [0x5e3a2a, 0x7d4f37, 0x9a6a4a, 0x2a1a16],
    [0x3e2620, 0x58372a, 0x744b38, 0x1e1412],
    [0x6c447f, 0x9f6bc1, 0xc49ae4, 0x422653], [0x4d719b, 0x81a3c9, 0xb4d5ee, 0x304960], [0x557d55, 0x86b585, 0xc2e2bc, 0x304c30], [0x8f5478, 0xc589a8, 0xeebed4, 0x583042]
];
const NPC_HAIR_COLORS = [
    [0x1f1a1d, 0x2f282c, 0x463c40],
    [0x4a2e22, 0x6b4430, 0x8c5e40],
    [0x6b2f22, 0x8f4430, 0xb06040],
    [0xa07a3a, 0xc9a052, 0xe6c878],
    [0x6e6a6a, 0x969090, 0xbdb7b2],
    [0x9a4a20, 0xc0682c, 0xdc8c44],
    [0x590c85, 0x9215c9, 0xcf3bed]
];
const NPC_SHIRT_COLORS = [
    [0x505aa2, 0x6b88b8],
    [0x4a7a52, 0x6c955d],
    [0x8c3a3a, 0xb05050],
    [0xa07a30, 0xc9a04a],
    [0x2f6f6f, 0x4a9090],
    [0x5e4a7a, 0x7a669a],
    [0xb0a080, 0xd2c4a2],
    [0xb51f70, 0xf63f9b], [0x392348, 0x624078],
    [0x12151b, 0x242832], [0xb8b6b0, 0xf2f0e8], [0x464b53, 0x747b85], [0x15283d, 0x294765], [0x493325, 0x79533c], [0x8b493e, 0xc37b66], [0x76939d, 0xb3d5df]
];
const NPC_PANTS_COLORS = [
    [0x5c2525, 0x773333, 0x9a4444],
    [0x222840, 0x2e3550, 0x434c70],
    [0x3a2b1f, 0x4e3a2a, 0x6b5240],
    [0x363b25, 0x4a5032, 0x666e46],
    [0x36363c, 0x4a4a52, 0x66666e],
    [0x9b7965, 0xc9a48e, 0xecd0b8], [0x261334, 0x3f1d54, 0x623580]
];
const NPC_HAIR_COLOR_WEIGHTS = [36, 31, 10, 12, 5, 5, 1], NPC_SHIRT_COLOR_WEIGHTS = [14, 10, 9, 3, 8, 5, 9, 1, 3, 10, 8, 6, 9, 3, 1, 1], NPC_PANTS_COLOR_WEIGHTS = [4, 34, 20, 9, 23, 7, 3], NPC_HEADWEAR_COLOR_WEIGHTS = [10, 18, 10, 8, 14, 8, 12, 7, 3, 2, 3, 2, 3];
const NPC_SHIRT_ACCENT_NEUTRALS = [11, 6, 10, 6, 11, 11, 10, 10, 11, 11, 11, 11, 11, 6, 6, 10];
const PLAYER_LOOK = [0, 0, 0, 0, 0, 1, 0, 0];
const PERSON_ARM_TOP = 8;
const PERSON_ARM_BOTTOM = 13;
const PERSON_FOREARM_TOP = 11;
const PERSON_HAND_ROW = 12;
const PERSON_LEG_TOP = 13;
const PERSON_LEFT_ARM = [3, 4];
const PERSON_RIGHT_ARM = [11, 12];
const PERSON_LEFT_LEG = [5, 6, 7];
const PERSON_RIGHT_LEG = [8, 9, 10];
const PERSON_INNER_LEG_COLUMNS = [7, 8];
const NPC_ACCESSORY_COLORS = [
    [0x3f1919, 0x5c2525, 0x773333, 0x9a4444],
    [0x1c2340, 0x2e3a66, 0x43558a, 0x6276ab],
    [0x1e3320, 0x2f4f33, 0x426b46, 0x5e8c60],
    [0x5a4420, 0x8a6a34, 0xb08c48, 0xd2b06a],
    [0x6e6a64, 0xa8a49c, 0xcdc9c0, 0xeceae4],
    [0x9b7965, 0xc2a08a, 0xdfc0aa, 0xf4ddca],
    [0x0c0e14, 0x20232d, 0x393f4b, 0x626b79],
    [0x757f91, 0xaeb8c8, 0xdce3ef, 0xffffff],
    [0x30203e, 0x563468, 0x805393, 0xb58fc2],
    [0x642e42, 0xa65376, 0xd787a5, 0xf2bad0],
    [0x183839, 0x2d6766, 0x4c9391, 0x90c4bd],
    [0x69351c, 0xa65c2b, 0xd38b48, 0xefbe7d],
    [0x32231e, 0x5b4133, 0x876650, 0xb49877]
];
const NPC_PART_COLORS = {
    shirtAccent: [0x00d9ff], pantsAccent: [0xdf8fff],
    skin: [0xa40000, 0xd20000, 0xff0000, 0x660000],
    pants: [0x4a0067, 0xb700ff],
    accessory: [0x004a16, 0x00ac34, 0x00ff4d, 0x8affad],
    hair: [0xd07d00, 0xff9900, 0xffdeab],
    shirt: [0x00129e, 0x001eff]
};
const NPC_CAST_REACH = 2;
const NPC_SPEED_MIN = 0.4;
const NPC_SPEED_RANGE = 0.65;
const NPC_OLDER_SPEED_MIN = 0.35, NPC_OLDER_SPEED_RANGE = 0.2;
const NPC_ROAM_RADIUS = 4;
const NPC_TRADER_ROAM = 2;
const NPC_FISH_CHANCE = 0.55;
const NPC_PLAN_ATTEMPTS = 12;
const NPC_IDLE_MIN = 3000;
const NPC_IDLE_RANGE = 5000;
const NPC_CHAT_DISTANCE_MIN = 12;
const NPC_SOCIAL_APPROACH_TIME = 12000;
const NPC_HOME_EXIT_RETRY = 750;
const NPC_BLOCKED_PLAN_WAIT = 6000;
const NPC_BLOCKED_PLAN_RETRY = 750;
const NPC_STUCK_TIME = 600;
const NPC_AIM_MIN = 300;
const NPC_AIM_RANGE = 700;
const NPC_CAST_ERROR = 30;
const NPC_LURE_RADIUS = 48;
const NPC_LURE_TIME = 2500;
const NPC_LURE_DELAY = 1500;
const NPC_SCARE_RADIUS = 7;
const NPC_DISAPPOINT_TIME = 900;
const NPC_FISH_MIN = 5000;
const NPC_FISH_RANGE = 7000;
const NPC_PORTRAIT_SCALE = 1;
const NPC_HASTY_CHANCE = 0.4;
const NPC_SPRINT_DISTANCE = 8;
const NPC_MEMORY_LIMIT = 200;
const NPC_FAILED_SPOT_LIMIT = 16;
const NPC_PATH_LIMIT = 500;
const NPC_RETRY_DELAY = 900;
const NPC_MAX_NIBBLES = 3;
const NPC_LOOK_MIN = 2200;
const NPC_LOOK_RANGE = 5000;
const NPC_POWER_ERROR = 0.3;
const DAY_LENGTH_MINUTES = 24;
const RAIN_DEPTH = 40;
const SKY_DEPTH = 50;
const SKY_LIGHT_STOPS = [
    [0, 0.42, 0.47, 0.72],
    [5, 0.42, 0.47, 0.72],
    [6.5, 0.96, 0.8, 0.76],
    [8, 1, 1, 1],
    [17.5, 1, 1, 1],
    [19, 1, 0.82, 0.66],
    [20.5, 0.42, 0.47, 0.72],
    [24, 0.42, 0.47, 0.72]
];
const RAIN_CHANCE = 0.35;
const RAIN_EARLIEST_HOUR = 8;
const RAIN_LATEST_START_HOUR = 14;
const RAIN_LATEST_END_HOUR = 18;
const RAIN_MIN_HOURS = 1.5;
const RAIN_HOUR_RANGE = 2.5;
const RAIN_FADE_HOURS = 0.35;
const RAIN_DIM = 0.16;
const RAIN_DROPS_PER_SECOND = 200;
const RAIN_SPEED = 230;
const RAIN_DRIFT = 40;
const RAIN_FALL_MIN = 40;
const RAIN_FALL_RANGE = 70;
const RAIN_STREAK = 3;
const RAIN_ALPHA = 0.7;
const RAIN_COLOR = 0xc8dcf0;
const RAIN_RIPPLE_COLOR = 0x9bd2e1;
const RAIN_RIPPLE_LIFETIME = 240;
const RAIN_FLECK_LIFETIME = 150;
const RAIN_NEAR_SHARE = 0.3;
const RAIN_NEAR_STREAK = 6;
const RAIN_FAR_ALPHA = 0.55;
const RAIN_GUST = 0.6;
const RAIN_GUST_RATE = 0.0004;
const RAIN_COOL = 0.05;
const STORM_CHANCE = 0.5;
const STORM_RAIN = 1.8;
const STORM_WIND = 60;
const STORM_GUST = 75;
const STORM_GUST_RATE = 0.0009;
const STORM_TREE_WIND = 1.8;
const SNOW_CHANCE = 0.3;
const SNOW_FLAKES_PER_SECOND = 70;
const SNOW_NEAR_SHARE = 0.25;
const SNOW_FALL_SPEED = 20;
const SNOW_NEAR_SPEED = 32;
const SNOW_HEIGHT_MIN = 40;
const SNOW_HEIGHT_RANGE = 80;
const SNOW_MARGIN = 32;
const SNOW_WIND = 8;
const SNOW_SWAY = 14;
const SNOW_SWAY_RATE = 0.0024;
const SNOW_SETTLE = 1200;
const SNOW_CAMERA_HEIGHT = 160;
const SNOW_COLOR = 0xf4f8ff;
const SNOW_TINT = 0xdce8f6;
const LIGHTNING_PER_SECOND = 0.08;
const LIGHTNING_TIME = 520;
const LIGHTNING_ALPHA = 0.35;
const FIREFLY_COUNT = 12;
const FIREFLY_MARGIN = 24;
const FIREFLY_WATER_TILES = 3;
const FIREFLY_DARK_LEVEL = 0.4;
const FIREFLY_MIN_HEIGHT = 4;
const FIREFLY_HEIGHT_RANGE = 26;
const FIREFLY_BOB = 4;
const FIREFLY_MAX_HEIGHT = 34;
const FIREFLY_NEAR_HEIGHT = 24;
const FIREFLY_CAMERA_HEIGHT = 160;
const FIREFLY_SPEED = 9;
const FIREFLY_TURN = 2.4;
const FIREFLY_TURN_RATE = 0.0011;
const FIREFLY_BOB_RATE = 0.0017;
const FIREFLY_PULSE_RATE = 0.0021;
const FIREFLY_BASE_GLOW = 0.08;
const FIREFLY_FADE = 900;
const FIREFLY_LIFE_MIN = 6000;
const FIREFLY_LIFE_RANGE = 9000;
const FIREFLY_CORE_COLOR = 0xfff3a6;
const FIREFLY_HALO_COLOR = 0xb8d65a;
const FIREFLY_HALO_ALPHA = 0.6;
const FIREFLY_POOL_COLOR = 0x8fae4a;
const FIREFLY_POOL_ALPHA = 0.35;
const RUMOR_CELL_CHUNKS = 5;
const RUMOR_ATTEMPTS = 4;
const RUMOR_NEAR_TILES = 40;
const RUMOR_FAR_TILES = 100;
const RUMOR_SPAWN_CHANCE = 0.12;
const RUMOR_GIANT_SPAWN_CHANCE = 0.05;
const RUMOR_MAP_COLOR = 0xe8c170;
const FISH_JUMP_MIN = 5000;
const FISH_JUMP_RANGE = 9000;
const FISH_JUMP_DISTANCE = 10;
const FISH_JUMP_HEIGHT = 7;
const FISH_JUMP_TIME = 620;
const FISH_JUMP_RUMOR_WEIGHT = 3;
const FISH_JUMP_DROPLETS = 3;
const FISH_JUMP_DROPLET_LIFETIME = 260;
const FISH_JUMP_DROPLET_COLOR = 0xbce6eb;
const NPC_DRAW_MARGIN = 128;
const HOUSE_WIDTH = 48;
const HOUSE_HEIGHT = 32;
const INTERIOR_DEPTH = 55;
const INTERIOR_COUCH_SHADES = [0x802c29, 0x943531, 0xa83e39, 0xc2513d, 0xdd6641, 0xe5854d, 0xeca259];
const INTERIOR_RUG_SLOTS = [0xff1100, 0x00ff1a, 0x0048ff, 0xfff600];
const INTERIOR_COUCH_PALETTES = [
    [0x802c29, 0x943531, 0xa83e39, 0xc2513d, 0xdd6641, 0xe5854d, 0xeca259],
    [0x1f2a5c, 0x26346e, 0x2f4183, 0x3a549c, 0x4a6bb8, 0x6286c9, 0x86a5d8],
    [0x174a4a, 0x1d5a58, 0x236b67, 0x2c827a, 0x3a9c90, 0x56b3a4, 0x80c9b8],
    [0x24401f, 0x2c4e25, 0x355d2c, 0x427336, 0x528a40, 0x6ca255, 0x92bb72],
    [0x464420, 0x555226, 0x64602c, 0x7a7536, 0x928c42, 0xa8a258, 0xc0bb7c],
    [0x7a5418, 0x8e631c, 0xa27321, 0xbc8a2a, 0xd4a336, 0xdfb850, 0xe8cd7a],
    [0x3e2360, 0x4a2b72, 0x573486, 0x6a43a0, 0x8156b8, 0x9a73c9, 0xb898da],
    [0x5a1e3c, 0x6a2547, 0x7b2c53, 0x933866, 0xab477b, 0xbf6593, 0xd38db0],
    [0x9a3c5c, 0xae4868, 0xc25675, 0xd66b88, 0xe5849c, 0xeda0b3, 0xf3bfcd],
    [0x3c3c42, 0x48484f, 0x55555d, 0x686871, 0x7e7e87, 0x96969e, 0xb3b3b9],
    [0x1e1e24, 0x26262d, 0x2f2f37, 0x3b3b44, 0x4a4a54, 0x5e5e69, 0x787883],
    [0x9c8a6a, 0xae9c7a, 0xc0ae8b, 0xd3c29f, 0xe2d4b4, 0xece2c8, 0xf5eedc],
    [0x4a2c1c, 0x583421, 0x673e27, 0x7c4d30, 0x94603b, 0xab774d, 0xc39466],
    [0x3d6a96, 0x467aa7, 0x5089b8, 0x5f9ecb, 0x74b4dc, 0x92c8e6, 0xb6dcef],
    [0x3f7a62, 0x488b6f, 0x529c7d, 0x63b18f, 0x79c6a3, 0x98d6b9, 0xbde5d1],
    [0x6a5a8c, 0x77679c, 0x8575ad, 0x9888c2, 0xad9ed4, 0xc2b5e0, 0xd9cfec]
];
const MYSTERY_CYCLE_MINUTES = 20;
const MYSTERY_FORECAST_CYCLES = 3;
const MYSTERY_CATCH_CHANCE = 0.85;
const MYSTERY_GIANT_WEIGHT = 0.6;
const MYSTERY_SIZE_WEIGHTS = { small: 1.4, medium: 1, large: 0.55 };
const MYSTERY_PLACEHOLDER_COLORS = [0x0026ff, 0x1f5aff, 0x3e8eff];
const MYSTERY_SHADES = [[0.6, 0.5], [0.52, 0.68], [0.42, 0.84]];
const DEAL_ROD_CHANCE = 0.4;
const DEAL_MYSTERY_CHANCE = 0.05;
const DEAL_DISCOUNT_MIN = 0.1;
const DEAL_DISCOUNT_RANGE = 0.15;
const DEAL_BUNDLE_MIN = 3;
const DEAL_BUNDLE_RANGE = 10;
