const npcCache = new Map();
const npcTradesDone = new Set();
const npcMemory = new Map();
const NPC_DIRECTIONS = [['left', -1, 0], ['right', 1, 0], ['front', 0, 1], ['back', 0, -1]];
const NPC_DIRECTION_STEPS = new Map(NPC_DIRECTIONS.map(([direction, stepX, stepY]) => [direction, [stepX, stepY]]));
let npcShadowPoints = null;
let nearestNpc = null;

function npcHash(tileX, tileY, salt) {
    return coordinateHash(tileX, tileY, Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER));
}

function npcRandom(npc) {
    let value = npc.rng = npc.rng + 0x6d2b79f5 | 0;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
}

function getNpcAt(tileX, tileY) {
    const cellX = Math.floor(tileX / NPC_CELL_SIZE), cellY = Math.floor(tileY / NPC_CELL_SIZE);
    const key = getTileId(cellX, cellY);
    let npc = npcCache.get(key);
    if (npc === undefined) npc = cacheWorldValue(npcCache, key, findCellNpc(cellX, cellY));
    return npc && npc.tileX === tileX && npc.tileY === tileY ? npc : null;
}

function isOpenWaterTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) === 'water' && !getWorldTile(tileX, tileY).key.startsWith('wood');
}

function findNpcWater(tileX, tileY) {
    for (const [direction, stepX, stepY] of NPC_DIRECTIONS) {
        for (let distance = 1; distance <= NPC_CAST_REACH; distance++) {
            const x = tileX + stepX * distance, y = tileY + stepY * distance;
            if (getWorldTile(x, y).key.startsWith('wood')) break;
            if (!isOpenWaterTile(x, y)) continue;
            if (isOpenWaterTile(x + stepX, y + stepY)) return { direction, x: x + stepX, y: y + stepY };
            break;
        }
    }
    return null;
}

function isNpcStandingTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) !== 'water' && isGuideSpawnTile(tileX, tileY);
}

function isNpcWalkableTile(tileX, tileY) {
    const tile = getWorldTile(tileX, tileY);
    if (tile.blocking || getPropCovering(tileX, tileY)) return false;
    if (tile.key.startsWith('wood')) return tile.key === 'wood';
    if (getTerrainType(tileX, tileY) === 'water') return false;
    if (guide && tileX === Math.floor(guide.x / TILE_SIZE) && tileY === Math.floor(guide.y / TILE_SIZE)) return false;
    if (!store) return true;
    const storeX = Math.floor(store.x / TILE_SIZE), storeY = Math.floor(store.y / TILE_SIZE);
    return tileX < storeX || tileX >= storeX + STORE_WIDTH_TILES || tileY < storeY || tileY >= storeY + STORE_HEIGHT_TILES;
}

function findCellNpc(cellX, cellY) {
    if (npcHash(cellX, cellY, 1300) >= NPC_CELL_CHANCE) return null;
    const wantsWater = npcHash(cellX, cellY, 1302) < NPC_FISHER_CHANCE;
    const tiles = [];
    for (let localY = NPC_CELL_MARGIN; localY < NPC_CELL_SIZE - NPC_CELL_MARGIN; localY++) {
        for (let localX = NPC_CELL_MARGIN; localX < NPC_CELL_SIZE - NPC_CELL_MARGIN; localX++) {
            const tileX = cellX * NPC_CELL_SIZE + localX, tileY = cellY * NPC_CELL_SIZE + localY;
            if (Math.abs(tileX) >= NPC_SPAWN_CLEARANCE || Math.abs(tileY) >= NPC_SPAWN_CLEARANCE) tiles.push([npcHash(tileX, tileY, 1301), tileX, tileY]);
        }
    }
    tiles.sort((a, b) => a[0] - b[0]);
    let fallback = null;
    for (const [, tileX, tileY] of tiles) {
        if (!isNpcStandingTile(tileX, tileY)) continue;
        const water = wantsWater ? findNpcWater(tileX, tileY) : null;
        if (!wantsWater || water) return createNpc(tileX, tileY, water);
        fallback ||= [tileX, tileY];
    }
    return fallback ? createNpc(fallback[0], fallback[1], null) : null;
}

