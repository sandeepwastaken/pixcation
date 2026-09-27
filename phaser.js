const APP_CACHE_BUSTER = Date.now();

const withCacheBuster = (path) => `${path}?v=${APP_CACHE_BUSTER}`;

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
                #ifdef GL_FRAGMENT_PRECISION_HIGH
                precision highp float;
                #else
                precision mediump float;
                #endif

                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform vec2 uScroll;
                uniform float uViewHeight;
                varying vec2 outTexCoord;
                varying vec4 outTint;

                float hash(vec2 p) {
                    p = mod(p, 289.0);
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                float noise(vec2 x) {
                    vec2 i = floor(x);
                    vec2 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                        f.y
                    );
                }

                float fbm(vec2 x) {
                    vec2 r = mat2(0.8, -0.6, 0.6, 0.8) * x;
                    return noise(r) * 0.65 + noise(mat2(0.8, 0.6, -0.6, 0.8) * x * 2.03 + vec2(7.3, 2.9)) * 0.35;
                }

                vec3 tone(float index) {
                    if (index < 0.5) return vec3(0.302, 0.420, 0.631);
                    if (index < 1.5) return vec3(0.345, 0.478, 0.686);
                    if (index < 2.5) return vec3(0.376, 0.522, 0.741);
                    if (index < 3.5) return vec3(0.408, 0.565, 0.792);
                    if (index < 4.5) return vec3(0.424, 0.608, 0.804);
                    if (index < 5.5) return vec3(0.447, 0.659, 0.812);
                    if (index < 6.5) return vec3(0.482, 0.706, 0.820);
                    if (index < 7.5) return vec3(0.529, 0.745, 0.847);
                    return vec3(0.820, 0.929, 0.945);
                }

                float code(float channel) {
                    return floor(channel * 255.0 + 0.5);
                }

                float caustic(vec2 p) {
                    return mod(code(texture2D(uMainSampler, (mod(p, 32.0) + 0.5) / 256.0).g), 3.0) * 0.5;
                }

                void main() {
                    vec4 mask = texture2D(uMainSampler, outTexCoord);

                    if (mask.r < 0.25) {
                        discard;
                    }

                    vec2 p = floor(vec2(gl_FragCoord.x, uViewHeight - gl_FragCoord.y)) + uScroll;
                    float t = uTime;
                    float checker = mod(p.x + p.y, 2.0) - 0.5;
                    float bayerX = mod(p.x, 2.0);
                    float bayerY = mod(p.y, 2.0);
                    float bayer = (bayerX < 0.5 ? (bayerY < 0.5 ? 0.0 : 3.0) : (bayerY < 0.5 ? 2.0 : 1.0)) / 3.0 - 0.5;

                    vec2 swell = p * 0.011 + vec2(t * 0.045, -t * 0.03);
                    vec2 warp = vec2(noise(swell), noise(swell + vec2(31.7, 11.3))) - 0.5;
                    float strength = 4.0 + 12.0 * noise(p * 0.007 + vec2(-t * 0.025, t * 0.02));
                    vec2 rippleField = p * 0.06 + vec2(t * 0.4, t * 0.27);
                    vec2 ripple = vec2(noise(rippleField), noise(rippleField + vec2(5.2, 1.3))) - 0.5;
                    vec2 offset = warp * strength + ripple * 3.0;

                    float shore = floor(code(mask.g) / 3.0);
                    float wobble = (fbm(p * 0.045 + warp * 0.6 + vec2(t * 0.05, -t * 0.04)) - 0.5) * 4.0;
                    float reach = shore + wobble + bayer * 2.2;
                    float depth = fbm(p * 0.012 + warp * 1.2 + vec2(t * 0.03, t * 0.01)) + bayer * 0.05 -
                        max(0.0, shore - 15.0) * 0.012;
                    float light = fbm(p * 0.021 - warp * 0.9 + vec2(-t * 0.06, t * 0.04)) + checker * 0.016;

                    float index = 3.0;

                    if (reach < 1.5) {
                        index = 7.0;
                    } else if (reach < 4.5) {
                        index = 6.0;
                    } else if (reach < 9.0) {
                        index = 5.0;
                    } else if (reach < 15.0) {
                        index = 4.0;
                    } else if (depth < 0.34) {
                        index = 1.0;
                    } else if (depth < 0.44) {
                        index = 2.0;
                    }

                    float first = caustic(floor(p + offset + vec2(t * 4.0, t * 1.6) + 0.5));
                    float second = caustic(floor(p * 0.75 - offset * 0.8 + vec2(-t * 2.6, t * 3.1) + 0.5) + vec2(13.0, 7.0));
                    float gate = light + max(0.0, 12.0 - shore) / 12.0 * 0.08;

                    if (first > 0.9 && second > 0.9 && gate > 0.68) {
                        index = 8.0;
                    } else if (first > 0.9 && second > 0.9 && gate > 0.6) {
                        index = 7.0;
                    } else if (first > 0.9 && gate > 0.56) {
                        index = min(index + (gate > 0.63 ? 2.0 : 1.0), 7.0);
                    } else if (first > 0.4 && gate > 0.64) {
                        index = min(index + 1.0, 7.0);
                    }

                    float edgeCode = code(mask.b);

                    if (mask.r < 0.75) {
                        index = max(index - 1.0, 0.0);
                    }

                    if (edgeCode > 250.0) {
                        float frame = floor(t * 12.0);
                        float edge = noise(vec2(p.x - frame, p.y + frame * 0.25) / 24.0 + vec2(41.0, 17.0));

                        if (edge >= 0.58 || edge >= 0.39 && edge < 0.42) {
                            index = 8.0;
                        } else if (edge >= 0.46) {
                            index = 7.0;
                        }
                    }

                    gl_FragColor = vec4(tone(index), 1.0);
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
let horizontalPriority = 0;
let lastMenuWheelTime = -Infinity;
let verticalPriority = 0;

const CHARACTER_SIZE = 16;
const CHARACTER_SPEED = 60;
const CHARACTER_ANIMATION_SPEED = 8;
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
const MAP_WIDTH = 296;
const MAP_HEIGHT = 144;
const MAP_HIDDEN_Y = -160;

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
const MARKET_ROW_HEIGHT = 24;
const MARKET_DETAIL_X = 178;
const MARKET_DETAIL_WIDTH = 130;
const MARKET_FOOTER_Y = 126;
const PROMPT_Y = HOTBAR_Y - 25;

const MARKET_RODS = [
    { id: 'basic', label: 'Basic Rod', price: 10 },
    { id: 'sturdy', label: 'Sturdy Rod', price: 25 },
    { id: 'iron', label: 'Iron Rod', price: 50 }
];
const MARKET_ROW_COUNT = MARKET_RODS.length + 1;

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
        text: "Walk with WASD or the arrows. E talks or shops, M opens your map. Scroll or 1-9 picks items.",
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
const dustPool = [];
const BUSH_FOOTPRINT_LEFT = 3;
const BUSH_FOOTPRINT_RIGHT = 29;
const BUSH_FOOTPRINT_HEIGHT = 12;
const BUSH_RUSTLE_PATTERN = [1, 0, -1, 0, 1, 0];
const BUSH_RUSTLE_STEP = 55;
const BUSH_RUSTLE_REPEAT = 420;
const DUST_PER_STEP = 3;
const DUST_LIFETIME = 330;
const DUST_COLORS = [0xa7825a, 0xb69a6c, 0x9f7751];
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
let mapPalette = null;
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
const ownedRods = new Set();

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
    this.load.spritesheet('shimmer', withCacheBuster('media/shimmer.png'), {
        frameWidth: 12,
        frameHeight: 1
    });
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

    this.anims.create({
        key: 'shimmer',
        frames: this.anims.generateFrameNumbers('shimmer', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
    });

    createCharacterShadow(this);

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
        }
    });

    this.input.on('pointerdown', pointer => {
        if (marketOpen) {
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
        } else if (mapOpen) {
            closeMap(this);
        }
    });

    this.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        const step = Math.sign(deltaY);

        if (!step) return;

        if (marketOpen || dialogueOpen) {
            if (pointer.event.timeStamp - lastMenuWheelTime < 120) return;
            lastMenuWheelTime = pointer.event.timeStamp;
        }

        if (marketOpen) {
            moveMarketSelection(step);
        } else if (dialogueOpen) {
            moveGuideDialogueSelection(step);
        } else if (!mapOpen) {
            selectHotBarSlot(selectedHotbarSlot + step);
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

        if (mapOpen) {
            handleMapKey(this, event);
            return;
        }

        if (marketOpen) {
            handleMarketKey(this, event);
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

    updateLoadedChunks(this, true);

    spawnGuideAndStore(this);

    for (const key of [...loadedChunks.keys()]) {
        destroyWorldChunk(key);
    }

    updateLoadedChunks(this, true);
    createGuideDialogueUI(this);
    createMapUI(this);
    createMarketUI(this);
    createInteractionPromptUI(this);

    for (let index = 0; index < 20; index++) {
        spawnShimmer(this);
    }

    this.time.addEvent({
        delay: 225,
        callback: () => spawnShimmer(this),
        loop: true
    });
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

    if (!isLocalHashPeak(
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
    const context = canvas.getContext('2d');
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

function acquireChunkCanvas(scene) {
    const texture = chunkCanvasPool.pop() || scene.textures.createCanvas(
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

    for (let offsetY = -CHUNK_DISCOVERY_RADIUS; offsetY <= CHUNK_DISCOVERY_RADIUS; offsetY++) {
        for (let offsetX = -CHUNK_DISCOVERY_RADIUS; offsetX <= CHUNK_DISCOVERY_RADIUS; offsetX++) {
            discoveredChunks.add(getTileId(
                centerChunkX + offsetX,
                centerChunkY + offsetY
            ));
        }
    }

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
    if (loadedShimmerChunks.size === 0) {
        return;
    }

    let pick = Math.floor(Math.random() * loadedShimmerChunks.size);
    let chunk;

    for (chunk of loadedShimmerChunks) {
        if (pick-- === 0) break;
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

    if (getTerrainType(tileX, tileY) !== 'dirt' || tile.key.startsWith('wood')) {
        return;
    }

    for (let index = 0; index < DUST_PER_STEP; index++) {
        const image = dustPool.find(dust => !dust.active) || createDust(scene);
        const side = index % 2 === 0 ? -1 : 1;
        const spread = Math.floor(Math.random() * 2);
        const offsetX = moveX !== 0
            ? -moveX * (5 + spread + index)
            : side * (5 + spread);
        const offsetY = moveY < 0
            ? 1 + spread
            : moveX !== 0 ? -spread : -1 - spread;

        image.dust = {
            born: time,
            x: Math.round(footX + offsetX),
            y: footY + offsetY,
            drift: moveX !== 0 ? -moveX : side
        };

        image
            .setTint(DUST_COLORS[index % DUST_COLORS.length])
            .setPosition(image.dust.x, image.dust.y)
            .setActive(true)
            .setVisible(true);
    }
}

function createDust(scene) {
    const image = scene.add.image(0, 0, '__WHITE')
        .setOrigin(0)
        .setDisplaySize(1, 1)
        .setActive(false)
        .setVisible(false);

    shadowLayer.add(image);
    dustPool.push(image);
    return image;
}

function updateDust(time) {
    for (const image of dustPool) {
        if (!image.active) continue;

        const age = time - image.dust.born;

        if (age >= DUST_LIFETIME) {
            image.setActive(false).setVisible(false);
            continue;
        }

        const step = Math.floor(age / (DUST_LIFETIME / 3));
        image.setPosition(image.dust.x + (step > 1 ? image.dust.drift : 0), image.dust.y - step);
    }
}

function updateBushRustle(time, isWalking) {
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
    const originX = playerTileX - Math.floor(MAP_WIDTH / 2);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / 2);

    const plot = (x, y, color) => {
        if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;

        const index = (y * MAP_WIDTH + x) * 4;
        pixels[index] = (color >> 16) & 255;
        pixels[index + 1] = (color >> 8) & 255;
        pixels[index + 2] = color & 255;
        pixels[index + 3] = 255;
    };

    const marker = (tileX, tileY, width, height, color) => {
        const x = tileX - originX;
        const y = tileY - originY;

        for (let offsetY = -1; offsetY <= height; offsetY++) {
            for (let offsetX = -1; offsetX <= width; offsetX++) {
                const inside = offsetX >= 0 && offsetY >= 0 && offsetX < width && offsetY < height;
                plot(x + offsetX, y + offsetY, inside ? color : palette.outline);
            }
        }
    };

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileX = originX + x;
            const tileY = originY + y;
            let color;

            if (!isTileDiscovered(tileX, tileY)) {
                color = palette.fog[(x + y) & 1];
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

            plot(x, y, color);
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
    if (mapOpen || dialogueOpen || marketOpen || !mapContainer) {
        return;
    }

    mapOpen = true;
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    characterTextureKey = `character-${characterDirection}`;
    character.setTexture(characterTextureKey);

    redrawMap(scene);

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
        keycap.textContent = key;

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

        box.append(keycap, text);
        row.appendChild(box);

        return box;
    };

    marketPrompt = makePrompt('E', 'Market');
    guidePrompt = makePrompt('E', 'Talk to the Guide');

    interactionPromptLayer = scene.add.dom(0, PROMPT_Y, wrapper)
        .setOrigin(0)
        .setDepth(103)
        .setScrollFactor(0)
        .setVisible(false);

    interactionPromptLayer.pointerEvents = 'none';
}

function updateInteractionPrompt(guideIsNear) {
    if (!interactionPromptLayer || !marketPrompt || !guidePrompt) return;

    const available = !dialogueOpen && !marketOpen && !mapOpen;
    const target = available && (guideIsNear || isMarketNear())
        ? getInteractionTarget(guideHasMetPlayer)
        : null;
    const showMarket = target === 'market';
    const showGuide = target === 'guide';

    const state = (showMarket ? 1 : 0) | (showGuide ? 2 : 0);

    if (state === promptState) return;

    promptState = state;
    marketPrompt.style.display = showMarket ? 'flex' : 'none';
    guidePrompt.style.display = showGuide ? 'flex' : 'none';

    interactionPromptLayer.setVisible(showMarket || showGuide);
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
        const isExit = index === MARKET_RODS.length;

        marketOptionTexts.push(createText(isExit ? MARKET_LIST_X + 6 : MARKET_LIST_X + 24, rowY, '#c0a887'));

        if (!isExit) {
            marketPriceTexts.push(createText(MARKET_LIST_X, rowY, '#c0a887', MARKET_LIST_WIDTH - 5, 'right'));
        }
    }

    const detailTextX = MARKET_DETAIL_X + 4;
    const detailTextWidth = MARKET_DETAIL_WIDTH - 8;

    marketDetailName = createText(detailTextX, MARKET_LIST_Y + 46, '#e0f2fd', detailTextWidth, 'center');
    marketDetailStatus = createText(detailTextX, MARKET_LIST_Y + 60, '#c0a887', detailTextWidth, 'center');
    marketDetailAction = createText(detailTextX, MARKET_LIST_Y + 76, '#acccf9', detailTextWidth, 'center');

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

function addHotbarItem(scene, textureKey) {
    const slot = hotbarItemImages.length;

    if (slot >= 9) {
        return;
    }

    hotbarItemImages.push(
        scene.add.image(HOTBAR_X + slot * HOTBAR_SLOT_SIZE + 5, HOTBAR_Y + 5, textureKey)
            .setOrigin(0)
            .setDisplaySize(16, 16)
            .setDepth(100.5)
            .setScrollFactor(0)
    );
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

function refreshMarketOptions() {
    if (!marketMessageText) {
        return;
    }

    marketMessageText.textContent = `${playerCoins}c`;
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

    const exitIndex = MARKET_RODS.length;
    const exitText = marketOptionTexts[exitIndex];

    exitText.textContent = 'Leave';
    exitText.style.color = exitIndex === selectedMarketOption ? '#e0f2fd' : '#c0a887';

    const rod = MARKET_RODS[selectedMarketOption];

    if (!rod) {
        marketDetailImage.setVisible(false);
        marketDetailName.textContent = 'Leave shop';
        marketDetailStatus.textContent = 'Come back soon!';
        marketDetailStatus.style.color = '#c0a887';
        marketDetailAction.textContent = 'Enter - Leave';
        marketDetailAction.style.color = '#acccf9';
        return;
    }

    const status = getMarketRodStatus(rod);

    marketDetailImage.setVisible(true).setAlpha(ownedRods.has(rod.id) ? 0.45 : 1);
    marketDetailName.textContent = rod.label;
    marketDetailStatus.textContent = status.text;
    marketDetailStatus.style.color = status.color;

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
    if (selectedMarketOption >= MARKET_RODS.length) {
        closeMarket(scene);
        return;
    }

    const rod = MARKET_RODS[selectedMarketOption];

    if (ownedRods.has(rod.id) || playerCoins < rod.price) {
        return;
    }

    playerCoins -= rod.price;
    ownedRods.add(rod.id);
    addHotbarItem(scene, 'rod');
    marketFeedback = { text: 'Purchased!', color: '#8fbf7a' };

    refreshMarketOptions();
}

function moveMarketSelection(amount) {
    selectedMarketOption = Phaser.Math.Wrap(
        selectedMarketOption + amount,
        0,
        MARKET_RODS.length + 1
    );
    marketFeedback = null;

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
    marketFeedback = null;
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
        !marketOpen
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
    const followAmount = 1 - Math.exp(-CAMERA_EASE * delta / 1000);

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

    if (!dialogueOpen && !mapOpen && !marketOpen) {
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

    if (!isWalking) {
        const idleTextureKey = `character-${characterDirection}`;

        if (idleTextureKey !== characterTextureKey) {
            characterTextureKey = idleTextureKey;
            character.setTexture(characterTextureKey);
        }
    }

    if (isWalking) {
        const distance = CHARACTER_SPEED * Math.min(delta, 50) / 1000 *
            (moveX !== 0 && moveY !== 0 ? Math.SQRT1_2 : 1);

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

        const walkFrame = CHARACTER_WALK_FRAMES[Math.floor(time * (CHARACTER_ANIMATION_SPEED / 1000)) % 4];

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
    updateDust(time);
    updateBushRustle(time, isWalking);

    const guideIsNear = isGuideNear();
    updateGuideInteraction(this, guideIsNear);
    updateInteractionPrompt(guideIsNear);

    updateLoadedChunks(this);
    buildPendingChunk(this);
    updateCamera(delta);
    updateChunkVisibility();
    updateChunkWater(time);
}
