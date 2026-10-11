const npcCache = new Map();
const npcTradesDone = new Set();
const NPC_DIRECTIONS = [['left', -1, 0], ['right', 1, 0], ['front', 0, 1], ['back', 0, -1]];
const NPC_DIRECTION_STEPS = new Map(NPC_DIRECTIONS.map(([direction, stepX, stepY]) => [direction, [stepX, stepY]]));
let npcShadowPoints = null;
let nearestNpc = null;

function npcHash(tileX, tileY, salt) {
    return coordinateHash(tileX, tileY, Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER));
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
                state: 'idle',
                until: 0,
                walkPhase: 1,
                frame: 0,
                remainderX: 0,
                remainderY: 0,
                failedSpots: new Set(),
                fishing: null,
                rod: MARKET_RODS[home.rodIndex]
            };
            npc.sprite = scene.add.image(npc.x, npc.y, getNpcTexture(scene, npc.look, npc.direction)).setOrigin(0).setDepth(npc.y + NPC_PART_SIZE);
            npc.shadow = scene.add.graphics();
            npc.line = scene.add.graphics();
            worldObjectLayer.add([npc.sprite, npc.line]);
            shadowLayer.add(npc.shadow);
            sprites.push(npc.sprite, npc.shadow, npc.line);
            npcs.push(npc);
        }
    }
    return npcs;
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

function startNpcWalk(npc, tileX, tileY, goal, time) {
    npc.state = 'walk';
    npc.goal = goal;
    npc.targetX = tileX * TILE_SIZE;
    npc.targetY = tileY * TILE_SIZE;
    npc.sprinting = goal === 'fish' && Math.random() < NPC_SPRINT_CHANCE;
    npc.stuckSince = time;
}

function rollNpcTile(npc, radius) {
    return [npc.tileX + Math.round((Math.random() * 2 - 1) * radius), npc.tileY + Math.round((Math.random() * 2 - 1) * radius)];
}

function chooseNpcPlan(npc, time) {
    const radius = npc.role === 'trader' ? NPC_TRADER_ROAM : NPC_ROAM_RADIUS;
    if (npc.role !== 'trader' && Math.random() < NPC_FISH_CHANCE) {
        for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
            const [tileX, tileY] = rollNpcTile(npc, radius);
            if (npc.failedSpots.has(getTileId(tileX, tileY)) || !isNpcStandingTile(tileX, tileY)) continue;
            const water = findNpcWater(tileX, tileY);
            if (!water) continue;
            npc.spot = { tileX, tileY, water };
            startNpcWalk(npc, tileX, tileY, 'fish', time);
            return;
        }
    }
    for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
        const [tileX, tileY] = rollNpcTile(npc, radius);
        if (!isNpcStandingTile(tileX, tileY)) continue;
        startNpcWalk(npc, tileX, tileY, 'wander', time);
        return;
    }
    npc.until = time + NPC_IDLE_MIN;
}

function stepNpc(scene, npc, time, delta) {
    const distanceX = npc.targetX - npc.x, distanceY = npc.targetY - npc.y;
    if (!distanceX && !distanceY) return true;

    const moveX = Math.sign(distanceX), moveY = Math.sign(distanceY);
    const pace = npc.speed * (npc.sprinting ? CHARACTER_SPRINT_MULTIPLIER : 1);
    const frameDelta = Math.min(delta, 50);
    const distance = CHARACTER_SPEED * pace * frameDelta / 1000 * (moveX && moveY ? Math.SQRT1_2 : 1);
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
    const direction = Math.abs(distanceX) > Math.abs(distanceY) ? (moveX < 0 ? 'left' : 'right') : (moveY < 0 ? 'back' : 'front');
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
    if (npc.fishing?.state === 'casting') {
        const phase = Phaser.Math.Clamp((time - npc.fishing.start) / CAST_SWING_DURATION, 0, 1);
        const reach = phase < 0.35 ? -3 * phase / 0.35 : -3 + 6 * (phase - 0.35) / 0.65;
        const lift = Math.round(Math.sin(phase * Math.PI) * 3);
        tipX += Math.round(stepX * reach + (stepY === 0 ? 0 : lift));
        tipY += Math.round(stepY * reach - (stepY === 0 ? lift : 0));
    }
    return [tipX, tipY];
}