function createNpc(tileX, tileY, water) {
    const pick = (count, salt) => Math.floor(npcHash(tileX, tileY, salt) * count);
    const accessory = npcHash(tileX, tileY, 1310) < NPC_ACCESSORY_CHANCE ? 1 : 0;
    return {
        id: getTileId(tileX, tileY),
        tileX,
        tileY,
        water,
        role: !water && npcHash(tileX, tileY, 1316) < NPC_TRADER_CHANCE ? 'trader' : 'villager',
        speed: NPC_SPEED_MIN + npcHash(tileX, tileY, 1317) * NPC_SPEED_RANGE,
        hasty: npcHash(tileX, tileY, 1318) < NPC_HASTY_CHANCE,
        seed: Math.floor(npcHash(tileX, tileY, 1319) * 4294967296) | 0,
        rodIndex: pick(MARKET_RODS.length, 1315),
        name: `${NPC_FIRST_NAMES[pick(NPC_FIRST_NAMES.length, 1303)]} ${NPC_LAST_NAMES[pick(NPC_LAST_NAMES.length, 1304)]}`,
        look: [
            pick(NPC_SKIN_TONES.length, 1305), pick(NPC_FACES, 1306), pick(NPC_SHIRTS, 1307), pick(NPC_SHIRT_COLORS.length, 1308),
            pick(NPC_PANTS_COLORS.length, 1309), accessory,
            accessory ? pick(NPC_ACCESSORIES, 1311) : pick(NPC_HAIRSTYLES, 1312),
            accessory ? pick(NPC_ACCESSORY_COLORS.length, 1313) : pick(NPC_HAIR_COLORS.length, 1314)
        ]
    };
}

function getNpcTexture(scene, look, direction, frame = 0) {
    return getPersonTexture(scene, `npc-${look.join('-')}-${direction}-${frame}`, look, direction, frame);
}

function spawnChunkNpcs(scene, chunkX, chunkY, sprites) {
    const npcs = [];
    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const home = getNpcAt(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);
            if (!home) continue;

            const npc = {
                ...home,
                x: home.tileX * TILE_SIZE,
                y: home.tileY * TILE_SIZE,
                direction: home.water ? home.water.direction : 'front',
                rng: home.seed,
                state: 'idle',
                until: 0,
                lookAt: 0,
                walkPhase: 1,
                frame: 0,
                remainderX: 0,
                remainderY: 0,
                path: [],
                failedSpots: new Set(),
                fishing: null,
                rod: MARKET_RODS[home.rodIndex]
            };
            npc.sprite = scene.add.image(npc.x, npc.y, getNpcTexture(scene, npc.look, npc.direction)).setOrigin(0).setDepth(npc.y + NPC_PART_SIZE);
            npc.shadow = scene.add.graphics();
            npc.line = scene.add.graphics();
            npc.waterShadow = scene.add.graphics().setDepth(1.25);
            worldObjectLayer.add([npc.sprite, npc.line]);
            shadowLayer.add(npc.shadow);
            sprites.push(npc.sprite, npc.shadow, npc.line, npc.waterShadow);
            restoreNpc(scene, npc);
            npcs.push(npc);
        }
    }
    return npcs;
}

function serializeNpc(npc, time) {
    const fishing = npc.fishing && (npc.fishing.state === 'floating' || npc.fishing.state === 'landing') ? npc.fishing : null;
    const goal = npc.state === 'walk' ? npc.path[npc.path.length - 1] : null;
    return {
        id: npc.id,
        x: npc.x,
        y: npc.y,
        direction: npc.direction,
        rng: npc.rng,
        wait: Math.max(0, Math.round(npc.until - time)),
        goal: goal ? [goal[0], goal[1], npc.goal] : null,
        spot: npc.spot ? [npc.spot.tileX, npc.spot.tileY] : null,
        bobber: fishing ? [fishing.toX, fishing.toY, Math.max(0, Math.round(fishing.reelAt - time))] : null
    };
}

function rememberChunkNpcs(chunk, time) {
    for (const npc of chunk.npcs || []) {
        if (npc.fishing?.lure) npc.fishing.lure.fish.npcLured = false;
        npcMemory.delete(npc.id);
        npcMemory.set(npc.id, serializeNpc(npc, time));
    }
    while (npcMemory.size > NPC_MEMORY_LIMIT) npcMemory.delete(npcMemory.keys().next().value);
}

function getSavedNpcs(time) {
    const saved = [];
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) saved.push(serializeNpc(npc, time));
    return saved;
}

function restoreSavedNpcs(scene, saved) {
    if (!Array.isArray(saved)) return;
    for (const state of saved) if (state && Number.isFinite(state.id)) npcMemory.set(state.id, state);
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) restoreNpc(scene, npc);
}

