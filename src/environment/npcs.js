const npcCache = new Map();
const npcTradesDone = new Set();
const npcMemory = new Map();
const npcHouseCache = new Map(), npcHouseSprites = new Map(), npcHouseTiles = new Set();
const NPC_DIRECTIONS = [['left', -1, 0], ['right', 1, 0], ['front', 0, 1], ['back', 0, -1]];
const NPC_DIRECTION_STEPS = new Map(NPC_DIRECTIONS.map(([direction, stepX, stepY]) => [direction, [stepX, stepY]]));
let npcShadowPoints = null;
let nearestNpc = null;
const activeNpcs = [];
function isNpcInHomeArea(npc, x, y) { return Math.abs(x - npc.tileX) <= NPC_ROAM_RADIUS && Math.abs(y - npc.tileY) <= NPC_ROAM_RADIUS; }

function isNpcHouseSetbackClear(x, y) {
    for (let dy = -2; dy <= 4; dy++) for (let dx = -2; dx <= 4; dx++) {
        if (getTerrainType(x + dx, y + dy) === 'water') return false;
    }
    return true;
}

function getNpcConnection(npc) {
    const groupX = Math.floor(npc.tileX / (NPC_CELL_SIZE * 2)) * 2, groupY = Math.floor(npc.tileY / (NPC_CELL_SIZE * 2)) * 2;
    const neighbors = [];
    for (let y = groupY; y < groupY + 2; y++) for (let x = groupX; x < groupX + 2; x++) {
        const key = getTileId(x, y);
        if (!npcCache.has(key)) cacheWorldValue(npcCache, key, findCellNpc(x, y));
        const home = npcCache.get(key);
        if (home) neighbors.push(home);
    }
    const index = neighbors.findIndex(home => home.id === npc.id);
    const companion = index < 0 ? null : neighbors[index ^ 1];
    if (!companion) return null;
    const kind = ['sibling', 'cousin', 'close'][Math.min(2, Math.floor(npcHash(groupX, groupY, 1330 + Math.floor(index / 2)) * 3))];
    return { companion, kind };
}

function describeNpcConnection(npc, connection) {
    const name = connection.companion.name.split(' ')[0];
    const shared = npc.house?.residents?.includes(connection.companion.id);
    const text = (connection.kind === 'close' ? `I'm close to ${name}.` : `${name} is my ${connection.kind}.`) + (shared ? ' We share a home nearby.' : ' We spend time together around here.');
    const other = activeNpcs.find(resident => resident.id === connection.companion.id);
    if (!other) return text;
    if (other.state === 'home') return text + ` ${name} is at home for now.`;
    if (other.fishing) return text + ` ${name} is fishing at the moment.`;
    if (other.talking && other.joinedConversation === npc.id) return text + ` ${name} is here with us.`;
    if (other.state === 'walk' && other.goal === 'join' && other.joining === npc.id) return text + ` ${name} is coming over to say hello.`;
    if (other.state === 'walk' && other.goal === 'home') return text + ` ${name} is on the way home.`;
    if (other.state === 'walk' && other.goal === 'fish') return text + ` ${name} is heading to the water.`;
    return text;
}

function getNpcHouse(npc) {
    const peer = getNpcConnection(npc)?.companion;
    const residents = peer && Math.abs(peer.tileX - npc.tileX) <= 6 && Math.abs(peer.tileY - npc.tileY) <= 6 ? [npc, peer] : [npc];
    const id = Math.min(...residents.map(resident => resident.id));
    if (npcHouseCache.has(id)) return npcHouseCache.get(id);
    const centerX = Math.round(residents.reduce((sum, resident) => sum + resident.tileX, 0) / residents.length) - 1;
    const centerY = Math.round(residents.reduce((sum, resident) => sum + resident.tileY, 0) / residents.length) - 2;
    for (let radius = 0; radius <= 4; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) for (let offsetX = -radius; offsetX <= radius; offsetX++) {
            if (radius && Math.abs(offsetX) !== radius && Math.abs(offsetY) !== radius) continue;
            const x = centerX + offsetX, y = centerY + offsetY;
            if (!residents.every(resident => isNpcInHomeArea(resident, x + 1, y + 2))) continue;
            if (!isNpcHouseSetbackClear(x, y)) continue;
            if ([...npcHouseCache.values()].some(house => house && x < house.x + 3 && x + 3 > house.x && y < house.y + 3 && y + 3 > house.y)) continue;
            let clear = true;
            for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
                if (!isNpcStandingTile(x + dx, y + dy) || !isNpcWalkableTile(x + dx, y + dy) || dy < 2 && getNpcAt(x + dx, y + dy)) clear = false;
            }
            if (!clear) continue;
            const house = { id, x, y, doorX: x + 1, doorY: y + 2, residents: residents.map(resident => resident.id) };
            npcHouseCache.set(id, house);
            npcHouseTiles.add(getTileId(x, y + 1)); npcHouseTiles.add(getTileId(x + 1, y + 1)); npcHouseTiles.add(getTileId(x + 2, y + 1));
            return house;
        }
    }
    npcHouseCache.set(id, null);
    return null;
}

function updateNpcHouses(scene, time = scene.time.now) {
    const homes = scene.loadedNpcHouseIds ||= new Set(); homes.clear();
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) {
        const house = npc.house;
        if (!house || homes.has(house.id)) continue;
        homes.add(house.id);
        let sprite = npcHouseSprites.get(house.id);
        if (!sprite) {
            sprite = scene.add.image(house.x * TILE_SIZE, (house.y + 2) * TILE_SIZE - HOUSE_HEIGHT, 'house').setOrigin(0).setDepth((house.y + 2) * TILE_SIZE);
            worldObjectLayer.add(sprite); npcHouseSprites.set(house.id, sprite);
        }
        const left = character.x + CHARACTER_HITBOX_X, right = left + CHARACTER_HITBOX_WIDTH, bottom = character.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT;
        const hiding = character.visible !== false && right > sprite.x && left < sprite.x + HOUSE_WIDTH && bottom > sprite.y && bottom < sprite.y + HOUSE_HEIGHT;
        if (stepSeeThrough(sprite, hiding, time)) sprite.setTexture(seeThrough(scene, 'house', sprite.seeLevel));
    }
    for (const [id, sprite] of npcHouseSprites) if (!homes.has(id)) { sprite.destroy(); npcHouseSprites.delete(id); }
}

function findNpcMeetingPath(npc, target, scene) {
    const tileX = Math.round(target.x / TILE_SIZE), tileY = Math.round(target.y / TILE_SIZE);
    const spots = NPC_DIRECTIONS.map(([, x, y]) => [tileX + x, tileY + y]);
    spots.sort((a, b) => Math.abs(a[0] * TILE_SIZE - npc.x) + Math.abs(a[1] * TILE_SIZE - npc.y) - Math.abs(b[0] * TILE_SIZE - npc.x) - Math.abs(b[1] * TILE_SIZE - npc.y));
    for (const [x, y] of spots) {
        if (!isNpcInHomeArea(npc, x, y)) continue;
        if (Math.hypot(x * TILE_SIZE - target.x, y * TILE_SIZE - target.y) < NPC_CHAT_DISTANCE_MIN) continue;
        if (activeNpcs.some(other => other !== npc && Math.abs(other.x - x * TILE_SIZE) < TILE_SIZE / 2 && Math.abs(other.y - y * TILE_SIZE) < TILE_SIZE / 2)) continue;
        const path = findNpcRoute(scene, npc, x, y);
        if (path) return path;
    }
    return null;
}

function canNpcsTalkAcross(npc, other) {
    const steps = Math.ceil(Math.max(Math.abs(other.x - npc.x), Math.abs(other.y - npc.y)));
    let previousX = Math.round(npc.x / TILE_SIZE), previousY = Math.round(npc.y / TILE_SIZE);
    for (let step = 1; step <= steps; step++) {
        const x = Math.round((npc.x + (other.x - npc.x) * step / steps) / TILE_SIZE);
        const y = Math.round((npc.y + (other.y - npc.y) * step / steps) / TILE_SIZE);
        if (!isNpcWalkableTile(x, y)) return false;
        if (x !== previousX && y !== previousY && (!isNpcWalkableTile(x, previousY) || !isNpcWalkableTile(previousX, y))) return false;
        previousX = x; previousY = y;
    }
    return true;
}

