const SPLASH_PARTICLES = 12;
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

const MYSTERY_BAITS = FISH_SPECIES.map(species => ({
    id: `mystery-${species.id}`,
    label: 'Mystery Bait',
    texture: `bait-mystery-${species.id}`,
    icon: `bait-mystery-${species.id}-icon`,
    price: Math.round(8 + species.price * 0.5),
    bundle: 3,
    zoneBonus: 6,
    lure: 1.4,
    attracts: species
}));
const ALL_BAITS = [...MARKET_BAITS, ...MYSTERY_BAITS];

const GUIDE_INVITATION = {
    intro: {portraitExpression: 'grin', portraitEyesClosed: true, text: "Hey! I'm the Guide. Come talk to me!", options: [{label: 'Talk', action: scene => acceptGuideInvitation(scene)}, {label: 'Later', close: true}]}
};

const GUIDE_DIALOGUE = {
    intro: {
        portraitExpression: 'normal',
        text: "Hey, you! Need a hand, or just saying hello?",
        options: [
            { label: 'Help', next: 'help' },
            { label: 'Greet', next: 'greet' },
            { label: 'Chat', next: 'chat' },
            { label: 'Exit', close: true }
        ]
    },
    help: {
        portraitExpression: 'normal',
        text: "WASD or arrows walk, Shift runs. E talks or shops, M opens your map, I opens your fishpedia.",
        options: [
            { label: 'Fishing', next: 'fishing' },
            { label: 'Exploring', next: 'explore' },
            { label: 'Back', next: 'intro' },
            { label: 'Exit', close: true }
        ]
    },
    fishing: {
        portraitExpression: 'openMouth',
        text: "Ignore small taps. On the big splash, press Space or click, then hold to keep the bar on the fish.",
        options: [
            { label: 'Bait', next: 'bait' },
            { label: 'Missed bites', next: 'trouble' },
            { label: 'Back', next: 'help' },
            { label: 'Exit', close: true }
        ]
    },
    bait: {
        portraitExpression: 'grin',
        text: "Bait makes your bar longer and lures fish in. B swaps it. See a chest shadow underwater? Cast right on it!",
        options: [
            { label: 'Back', next: 'fishing' },
            { label: 'Exit', close: true }
        ]
    },
    greet: {
        portraitExpression: 'grin',
        portraitEyesClosed: true,
        text: "I'm glad you stopped by! I'm your guide. Go find a lovely spot. I'll be here if you need me.",
        options: [
            { label: 'Back', next: 'intro' },
            { label: 'Exit', close: true }
        ]
    },
    chat: {portraitExpression: 'normal', text: "I was counting ripples before you came over. I lost count, so you've saved me from starting again.", options: [{label: 'About you', next: 'about'}, {label: 'Favorite spot', next: 'favorite'}, {label: 'Cheer me up', next: 'encourage'}, {label: 'Back', next: 'intro'}]},
    about: {portraitExpression: 'normal', text: "I like being a familiar face by the water. Helping people fish is a good excuse to spend the day here.", options: [{label: 'Favorite spot', next: 'favorite'}, {label: 'Tell a joke', next: 'joke'}, {label: 'Back', next: 'chat'}]},
    favorite: {portraitExpression: 'grin', portraitEyesClosed: true, text: "A quiet bank, a little shade, and nowhere I have to hurry to. That's my kind of afternoon.", options: [{label: 'Sounds nice', next: 'company'}, {label: 'Back', next: 'chat'}, {label: 'Bye', close: true}]},
    company: {portraitExpression: 'grin', portraitEyesClosed: true, text: "It is! Good company helps, too. You don't need a spectacular catch to make an afternoon worth remembering.", options: [{label: 'Thanks', next: 'thanks'}, {label: 'Back', next: 'chat'}]},
    encourage: {portraitExpression: 'grin', portraitEyesClosed: true, text: "You made time to come say hello. That's a nice thing already. The fish can keep us waiting a little longer.", options: [{label: 'Any advice?', next: 'advice'}, {label: 'Tell a joke', next: 'joke'}, {label: 'Back', next: 'chat'}]},
    advice: {portraitExpression: 'normal', text: "A small catch still counts. You don't have to turn every cast into a competition. Find a spot you actually enjoy.", options: [{label: 'Thanks', next: 'thanks'}, {label: 'Back', next: 'chat'}]},
    joke: {portraitExpression: 'openMouth', portraitEyesClosed: true, text: "I told a fish a joke once. It didn't laugh. Tough crowd down there. You're allowed to laugh out of pity.", options: [{label: 'That was good', next: 'laugh'}, {label: 'Back', next: 'chat'}]},
    laugh: {portraitExpression: 'grin', portraitEyesClosed: true, text: "Ha! I'll take it. I was about to try that one on the shopkeeper, but you've spared them.", options: [{label: 'Back', next: 'chat'}, {label: 'Bye', close: true}]},
    explore: {portraitExpression: 'normal', text: "M opens your map. H brings you back to spawn. Talk to your neighbors, too. Some of them know the water better than I do.", options: [{label: 'Neighbors?', next: 'neighbors'}, {label: 'Back', next: 'help'}, {label: 'Exit', close: true}]},
    neighbors: {portraitExpression: 'normal', text: "Ask about their company or their plans. Everyone has their own routine. Sometimes a conversation turns up a good rumor.", options: [{label: 'Back', next: 'explore'}, {label: 'Bye', close: true}]},
    trouble: {portraitExpression: 'normal', text: "Missing a bite happens. Wait for the big splash, then press and hold. Better rods and bait make keeping up with a fish easier.", options: [{label: 'Thanks', next: 'thanks'}, {label: 'Back', next: 'fishing'}, {label: 'Exit', close: true}]},
    thanks: {portraitExpression: 'grin', portraitEyesClosed: true, text: "You're very welcome. Go enjoy the water. I'll keep this spot warm for you!", options: [{label: 'Back', next: 'intro'}, {label: 'See you!', close: true}]}
};

const MARKET_RODS_BY_ID = new Map(MARKET_RODS.map(rod => [rod.id, rod]));
const MARKET_RODS_BY_LABEL = new Map(MARKET_RODS.map(rod => [rod.label, rod]));
const FISH_SPECIES_BY_ID = new Map(FISH_SPECIES.map(species => [species.id, species]));
const MARKET_BAITS_BY_ID = new Map(ALL_BAITS.map(bait => [bait.id, bait]));
const MARKET_PAGES = [
    { title: 'Rods', items: MARKET_RODS },
    { title: 'Bait', items: MARKET_BAITS },
    { title: 'Deals', get items() { return [getCurrentMysteryBait(), getMysteryDeal()]; } }
];
const MARKET_ITEM_ROWS = Math.max(MARKET_RODS.length, MARKET_BAITS.length);
const MARKET_SELL_INDEX = MARKET_ITEM_ROWS;
const MARKET_EXIT_INDEX = MARKET_SELL_INDEX + 1;
const MARKET_ROW_COUNT = MARKET_ITEM_ROWS + 2;
const SAVE_KEY = 'pixcation-save-v1' + (typeof getRequestedWorldSeed === 'function' && getRequestedWorldSeed() ? ':' + getRequestedWorldSeed() : '');
