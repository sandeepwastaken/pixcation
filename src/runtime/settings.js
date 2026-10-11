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
const DIALOGUE_PORTRAIT_Y = 13;

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

const CATCH_CARD_Y = 116;
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
const TREE_TONE_SHARES = [0.09, 0.42, 0.75, 0.97];
const TREE_DITHER_SHARE = 0.015;
const TREE_PAD_X = 14;
const TREE_PAD_TOP = 8;
const TREE_SHADOW_SHIFT = 7;
const TREE_SHADOW_DROP = 6;
const TREE_SHADOW_SQUASH = 0.5;
const TREE_SHADOW_DAPPLE = 0.03;
const TREE_SHADOW_EDGE_DAPPLE = 0.13;
const TREE_CONTACT_SHADOW_SPREAD = 3;
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

function loadWorldSeed() {
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
const NPC_ACCESSORIES = 4;
const NPC_HAIRSTYLES = 5;
const NPC_SHIRTS = 5;
const NPC_ACCESSORY_CHANCE = 0.35;
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
    [0x3e2620, 0x58372a, 0x744b38, 0x1e1412]
];
const NPC_HAIR_COLORS = [
    [0x1f1a1d, 0x2f282c, 0x463c40],
    [0x4a2e22, 0x6b4430, 0x8c5e40],
    [0x6b2f22, 0x8f4430, 0xb06040],
    [0xa07a3a, 0xc9a052, 0xe6c878],
    [0x6e6a6a, 0x969090, 0xbdb7b2],
    [0x9a4a20, 0xc0682c, 0xdc8c44]
];
const NPC_SHIRT_COLORS = [
    [0x505aa2, 0x6b88b8],
    [0x4a7a52, 0x6c955d],
    [0x8c3a3a, 0xb05050],
    [0xa07a30, 0xc9a04a],
    [0x2f6f6f, 0x4a9090],
    [0x5e4a7a, 0x7a669a],
    [0xb0a080, 0xd2c4a2]
];
const NPC_PANTS_COLORS = [
    [0x5c2525, 0x773333, 0x9a4444],
    [0x222840, 0x2e3550, 0x434c70],
    [0x3a2b1f, 0x4e3a2a, 0x6b5240],
    [0x363b25, 0x4a5032, 0x666e46],
    [0x36363c, 0x4a4a52, 0x66666e]
];
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
    [0x6e6a64, 0xa8a49c, 0xcdc9c0, 0xeceae4]
];
const NPC_PART_COLORS = {
    skin: [0xa40000, 0xd20000, 0xff0000, 0x660000],
    pants: [0x4a0067, 0xb700ff],
    accessory: [0x004a16, 0x00ac34, 0x00ff4d, 0x8affad],
    hair: [0xd07d00, 0xff9900, 0xffdeab],
    shirt: [0x00129e, 0x001eff]
};
const NPC_IDLE_LINES = [
    'Lovely day for a walk.', 'Have you met the guide yet?', 'I heard chests wash up in the deep.',
    'The flowers here change color by the patch.', 'Watch your step near the cliffs.', 'I could stay out here all day.',
    'The shop has better rods if you save up.', 'Fish bite more with good bait.', 'Bridges make the long way short.'
];
const NPC_FISHER_LINES = [
    'Shh, they are nibbling.', 'Caught a beauty this morning.', 'Patience is the whole trick.',
    'Deeper water, bigger fish.', 'Wait for the bobber to dip twice.', 'Nothing yet, but I have time.'
];
const NPC_CAST_REACH = 2;
const NPC_LINE_SAG = 5;
const NPC_SPEED_MIN = 0.65;
const NPC_SPEED_RANGE = 0.5;
const NPC_SPRINT_CHANCE = 0.35;
const NPC_ROAM_RADIUS = 6;
const NPC_TRADER_ROAM = 2;
const NPC_FISH_CHANCE = 0.55;
const NPC_PLAN_ATTEMPTS = 12;
const NPC_IDLE_MIN = 1500;
const NPC_IDLE_RANGE = 3500;
const NPC_STUCK_TIME = 600;
const NPC_AIM_MIN = 300;
const NPC_AIM_RANGE = 700;
const NPC_CAST_ERROR = 14;
const NPC_LURE_RADIUS = 48;
const NPC_LURE_TIME = 2500;
const NPC_LURE_DELAY = 1500;
const NPC_SCARE_RADIUS = 7;
const NPC_DISAPPOINT_TIME = 900;
const NPC_FISH_MIN = 5000;
const NPC_FISH_RANGE = 7000;