function startNpcConversation(scene, npc, other, time) {
    if (!other || other.talking || other.fishing || !['idle', 'walk'].includes(other.state) || Math.hypot(npc.x - other.x, npc.y - other.y) > TILE_SIZE * 2) return false;
    if (Math.hypot(npc.x - other.x, npc.y - other.y) < NPC_CHAT_DISTANCE_MIN) return false;
    if (npc.talking || npc.fishing || npc.needsShelter || other.needsShelter || [npc, other].some(resident => resident.state === 'walk' && resident.goal === 'home')) return false;
    if (!canNpcsTalkAcross(npc, other)) return false;
    const connection = getNpcConnection(npc), close = connection?.companion.id === other.id;
    for (const [speaker, listener] of [[npc, other], [other, npc]]) {
        pauseNpcActivity(speaker);
        settleNpc(scene, speaker, time, 5000);
        speaker.state = 'social'; speaker.socialPartner = listener.id; speaker.nextSocialAt = time + 25000;
        speaker.lastActivity = 'social'; speaker.lastNeighbor = listener.name; saveDirty = true;
        setNpcPose(scene, speaker, getDirectionToward(speaker, listener.x, listener.y), 0);
    }
    npc.speech = close ? `Good to see you, ${other.name.split(' ')[0]}.` : 'How has your day been?';
    npc.speechFrom = time; npc.speechUntil = time + 2200;
    other.speech = close ? 'Fancy a walk together later?' : 'Pretty quiet. Any good catches?';
    other.speechFrom = time + 2500; other.speechUntil = time + 4800;
    if (npc.dailyPlan === 'home' || other.dailyPlan === 'home') { npc.speech = 'Heading home soon?'; other.speech = close && npc.house?.id === other.house?.id ? "Yes, I'll see you at home." : 'Yes, it has been a long day.'; }
    else if (other.dailyPlan === 'late') { npc.speech = 'Still fishing tonight?'; other.speech = 'Just a little longer. It is peaceful out here.'; }
    else if (npc.dailyPlan === 'evening' || other.dailyPlan === 'evening') { npc.speech = 'Taking it easy this evening?'; other.speech = 'Yes, just enjoying a little quiet time near home.'; }
    else if (getWorldClock().hour < 10) { npc.speech = `Morning, ${other.name.split(' ')[0]}. Any plans today?`; other.speech = other.water ? 'I think I will spend some time by the water.' : other.role === 'trader' ? 'A few trades, and hopefully a little time outside.' : 'A short walk first. Then I will see where the day takes me.'; }
    else if (other.pausedActivity?.goal === 'fish') { npc.speech = 'Off to the water?'; other.speech = 'Yes, I have a spot I wanted to try. We can catch up for a moment first.'; }
    npc.walkInvitation = close && npc.dailyPlan === 'day' && other.dailyPlan === 'day';
    return true;
}

function tryNpcPassingGreeting(npc, time) {
    if (npc.state !== 'walk' || npc.talking || npc.needsShelter || !['wander', 'windDown', 'leaveHome'].includes(npc.goal) || time < (npc.nextGreetingAt || 0)) return false;
    npc.nextGreetingAt = time + 1000;
    const other = activeNpcs.find(resident => resident !== npc && !resident.talking && !resident.needsShelter && resident.fishing?.state === 'floating' && time >= (resident.nextGreetingAt || 0) && Math.hypot(npc.x - resident.x, npc.y - resident.y) >= NPC_CHAT_DISTANCE_MIN && Math.hypot(npc.x - resident.x, npc.y - resident.y) <= TILE_SIZE * 2 && canNpcsTalkAcross(npc, resident));
    if (!other) return false;
    const hour = getWorldClock().hour, greeting = hour < 10 ? 'Morning' : hour >= 18 ? 'Evening' : 'Hi';
    for (const [speaker, listener, delay] of [[npc, other, 0], [other, npc, 1600]]) {
        speaker.speech = `${greeting}, ${listener.name.split(' ')[0]}.`;
        speaker.speechFrom = time + delay; speaker.speechUntil = time + delay + 1400;
        speaker.greetingUntil = speaker.speechUntil; speaker.nextGreetingAt = time + 30000;
        speaker.lastActivity = 'greeting'; speaker.lastNeighbor = listener.name; saveDirty = true;
    }
    return true;
}

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
    if (npcHouseTiles.has(getTileId(tileX, tileY))) return false;
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
    const appearance = getNpcAppearanceRolls(tileX, tileY);
    const pick = (count, salt) => Math.min(count - 1, Math.floor(npcHash(tileX, tileY, salt) * count));
    const rareVanity = appearance[0] < NPC_RARE_VANITY_CHANCE * NPC_APPEARANCE_RADICES[0], accessory = rareVanity || appearance[8] < NPC_ACCESSORY_CHANCE * 100 ? 1 : 0;
    const rareName = appearance[22] === 0, feminine = rareVanity || rareName || appearance[18] === 1, face = appearance[4], names = feminine ? NPC_COMMON_FEMININE_NAMES : NPC_COMMON_MASCULINE_NAMES;
    const shirts = feminine ? (face === 1 ? [0, 1, 2, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8]) : [0, 2, 4, 6, 7, 8], hairstyles = feminine ? [0, 2, 7, 8, 9] : face === 1 ? [0, 1, 5, 6, 8, 9] : [0, 1, 3, 4, 5, 6, 8, 9];
    const vanity = feminine ? [0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 6] : [0, 0, 1, 1, 2, 2, 3, 6, 6, 6, 6], pants = feminine ? [0, 1, 2, 3, 4] : [0, 2, 3, 4];
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
        name: (rareName ? 'Emz' : names[appearance[19] % names.length]) + (appearance[20] === 0 ? '' : ' ' + NPC_LAST_NAMES[appearance[21] % NPC_LAST_NAMES.length]),
        look: [
            appearance[1] < NPC_PASTEL_SKIN_CHANCE * NPC_APPEARANCE_RADICES[1] ? 5 : 0, face, shirts[appearance[5] % shirts.length], appearance[6],
            appearance[7], accessory,
            accessory ? (rareVanity ? 5 : vanity[appearance[9] % vanity.length]) : hairstyles[appearance[10] % hairstyles.length],
            accessory ? appearance[11] : appearance[12],
            appearance[13], appearance[12], (appearance[6] + 1 + appearance[14]) % NPC_SHIRT_COLORS.length, pants[appearance[15] % pants.length], (appearance[7] + 1 + appearance[16]) % NPC_PANTS_COLORS.length, getNpcEyeColor(appearance[17]), Number(feminine), (appearance[1] === 0 ? appearance[3] : appearance[2]) / 65535, appearance[23]
        ]
    };
}

function getNpcTexture(scene, look, direction, frame = 0, blink = false) {
    return getPersonTexture(scene, `npc-${look.join('-')}-${direction}-${frame}${blink ? '-blink' : ''}`, look, direction, frame, blink);
}

function getNpcAppearanceWord(tileX, tileY) {
    const seed = BigInt(WORLD_SEED_CODE), coordinate = BigInt.asUintN(32, BigInt(tileX)) << 32n | BigInt.asUintN(32, BigInt(tileY));
    const appearance = seed > BigInt(Number.MAX_SAFE_INTEGER) ? seed >> 32n : seed * 0xd6e8feb86659fd93a5a3564e27f8862bn;
    const word = BigInt.asUintN(256, (appearance + coordinate * 0xbf58476d1ce4e5b9a0761d6478bd642fn + 0x94d049bb133111ebn) * 0x9e3779b97f4a7c15d6e8feb86659fd93n);
    return word ^ word >> 128n;
}

function getNpcAppearanceRolls(tileX, tileY) {
    let word = getNpcAppearanceWord(tileX, tileY);
    return NPC_APPEARANCE_RADICES.map(radix => { const value = Number(word % BigInt(radix)); word /= BigInt(radix); return value; });
}
function getNpcEyeColor(roll) { let limit = 0; return NPC_EYE_WEIGHTS.findIndex(weight => roll < (limit += Math.round(weight * 100))); }