function restoreNpc(scene, npc) {
    const state = npcMemory.get(npc.id);
    if (!state || !Number.isFinite(state.x) || !Number.isFinite(state.y)) return;
    npcMemory.delete(npc.id);
    const time = scene.time.now;
    Object.assign(npc, { x: state.x, y: state.y, rng: state.rng | 0, state: 'idle', until: time + (state.wait || 0), path: [], fishing: null });
    if (NPC_DIRECTION_STEPS.has(state.direction)) npc.direction = state.direction;
    if (state.spot) {
        const water = findNpcWater(state.spot[0], state.spot[1]);
        if (water) npc.spot = { tileX: state.spot[0], tileY: state.spot[1], water };
    }
    if (state.bobber && npc.spot) {
        npc.direction = npc.spot.water.direction;
        npc.state = 'fishing';
        npc.fishing = createNpcCast(npc, time, state.bobber[0], state.bobber[1]);
        Object.assign(npc.fishing, { state: 'floating', bobberX: state.bobber[0], bobberY: state.bobber[1], lureAt: time + NPC_LURE_DELAY, reelAt: time + state.bobber[2] });
    } else if (state.goal) {
        const path = findNpcPath(Math.round(npc.x / TILE_SIZE), Math.round(npc.y / TILE_SIZE), state.goal[0], state.goal[1]);
        if (path) startNpcPath(npc, path, state.goal[2] === 'fish' && npc.spot ? 'fish' : 'wander', time);
    }
    npc.sprite.setPosition(npc.x, npc.y).setDepth(npc.y + NPC_PART_SIZE).setTexture(getNpcTexture(scene, npc.look, npc.direction));
}

function isBlockedByNpc(left, top, right, bottom, ignore) {
    for (const chunk of loadedChunks.values()) {
        for (const npc of chunk.npcs || []) {
            if (npc !== ignore && actorBlocksRect(npc, CHARACTER_HITBOX_X, CHARACTER_HITBOX_Y, CHARACTER_HITBOX_WIDTH, CHARACTER_HITBOX_HEIGHT, left, top, right, bottom)) return true;
        }
    }
    return false;
}

function canNpcOccupy(scene, npc, x, y) {
    const left = x + CHARACTER_HITBOX_X, top = y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH, bottom = top + CHARACTER_HITBOX_HEIGHT;
    if (actorBlocksRect(character, CHARACTER_HITBOX_X, CHARACTER_HITBOX_Y, CHARACTER_HITBOX_WIDTH, CHARACTER_HITBOX_HEIGHT, left, top, right, bottom)) return false;
    return canCharacterOccupy(scene, x, y, npc);
}

function drawNpcShadow(scene, npc) {
    const x = npc.x + ACTOR_SHADOW_X, y = npc.y + ACTOR_SHADOW_Y;
    if (npc.shadowX === x && npc.shadowY === y) return;
    npc.shadowX = x;
    npc.shadowY = y;
    npcShadowPoints ||= getShapePoints(ACTOR_SHADOW_SHAPE);
    npc.shadow.clear();
    for (let point = 0; point < npcShadowPoints.length; point += 2) {
        const color = getGroundShadowColor(scene, x + npcShadowPoints[point], y + npcShadowPoints[point + 1]);
        if (color) npc.shadow.fillStyle((color[0] << 16) | (color[1] << 8) | color[2], 1).fillRect(x + npcShadowPoints[point], y + npcShadowPoints[point + 1], 1, 1);
    }
}

function setNpcPose(scene, npc, direction, frame) {
    if (npc.direction === direction && npc.frame === frame) return;
    npc.direction = direction;
    npc.frame = frame;
    npc.sprite.setTexture(getNpcTexture(scene, npc.look, direction, frame));
}

function getDirectionToward(npc, targetX, targetY) {
    const x = targetX - npc.x, y = targetY - npc.y;
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'back' : 'front');
}

