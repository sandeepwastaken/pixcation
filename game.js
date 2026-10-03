const MARKET_RODS = [
{ id: 'basic', label: 'Basic Rod', texture: 'rod-basic', icon: 'rod-basic-icon', price: 10, castDistance: 72, chargeTime: 1000, lineStrength: 1, catchZone: 24 },
{ id: 'intermediate', label: 'Intermediate Rod', texture: 'rod-intermediate', icon: 'rod-intermediate-icon', price: 25, castDistance: 88, chargeTime: 850, lineStrength: 1.35, catchZone: 29 },
{ id: 'master', label: 'Master Rod', texture: 'rod-master', icon: 'rod-master-icon', price: 50, castDistance: 104, chargeTime: 720, lineStrength: 1.75, catchZone: 34 }
];
const MARKET_BAITS = [
{ id: 'novice', label: 'Novice Bait', texture: 'bait-novice', icon: 'bait-novice-icon', price: 6, bundle: 5, zoneBonus: 4, lure: 1.2 },
{ id: 'trainer', label: 'Trainer Bait', texture: 'bait-trainer', icon: 'bait-trainer-icon', price: 12, bundle: 5, zoneBonus: 7, lure: 1.45 },
{ id: 'advanced', label: 'Advanced Bait', texture: 'bait-advanced', icon: 'bait-advanced-icon', price: 20, bundle: 5, zoneBonus: 11, lure: 1.75 }
];
const CHEST_BAIT_WEIGHTS = [6, 3, 1];
const FISH_SPECIES = [
{ id: 'bluegill', name: 'Bluegill', size: 'small', minWater: 1800, weight: 7, price: 7 },
{ id: 'pumpkinseed', name: 'Pumpkinseed', size: 'small', minWater: 1800, weight: 6, price: 8 },
{ id: 'largemouth-bass', name: 'Largemouth Bass', size: 'large', minWater: 6500, weight: 2.2, price: 28 },
{ id: 'smallmouth-bass', name: 'Smallmouth Bass', size: 'medium', minWater: 4800, weight: 3, price: 22 },
{ id: 'yellow-perch', name: 'Yellow Perch', size: 'medium', minWater: 3000, weight: 4.5, price: 14 },
{ id: 'walleye', name: 'Walleye', size: 'large', minWater: 8000, weight: 1.4, price: 38 },
{ id: 'rainbow-trout', name: 'Rainbow Trout', size: 'large', minWater: 6500, weight: 1.8, price: 32 },
{ id: 'brown-trout', name: 'Brown Trout', size: 'large', minWater: 6500, weight: 1.6, price: 34 },
{ id: 'brook-trout', name: 'Brook Trout', size: 'medium', minWater: 3800, weight: 2.8, price: 24 },
{ id: 'common-carp', name: 'Common Carp', size: 'large', minWater: 5500, weight: 2.5, price: 25 },
{ id: 'crucian-carp', name: 'Crucian Carp', size: 'medium', minWater: 3200, weight: 3.6, price: 17 },
{ id: 'goldfish', name: 'Goldfish', size: 'small', minWater: 2500, weight: 1.1, price: 35 },
{ id: 'channel-catfish', name: 'Channel Catfish', size: 'large', minWater: 7500, weight: 1.7, price: 36 },
{ id: 'bullhead-catfish', name: 'Bullhead Catfish', size: 'medium', minWater: 4000, weight: 3, price: 19 },
{ id: 'freshwater-drum', name: 'Freshwater Drum', size: 'large', minWater: 7500, weight: 1.6, price: 31 },
{ id: 'white-crappie', name: 'White Crappie', size: 'medium', minWater: 3500, weight: 3.7, price: 16 },
{ id: 'black-crappie', name: 'Black Crappie', size: 'medium', minWater: 3500, weight: 3.5, price: 17 },
{ id: 'roach', name: 'Roach', size: 'small', minWater: 1800, weight: 6, price: 6 },
{ id: 'rudd', name: 'Rudd', size: 'small', minWater: 2200, weight: 5, price: 8 },
{ id: 'common-bream', name: 'Common Bream', size: 'medium', minWater: 4000, weight: 3.3, price: 18 },
{ id: 'tench', name: 'Tench', size: 'medium', minWater: 4500, weight: 2.8, price: 21 },
{ id: 'common-dace', name: 'Common Dace', size: 'small', minWater: 1800, weight: 5.5, price: 7 },
{ id: 'common-minnow', name: 'Common Minnow', size: 'small', minWater: 1800, weight: 7.5, price: 4 },
{ id: 'mosquitofish', name: 'Mosquitofish', size: 'small', minWater: 1800, weight: 7, price: 3 },
{ id: 'zebra-danio', name: 'Zebra Danio', size: 'small', minWater: 2000, weight: 3, price: 12 },
{ id: 'sturgeon', name: 'Sturgeon', size: 'giant', minWater: 12000, weight: 0.12, price: 250 }
];
const GUIDE_DIALOGUE = {
intro: {
portrait: 'guide-portrait-friendly',
text: "Hey! Need something?",
options: [
{ label: 'Help', next: 'help' },
{ label: 'Greet', next: 'greet' },
{ label: 'Exit', close: true }
]
},
help: {
portrait: 'guide-portrait-friendly',
text: "WASD or arrows walk, Shift runs. E talks or shops, M opens your map, I opens your fishpedia.",
options: [
{ label: 'Fishing', next: 'fishing' },
{ label: 'Back', next: 'intro' },
{ label: 'Exit', close: true }
]
},
fishing: {
portrait: 'guide-portrait-surprised',
text: "Ignore small taps. On the big splash, press Space or click, then hold to keep the bar on the fish.",
options: [
{ label: 'Bait', next: 'bait' },
{ label: 'Back', next: 'help' },
{ label: 'Exit', close: true }
]
},
bait: {
portrait: 'guide-portrait-laughing',
text: "Bait makes your bar longer and lures fish in. B swaps it. See a chest shadow underwater? Cast right on it!",
options: [
{ label: 'Back', next: 'fishing' },
{ label: 'Exit', close: true }
]
},
greet: {
portrait: 'guide-portrait-laughing',
text: "Hello there! I'm your guide. It's nice to meet you. Enjoy your adventure!",
options: [
{ label: 'Back', next: 'intro' },
{ label: 'Exit', close: true }
]
}
};
const MARKET_RODS_BY_ID = new Map(MARKET_RODS.map(rod => [rod.id, rod]));
const MARKET_RODS_BY_LABEL = new Map(MARKET_RODS.map(rod => [rod.label, rod]));
const FISH_SPECIES_BY_ID = new Map(FISH_SPECIES.map(species => [species.id, species]));
const MARKET_BAITS_BY_ID = new Map(MARKET_BAITS.map(bait => [bait.id, bait]));
const MARKET_PAGES = [
{ title: 'Rods', items: MARKET_RODS },
{ title: 'Bait', items: MARKET_BAITS }
];
const MARKET_ITEM_ROWS = Math.max(...MARKET_PAGES.map(page => page.items.length));
const MARKET_SELL_INDEX = MARKET_ITEM_ROWS;
const MARKET_EXIT_INDEX = MARKET_SELL_INDEX + 1;
const MARKET_ROW_COUNT = MARKET_ITEM_ROWS + 2;
const SAVE_KEY = 'pixcation-save-v1';
window.WaterWarpPipeline = class WaterWarpPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
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
uniform vec4 uFish[24];
uniform vec4 uFishShape[24];
uniform float uFishCount;
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
if (index < 0.5) return vec3(0.353, 0.494, 0.714);
if (index < 1.5) return vec3(0.376, 0.522, 0.741);
if (index < 2.5) return vec3(0.392, 0.541, 0.765);
if (index < 3.5) return vec3(0.408, 0.565, 0.792);
if (index < 4.5) return vec3(0.420, 0.592, 0.800);
if (index < 5.5) return vec3(0.435, 0.624, 0.812);
if (index < 6.5) return vec3(0.451, 0.655, 0.820);
if (index < 7.5) return vec3(0.471, 0.686, 0.827);
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
float lap = sin(t * 1.3 + (p.x + p.y) * 0.045) * max(0.0, 1.0 - shore / 8.0) * 1.2;
float reach = shore + wobble + bayer * 2.2 - lap;
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
float gate = light + max(0.0, 12.0 - shore) / 12.0 * 0.08 - max(0.0, shore - 10.0) * 0.012;
if (first > 0.9 && second > 0.9 && gate > 0.75) {
index = 8.0;
} else if (first > 0.9 && second > 0.9 && gate > 0.6) {
index = 7.0;
} else if (first > 0.9 && gate > 0.56) {
index = min(index + (gate > 0.63 ? 3.0 : 2.0), 7.0);
} else if (first > 0.4 && gate > 0.64) {
index = min(index + 1.0, 7.0);
}
float edgeCode = code(mask.b);
float shaded = mask.r < 0.75 ? 1.0 : 0.0;
float fishShaded = 0.0;
for (int fish = 0; fish < 24; fish++) {
if (float(fish) >= uFishCount) break;
vec4 body = uFish[fish];
vec4 shape = uFishShape[fish];
vec2 local = p + 0.5 - body.xy;
float bound = shape.x * 0.5 + shape.y + abs(shape.w);
if (dot(local, local) > bound * bound) continue;
float along = dot(local, body.zw);
float halfLength = shape.x * 0.5;
float spine = clamp((halfLength - along) / shape.x, 0.0, 1.0);
float wave = shape.w * spine * spine * sin(spine * 5.6 - shape.z);
float across = dot(local, vec2(-body.w, body.z)) - wave;
float head = halfLength - shape.y;
if (
length(vec2(along - head, across)) < shape.y ||
along < head && along > -halfLength && abs(across) < shape.y * (along + halfLength) / (head + halfLength)
) {
fishShaded = 1.0;
break;
}
}
if (fishShaded > 0.5) {
index = max(index - 2.0, 0.0);
} else if (shaded > 0.5) {
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
function extractRodArtStyles(scene) {
const colorAt = (texture, [x, y, fallback]) => {
const color = scene.textures.getPixel(x, y, texture);
return color ? Phaser.Display.Color.GetColor(color.red, color.green, color.blue) : fallback;
};
const sample = (rod, points) => points.map(point => colorAt(rod.texture, point));
for (const rod of MARKET_RODS) {
rod.polePalette = sample(rod, [[19, 4, 0x4c3e32], [19, 6, 0x6b533b], [19, 5, 0x806953]]);
rod.linePalette = sample(rod, [[28, 2, 0xa78178], [29, 3, 0xb99f92], [29, 5, 0xc8b8a8], [30, 9, FISHING_LINE_COLOR]]);
rod.bobberPalette = sample(rod, [[27, 26, BOBBER_TOP_COLOR], [25, 26, BOBBER_TOP_COLOR], [23, 25, BOBBER_BOTTOM_COLOR]]);
}
}
function createShimmerSheet(scene) {
const source = getTerrainPixels(scene, 'shimmer-art');
const image = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
const canvas = document.createElement('canvas');
const [fromR, fromG, fromB] = SHIMMER_RECOLOR_FROM;
for (let index = 0; index < image.data.length; index += 4) {
if (image.data[index] === fromR && image.data[index + 1] === fromG && image.data[index + 2] === fromB) {
image.data.set(SHIMMER_RECOLOR_TO, index);
}
}
canvas.width = source.width;
canvas.height = source.height;
canvas.getContext('2d').putImageData(image, 0, 0);
scene.textures.addSpriteSheet('shimmer', canvas, { frameWidth: 12, frameHeight: 1 });
}
function createCanvasTexture(scene, key, width, height, draw) {
if (scene.textures.exists(key)) return;
const texture = scene.textures.createCanvas(key, width, height);
draw(texture.getContext());
texture.refresh();
}
function extractSilhouetteShadow(scene, key) {
const pixels = getTerrainPixels(scene, key);
const { width, height } = pixels;
const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && pixels.data[(y * width + x) * 4 + 3] > 0;
const points = [];
for (let y = 0; y < height + WOOD_SHADOW_OFFSET; y++) {
for (let x = 0; x < width + WOOD_SHADOW_OFFSET; x++) {
if (solid(x - WOOD_SHADOW_OFFSET, y - WOOD_SHADOW_OFFSET) && !solid(x, y)) points.push(x, y);
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
createCanvasTexture(scene, variant.key, variant.width, variant.height, context => {
context.putImageData(new ImageData(variant.data, variant.width, variant.height), 0, 0);
});
treeVariants.push(variant);
}
}
function createBushSlices(scene) {
const source = getTerrainPixels(scene, 'bush');
const { width, height } = source;
const depths = new Uint8Array(width * height);
for (let y = 0; y < height; y++) {
for (let x = 0; x < width; x++) {
depths[y * width + x] = Math.min(TILE_SIZE - 1, Math.floor(
(worldHash(x, y, 761) * 0.7 + (y / (height - 1)) * 0.3) * TILE_SIZE
));
}
}
for (let slice = 0; slice < TILE_SIZE; slice++) {
createCanvasTexture(scene, `bush-slice-${slice}`, width, height, context => {
const image = new ImageData(new Uint8ClampedArray(source.data), width, height);
for (let pixel = 0; pixel < depths.length; pixel++) {
if (depths[pixel] !== slice) image.data[pixel * 4 + 3] = 0;
}
context.putImageData(image, 0, 0);
});
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
function createTreeCanopyMask(puffs, width, height, edgeSalt) {
const owner = new Int16Array(width * height).fill(-1);
const extent = (axis, sign) => Math.floor(Math.max(...puffs.map(puff => sign * puff[axis] + puff.radius + 1)) * sign);
const minY = Math.max(0, extent('y', -1) - 1);
const maxY = Math.min(height - 1, extent('y', 1));
const minX = Math.max(0, extent('x', -1) - 1);
const maxX = Math.min(width - 1, extent('x', 1));
for (let y = minY; y <= maxY; y++) {
for (let x = minX; x <= maxX; x++) {
const edge = (leafHash(x, y, edgeSalt) - 0.5) * 1.2;
const pixel = y * width + x;
for (let index = puffs.length - 1; index >= 0; index--) {
const puff = puffs[index];
const dx = x + 0.5 - puff.x;
const dy = y + 0.5 - puff.y;
const reach = puff.radius + edge;
const distanceSquared = dx * dx + dy * dy;
if (distanceSquared <= reach * reach) {
if (index > 0 && ((x + y) & 1) && distanceSquared > (reach - 1) * (reach - 1) && owner[pixel] === -1) {
owner[pixel] = -3;
continue;
}
owner[pixel] = index;
break;
}
}
}
}
for (let pixel = 0; pixel < owner.length; pixel++) {
if (owner[pixel] !== -3) continue;
const x = pixel % width;
const y = Math.floor(pixel / width);
const edge = (leafHash(x, y, edgeSalt) - 0.5) * 1.2;
owner[pixel] = puffs.findLastIndex(puff => {
const reach = puff.radius + edge;
return (x + 0.5 - puff.x) ** 2 + (y + 0.5 - puff.y) ** 2 <= reach * reach;
});
}
const neighbors = [-1, 1, -width, width];
for (let pass = 0; pass < 2; pass++) {
for (let y = 1; y < height - 1; y++) {
for (let x = 1; x < width - 1; x++) {
const pixel = y * width + x;
let count = 0;
let front = -1;
for (const offset of neighbors) {
const next = pixel + offset;
if (owner[next] < 0) continue;
count++;
front = Math.max(front, owner[next]);
}
if (owner[pixel] >= 0 && count <= 1) owner[pixel] = -1;
else if (owner[pixel] < 0 && count >= 3) owner[pixel] = front;
}
}
}
return owner;
}
function createTreeShadow(puffs, centerX, centerY, height, edgeSalt) {
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
return [...shadow].flatMap(point => [point % 1024, Math.floor(point / 1024)]);
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
puffs.push({ x: centerX + Math.cos(angle) * (radiusX - radius), y: centerY + Math.sin(angle) * (radiusY - radius), radius, core: false });
}
const innerCount = 3 + Math.floor(random() * 3);
for (let index = 0; index < innerCount; index++) {
const angle = random() * Math.PI * 2;
const distance = Math.sqrt(random()) * 0.5;
puffs.push({ x: centerX + Math.cos(angle) * distance * radiusX, y: centerY + Math.sin(angle) * distance * radiusY + 2, radius: 7 + random() * 3, core: false });
}
puffs.sort((a, b) => (a.core ? -1 : b.core ? 1 : a.y - b.y));
const edgeSalt = Math.floor(random() * 100000);
const owner = createTreeCanopyMask(puffs, width, height, edgeSalt);
const filled = [];
const heights = new Float32Array(width * height);
const smooth = new Float32Array(width * height);
for (let pixel = 0; pixel < owner.length; pixel++) {
if (owner[pixel] >= 0) filled.push(pixel);
}
const top = Math.floor(filled[0] / width);
const bottom = Math.floor(filled[filled.length - 1] / width);
for (const pixel of filled) {
const x = pixel % width;
const y = Math.floor(pixel / width);
let best = 0;
for (const puff of puffs) {
const dx = x + 0.5 - puff.x;
const dy = y + 0.5 - puff.y;
const lift = puff.radius * puff.radius - dx * dx - dy * dy;
if (lift > 0) best = Math.max(best, Math.sqrt(lift) * (puff.core ? 0.8 : 1));
}
heights[pixel] = best;
}
for (const pixel of filled) {
const x = pixel % width;
const y = Math.floor(pixel / width);
let total = 0;
let count = 0;
for (let sampleY = Math.max(0, y - 1); sampleY <= Math.min(height - 1, y + 1); sampleY++) {
for (let sampleX = Math.max(0, x - 1); sampleX <= Math.min(width - 1, x + 1); sampleX++) {
total += heights[sampleY * width + sampleX];
count++;
}
}
smooth[pixel] = total / count;
}
const textureSalt = Math.floor(random() * 100000);
const levels = new Int8Array(width * height).fill(-1);
const values = new Float32Array(width * height);
const span = Math.max(1, bottom - top);
for (const pixel of filled) {
const x = pixel % width;
const y = Math.floor(pixel / width);
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
const sorted = filled.map(pixel => values[pixel]).sort((a, b) => a - b);
const quantile = amount => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(amount * sorted.length)))];
const bands = TREE_TONE_SHARES.map(share => [quantile(share - TREE_DITHER_SHARE), quantile(share + TREE_DITHER_SHARE)]);
for (const pixel of filled) {
const checker = (pixel % width + Math.floor(pixel / width)) & 1;
let level = 0;
for (const [low, high] of bands) {
if (values[pixel] >= high || values[pixel] >= low && checker) level++;
}
levels[pixel] = level;
}
for (let pixel = 0; pixel < (bottom - 3) * width; pixel++) {
if (owner[pixel] < 0) data[pixel * 4 + 3] = 0;
}
for (const pixel of filled) writeTreePixel(data, pixel, colors[levels[pixel]]);
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
const shadowPoints = createTreeShadow(puffs, centerX, centerY, height, edgeSalt);
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
const half = TILE_SIZE / 2;
createCanvasTexture(scene, key, TILE_SIZE, TILE_SIZE, context => {
context.drawImage(source(DIRT_CLIFF_TILES[left][0]), 0, 0, half, TILE_SIZE, 0, 0, half, TILE_SIZE);
context.drawImage(source(DIRT_CLIFF_TILES[0][right]), half, 0, half, TILE_SIZE, half, 0, half, TILE_SIZE);
});
const cliffKey = left === 1 || right === 1 ? `${key}-trimmed` : key;
createCanvasTexture(scene, cliffKey, TILE_SIZE, TILE_SIZE, context => {
context.drawImage(source(key), 0, 0);
for (const [trim, x] of [[left, 0], [right, TILE_SIZE - 2]]) {
if (trim !== 1) continue;
context.clearRect(x, TILE_SIZE - 1, 2, 1);
context.clearRect(x ? x + 1 : 0, TILE_SIZE - 2, 1, 1);
}
});
for (const corner of ['cornerDirt1', 'cornerDirt2', 'cornerDirt3']) {
createCanvasTexture(scene, `${cliffKey}-${corner}`, TILE_SIZE, TILE_SIZE, context => {
context.drawImage(source(cliffKey), 0, 0);
context.clearRect(0, 0, TILE_SIZE, 5);
context.drawImage(source(corner), 0, 0, TILE_SIZE, 5, 0, 0, TILE_SIZE, 5);
});
}
}
}
for (const base of ['waterDirt', 'waterGrass']) {
for (const [suffix, left, right] of [['InnerLeft', true, false], ['InnerRight', false, true], ['InnerBoth', true, true]]) {
createCanvasTexture(scene, `${base}${suffix}`, TILE_SIZE, TILE_SIZE, context => {
context.drawImage(source(base), 0, 0);
if (left) context.drawImage(source('waterDirtInnerLeft'), 0, 0, 5, TILE_SIZE, 0, 0, 5, TILE_SIZE);
if (right) context.drawImage(source('waterDirtInnerRight'), TILE_SIZE - 5, 0, 5, TILE_SIZE, TILE_SIZE - 5, 0, 5, TILE_SIZE);
});
}
}
}
function getTileId(tileX, tileY) {
return tileX * 67108864 + tileY;
}
function cacheWorldValue(cache, key, value) {
if (cache.size >= WORLD_CACHE_LIMIT) {
const keys = cache.keys();
for (let index = 0; index < 512; index++) cache.delete(keys.next().value);
}
cache.set(key, value);
return value;
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
function createTileCache(createChunk) {
const chunks = new Map();
let lastKey = null;
let lastChunk = null;
return (tileX, tileY, generate) => {
const chunkX = Math.floor(tileX / CHUNK_SIZE);
const chunkY = Math.floor(tileY / CHUNK_SIZE);
const key = getTileId(chunkX, chunkY);
if (key !== lastKey) {
lastChunk = chunks.get(key);
if (!lastChunk) {
if (chunks.size >= TILE_CACHE_CHUNK_LIMIT) chunks.delete(chunks.keys().next().value);
lastChunk = createChunk();
chunks.set(key, lastChunk);
}
lastKey = key;
}
return lastChunk[(tileY - chunkY * CHUNK_SIZE) * CHUNK_SIZE + tileX - chunkX * CHUNK_SIZE] ||= generate(tileX, tileY);
};
}
const TERRAIN_TYPES = [null, 'grass', 'dirt', 'water'];
const terrainTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const worldTiles = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));
function getTerrainType(tileX, tileY) {
return TERRAIN_TYPES[terrainTiles(tileX, tileY, generateTerrainCode)];
}
function generateTerrainCode(tileX, tileY) {
return TERRAIN_TYPES.indexOf(generateTerrainType(tileX, tileY));
}
function generateTerrainType(tileX, tileY) {
if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
return 'grass';
}
const warpScale = 64 * WORLD_FEATURE_SCALE;
const warpStrength = 24 * WORLD_FEATURE_SCALE;
const warpX = (valueNoise(tileX, tileY, warpScale, 10) - 0.5) * warpStrength;
const warpY = (valueNoise(tileX + 200, tileY - 100, warpScale, 11) - 0.5) * warpStrength;
const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);
if (elevation < 0.3) {
return 'water';
}
const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);
const localDirt = valueNoise(tileX, tileY, 4, 44);
const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;
return elevation < 0.38 || dirtScore > 0.63 ? 'dirt' : 'grass';
}
function isLandTile(tileX, tileY) {
return getTerrainType(tileX, tileY) !== 'water';
}
function isLocalHashPeak(tileX, tileY, stepX, stepY, radius, salt) {
const score = worldHash(tileX, tileY, salt);
if (score < 0.82) return false;
for (let offset = -radius; offset <= radius; offset++) {
if (offset !== 0 && worldHash(tileX + stepX * offset, tileY + stepY * offset, salt) >= score) return false;
}
return true;
}
function findWaterRun(tileX, tileY, stepX, stepY) {
const isWater = offset => getTerrainType(tileX + stepX * offset, tileY + stepY * offset) === 'water';
const origin = isWater(0) ? 0 : isWater(1) ? 1 : isWater(-1) ? -1 : null;
if (origin === null) return null;
let start = origin;
let end = origin;
while (end - start < MAX_BRIDGE_WATER_LENGTH && isWater(start - 1)) start--;
while (end - start < MAX_BRIDGE_WATER_LENGTH && isWater(end + 1)) end++;
const waterLength = end - start + 1;
if (waterLength < MIN_BRIDGE_WATER_LENGTH || waterLength > MAX_BRIDGE_WATER_LENGTH) return null;
return {
startLandX: tileX + stepX * (start - 1),
startLandY: tileY + stepY * (start - 1),
waterLength
};
}
function getBridgeCandidate(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
const key = getTileId(tileX, tileY) * 2 + (salt === 811 ? 1 : 0);
const cached = bridgeCandidateCache.get(key);
return cached !== undefined
? cached
: cacheWorldValue(bridgeCandidateCache, key, findBridge(tileX, tileY, stepX, stepY, widthX, widthY, salt));
}
function findBridge(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
const run = findWaterRun(tileX, tileY, stepX, stepY);
if (!run) return null;
const spanLength = run.waterLength + 2;
const isWater = (distance, width) => getTerrainType(
run.startLandX + stepX * distance + widthX * width,
run.startLandY + stepY * distance + widthY * width
) === 'water';
let crossesChannel = false;
for (let distance = 0; distance < spanLength; distance++) {
const middle = distance > 0 && distance < spanLength - 1;
if (isWater(distance, 0) !== middle || isWater(distance, 1) !== middle) return null;
crossesChannel ||= middle && isWater(distance, -1) && isWater(distance, 2);
}
if (!crossesChannel || !isLocalHashPeak(run.startLandX, run.startLandY, widthX, widthY, 4, salt)) return null;
return { startX: run.startLandX, startY: run.startLandY, stepX, stepY, widthX, widthY, spanLength };
}
function isTileInBridge(tileX, tileY, bridge) {
const offsetX = tileX - bridge.startX;
const offsetY = tileY - bridge.startY;
const distance = offsetX * bridge.stepX + offsetY * bridge.stepY;
const width = offsetX * bridge.widthX + offsetY * bridge.widthY;
return distance >= 0 && distance < bridge.spanLength &&
(width === 0 || width === 1);
}
const BRIDGE_ORIENTATIONS = [
{ stepX: 0, stepY: 1, widthX: 1, widthY: 0, salt: 810, rotation: 0 },
{ stepX: 1, stepY: 0, widthX: 0, widthY: 1, salt: 811, rotation: Math.PI / 2 }
];
function getBridgeTile(tileX, tileY) {
const onWater = getTerrainType(tileX, tileY) === 'water';
for (const { stepX, stepY, widthX, widthY, salt, rotation } of BRIDGE_ORIENTATIONS) {
if (
!onWater &&
getTerrainType(tileX - stepX, tileY - stepY) !== 'water' &&
getTerrainType(tileX + stepX, tileY + stepY) !== 'water'
) {
continue;
}
for (let offset = -1; offset <= 0; offset++) {
const bridge = getBridgeCandidate(tileX + widthX * offset, tileY + widthY * offset, stepX, stepY, widthX, widthY, salt);
if (bridge && isTileInBridge(tileX, tileY, bridge)) {
return { key: 'wood', rotation, bridge: true };
}
}
}
return null;
}
function getPierCandidate(anchorX, anchorY) {
const key = getTileId(anchorX, anchorY);
const cached = pierCandidateCache.get(key);
return cached !== undefined ? cached : cacheWorldValue(pierCandidateCache, key, findPier(anchorX, anchorY));
}
function findPier(anchorX, anchorY) {
const isWater = (x, y) => getTerrainType(anchorX + x, anchorY + y) === 'water';
if (isWater(0, 0) || isWater(1, 0) || !isLocalHashPeak(anchorX, anchorY, 1, 0, 5, 920)) return null;
const lengthRange = MAX_PIER_WATER_LENGTH - MIN_PIER_WATER_LENGTH + 1;
const waterLength = MIN_PIER_WATER_LENGTH + Math.floor(worldHash(anchorX, anchorY, 921) * lengthRange);
let openWaterTiles = 0;
for (let distance = 1; distance <= waterLength + 2; distance++) {
if (!isWater(0, distance) || !isWater(1, distance)) return null;
}
for (let y = waterLength; y <= waterLength + 2; y++) {
for (let x = -2; x <= 3; x++) {
if (isWater(x, y)) openWaterTiles++;
}
}
return openWaterTiles / 18 >= 0.8 ? { anchorX, anchorY, waterLength } : null;
}
function getPierTile(tileX, tileY) {
if (getTerrainType(tileX, tileY) !== 'water' && getTerrainType(tileX, tileY + 1) !== 'water') return null;
for (let distance = 0; distance <= MAX_PIER_WATER_LENGTH; distance++) {
for (let side = 0; side <= 1; side++) {
const pier = getPierCandidate(tileX - side, tileY - distance);
if (!pier || distance > pier.waterLength) continue;
return distance === pier.waterLength
? { key: side === 0 ? 'woodLeft' : 'woodRight', rotation: 0, baseKey: 'water' }
: { key: 'wood', rotation: 0 };
}
}
return null;
}
function getTerrainTileKey(tileX, tileY) {
const terrain = getTerrainType(tileX, tileY);
if (terrain === 'water') {
const north = getTerrainType(tileX, tileY - 1);
return north === 'dirt' ? 'waterDirt' : north === 'grass' ? 'waterGrass' : 'water';
}
if (getTerrainType(tileX, tileY + 1) === 'water') return terrain === 'dirt' ? 'dirtEdge' : 'grassEdge';
if (terrain === 'dirt') return 'dirt1';
if (worldHash(tileX, tileY, 670) <= 0.80) return 'grass1';
if (valueNoise(tileX, tileY, 8, 671) <= 0.62) return 'grass2';
return valueNoise(tileX + 149, tileY - 83, 24, 672) > 0.5 ? 'grass4' : 'grass3';
}
function getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy) {
if (terrain === 'dirt' && horizontal === 'grass' && vertical === 'grass') {
return 'corner';
}
if (terrain === 'grass' && horizontal === 'dirt' && vertical === 'dirt' && diagonal === 'dirt') {
return 'dirtEdgeCorner';
}
if (terrain === 'water' && horizontal !== 'water' && vertical !== 'water' && diagonal !== 'water') {
return dy < 0 ? 'dirtCliffCorner' : 'dirtEdgeCorner';
}
return null;
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
const diagonal = getTerrainType(tileX + dx, tileY + dy);
const patchKey = getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy);
if (!patchKey) continue;
const size = patchKey === 'corner' ? 7 : 5;
tile.patches ||= [];
tile.patches.push({
key: patchKey,
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
return worldTiles(tileX, tileY, generateWorldTile);
}
function generateWorldTile(tileX, tileY) {
const tile = getBridgeTile(tileX, tileY) || getPierTile(tileX, tileY) || getTerrainTile(tileX, tileY);
const name = tile.key.toLowerCase();
tile.blocking = name.includes('water') ? 'full'
: name.includes('edge') || name.includes('left') || name.includes('right') ? 'lower'
: null;
return tile;
}
function getChunkKey(chunkX, chunkY) {
return getTileId(chunkX, chunkY);
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
const patches = tile.patches || [];
const signature = `${tile.key}|${tile.textureKey}|${tile.baseKey}|${tile.rotation}|` +
patches.map(patch => `${patch.key},${patch.x},${patch.y},${patch.flipX},${patch.flipY}`).join(';');
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
for (const patch of patches) {
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
const surface = { id: scene.terrainSurfaceCache.size, land, water };
scene.terrainSurfaceCache.set(signature, surface);
tile.surface = surface;
return surface;
}
function getTileMaskRuns(mask, mergeRows = false) {
const cells = [];
const previous = mergeRows ? [] : null;
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
const above = previous?.[key];
if (mergeRows && above && above.y + above.height === y) {
above.height++;
} else {
const cell = { x: start, y, width: x - start, height: 1 };
cells.push(cell);
if (previous) previous[key] = cell;
}
}
}
return cells;
}
function getShorelineTile(scene, tile, northTile) {
const surface = getTerrainSurface(scene, tile);
const north = getTerrainSurface(scene, northTile);
const signature = surface.id * 65536 + north.id;
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
scene.terrainPixelCache.set(textureKey, image);
const shoreline = {
textureKey,
waterCells: getTileMaskRuns(surface.water, true),
edgeCells: getTileMaskRuns(edges)
};
scene.shorelineTileCache.set(signature, shoreline);
return shoreline;
}
function gatherNearbyWoodTiles(chunkX, chunkY, woodTiles) {
for (let localY = -1; localY <= CHUNK_SIZE; localY++) {
const edgeRow = localY === -1 || localY === CHUNK_SIZE;
for (let localX = -1; localX <= CHUNK_SIZE; localX += edgeRow ? 1 : CHUNK_SIZE + 1) {
const tile = getWorldTile(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);
if (tile.key.startsWith('wood')) woodTiles.push(localX, localY, tile);
}
}
return woodTiles;
}
let woodMaskScratch;
function getChunkWoodMask(scene, tiles) {
if (tiles.length === 0) return null;
woodMaskScratch ||= new Uint8Array(WOOD_MASK_SIZE * WOOD_MASK_SIZE);
const mask = woodMaskScratch;
mask.fill(0);
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
const core = x >= left && x < right && y >= top && y < bottom;
if (core || ((x + y) & 1) === 0) mask[(originY + y) * WOOD_MASK_SIZE + originX + x] = 1;
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
if (!pixels[(y * TILE_SIZE + x) * 4 + 3]) continue;
opaque++;
rowLeft = Math.min(rowLeft, x);
rowRight = x + 1;
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
const stride = size + 2;
if (!scene.shoreDistanceScratch) {
scene.shoreDistanceScratch = new Uint16Array(stride * stride);
scene.shoreDistanceScratch.fill(65535);
}
const distances = scene.shoreDistanceScratch;
for (let localY = -SHORE_DISTANCE_MARGIN_TILES; localY < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localY++) {
for (let localX = -SHORE_DISTANCE_MARGIN_TILES; localX < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localX++) {
const tileX = chunkX * CHUNK_SIZE + localX;
const tileY = chunkY * CHUNK_SIZE + localY;
let tile = getWorldTile(tileX, tileY);
if (tile.key.startsWith('wood')) {
tile = getTerrainTile(tileX, tileY);
}
const water = getTerrainSurface(scene, tile).water;
const originX = localX * TILE_SIZE + margin + 1;
const originY = localY * TILE_SIZE + margin + 1;
for (let y = 0; y < TILE_SIZE; y++) {
const row = (originY + y) * stride + originX;
for (let x = 0; x < TILE_SIZE; x++) {
distances[row + x] = water[y * TILE_SIZE + x] ? 65535 : 0;
}
}
}
}
for (const direction of [1, -1]) {
const back = direction * stride;
for (let step = 0; step < size; step++) {
const y = direction > 0 ? step : size - 1 - step;
for (let column = 0; column < size; column++) {
const index = (y + 1) * stride + (direction > 0 ? column : size - 1 - column) + 1;
const value = distances[index];
if (value === 0) continue;
distances[index] = Math.min(
value,
distances[index - direction] + 3,
distances[index - back] + 3,
distances[index - back - 1] + 4,
distances[index - back + 1] + 4
);
}
}
}
const result = new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);
for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
const row = (y + margin + 1) * stride + margin + 1;
for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
result[y * CHUNK_PIXEL_SIZE + x] = Math.min(SHORE_DISTANCE_MAX, Math.round(distances[row + x] / 3));
}
}
return result;
}
function forEachStaticShadowPoint(chunkX, chunkY, callback) {
const minTileX = chunkX * CHUNK_SIZE - 3;
const minTileY = chunkY * CHUNK_SIZE - 1;
const maxTileX = (chunkX + 1) * CHUNK_SIZE;
const maxTileY = (chunkY + 1) * CHUNK_SIZE + 1;
for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
const type = getPropAt(tileX, tileY);
if (!type) continue;
const sprite = getPropSprite(tileX, tileY);
for (let point = 0; point < sprite.shadow.length; point += 2) {
callback(sprite.x + sprite.shadow[point], sprite.y + sprite.shadow[point + 1]);
}
}
}
for (const caster of staticShadowCasters) {
for (let point = 0; point < caster.points.length; point += 2) {
callback(caster.x + caster.points[point], caster.y + caster.points[point + 1]);
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
let detailedShadowScratch;
function bakeGroundShadows(scene, context, chunkX, chunkY, mask) {
let minX = CHUNK_PIXEL_SIZE;
let minY = CHUNK_PIXEL_SIZE;
let maxX = -1;
let maxY = -1;
detailedShadowScratch ||= new Uint32Array(mask.length);
const detailed = detailedShadowScratch;
let detailedCount = 0;
let activeStyle = null;
const fillRun = (style, x, y, width) => {
if (style !== activeStyle) {
context.fillStyle = style;
activeStyle = style;
}
context.fillRect(x, y, width, 1);
};
for (let localY = 0; localY < CHUNK_PIXEL_SIZE; localY++) {
const tileY = chunkY * CHUNK_SIZE + Math.floor(localY / TILE_SIZE);
const surfaceRow = (localY % TILE_SIZE) * TILE_SIZE;
let runStart = -1;
let runColor = null;
let column = -1;
let water = null;
let flatStyle = null;
for (let localX = 0; localX < CHUNK_PIXEL_SIZE; localX++) {
const pixel = localY * CHUNK_PIXEL_SIZE + localX;
let color = null;
if (mask[pixel]) {
if (column !== Math.floor(localX / TILE_SIZE)) {
column = Math.floor(localX / TILE_SIZE);
const tile = getWorldTile(chunkX * CHUNK_SIZE + column, tileY);
water = getTerrainSurface(scene, tile).water;
flatStyle = isFlatShadowTile(tile) ? getShadowStyle(scene, tile.key) : null;
}
if (!water[surfaceRow + localX % TILE_SIZE]) {
if (flatStyle) {
color = flatStyle;
} else {
detailed[detailedCount++] = pixel;
minX = Math.min(minX, localX);
minY = Math.min(minY, localY);
maxX = Math.max(maxX, localX);
maxY = Math.max(maxY, localY);
}
}
}
if (color !== runColor || !color) {
if (runStart !== -1) {
fillRun(runColor, runStart, localY, localX - runStart);
runStart = -1;
runColor = null;
}
if (color) {
runStart = localX;
runColor = color;
}
}
}
if (runStart !== -1) {
fillRun(runColor, runStart, localY, CHUNK_PIXEL_SIZE - runStart);
}
}
if (detailedCount === 0) {
return;
}
const width = maxX - minX + 1;
const image = context.getImageData(minX, minY, width, maxY - minY + 1);
for (let detail = 0; detail < detailedCount; detail++) {
const pixel = detailed[detail];
const index = ((Math.floor(pixel / CHUNK_PIXEL_SIZE) - minY) * width + pixel % CHUNK_PIXEL_SIZE - minX) * 4;
if (!image.data[index + 3]) continue;
const shaded = shadeColor(image.data[index], image.data[index + 1], image.data[index + 2]);
image.data[index] = shaded[0];
image.data[index + 1] = shaded[1];
image.data[index + 2] = shaded[2];
}
context.putImageData(image, minX, minY);
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
function createChunkCanvas(scene) {
const canvas = document.createElement('canvas');
canvas.width = CHUNK_PIXEL_SIZE;
canvas.height = CHUNK_PIXEL_SIZE;
canvas.getContext('2d', { willReadFrequently: true });
return scene.textures.addCanvas(`chunk-canvas-${chunkCanvasCount++}`, canvas);
}
function acquireChunkCanvas(scene) {
const texture = chunkCanvasPool.pop() || createChunkCanvas(scene);
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
context.setTransform(flipX ? -1 : 1, 0, 0, flipY ? -1 : 1, flipX ? x + width : x, flipY ? y + height : y);
context.drawImage(source, 0, 0);
} else {
context.drawImage(source, x, y);
return;
}
context.setTransform(1, 0, 0, 1, 0, 0);
}
function createChunkLayer(scene, texture, x, y, depth) {
texture.refresh();
return scene.add.image(x, y, texture.key).setOrigin(0).setDepth(depth);
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
const terrainTile = worldTile.bridge ? getTerrainTile(tileX, tileY) : worldTile;
const tileKey = terrainTile.key;
const isWater = tileKey.startsWith('water');
const drawX = localX * TILE_SIZE;
const drawY = localY * TILE_SIZE;
let shoreline = null;
if (isWater || terrainTile.baseKey === 'water') {
const northWorldTile = getWorldTile(tileX, tileY - 1);
const northTile = northWorldTile.bridge ? getTerrainTile(tileX, tileY - 1) : northWorldTile;
shoreline = getShorelineTile(scene, terrainTile, northTile);
shorelineTiles.push(localX, localY, shoreline.textureKey);
}
if (terrainTile.baseKey) {
drawChunkTexture(groundContext, scene, shoreline ? shoreline.textureKey : terrainTile.baseKey, drawX, drawY);
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
drawChunkTexture(getUpperContext(), scene, patch.key, drawX + patch.x, drawY + patch.y, 0, patch.flipX, patch.flipY);
}
if (worldTile.bridge) {
drawChunkTexture(getUpperContext(), scene, worldTile.key, drawX, drawY, worldTile.rotation);
}
if (worldTile.key.startsWith('wood')) {
woodTiles.push(localX, localY, worldTile);
}
const prop = getPropAt(tileX, tileY);
if (prop === 'bush') {
const baseY = (tileY + 1) * TILE_SIZE;
const bush = { x: tileX * TILE_SIZE, y: baseY, slices: [], rustleStart: -Infinity, touching: false, offset: 0 };
for (let slice = 0; slice < TILE_SIZE; slice++) {
const image = scene.add.image(bush.x, baseY, `bush-slice-${slice}`)
.setOrigin(0, 1)
.setDepth(baseY - TILE_SIZE + slice + 0.5);
worldObjectLayer.add(image);
tileSprites.push(image);
bush.slices.push(image);
}
bushes.push(bush);
} else if (prop) {
const sprite = getPropSprite(tileX, tileY);
const image = scene.add.image(sprite.x, sprite.y, sprite.texture)
.setOrigin(0)
.setDepth((tileY + 1) * TILE_SIZE);
worldObjectLayer.add(image);
tileSprites.push(image);
}
if (shoreline) {
const worldX = tileX * TILE_SIZE;
const worldY = tileY * TILE_SIZE;
for (const cell of shoreline.waterCells) {
const x = worldX + cell.x;
const y = worldY + cell.y;
waterMaskCells.push(x, y, cell.width, cell.height);
if (isWater && !worldTile.bridge && cell.width >= 12) waterCells.push(x, y, cell.width, cell.height);
}
for (const cell of shoreline.edgeCells) {
edgeCells.push(worldX + cell.x, worldY + cell.y, cell.width);
}
}
}
}
const shadowMask = getStaticShadowMask(chunkX, chunkY);
if (shadowMask) bakeGroundShadows(scene, groundContext, chunkX, chunkY, shadowMask);
const groundLayer = createChunkLayer(scene, groundTexture, pixelX, pixelY, 0);
const upperLayer = upperTexture ? createChunkLayer(scene, upperTexture, pixelX, pixelY, 1.5) : null;
const chunk = {
key,
chunkX,
chunkY,
pixelX,
pixelY,
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
waterBuild: waterMaskCells.length > 0 ? { waterMaskCells, edgeCells, woodTiles, shorelineTiles } : null
};
loadedChunks.set(key, chunk);
if (waterCells.length > 0) loadedShimmerChunks.add(chunk);
if (chunk.waterBuild && deferWater) {
pendingWaterChunks.push(chunk);
} else if (chunk.waterBuild) {
buildChunkWater(scene, chunk);
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
scene.waterChunkImage ||= context.createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
const image = scene.waterChunkImage;
const data = image.data;
data.set(getWaterMaskBase(scene));
for (let cell = 0; cell < waterMaskCells.length; cell += 4) {
const localX = waterMaskCells[cell] - pixelX;
const localY = waterMaskCells[cell + 1] - pixelY;
const width = waterMaskCells[cell + 2];
const height = waterMaskCells[cell + 3];
for (let y = localY; y < localY + height; y++) {
let index = (y * CHUNK_PIXEL_SIZE + localX) * 4;
for (let x = 0; x < width; x++, index += 4) data[index] = 255;
}
}
const shoreDistances = getShoreDistances(scene, chunkX, chunkY);
chunk.shoreDistances = shoreDistances;
chunk.fish = [];
spawnChunkFish(chunk);
for (let pixel = 0, index = 0; pixel < shoreDistances.length; pixel++, index += 4) {
if (!data[index]) continue;
data[index + 1] += shoreDistances[pixel] * 3;
if (shadowMask?.[pixel]) data[index] = 128;
}
for (let tile = 0; tile < shorelineTiles.length; tile += 3) {
const art = getTerrainPixels(scene, shorelineTiles[tile + 2]).data;
const originX = shorelineTiles[tile] * TILE_SIZE;
const originY = shorelineTiles[tile + 1] * TILE_SIZE;
for (let y = 0; y < TILE_SIZE; y++) {
for (let x = 0; x < TILE_SIZE; x++) {
const source = (y * TILE_SIZE + x) * 4;
const target = ((originY + y) * CHUNK_PIXEL_SIZE + originX + x) * 4;
const baseWater = art[source] === WATER_BASE_COLOR[0] && art[source + 1] === WATER_BASE_COLOR[1] &&
art[source + 2] === WATER_BASE_COLOR[2];
if (data[target] && art[source + 3] && !baseWater) data[target] = 128;
}
}
}
const woodMask = getChunkWoodMask(scene, gatherNearbyWoodTiles(chunkX, chunkY, woodTiles));
for (let y = 0; woodMask && y < CHUNK_PIXEL_SIZE; y++) {
const maskRow = (y + WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET) * WOOD_MASK_SIZE + WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET;
let index = y * CHUNK_PIXEL_SIZE * 4;
for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
if (data[index] && woodMask[maskRow + x]) data[index] = 128;
}
}
bakeChestSilhouette(chunk, data);
for (let cell = 0; cell < edgeCells.length; cell += 3) {
let index = ((edgeCells[cell + 1] - pixelY) * CHUNK_PIXEL_SIZE + edgeCells[cell] - pixelX) * 4 + 2;
for (let x = 0; x < edgeCells[cell + 2]; x++, index += 4) data[index] = 255;
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
if (!chunk) return;
while (chunk.shimmers.length) poolShimmer(chunk.shimmers.pop());
for (const sprite of chunk.tileSprites) sprite.destroy();
for (const [layer, texture] of [[chunk.groundLayer, chunk.groundTexture], [chunk.upperLayer, chunk.upperTexture], [chunk.overlay, chunk.waterTexture]]) {
if (layer) layer.destroy();
if (texture) chunkCanvasPool.push(texture);
}
loadedWaterChunks.delete(chunk);
loadedShimmerChunks.delete(chunk);
loadedChunks.delete(key);
}
function isChunkNear(chunkX, chunkY, radius) {
return Math.abs(chunkX - activeChunkX) <= radius && Math.abs(chunkY - activeChunkY) <= radius;
}
function updateLoadedChunks(scene, force = false) {
const centerChunkX = Math.floor(Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE) / CHUNK_SIZE);
const centerChunkY = Math.floor(Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE) / CHUNK_SIZE);
if (!force && centerChunkX === activeChunkX && centerChunkY === activeChunkY) return;
const discoveredBefore = discoveredChunks.size;
activeChunkX = centerChunkX;
activeChunkY = centerChunkY;
visibleChunkLeft = null;
pendingChunks.length = 0;
for (let offsetY = -CHUNK_DISCOVERY_RADIUS; offsetY <= CHUNK_DISCOVERY_RADIUS; offsetY++) {
for (let offsetX = -CHUNK_DISCOVERY_RADIUS; offsetX <= CHUNK_DISCOVERY_RADIUS; offsetX++) {
discoveredChunks.add(getTileId(centerChunkX + offsetX, centerChunkY + offsetY));
}
}
if (discoveredChunks.size !== discoveredBefore) saveDirty = true;
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
if (!isChunkNear(chunk.chunkX, chunk.chunkY, CHUNK_LOAD_RADIUS)) destroyWorldChunk(key);
}
}
function buildPendingChunk(scene) {
while (pendingChunks.length > 0) {
const chunkY = pendingChunks.pop();
const chunkX = pendingChunks.pop();
if (isChunkNear(chunkX, chunkY, CHUNK_LOAD_RADIUS) && !loadedChunks.has(getChunkKey(chunkX, chunkY))) {
createWorldChunk(scene, chunkX, chunkY, true);
visibleChunkLeft = null;
return;
}
}
while (pendingWaterChunks.length > 0) {
const chunk = pendingWaterChunks.pop();
if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) {
buildChunkWater(scene, chunk);
return;
}
}
}
function updateChunkVisibility() {
const chunkLeft = Math.floor(mainCamera.scrollX / CHUNK_PIXEL_SIZE);
const chunkRight = Math.ceil((mainCamera.scrollX + mainCamera.width) / CHUNK_PIXEL_SIZE) - 1;
const chunkTop = Math.floor(mainCamera.scrollY / CHUNK_PIXEL_SIZE);
const chunkBottom = Math.ceil((mainCamera.scrollY + mainCamera.height) / CHUNK_PIXEL_SIZE) - 1;
if (
chunkLeft === visibleChunkLeft && chunkRight === visibleChunkRight &&
chunkTop === visibleChunkTop && chunkBottom === visibleChunkBottom
) {
return;
}
visibleChunkLeft = chunkLeft;
visibleChunkRight = chunkRight;
visibleChunkTop = chunkTop;
visibleChunkBottom = chunkBottom;
for (const chunk of loadedChunks.values()) {
const visible = chunk.chunkX >= chunkLeft && chunk.chunkX <= chunkRight && chunk.chunkY >= chunkTop && chunk.chunkY <= chunkBottom;
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
function poolShimmer(shimmer) {
shimmer.shimmerChunk = null;
shimmer.stop().setVisible(false).setActive(false);
shimmerPool.push(shimmer);
}
function releaseShimmer(chunk, shimmer) {
const index = chunk.shimmers.indexOf(shimmer);
if (index !== -1) {
chunk.shimmers.splice(index, 1);
}
poolShimmer(shimmer);
}
function finishShimmer(animation, frame, shimmer) {
if (shimmer.shimmerChunk) releaseShimmer(shimmer.shimmerChunk, shimmer);
}
function spawnShimmer(scene) {
let visibleCount = 0;
for (const chunk of loadedShimmerChunks) {
if (chunk.visible) visibleCount++;
}
if (visibleCount === 0) return;
let selected = Math.floor(Math.random() * visibleCount);
for (const chunk of loadedShimmerChunks) {
if (!chunk.visible || selected-- > 0) continue;
spawnChunkShimmer(scene, chunk);
return;
}
}
function spawnChunkShimmer(scene, chunk) {
const cell = Math.floor(Math.random() * (chunk.waterCells.length / 4)) * 4;
let shimmer = shimmerPool.pop();
if (!shimmer) {
shimmer = scene.add.sprite(0, 0, 'shimmer').setOrigin(0).setDepth(1.25);
shimmer.on(Phaser.Animations.Events.ANIMATION_COMPLETE, finishShimmer);
}
shimmer.shimmerChunk = chunk;
shimmer
.setPosition(
chunk.waterCells[cell] + Phaser.Math.Between(0, chunk.waterCells[cell + 2] - 12),
chunk.waterCells[cell + 1] + Phaser.Math.Between(0, chunk.waterCells[cell + 3] - 1)
)
.setVisible(true)
.setActive(true);
chunk.shimmers.push(shimmer);
shimmer.play('shimmer');
}
function canHoldProp(type, tileX, tileY) {
for (let offsetX = 0; offsetX < PROP_TYPES[type].width; offsetX++) {
const terrain = getTerrainType(tileX + offsetX, tileY);
if (terrain !== 'grass' && (terrain !== 'dirt' || !PROP_TYPES[type].onDirt)) return false;
if (type === 'bush') continue;
const tile = getWorldTile(tileX + offsetX, tileY);
if (tile.blocking || tile.bridge || tile.key.startsWith('wood')) return false;
}
return true;
}
function getPropCandidate(tileX, tileY) {
if (Math.abs(tileX) <= PROP_SPAWN_CLEARANCE && Math.abs(tileY) <= PROP_SPAWN_CLEARANCE) return null;
const score = worldHash(tileX, tileY, 760);
let type = null;
if (score > 0.992) {
type = 'bush';
} else if (score > 0.985) {
const roll = worldHash(tileX, tileY, 763);
type = roll < 0.4 ? 'rock' : roll < 0.65 ? 'boulder' : 'tree';
} else if (score > 0.94 && valueNoise(tileX, tileY, PROP_FOREST_SCALE, 764) > PROP_FOREST_LEVEL) {
type = 'tree';
}
return type && canHoldProp(type, tileX, tileY) ? type : null;
}
function isUnderCanopy(treeX, treeY, otherX, otherY, otherWidth) {
return otherY < treeY && otherY >= treeY - TREE_CANOPY_TILES &&
otherX < treeX + 3 && otherX + otherWidth > treeX - 1;
}
function propsConflict(typeA, ax, ay, typeB, bx, by) {
const widthA = PROP_TYPES[typeA].width;
const widthB = PROP_TYPES[typeB].width;
const apart = bx >= ax + widthA + 1 || ax >= bx + widthB + 1;
if (Math.abs(ay - by) <= 1 && !apart) return true;
return typeA === 'tree' && isUnderCanopy(ax, ay, bx, by, widthB) ||
typeB === 'tree' && isUnderCanopy(bx, by, ax, ay, widthA);
}
const PROP_CODES = [undefined, null, 'bush', 'rock', 'boulder', 'tree'];
const propTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const propSprites = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));
function getPropAt(tileX, tileY) {
return PROP_CODES[propTiles(tileX, tileY, generatePropCode)];
}
function generatePropCode(tileX, tileY) {
return PROP_CODES.indexOf(placeProp(tileX, tileY));
}
function placeProp(tileX, tileY) {
const type = getPropCandidate(tileX, tileY);
if (!type) return null;
const priority = worldHash(tileX, tileY, 765);
for (let offsetY = -TREE_CANOPY_TILES; offsetY <= TREE_CANOPY_TILES; offsetY++) {
for (let offsetX = -3; offsetX <= 3; offsetX++) {
if (offsetX === 0 && offsetY === 0) continue;
const nearbyX = tileX + offsetX;
const nearbyY = tileY + offsetY;
const nearby = getPropCandidate(nearbyX, nearbyY);
if (!nearby || !propsConflict(type, tileX, tileY, nearby, nearbyX, nearbyY)) continue;
const nearbyPriority = worldHash(nearbyX, nearbyY, 765);
const nearbyWins = nearbyPriority > priority || nearbyPriority === priority &&
(nearbyY < tileY || nearbyY === tileY && nearbyX < tileX);
if (nearbyWins) return null;
}
}
return type;
}
function getPropCovering(tileX, tileY) {
const here = getPropAt(tileX, tileY);
if (here) return { type: here, tileX };
const left = getPropAt(tileX - 1, tileY);
return left && PROP_TYPES[left].width > 1 ? { type: left, tileX: tileX - 1 } : null;
}
function isTileClearOfProps(tileX, tileY) {
if (getPropCovering(tileX, tileY)) return false;
for (let offsetY = 1; offsetY <= TREE_CANOPY_TILES; offsetY++) {
for (let treeX = tileX - 2; treeX <= tileX + 1; treeX++) {
if (getPropAt(treeX, tileY + offsetY) === 'tree') return false;
}
}
return true;
}
function getTreeVariant(tileX, tileY) {
const index = Math.floor(worldHash(tileX, tileY, 766) * treeVariants.length);
return treeVariants[Math.min(index, treeVariants.length - 1)];
}
function getPropSprite(tileX, tileY) {
return propSprites(tileX, tileY, createPropSprite);
}
function createPropSprite(tileX, tileY) {
const type = getPropAt(tileX, tileY);
const baseY = (tileY + 1) * TILE_SIZE;
if (type === 'tree') {
const variant = getTreeVariant(tileX, tileY);
const x = tileX * TILE_SIZE + TILE_SIZE - variant.width / 2;
return {
texture: variant.key,
x,
y: baseY - variant.height,
shadow: variant.shadowPoints,
hitLeft: x + variant.hitLeft,
hitRight: x + variant.hitRight,
hitHeight: TREE_HITBOX_HEIGHT
};
}
const art = propArt.get(type);
const x = tileX * TILE_SIZE + Math.floor((PROP_TYPES[type].width * TILE_SIZE - art.width) / 2);
const hitbox = PROP_TYPES[type].hitbox;
return {
texture: type,
x,
y: baseY - art.height,
shadow: art.shadow,
hitLeft: hitbox ? x + hitbox[0] : x,
hitRight: hitbox ? x + art.width - hitbox[0] : x,
hitHeight: hitbox ? hitbox[1] : 0
};
}
function propBlocksRect(type, tileX, tileY, left, top, right, bottom) {
const sprite = getPropSprite(tileX, tileY);
const baseY = (tileY + 1) * TILE_SIZE;
return left < sprite.hitRight && right > sprite.hitLeft && top < baseY && bottom > baseY - sprite.hitHeight;
}
function isGuideSpawnTile(tileX, tileY) {
const tileKey = getWorldTile(tileX, tileY).key.toLowerCase();
return getTerrainType(tileX, tileY) !== 'water' &&
!tileKey.includes('edge') &&
!tileKey.includes('wood') &&
!tileKey.includes('water') &&
isTileClearOfProps(tileX, tileY);
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
if (!isGuideSpawnTile(guideTileX, guideTileY) || !canPlaceStoreAt(storeTileX, storeTileY)) {
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
if (!spawn) return;
store = scene.add.image(spawn.storeTileX * TILE_SIZE, spawn.storeTileY * TILE_SIZE, 'store')
.setOrigin(0)
.setDepth(spawn.storeTileY * TILE_SIZE + STORE_HEIGHT);
guide = scene.add.image(spawn.guideTileX * TILE_SIZE, spawn.guideTileY * TILE_SIZE, 'guide')
.setOrigin(0)
.setDepth(spawn.guideTileY * TILE_SIZE + GUIDE_SIZE);
worldObjectLayer.add([store, guide]);
staticShadowCasters.push(
{ x: guide.x + ACTOR_SHADOW_X, y: guide.y + ACTOR_SHADOW_Y, points: getShapePoints(ACTOR_SHADOW_SHAPE) },
{ x: store.x, y: store.y, points: extractSilhouetteShadow(scene, 'store') }
);
rebakeLoadedShadows(scene);
}
function rebakeLoadedShadows(scene) {
for (const chunk of loadedChunks.values()) {
const mask = getStaticShadowMask(chunk.chunkX, chunk.chunkY);
const added = mask && mask.map((value, pixel) => value && !chunk.shadowMask?.[pixel] ? 1 : 0);
if (!added || !added.includes(1)) continue;
bakeGroundShadows(scene, chunk.groundTexture.getContext(), chunk.chunkX, chunk.chunkY, added);
chunk.groundTexture.refresh();
chunk.shadowMask = mask;
chunk.pixels = null;
}
}
function getShapePoints(shape) {
const points = [];
for (let row = 0; row < shape.length; row++) {
for (let column = 0; column < shape[row].length; column++) {
if (shape[row][column] === '#') points.push(column, row);
}
}
return points;
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
if (other.luma >= color.luma || best && other.luma <= best.luma) continue;
if (Math.abs(color.saturation - other.saturation) >= 0.14) continue;
const hueGap = Math.min(Math.abs(color.hue - other.hue), 360 - Math.abs(color.hue - other.hue));
if (hueGap >= 24) continue;
const distance = Math.hypot(
color.rgb[0] - other.rgb[0],
color.rgb[1] - other.rgb[1],
color.rgb[2] - other.rgb[2]
);
if (distance < 48) best = other;
}
shadowLut.set(color.key, best ? best.rgb : color.rgb.map(value => Math.round(value * 0.86)));
}
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
function shadeColor(r, g, b) {
const key = (r << 16) | (g << 8) | b;
let shaded = shadowLut.get(key);
if (!shaded) {
shaded = [Math.round(r * 0.86), Math.round(g * 0.86), Math.round(b * 0.86)];
shadowLut.set(key, shaded);
}
return shaded;
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
if (isWaterPixel(scene, worldX, worldY)) return null;
const tileX = Math.floor(worldX / TILE_SIZE);
const tileY = Math.floor(worldY / TILE_SIZE);
const tile = getWorldTile(tileX, tileY);
const chunkX = Math.floor(tileX / CHUNK_SIZE);
const chunkY = Math.floor(tileY / CHUNK_SIZE);
const chunk = loadedChunks.get(getChunkKey(chunkX, chunkY));
const pixel = (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE;
if (!chunk || chunk.shadowMask?.[pixel]) return null;
if (isFlatShadowTile(tile)) return getTileShadowColor(scene, tile);
const { upper, ground } = getChunkPixels(chunk);
const index = pixel * 4;
if (upper && upper[index + 3]) return shadeColor(upper[index], upper[index + 1], upper[index + 2]);
if (!ground[index + 3]) return null;
if (tile.key.startsWith('grass') || tile.key === 'dirt1') return getTileShadowColor(scene, tile);
return shadeColor(ground[index], ground[index + 1], ground[index + 2]);
}
function getTileShadowColor(scene, tile) {
return shadeColor(...getDominantColor(scene, tile.key));
}
const activeParticles = [];
function kickUpDust(scene, time, moveX, moveY) {
const footX = character.x + CHARACTER_SIZE / 2;
const footY = character.y + CHARACTER_SIZE - 1;
const tileX = Math.floor(footX / TILE_SIZE);
const tileY = Math.floor(footY / TILE_SIZE);
const terrain = getTerrainType(tileX, tileY);
const colors = getWorldTile(tileX, tileY).key.startsWith('wood') ? null
: terrain === 'dirt' ? DUST_COLORS
: terrain === 'grass' && characterPace > 1 ? GRASS_FLECK_COLORS
: null;
if (!colors) return;
for (let index = 0; index < (colors === DUST_COLORS ? DUST_PER_STEP : GRASS_FLECKS_PER_STEP); index++) {
const side = index % 2 === 0 ? -1 : 1;
const spread = Math.floor(Math.random() * 2);
const offsetX = moveX !== 0 ? -moveX * (5 + spread + index) : side * (5 + spread);
const offsetY = moveY < 0 ? 1 + spread : moveX !== 0 ? -spread : -1 - spread;
spawnParticle(
scene, shadowLayer, time, Math.round(footX + offsetX), footY + offsetY,
moveX !== 0 ? -moveX : side, -1, DUST_LIFETIME, colors[index % colors.length]
);
}
}
function dropLeaves(scene, time, bush) {
for (let index = 0; index < LEAVES_PER_RUSTLE; index++) {
spawnParticle(
scene, worldObjectLayer, time,
bush.x + BUSH_FOOTPRINT_LEFT + Math.floor(Math.random() * (BUSH_FOOTPRINT_RIGHT - BUSH_FOOTPRINT_LEFT)),
bush.y - BUSH_FOOTPRINT_HEIGHT + Math.floor(Math.random() * 4),
Math.random() < 0.5 ? -1 : 1, 1, LEAF_LIFETIME,
LEAF_COLORS[index % LEAF_COLORS.length], bush.y + 1
);
}
}
function spawnParticle(scene, layer, born, x, y, drift, rise, lifetime, color, depth = 0, directionX = 0, directionY = 0, ring = false) {
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
image.particleBorn = born;
image.particleX = x;
image.particleY = y;
image.particleDrift = drift;
image.particleRise = rise;
image.particleLifetime = lifetime;
image.particleDirectionX = directionX;
image.particleDirectionY = directionY;
image.particleRing = ring;
image.activeParticleIndex = activeParticles.length;
activeParticles.push(image);
image
.setTint(color)
.setDepth(depth)
.setPosition(x, y)
.setActive(true)
.setVisible(true);
}
function updateParticles(time) {
for (let index = activeParticles.length - 1; index >= 0; index--) {
const image = activeParticles[index];
const age = time - image.particleBorn;
if (age >= image.particleLifetime) {
releaseParticle(image);
continue;
}
const step = Math.floor(age / (image.particleLifetime / 3));
if (image.particleRing) {
const radius = 2 + step * 2;
image.setPosition(
image.particleX + Math.round(image.particleDirectionX * radius),
image.particleY + Math.round(image.particleDirectionY * radius * 0.5)
);
} else {
image.setPosition(
image.particleX + (step > 1 ? image.particleDrift : 0),
image.particleY + step * image.particleRise
);
}
}
}
function releaseParticle(image) {
if (!image.active) return;
const index = image.activeParticleIndex;
const last = activeParticles.pop();
if (last !== image) {
activeParticles[index] = last;
last.activeParticleIndex = index;
}
image.activeParticleIndex = -1;
image.setActive(false).setVisible(false);
availableParticles.push(image);
}
function updateBushRustle(scene, time, isWalking) {
const left = character.x + CHARACTER_HITBOX_X;
const top = character.y + CHARACTER_HITBOX_Y;
const right = left + CHARACTER_HITBOX_WIDTH;
const bottom = top + CHARACTER_HITBOX_HEIGHT;
for (const chunk of loadedChunks.values()) {
if (!chunk.visible) continue;
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
const fishMigrations = [];
let fishRegionStack;
let fishRegionPixels;
function getChunkPixelIndex(chunk, x, y) {
const localX = Math.floor(x) - chunk.pixelX;
const localY = Math.floor(y) - chunk.pixelY;
return localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE
? -1
: localY * CHUNK_PIXEL_SIZE + localX;
}
function queueFishMigration(chunk, fish) {
if (getChunkPixelIndex(chunk, fish.x, fish.y) !== -1) return;
const targetChunk = getFishChunkAt(fish.x, fish.y);
if (targetChunk && targetChunk !== chunk && loadedWaterChunks.has(targetChunk)) {
fishMigrations.push(chunk, targetChunk, fish);
}
}
function getFishDepth(chunk, x, y) {
const index = getChunkPixelIndex(chunk, x, y);
return index === -1 ? 0 : chunk.shoreDistances[index];
}
function getFishChunkAt(x, y) {
return loadedChunks.get(getChunkKey(Math.floor(x / CHUNK_PIXEL_SIZE), Math.floor(y / CHUNK_PIXEL_SIZE)));
}
function getFishRegionAt(chunk, x, y) {
const index = chunk?.fishRegions ? getChunkPixelIndex(chunk, x, y) : -1;
return index === -1 ? 0 : chunk.fishRegions[index];
}
function canFishSwim(chunk, fish, x, y) {
const ownIndex = getChunkPixelIndex(chunk, x, y);
const targetChunk = ownIndex !== -1 ? chunk : getFishChunkAt(x, y);
const index = ownIndex !== -1 ? ownIndex : targetChunk?.fishRegions ? getChunkPixelIndex(targetChunk, x, y) : -1;
if (index === -1 || !targetChunk.fishRegions || targetChunk.shoreDistances[index] < FISH_MIN_DEPTH + fish.radius) {
return false;
}
const targetRegion = targetChunk.fishRegions[index];
return targetRegion > 0 && (targetChunk !== chunk || targetRegion === fish.region);
}
function labelFishRegions(chunk) {
const size = CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE;
const labels = new Uint16Array(size);
const deep = pixel => !labels[pixel] && chunk.shoreDistances[pixel] >= FISH_MIN_DEPTH;
const regions = [];
let pixelCount = 0;
fishRegionStack ||= new Int32Array(size);
fishRegionPixels ||= new Uint32Array(size);
for (let start = 0; start < size; start++) {
if (!deep(start)) continue;
const label = regions.length + 1;
const regionStart = pixelCount;
let top = 0;
const visit = pixel => {
labels[pixel] = label;
fishRegionStack[top++] = pixel;
};
visit(start);
while (top > 0) {
const pixel = fishRegionStack[--top];
const x = pixel % CHUNK_PIXEL_SIZE;
fishRegionPixels[pixelCount++] = pixel;
if (x > 0 && deep(pixel - 1)) visit(pixel - 1);
if (x < CHUNK_PIXEL_SIZE - 1 && deep(pixel + 1)) visit(pixel + 1);
if (pixel >= CHUNK_PIXEL_SIZE && deep(pixel - CHUNK_PIXEL_SIZE)) visit(pixel - CHUNK_PIXEL_SIZE);
if (pixel < size - CHUNK_PIXEL_SIZE && deep(pixel + CHUNK_PIXEL_SIZE)) visit(pixel + CHUNK_PIXEL_SIZE);
}
regions.push({ start: regionStart, length: pixelCount - regionStart });
}
chunk.fishRegions = labels;
return regions;
}
function isFishPathClear(chunk, fish, targetX, targetY) {
const dx = targetX - fish.x;
const dy = targetY - fish.y;
const distance = Math.hypot(dx, dy);
const steps = Math.ceil(distance / 3);
for (let step = 1; step <= steps; step++) {
if (!canFishSwim(chunk, fish, fish.x + dx * step / steps, fish.y + dy * step / steps)) return false;
}
return true;
}
function spawnChunkFish(chunk) {
const regions = labelFishRegions(chunk);
for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
const region = regions[regionIndex];
if (region.length < FISH_MIN_REGION) continue;
const count = Math.min(FISH_PER_CHUNK_MAX - chunk.fish.length, Math.max(1, Math.floor(region.length / FISH_WATER_PER_FISH)));
spawnRegionFish(chunk, region, regionIndex + 1, count, chunk.pixelX, chunk.pixelY);
}
}
function chooseFishSpecies(waterArea) {
let totalWeight = 0;
for (const species of FISH_SPECIES) {
if (waterArea >= species.minWater) totalWeight += species.weight;
}
let roll = Math.random() * totalWeight;
for (const species of FISH_SPECIES) {
if (waterArea < species.minWater) continue;
roll -= species.weight;
if (roll <= 0) return species;
}
return FISH_SPECIES[0];
}
function createFish(species, giantScale) {
const sizeDefinition = FISH_SIZE_CLASSES[species.size];
const giant = species.size === 'giant';
return {
x: 0,
y: 0,
length: giant ? FISH_SIZE_CLASSES.large.length * giantScale : sizeDefinition.length,
radius: giant ? FISH_SIZE_CLASSES.large.radius * giantScale : sizeDefinition.radius,
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
region: 0,
size: species.size,
species
};
}
function spawnRegionFish(chunk, region, label, count, originX, originY) {
for (let index = 0; index < count; index++) {
const species = chooseFishSpecies(region.length);
const fish = createFish(species, 2 + Math.random() * 3);
fish.region = label;
for (let attempt = 0; attempt < 40; attempt++) {
const pixel = fishRegionPixels[region.start + Math.floor(Math.random() * region.length)];
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
function spawnSturgeonAtCursor(scene) {
const pointer = scene.input.activePointer;
pointer.updateWorldPoint(mainCamera);
const x = pointer.worldX;
const y = pointer.worldY;
const chunk = getFishChunkAt(x, y);
const region = getFishRegionAt(chunk, x, y);
if (!region) {
showItemLabel(scene, 'No fish water there');
return;
}
const species = FISH_SPECIES_BY_ID.get('sturgeon');
for (let scale = 5; scale >= 1; scale -= 0.5) {
const fish = createFish(species, scale);
fish.region = region;
if (canFishSwim(chunk, fish, x, y)) {
fish.x = x;
fish.y = y;
chunk.fish.push(fish);
showItemLabel(scene, 'Spawned a Sturgeon');
return;
}
}
showItemLabel(scene, 'Too shallow for a Sturgeon');
}
function chooseFishTarget(chunk, fish, awayX, awayY) {
for (let attempt = 0; attempt < 8; attempt++) {
const fleeing = awayX !== undefined;
const angle = fleeing ? Math.atan2(awayY, awayX) + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2;
const distance = fleeing ? 28 + Math.random() * 20 : 12 + Math.random() * 34;
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
function setFishIdle(fish, timer) {
fish.state = 'idle';
fish.thrusting = false;
fish.timer = timer;
}
function moveFishForward(chunk, fish, seconds) {
const nextX = fish.x + Math.cos(fish.heading) * fish.velocity * seconds;
const nextY = fish.y + Math.sin(fish.heading) * fish.velocity * seconds;
if (!canFishSwim(chunk, fish, nextX, nextY)) return false;
fish.x = nextX;
fish.y = nextY;
return true;
}
function turnFishToward(fish, heading, maxTurn) {
const turn = Math.atan2(Math.sin(heading - fish.heading), Math.cos(heading - fish.heading));
fish.heading += Phaser.Math.Clamp(turn, -maxTurn, maxTurn);
return turn;
}
function startFishFlee(fish, burst) {
fish.state = 'flee';
fish.topSpeed = FISH_FLEE_SPEED;
fish.thrusting = true;
fish.burstTimer = burst;
}
function animateFishTail(fish, seconds, beat, sweep, response) {
fish.phase = (fish.phase + Math.PI * 2 * beat * seconds) % (Math.PI * 2);
fish.amplitude += (fish.length * sweep - fish.amplitude) * Math.min(1, seconds * response);
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
startFishFlee(fish, 700);
}
}
}
function updateHookedFish(fish, seconds, delta) {
const scene = mainCamera.scene;
const spin = fishing.spin || (fishing.spin = {
angle: Math.atan2(fish.y - fishing.toY, fish.x - fishing.toX),
direction: Math.random() < 0.5 ? -1 : 1,
centerX: fishing.toX,
centerY: fishing.toY,
splashTimer: 0
});
const progress = fishing.game ? fishing.game.progress : 0;
const [tipX, tipY] = getRodTip();
const pull = progress * HOOKED_REEL_PULL;
const targetX = fishing.toX + (tipX - fishing.toX) * pull;
const targetY = fishing.toY + (tipY - fishing.toY) * pull;
const nextCenterX = spin.centerX + (targetX - spin.centerX) * Math.min(1, seconds * 2);
const nextCenterY = spin.centerY + (targetY - spin.centerY) * Math.min(1, seconds * 2);
if (isWaterPixel(scene, Math.round(nextCenterX), Math.round(nextCenterY))) {
spin.centerX = nextCenterX;
spin.centerY = nextCenterY;
}
if (Math.random() < seconds * HOOKED_THRASH_RATE) spin.direction *= -1;
const radius = HOOKED_RADIUS_BASE + fish.length * HOOKED_RADIUS_PER_LENGTH;
const speed = Phaser.Math.Clamp(HOOKED_SPIN_BASE - fish.length * HOOKED_SPIN_PER_LENGTH, HOOKED_SPIN_MIN, HOOKED_SPIN_BASE);
spin.angle += spin.direction * speed * seconds;
const nextX = spin.centerX + Math.cos(spin.angle) * radius;
const nextY = spin.centerY + Math.sin(spin.angle) * radius * HOOKED_SQUASH;
if (isWaterPixel(scene, Math.round(nextX), Math.round(nextY))) {
fish.x = nextX;
fish.y = nextY;
}
fish.heading = Math.atan2(
Math.cos(spin.angle) * radius * HOOKED_SQUASH * spin.direction,
-Math.sin(spin.angle) * radius * spin.direction
);
fish.thrusting = true;
fish.velocity = speed * radius;
animateFishTail(fish, seconds, HOOKED_BEAT, HOOKED_SWEEP, 8);
spin.splashTimer -= delta;
if (spin.splashTimer <= 0) {
spin.splashTimer = HOOKED_SPLASH_MIN + Math.random() * HOOKED_SPLASH_RANGE;
splash(scene, scene.time.now, Math.round(fish.x - Math.cos(fish.heading) * fish.length * 0.5), Math.round(fish.y - Math.sin(fish.heading) * fish.length * 0.5));
}
}
function getHookedBobber() {
const fish = fishing.targetFish;
if (!fish || !fishing.spin) return null;
hookedBobberPosition[0] = Math.round(fish.x + Math.cos(fish.heading) * fish.length * 0.5);
hookedBobberPosition[1] = Math.round(fish.y + Math.sin(fish.heading) * fish.length * 0.5) + 1;
return hookedBobberPosition;
}
function updateLuredFish(chunk, fish, delta) {
if (!fishing || fishing.targetFish !== fish) {
setFishIdle(fish, FISH_IDLE_MIN);
return false;
}
const seconds = Math.min(delta, 50) / 1000;
if (fishing.state === 'hooked' || fishing.state === 'minigame') {
updateHookedFish(fish, seconds, delta);
return true;
}
const dx = fishing.bobberX - fish.x;
const dy = fishing.bobberY - fish.y;
const stopDistance = fish.radius + 3;
let targetHeading = Math.atan2(dy, dx);
fish.lureTime = (fish.lureTime || 0) + delta;
if (fishing.state === 'inspecting' || fishing.state === 'nibbleWait' || fishing.state === 'nibbleDip' || fishing.state === 'bite') {
targetHeading += Math.sin(fish.lureTime / 180) * 0.32;
fish.thrusting = false;
fish.velocity *= Math.exp(-5 * seconds);
} else {
const pulsing = Math.floor(fish.lureTime / FISH_LURE_PULSE_TIME) % 2 === 0;
fish.thrusting = pulsing;
fish.velocity += pulsing ? FISH_ACCELERATION * 0.55 * seconds : 0;
fish.velocity = Math.min(FISH_LURE_SPEED * getBaitLure(), fish.velocity);
fish.velocity *= Math.exp(-(pulsing ? FISH_DRAG : FISH_COAST_DRAG * 1.8) * seconds);
}
turnFishToward(fish, targetHeading, FISH_LURE_TURN * seconds);
if (dx * dx + dy * dy > stopDistance * stopDistance && fish.velocity > 0.05) {
moveFishForward(chunk, fish, seconds);
}
animateFishTail(
fish, seconds,
fish.thrusting ? FISH_BEAT_THRUST + fish.velocity * 0.12 : FISH_BEAT_IDLE,
fish.thrusting ? FISH_SWEEP_THRUST : FISH_SWEEP_IDLE,
6
);
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
function updateIdleFish(chunk, fish, seconds, delta) {
fish.timer -= delta;
fish.heading += fish.idleTurn * seconds;
if (fish.timer <= 0 && !chooseFishTarget(chunk, fish)) {
fish.timer = 500;
} else if (fish.timer <= 0) {
fish.state = 'swim';
fish.topSpeed = FISH_SWIM_SPEED * (0.7 + Math.random() * 0.6);
fish.thrusting = true;
fish.burstTimer = FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE;
}
}
function updateSwimmingFish(chunk, fish, seconds, delta) {
fish.burstTimer -= delta;
if (fish.burstTimer <= 0 && fish.state === 'swim') {
fish.thrusting = !fish.thrusting;
fish.burstTimer = fish.thrusting ? FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE : FISH_COAST_MIN + Math.random() * FISH_COAST_RANGE;
} else if (fish.burstTimer <= 0) {
fish.state = 'swim';
fish.topSpeed = FISH_SWIM_SPEED;
}
const dx = fish.targetX - fish.x;
const dy = fish.targetY - fish.y;
if (dx * dx + dy * dy < 4) {
setFishIdle(fish, FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE);
fish.idleTurn = (Math.random() - 0.5) * FISH_IDLE_TURN;
} else {
const maxTurn = (fish.state === 'flee' ? FISH_FLEE_TURN : FISH_TURN) * seconds *
(0.4 + Math.min(1, fish.velocity / FISH_SWIM_SPEED) * 0.6);
const turn = turnFishToward(fish, Math.atan2(dy, dx), maxTurn);
if (fish.thrusting && Math.cos(turn) > 0) {
const acceleration = fish.state === 'flee' ? FISH_FLEE_ACCELERATION : FISH_ACCELERATION;
fish.velocity = Math.min(fish.topSpeed, fish.velocity + acceleration * seconds);
}
}
}
function updateFish(delta) {
const seconds = Math.min(delta, 50) / 1000;
const thrustDrag = Math.exp(-FISH_DRAG * seconds);
const coastDrag = Math.exp(-FISH_COAST_DRAG * seconds);
const playerX = character.x + CHARACTER_SIZE / 2;
const playerY = character.y + CHARACTER_SIZE - 2;
const running = characterPace > 1 && characterMoving;
fishMigrations.length = 0;
for (const chunk of loadedWaterChunks) {
for (const fish of chunk.fish) {
if (fish.state === 'lure' && updateLuredFish(chunk, fish, delta)) {
queueFishMigration(chunk, fish);
continue;
}
const awayX = fish.x - playerX;
const awayY = fish.y - playerY;
if (running && fish.state !== 'flee' && awayX * awayX + awayY * awayY < FISH_SCARE_DISTANCE_SQUARED && chooseFishTarget(chunk, fish, awayX, awayY)) {
startFishFlee(fish, 900);
}
if (fish.state === 'idle') {
updateIdleFish(chunk, fish, seconds, delta);
} else {
updateSwimmingFish(chunk, fish, seconds, delta);
}
fish.velocity *= fish.thrusting ? thrustDrag : coastDrag;
const beat = fish.thrusting
? FISH_BEAT_THRUST + fish.velocity * 0.12
: fish.state === 'idle' ? FISH_BEAT_IDLE : FISH_BEAT_COAST;
const sweep = fish.thrusting
? (fish.state === 'flee' ? FISH_SWEEP_FLEE : FISH_SWEEP_THRUST)
: fish.state === 'idle' ? FISH_SWEEP_IDLE : FISH_SWEEP_COAST;
animateFishTail(fish, seconds, beat, sweep, 6);
if (!moveFishForward(chunk, fish, seconds)) {
fish.velocity = 0;
setFishIdle(fish, FISH_IDLE_MIN);
}
queueFishMigration(chunk, fish);
}
}
for (let index = 0; index < fishMigrations.length; index += 3) {
migrateFishToChunk(fishMigrations[index], fishMigrations[index + 1], fishMigrations[index + 2]);
}
}
function hasRodSelected() {
return (hotbarItemNames[selectedHotbarSlot] || '').endsWith('Rod');
}
const castDirections = { left: [-1, 0], right: [1, 0], back: [0, -1], front: [0, 1] };
const waterFishingStates = new Set([
'floating', 'landing', 'approaching', 'inspecting', 'nibbleWait', 'nibbleDip', 'bite', 'hooked', 'minigame', 'snagged'
]);
const rodHandPosition = new Int32Array(2);
const rodTipPosition = new Int32Array(2);
const hookedBobberPosition = new Int32Array(2);
let fishingMinigameVisible = false;
function getSelectedRod() {
return MARKET_RODS_BY_LABEL.get(hotbarItemNames[selectedHotbarSlot]) || MARKET_RODS[0];
}
function getCastDirection() {
return castDirections[characterDirection] || castDirections.front;
}
function getRodHand() {
const [directionX, directionY] = getCastDirection();
const centerX = Math.round(character.x + CHARACTER_SIZE / 2);
rodHandPosition[0] = centerX + (directionY === 0 ? directionX * 3 : 3);
rodHandPosition[1] = Math.round(character.y) + 11;
return rodHandPosition;
}
function getRodTip(time) {
const [directionX, directionY] = getCastDirection();
const [handX, handY] = getRodHand();
rodTipPosition[0] = directionY === 0 ? handX + directionX * 6 : handX + 1;
rodTipPosition[1] = directionY === 0 ? handY - 6 : handY + directionY * 7;
if (!fishing || time === undefined) return rodTipPosition;
if (fishing.state === 'casting') {
const phase = Phaser.Math.Clamp((time - fishing.start) / CAST_SWING_DURATION, 0, 1);
const reach = phase < 0.35 ? -3 * phase / 0.35 : -3 + 6 * (phase - 0.35) / 0.65;
const lift = Math.round(Math.sin(phase * Math.PI) * 3);
rodTipPosition[0] += Math.round(directionX * reach + (directionY === 0 ? 0 : lift));
rodTipPosition[1] += Math.round(directionY * reach - (directionY === 0 ? lift : 0));
} else if (waterFishingStates.has(fishing.state)) {
const wobble = Math.sin((time - fishing.start) / 95 + fishing.driftPhase);
rodTipPosition[0] += directionY === 0 ? 0 : Math.round(wobble);
rodTipPosition[1] += directionY === 0 ? Math.round(wobble) : 0;
}
return rodTipPosition;
}
function isWaterPixel(scene, x, y) {
const tileX = Math.floor(x / TILE_SIZE);
const tileY = Math.floor(y / TILE_SIZE);
const tile = getWorldTile(tileX, tileY);
return getTerrainSurface(scene, tile).water[(y - tileY * TILE_SIZE) * TILE_SIZE + x - tileX * TILE_SIZE] === 1;
}
function getBaitLure() {
return fishing?.bait ? fishing.bait.lure : 1;
}
function findFishForBobber() {
const lure = getBaitLure();
const noticeMaxDistanceSquared = FISH_NOTICE_MAX_DISTANCE_SQUARED * lure * lure;
const noticeDot = FISH_NOTICE_DOT - (lure - 1) * 0.8;
let nearestFish = null;
let nearestChunk = null;
let nearestDistanceSquared = Infinity;
for (const chunk of loadedWaterChunks) {
for (const fish of chunk.fish) {
if (fish.state === 'flee' || fish.state === 'lure') continue;
const dx = fishing.bobberX - fish.x;
const dy = fishing.bobberY - fish.y;
const distanceSquared = dx * dx + dy * dy;
if (distanceSquared < FISH_NOTICE_MIN_DISTANCE_SQUARED || distanceSquared > noticeMaxDistanceSquared) continue;
if (!(distanceSquared < nearestDistanceSquared)) continue;
const facing = (Math.cos(fish.heading) * dx + Math.sin(fish.heading) * dy) / Math.sqrt(distanceSquared);
if (facing >= noticeDot && isFishPathClear(chunk, fish, fishing.bobberX, fishing.bobberY)) {
nearestFish = fish;
nearestChunk = chunk;
nearestDistanceSquared = distanceSquared;
}
}
}
return nearestFish ? { fish: nearestFish, chunk: nearestChunk } : null;
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
startFishFlee(fish, 900);
return;
}
fish.velocity = 0;
setFishIdle(fish, FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE);
}
function hookFish(time) {
if (!fishing || fishing.state !== 'bite' || time > fishing.biteDeadline) return false;
setFishingState('hooked', time);
fishing.bobberY = fishing.toY + 2;
useBait(fishing.bait);
return true;
}
function beginCast(time) {
const active = fishing;
if (fishing?.state === 'snagged') {
haulChest(time);
} else if (fishing && fishing.state !== 'minigame' && fishing.state !== 'hooked' && !hookFish(time)) {
reelIn(time);
}
if (active || !hasRodSelected() || isMenuOpen() || castCharge) return;
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
if (!hasRodSelected() || isMenuOpen()) return;
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
bait: getActiveBait(),
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
setCharacterTexture(`character-${characterDirection}`);
}
function drawCastCharge(time) {
if (!castCharge) return;
const power = getCastPower(time);
const palette = castCharge.rod.polePalette || [0x78afd3, 0xd1edf1];
const x = Math.round(character.x + CHARACTER_SIZE / 2 - CAST_METER_WIDTH / 2);
const y = Math.round(character.y) - 5;
const filled = Math.round((CAST_METER_WIDTH - 2) * power);
fishingLine.setDepth(character.depth + 1)
.fillStyle(0x230a03, 1)
.fillRect(x, y, CAST_METER_WIDTH, 4)
.fillStyle(0x36160d, 1)
.fillRect(x + 1, y + 1, CAST_METER_WIDTH - 2, 2)
.fillStyle(power > 0.9 ? palette[palette.length - 1] : palette[1] || palette[0], 1)
.fillRect(x + 1, y + 1, filled, 2);
}
function reelIn(time) {
if (!fishing || fishing.state === 'reeling') return;
if (fishing.state === 'casting') {
fishing = null;
return;
}
releaseTargetFish(true);
startReeling(time);
}
function startReeling(time) {
setFishingState('reeling', time);
fishing.fromX = fishing.bobberX;
fishing.fromY = fishing.bobberY;
}
function splash(scene, time, x, y) {
scatterFishFromSplash(x, y);
for (let index = 0; index < SPLASH_PARTICLES; index++) {
const angle = index / SPLASH_PARTICLES * Math.PI * 2;
spawnParticle(
scene, shadowLayer, time, Math.round(x), Math.round(y), 0, 0, SPLASH_LIFETIME,
index % 2 ? 0x87bed8 : 0x78afd3, 0, Math.cos(angle), Math.sin(angle), true
);
}
}
function groundLandingPuff(scene, time, x, y) {
for (let index = 0; index < 3; index++) {
spawnParticle(scene, shadowLayer, time, x - 1 + index, y, index - 1, -1, 220, DUST_COLORS[index]);
}
}
function nibbleRipple(scene, time, x, y) {
for (let index = 0; index < 4; index++) {
const horizontal = index < 2;
const side = index % 2 === 0 ? -1 : 1;
spawnParticle(
scene, shadowLayer, time,
x + (horizontal ? side * 2 : 0), y + (horizontal ? 0 : side),
horizontal ? side : 0, 0, 180, index % 2 ? 0x78afd3 : 0x87bed8
);
}
}
function startFishApproach(time) {
const match = findFishForBobber();
if (!match) {
if (fishing.state !== 'floating') fishing.start = time;
fishing.state = 'floating';
fishing.nextFishScanAt = time + FISH_NOTICE_SCAN_TIME;
return;
}
setFishingState('approaching', time);
fishing.targetFish = match.fish;
fishing.targetChunk = match.chunk;
match.fish.state = 'lure';
match.fish.lureTime = 0;
match.fish.velocity *= 0.4;
}
function addCaughtFish(species) {
fishInventory.set(species.id, (fishInventory.get(species.id) || 0) + 1);
catchLog.add(species.id);
saveDirty = true;
}
function startFishBite(scene, time) {
setFishingState('bite', time);
fishing.biteDeadline = time + Phaser.Math.Linear(1050, 720, FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty);
splash(scene, time, fishing.bobberX, fishing.bobberY);
}
function createFishingUI(scene) {
const catchZoneTexture = scene.textures.get('fishing-catch-zone');
const hudImage = (key, frame, depth, origin = 0) => scene.add.image(0, 0, key, frame)
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
}
function startFishingMinigame(time) {
const zoneHeight = fishing.rod.catchZone + (fishing.bait ? fishing.bait.zoneBonus : 0);
const zoneY = FISHING_GAME_PLAY_HEIGHT - zoneHeight;
const fishY = zoneY + zoneHeight / 2;
setFishingState('minigame', time);
fishing.game = {
zoneY,
zoneHeight,
zoneVelocity: 0,
fishY,
fishVelocity: 0,
fishTargetY: fishY,
targetTimer: 0,
difficulty: FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty,
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
addCaughtFish(species);
fishing.targetFish = null;
fishing.targetChunk = null;
startReeling(time);
showCatchCard(scene, time, species);
}
function spawnLineSnap(scene, time, rope) {
if (!rope || !rope.points.length) return;
const stride = Math.max(1, Math.floor(rope.points.length / 9));
for (let index = stride; index < rope.points.length; index += stride) {
const point = rope.points[index];
const amount = index / Math.max(1, rope.points.length - 1);
const color = samplePalette(fishing?.rod?.linePalette, 1 - Math.abs(amount * 2 - 1));
spawnParticle(
scene, worldObjectLayer, time, Math.round(point.x), Math.round(point.y),
index % 2 ? -1 : 1, 1, 300, color, Math.max(character.depth + 0.2, point.y)
);
}
}
function updateFishingMinigame(scene, time, delta) {
const game = fishing.game;
const seconds = Math.min(delta, 34) / 1000;
const difficulty = game.difficulty;
const fishHalfHeight = fishingFishMarker.height / 2;
const fishMaxSpeed = Phaser.Math.Linear(28, 72, difficulty);
game.zoneVelocity += (fishingActionHeld ? -185 : 150) * seconds;
game.zoneVelocity = Phaser.Math.Clamp(game.zoneVelocity * Math.exp(-2.4 * seconds), -72, 82);
game.zoneY += game.zoneVelocity * seconds;
if (game.zoneY < 0) {
game.zoneY = 0;
game.zoneVelocity = Math.max(0, game.zoneVelocity * -0.25);
} else if (game.zoneY + game.zoneHeight > FISHING_GAME_PLAY_HEIGHT) {
game.zoneY = FISHING_GAME_PLAY_HEIGHT - game.zoneHeight;
game.zoneVelocity = Math.min(0, game.zoneVelocity * -0.3);
}
game.targetTimer -= delta;
if (game.targetTimer <= 0) {
game.fishTargetY = 4 + Math.random() * (FISHING_GAME_PLAY_HEIGHT - 8);
game.targetTimer = Math.max(90, Phaser.Math.Linear(780, 230, difficulty)) * (0.65 + Math.random() * 0.7);
}
game.fishVelocity += Math.sign(game.fishTargetY - game.fishY) * Phaser.Math.Linear(75, 220, difficulty) * seconds;
game.fishVelocity *= Math.exp(-Phaser.Math.Linear(5, 2.4, difficulty) * seconds);
game.fishVelocity = Phaser.Math.Clamp(game.fishVelocity, -fishMaxSpeed, fishMaxSpeed);
game.fishY = Phaser.Math.Clamp(game.fishY + game.fishVelocity * seconds, fishHalfHeight, FISHING_GAME_PLAY_HEIGHT - fishHalfHeight);
const inside = game.fishY >= game.zoneY && game.fishY <= game.zoneY + game.zoneHeight;
const rate = inside
? Phaser.Math.Linear(0.28, 0.17, difficulty)
: -Phaser.Math.Linear(0.19, 0.35, difficulty) / fishing.rod.lineStrength;
game.progress = Phaser.Math.Clamp(game.progress + rate * seconds, 0, 1);
if (game.progress >= 1 || game.progress <= 0) finishFishingMinigame(scene, time, game.progress >= 1);
}
function drawFishingMinigame() {
if (!fishing || fishing.state !== 'minigame') {
if (!fishingMinigameVisible) return;
fishingMinigameVisible = false;
for (const part of fishingUiParts) part.setVisible(false);
return;
}
const gameState = fishing.game;
const playX = FISHING_GAME_X + 5;
const playY = FISHING_GAME_Y + FISHING_GAME_PLAY_TOP;
const progressHeight = Math.max(1, Math.round(FISHING_GAME_PLAY_HEIGHT * gameState.progress));
const zoneY = playY + Math.round(gameState.zoneY);
const zoneHeight = Math.round(gameState.zoneHeight);
if (!fishingMinigameVisible) {
fishingMinigameVisible = true;
for (const part of fishingUiParts) part.setVisible(true);
}
fishingCatchZoneTop.setPosition(playX, zoneY);
fishingCatchZoneMiddle.setPosition(playX, zoneY + 3).setDisplaySize(8, Math.max(1, zoneHeight - 6));
fishingCatchZoneBottom.setPosition(playX, zoneY + zoneHeight - 3);
fishingFishMarker.setPosition(playX + 4, playY + Math.round(gameState.fishY));
fishingProgressFill
.setCrop(0, FISHING_GAME_PLAY_HEIGHT - progressHeight, FISHING_GAME_PROGRESS_WIDTH, progressHeight)
.setPosition(FISHING_GAME_X + 17, playY);
}
function samplePalette(palette, amount) {
if (!palette || palette.length === 0) return FISHING_LINE_COLOR;
return palette[Math.round(Phaser.Math.Clamp(amount, 0, 1) * (palette.length - 1))];
}
function beginPixelPath() {
pixelPathLength = 0;
}
function addPixelPathPoint(x, y, color) {
if (pixelPathLength > 0 && pixelPathX[pixelPathLength - 1] === x && pixelPathY[pixelPathLength - 1] === y) {
return;
}
if (pixelPathLength >= 2) {
const previousX = pixelPathX[pixelPathLength - 2];
const previousY = pixelPathY[pixelPathLength - 2];
if (Math.abs(x - previousX) === 1 && Math.abs(y - previousY) === 1) {
pixelPathLength--;
}
}
if (pixelPathLength >= pixelPathX.length) {
return;
}
pixelPathX[pixelPathLength] = x;
pixelPathY[pixelPathLength] = y;
pixelPathColor[pixelPathLength] = color;
pixelPathLength++;
}
function drawPixelPath() {
let activeColor = -1;
for (let index = 0; index < pixelPathLength; index++) {
if (pixelPathColor[index] !== activeColor) {
activeColor = pixelPathColor[index];
fishingLine.fillStyle(activeColor, 1);
}
fishingLine.fillRect(pixelPathX[index], pixelPathY[index], 1, 1);
}
}
function plotFishingLine(fromX, fromY, toX, toY, sag, palette) {
const controlX = (fromX + toX) / 2;
const controlY = (fromY + toY) / 2 + sag;
const steps = Math.max(2, Math.ceil(Math.hypot(toX - fromX, toY - fromY) * 1.5));
const color = palette ? 0 : fishingLine.defaultFillColor;
beginPixelPath();
for (let step = 0; step <= steps; step++) {
const amount = step / steps;
const inverse = 1 - amount;
const x = Math.round(inverse * inverse * fromX + 2 * inverse * amount * controlX + amount * amount * toX);
const y = Math.round(inverse * inverse * fromY + 2 * inverse * amount * controlY + amount * amount * toY);
addPixelPathPoint(x, y, palette ? samplePalette(palette, amount) : color);
}
drawPixelPath();
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
const points = rope.points;
const lastIndex = points.length - 1;
const seconds = Math.min(delta, 34) / 1000;
const gravity = ROPE_GRAVITY * seconds * seconds;
const targetLength = Math.max(Math.hypot(toX - fromX, toY - fromY) + (1 - tautness) * 7, ROPE_SEGMENT_LENGTH);
rope.length += (targetLength - rope.length) * Math.min(1, seconds * (tautness ? 14 : 5));
rope.segmentLength = rope.length / lastIndex;
const segmentLength = rope.segmentLength;
for (let index = 1; index < lastIndex; index++) {
const point = points[index];
const velocityX = (point.x - point.oldX) * 0.985;
const velocityY = (point.y - point.oldY) * 0.985;
point.oldX = point.x;
point.oldY = point.y;
point.x += velocityX;
point.y += velocityY + gravity;
}
for (let pass = 0; pass < ROPE_CONSTRAINT_PASSES; pass++) {
points[0].x = fromX;
points[0].y = fromY;
points[lastIndex].x = toX;
points[lastIndex].y = toY;
for (let index = 0; index < lastIndex; index++) {
const first = points[index];
const second = points[index + 1];
const dx = second.x - first.x;
const dy = second.y - first.y;
const distance = Math.max(0.001, Math.hypot(dx, dy));
const correction = (distance - segmentLength) / distance;
const firstFixed = index === 0;
const secondFixed = index + 1 === lastIndex;
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
function drawFishingRope(rope, palette) {
const points = rope.points;
const lastIndex = points.length - 1;
const paletteSteps = Math.max(1, lastIndex - 1);
beginPixelPath();
for (let index = 0; index < lastIndex; index++) {
const first = points[index];
const second = points[index + 1];
const distance = Math.max(1, Math.ceil(Math.hypot(second.x - first.x, second.y - first.y)));
const amount = index / paletteSteps;
const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));
for (let step = 0; step <= distance; step++) {
const blend = step / distance;
addPixelPathPoint(
Math.round(first.x + (second.x - first.x) * blend),
Math.round(first.y + (second.y - first.y) * blend),
color
);
}
}
drawPixelPath();
}
function setFishingState(state, time) {
fishing.state = state;
fishing.start = time;
}
function resumeFloating(time) {
setFishingState('floating', time);
fishing.nextFishScanAt = time + FISH_NOTICE_SCAN_TIME;
}
function updateWaterFishing(scene, time, delta) {
const age = time - fishing.start;
const state = fishing.state;
const candidateX = fishing.toX + Math.round(Math.sin(age / 1300 + fishing.driftPhase));
const candidateY = fishing.toY + Math.round(Math.sin(age / 1700 + fishing.driftPhase * 0.7));
const drifts = state !== 'bite' && state !== 'hooked' && state !== 'snagged' && isWaterPixel(scene, candidateX, candidateY);
fishing.bobberX = drifts ? candidateX : fishing.toX;
fishing.bobberY = (drifts ? candidateY : fishing.toY) + (Math.floor(age / BOBBER_BOB_TIME) % 2);
if (state === 'floating' && time >= (fishing.nextFishScanAt || 0)) {
startFishApproach(time);
} else if (state === 'approaching') {
const fish = fishing.targetFish;
if (!fish || fish.state !== 'lure') {
releaseTargetFish(false);
resumeFloating(time);
} else if (Math.hypot(fish.x - fishing.bobberX, fish.y - fishing.bobberY) <= fish.radius + 4) {
setFishingState('inspecting', time);
fishing.inspectDuration = (FISH_INSPECT_MIN + Math.random() * FISH_INSPECT_RANGE) / getBaitLure();
fish.velocity = 0;
}
} else if (state === 'inspecting' && age >= fishing.inspectDuration) {
setFishingState('nibbleWait', time);
fishing.nibblesRemaining = Math.floor(Math.random() * 5 / getBaitLure());
fishing.nextNibbleAt = time + 300 + Math.random() * 420;
} else if (state === 'nibbleWait' && time >= fishing.nextNibbleAt) {
if (fishing.nibblesRemaining > 0) {
setFishingState('nibbleDip', time);
fishing.nibbleRippleShown = false;
} else {
startFishBite(scene, time);
}
} else if (state === 'nibbleDip') {
fishing.bobberY += Math.round(Math.sin(Math.min(1, age / FISH_NIBBLE_DIP_TIME) * Math.PI) * 2);
if (!fishing.nibbleRippleShown && age >= FISH_NIBBLE_DIP_TIME * 0.25) {
fishing.nibbleRippleShown = true;
nibbleRipple(scene, time, fishing.bobberX, fishing.bobberY);
}
if (age >= FISH_NIBBLE_DIP_TIME) {
setFishingState('nibbleWait', time);
fishing.nibblesRemaining--;
fishing.nextNibbleAt = time + 260 + Math.random() * 380;
}
} else if (state === 'bite' || state === 'snagged') {
fishing.bobberY = fishing.toY + 3;
if (state === 'bite' && time > fishing.biteDeadline) {
releaseTargetFish(true);
resumeFloating(time);
}
} else if (state === 'hooked' || state === 'minigame') {
const hooked = getHookedBobber();
if (hooked) {
[fishing.bobberX, fishing.bobberY] = hooked;
} else {
fishing.bobberY = fishing.toY + 2;
}
if (state === 'minigame') {
updateFishingMinigame(scene, time, delta);
} else if (age >= 220) {
startFishingMinigame(time);
}
}
}
function updateFishing(scene, time, delta, isWalking) {
const interrupted = isWalking || isMenuOpen() || !hasRodSelected();
fishingLine.clear();
if (castCharge && interrupted) castCharge = null;
drawCastCharge(time);
if (fishing && fishing.state !== 'reeling' && interrupted) reelIn(time);
if (!fishing) {
drawFishingMinigame();
return;
}
let [tipX, tipY] = getRodTip(time);
const age = time - fishing.start;
if (fishing.state === 'casting') {
fishing.bobberX = tipX;
fishing.bobberY = tipY;
if (time >= fishing.releaseAt) {
setFishingState('flying', time);
fishing.fromX = tipX;
fishing.fromY = tipY;
fishing.rope = createFishingRope(tipX, tipY, tipX, tipY - 2, Math.hypot(fishing.toX - tipX, fishing.toY - tipY) + fishing.arc * 0.8 + 5);
}
} else if (fishing.state === 'flying') {
const amount = Math.min(1, age / fishing.duration);
fishing.bobberX = Math.round(fishing.fromX + (fishing.toX - fishing.fromX) * amount);
fishing.bobberY = Math.round(fishing.fromY + (fishing.toY - fishing.fromY) * amount - Math.sin(amount * Math.PI) * fishing.arc);
if (amount >= 1 && !isWaterPixel(scene, fishing.toX, fishing.toY)) {
groundLandingPuff(scene, time, fishing.toX, fishing.toY);
fishing = null;
return;
}
if (amount >= 1) {
setFishingState('landing', time);
splash(scene, time, fishing.toX, fishing.toY);
}
} else if (fishing.state === 'landing') {
const amount = Math.min(1, age / BOBBER_LAND_TIME);
fishing.bobberX = fishing.toX;
fishing.bobberY = fishing.toY - Math.round(Math.sin(amount * Math.PI) * 2 * (1 - amount));
if (amount >= 1) {
const chestChunk = findChestAt(fishing.toX, fishing.toY);
setFishingState('floating', time);
if (chestChunk) snagChest(scene, time, chestChunk); else startFishApproach(time);
}
} else if (waterFishingStates.has(fishing.state)) {
updateWaterFishing(scene, time, delta);
} else {
const amount = Math.min(1, age / (fishing.hauling ? CHEST_REEL_DURATION : REEL_DURATION));
fishing.bobberX = Math.round(fishing.fromX + (tipX - fishing.fromX) * amount);
fishing.bobberY = Math.round(fishing.fromY + (tipY - fishing.fromY) * amount);
if (fishing.hauling) drawHauledChest(amount);
if (amount >= 1) {
if (fishing.hauling) openHauledChest(scene, time, tipX, tipY);
fishing = null;
}
}
drawFishingMinigame();
if (!fishing) return;
[tipX, tipY] = getRodTip(time);
const [handX, handY] = getRodHand();
const { polePalette, linePalette, bobberPalette } = fishing.rod;
const taut = fishing.state === 'reeling' || fishing.state === 'bite' || fishing.state === 'hooked' ||
fishing.state === 'minigame' || fishing.state === 'snagged';
fishingLine.setDepth(fishing.state === 'flying' || fishing.state === 'casting' ? character.depth + 1 : Math.max(character.depth + 0.2, fishing.bobberY));
plotFishingLine(handX, handY, tipX, tipY, 0, polePalette);
if (fishing.state === 'casting') return;
fishing.rope ||= createFishingRope(tipX, tipY, fishing.bobberX, fishing.bobberY - 2, Math.hypot(fishing.bobberX - tipX, fishing.bobberY - 2 - tipY) + 5);
updateFishingRope(fishing.rope, tipX, tipY, fishing.bobberX, fishing.bobberY - 2, delta, taut ? 1 : fishing.state === 'flying' ? 0.7 : 0);
drawFishingRope(fishing.rope, linePalette);
fishingLine
.fillStyle(bobberPalette?.[2] || BOBBER_BOTTOM_COLOR, 1)
.fillRect(fishing.bobberX - 1, fishing.bobberY - 2, 2, 1)
.fillStyle(bobberPalette?.[1] || BOBBER_TOP_COLOR, 1)
.fillRect(fishing.bobberX - 1, fishing.bobberY - 1, 1, 1)
.fillStyle(bobberPalette?.[0] || BOBBER_TOP_COLOR, 1)
.fillRect(fishing.bobberX, fishing.bobberY - 1, 1, 1);
}
let chestSilhouette;
let chestSprite;
function createChestSilhouette(scene) {
const source = getTerrainPixels(scene, 'chest');
const width = source.width / 2;
const height = source.height / 2;
const image = new ImageData(width, height);
const points = [];
let top = height;
let bottom = 0;
for (let y = 0; y < height; y++) {
for (let x = 0; x < width; x++) {
const counts = new Map();
let cover = 0;
let best = -1;
for (let offset = 0; offset < 4; offset++) {
const index = ((y * 2 + (offset >> 1)) * source.width + x * 2 + (offset & 1)) * 4;
if (!source.data[index + 3]) continue;
const color = source.data[index] << 16 | source.data[index + 1] << 8 | source.data[index + 2];
const count = (counts.get(color) || 0) + 1;
const brightness = source.data[index] + source.data[index + 1] + source.data[index + 2];
const bestBrightness = (best >> 16 & 255) + (best >> 8 & 255) + (best & 255);
counts.set(color, count);
cover++;
if (best === -1 || count > counts.get(best) || count === counts.get(best) && brightness < bestBrightness) {
best = color;
}
}
if (cover < 3) continue;
image.data.set([best >> 16 & 255, best >> 8 & 255, best & 255, 255], (y * width + x) * 4);
points.push(x, y);
top = Math.min(top, y);
bottom = Math.max(bottom, y);
}
}
createCanvasTexture(scene, 'chest-small', width, height, context => context.putImageData(image, 0, 0));
chestSilhouette = { width, top, bottom, points };
chestSprite = scene.add.image(0, 0, 'chest-small').setOrigin(0.5, 1).setVisible(false);
worldObjectLayer.add(chestSprite);
}
function findChunkChest(chunk) {
const { chunkX, chunkY, shoreDistances } = chunk;
const id = getTileId(chunkX, chunkY);
if (openedChests.has(id) || worldHash(chunkX, chunkY, CHEST_SALT) > CHEST_CHANCE) return null;
const { width, bottom, points } = chestSilhouette;
for (let attempt = 0; attempt < CHEST_PLACEMENT_ATTEMPTS; attempt++) {
const localX = Math.floor(worldHash(chunkX * CHEST_PLACEMENT_ATTEMPTS + attempt, chunkY, CHEST_SALT + 1) * (CHUNK_PIXEL_SIZE - width));
const localY = Math.floor(worldHash(chunkX, chunkY * CHEST_PLACEMENT_ATTEMPTS + attempt, CHEST_SALT + 2) * (CHUNK_PIXEL_SIZE - bottom - 1));
let deep = true;
for (let point = 0; point < points.length && deep; point += 2) {
deep = shoreDistances[(localY + points[point + 1]) * CHUNK_PIXEL_SIZE + localX + points[point]] >= CHEST_MIN_DEPTH;
}
if (deep) {
return { id, localX, localY, x: chunk.pixelX + localX, y: chunk.pixelY + localY, original: new Uint8Array(points.length / 2), nextBubbleAt: 0 };
}
}
return null;
}
function bakeChestSilhouette(chunk, data) {
const chest = chunk.chest = findChunkChest(chunk);
if (!chest) return;
const points = chestSilhouette.points;
for (let point = 0; point < points.length; point += 2) {
const index = ((chest.localY + points[point + 1]) * CHUNK_PIXEL_SIZE + chest.localX + points[point]) * 4;
chest.original[point / 2] = data[index];
data[index] = 128;
}
}
function eraseChestSilhouette(chunk) {
const chest = chunk.chest;
const { width, top, bottom, points } = chestSilhouette;
const height = bottom - top + 1;
const context = chunk.waterTexture.getContext();
const image = context.getImageData(chest.localX, chest.localY + top, width, height);
for (let point = 0; point < points.length; point += 2) {
image.data[((points[point + 1] - top) * width + points[point]) * 4] = chest.original[point / 2];
}
context.putImageData(image, chest.localX, chest.localY + top);
chunk.waterTexture.refresh();
chunk.chest = null;
}
function findChestAt(x, y) {
const { width, top, bottom } = chestSilhouette;
for (const chunk of loadedWaterChunks) {
const chest = chunk.chest;
if (
chest && x >= chest.x - CHEST_SNAG_MARGIN && x < chest.x + width + CHEST_SNAG_MARGIN &&
y >= chest.y + top - CHEST_SNAG_MARGIN && y <= chest.y + bottom + CHEST_SNAG_MARGIN
) {
return chunk;
}
}
return null;
}
function snagChest(scene, time, chunk) {
setFishingState('snagged', time);
fishing.chestChunk = chunk;
fishing.bobberY = fishing.toY + 3;
splash(scene, time, fishing.toX, fishing.toY);
}
function haulChest(time) {
const chunk = fishing.chestChunk;
fishing.chestChunk = null;
if (!chunk?.chest || !loadedWaterChunks.has(chunk)) return reelIn(time);
openedChests.add(chunk.chest.id);
eraseChestSilhouette(chunk);
saveDirty = true;
startReeling(time);
fishing.hauling = true;
splash(mainCamera.scene, time, fishing.bobberX, fishing.bobberY);
}
function drawHauledChest(amount) {
const lift = Math.round(Math.sin(amount * Math.PI) * 6);
chestSprite
.setPosition(Math.round(fishing.bobberX), Math.round(fishing.bobberY + 6 - lift))
.setDepth(Math.max(character.depth + 0.3, fishing.bobberY))
.setVisible(true);
}
function pickChestBait() {
let roll = Math.random() * CHEST_BAIT_WEIGHTS.reduce((total, weight) => total + weight, 0);
for (let index = 0; index < MARKET_BAITS.length; index++) {
roll -= CHEST_BAIT_WEIGHTS[index];
if (roll <= 0) return MARKET_BAITS[index];
}
return MARKET_BAITS[0];
}
function openHauledChest(scene, time, x, y) {
chestSprite.setVisible(false);
const bait = pickChestBait();
const amount = bait === MARKET_BAITS[MARKET_BAITS.length - 1] ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
const rewards = [`+${amount} ${bait.label}`];
addBait(bait, amount);
if (Math.random() < CHEST_FISH_CHANCE) {
const species = chooseFishSpecies(CHEST_FISH_WATER);
addCaughtFish(species);
rewards.push(species.name);
}
for (let index = 0; index < CHEST_SPARKLE_COLORS.length * 2; index++) {
spawnParticle(
scene, worldObjectLayer, time, x - 3 + index, y - 4 - (index % 2) * 2,
index % 2 ? 1 : -1, -1, 360, CHEST_SPARKLE_COLORS[index % CHEST_SPARKLE_COLORS.length], character.depth + 0.4
);
}
showRewardCard(scene, time, 'You found a treasure chest!', rewards.join(' · '));
}
function updateChestBubbles(scene, time) {
const { width, top } = chestSilhouette;
for (const chunk of loadedWaterChunks) {
const chest = chunk.chest;
if (!chest || !chunk.visible || time < chest.nextBubbleAt) continue;
chest.nextBubbleAt = time + CHEST_BUBBLE_MIN + Math.random() * CHEST_BUBBLE_RANGE;
spawnParticle(scene, shadowLayer, time, chest.x + 2 + Math.floor(Math.random() * (width - 4)), chest.y + top, 0, -1, CHEST_BUBBLE_LIFETIME, CHEST_BUBBLE_COLOR);
}
}
let mapPixels;
let mapPixelWords;
const mapColors = createTileCache(() => new Uint32Array(CHUNK_SIZE * CHUNK_SIZE));
function isMenuOpen() {
return dialogueOpen || marketOpen || mapOpen || inventoryOpen;
}
function drawPanelFrame(panel, x, width, height) {
return panel
.fillStyle(0x230a03, 1)
.fillRect(x, 0, width, height)
.fillStyle(0xacccf9, 1)
.fillRect(x + 1, 1, width - 2, height - 2)
.fillStyle(0x465989, 1)
.fillRect(x + 2, 2, width - 4, height - 4)
.fillStyle(0x36160d, 1)
.fillRect(x + 3, 3, width - 6, height - 6);
}
const CRISP_TEXT_STYLE = { textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased' };
function createTextLayer(height, style) {
const layer = document.createElement('div');
Object.assign(layer.style, {
position: 'relative',
width: '320px',
height: `${height}px`,
fontFamily: 'm6x11, monospace',
fontSize: '16px',
lineHeight: '11px',
pointerEvents: 'none'
}, style);
return layer;
}
function createUIText(layer, x, y, color, width, align, style) {
const text = document.createElement('div');
Object.assign(text.style, {
position: 'absolute',
left: `${x}px`,
top: `${y}px`,
width: width ? `${width}px` : 'auto',
textAlign: align || 'left',
whiteSpace: 'nowrap'
}, color && { color }, style);
layer.appendChild(text);
return text;
}
function addHudLayer(scene, element, y, depth) {
const layer = scene.add.dom(0, y, element)
.setOrigin(0)
.setDepth(depth)
.setScrollFactor(0)
.setVisible(false);
layer.pointerEvents = 'none';
return layer;
}
function addPanelContainer(scene, y, depth, children) {
return scene.add.container(0, y, children)
.setDepth(depth)
.setScrollFactor(0)
.setVisible(false);
}
function appendKeyHints(element, hints) {
for (const [key, label] of hints) {
const keycap = document.createElement('span');
keycap.textContent = key;
Object.assign(keycap.style, {
color: '#e0f2fd',
background: '#465989',
padding: '0 2px',
margin: '0 4px 0 10px'
});
element.append(keycap, label);
}
return element;
}
function createGuideDialogueUI(scene) {
const panel = scene.add.graphics();
drawPanelFrame(panel, 5, 310, 78)
.fillStyle(0x465989, 1)
.fillRect(DIALOGUE_OPTION_X - 7, 8, 1, 62);
dialogueHighlight = scene.add.graphics()
.fillStyle(0xacccf9, 1)
.fillRect(DIALOGUE_OPTION_X - 3, 0, DIALOGUE_OPTION_WIDTH, DIALOGUE_OPTION_HEIGHT)
.fillStyle(0x4a2216, 1)
.fillRect(DIALOGUE_OPTION_X - 2, 1, DIALOGUE_OPTION_WIDTH - 2, DIALOGUE_OPTION_HEIGHT - 2);
dialoguePortrait = scene.add.image(12, 13, 'guide-portrait-friendly')
.setOrigin(0);
const textLayer = createTextLayer(78, CRISP_TEXT_STYLE);
createUIText(textLayer, 64, 5, '#acccf9').textContent = 'Guide';
dialogueText = createUIText(textLayer, 64, 21, '#e0f2fd', 146, null, { whiteSpace: 'normal' });
dialogueOptionTexts = [0, 1, 2].map(index => {
return createUIText(textLayer, DIALOGUE_OPTION_X + 3, DIALOGUE_OPTION_TOP + 4 + index * DIALOGUE_OPTION_STEP, '#c0a887');
});
dialogueContainer = addPanelContainer(scene, DIALOGUE_HIDDEN_Y, 200, [panel, dialogueHighlight, dialoguePortrait]);
dialogueTextLayer = addHudLayer(scene, textLayer, DIALOGUE_HIDDEN_Y, 201);
}
function createMapUI(scene) {
const panel = scene.add.graphics();
drawPanelFrame(panel, 5, 310, MAP_PANEL_HEIGHT)
.fillStyle(0x465989, 1)
.fillRect(12, MARKET_DIVIDER_Y, 296, 1)
.fillStyle(0x230a03, 1)
.fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);
mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);
mapPixels = mapTexture.getContext().createImageData(MAP_WIDTH, MAP_HEIGHT);
mapPixelWords = new Uint32Array(mapPixels.data.buffer);
mapImage = scene.add.image(12, MAP_TOP, 'map')
.setOrigin(0);
const textLayer = createTextLayer(MAP_PANEL_HEIGHT);
createUIText(textLayer, 14, 5, '#acccf9').textContent = 'World Map';
appendKeyHints(
createUIText(textLayer, 0, 6, '#8c7358', null, null, { left: 'auto', right: '14px', fontSize: '11px' }),
[['Scroll', 'Zoom'], ['WASD', 'Pan'], ['M', 'Close']]
);
mapTextLayer = addHudLayer(scene, textLayer, MAP_HIDDEN_Y, 203);
mapContainer = addPanelContainer(scene, MAP_HIDDEN_Y, 202, [panel, mapImage]);
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
rock: pack(getDominantColor(scene, 'rock')),
boulder: pack(getDominantColor(scene, 'boulder')),
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
function toMapPixel(color) {
return (0xff000000 | (color & 255) << 16 | color & 0xff00 | color >> 16 & 255) >>> 0;
}
function generateMapTileColor(tileX, tileY) {
const palette = mapPalette;
const covering = getPropCovering(tileX, tileY);
let color;
if (covering) {
color = covering.type === 'tree' ? getTreeVariant(covering.tileX, tileY).color : palette[covering.type];
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
return toMapPixel(color);
}
function redrawMap(scene) {
const palette = getMapPalette(scene);
const context = mapTexture.getContext();
const pixels = mapPixelWords;
const fog = palette.fog.map(toMapPixel);
const outline = toMapPixel(palette.outline);
const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
const zoom = mapZoom;
const viewWidth = Math.ceil(MAP_WIDTH / zoom);
const viewHeight = Math.ceil(MAP_HEIGHT / zoom);
const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);
const marker = (tileX, tileY, width, height, color) => {
const x = (tileX - originX) * zoom;
const y = (tileY - originY) * zoom;
const pixelWidth = width * zoom;
const pixelHeight = height * zoom;
const fill = toMapPixel(color);
for (let offsetY = -1; offsetY <= pixelHeight; offsetY++) {
for (let offsetX = -1; offsetX <= pixelWidth; offsetX++) {
const plotX = x + offsetX;
const plotY = y + offsetY;
if (plotX < 0 || plotY < 0 || plotX >= MAP_WIDTH || plotY >= MAP_HEIGHT) continue;
const inside = offsetX >= 0 && offsetY >= 0 && offsetX < pixelWidth && offsetY < pixelHeight;
pixels[plotY * MAP_WIDTH + plotX] = inside ? fill : outline;
}
}
};
for (let viewY = 0; viewY < viewHeight; viewY++) {
const tileY = originY + viewY;
const top = viewY * zoom;
const bottom = Math.min(top + zoom, MAP_HEIGHT);
for (let viewX = 0; viewX < viewWidth; viewX++) {
const tileX = originX + viewX;
const color = isTileDiscovered(tileX, tileY) ? mapColors(tileX, tileY, generateMapTileColor) : -1;
const left = viewX * zoom;
const right = Math.min(left + zoom, MAP_WIDTH);
for (let y = top; y < bottom; y++) {
for (let x = left; x < right; x++) {
pixels[y * MAP_WIDTH + x] = color === -1 ? fog[(x + y) & 1] : color;
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
context.putImageData(mapPixels, 0, 0);
mapTexture.refresh();
}
function openMap(scene) {
if (isMenuOpen() || !mapContainer) return;
mapOpen = true;
mapPan.x = 0;
mapPan.y = 0;
mapDrag = null;
mapDirty = false;
stopCharacterForMenu();
redrawMap(scene);
showSlidingPanel(scene, MAP_HIDDEN_Y, mapContainer, mapTextLayer);
}
function updateMapPan(scene, delta) {
const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
(characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
(characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);
const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
const beforeX = Math.round(mapPan.x);
const beforeY = Math.round(mapPan.y);
mapPan.x += panX * distance;
mapPan.y += panY * distance;
mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;
if (mapDirty) {
mapDirty = false;
redrawMap(scene);
}
}
function snapTweenTarget(tween, target) {
target.y = Math.round(target.y);
}
function stopCharacterForMenu() {
characterMoveRemainderX = 0;
characterMoveRemainderY = 0;
setCharacterTexture(`character-${characterDirection}`);
}
function getVerticalMenuStep(event) {
const key = event.key.toLowerCase();
return key === 'w' || event.key === 'ArrowUp' ? -1 : key === 's' || event.key === 'ArrowDown' ? 1 : 0;
}
function popIn(scene, image, y) {
image.setY(y + 2);
scene.tweens.killTweensOf(image);
scene.tweens.add({ targets: image, y, duration: 140, ease: 'Quad.Out', onUpdate: snapTweenTarget });
}
function slidePanel(scene, y, duration, ease, targets, onComplete) {
for (const target of targets) scene.tweens.killTweensOf(target);
scene.tweens.add({ targets, y, duration, ease, onUpdate: snapTweenTarget, onComplete });
}
function showSlidingPanel(scene, hiddenY, ...targets) {
for (const target of targets) target.setVisible(true).setY(hiddenY);
slidePanel(scene, DIALOGUE_VISIBLE_Y, 180, 'Cubic.Out', targets);
}
function hideSlidingPanel(scene, hiddenY, isOpen, ...targets) {
slidePanel(scene, hiddenY, 140, 'Cubic.In', targets, () => {
if (!isOpen()) for (const target of targets) target.setVisible(false);
});
}
function closeMap(scene) {
if (!mapOpen) return;
mapOpen = false;
hideSlidingPanel(scene, MAP_HIDDEN_Y, () => mapOpen, mapContainer, mapTextLayer);
}
function handleMapKey(scene, event) {
if (event.key.toLowerCase() === 'm' || event.key === 'Escape') closeMap(scene);
}
function createInventoryUI(scene) {
const panel = scene.add.graphics();
drawPanelFrame(panel, 5, 310, INVENTORY_HEIGHT)
.fillStyle(0x465989, 1)
.fillRect(12, 19, 296, 1)
.fillRect(12, 127, 296, 1)
.fillRect(159, 23, 1, 101);
const textLayer = createTextLayer(INVENTORY_HEIGHT, { color: '#c0a887' });
const rowStyle = { fontSize: '9px', lineHeight: '8px' };
const detailStyle = { fontSize: '8px', lineHeight: '8px' };
createUIText(textLayer, 14, 5, '#acccf9').textContent = 'Fishpedia';
inventorySummaryText = createUIText(textLayer, 145, 5, null, 161, 'right', { fontSize: '11px' });
inventoryRowTexts = [];
inventoryCountTexts = [];
for (let index = 0; index < FISH_SPECIES.length; index++) {
const column = Math.floor(index / 13);
const row = index % 13;
const x = 14 + column * 152;
const y = 22 + row * 8;
inventoryRowTexts.push(createUIText(textLayer, x, y, null, 84, null, rowStyle));
inventoryCountTexts.push(createUIText(textLayer, x + 84, y, null, 55, 'right', detailStyle));
}
inventoryNewGameText = createUIText(textLayer, 12, 128, '#8c7358', 296, 'center', { fontSize: '11px' });
inventoryFooterHints = appendKeyHints(document.createElement('span'), [['I/Esc', 'Close'], ['N', 'New Game']]);
inventoryContainer = addPanelContainer(scene, INVENTORY_HIDDEN_Y, 203, [panel]);
inventoryTextLayer = addHudLayer(scene, textLayer, INVENTORY_HIDDEN_Y, 204);
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
inventoryCountTexts[index].textContent = caught ? `x${count} ${species.price}c` : '—';
inventoryCountTexts[index].style.color = count ? '#8fbf7a' : caught ? '#8c7358' : '#6f5b49';
});
const confirming = time < newGameConfirmUntil;
if (confirming) {
inventoryNewGameText.textContent = 'Press N again to erase all progress';
} else if (inventoryNewGameText.firstChild !== inventoryFooterHints) {
inventoryNewGameText.replaceChildren(inventoryFooterHints);
}
inventoryNewGameText.style.color = confirming ? '#d9745b' : '#8c7358';
}
function openInventory(scene) {
if (isMenuOpen() || !inventoryContainer) return;
inventoryOpen = true;
newGameConfirmUntil = 0;
stopCharacterForMenu();
refreshInventoryUI(scene.time.now);
showSlidingPanel(scene, INVENTORY_HIDDEN_Y, inventoryContainer, inventoryTextLayer);
}
function closeInventory(scene) {
if (!inventoryOpen) return;
inventoryOpen = false;
newGameConfirmUntil = 0;
hideSlidingPanel(scene, INVENTORY_HIDDEN_Y, () => inventoryOpen, inventoryContainer, inventoryTextLayer);
}
function handleInventoryKey(scene, event) {
const key = event.key.toLowerCase();
if (key === 'i' || event.key === 'Escape') {
closeInventory(scene);
} else if (key === 'n' && scene.time.now < newGameConfirmUntil) {
newGameResetting = true;
saveDirty = false;
localStorage.removeItem(SAVE_KEY);
window.location.reload();
} else if (key === 'n') {
newGameConfirmUntil = scene.time.now + 2500;
refreshInventoryUI(scene.time.now);
}
}
function createCatchCardUI(scene) {
const panel = scene.add.graphics();
drawPanelFrame(panel, 40, 240, 30);
const textLayer = createTextLayer(30);
catchCardTitle = createUIText(textLayer, 43, 4, '#e0f2fd', 234, 'center');
catchCardDetail = createUIText(textLayer, 43, 16, '#e8c170', 234, 'center', { fontSize: '11px', lineHeight: '9px' });
catchCardContainer = addPanelContainer(scene, CATCH_CARD_Y + 8, 205, [panel]);
catchCardTextLayer = addHudLayer(scene, textLayer, CATCH_CARD_Y + 8, 206);
}
function showCatchCard(scene, time, species) {
showRewardCard(scene, time, `You caught a ${species.name}!`, `${species.price}c`);
}
function showRewardCard(scene, time, title, detail) {
catchCardTitle.textContent = title;
catchCardDetail.textContent = detail;
catchCardUntil = time + CATCH_CARD_DURATION;
itemLabelUntil = 0;
const card = [catchCardContainer, catchCardTextLayer];
if (catchCardHideEvent) catchCardHideEvent.remove(false);
for (const target of card) target.setVisible(true).setY(CATCH_CARD_Y + 8);
slidePanel(scene, CATCH_CARD_Y, 180, 'Cubic.Out', card);
catchCardHideEvent = scene.time.delayedCall(CATCH_CARD_DURATION - 180, () => {
slidePanel(scene, CATCH_CARD_Y + 8, 180, 'Cubic.In', card, () => {
for (const target of card) target.setVisible(false);
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
interactionPromptLayer = addHudLayer(scene, wrapper, PROMPT_Y, 103);
}
function updateInteractionPrompt(scene, guideReach, marketReach) {
if (!interactionPromptLayer) return;
const available = !isMenuOpen() && scene.time.now >= catchCardUntil;
const target = available && (guideReach < 1 || marketReach < 1)
? getInteractionTarget(guideHasMetPlayer, guideReach, marketReach)
: null;
const showItem = available && !target && scene.time.now < itemLabelUntil;
const state = (target === 'market' ? 1 : 0) | (target === 'guide' ? 2 : 0) | (showItem ? 4 : 0);
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
onComplete: () => promptState === 0 && interactionPromptLayer.setVisible(false)
});
return;
}
marketPrompt.style.display = state & 1 ? 'flex' : 'none';
guidePrompt.style.display = state & 2 ? 'flex' : 'none';
itemPrompt.style.display = state & 4 ? 'flex' : 'none';
interactionPromptLayer.setVisible(true);
if (!wasShowing) promptMotion.value = 0;
applyPromptMotion();
scene.tweens.add({ targets: promptMotion, value: 1, duration: 140, ease: 'Cubic.Out', onUpdate: applyPromptMotion });
}
function applyPromptMotion() {
interactionPromptLayer
.setY(PROMPT_Y + Math.round((1 - promptMotion.value) * PROMPT_SLIDE))
.setVisible(promptMotion.value > 0.05);
}
function createMarketUI(scene) {
const panel = scene.add.image(0, 0, 'shop-ui').setOrigin(0);
marketHighlight = scene.add.graphics()
.fillStyle(0xacccf9, 1)
.fillRect(MARKET_LIST_X, 0, MARKET_LIST_WIDTH, MARKET_ROW_HEIGHT - 2)
.fillStyle(0x4a2216, 1)
.fillRect(MARKET_LIST_X + 1, 1, MARKET_LIST_WIDTH - 2, MARKET_ROW_HEIGHT - 4);
marketItemImages = MARKET_RODS.map((rod, index) => {
return scene.add.image(MARKET_LIST_X + 3, MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 2, rod.icon)
.setOrigin(0);
});
marketDetailImage = scene.add.image(
MARKET_DETAIL_X + 50,
MARKET_LIST_Y + 4,
MARKET_RODS[0].texture
)
.setOrigin(0);
const textLayer = createTextLayer(MARKET_HEIGHT, CRISP_TEXT_STYLE);
const createText = (x, y, color, width, align, style) => createUIText(textLayer, x, y, color, width, align, style);
marketTabTexts = MARKET_PAGES.map((page, index) => {
const tab = createText(MARKET_TAB_X + index * MARKET_TAB_WIDTH, MARKET_TAB_Y, '#6f5b49');
tab.textContent = page.title;
return tab;
});
marketMessageText = createText(160, 5, '#e8c170', 146, 'right');
marketOptionTexts = [];
marketPriceTexts = [];
for (let index = 0; index < MARKET_ROW_COUNT; index++) {
const rowY = MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 6;
const isAction = index >= MARKET_ITEM_ROWS;
marketOptionTexts.push(createText(isAction ? MARKET_LIST_X + 6 : MARKET_LIST_X + 24, rowY, '#c0a887'));
if (!isAction) {
marketPriceTexts.push(createText(MARKET_LIST_X, rowY, '#c0a887', MARKET_LIST_WIDTH - 5, 'right'));
}
}
const detailTextX = MARKET_DETAIL_X + 4;
const detailTextWidth = MARKET_DETAIL_WIDTH - 8;
marketDetailName = createText(detailTextX, MARKET_LIST_Y + 39, '#e0f2fd', detailTextWidth, 'center');
marketDetailStatus = createText(detailTextX, MARKET_LIST_Y + 51, '#c0a887', detailTextWidth, 'center');
marketDetailAction = createText(detailTextX, MARKET_LIST_Y + 66, '#acccf9', detailTextWidth, 'center');
const footer = createText(12, MARKET_FOOTER_Y, '#8c7358', 296, 'center', {
fontSize: '11px',
display: 'flex',
justifyContent: 'center',
gap: '12px'
});
for (const hint of [['A/D', 'Tab'], ['W/S', 'Select'], ['Enter', 'Buy'], ['E', 'Close']]) {
const span = appendKeyHints(document.createElement('span'), [hint]);
span.firstChild.style.marginLeft = '0';
footer.appendChild(span);
}
marketContainer = addPanelContainer(scene, MARKET_HIDDEN_Y, 203, [panel, marketHighlight, ...marketItemImages, marketDetailImage]);
marketTextLayer = addHudLayer(scene, textLayer, MARKET_HIDDEN_Y, 204);
refreshMarketOptions();
}
function createHotbarUI(scene) {
scene.add.image(HOTBAR_X, HOTBAR_Y, 'hotbar')
.setOrigin(0)
.setDepth(100)
.setScrollFactor(0);
hotbarSelector = scene.add.image(
HOTBAR_X - 2,
HOTBAR_Y - 3,
'selected'
)
.setOrigin(0)
.setDepth(101)
.setScrollFactor(0);
createBaitSlotUI(scene);
}
function addHotbarItem(scene, textureKey, name) {
const slot = hotbarItemImages.length;
if (slot >= 9) return;
const image = scene.add.image(HOTBAR_X + slot * HOTBAR_SLOT_SIZE + 13, 0, textureKey)
.setDepth(100.5)
.setScrollFactor(0)
.setDisplaySize(16, 16);
hotbarItemNames[slot] = name;
hotbarItemImages.push(image);
popIn(scene, image, HOTBAR_Y + 13);
}
function createBaitSlotUI(scene) {
scene.textures.get('hotbar').add('slot', 0, 0, 0, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);
scene.add.image(BAIT_SLOT_X, HOTBAR_Y, 'hotbar', 'slot')
.setOrigin(0)
.setDepth(100)
.setScrollFactor(0);
baitSlotImage = scene.add.image(BAIT_SLOT_X + 13, HOTBAR_Y + 13, MARKET_BAITS[0].icon)
.setDepth(100.5)
.setScrollFactor(0)
.setVisible(false);
const layer = createTextLayer(9, { width: `${HOTBAR_SLOT_SIZE}px`, fontSize: '11px', lineHeight: '9px' });
baitCountText = createUIText(layer, 0, 0, '#e0f2fd', HOTBAR_SLOT_SIZE - 3, 'right', { textShadow: '1px 0 #230a03, 0 1px #230a03' });
addHudLayer(scene, layer, 0, 100.6).setPosition(BAIT_SLOT_X, HOTBAR_Y + 15).setVisible(true);
}
function refreshBaitSlot() {
if (!baitSlotImage) return;
const bait = getActiveBait();
baitSlotImage.setVisible(Boolean(bait));
baitCountText.textContent = bait ? baitInventory.get(bait.id) : '';
if (bait && baitSlotImage.texture.key !== bait.icon) {
popIn(baitSlotImage.scene, baitSlotImage.setTexture(bait.icon), HOTBAR_Y + 13);
}
}
function getActiveBait() {
return baitInventory.get(activeBaitId) ? MARKET_BAITS_BY_ID.get(activeBaitId) : null;
}
function addBait(bait, amount, equip) {
baitInventory.set(bait.id, (baitInventory.get(bait.id) || 0) + amount);
if (equip || !getActiveBait()) activeBaitId = bait.id;
saveDirty = true;
refreshBaitSlot();
}
function useBait(bait) {
if (!bait || !baitInventory.get(bait.id)) return;
const left = baitInventory.get(bait.id) - 1;
if (left) {
baitInventory.set(bait.id, left);
} else {
baitInventory.delete(bait.id);
if (activeBaitId === bait.id) activeBaitId = MARKET_BAITS.find(other => baitInventory.has(other.id))?.id ?? null;
}
saveDirty = true;
refreshBaitSlot();
}
function cycleBait(scene) {
const owned = MARKET_BAITS.filter(bait => baitInventory.has(bait.id));
if (!owned.length) {
showItemLabel(scene, 'No bait - buy some at the shop');
return;
}
const current = owned.indexOf(getActiveBait());
const next = current + 1 < owned.length ? owned[current + 1] : null;
activeBaitId = next ? next.id : null;
saveDirty = true;
refreshBaitSlot();
showItemLabel(scene, next ? `${next.label} x${baitInventory.get(next.id)}` : 'No bait');
}
function showItemLabel(scene, text) {
if (!itemPrompt) return;
itemPrompt.label.textContent = text;
itemLabelUntil = scene.time.now + ITEM_LABEL_DURATION;
}
function isBaitSlotAt(x, y) {
return x >= BAIT_SLOT_X && x < BAIT_SLOT_X + HOTBAR_SLOT_SIZE && y >= HOTBAR_Y && y < HOTBAR_Y + HOTBAR_SLOT_SIZE;
}
function selectHotbarSlot(scene, slot, immediate = false) {
selectedHotbarSlot = Phaser.Math.Wrap(slot, 0, 9);
scene.tweens.killTweensOf(hotbarSelector);
const selectorX = HOTBAR_X - 2 + selectedHotbarSlot * HOTBAR_SLOT_SIZE;
if (immediate) {
hotbarSelector.x = selectorX;
} else {
scene.tweens.add({
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
showItemLabel(scene, name);
} else {
itemLabelUntil = 0;
}
}
function getMarketTabAt(x, y) {
const localY = y - DIALOGUE_VISIBLE_Y - MARKET_TAB_Y;
const tab = Math.floor((x - MARKET_TAB_X) / MARKET_TAB_WIDTH);
return localY >= -2 && localY < 12 && x >= MARKET_TAB_X && tab < MARKET_PAGES.length ? tab : -1;
}
function setMarketPage(page) {
marketPage = Phaser.Math.Wrap(page, 0, MARKET_PAGES.length);
marketFeedback = null;
refreshMarketOptions();
}
function getMarketRowAt(x, y) {
const localY = y - DIALOGUE_VISIBLE_Y - MARKET_LIST_Y;
const row = Math.floor(localY / MARKET_ROW_HEIGHT);
const inside = x >= MARKET_LIST_X && x < MARKET_LIST_X + MARKET_LIST_WIDTH && localY >= 0 &&
row < MARKET_ROW_COUNT && localY - row * MARKET_ROW_HEIGHT < MARKET_ROW_HEIGHT - 2;
return inside ? row : -1;
}
function getDialogueOptionAt(x, y) {
const option = Math.floor((y - DIALOGUE_VISIBLE_Y - DIALOGUE_OPTION_TOP) / DIALOGUE_OPTION_STEP);
const inside = x >= DIALOGUE_OPTION_X - 3 && x < DIALOGUE_OPTION_X - 3 + DIALOGUE_OPTION_WIDTH &&
option >= 0 && option < GUIDE_DIALOGUE[dialogueNode].options.length;
return inside ? option : -1;
}
function isMarketItemOwned(item) {
return !item.bundle && ownedRods.has(item.id);
}
function getMarketItemStatus(item) {
if (isMarketItemOwned(item)) {
return { text: 'Owned', color: '#8fbf7a' };
}
if (playerCoins < item.price) {
return { text: `Need ${item.price - playerCoins}c more`, color: '#d9745b' };
}
return { text: item.bundle ? `${item.bundle} for ${item.price}c` : `${item.price}c`, color: '#e8c170' };
}
function getFishInventorySummary() {
let count = 0;
let value = 0;
for (const [id, amount] of fishInventory) {
const species = FISH_SPECIES_BY_ID.get(id);
if (!species) continue;
count += amount;
value += amount * species.price;
}
return { count, value };
}
function setMarketDetail(name, status, statusColor, action, actionColor = '#acccf9') {
marketDetailName.textContent = name;
marketDetailStatus.textContent = status;
marketDetailStatus.style.color = statusColor;
marketDetailAction.textContent = marketFeedback ? marketFeedback.text : action;
marketDetailAction.style.color = marketFeedback ? marketFeedback.color : actionColor;
}
function refreshMarketOptions() {
if (!marketMessageText) return;
const items = MARKET_PAGES[marketPage].items;
const rowColor = index => index === selectedMarketOption ? '#e0f2fd' : '#c0a887';
marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`;
marketHighlight.setY(MARKET_LIST_Y + selectedMarketOption * MARKET_ROW_HEIGHT);
marketTabTexts.forEach((tab, index) => tab.style.color = index === marketPage ? '#acccf9' : '#6f5b49');
for (let index = 0; index < MARKET_ITEM_ROWS; index++) {
const item = items[index];
const owned = item && isMarketItemOwned(item);
const priceText = marketPriceTexts[index];
marketOptionTexts[index].textContent = item ? item.label : '';
marketOptionTexts[index].style.color = owned && index !== selectedMarketOption ? '#7a6450' : rowColor(index);
priceText.textContent = !item ? '' : owned ? 'Owned' : `${item.price}c`;
priceText.style.color = owned ? '#8fbf7a' : item && playerCoins >= item.price ? '#e8c170' : '#9a5a47';
marketItemImages[index].setVisible(Boolean(item));
if (item) marketItemImages[index].setTexture(item.icon).setTint(owned ? OWNED_ROD_TINT : 0xffffff);
}
marketOptionTexts[MARKET_SELL_INDEX].textContent = 'Sell fish';
marketOptionTexts[MARKET_SELL_INDEX].style.color = rowColor(MARKET_SELL_INDEX);
marketOptionTexts[MARKET_EXIT_INDEX].textContent = 'Leave';
marketOptionTexts[MARKET_EXIT_INDEX].style.color = rowColor(MARKET_EXIT_INDEX);
const item = items[selectedMarketOption];
marketDetailImage.setVisible(Boolean(item));
if (selectedMarketOption === MARKET_SELL_INDEX) {
const { count, value } = getFishInventorySummary();
setMarketDetail('Sell fish', count ? `${count} fish · ${value}c` : 'No fish to sell', count ? '#e8c170' : '#c0a887', count ? 'Enter - Sell all' : '');
} else if (selectedMarketOption === MARKET_EXIT_INDEX) {
setMarketDetail('Leave shop', '', '#c0a887', 'Enter - Leave');
} else if (!item) {
setMarketDetail('', '', '#c0a887', '');
} else {
const status = getMarketItemStatus(item);
const owned = isMarketItemOwned(item);
const held = baitInventory.get(item.id);
marketDetailImage.setTexture(item.texture).setTint(owned ? OWNED_ROD_TINT : 0xffffff);
setMarketDetail(
item.label,
item.bundle && held ? `Have ${held} · ${status.text}` : status.text,
status.color,
owned || playerCoins < item.price ? '' : 'Enter - Buy'
);
}
}
function animateCoinTotal(scene) {
scene.tweens.killTweensOf(coinDisplay);
scene.tweens.add({
targets: coinDisplay,
value: playerCoins,
duration: 260,
ease: 'Quad.Out',
onUpdate: () => marketMessageText.textContent = `${Math.round(coinDisplay.value)}c`
});
}
function buySelectedMarketItem(scene) {
const item = MARKET_PAGES[marketPage].items[selectedMarketOption];
if (selectedMarketOption === MARKET_EXIT_INDEX) {
closeMarket(scene);
return;
}
if (selectedMarketOption === MARKET_SELL_INDEX) {
const summary = getFishInventorySummary();
if (!summary.count) return;
playerCoins += summary.value;
fishInventory.clear();
marketFeedback = { text: `Sold for ${summary.value}c!`, color: '#8fbf7a' };
} else if (!item || isMarketItemOwned(item) || playerCoins < item.price) {
return;
} else if (item.bundle) {
playerCoins -= item.price;
addBait(item, item.bundle, true);
marketFeedback = { text: `+${item.bundle} ${item.label}!`, color: '#8fbf7a' };
} else {
playerCoins -= item.price;
ownedRods.add(item.id);
addHotbarItem(scene, item.icon, item.label);
marketFeedback = { text: 'Purchased!', color: '#8fbf7a' };
}
saveDirty = true;
animateCoinTotal(scene);
refreshMarketOptions();
}
function moveMarketSelection(amount) {
selectedMarketOption = Phaser.Math.Wrap(selectedMarketOption + amount, 0, MARKET_ROW_COUNT);
marketFeedback = null;
refreshMarketOptions();
}
function openMarket(scene) {
if (isMenuOpen() || !marketContainer || !isMarketNear()) return;
marketOpen = true;
selectedMarketOption = 0;
marketPage = 0;
marketFeedback = null;
coinDisplay.value = playerCoins;
stopCharacterForMenu();
refreshMarketOptions();
showSlidingPanel(scene, MARKET_HIDDEN_Y, marketContainer, marketTextLayer);
}
function closeMarket(scene) {
if (!marketOpen) return;
marketOpen = false;
hideSlidingPanel(scene, MARKET_HIDDEN_Y, () => marketOpen, marketContainer, marketTextLayer);
}
function handleMarketKey(scene, event) {
const key = event.key.toLowerCase();
const step = getVerticalMenuStep(event);
const page = key === 'a' || event.key === 'ArrowLeft' ? -1 : key === 'd' || event.key === 'ArrowRight' ? 1 : 0;
if (step) {
moveMarketSelection(step);
} else if (page) {
setMarketPage(marketPage + page);
} else if (event.key === 'Enter' || event.code === 'Space') {
buySelectedMarketItem(scene);
} else if (key === 'e' || event.key === 'Escape') {
closeMarket(scene);
}
}
function getMarketReach() {
if (!store) return Infinity;
const x = character.x + CHARACTER_SIZE / 2 - store.x - STORE_WIDTH / 2;
const y = character.y + CHARACTER_SIZE / 2 - store.y - STORE_HEIGHT / 2;
return (x * x + y * y) / MARKET_INTERACTION_DISTANCE_SQUARED;
}
function getGuideReach() {
if (!guide) return Infinity;
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
const inside = (target, width, height) => pointer.worldX >= target.x && pointer.worldX < target.x + width &&
pointer.worldY >= target.y && pointer.worldY < target.y + height;
if (guide && isGuideNear() && inside(guide, GUIDE_SIZE, GUIDE_SIZE)) return 'guide';
if (store && isMarketNear() && inside(store, STORE_WIDTH, STORE_HEIGHT)) return 'market';
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
function getInteractionTarget(guideAvailable, guideReach, marketReach) {
guideReach = guideAvailable ? guideReach ?? getGuideReach() : Infinity;
marketReach ??= getMarketReach();
if (guideReach >= 1 && marketReach >= 1) return null;
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
optionText.style.display = option ? 'block' : 'none';
if (!option) return;
optionText.textContent = option.label;
optionText.style.color = index === selectedDialogueOption ? '#e0f2fd' : '#c0a887';
});
dialogueHighlight.setY(DIALOGUE_OPTION_TOP + selectedDialogueOption * DIALOGUE_OPTION_STEP);
}
function finishGuideDialogueText() {
if (!stopDialogueTyping()) return false;
dialogueText.textContent = dialogueFullText;
return true;
}
function openInteraction(scene, target) {
if (target === 'guide') openGuideDialogue(scene);
else if (target === 'market') openMarket(scene);
}
function stopDialogueTyping() {
if (!dialogueTypingEvent) return false;
dialogueTypingEvent.remove(false);
dialogueTypingEvent = null;
return true;
}
function showGuideDialogueNode(scene, nodeKey) {
const node = GUIDE_DIALOGUE[nodeKey];
let characterIndex = 0;
stopDialogueTyping();
dialogueNode = nodeKey;
selectedDialogueOption = 0;
dialogueFullText = node.text;
dialoguePortrait.setTexture(node.portrait);
dialogueText.textContent = '';
refreshGuideDialogueOptions();
dialogueTypingEvent = scene.time.addEvent({
delay: 24,
repeat: dialogueFullText.length - 1,
callback: () => {
characterIndex++;
dialogueText.textContent = dialogueFullText.slice(0, characterIndex);
if (characterIndex === dialogueFullText.length) dialogueTypingEvent = null;
}
});
}
function openGuideDialogue(scene) {
if (isMenuOpen() || !guide || !dialogueContainer) return;
dialogueOpen = true;
stopCharacterForMenu();
showSlidingPanel(scene, DIALOGUE_HIDDEN_Y, dialogueContainer, dialogueTextLayer);
showGuideDialogueNode(scene, 'intro');
}
function closeGuideDialogue(scene) {
if (!dialogueOpen) return;
dialogueOpen = false;
guideHasMetPlayer = true;
saveDirty = true;
stopDialogueTyping();
hideSlidingPanel(scene, DIALOGUE_HIDDEN_Y, () => dialogueOpen, dialogueContainer, dialogueTextLayer);
}
function selectGuideDialogueOption(scene) {
if (finishGuideDialogueText()) return;
const option = GUIDE_DIALOGUE[dialogueNode].options[selectedDialogueOption];
if (option.close) {
closeGuideDialogue(scene);
} else {
showGuideDialogueNode(scene, option.next);
}
}
function moveGuideDialogueSelection(amount) {
selectedDialogueOption = Phaser.Math.Wrap(selectedDialogueOption + amount, 0, GUIDE_DIALOGUE[dialogueNode].options.length);
refreshGuideDialogueOptions();
}
function handleGuideDialogueKey(scene, event) {
const step = getVerticalMenuStep(event);
if (step) {
moveGuideDialogueSelection(step);
} else if (event.key === 'Enter' || event.code === 'Space' || event.key.toLowerCase() === 'e') {
selectGuideDialogueOption(scene);
} else if (event.key === 'Escape') {
closeGuideDialogue(scene);
}
}
function updateGuideInteraction(scene, guideIsNear) {
if (guideIsNear && !guideWasNear && !guideHasMetPlayer && !isMenuOpen()) {
openGuideDialogue(scene);
}
guideWasNear = guideIsNear;
}
function runAutomatedTests(scene) {
const results = [];
const record = (name, passed, detail) => results.push({ name, passed, detail });
const loaderPassed = scene.load.maxParallelDownloads === 6;
record('Asset requests use a bounded queue', loaderPassed, loaderPassed ? 'At most 6 assets download together' : `Loader concurrency is ${scene.load.maxParallelDownloads}`);
const speciesIds = new Set(FISH_SPECIES.map(species => species.id));
const ordinarySizesValid = FISH_SPECIES
.filter(species => species.id !== 'sturgeon')
.every(species => species.size === 'small' || species.size === 'medium' || species.size === 'large');
const sturgeon = FISH_SPECIES_BY_ID.get('sturgeon');
const speciesPassed = FISH_SPECIES.length === 26 && speciesIds.size === 26 && ordinarySizesValid && sturgeon?.size === 'giant';
record('Fish species have fixed size classes', speciesPassed, speciesPassed ? '26 unique species; sturgeon is the giant exception' : 'Species size table is invalid');
const diagonalGrassPatch = getTerrainCornerPatch('grass', 'dirt', 'dirt', 'grass', 1);
const solidDirtPatch = getTerrainCornerPatch('grass', 'dirt', 'dirt', 'dirt', 1);
const terrainCornersPassed = diagonalGrassPatch === null && solidDirtPatch === 'dirtEdgeCorner';
record('Diagonal grass connections stay clean', terrainCornersPassed, terrainCornersPassed ? 'Dirt corners yield to connected grass' : 'Diagonal terrain rule regressed');
let crowdedProps = 0;
let sampledProps = 0;
for (let tileY = -96; tileY <= 96; tileY++) {
for (let tileX = -96; tileX <= 96; tileX++) {
const type = getPropAt(tileX, tileY);
if (!type) continue;
sampledProps++;
for (let offsetY = 0; offsetY <= TREE_CANOPY_TILES; offsetY++) {
for (let offsetX = -3; offsetX <= 3; offsetX++) {
if (offsetY === 0 && offsetX <= 0) continue;
const nearby = getPropAt(tileX + offsetX, tileY + offsetY);
if (nearby && propsConflict(type, tileX, tileY, nearby, tileX + offsetX, tileY + offsetY)) crowdedProps++;
}
}
}
}
record('Props keep a clear tile gap', crowdedProps === 0, `${sampledProps} generated props checked`);
const leafyTrees = treeVariants.length === TREE_VARIANT_COUNT && treeVariants.every(variant =>
scene.textures.exists(variant.key) && variant.hitRight > variant.hitLeft && variant.shadowPoints.length > 0
);
record('Trees grow seeded leaves', leafyTrees, leafyTrees ? `${treeVariants.length} canopy variants generated` : 'Tree variant generation failed');
const fishingTextures = ['fishing-ui', 'fishing-catch-zone', 'fishing-fish', 'fishing-progress'];
const texturesPassed = fishingTextures.every(key => scene.textures.exists(key));
record('Fishing minigame PNGs are loaded', texturesPassed, texturesPassed ? 'Frame, zone, fish and progress assets found' : 'A fishing UI texture is missing');
spawnShimmer(scene);
const shimmerChunk = [...loadedShimmerChunks].find(chunk => chunk.shimmers.length);
const shimmer = shimmerChunk?.shimmers[shimmerChunk.shimmers.length - 1];
if (shimmer) finishShimmer(null, null, shimmer);
const shimmerPoolPassed = shimmer && !shimmer.active && !shimmer.shimmerChunk &&
!shimmerChunk.shimmers.includes(shimmer) && shimmerPool.includes(shimmer) &&
shimmer.listenerCount(Phaser.Animations.Events.ANIMATION_COMPLETE) === 1;
record('Shimmer completion returns sprites to the pool', shimmerPoolPassed, shimmerPoolPassed ? 'One permanent completion handler retained' : 'Shimmer lifecycle regressed');
const deckLayers = [...loadedChunks.values()].map(chunk => chunk.upperLayer).filter(Boolean);
const shimmerDepthPassed = shimmer && deckLayers.length > 0 && loadedWaterChunks.size > 0 &&
deckLayers.every(layer => shimmer.depth < layer.depth) &&
[...loadedWaterChunks].every(chunk => shimmer.depth > chunk.overlay.depth);
record('Water sparkles stay below bridges and piers', shimmerDepthPassed, shimmerDepthPassed ? 'Sparkles render above water and below deck textures' : 'Water sparkle draw order is incorrect');
const rodArtPassed = MARKET_RODS.every(rod =>
scene.textures.exists(rod.texture) && scene.textures.exists(rod.icon) && rod.polePalette?.length === 3 &&
rod.linePalette?.length === 4 && rod.bobberPalette?.length === 3
) && new Set(MARKET_RODS.map(rod => rod.linePalette.join(','))).size === MARKET_RODS.length;
record('Rod art palettes are extracted', rodArtPassed, rodArtPassed ? 'Three distinct rod, line and bobber palettes found' : 'Rod artwork or palette extraction failed');
const rodsImprove = MARKET_RODS.slice(1).every((rod, index) => {
const previous = MARKET_RODS[index];
return rod.castDistance > previous.castDistance &&
rod.chargeTime < previous.chargeTime &&
rod.lineStrength > previous.lineStrength &&
rod.catchZone > previous.catchZone;
});
record('Rod upgrades improve all fishing stats', rodsImprove, rodsImprove ? 'Distance, speed, strength and zone are monotonic' : 'Rod progression regressed');
const directionBuffer = getCastDirection();
const handBuffer = getRodHand();
const tipBuffer = getRodTip();
const fishingBuffersPassed = directionBuffer === getCastDirection() && handBuffer === getRodHand() && tipBuffer === getRodTip();
record('Fishing coordinates reuse stable buffers', fishingBuffersPassed, fishingBuffersPassed ? 'Direction, hand and tip buffers reused' : 'Fishing coordinates allocated again');
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
fishMigrations.length = 0;
queueFishMigration(migrationProbe.chunk, probeFish);
const queued = fishMigrations[0] === migrationProbe.chunk &&
fishMigrations[1] === migrationProbe.neighbor && fishMigrations[2] === probeFish;
fishMigrations.length = 0;
const migrated = migrateFishToChunk(migrationProbe.chunk, migrationProbe.neighbor, probeFish);
const targetIndex = migrationProbe.neighbor.fish.indexOf(probeFish);
const migrationPassed = queued && migrated && targetIndex !== -1 && migrationProbe.chunk.fish.indexOf(probeFish) === -1;
if (targetIndex !== -1) migrationProbe.neighbor.fish.splice(targetIndex, 1);
record('Fish ownership migrates between chunks', migrationPassed, migrationPassed ? 'Border crossing queued and transferred' : 'Migration failed');
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
if (image.active && image.particleBorn === scene.time.now && image.particleLifetime === 300) {
releaseParticle(image);
}
}
const particleCountBeforeReuse = particlePool.length;
const availableBeforeReuse = availableParticles.length;
spawnParticle(scene, shadowLayer, scene.time.now, 0, 0, 0, 0, 1, FISHING_LINE_COLOR);
const reusedParticle = particlePool.length === particleCountBeforeReuse && availableParticles.length === availableBeforeReuse - 1;
const reusedImage = particlePool.find(image => image.active && image.particleLifetime === 1);
if (reusedImage) releaseParticle(reusedImage);
record('Particle pool reuses objects in constant time', reusedParticle, reusedParticle ? 'Free-list object reused' : 'Unexpected allocation');
showCatchCard(scene, scene.time.now, FISH_SPECIES[0]);
const catchCardPassed = catchCardTitle.textContent === 'You caught a Bluegill!' &&
catchCardDetail.textContent.includes('7c') && catchCardContainer.visible;
record('Catch card presents species and value', catchCardPassed, catchCardPassed ? 'Name and price rendered' : 'Catch card content missing');
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
const APP_CACHE_BUSTER = window.APP_CACHE_BUSTER;
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
const ITEM_LABEL_DURATION = 1300;
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
const MAP_PAN_SPEED = 90;
const MAP_MAX_ZOOM = 3;
const CAMERA_EASE = 2;
const PROMPT_SLIDE = 4;
let hotbarSelector;
const hotbarItemImages = [];
const hotbarItemNames = [];
let itemLabelUntil = 0;
let itemPrompt;
let selectedHotbarSlot = 0;
let worldObjectLayer;
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
const fishUniforms = new Float32Array(FISH_MAX_VISIBLE * 4);
const fishShapeUniforms = new Float32Array(FISH_MAX_VISIBLE * 4);
let horizontalPriority = 0;
let lastMenuWheelTime = -Infinity;
let verticalPriority = 0;
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
let fishingUiPanel;
let fishingCatchZoneTop;
let fishingCatchZoneMiddle;
let fishingCatchZoneBottom;
let fishingFishMarker;
let fishingProgressFill;
let fishingUiParts = [];
let fishingActionHeld = false;
let castCharge = null;
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
let cameraOffsetX = 0;
let cameraOffsetY = 0;
let promptState = -1;
const promptMotion = { value: 0 };
function preload() {
this.load.atlas('atlas', withCacheBuster('media/atlas.png'), withCacheBuster('media/atlas.json'));
}
function getTextureAliases() {
const aliases = [];
const alias = (key, path) => aliases.push([key, path]);
const tileKeys = [
'dirt1', 'dirtEdge', 'cornerDirt1', 'cornerDirt2', 'cornerDirt3', 'dirtEdgeCorner',
'dirtEdgeOuterLeft', 'dirtEdgeOuterRight', 'dirtEdgeOuterBoth', 'dirtEdgeInnerLeft', 'dirtEdgeInnerRight',
'dirtCliffCorner', 'waterDirtInnerLeft', 'waterDirtInnerRight', 'corner',
'grass1', 'grass2', 'grass3', 'grass4', 'grassEdge', 'water', 'waterDirt', 'waterGrass',
'wood', 'woodLeft', 'woodRight', 'transition1', 'transition2', 'transition3', 'transition4'
];
for (const direction of ['front', 'back', 'left', 'right']) {
for (const step of ['', 'walk1', 'walk2']) {
alias(`character-${direction}${step}`, `characters/player/${direction}${step}`);
}
}
for (const tileKey of tileKeys) {
alias(tileKey, `environment/terrain/${tileKey}`);
}
for (const key of ['bush', 'boulder', 'rock', 'tree-bare', 'store']) {
alias(key, `environment/objects/${key}`);
}
for (const mood of ['friendly', 'laughing', 'surprised']) {
alias(`guide-portrait-${mood}`, `characters/guide/${mood}`);
}
for (const rod of MARKET_RODS) {
alias(rod.texture, `items/rods/${rod.id}`);
alias(rod.icon, `items/rods/${rod.id}-icon`);
}
for (const bait of MARKET_BAITS) {
alias(bait.texture, `items/baits/${bait.id}Bait`);
alias(bait.icon, `items/baits/${bait.id}-icon`);
}
alias('hotbar', 'ui/hud/hotbar');
alias('selected', 'ui/hud/selected');
alias('shop-ui', 'ui/shop/panel');
alias('guide', 'characters/guide/sprite');
alias('chest', 'items/chest');
alias('fishing-ui', 'ui/fishing/panel');
alias('fishing-catch-zone', 'ui/fishing/catch-zone');
alias('fishing-fish', 'ui/fishing/fish');
alias('fishing-progress', 'ui/fishing/progress');
alias('waterOverlay', 'environment/effects/water-overlay');
alias('shimmer-art', 'environment/effects/shimmer');
return aliases;
}
function unpackAtlas(scene) {
const atlas = scene.textures.get('atlas');
const source = atlas.getSourceImage();
const paths = new Map(getTextureAliases().map(([key, path]) => [path, key]));
for (const path of atlas.getFrameNames()) {
const frame = atlas.get(path);
const canvas = document.createElement('canvas');
canvas.width = frame.cutWidth;
canvas.height = frame.cutHeight;
canvas.getContext('2d').drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
scene.textures.addCanvas(paths.get(path) || path, canvas);
}
scene.textures.remove('atlas');
}
function bindGameInput(scene) {
scene.input.on('pointermove', pointer => {
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
scene.input.setDefaultCursor(!isMenuOpen() && getClickedWorldTarget(pointer) ? 'pointer' : 'default');
});
const releaseAction = () => {
fishingActionHeld = false;
releaseCast(scene.time.now);
};
const pressAction = () => {
fishingActionHeld = true;
beginCast(scene.time.now);
};
scene.input.on('pointerup', () => {
mapDrag = null;
releaseAction();
});
scene.input.keyboard.on('keyup', event => event.code === 'Space' && releaseAction());
scene.input.on('pointerdown', pointer => {
if (inventoryOpen) {
if (pointer.y > DIALOGUE_VISIBLE_Y + INVENTORY_HEIGHT) closeInventory(scene);
} else if (marketOpen) {
const row = getMarketRowAt(pointer.x, pointer.y);
const tab = getMarketTabAt(pointer.x, pointer.y);
if (tab !== -1) {
setMarketPage(tab);
} else if (row !== -1) {
selectedMarketOption = row;
buySelectedMarketItem(scene);
} else if (pointer.y > DIALOGUE_VISIBLE_Y + MARKET_HEIGHT) {
closeMarket(scene);
}
} else if (dialogueOpen) {
const option = getDialogueOptionAt(pointer.x, pointer.y);
if (option === -1) {
finishGuideDialogueText();
} else {
selectedDialogueOption = option;
selectGuideDialogueOption(scene);
}
} else if (!mapOpen) {
const target = getClickedWorldTarget(pointer);
if (target) {
openInteraction(scene, target);
} else if (isBaitSlotAt(pointer.x, pointer.y)) {
cycleBait(scene);
} else {
pressAction();
}
} else if (pointer.y < DIALOGUE_VISIBLE_Y + MAP_PANEL_HEIGHT) {
mapDrag = { x: pointer.x, y: pointer.y, panX: mapPan.x, panY: mapPan.y };
} else {
closeMap(scene);
}
});
scene.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
const step = Math.sign(deltaY);
if (!step || inventoryOpen) return;
if (isMenuOpen()) {
if (pointer.event.timeStamp - lastMenuWheelTime < 120) return;
lastMenuWheelTime = pointer.event.timeStamp;
}
if (mapOpen) {
const zoom = Phaser.Math.Clamp(mapZoom - step, 1, MAP_MAX_ZOOM);
mapDirty ||= zoom !== mapZoom;
mapZoom = zoom;
} else if (marketOpen) {
moveMarketSelection(step);
} else if (dialogueOpen) {
moveGuideDialogueSelection(step);
} else {
selectHotbarSlot(scene, selectedHotbarSlot + step, true);
}
});
scene.input.keyboard.on('keydown', event => {
if (event.repeat) return;
const code = event.code;
const key = event.key.toLowerCase();
const slot = Number(event.key) - 1;
if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;
if (dialogueOpen) handleGuideDialogueKey(scene, event);
else if (inventoryOpen) handleInventoryKey(scene, event);
else if (mapOpen) handleMapKey(scene, event);
else if (marketOpen) handleMarketKey(scene, event);
else if (key === 'i') openInventory(scene);
else if (code === 'Space') pressAction();
else if (key === 'm') openMap(scene);
else if (key === 'b') cycleBait(scene);
else if (key === 'e') openInteraction(scene, getInteractionTarget(true));
else if (CHEATS_ENABLED && key === 's') spawnSturgeonAtCursor(scene);
else if (slot >= 0 && slot < 9) selectHotbarSlot(scene, slot);
});
}
function create() {
unpackAtlas(this);
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
createFishingUI(this);
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
createHotbarUI(this);
bindGameInput(this);
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
const LEGACY_ROD_IDS = { sturdy: 'intermediate', iron: 'master' };
const LEGACY_SPECIES_IDS = {
minnow: 'common-minnow',
carp: 'common-carp',
bass: 'largemouth-bass',
catfish: 'channel-catfish',
koi: 'goldfish'
};
function getSavedList(value) {
return Array.isArray(value) ? value : [];
}
function getSavedSpeciesId(id) {
return LEGACY_SPECIES_IDS[id] || id;
}
function restoreSavedRods(scene, rods) {
for (const savedId of getSavedList(rods)) {
const id = LEGACY_ROD_IDS[savedId] || savedId;
const rod = MARKET_RODS_BY_ID.get(id);
if (rod && !ownedRods.has(id)) {
ownedRods.add(id);
addHotbarItem(scene, rod.icon, rod.label);
}
}
}
function restoreSavedFish(fish) {
for (const [savedId, count] of getSavedList(fish)) {
const id = getSavedSpeciesId(savedId);
if (FISH_SPECIES_BY_ID.has(id) && Number.isInteger(count) && count > 0) {
fishInventory.set(id, (fishInventory.get(id) || 0) + count);
}
}
}
function restoreSavedCatchLog(ids) {
for (const savedId of getSavedList(ids)) {
const id = getSavedSpeciesId(savedId);
if (FISH_SPECIES_BY_ID.has(id)) catchLog.add(id);
}
}
function restoreSavedTileIds(target, ids) {
for (const id of getSavedList(ids)) {
if (Number.isSafeInteger(id)) target.add(id);
}
}
function restoreSavedBait(bait) {
for (const [id, count] of getSavedList(bait)) {
if (MARKET_BAITS_BY_ID.has(id) && Number.isInteger(count) && count > 0) baitInventory.set(id, count);
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
restoreSavedRods(scene, saved.rods);
restoreSavedFish(saved.fish);
restoreSavedCatchLog(saved.catchLog);
restoreSavedTileIds(discoveredChunks, saved.explored);
restoreSavedBait(saved.bait);
activeBaitId = baitInventory.has(saved.activeBait) ? saved.activeBait : null;
restoreSavedTileIds(openedChests, saved.chests);
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
if (characterShadow.x === x && characterShadow.y === y) return;
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
function actorBlocksRect(actor, hitX, hitY, width, height, left, top, right, bottom) {
return actor && left < actor.x + hitX + width && right > actor.x + hitX &&
top < actor.y + hitY + height && bottom > actor.y + hitY;
}
function canCharacterOccupy(scene, x, y) {
const left = x + CHARACTER_HITBOX_X;
const top = y + CHARACTER_HITBOX_Y;
const right = left + CHARACTER_HITBOX_WIDTH;
const bottom = top + CHARACTER_HITBOX_HEIGHT;
if (
actorBlocksRect(guide, GUIDE_HITBOX_X, GUIDE_HITBOX_Y, GUIDE_HITBOX_WIDTH, GUIDE_HITBOX_HEIGHT, left, top, right, bottom) ||
actorBlocksRect(store, STORE_HITBOX_X, STORE_HITBOX_Y, STORE_HITBOX_WIDTH, STORE_HITBOX_HEIGHT, left, top, right, bottom) ||
isBlockedByProp(left, top, right, bottom)
) {
return false;
}
const leftTile = Math.floor(left / TILE_SIZE);
const rightTile = Math.floor((right - 1) / TILE_SIZE);
const topTile = Math.floor(top / TILE_SIZE);
const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);
for (let tileY = topTile; tileY <= bottomTile; tileY++) {
for (let tileX = leftTile; tileX <= rightTile; tileX++) {
const tile = getWorldTile(tileX, tileY);
if (tile.blocking === 'full' && !tile.patches?.length) return false;
if (tile.blocking === 'lower' && bottom > tileY * TILE_SIZE + TILE_SIZE / 2) return false;
if (tile.blocking === 'lower' || tile.blocking !== 'full' && tile.baseKey !== 'water') continue;
const water = getTerrainSurface(scene, tile).water;
const startX = Math.max(left, tileX * TILE_SIZE) - tileX * TILE_SIZE;
const endX = Math.min(right, (tileX + 1) * TILE_SIZE) - tileX * TILE_SIZE;
const startY = Math.max(top, tileY * TILE_SIZE) - tileY * TILE_SIZE;
const endY = Math.min(bottom, (tileY + 1) * TILE_SIZE) - tileY * TILE_SIZE;
for (let pixelY = startY; pixelY < endY; pixelY++) {
for (let pixelX = startX; pixelX < endX; pixelX++) {
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
if (!allowNudge) return false;
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
if (!stepCharacter(scene, stepX, stepY, allowNudge)) return false;
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
function setCharacterTexture(key) {
if (key === characterTextureKey) return false;
characterTextureKey = key;
character.setTexture(key);
return true;
}
function update(time, delta) {
if (!character) return;
let moveX = 0;
let moveY = 0;
if (!isMenuOpen()) {
const left = characterKeys.left.isDown || characterKeys.leftArrow.isDown;
const right = characterKeys.right.isDown || characterKeys.rightArrow.isDown;
const up = characterKeys.up.isDown || characterKeys.upArrow.isDown;
const down = characterKeys.down.isDown || characterKeys.downArrow.isDown;
moveX = left && right ? horizontalPriority : left ? -1 : right ? 1 : 0;
moveY = up && down ? verticalPriority : up ? -1 : down ? 1 : 0;
if (moveX !== 0) characterDirection = moveX < 0 ? 'left' : 'right';
if (moveY !== 0) characterDirection = moveY < 0 ? 'back' : 'front';
}
const isWalking = moveX !== 0 || moveY !== 0;
characterMoving = isWalking;
if (!isWalking) {
characterWalkPhase = 1;
setCharacterTexture(`character-${characterDirection}`);
} else {
const pace = characterKeys.sprint.isDown ? CHARACTER_SPRINT_MULTIPLIER : 1;
const frameDelta = Math.min(delta, 50);
const distance = CHARACTER_SPEED * pace * frameDelta / 1000 * (moveX !== 0 && moveY !== 0 ? Math.SQRT1_2 : 1);
characterPace = pace;
characterWalkPhase += frameDelta * CHARACTER_ANIMATION_SPEED * pace / 1000;
characterMoveRemainderX += moveX * distance;
characterMoveRemainderY += moveY * distance;
const wholeMoveX = Math.trunc(characterMoveRemainderX);
const wholeMoveY = Math.trunc(characterMoveRemainderY);
characterMoveRemainderX -= wholeMoveX;
characterMoveRemainderY -= wholeMoveY;
if (!moveCharacterAxis(this, wholeMoveX, 0, moveY === 0)) characterMoveRemainderX = 0;
if (!moveCharacterAxis(this, 0, wholeMoveY, moveX === 0)) characterMoveRemainderY = 0;
const walkFrame = CHARACTER_WALK_FRAMES[Math.floor(characterWalkPhase) % 4];
if (setCharacterTexture(`character-${characterDirection}${walkFrame ? `walk${walkFrame}` : ''}`) && walkFrame) {
kickUpDust(this, time, moveX, moveY);
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
if (mapOpen) updateMapPan(this, delta);
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