function makeNpcAppearanceSeed(worldSeed, tileX, tileY, rolls, variant = 0n) {
    if (!Number.isSafeInteger(worldSeed) || worldSeed <= 0 || worldSeed > 0xffffffff || !Number.isSafeInteger(tileX) || !Number.isSafeInteger(tileY) || rolls.length !== NPC_APPEARANCE_RADICES.length || rolls.some((value, index) => !Number.isSafeInteger(value) || value < 0 || value >= NPC_APPEARANCE_RADICES[index])) throw new Error('Invalid appearance seed inputs');
    let word = BigInt(variant);
    if (word < 0n) throw new Error('Invalid appearance seed variant');
    for (let index = rolls.length - 1; index >= 0; index--) word = word * BigInt(NPC_APPEARANCE_RADICES[index]) + BigInt(rolls[index]);
    if (word >= 1n << 256n) throw new Error('Appearance seed variant is too large');
    const coordinate = BigInt.asUintN(32, BigInt(tileX)) << 32n | BigInt.asUintN(32, BigInt(tileY));
    const appearance = BigInt.asUintN(256, ((word ^ word >> 128n) * 0x24bc96887abc5d05068448c9c39a8e00e38c9d69e07658b7cfee444d8b59a89bn) - coordinate * 0xbf58476d1ce4e5b9a0761d6478bd642fn - 0x94d049bb133111ebn);
    const seed = appearance << 32n | BigInt(worldSeed);
    if (seed <= BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Use another appearance seed variant');
    return seed.toString();
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
                until: scene.time.now + Math.round(npcHash(home.tileX, home.tileY, 1344) * NPC_IDLE_MIN),
                lookAt: scene.time.now + Math.round(npcHash(home.tileX, home.tileY, 1345) * NPC_LOOK_MIN),
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
            npc.house = getNpcHouse(npc);
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
    const goal = npc.pausedActivity ? [npc.pausedActivity.x, npc.pausedActivity.y] : npc.state === 'walk' ? npc.path[npc.path.length - 1] : null;
    return {
        id: npc.id,
        home: npc.state === 'home',
        visits: npc.playerVisits || 0,
        activity: npc.lastActivity || null,
        neighbor: npc.lastNeighbor || null,
        x: npc.x,
        y: npc.y,
        direction: npc.direction,
        rng: npc.rng,
        wait: Math.max(0, Math.round(npc.until - time)),
        goal: goal ? [goal[0], goal[1], npc.pausedActivity?.goal || npc.goal] : null,
        spot: npc.spot ? [npc.spot.tileX, npc.spot.tileY] : null,
        failedSpots: [...(npc.failedSpots || [])].filter(Number.isSafeInteger).slice(-NPC_FAILED_SPOT_LIMIT),
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
    const saved = new Map(npcMemory);
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) { saved.delete(npc.id); saved.set(npc.id, serializeNpc(npc, time)); }
    return [...saved.values()].slice(-NPC_MEMORY_LIMIT);
}

function restoreSavedNpcs(scene, saved) {
    if (!Array.isArray(saved)) return;
    for (const state of saved.slice(-NPC_MEMORY_LIMIT)) if (state && Number.isSafeInteger(state.id)) npcMemory.set(state.id, state);
    while (npcMemory.size > NPC_MEMORY_LIMIT) npcMemory.delete(npcMemory.keys().next().value);
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) restoreNpc(scene, npc);
}

function restoreNpc(scene, npc) {
    const state = npcMemory.get(npc.id);
    if (!state || !Number.isFinite(state.x) || !Number.isFinite(state.y)) return;
    npcMemory.delete(npc.id);
    const time = scene.time.now;
    Object.assign(npc, { x: Math.round(state.x), y: Math.round(state.y), rng: state.rng | 0, state: 'idle', until: time + (Number.isSafeInteger(state.wait) && state.wait >= 0 ? Math.min(state.wait, NPC_IDLE_MIN + NPC_IDLE_RANGE) : 0), path: [], fishing: null, spot: null, goal: null, pausedActivity: null, blockedPlanUntil: 0, talking: false, joining: null, joinedConversation: null, greetingUntil: 0, speechFrom: 0, speechUntil: 0 });
    npc.sprite.setVisible(true);
    npc.playerVisits = Number.isSafeInteger(state.visits) && state.visits >= 0 ? Math.min(100000, state.visits) : 0;
    npc.failedSpots = new Set(Array.isArray(state.failedSpots) ? state.failedSpots.filter(Number.isSafeInteger).slice(-NPC_FAILED_SPOT_LIMIT) : []);
    if (npc.bubble) npc.bubble.setVisible(false);
    npc.lastActivity = ['fishing', 'walk', 'social', 'greeting', 'rest'].includes(state.activity) ? state.activity : null;
    npc.lastNeighbor = typeof state.neighbor === 'string' ? state.neighbor.slice(0, 80) : null;
    if (!isNpcInHomeArea(npc, npc.x / TILE_SIZE, npc.y / TILE_SIZE)) { npc.x = npc.tileX * TILE_SIZE; npc.y = npc.tileY * TILE_SIZE; npc.sprite.setPosition(npc.x, npc.y).setDepth(npc.y + NPC_PART_SIZE); return; }
    if (state.home === true && npc.house) { npc.x = npc.house.doorX * TILE_SIZE; npc.y = npc.house.doorY * TILE_SIZE; npc.sprite.setPosition(npc.x, npc.y).setDepth(npc.y + NPC_PART_SIZE); enterNpcHouse(npc); return; }
    if (NPC_DIRECTION_STEPS.has(state.direction)) npc.direction = state.direction;
    if (Array.isArray(state.spot) && state.spot.length === 2 && state.spot.every(Number.isSafeInteger) && isNpcInHomeArea(npc, ...state.spot) && !npc.failedSpots.has(getTileId(...state.spot))) {
        const water = findNpcWater(state.spot[0], state.spot[1]);
        if (water) npc.spot = { tileX: state.spot[0], tileY: state.spot[1], water };
    }
    if (npc.spot && Array.isArray(state.bobber) && state.bobber.length === 3 && state.bobber.every(Number.isSafeInteger) && state.bobber[2] >= 0 && state.bobber[2] <= NPC_FISH_MIN + NPC_FISH_RANGE && Math.hypot(state.bobber[0] - npc.x, state.bobber[1] - npc.y) <= (npc.rod?.castDistance || CAST_MIN_DISTANCE + NPC_CAST_ERROR) + NPC_PART_SIZE) {
        npc.direction = npc.spot.water.direction;
        npc.state = 'fishing';
        npc.fishing = createNpcCast(npc, time, state.bobber[0], state.bobber[1], 0.5);
        Object.assign(npc.fishing, { state: 'floating', bobberX: state.bobber[0], bobberY: state.bobber[1], lureAt: time + NPC_LURE_DELAY, reelAt: time + state.bobber[2] });
    } else if (Array.isArray(state.goal) && state.goal.length === 3 && state.goal.slice(0, 2).every(Number.isSafeInteger) && typeof state.goal[2] === 'string' && isNpcInHomeArea(npc, state.goal[0], state.goal[1])) {
        const homeGoal = state.goal[2] === 'home';
        const path = (!homeGoal || npc.house && (getNpcDailyPlan(npc, getWorldClock()) === 'home' || getRainIntensity(getWorldClock()) >= 0.25)) && findNpcRoute(scene, npc, state.goal[0], state.goal[1]);
        const goal = homeGoal ? 'home' : state.goal[2] === 'fish' && npc.spot ? 'fish' : ['windDown', 'leaveHome'].includes(state.goal[2]) ? state.goal[2] : 'wander';
        if (path) startNpcPath(npc, path, goal, time);
        else if (path === null) { npc.pausedActivity = { x: state.goal[0], y: state.goal[1], goal }; npc.blockedPlanUntil = time + NPC_BLOCKED_PLAN_WAIT; npc.until = time + NPC_BLOCKED_PLAN_RETRY; }
    }
    npc.sprite.setPosition(npc.x, npc.y).setDepth(npc.y + NPC_PART_SIZE).setTexture(getNpcTexture(scene, npc.look, npc.direction));
}

