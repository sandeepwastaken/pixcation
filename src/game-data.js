const MARKET_RODS = [
    { id: 'basic', label: 'Basic Rod', texture: 'rod-basic', icon: 'rod-basic-icon', price: 10, castDistance: 72, chargeTime: 1000, lineStrength: 1, catchZone: 24 },
    { id: 'intermediate', label: 'Intermediate Rod', texture: 'rod-intermediate', icon: 'rod-intermediate-icon', price: 25, castDistance: 88, chargeTime: 850, lineStrength: 1.35, catchZone: 29 },
    { id: 'master', label: 'Master Rod', texture: 'rod-master', icon: 'rod-master-icon', price: 50, castDistance: 104, chargeTime: 720, lineStrength: 1.75, catchZone: 34 }
];

const MARKET_BAITS = [
    { id: 'novice', label: 'Novice Bait', texture: 'bait-novice', icon: 'bait-novice-icon', price: 6, bundle: 5, zoneBonus: 4, lure: 1.2 },
    { id: 'trainer', label: 'Trainer Bait', texture: 'bait-trainer', icon: 'bait-trainer-icon', price: 12, bundle: 5, zoneBonus: 7, lure: 1.45 },
    { id: 'advanced', label: 'Advanced Bait', texture: 'bait-advanced', icon: 'bait-advanced-icon', price: 20, bundle: 5, zoneBonus: 11, lure: 1.75 }
];

const CHEST_BAIT_WEIGHTS = [6, 3, 1];
const CHEST_BAIT_WEIGHT_TOTAL = CHEST_BAIT_WEIGHTS.reduce((total, weight) => total + weight, 0);

const FISH_SPECIES = [
    { id: 'bluegill', name: 'Bluegill', size: 'small', minWater: 1800, weight: 7, price: 7 },
    { id: 'pumpkinseed', name: 'Pumpkinseed', size: 'small', minWater: 1800, weight: 6, price: 8 },
    { id: 'largemouth-bass', name: 'Largemouth Bass', size: 'large', minWater: 6500, weight: 2.2, price: 28 },
    { id: 'smallmouth-bass', name: 'Smallmouth Bass', size: 'medium', minWater: 4800, weight: 3, price: 22 },
    { id: 'yellow-perch', name: 'Yellow Perch', size: 'medium', minWater: 3000, weight: 4.5, price: 14 },
    { id: 'walleye', name: 'Walleye', size: 'large', minWater: 8000, weight: 1.4, price: 38 },
    { id: 'rainbow-trout', name: 'Rainbow Trout', size: 'large', minWater: 6500, weight: 1.8, price: 32 },
    { id: 'brown-trout', name: 'Brown Trout', size: 'large', minWater: 6500, weight: 1.6, price: 34 },
    { id: 'brook-trout', name: 'Brook Trout', size: 'medium', minWater: 3800, weight: 2.8, price: 24 },
    { id: 'common-carp', name: 'Common Carp', size: 'large', minWater: 5500, weight: 2.5, price: 25 },
    { id: 'crucian-carp', name: 'Crucian Carp', size: 'medium', minWater: 3200, weight: 3.6, price: 17 },
    { id: 'goldfish', name: 'Goldfish', size: 'small', minWater: 2500, weight: 1.1, price: 35 },
    { id: 'channel-catfish', name: 'Channel Catfish', size: 'large', minWater: 7500, weight: 1.7, price: 36 },
    { id: 'bullhead-catfish', name: 'Bullhead Catfish', size: 'medium', minWater: 4000, weight: 3, price: 19 },
    { id: 'freshwater-drum', name: 'Freshwater Drum', size: 'large', minWater: 7500, weight: 1.6, price: 31 },
    { id: 'white-crappie', name: 'White Crappie', size: 'medium', minWater: 3500, weight: 3.7, price: 16 },
    { id: 'black-crappie', name: 'Black Crappie', size: 'medium', minWater: 3500, weight: 3.5, price: 17 },
    { id: 'roach', name: 'Roach', size: 'small', minWater: 1800, weight: 6, price: 6 },
    { id: 'rudd', name: 'Rudd', size: 'small', minWater: 2200, weight: 5, price: 8 },
    { id: 'common-bream', name: 'Common Bream', size: 'medium', minWater: 4000, weight: 3.3, price: 18 },
    { id: 'tench', name: 'Tench', size: 'medium', minWater: 4500, weight: 2.8, price: 21 },
    { id: 'common-dace', name: 'Common Dace', size: 'small', minWater: 1800, weight: 5.5, price: 7 },
    { id: 'common-minnow', name: 'Common Minnow', size: 'small', minWater: 1800, weight: 7.5, price: 4 },
    { id: 'mosquitofish', name: 'Mosquitofish', size: 'small', minWater: 1800, weight: 7, price: 3 },
    { id: 'zebra-danio', name: 'Zebra Danio', size: 'small', minWater: 2000, weight: 3, price: 12 },
    { id: 'sturgeon', name: 'Sturgeon', size: 'giant', minWater: 12000, weight: 0.12, price: 250 }
];

const GUIDE_DIALOGUE = {
    intro: {
        portrait: 'guide-portrait-friendly',
        text: "Hey! Need something?",
        options: [
            { label: 'Help', next: 'help' },
            { label: 'Greet', next: 'greet' },
            { label: 'Exit', close: true }
        ]
    },
    help: {
        portrait: 'guide-portrait-friendly',
        text: "WASD or arrows walk, Shift runs. E talks or shops, M opens your map, I opens your fishpedia.",
        options: [
            { label: 'Fishing', next: 'fishing' },
            { label: 'Back', next: 'intro' },
            { label: 'Exit', close: true }
        ]
    },
    fishing: {
        portrait: 'guide-portrait-surprised',
        text: "Ignore small taps. On the big splash, press Space or click, then hold to keep the bar on the fish.",
        options: [
            { label: 'Bait', next: 'bait' },
            { label: 'Back', next: 'help' },
            { label: 'Exit', close: true }
        ]
    },
    bait: {
        portrait: 'guide-portrait-laughing',
        text: "Bait makes your bar longer and lures fish in. B swaps it. See a chest shadow underwater? Cast right on it!",
        options: [
            { label: 'Back', next: 'fishing' },
            { label: 'Exit', close: true }
        ]
    },
    greet: {
        portrait: 'guide-portrait-laughing',
        text: "Hello there! I'm your guide. It's nice to meet you. Enjoy your adventure!",
        options: [
            { label: 'Back', next: 'intro' },
            { label: 'Exit', close: true }
        ]
    }
};

const MARKET_RODS_BY_ID = new Map(MARKET_RODS.map(rod => [rod.id, rod]));
const MARKET_RODS_BY_LABEL = new Map(MARKET_RODS.map(rod => [rod.label, rod]));
const FISH_SPECIES_BY_ID = new Map(FISH_SPECIES.map(species => [species.id, species]));
const MARKET_BAITS_BY_ID = new Map(MARKET_BAITS.map(bait => [bait.id, bait]));
const MARKET_PAGES = [
    { title: 'Rods', items: MARKET_RODS },
    { title: 'Bait', items: MARKET_BAITS }
];
const MARKET_ITEM_ROWS = Math.max(...MARKET_PAGES.map(page => page.items.length));
const MARKET_SELL_INDEX = MARKET_ITEM_ROWS;
const MARKET_EXIT_INDEX = MARKET_SELL_INDEX + 1;
const MARKET_ROW_COUNT = MARKET_ITEM_ROWS + 2;
const SAVE_KEY = 'pixcation-save-v1';