function findNpcPath(fromX, fromY, toX, toY) {
    if (!isNpcWalkableTile(toX, toY)) return null;
    const start = getTileId(fromX, fromY), goal = getTileId(toX, toY);
    if (start === goal) return [];
    const previous = new Map([[start, null]]);
    const queue = [[fromX, fromY]];
    for (let index = 0; index < queue.length && previous.size < NPC_PATH_LIMIT; index++) {
        const [x, y] = queue[index];
        for (const [, stepX, stepY] of NPC_DIRECTIONS) {
            const nextX = x + stepX, nextY = y + stepY, key = getTileId(nextX, nextY);
            if (previous.has(key) || !isNpcWalkableTile(nextX, nextY)) continue;
            previous.set(key, [x, y]);
            if (key === goal) {
                const path = [[nextX, nextY]];
                for (let tile = [x, y]; getTileId(tile[0], tile[1]) !== start; tile = previous.get(getTileId(tile[0], tile[1]))) path.unshift(tile);
                return path;
            }
            queue.push([nextX, nextY]);
        }
    }
    return null;
}

function startNpcPath(npc, path, goal, time) {
    npc.state = 'walk';
    npc.goal = goal;
    npc.path = path;
    npc.sprinting = npc.hasty && path.length >= NPC_SPRINT_DISTANCE;
    npc.stuckSince = time;
}

function rollNpcTile(npc, radius) {
    return [npc.tileX + Math.round((npcRandom(npc) * 2 - 1) * radius), npc.tileY + Math.round((npcRandom(npc) * 2 - 1) * radius)];
}

function chooseNpcPlan(npc, time) {
    const fromX = Math.round(npc.x / TILE_SIZE), fromY = Math.round(npc.y / TILE_SIZE);
    const radius = npc.role === 'trader' ? NPC_TRADER_ROAM : NPC_ROAM_RADIUS;
    if (npc.role !== 'trader' && npcRandom(npc) < NPC_FISH_CHANCE) {
        for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
            const [tileX, tileY] = rollNpcTile(npc, radius);
            if (npc.failedSpots.has(getTileId(tileX, tileY)) || !isNpcStandingTile(tileX, tileY)) continue;
            const water = findNpcWater(tileX, tileY);
            const path = water && findNpcPath(fromX, fromY, tileX, tileY);
            if (!path) continue;
            npc.spot = { tileX, tileY, water };
            startNpcPath(npc, path, 'fish', time);
            return;
        }
    }
    for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
        const [tileX, tileY] = rollNpcTile(npc, radius);
        const path = findNpcPath(fromX, fromY, tileX, tileY);
        if (!path || !path.length) continue;
        startNpcPath(npc, path, 'wander', time);
        return;
    }
    npc.until = time + NPC_IDLE_MIN;
}

function stepNpc(scene, npc, time, delta) {
    const next = npc.path[0];
    if (!next) return true;
    const targetX = next[0] * TILE_SIZE, targetY = next[1] * TILE_SIZE;
    const distanceX = targetX - npc.x, distanceY = targetY - npc.y;
    if (!distanceX && !distanceY) {
        npc.path.shift();
        return !npc.path.length;
    }

    const moveX = Math.sign(distanceX), moveY = distanceX ? 0 : Math.sign(distanceY);
    const pace = npc.speed * (npc.sprinting ? CHARACTER_SPRINT_MULTIPLIER : 1);
    const frameDelta = Math.min(delta, 50);
    const distance = CHARACTER_SPEED * pace * frameDelta / 1000;
    npc.remainderX += moveX * Math.min(distance, Math.abs(distanceX));
    npc.remainderY += moveY * Math.min(distance, Math.abs(distanceY));
    const wholeX = Math.trunc(npc.remainderX), wholeY = Math.trunc(npc.remainderY);
    npc.remainderX -= wholeX;
    npc.remainderY -= wholeY;

    let moved = false;
    for (let step = 0; step < Math.abs(wholeX); step++) {
        if (!canNpcOccupy(scene, npc, npc.x + moveX, npc.y)) break;
        npc.x += moveX;
        moved = true;
    }
    for (let step = 0; step < Math.abs(wholeY); step++) {
        if (!canNpcOccupy(scene, npc, npc.x, npc.y + moveY)) break;
        npc.y += moveY;
        moved = true;
    }
    if (moved || (!wholeX && !wholeY)) npc.stuckSince = time;

    npc.walkPhase += frameDelta * CHARACTER_ANIMATION_SPEED * pace / 1000;
    const direction = moveX ? (moveX < 0 ? 'left' : 'right') : (moveY < 0 ? 'back' : 'front');
    setNpcPose(scene, npc, direction, CHARACTER_WALK_FRAMES[Math.floor(npc.walkPhase) % 4]);
    npc.sprite.setPosition(npc.x, npc.y).setDepth(npc.y + NPC_PART_SIZE);
    return false;
}

