let mysteryWeights = null;

function getMysteryWeights() {
    if (mysteryWeights) return mysteryWeights;
    const weights = MYSTERY_BAITS.map(bait => bait.attracts.size === 'giant' ? MYSTERY_GIANT_WEIGHT : bait.attracts.weight * MYSTERY_SIZE_WEIGHTS[bait.attracts.size]);
    return mysteryWeights = { weights, total: weights.reduce((total, weight) => total + weight, 0) };
}

function getMysteryCycle(now = Date.now()) {
    return Math.floor((now / 60000 + WORLD_SEED % MYSTERY_CYCLE_MINUTES) / MYSTERY_CYCLE_MINUTES);
}

function getMysteryBait(cycle) {
    const { weights, total } = getMysteryWeights();
    let roll = coordinateHash(cycle, 0, Math.imul(WORLD_SEED + 1701, WORLD_HASH_MULTIPLIER)) * total;
    for (let index = 0; index < MYSTERY_BAITS.length; index++) {
        roll -= weights[index];
        if (roll <= 0) return MYSTERY_BAITS[index];
    }
    return MYSTERY_BAITS[0];
}

function getCurrentMysteryBait() {
    return getMysteryBait(getMysteryCycle());
}

function isRareMysteryBait(bait) {
    return bait.attracts.size === 'giant';
}

function getMysteryShopRumor() {
    const cycle = getMysteryCycle();
    if (isRareMysteryBait(getMysteryBait(cycle))) return 'now';
    for (let ahead = 1; ahead <= MYSTERY_FORECAST_CYCLES; ahead++) {
        if (isRareMysteryBait(getMysteryBait(cycle + ahead))) return 'soon';
    }
    return null;
}

function getMysteryCatchSpecies(bait, species, catchNumber) {
    const target = bait?.attracts;
    if (!target) return species;
    const fits = species.size === target.size || (target.size === 'giant' && species.size === 'large');
    const roll = coordinateHash(catchNumber, 0, Math.imul(WORLD_SEED + 1702, WORLD_HASH_MULTIPLIER));
    return fits && roll < MYSTERY_CATCH_CHANCE ? target : species;
}

function getMysteryPalette(species) {
    let hash = 2166136261;
    for (let index = 0; index < species.id.length; index++) hash = Math.imul(hash ^ species.id.charCodeAt(index), 16777619);
    const hue = (hash >>> 0) / 4294967296;
    return MYSTERY_SHADES.map(([saturation, value]) => {
        const color = Phaser.Display.Color.HSVToRGB(hue, saturation, value);
        return [color.r, color.g, color.b];
    });
}

function createMysteryBaitTextures(scene) {
    const sources = MYSTERY_PLACEHOLDER_COLORS.map(color => [color >> 16, color >> 8 & 255, color & 255]);
    for (const bait of MYSTERY_BAITS) {
        const palette = getMysteryPalette(bait.attracts);
        for (const [key, base] of [[bait.texture, 'bait-mystery'], [bait.icon, 'bait-mystery-icon']]) {
            const source = getTerrainPixels(scene, base);
            createCanvasTexture(scene, key, source.width, source.height, context => {
                const image = context.createImageData(source.width, source.height);
                image.data.set(source.data);
                for (let index = 0; index < image.data.length; index += 4) {
                    const shade = sources.findIndex(([red, green, blue]) => image.data[index] === red && image.data[index + 1] === green && image.data[index + 2] === blue);
                    if (shade >= 0) image.data.set(palette[shade], index);
                }
                context.putImageData(image, 0, 0);
            });
        }
    }
}
