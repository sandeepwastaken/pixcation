const npcCache = new Map();
const npcTradesDone = new Set();
const NPC_DIRECTIONS = [['left', -1, 0], ['right', 1, 0], ['front', 0, 1], ['back', 0, -1]];
let npcShadowPoints = null;
let nearestNpc = null;

function npcHash(tileX, tileY, salt) {
    return coordinateHash(tileX, tileY, Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER));
}

function getNpcAt(tileX, tileY) {
    const key = getTileId(tileX, tileY);
    const cached = npcCache.get(key);
    return cached !== undefined ? cached : cacheWorldValue(npcCache, key, findNpc(tileX, tileY));
}

function findNpcWater(tileX, tileY) {
    for (const [direction, stepX, stepY] of NPC_DIRECTIONS) {
        if (getTerrainType(tileX + stepX, tileY + stepY) !== 'water' && getTerrainType(tileX + stepX * 2, tileY + stepY * 2) !== 'water') continue;
        const distance = getTerrainType(tileX + stepX * 2, tileY + stepY * 2) === 'water' ? 2 : 1;
        return { direction, x: tileX + stepX * distance, y: tileY + stepY * distance };
    }
    return null;
}

function findNpc(tileX, tileY) {
    if (Math.abs(tileX) < NPC_SPAWN_CLEARANCE && Math.abs(tileY) < NPC_SPAWN_CLEARANCE) return null;
    const roll = npcHash(tileX, tileY, 1301);
    if (roll >= NPC_SHORE_CHANCE || !isGuideSpawnTile(tileX, tileY)) return null;
    const water = findNpcWater(tileX, tileY);
    if (!water && roll >= NPC_INLAND_CHANCE) return null;

    const pick = (count, salt) => Math.floor(npcHash(tileX, tileY, salt) * count);
    const accessory = npcHash(tileX, tileY, 1310) < NPC_ACCESSORY_CHANCE ? 1 : 0;
    return {
        id: getTileId(tileX, tileY),
        tileX,
        tileY,
        water,
        role: water ? 'fisher' : npcHash(tileX, tileY, 1302) < NPC_TRADER_CHANCE ? 'trader' : 'idle',
        name: `${NPC_FIRST_NAMES[pick(NPC_FIRST_NAMES.length, 1303)]} ${NPC_LAST_NAMES[pick(NPC_LAST_NAMES.length, 1304)]}`,
        look: [
            pick(NPC_SKIN_TONES.length, 1305), pick(NPC_FACES, 1306), pick(NPC_SHIRTS, 1307), pick(NPC_SHIRT_COLORS.length, 1308),
            pick(NPC_PANTS_COLORS.length, 1309), accessory,
            accessory ? pick(NPC_ACCESSORIES, 1311) : pick(NPC_HAIRSTYLES, 1312),
            accessory ? pick(NPC_ACCESSORY_COLORS.length, 1313) : pick(NPC_HAIR_COLORS.length, 1314)
        ],
        direction: water ? water.direction : 'front'
    };
}

function getNpcTexture(scene, look, direction) {
    return getPersonTexture(scene, `npc-${look.join('-')}-${direction}`, look, direction);
}

function plotNpcLine(graphics, fromX, fromY, toX, toY, color) {
    const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY), 1);
    graphics.fillStyle(color, 1);
    for (let step = 0; step <= steps; step++) {
        graphics.fillRect(Math.round(fromX + (toX - fromX) * step / steps), Math.round(fromY + (toY - fromY) * step / steps), 1, 1);
    }
}