function isBlockedByNpc(left, top, right, bottom, ignore) {
    for (const npc of activeNpcs) {
        if (npc !== ignore && npc.state !== 'home' && actorBlocksRect(npc, CHARACTER_HITBOX_X, CHARACTER_HITBOX_Y, CHARACTER_HITBOX_WIDTH, CHARACTER_HITBOX_HEIGHT, left, top, right, bottom)) return true;
        if (npc.house && actorBlocksRect({ x: npc.house.x * TILE_SIZE, y: npc.house.y * TILE_SIZE }, 0, TILE_SIZE, HOUSE_WIDTH, TILE_SIZE, left, top, right, bottom)) return true;
    }
    return false;
}

function isNpcNearCamera(npc) {
    return npc.x > mainCamera.scrollX - NPC_DRAW_MARGIN && npc.x < mainCamera.scrollX + mainCamera.width + NPC_DRAW_MARGIN &&
        npc.y > mainCamera.scrollY - NPC_DRAW_MARGIN && npc.y < mainCamera.scrollY + mainCamera.height + NPC_DRAW_MARGIN;
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
    npc.sprite.setTexture(getNpcTexture(scene, npc.look, direction, frame, npc.sprite.personBlinkState?.closed));
}

function getDirectionToward(npc, targetX, targetY) {
    const x = targetX - npc.x, y = targetY - npc.y;
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'back' : 'front');
}

function getNpcIdleDirection(npc) {
    let target = null, distance = (TILE_SIZE * 3) ** 2;
    for (const other of [character, ...activeNpcs]) {
        if (other === npc || other.state === 'home' || other.visible === false) continue;
        const separation = (other.x - npc.x) ** 2 + (other.y - npc.y) ** 2;
        if (!separation || separation >= distance || !canNpcsTalkAcross(npc, other)) continue;
        target = other; distance = separation;
    }
    return target ? getDirectionToward(npc, target.x, target.y) : npcRandom(npc) < 0.65 ? npc.direction : NPC_DIRECTIONS[Math.floor(npcRandom(npc) * NPC_DIRECTIONS.length)][0];
}

function canNpcTraverse(scene, npc, x, y, targetX, targetY) {
    if (!canNpcOccupy(scene, npc, x, y)) return false;
    while (x !== targetX || y !== targetY) {
        if (x !== targetX) x += Math.sign(targetX - x) * Math.min(1, Math.abs(targetX - x));
        else y += Math.sign(targetY - y) * Math.min(1, Math.abs(targetY - y));
        if (!canNpcOccupy(scene, npc, x, y)) return false;
    }
    return true;
}

function getNpcBlockingNeighbor(npc) {
    const next = npc.path[0] || (npc.pausedActivity && [npc.pausedActivity.x, npc.pausedActivity.y]);
    if (!next) return null;
    const stepX = Math.sign(next[0] * TILE_SIZE - npc.x), stepY = stepX ? 0 : Math.sign(next[1] * TILE_SIZE - npc.y);
    const left = npc.x + stepX + CHARACTER_HITBOX_X, top = npc.y + stepY + CHARACTER_HITBOX_Y;
    return activeNpcs.find(other => other !== npc && other.state !== 'home' && actorBlocksRect(other, CHARACTER_HITBOX_X, CHARACTER_HITBOX_Y, CHARACTER_HITBOX_WIDTH, CHARACTER_HITBOX_HEIGHT, left, top, left + CHARACTER_HITBOX_WIDTH, top + CHARACTER_HITBOX_HEIGHT));
}

function pauseNpcActivity(npc) {
    if ((npc.goal === 'yield' || npc.state === 'social' || npc.state === 'idle' && npc.blockedPlanUntil) && npc.pausedActivity) return;
    const preparing = npc.state === 'aim' || npc.state === 'charge';
    const destination = npc.state === 'walk' ? npc.path[npc.path.length - 1] : preparing && npc.spot ? [npc.spot.tileX, npc.spot.tileY] : null;
    const goal = preparing ? 'fish' : npc.goal;
    npc.pausedActivity = destination && ['wander', 'fish', 'home', 'stroll', 'windDown', 'leaveHome'].includes(goal) ? { x: destination[0], y: destination[1], goal } : null;
}

function describeNpcPlans(npc) {
    const goal = npc.pausedActivity?.goal;
    if (npc.needsShelter) return 'I am getting out of the rain for a while. I will come back out when it eases up.';
    if (goal === 'home' || npc.dailyPlan === 'home') return 'I was heading home. It is getting late, but I have a moment to talk.';
    if (goal === 'windDown' || npc.dailyPlan === 'evening') return 'I am winding down for the evening. I like staying near home before it gets too late.';
    if (goal === 'leaveHome') return 'I was just stepping outside. It is nice to get a little fresh air before deciding what to do.';
    if (goal === 'stroll') return 'We were taking a walk together. There is no hurry - it is nice just to spend some time outside.';
    if (goal === 'fish') return 'I was getting ready to fish. I have a spot nearby that I wanted to try.';
    if (npc.fishing || npc.dailyPlan === 'late') return 'I am staying by the water for a while. I like taking my time with it.';
    if (goal === 'wander') return 'I was stretching my legs around the neighborhood. I will finish my walk after we chat.';
    return 'Nothing urgent. I am taking a little break and seeing who is around.';
}

function resumeNpcActivity(scene, npc, time) {
    const activity = npc.pausedActivity;
    npc.pausedActivity = null;
    if (!activity) return false;
    const clock = getWorldClock();
    const dailyPlan = getNpcDailyPlan(npc, clock);
    const wantsHome = dailyPlan === 'home' || npc.house && getRainIntensity(clock) >= (npc.needsShelter ? 0.25 : 0.65);
    if (wantsHome && npc.house && activity.goal !== 'home' || activity.goal === 'home' && (!npc.house || !wantsHome)) return false;
    const x = activity.goal === 'home' ? npc.house.doorX : activity.x, y = activity.goal === 'home' ? npc.house.doorY : activity.y;
    if (activity.goal === 'fish') {
        const water = findNpcWater(x, y);
        if (!water || npc.failedSpots.has(getTileId(x, y))) return false;
        npc.spot = { tileX: x, tileY: y, water };
    }
    const path = findNpcRoute(scene, npc, x, y);
    if (!path) { npc.pausedActivity = activity; npc.blockedPlanUntil ||= time + NPC_BLOCKED_PLAN_WAIT; npc.until = time + NPC_BLOCKED_PLAN_RETRY; return tryNpcStepAside(scene, npc, time); }
    const partner = activity.goal === 'stroll' && activeNpcs.find(other => other.id === npc.walkPartner);
    const goal = activity.goal === 'stroll' && (!partner || partner.goal !== 'stroll' && partner.pausedActivity?.goal !== 'stroll') ? 'wander' : activity.goal;
    startNpcPath(npc, path, goal, time);
    if (goal === 'stroll') npc.walkEnds = time + 20000;
    return true;
}