function getNpcRodHand(npc) {
    const [stepX, stepY] = NPC_DIRECTION_STEPS.get(npc.direction);
    return [Math.round(npc.x + NPC_PART_SIZE / 2) + (stepY === 0 ? stepX * 3 : 3), npc.y + 11];
}

function getNpcRodTip(npc, time) {
    const [stepX, stepY] = NPC_DIRECTION_STEPS.get(npc.direction);
    const [handX, handY] = getNpcRodHand(npc);
    let tipX = stepY === 0 ? handX + stepX * 6 : handX + 1;
    let tipY = stepY === 0 ? handY - 6 : handY + stepY * 7;
    const fishing = npc.fishing;
    if (fishing?.state === 'casting') {
        const phase = Phaser.Math.Clamp((time - fishing.start) / CAST_SWING_DURATION, 0, 1);
        const reach = phase < 0.35 ? -3 * phase / 0.35 : -3 + 6 * (phase - 0.35) / 0.65;
        const lift = Math.round(Math.sin(phase * Math.PI) * 3);
        tipX += Math.round(stepX * reach + (stepY === 0 ? 0 : lift));
        tipY += Math.round(stepY * reach - (stepY === 0 ? lift : 0));
    } else if (fishing && waterFishingStates.has(fishing.state)) {
        const wobble = Math.sin((time - fishing.start) / 95 + fishing.driftPhase);
        tipX += stepY === 0 ? 0 : Math.round(wobble);
        tipY += stepY === 0 ? Math.round(wobble) : 0;
    }
    return [tipX, tipY];
}

function createNpcCast(npc, time, toX, toY) {
    const [tipX, tipY] = getNpcRodTip(npc, time);
    const power = npcRandom(npc);
    return {
        state: 'casting',
        start: time,
        releaseAt: time + CAST_SWING_DURATION + CAST_HANG_TIME,
        rod: npc.rod,
        duration: CAST_DURATION * (0.6 + power * 0.6),
        arc: CAST_ARC * (0.5 + power * 0.7),
        fromX: tipX,
        fromY: tipY,
        toX,
        toY,
        bobberX: tipX,
        bobberY: tipY,
        driftPhase: npcRandom(npc) * Math.PI * 2,
        rope: null,
        lure: null,
        nibbles: 0,
        nibbling: false
    };
}

function startNpcCast(npc, time) {
    const [stepX, stepY] = NPC_DIRECTION_STEPS.get(npc.direction);
    const centerX = npc.x + NPC_PART_SIZE / 2, footY = npc.y + NPC_PART_SIZE - 2;
    const targetX = npc.spot.water.x * TILE_SIZE + TILE_SIZE / 2, targetY = npc.spot.water.y * TILE_SIZE + TILE_SIZE / 2;
    const aim = Math.abs(stepX ? targetX - centerX : targetY - footY) + (npcRandom(npc) * 2 - 1) * NPC_CAST_ERROR;
    npc.fishing = createNpcCast(npc, time, Math.round(centerX + stepX * aim), Math.round(footY + stepY * aim));
    npc.state = 'fishing';
}

function findNpcLureFish(npc) {
    const { bobberX, bobberY } = npc.fishing;
    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish === fishing?.targetFish || fish.state === 'lure' || fish.state === 'flee' || fish.npcLured) continue;
            const x = fish.x - bobberX, y = fish.y - bobberY;
            if (x * x + y * y > NPC_LURE_RADIUS * NPC_LURE_RADIUS || !isFishPathClear(chunk, fish, bobberX, bobberY)) continue;
            fish.npcLured = true;
            fish.targetX = bobberX;
            fish.targetY = bobberY;
            fish.state = 'swim';
            fish.topSpeed = FISH_LURE_SPEED;
            fish.thrusting = true;
            fish.burstTimer = NPC_LURE_TIME;
            return { fish, chunk };
        }
    }
    return null;
}

function releaseNpcLure(npc) {
    if (npc.fishing?.lure) npc.fishing.lure.fish.npcLured = false;
    if (npc.fishing) npc.fishing.lure = null;
}

function scareNpcFish(npc, time) {
    const { fish, chunk } = npc.fishing.lure;
    const { bobberX, bobberY } = npc.fishing;
    releaseNpcLure(npc);
    if (chooseFishTarget(chunk, fish, fish.x - bobberX, fish.y - bobberY)) startFishFlee(fish, 700);
    npc.fishing.reelAt = Math.min(npc.fishing.reelAt, time + NPC_DISAPPOINT_TIME);
}

