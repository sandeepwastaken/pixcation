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

let cameraScrollX = 0;
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

    updateLoadedChunks(this, true);

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

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = chunkX * CHUNK_SIZE + localX;
            const tileY = chunkY * CHUNK_SIZE + localY;

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

        overlay.setPipeline('WaterWarp');

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

        const walkFrame = Math.floor(time * (CHARACTER_ANIMATION_SPEED / 1000)) % 3;

        const frameSuffix = walkFrame === 0 ? '' : `walk${walkFrame}`;
        const nextTextureKey = `character-${characterDirection}${frameSuffix}`;

        if (nextTextureKey !== characterTextureKey) {
            characterTextureKey = nextTextureKey;
            character.setTexture(characterTextureKey);
        }
    }    
    
    character.x = Math.round(character.x);
    character.y = Math.round(character.y);

    updateLoadedChunks(this);
    updateChunkWater(time, delta);
    updateCamera(delta);
}