function findNpcPath(fromX, fromY, toX, toY, npc, scene) {
    if (!isNpcWalkableTile(toX, toY)) return null;
    const start = getTileId(fromX, fromY), goal = getTileId(toX, toY);
    if (start === goal) return [];
    const previous = new Map([[start, null]]);
    const queue = [[fromX, fromY]];
    for (let index = 0; index < queue.length && previous.size < NPC_PATH_LIMIT; index++) {
        const [x, y] = queue[index];
        for (const [, stepX, stepY] of NPC_DIRECTIONS) {
            const nextX = x + stepX, nextY = y + stepY, key = getTileId(nextX, nextY);
            if (npc && !isNpcInHomeArea(npc, nextX, nextY)) continue;
            if (previous.has(key) || !isNpcWalkableTile(nextX, nextY)) continue;
            if (scene && !canNpcTraverse(scene, npc, x * TILE_SIZE, y * TILE_SIZE, nextX * TILE_SIZE, nextY * TILE_SIZE)) continue;
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
    if (npc.blockedPlanUntil && goal !== 'join' && goal !== 'yield') npc.pausedActivity = null;
    npc.blockedPlanUntil = 0;
    npc.state = 'walk';
    npc.goal = goal;
    npc.path = path;
    npc.sprinting = false;
    npc.remainderX = npc.remainderY = 0;
    npc.stuckSince = time;
}

function findNpcRoute(scene, npc, toX, toY) {
    const anchors = [...new Set([Math.floor(npc.x / TILE_SIZE), Math.ceil(npc.x / TILE_SIZE)])].flatMap(x => [...new Set([Math.floor(npc.y / TILE_SIZE), Math.ceil(npc.y / TILE_SIZE)])].map(y => [x, y]));
    let route = null, distance = Infinity;
    for (const [x, y] of anchors) {
        if (!isNpcInHomeArea(npc, x, y) || !canNpcTraverse(scene, npc, npc.x, npc.y, x * TILE_SIZE, y * TILE_SIZE)) continue;
        const path = findNpcPath(x, y, toX, toY, npc, scene);
        if (!path) continue;
        const length = Math.abs(x * TILE_SIZE - npc.x) + Math.abs(y * TILE_SIZE - npc.y) + path.length * TILE_SIZE;
        if (length >= distance) continue;
        route = npc.x === x * TILE_SIZE && npc.y === y * TILE_SIZE ? path : [[x, y], ...path];
        distance = length;
    }
    return route;
}

function tryNpcStepAside(scene, npc, time) {
    const other = getNpcBlockingNeighbor(npc);
    if (!npc.pausedActivity || !other || npc.id <= other.id || other.talking || other.fishing || !(other.state === 'walk' || other.blockedPlanUntil && other.pausedActivity)) return false;
    const centerX = Math.round(npc.x / TILE_SIZE), centerY = Math.round(npc.y / TILE_SIZE);
    const horizontal = Math.abs(other.x - npc.x) >= Math.abs(other.y - npc.y);
    for (let y = centerY - 2; y <= centerY + 2; y++) for (let x = centerX - 2; x <= centerX + 2; x++) {
        if (horizontal ? y === centerY : x === centerX) continue;
        if (!isNpcInHomeArea(npc, x, y)) continue;
        if ([other.path.at(-1), other.pausedActivity && [other.pausedActivity.x, other.pausedActivity.y]].some(destination => destination?.[0] === x && destination?.[1] === y)) continue;
        const path = findNpcRoute(scene, npc, x, y);
        if (!path?.length) continue;
        startNpcPath(npc, path, 'yield', time);
        return true;
    }
    return false;
}

function rerouteNpc(scene, npc, time) {
    const destination = npc.path[npc.path.length - 1];
    if (!destination) return false;
    const blocker = getNpcBlockingNeighbor(npc);
    if (blocker?.state === 'walk' && npc.id > blocker.id && time - npc.stuckSince < NPC_STUCK_TIME + 1500) return true;
    const path = findNpcRoute(scene, npc, destination[0], destination[1]);
    if (!path?.length) return false;
    startNpcPath(npc, path, npc.goal, time);
    return true;
}

function rollNpcTile(npc, radius) {
    return [npc.tileX + Math.round((npcRandom(npc) * 2 - 1) * radius), npc.tileY + Math.round((npcRandom(npc) * 2 - 1) * radius)];
}

function tryNpcSharedWalk(scene, npc, other, time) {
    if (!npc.walkInvitation || !other || other.talking || other.fishing || !['social', 'idle'].includes(other.state)) return false;
    npc.walkInvitation = false;
    if (npc.dailyPlan !== 'day' || other.dailyPlan !== 'day' || npc.needsShelter || other.needsShelter) return false;
    const radius = npc.role === 'trader' || other.role === 'trader' ? NPC_TRADER_ROAM : NPC_ROAM_RADIUS;
    for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
        const [x, y] = rollNpcTile(npc, radius);
        if (!isNpcInHomeArea(other, x, y)) continue;
        const path = findNpcRoute(scene, npc, x, y);
        if (!path?.length) continue;
        for (const [, dx, dy] of NPC_DIRECTIONS) {
            const otherX = x + dx, otherY = y + dy;
            if (!isNpcInHomeArea(npc, otherX, otherY) || !isNpcInHomeArea(other, otherX, otherY)) continue;
            const otherPath = findNpcRoute(scene, other, otherX, otherY);
            if (!otherPath?.length) continue;
            for (const [walker, partner, route] of [[npc, other, path], [other, npc, otherPath]]) {
                walker.pausedActivity = null;
                startNpcPath(walker, route, 'stroll', time);
                walker.walkPartner = partner.id; walker.walkEnds = time + 20000; walker.strollSpeed = Math.min(npc.speed, other.speed);
            }
            return true;
        }
    }
    return false;
}

function waitForNpcWalkPartner(scene, npc, time) {
    const other = activeNpcs.find(other => other.id === npc.walkPartner);
    if (!other || other.talking || other.fishing || other.state === 'home' || other.goal !== 'stroll' || time >= npc.walkEnds) { npc.goal = 'wander'; npc.walkPartner = null; return false; }
    if (other.state !== 'walk' || npc.path.length >= other.path.length || Math.hypot(npc.x - other.x, npc.y - other.y) <= TILE_SIZE * 3) return false;
    npc.walkSpeed = 0; npc.stuckSince = time;
    return true;
}

function tryNpcSocialPlan(scene, npc, time) {
    if (time < (npc.nextSocialAt || 0) || npcRandom(npc) >= 0.2 + npcHash(npc.tileX, npc.tileY, 1341) * 0.5) return false;
    const connection = getNpcConnection(npc);
    const candidates = activeNpcs.filter(other => other !== npc && !other.talking && !other.fishing && !other.needsShelter && !(other.dailyPlan === 'home' && other.house) && ['idle', 'walk'].includes(other.state) && !(other.state === 'walk' && other.goal === 'home') && time >= (other.nextSocialAt || 0));
    candidates.sort((a, b) => (a.id === connection?.companion.id ? -1 : b.id === connection?.companion.id ? 1 : Math.hypot(a.x - npc.x, a.y - npc.y) - Math.hypot(b.x - npc.x, b.y - npc.y)));
    for (const other of candidates) {
        if (Math.hypot(npc.x - other.x, npc.y - other.y) > TILE_SIZE * 8) continue;
        const path = findNpcMeetingPath(npc, other, scene);
        if (!path) continue;
        npc.socialPartner = other.id; npc.nextSocialAt = time + 15000; npc.socialApproachUntil = time + NPC_SOCIAL_APPROACH_TIME;
        if (!path.length) return startNpcConversation(scene, npc, other, time);
        startNpcPath(npc, path, other.state === 'walk' && other.id === connection?.companion.id ? 'follow' : 'visit', time);
        return true;
    }
    return false;
}

function chooseNpcPlan(scene, npc, time) {
    if (npc.blockedPlanUntil) {
        if (time < npc.blockedPlanUntil && npc.pausedActivity) { resumeNpcActivity(scene, npc, time); return; }
        npc.blockedPlanUntil = 0; npc.pausedActivity = null;
    }
    if ((npc.dailyPlan === 'home' || npc.needsShelter) && npc.house) { npc.until = time + 1000; return; }
    if (npc.dailyPlan === 'evening' && npc.house && npcRandom(npc) < 0.65) {
        const path = findNpcRoute(scene, npc, npc.house.doorX, npc.house.doorY);
        if (path) {
            if (path.length) startNpcPath(npc, path, 'windDown', time);
            else npc.until = time + NPC_IDLE_MIN * 2;
            return;
        }
    }
    if (tryNpcSocialPlan(scene, npc, time)) return;
    const radius = npc.role === 'trader' ? NPC_TRADER_ROAM : NPC_ROAM_RADIUS;
    if (npc.role !== 'trader' && npcRandom(npc) < (npc.dailyPlan === 'late' ? 0.8 : NPC_FISH_CHANCE * (0.6 + npcHash(npc.tileX, npc.tileY, 1342) * 0.8))) {
        for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
            const [tileX, tileY] = !attempt && npc.spot && npcRandom(npc) < 0.65 + npcHash(npc.tileX, npc.tileY, 1343) * 0.25 ? [npc.spot.tileX, npc.spot.tileY] : rollNpcTile(npc, radius);
            if (npc.failedSpots.has(getTileId(tileX, tileY)) || !isNpcStandingTile(tileX, tileY)) continue;
            const water = findNpcWater(tileX, tileY);
            const path = water && findNpcRoute(scene, npc, tileX, tileY);
            if (!path) continue;
            npc.spot = { tileX, tileY, water };
            startNpcPath(npc, path, 'fish', time);
            return;
        }
    }
    for (let attempt = 0; attempt < NPC_PLAN_ATTEMPTS; attempt++) {
        const [tileX, tileY] = rollNpcTile(npc, radius);
        const path = findNpcRoute(scene, npc, tileX, tileY);
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
    const travelDirection = moveX ? (moveX < 0 ? 'left' : 'right') : (moveY < 0 ? 'back' : 'front');
    if (npc.travelDirection !== travelDirection) { npc.travelDirection = travelDirection; npc.turnUntil = time + 80 + npcRandom(npc) * 100; npc.walkSpeed = 0; }
    if (time < npc.turnUntil) { setNpcPose(scene, npc, travelDirection, 0); return false; }
    if (!canNpcOccupy(scene, npc, npc.x + moveX, npc.y + moveY)) { npc.walkSpeed = 0; npc.remainderX = npc.remainderY = 0; setNpcPose(scene, npc, travelDirection, 0); return false; }
    const after = npc.path[1], turning = !after || after[0] - next[0] !== moveX || after[1] - next[1] !== moveY;
    const speedLimit = npc.goal === 'stroll' ? npc.strollSpeed || npc.speed : npc.speed;
    const approachLimit = turning ? Math.min(speedLimit, Math.sqrt(2 * Math.hypot(distanceX, distanceY) / CHARACTER_SPEED)) : speedLimit;
    const pace = npc.walkSpeed = Math.min(approachLimit, (npc.walkSpeed || 0) + Math.min(delta, 50) / 1000);
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
    if (moved || (!wholeX && !wholeY && canNpcOccupy(scene, npc, npc.x + moveX, npc.y + moveY))) npc.stuckSince = time;

    npc.walkPhase += frameDelta * CHARACTER_ANIMATION_SPEED * pace / 1000;
    const direction = moveX ? (moveX < 0 ? 'left' : 'right') : (moveY < 0 ? 'back' : 'front');
    setNpcPose(scene, npc, direction, CHARACTER_WALK_FRAMES[Math.floor(npc.walkPhase) % 4]);
    if (npc.sprite.x !== npc.x || npc.sprite.y !== npc.y) npc.sprite.setPosition(npc.x, npc.y); if (npc.sprite.depth !== npc.y + NPC_PART_SIZE) npc.sprite.setDepth(npc.y + NPC_PART_SIZE);
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

function createNpcCast(npc, time, toX, toY, power) {
    const [tipX, tipY] = getNpcRodTip(npc, time);
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

function getNpcCastPower(npc, time) {
    const cycle = ((time - npc.charge.start) / npc.rod.chargeTime) % 2;
    return cycle <= 1 ? cycle : 2 - cycle;
}

function startNpcCharge(npc, time) {
    const [stepX, stepY] = NPC_DIRECTION_STEPS.get(npc.direction);
    const centerX = npc.x + NPC_PART_SIZE / 2, footY = npc.y + NPC_PART_SIZE - 2;
    const targetX = (npc.spot.water.x - stepX) * TILE_SIZE + TILE_SIZE / 2, targetY = (npc.spot.water.y - stepY) * TILE_SIZE + TILE_SIZE / 2;
    const reach = Math.abs(stepX ? targetX - centerX : targetY - footY);
    const wanted = (reach - CAST_MIN_DISTANCE) / (npc.rod.castDistance - CAST_MIN_DISTANCE) + (npcRandom(npc) * 2 - 1) * NPC_POWER_ERROR;
    npc.charge = { start: time, releaseAt: time + Phaser.Math.Clamp(wanted, 0.05, 1) * npc.rod.chargeTime };
    npc.state = 'charge';
}

function startNpcCast(npc, time) {
    const [stepX, stepY] = NPC_DIRECTION_STEPS.get(npc.direction);
    const power = getNpcCastPower(npc, time);
    const distance = CAST_MIN_DISTANCE + (npc.rod.castDistance - CAST_MIN_DISTANCE) * power;
    npc.charge = null;
    npc.fishing = createNpcCast(npc, time, Math.round(npc.x + NPC_PART_SIZE / 2 + stepX * distance), Math.round(npc.y + NPC_PART_SIZE - 2 + stepY * distance), power);
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
    npc.lastActivity = 'fishing'; saveDirty = true;
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
    if (!isNpcNearCamera(npc)) {
        if (npc.lineDrawn) {
            npc.line.clear();
            npc.waterShadow.clear();
            npc.lineDrawn = false;
        }
        return;
    }
    const charging = npc.state === 'charge';
    if (!npc.fishing && !charging && !npc.lineDrawn) return;
    npc.line.clear();
    npc.waterShadow.clear();
    npc.lineDrawn = Boolean(npc.fishing) || charging;
    if (charging) {
        const meterX = Math.round(npc.x + NPC_PART_SIZE / 2 - CAST_METER_WIDTH / 2);
        drawCastMeter(npc.line, meterX, npc.y - 5, npc.y + NPC_PART_SIZE + 1, getNpcCastPower(npc, time), npc.rod.polePalette || CAST_METER_FALLBACK_PALETTE);
        return;
    }
    if (!npc.fishing) return;
    const [handX, handY] = getNpcRodHand(npc);
    const [tipX, tipY] = getNpcRodTip(npc, time);
    drawAnglerLine(scene, npc.fishing, { handX, handY, tipX, tipY, bodyY: npc.y, bodyDepth: npc.y + NPC_PART_SIZE, line: npc.line, waterShadow: npc.waterShadow, behind: npc.direction === 'back' }, delta);
}

function settleNpc(scene, npc, time, delay) {
    npc.walkSpeed = 0;
    npc.walkPhase = 1;
    npc.path = [];
    setNpcPose(scene, npc, npc.direction, 0);
    npc.state = 'idle';
    npc.until = time + delay;
}

function getNpcDailyPlan(npc, clock) {
    const bedtime = 20 + npcHash(npc.tileX, npc.tileY, 1334) * 2;
    const wake = 6 + npcHash(npc.tileX, npc.tileY, 1335) * 2;
    if (clock.hour >= wake && clock.hour < bedtime) return clock.hour >= bedtime - 1 ? 'evening' : 'day';
    const night = clock.hour < wake ? clock.day - 1 : clock.day;
    return npc.water && npcHash(npc.tileX, npc.tileY, 1340 + night % 10000) < 0.25 ? 'late' : 'home';
}

function enterNpcHouse(npc) {
    npc.lastActivity = 'rest';
    npc.state = 'home'; npc.path = []; npc.sprite.setVisible(false);
    npc.shadow.clear(); if (npc.bubble) npc.bubble.setVisible(false);
    npc.shadowX = npc.shadowY = null;
    saveDirty = true;
}

function findNpcExitPath(scene, npc) {
    const directions = [NPC_DIRECTIONS[2], ...NPC_DIRECTIONS.filter(([direction]) => direction !== 'front')];
    for (const [, dx, dy] of directions) for (const distance of [2, 1]) {
        const x = npc.house.doorX + dx * distance, y = npc.house.doorY + dy * distance;
        if (!isNpcInHomeArea(npc, x, y)) continue;
        if (activeNpcs.some(other => other !== npc && other.state === 'walk' && other.path.at(-1)?.[0] === x && other.path.at(-1)?.[1] === y)) continue;
        const path = findNpcPath(npc.house.doorX, npc.house.doorY, x, y, npc, scene);
        if (path?.length) return path;
    }
    return null;
}

function updateNpcHome(scene, npc, time) {
    const clock = getWorldClock();
    npc.dailyPlan = getNpcDailyPlan(npc, clock);
    npc.needsShelter = Boolean(npc.house && getRainIntensity(clock) >= (npc.needsShelter || npc.state === 'home' ? 0.25 : 0.65));
    const wantsHome = npc.dailyPlan === 'home' || npc.needsShelter;
    if (!npc.house) return false;
    if (!wantsHome && npc.state === 'walk' && npc.goal === 'home') { settleNpc(scene, npc, time, NPC_IDLE_MIN); npc.goal = null; }
    if (npc.state === 'home') {
        if (wantsHome || time < (npc.exitRetryAt || 0)) return true;
        npc.exitRetryAt = time + NPC_HOME_EXIT_RETRY;
        if (!canNpcOccupy(scene, npc, npc.x, npc.y)) return true;
        const path = findNpcExitPath(scene, npc);
        if (!path) return true;
        npc.sprite.setVisible(true); settleNpc(scene, npc, time, NPC_IDLE_MIN + npcRandom(npc) * NPC_IDLE_RANGE);
        startNpcPath(npc, path, 'leaveHome', time);
        saveDirty = true;
        npc.lookAt = npc.until;
        return false;
    }
    if (!wantsHome || npc.talking || npc.goal === 'join' && dialogueOpen || npc.state === 'walk' && npc.goal === 'home' || time < (npc.homeRetryAt || 0)) return false;
    if (npc.fishing) { if (npc.fishing.state !== 'reeling') startNpcReel(npc, time); return false; }
    if (npc.state === 'aim' || npc.state === 'charge') { npc.charge = null; settleNpc(scene, npc, time, 1000); }
    const path = findNpcRoute(scene, npc, npc.house.doorX, npc.house.doorY);
    npc.homeRetryAt = time + 4000;
    if (!path) return false;
    npc.charge = null;
    if (!path.length) { enterNpcHouse(npc); return true; }
    startNpcPath(npc, path, 'home', time);
    return false;
}

function updateNpc(scene, npc, time, delta) {
    if (npc.fishing) updateNpcFishing(scene, npc, time);
    if (updateNpcHome(scene, npc, time)) return;
    if (npc.state === 'social') {
        const other = activeNpcs.find(other => other.id === npc.socialPartner);
        if (time >= npc.until && tryNpcSharedWalk(scene, npc, other, time)) npc.lookAt = time;
        else if (!other || other.state !== 'social' || time >= npc.until || other.talking) { settleNpc(scene, npc, time, NPC_IDLE_MIN); resumeNpcActivity(scene, npc, time); }
        else setNpcPose(scene, npc, getDirectionToward(npc, other.x, other.y), 0);
    } else if (npc.state === 'talk') {
        setNpcPose(scene, npc, getDirectionToward(npc, character.x, character.y), 0);
        if (npc.joinedConversation === dialogueNpc?.id && !npc.hasSpoken && !dialogueTypingEvent && dialogueNodes?.companion) { npc.hasSpoken = true; showGuideDialogueNode(scene, 'companion'); }
    } else if (npc.talking) {
        if (npc.bubble) npc.bubble.setVisible(false);
        return drawNpcRod(scene, npc, time, delta);
    } else if (npc.state === 'idle') {
        if (time >= npc.lookAt) {
            npc.lookAt = time + NPC_LOOK_MIN + npcRandom(npc) * NPC_LOOK_RANGE;
            setNpcPose(scene, npc, getNpcIdleDirection(npc), 0);
        }
        if (time >= npc.until) chooseNpcPlan(scene, npc, time);
    } else if (npc.state === 'walk') {
        tryNpcPassingGreeting(npc, time);
        if (['visit', 'follow'].includes(npc.goal) && time >= (npc.followRefreshAt || 0)) {
            const other = activeNpcs.find(other => other.id === npc.socialPartner);
            if (!other || time >= (npc.socialApproachUntil || Infinity) || other.talking || other.fishing || other.needsShelter || !['idle', 'walk'].includes(other.state) || other.house && (other.dailyPlan === 'home' || other.goal === 'home')) { npc.goal = 'wander'; npc.socialPartner = null; }
            const path = ['visit', 'follow'].includes(npc.goal) && findNpcMeetingPath(npc, other, scene);
            if (path) npc.path = path;
            npc.followRefreshAt = time + 1200;
        }
        if (npc.goal === 'stroll' && waitForNpcWalkPartner(scene, npc, time)) setNpcPose(scene, npc, npc.direction, 0);
        else if (stepNpc(scene, npc, time, delta)) {
            npc.followRefreshAt = 0;
            const goal = npc.goal;
            if (goal === 'wander' || goal === 'stroll') npc.lastActivity = 'walk';
            settleNpc(scene, npc, time, NPC_IDLE_MIN + npcRandom(npc) * NPC_IDLE_RANGE);
            npc.lookAt = npc.until;
            if (goal === 'home') { enterNpcHouse(npc); return; }
            if (goal === 'yield') resumeNpcActivity(scene, npc, time);
            if (goal === 'visit' || goal === 'follow') startNpcConversation(scene, npc, activeNpcs.find(other => other.id === npc.socialPartner), time);
            if (goal === 'join' && dialogueOpen && dialogueNpc?.id === npc.joining) { npc.talking = true; npc.state = 'talk'; npc.joinedConversation = npc.joining; }
            if (goal === 'fish') {
                setNpcPose(scene, npc, npc.spot.water.direction, 0);
                npc.state = 'aim';
                npc.until = time + NPC_AIM_MIN + npcRandom(npc) * NPC_AIM_RANGE;
            }
        } else if (time - npc.stuckSince > NPC_STUCK_TIME && !rerouteNpc(scene, npc, time)) {
            pauseNpcActivity(npc);
            npc.blockedPlanUntil = npc.pausedActivity ? time + NPC_BLOCKED_PLAN_WAIT : 0;
            settleNpc(scene, npc, time, NPC_BLOCKED_PLAN_RETRY);
        }
    } else if (npc.state === 'aim') {
        if (time >= npc.until) startNpcCharge(npc, time);
    } else if (npc.state === 'charge') {
        if (time >= npc.charge.releaseAt) startNpcCast(npc, time);
    }
    drawNpcRod(scene, npc, time, delta);
    if (isNpcNearCamera(npc)) drawNpcShadow(scene, npc);
    updateNpcBubble(npc, time);
}

function updateNpcBubble(npc, time) {
    const bubble = npc.bubble; if (!bubble) return;
    const visible = !npc.talking && (npc.state === 'social' || time < (npc.greetingUntil || 0)) && time >= npc.speechFrom && time < npc.speechUntil && isNpcNearCamera(npc);
    if (bubble.visible !== visible) bubble.setVisible(visible);
    if (!visible) return;
    const text = npc.speech || '', x = Math.round(npc.x - 40), y = Math.round(npc.y - 30), depth = npc.y + NPC_PART_SIZE + 1;
    if (bubble.text !== text) bubble.setText(text);
    if (bubble.x !== x || bubble.y !== y) bubble.setPosition(x, y);
    if (bubble.depth !== depth) bubble.setDepth(depth);
}

function updateNpcs(scene, time, delta) {
    let nearest = null;
    let nearestDistance = NPC_TALK_DISTANCE_SQUARED;
    let moved = false;
    activeNpcs.length = 0;
    for (const chunk of loadedChunks.values()) for (const npc of chunk.npcs || []) activeNpcs.push(npc);
    updateNpcHouses(scene, time);

    for (const chunk of loadedChunks.values()) {
        for (const npc of chunk.npcs || []) {
            const tile = getTileId(Math.round(npc.x / TILE_SIZE), Math.round(npc.y / TILE_SIZE));
            updateNpc(scene, npc, time, delta);
            moved ||= tile !== getTileId(Math.round(npc.x / TILE_SIZE), Math.round(npc.y / TILE_SIZE));
            if (npc.state === 'home') continue;
            const x = npc.x - character.x, y = npc.y - character.y, distance = x * x + y * y;
            if (distance < nearestDistance && canNpcsTalkAcross(character, npc)) [nearest, nearestDistance] = [npc, distance];
        }
    }
    if (moved) saveDirty = true;

    if (nearest === nearestNpc) return;
    nearestNpc = nearest;
}

function getNpcTrade(npc) {
    const period = Math.floor(Date.now() / NPC_TRADE_PERIOD);
    const seed = Math.imul(WORLD_SEED + period, WORLD_HASH_MULTIPLIER);
    const species = FISH_SPECIES[Math.min(FISH_SPECIES.length - 1, Math.floor(coordinateHash(npc.tileX, npc.tileY, seed) * FISH_SPECIES.length))];
    const count = species.price > 20 ? 1 : 1 + Math.min(2, Math.floor(coordinateHash(npc.tileY, npc.tileX, seed) * 3));
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
    const personality = NPC_PERSONALITIES[Math.min(NPC_PERSONALITIES.length - 1, Math.floor(npcHash(npc.tileX, npc.tileY, 1320) * NPC_PERSONALITIES.length))];
    const clock = getWorldClock(), raining = getRainIntensity(clock) > 0.25;
    const connection = getNpcConnection(npc);
    const pick = lines => lines[Math.floor(npcRandom(npc) * lines.length)];
    const greetingLines = raining ? personality.rainGreetings : npc.playerVisits ? personality.familiar : personality.greetings;
    const greeting = (clock.hour < 10 ? 'Morning. ' : clock.hour >= 18 ? 'Evening. ' : '') + (raining ? greetingLines[npc.playerVisits ? 1 : 0] : pick(greetingLines));
    const companion = connection && activeNpcs.find(other => other.id === connection.companion.id);
    const first = npc.name.split(' ')[0];
    const portrait = getNpcTexture(scene, npc.look, 'front', 0);
    const node = (text, options) => ({ portrait, portraitScale: NPC_PORTRAIT_SCALE, text: text.replaceAll('{first}', first), options });
    const back = { label: 'Back', next: 'intro' };
    const rumor = findNearestRumor(Math.round(npc.x / TILE_SIZE), Math.round(npc.y / TILE_SIZE));
    const shopRumor = getMysteryShopRumor();
    const bye = { label: 'Bye', close: true };
    const nodes = {
        chat: node(pick(personality.chatter), [{ label: 'Any rumors?', action: () => (!shopRumor && rumor && hearRumor(rumor), 'rumor') }, back, bye]),
        company: node(connection ? describeNpcConnection(npc, connection) : 'I enjoy meeting people around here.', [back, bye]),
        plans: node(describeNpcPlans(npc), [back, bye]),
        waiting: node('They might join us when they have a moment. We can keep chatting.', [back, bye]),
        rumor: node(shopRumor ? pick(shopRumor === 'now' ? NPC_RARE_BAIT_NOW_LINES : NPC_RARE_BAIT_SOON_LINES) : rumor ? describeRumor(rumor, pick(NPC_RUMOR_LINES)) : pick(NPC_NO_RUMOR_LINES), [back, bye]),
        tips: node(pick(npc.fishing ? raining ? personality.rainFishing : personality.fishing : NPC_FISHING_TIPS), [back, bye])
    };
    if (connection) nodes.chat.options[1] = { label: 'Your company?', action: () => (nodes.company.text = describeNpcConnection(npc, connection), 'company') };
    nodes.chat.options.splice(nodes.chat.options.length - 1, 0, { label: 'Your plans?', next: 'plans' });
    if (npc.lastActivity === 'greeting' && npc.lastNeighbor) nodes.chat.text = `I just said hello to ${npc.lastNeighbor.split(' ')[0]}. It is nice to see a familiar face.`;
    if (!npc.fishing && npc.lastActivity === 'social' && npc.lastNeighbor) nodes.chat.text = `I was just catching up with ${npc.lastNeighbor.split(' ')[0]}. It is good to have company nearby.`;
    else if (!npc.fishing && npc.lastActivity === 'fishing') nodes.chat.text = 'I put my rod away for a bit. Sometimes a quiet break is better than another cast.';
    else if (!npc.fishing && npc.lastActivity === 'walk') nodes.chat.text = 'I took a walk around the neighborhood earlier. ' + nodes.chat.text;
    else if (!npc.fishing && npc.lastActivity === 'rest') nodes.chat.text = "I had a quiet break at home. It's good to be outside again.";
    if (npc.dailyPlan === 'late') nodes.tips.text = 'I like fishing after dark. The water is quiet, and there is no hurry to get home.';
    if (npc.fishing?.state === 'reeling') nodes.tips.text = npc.needsShelter ? 'I am bringing my line in and getting out of this rain for a while.' : 'I am bringing my line in. I will try another cast after a short break.';
    if (companion?.joining === npc.id) nodes.company.options.unshift({ label: 'Say hello', action: () => companion.joinedConversation === npc.id && companion.talking ? 'companion' : 'waiting' });
    if (companion) nodes.companion = { portrait: getNpcTexture(scene, companion.look, 'front', 0), portraitScale: NPC_PORTRAIT_SCALE, speaker: companion.name, text: `Hi! ${connection.kind === 'close' ? "I'm close to " + first : first + ' is my ' + connection.kind}. How is your fishing going?`, options: [{ label: 'Doing well', next: 'companionReply' }, { label: 'Back', next: 'intro' }, bye] };
    if (companion) nodes.companionReply = { ...nodes.companion, text: 'Glad to hear it. Maybe we will see you around the water later!', options: [back, bye] };

    if (npc.role !== 'trader') {
        nodes.intro = node(greeting, [{ label: 'Chat', next: 'chat' }, { label: npc.fishing ? 'Any bites?' : 'Tips', next: 'tips' }, bye]);
        return nodes;
    }

    const trade = getNpcTrade(npc);
    const { count, coins, species } = trade;
    const owned = fishInventory.get(species.id) || 0;
    nodes.intro = node(greeting, [{ label: 'Trade', next: 'trade' }, { label: 'Chat', next: 'chat' }, bye]);
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
    if (!nearestNpc || nearestNpc.state === 'home' || isMenuOpen() || !dialogueContainer || (nearestNpc.x - character.x) ** 2 + (nearestNpc.y - character.y) ** 2 >= NPC_TALK_DISTANCE_SQUARED || !canNpcsTalkAcross(character, nearestNpc)) return;
    const connection = nearestNpc && getNpcConnection(nearestNpc);
    const companion = connection && activeNpcs.find(other => other.id === connection.companion.id);
    if (companion && !companion.talking && !companion.fishing && !companion.needsShelter && !(companion.house && (companion.dailyPlan === 'home' || companion.goal === 'home')) && ['idle', 'walk', 'social'].includes(companion.state) && Math.hypot(companion.x - character.x, companion.y - character.y) <= TILE_SIZE * 8) {
        const path = findNpcMeetingPath(companion, character, scene);
        if (path) { pauseNpcActivity(companion); companion.joining = nearestNpc.id; companion.hasSpoken = false; startNpcPath(companion, path, 'join', scene.time.now); }
    }
    const npc = nearestNpc;
    if (!npc || isMenuOpen() || !dialogueContainer) return;
    pauseNpcActivity(npc);
    if (npc.state === 'walk') settleNpc(scene, npc, scene.time.now, 0);
    if (npc.state === 'aim' || npc.state === 'charge') { npc.state = 'idle'; npc.charge = null; }
    npc.state = npc.fishing ? 'fishing' : 'talk';
    npc.talking = true;
    const nodes = buildNpcDialogue(scene, npc);
    npc.playerVisits = Math.min(100000, (npc.playerVisits || 0) + 1); saveDirty = true;
    beginDialogue(scene, nodes, null, npc.name, npc);
}

function releaseDialogueNpc(scene) {
    for (const npc of activeNpcs) {
        if (npc === dialogueNpc || npc.joining !== dialogueNpc.id && npc.joinedConversation !== dialogueNpc.id) continue;
        npc.talking = false; npc.joining = null; npc.joinedConversation = null;
        settleNpc(scene, npc, scene.time.now, NPC_IDLE_MIN);
        resumeNpcActivity(scene, npc, scene.time.now);
    }
    dialogueNpc.talking = false;
    if (dialogueNpc.state === 'talk') { settleNpc(scene, dialogueNpc, scene.time.now, NPC_IDLE_MIN); resumeNpcActivity(scene, dialogueNpc, scene.time.now); }
    dialogueNpc = null;
}