function startNpcReel(npc, time) {
    releaseNpcLure(npc);
    Object.assign(npc.fishing, { state: 'reeling', start: time, fromX: npc.fishing.bobberX, fromY: npc.fishing.bobberY });
}

function finishNpcFishing(npc, time, delay) {
    releaseNpcLure(npc);
    npc.fishing = null;
    npc.state = npc.talking ? 'talk' : 'idle';
    npc.until = time + delay;
}

function updateNpcFloat(scene, npc, time, age) {
    const fishing = npc.fishing;
    const candidateX = fishing.toX + Math.round(Math.sin(age / 1300 + fishing.driftPhase));
    const candidateY = fishing.toY + Math.round(Math.sin(age / 1700 + fishing.driftPhase * 0.7));
    const drifts = isWaterPixel(scene, candidateX, candidateY);
    fishing.bobberX = drifts ? candidateX : fishing.toX;
    fishing.bobberY = (drifts ? candidateY : fishing.toY) + (Math.floor(age / BOBBER_BOB_TIME) % 2);

    if (fishing.dipStart !== undefined) {
        const dip = time - fishing.dipStart;
        fishing.bobberY += Math.round(Math.sin(Math.min(1, dip / FISH_NIBBLE_DIP_TIME) * Math.PI) * 2);
        if (!fishing.rippled && dip >= FISH_NIBBLE_DIP_TIME * 0.25) {
            fishing.rippled = true;
            nibbleRipple(scene, time, fishing.bobberX, fishing.bobberY);
        }
        if (dip >= FISH_NIBBLE_DIP_TIME) fishing.dipStart = undefined;
    }

    if (!fishing.lure && !fishing.nibbling && time >= fishing.lureAt) {
        fishing.lure = findNpcLureFish(npc);
        fishing.lureAt = time + NPC_LURE_DELAY;
    }
    const fish = fishing.lure?.fish;
    if (fish && !fishing.nibbling) {
        const x = fish.x - fishing.bobberX, y = fish.y - fishing.bobberY;
        if (x * x + y * y < NPC_SCARE_RADIUS * NPC_SCARE_RADIUS) {
            fishing.nibbling = true;
            fishing.nibbles = 1 + Math.floor(npcRandom(npc) * NPC_MAX_NIBBLES);
            fishing.nibbleAt = time + 300 + npcRandom(npc) * 420;
        } else if (fish.state === 'flee' || fish.state === 'lure' || fish.state === 'idle') {
            releaseNpcLure(npc);
        }
    } else if (fish && fishing.dipStart === undefined && time >= fishing.nibbleAt) {
        if (fishing.nibbles > 0) {
            fishing.nibbles--;
            fishing.dipStart = time;
            fishing.rippled = false;
            fishing.nibbleAt = time + FISH_NIBBLE_DIP_TIME + 260 + npcRandom(npc) * 380;
        } else {
            fishing.nibbling = false;
            scareNpcFish(npc, time);
        }
    }
    if (time >= fishing.reelAt && fishing.dipStart === undefined) startNpcReel(npc, time);
}

