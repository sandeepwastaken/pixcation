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
    createBridgeEdgeTexture(this);
    createPlayerTextures(this);
    createShimmerSheet(this);
    extractRodArtStyles(this);
    createMysteryBaitTextures(this);
    createChestSilhouette(this);

    for (let step = 0; step < SHIMMER_TINT_STEPS; step++) {
        this.anims.create({
            key: `shimmer-${step}`,
            frames: this.anims.generateFrameNumbers(`shimmer-${step}`, { start: 0, end: 15 }),
            frameRate: 12,
            repeat: 0
        });
    }

    createCharacterShadow(this);
    fishingLine = this.add.graphics();
    fishingWaterShadow = this.add.graphics().setDepth(1.25);
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
    createSky(this);
    createFireflies(this);

    spawnGuideAndStore(this);
    updateLoadedChunks(this, true);
    createGuideDialogueUI(this);
    createMapUI(this);
    createMarketUI(this);
    createInventoryUI(this);
    createCatchCardUI(this);
    createInteractionPromptUI(this);
    createStatsUI(this);
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
        createStartup(this);
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
        window.addEventListener('pagehide', () => { saveDirty = true; saveProgress(); });
    }
}