function drawNpcFishingLine(scene, npc, sprites) {
    const [handX, handY] = { left: [5, 11], right: [10, 11], front: [12, 11], back: [3, 11] }[npc.direction];
    const [reachX, reachY] = { left: [-5, -6], right: [5, -6], front: [3, -4], back: [-3, -8] }[npc.direction];
    const fromX = npc.x + handX, fromY = npc.y + handY, tipX = fromX + reachX, tipY = fromY + reachY;
    const bobberX = npc.water.x * TILE_SIZE + TILE_SIZE / 2, bobberY = npc.water.y * TILE_SIZE + TILE_SIZE / 2;
    const line = scene.add.graphics().setDepth(npc.y + NPC_PART_SIZE + (npc.direction === 'back' ? -0.1 : 0.1));
    const bobber = scene.add.graphics().setDepth(bobberY);

    plotNpcLine(line, fromX, fromY, tipX, tipY, NPC_ROD_COLOR);
    plotNpcLine(line, tipX, tipY, bobberX, bobberY - 2, FISHING_LINE_COLOR);
    bobber.fillStyle(BOBBER_TOP_COLOR, 1).fillRect(bobberX - 1, bobberY - 2, 2, 1).fillStyle(BOBBER_BOTTOM_COLOR, 1).fillRect(bobberX - 1, bobberY - 1, 2, 1);
    worldObjectLayer.add([line, bobber]);
    sprites.push(line, bobber);
    return bobber;
}

function spawnChunkNpcs(scene, chunkX, chunkY, sprites) {
    const npcs = [];
    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const found = getNpcAt(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);
            if (!found) continue;

            const npc = { ...found, x: found.tileX * TILE_SIZE, y: found.tileY * TILE_SIZE, nextTurnAt: 0 };
            npc.sprite = scene.add.image(npc.x, npc.y, getNpcTexture(scene, npc.look, npc.direction)).setOrigin(0).setDepth(npc.y + NPC_PART_SIZE);
            worldObjectLayer.add(npc.sprite);
            sprites.push(npc.sprite);
            if (npc.water) npc.bobber = drawNpcFishingLine(scene, npc, sprites);
            npcs.push(npc);
        }
    }
    return npcs;
}

function forEachNpcShadowPoint(tileX, tileY, callback) {
    if (!getNpcAt(tileX, tileY)) return;
    npcShadowPoints ||= getShapePoints(ACTOR_SHADOW_SHAPE);
    for (let point = 0; point < npcShadowPoints.length; point += 2) {
        callback(tileX * TILE_SIZE + ACTOR_SHADOW_X + npcShadowPoints[point], tileY * TILE_SIZE + ACTOR_SHADOW_Y + npcShadowPoints[point + 1]);
    }
}

function isBlockedByNpc(left, top, right, bottom) {
    for (const chunk of loadedChunks.values()) {
        for (const npc of chunk.npcs || []) {
            if (actorBlocksRect(npc, GUIDE_HITBOX_X, GUIDE_HITBOX_Y, GUIDE_HITBOX_WIDTH, GUIDE_HITBOX_HEIGHT, left, top, right, bottom)) return true;
        }
    }
    return false;
}

function turnNpc(scene, npc, direction) {
    if (npc.direction === direction) return;
    npc.direction = direction;
    npc.sprite.setTexture(getNpcTexture(scene, npc.look, direction));
}

function getDirectionToward(npc) {
    const x = character.x - npc.x, y = character.y - npc.y;
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'back' : 'front');
}

function updateNpcs(scene, time) {
    let nearest = null;
    let nearestDistance = NPC_TALK_DISTANCE_SQUARED;

    for (const chunk of loadedChunks.values()) {
        if (!chunk.visible || !chunk.npcs) continue;
        for (const npc of chunk.npcs) {
            const x = npc.x - character.x, y = npc.y - character.y, distance = x * x + y * y;
            if (distance < nearestDistance) [nearest, nearestDistance] = [npc, distance];
            if (npc.bobber) {
                const bob = Math.floor(time / NPC_BOB_TIME + npc.tileX) % 2;
                if (npc.bobber.y !== bob) npc.bobber.y = bob;
            } else if (time >= npc.nextTurnAt) {
                npc.nextTurnAt = time + NPC_TURN_MIN + Math.random() * NPC_TURN_RANGE;
                turnNpc(scene, npc, ['front', 'left', 'right', 'front'][Math.floor(Math.random() * 4)]);
            }
        }
    }

    if (nearest && !nearest.bobber) turnNpc(scene, nearest, getDirectionToward(nearest));
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
        const lines = npc.role === 'fisher' ? NPC_FISHER_LINES : NPC_IDLE_LINES;
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
