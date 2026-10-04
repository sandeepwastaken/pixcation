const hookedBobberPosition = new Int32Array(2);

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
    const centerPull = Math.min(1, seconds * 2);
    const nextCenterX = spin.centerX + (targetX - spin.centerX) * centerPull;
    const nextCenterY = spin.centerY + (targetY - spin.centerY) * centerPull;

    if (isWaterPixel(scene, Math.round(nextCenterX), Math.round(nextCenterY))) {
        spin.centerX = nextCenterX;
        spin.centerY = nextCenterY;
    }

    if (Math.random() < seconds * HOOKED_THRASH_RATE) spin.direction *= -1;

    const radius = HOOKED_RADIUS_BASE + fish.length * HOOKED_RADIUS_PER_LENGTH;
    const speed = Phaser.Math.Clamp(HOOKED_SPIN_BASE - fish.length * HOOKED_SPIN_PER_LENGTH, HOOKED_SPIN_MIN, HOOKED_SPIN_BASE);

    spin.angle += spin.direction * speed * seconds;

    const cosine = Math.cos(spin.angle);
    const sine = Math.sin(spin.angle);
    const nextX = spin.centerX + cosine * radius;
    const nextY = spin.centerY + sine * radius * HOOKED_SQUASH;

    if (isWaterPixel(scene, Math.round(nextX), Math.round(nextY))) {
        fish.x = nextX;
        fish.y = nextY;
    }

    fish.heading = Math.atan2(
        cosine * radius * HOOKED_SQUASH * spin.direction,
        -sine * radius * spin.direction
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