function updateNpcFishing(scene, npc, time) {
    const fishing = npc.fishing;
    const age = time - fishing.start;
    const [tipX, tipY] = getNpcRodTip(npc, time);

    if (fishing.state === 'casting') {
        fishing.bobberX = tipX;
        fishing.bobberY = tipY;
        if (time >= fishing.releaseAt) {
            Object.assign(fishing, { state: 'flying', start: time, fromX: tipX, fromY: tipY });
            fishing.rope = createFishingRope(tipX, tipY, tipX, tipY - 2, Math.hypot(fishing.toX - tipX, fishing.toY - tipY) + fishing.arc * 0.8 + 5);
        }
    } else if (fishing.state === 'flying') {
        const amount = Math.min(1, age / fishing.duration);
        fishing.bobberX = Math.round(fishing.fromX + (fishing.toX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (fishing.toY - fishing.fromY) * amount - Math.sin(amount * Math.PI) * fishing.arc);
        if (amount >= 1 && !isWaterPixel(scene, fishing.toX, fishing.toY)) {
            groundLandingPuff(scene, time, fishing.toX, fishing.toY);
            npc.failedSpots.add(getTileId(npc.spot.tileX, npc.spot.tileY));
            finishNpcFishing(npc, time, NPC_RETRY_DELAY);
        } else if (amount >= 1) {
            Object.assign(fishing, { state: 'landing', start: time });
            splash(scene, time, fishing.toX, fishing.toY);
        }
    } else if (fishing.state === 'landing') {
        const amount = Math.min(1, age / BOBBER_LAND_TIME);
        fishing.bobberX = fishing.toX;
        fishing.bobberY = fishing.toY - Math.round(Math.sin(amount * Math.PI) * 2 * (1 - amount));
        if (amount >= 1) Object.assign(fishing, { state: 'floating', start: time, lureAt: time + NPC_LURE_DELAY, reelAt: time + NPC_FISH_MIN + npcRandom(npc) * NPC_FISH_RANGE });
    } else if (fishing.state === 'floating') {
        updateNpcFloat(scene, npc, time, age);
    } else {
        const amount = Math.min(1, age / REEL_DURATION);
        fishing.bobberX = Math.round(fishing.fromX + (tipX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (tipY - fishing.fromY) * amount);
        if (amount >= 1) finishNpcFishing(npc, time, NPC_IDLE_MIN + npcRandom(npc) * NPC_IDLE_RANGE);
    }
}

function drawNpcRod(scene, npc, time, delta) {
    if (!npc.fishing && !npc.lineDrawn) return;
    npc.line.clear();
    npc.waterShadow.clear();
    npc.lineDrawn = Boolean(npc.fishing);
    if (!npc.fishing) return;
    const [handX, handY] = getNpcRodHand(npc);
    const [tipX, tipY] = getNpcRodTip(npc, time);
    drawAnglerLine(scene, npc.fishing, { handX, handY, tipX, tipY, bodyY: npc.y, bodyDepth: npc.y + NPC_PART_SIZE, line: npc.line, waterShadow: npc.waterShadow }, delta);
}

function settleNpc(scene, npc, time, delay) {
    npc.walkPhase = 1;
    npc.path = [];
    setNpcPose(scene, npc, npc.direction, 0);
    npc.state = 'idle';
    npc.until = time + delay;
}

function updateNpc(scene, npc, time, delta) {
    if (npc.fishing) updateNpcFishing(scene, npc, time);
    if (npc.state === 'talk') {
        setNpcPose(scene, npc, getDirectionToward(npc, character.x, character.y), 0);
    } else if (npc.talking) {
        return drawNpcRod(scene, npc, time, delta);
    } else if (npc.state === 'idle') {
        if (time >= npc.lookAt) {
            npc.lookAt = time + NPC_LOOK_MIN + npcRandom(npc) * NPC_LOOK_RANGE;
            setNpcPose(scene, npc, NPC_DIRECTIONS[Math.floor(npcRandom(npc) * NPC_DIRECTIONS.length)][0], 0);
        }
        if (time >= npc.until) chooseNpcPlan(npc, time);
    } else if (npc.state === 'walk') {
        if (stepNpc(scene, npc, time, delta)) {
            settleNpc(scene, npc, time, NPC_IDLE_MIN + npcRandom(npc) * NPC_IDLE_RANGE);
            npc.lookAt = npc.until;
            if (npc.goal === 'fish') {
                setNpcPose(scene, npc, npc.spot.water.direction, 0);
                npc.state = 'aim';
                npc.until = time + NPC_AIM_MIN + npcRandom(npc) * NPC_AIM_RANGE;
            }
        } else if (time - npc.stuckSince > NPC_STUCK_TIME) {
            settleNpc(scene, npc, time, NPC_IDLE_MIN);
        }
    } else if (npc.state === 'aim') {
        if (time >= npc.until) startNpcCast(npc, time);
    }
    drawNpcRod(scene, npc, time, delta);
    drawNpcShadow(scene, npc);
}

function updateNpcs(scene, time, delta) {
    let nearest = null;
    let nearestDistance = NPC_TALK_DISTANCE_SQUARED;
    let moved = false;

    for (const chunk of loadedChunks.values()) {
        for (const npc of chunk.npcs || []) {
            const tile = getTileId(Math.round(npc.x / TILE_SIZE), Math.round(npc.y / TILE_SIZE));
            updateNpc(scene, npc, time, delta);
            moved ||= tile !== getTileId(Math.round(npc.x / TILE_SIZE), Math.round(npc.y / TILE_SIZE));
            const x = npc.x - character.x, y = npc.y - character.y, distance = x * x + y * y;
            if (distance < nearestDistance) [nearest, nearestDistance] = [npc, distance];
        }
    }
    if (moved) saveDirty = true;

    if (nearest === nearestNpc) return;
    nearestNpc = nearest;
    if (nearest && !isMenuOpen()) showItemLabel(scene, `E  Talk to ${nearest.name}`);
}

function getNpcTrade(npc) {
    const period = Math.floor(Date.now() / NPC_TRADE_PERIOD);
    const seed = Math.imul(WORLD_SEED + period, WORLD_HASH_MULTIPLIER);
    const species = FISH_SPECIES[Math.floor(coordinateHash(npc.tileX, npc.tileY, seed) * FISH_SPECIES.length)];
    const count = species.price > 20 ? 1 : 1 + Math.floor(coordinateHash(npc.tileY, npc.tileX, seed) * 3);
    const coins = Math.round(count * species.price * (1.5 + coordinateHash(npc.tileX + 1, npc.tileY, seed) * 0.8));
    return { period, species, count, coins };
}

function completeNpcTrade(scene, npc, trade) {
    const owned = fishInventory.get(trade.species.id) || 0;
    if (owned > trade.count) fishInventory.set(trade.species.id, owned - trade.count);
    else fishInventory.delete(trade.species.id);
    playerCoins = Math.min(Number.MAX_SAFE_INTEGER, playerCoins + trade.coins);
    recordPlayerStat('moneyEarned', trade.coins);
    recordPlayerStat('fishSold', trade.count);
    npcTradesDone.add(`${npc.id}:${trade.period}`);
    saveDirty = true;
    sparkleOverPlayer(scene);
}

function buildNpcDialogue(scene, npc) {
    const personality = NPC_PERSONALITIES[Math.floor(npcHash(npc.tileX, npc.tileY, 1320) * NPC_PERSONALITIES.length)];
    const pick = lines => lines[Math.floor(npcRandom(npc) * lines.length)];
    const first = npc.name.split(' ')[0];
    const portrait = getNpcTexture(scene, npc.look, 'front', 0);
    const node = (text, options) => ({ portrait, portraitScale: NPC_PORTRAIT_SCALE, text: text.replaceAll('{first}', first), options });
    const back = { label: 'Back', next: 'intro' };
    const bye = { label: 'Bye', close: true };
    const nodes = {
        chat: node(pick(personality.chatter), [back, bye]),
        tips: node(pick(npc.fishing ? personality.fishing : NPC_FISHING_TIPS), [back, bye])
    };

    if (npc.role !== 'trader') {
        nodes.intro = node(pick(personality.greetings), [{ label: 'Chat', next: 'chat' }, { label: npc.fishing ? 'Any bites?' : 'Tips', next: 'tips' }, bye]);
        return nodes;
    }

    const trade = getNpcTrade(npc);
    const { count, coins, species } = trade;
    const owned = fishInventory.get(species.id) || 0;
    nodes.intro = node(pick(personality.greetings), [{ label: 'Trade', next: 'trade' }, { label: 'Chat', next: 'chat' }, bye]);
    nodes.traded = node(personality.thanks.replace('{coins}', coins), [bye]);
    if (npcTradesDone.has(`${npc.id}:${trade.period}`)) {
        nodes.trade = node(personality.tradeDone, [back, bye]);
    } else if (owned >= count) {
        nodes.trade = node(`You have ${count} ${species.name}! I'll give you ${coins}c for ${count === 1 ? 'it' : 'them'}. Deal?`, [
            { label: 'Deal', action: () => (completeNpcTrade(scene, npc, trade), 'traded') },
            { label: 'No thanks', next: 'intro' }
        ]);
    } else {
        nodes.trade = node(`I'm looking for ${count} ${species.name}. Bring ${count === 1 ? 'one' : 'them'} by and I'll pay ${coins}c.`, [back, bye]);
    }
    return nodes;
}

function talkToNearestNpc(scene) {
    const npc = nearestNpc;
    if (!npc || isMenuOpen() || !dialogueContainer) return;
    if (npc.state === 'walk') settleNpc(scene, npc, scene.time.now, 0);
    if (npc.state === 'aim') npc.state = 'idle';
    npc.state = npc.fishing ? 'fishing' : 'talk';
    npc.talking = true;
    beginDialogue(scene, buildNpcDialogue(scene, npc), npc.sprite, npc.name, npc);
}

function releaseDialogueNpc(scene) {
    dialogueNpc.talking = false;
    if (dialogueNpc.state === 'talk') settleNpc(scene, dialogueNpc, scene.time.now, NPC_IDLE_MIN);
    dialogueNpc = null;
}
