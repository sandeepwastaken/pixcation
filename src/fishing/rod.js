const castDirections = { left: [-1, 0], right: [1, 0], back: [0, -1], front: [0, 1] };
const waterFishingStates = new Set([
    'floating', 'landing', 'approaching', 'inspecting', 'nibbleWait', 'nibbleDip', 'bite', 'hooked', 'minigame', 'snagged'
]);
const rodHandPosition = new Int32Array(2);
const rodTipPosition = new Int32Array(2);

function hasRodSelected() {
    return MARKET_RODS_BY_LABEL.has(hotbarItemNames[selectedHotbarSlot]);
}

function getSelectedRod() {
    return MARKET_RODS_BY_LABEL.get(hotbarItemNames[selectedHotbarSlot]) || MARKET_RODS[0];
}

function getCastDirection() {
    return castDirections[characterDirection] || castDirections.front;
}

function getRodHand(direction = getCastDirection()) {
    const [directionX, directionY] = direction;
    const centerX = Math.round(character.x + CHARACTER_SIZE / 2);

    rodHandPosition[0] = centerX + (directionY === 0 ? directionX * 3 : 3);
    rodHandPosition[1] = Math.round(character.y) + 11;
    return rodHandPosition;
}

function getRodTip(time, castDirection) {
    const direction = castDirection || getCastDirection();
    const [directionX, directionY] = direction;
    const [handX, handY] = getRodHand(direction);

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