function startNpcCast(npc, time) {
    const [stepX, stepY] = NPC_DIRECTION_STEPS.get(npc.direction);
    const [tipX, tipY] = getNpcRodTip(npc, time);
    const centerX = npc.x + NPC_PART_SIZE / 2, footY = npc.y + NPC_PART_SIZE - 2;
    const targetX = npc.spot.water.x * TILE_SIZE + TILE_SIZE / 2, targetY = npc.spot.water.y * TILE_SIZE + TILE_SIZE / 2;
    const aim = Math.abs(stepX ? targetX - centerX : targetY - footY) + (Math.random() * 2 - 1) * NPC_CAST_ERROR;
    const power = Math.random();
    npc.fishing = {
        state: 'casting',
        start: time,
        releaseAt: time + CAST_SWING_DURATION + CAST_HANG_TIME,
        duration: CAST_DURATION * (0.6 + power * 0.6),
        arc: CAST_ARC * (0.5 + power * 0.7),
        fromX: tipX,
        fromY: tipY,
        toX: Math.round(centerX + stepX * aim),
        toY: Math.round(footY + stepY * aim),
        bobberX: tipX,
        bobberY: tipY,
        lure: null
    };
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

function scareNpcFish(scene, npc, time) {
    const { fish, chunk } = npc.fishing.lure;
    const { bobberX, bobberY } = npc.fishing;
    fish.npcLured = false;
    nibbleRipple(scene, time, bobberX, bobberY);
    if (chooseFishTarget(chunk, fish, fish.x - bobberX, fish.y - bobberY)) startFishFlee(fish, 700);
    npc.fishing.lure = null;
    npc.fishing.reelAt = Math.min(npc.fishing.reelAt, time + NPC_DISAPPOINT_TIME);
}

function startNpcReel(npc, time) {
    const fishing = npc.fishing;
    if (fishing.lure) fishing.lure.fish.npcLured = false;
    fishing.lure = null;
    fishing.state = 'reeling';
    fishing.start = time;
    fishing.fromX = fishing.bobberX;
    fishing.fromY = fishing.bobberY;
}

function updateNpcFishing(scene, npc, time) {
    const fishing = npc.fishing;
    const age = time - fishing.start;
    const [tipX, tipY] = getNpcRodTip(npc, time);

    if (fishing.state === 'casting') {
        fishing.bobberX = tipX;
        fishing.bobberY = tipY;
        if (time >= fishing.releaseAt) Object.assign(fishing, { state: 'flying', start: time, fromX: tipX, fromY: tipY });
    } else if (fishing.state === 'flying') {
        const amount = Math.min(1, age / fishing.duration);
        fishing.bobberX = Math.round(fishing.fromX + (fishing.toX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (fishing.toY - fishing.fromY) * amount - Math.sin(amount * Math.PI) * fishing.arc);
        if (amount >= 1 && !isWaterPixel(scene, fishing.toX, fishing.toY)) {
            groundLandingPuff(scene, time, fishing.toX, fishing.toY);
            npc.failedSpots.add(getTileId(npc.spot.tileX, npc.spot.tileY));
            startNpcReel(npc, time);
        } else if (amount >= 1) {
            splash(scene, time, fishing.toX, fishing.toY);
            Object.assign(fishing, { state: 'floating', start: time, lureAt: time + NPC_LURE_DELAY, reelAt: time + NPC_FISH_MIN + Math.random() * NPC_FISH_RANGE });
        }
    } else if (fishing.state === 'floating') {
        fishing.bobberX = fishing.toX;
        fishing.bobberY = fishing.toY + (Math.floor(age / BOBBER_BOB_TIME) % 2);
        if (!fishing.lure && time >= fishing.lureAt) {
            fishing.lure = findNpcLureFish(npc);
            fishing.lureAt = time + NPC_LURE_DELAY;
        }
        const fish = fishing.lure?.fish;
        if (fish) {
            const x = fish.x - fishing.bobberX, y = fish.y - fishing.bobberY;
            if (x * x + y * y < NPC_SCARE_RADIUS * NPC_SCARE_RADIUS) scareNpcFish(scene, npc, time);
            else if (fish.state === 'flee' || fish.state === 'lure' || fish.state === 'idle') {
                fish.npcLured = false;
                fishing.lure = null;
            }
        }
        if (time >= fishing.reelAt) startNpcReel(npc, time);
    } else {
        const amount = Math.min(1, age / REEL_DURATION);
        fishing.bobberX = Math.round(fishing.fromX + (tipX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (tipY - fishing.fromY) * amount);
        if (amount >= 1) {
            npc.fishing = null;
            npc.state = 'idle';
            npc.until = time + NPC_IDLE_MIN + Math.random() * NPC_IDLE_RANGE;
        }
    }
}

function drawNpcRod(npc, time) {
    const graphics = npc.line;
    if (!npc.fishing && !npc.lineDrawn) return;
    graphics.clear();
    npc.lineDrawn = Boolean(npc.fishing);
    if (!npc.fishing) return;

    const fishing = npc.fishing;
    const { polePalette, linePalette, bobberPalette } = npc.rod;
    const [handX, handY] = getNpcRodHand(npc);
    const [tipX, tipY] = getNpcRodTip(npc, time);
    graphics.setDepth(Math.max(npc.y + NPC_PART_SIZE + 0.2, fishing.bobberY));
    plotFishingLine(handX, handY, tipX, tipY, 0, polePalette, graphics);
    if (fishing.state === 'casting') return;

    plotFishingLine(tipX, tipY, fishing.bobberX, fishing.bobberY - 2, fishing.state === 'floating' ? NPC_LINE_SAG : 1, linePalette, graphics);
    graphics
        .fillStyle(bobberPalette?.[2] || BOBBER_BOTTOM_COLOR, 1).fillRect(fishing.bobberX - 1, fishing.bobberY - 2, 2, 1)
        .fillStyle(bobberPalette?.[1] || BOBBER_TOP_COLOR, 1).fillRect(fishing.bobberX - 1, fishing.bobberY - 1, 1, 1)
        .fillStyle(bobberPalette?.[0] || BOBBER_TOP_COLOR, 1).fillRect(fishing.bobberX, fishing.bobberY - 1, 1, 1);
}

function settleNpc(scene, npc, time, delay) {
    npc.walkPhase = 1;
    setNpcPose(scene, npc, npc.direction, 0);
    npc.state = 'idle';
    npc.until = time + delay;
}

function updateNpc(scene, npc, time, delta) {
    if (npc.state === 'talk') {
        setNpcPose(scene, npc, getDirectionToward(npc, character.x, character.y), 0);
    } else if (npc.state === 'idle') {
        if (time >= npc.until) chooseNpcPlan(npc, time);
    } else if (npc.state === 'walk') {
        if (stepNpc(scene, npc, time, delta)) {
            settleNpc(scene, npc, time, NPC_IDLE_MIN + Math.random() * NPC_IDLE_RANGE);
            if (npc.goal === 'fish') {
                setNpcPose(scene, npc, npc.spot.water.direction, 0);
                npc.state = 'aim';
                npc.until = time + NPC_AIM_MIN + Math.random() * NPC_AIM_RANGE;
            }
        } else if (time - npc.stuckSince > NPC_STUCK_TIME) {
            settleNpc(scene, npc, time, NPC_IDLE_MIN);
        }
    } else if (npc.state === 'aim') {
        if (time >= npc.until) startNpcCast(npc, time);
    } else if (npc.state === 'fishing') {
        updateNpcFishing(scene, npc, time);
    }
    drawNpcRod(npc, time);
    drawNpcShadow(scene, npc);
}

function updateNpcs(scene, time, delta) {
    let nearest = null;
    let nearestDistance = NPC_TALK_DISTANCE_SQUARED;

    for (const chunk of loadedChunks.values()) {
        for (const npc of chunk.npcs || []) {
            updateNpc(scene, npc, time, delta);
            const x = npc.x - character.x, y = npc.y - character.y, distance = x * x + y * y;
            if (distance < nearestDistance) [nearest, nearestDistance] = [npc, distance];
        }
    }

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

function talkToNearestNpc(scene) {
    const npc = nearestNpc;
    if (!npc || isMenuOpen()) return;
    const time = scene.time.now;

    if (npc.role !== 'trader') {
        const lines = npc.fishing ? NPC_FISHER_LINES : NPC_IDLE_LINES;
        showRewardCard(scene, time, npc.name, lines[Math.floor(Math.random() * lines.length)]);
        return;
    }

    const trade = getNpcTrade(npc);
    const tradeKey = `${npc.id}:${trade.period}`;
    const owned = fishInventory.get(trade.species.id) || 0;
    if (npcTradesDone.has(tradeKey)) {
        showRewardCard(scene, time, npc.name, 'All set for now. Come back in an hour!');
    } else if (owned < trade.count) {
        showRewardCard(scene, time, npc.name, `I'd pay ${trade.coins}c for ${trade.count} ${trade.species.name}`);
    } else {
        if (owned > trade.count) fishInventory.set(trade.species.id, owned - trade.count);
        else fishInventory.delete(trade.species.id);
        playerCoins = Math.min(Number.MAX_SAFE_INTEGER, playerCoins + trade.coins);
        recordPlayerStat('moneyEarned', trade.coins);
        recordPlayerStat('fishSold', trade.count);
        npcTradesDone.add(tradeKey);
        saveDirty = true;
        sparkleOverPlayer(scene);
        showRewardCard(scene, time, `Traded with ${npc.name}!`, `${trade.count} ${trade.species.name} for ${trade.coins}c`);
    }
}
