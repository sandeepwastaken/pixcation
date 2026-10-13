let npcWorldAppearancePlan, npcWorldAppearanceBuilding = false;
function getNpcWorldGeneRadices() {
    return [NPC_FIRST_NAMES.length, NPC_LAST_NAMES.length + 1, 2, NPC_FACES, 2, 65536, NPC_HAIR_COLORS.length, NPC_SHIRTS, NPC_SHIRT_COLORS.length, NPC_SHIRT_COLORS.length, NPC_PANTS_STYLES, NPC_PANTS_COLORS.length, NPC_PANTS_COLORS.length, 2, Math.max(NPC_HAIRSTYLES, NPC_ACCESSORIES), Math.max(NPC_HAIR_COLORS.length, NPC_ACCESSORY_COLORS.length), 2, NPC_EYE_COLORS.length, 4294967296, 2];
}
function getNpcWorldGenePeriod() {return getNpcWorldGeneRadices().reduce((product, radix) => product * BigInt(radix), 1n);}
function getNpcWorldRoll(index, predicate) {for (let roll = 0; roll < NPC_APPEARANCE_RADICES[index]; roll++) if (predicate(roll)) return roll; return 0;}
function getNpcWorldStyleRoll(index, weights, style) {return getNpcWorldRoll(index, roll => getNpcWeightedIndex(roll, weights, NPC_APPEARANCE_RADICES[index]) === style);}
function getNpcWorldGenes(npc) {
    const look = npc.look, first = npc.name.split(' ')[0], last = npc.name.slice(first.length + 1);
    return [NPC_FIRST_NAMES.indexOf(first), last ? NPC_LAST_NAMES.indexOf(last) + 1 : 0, look[14], look[1], Number(look[0] >= 5), Math.round(look[15] * 65535), look[9], look[2], look[3], look[10], look[11], look[4], look[12], look[5], look[6], look[7], look[8], look[13], look[16], look[19]];
}
function decodeNpcWorldGenes(rank) {return getNpcWorldGeneRadices().map(radix => {const value = Number(rank % BigInt(radix)); rank /= BigInt(radix); return value;});}
function getNpcWorldRolls(genes) {
    const rolls = NPC_APPEARANCE_RADICES.map(() => 0), first = NPC_FIRST_NAMES[genes[0]], rareTop = genes[13] && genes[14] === 5;
    rolls[0] = rareTop ? 0 : Math.ceil(NPC_RARE_VANITY_CHANCE * NPC_APPEARANCE_RADICES[0]);
    rolls[22] = getNpcWorldRoll(22, roll => NPC_NAME_WEIGHTS.has(first) ? getNpcRareName(roll / NPC_APPEARANCE_RADICES[22]) === first : getNpcRareName(roll / NPC_APPEARANCE_RADICES[22]) === null);
    const rareName = getNpcRareName(rolls[22] / NPC_APPEARANCE_RADICES[22]), feminine = rareTop || (rareName ? NPC_FEMININE_FIRST_NAMES.includes(rareName) : genes[2] === 1), profile = getNpcStyleProfile(genes[3], feminine);
    rolls[18] = genes[2]; rolls[19] = Math.max(0, (feminine ? NPC_COMMON_FEMININE_NAMES : NPC_COMMON_MASCULINE_NAMES).indexOf(first)); rolls[20] = genes[1] ? 1 : 0; rolls[21] = Math.max(0, genes[1] - 1);
    rolls[1] = genes[4] ? 0 : 1; rolls[2] = rolls[3] = genes[5]; rolls[4] = getNpcWorldRoll(4, roll => getNpcFace(roll) === genes[3]);
    rolls[5] = getNpcWorldStyleRoll(5, NPC_STYLE_WEIGHTS.shirt[profile], genes[7]); rolls[6] = getNpcWorldStyleRoll(6, NPC_SHIRT_COLOR_WEIGHTS, genes[8]); rolls[7] = getNpcWorldStyleRoll(7, NPC_PANTS_COLOR_WEIGHTS, genes[11]);
    rolls[8] = genes[13] ? 0 : 99; rolls[9] = getNpcWorldStyleRoll(9, NPC_STYLE_WEIGHTS.vanity[profile], genes[14]); rolls[10] = getNpcWorldStyleRoll(10, NPC_STYLE_WEIGHTS.hair[profile], genes[14]);
    rolls[11] = getNpcWorldStyleRoll(11, NPC_HEADWEAR_COLOR_WEIGHTS, genes[15]); rolls[12] = getNpcWorldStyleRoll(12, genes[3] === 2 ? NPC_AGE_HAIR_COLOR_WEIGHTS.older : genes[3] === 1 ? NPC_AGE_HAIR_COLOR_WEIGHTS.young : NPC_HAIR_COLOR_WEIGHTS, genes[6]); rolls[13] = genes[16];
    rolls[14] = getNpcWorldRoll(14, roll => getNpcAccentColor(roll, genes[8], NPC_SHIRT_ACCENT_NEUTRALS[genes[8]], NPC_SHIRT_COLORS.length) === genes[9]); rolls[15] = getNpcWorldStyleRoll(15, NPC_STYLE_WEIGHTS.pants[profile], genes[10]);
    rolls[16] = getNpcWorldRoll(16, roll => getNpcAccentColor(roll, genes[11], genes[11] === 5 ? 4 : 5, NPC_PANTS_COLORS.length) === genes[12]); rolls[17] = getNpcWorldRoll(17, roll => getNpcEyeColor(roll) === genes[17]); rolls[23] = genes[18]; rolls[24] = genes[19] ? 0 : 99;
    return rolls;
}
function encodeNpcWorldDesign(npc) {
    const genes = getNpcWorldGenes(npc), radices = getNpcWorldGeneRadices();
    if (genes.some((value, index) => !Number.isSafeInteger(value) || value < 0 || value >= radices[index])) throw new Error('Appearance is outside the natural NPC trait space');
    const restored = createNpc(0, 0, null, getNpcWorldRolls(genes));
    if (restored.name !== npc.name || JSON.stringify(restored.look) !== JSON.stringify(npc.look)) throw new Error('Appearance does not satisfy natural NPC generation rules');
    return genes.reduceRight((rank, value, index) => rank * BigInt(radices[index]) + BigInt(value), 0n);
}
function getNpcWorldAppearancePlan() {
    if (npcWorldAppearancePlan !== undefined) return npcWorldAppearancePlan;
    if (BigInt(WORLD_SEED_CODE) <= BigInt(Number.MAX_SAFE_INTEGER)) return npcWorldAppearancePlan = null;
    const period = getNpcWorldGenePeriod(), word = getNpcUnfoldedAppearanceWord(0, 0), layout = word / (period * period);
    if (layout / (NPC_WORLD_COUNT_RADIX * NPC_WORLD_COUNT_RADIX) % NPC_WORLD_FAMILY_INTERVAL !== NPC_WORLD_FAMILY_MARK) return npcWorldAppearancePlan = null;
    const firstCount = Number(layout % NPC_WORLD_COUNT_RADIX), secondCount = Number(layout / NPC_WORLD_COUNT_RADIX % NPC_WORLD_COUNT_RADIX);
    return npcWorldAppearancePlan = {ranks: [word % period, word / period % period], counts: [firstCount, secondCount], rolls: [], assignments: null};
}
function buildNpcWorldAssignments(plan) {
    const assignments = new Map(), wanted = plan.counts[0] + plan.counts[1]; let ordinal = 0;
    npcWorldAppearanceBuilding = true;
    try {
        for (let ring = 0; ring <= 64 && ordinal < wanted; ring++) for (let y = -ring; y <= ring && ordinal < wanted; y++) for (let x = -ring; x <= ring && ordinal < wanted; x++) {
            if (Math.max(Math.abs(x), Math.abs(y)) !== ring) continue; const npc = findCellNpc(x, y); if (!npc) continue;
            assignments.set(npc.tileX + ',' + npc.tileY, ordinal < plan.counts[0] ? 0 : 1); ordinal++;
        }
    } finally {npcWorldAppearanceBuilding = false;}
    return assignments;
}
function getNpcWorldAppearanceRolls(tileX, tileY) {
    if (npcWorldAppearanceBuilding) return null; const plan = getNpcWorldAppearancePlan(); if (!plan) return null;
    let index = 0;
    if (plan.counts[0] || plan.counts[1]) {plan.assignments ||= buildNpcWorldAssignments(plan); index = plan.assignments.get(tileX + ',' + tileY); if (index === undefined) return null;}
    return plan.rolls[index] ||= getNpcWorldRolls(decodeNpcWorldGenes(plan.ranks[index]));
}
function getNpcNumericSeedForState(worldSeed, state) {
    if (!Number.isSafeInteger(worldSeed) || worldSeed < 1 || worldSeed > 0xffffffff || state < 0n || state >= 1n << 256n) throw new Error('Invalid numeric world seed state');
    let word = state ^ state >> 128n;
    const rolls = NPC_APPEARANCE_RADICES.map(radix => {const roll = Number(word % BigInt(radix)); word /= BigInt(radix); return roll;});
    return makeNpcAppearanceSeed(worldSeed, 0, 0, rolls, word);
}
function makeNpcWorldSeed(worldSeed, designs, variant = 0n) {
    if (!Array.isArray(designs) || designs.length < 1 || designs.length > 2 || typeof variant !== 'bigint' || variant < 0n) throw new Error('Provide one or two natural designs');
    const counts = designs.map(design => design.count ?? 0);
    if (counts.some(count => !Number.isInteger(count) || count < 0 || count > 127) || designs.length > 1 && counts.some(count => count === 0)) throw new Error('Use zero for one world-wide design, or one to 127 for each nearby design');
    const ranks = designs.map(design => encodeNpcWorldDesign(design.npc)), period = getNpcWorldGenePeriod();
    const layout = BigInt(counts[0]) + BigInt(counts[1] || 0) * NPC_WORLD_COUNT_RADIX + NPC_WORLD_COUNT_RADIX * NPC_WORLD_COUNT_RADIX * (NPC_WORLD_FAMILY_MARK + variant * NPC_WORLD_FAMILY_INTERVAL);
    return getNpcNumericSeedForState(worldSeed, ranks[0] + (ranks[1] || 0n) * period + layout * period * period);
}
function getNpcWorldFeatureOffset(field, design = 0) {
    const radices = getNpcWorldGeneRadices(); if (!Number.isInteger(field) || field < 0 || field >= radices.length || ![0,1].includes(design)) throw new Error('Invalid appearance feature');
    const step = radices.slice(0, field).reduce((product, radix) => product * BigInt(radix), 1n) * (design ? getNpcWorldGenePeriod() : 1n);
    return BigInt.asUintN(288, BigInt(getNpcNumericSeedForState(1, step)) - BigInt(getNpcNumericSeedForState(1, 0n))).toString();
}
