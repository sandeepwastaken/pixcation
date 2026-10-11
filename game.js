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

const NPC_FIRST_NAMES = [
    'Ada', 'Abe', 'Agnes', 'Alba', 'Alder', 'Alma', 'Alvin', 'Amos', 'Anika', 'Ansel', 'April', 'Arlo', 'Arden', 'Ashby', 'Aster', 'Astrid',
    'Aubrey', 'August', 'Ava', 'Avery', 'Basil', 'Bea', 'Benny', 'Bernie', 'Bess', 'Birdie', 'Blair', 'Bodhi', 'Bram', 'Briar', 'Brook', 'Bruno',
    'Cal', 'Calla', 'Calvin', 'Camille', 'Carmen', 'Cass', 'Cedar', 'Cecil', 'Celia', 'Chester', 'Clara', 'Clem', 'Cleo', 'Clover', 'Cody', 'Cora',
    'Cosmo', 'Cyrus', 'Dahlia', 'Daisy', 'Dale', 'Darby', 'Dawn', 'Dean', 'Della', 'Dex', 'Dina', 'Dot', 'Drew', 'Dusty', 'Edie', 'Edgar',
    'Effie', 'Elan', 'Elio', 'Eliza', 'Ellis', 'Elmer', 'Elsie', 'Emil', 'Enzo', 'Esme', 'Etta', 'Ezra', 'Fawn', 'Felix', 'Fern', 'Fig',
    'Finn', 'Fiona', 'Flint', 'Flo', 'Floyd', 'Frankie', 'Fritz', 'Gale', 'Georgie', 'Gil', 'Ginger', 'Gus', 'Hal', 'Hana', 'Hank', 'Harlow',
    'Hattie', 'Hazel', 'Heath', 'Hollis', 'Holly', 'Hugo', 'Ida', 'Ike', 'Imani', 'Indy', 'Ines', 'Iris', 'Ivo', 'Ivy', 'Jada', 'Jasper',
    'Jem', 'Jett', 'Jo', 'Joel', 'Jonah', 'Joni', 'Jude', 'June', 'Juno', 'Kai', 'Kat', 'Keiko', 'Kenji', 'Kit', 'Emz', 'Jessie',
    'Laurel', 'Lena', 'Leo', 'Levi', 'Lila', 'Linus', 'Lola', 'Lou', 'Luca', 'Lucy', 'Lulu', 'Mabel', 'Mack', 'Mae', 'Maggie', 'Malia',
    'Maple', 'Marco', 'Margo', 'Marlo', 'Mateo', 'Maude', 'Mavis', 'Max', 'Meadow', 'Mei', 'Mila', 'Milo', 'Mina', 'Miso', 'Moss', 'Murphy',
    'Nadia', 'Nell', 'Nico', 'Nina', 'Noah', 'Noor', 'Nora', 'Oak', 'Odette', 'Olive', 'Ollie', 'Omar', 'Opal', 'Orla', 'Oscar', 'Otis',
    'Otto', 'Pablo', 'Paloma', 'Peg', 'Pepper', 'Percy', 'Pip', 'Piper', 'Poppy', 'Priya', 'Quill', 'Quinn', 'Rafi', 'Ramona', 'Ravi', 'Reed',
    'Reggie', 'Remy', 'Rhea', 'Rio', 'River', 'Robin', 'Rosa', 'Rowan', 'Ruby', 'Rufus', 'Rye', 'Sage', 'Sal', 'Sami', 'Sasha', 'Scout',
    'Selma', 'Shay', 'Sid', 'Sky', 'Sol', 'Sonny', 'Sora', 'Stella', 'Sunny', 'Suki', 'Tad', 'Tali', 'Tam', 'Tess', 'Theo', 'Thea',
    'Tilly', 'Toby', 'Tomas', 'Tova', 'Tuck', 'Uma', 'Una', 'Vera', 'Vic', 'Vida', 'Viggo', 'Vince', 'Wade', 'Walt', 'Wren', 'Wes',
    'Willa', 'Willow', 'Winnie', 'Wyatt', 'Xavi', 'Yara', 'Yuki', 'Yusuf', 'Zadie', 'Zane', 'Zara', 'Zeke', 'Zion', 'Zoe', 'Zora', 'Zuri'
];
const NPC_NEUTRAL_FIRST_NAMES = ['Arden', 'Avery', 'Blair', 'Briar', 'Brook', 'Cass', 'Cedar', 'Clem', 'Dale', 'Darby', 'Drew', 'Ellis', 'Frankie', 'Gale', 'Harlow', 'Hollis', 'Indy', 'Jo', 'Jude', 'Kai', 'Kit', 'Lark', 'Lou', 'Marlo', 'Noor', 'Quinn', 'Remy', 'River', 'Robin', 'Rowan', 'Sage', 'Sasha', 'Scout', 'Shay', 'Sky', 'Sunny', 'Wren', 'Yuki'];
const NPC_FEMININE_FIRST_NAMES = NPC_FIRST_NAMES.filter(name => NPC_NEUTRAL_FIRST_NAMES.includes(name) || ['Ada', 'Agnes', 'Alba', 'Alma', 'Anika', 'April', 'Astrid', 'Ava', 'Bea', 'Bess', 'Birdie', 'Calla', 'Camille', 'Carmen', 'Celia', 'Clara', 'Cleo', 'Clover', 'Cora', 'Dahlia', 'Daisy', 'Dawn', 'Della', 'Dina', 'Dot', 'Edie', 'Effie', 'Eliza', 'Elsie', 'Emz', 'Esme', 'Etta', 'Fawn', 'Fern', 'Fiona', 'Flo', 'Ginger', 'Hana', 'Hattie', 'Hazel', 'Holly', 'Ida', 'Imani', 'Ines', 'Iris', 'Ivy', 'Jada', 'Joni', 'June', 'Juno', 'Kat', 'Keiko', 'Laurel', 'Lena', 'Lila', 'Lola', 'Lucy', 'Lulu', 'Mabel', 'Mae', 'Maggie', 'Malia', 'Maple', 'Margo', 'Maude', 'Mavis', 'Meadow', 'Mei', 'Mila', 'Mina', 'Nadia', 'Nell', 'Nina', 'Nora', 'Odette', 'Olive', 'Opal', 'Orla', 'Paloma', 'Peg', 'Pepper', 'Piper', 'Poppy', 'Priya', 'Ramona', 'Rhea', 'Rosa', 'Ruby', 'Selma', 'Stella', 'Suki', 'Tali', 'Tess', 'Thea', 'Tilly', 'Tova', 'Uma', 'Una', 'Vera', 'Vida', 'Willa', 'Willow', 'Winnie', 'Yara', 'Zadie', 'Zara', 'Zoe', 'Zora', 'Zuri'].includes(name));
const NPC_MASCULINE_FIRST_NAMES = NPC_FIRST_NAMES.filter(name => NPC_NEUTRAL_FIRST_NAMES.includes(name) || !NPC_FEMININE_FIRST_NAMES.includes(name));
const NPC_COMMON_FEMININE_NAMES = NPC_FEMININE_FIRST_NAMES.filter(name => name !== 'Emz');
const NPC_COMMON_MASCULINE_NAMES = NPC_MASCULINE_FIRST_NAMES.filter(name => name !== 'Emz');

const NPC_LAST_NAMES = [
    'Abbott', 'Acorn', 'Alder', 'Ames', 'Ashdown', 'Baker', 'Banks', 'Barlow', 'Barnes', 'Bay', 'Beck', 'Bell', 'Birch', 'Bishop', 'Black', 'Bloom',
    'Bonner', 'Bower', 'Bramble', 'Brook', 'Burrows', 'Bush', 'Calder', 'Carver', 'Castle', 'Chase', 'Clay', 'Cliff', 'Cobb', 'Cole', 'Cook', 'Cotton',
    'Cove', 'Crane', 'Cricket', 'Cross', 'Dale', 'Darling', 'Dawes', 'Dell', 'Dewey', 'Drake', 'Dune', 'Dunn', 'Eddy', 'Elm', 'Ember', 'Fairley',
    'Fallow', 'Farrow', 'Fenn', 'Field', 'Finch', 'Fisher', 'Fleet', 'Flint', 'Ford', 'Fox', 'Frost', 'Gale', 'Garner', 'Glade', 'Glenn', 'Goode',
    'Gray', 'Greer', 'Grove', 'Gull', 'Hale', 'Hallow', 'Hart', 'Hawke', 'Hayes', 'Heath', 'Hearth', 'Hill', 'Holt', 'Hook', 'Hope', 'Huck',
    'Hollis', 'Ivers', 'Jay', 'Keel', 'Kemp', 'Kettle', 'Knoll', 'Lake', 'Lane', 'Lark', 'Leaf', 'Lee', 'Linden', 'Lock', 'Lowe', 'Lumen',
    'Lyle', 'Mace', 'Mallow', 'Marsh', 'Meade', 'Mercer', 'Mill', 'Minnow', 'Moor', 'Moss', 'Nash', 'Noble', 'North', 'Nutt', 'Oakes', 'Orchard',
    'Otter', 'Page', 'Paddock', 'Park', 'Pebble', 'Penn', 'Pike', 'Pine', 'Plum', 'Pond', 'Poole', 'Quarry', 'Rains', 'Reed', 'Reef', 'Ridge',
    'Rook', 'Rowe', 'Rush', 'Rye', 'Sable', 'Salt', 'Sands', 'Shaw', 'Shell', 'Shore', 'Sky', 'Slate', 'Sloane', 'Snow', 'Sparrow', 'Spring',
    'Stone', 'Storm', 'Strand', 'Swift', 'Tate', 'Teal', 'Thatcher', 'Thorne', 'Tide', 'Todd', 'Trout', 'Tully', 'Vale', 'Vance', 'Wade', 'Ward',
    'Warren', 'Waters', 'Weaver', 'Webb', 'Wells', 'West', 'Whit', 'Wick', 'Wilde', 'Willow', 'Winter', 'Wolfe', 'Wood', 'Wren', 'Yarrow', 'Yates',
    'Abara', 'Bianchi', 'Castillo', 'Dubois', 'Esposito', 'Fujita', 'Garza', 'Haddad', 'Ito', 'Jensen', 'Kaur', 'Larsen', 'Moreau', 'Nakamura', 'Okafor', 'Petrov',
    'Quintero', 'Rossi', 'Sato', 'Tanaka', 'Ueda', 'Varga', 'Weiss', 'Xu', 'Yilmaz', 'Zhou'
];

const NPC_PERSONALITIES = [
    {
        greetings: ["Oh, hello! I'm {first}. Isn't it a gorgeous day?", "Hi there! {first}, nice to meet you. You picked a great day to be out!"],
        familiar: ["Oh, it's you again! Good to see you.","Welcome back! How has your day been?"],
        rainGreetings: ["Oh, hello! I'm {first}. A little rain won't ruin the day.", "Oh, it's you again! We keep meeting in wet weather."],
        chatter: ["I counted three kinds of flowers on my walk this morning. I'm going for four tomorrow.", "The guide by the shop knows everything. Well, almost everything!", "Have you seen the blue flower patches? They make me so happy."],
        fishing: ["Not a nibble yet, but the sun's warm, so who's complaining?", "One almost bit! It changed its mind at the last second, the rascal."],
        rainFishing: ["A few raindrops will not spoil a quiet moment by the water.", "The rain keeps making little rings around my bobber. I nearly mistake them for bites!"],
        tradeDone: "We already traded this hour! Come back a little later, okay?",
        thanks: "Wonderful! Here's {coins}c. You're a natural!"
    },
    {
        greetings: ["Hm? Oh. {first}. What do you want?", "{first}. If you're here to chat, make it quick."],
        familiar: ["You again. All right, what is it?","Back already? Make yourself comfortable, I suppose."],
        rainGreetings: ["{first}. Mind the puddles, and don't drip on my gear.", "You again. At least the rain is quieter than most people."],
        chatter: ["Everyone thinks fishing is relaxing. It is not. It is war.", "The fish around here are smarter than they look. Don't let them fool you.", "Shop prices keep going up. Mark my words."],
        fishing: ["Shh. You'll scare them off. Again.", "They keep nibbling and running. I swear they're laughing at me."],
        rainFishing: ["Now the rain is tapping the water too. As if the fish were not enough trouble.", "I am watching the bobber, not every raindrop. There is a difference."],
        tradeDone: "We're done for this hour. Shoo.",
        thanks: "Fine. {coins}c. Don't spend it all at once."
    },
    {
        greetings: ["Oh... hello. I'm {first}. I was just watching the water ripple.", "Mm, hi. {first}. Did you know clouds look like fish if you squint?"],
        familiar: ["Oh... we meet again. The water is different today.","Hello again. I was hoping our paths would cross."],
        rainGreetings: ["I'm {first}. I like listening to the rain on the water.", "Oh... hello again. The rain makes everything sound softer."],
        chatter: ["Sometimes I think the island hums when it's quiet. Can you hear it?", "I like the way the water changes color out in the deep. Teal, then blue, then darker blue.", "I dreamt about a fish as big as a bridge. I'm still looking for it."],
        fishing: ["I'm not really trying to catch anything. The bobber is good company.", "Something swam right up and then... left. Like a thought you almost had."],
        rainFishing: ["The bobber and the rain make their own little rhythm.", "It is harder to see the fish in the rain. I like listening while I wait."],
        tradeDone: "We traded already, didn't we? Time is so slippery. Maybe in an hour.",
        thanks: "Oh, how lovely. Here, {coins}c. Thank you, truly."
    },
    {
        greetings: ["Ah! Oh, sorry, you startled me. I'm {first}.", "H-hi! I'm {first}. Please don't step on my line!"],
        familiar: ["Oh, h-hi again! I recognize you now.","It's you! That is a relief. How are you?"],
        rainGreetings: ["H-hi, I'm {first}. Do you think this rain will get worse?", "Oh, it's you again! I feel better with someone familiar around."],
        chatter: ["Do you think the cliffs ever crumble? I try not to stand too close.", "I keep a spare bobber in every pocket. Just in case. You never know.", "The chests in the deep water make me nervous. What if something's guarding them?"],
        fishing: ["I had one! Then I panicked and it swam off. Again.", "The splash always scares me more than it scares the fish."],
        rainFishing: ["Every raindrop looks like a nibble. I am trying not to jump at all of them.", "If it rains much harder, I think I will put my rod away for a while."],
        tradeDone: "W-we already traded this hour. Sorry! Come back later?",
        thanks: "Th-thank you! Here's {coins}c. I counted it twice."
    },
    {
        greetings: ["Well, well. The name's {first}. Best angler on the island.", "{first}, at your service. You've probably heard of me."],
        familiar: ["Welcome back. Come for more expert advice?","There you are! Ready to hear from the island's finest?"],
        rainGreetings: ["{first}, at your service. A bit of rain is no match for experience.", "Back for more advice? Even in this weather, I see."],
        chatter: ["I once caught a bass so big the scale broke. Nobody believes me.", "A good cast is all in the wrist. And the confidence. Mostly the confidence.", "I've fished every pond on this island. Twice."],
        fishing: ["They're just warming up. Champions are patient.", "That fish was too small for me anyway. I let it go. On purpose."],
        rainFishing: ["A little rain just makes the challenge more interesting. I can wait.", "Rain or not, patience is part of the technique. I am demonstrating it."],
        tradeDone: "One deal an hour, friend. Even legends have rules.",
        thanks: "A fine haul. {coins}c, as promised. Tell your friends who paid you."
    },
    {
        greetings: ["Hey, hey! I'm {first}! Oh, I love meeting people. Where are you from?", "Hi! {first} here! Have you been fishing? What did you catch? Tell me everything!"],
        familiar: ["Hey, you're back! What have you been up to?","My friend! Tell me everything since we last talked!"],
        rainGreetings: ["Hey! I'm {first}. Have you noticed how different the island sounds in the rain?", "You're back! Did you get caught in the rain too?"],
        chatter: ["My cousin says the shop gets new rods sometimes. Or was it new bait? Something new, anyway!", "If you walk far enough, the grass goes from gold to green. I tested it. Twice!", "I tried to name every tree on the island. I got to forty and forgot the first one."],
        fishing: ["Nothing yet, but I've been talking the whole time, so that might be why.", "A fish came right up to my bobber and stared at me! Then it left. Rude!"],
        rainFishing: ["Have you noticed how many little ripples the rain makes? I keep losing count!", "I am still waiting for a bite. The rain is keeping me company in the meantime."],
        tradeDone: "We already traded! But I'll take more next hour, promise!",
        thanks: "Yes! Perfect! Here's {coins}c! Pleasure doing business!"
    }
];

const NPC_FISHING_TIPS = [
    "Small taps are just fish testing your bait. Wait for the big splash, then reel.",
    "Deep water past the shore holds the bigger fish. Cast long if your rod can.",
    "Bait makes your catch bar bigger. Press B to swap between the kinds you own.",
    "If you see a chest shadow under the water, cast right on top of it.",
    "Hold Shift to run. Your feet will thank you on the long walks."
];

const NPC_RUMOR_LINES = [
    "Word is a {species} is circling the water {where}. Check your map!",
    "My cousin saw a huge {species} jump {where}. Check your map!",
    "Try fishing {where}. Folks keep seeing a {species}. Check your map!",
    "Psst. There's a {species} lurking {where}. Check your map!"
];

const NPC_NO_RUMOR_LINES = [
    "Rumors? Not today. The water's been quiet around here.",
    "I haven't heard a thing. Ask me again tomorrow!"
];

const NPC_RARE_BAIT_NOW_LINES = [
    "I saw something really rare in the shop just now... You should check it out!",
    "The shop has a strange can in the Rare tab today. I've never seen one like it. Go look!"
];

const NPC_RARE_BAIT_SOON_LINES = [
    "The shopkeeper hinted something really rare is coming in soon. Keep an eye on the shop!",
    "Word is a very special bait will turn up at the shop before long. Don't miss it!"
];

window.WaterWarpPipeline = class WaterWarpPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game) {
        super({
            game,
            fragShader: `
                #ifdef GL_FRAGMENT_PRECISION_HIGH
                precision highp float;
                #else
                precision mediump float;
                #endif

                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform vec2 uScroll;
                uniform float uViewHeight;
                uniform vec4 uFish[${FISH_MAX_VISIBLE}];
                uniform vec4 uFishShape[${FISH_MAX_VISIBLE}];
                uniform float uFishCount;
                uniform vec2 uBiomeOffset;
                varying vec2 outTexCoord;
                varying vec4 outTint;

                float hash(vec2 p) {
                    p = mod(p, 289.0);
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                float noise(vec2 x) {
                    vec2 i = floor(x);
                    vec2 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                        f.y
                    );
                }

                float fbm(vec2 x) {
                    vec2 r = mat2(0.8, -0.6, 0.6, 0.8) * x;
                    return noise(r) * 0.65 + noise(mat2(0.8, 0.6, -0.6, 0.8) * x * 2.03 + vec2(7.3, 2.9)) * 0.35;
                }

                float biomeHash(vec2 p) {
                    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                    p3 += dot(p3, p3.yzx + 33.33);
                    return fract((p3.x + p3.y) * p3.z);
                }

                float biomeNoise(vec2 x) {
                    vec2 i = floor(x);
                    vec2 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(biomeHash(i), biomeHash(i + vec2(1.0, 0.0)), f.x), mix(biomeHash(i + vec2(0.0, 1.0)), biomeHash(i + vec2(1.0, 1.0)), f.x), f.y);
                }

                vec3 waterTint(vec2 p) {
                    float noise = biomeNoise(p / ${WATER_BIOME_SCALE.toFixed(1)} + uBiomeOffset) * 0.75 + biomeNoise(p / ${(WATER_BIOME_SCALE / 3).toFixed(1)} + uBiomeOffset + vec2(17.0, 9.0)) * 0.25;
                    float amount = clamp((noise - 0.5) * 1.9 + 0.5, 0.0, 1.0);
                    return amount < 0.5 ? mix(vec3(${WATER_TINTS[0].join(', ')}), vec3(${WATER_TINTS[1].join(', ')}), amount * 2.0) : mix(vec3(${WATER_TINTS[1].join(', ')}), vec3(${WATER_TINTS[2].join(', ')}), amount * 2.0 - 1.0);
                }

                vec3 tone(float index) {
                    if (index < 0.5) return vec3(0.255, 0.400, 0.647);
                    if (index < 1.5) return vec3(0.278, 0.439, 0.690);
                    if (index < 2.5) return vec3(0.298, 0.471, 0.733);
                    if (index < 3.5) return vec3(0.318, 0.506, 0.769);
                    if (index < 4.5) return vec3(0.341, 0.549, 0.796);
                    if (index < 5.5) return vec3(0.369, 0.608, 0.827);
                    if (index < 6.5) return vec3(0.416, 0.667, 0.839);
                    if (index < 7.5) return vec3(0.482, 0.733, 0.851);
                    if (index < 8.5) return vec3(0.608, 0.824, 0.882);
                    if (index < 9.5) return vec3(0.737, 0.902, 0.922);
                    return vec3(0.875, 0.953, 0.961);
                }

                float code(float channel) {
                    return floor(channel * 255.0 + 0.5);
                }

                float caustic(vec2 p) {
                    return mod(code(texture2D(uMainSampler, (mod(p, 32.0) + 0.5) / 256.0).g), 3.0) * 0.5;
                }

                void main() {
                    vec4 mask = texture2D(uMainSampler, outTexCoord);

                    if (mask.r < 0.25) {
                        discard;
                    }

                    vec2 p = floor(vec2(gl_FragCoord.x, uViewHeight - gl_FragCoord.y)) + uScroll;
                    float t = uTime;
                    float checker = mod(p.x + p.y, 2.0) - 0.5;
                    float bayerX = mod(p.x, 2.0);
                    float bayerY = mod(p.y, 2.0);
                    float bayer = (bayerX < 0.5 ? (bayerY < 0.5 ? 0.0 : 3.0) : (bayerY < 0.5 ? 2.0 : 1.0)) / 3.0 - 0.5;

                    vec2 swell = p * 0.011 + vec2(t * 0.045, -t * 0.03);
                    vec2 warp = vec2(noise(swell), noise(swell + vec2(31.7, 11.3))) - 0.5;
                    float strength = 4.0 + 12.0 * noise(p * 0.007 + vec2(-t * 0.025, t * 0.02));
                    vec2 rippleField = p * 0.06 + vec2(t * 0.4, t * 0.27);
                    vec2 ripple = vec2(noise(rippleField), noise(rippleField + vec2(5.2, 1.3))) - 0.5;
                    vec2 offset = warp * strength + ripple * 3.0;

                    float shore = floor(code(mask.g) / 3.0);
                    float wobble = (fbm(p * 0.045 + warp * 0.6 + vec2(t * 0.05, -t * 0.04)) - 0.5) * 4.0;
                    float lap = sin(t * 1.3 + (p.x + p.y) * 0.045) * max(0.0, 1.0 - shore / 8.0) * 1.2;
                    float reach = shore + wobble + bayer * 0.8 - lap;
                    float depth = fbm(p * 0.012 + warp * 1.2 + vec2(t * 0.03, t * 0.01)) + bayer * 0.05 -
                        max(0.0, shore - 15.0) * 0.012;
                    float light = fbm(p * 0.021 - warp * 0.9 + vec2(-t * 0.06, t * 0.04)) + checker * 0.016;

                    float index = 3.0;

                    if (reach < 1.5) {
                        index = 7.0;
                    } else if (reach < 4.5) {
                        index = 6.0;
                    } else if (reach < 9.0) {
                        index = 5.0;
                    } else if (reach < 15.0) {
                        index = 4.0;
                    } else if (depth < 0.4) {
                        index = 2.0;
                    }



                    float first = caustic(floor(p + offset + vec2(t * 4.0, t * 1.6) + 0.5));
                    float second = caustic(floor(p * 0.75 - offset * 0.8 + vec2(-t * 2.6, t * 3.1) + 0.5) + vec2(13.0, 7.0));
                    float gate = light + max(0.0, 12.0 - shore) / 12.0 * 0.08 - max(0.0, shore - 10.0) * 0.02;

                    if (first > 0.9 && second > 0.9 && gate > 0.75) {
                        index = 10.0;
                    } else if (first > 0.9 && second > 0.9 && gate > 0.6) {
                        index = 9.0;
                    } else if (first > 0.9 && gate > 0.56) {
                        index = min(index + (gate > 0.63 ? 3.0 : 2.0), 8.0);
                    } else if (first > 0.4 && gate > 0.64) {
                        index = min(index + 1.0, 7.0);
                    }

                    float edgeCode = code(mask.b);

                    float shaded = mask.r < 0.75 ? 1.0 : 0.0;
                    float fishShaded = 0.0;

                    for (int fish = 0; fish < ${FISH_MAX_VISIBLE}; fish++) {
                        if (float(fish) >= uFishCount) break;

                        vec4 body = uFish[fish];
                        vec4 shape = uFishShape[fish];
                        vec2 local = p + 0.5 - body.xy;
                        float bound = shape.x * 0.5 + shape.y + abs(shape.w);

                        if (dot(local, local) > bound * bound) continue;

                        float along = dot(local, body.zw);
                        float halfLength = shape.x * 0.5;
                        float spine = clamp((halfLength - along) / shape.x, 0.0, 1.0);
                        float wave = shape.w * spine * spine * sin(spine * 5.6 - shape.z);
                        float across = dot(local, vec2(-body.w, body.z)) - wave;
                        float head = halfLength - shape.y;
                        float headOffset = along - head;

                        if (
                            headOffset * headOffset + across * across < shape.y * shape.y ||
                            along < head && along > -halfLength && abs(across) < shape.y * (along + halfLength) / (head + halfLength)
                        ) {
                            fishShaded = 1.0;
                            break;
                        }
                    }

                    if (fishShaded > 0.5) {
                        index = max(index - 2.0, 0.0);
                    } else if (shaded > 0.5) {
                        index = max(index - (edgeCode > 3.5 && edgeCode < 4.5 ? 0.0 : 1.0 + (edgeCode > 1.5 && edgeCode < 2.5 || edgeCode > 2.5 && edgeCode < 3.5 && checker > 0.0 ? 1.0 : 0.0)), 0.0);
                    }

                    if (edgeCode > 250.0) {
                        float frame = floor(t * 12.0);
                        float edge = noise(vec2(p.x - frame, p.y + frame * 0.25) / 24.0 + vec2(41.0, 17.0));

                        if (edge >= 0.58 || edge >= 0.39 && edge < 0.42) {
                            index = 10.0;
                        } else {
                            index = 8.0;
                        }
                    }

                    gl_FragColor = vec4(tone(index) * (fishShaded < 0.5 && shaded > 0.5 && edgeCode > 4.5 && edgeCode < 5.5 ? 0.9 : 1.0) * (index < 7.5 ? waterTint(p) : vec3(1.0)), 1.0);
                }
            `
        });
    }
}

function extractRodArtStyles(scene) {
    const colorAt = (texture, [x, y, fallback]) => {
        const color = scene.textures.getPixel(x, y, texture);
        return color ? Phaser.Display.Color.GetColor(color.red, color.green, color.blue) : fallback;
    };
    const sample = (rod, points) => points.map(point => colorAt(rod.texture, point));

    for (const rod of MARKET_RODS) {
        rod.polePalette = sample(rod, [[19, 4, 0x4c3e32], [19, 6, 0x6b533b], [19, 5, 0x806953]]);
        rod.linePalette = sample(rod, [[28, 2, 0xa78178], [29, 3, 0xb99f92], [29, 5, 0xc8b8a8], [30, 9, FISHING_LINE_COLOR]]);
        rod.bobberPalette = sample(rod, [[27, 26, BOBBER_TOP_COLOR], [25, 26, BOBBER_TOP_COLOR], [23, 25, BOBBER_BOTTOM_COLOR]]);
    }
}

function createShimmerSheet(scene) {
    const source = getTerrainPixels(scene, 'shimmer-art');
    const [fromR, fromG, fromB] = SHIMMER_RECOLOR_FROM;

    for (let step = 0; step < SHIMMER_TINT_STEPS; step++) {
        const image = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
        const canvas = document.createElement('canvas');
        const tint = blendWaterTints(step / (SHIMMER_TINT_STEPS - 1));
        const color = SHIMMER_RECOLOR_TO.map((value, channel) => Math.min(255, Math.round(value * tint[channel])));

        for (let index = 0; index < image.data.length; index += 4) {
            if (image.data[index] === fromR && image.data[index + 1] === fromG && image.data[index + 2] === fromB) {
                image.data.set(color, index);
            }
        }

        canvas.width = source.width;
        canvas.height = source.height;
        canvas.getContext('2d').putImageData(image, 0, 0);
        scene.textures.addSpriteSheet(`shimmer-${step}`, canvas, { frameWidth: 12, frameHeight: 1 });
    }
}

function createBridgeEdgeTexture(scene) {
    const deck = getTerrainPixels(scene, 'wood').data;
    const end = getTerrainPixels(scene, 'woodLeft').data;
    const rowMatches = y => deck.subarray(y * TILE_SIZE * 4, (y + 1) * TILE_SIZE * 4).every((value, index) => value === end[y * TILE_SIZE * 4 + index]);
    const rowOpaque = y => Array.from({ length: TILE_SIZE }, (_, x) => end[(y * TILE_SIZE + x) * 4 + 3]).every(Boolean);
    let beamRow = 0;
    while (beamRow < TILE_SIZE && rowMatches(beamRow)) beamRow++;
    let legRow = beamRow;
    while (legRow < TILE_SIZE && rowOpaque(legRow)) legRow++;

    createCanvasTexture(scene, 'woodLip', TILE_SIZE, TILE_SIZE, context => {
        const image = context.createImageData(TILE_SIZE, TILE_SIZE);
        for (let y = 0; y < legRow; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const source = y < beamRow ? ((TILE_SIZE - 1 - x) * TILE_SIZE + y) * 4 : (y * TILE_SIZE + x) * 4;
                image.data.set((y < beamRow ? deck : end).subarray(source, source + 4), (y * TILE_SIZE + x) * 4);
            }
        }
        context.putImageData(image, 0, 0);
    });
}

function createCanvasTexture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return;

    const texture = scene.textures.createCanvas(key, width, height);
    draw(texture.getContext());
    texture.refresh();
}

function writeRGBPixel(data, pixel, color) {
    const index = pixel * 4;
    data[index] = (color >> 16) & 255;
    data[index + 1] = (color >> 8) & 255;
    data[index + 2] = color & 255;
    data[index + 3] = 255;
}

function extractSilhouetteShadow(scene, key) {
    const pixels = getTerrainPixels(scene, key);
    const { width, height } = pixels;
    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && pixels.data[(y * width + x) * 4 + 3] > 0;
    const points = [];

    for (let y = 0; y < height + WOOD_SHADOW_OFFSET; y++) {
        for (let x = 0; x < width + WOOD_SHADOW_OFFSET; x++) {
            if (solid(x - WOOD_SHADOW_OFFSET, y - WOOD_SHADOW_OFFSET) && !solid(x, y)) points.push(x, y);
        }
    }

    return points;
}

function createPropArt(scene) {
    for (const key of ['bush', 'rock', 'boulder']) {
        const source = getTextureSource(scene, key);
        propArt.set(key, { width: source.width, height: source.height, shadow: extractSilhouetteShadow(scene, key) });
    }

    const trunk = getTerrainPixels(scene, 'tree-bare');
    treeVariants.length = 0;
    treeVariantsByPalette.length = 0;
    for (const palette of TREE_LEAF_PALETTES) treeVariantsByPalette.push([]);

    for (let index = 0; index < TREE_VARIANT_COUNT; index++) {
        const variant = generateTreeVariant(trunk, Math.floor(worldHash(index, 0, 766) * 4294967295), index % TREE_LEAF_PALETTES.length);
        variant.key = `tree-${index}`;
        createCanvasTexture(scene, variant.key, variant.width, variant.height, context => {
            context.putImageData(new ImageData(variant.data, variant.width, variant.height), 0, 0);
        });
        for (const part of ['trunk', 'canopy']) {
            createCanvasTexture(scene, `${variant.key}-${part}`, variant.width, variant.height, context => {
                context.putImageData(new ImageData(variant[`${part}Data`], variant.width, variant.height), 0, 0);
            });
        }
        treeVariants.push(variant);
        treeVariantsByPalette[index % TREE_LEAF_PALETTES.length].push(variant);
    }
}

function createBushSlices(scene) {
    const source = getTerrainPixels(scene, 'bush');
    const { width, height } = source;
    const depths = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = y * width + x;
            if (!source.data[pixel * 4 + 3]) continue;
            depths[pixel] = Math.min(TILE_SIZE - 1, Math.floor(
                (worldHash(x, y, 761) * 0.7 + (y / (height - 1)) * 0.3) * TILE_SIZE
            ));
        }
    }

    for (let slice = 0; slice < TILE_SIZE; slice++) {
        createCanvasTexture(scene, `bush-slice-${slice}`, width, height, context => {
            const image = new ImageData(new Uint8ClampedArray(source.data), width, height);

            for (let pixel = 0; pixel < depths.length; pixel++) {
                if (depths[pixel] !== slice) image.data[pixel * 4 + 3] = 0;
            }

            context.putImageData(image, 0, 0);
        });
    }
}

function createSeededRandom(seed) {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = Math.imul(state ^ (state >>> 15), state | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function createLeafHash(salt) {
    const seedHash = Math.imul(salt, 2246822519);
    return (x, y) => coordinateHash(x, y, seedHash);
}

function pickTreePalette(random) {
    const total = TREE_LEAF_PALETTES.reduce((sum, palette) => sum + palette.weight, 0);
    let roll = random() * total;

    for (const palette of TREE_LEAF_PALETTES) {
        roll -= palette.weight;
        if (roll < 0) return palette;
    }

    return TREE_LEAF_PALETTES[0];
}

function readTreePixel(data, pixel) {
    const index = pixel * 4;
    return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
}

function mapTrunkTone(data, source, curve, shade) {
    const value = data[source] * 0.299 + data[source + 1] * 0.587 + data[source + 2] * 0.114;
    const stops = [61, 77, 91, 108, 119];
    let band = 0;
    while (band < stops.length - 2 && value > stops[band + 1]) band++;
    const amount = Math.max(0, Math.min(1, (value - stops[band]) / (stops[band + 1] - stops[band])));
    return [16, 8, 0].map(shift => Math.min(255, Math.round((((curve[band] >> shift) & 255) * (1 - amount) + ((curve[band + 1] >> shift) & 255) * amount) * shade)));
}

function createTreeCanopyMask(puffs, width, height, edgeSalt) {
    const edgeHash = createLeafHash(edgeSalt);
    const owner = new Int16Array(width * height).fill(-1);
    const extent = (axis, sign) => {
        let bound = -Infinity;
        for (const puff of puffs) bound = Math.max(bound, sign * puff[axis] + puff.radius + 1);
        return Math.floor(bound * sign);
    };
    const minY = Math.max(0, extent('y', -1) - 1);
    const maxY = Math.min(height - 1, extent('y', 1));
    const minX = Math.max(0, extent('x', -1) - 1);
    const maxX = Math.min(width - 1, extent('x', 1));

    for (let y = minY; y <= maxY; y++) {
        const row = y * width;
        for (let x = minX; x <= maxX; x++) {
            const edge = (edgeHash(x, y) - 0.5) * 1.2;
            const pixel = row + x;

            for (let index = puffs.length - 1; index >= 0; index--) {
                const puff = puffs[index];
                const dx = x + 0.5 - puff.x;
                const dy = y + 0.5 - puff.y;
                const reach = puff.radius + edge;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared <= reach * reach) {
                    if (index > 0 && ((x + y) & 1) && distanceSquared > (reach - 1) * (reach - 1) && owner[pixel] === -1) {
                        owner[pixel] = -3;
                        continue;
                    }

                    owner[pixel] = index;
                    break;
                }
            }
        }
    }

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] !== -3) continue;

        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const edge = (edgeHash(x, y) - 0.5) * 1.2;

        owner[pixel] = puffs.findLastIndex(puff => {
            const reach = puff.radius + edge;
            return (x + 0.5 - puff.x) ** 2 + (y + 0.5 - puff.y) ** 2 <= reach * reach;
        });
    }

    const neighbors = [-1, 1, -width, width];

    for (let pass = 0; pass < 2; pass++) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const pixel = y * width + x;
                let count = 0;
                let front = -1;

                for (const offset of neighbors) {
                    const next = pixel + offset;
                    if (owner[next] < 0) continue;
                    count++;
                    front = Math.max(front, owner[next]);
                }

                if (owner[pixel] >= 0 && count <= 1) owner[pixel] = -1;
                else if (owner[pixel] < 0 && count >= 3) owner[pixel] = front;
            }
        }
    }

    return owner;
}

function createTreeShadow(owner, width, height, centerY, salt) {
    const groundY = height - 1;
    let top = height;
    let bottom = -1;
    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] < 0) continue;
        const y = Math.floor(pixel / width);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
    }
    const shadow = new Set();
    for (let y = Math.floor(groundY + TREE_SHADOW_DROP + (top - centerY) * TREE_SHADOW_SQUASH); y <= Math.ceil(groundY + TREE_SHADOW_DROP + (bottom - centerY) * TREE_SHADOW_SQUASH); y++) {
        const sourceY = Math.round(centerY + (y - groundY - TREE_SHADOW_DROP) / TREE_SHADOW_SQUASH);
        if (sourceY < 0 || sourceY >= height) continue;
        for (let x = TREE_SHADOW_SHIFT; x < width + TREE_SHADOW_SHIFT; x++) {
            if (owner[sourceY * width + x - TREE_SHADOW_SHIFT] >= 0) shadow.add(y * 1024 + x);
        }
    }
    const dapple = createLeafHash(salt);
    const points = [];
    for (const point of shadow) {
        const x = point % 1024, y = point >> 10;
        let open = 0;
        for (const offset of [-1, 1, -1024, 1024, -2, 2, -2048, 2048]) open += !shadow.has(point + offset);
        if (dapple(x >> 1, y) >= TREE_SHADOW_DAPPLE + open * TREE_SHADOW_EDGE_DAPPLE) points.push(x, y);
    }
    return points;
}

function createTreeContactShadow(left, right, height) {
    const centerX = (left + right) / 2;
    const radius = (right - left) / 2 + TREE_CONTACT_SHADOW_SPREAD;
    const points = [];
    for (let y = height - 2; y <= height; y++) {
        const reach = Math.round(radius * (y === height - 1 ? 1 : 0.8));
        for (let x = Math.round(centerX - reach); x < Math.round(centerX + reach); x++) points.push(x, y);
    }
    return points;
}

function generateTreeVariant(trunk, seed, paletteIndex) {
    const random = createSeededRandom(seed);
    const flip = random() < 0.5;
    const width = trunk.width + TREE_PAD_X * 2;
    const height = trunk.height + TREE_PAD_TOP;
    const data = new Uint8ClampedArray(width * height * 4);
    const trunkShade = TREE_TRUNK_SHADES[Math.floor(createSeededRandom(seed ^ 0x5bd1e995)() * TREE_TRUNK_SHADES.length)];
    const picked = pickTreePalette(random);
    const palette = TREE_LEAF_PALETTES[paletteIndex] ?? picked;
    const trunkCurve = TREE_TRUNK_CURVES[palette.trunk ?? Math.floor(createSeededRandom(seed ^ 0x27d4eb2d)() * TREE_TRUNK_CURVES.length)];

    for (let y = 0; y < trunk.height; y++) {
        const sourceRow = y * trunk.width;
        const targetRow = (y + TREE_PAD_TOP) * width + TREE_PAD_X;
        for (let x = 0; x < trunk.width; x++) {
            const source = (sourceRow + (flip ? trunk.width - 1 - x : x)) * 4;
            if (!trunk.data[source + 3]) continue;

            const pixel = targetRow + x;
            const patternRow = Math.max(0, Math.min(trunk.height - 1, y + Math.floor(coordinateHash(x >> 2, y >> 3, seed ^ 0x762b9) * 9) - 4)), patternSource = (patternRow * trunk.width + (flip ? trunk.width - 1 - x : x)) * 4;
            const [red, green, blue] = mapTrunkTone(trunk.data, trunkCurve === TREE_TRUNK_CURVES[1] && trunk.data[patternSource + 3] ? patternSource : source, trunkCurve, trunkShade);
            writeRGBPixel(data, pixel, (red << 16) | (green << 8) | blue);
        }
    }

    const colors = palette.colors;
    const radiusX = 23 + random() * 5;
    const radiusY = 17 + random() * 3;
    const centerX = width / 2 + (flip ? -1 : 1) + (random() - 0.5) * 3;
    const centerY = TREE_PAD_TOP + 22 + random() * 2;
    const puffs = [{ x: centerX, y: centerY, radius: Math.min(radiusX, radiusY) - 4, core: true }];
    const ringCount = 7 + Math.floor(random() * 3);
    const ringPhase = random() * Math.PI * 2;

    for (let index = 0; index < ringCount; index++) {
        const angle = ringPhase + index / ringCount * Math.PI * 2 + (random() - 0.5) * 0.5;
        const radius = 6.5 + random() * 3;

        puffs.push({ x: centerX + Math.cos(angle) * (radiusX - radius), y: centerY + Math.sin(angle) * (radiusY - radius), radius, core: false });
    }

    const innerCount = 3 + Math.floor(random() * 3);

    for (let index = 0; index < innerCount; index++) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * 0.5;

        puffs.push({ x: centerX + Math.cos(angle) * distance * radiusX, y: centerY + Math.sin(angle) * distance * radiusY + 2, radius: 7 + random() * 3, core: false });
    }

    puffs.sort((a, b) => (a.core ? -1 : b.core ? 1 : a.y - b.y));
    for (const puff of puffs) puff.radiusSquared = puff.radius * puff.radius;

    const edgeSalt = Math.floor(random() * 100000);
    const owner = createTreeCanopyMask(puffs, width, height, edgeSalt);

    const filled = [];
    const heights = new Float32Array(width * height);
    const smooth = new Float32Array(width * height);

    for (let pixel = 0; pixel < owner.length; pixel++) {
        if (owner[pixel] >= 0) filled.push(pixel);
    }

    const top = Math.floor(filled[0] / width);
    const bottom = Math.floor(filled[filled.length - 1] / width);

    for (const pixel of filled) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let best = 0;

        for (const puff of puffs) {
            const dx = x + 0.5 - puff.x;
            const dy = y + 0.5 - puff.y;
            const lift = puff.radiusSquared - dx * dx - dy * dy;
            if (lift > 0) best = Math.max(best, Math.sqrt(lift) * (puff.core ? 0.8 : 1));
        }

        heights[pixel] = best;
    }

    for (const pixel of filled) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let total = 0;
        let count = 0;
        const lastX = Math.min(width - 1, x + 1);
        const lastY = Math.min(height - 1, y + 1);

        for (let sampleY = Math.max(0, y - 1); sampleY <= lastY; sampleY++) {
            const row = sampleY * width;
            for (let sampleX = Math.max(0, x - 1); sampleX <= lastX; sampleX++) {
                total += heights[row + sampleX];
                count++;
            }
        }

        smooth[pixel] = total / count;
    }

    const textureSalt = Math.floor(random() * 100000);
    const textureHash = createLeafHash(textureSalt);
    const levels = new Int8Array(width * height).fill(-1);
    const values = new Float32Array(width * height);
    const span = Math.max(1, bottom - top);

    for (const pixel of filled) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const depth = (y - top) / span;
        const left = x > 0 ? smooth[pixel - 1] : 0;
        const right = x + 1 < width ? smooth[pixel + 1] : 0;
        const up = y > 0 ? smooth[pixel - width] : 0;
        const down = y + 1 < height ? smooth[pixel + width] : 0;
        const nx = (left - right) * 0.5;
        const ny = (up - down) * 0.5;
        const length = Math.hypot(nx, ny, 1.6);
        const puff = puffs[owner[pixel]];
        const puffX = (x + 0.5 - puff.x) / puff.radius;
        const puffY = (y + 0.5 - puff.y) / puff.radius;
        const puffZ = Math.sqrt(Math.max(0, 1 - puffX * puffX - puffY * puffY));
        const local = puff.core ? 0.5 : -0.45 * puffX - 0.7 * puffY + 0.35 * puffZ;
        const lit = (-0.5 * nx - 0.65 * ny + 0.57 * 1.6) / length * 0.3 + (local * 0.5 + 0.3) * 0.7;
        const global = -0.12 * (x + 0.5 - centerX) / radiusX - 0.3 * (depth - 0.45);
        let value = (lit - 0.62) * 1.9 + global;

        const speck = textureHash(x >> 1, y);
        if (speck > 0.86) value += 0.22;
        else if (speck < 0.14) value -= 0.22;

        values[pixel] = value;
    }

    const sorted = Float32Array.from(filled, pixel => values[pixel]).sort();

    const quantile = amount => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(amount * sorted.length)))];
    const bands = TREE_TONE_SHARES.map(share => [quantile(share - TREE_DITHER_SHARE), quantile(share + TREE_DITHER_SHARE)]);

    for (const pixel of filled) {
        const checker = (pixel % width + Math.floor(pixel / width)) & 1;
        let level = 0;

        for (const [low, high] of bands) {
            if (values[pixel] >= high || values[pixel] >= low && checker) level++;
        }

        levels[pixel] = level;
    }

    for (let pixel = 0; pixel < (bottom - 3) * width; pixel++) {
        if (owner[pixel] < 0) data[pixel * 4 + 3] = 0;
    }

    for (const pixel of filled) writeRGBPixel(data, pixel, colors[levels[pixel]]);

    if (palette.extras.length && random() < 0.4) {
        const extra = palette.extras[Math.floor(random() * palette.extras.length)];
        const count = 5 + Math.floor(random() * 6);

        for (let attempt = 0, placed = 0; attempt < 500 && placed < count; attempt++) {
            const pixel = Math.floor(random() * levels.length);
            if (levels[pixel] < 1 || levels[pixel] > 2 || levels[pixel + 1] < 0 || levels[pixel - width] < 0) continue;

            writeRGBPixel(data, pixel, extra);
            placed++;
        }
    }

    const bark = [];

    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0 || !data[pixel * 4 + 3]) continue;
        const color = readTreePixel(data, pixel);
        if (!bark.includes(color)) bark.push(color);
    }

    const luma = color => (color >> 16) * 0.299 + ((color >> 8) & 255) * 0.587 + (color & 255) * 0.114;
    bark.sort((a, b) => luma(a) - luma(b));

    for (let x = 0; x < width; x++) {
        let shade = 0;

        for (let y = 0; y < height; y++) {
            const pixel = y * width + x;

            if (levels[pixel] >= 0) {
                shade = 4;
                continue;
            }

            if (shade > 0 && data[pixel * 4 + 3] && (shade > 2 || (x + y) & 1)) {
                writeRGBPixel(data, pixel, bark[Math.max(0, bark.indexOf(readTreePixel(data, pixel)) - 1)]);
            }

            shade--;
        }
    }

    const shadowPoints = createTreeShadow(owner, width, height, centerY, edgeSalt + 1);

    let hitLeft = width;
    let hitRight = 0;

    for (let y = height - 12; y < height - 8; y++) {
        for (let x = 0; x < width; x++) {
            if (!data[(y * width + x) * 4 + 3]) continue;
            hitLeft = Math.min(hitLeft, x);
            hitRight = Math.max(hitRight, x + 1);
        }
    }

    const trunkData = new Uint8ClampedArray(data);
    const canopyData = new Uint8ClampedArray(data);
    let shadowTop = Infinity;
    let shadowBottom = -Infinity;
    for (let point = 1; point < shadowPoints.length; point += 2) {
        shadowTop = Math.min(shadowTop, shadowPoints[point]);
        shadowBottom = Math.max(shadowBottom, shadowPoints[point]);
    }
    for (let pixel = 0; pixel < levels.length; pixel++) {
        if (levels[pixel] >= 0) trunkData[pixel * 4 + 3] = 0;
        else canopyData[pixel * 4 + 3] = 0;
    }

    return { width, height, data, trunkData, canopyData, shadowTop, shadowHeight: shadowBottom - shadowTop + 1, flip, shadowPoints, contactShadow: createTreeContactShadow(hitLeft, hitRight, height), hitLeft, hitRight, color: colors[2] };
}

function createRoundedCliffTextures(scene) {
    const source = key => getTextureSource(scene, key);

    for (let left = 0; left < DIRT_CLIFF_TILES.length; left++) {
        for (let right = 0; right < DIRT_CLIFF_TILES[left].length; right++) {
            const key = DIRT_CLIFF_TILES[left][right];
            const half = TILE_SIZE / 2;

            createCanvasTexture(scene, key, TILE_SIZE, TILE_SIZE, context => {
                context.drawImage(source(DIRT_CLIFF_TILES[left][0]), 0, 0, half, TILE_SIZE, 0, 0, half, TILE_SIZE);
                context.drawImage(source(DIRT_CLIFF_TILES[0][right]), half, 0, half, TILE_SIZE, half, 0, half, TILE_SIZE);
            });

            const cliffKey = left === 1 || right === 1 ? `${key}-trimmed` : key;

            createCanvasTexture(scene, cliffKey, TILE_SIZE, TILE_SIZE, context => {
                context.drawImage(source(key), 0, 0);

                for (const [trim, x] of [[left, 0], [right, TILE_SIZE - 2]]) {
                    if (trim !== 1) continue;
                    context.clearRect(x, TILE_SIZE - 1, 2, 1);
                    context.clearRect(x ? x + 1 : 0, TILE_SIZE - 2, 1, 1);
                }
            });

            for (const corner of ['cornerDirt1', 'cornerDirt2', 'cornerDirt3']) {
                createCanvasTexture(scene, `${cliffKey}-${corner}`, TILE_SIZE, TILE_SIZE, context => {
                    context.drawImage(source(cliffKey), 0, 0);
                    context.clearRect(0, 0, TILE_SIZE, 5);
                    context.drawImage(source(corner), 0, 0, TILE_SIZE, 5, 0, 0, TILE_SIZE, 5);
                });
            }
        }
    }

    for (const base of ['waterDirt', 'waterGrass']) {
        for (const [suffix, left, right] of [['InnerLeft', true, false], ['InnerRight', false, true], ['InnerBoth', true, true]]) {
            createCanvasTexture(scene, `${base}${suffix}`, TILE_SIZE, TILE_SIZE, context => {
                context.drawImage(source(base), 0, 0);
                if (left) context.drawImage(source('waterDirtInnerLeft'), 0, 0, 5, TILE_SIZE, 0, 0, 5, TILE_SIZE);
                if (right) context.drawImage(source('waterDirtInnerRight'), TILE_SIZE - 5, 0, 5, TILE_SIZE, TILE_SIZE - 5, 0, 5, TILE_SIZE);
            });
        }
    }
}

function getPersonPalette(look) {
    const [skin, , , shirtColor, pants, accessory, , topColor] = look;
    const blend = salt => look[16] ? ((Math.imul(look[16] ^ salt, 0x45d9f3b) >>> 0) & 65535) / 65535 : 0;
    return {
        skin: look[15] === undefined ? NPC_SKIN_TONES[skin] : getPersonSkinRamp(skin >= 5, look[15]),
        hair: samplePersonPalette(NPC_HAIR_COLORS, look[9] ?? (accessory ? 0 : topColor), blend(1)), eye: samplePersonPalette(NPC_EYE_PALETTES, look[13] ?? 0, look[13] ? blend(7) : 0)[0],
        pants: samplePersonPalette(NPC_PANTS_COLORS, pants, blend(2)),
        shirt: samplePersonPalette(NPC_SHIRT_COLORS, shirtColor, blend(3)),
        shirtAccent: samplePersonPalette(NPC_SHIRT_COLORS, look[10] ?? shirtColor, blend(5))[1], pantsAccent: samplePersonPalette(NPC_PANTS_COLORS, look[12] ?? pants, blend(6)),
        top: samplePersonPalette(accessory ? NPC_ACCESSORY_COLORS : NPC_HAIR_COLORS, topColor, blend(accessory ? 4 : 1))
    };
}

function samplePersonPalette(palettes, index, amount) {
    const first = palettes[index], next = palettes[(index + 1) % palettes.length];
    return first.map((color, shade) => [16, 8, 0].reduce((result, shift) => result | Math.round(((color >> shift) & 255) * (1 - amount) + ((next[shade] >> shift) & 255) * amount) << shift, 0));
}

function getPersonSkinRamp(pastel, amount) {
    const anchors = pastel ? [NPC_SKIN_TONES[8], [0xc0a478, 0xe8cfaa, 0xffecd2, 0x806746], NPC_SKIN_TONES[7], NPC_SKIN_TONES[6], NPC_SKIN_TONES[5], NPC_SKIN_TONES[8]] : [NPC_SKIN_TONES[4], NPC_SKIN_TONES[3], NPC_SKIN_TONES[2], NPC_SKIN_TONES[0], NPC_SKIN_TONES[1]];
    const value = Math.max(0, Math.min(1, amount)) * (anchors.length - 1), index = Math.min(anchors.length - 2, Math.floor(value));
    return samplePersonPalette(anchors, index, value - index);
}

function getGuideBlinkTexture(scene) {
    if (scene.textures.exists('guide-blink')) return;
    const source = getTerrainPixels(scene, 'guide');
    createCanvasTexture(scene, 'guide-blink', source.width, source.height, context => {
        const image = context.createImageData(source.width, source.height); image.data.set(source.data);
        for (const x of [6, 9]) writeRGBPixel(image.data, 6 * source.width + x, 0xb39777);
        context.putImageData(image, 0, 0);
    });
}

function updatePersonBlink(scene, sprite, look, direction, frame, time) {
    if (!sprite || sprite.visible === false || sprite === character && (startup || spawnReturn)) return;
    const blink = sprite.personBlinkState ||= {next: time + 1800 + Math.random() * 4200, until: 0, closed: false};
    if (time >= blink.next) {blink.until = time + 120; blink.next = time + 2200 + Math.random() * 4200;}
    blink.closed = time < blink.until;
    const base = sprite.texture.key.replace(/-blink$/, ''), key = base + (blink.closed ? '-blink' : '');
    if (sprite.texture.key === key) return;
    if (look) getPersonTexture(scene, key, look, direction, frame, blink.closed); else if (blink.closed) getGuideBlinkTexture(scene);
    sprite.setTexture(key);
    if (sprite === character) characterTextureKey = key;
}

function updateActorBlinks(scene, time) {
    updatePersonBlink(scene, character, PLAYER_LOOK, characterDirection, Number(character.texture.key.match(/walk([12])/)?.[1] || 0), time);
    updatePersonBlink(scene, guide, null, 'front', 0, time);
    for (const chunk of loadedChunks.values()) if (chunk.visible) for (const npc of chunk.npcs || []) if (npc.state !== 'home') updatePersonBlink(scene, npc.sprite, npc.look, npc.direction, npc.frame || 0, time);
}

function composePersonPixels(scene, look, direction, blink = false) {
    const [, face, shirt, , , accessory, top] = look;
    const palette = getPersonPalette(look);
    const column = direction === 'back' ? 0 : direction === 'front' ? 1 : 2;
    const mirror = direction === 'right';
    const colors = new Map();
    const assign = (sources, targets) => sources.forEach((source, index) => colors.set(source, targets[index]));
    assign(NPC_PART_COLORS.skin, palette.skin);
    assign(NPC_PART_COLORS.pants, [palette.pants[0], palette.pants[1]]);
    assign(NPC_PART_COLORS.shirt, palette.shirt);
    assign(NPC_PART_COLORS.shirtAccent, [palette.shirtAccent]); assign(NPC_PART_COLORS.pantsAccent, [palette.pantsAccent[1]]);
    assign(NPC_PART_COLORS.hair, palette.hair);
    assign(accessory ? NPC_PART_COLORS.accessory : NPC_PART_COLORS.hair, palette.top);
    const layers = [[face * 3 + column, 0], [9 + column, 2 + (look[11] ?? 0), 8], [6 + column, 1 + shirt], [(accessory ? 0 : 3) + column, 1 + top]];
    const sheet = getTerrainPixels(scene, 'character-parts');
    const pixels = new Array(NPC_PART_SIZE * NPC_PART_SIZE).fill(null);

    for (const [cellX, cellY, offsetY = 0] of layers) {
        for (let y = 0; y < NPC_PART_SIZE; y++) {
            for (let x = 0; x < NPC_PART_SIZE; x++) {
                const source = ((cellY * NPC_PART_SIZE + y) * sheet.width + cellX * NPC_PART_SIZE + (mirror ? NPC_PART_SIZE - 1 - x : x)) * 4;
                if (!sheet.data[source + 3]) continue;
                const sourceColor = (sheet.data[source] << 16) | (sheet.data[source + 1] << 8) | sheet.data[source + 2], color = cellY === 0 && sourceColor === 0x660000 && y >= 6 && y <= 7 ? blink ? palette.skin[1] : palette.eye : colors.get(sourceColor);
                if (color !== undefined && y + offsetY < NPC_PART_SIZE) pixels[(y + offsetY) * NPC_PART_SIZE + x] = color;
            }
        }
    }
    return look[8] && direction !== 'left' && direction !== 'right' ? mirrorPersonPixels(pixels) : pixels;
}

function mirrorPersonPixels(pixels) {
    return pixels.map((_, index) => pixels[index - index % NPC_PART_SIZE + NPC_PART_SIZE - 1 - index % NPC_PART_SIZE]);
}

function walkPersonPixels(pixels, direction, frame, palette) {
    const size = NPC_PART_SIZE;
    if (direction === 'right') return mirrorPersonPixels(walkPersonPixels(mirrorPersonPixels(pixels), 'left', frame, palette));

    const walked = pixels.slice();
    const get = (x, y) => x < 0 || y < 0 || x >= size || y >= size ? null : pixels[y * size + x];
    const set = (x, y, color) => {
        if (x >= 0 && y >= 0 && x < size && y < size) walked[y * size + x] = color;
    };
    const filledColumns = y => Array.from({ length: size }, (_, x) => x).filter(x => get(x, y) !== null);

    if (direction === 'left') {
        const step = frame === 1 ? 1 : -1;
        for (let y = PERSON_LEG_TOP; y < size; y++) {
            const columns = filledColumns(y);
            if (!columns.length) continue;
            for (const x of columns) set(x, y, null);
            for (const x of columns) set(x + step, y, get(x, y));
            set(step > 0 ? columns[0] + step - 1 : columns[columns.length - 1] + step + 1, y, palette.pants[0]);
        }
        const columns = filledColumns(PERSON_HAND_ROW);
        const hand = columns.filter(x => get(x, PERSON_HAND_ROW) !== palette.shirt[0]);
        for (const x of hand) set(x, PERSON_HAND_ROW, palette.shirt[0]);
        for (const x of hand) set(x - step, PERSON_HAND_ROW, get(x, PERSON_HAND_ROW));
        set(step > 0 ? columns[columns.length - 1] + 1 : columns[0] - 1, PERSON_HAND_ROW, palette.skin[0]);
        return walked;
    }

    const leftLeads = (direction === 'front') === (frame === 1);
    const [armUp, armDown, legUp] = leftLeads
        ? [PERSON_LEFT_ARM, PERSON_RIGHT_ARM, PERSON_LEFT_LEG]
        : [PERSON_RIGHT_ARM, PERSON_LEFT_ARM, PERSON_RIGHT_LEG];
    for (const x of armUp) for (let y = PERSON_ARM_TOP; y <= PERSON_ARM_BOTTOM; y++) set(x, y, get(x, y + 1));
    for (const x of armDown) for (let y = PERSON_ARM_BOTTOM + 1; y >= PERSON_FOREARM_TOP; y--) set(x, y, get(x, y - 1));
    for (const x of legUp) {
        const bottom = PERSON_INNER_LEG_COLUMNS.includes(x) ? PERSON_LEG_TOP + 1 : size;
        for (let y = PERSON_LEG_TOP; y < bottom; y++) set(x, y, get(x, y + 1));
    }
    return walked;
}

function getPersonTexture(scene, key, look, direction, frame = 0, blink = false) {
    if (scene.textures.exists(key)) return key;
    const standing = composePersonPixels(scene, look, direction, blink);
    const pixels = frame ? walkPersonPixels(standing, direction, frame, getPersonPalette(look)) : standing;

    createCanvasTexture(scene, key, NPC_PART_SIZE, NPC_PART_SIZE, context => {
        const image = context.createImageData(NPC_PART_SIZE, NPC_PART_SIZE);
        pixels.forEach((color, pixel) => color !== null && writeRGBPixel(image.data, pixel, color));
        context.putImageData(image, 0, 0);
    });
    return key;
}

function createPlayerTextures(scene) {
    for (const direction of ['front', 'back', 'left', 'right']) for (const blink of [false, true]) {
        for (const frame of [0, 1, 2]) getPersonTexture(scene, `character-${direction}${frame ? `walk${frame}` : ''}${blink ? '-blink' : ''}`, PLAYER_LOOK, direction, frame, blink);
    }
}

function getTileId(tileX, tileY) {
    return tileX * 67108864 + tileY;
}

function cacheWorldValue(cache, key, value) {
    if (cache.size >= WORLD_CACHE_LIMIT) {
        const keys = cache.keys();
        for (let index = 0; index < 512; index++) cache.delete(keys.next().value);
    }

    cache.set(key, value);
    return value;
}

function coordinateHash(x, y, seedHash) {
    let number = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seedHash;

    number ^= number >>> 13;

    number = Math.imul(number, 1274126177);

    return (((number ^ (number >>> 16)) >>> 0) / 4294967295);
}

function worldHash(x, y, salt = 0) {
    return coordinateHash(
        x,
        y,
        Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER)
    );
}

function smoothNoiseAmount(value) {
    return (value * value * (3 - 2 * value));
}

function valueNoise(worldX, worldY, scale, salt) {
    const scaledX = worldX / scale;
    const scaledY = worldY / scale;

    const left = Math.floor(scaledX);
    const top = Math.floor(scaledY), right = left + 1, bottom = top + 1;

    const horizontalAmount = smoothNoiseAmount(scaledX - left);
    const verticalAmount = smoothNoiseAmount(scaledY - top);

    const seedHash = Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER);
    const topLeft = coordinateHash(left, top, seedHash);
    const topRight = coordinateHash(right, top, seedHash);
    const bottomLeft = coordinateHash(left, bottom, seedHash);
    const bottomRight = coordinateHash(right, bottom, seedHash);

    const topValue = topLeft + (topRight - topLeft) * horizontalAmount;
    const bottomValue = bottomLeft + (bottomRight - bottomLeft) * horizontalAmount;

    return topValue + (bottomValue - topValue) * verticalAmount;
}

function fractalNoise(worldX, worldY, salt) {
    return(valueNoise(worldX, worldY, 48 * WORLD_FEATURE_SCALE, salt) * 0.55 +
        valueNoise(worldX + 83, worldY - 47, 24 * WORLD_FEATURE_SCALE, salt + 1) * 0.30 +
        valueNoise(worldX - 29, worldY + 101, 12 * WORLD_FEATURE_SCALE, salt + 2) * 0.15);
}

function createTileCache(createChunk) {
    const chunks = new Map();
    let lastKey = null;
    let lastChunk = null;

    return (tileX, tileY, generate) => {
        const chunkX = Math.floor(tileX / CHUNK_SIZE);
        const chunkY = Math.floor(tileY / CHUNK_SIZE);
        const key = getTileId(chunkX, chunkY);

        if (key !== lastKey) {
            lastChunk = chunks.get(key);

            if (!lastChunk) {
                if (chunks.size >= TILE_CACHE_CHUNK_LIMIT) chunks.delete(chunks.keys().next().value);
                lastChunk = createChunk();
                chunks.set(key, lastChunk);
            }

            lastKey = key;
        }

        return lastChunk[(tileY - chunkY * CHUNK_SIZE) * CHUNK_SIZE + tileX - chunkX * CHUNK_SIZE] ||= generate(tileX, tileY);
    };
}

const TERRAIN_TYPES = [null, 'grass', 'dirt', 'water'];
const terrainTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const worldTiles = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function getTerrainType(tileX, tileY) {
    return TERRAIN_TYPES[terrainTiles(tileX, tileY, generateTerrainCode)];
}

function generateTerrainCode(tileX, tileY) {
    const terrain = generateTerrainType(tileX, tileY);
    if (terrain === 'water' && isSmallPond(tileX, tileY)) return TERRAIN_TYPES.indexOf('dirt');
    const surround = terrain === 'dirt' ? 'grass' : terrain === 'grass' ? 'dirt' : null;
    return TERRAIN_TYPES.indexOf(surround && isThinTerrain(tileX, tileY, surround) ? surround : terrain);
}

function isSmallPond(tileX, tileY) {
    const seen = new Set([getTileId(tileX, tileY)]);
    const queue = [tileX, tileY];
    for (let index = 0; index < queue.length; index += 2) {
        for (const [offsetX, offsetY] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = queue[index] + offsetX, y = queue[index + 1] + offsetY, id = getTileId(x, y);
            if (seen.has(id) || generateTerrainType(x, y) !== 'water') continue;
            seen.add(id);
            if (seen.size >= MIN_POND_TILES) return false;
            queue.push(x, y);
        }
    }
    return true;
}

function isThinTerrain(tileX, tileY, surround) {
    const outside = (offsetX, offsetY) => generateTerrainType(tileX + offsetX, tileY + offsetY) === surround;
    return outside(-1, 0) && outside(1, 0) || outside(0, -1) && outside(0, 1);
}

function generateTerrainType(tileX, tileY) {
    if (Math.abs(tileX) <= 6 && Math.abs(tileY) <= 6) {
        return 'grass';
    }

    const warpScale = 64 * WORLD_FEATURE_SCALE;
    const warpStrength = 24 * WORLD_FEATURE_SCALE;
    const warpX = (valueNoise(tileX, tileY, warpScale, 10) - 0.5) * warpStrength;
    const warpY = (valueNoise(tileX + 200, tileY - 100, warpScale, 11) - 0.5) * warpStrength;
    const elevation = fractalNoise(tileX + warpX, tileY + warpY, 20);

    if (elevation < 0.3) {
        return 'water';
    }

    if (elevation < 0.38) return 'dirt';

    const dirtAmount = fractalNoise(tileX - 317, tileY + 191, 40);
    const localDirt = valueNoise(tileX, tileY, 4, 44);
    const dirtScore = dirtAmount + (localDirt - 0.5) * 0.14;

    return dirtScore > 0.63 ? 'dirt' : 'grass';
}

function isLandTile(tileX, tileY) {
    return getTerrainType(tileX, tileY) !== 'water';
}

function getTerrainTileKey(tileX, tileY, terrain = getTerrainType(tileX, tileY), north, south) {
    if (terrain === 'water') {
        north ??= getTerrainType(tileX, tileY - 1);
        return north === 'dirt' ? 'waterDirt' : north === 'grass' ? 'waterGrass' : 'water';
    }

    south ??= getTerrainType(tileX, tileY + 1);
    if (south === 'water') return terrain === 'dirt' ? 'dirtEdge' : 'grassEdge';
    if (terrain === 'dirt') return 'dirt1';
    if (worldHash(tileX, tileY, 670) <= 0.80) return 'grass1';
    if (valueNoise(tileX, tileY, 8, 671) <= 0.62) return 'grass2';

    return valueNoise(tileX + 149, tileY - 83, 24, 672) > 0.5 ? 'grass4' : 'grass3';
}

function getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy) {
    if (terrain === 'dirt' && horizontal === 'grass' && vertical === 'grass') {
        return 'corner';
    }

    if (terrain === 'grass' && horizontal === 'dirt' && vertical === 'dirt' && diagonal === 'dirt') {
        return 'dirtEdgeCorner';
    }

    if (terrain === 'water' && horizontal !== 'water' && vertical !== 'water' && diagonal !== 'water') {
        return dy < 0 ? 'dirtCliffCorner' : 'dirtEdgeCorner';
    }

    return null;
}

function getTerrainTile(tileX, tileY) {
    const terrain = getTerrainType(tileX, tileY);
    const north = getTerrainType(tileX, tileY - 1);
    const south = getTerrainType(tileX, tileY + 1);
    const west = getTerrainType(tileX - 1, tileY);
    const east = getTerrainType(tileX + 1, tileY);

    const tile = {
        key: getTerrainTileKey(tileX, tileY, terrain, north, south),
        rotation: 0
    };

    if (terrain === 'dirt' && south === 'water') {
        const left = west === 'water' ? 1
            : getTerrainType(tileX - 1, tileY + 1) !== 'water' ? 2 : 0;
        const right = east === 'water' ? 1
            : getTerrainType(tileX + 1, tileY + 1) !== 'water' ? 2 : 0;

        tile.textureKey = DIRT_CLIFF_TILES[left][right];

        if (left === 1 || right === 1) {
            tile.baseKey = 'water';
            tile.textureKey += '-trimmed';
        }
    }

    if (terrain === 'dirt' && north === 'water') {
        const left = west === 'water';
        const right = east === 'water';

        if (left || right) {
            const corner = left && right ? 'cornerDirt3'
                : left ? 'cornerDirt1' : 'cornerDirt2';

            tile.baseKey = 'water';
            tile.textureKey = south === 'water'
                ? `${tile.textureKey}-${corner}` : corner;
        }
    }

    if (terrain === 'water' && north !== 'water') {
        const left = west !== 'water' &&
            getTerrainType(tileX - 1, tileY - 1) !== 'water';
        const right = east !== 'water' &&
            getTerrainType(tileX + 1, tileY - 1) !== 'water';

        if (left || right) {
            const suffix = left && right ? 'InnerBoth'
                : left ? 'InnerLeft' : 'InnerRight';

            tile.textureKey = `${tile.key}${suffix}`;
        }
    }

    for (const [dx, dy] of TERRAIN_CORNER_OFFSETS) {
        const horizontal = dx < 0 ? west : east;
        const vertical = dy < 0 ? north : south;
        const dirtCorner = terrain === 'grass' && horizontal === 'dirt' && vertical === 'dirt';
        // Dirt corners ignore diagonals; other corners need both sides to differ from this tile.
        const diagonal = dirtCorner || terrain === 'water' && horizontal !== terrain && vertical !== terrain
            ? getTerrainType(tileX + dx, tileY + dy) : null;
        const patchKey = getTerrainCornerPatch(terrain, horizontal, vertical, diagonal, dy);

        if (!patchKey) continue;

        const size = patchKey === 'corner' ? 7 : 5;

        tile.patches ||= [];
        tile.patches.push({
            key: patchKey,
            x: dx < 0 ? 0 : TILE_SIZE - size,
            y: dy < 0 ? 0 : TILE_SIZE - size,
            size,
            flipX: dx > 0,
            flipY: dy > 0
        });
    }

    return tile;
}

function getWorldTile(tileX, tileY) {
    return worldTiles(tileX, tileY, generateWorldTile);
}

function getGroundTile(tileX, tileY) {
    const tile = getWorldTile(tileX, tileY);
    return tile.bridge ? getTerrainTile(tileX, tileY) : tile;
}

function generateWorldTile(tileX, tileY) {
    const tile = getBridgeTile(tileX, tileY) || getPierTile(tileX, tileY) || getTerrainTile(tileX, tileY);
    const name = tile.key.toLowerCase();

    tile.blocking = name.includes('water') ? 'full'
        : name.includes('edge') || name.includes('left') || name.includes('right') ? 'lower'
        : null;

    return tile;
}

const grassTints = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function stretchNoise(noise, contrast = 1.9) {
    return Phaser.Math.Clamp((noise - 0.5) * contrast + 0.5, 0, 1);
}

function getGrassBiome(tileX, tileY) {
    const noise = valueNoise(tileX, tileY, GRASS_BIOME_SCALE, 901) * 0.75 + valueNoise(tileX + 57, tileY - 31, GRASS_BIOME_SCALE / 3, 902) * 0.25;
    return stretchNoise(noise, GRASS_BIOME_CONTRAST);
}

function blendBiomeStops(stops, biome) {
    let index = 1;
    while (index < stops.length - 1 && stops[index][0] < biome) index++;
    const [fromAt, ...from] = stops[index - 1];
    const [toAt, ...to] = stops[index];
    const amount = Phaser.Math.Clamp((biome - fromAt) / (toAt - fromAt), 0, 1);
    return from.flat().map((value, channel) => value + (to.flat()[channel] - value) * amount);
}

function computeGrassTint(tileX, tileY) {
    return blendBiomeStops(GRASS_TINTS, getGrassBiome(tileX + 0.5, tileY + 0.5));
}

const dirtTints = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function computeDirtTint(tileX, tileY) {
    const noise = valueNoise(tileX + 0.5, tileY + 0.5, DIRT_BIOME_SCALE, 911) * 0.7 + valueNoise(tileX - 40.5, tileY + 23.5, DIRT_BIOME_SCALE / 3, 912) * 0.3;
    return blendBiomeStops(DIRT_TINTS, stretchNoise(noise));
}

function getDirtTint(tileX, tileY) {
    return dirtTints(tileX, tileY, computeDirtTint);
}

function getTintColor(tint, strength) {
    const scaled = tint.map(value => 1 + (value - 1) * strength);
    const max = Math.max(...scaled);
    return scaled.reduce((color, value, channel) => color | Math.round(255 * value / max) << (16 - channel * 8), 0);
}

function getWoodColors(scene) {
    if (scene.woodColors) return scene.woodColors;
    scene.woodColors = new Set();
    for (const key of ['wood', 'woodLeft', 'woodRight']) {
        const data = getTerrainPixels(scene, key).data;
        for (let index = 0; index < data.length; index += 4) if (data[index + 3]) scene.woodColors.add((data[index] << 16) | (data[index + 1] << 8) | data[index + 2]);
    }
    return scene.woodColors;
}

function getGrassTint(tileX, tileY) {
    return grassTints(tileX, tileY, computeGrassTint);
}

function tintGrassColor(color, tileX, tileY) {
    const tint = getGrassTint(tileX, tileY);
    return color.map((value, channel) => Math.min(255, Math.round(value * tint[channel])));
}

function getFlowerPatchColor(tileX, tileY) {
    const warpX = (valueNoise(tileX, tileY, FLOWER_PATCH_SCALE / 2, 921) - 0.5) * FLOWER_PATCH_SCALE;
    const warpY = (valueNoise(tileX, tileY, FLOWER_PATCH_SCALE / 2, 922) - 0.5) * FLOWER_PATCH_SCALE;
    const patch = coordinateHash(Math.floor((tileX + warpX) / FLOWER_PATCH_SCALE), Math.floor((tileY + warpY) / FLOWER_PATCH_SCALE), Math.imul(WORLD_SEED + 923, WORLD_HASH_MULTIPLIER));
    return FLOWER_PATCH_COLORS[Math.min(FLOWER_PATCH_COLORS.length - 1, Math.floor(patch * FLOWER_PATCH_COLORS.length))];
}

function tintChunkGrass(scene, context, originTileX, originTileY) {
    const woodColors = getWoodColors(scene);
    const image = context.getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    const data = image.data;
    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        let tint = null;
        let dirtTint = null;
        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            if (x % TILE_SIZE === 0) {
                tint = getGrassTint(originTileX + x / TILE_SIZE, originTileY + Math.floor(y / TILE_SIZE));
                dirtTint = getDirtTint(originTileX + x / TILE_SIZE, originTileY + Math.floor(y / TILE_SIZE));
            }
            const red = data[index], green = data[index + 1], blue = data[index + 2];
            if (!data[index + 3]) continue;
            const pixelColor = (red << 16) | (green << 8) | blue;
            if (FLOWER_COLORS.has(pixelColor)) continue;
            if (pixelColor === FLOWER_PATCH_SOURCE) {
                const color = getFlowerPatchColor(originTileX + Math.floor(x / TILE_SIZE), originTileY + Math.floor(y / TILE_SIZE));
                data[index] = Math.round(color[0]);
                data[index + 1] = Math.round(color[1]);
                data[index + 2] = Math.round(color[2]);
                continue;
            }
            const grass = green > red + 4 && green > blue + 8;
            if (!grass && (red <= green + 6 || green < blue || woodColors.has((red << 16) | (green << 8) | blue))) continue;
            const scale = grass ? tint : dirtTint;
            data[index] = Math.min(255, Math.round(red * scale[0]));
            data[index + 1] = Math.min(255, Math.round(green * scale[1]));
            data[index + 2] = Math.min(255, Math.round(blue * scale[2]));
        }
    }
    context.putImageData(image, 0, 0);
}

function waterBiomeHash(x, y) {
    const f = Math.fround, fract = value => f(value - Math.floor(value));
    let a = fract(f(x * 0.1031)), b = fract(f(y * 0.1031)), c = a;
    const dot = f(f(f(a * f(b + 33.33)) + f(b * f(c + 33.33))) + f(c * f(a + 33.33)));
    a = f(a + dot);
    b = f(b + dot);
    c = f(c + dot);
    return fract(f(f(a + b) * c));
}

function waterBiomeNoise(x, y) {
    const left = Math.floor(x), top = Math.floor(y);
    const amountX = smoothNoiseAmount(x - left), amountY = smoothNoiseAmount(y - top);
    const upper = waterBiomeHash(left, top) + (waterBiomeHash(left + 1, top) - waterBiomeHash(left, top)) * amountX;
    const lower = waterBiomeHash(left, top + 1) + (waterBiomeHash(left + 1, top + 1) - waterBiomeHash(left, top + 1)) * amountX;
    return upper + (lower - upper) * amountY;
}

function getWaterTint(worldX, worldY) {
    return blendWaterTints(getWaterBiomeAmount(worldX, worldY));
}

function getWaterBiomeAmount(worldX, worldY) {
    const [offsetX, offsetY] = WATER_BIOME_OFFSET;
    const noise = waterBiomeNoise(worldX / WATER_BIOME_SCALE + offsetX, worldY / WATER_BIOME_SCALE + offsetY) * 0.75 +
        waterBiomeNoise(worldX / (WATER_BIOME_SCALE / 3) + offsetX + 17, worldY / (WATER_BIOME_SCALE / 3) + offsetY + 9) * 0.25;
    return stretchNoise(noise);
}

function blendWaterTints(amount) {
    const [from, to, mix] = amount < 0.5 ? [WATER_TINTS[0], WATER_TINTS[1], amount * 2] : [WATER_TINTS[1], WATER_TINTS[2], amount * 2 - 1];
    return from.map((value, channel) => value + (to[channel] - value) * mix);
}

const bridgeCandidateCache = new Map();
const pierCandidateCache = new Map();

function isLocalHashPeak(tileX, tileY, stepX, stepY, radius, salt) {
    const seedHash = Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER);
    const score = coordinateHash(tileX, tileY, seedHash);
    if (score < 0.82) return false;

    for (let offset = -radius; offset <= radius; offset++) {
        if (offset !== 0 && coordinateHash(tileX + stepX * offset, tileY + stepY * offset, seedHash) >= score) return false;
    }

    return true;
}

function findWaterRun(tileX, tileY, stepX, stepY) {
    const isWater = offset => getTerrainType(tileX + stepX * offset, tileY + stepY * offset) === 'water';
    const origin = isWater(0) ? 0 : isWater(1) ? 1 : isWater(-1) ? -1 : null;

    if (origin === null) return null;

    let start = origin;
    let end = origin;

    while (end - start < MAX_BRIDGE_WATER_LENGTH && isWater(start - 1)) start--;
    while (end - start < MAX_BRIDGE_WATER_LENGTH && isWater(end + 1)) end++;

    const waterLength = end - start + 1;

    if (waterLength < MIN_BRIDGE_WATER_LENGTH || waterLength > MAX_BRIDGE_WATER_LENGTH) return null;

    return {
        startLandX: tileX + stepX * (start - 1),
        startLandY: tileY + stepY * (start - 1),
        waterLength
    };
}

function getBridgeCandidate(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const key = getTileId(tileX, tileY) * 2 + (salt === 811 ? 1 : 0);
    const cached = bridgeCandidateCache.get(key);

    return cached !== undefined
        ? cached
        : cacheWorldValue(bridgeCandidateCache, key, findBridge(tileX, tileY, stepX, stepY, widthX, widthY, salt));
}

function findBridge(tileX, tileY, stepX, stepY, widthX, widthY, salt) {
    const run = findWaterRun(tileX, tileY, stepX, stepY);
    if (!run) return null;

    const spanLength = run.waterLength + 2;
    const isWater = (distance, width) => getTerrainType(
        run.startLandX + stepX * distance + widthX * width,
        run.startLandY + stepY * distance + widthY * width
    ) === 'water';
    let crossesChannel = false;

    for (let distance = 0; distance < spanLength; distance++) {
        const middle = distance > 0 && distance < spanLength - 1;

        if (isWater(distance, 0) !== middle || isWater(distance, 1) !== middle) return null;
        crossesChannel ||= middle && isWater(distance, -1) && isWater(distance, 2);
    }

    if (!crossesChannel || !isLocalHashPeak(run.startLandX, run.startLandY, widthX, widthY, 4, salt)) return null;

    return { startX: run.startLandX, startY: run.startLandY, stepX, stepY, widthX, widthY, spanLength };
}

function isTileInBridge(tileX, tileY, bridge) {
    const offsetX = tileX - bridge.startX;
    const offsetY = tileY - bridge.startY;
    const distance = offsetX * bridge.stepX + offsetY * bridge.stepY;
    const width = offsetX * bridge.widthX + offsetY * bridge.widthY;

    return distance >= 0 && distance < bridge.spanLength &&
        (width === 0 || width === 1);
}

const BRIDGE_ORIENTATIONS = [
    { stepX: 0, stepY: 1, widthX: 1, widthY: 0, salt: 810, rotation: 0 },
    { stepX: 1, stepY: 0, widthX: 0, widthY: 1, salt: 811, rotation: Math.PI / 2 }
];

function getBridgeTile(tileX, tileY) {
    const onWater = getTerrainType(tileX, tileY) === 'water';

    for (const { stepX, stepY, widthX, widthY, salt, rotation } of BRIDGE_ORIENTATIONS) {
        if (
            !onWater &&
            getTerrainType(tileX - stepX, tileY - stepY) !== 'water' &&
            getTerrainType(tileX + stepX, tileY + stepY) !== 'water'
        ) {
            continue;
        }

        for (let offset = -1; offset <= 0; offset++) {
            const bridge = getBridgeCandidate(tileX + widthX * offset, tileY + widthY * offset, stepX, stepY, widthX, widthY, salt);

            if (bridge && isTileInBridge(tileX, tileY, bridge)) {
                if (bridge.widthY && onWater && tileY - bridge.startY === 1) return { key: 'woodLip', rotation: 0, bridge: true, baseKey: 'water' };
                return { key: 'wood', rotation, bridge: true };
            }
        }
    }

    return null;
}

function getPierCandidate(anchorX, anchorY) {
    const key = getTileId(anchorX, anchorY);
    const cached = pierCandidateCache.get(key);

    return cached !== undefined ? cached : cacheWorldValue(pierCandidateCache, key, findPier(anchorX, anchorY));
}

function findPier(anchorX, anchorY) {
    const isWater = (x, y) => getTerrainType(anchorX + x, anchorY + y) === 'water';

    if (isWater(0, 0) || isWater(1, 0) || !isLocalHashPeak(anchorX, anchorY, 1, 0, 5, 920)) return null;

    const lengthRange = MAX_PIER_WATER_LENGTH - MIN_PIER_WATER_LENGTH + 1;
    const waterLength = MIN_PIER_WATER_LENGTH + Math.floor(worldHash(anchorX, anchorY, 921) * lengthRange);
    // At least 15 of the 18 tiles beyond the deck must be water.
    let dryTiles = 0;

    for (let distance = 1; distance <= waterLength + 2; distance++) {
        if (!isWater(0, distance) || !isWater(1, distance)) return null;
    }

    for (let y = waterLength; y <= waterLength + 2; y++) {
        for (let x = -2; x <= 3; x++) {
            if (!isWater(x, y) && ++dryTiles > 3) return null;
        }
    }

    return { anchorX, anchorY, waterLength };
}

function getPierTile(tileX, tileY) {
    if (getTerrainType(tileX, tileY) !== 'water' && getTerrainType(tileX, tileY + 1) !== 'water') return null;

    for (let distance = 0; distance <= MAX_PIER_WATER_LENGTH; distance++) {
        for (let side = 0; side <= 1; side++) {
            const pier = getPierCandidate(tileX - side, tileY - distance);
            if (!pier || distance > pier.waterLength) continue;

            return distance === pier.waterLength
                ? { key: side === 0 ? 'woodLeft' : 'woodRight', rotation: 0, baseKey: 'water' }
                : { key: 'wood', rotation: 0 };
        }
    }

    return null;
}

const EMPTY_TILE_PATCHES = Object.freeze([]);

function getChunkKey(chunkX, chunkY) {
    return getTileId(chunkX, chunkY);
}

function isTileDiscovered(tileX, tileY) {
    return discoveredChunks.has(getTileId(
        Math.floor(tileX / CHUNK_SIZE),
        Math.floor(tileY / CHUNK_SIZE)
    ));
}

function getTextureSource(scene, key) {
    let source = scene.textureSourceCache.get(key);

    if (!source) {
        source = scene.textures.get(key).getSourceImage();
        scene.textureSourceCache.set(key, source);
    }

    return source;
}

function getTerrainPixels(scene, key) {
    const cached = scene.terrainPixelCache.get(key);
    if (cached) return cached;

    const source = getTextureSource(scene, key);
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    scene.terrainPixelCache.set(key, pixels);
    return pixels;
}

function getTerrainSurface(scene, tile) {
    if (tile.surface) return tile.surface;

    const patches = tile.patches || EMPTY_TILE_PATCHES;
    const patchSignature = patches.length
        ? patches.map(patch => `${patch.key},${patch.x},${patch.y},${patch.flipX},${patch.flipY}`).join(';')
        : '';
    const signature = `${tile.key}|${tile.textureKey}|${tile.baseKey}|${tile.rotation}|${patchSignature}`;
    const cached = scene.terrainSurfaceCache.get(signature);

    if (cached) {
        tile.surface = cached;
        return tile.surface;
    }

    const isWater = tile.key.startsWith('water');
    const isWood = tile.key.startsWith('wood');
    const land = new Uint8Array(TILE_SIZE * TILE_SIZE);
    const water = new Uint8Array(TILE_SIZE * TILE_SIZE);

    if (isWater) {
        water.fill(1);
    } else {
        const pixels = getTerrainPixels(scene, tile.textureKey || tile.key);
        for (let index = 0; index < land.length; index++) {
            const opaque = pixels.data[index * 4 + 3] > 0;
            land[index] = !isWood && opaque ? 1 : 0;
            water[index] = tile.baseKey === 'water' && !opaque ? 1 : 0;
        }
    }

    for (const patch of patches) {
        const pixels = getTerrainPixels(scene, patch.key);

        for (let y = 0; y < pixels.height; y++) {
            const sourceY = patch.flipY ? pixels.height - 1 - y : y;
            const sourceRow = sourceY * pixels.width;
            const targetRow = (patch.y + y) * TILE_SIZE + patch.x;
            for (let x = 0; x < pixels.width; x++) {
                const sourceX = patch.flipX ? pixels.width - 1 - x : x;
                if (!pixels.data[(sourceRow + sourceX) * 4 + 3]) continue;

                const index = targetRow + x;
                land[index] = 1;
                water[index] = 0;
            }
        }
    }

    const surface = { id: scene.terrainSurfaceCache.size, land, water };
    scene.terrainSurfaceCache.set(signature, surface);
    tile.surface = surface;
    return surface;
}

function getSurfaceWaterRows(surface) {
    if (surface.waterRows) return surface.waterRows;

    const rows = new Uint16Array(TILE_SIZE);
    for (let y = 0; y < TILE_SIZE; y++) {
        const row = y * TILE_SIZE;
        let bits = 0;
        for (let x = 0; x < TILE_SIZE; x++) {
            if (surface.water[row + x]) bits |= 1 << x;
        }
        rows[y] = bits;
    }

    surface.waterRows = rows;
    return rows;
}

function getTileMaskRuns(mask, mergeRows = false) {
    const cells = [];
    const previous = mergeRows ? [] : null;

    for (let y = 0; y < TILE_SIZE; y++) {
        const row = y * TILE_SIZE;
        let x = 0;

        while (x < TILE_SIZE) {
            if (!mask[row + x]) {
                x++;
                continue;
            }

            const start = x;
            while (x < TILE_SIZE && mask[row + x]) x++;
            const key = start * (TILE_SIZE + 1) + x - start;
            const above = previous?.[key];

            if (mergeRows && above && above.y + above.height === y) {
                above.height++;
            } else {
                const cell = { x: start, y, width: x - start, height: 1 };
                cells.push(cell);
                if (previous) previous[key] = cell;
            }
        }
    }

    return cells;
}

function getShorelineTile(scene, tile, northTile) {
    const surface = getTerrainSurface(scene, tile);
    const north = getTerrainSurface(scene, northTile);
    const signature = surface.id * 65536 + north.id;
    const cached = scene.shorelineTileCache.get(signature);
    if (cached) return cached;

    const textureKey = `shoreline-${scene.shorelineTileCache.size}`;
    const texture = scene.textures.createCanvas(textureKey, TILE_SIZE, TILE_SIZE);
    const context = texture.getContext();
    const image = context.createImageData(TILE_SIZE, TILE_SIZE);
    const base = getTerrainPixels(scene, 'water');
    const waterTile = tile.key.startsWith('water') && tile.key !== 'water';
    const shadowKey = waterTile ? tile.textureKey || tile.key
        : tile.key.startsWith('grass') || northTile.key.includes('Grass') ||
            northTile.key.startsWith('grass') ? 'waterGrass' : 'waterDirt';
    const shadow = getTerrainPixels(scene, shadowKey);
    const edges = new Uint8Array(TILE_SIZE * TILE_SIZE);

    for (let x = 0; x < TILE_SIZE; x++) {
        let distance = TILE_SIZE;

        for (let y = TILE_SIZE - 1; y >= 0; y--) {
            if (north.land[y * TILE_SIZE + x]) {
                distance = TILE_SIZE - 2 - y;
                break;
            }
        }

        let shadowOffset = 0;
        if (waterTile) {
            while (shadowOffset < TILE_SIZE &&
                surface.land[shadowOffset * TILE_SIZE + x]) {
                shadowOffset++;
            }
        }

        for (let y = 0; y < TILE_SIZE; y++) {
            const index = y * TILE_SIZE + x;

            if (surface.land[index]) {
                distance = -1;
                continue;
            }

            distance++;
            if (!surface.water[index]) continue;

            const shadowY = distance + shadowOffset;
            const shaded = shadowY < TILE_SIZE;
            const source = shaded ? shadow.data : base.data;
            const sourceIndex = ((shaded ? shadowY : y) * TILE_SIZE + x) * 4;
            const targetIndex = index * 4;
            image.data[targetIndex] = source[sourceIndex];
            image.data[targetIndex + 1] = source[sourceIndex + 1];
            image.data[targetIndex + 2] = source[sourceIndex + 2];
            image.data[targetIndex + 3] = source[sourceIndex + 3];
            edges[index] = distance === 0 ? 1 : 0;
        }
    }

    context.putImageData(image, 0, 0);
    texture.refresh();
    scene.terrainPixelCache.set(textureKey, image);

    const shoreline = {
        textureKey,
        waterCells: getTileMaskRuns(surface.water, true),
        edgeCells: getTileMaskRuns(edges)
    };
    scene.shorelineTileCache.set(signature, shoreline);
    return shoreline;
}

function gatherNearbyWoodTiles(chunkX, chunkY, woodTiles) {
    const originX = chunkX * CHUNK_SIZE;
    const originY = chunkY * CHUNK_SIZE;
    for (let localY = -1; localY <= CHUNK_SIZE; localY++) {
        const edgeRow = localY === -1 || localY === CHUNK_SIZE;
        const tileY = originY + localY;

        for (let localX = -1; localX <= CHUNK_SIZE; localX += edgeRow ? 1 : CHUNK_SIZE + 1) {
            const tile = getWorldTile(originX + localX, tileY);
            if (tile.key.startsWith('wood')) woodTiles.push(localX, localY, tile);
        }
    }

    return woodTiles;
}

let woodMaskScratch;

function getChunkWoodMask(scene, tiles) {
    if (tiles.length === 0) return null;

    woodMaskScratch ||= new Uint8Array(WOOD_MASK_SIZE * WOOD_MASK_SIZE);
    const mask = woodMaskScratch;
    mask.fill(0);

    for (let index = 0; index < tiles.length; index += 3) {
        if (tiles[index] === CHUNK_SIZE || tiles[index + 1] === CHUNK_SIZE) continue;

        const tile = tiles[index + 2];
        const deck = getDeckBounds(scene, tile.key);
        const rotated = Boolean(tile.rotation);
        const left = rotated ? TILE_SIZE - deck.bottom : deck.left;
        const right = rotated ? TILE_SIZE - deck.top : deck.right;
        const top = rotated ? deck.left : deck.top;
        const bottom = rotated ? deck.right : deck.bottom;
        const originX = tiles[index] * TILE_SIZE + WOOD_MASK_MARGIN;
        const originY = tiles[index + 1] * TILE_SIZE + WOOD_MASK_MARGIN;

        for (let y = top - 1; y <= bottom; y++) {
            const row = (originY + y) * WOOD_MASK_SIZE + originX;
            for (let x = left - 1; x <= right; x++) {
                const core = x >= left && x < right && y >= top && y < bottom;
                if (core || ((x + y) & 1) === 0) mask[row + x] = 1;
            }
        }
    }

    return mask;
}

function getDeckBounds(scene, key) {
    scene.deckBoundsCache ||= new Map();

    const cached = scene.deckBoundsCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const bounds = { left: TILE_SIZE, right: 0, top: TILE_SIZE, bottom: 0 };

    for (let y = 0; y < TILE_SIZE; y++) {
        let opaque = 0;
        let rowLeft = TILE_SIZE;
        let rowRight = 0;
        const row = y * TILE_SIZE * 4 + 3;

        for (let x = 0; x < TILE_SIZE; x++) {
            if (!pixels[row + x * 4]) continue;

            opaque++;
            rowLeft = Math.min(rowLeft, x);
            rowRight = x + 1;
        }

        if (opaque * 2 < TILE_SIZE) continue;

        bounds.top = Math.min(bounds.top, y);
        bounds.bottom = y + 1;
        bounds.left = Math.min(bounds.left, rowLeft);
        bounds.right = Math.max(bounds.right, rowRight);
    }

    scene.deckBoundsCache.set(key, bounds);
    return bounds;
}

function getShoreDistances(scene, chunkX, chunkY) {
    const margin = SHORE_DISTANCE_MARGIN_TILES * TILE_SIZE;
    const size = CHUNK_PIXEL_SIZE + margin * 2;
    const stride = size + 2;
    const originTileX = chunkX * CHUNK_SIZE;
    const originTileY = chunkY * CHUNK_SIZE;

    if (!scene.shoreDistanceScratch) {
        scene.shoreDistanceScratch = new Uint16Array(stride * stride);
        scene.shoreDistanceScratch.fill(65535);
    }

    const distances = scene.shoreDistanceScratch;

    for (let localY = -SHORE_DISTANCE_MARGIN_TILES; localY < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localY++) {
        const tileY = originTileY + localY;
        const originY = localY * TILE_SIZE + margin + 1;
        for (let localX = -SHORE_DISTANCE_MARGIN_TILES; localX < CHUNK_SIZE + SHORE_DISTANCE_MARGIN_TILES; localX++) {
            const tileX = originTileX + localX;
            let tile = getWorldTile(tileX, tileY);

            if (tile.key.startsWith('wood')) {
                tile = getTerrainTile(tileX, tileY);
            }

            const water = getTerrainSurface(scene, tile).water;
            const originX = localX * TILE_SIZE + margin + 1;

            for (let y = 0; y < TILE_SIZE; y++) {
                const row = (originY + y) * stride + originX;
                const sourceRow = y * TILE_SIZE;

                for (let x = 0; x < TILE_SIZE; x++) {
                    distances[row + x] = water[sourceRow + x] ? 65535 : 0;
                }
            }
        }
    }

    for (let direction = 1; direction >= -1; direction -= 2) {
        const back = direction * stride;

        for (let step = 0; step < size; step++) {
            const y = direction > 0 ? step : size - 1 - step;
            const row = (y + 1) * stride + (direction > 0 ? 1 : size);

            for (let column = 0, index = row; column < size; column++, index += direction) {
                const value = distances[index];
                if (value === 0) continue;
                const previousRow = index - back;

                distances[index] = Math.min(
                    value,
                    distances[index - direction] + 3,
                    distances[previousRow] + 3,
                    distances[previousRow - 1] + 4,
                    distances[previousRow + 1] + 4
                );
            }
        }
    }

    const result = new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        const row = (y + margin + 1) * stride + margin + 1;
        const resultRow = y * CHUNK_PIXEL_SIZE;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            result[resultRow + x] = Math.min(SHORE_DISTANCE_MAX, Math.round(distances[row + x] / 3));
        }
    }

    return result;
}

function createStaticShadowCaster(x, y, points) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    for (let point = 0; point < points.length; point += 2) {
        left = Math.min(left, points[point]);
        right = Math.max(right, points[point]);
        top = Math.min(top, points[point + 1]);
        bottom = Math.max(bottom, points[point + 1]);
    }

    return {
        x, y, points,
        left: x + left,
        right: x + right + 1,
        top: y + top,
        bottom: y + bottom + 1
    };
}

function forEachStaticShadowPoint(chunkX, chunkY, callback) {
    const minTileX = chunkX * CHUNK_SIZE - 3;
    const minTileY = chunkY * CHUNK_SIZE - 1;
    const maxTileX = (chunkX + 1) * CHUNK_SIZE;
    const maxTileY = (chunkY + 1) * CHUNK_SIZE + 1;
    const left = chunkX * CHUNK_PIXEL_SIZE;
    const top = chunkY * CHUNK_PIXEL_SIZE;
    const right = left + CHUNK_PIXEL_SIZE;
    const bottom = top + CHUNK_PIXEL_SIZE;

    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
        for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type || type === 'tree') continue;

            const sprite = getPropSprite(tileX, tileY);

            for (let point = 0; point < sprite.shadow.length; point += 2) {
                callback(sprite.x + sprite.shadow[point], sprite.y + sprite.shadow[point + 1]);
            }
        }
    }

    for (const caster of staticShadowCasters) {
        if (caster.right <= left || caster.left >= right || caster.bottom <= top || caster.top >= bottom) continue;
        for (let point = 0; point < caster.points.length; point += 2) {
            callback(caster.x + caster.points[point], caster.y + caster.points[point + 1]);
        }
    }
}

function getStaticShadowMask(chunkX, chunkY) {
    const originX = chunkX * CHUNK_PIXEL_SIZE;
    const originY = chunkY * CHUNK_PIXEL_SIZE;
    let mask = null;

    forEachStaticShadowPoint(chunkX, chunkY, (x, y) => {
        const localX = x - originX;
        const localY = y - originY;

        if (localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE) return;

        mask ||= new Uint8Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE);
        mask[localY * CHUNK_PIXEL_SIZE + localX] = 1;
    });

    return mask;
}

function isFlatShadowTile(tile) {
    return !tile.patches && tile.key.startsWith('grass');
}

let detailedShadowScratch;

function bakeGroundShadows(scene, context, chunkX, chunkY, mask) {
    let minX = CHUNK_PIXEL_SIZE;
    let minY = CHUNK_PIXEL_SIZE;
    let maxX = -1;
    let maxY = -1;
    detailedShadowScratch ||= new Uint32Array(mask.length);
    const detailed = detailedShadowScratch;
    let detailedCount = 0;
    let activeStyle = null;
    const tileOriginX = chunkX * CHUNK_SIZE;
    const tileOriginY = chunkY * CHUNK_SIZE;

    const fillRun = (style, x, y, width) => {
        if (style !== activeStyle) {
            context.fillStyle = style;
            activeStyle = style;
        }

        context.fillRect(x, y, width, 1);
    };

    for (let localY = 0; localY < CHUNK_PIXEL_SIZE; localY++) {
        const tileY = tileOriginY + Math.floor(localY / TILE_SIZE);
        const surfaceRow = (localY % TILE_SIZE) * TILE_SIZE;
        const pixelRow = localY * CHUNK_PIXEL_SIZE;
        let runStart = -1;
        let runColor = null;
        let column = -1;
        let water = null;
        let flatStyle = null;

        for (let localX = 0; localX < CHUNK_PIXEL_SIZE; localX++) {
            const pixel = pixelRow + localX;
            let color = null;

            if (mask[pixel]) {
                if (column !== Math.floor(localX / TILE_SIZE)) {
                    column = Math.floor(localX / TILE_SIZE);
                    const tile = getWorldTile(tileOriginX + column, tileY);
                    water = getTerrainSurface(scene, tile).water;
                    flatStyle = isFlatShadowTile(tile) ? getShadowStyle(scene, tile.key) : null;
                }

                if (!water[surfaceRow + localX % TILE_SIZE]) {
                    if (flatStyle) {
                        color = flatStyle;
                    } else {
                        detailed[detailedCount++] = pixel;
                        minX = Math.min(minX, localX);
                        minY = Math.min(minY, localY);
                        maxX = Math.max(maxX, localX);
                        maxY = Math.max(maxY, localY);
                    }
                }
            }

            if (color !== runColor || !color) {
                if (runStart !== -1) {
                    fillRun(runColor, runStart, localY, localX - runStart);
                    runStart = -1;
                    runColor = null;
                }
                if (color) {
                    runStart = localX;
                    runColor = color;
                }
            }
        }

        if (runStart !== -1) {
            fillRun(runColor, runStart, localY, CHUNK_PIXEL_SIZE - runStart);
        }
    }

    if (detailedCount === 0) {
        return;
    }

    const width = maxX - minX + 1;
    const image = context.getImageData(minX, minY, width, maxY - minY + 1);

    for (let detail = 0; detail < detailedCount; detail++) {
        const pixel = detailed[detail];
        const index = ((Math.floor(pixel / CHUNK_PIXEL_SIZE) - minY) * width + pixel % CHUNK_PIXEL_SIZE - minX) * 4;
        if (!image.data[index + 3]) continue;

        const shaded = shadeColor(image.data[index], image.data[index + 1], image.data[index + 2]);
        image.data[index] = shaded[0];
        image.data[index + 1] = shaded[1];
        image.data[index + 2] = shaded[2];
    }

    context.putImageData(image, minX, minY);
}

function getWaterMaskBase(scene) {
    if (scene.waterMaskBase) return scene.waterMaskBase;

    const pattern = getTerrainPixels(scene, 'waterOverlay');
    const base = new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4);

    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        const patternRow = (y % pattern.height) * pattern.width * 4 + 3;
        let index = y * CHUNK_PIXEL_SIZE * 4;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
            const alpha = pattern.data[patternRow + (x % pattern.width) * 4];
            base[index + 1] = alpha > 192 ? 2 : alpha > 64 ? 1 : 0;
            base[index + 3] = 255;
        }
    }

    scene.waterMaskBase = base;
    return base;
}

function markWaterCells(data, cells, pixelX, pixelY) {
    for (let cell = 0; cell < cells.length; cell += 4) {
        const localX = cells[cell] - pixelX;
        const localY = cells[cell + 1] - pixelY;
        const width = cells[cell + 2];
        const height = cells[cell + 3];
        const bottom = localY + height;

        for (let y = localY; y < bottom; y++) {
            let index = (y * CHUNK_PIXEL_SIZE + localX) * 4;
            for (let x = 0; x < width; x++, index += 4) data[index] = 255;
        }
    }
}

function shadeWaterDepth(data, shoreDistances, shadowMask) {
    for (let pixel = 0, index = 0; pixel < shoreDistances.length; pixel++, index += 4) {
        if (!data[index]) continue;

        data[index + 1] += shoreDistances[pixel] * 3;
        if (shadowMask?.[pixel]) data[index] = 128;
    }
}

function shadeWaterShorelines(scene, data, shorelineTiles) {
    const [waterRed, waterGreen, waterBlue] = WATER_BASE_COLOR;
    for (let tile = 0; tile < shorelineTiles.length; tile += 3) {
        const art = getTerrainPixels(scene, shorelineTiles[tile + 2]).data;
        const originX = shorelineTiles[tile] * TILE_SIZE;
        const originY = shorelineTiles[tile + 1] * TILE_SIZE;

        for (let y = 0; y < TILE_SIZE; y++) {
            let source = y * TILE_SIZE * 4;
            let target = ((originY + y) * CHUNK_PIXEL_SIZE + originX) * 4;

            for (let x = 0; x < TILE_SIZE; x++, source += 4, target += 4) {
                if (!data[target] || !art[source + 3]) continue;
                const baseWater = art[source] === waterRed && art[source + 1] === waterGreen &&
                    art[source + 2] === waterBlue;

                if (!baseWater) data[target] = 128, data[target + 2] = 1 + (art[source + 2] & 3);
            }
        }
    }
}

function shadeWaterBanks(scene, data, pixelX, pixelY) {
    for (let y = CHUNK_PIXEL_SIZE - 1; y >= 0; y--) {
        for (let x = CHUNK_PIXEL_SIZE - 1; x >= 0; x--) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            if (data[index] !== 255) continue;
            for (const [offsetX, offsetY] of WATER_BANK_OFFSETS) {
                const nextX = x + offsetX, nextY = y + offsetY;
                const land = nextX >= 0 && nextY >= 0 ? !data[(nextY * CHUNK_PIXEL_SIZE + nextX) * 4] : !isWaterPixel(scene, pixelX + nextX, pixelY + nextY);
                if (land) {
                    data[index] = 128;
                    break;
                }
            }
        }
    }
}

function shadeWaterWood(data, woodMask) {
    const maskOffset = WOOD_MASK_MARGIN - WOOD_SHADOW_OFFSET;
    for (let y = 0; woodMask && y < CHUNK_PIXEL_SIZE; y++) {
        const maskRow = (y + maskOffset) * WOOD_MASK_SIZE + maskOffset;
        let index = y * CHUNK_PIXEL_SIZE * 4;

        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++, index += 4) {
            if (woodMask[maskRow + x] && woodMask[maskRow + x - 1] && woodMask[maskRow + x - WOOD_MASK_SIZE] && data[index]) data[index] = 128, data[index + 2] = 5;
        }
    }
}

function markWaterEdges(data, edgeCells, pixelX, pixelY) {
    for (let cell = 0; cell < edgeCells.length; cell += 3) {
        let index = ((edgeCells[cell + 1] - pixelY) * CHUNK_PIXEL_SIZE + edgeCells[cell] - pixelX) * 4 + 2;
        for (let x = 0; x < edgeCells[cell + 2]; x++, index += 4) data[index] = 255;
    }
}

function markWaterFoam(scene, data, pixelX, pixelY) {
    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            if (!data[index]) continue;
            for (const [offsetX, offsetY] of WATER_FOAM_OFFSETS) {
                const nextX = x + offsetX, nextY = y + offsetY;
                const inside = nextX >= 0 && nextY >= 0 && nextX < CHUNK_PIXEL_SIZE && nextY < CHUNK_PIXEL_SIZE;
                if ((inside ? !data[(nextY * CHUNK_PIXEL_SIZE + nextX) * 4] : !isWaterPixel(scene, pixelX + nextX, pixelY + nextY)) &&
                    !getWorldTile(Math.floor((pixelX + nextX) / TILE_SIZE), Math.floor((pixelY + nextY) / TILE_SIZE)).key.startsWith('wood')) {
                    data[index + 2] = 255;
                    break;
                }
            }
        }
    }
}

function shadeWaterUndersides(scene, data, pixelX, pixelY) {
    for (let y = 0; y < CHUNK_PIXEL_SIZE; y++) {
        for (let x = 0; x < CHUNK_PIXEL_SIZE; x++) {
            const index = (y * CHUNK_PIXEL_SIZE + x) * 4;
            if (!data[index]) continue;
            const land = y + 1 < CHUNK_PIXEL_SIZE ? !data[index + CHUNK_PIXEL_SIZE * 4] : !isWaterPixel(scene, pixelX + x, pixelY + y + 1);
            if (!land || getWorldTile(Math.floor((pixelX + x) / TILE_SIZE), Math.floor((pixelY + y + 1) / TILE_SIZE)).key.startsWith('wood')) continue;
            data[index] = 128;
            data[index + 2] = 0;
        }
    }
}

function buildChunkWater(scene, chunk) {
    const { chunkX, chunkY, shadowMask } = chunk;
    const { waterMaskCells, edgeCells, woodTiles, shorelineTiles } = chunk.waterBuild;
    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;

    chunk.waterBuild = null;

    const waterTexture = acquireChunkCanvas(scene);
    const context = waterTexture.getContext();
    scene.waterChunkImage ||= context.createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    const image = scene.waterChunkImage;
    const data = image.data;

    data.set(getWaterMaskBase(scene));
    markWaterCells(data, waterMaskCells, pixelX, pixelY);

    const shoreDistances = getShoreDistances(scene, chunkX, chunkY);
    chunk.shoreDistances = shoreDistances;
    chunk.fish = [];
    spawnChunkFish(chunk);

    shadeWaterDepth(data, shoreDistances, shadowMask);
    shadeWaterShorelines(scene, data, shorelineTiles);
    shadeWaterBanks(scene, data, pixelX, pixelY);
    const woodMask = getChunkWoodMask(scene, gatherNearbyWoodTiles(chunkX, chunkY, woodTiles));
    shadeWaterWood(data, woodMask);
    bakeChestSilhouette(chunk, data);
    markWaterEdges(data, edgeCells, pixelX, pixelY);
    markWaterFoam(scene, data, pixelX, pixelY);
    shadeWaterUndersides(scene, data, pixelX, pixelY);

    context.putImageData(image, 0, 0);
    chunk.waterShadowBase = new Uint8ClampedArray(data);
    waterTexture.refresh();

    chunk.waterTexture = waterTexture;
    chunk.overlay = scene.add.image(pixelX, pixelY, waterTexture.key)
        .setOrigin(0)
        .setDepth(1)
        .setVisible(chunk.visible)
        .setPipeline('WaterWarp');
    loadedWaterChunks.add(chunk);
}

function createChunkCanvas(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = CHUNK_PIXEL_SIZE;
    canvas.height = CHUNK_PIXEL_SIZE;
    canvas.getContext('2d', { willReadFrequently: true });

    return scene.textures.addCanvas(`chunk-canvas-${chunkCanvasCount++}`, canvas);
}

function acquireChunkCanvas(scene) {
    const texture = chunkCanvasPool.pop() || createChunkCanvas(scene);
    const context = texture.getContext();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
    context.imageSmoothingEnabled = false;

    return texture;
}

function drawChunkTexture(context, scene, key, x, y, rotation = 0, flipX = false, flipY = false) {
    const source = getTextureSource(scene, key);
    const { width, height } = source;

    if (rotation) {
        const cos = Math.round(Math.cos(rotation));
        const sin = Math.round(Math.sin(rotation));

        context.setTransform(cos, sin, -sin, cos, x + width / 2, y + height / 2);
        context.drawImage(source, -width / 2, -height / 2);
    } else if (flipX || flipY) {
        context.setTransform(flipX ? -1 : 1, 0, 0, flipY ? -1 : 1, flipX ? x + width : x, flipY ? y + height : y);
        context.drawImage(source, 0, 0);
    } else {
        context.drawImage(source, x, y);
        return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
}

function createChunkLayer(scene, texture, x, y, depth) {
    texture.refresh();
    return scene.add.image(x, y, texture.key).setOrigin(0).setDepth(depth);
}

function createWorldChunk(scene, chunkX, chunkY, deferWater = false) {
    const key = getChunkKey(chunkX, chunkY);

    if (loadedChunks.has(key)) {
        return;
    }

    const pixelX = chunkX * CHUNK_PIXEL_SIZE;
    const pixelY = chunkY * CHUNK_PIXEL_SIZE;
    const originTileX = chunkX * CHUNK_SIZE;
    const originTileY = chunkY * CHUNK_SIZE;

    const tileSprites = [];
    const waterCells = [];
    const waterMaskCells = [];
    const edgeCells = [];
    const woodTiles = [];
    const bushes = [];
    const trees = [];
    const shorelineTiles = [];
    const groundTexture = acquireChunkCanvas(scene);
    const groundContext = groundTexture.getContext();
    let upperTexture = null;
    let upperContext = null;

    const getUpperContext = () => {
        if (!upperContext) {
            upperTexture = acquireChunkCanvas(scene);
            upperContext = upperTexture.getContext();
        }

        return upperContext;
    };

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        const tileY = originTileY + localY;
        const drawY = localY * TILE_SIZE;
        const baseY = (tileY + 1) * TILE_SIZE;
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
            const tileX = originTileX + localX;

            const worldTile = getWorldTile(tileX, tileY);
            const terrainTile = getGroundTile(tileX, tileY);
            const tileKey = terrainTile.key;
            const isWater = tileKey.startsWith('water');
            const drawX = localX * TILE_SIZE;
            let shoreline = null;

            if (isWater || terrainTile.baseKey === 'water') {
                const northTile = getGroundTile(tileX, tileY - 1);
                shoreline = getShorelineTile(scene, terrainTile, northTile);
                shorelineTiles.push(localX, localY, shoreline.textureKey);
            }

            if (terrainTile.baseKey) {
                drawChunkTexture(groundContext, scene, shoreline ? shoreline.textureKey : terrainTile.baseKey, drawX, drawY);
            }

            drawChunkTexture(
                terrainTile.baseKey === 'water' || tileKey.startsWith('wood') ? getUpperContext() : groundContext,
                scene,
                isWater ? shoreline.textureKey : terrainTile.textureKey || tileKey,
                drawX,
                drawY,
                terrainTile.rotation
            );

            for (const patch of terrainTile.patches || EMPTY_TILE_PATCHES) {
                drawChunkTexture(getUpperContext(), scene, patch.key, drawX + patch.x, drawY + patch.y, 0, patch.flipX, patch.flipY);
            }

            if (worldTile.bridge) {
                drawChunkTexture(getUpperContext(), scene, worldTile.key, drawX, drawY, worldTile.rotation);
            }

            if (worldTile.key.startsWith('wood')) {
                woodTiles.push(localX, localY, worldTile);
            }

            const prop = getPropAt(tileX, tileY);

            if (prop === 'bush') {
                const bush = { x: tileX * TILE_SIZE, y: baseY, slices: [], rustleStart: -Infinity, touching: false, offset: 0 };
                const bushTint = getTintColor(getGrassTint(tileX, tileY), 1);

                for (let slice = 0; slice < TILE_SIZE; slice++) {
                    const image = scene.add.image(bush.x, baseY, `bush-slice-${slice}`)
                        .setOrigin(0, 1)
                        .setDepth(baseY - TILE_SIZE + slice + 0.5)
                        .setTint(bushTint);

                    worldObjectLayer.add(image);
                    tileSprites.push(image);
                    bush.slices.push(image);
                }

                bushes.push(bush);
            } else if (prop === 'tree') {
                const sprite = getPropSprite(tileX, tileY);
                const trunk = scene.add.image(sprite.x, sprite.y, `${sprite.texture}-trunk`).setOrigin(0).setDepth(baseY);
                const canopy = scene.add.image(sprite.x, sprite.y, `${sprite.texture}-canopy`).setOrigin(0).setDepth(baseY + 0.1).setTint(getTintColor(getGrassTint(tileX, tileY), 0.5));
                worldObjectLayer.add([trunk, canopy]);
                tileSprites.push(trunk, canopy);
                const variant = getTreeVariant(tileX, tileY);
                trees.push({ x: sprite.x, y: sprite.y, baseY, width: variant.width, texture: `${sprite.texture}-canopy`, canopy, trunk, trunkTexture: `${sprite.texture}-trunk`, color: variant.color, shadow: sprite.shadow, contactShadow: variant.contactShadow, shadowTop: variant.shadowTop, shadowHeight: variant.shadowHeight, offset: 0, rustleStart: -Infinity, touching: false });
            } else if (prop) {
                const sprite = getPropSprite(tileX, tileY);
                const image = scene.add.image(sprite.x, sprite.y, sprite.texture)
                    .setOrigin(0)
                    .setDepth(baseY);

                worldObjectLayer.add(image);
                tileSprites.push(image);
            }

            if (shoreline) {
                const worldX = tileX * TILE_SIZE;
                const worldY = tileY * TILE_SIZE;

                for (const cell of shoreline.waterCells) {
                    const x = worldX + cell.x;
                    const y = worldY + cell.y;
                    waterMaskCells.push(x, y, cell.width, cell.height);
                    if (isWater && !worldTile.bridge && cell.width >= 12) waterCells.push(x, y, cell.width, cell.height);
                }

                for (const cell of shoreline.edgeCells) {
                    edgeCells.push(worldX + cell.x, worldY + cell.y, cell.width);
                }
            }
        }
    }

    const shadowMask = getStaticShadowMask(chunkX, chunkY);
    if (shadowMask) bakeGroundShadows(scene, groundContext, chunkX, chunkY, shadowMask);
    tintChunkGrass(scene, groundContext, originTileX, originTileY);
    if (upperContext) tintChunkGrass(scene, upperContext, originTileX, originTileY);

    const groundLayer = createChunkLayer(scene, groundTexture, pixelX, pixelY, 0);
    const upperLayer = upperTexture ? createChunkLayer(scene, upperTexture, pixelX, pixelY, 1.5) : null;

    const chunk = {
        key,
        chunkX,
        chunkY,
        pixelX,
        pixelY,
        tileSprites,
        groundLayer,
        groundTexture,
        upperLayer,
        upperTexture,
        waterCells,
        visible: true,
        shimmers: [],
        overlay: null,
        waterTexture: null,
        shadowMask,
        bushes,
        trees,
        fish: [],
        pixels: null,
        waterBuild: waterMaskCells.length > 0 ? { waterMaskCells, edgeCells, woodTiles, shorelineTiles } : null
    };

    chunk.npcs = spawnChunkNpcs(scene, chunkX, chunkY, tileSprites);
    loadedChunks.set(key, chunk);
    if (waterCells.length > 0) loadedShimmerChunks.add(chunk);

    if (chunk.waterBuild && deferWater) {
        pendingWaterChunks.push(chunk);
    } else if (chunk.waterBuild) {
        buildChunkWater(scene, chunk);
    }
}

function destroyWorldChunk(key) {
    const chunk = loadedChunks.get(key);
    if (!chunk) return;

    while (chunk.shimmers.length) poolShimmer(chunk.shimmers.pop());
    rememberChunkNpcs(chunk, mainCamera ? mainCamera.scene.time.now : 0);
    for (const sprite of chunk.tileSprites) sprite.destroy();

    for (const [layer, texture] of [[chunk.groundLayer, chunk.groundTexture], [chunk.upperLayer, chunk.upperTexture], [chunk.overlay, chunk.waterTexture], [chunk.treeShadowLayer, chunk.treeShadowTexture]]) {
        if (layer) layer.destroy();
        if (texture) chunkCanvasPool.push(texture);
    }

    loadedWaterChunks.delete(chunk);
    loadedShimmerChunks.delete(chunk);
    loadedChunks.delete(key);
}

function isChunkNear(chunkX, chunkY, radius) {
    return Math.abs(chunkX - activeChunkX) <= radius && Math.abs(chunkY - activeChunkY) <= radius;
}

function updateLoadedChunks(scene, force = false) {
    const centerChunkX = Math.floor((startup || spawnReturn ? mainCamera.scrollX + mainCamera.width / 2 : character.x + CHARACTER_SIZE / 2) / CHUNK_PIXEL_SIZE);
    const centerChunkY = Math.floor((startup || spawnReturn ? mainCamera.scrollY + mainCamera.height / 2 : character.y + CHARACTER_SIZE / 2) / CHUNK_PIXEL_SIZE);

    if (!force && !spawnReturn && centerChunkX === activeChunkX && centerChunkY === activeChunkY) return;

    const discoveredBefore = discoveredChunks.size;

    activeChunkX = centerChunkX;
    activeChunkY = centerChunkY;
    visibleChunkLeft = null;
    pendingChunks.length = 0;

    for (let offsetY = -CHUNK_DISCOVERY_RADIUS; !startup && offsetY <= CHUNK_DISCOVERY_RADIUS; offsetY++) {
        const chunkY = centerChunkY + offsetY;
        for (let offsetX = -CHUNK_DISCOVERY_RADIUS; offsetX <= CHUNK_DISCOVERY_RADIUS; offsetX++) {
            discoveredChunks.add(getTileId(centerChunkX + offsetX, chunkY));
        }
    }

    if (discoveredChunks.size !== discoveredBefore) {
        saveDirty = true;
        mapDirty = true;
    }

    for (let offsetY = -CHUNK_LOAD_RADIUS; offsetY <= CHUNK_LOAD_RADIUS; offsetY++) {
        const chunkY = centerChunkY + offsetY;
        for (let offsetX = -CHUNK_LOAD_RADIUS; offsetX <= CHUNK_LOAD_RADIUS; offsetX++) {
            const chunkX = centerChunkX + offsetX;


            if (force || offsetX === 0 && offsetY === 0 || spawnReturn && chunkX * CHUNK_PIXEL_SIZE < mainCamera.scrollX + mainCamera.width && (chunkX + 1) * CHUNK_PIXEL_SIZE > mainCamera.scrollX && chunkY * CHUNK_PIXEL_SIZE < mainCamera.scrollY + mainCamera.height && (chunkY + 1) * CHUNK_PIXEL_SIZE > mainCamera.scrollY) {
                createWorldChunk(scene, chunkX, chunkY);
            } else if (!loadedChunks.has(getChunkKey(chunkX, chunkY))) {
                pendingChunks.push(chunkX, chunkY);
            }
        }
    }

    for (const [key, chunk] of loadedChunks) {
        if (!isChunkNear(chunk.chunkX, chunk.chunkY, CHUNK_LOAD_RADIUS)) destroyWorldChunk(key);
    }

    // Keep unloaded chunks and their pixel buffers out of the deferred work queue.
    let pendingCount = 0;
    for (const chunk of pendingWaterChunks) {
        if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) pendingWaterChunks[pendingCount++] = chunk;
    }
    pendingWaterChunks.length = pendingCount;
}

function buildPendingChunk(scene) {
    while (pendingChunks.length > 0) {
        const chunkY = pendingChunks.pop();
        const chunkX = pendingChunks.pop();

        if (isChunkNear(chunkX, chunkY, CHUNK_LOAD_RADIUS) && !loadedChunks.has(getChunkKey(chunkX, chunkY))) {
            createWorldChunk(scene, chunkX, chunkY, true);
            visibleChunkLeft = null;
            return;
        }
    }

    while (pendingWaterChunks.length > 0) {
        const chunk = pendingWaterChunks.pop();

        if (loadedChunks.get(chunk.key) === chunk && chunk.waterBuild) {
            buildChunkWater(scene, chunk);
            return;
        }
    }
}

function updateChunkVisibility() {
    const chunkLeft = Math.floor(mainCamera.scrollX / CHUNK_PIXEL_SIZE);
    const chunkRight = Math.ceil((mainCamera.scrollX + mainCamera.width) / CHUNK_PIXEL_SIZE) - 1;
    const chunkTop = Math.floor(mainCamera.scrollY / CHUNK_PIXEL_SIZE);
    const chunkBottom = Math.ceil((mainCamera.scrollY + mainCamera.height) / CHUNK_PIXEL_SIZE) - 1;

    if (
        chunkLeft === visibleChunkLeft && chunkRight === visibleChunkRight &&
        chunkTop === visibleChunkTop && chunkBottom === visibleChunkBottom
    ) {
        return;
    }

    visibleChunkLeft = chunkLeft;
    visibleChunkRight = chunkRight;
    visibleChunkTop = chunkTop;
    visibleChunkBottom = chunkBottom;

    for (const chunk of loadedChunks.values()) {
        const visible = chunk.chunkX >= chunkLeft && chunk.chunkX <= chunkRight && chunk.chunkY >= chunkTop && chunk.chunkY <= chunkBottom;
        if (visible === chunk.visible) continue;

        chunk.visible = visible;
        chunk.groundLayer.setVisible(visible);
        if (chunk.upperLayer) chunk.upperLayer.setVisible(visible);
        if (chunk.overlay) chunk.overlay.setVisible(visible);
        if (chunk.treeShadowLayer) chunk.treeShadowLayer.setVisible(visible);
    }
}

function updateChunkWater(time) {
    if (!waterPipeline || loadedWaterChunks.size === 0) return;

    waterPipeline.set1f('uTime', time / 1000);
    waterPipeline.set2f('uScroll', mainCamera.scrollX, mainCamera.scrollY);
    waterPipeline.set1f('uViewHeight', mainCamera.height);
    waterPipeline.set2f('uBiomeOffset', WATER_BIOME_OFFSET[0], WATER_BIOME_OFFSET[1]);

    const left = mainCamera.scrollX - FISH_VIEW_MARGIN;
    const top = mainCamera.scrollY - FISH_VIEW_MARGIN;
    const right = mainCamera.scrollX + mainCamera.width + FISH_VIEW_MARGIN;
    const bottom = mainCamera.scrollY + mainCamera.height + FISH_VIEW_MARGIN;
    let count = 0;

    fishChunks: for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;

        for (const fish of chunk.fish) {
            if (count >= FISH_MAX_VISIBLE) break fishChunks;
            const x = fish.x, y = fish.y;
            if (fish.jumping || x < left || x > right || y < top || y > bottom) continue;
            const offset = count * 4;

            fishUniforms[offset] = Math.round(x);
            fishUniforms[offset + 1] = Math.round(y);
            fishUniforms[offset + 2] = Math.cos(fish.heading);
            fishUniforms[offset + 3] = Math.sin(fish.heading);
            fishShapeUniforms[offset] = fish.length;
            fishShapeUniforms[offset + 1] = fish.radius;
            fishShapeUniforms[offset + 2] = fish.phase;
            fishShapeUniforms[offset + 3] = fish.amplitude;
            count++;
        }
    }

    if (count > 0) waterPipeline.set4fv('uFish', fishUniforms);
    if (count > 0) waterPipeline.set4fv('uFishShape', fishShapeUniforms);
    waterPipeline.set1f('uFishCount', count);
}

function poolShimmer(shimmer) {
    shimmer.shimmerChunk = null;
    shimmer.stop().setVisible(false).setActive(false);
    shimmerPool.push(shimmer);
}

function releaseShimmer(chunk, shimmer) {
    const index = chunk.shimmers.indexOf(shimmer);

    if (index !== -1) {
        chunk.shimmers.splice(index, 1);
    }

    poolShimmer(shimmer);
}

function finishShimmer(animation, frame, shimmer) {
    if (shimmer.shimmerChunk) releaseShimmer(shimmer.shimmerChunk, shimmer);
}

function spawnShimmer(scene) {
    let visibleCount = 0;

    for (const chunk of loadedShimmerChunks) {
        if (chunk.visible) visibleCount++;
    }

    if (visibleCount === 0) return;

    let selected = Math.floor(Math.random() * visibleCount);

    for (const chunk of loadedShimmerChunks) {
        if (!chunk.visible || selected-- > 0) continue;
        spawnChunkShimmer(scene, chunk);
        return;
    }
}

function spawnChunkShimmer(scene, chunk) {
    const cells = chunk.waterCells;
    const cell = Math.floor(Math.random() * (cells.length / 4)) * 4;
    let shimmer = shimmerPool.pop();

    if (!shimmer) {
        shimmer = scene.add.sprite(0, 0, 'shimmer-0').setOrigin(0).setDepth(1.25);
        shimmer.on(Phaser.Animations.Events.ANIMATION_COMPLETE, finishShimmer);
    }

    shimmer.shimmerChunk = chunk;
    shimmer
        .setPosition(
            cells[cell] + Phaser.Math.Between(0, cells[cell + 2] - 12),
            cells[cell + 1] + Phaser.Math.Between(0, cells[cell + 3] - 1)
        )
        .setDepth(1.25).setVisible(true)
        .setActive(true);

    chunk.shimmers.push(shimmer);
    shimmer.play(`shimmer-${Math.round(getWaterBiomeAmount(shimmer.x + 6, shimmer.y) * (SHIMMER_TINT_STEPS - 1))}`);
}

function canHoldProp(type, tileX, tileY) {
    const definition = PROP_TYPES[type];
    for (let offsetX = 0; offsetX < definition.width; offsetX++) {
        const nearbyX = tileX + offsetX;
        const terrain = getTerrainType(nearbyX, tileY);
        if (terrain !== 'grass' && (terrain !== 'dirt' || !definition.onDirt)) return false;
        if (type === 'bush') continue;

        const tile = getWorldTile(nearbyX, tileY);
        if (tile.blocking || tile.bridge || tile.key.startsWith('wood')) return false;
    }

    return true;
}

function getPropCandidate(tileX, tileY) {
    return PROP_CODES[propCandidateTiles(tileX, tileY, generatePropCandidateCode)];
}

function generatePropCandidateCode(tileX, tileY) {
    if (Math.abs(tileX) <= PROP_SPAWN_CLEARANCE && Math.abs(tileY) <= PROP_SPAWN_CLEARANCE) return 1;

    const score = worldHash(tileX, tileY, 760);
    let type = null;

    if (score > 0.992) {
        type = 'bush';
    } else if (score > 0.985) {
        const roll = worldHash(tileX, tileY, 763);
        type = roll < 0.4 ? 'rock' : roll < 0.65 ? 'boulder' : 'tree';
    } else if (score > 0.94 && valueNoise(tileX, tileY, PROP_FOREST_SCALE, 764) > PROP_FOREST_LEVEL) {
        type = 'tree';
    }

    return type && canHoldProp(type, tileX, tileY) ? PROP_CODES.indexOf(type) : 1;
}

function isUnderCanopy(treeX, treeY, otherX, otherY, otherWidth) {
    return otherY < treeY && otherY >= treeY - TREE_CANOPY_TILES &&
        otherX < treeX + 3 && otherX + otherWidth > treeX - 1;
}

function propsConflict(typeA, ax, ay, typeB, bx, by) {
    const widthA = PROP_TYPES[typeA].width;
    const widthB = PROP_TYPES[typeB].width;
    const apart = bx >= ax + widthA + 1 || ax >= bx + widthB + 1;

    if (Math.abs(ay - by) <= 1 && !apart) return true;

    return typeA === 'tree' && isUnderCanopy(ax, ay, bx, by, widthB) ||
        typeB === 'tree' && isUnderCanopy(bx, by, ax, ay, widthA);
}

const PROP_CODES = [undefined, null, 'bush', 'rock', 'boulder', 'tree'];
const propCandidateTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const propTiles = createTileCache(() => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE));
const propSprites = createTileCache(() => new Array(CHUNK_SIZE * CHUNK_SIZE));

function getPropAt(tileX, tileY) {
    return PROP_CODES[propTiles(tileX, tileY, generatePropCode)];
}

function generatePropCode(tileX, tileY) {
    return PROP_CODES.indexOf(placeProp(tileX, tileY));
}

function placeProp(tileX, tileY) {
    const type = getPropCandidate(tileX, tileY);
    if (!type) return null;

    const priority = worldHash(tileX, tileY, 765);
    const firstRow = type === 'tree' ? -TREE_CANOPY_TILES : -1;
    const width = PROP_TYPES[type].width;

    for (let offsetY = firstRow; offsetY <= TREE_CANOPY_TILES; offsetY++) {
        // Beyond adjacent rows, only a nearby tree's canopy can overlap a smaller prop.
        const canopyOnly = type !== 'tree' && offsetY > 1;
        const firstColumn = canopyOnly ? -2 : -3;
        const lastColumn = canopyOnly ? width : 3;
        const nearbyY = tileY + offsetY;
        for (let offsetX = firstColumn; offsetX <= lastColumn; offsetX++) {
            if (offsetX === 0 && offsetY === 0) continue;

            const nearbyX = tileX + offsetX;
            const nearby = getPropCandidate(nearbyX, nearbyY);

            if (!nearby || !propsConflict(type, tileX, tileY, nearby, nearbyX, nearbyY)) continue;

            const nearbyPriority = worldHash(nearbyX, nearbyY, 765);
            const nearbyWins = nearbyPriority > priority || nearbyPriority === priority &&
                (nearbyY < tileY || nearbyY === tileY && nearbyX < tileX);

            if (nearbyWins) return null;
        }
    }

    return type;
}

function getPropCovering(tileX, tileY) {
    const here = getPropAt(tileX, tileY);
    if (here) return { type: here, tileX };

    const left = getPropAt(tileX - 1, tileY);
    return left && PROP_TYPES[left].width > 1 ? { type: left, tileX: tileX - 1 } : null;
}

function isTileClearOfProps(tileX, tileY) {
    const firstTreeX = tileX - 2, lastTreeX = tileX + 1;
    if (getPropCovering(tileX, tileY)) return false;

    for (let offsetY = 1; offsetY <= TREE_CANOPY_TILES; offsetY++) {
        const treeY = tileY + offsetY;
        for (let treeX = firstTreeX; treeX <= lastTreeX; treeX++) {
            if (getPropAt(treeX, treeY) === 'tree') return false;
        }
    }

    return true;
}

function getTreeVariant(tileX, tileY) {
    const weights = blendBiomeStops(TREE_PALETTE_WEIGHTS, getGrassBiome(tileX + 1, tileY + 0.5));
    let roll = worldHash(tileX, tileY, 767) * weights.reduce((total, weight) => total + weight, 0);
    let palette = 0;
    while (palette < weights.length - 1 && (roll -= weights[palette]) >= 0) palette++;
    const options = treeVariantsByPalette[palette]?.length ? treeVariantsByPalette[palette] : treeVariants;
    return options[Math.min(Math.floor(worldHash(tileX, tileY, 766) * options.length), options.length - 1)];
}

function getPropSprite(tileX, tileY) {
    return propSprites(tileX, tileY, createPropSprite);
}

function createPropSprite(tileX, tileY) {
    const type = getPropAt(tileX, tileY);
    const baseY = (tileY + 1) * TILE_SIZE;

    if (type === 'tree') {
        const variant = getTreeVariant(tileX, tileY);
        const x = tileX * TILE_SIZE + TILE_SIZE - variant.width / 2;

        return {
            texture: variant.key,
            x,
            y: baseY - variant.height,
            shadow: variant.shadowPoints,
            hitLeft: x + variant.hitLeft,
            hitRight: x + variant.hitRight,
            hitHeight: TREE_HITBOX_HEIGHT
        };
    }

    const art = propArt.get(type);
    const definition = PROP_TYPES[type];
    const x = tileX * TILE_SIZE + Math.floor((definition.width * TILE_SIZE - art.width) / 2);
    const hitbox = definition.hitbox;

    return {
        texture: type,
        x,
        y: baseY - art.height,
        shadow: art.shadow,
        hitLeft: hitbox ? x + hitbox[0] : x,
        hitRight: hitbox ? x + art.width - hitbox[0] : x,
        hitHeight: hitbox ? hitbox[1] : 0
    };
}

function propBlocksRect(type, tileX, tileY, left, top, right, bottom) {
    const sprite = getPropSprite(tileX, tileY);
    const baseY = (tileY + 1) * TILE_SIZE;

    return left < sprite.hitRight && right > sprite.hitLeft && top < baseY && bottom > baseY - sprite.hitHeight;
}

function isGuideSpawnTile(tileX, tileY) {
    const tileKey = getWorldTile(tileX, tileY).key.toLowerCase();

    return getTerrainType(tileX, tileY) !== 'water' &&
        !tileKey.includes('edge') &&
        !tileKey.includes('wood') &&
        !tileKey.includes('water') &&
        isTileClearOfProps(tileX, tileY);
}

function canPlaceStoreAt(storeTileX, storeTileY) {
    for (let localY = 0; localY < STORE_HEIGHT_TILES; localY += 1) {
        for (let localX = 0; localX < STORE_WIDTH_TILES; localX += 1) {
            if (!isGuideSpawnTile(storeTileX + localX, storeTileY + localY) || getNpcAt(storeTileX + localX, storeTileY + localY)) {
                return false;
            }
        }
    }

    return true;
}

function findGuideAndStoreSpawn() {
    const centerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const centerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);

    for (let radius = 3; radius <= 8; radius += 1) {
        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
            const edgeRow = offsetY === -radius || offsetY === radius;
            for (let offsetX = -radius; offsetX <= radius; offsetX += edgeRow ? 1 : radius * 2) {
                const guideTileX = centerTileX + offsetX;
                const guideTileY = centerTileY + offsetY;
                const storeTileX = guideTileX - 1;
                const storeTileY = guideTileY - STORE_HEIGHT_TILES;

                if (!isGuideSpawnTile(guideTileX, guideTileY) || getNpcAt(guideTileX, guideTileY) || !canPlaceStoreAt(storeTileX, storeTileY)) {
                    continue;
                }

                return {
                    guideTileX,
                    guideTileY,
                    storeTileX,
                    storeTileY
                };
            }
        }
    }

    return null;
}

function spawnGuideAndStore(scene) {
    const spawn = findGuideAndStoreSpawn();
    if (!spawn) return;

    store = scene.add.image(spawn.storeTileX * TILE_SIZE, spawn.storeTileY * TILE_SIZE, 'store')
        .setOrigin(0)
        .setDepth(spawn.storeTileY * TILE_SIZE + STORE_HEIGHT);
    guide = scene.add.image(spawn.guideTileX * TILE_SIZE, spawn.guideTileY * TILE_SIZE, 'guide')
        .setOrigin(0)
        .setDepth(spawn.guideTileY * TILE_SIZE + GUIDE_SIZE);
    worldObjectLayer.add([store, guide]);

    staticShadowCasters.push(
        createStaticShadowCaster(guide.x + ACTOR_SHADOW_X, guide.y + ACTOR_SHADOW_Y, getShapePoints(ACTOR_SHADOW_SHAPE)),
        createStaticShadowCaster(store.x, store.y, extractSilhouetteShadow(scene, 'store'))
    );
    rebakeLoadedShadows(scene);
}

function rebakeLoadedShadows(scene) {
    for (const chunk of loadedChunks.values()) {
        const mask = getStaticShadowMask(chunk.chunkX, chunk.chunkY);
        let added = null;
        if (mask) {
            for (let pixel = 0; pixel < mask.length; pixel++) {
                if (!mask[pixel] || chunk.shadowMask?.[pixel]) continue;
                added ||= new Uint8Array(mask.length);
                added[pixel] = 1;
            }
        }

        if (!added) continue;

        bakeGroundShadows(scene, chunk.groundTexture.getContext(), chunk.chunkX, chunk.chunkY, added);
        chunk.groundTexture.refresh();
        chunk.shadowMask = mask;
        chunk.pixels = null;
        chunk.treeShadowColors = null;
        chunk.treeShadowSignature = null;
        scene.treeShadowSignature = null;
    }
}

function getShapePoints(shape) {
    const points = [];

    for (let row = 0; row < shape.length; row++) {
        const cells = shape[row];
        for (let column = 0; column < cells.length; column++) {
            if (cells[column] === '#') points.push(column, row);
        }
    }

    return points;
}

const shadowPaletteColors = [];
const tintedShadowCache = new Map();
const actorShadeCache = new WeakMap();

function getActorShadeCoverage(x, y) {
    const left = Math.round(x) + CHARACTER_HITBOX_X, top = Math.round(y) + CHARACTER_HITBOX_Y;
    let shaded = 0, previousX = NaN, previousY = NaN, chunk = null;
    for (let row = 0; row < CHARACTER_HITBOX_HEIGHT; row++) for (let column = 0; column < CHARACTER_HITBOX_WIDTH; column++) {
        const worldX = left + column, worldY = top + row, chunkX = Math.floor(worldX / CHUNK_PIXEL_SIZE), chunkY = Math.floor(worldY / CHUNK_PIXEL_SIZE);
        if (chunkX !== previousX || chunkY !== previousY) { chunk = loadedChunks.get(getChunkKey(chunkX, chunkY)); previousX = chunkX; previousY = chunkY; }
        if (!chunk) continue;
        const pixel = (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE;
        if (chunk.treeShadePoints?.has(pixel)) shaded++;
    }
    return shaded / (CHARACTER_HITBOX_WIDTH * CHARACTER_HITBOX_HEIGHT);
}

function updateActorShade(scene, sprite) {
    if (!sprite || sprite.visible === false) return;
    const x = Math.round(sprite.x), y = Math.round(sprite.y), version = scene.actorShadeVersion || 0;
    let cached = actorShadeCache.get(sprite);
    if (cached && cached.scene === scene && cached.x === x && cached.y === y && cached.version === version) return;
    const level = Math.round(255 * (1 - getActorShadeCoverage(x, y) * 0.14)), tint = level * 0x010101;
    if (!cached || cached.tint !== tint) sprite.setTint(tint);
    if (!cached) actorShadeCache.set(sprite, cached = {});
    cached.scene = scene; cached.x = x; cached.y = y; cached.version = version; cached.tint = tint;
}

function updateActorShading(scene) {
    updateActorShade(scene, character); updateActorShade(scene, guide);
    for (const chunk of loadedChunks.values()) if (chunk.visible) for (const npc of chunk.npcs || []) if (npc.state !== 'home') updateActorShade(scene, npc.sprite);
}

function shadeGroundPixel(scene, red, green, blue, tileX, tileY) {
    if (red <= green + 6 || green < blue || getWoodColors(scene).has((red << 16) | (green << 8) | blue)) return shadeColor(red, green, blue);
    const tint = getDirtTint(tileX, tileY);
    const raw = [red / tint[0], green / tint[1], blue / tint[2]];
    const key = (Math.round(raw[0]) << 16) | (Math.round(raw[1]) << 8) | Math.round(raw[2]);
    let shaded = tintedShadowCache.get(key);
    if (!shaded) {
        let best = raw, bestDistance = Infinity;
        for (const color of shadowPaletteColors) {
            const distance = (color[0] - raw[0]) ** 2 + (color[1] - raw[1]) ** 2 + (color[2] - raw[2]) ** 2;
            if (distance < bestDistance) [best, bestDistance] = [color, distance];
        }
        shaded = shadeColor(...best.map(Math.round));
        tintedShadowCache.set(key, shaded);
    }
    return shaded.map((value, channel) => Math.min(255, Math.round(value * tint[channel])));
}

function buildShadowLut(scene) {
    const colors = new Map();

    for (const key of SHADOW_PALETTE_TEXTURES) {
        const pixels = getTerrainPixels(scene, key).data;

        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] < 255) continue;
            const color = (pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2];
            if (colors.has(color)) continue;
            colors.set(color, [
                pixels[index],
                pixels[index + 1],
                pixels[index + 2]
            ]);
        }
    }

    const describe = ([r, g, b]) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let hue = 0;

        if (delta) {
            hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
            hue = (hue * 60 + 360) % 360;
        }

        return { hue, saturation: max ? delta / max : 0, luma: r * 0.299 + g * 0.587 + b * 0.114 };
    };

    const entries = [...colors].map(([key, rgb]) => ({ key, rgb, ...describe(rgb) }));

    for (const color of entries) {
        let best = null;

        for (const other of entries) {
            if (other.luma >= color.luma - 10 || best && other.luma <= best.luma) continue;
            if (Math.abs(color.saturation - other.saturation) >= 0.14) continue;

            const hueDifference = Math.abs(color.hue - other.hue), hueGap = Math.min(hueDifference, 360 - hueDifference);
            if (hueGap >= 24) continue;

            const dr = color.rgb[0] - other.rgb[0];
            const dg = color.rgb[1] - other.rgb[1];
            const db = color.rgb[2] - other.rgb[2];

            if (dr * dr + dg * dg + db * db < 48 * 48) best = other;
        }

        shadowLut.set(color.key, best ? best.rgb : color.rgb.map(value => Math.round(value * 0.86)));
        shadowPaletteColors.push(color.rgb);
    }
}

function getShadowStyle(scene, key) {
    scene.shadowStyleCache ||= new Map();

    let style = scene.shadowStyleCache.get(key);

    if (!style) {
        const base = getDominantColor(scene, key);
        const shaded = shadeColor(base[0], base[1], base[2]);
        style = `rgb(${shaded[0]}, ${shaded[1]}, ${shaded[2]})`;
        scene.shadowStyleCache.set(key, style);
    }

    return style;
}

function shadeColor(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    let shaded = shadowLut.get(key);

    if (!shaded) {
        shaded = [Math.round(r * 0.86), Math.round(g * 0.86), Math.round(b * 0.86)];
        shadowLut.set(key, shaded);
    }

    return shaded;
}

function getDominantColor(scene, key) {
    scene.dominantColorCache ||= new Map();

    const cached = scene.dominantColorCache.get(key);
    if (cached) return cached;

    const pixels = getTerrainPixels(scene, key).data;
    const counts = new Map();
    let best = 0;
    let bestCount = 0;

    for (let index = 0; index < pixels.length; index += 4) {
        if (!pixels[index + 3]) continue;
        const color = (pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2];
        const count = (counts.get(color) || 0) + 1;

        counts.set(color, count);

        if (count > bestCount) {
            best = color;
            bestCount = count;
        }
    }

    const dominant = [best >> 16, (best >> 8) & 255, best & 255];
    scene.dominantColorCache.set(key, dominant);
    return dominant;
}

function getChunkPixels(chunk) {
    chunk.pixels ||= { ground: null, upper: null, upperRead: false };

    if (!chunk.pixels.ground) {
        chunk.pixels.ground = chunk.groundTexture.getContext()
            .getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data;
    }

    if (!chunk.pixels.upperRead) {
        chunk.pixels.upperRead = true;
        chunk.pixels.upper = chunk.upperTexture
            ? chunk.upperTexture.getContext().getImageData(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE).data
            : null;
    }

    return chunk.pixels;
}

function getGroundShadowColor(scene, worldX, worldY) {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const tile = getWorldTile(tileX, tileY);
    if (isWaterPixel(scene, worldX, worldY, tile)) return null;

    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const chunk = loadedChunks.get(getChunkKey(chunkX, chunkY));
    const pixel = chunk ? (worldY - chunkY * CHUNK_PIXEL_SIZE) * CHUNK_PIXEL_SIZE + worldX - chunkX * CHUNK_PIXEL_SIZE : 0;

    if (!chunk || chunk.shadowMask?.[pixel]) return null;
    if (isFlatShadowTile(tile)) return tintGrassColor(getTileShadowColor(scene, tile), tileX, tileY);

    const { upper, ground } = getChunkPixels(chunk);
    const index = pixel * 4;

    if (upper && upper[index + 3]) return tintWaterShadow(shadeGroundPixel(scene, upper[index], upper[index + 1], upper[index + 2], tileX, tileY), worldX, worldY);
    if (!ground[index + 3]) return null;
    if (tile.key.startsWith('grass')) return tintGrassColor(getTileShadowColor(scene, tile), tileX, tileY);

    return tintWaterShadow(shadeGroundPixel(scene, ground[index], ground[index + 1], ground[index + 2], tileX, tileY), worldX, worldY);
}

function tintWaterShadow(color, worldX, worldY) {
    if (color[2] <= color[0] || color[2] <= color[1]) return color;
    const tint = getWaterTint(worldX, worldY);
    return color.map((value, channel) => Math.min(255, Math.round(value * tint[channel])));
}

function getTileShadowColor(scene, tile) {
    return shadeColor(...getDominantColor(scene, tile.key));
}

const activeParticles = [];

function kickUpDust(scene, time, moveX, moveY) {
    const footX = character.x + CHARACTER_SIZE / 2;
    const footY = character.y + CHARACTER_SIZE - 1;
    const tileX = Math.floor(footX / TILE_SIZE);
    const tileY = Math.floor(footY / TILE_SIZE);
    const tileKey = getWorldTile(tileX, tileY).key;
    if (tileKey.startsWith('wood')) {
        if (Math.random() < WOOD_DUST_CHANCE) spawnParticle(scene, shadowLayer, time, Math.round(footX - moveX * 5), footY - 1, moveX !== 0 ? -moveX : Math.random() < 0.5 ? -1 : 1, -1, DUST_LIFETIME, WOOD_DUST_COLORS[Math.floor(Math.random() * WOOD_DUST_COLORS.length)]);
        return;
    }
    const terrain = getTerrainType(tileX, tileY);
    const petal = tileKey === 'grass3' ? FLOWER_PETAL_COLOR : tileKey === 'grass4' ? (([red, green, blue]) => (red << 16) | (green << 8) | blue)(getFlowerPatchColor(tileX, tileY)) : null;
    if (petal && Math.random() < PETAL_KICK_CHANCE) spawnParticle(scene, shadowLayer, time, Math.round(footX - moveX * 4), footY - 2, moveX !== 0 ? -moveX : Math.random() < 0.5 ? -1 : 1, -1, PETAL_LIFETIME, petal);
    const colors = terrain === 'dirt' ? DUST_COLORS
        : terrain === 'grass' && characterPace > 1 ? GRASS_FLECK_COLORS
        : null;

    if (!colors) return;
    const count = colors === DUST_COLORS ? DUST_PER_STEP : GRASS_FLECKS_PER_STEP;
    const tint = terrain === 'dirt' ? getDirtTint(tileX, tileY) : getGrassTint(tileX, tileY);

    for (let index = 0; index < count; index++) {
        const side = index % 2 === 0 ? -1 : 1;
        const spread = Math.floor(Math.random() * 2);
        const offsetX = moveX !== 0 ? -moveX * (5 + spread + index) : side * (5 + spread);
        const offsetY = moveY < 0 ? 1 + spread : moveX !== 0 ? -spread : -1 - spread;

        spawnParticle(
            scene, shadowLayer, time, Math.round(footX + offsetX), footY + offsetY,
            moveX !== 0 ? -moveX : side, -1, DUST_LIFETIME, tintMapColor(colors[index % colors.length], tint)
        );
    }
}

function dropLeaves(scene, time, bush) {
    const originX = bush.x + BUSH_FOOTPRINT_LEFT, originY = bush.y - BUSH_FOOTPRINT_HEIGHT, depth = bush.y + 1;
    const tint = getGrassTint(Math.floor(bush.x / TILE_SIZE), Math.floor((bush.y - 1) / TILE_SIZE));
    for (let index = 0; index < LEAVES_PER_RUSTLE; index++) {
        spawnParticle(
            scene, worldObjectLayer, time,
            originX + Math.floor(Math.random() * (BUSH_FOOTPRINT_RIGHT - BUSH_FOOTPRINT_LEFT)),
            originY + Math.floor(Math.random() * 4),
            Math.random() < 0.5 ? -1 : 1, 1, LEAF_LIFETIME,
            tintMapColor(LEAF_COLORS[index % LEAF_COLORS.length], tint), depth
        );
    }
}

let nextMoteAt = 0;

function spawnMeadowMote(scene, time) {
    if (time < nextMoteAt) return;
    nextMoteAt = time + MOTE_INTERVAL;
    const x = Math.round(mainCamera.scrollX + Math.random() * mainCamera.width);
    const y = Math.round(mainCamera.scrollY + Math.random() * mainCamera.height);
    if (getTerrainType(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)) !== 'grass') return;
    spawnParticle(scene, worldObjectLayer, time, x, y, Math.random() < 0.5 ? -1 : 1, -1, MOTE_LIFETIME, MOTE_COLORS[Math.floor(Math.random() * MOTE_COLORS.length)], y + 24);
}

function goldSparkle(scene, time, x, y) {
    for (let index = 0; index < CHEST_SPARKLE_COLORS.length * 2; index++) {
        spawnParticle(
            scene, worldObjectLayer, time, x - 3 + index, y - (index % 2) * 2,
            index % 2 ? 1 : -1, -1, 360, CHEST_SPARKLE_COLORS[index % CHEST_SPARKLE_COLORS.length], character.depth + 0.4
        );
    }
}

function sparkleOverPlayer(scene) {
    goldSparkle(scene, scene.time.now, Math.round(character.x + CHARACTER_SIZE / 2), Math.round(character.y) + 2);
}

function spawnParticle(scene, layer, born, x, y, drift, rise, lifetime, color, depth = 0, directionX = 0, directionY = 0, ring = false) {
    let image = availableParticles.pop();

    if (!image) {
        image = scene.add.image(0, 0, '__WHITE')
            .setOrigin(0)
            .setDisplaySize(1, 1);
        particlePool.push(image);
    }

    if (image.displayList !== layer) {
        layer.add(image);
    }

    image.particleBorn = born;
    image.particleX = x;
    image.particleY = y;
    image.particleDrift = drift;
    image.particleRise = rise;
    image.particleLifetime = lifetime;
    image.particleStepDuration = lifetime / 3;
    image.particleDirectionX = directionX;
    image.particleDirectionY = directionY;
    image.particleRing = ring;
    image.particleStep = ring ? -1 : 0;
    image.activeParticleIndex = activeParticles.length;
    activeParticles.push(image);
    image
        .setTint(color)
        .setDepth(depth)
        .setPosition(x, y)
        .setActive(true)
        .setVisible(true);
}

function updateParticles(time) {
    for (let index = activeParticles.length - 1; index >= 0; index--) {
        const image = activeParticles[index];
        const age = time - image.particleBorn;

        if (age >= image.particleLifetime) {
            releaseParticle(image);
            continue;
        }

        const step = Math.floor(age / image.particleStepDuration);
        if (step === image.particleStep) continue;
        image.particleStep = step;

        if (image.particleRing) {
            const radius = 2 + step * 2;
            image.setPosition(
                image.particleX + Math.round(image.particleDirectionX * radius),
                image.particleY + Math.round(image.particleDirectionY * radius * 0.5)
            );
        } else {
            image.setPosition(
                image.particleX + (step > 1 ? image.particleDrift : 0),
                image.particleY + step * image.particleRise
            );
        }
    }
}

function releaseParticle(image) {
    if (!image.active) return;
    const index = image.activeParticleIndex;
    const last = activeParticles.pop();
    if (last !== image) {
        activeParticles[index] = last;
        last.activeParticleIndex = index;
    }
    image.activeParticleIndex = -1;
    image.setActive(false).setVisible(false);
    availableParticles.push(image);
}

const windRowCache = new Map();

function getWindOffset(time, x, y, strength = 1, gust = 0.7 + 0.3 * Math.sin(time / 7100)) {
    const phase = x * 0.013 + y * 0.007;
    return Math.round((Math.sin(time / 1700 + phase) + 0.35 * Math.sin(time / 530 + phase)) * gust * strength);
}

function getWindRowOffset(offset, y, height) {
    return Math.round(offset * ((height - 1 - y) / Math.max(1, height - 1)) ** 2);
}

function getWindRows(offset, height) {
    let offsets = windRowCache.get(height);
    if (!offsets) windRowCache.set(height, offsets = new Map());
    const cached = offsets.get(offset);
    if (cached) return cached;
    const rows = Int8Array.from({ length: height }, (_, y) => getWindRowOffset(offset, y, height));
    offsets.set(offset, rows);
    return rows;
}

function getWindTexture(scene, key, offset) {
    const name = `${key}-wind-${offset}`;
    if (scene.textures.exists(name)) return name;
    const source = getTextureSource(scene, key);
    const shifts = getWindRows(offset, source.height);
    createCanvasTexture(scene, name, source.width + 6, source.height, context => {
        context.imageSmoothingEnabled = false;
        for (let y = 0; y < source.height; y++) {
            const shift = shifts[y];
            context.drawImage(source, 0, y, source.width, 1, 3 + shift, y, source.width, 1);
        }
    });
    return name;
}

function getSeeThroughPattern(context, level) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const pattern = canvas.getContext('2d');
    for (let index = 0; index < 16; index++) if (SEE_THROUGH_RANKS[index] < level) pattern.fillRect(index & 3, index >> 2, 1, 1);
    return context.createPattern(canvas, 'repeat');
}

function getSeeThroughTexture(scene, key, level) {
    const name = `${key}-see${level}`;
    if (scene.textures.exists(name)) return name;
    const source = getTextureSource(scene, key);
    createCanvasTexture(scene, name, source.width, source.height, context => {
        context.drawImage(source, 0, 0);
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = getSeeThroughPattern(context, level);
        context.fillRect(0, 0, source.width, source.height);
    });
    return name;
}

function stepSeeThrough(target, hiding, time) {
    const goal = hiding ? SEE_THROUGH_LEVEL : 0;
    if ((target.seeLevel ??= 0) === goal || time < (target.seeStepAt ?? 0)) return false;
    target.seeLevel += Math.sign(goal - target.seeLevel);
    target.seeStepAt = time + SEE_THROUGH_STEP;
    return true;
}

function seeThrough(scene, key, level) {
    return level ? getSeeThroughTexture(scene, key, level) : key;
}

function getBushWindTextures(scene, offset, count) {
    const cache = scene.bushWindTextureCache ||= new Map();
    let textures = cache.get(offset);
    if (!textures) cache.set(offset, textures = []);
    for (let index = textures.length; index < count; index++) textures.push(getWindTexture(scene, `bush-slice-${index}`, offset));
    return textures;
}
function updateBushRustle(scene, time, isWalking) {
    const gust = 0.7 + 0.3 * Math.sin(time / 7100);
    const left = character.x + CHARACTER_HITBOX_X;
    const top = character.y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    for (const chunk of loadedChunks.values()) {
        for (const bush of chunk.bushes) {
            const touching =
                left < bush.x + BUSH_FOOTPRINT_RIGHT &&
                right > bush.x + BUSH_FOOTPRINT_LEFT &&
                top < bush.y &&
                bottom > bush.y - BUSH_FOOTPRINT_HEIGHT;

            if (touching && isWalking && (!bush.touching || time - bush.rustleStart > BUSH_RUSTLE_REPEAT)) {
                bush.rustleStart = time;
                dropLeaves(scene, time, bush);
            }

            bush.touching = touching;
            if (stepSeeThrough(bush, right > bush.x + 4 && left < bush.x + 28 && bottom > bush.y - 20 && bottom < bush.y + 1, time)) bush.offset = null;

            const age = time - bush.rustleStart;
            const rustle = age < BUSH_RUSTLE_DURATION
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)]
                : 0;

            const offset = rustle + getWindOffset(time, bush.x, bush.y, 1, gust);
            if (offset === bush.offset) continue;

            bush.offset = offset;
            const textures = getBushWindTextures(scene, offset, bush.slices.length);
            const x = bush.x - 3;

            for (let index = 0; index < bush.slices.length; index++) {
                bush.slices[index].setTexture(seeThrough(scene, textures[index], bush.seeLevel));
                bush.slices[index].x = x;
            }
        }
        for (const tree of chunk.trees) {
            const centerX = tree.x + tree.width / 2;
            const touching = left < centerX + 8 && right > centerX - 8 &&
                top < tree.baseY + 2 && bottom > tree.baseY - 12;
            if (touching && isWalking && !tree.touching) tree.rustleStart = time;
            tree.touching = touching;
            if (tree.color && chunk.visible && time >= (tree.nextLeafAt ??= time + Math.random() * TREE_LEAF_RANGE)) {
                tree.nextLeafAt = time + TREE_LEAF_MIN + Math.random() * TREE_LEAF_RANGE;
                spawnParticle(scene, worldObjectLayer, time, tree.x + 14 + Math.floor(Math.random() * (tree.width - 28)), tree.y + 40 + Math.floor(Math.random() * 8), Math.random() < 0.5 ? -1 : 1, 2, TREE_LEAF_LIFETIME, tree.color, tree.baseY + 0.2);
            }
            const hiding = right > tree.x + 10 && left < tree.x + tree.width - 10 && bottom > tree.y + 12 && bottom < tree.baseY - 2;
            if (tree.trunk && stepSeeThrough(tree, hiding, time)) {
                tree.offset = null;
                tree.trunk.setTexture(seeThrough(scene, tree.trunkTexture, tree.seeLevel));
            }
            const age = time - tree.rustleStart;
            const rustle = age < BUSH_RUSTLE_DURATION
                ? BUSH_RUSTLE_PATTERN[Math.floor(age / BUSH_RUSTLE_STEP)] : 0;
            const offset = getWindOffset(time, tree.x, tree.baseY, 1.6, gust) + rustle;
            if (tree.offset === offset) continue;
            tree.offset = offset;
            const windTexture = getWindTexture(scene, tree.texture, offset);
            tree.canopy.setTexture(seeThrough(scene, windTexture, tree.seeLevel));
            tree.canopy.x = tree.x - 3;
        }
    }
    if (store) {
        const hiding = right > store.x + 4 && left < store.x + STORE_WIDTH - 4 && bottom > store.y + 4 && bottom < store.y + STORE_HITBOX_Y;
        if (stepSeeThrough(store, hiding, time)) store.setTexture(seeThrough(scene, 'store', store.seeLevel));
    }
}

let treeShadowChunkCount = 0;

function updateTreeShadows(scene, time) {
    if (time < (scene.nextTreeShadowAt || 0)) return;
    scene.nextTreeShadowAt = time + 80;
    const trees = scene.treeShadowTrees ||= [];
    trees.length = 0;
    let signature = 17;
    for (const chunk of loadedChunks.values()) {
        signature = Math.imul(signature, 31) + (chunk.shadowId ||= ++treeShadowChunkCount) | 0;
        for (const tree of chunk.trees) {
            trees.push(tree);
            signature = Math.imul(signature, 31) + (tree.offset ?? 97) | 0;
        }
        signature = Math.imul(signature, 31) + (chunk.waterTexture ? 2 : 0) + (chunk.visible ? 1 : 0) | 0;
    }
    if (signature === scene.treeShadowSignature) return;
    scene.treeShadowSignature = signature;
    scene.actorShadeVersion = (scene.actorShadeVersion || 0) + 1;
    for (const chunk of loadedChunks.values()) {
        if (!chunk.visible) continue;
        const left = chunk.pixelX;
        const top = chunk.pixelY;
        const right = left + CHUNK_PIXEL_SIZE;
        const bottom = top + CHUNK_PIXEL_SIZE;
        const shadowTrees = trees.filter(tree => !(tree.x + tree.width + TREE_SHADOW_SHIFT < left || tree.x - 3 > right || tree.baseY + 32 < top || tree.baseY - 32 > bottom));
        const nextShadowSignature = (chunk.waterTexture ? 'w:' : 'land:') + shadowTrees.map(tree => `${tree.x},${tree.y},${tree.offset};`).join('');
        if (chunk.treeShadowSignature === nextShadowSignature) continue;
        const points = new Set();
        const contact = new Set();
        for (const tree of shadowTrees) {
            const x = tree.x, y = tree.y;
            const shifts = getWindRows(tree.offset, tree.shadowHeight);
            for (let point = 0; point < tree.shadow.length; point += 2) {
                const shadowY = tree.shadow[point + 1], shift = shifts[shadowY - tree.shadowTop];
                const localX = x + tree.shadow[point] + shift - left;
                const localY = y + shadowY - top;
                if (localX >= 0 && localY >= 0 && localX < CHUNK_PIXEL_SIZE && localY < CHUNK_PIXEL_SIZE) points.add(localY * CHUNK_PIXEL_SIZE + localX);
            }
            for (let point = 0; point < tree.contactShadow.length; point += 2) {
                const localX = x + tree.contactShadow[point] - left;
                const localY = y + tree.contactShadow[point + 1] - top;
                if (localX >= 0 && localY >= 0 && localX < CHUNK_PIXEL_SIZE && localY < CHUNK_PIXEL_SIZE) contact.add(localY * CHUNK_PIXEL_SIZE + localX);
            }
        }
        chunk.treeShadePoints = points; chunk.treeShadowSignature = nextShadowSignature; if (!points.size && !chunk.treeShadowTexture) continue;
        if (!chunk.treeShadowTexture) {
            chunk.treeShadowTexture = acquireChunkCanvas(scene);
            chunk.treeShadowLayer = createChunkLayer(scene, chunk.treeShadowTexture, chunk.pixelX, chunk.pixelY, 2);
            chunk.treeShadowImage = chunk.treeShadowTexture.getContext().createImageData(CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE);
        }
        const image = chunk.treeShadowImage;
        image.data.fill(0);
        const water = chunk.waterShadowBase ? (chunk.treeWaterShadowImage ||= new ImageData(new Uint8ClampedArray(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE * 4), CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE)) : null;
        if (water) water.data.set(chunk.waterShadowBase);
        for (const pixel of contact) points.add(pixel);
        const colors = chunk.treeShadowColors ||= new Int32Array(CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE).fill(-2);
        for (const pixel of points) {
            const worldX = left + pixel % CHUNK_PIXEL_SIZE;
            const worldY = top + Math.floor(pixel / CHUNK_PIXEL_SIZE);
            if (water?.data[pixel * 4] && isWaterPixel(scene, worldX, worldY)) {
                water.data[pixel * 4] = 128;
                continue;
            }
            if (colors[pixel] === -2) {
                const ground = getGroundShadowColor(scene, worldX, worldY);
                colors[pixel] = ground ? (ground[0] << 16) | (ground[1] << 8) | ground[2] : -1;
            }
            const packed = colors[pixel];
            if (packed < 0) continue;
            const color = contact.has(pixel) ? shadeColor(packed >> 16, packed >> 8 & 255, packed & 255) : null;
            writeRGBPixel(image.data, pixel, color ? (color[0] << 16) | (color[1] << 8) | color[2] : packed);
        }
        chunk.treeShadowTexture.getContext().putImageData(image, 0, 0);
        chunk.treeShadowTexture.refresh();
        chunk.treeShadowLayer.setVisible(chunk.visible);
        if (water) {
            chunk.waterTexture.getContext().putImageData(water, 0, 0);
            chunk.waterTexture.refresh();
        }
    }
}

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
    for (let dy = -2; dy <= 4; dy++) for (let dx = -2; dx <= 3; dx++) {
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
            if ([...npcHouseCache.values()].some(house => house && x < house.x + 2 && x + 2 > house.x && y < house.y + 3 && y + 3 > house.y)) continue;
            let clear = true;
            for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) {
                if (!isNpcStandingTile(x + dx, y + dy) || !isNpcWalkableTile(x + dx, y + dy) || dy < 2 && getNpcAt(x + dx, y + dy)) clear = false;
            }
            if (!clear) continue;
            const house = { id, x, y, doorX: x + 1, doorY: y + 2, residents: residents.map(resident => resident.id) };
            npcHouseCache.set(id, house);
            npcHouseTiles.add(getTileId(x, y + 1)); npcHouseTiles.add(getTileId(x + 1, y + 1));
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
            sprite = scene.add.image(house.x * TILE_SIZE, house.y * TILE_SIZE, 'house').setOrigin(0).setDepth((house.y + 2) * TILE_SIZE);
            worldObjectLayer.add(sprite); npcHouseSprites.set(house.id, sprite);
        }
        const left = character.x + CHARACTER_HITBOX_X, right = left + CHARACTER_HITBOX_WIDTH, bottom = character.y + CHARACTER_HITBOX_Y + CHARACTER_HITBOX_HEIGHT;
        const hiding = character.visible !== false && right > sprite.x && left < sprite.x + 2 * TILE_SIZE && bottom > sprite.y && bottom < sprite.y + 2 * TILE_SIZE;
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
            npc.bubble = scene.add.text(npc.x - 40, npc.y - 26, '', { fontFamily: 'm6x11', fontSize: '11px', color: '#e0f2fd', backgroundColor: '#36160d', padding: { x: 3, y: 2 }, wordWrap: { width: 110 } }).setOrigin(0).setVisible(false);
            npc.line = scene.add.graphics();
            npc.waterShadow = scene.add.graphics().setDepth(1.25);
            worldObjectLayer.add([npc.sprite, npc.line, npc.bubble]);
            shadowLayer.add(npc.shadow);
            sprites.push(npc.sprite, npc.shadow, npc.line, npc.waterShadow, npc.bubble);
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
        if (npc.house && actorBlocksRect({ x: npc.house.x * TILE_SIZE, y: npc.house.y * TILE_SIZE }, 0, TILE_SIZE, TILE_SIZE * 2, TILE_SIZE, left, top, right, bottom)) return true;
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

const rainDrops = [];
let skyOverlay = null;
let skyColor = -1;
let rainGraphics = null;
let rainRandom = null;
let rainSpawnCarry = 0;
let worldClockText = null, worldClockLayer = null;

function getWorldClock(now = Date.now()) {
    const days = now / (DAY_LENGTH_MINUTES * 60000) + (WORLD_SEED % 997) / 997;
    const day = Math.floor(days);
    return { day, hour: (days - day) * 24 };
}

function getWeatherHash(day, index, salt) {
    return coordinateHash(day, index, Math.imul(WORLD_SEED + salt, WORLD_HASH_MULTIPLIER));
}

function getRainWindow(day) {
    if (getWeatherHash(day, 0, 1401) >= RAIN_CHANCE) return null;
    const start = RAIN_EARLIEST_HOUR + getWeatherHash(day, 1, 1401) * (RAIN_LATEST_START_HOUR - RAIN_EARLIEST_HOUR);
    return [start, Math.min(RAIN_LATEST_END_HOUR, start + RAIN_MIN_HOURS + getWeatherHash(day, 2, 1401) * RAIN_HOUR_RANGE)];
}

function getRainIntensity(clock) {
    const window = getRainWindow(clock.day);
    if (!window) return 0;
    return Phaser.Math.Clamp(Math.min(clock.hour - window[0], window[1] - clock.hour) / RAIN_FADE_HOURS, 0, 1);
}

function createSky(scene) {
    const clockLayer = createTextLayer(28, { fontSize: '11px', color: '#e0f2fd', textShadow: '1px 1px rgba(0, 0, 0, 0.65)' });
    worldClockText = createUIText(clockLayer, 8, 8, '#e0f2fd', 144);
    createUIText(clockLayer, 8, 20, '#e0f2fd', 144).textContent = 'H - return to spawn';
    worldClockLayer = addHudLayer(scene, clockLayer, 0, 211).setVisible(true);
    skyOverlay = scene.add.rectangle(0, 0, mainCamera.width, mainCamera.height, 0xffffff)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(SKY_DEPTH)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    rainGraphics = scene.add.graphics().setDepth(RAIN_DEPTH);
    rainRandom = createSeededRandom(Math.imul(WORLD_SEED + 1402, WORLD_HASH_MULTIPLIER));
}

function landRainDrop(scene, time, x, y) {
    if (isWaterPixel(scene, x, y)) {
        spawnParticle(scene, shadowLayer, time, x - 1, y, -1, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR);
        spawnParticle(scene, shadowLayer, time, x + 1, y, 1, 0, RAIN_RIPPLE_LIFETIME, RAIN_RIPPLE_COLOR);
    } else {
        spawnParticle(scene, shadowLayer, time, x, y, 0, -1, RAIN_FLECK_LIFETIME, RAIN_COLOR);
    }
}

function updateRain(scene, time, delta, intensity) {
    rainSpawnCarry += intensity * RAIN_DROPS_PER_SECOND * Math.min(delta, 50) / 1000;
    while (rainSpawnCarry >= 1) {
        rainSpawnCarry--;
        const landX = Math.round(mainCamera.scrollX + rainRandom() * (mainCamera.width + RAIN_DRIFT));
        const landY = Math.round(mainCamera.scrollY + rainRandom() * mainCamera.height);
        const duration = (RAIN_FALL_MIN + rainRandom() * RAIN_FALL_RANGE) / RAIN_SPEED * 1000;
        rainDrops.push({ landX, landY, born: time, duration });
    }

    rainGraphics.clear();
    if (!rainDrops.length) return;
    rainGraphics.fillStyle(RAIN_COLOR, RAIN_ALPHA);
    for (let index = rainDrops.length - 1; index >= 0; index--) {
        const drop = rainDrops[index];
        const remaining = 1 - (time - drop.born) / drop.duration;
        if (remaining <= 0) {
            landRainDrop(scene, time, drop.landX, drop.landY);
            rainDrops[index] = rainDrops[rainDrops.length - 1];
            rainDrops.pop();
            continue;
        }
        const seconds = remaining * drop.duration / 1000;
        rainGraphics.fillRect(Math.round(drop.landX - RAIN_DRIFT * seconds), Math.round(drop.landY - RAIN_SPEED * seconds) - RAIN_STREAK, 1, RAIN_STREAK);
    }
}

function updateSky(scene, time, delta) {
    if (!skyOverlay) return;
    if (worldClockLayer) worldClockLayer.setVisible(!startup && !isMenuOpen() && !spawnReturn);
    const clock = getWorldClock();
    if (worldClockText) setUITextContent(worldClockText, `${String(Math.floor(clock.hour)).padStart(2, '0')}:${String(Math.floor(clock.hour * 60) % 60).padStart(2, '0')}`);
    const rain = getRainIntensity(clock);
    const light = blendBiomeStops(SKY_LIGHT_STOPS, clock.hour);
    const dim = 1 - rain * RAIN_DIM;
    const color = light.reduce((total, value, channel) => total | Math.round(255 * Phaser.Math.Clamp(value * dim, 0, 1)) << (16 - channel * 8), 0);

    if (color !== skyColor) {
        skyColor = color;
        skyOverlay.setFillStyle(color);
    }
    if (skyOverlay.width !== mainCamera.width || skyOverlay.height !== mainCamera.height) skyOverlay.setSize(mainCamera.width, mainCamera.height);
    updateRain(scene, time, delta, rain);
}

const fireflies = [];
let fireflyGlow = null;

function getNightLevel(clock) {
    const light = blendBiomeStops(SKY_LIGHT_STOPS, clock.hour);
    return Phaser.Math.Clamp((1 - (light[0] + light[1] + light[2]) / 3) / FIREFLY_DARK_LEVEL, 0, 1) * (1 - getRainIntensity(clock));
}

function createFireflies(scene) {
    fireflyGlow = scene.add.graphics().setDepth(SKY_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
}

const isNearFireflyWater = (tileX, tileY) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([stepX, stepY]) => [1, FIREFLY_WATER_TILES].some(reach => getTerrainType(tileX + stepX * reach, tileY + stepY * reach) === 'water'));

function placeFirefly(fly, time) {
    const x = mainCamera.scrollX - FIREFLY_MARGIN + Math.random() * (mainCamera.width + FIREFLY_MARGIN * 2);
    const y = mainCamera.scrollY - FIREFLY_MARGIN + Math.random() * (mainCamera.height + FIREFLY_MARGIN * 2);
    const grassy = getTerrainType(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)) === 'grass' && isNearFireflyWater(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));
    Object.assign(fly, { x, y, grassy, born: time, life: FIREFLY_LIFE_MIN + Math.random() * FIREFLY_LIFE_RANGE, heading: Math.random() * Math.PI * 2, height: FIREFLY_MIN_HEIGHT + Math.random() * FIREFLY_HEIGHT_RANGE, phase: Math.random() * 1000 });
}

function updateFireflies(time, delta) {
    if (!fireflyGlow) return;
    fireflyGlow.clear();
    const night = getNightLevel(getWorldClock());
    if (night <= 0) return;
    const step = Math.min(delta, 50) / 1000;
    const centerX = mainCamera.scrollX + mainCamera.width / 2, centerY = mainCamera.scrollY + mainCamera.height / 2;
    while (fireflies.length < FIREFLY_COUNT) fireflies.push({ born: 0, life: 0, grassy: false });
    for (const fly of fireflies) {
        const age = time - fly.born;
        if (age > fly.life || !fly.grassy) { placeFirefly(fly, time); continue; }
        fly.heading += Math.sin(time * FIREFLY_TURN_RATE + fly.phase) * FIREFLY_TURN * step;
        fly.x += Math.cos(fly.heading) * FIREFLY_SPEED * step;
        fly.y += Math.sin(fly.heading) * FIREFLY_SPEED * step;
        const height = fly.height + Math.sin(time * FIREFLY_BOB_RATE + fly.phase * 3) * FIREFLY_BOB;
        const lift = height / FIREFLY_CAMERA_HEIGHT;
        const screenX = Math.round(fly.x + (fly.x - centerX) * lift);
        const screenY = Math.round(fly.y + (fly.y - centerY) * lift - height);
        const pulse = Math.pow(Math.max(0, Math.sin(time * FIREFLY_PULSE_RATE + fly.phase)), 4);
        const glow = night * Math.min(1, age / FIREFLY_FADE, (fly.life - age) / FIREFLY_FADE) * (FIREFLY_BASE_GLOW + (1 - FIREFLY_BASE_GLOW) * pulse);
        const size = height > FIREFLY_NEAR_HEIGHT ? 2 : 1, groundX = Math.round(fly.x), groundY = Math.round(fly.y);
        fireflyGlow.fillStyle(FIREFLY_POOL_COLOR, glow * FIREFLY_POOL_ALPHA * (1 - height / FIREFLY_MAX_HEIGHT)).fillRect(groundX - 2, groundY - 1, 5, 3).fillRect(groundX - 1, groundY - 2, 3, 5);
        fireflyGlow.fillStyle(FIREFLY_HALO_COLOR, glow * FIREFLY_HALO_ALPHA * 0.4).fillRect(screenX - 2, screenY, size + 4, size).fillRect(screenX, screenY - 2, size, size + 4);
        fireflyGlow.fillStyle(FIREFLY_HALO_COLOR, glow * FIREFLY_HALO_ALPHA).fillRect(screenX - 1, screenY - 1, size + 2, size + 2);
        fireflyGlow.fillStyle(FIREFLY_CORE_COLOR, glow).fillRect(screenX, screenY, size, size);
    }
}

const rumorCache = new Map();
const heardRumors = new Map();
const RUMOR_SPECIES = FISH_SPECIES.filter(species => species.size === 'large' || species.size === 'giant');
const RUMOR_DIRECTIONS = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];

function getRumorHotspot(cellX, cellY, day) {
    const key = `${getTileId(cellX, cellY)}:${day}:${typeof getMysteryCycle === 'function' ? getMysteryCycle() : 0}`;
    const cached = rumorCache.get(key);
    if (cached !== undefined) return cached;

    const salt = Math.imul(WORLD_SEED + 1601 + day * 7919, WORLD_HASH_MULTIPLIER);
    let hotspot = null;
    for (let attempt = 0; attempt < RUMOR_ATTEMPTS && !hotspot; attempt++) {
        const chunkX = cellX * RUMOR_CELL_CHUNKS + Math.min(RUMOR_CELL_CHUNKS - 1, Math.floor(coordinateHash(cellX * 31 + attempt, cellY, salt) * RUMOR_CELL_CHUNKS));
        const chunkY = cellY * RUMOR_CELL_CHUNKS + Math.min(RUMOR_CELL_CHUNKS - 1, Math.floor(coordinateHash(cellX, cellY * 31 + attempt, salt) * RUMOR_CELL_CHUNKS));
        let waterTiles = 0;
        for (let y = 0; y < CHUNK_SIZE; y += 2) {
            for (let x = 0; x < CHUNK_SIZE; x += 2) {
                if (getTerrainType(chunkX * CHUNK_SIZE + x, chunkY * CHUNK_SIZE + y) === 'water') waterTiles += 4;
            }
        }
        const area = waterTiles * TILE_SIZE * TILE_SIZE;
        const mystery = typeof getCurrentMysteryBait === 'function' ? getCurrentMysteryBait()?.attracts : null, candidates = mystery && !RUMOR_SPECIES.includes(mystery) ? RUMOR_SPECIES.concat(mystery) : RUMOR_SPECIES, options = candidates.filter(species => area >= species.minWater);
        if (!options.length) continue;
        hotspot = { key, day, chunkX, chunkY, species: options[Math.min(options.length - 1, Math.floor(coordinateHash(chunkX, chunkY, salt) * options.length))] };
    }
    return cacheWorldValue(rumorCache, key, hotspot);
}

function getChunkRumor(chunkX, chunkY) {
    const day = getWorldClock().day;
    const hotspot = getRumorHotspot(Math.floor(chunkX / RUMOR_CELL_CHUNKS), Math.floor(chunkY / RUMOR_CELL_CHUNKS), day);
    return hotspot && Math.abs(hotspot.chunkX - chunkX) <= 1 && Math.abs(hotspot.chunkY - chunkY) <= 1 ? hotspot : null;
}

function findNearestRumor(tileX, tileY) {
    const day = getWorldClock().day;
    const chunkX = Math.floor(tileX / CHUNK_SIZE), chunkY = Math.floor(tileY / CHUNK_SIZE);
    const cellX = Math.floor(chunkX / RUMOR_CELL_CHUNKS), cellY = Math.floor(chunkY / RUMOR_CELL_CHUNKS);
    let nearest = null;
    let nearestDistance = Infinity;
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            const hotspot = getRumorHotspot(cellX + offsetX, cellY + offsetY, day);
            if (!hotspot) continue;
            const x = (hotspot.chunkX + 0.5) * CHUNK_SIZE - tileX, y = (hotspot.chunkY + 0.5) * CHUNK_SIZE - tileY;
            const distance = Math.hypot(x, y);
            if (distance < nearestDistance) [nearest, nearestDistance] = [{ hotspot, x, y, distance }, distance];
        }
    }
    return nearest;
}

function describeRumor(rumor, line) {
    const direction = RUMOR_DIRECTIONS[(Math.round(Math.atan2(rumor.y, rumor.x) / (Math.PI / 4)) + 8) % 8];
    const distance = rumor.distance < RUMOR_NEAR_TILES ? 'just' : rumor.distance < RUMOR_FAR_TILES ? 'a short walk' : 'a long walk';
    return line.replaceAll('{species}', rumor.hotspot.species.name).replaceAll('{where}', `${distance} to the ${direction}`);
}

function hearRumor(rumor) {
    heardRumors.set(rumor.hotspot.key, rumor.hotspot);
    mapDirty = true;
}

const fishJumps = [];
const fishJumpGraphics = [];
let fishJumpRandom = null;
let nextFishJumpAt = 0;

function splashFishJump(scene, time, x, y) {
    idleRipple(scene, time, x, y, scene.children, 1.3);
    for (let index = 0; index < FISH_JUMP_DROPLETS; index++) {
        spawnParticle(scene, scene.children, time, x - 1 + index, y - 1, index - 1, -1, FISH_JUMP_DROPLET_LIFETIME, FISH_JUMP_DROPLET_COLOR, 1.3);
    }
}

function drawFishSilhouette(graphics, fish, centerX, centerY, headingX, headingY, color) {
    const halfLength = fish.length * 0.5, radius = fish.radius, head = halfLength - radius;
    const bound = Math.ceil(halfLength + radius + Math.abs(fish.amplitude) + 1);
    graphics.clear().fillStyle(color, 1);
    for (let y = -bound; y <= bound; y++) {
        for (let x = -bound; x <= bound; x++) {
            const localX = x + 0.5, localY = y + 0.5;
            const along = localX * headingX + localY * headingY;
            const spine = Phaser.Math.Clamp((halfLength - along) / fish.length, 0, 1);
            const across = localX * -headingY + localY * headingX - fish.amplitude * spine * spine * Math.sin(spine * 5.6 - fish.phase);
            const headOffset = along - head;
            const inside = headOffset * headOffset + across * across < radius * radius ||
                along < head && along > -halfLength && Math.abs(across) < radius * (along + halfLength) / (head + halfLength);
            if (inside) graphics.fillRect(centerX + x, centerY + y, 1, 1);
        }
    }
}

function pickJumpingFish() {
    const left = mainCamera.scrollX, top = mainCamera.scrollY;
    let total = 0;
    const candidates = [];
    for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;
        for (const fish of chunk.fish) {
            if (fish.jumping || fish.npcLured || fish === fishing?.targetFish || fish.state === 'lure' || fish.state === 'flee') continue;
            if (fish.x < left || fish.y < top || fish.x > left + mainCamera.width || fish.y > top + mainCamera.height) continue;
            const weight = (fish.size === 'large' || fish.size === 'giant' ? FISH_JUMP_BIG_WEIGHT : 1) * (fish.rumor ? FISH_JUMP_RUMOR_WEIGHT : 1);
            total += weight;
            candidates.push([fish, chunk, weight]);
        }
    }
    let roll = fishJumpRandom() * total;
    for (const candidate of candidates) {
        roll -= candidate[2];
        if (roll <= 0) return candidate;
    }
    return null;
}

function startFishJump(scene, time) {
    const picked = pickJumpingFish();
    if (!picked) return;
    const [fish, chunk] = picked;
    const distance = FISH_JUMP_DISTANCE + fish.length * 0.5;
    let heading = fish.heading;
    let toX = fish.x + Math.cos(heading) * distance, toY = fish.y + Math.sin(heading) * distance;
    if (!canFishSwim(chunk, fish, toX, toY)) {
        heading += Math.PI;
        toX = fish.x + Math.cos(heading) * distance;
        toY = fish.y + Math.sin(heading) * distance;
        if (!canFishSwim(chunk, fish, toX, toY)) return;
    }

    const graphics = fishJumpGraphics.pop() || scene.add.graphics();
    graphics.setVisible(true).setDepth(1.3);
    fish.jumping = true;
    const color = tintMapColor(FISHING_WATER_SHADOW_COLOR, getWaterTint(fish.x, fish.y));
    fishJumps.push({ fish, graphics, color, fromX: fish.x, fromY: fish.y, toX, toY, heading, start: time, height: FISH_JUMP_HEIGHT + fish.length * 0.4 });
    splashFishJump(scene, time, Math.round(fish.x), Math.round(fish.y));
}

function updateFishJumps(scene, time) {
    fishJumpRandom ||= createSeededRandom(Math.imul(WORLD_SEED + 1501, WORLD_HASH_MULTIPLIER));
    if (time >= nextFishJumpAt) {
        nextFishJumpAt = time + FISH_JUMP_MIN + fishJumpRandom() * FISH_JUMP_RANGE;
        startFishJump(scene, time);
    }

    for (let index = fishJumps.length - 1; index >= 0; index--) {
        const jump = fishJumps[index];
        const amount = Math.min(1, (time - jump.start) / FISH_JUMP_TIME);
        const x = jump.fromX + (jump.toX - jump.fromX) * amount;
        const y = jump.fromY + (jump.toY - jump.fromY) * amount - Math.sin(amount * Math.PI) * jump.height;
        const pitch = (amount - 0.5) * FISH_JUMP_TILT * 2;
        const side = Math.cos(jump.heading) < 0 ? -1 : 1;
        const tilt = jump.heading + pitch * side;
        drawFishSilhouette(jump.graphics, jump.fish, Math.round(x), Math.round(y), Math.cos(tilt), Math.sin(tilt), jump.color);
        if (amount < 1) continue;

        jump.fish.x = jump.toX;
        jump.fish.y = jump.toY;
        jump.fish.jumping = false;
        splashFishJump(scene, time, Math.round(jump.toX), Math.round(jump.toY));
        jump.graphics.clear().setVisible(false);
        fishJumpGraphics.push(jump.graphics);
        fishJumps[index] = fishJumps[fishJumps.length - 1];
        fishJumps.pop();
    }
}

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

let mysteryDeal = null;

function getMysteryDeal(cycle = getMysteryCycle()) {
    if (mysteryDeal?.cycle === cycle) return mysteryDeal.item;
    const random = createSeededRandom(Math.imul(WORLD_SEED + 1703 + cycle, WORLD_HASH_MULTIPLIER));
    const discount = 1 - DEAL_DISCOUNT_MIN - random() * DEAL_DISCOUNT_RANGE;
    let item;
    if (random() < DEAL_ROD_CHANCE) {
        const rod = MARKET_RODS[Math.floor(random() * MARKET_RODS.length)];
        item = { ...rod, was: rod.price, price: Math.max(1, Math.round(rod.price * discount)) };
    } else {
        const others = MYSTERY_BAITS.filter(bait => bait !== getMysteryBait(cycle));
        const bait = random() < DEAL_MYSTERY_CHANCE ? others[Math.floor(random() * others.length)] : MARKET_BAITS[Math.floor(random() * MARKET_BAITS.length)];
        const bundle = DEAL_BUNDLE_MIN + Math.floor(random() * DEAL_BUNDLE_RANGE);
        const was = Math.round(bait.price / bait.bundle * bundle);
        item = { ...bait, bundle, was, price: Math.max(1, Math.round(was * discount)) };
    }
    mysteryDeal = { cycle, item };
    return item;
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

const fishMigrations = [];
let fishRegionStack;
let fishRegionPixels;

function getChunkPixelIndex(chunk, x, y) {
    const localX = Math.floor(x) - chunk.pixelX;
    const localY = Math.floor(y) - chunk.pixelY;

    return localX < 0 || localY < 0 || localX >= CHUNK_PIXEL_SIZE || localY >= CHUNK_PIXEL_SIZE
        ? -1
        : localY * CHUNK_PIXEL_SIZE + localX;
}

function queueFishMigration(chunk, fish) {
    if (getChunkPixelIndex(chunk, fish.x, fish.y) !== -1) return;

    const targetChunk = getFishChunkAt(fish.x, fish.y);
    if (targetChunk && targetChunk !== chunk && loadedWaterChunks.has(targetChunk)) {
        fishMigrations.push(chunk, targetChunk, fish);
    }
}

function getFishDepth(chunk, x, y) {
    const index = getChunkPixelIndex(chunk, x, y);
    return index === -1 ? 0 : chunk.shoreDistances[index];
}

function getFishChunkAt(x, y) {
    return loadedChunks.get(getChunkKey(Math.floor(x / CHUNK_PIXEL_SIZE), Math.floor(y / CHUNK_PIXEL_SIZE)));
}

function getFishRegionAt(chunk, x, y) {
    const index = chunk?.fishRegions ? getChunkPixelIndex(chunk, x, y) : -1;
    return index === -1 ? 0 : chunk.fishRegions[index];
}

function canFishSwim(chunk, fish, x, y) {
    const ownIndex = getChunkPixelIndex(chunk, x, y);
    const targetChunk = ownIndex !== -1 ? chunk : getFishChunkAt(x, y);
    const index = ownIndex !== -1 ? ownIndex : targetChunk?.fishRegions ? getChunkPixelIndex(targetChunk, x, y) : -1;

    if (index === -1 || !targetChunk.fishRegions || targetChunk.shoreDistances[index] < FISH_MIN_DEPTH + fish.radius) {
        return false;
    }

    const targetRegion = targetChunk.fishRegions[index];

    return targetRegion > 0 && (targetChunk !== chunk || targetRegion === fish.region);
}

function labelFishRegions(chunk) {
    const size = CHUNK_PIXEL_SIZE * CHUNK_PIXEL_SIZE;
    const lastRowStart = size - CHUNK_PIXEL_SIZE, lastColumn = CHUNK_PIXEL_SIZE - 1;
    const labels = new Uint16Array(size);
    const depths = chunk.shoreDistances;
    const stack = fishRegionStack ||= new Int32Array(size);
    const pixels = fishRegionPixels ||= new Uint32Array(size);
    const deep = pixel => !labels[pixel] && depths[pixel] >= FISH_MIN_DEPTH;
    const regions = [];
    let pixelCount = 0;
    let label = 0;
    let top = 0;

    const visit = pixel => {
        labels[pixel] = label;
        stack[top++] = pixel;
    };

    for (let start = 0; start < size; start++) {
        if (!deep(start)) continue;

        label++;
        const regionStart = pixelCount;

        visit(start);

        while (top > 0) {
            const pixel = stack[--top];
            const x = pixel % CHUNK_PIXEL_SIZE;

            pixels[pixelCount++] = pixel;
            if (x > 0 && deep(pixel - 1)) visit(pixel - 1);
            if (x < lastColumn && deep(pixel + 1)) visit(pixel + 1);
            if (pixel >= CHUNK_PIXEL_SIZE && deep(pixel - CHUNK_PIXEL_SIZE)) visit(pixel - CHUNK_PIXEL_SIZE);
            if (pixel < lastRowStart && deep(pixel + CHUNK_PIXEL_SIZE)) visit(pixel + CHUNK_PIXEL_SIZE);
        }

        regions.push({ start: regionStart, length: pixelCount - regionStart });
    }

    chunk.fishRegions = labels;
    return regions;
}

function isFishPathClear(chunk, fish, targetX, targetY) {
    const fromX = fish.x, fromY = fish.y;
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 3);

    // Keep the endpoint arithmetic identical to the intermediate samples.
    if (steps > 0 && !canFishSwim(chunk, fish, fromX + dx * steps / steps, fromY + dy * steps / steps)) return false;

    for (let step = 1; step < steps; step++) {
        if (!canFishSwim(chunk, fish, fromX + dx * step / steps, fromY + dy * step / steps)) return false;
    }

    return true;
}

const fishSpawnPools = new Map();
const fishSpawnThresholds = [...new Set(FISH_SPECIES.map(species => species.minWater))].sort((a, b) => b - a);
let fishSpawnRandom = null;

function fishRandom() {
    return fishSpawnRandom ? fishSpawnRandom() : Math.random();
}

function spawnChunkFish(chunk) {
    fishSpawnRandom = createSeededRandom(coordinateHash(chunk.pixelX, chunk.pixelY, Math.imul(WORLD_SEED + 91, WORLD_HASH_MULTIPLIER)) * 4294967295);
    const regions = labelFishRegions(chunk);

    for (let regionIndex = 0; regionIndex < regions.length && chunk.fish.length < FISH_PER_CHUNK_MAX; regionIndex++) {
        const region = regions[regionIndex];

        if (region.length < FISH_MIN_REGION) continue;

        const count = Math.min(FISH_PER_CHUNK_MAX - chunk.fish.length, Math.max(1, Math.floor(region.length / FISH_WATER_PER_FISH)));

        spawnRegionFish(chunk, region, regionIndex + 1, count, chunk.pixelX, chunk.pixelY);
    }
    fishSpawnRandom = null;
}

function getFishSpawnPool(waterArea) {
    let threshold;
    for (const minWater of fishSpawnThresholds) if (waterArea >= minWater) { threshold = minWater; break; }
    const cached = fishSpawnPools.get(threshold);
    if (cached) return cached;

    const species = FISH_SPECIES.filter(species => waterArea >= species.minWater);
    const pool = { species, totalWeight: 0 };
    for (const fish of species) pool.totalWeight += fish.weight;
    fishSpawnPools.set(threshold, pool);
    return pool;
}

function chooseFishSpecies(waterArea, pool = getFishSpawnPool(waterArea)) {
    const { species: candidates, totalWeight } = pool;
    let roll = fishRandom() * totalWeight;

    for (const species of candidates) {
        roll -= species.weight;
        if (roll <= 0) return species;
    }

    return FISH_SPECIES[0];
}

function createFish(species, giantScale) {
    const giant = species.size === 'giant';
    const scale = giant ? giantScale : 1;
    const sizeDefinition = FISH_SIZE_CLASSES[giant ? 'large' : species.size];

    return {
        x: 0,
        y: 0,
        length: sizeDefinition.length * scale,
        radius: sizeDefinition.radius * scale,
        heading: fishRandom() * Math.PI * 2,
        topSpeed: 0,
        velocity: 0,
        phase: fishRandom() * Math.PI * 2,
        amplitude: 0,
        thrusting: false,
        burstTimer: 0,
        idleTurn: (fishRandom() - 0.5) * FISH_IDLE_TURN,
        state: 'idle',
        timer: fishRandom() * 2000,
        targetX: 0,
        targetY: 0,
        region: 0,
        size: species.size,
        species
    };
}

function spawnRegionFish(chunk, region, label, count, originX, originY) {
    const pool = getFishSpawnPool(region.length);
    const rumor = getChunkRumor(Math.floor(originX / CHUNK_PIXEL_SIZE), Math.floor(originY / CHUNK_PIXEL_SIZE));
    for (let index = 0; index < count; index++) {
        const rumored = rumor && region.length >= rumor.species.minWater && fishRandom() < RUMOR_SPAWN_CHANCE;
        const species = rumored ? rumor.species : chooseFishSpecies(region.length, pool);
        const fish = createFish(species, 2 + fishRandom() * 3);
        fish.rumor = rumored;
        fish.region = label;

        for (let attempt = 0; attempt < 40; attempt++) {
            const pixel = fishRegionPixels[region.start + Math.floor(fishRandom() * region.length)];
            const x = originX + pixel % CHUNK_PIXEL_SIZE + 0.5;
            const y = originY + Math.floor(pixel / CHUNK_PIXEL_SIZE) + 0.5;

            if (canFishSwim(chunk, fish, x, y)) {
                fish.x = x;
                fish.y = y;
                chunk.fish.push(fish);
                break;
            }
        }
    }
}

function spawnSturgeonAtCursor(scene) {
    const pointer = scene.input.activePointer;
    pointer.updateWorldPoint(mainCamera);

    const x = pointer.worldX;
    const y = pointer.worldY;
    const chunk = getFishChunkAt(x, y);
    const region = getFishRegionAt(chunk, x, y);

    if (!region) {
        showItemLabel(scene, 'No fish water there');
        return;
    }

    const species = FISH_SPECIES_BY_ID.get('sturgeon');

    for (let scale = 5; scale >= 1; scale -= 0.5) {
        const fish = createFish(species, scale);
        fish.region = region;

        if (canFishSwim(chunk, fish, x, y)) {
            fish.x = x;
            fish.y = y;
            chunk.fish.push(fish);
            showItemLabel(scene, 'Spawned a Sturgeon');
            return;
        }
    }

    showItemLabel(scene, 'Too shallow for a Sturgeon');
}

function chooseFishTarget(chunk, fish, awayX, awayY) {
    const fleeing = awayX !== undefined;
    const heading = fleeing ? Math.atan2(awayY, awayX) : 0, fromX = fish.x, fromY = fish.y;

    for (let attempt = 0; attempt < 8; attempt++) {
        const angle = fleeing ? heading + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2;
        const distance = fleeing ? 28 + Math.random() * 20 : 12 + Math.random() * 34;
        const targetX = fromX + Math.cos(angle) * distance;
        const targetY = fromY + Math.sin(angle) * distance;

        if (isFishPathClear(chunk, fish, targetX, targetY)) {
            fish.targetX = targetX;
            fish.targetY = targetY;
            return true;
        }
    }

    return false;
}

function setFishIdle(fish, timer) {
    fish.state = 'idle';
    fish.thrusting = false;
    fish.timer = timer;
}

function moveFishForward(chunk, fish, seconds) {
    if (fish.velocity === 0 || seconds === 0) return canFishSwim(chunk, fish, fish.x, fish.y);
    const nextX = fish.x + Math.cos(fish.heading) * fish.velocity * seconds;
    const nextY = fish.y + Math.sin(fish.heading) * fish.velocity * seconds;

    if (!canFishSwim(chunk, fish, nextX, nextY)) return false;

    fish.x = nextX;
    fish.y = nextY;
    return true;
}

function turnFishToward(fish, heading, maxTurn) {
    const offset = heading - fish.heading;
    const turn = Math.atan2(Math.sin(offset), Math.cos(offset));
    fish.heading += Phaser.Math.Clamp(turn, -maxTurn, maxTurn);
    return turn;
}

function startFishFlee(fish, burst) {
    fish.state = 'flee';
    fish.topSpeed = FISH_FLEE_SPEED;
    fish.thrusting = true;
    fish.burstTimer = burst;
}

function animateFishTail(fish, seconds, beat, sweep, response) {
    fish.phase = (fish.phase + Math.PI * 2 * beat * seconds) % (Math.PI * 2);
    fish.amplitude += (fish.length * sweep - fish.amplitude) * Math.min(1, seconds * response);
}

function scatterFishFromSplash(x, y) {
    const radius = 12;
    const radiusSquared = radius * radius;
    const fled = [];

    for (const chunk of loadedWaterChunks) {
        if (!chunk.fish.length) continue;
        const distanceX = Math.max(chunk.pixelX - x, 0, x - chunk.pixelX - CHUNK_PIXEL_SIZE);
        const distanceY = Math.max(chunk.pixelY - y, 0, y - chunk.pixelY - CHUNK_PIXEL_SIZE);
        if (distanceX * distanceX + distanceY * distanceY > radiusSquared) continue;
        for (const fish of chunk.fish) {
            if (fishing && fishing.targetFish === fish) continue;

            const awayX = fish.x - x;
            const awayY = fish.y - y;

            if (
                awayX * awayX + awayY * awayY > radiusSquared ||
                !chooseFishTarget(chunk, fish, awayX, awayY)
            ) {
                continue;
            }

            startFishFlee(fish, 700);
            fled.push(fish);
        }
    }
    return fled;
}

const hookedBobberPosition = new Int32Array(2);

function updateHookedFish(fish, seconds, delta) {
    const scene = mainCamera.scene;
    const spin = fishing.spin || (fishing.spin = {
        angle: Math.atan2(fish.y - fishing.toY, fish.x - fishing.toX),
        direction: Math.random() < 0.5 ? -1 : 1,
        centerX: fishing.toX,
        centerY: fishing.toY,
        radius: HOOKED_RADIUS_BASE + fish.length * HOOKED_RADIUS_PER_LENGTH,
        speed: Phaser.Math.Clamp(HOOKED_SPIN_BASE - fish.length * HOOKED_SPIN_PER_LENGTH, HOOKED_SPIN_MIN, HOOKED_SPIN_BASE),
        splashTimer: 0
    });
    const progress = fishing.game ? fishing.game.progress : 0;
    const [tipX, tipY] = getRodTip();
    const pull = progress * HOOKED_REEL_PULL, castX = fishing.toX, castY = fishing.toY;
    const targetX = castX + (tipX - castX) * pull;
    const targetY = castY + (tipY - castY) * pull;
    const centerPull = Math.min(1, seconds * 2);
    const nextCenterX = spin.centerX + (targetX - spin.centerX) * centerPull;
    const nextCenterY = spin.centerY + (targetY - spin.centerY) * centerPull;

    if (isWaterPixel(scene, Math.round(nextCenterX), Math.round(nextCenterY))) {
        spin.centerX = nextCenterX;
        spin.centerY = nextCenterY;
    }

    if (Math.random() < seconds * HOOKED_THRASH_RATE) spin.direction *= -1;

    const radius = spin.radius;
    const speed = spin.speed;

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

function migrateFishToChunk(chunk, targetChunk, fish) {
    const index = chunk.fish.indexOf(fish);
    const region = getFishRegionAt(targetChunk, fish.x, fish.y);

    if (index === -1 || !region) return false;

    chunk.fish.splice(index, 1);
    fish.region = region;
    targetChunk.fish.push(fish);

    if (fishing && fishing.targetFish === fish) fishing.targetChunk = targetChunk;
    return true;
}

function updateIdleFish(chunk, fish, seconds, delta) {
    fish.timer -= delta;
    fish.heading += fish.idleTurn * seconds;

    if (fish.timer <= 0) {
        if (!chooseFishTarget(chunk, fish)) {
            fish.timer = 500;
        } else {
            fish.state = 'swim';
            fish.topSpeed = FISH_SWIM_SPEED * (0.7 + Math.random() * 0.6);
            fish.thrusting = true;
            fish.burstTimer = FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE;
        }
    }
}

function updateSwimmingFish(chunk, fish, seconds, delta) {
    fish.burstTimer -= delta;

    if (fish.burstTimer <= 0) {
        if (fish.state === 'swim') {
            fish.thrusting = !fish.thrusting;
            fish.burstTimer = fish.thrusting ? FISH_BURST_MIN + Math.random() * FISH_BURST_RANGE : FISH_COAST_MIN + Math.random() * FISH_COAST_RANGE;
        } else {
            fish.state = 'swim';
            fish.topSpeed = FISH_SWIM_SPEED;
        }
    }

    const dx = fish.targetX - fish.x;
    const dy = fish.targetY - fish.y;
    if (dx * dx + dy * dy < 4) {
        setFishIdle(fish, FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE);
        fish.idleTurn = (Math.random() - 0.5) * FISH_IDLE_TURN;
    } else {
        const maxTurn = (fish.state === 'flee' ? FISH_FLEE_TURN : FISH_TURN) * seconds *
            (0.4 + Math.min(1, fish.velocity / FISH_SWIM_SPEED) * 0.6);
        const turn = turnFishToward(fish, Math.atan2(dy, dx), maxTurn);

        if (fish.thrusting && Math.abs(turn) <= Math.PI / 2) {
            const acceleration = fish.state === 'flee' ? FISH_FLEE_ACCELERATION : FISH_ACCELERATION;
            fish.velocity = Math.min(fish.topSpeed, fish.velocity + acceleration * seconds);
        }
    }
}

function updateFish(delta) {
    fishMigrations.length = 0;
    if (loadedWaterChunks.size === 0) return;
    const seconds = Math.min(delta, 50) / 1000;
    const thrustDrag = Math.exp(-FISH_DRAG * seconds);
    const coastDrag = Math.exp(-FISH_COAST_DRAG * seconds);
    const playerX = character.x + CHARACTER_SIZE / 2;
    const playerY = character.y + CHARACTER_SIZE - 2;
    const running = characterPace > 1 && characterMoving;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            if (fish.jumping) continue;
            if (fish.state === 'lure' && updateLuredFish(chunk, fish, delta)) {
                queueFishMigration(chunk, fish);
                continue;
            }

            if (running && fish.state !== 'flee') {
                const awayX = fish.x - playerX;
                const awayY = fish.y - playerY;

                if (awayX * awayX + awayY * awayY < FISH_SCARE_DISTANCE_SQUARED && chooseFishTarget(chunk, fish, awayX, awayY)) {
                    startFishFlee(fish, 900);
                }
            }

            if (fish.state === 'idle') {
                updateIdleFish(chunk, fish, seconds, delta);
            } else {
                updateSwimmingFish(chunk, fish, seconds, delta);
            }

            fish.velocity *= fish.thrusting ? thrustDrag : coastDrag;

            const beat = fish.thrusting
                ? FISH_BEAT_THRUST + fish.velocity * 0.12
                : fish.state === 'idle' ? FISH_BEAT_IDLE : FISH_BEAT_COAST;
            const sweep = fish.thrusting
                ? (fish.state === 'flee' ? FISH_SWEEP_FLEE : FISH_SWEEP_THRUST)
                : fish.state === 'idle' ? FISH_SWEEP_IDLE : FISH_SWEEP_COAST;

            animateFishTail(fish, seconds, beat, sweep, 6);

            if (!moveFishForward(chunk, fish, seconds)) {
                fish.velocity = 0;
                setFishIdle(fish, FISH_IDLE_MIN);
            }

            queueFishMigration(chunk, fish);
        }
    }

    for (let index = 0; index < fishMigrations.length; index += 3) {
        migrateFishToChunk(fishMigrations[index], fishMigrations[index + 1], fishMigrations[index + 2]);
    }
}

const castDirections = { left: [-1, 0], right: [1, 0], back: [0, -1], front: [0, 1] };
const waterFishingStates = new Set([
    'floating', 'landing', 'approaching', 'inspecting', 'nibbleWait', 'nibbleDip', 'bite', 'hooked', 'minigame', 'snagged'
]);
const tautFishingStates = new Set(['reeling', 'bite', 'hooked', 'minigame', 'snagged']);
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

function isWaterPixel(scene, x, y, tile) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    tile ||= getWorldTile(tileX, tileY);

    return getTerrainSurface(scene, tile).water[(y - tileY * TILE_SIZE) * TILE_SIZE + x - tileX * TILE_SIZE] === 1;
}

function getBaitLure() {
    return fishing?.bait ? fishing.bait.lure : 1;
}

function findFishForBobber() {
    const lure = getBaitLure();
    const noticeMaxDistanceSquared = FISH_NOTICE_MAX_DISTANCE_SQUARED * lure * lure;
    const noticeDot = FISH_NOTICE_DOT - (lure - 1) * 0.8;
    let nearestFish = null;
    let nearestChunk = null;
    let nearestDistanceSquared = Infinity;

    for (const chunk of loadedWaterChunks) {
        if (!chunk.fish.length) continue;
        const { bobberX, bobberY } = fishing;
        const chunkDX = Math.max(chunk.pixelX - bobberX, 0, bobberX - chunk.pixelX - CHUNK_PIXEL_SIZE);
        const chunkDY = Math.max(chunk.pixelY - bobberY, 0, bobberY - chunk.pixelY - CHUNK_PIXEL_SIZE);
        if (chunkDX * chunkDX + chunkDY * chunkDY > noticeMaxDistanceSquared) continue;

        for (const fish of chunk.fish) {
            if (fish.state === 'flee' || fish.state === 'lure') continue;

            const dx = bobberX - fish.x;
            const dy = bobberY - fish.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < FISH_NOTICE_MIN_DISTANCE_SQUARED || distanceSquared > noticeMaxDistanceSquared) continue;
            if (!(distanceSquared < nearestDistanceSquared)) continue;

            const facing = (Math.cos(fish.heading) * dx + Math.sin(fish.heading) * dy) / Math.sqrt(distanceSquared);

            if (facing >= noticeDot && isFishPathClear(chunk, fish, bobberX, bobberY)) {
                nearestFish = fish;
                nearestChunk = chunk;
                nearestDistanceSquared = distanceSquared;
            }
        }
    }

    return nearestFish ? { fish: nearestFish, chunk: nearestChunk } : null;
}

function releaseTargetFish(flee) {
    if (!fishing || !fishing.targetFish) return;

    const fish = fishing.targetFish;
    const chunk = fishing.targetChunk;
    const awayX = fish.x - fishing.bobberX;
    const awayY = fish.y - fishing.bobberY;

    fishing.targetFish = null;
    fishing.targetChunk = null;

    if (flee && chunk && chooseFishTarget(chunk, fish, awayX, awayY)) {
        startFishFlee(fish, 900);
        return;
    }

    fish.velocity = 0;
    setFishIdle(fish, FISH_IDLE_MIN + Math.random() * FISH_IDLE_RANGE);
}

function hookFish(time) {
    if (!fishing || fishing.state !== 'bite' || time > fishing.biteDeadline) return false;

    setFishingState('hooked', time);
    fishing.bobberY = fishing.toY + 2;
    useBait(fishing.bait);
    return true;
}

function startFishApproach(time) {
    const match = findFishForBobber();

    if (!match) {
        if (fishing.state !== 'floating') fishing.start = time;
        fishing.state = 'floating';
        fishing.nextFishScanAt = time + FISH_NOTICE_SCAN_TIME;
        return;
    }

    setFishingState('approaching', time);
    fishing.targetFish = match.fish;
    fishing.targetChunk = match.chunk;
    match.fish.state = 'lure';
    match.fish.lureTime = 0;
    match.fish.velocity *= 0.4;
}

function startFishBite(scene, time) {
    setFishingState('bite', time);
    fishing.biteDeadline = time + Phaser.Math.Linear(1050, 720, FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty);
    splash(scene, time, fishing.bobberX, fishing.bobberY);
}

const splashDirections = Array.from({ length: SPLASH_PARTICLES }, (_, index) => {
    const angle = index / SPLASH_PARTICLES * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
});
function splash(scene, time, x, y) {
    for (const fish of scatterFishFromSplash(x, y)) idleRipple(scene, time, Math.round(fish.x), Math.round(fish.y));
    const centerX = Math.round(x);
    const centerY = Math.round(y);

    for (let index = 0; index < SPLASH_PARTICLES; index++) {
        const [directionX, directionY] = splashDirections[index];
        if (index % 3 === 0) spawnParticle(scene, shadowLayer, time, centerX + Math.round(directionX * 2), centerY - 1, Math.sign(directionX), -1, 260, 0xbce6eb);

        spawnParticle(
            scene, shadowLayer, time, centerX, centerY, 0, 0, SPLASH_LIFETIME,
            index % 2 ? 0x7bbbd9 : 0x6aaad6, 0, directionX, directionY, true
        );
    }
}

function catchBurst(scene, time, x, y) {
    splash(scene, time, x, y);
    for (let index = 0; index < CATCH_SPARKLES; index++) {
        const offset = index - CATCH_SPARKLES / 2;
        spawnParticle(scene, worldObjectLayer, time, Math.round(x) + offset, Math.round(y) - 2 - (index % 2) * 2, Math.sign(offset + 0.5), -2, CATCH_SPARKLE_LIFETIME, CHEST_SPARKLE_COLORS[index % CHEST_SPARKLE_COLORS.length], Math.max(character.depth + 0.2, y));
    }
}

function groundLandingPuff(scene, time, x, y) {
    for (let index = 0; index < 3; index++) {
        spawnParticle(scene, shadowLayer, time, x - 1 + index, y, index - 1, -1, 220, DUST_COLORS[index]);
    }
}

let nextFishRiseAt = 0;

function spawnFishRise(scene, time) {
    if (time < nextFishRiseAt) return;
    nextFishRiseAt = time + FISH_RISE_MIN + Math.random() * FISH_RISE_RANGE;
    const left = mainCamera.scrollX, top = mainCamera.scrollY;
    const candidates = [];
    for (const chunk of loadedWaterChunks) {
        if (!chunk.visible) continue;
        for (const fish of chunk.fish) {
            if (fish.state !== 'flee' && fish.x > left && fish.x < left + mainCamera.width && fish.y > top && fish.y < top + mainCamera.height) candidates.push(fish);
        }
    }
    const fish = candidates[Math.floor(Math.random() * candidates.length)];
    if (fish && fish !== fishing?.targetFish) nibbleRipple(scene, time, Math.round(fish.x), Math.round(fish.y));
}

function idleRipple(scene, time, x, y, layer = shadowLayer, depth = 0) {
    spawnParticle(scene, layer, time, x - 2, y, -1, 0, BOBBER_RIPPLE_LIFETIME, BOBBER_RIPPLE_COLOR, depth);
    spawnParticle(scene, layer, time, x + 2, y, 1, 0, BOBBER_RIPPLE_LIFETIME, BOBBER_RIPPLE_COLOR, depth);
}

function nibbleRipple(scene, time, x, y) {
    for (let index = 0; index < 4; index++) {
        const horizontal = index < 2;
        const side = index % 2 === 0 ? -1 : 1;

        spawnParticle(
            scene, shadowLayer, time,
            x + (horizontal ? side * 2 : 0), y + (horizontal ? 0 : side),
            horizontal ? side : 0, 0, 180, index % 2 ? 0x6aaad6 : 0x7bbbd9
        );
    }
}

function spawnLineSnap(scene, time, rope) {
    if (!rope || !rope.points.length) return;

    const points = rope.points;
    const lastIndex = Math.max(1, points.length - 1);
    const stride = Math.max(1, Math.floor(points.length / 9));
    const palette = fishing?.rod?.linePalette, minimumDepth = character.depth + 0.2;

    for (let index = stride; index < points.length; index += stride) {
        const point = points[index];
        const amount = index / lastIndex;
        const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));

        spawnParticle(
            scene, worldObjectLayer, time, Math.round(point.x), Math.round(point.y),
            index % 2 ? -1 : 1, 1, 300, color, Math.max(minimumDepth, point.y)
        );
    }
}

function beginCast(time) {
    const active = fishing;

    if (fishing?.state === 'snagged') {
        haulChest(time);
    } else if (fishing && fishing.state !== 'minigame' && fishing.state !== 'hooked' && !hookFish(time)) {
        reelIn(time);
    }

    if (active || !hasRodSelected() || isMenuOpen() || castCharge) return;

    castCharge = { start: time, rod: getSelectedRod() };
}

function getCastPower(time) {
    const cycle = ((time - castCharge.start) / castCharge.rod.chargeTime) % 2;
    return cycle <= 1 ? cycle : 2 - cycle;
}

function releaseCast(time) {
    if (!castCharge) return;

    const power = getCastPower(time);
    castCharge = null;

    if (!hasRodSelected() || isMenuOpen()) return;

    const rod = getSelectedRod();
    const direction = getCastDirection(), [directionX, directionY] = direction;
    const [tipX, tipY] = getRodTip(undefined, direction);
    const distance = CAST_MIN_DISTANCE + (rod.castDistance - CAST_MIN_DISTANCE) * power;

    fishing = {
        state: 'casting',
        start: time,
        releaseAt: time + CAST_SWING_DURATION + CAST_HANG_TIME,
        power,
        rod,
        bait: getActiveBait(),
        duration: CAST_DURATION * (0.6 + power * 0.6),
        arc: CAST_ARC * (0.5 + power * 0.7),
        fromX: tipX,
        fromY: tipY,
        toX: Math.round(character.x + CHARACTER_SIZE / 2 + directionX * distance),
        toY: Math.round(character.y + CHARACTER_SIZE - 2 + directionY * distance),
        bobberX: tipX,
        bobberY: tipY,
        driftPhase: Math.random() * Math.PI * 2,
        rope: null
    };
    recordPlayerStat('casts');

    setCharacterTexture(`character-${characterDirection}`);
}

function reelIn(time) {
    if (!fishing || fishing.state === 'reeling') return;

    if (fishing.state === 'casting') {
        fishing = null;
        return;
    }

    releaseTargetFish(true);
    startReeling(time);
}

function startReeling(time) {
    setFishingState('reeling', time);
    fishing.fromX = fishing.bobberX;
    fishing.fromY = fishing.bobberY;
}

function startFishingMinigame(time) {
    const zoneHeight = fishing.rod.catchZone + (fishing.bait ? fishing.bait.zoneBonus : 0);
    const zoneY = FISHING_GAME_PLAY_HEIGHT - zoneHeight;
    const fishY = zoneY + zoneHeight / 2;
    const difficulty = FISH_SIZE_CLASSES[fishing.targetFish.size].difficulty;

    setFishingState('minigame', time);
    fishing.game = {
        zoneY,
        zoneHeight,
        zoneVelocity: 0,
        fishY,
        fishVelocity: 0,
        fishTargetY: fishY,
        targetTimer: 0,
        difficulty,
        progress: 0.22,
        tuning: {
            maxSpeed: Phaser.Math.Linear(28, 72, difficulty),
            acceleration: Phaser.Math.Linear(75, 220, difficulty),
            drag: Phaser.Math.Linear(5, 2.4, difficulty),
            targetInterval: Math.max(90, Phaser.Math.Linear(780, 230, difficulty)),
            gainRate: Phaser.Math.Linear(0.28, 0.17, difficulty),
            lossRate: Phaser.Math.Linear(0.19, 0.35, difficulty)
        }
    };
}

function finishFishingMinigame(scene, time, caught) {
    const fish = fishing.targetFish;
    const chunk = fishing.targetChunk;

    if (!caught) {
        spawnLineSnap(scene, time, fishing.rope);
        releaseTargetFish(true);
        splash(scene, time, fishing.bobberX, fishing.bobberY);
        fishing = null;
        return;
    }

    if (chunk) {
        const index = chunk.fish.indexOf(fish);
        if (index !== -1) chunk.fish.splice(index, 1);
    }

    const species = getMysteryCatchSpecies(fishing.bait, fish.species || FISH_SPECIES[0], playerStats.fishCaught || 0);
    const first = !catchLog.has(species.id);
    addCaughtFish(species);

    fishing.targetFish = null;
    fishing.targetChunk = null;
    catchBurst(scene, time, fishing.bobberX, fishing.bobberY);
    startReeling(time);
    showCatchCard(scene, time, species, first);
}

function addCaughtFish(species, caught = true) {
    fishInventory.set(species.id, Math.min(Number.MAX_SAFE_INTEGER, (fishInventory.get(species.id) || 0) + 1));
    catchLog.add(species.id);
    if (caught) recordPlayerStat('fishCaught');
    saveDirty = true;
}

function updateFishingMinigame(scene, time, delta) {
    const game = fishing.game;
    const seconds = Math.min(delta, 34) / 1000;
    const tuning = game.tuning, zoneHeight = game.zoneHeight;
    const fishHalfHeight = fishingFishMarker.height / 2;

    game.zoneVelocity += (fishingActionHeld ? -185 : 150) * seconds;
    game.zoneVelocity = Phaser.Math.Clamp(game.zoneVelocity * Math.exp(-2.4 * seconds), -72, 82);
    game.zoneY += game.zoneVelocity * seconds;

    if (game.zoneY < 0) {
        game.zoneY = 0;
        game.zoneVelocity = Math.max(0, game.zoneVelocity * -0.25);
    } else if (game.zoneY + zoneHeight > FISHING_GAME_PLAY_HEIGHT) {
        game.zoneY = FISHING_GAME_PLAY_HEIGHT - zoneHeight;
        game.zoneVelocity = Math.min(0, game.zoneVelocity * -0.3);
    }

    game.targetTimer -= delta;

    if (game.targetTimer <= 0) {
        game.fishTargetY = 4 + Math.random() * (FISHING_GAME_PLAY_HEIGHT - 8);
        game.targetTimer = tuning.targetInterval * (0.65 + Math.random() * 0.7);
    }

    game.fishVelocity += Math.sign(game.fishTargetY - game.fishY) * tuning.acceleration * seconds;
    game.fishVelocity *= Math.exp(-tuning.drag * seconds);
    game.fishVelocity = Phaser.Math.Clamp(game.fishVelocity, -tuning.maxSpeed, tuning.maxSpeed);
    game.fishY = Phaser.Math.Clamp(game.fishY + game.fishVelocity * seconds, fishHalfHeight, FISHING_GAME_PLAY_HEIGHT - fishHalfHeight);

    const inside = game.fishY >= game.zoneY && game.fishY <= game.zoneY + zoneHeight;
    const rate = inside
        ? tuning.gainRate
        : -tuning.lossRate / fishing.rod.lineStrength;

    game.progress = Phaser.Math.Clamp(game.progress + rate * seconds, 0, 1);

    if (game.progress >= 1 || game.progress <= 0) finishFishingMinigame(scene, time, game.progress >= 1);
}

function samplePalette(palette, amount) {
    if (!palette || palette.length === 0) return FISHING_LINE_COLOR;

    return palette[Math.round(Phaser.Math.Clamp(amount, 0, 1) * (palette.length - 1))];
}

function beginPixelPath() {
    pixelPathLength = 0;
}

function addPixelPathPoint(x, y, color) {
    if (pixelPathLength > 0 && pixelPathX[pixelPathLength - 1] === x && pixelPathY[pixelPathLength - 1] === y) {
        return;
    }

    if (pixelPathLength >= 2) {
        const previousX = pixelPathX[pixelPathLength - 2];
        const previousY = pixelPathY[pixelPathLength - 2];

        if (Math.abs(x - previousX) === 1 && Math.abs(y - previousY) === 1) {
            pixelPathLength--;
        }
    }

    if (pixelPathLength >= pixelPathX.length) {
        return;
    }

    pixelPathX[pixelPathLength] = x;
    pixelPathY[pixelPathLength] = y;
    pixelPathColor[pixelPathLength] = color;
    pixelPathLength++;
}

function drawPixelPath(graphics = fishingLine) {
    let activeColor = -1;

    for (let index = 0; index < pixelPathLength; index++) {
        if (pixelPathColor[index] !== activeColor) {
            activeColor = pixelPathColor[index];
            graphics.fillStyle(activeColor, 1);
        }

        const y = pixelPathY[index];
        let left = pixelPathX[index];
        let right = left;

        while (index + 1 < pixelPathLength && pixelPathColor[index + 1] === activeColor && pixelPathY[index + 1] === y) {
            const nextX = pixelPathX[index + 1];
            if (nextX === right + 1) right = nextX;
            else if (nextX === left - 1) left = nextX;
            else break;
            index++;
        }

        graphics.fillRect(left, y, right - left + 1, 1);
    }
}

function drawFishingWaterShadow(scene, fromHeight, toHeight, graphics = fishingWaterShadow) {
    if (!pixelPathLength) return;
    const lastIndex = Math.max(1, pixelPathLength - 1);
    const heightRange = toHeight - fromHeight;
    let previousX;
    let previousY;
    let water;
    let tileX;
    let tileY, tileOriginX, tileOriginY;
    const plot = (x, y) => {
        const nextTileX = Math.floor(x / TILE_SIZE);
        const nextTileY = Math.floor(y / TILE_SIZE);
        if (nextTileX !== tileX || nextTileY !== tileY) {
            water = getTerrainSurface(scene, getWorldTile(nextTileX, nextTileY)).water;
            tileX = nextTileX; tileOriginX = tileX * TILE_SIZE;
            tileY = nextTileY; tileOriginY = tileY * TILE_SIZE;
            graphics.fillStyle(tintMapColor(FISHING_WATER_SHADOW_COLOR, getWaterTint(tileOriginX + TILE_SIZE / 2, tileOriginY + TILE_SIZE / 2)), 1);
        }
        if (water[(y - tileOriginY) * TILE_SIZE + x - tileOriginX] === 1) graphics.fillRect(x, y, 1, 1);
    };
    for (let index = 0; index < pixelPathLength; index++) {
        const amount = index / lastIndex;
        const height = Math.max(0, fromHeight + heightRange * amount);
        const x = pixelPathX[index] + Math.round(height / 6);
        const y = pixelPathY[index] + Math.round(height);
        if (x === previousX && y === previousY) continue;
        const steps = previousX === undefined ? 0 : Math.max(Math.abs(x - previousX), Math.abs(y - previousY));
        for (let step = steps ? 1 : 0; step <= steps; step++) plot(steps ? Math.round(previousX + (x - previousX) * step / steps) : x, steps ? Math.round(previousY + (y - previousY) * step / steps) : y);
        previousX = x;
        previousY = y;
    }
}

function plotFishingLine(fromX, fromY, toX, toY, sag, palette, graphics = fishingLine) {
    const controlX = (fromX + toX) / 2;
    const controlY = (fromY + toY) / 2 + sag;
    const steps = Math.max(2, Math.ceil(Math.hypot(toX - fromX, toY - fromY) * 1.5));
    const color = palette ? 0 : fishingLine.defaultFillColor;

    beginPixelPath();

    for (let step = 0; step <= steps; step++) {
        const amount = step / steps;
        const inverse = 1 - amount;
        const fromWeight = inverse * inverse;
        const controlWeight = 2 * inverse * amount;
        const toWeight = amount * amount;
        const x = Math.round(fromWeight * fromX + controlWeight * controlX + toWeight * toX);
        const y = Math.round(fromWeight * fromY + controlWeight * controlY + toWeight * toY);

        addPixelPathPoint(x, y, palette ? samplePalette(palette, amount) : color);
    }

    drawPixelPath(graphics);
}

function createFishingRope(fromX, fromY, toX, toY, lineLength) {
    const segmentCount = Math.max(2, Math.ceil(lineLength / ROPE_SEGMENT_LENGTH));
    const points = [], spanX = toX - fromX, spanY = toY - fromY;

    for (let index = 0; index <= segmentCount; index++) {
        const amount = index / segmentCount;
        const x = fromX + spanX * amount;
        const y = fromY + spanY * amount;

        points.push({ x, y, oldX: x, oldY: y });
    }

    return { points, length: lineLength, segmentLength: lineLength / segmentCount };
}

function updateFishingRope(rope, fromX, fromY, toX, toY, delta, tautness) {
    const points = rope.points;
    const lastIndex = points.length - 1;
    const seconds = Math.min(delta, 34) / 1000;
    const gravity = ROPE_GRAVITY * seconds * seconds;
    const targetLength = Math.max(Math.hypot(toX - fromX, toY - fromY) + (1 - tautness) * 7, ROPE_SEGMENT_LENGTH);

    rope.length += (targetLength - rope.length) * Math.min(1, seconds * (tautness ? 14 : 5));
    rope.segmentLength = rope.length / lastIndex;
    const segmentLength = rope.segmentLength, firstPoint = points[0], lastPoint = points[lastIndex];

    for (let index = 1; index < lastIndex; index++) {
        const point = points[index];
        const velocityX = (point.x - point.oldX) * 0.985;
        const velocityY = (point.y - point.oldY) * 0.985;

        point.oldX = point.x;
        point.oldY = point.y;
        point.x += velocityX;
        point.y += velocityY + gravity;
    }

    for (let pass = 0; pass < ROPE_CONSTRAINT_PASSES; pass++) {
        firstPoint.x = fromX;
        firstPoint.y = fromY;
        lastPoint.x = toX;
        lastPoint.y = toY;

        for (let index = 0; index < lastIndex; index++) {
            const first = points[index];
            const second = points[index + 1];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const distance = Math.max(0.001, Math.hypot(dx, dy));
            const correction = (distance - segmentLength) / distance;
            const correctionX = dx * correction;
            const correctionY = dy * correction;
            const firstFixed = index === 0;
            const secondFixed = index + 1 === lastIndex;

            if (!firstFixed) {
                const share = secondFixed ? 1 : 0.5;
                first.x += correctionX * share;
                first.y += correctionY * share;
            }

            if (!secondFixed) {
                const share = firstFixed ? 1 : 0.5;
                second.x -= correctionX * share;
                second.y -= correctionY * share;
            }
        }
    }
}

function drawFishingRope(rope, palette, graphics = fishingLine) {
    const points = rope.points;
    const lastIndex = points.length - 1;
    const paletteSteps = Math.max(1, lastIndex - 1);

    beginPixelPath();

    for (let index = 0; index < lastIndex; index++) {
        const first = points[index];
        const second = points[index + 1];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
        const amount = index / paletteSteps;
        const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));

        for (let step = 0; step <= distance; step++) {
            const blend = step / distance;
            addPixelPathPoint(
                Math.round(first.x + dx * blend),
                Math.round(first.y + dy * blend),
                color
            );
        }
    }

    drawPixelPath(graphics);
}

let fishingGraphicsActive = true;
function setFishingState(state, time) {
    fishing.state = state;
    fishing.start = time;
}

function resumeFloating(time) {
    setFishingState('floating', time);
    fishing.nextFishScanAt = time + FISH_NOTICE_SCAN_TIME;
}

function updateWaterFishing(scene, time, delta) {
    const age = time - fishing.start;
    const state = fishing.state;
    const canDrift = state !== 'bite' && state !== 'hooked' && state !== 'snagged';
    const candidateX = canDrift ? fishing.toX + Math.round(Math.sin(age / 1300 + fishing.driftPhase)) : fishing.toX;
    const candidateY = canDrift ? fishing.toY + Math.round(Math.sin(age / 1700 + fishing.driftPhase * 0.7)) : fishing.toY;
    const drifts = canDrift && isWaterPixel(scene, candidateX, candidateY);

    fishing.bobberX = drifts ? candidateX : fishing.toX;
    fishing.bobberY = (drifts ? candidateY : fishing.toY) + (Math.floor(age / BOBBER_BOB_TIME) % 2);

    if ((state === 'floating' || state === 'approaching' || state === 'inspecting') && time >= (fishing.nextRippleAt ||= time + BOBBER_RIPPLE_INTERVAL)) {
        fishing.nextRippleAt = time + BOBBER_RIPPLE_INTERVAL;
        idleRipple(scene, time, fishing.bobberX, fishing.bobberY + 1);
    }

    if (state === 'floating' && time >= (fishing.nextFishScanAt || 0)) {
        startFishApproach(time);
    } else if (state === 'approaching') {
        const fish = fishing.targetFish;

        if (!fish || fish.state !== 'lure') {
            releaseTargetFish(false);
            resumeFloating(time);
        } else {
            const dx = fish.x - fishing.bobberX;
            const dy = fish.y - fishing.bobberY;
            const reach = fish.radius + 4;

            if (dx * dx + dy * dy <= reach * reach) {
                setFishingState('inspecting', time);
                fishing.inspectDuration = (FISH_INSPECT_MIN + Math.random() * FISH_INSPECT_RANGE) / getBaitLure();
                fish.velocity = 0;
            }
        }
    } else if (state === 'inspecting' && age >= fishing.inspectDuration) {
        setFishingState('nibbleWait', time);
        fishing.nibblesRemaining = Math.floor(Math.random() * 5 / getBaitLure());
        fishing.nextNibbleAt = time + 300 + Math.random() * 420;
    } else if (state === 'nibbleWait' && time >= fishing.nextNibbleAt) {
        if (fishing.nibblesRemaining > 0) {
            setFishingState('nibbleDip', time);
            fishing.nibbleRippleShown = false;
        } else {
            startFishBite(scene, time);
        }
    } else if (state === 'nibbleDip') {
        fishing.bobberY += Math.round(Math.sin(Math.min(1, age / FISH_NIBBLE_DIP_TIME) * Math.PI) * 2);

        if (!fishing.nibbleRippleShown && age >= FISH_NIBBLE_DIP_TIME * 0.25) {
            fishing.nibbleRippleShown = true;
            nibbleRipple(scene, time, fishing.bobberX, fishing.bobberY);
        }

        if (age >= FISH_NIBBLE_DIP_TIME) {
            setFishingState('nibbleWait', time);
            fishing.nibblesRemaining--;
            fishing.nextNibbleAt = time + 260 + Math.random() * 380;
        }
    } else if (state === 'bite' || state === 'snagged') {
        fishing.bobberY = fishing.toY + 3;

        if (state === 'bite' && time > fishing.biteDeadline) {
            releaseTargetFish(true);
            resumeFloating(time);
        }
    } else if (state === 'hooked' || state === 'minigame') {
        const hooked = getHookedBobber();

        if (hooked) {
            [fishing.bobberX, fishing.bobberY] = hooked;
        } else {
            fishing.bobberY = fishing.toY + 2;
        }

        if (state === 'minigame') {
            updateFishingMinigame(scene, time, delta);
        } else if (age >= 220) {
            startFishingMinigame(time);
        }
    }
}

function updateFishing(scene, time, delta, isWalking) {
    const interrupted = isWalking || isMenuOpen() || !hasRodSelected();

    if (fishingGraphicsActive) {
        fishingLine.clear();
        fishingWaterShadow.clear();
    }
    fishingGraphicsActive = Boolean(fishing || castCharge);
    if (castCharge && interrupted) castCharge = null;
    drawCastCharge(time);

    if (fishing && fishing.state !== 'reeling' && interrupted) reelIn(time);

    if (!fishing) {
        drawFishingMinigame();
        return;
    }

    let [tipX, tipY] = getRodTip(time);
    const age = time - fishing.start;

    if (fishing.state === 'casting') {
        fishing.bobberX = tipX;
        fishing.bobberY = tipY;

        if (time >= fishing.releaseAt) {
            setFishingState('flying', time);
            fishing.fromX = tipX;
            fishing.fromY = tipY;
            fishing.rope = createFishingRope(tipX, tipY, tipX, tipY - 2, Math.hypot(fishing.toX - tipX, fishing.toY - tipY) + fishing.arc * 0.8 + 5);
        }
    } else if (fishing.state === 'flying') {
        const amount = Math.min(1, age / fishing.duration);

        fishing.bobberX = Math.round(fishing.fromX + (fishing.toX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (fishing.toY - fishing.fromY) * amount - Math.sin(amount * Math.PI) * fishing.arc);

        if (amount >= 1 && !isWaterPixel(scene, fishing.toX, fishing.toY)) {
            groundLandingPuff(scene, time, fishing.toX, fishing.toY);
            fishing = null;
            return;
        }

        if (amount >= 1) {
            setFishingState('landing', time);
            splash(scene, time, fishing.toX, fishing.toY);
        }
    } else if (fishing.state === 'landing') {
        const amount = Math.min(1, age / BOBBER_LAND_TIME);

        fishing.bobberX = fishing.toX;
        fishing.bobberY = fishing.toY - Math.round(Math.sin(amount * Math.PI) * 2 * (1 - amount));

        if (amount >= 1) {
            const chestChunk = findChestAt(fishing.toX, fishing.toY);

            setFishingState('floating', time);
            if (chestChunk) snagChest(scene, time, chestChunk); else startFishApproach(time);
        }
    } else if (waterFishingStates.has(fishing.state)) {
        updateWaterFishing(scene, time, delta);
    } else {
        const amount = Math.min(1, age / (fishing.hauling ? CHEST_REEL_DURATION : REEL_DURATION));

        fishing.bobberX = Math.round(fishing.fromX + (tipX - fishing.fromX) * amount);
        fishing.bobberY = Math.round(fishing.fromY + (tipY - fishing.fromY) * amount);
        if (fishing.hauling) drawHauledChest(amount);

        if (amount >= 1) {
            if (fishing.hauling) openHauledChest(scene, time, tipX, tipY);
            fishing = null;
        }
    }

    drawFishingMinigame();
    if (!fishing) return;

    [tipX, tipY] = getRodTip(time);
    const [handX, handY] = getRodHand();
    drawAnglerLine(scene, fishing, { handX, handY, tipX, tipY, bodyY: character.y, bodyDepth: character.depth, line: fishingLine, waterShadow: fishingWaterShadow, behind: getCastDirection()[1] < 0 }, delta);
}

function drawAnglerLine(scene, cast, angler, delta) {
    const { handX, handY, tipX, tipY, bodyY, bodyDepth, line, waterShadow, behind } = angler;
    const { polePalette, linePalette, bobberPalette } = cast.rod;
    const taut = tautFishingStates.has(cast.state);

    const depth = behind ? bodyDepth - 0.1 : cast.state === 'flying' || cast.state === 'casting' ? bodyDepth + 1 : Math.max(bodyDepth + 0.2, cast.bobberY);
    if (line.depth !== depth) line.setDepth(depth);
    plotFishingLine(handX, handY, tipX, tipY, 0, polePalette, line);
    const tipHeight = Math.max(0, bodyY + CHARACTER_SIZE - tipY);
    drawFishingWaterShadow(scene, bodyY + CHARACTER_SIZE - handY, tipHeight, waterShadow);

    if (cast.state === 'casting') return;

    cast.rope ||= createFishingRope(tipX, tipY, cast.bobberX, cast.bobberY - 2, Math.hypot(cast.bobberX - tipX, cast.bobberY - 2 - tipY) + 5);
    updateFishingRope(cast.rope, tipX, tipY, cast.bobberX, cast.bobberY - 2, delta, taut ? 1 : cast.state === 'flying' ? 0.7 : 0);
    drawFishingRope(cast.rope, linePalette, line);
    if (waterFishingStates.has(cast.state) || cast.state === 'reeling') drawFishingWaterShadow(scene, tipHeight, 2, waterShadow);
    line
        .fillStyle(bobberPalette?.[2] || BOBBER_BOTTOM_COLOR, 1)
        .fillRect(cast.bobberX - 1, cast.bobberY - 2, 2, 1)
        .fillStyle(bobberPalette?.[1] || BOBBER_TOP_COLOR, 1)
        .fillRect(cast.bobberX - 1, cast.bobberY - 1, 1, 1)
        .fillStyle(bobberPalette?.[0] || BOBBER_TOP_COLOR, 1)
        .fillRect(cast.bobberX, cast.bobberY - 1, 1, 1);
}

let chestSilhouette;
let chestSprite;

function createChestSilhouette(scene) {
    const source = getTerrainPixels(scene, 'chest');
    const width = source.width / 2;
    const height = source.height / 2;
    const image = new ImageData(width, height);
    const points = [];
    let top = height;
    let bottom = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const counts = new Map();
            let cover = 0;
            let best = -1;

            for (let offset = 0; offset < 4; offset++) {
                const index = ((y * 2 + (offset >> 1)) * source.width + x * 2 + (offset & 1)) * 4;
                if (!source.data[index + 3]) continue;

                const color = source.data[index] << 16 | source.data[index + 1] << 8 | source.data[index + 2];
                const count = (counts.get(color) || 0) + 1;
                const brightness = source.data[index] + source.data[index + 1] + source.data[index + 2];
                const bestBrightness = (best >> 16 & 255) + (best >> 8 & 255) + (best & 255);

                counts.set(color, count);
                cover++;

                if (best === -1 || count > counts.get(best) || count === counts.get(best) && brightness < bestBrightness) {
                    best = color;
                }
            }

            if (cover < 3) continue;

            writeRGBPixel(image.data, y * width + x, best);
            points.push(x, y);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
    }

    createCanvasTexture(scene, 'chest-small', width, height, context => context.putImageData(image, 0, 0));

    const offsets = Uint32Array.from({ length: points.length / 2 }, (_, index) =>
        points[index * 2 + 1] * CHUNK_PIXEL_SIZE + points[index * 2]);
    chestSilhouette = { width, top, bottom, points, offsets };
    chestSprite = scene.add.image(0, 0, 'chest-small').setOrigin(0.5, 1).setVisible(false);
    worldObjectLayer.add(chestSprite);
}

function findChunkChest(chunk) {
    const { chunkX, chunkY, shoreDistances } = chunk;
    const id = getTileId(chunkX, chunkY);

    if (openedChests.has(id) || worldHash(chunkX, chunkY, CHEST_SALT) > CHEST_CHANCE) return null;

    const { width, bottom, offsets } = chestSilhouette;

    for (let attempt = 0; attempt < CHEST_PLACEMENT_ATTEMPTS; attempt++) {
        const localX = Math.floor(worldHash(chunkX * CHEST_PLACEMENT_ATTEMPTS + attempt, chunkY, CHEST_SALT + 1) * (CHUNK_PIXEL_SIZE - width));
        const localY = Math.floor(worldHash(chunkX, chunkY * CHEST_PLACEMENT_ATTEMPTS + attempt, CHEST_SALT + 2) * (CHUNK_PIXEL_SIZE - bottom - 1));
        const origin = localY * CHUNK_PIXEL_SIZE + localX;
        let deep = true;

        for (let point = 0; point < offsets.length && deep; point++) {
            deep = shoreDistances[origin + offsets[point]] >= CHEST_MIN_DEPTH;
        }

        if (deep) {
            return { id, localX, localY, x: chunk.pixelX + localX, y: chunk.pixelY + localY, original: new Uint8Array(offsets.length), nextBubbleAt: 0 };
        }
    }

    return null;
}

function bakeChestSilhouette(chunk, data) {
    const chest = chunk.chest = findChunkChest(chunk);
    if (!chest) return;

    const offsets = chestSilhouette.offsets;
    const origin = chest.localY * CHUNK_PIXEL_SIZE + chest.localX;

    for (let point = 0; point < offsets.length; point++) {
        const index = (origin + offsets[point]) * 4;
        chest.original[point] = data[index];
        data[index] = 128;
    }
}

function eraseChestSilhouette(chunk) {
    const chest = chunk.chest;
    const origin = chest.localY * CHUNK_PIXEL_SIZE + chest.localX;
    const { width, top, bottom, points, offsets } = chestSilhouette;
    const height = bottom - top + 1;
    const context = chunk.waterTexture.getContext();
    const image = context.getImageData(chest.localX, chest.localY + top, width, height);

    for (let point = 0; point < points.length; point += 2) {
        image.data[((points[point + 1] - top) * width + points[point]) * 4] = chest.original[point / 2];
        const pixel = origin + offsets[point / 2];
        if (chunk.waterShadowBase) chunk.waterShadowBase[pixel * 4] = chest.original[point / 2];
    }

    context.putImageData(image, chest.localX, chest.localY + top);
    chunk.waterTexture.refresh();
    chunk.chest = null;
    chunk.treeShadowSignature = null;
    if (mainCamera) mainCamera.scene.treeShadowSignature = null;
}

function findChestAt(x, y) {
    const { width, top, bottom } = chestSilhouette;

    for (const chunk of loadedWaterChunks) {
        const chest = chunk.chest;

        if (
            chest && x >= chest.x - CHEST_SNAG_MARGIN && x < chest.x + width + CHEST_SNAG_MARGIN &&
            y >= chest.y + top - CHEST_SNAG_MARGIN && y <= chest.y + bottom + CHEST_SNAG_MARGIN
        ) {
            return chunk;
        }
    }

    return null;
}

function snagChest(scene, time, chunk) {
    setFishingState('snagged', time);
    fishing.chestChunk = chunk;
    fishing.bobberY = fishing.toY + 3;
    splash(scene, time, fishing.toX, fishing.toY);
}

function haulChest(time) {
    const chunk = fishing.chestChunk;
    fishing.chestChunk = null;

    if (!chunk?.chest || !loadedWaterChunks.has(chunk)) return reelIn(time);

    openedChests.add(chunk.chest.id);
    eraseChestSilhouette(chunk);
    saveDirty = true;
    startReeling(time);
    fishing.hauling = true;
    splash(mainCamera.scene, time, fishing.bobberX, fishing.bobberY);
}

function drawHauledChest(amount) {
    const lift = Math.round(Math.sin(amount * Math.PI) * 6);

    chestSprite
        .setPosition(Math.round(fishing.bobberX), Math.round(fishing.bobberY + 6 - lift))
        .setDepth(Math.max(character.depth + 0.3, fishing.bobberY))
        .setVisible(true);
}

function pickChestBait() {
    let roll = Math.random() * CHEST_BAIT_WEIGHT_TOTAL;

    for (let index = 0; index < MARKET_BAITS.length; index++) {
        roll -= CHEST_BAIT_WEIGHTS[index];
        if (roll <= 0) return MARKET_BAITS[index];
    }

    return MARKET_BAITS[0];
}

function openHauledChest(scene, time, x, y) {
    chestSprite.setVisible(false);

    const bait = pickChestBait();
    const amount = bait === MARKET_BAITS[MARKET_BAITS.length - 1] ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
    const rewards = [`+${amount} ${bait.label}`];

    addBait(bait, amount);

    if (Math.random() < CHEST_FISH_CHANCE) {
        const species = chooseFishSpecies(CHEST_FISH_WATER);
        addCaughtFish(species, false);
        rewards.push(species.name);
    }

    goldSparkle(scene, time, x, y - 4);

    showRewardCard(scene, time, 'You found a', 'Treasure Chest', rewards.join(' · '), 'chest', '#e8c170');
}

function updateChestBubbles(scene, time) {
    const { width, top } = chestSilhouette;

    for (const chunk of loadedWaterChunks) {
        const chest = chunk.chest;
        if (!chest || !chunk.visible || time < chest.nextBubbleAt) continue;

        chest.nextBubbleAt = time + CHEST_BUBBLE_MIN + Math.random() * CHEST_BUBBLE_RANGE;
        spawnParticle(scene, shadowLayer, time, chest.x + 2 + Math.floor(Math.random() * (width - 4)), chest.y + top, 0, -1, CHEST_BUBBLE_LIFETIME, CHEST_BUBBLE_COLOR);
    }
}

const UI_TEXT_SHADOW = '1px 1px #4a5059';

function isMenuOpen() {
    return dialogueOpen || marketOpen || mapOpen || inventoryOpen || statsOpen;
}

function drawPanelFrame(panel, x, width, height) {
    return panel
        .fillStyle(0x230a03, 1)
        .fillRect(x, 0, width, height)
        .fillStyle(0xacccf9, 1)
        .fillRect(x + 1, 1, width - 2, height - 2)
        .fillStyle(0x465989, 1)
        .fillRect(x + 2, 2, width - 4, height - 4)
        .fillStyle(0x36160d, 1)
        .fillRect(x + 3, 3, width - 6, height - 6);
}

const CRISP_TEXT_STYLE = { textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased' };

function createTextLayer(height, style) {
    const layer = document.createElement('div');

    Object.assign(layer.style, {
        position: 'relative',
        width: '320px',
        height: `${height}px`,
        fontFamily: 'm6x11, monospace',
        fontSize: '16px',
        lineHeight: '11px',
        pointerEvents: 'none'
    }, style);

    return layer;
}

function createUIText(layer, x, y, color, width, align, style) {
    const text = document.createElement('div');

    Object.assign(text.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: width ? `${width}px` : 'auto',
        textAlign: align || 'left',
        whiteSpace: 'nowrap'
    }, color && { color }, style);

    layer.appendChild(text);
    return text;
}

function setUITextContent(element, content) {
    const text = content == null ? '' : String(content);
    if (element.textContent !== text) element.textContent = text;
}

function addHudLayer(scene, element, y, depth) {
    const layer = scene.add.dom(0, y, element)
        .setOrigin(0)
        .setDepth(depth)
        .setScrollFactor(0)
        .setVisible(false);

    layer.pointerEvents = 'none';
    return layer;
}

function getFishArtKey(scene, species) {
    const keys = scene.fishArtKeys ||= new Map(scene.textures.getTextureKeys().filter(key => key.startsWith('fish/')).map(key => [key.slice(5).toLowerCase(), key]));
    return keys.get(species.id.replaceAll('-', '')) || 'fish/placeholder';
}

function addPanelContainer(scene, y, depth, children) {
    return scene.add.container(0, y, children)
        .setDepth(depth)
        .setScrollFactor(0)
        .setVisible(false);
}

function appendKeyHints(element, hints) {
    for (const [key, label] of hints) {
        const keycap = document.createElement('span');
        keycap.textContent = key;

        Object.assign(keycap.style, {
            color: '#e0f2fd',
            background: '#465989',
            padding: '0 2px',
            margin: '0 4px 0 10px'
        });

        element.append(keycap, label);
    }

    return element;
}

function createStartup(scene) {
    const hud = scene.children.list.filter(child => child.depth >= 100).map(child => [child, child.visible, child.y]);
    for (const [child] of hud) child.setVisible(false);
    character.setVisible(false);
    characterShadow.image.setVisible(false);
    const logoX = Math.round((320 - scene.textures.get('title-logo').getSourceImage().width) / 2);
    const logoShadow = scene.add.image(logoX + 2, 42, 'title-logo').setOrigin(0).setScrollFactor(0).setDepth(799).setTintFill(0xc4c4c4).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const logo = scene.add.image(logoX, 40, 'title-logo').setOrigin(0).setScrollFactor(0).setDepth(800);
    const button = scene.add.image(112, 124, 'ui-button').setOrigin(0).setScrollFactor(0).setDepth(800);
    const text = createTextLayer(192);
    createUIText(text, 112, 127, '#d4d7dd', 96, 'center', { textShadow: UI_TEXT_SHADOW }).textContent = 'Start';
    const hint = createUIText(text, 0, 154, '#e0f2fd', 320, 'center', { fontSize: '11px', textShadow: '1px 1px rgba(35, 10, 3, 0.45)' });
    hint.textContent = 'Enter / Space / Click to begin';
    const textLayer = addHudLayer(scene, text, 0, 801).setVisible(true);
    startup = { phase: 'title', start: scene.time.now, hud, logo, logoShadow, button, textLayer, hint, spawnX: character.x, spawnY: character.y };
}

function ditherPixels(source, originX, originY, level) {
    const image = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    for (let y = 0; y < source.height; y++) {
        for (let x = 0; x < source.width; x++) {
            if (SEE_THROUGH_RANKS[((originY + y) & 3) * 4 + ((originX + x) & 3)] >= level) image.data[(y * source.width + x) * 4 + 3] = 0;
        }
    }
    return image;
}

function ditherInCharacter(scene, level) {
    if (level >= 16) {
        characterTextureKey = null;
        setCharacterTexture(`character-${characterDirection}`);
        characterShadow.context.putImageData(characterShadow.pixels, 0, 0);
        characterShadow.texture.refresh();
        return;
    }
    const source = getTerrainPixels(scene, `character-${characterDirection}`);
    if (!scene.textures.exists('character-dither')) scene.textures.createCanvas('character-dither', source.width, source.height);
    const texture = scene.textures.get('character-dither');
    texture.getContext().putImageData(ditherPixels(source, Math.round(character.x), Math.round(character.y), level), 0, 0);
    texture.refresh();
    characterTextureKey = 'character-dither';
    character.setTexture('character-dither');
    characterShadow.context.putImageData(ditherPixels(characterShadow.pixels, characterShadow.x, characterShadow.y, level), 0, 0);
    characterShadow.texture.refresh();
}

function isStartButtonAt(x, y) {
    return x >= 112 && x < 208 && y >= 124 && y < 144;
}

function beginStartup(time) {
    if (!startup || startup.phase !== 'title') return;
    startup.phase = 'closing';
    startup.start = time;
    startup.from = [mainCamera.scrollX, mainCamera.scrollY];
    character.setPosition(startup.spawnX, startup.spawnY).setVisible(true);
    characterShadow.image.setVisible(true);
}

function updateStartup(scene, time, delta) {
    const age = time - startup.start;
    if (startup.phase === 'title') {
        const angle = age / 6000;
        const scrollX = Math.round(startup.spawnX + Math.cos(angle) * 100 - 160);
        const scrollY = Math.round(startup.spawnY + Math.sin(angle) * 72 - 96);
        if (mainCamera.scrollX !== scrollX || mainCamera.scrollY !== scrollY) mainCamera.setScroll(scrollX, scrollY);
        const hover = Math.round(Math.sin(age / 1000) * 2);
        if (startup.logo.y !== 40 + hover) startup.logoShadow.y = (startup.logo.y = 40 + hover) + 2;
        const hintVisibility = '';
        if (startup.hint && startup.hint.style.visibility !== hintVisibility) startup.hint.style.visibility = hintVisibility;
    } else if (startup.phase === 'closing') {
        const t = Math.min(1, age / 900);
        startup.dither = Math.max(0, Math.min(16, Math.round((t * 2 - 1) * 16)));
        const lift = Math.round(t * t * 160);
        startup.logoShadow.y = (startup.logo.y = 40 - lift) + 2;
        startup.textLayer.y = (startup.button.y = 124 - lift) - 124;
        const pan = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2;
        mainCamera.setScroll(Math.round(startup.from[0] + (character.x + CHARACTER_SIZE / 2 - 160 - startup.from[0]) * pan), Math.round(startup.from[1] + (character.y + CHARACTER_SIZE / 2 - 96 - startup.from[1]) * pan));
        if (t >= 1) {
            mainCamera.setScroll(character.x + CHARACTER_SIZE / 2 - 160, character.y + CHARACTER_SIZE / 2 - 96);
            cameraScrollX = mainCamera.scrollX;
            cameraScrollY = mainCamera.scrollY;
            cameraOffsetX = 0;
            cameraOffsetY = 0;
            startup.logo.setVisible(false); startup.logoShadow.setVisible(false);
            startup.button.setVisible(false); startup.textLayer.setVisible(false);
            for (const [child, visible, y] of startup.hud) {
                child.y = y + (y < 96 ? -40 : 40);
                child.setVisible(visible);
            }
            startup.phase = 'opening';
            startup.start = time;
            updateLoadedChunks(scene, true);
        }
    } else {
        const t = Math.min(1, age / 450);
        const drop = Math.round(Math.pow(1 - t, 3) * 40);
        for (const [child, , y] of startup.hud) child.y = y + (y < 96 ? -drop : drop);
        if (t >= 1) {
            for (const child of [startup.logo, startup.logoShadow, startup.button, startup.textLayer]) child.destroy();
            startup = null;
            return;
        }
    }
    updateLoadedChunks(scene);
    buildPendingChunk(scene);
    updateNpcHouses(scene, time);
    updateCharacterShadow(scene);
    if (startup.phase !== 'title' && startup.dither !== startup.ditherShown) ditherInCharacter(scene, startup.ditherShown = startup.dither);
    updateBushRustle(scene, time, false);
    updateChunkVisibility();
    updateTreeShadows(scene, time);
    updateActorShading(scene);
    updateActorBlinks(scene, time);
    updateParticles(time);
    updateFish(delta);
    updateChunkWater(time);
    updateSky(scene, time, delta);
    updateFireflies(time, delta);
}

const playTimeFormatCache = { seconds: null, label: '' };
const statsValueCache = new WeakMap();
const statsValues = new Array(9);

function createSlicedTexture(scene, key, width, height) {
    const source = getTextureSource(scene, 'ui-button');
    createCanvasTexture(scene, key, width, height, context => {
        for (const [sx, sw, dx, dw] of [[0, 16, 0, 16], [40, 16, 16, width - 32], [80, 16, width - 16, 16]]) {
            for (const [sy, sh, dy, dh] of [[0, 6, 0, 6], [8, 4, 6, height - 12], [14, 6, height - 6, 6]]) {
                for (let y = 0; y < dh; y += sh) for (let x = 0; x < dw; x += sw) {
                    const tileWidth = Math.min(sw, dw - x);
                    const tileHeight = Math.min(sh, dh - y);
                    context.drawImage(source, sx, sy, tileWidth, tileHeight, dx + x, dy + y, tileWidth, tileHeight);
                }
            }
        }
    });
}

function createStatsUI(scene) {
    createSlicedTexture(scene, 'ui-stats-button', 48, 16);
    createSlicedTexture(scene, 'ui-stats-panel', 256, 144);
    statsButton = scene.add.image(264, 8, 'ui-stats-button').setOrigin(0).setScrollFactor(0).setDepth(210);
    const buttonText = createTextLayer(16, { width: '48px', fontSize: '11px', lineHeight: '11px' });
    createUIText(buttonText, 0, 2, '#d4d7dd', 48, 'center', { textShadow: UI_TEXT_SHADOW }).textContent = 'Stats';
    statsButtonTextLayer = addHudLayer(scene, buttonText, 8, 211).setX(264).setVisible(true);
    statsContainer = scene.add.image(32, 24, 'ui-stats-panel').setOrigin(0).setScrollFactor(0).setDepth(220).setVisible(false);
    const text = createTextLayer(144, { color: '#a8afbd', fontSize: '11px', lineHeight: '11px', textShadow: UI_TEXT_SHADOW });
    createUIText(text, 44, 10, '#e2e4e9', 232, 'center', { fontSize: '16px', textShadow: UI_TEXT_SHADOW }).textContent = 'Your stats';
    const labels = ['Fish caught', 'Species discovered', 'Time playing', 'Total money earned', 'Fish sold', 'Casts made', 'Total money spent', 'Chests opened', 'Areas explored'];
    for (let index = 0; index < labels.length; index++) {
        createUIText(text, 44, 30 + index * 11, '#a8afbd', 156, 'left', { textShadow: UI_TEXT_SHADOW }).textContent = labels[index];
        statsValueTexts.push(createUIText(text, 200, 30 + index * 11, '#d4d7dd', 76, 'right', { textShadow: UI_TEXT_SHADOW }));
    }
    createUIText(text, 44, 129, '#a8afbd', 232, 'center', { fontSize: '9px', textShadow: UI_TEXT_SHADOW }).textContent = 'Tab / Esc / Click outside to close';
    statsTextLayer = addHudLayer(scene, text, 24, 221);
    refreshStatsUI();
}

function formatPlayTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    if (playTimeFormatCache.seconds === seconds) return playTimeFormatCache.label;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    playTimeFormatCache.seconds = seconds;
    return playTimeFormatCache.label = `${hours}h ${String(minutes % 60).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function formatStatsValue(index, value) {
    if (index === 1) return `${value}/${FISH_SPECIES.length}`;
    if (index === 2) return formatPlayTime(value * 1000);
    return index === 3 || index === 6 ? `${value}c` : value;
}
function refreshStatsUI() {
    const values = statsValues;
    values[0] = playerStats.fishCaught;
    values[1] = catchLog.size;
    values[2] = Math.floor(playerStats.playTimeMs / 1000);
    values[3] = playerStats.moneyEarned;
    values[4] = playerStats.fishSold;
    values[5] = playerStats.casts;
    values[6] = playerStats.moneySpent;
    values[7] = openedChests.size;
    values[8] = discoveredChunks.size;
    for (let index = 0; index < statsValueTexts.length; index++) {
        const element = statsValueTexts[index], value = values[index];
        if (statsValueCache.get(element) === value) continue;
        setUITextContent(element, formatStatsValue(index, value));
        statsValueCache.set(element, value);
    }
}

function updateStatsUI() {
    const visible = !isMenuOpen() || statsOpen;
    if (statsButton.visible !== visible) statsButton.setVisible(visible);
    if (statsButtonTextLayer.visible !== visible) statsButtonTextLayer.setVisible(visible);
    if (statsOpen) refreshStatsUI();
}

function isStatsButtonAt(x, y) {
    return x >= 264 && x < 312 && y >= 8 && y < 24;
}

function openStats() {
    if (isMenuOpen() || startup) return;
    statsOpen = true;
    stopCharacterForMenu();
    refreshStatsUI();
    statsContainer.setVisible(true);
    statsTextLayer.setVisible(true);
}

function closeStats() {
    statsOpen = false;
    statsContainer.setVisible(false);
    statsTextLayer.setVisible(false);
}

let fishingMinigameVisible = false;
let fishingProgressHeight = -1;
const CAST_METER_FALLBACK_PALETTE = [0x78afd3, 0xd1edf1];

function createFishingUI(scene) {
    const catchZoneTexture = scene.textures.get('fishing-catch-zone');
    const hudImage = (key, frame, depth, origin = 0) => scene.add.image(0, 0, key, frame)
        .setOrigin(origin).setDepth(depth).setScrollFactor(0).setVisible(false);

    catchZoneTexture.add('top', 0, 0, 0, 8, 3);
    catchZoneTexture.add('middle', 0, 0, 3, 8, 2);
    catchZoneTexture.add('bottom', 0, 0, 5, 8, 3);
    fishingUiPanel = hudImage('fishing-ui', undefined, 220).setPosition(FISHING_GAME_X, FISHING_GAME_Y);
    fishingCatchZoneTop = hudImage('fishing-catch-zone', 'top', 221);
    fishingCatchZoneMiddle = hudImage('fishing-catch-zone', 'middle', 221);
    fishingCatchZoneBottom = hudImage('fishing-catch-zone', 'bottom', 221);
    fishingFishMarker = hudImage('fishing-fish', undefined, 222, 0.5);
    fishingProgressFill = hudImage('fishing-progress', undefined, 221)
        .setPosition(FISHING_GAME_X + 17, FISHING_GAME_Y + FISHING_GAME_PLAY_TOP);
    fishingUiParts = [fishingUiPanel, fishingCatchZoneTop, fishingCatchZoneMiddle, fishingCatchZoneBottom, fishingFishMarker, fishingProgressFill];
}

function drawCastCharge(time) {
    if (!castCharge) return;

    const power = getCastPower(time);
    const palette = castCharge.rod.polePalette || CAST_METER_FALLBACK_PALETTE;
    const x = Math.round(character.x + CHARACTER_SIZE / 2 - CAST_METER_WIDTH / 2);
    const y = Math.round(character.y) - 5;
    drawCastMeter(fishingLine, x, y, character.depth + 1, power, palette);
}

function drawCastMeter(graphics, x, y, depth, power, palette) {
    const filled = Math.round((CAST_METER_WIDTH - 2) * power);
    if (graphics.depth !== depth) graphics.setDepth(depth);

    graphics
        .fillStyle(0x230a03, 1)
        .fillRect(x, y, CAST_METER_WIDTH, 4)
        .fillStyle(0x36160d, 1)
        .fillRect(x + 1, y + 1, CAST_METER_WIDTH - 2, 2)
        .fillStyle(power > 0.9 ? palette[palette.length - 1] : palette[1] || palette[0], 1)
        .fillRect(x + 1, y + 1, filled, 2);
}

function drawFishingMinigame() {
    if (!fishing || fishing.state !== 'minigame') {
        if (!fishingMinigameVisible) return;

        fishingMinigameVisible = false;
        for (const part of fishingUiParts) part.setVisible(false);
        return;
    }

    const gameState = fishing.game;
    const playX = FISHING_GAME_X + 5;
    const playY = FISHING_GAME_Y + FISHING_GAME_PLAY_TOP;
    const progressHeight = Math.max(1, Math.round(FISHING_GAME_PLAY_HEIGHT * gameState.progress));
    const zoneY = playY + Math.round(gameState.zoneY);
    const fishY = playY + Math.round(gameState.fishY), fishX = playX + 4;
    const zoneHeight = Math.round(gameState.zoneHeight), zoneBottomY = zoneY + zoneHeight - 3;
    const middleHeight = Math.max(1, zoneHeight - 6);

    if (!fishingMinigameVisible) {
        fishingMinigameVisible = true;
        fishingProgressHeight = -1;
        for (const part of fishingUiParts) part.setVisible(true);
    }

    if (fishingCatchZoneTop.x !== playX || fishingCatchZoneTop.y !== zoneY ||
        fishingCatchZoneBottom.y !== zoneBottomY) {
        fishingCatchZoneTop.setPosition(playX, zoneY);
        fishingCatchZoneMiddle.setPosition(playX, zoneY + 3);
        fishingCatchZoneBottom.setPosition(playX, zoneBottomY);
    }
    if (fishingCatchZoneMiddle.displayWidth !== 8 || fishingCatchZoneMiddle.displayHeight !== middleHeight) {
        fishingCatchZoneMiddle.setDisplaySize(8, middleHeight);
    }
    if (fishingFishMarker.x !== fishX || fishingFishMarker.y !== fishY) {
        fishingFishMarker.setPosition(fishX, fishY);
    }
    if (progressHeight !== fishingProgressHeight) {
        fishingProgressHeight = progressHeight;
        fishingProgressFill.setCrop(0, FISHING_GAME_PLAY_HEIGHT - progressHeight, FISHING_GAME_PROGRESS_WIDTH, progressHeight);
    }
}

function createGuideDialogueUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, 78)
        .fillStyle(0x465989, 1)
        .fillRect(DIALOGUE_OPTION_X - 7, 8, 1, 62);

    dialogueHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(DIALOGUE_OPTION_X - 3, 0, DIALOGUE_OPTION_WIDTH, DIALOGUE_OPTION_HEIGHT)
        .fillStyle(0x4a2216, 1)
        .fillRect(DIALOGUE_OPTION_X - 2, 1, DIALOGUE_OPTION_WIDTH - 2, DIALOGUE_OPTION_HEIGHT - 2);

    dialoguePortrait = scene.add.image(12, 13, 'guide-portrait-friendly')
        .setOrigin(0);

    const textLayer = createTextLayer(78, CRISP_TEXT_STYLE);

    dialogueName = createUIText(textLayer, 64, 10, '#acccf9');
    dialogueName.textContent = 'Guide';
    dialogueText = createUIText(textLayer, 64, 26, '#e0f2fd', 146, null, { whiteSpace: 'normal' });
    dialogueOptionTexts = [0, 1, 2].map(index => {
        return createUIText(textLayer, DIALOGUE_OPTION_X + 3, DIALOGUE_OPTION_TOP + 2 + index * DIALOGUE_OPTION_STEP, '#c0a887');
    });

    dialogueContainer = addPanelContainer(scene, DIALOGUE_HIDDEN_Y, 200, [panel, dialogueHighlight, dialoguePortrait]);
    dialogueTextLayer = addHudLayer(scene, textLayer, DIALOGUE_HIDDEN_Y, 201);
}

function createMapUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, MAP_PANEL_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, MARKET_DIVIDER_Y, 296, 1)
        .fillStyle(0x230a03, 1)
        .fillRect(11, MAP_TOP - 1, MAP_WIDTH + 2, MAP_HEIGHT + 2);

    mapTexture = scene.textures.createCanvas('map', MAP_WIDTH, MAP_HEIGHT);
    mapPixels = mapTexture.getContext().createImageData(MAP_WIDTH, MAP_HEIGHT);
    mapPixelWords = new Uint32Array(mapPixels.data.buffer);

    mapImage = scene.add.image(12, MAP_TOP, 'map')
        .setOrigin(0);

    const textLayer = createTextLayer(MAP_PANEL_HEIGHT);

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'World Map';
    appendKeyHints(
        createUIText(textLayer, 0, 6, '#8c7358', null, null, { left: 'auto', right: '14px', fontSize: '11px' }),
        [['Scroll', 'Zoom'], ['WASD', 'Pan'], ['M', 'Close']]
    );

    mapTextLayer = addHudLayer(scene, textLayer, MAP_HIDDEN_Y, 203);
    mapContainer = addPanelContainer(scene, MAP_HIDDEN_Y, 202, [panel, mapImage]);
}

let mapPixels;
let mapPixelWords;
let mapFog;
const mapColors = createTileCache(() => new Uint32Array(CHUNK_SIZE * CHUNK_SIZE));

function getMapPalette(scene) {
    if (mapPalette) return mapPalette;

    const pack = ([r, g, b]) => (r << 16) | (g << 8) | b;
    const grass = getDominantColor(scene, 'grass1');
    const dirt = getDominantColor(scene, 'dirt1');

    mapPalette = {
        grass: pack(grass),
        dirt: pack(dirt),
        dirtEdge: pack(shadeColor(...dirt)),
        bush: 0x4a7a52,
        rock: pack(getDominantColor(scene, 'rock')),
        boulder: pack(getDominantColor(scene, 'boulder')),
        wood: pack(getDominantColor(scene, 'wood')),
        store: pack(getDominantColor(scene, 'store')),
        trunk: pack(getDominantColor(scene, 'tree-bare')),
        water: [0x7bbbd9, 0x5e9bd3, 0x5181c4],
        fog: [0x1a1a1a, 0x2a2a2a],
        guide: 0xacccf9,
        player: 0xf6f5e5,
        outline: 0x230a03
    };
    return mapPalette;
}

function getMapWaterDepth(tileX, tileY) {
    for (let radius = 1; radius <= 2; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            const edgeRow = offsetY === -radius || offsetY === radius, nearbyY = tileY + offsetY, stride = edgeRow ? 1 : radius * 2;
            for (let offsetX = -radius; offsetX <= radius; offsetX += stride) {
                if (getTerrainType(tileX + offsetX, nearbyY) !== 'water') {
                    return radius - 1;
                }
            }
        }
    }

    return 2;
}

function getMapTreeAt(tileX, tileY) {
    for (const [offsetY, left, right, tone] of MAP_TREE_SHAPE) {
        for (let treeX = tileX - right; treeX <= tileX - left; treeX++) {
            if (getPropAt(treeX, tileY + offsetY) === 'tree') return [getTreeVariant(treeX, tileY + offsetY).color, tone];
        }
    }
    return null;
}

function shadeMapColor(color) {
    return (([r, g, b]) => (r << 16) | (g << 8) | b)(shadeColor(color >> 16, color >> 8 & 255, color & 255));
}

function getMapEdgeDistance(tileX, tileY) {
    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);
    const localX = tileX - chunkX * CHUNK_SIZE + 0.5;
    const localY = tileY - chunkY * CHUNK_SIZE + 0.5;
    const inside = discoveredChunks.has(getTileId(chunkX, chunkY));
    let distance = MAP_FOG_EDGE;
    if (discoveredChunks.has(getTileId(chunkX - 1, chunkY)) !== inside) distance = Math.min(distance, localX);
    if (discoveredChunks.has(getTileId(chunkX + 1, chunkY)) !== inside) distance = Math.min(distance, CHUNK_SIZE - localX);
    if (discoveredChunks.has(getTileId(chunkX, chunkY - 1)) !== inside) distance = Math.min(distance, localY);
    if (discoveredChunks.has(getTileId(chunkX, chunkY + 1)) !== inside) distance = Math.min(distance, CHUNK_SIZE - localY);
    return inside ? distance : -distance;
}

function tintMapColor(color, tint) {
    return tint.reduce((total, value, channel) => total | Math.min(255, Math.round((color >> (16 - channel * 8) & 255) * value)) << (16 - channel * 8), 0);
}

function toMapPixel(color) {
    return (0xff000000 | (color & 255) << 16 | color & 0xff00 | color >> 16 & 255) >>> 0;
}

function generateMapTileColor(tileX, tileY) {
    const palette = mapPalette;
    const covering = getPropCovering(tileX, tileY);
    let color;

    if (covering && covering.type !== 'rock') {
        color = covering.type === 'tree' ? palette.trunk : palette[covering.type];
        if (covering.type === 'bush') color = tintMapColor(color, getGrassTint(tileX, tileY));
    } else {
        const tile = getWorldTile(tileX, tileY);
        if (tile.key.startsWith('wood')) return toMapPixel(palette.wood);
        const terrain = getTerrainType(tileX, tileY);
        const tree = terrain === 'water' ? null : getMapTreeAt(tileX, tileY);

        if (tree && tree[1] !== 'shadow') {
            color = tree[1] === 'canopy' ? tree[0] : shadeMapColor(tree[0]);
        } else if (terrain === 'water') {
            color = tintMapColor(palette.water[getMapWaterDepth(tileX, tileY)], getWaterTint(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2));
        } else {
            color = terrain === 'grass' ? tintMapColor(palette.grass, getGrassTint(tileX, tileY)) : tintMapColor(palette.dirt, getDirtTint(tileX, tileY));
            if (tile.blocking === 'lower' || tree || getTerrainType(tileX, tileY + 1) === 'water') color = shadeMapColor(color);
        }
    }

    return toMapPixel(color);
}

function getMapFogPixels(fog) {
    if (mapFog && mapFog.colors[0] === fog[0] && mapFog.colors[1] === fog[1]) return mapFog.pixels;

    const pixels = new Uint32Array(MAP_WIDTH * MAP_HEIGHT);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = y * MAP_WIDTH;
        for (let x = 0; x < MAP_WIDTH; x++) pixels[row + x] = fog[(x + y) & 1];
    }

    mapFog = { colors: fog, pixels };
    return pixels;
}

function drawMapTerrain(pixels, originX, originY, zoom) {
    const viewWidth = Math.ceil(MAP_WIDTH / zoom);
    const viewHeight = Math.ceil(MAP_HEIGHT / zoom);

    for (let viewY = 0; viewY < viewHeight; viewY++) {
        const tileY = originY + viewY;
        const top = viewY * zoom;
        const bottom = Math.min(top + zoom, MAP_HEIGHT);

        for (let viewX = 0; viewX < viewWidth; viewX++) {
            const tileX = originX + viewX;
            if (getMapEdgeDistance(tileX, tileY) <= (coordinateHash(tileX, tileY, MAP_FOG_SALT) - 0.5) * MAP_FOG_EDGE) continue;

            const color = mapColors(tileX, tileY, generateMapTileColor);
            const left = viewX * zoom;
            const right = Math.min(left + zoom, MAP_WIDTH), singlePixel = right - left === 1;

            for (let y = top; y < bottom; y++) {
                const row = y * MAP_WIDTH;

                if (singlePixel) pixels[row + left] = color; else pixels.fill(color, row + left, row + right);
            }
        }
    }
}

function drawMapMarker(pixels, x, y, width, height, fill, outline) {
    const left = Math.max(0, x - 1);
    const right = Math.min(MAP_WIDTH, x + width + 1);
    const top = Math.max(0, y - 1);
    const bottom = Math.min(MAP_HEIGHT, y + height + 1);
    if (left >= right || top >= bottom) return;

    const insideLeft = Math.max(0, x);
    const insideRight = Math.min(MAP_WIDTH, x + width), insideBottom = y + height;

    for (let plotY = top; plotY < bottom; plotY++) {
        const row = plotY * MAP_WIDTH;
        pixels.fill(outline, row + left, row + right);

        if (plotY >= y && plotY < insideBottom && insideLeft < insideRight) {
            pixels.fill(fill, row + insideLeft, row + insideRight);
        }
    }
}

function redrawMap(scene) {
    const palette = getMapPalette(scene);
    const context = mapTexture.getContext();
    const pixels = mapPixelWords;
    const fog = palette.fog.map(toMapPixel);
    const outline = toMapPixel(palette.outline);
    const playerTileX = Math.floor((character.x + CHARACTER_SIZE / 2) / TILE_SIZE);
    const playerTileY = Math.floor((character.y + CHARACTER_SIZE / 2) / TILE_SIZE);
    const zoom = mapZoom;
    const originX = playerTileX - Math.floor(MAP_WIDTH / zoom / 2) + Math.round(mapPan.x);
    const originY = playerTileY - Math.floor(MAP_HEIGHT / zoom / 2) + Math.round(mapPan.y);
    const marker = (tileX, tileY, width, height, color) => drawMapMarker(
        pixels, (tileX - originX) * zoom, (tileY - originY) * zoom,
        width * zoom, height * zoom, toMapPixel(color), outline
    );

    pixels.set(getMapFogPixels(fog));
    drawMapTerrain(pixels, originX, originY, zoom);

    if (store && isTileDiscovered(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE))) {
        marker(Math.floor(store.x / TILE_SIZE), Math.floor(store.y / TILE_SIZE), STORE_WIDTH_TILES, STORE_HEIGHT_TILES, palette.store);
    }

    if (guide && isTileDiscovered(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE))) {
        marker(Math.floor(guide.x / TILE_SIZE), Math.floor(guide.y / TILE_SIZE), 1, 1, palette.guide);
    }

    for (const rumor of heardRumors.values()) {
        if (rumor.day === getWorldClock().day) marker((rumor.chunkX + 0.5) * CHUNK_SIZE, (rumor.chunkY + 0.5) * CHUNK_SIZE, 1, 1, RUMOR_MAP_COLOR);
    }

    marker(playerTileX, playerTileY, 1, 1, palette.player);

    context.putImageData(mapPixels, 0, 0);
    mapTexture.refresh();
}

function snapTweenTarget(tween, target) {
    target.y = Math.round(target.y);
}

function stopCharacterForMenu() {
    characterMoveRemainderX = 0;
    characterMoveRemainderY = 0;
    setCharacterTexture(`character-${characterDirection}`);
}

function getVerticalMenuStep(event, normalizedKey) {
    const key = normalizedKey ?? event.key.toLowerCase();
    return key === 'w' || event.key === 'ArrowUp' ? -1 : key === 's' || event.key === 'ArrowDown' ? 1 : 0;
}

function popIn(scene, image, y) {
    image.setY(y + 2);
    scene.tweens.killTweensOf(image);
    scene.tweens.add({ targets: image, y, duration: 140, ease: 'Quad.Out', onUpdate: snapTweenTarget });
}

function slidePanel(scene, y, duration, ease, targets, onComplete) {
    for (const target of targets) scene.tweens.killTweensOf(target);
    scene.tweens.add({ targets, y, duration, ease, onUpdate: snapTweenTarget, onComplete });
}

function showSlidingPanel(scene, hiddenY, ...targets) {
    for (const target of targets) target.setVisible(true).setY(hiddenY);
    slidePanel(scene, DIALOGUE_VISIBLE_Y, 260, 'Back.Out', targets);
}

function hideSlidingPanel(scene, hiddenY, isOpen, ...targets) {
    slidePanel(scene, hiddenY, 140, 'Cubic.In', targets, () => {
        if (!isOpen()) for (const target of targets) target.setVisible(false);
    });
}

function openMap(scene) {
    if (isMenuOpen() || !mapContainer) return;

    mapOpen = true;
    mapPan.x = 0;
    mapPan.y = 0;
    mapDrag = null;
    mapDirty = false;
    stopCharacterForMenu();
    redrawMap(scene);
    showSlidingPanel(scene, MAP_HIDDEN_Y, mapContainer, mapTextLayer);
}

function closeMap(scene) {
    if (!mapOpen) return;

    mapOpen = false;
    hideSlidingPanel(scene, MAP_HIDDEN_Y, () => mapOpen, mapContainer, mapTextLayer);
}

function handleMapKey(scene, event) {
    if (event.key.toLowerCase() === 'm' || event.key === 'Escape') closeMap(scene);
}

function updateMapPan(scene, delta) {
    const panX = (characterKeys.right.isDown || characterKeys.rightArrow.isDown ? 1 : 0) -
        (characterKeys.left.isDown || characterKeys.leftArrow.isDown ? 1 : 0);
    const panY = (characterKeys.down.isDown || characterKeys.downArrow.isDown ? 1 : 0) -
        (characterKeys.up.isDown || characterKeys.upArrow.isDown ? 1 : 0);
    if (!panX && !panY && !mapDirty) return;

    const distance = MAP_PAN_SPEED / mapZoom * Math.min(delta, 50) / 1000;
    const beforeX = Math.round(mapPan.x);
    const beforeY = Math.round(mapPan.y);

    mapPan.x += panX * distance;
    mapPan.y += panY * distance;
    mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;

    if (mapDirty) {
        mapDirty = false;
        redrawMap(scene);
    }
}

function createInventoryUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, 5, 310, INVENTORY_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(12, 19, 296, 1)
        .fillRect(12, 127, 296, 1)
        .fillRect(FISHPEDIA_DETAIL_X - 4, 23, 1, 101)
        .fillRect(FISHPEDIA_DETAIL_X + 28, 24, 36, 36)
        .fillStyle(0x230a03, 1)
        .fillRect(FISHPEDIA_DETAIL_X + 29, 25, 34, 34);

    inventoryHighlight = scene.add.graphics()
        .fillStyle(0x4a2216, 1)
        .fillRect(0, 0, FISHPEDIA_COLUMN_WIDTH - 2, FISHPEDIA_ROW_HEIGHT);
    inventoryDetailImage = scene.add.image(FISHPEDIA_DETAIL_X + 30, 26, 'fish/placeholder').setOrigin(0);

    const textLayer = createTextLayer(INVENTORY_HEIGHT, { color: '#c0a887' });
    const rowStyle = { fontSize: '9px', lineHeight: '8px' };
    const detailStyle = { fontSize: '8px', lineHeight: '8px' };

    createUIText(textLayer, 14, 5, '#acccf9').textContent = 'Fishpedia';
    inventorySummaryText = createUIText(textLayer, 145, 5, null, 161, 'right', { fontSize: '11px' });

    inventoryRowTexts = [];
    inventoryCountTexts = [];

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const x = FISHPEDIA_LIST_X + 2 + Math.floor(index / FISHPEDIA_ROWS) * FISHPEDIA_COLUMN_WIDTH;
        const y = FISHPEDIA_LIST_Y + (index % FISHPEDIA_ROWS) * FISHPEDIA_ROW_HEIGHT;
        inventoryRowTexts.push(createUIText(textLayer, x, y, null, 76, null, rowStyle));
        inventoryCountTexts.push(createUIText(textLayer, x + 76, y, null, 18, 'right', detailStyle));
    }

    const detail = createUIText(textLayer, FISHPEDIA_DETAIL_X, 63, null, FISHPEDIA_DETAIL_WIDTH, 'center', { whiteSpace: 'normal', display: 'flex', flexDirection: 'column', gap: '2px' });
    inventoryDetailTexts = ['#e0f2fd', '#acccf9', '#e8c170', '#8fbf7a'].map((color, index) => {
        const line = document.createElement('div');
        Object.assign(line.style, { color }, index && { fontSize: '11px', lineHeight: '9px' });
        detail.appendChild(line);
        return line;
    });

    inventoryNewGameText = createUIText(textLayer, 12, 128, '#8c7358', 296, 'center', { fontSize: '11px' });
    inventoryFooterHints = appendKeyHints(document.createElement('span'), [['I/Esc', 'Close'], ['N', 'New Game']]);

    inventoryContainer = addPanelContainer(scene, INVENTORY_HIDDEN_Y, 203, [panel, inventoryHighlight, inventoryDetailImage]);
    inventoryTextLayer = addHudLayer(scene, textLayer, INVENTORY_HIDDEN_Y, 204);
    createNewGameUI(scene);
    refreshInventoryUI(scene.time.now);
}

function refreshInventoryUI(time) {
    if (!inventorySummaryText) return;

    const summary = getFishInventorySummary();
    setUITextContent(inventorySummaryText, `${catchLog.size}/${FISH_SPECIES.length} caught · ${summary.count} fish · ${summary.value}c`);
    inventorySummaryText.style.color = summary.count ? '#e8c170' : '#8c7358';

    for (let index = 0; index < FISH_SPECIES.length; index++) {
        const species = FISH_SPECIES[index], caught = catchLog.has(species.id);
        const count = fishInventory.get(species.id) || 0, rowText = inventoryRowTexts[index], countText = inventoryCountTexts[index];

        setUITextContent(rowText, caught ? species.name : '???');
        rowText.style.color = caught ? '#e0f2fd' : '#6f5b49';
        setUITextContent(countText, caught ? `x${count}` : '-');
        countText.style.color = count ? '#8fbf7a' : caught ? '#8c7358' : '#6f5b49';
        if (index === selectedFishIndex) rowText.style.color = caught ? '#acccf9' : '#8c7358';
    }

    refreshFishpediaDetail();

    const confirming = time < newGameConfirmUntil;

    if (confirming) {
        setUITextContent(inventoryNewGameText, 'Press N again to choose a new world');
    } else if (inventoryNewGameText.firstChild !== inventoryFooterHints) {
        inventoryNewGameText.replaceChildren(inventoryFooterHints);
    }

    inventoryNewGameText.style.color = confirming ? '#d9745b' : '#8c7358';
}

function getFishpediaRowPosition(index) {
    return [FISHPEDIA_LIST_X + Math.floor(index / FISHPEDIA_ROWS) * FISHPEDIA_COLUMN_WIDTH, FISHPEDIA_LIST_Y + (index % FISHPEDIA_ROWS) * FISHPEDIA_ROW_HEIGHT];
}

function getFishpediaRowAt(x, y) {
    const column = Math.floor((x - FISHPEDIA_LIST_X) / FISHPEDIA_COLUMN_WIDTH);
    const row = Math.floor((y - DIALOGUE_VISIBLE_Y - FISHPEDIA_LIST_Y) / FISHPEDIA_ROW_HEIGHT);
    const index = column * FISHPEDIA_ROWS + row;
    return x >= FISHPEDIA_LIST_X && column < 2 && row >= 0 && row < FISHPEDIA_ROWS && index < FISHPEDIA_ROWS * 2 && index < FISH_SPECIES.length ? index : -1;
}

function refreshFishpediaDetail() {
    const species = FISH_SPECIES[selectedFishIndex], caught = catchLog.has(species.id);
    const [x, y] = getFishpediaRowPosition(selectedFishIndex);
    inventoryHighlight.setPosition(x, y);
    const key = getFishArtKey(inventoryDetailImage.scene, species);
    if (inventoryDetailImage.texture.key !== key) popIn(inventoryDetailImage.scene, inventoryDetailImage.setTexture(key), 26);
    if (caught) inventoryDetailImage.clearTint();
    else inventoryDetailImage.setTintFill(0x4a2216);
    const [name, size, price, count] = inventoryDetailTexts;
    setUITextContent(name, caught ? species.name : '???');
    setUITextContent(size, caught ? FISH_SIZE_CLASSES[species.size].label : 'Not caught yet');
    setUITextContent(price, caught ? `Value: ${species.price}c` : '');
    setUITextContent(count, caught ? `Holding ${fishInventory.get(species.id) || 0}` : '');
}

function selectFishpediaEntry(index) {
    selectedFishIndex = Phaser.Math.Wrap(index, 0, FISH_SPECIES.length);
    refreshInventoryUI(inventoryDetailImage.scene.time.now);
}

function openInventory(scene) {
    if (isMenuOpen() || !inventoryContainer) return;

    inventoryOpen = true;
    newGameConfirmUntil = 0;
    stopCharacterForMenu();
    refreshInventoryUI(scene.time.now);
    showSlidingPanel(scene, INVENTORY_HIDDEN_Y, inventoryContainer, inventoryTextLayer);
}

function closeInventory(scene) {
    if (!inventoryOpen) return;

    inventoryOpen = false;
    closeNewGameChoice();
    newGameConfirmUntil = 0;
    hideSlidingPanel(scene, INVENTORY_HIDDEN_Y, () => inventoryOpen, inventoryContainer, inventoryTextLayer);
}

function handleInventoryKey(scene, event) {
    const key = event.key.toLowerCase();

    const step = getVerticalMenuStep(event, key);
    const column = key === 'a' || event.key === 'ArrowLeft' || key === 'd' || event.key === 'ArrowRight';

    if (step) {
        selectFishpediaEntry(selectedFishIndex + step);
    } else if (column) {
        selectFishpediaEntry((selectedFishIndex + FISHPEDIA_ROWS) % (FISHPEDIA_ROWS * 2));
    } else if (key === 'i' || event.key === 'Escape') {
        closeInventory(scene);
    } else if (key === 'n' && scene.time.now < newGameConfirmUntil) {
        openNewGameChoice();
        newGameConfirmUntil = 0; refreshInventoryUI(scene.time.now);
    } else if (key === 'n') {
        newGameConfirmUntil = scene.time.now + 2500;
        refreshInventoryUI(scene.time.now);
    }
}

function createNewGameUI(scene) {
    const panel = scene.add.graphics();
    drawPanelFrame(panel, 32, 256, 112);
    const text = createTextLayer(112, { textShadow: UI_TEXT_SHADOW });
    createUIText(text, 48, 9, '#e0f2fd', 224, 'center').textContent = 'Start a new world';
    const options = ['Seeded', 'Unseeded'].map((label, index) => createUIText(text, 48 + index * 112, 30, '#e0f2fd', 112, 'center'));
    const input = document.createElement('input');
    input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 87; input.setAttribute('aria-label', 'World seed');
    Object.assign(input.style, { position: 'absolute', left: '48px', top: '53px', width: '224px', height: '18px', boxSizing: 'border-box', background: '#230a03', color: '#e0f2fd', border: '1px solid #465989', borderRadius: '0', fontFamily: 'inherit', fontSize: '11px', padding: '2px 4px', pointerEvents: 'auto' });
    text.appendChild(input);
    const note = createUIText(text, 48, 76, '#c0a887', 224, 'center', { fontSize: '9px' });
    createUIText(text, 48, 94, '#e0f2fd', 224, 'center', { fontSize: '11px' }).textContent = 'Tab - choose   Enter - start   Esc - cancel';
    newGameChoice = { open: false, mode: 0, options, input, note, panel: addPanelContainer(scene, 40, 205, [panel]), text: addHudLayer(scene, text, 40, 206) };
    input.addEventListener('input', () => { newGameChoice.note.textContent = 'Starting over erases progress in this world'; });
    input.addEventListener('keydown', event => { event.stopPropagation(); handleNewGameChoiceKey(event); });
}

function refreshNewGameChoice() {
    for (let index = 0; index < 2; index++) newGameChoice.options[index].textContent = (newGameChoice.mode === index ? '> ' : '') + ['Seeded', 'Unseeded'][index];
    newGameChoice.input.style.display = newGameChoice.mode === 0 ? '' : 'none';
    newGameChoice.note.textContent = newGameChoice.mode === 0 ? 'Starting over erases progress in this world' : 'A fresh random world - existing progress is erased';
    for (let index = 0; index < 2; index++) newGameChoice.options[index].style.color = newGameChoice.mode === index ? '#acccf9' : '#c0a887';
}

function openNewGameChoice() {
    newGameChoice.open = true; newGameChoice.mode = 0;
    newGameChoice.inventoryTextVisible = inventoryTextLayer?.visible || false; inventoryTextLayer?.setVisible(false);
    newGameChoice.input.value = WORLD_SEED_CODE;
    refreshNewGameChoice();
    newGameChoice.panel.setVisible(true); newGameChoice.text.setVisible(true);
    newGameChoice.input.focus(); newGameChoice.input.select();
}

function closeNewGameChoice() {
    if (!newGameChoice) return;
    newGameChoice.open = false;
    newGameChoice.input.blur();
    newGameChoice.panel.setVisible(false); newGameChoice.text.setVisible(false);
    if (inventoryOpen && newGameChoice.inventoryTextVisible) inventoryTextLayer?.setVisible(true);
}

function startNewGameChoice() {
    if (!newGameChoice.open || newGameResetting) return;
    const seed = newGameChoice.mode === 0 ? newGameChoice.input.value.trim() : null;
    if (seed !== null && !isValidWorldSeed(seed)) { newGameChoice.note.textContent = 'Enter a valid positive whole-number seed'; newGameChoice.input.focus(); return; }
    const target = new URL(window.location.href);
    if (seed === null) target.searchParams.delete('seed'); else target.searchParams.set('seed', seed);
    if (!resetProgress(seed)) { newGameChoice.note.textContent = 'Could not erase save - try again'; return; }
    window.location.assign(target.href);
}

function handleNewGameChoiceKey(event) {
    if (event.repeat) return;
    if (event.key === 'Escape') { event.preventDefault(); closeNewGameChoice(); return; }
    if (event.key === 'Enter') { event.preventDefault(); startNewGameChoice(); return; }
    if (event.key === 'Tab') { event.preventDefault(); newGameChoice.input.blur(); newGameChoice.mode = 1 - newGameChoice.mode; refreshNewGameChoice(); return; }
    if (document.activeElement === newGameChoice.input) return;
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) { event.preventDefault(); newGameChoice.mode = 1 - newGameChoice.mode; refreshNewGameChoice(); }
    else if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'u') { newGameChoice.mode = event.key.toLowerCase() === 's' ? 0 : 1; refreshNewGameChoice(); }
    else if (event.key === ' ') { event.preventDefault(); startNewGameChoice(); }
}

function handleNewGameChoicePointer(pointer) {
    if (pointer.y >= 68 && pointer.y < 85 && pointer.x >= 48 && pointer.x < 272) { newGameChoice.input.blur(); newGameChoice.mode = pointer.x < 160 ? 0 : 1; refreshNewGameChoice(); }
    else if (pointer.y >= 130 && pointer.y < 150 && pointer.x >= 48 && pointer.x < 272) startNewGameChoice();
}

function createCatchCardUI(scene) {
    const panel = scene.add.graphics();

    drawPanelFrame(panel, CATCH_CARD_X, CATCH_CARD_WIDTH, CATCH_CARD_HEIGHT)
        .fillStyle(0x465989, 1)
        .fillRect(CATCH_CARD_X + 6, 6, 36, 36)
        .fillStyle(0x230a03, 1)
        .fillRect(CATCH_CARD_X + 7, 7, 34, 34);

    catchCardImage = scene.add.image(CATCH_CARD_X + 8, 8, 'fish/placeholder').setOrigin(0);

    const textLayer = createTextLayer(CATCH_CARD_HEIGHT);
    const textX = CATCH_CARD_X + 48, textWidth = CATCH_CARD_WIDTH - 54, clip = { overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '4px' };

    catchCardKicker = createUIText(textLayer, textX, 8, '#c0a887', textWidth, null, { fontSize: '11px', lineHeight: '9px', ...clip });
    catchCardTitle = createUIText(textLayer, textX, 18, '#e0f2fd', textWidth, null, clip);
    catchCardDetail = createUIText(textLayer, textX, 32, '#e8c170', textWidth, null, { fontSize: '11px', lineHeight: '9px', ...clip });

    const hint = createUIText(textLayer, CATCH_CARD_X + CATCH_CARD_WIDTH - 60, 8, '#8c7358', 54, 'right', { fontSize: '11px', lineHeight: '9px' });
    appendKeyHints(hint, [['Enter', 'OK']]).firstChild.style.marginLeft = '0';
    catchCardContainer = addPanelContainer(scene, CATCH_CARD_Y + 8, 205, [panel, catchCardImage]);
    catchCardTextLayer = addHudLayer(scene, textLayer, CATCH_CARD_Y + 8, 206);
}

function showCatchCard(scene, time, species, first) {
    const kicker = first ? 'New species!' : 'You caught a';
    const detail = `${FISH_SIZE_CLASSES[species.size].label} · ${species.price}c`;
    showRewardCard(scene, time, kicker, species.name, detail, getFishArtKey(scene, species), first ? '#8fbf7a' : '#c0a887');
}

function showRewardCard(scene, time, kicker, title, detail, image, kickerColor = '#c0a887') {
    setUITextContent(catchCardKicker, kicker);
    catchCardKicker.style.color = kickerColor;
    setUITextContent(catchCardTitle, title);
    setUITextContent(catchCardDetail, detail);
    catchCardImage.setTexture(image);
    catchCardUntil = Infinity;
    itemLabelUntil = 0;

    const card = [catchCardContainer, catchCardTextLayer], hiddenY = CATCH_CARD_Y + 8;

    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    for (const target of card) target.setVisible(true).setY(hiddenY);
    slidePanel(scene, CATCH_CARD_Y, 180, 'Cubic.Out', card);
    popIn(scene, catchCardImage, 4);
    scene.tweens.add({ targets: catchCardImage, y: 8, delay: 140, duration: 220, ease: 'Bounce.Out', onUpdate: snapTweenTarget });

}

function hideCatchCard(scene) {
    if (catchCardUntil !== Infinity) return false;
    catchCardUntil = 0;
    const card = [catchCardContainer, catchCardTextLayer];
    slidePanel(scene, CATCH_CARD_Y + 8, 180, 'Cubic.In', card, () => {
        for (const target of card) target.setVisible(false);
    });
    return true;
}

const promptDitherMasks = [];

function createInteractionPromptUI(scene) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    wrapper.appendChild(row);

    Object.assign(row.style, {
        width: '320px',
        height: '18px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '6px',
        pointerEvents: 'none',
        fontFamily: 'm6x11, monospace',
        fontSize: '11px',
        lineHeight: '11px',
        color: '#c0a887',
        whiteSpace: 'nowrap',
    });

    const makePrompt = (key, label) => {
        const box = document.createElement('div');

        Object.assign(box.style, {
            display: 'none',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 6px',
            background: '#36160d',
            borderRadius: '0',
            boxShadow: 'inset 0 0 0 1px #465989, 0 0 0 1px #230a03'
        });

        const keycap = document.createElement('span');
        keycap.textContent = key || '';

        Object.assign(keycap.style, {
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '10px',
            padding: '0 1px',
            color: '#e0f2fd',
            background: '#465989',
            borderRadius: '0'
        });

        const text = document.createElement('span');
        text.textContent = label;

        box.append(...(key ? [keycap, text] : [text]));
        box.label = text;
        row.appendChild(box);

        return box;
    };

    marketPrompt = makePrompt('E', 'Market');
    guidePrompt = makePrompt('E', 'Talk to the Guide');
    npcPrompt = makePrompt('E', '');
    itemPrompt = makePrompt(null, '');

    interactionPromptLayer = addHudLayer(scene, wrapper, PROMPT_Y, 103);
}

function updateInteractionPrompt(scene, guideReach, marketReach) {
    if (!interactionPromptLayer) return;

    const time = scene.time.now, available = !isMenuOpen() && time >= catchCardUntil;
    const target = available && (guideReach < 1 || marketReach < 1)
        ? getInteractionTarget(guideHasMetPlayer, guideReach, marketReach)
        : null;
    const showItem = available && !target && time < itemLabelUntil;
    const showNpc = available && !target && !showItem && nearestNpc && nearestNpc.state !== 'home';
    if (showNpc && npcPrompt.label.textContent !== `- talk to ${nearestNpc.name}`) { setUITextContent(npcPrompt.label, `- talk to ${nearestNpc.name}`); snapPromptWidth(npcPrompt); }
    const state = (target === 'market' ? 1 : 0) | (target === 'guide' ? 2 : 0) | (showItem ? 4 : 0) | (showNpc ? 8 : 0);

    if (state === promptState) return;

    const wasShowing = promptState > 0;
    promptState = state;
    scene.tweens.killTweensOf(promptMotion);

    if (state === 0) {
        scene.tweens.add({
            targets: promptMotion,
            value: 0,
            duration: 160,
            onUpdate: applyPromptMotion,
            onComplete: () => promptState === 0 && interactionPromptLayer.setVisible(false)
        });
        return;
    }

    marketPrompt.style.display = state & 1 ? 'flex' : 'none';
    guidePrompt.style.display = state & 2 ? 'flex' : 'none';
    itemPrompt.style.display = state & 4 ? 'flex' : 'none';
    npcPrompt.style.display = state & 8 ? 'flex' : 'none';
    interactionPromptLayer.setVisible(true);
    for (const box of [marketPrompt, guidePrompt, itemPrompt, npcPrompt]) snapPromptWidth(box);
    if (!wasShowing) promptMotion.value = 0;
    applyPromptMotion();
    scene.tweens.add({ targets: promptMotion, value: 1, duration: 240, ease: 'Linear', onUpdate: applyPromptMotion });
}

function applyPromptMotion() {
    interactionPromptLayer
        .setY(PROMPT_Y + Math.round((1 - promptMotion.value) * PROMPT_SLIDE))
        .setVisible(promptMotion.value > 0.05);
    for (const box of [marketPrompt, guidePrompt, itemPrompt, npcPrompt]) snapPromptWidth(box);
    const level = Math.round(promptMotion.value * 16);
    const style = interactionPromptLayer.node.style;
    const mask = level >= 16 ? '' : getPromptDitherMask(level);
    const position = `0px ${((-interactionPromptLayer.y % 4) + 4) % 4}px`;
    if (style.maskImage === mask && style.maskPosition === position) return;
    style.maskImage = style.webkitMaskImage = mask;
    style.maskPosition = style.webkitMaskPosition = position;
    style.maskSize = style.webkitMaskSize = '4px 4px';
}

function getPromptDitherMask(level) {
    if (promptDitherMasks[level]) return promptDitherMasks[level];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    for (let index = 0; index < 16; index++) if (SEE_THROUGH_RANKS[index] < level) context.fillRect(index % 4 * 16, (index >> 2) * 16, 16, 16);
    return promptDitherMasks[level] = `url(${canvas.toDataURL()})`;
}

function snapPromptWidth(box) {
    if (box.style.display === 'none' || box.snappedText === box.textContent) return;
    box.style.width = '';
    const width = box.getBoundingClientRect().width / (interactionPromptLayer.node.getBoundingClientRect().width / 320);
    if (!width) return;
    box.style.width = `${Math.ceil(width / 2) * 2}px`;
    box.snappedText = box.textContent;
}

function createMarketUI(scene) {
    const panel = scene.add.image(0, 0, 'shop-ui').setOrigin(0);

    marketHighlight = scene.add.graphics()
        .fillStyle(0xacccf9, 1)
        .fillRect(MARKET_LIST_X, 0, MARKET_LIST_WIDTH, MARKET_ROW_HEIGHT - 2)
        .fillStyle(0x4a2216, 1)
        .fillRect(MARKET_LIST_X + 1, 1, MARKET_LIST_WIDTH - 2, MARKET_ROW_HEIGHT - 4);

    marketItemImages = MARKET_RODS.map((rod, index) => {
        return scene.add.image(MARKET_LIST_X + 3, MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 2, rod.icon)
            .setOrigin(0);
    });

    marketDetailImage = scene.add.image(
        MARKET_DETAIL_X + 50,
        MARKET_LIST_Y + 4,
        MARKET_RODS[0].texture
    )
        .setOrigin(0);

    const textLayer = createTextLayer(MARKET_HEIGHT, CRISP_TEXT_STYLE);
    const createText = (x, y, color, width, align, style) => createUIText(textLayer, x, y, color, width, align, style);

    marketTabTexts = MARKET_PAGES.map((page, index) => {
        const tab = createText(MARKET_TAB_X + index * MARKET_TAB_WIDTH, MARKET_TAB_Y, '#6f5b49');
        tab.textContent = page.title;
        return tab;
    });
    marketMessageText = createText(160, 5, '#e8c170', 146, 'right');

    marketOptionTexts = [];
    marketPriceTexts = [];

    for (let index = 0; index < MARKET_ROW_COUNT; index++) {
        const rowY = MARKET_LIST_Y + index * MARKET_ROW_HEIGHT + 6;
        const isAction = index >= MARKET_ITEM_ROWS;

        marketOptionTexts.push(createText(isAction ? MARKET_LIST_X + 6 : MARKET_LIST_X + 24, rowY, '#c0a887'));

        if (!isAction) {
            marketPriceTexts.push(createText(MARKET_LIST_X, rowY, '#c0a887', MARKET_LIST_WIDTH - 5, 'right'));
        }
    }

    marketOptionTexts[MARKET_SELL_INDEX].textContent = 'Sell fish';
    marketOptionTexts[MARKET_EXIT_INDEX].textContent = 'Leave';

    const detailTextX = MARKET_DETAIL_X + 4;
    const detailTextWidth = MARKET_DETAIL_WIDTH - 8;

    marketDetailName = createText(detailTextX, MARKET_LIST_Y + 39, '#e0f2fd', detailTextWidth, 'center');
    marketDetailStatus = createText(detailTextX, MARKET_LIST_Y + 51, '#c0a887', detailTextWidth, 'center');
    marketDetailAction = createText(detailTextX, MARKET_LIST_Y + 66, '#acccf9', detailTextWidth, 'center');
    marketDetailNote = createText(detailTextX, MARKET_LIST_Y + 78, '#8c7358', detailTextWidth, 'center', { fontSize: '11px' });

    const footer = createText(12, MARKET_FOOTER_Y, '#8c7358', 296, 'center', {
        fontSize: '11px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
    });

    for (const hint of [['A/D', 'Tab'], ['W/S', 'Select'], ['Enter', 'Buy'], ['E', 'Close']]) {
        const span = appendKeyHints(document.createElement('span'), [hint]);
        span.firstChild.style.marginLeft = '0';
        footer.appendChild(span);
    }

    marketContainer = addPanelContainer(scene, MARKET_HIDDEN_Y, 203, [panel, marketHighlight, ...marketItemImages, marketDetailImage]);
    marketTextLayer = addHudLayer(scene, textLayer, MARKET_HIDDEN_Y, 204);

    refreshMarketOptions();
}

function createHotbarUI(scene) {
    scene.add.image(HOTBAR_X, HOTBAR_Y, 'hotbar')
        .setOrigin(0)
        .setDepth(100)
        .setScrollFactor(0);

    hotbarSelector = scene.add.image(
        HOTBAR_X - 2,
        HOTBAR_Y - 3,
        'selected'
    )
        .setOrigin(0)
        .setDepth(101)
        .setScrollFactor(0);

    createBaitSlotUI(scene);
}

function addHotbarItem(scene, textureKey, name) {
    const slot = hotbarItemImages.length;
    if (slot >= 9) return;

    const image = scene.add.image(HOTBAR_X + slot * HOTBAR_SLOT_SIZE + 13, 0, textureKey)
        .setDepth(100.5)
        .setScrollFactor(0)
        .setDisplaySize(16, 16);

    hotbarItemNames[slot] = name;
    hotbarItemImages.push(image);
    popIn(scene, image, HOTBAR_Y + 13);
}

function createBaitSlotUI(scene) {
    scene.textures.get('hotbar').add('slot', 0, 0, 0, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);
    scene.add.image(BAIT_SLOT_X, HOTBAR_Y, 'hotbar', 'slot')
        .setOrigin(0)
        .setDepth(100)
        .setScrollFactor(0);

    baitSlotImage = scene.add.image(BAIT_SLOT_X + 13, HOTBAR_Y + 13, MARKET_BAITS[0].icon)
        .setDepth(100.5)
        .setScrollFactor(0)
        .setVisible(false);

    const layer = createTextLayer(9, { width: `${HOTBAR_SLOT_SIZE}px`, fontSize: '11px', lineHeight: '9px' });

    baitCountText = createUIText(layer, 0, 0, '#e0f2fd', HOTBAR_SLOT_SIZE - 3, 'right', { textShadow: '1px 0 #230a03, 0 1px #230a03' });
    addHudLayer(scene, layer, 0, 100.6).setPosition(BAIT_SLOT_X, HOTBAR_Y + 15).setVisible(true);
}

function refreshBaitSlot() {
    if (!baitSlotImage) return;

    const bait = getActiveBait();

    if (baitSlotImage.visible !== Boolean(bait)) baitSlotImage.setVisible(Boolean(bait));
    setUITextContent(baitCountText, bait ? baitInventory.get(bait.id) : '');

    if (bait && baitSlotImage.texture.key !== bait.icon) {
        popIn(baitSlotImage.scene, baitSlotImage.setTexture(bait.icon), HOTBAR_Y + 13);
    }
}

function getActiveBait() {
    return baitInventory.get(activeBaitId) ? MARKET_BAITS_BY_ID.get(activeBaitId) : null;
}

function addBait(bait, amount, equip) {
    baitInventory.set(bait.id, Math.min(Number.MAX_SAFE_INTEGER, (baitInventory.get(bait.id) || 0) + amount));
    if (equip || !getActiveBait()) activeBaitId = bait.id;
    saveDirty = true;
    refreshBaitSlot();
}

function useBait(bait) {
    const count = bait && baitInventory.get(bait.id);
    if (!count) return;

    const left = count - 1;

    if (left) {
        baitInventory.set(bait.id, left);
    } else {
        baitInventory.delete(bait.id);
        if (activeBaitId === bait.id) activeBaitId = ALL_BAITS.find(other => baitInventory.has(other.id))?.id ?? null;
    }

    saveDirty = true;
    refreshBaitSlot();
}

function cycleBait(scene) {
    const current = ALL_BAITS.findIndex(bait => bait.id === activeBaitId && baitInventory.has(bait.id));
    const next = ALL_BAITS.find((bait, index) => index > current && baitInventory.has(bait.id)) || null;

    if (current === -1 && !next) {
        showItemLabel(scene, 'No bait - buy some at the shop');
        return;
    }

    activeBaitId = next ? next.id : null;
    saveDirty = true;
    refreshBaitSlot();
    showItemLabel(scene, next ? `${next.label} x${baitInventory.get(next.id)}` : 'No bait');
}

function showItemLabel(scene, text) {
    if (!itemPrompt) return;

    setUITextContent(itemPrompt.label, text);
    snapPromptWidth(itemPrompt);
    itemLabelUntil = scene.time.now + ITEM_LABEL_DURATION;
}

function isBaitSlotAt(x, y) {
    return x >= BAIT_SLOT_X && x < BAIT_SLOT_X + HOTBAR_SLOT_SIZE && y >= HOTBAR_Y && y < HOTBAR_Y + HOTBAR_SLOT_SIZE;
}

function selectHotbarSlot(scene, slot, immediate = false) {
    selectedHotbarSlot = Phaser.Math.Wrap(slot, 0, 9);

    scene.tweens.killTweensOf(hotbarSelector);
    const selectorX = HOTBAR_X - 2 + selectedHotbarSlot * HOTBAR_SLOT_SIZE;

    if (immediate) {
        hotbarSelector.x = selectorX;
    } else {
        scene.tweens.add({
            targets: hotbarSelector,
            x: selectorX,
            duration: 70,
            ease: 'Quad.Out',
            onUpdate: (tween, target) => {
                target.x = Math.round(target.x);
            }
        });
    }

    const name = hotbarItemNames[selectedHotbarSlot];

    if (name) {
        showItemLabel(scene, name);
    } else {
        itemLabelUntil = 0;
    }
}

function getMarketTabAt(x, y) {
    const localY = y - DIALOGUE_VISIBLE_Y - MARKET_TAB_Y;
    const tab = Math.floor((x - MARKET_TAB_X) / MARKET_TAB_WIDTH);

    return localY >= -2 && localY < 12 && x >= MARKET_TAB_X && tab < MARKET_PAGES.length ? tab : -1;
}

function setMarketPage(page) {
    marketPage = Phaser.Math.Wrap(page, 0, MARKET_PAGES.length);
    marketFeedback = null;
    refreshMarketOptions();
}

function getMarketRowAt(x, y) {
    const localY = y - DIALOGUE_VISIBLE_Y - MARKET_LIST_Y;
    const row = Math.floor(localY / MARKET_ROW_HEIGHT);
    const inside = x >= MARKET_LIST_X && x < MARKET_LIST_X + MARKET_LIST_WIDTH && localY >= 0 &&
        row < MARKET_ROW_COUNT && localY - row * MARKET_ROW_HEIGHT < MARKET_ROW_HEIGHT - 2;

    return inside ? row : -1;
}

function getDialogueOptionAt(x, y) {
    const option = Math.floor((y - DIALOGUE_VISIBLE_Y - DIALOGUE_OPTION_TOP) / DIALOGUE_OPTION_STEP);
    const inside = x >= DIALOGUE_OPTION_X - 3 && x < DIALOGUE_OPTION_X - 3 + DIALOGUE_OPTION_WIDTH &&
        option >= 0 && option < dialogueNodes[dialogueNode].options.length;

    return inside ? option : -1;
}

function isMarketItemOwned(item) {
    return !item.bundle && ownedRods.has(item.id);
}

function getMarketItemStatus(item, owned = isMarketItemOwned(item)) {
    if (owned) {
        return { text: 'Owned', color: '#8fbf7a' };
    }

    if (playerCoins < item.price) {
        return { text: `Need ${item.price - playerCoins}c`, color: '#d9745b' };
    }

    return { text: item.bundle ? `${item.bundle} for ${item.price}c` : `${item.price}c`, color: '#e8c170' };
}

function getFishInventorySummary() {
    let count = 0;
    let value = 0;

    for (const [id, amount] of fishInventory) {
        const species = FISH_SPECIES_BY_ID.get(id);
        if (!species) continue;
        count = Math.min(Number.MAX_SAFE_INTEGER, count + amount);
        value = Math.min(Number.MAX_SAFE_INTEGER, value + amount * species.price);
    }

    return { count, value };
}

function setMarketDetail(name, status, statusColor, action, actionColor = '#acccf9', note = '') {
    setUITextContent(marketDetailNote, note);
    setUITextContent(marketDetailName, name);
    setUITextContent(marketDetailStatus, status);
    marketDetailStatus.style.color = statusColor;
    setUITextContent(marketDetailAction, marketFeedback ? marketFeedback.text : action);
    marketDetailAction.style.color = marketFeedback ? marketFeedback.color : actionColor;
}

function refreshMarketOptions() {
    if (!marketMessageText) return;

    const items = MARKET_PAGES[marketPage].items;
    const rowColor = index => index === selectedMarketOption ? '#e0f2fd' : '#c0a887';

    setUITextContent(marketMessageText, `${Math.round(coinDisplay.value)}c`);
    const highlightY = MARKET_LIST_Y + selectedMarketOption * MARKET_ROW_HEIGHT;
    if (marketHighlight.y !== highlightY) {
        marketHighlight.scene.tweens.killTweensOf(marketHighlight);
        marketHighlight.scene.tweens.add({ targets: marketHighlight, y: highlightY, duration: 90, ease: 'Quad.Out', onUpdate: snapTweenTarget });
    }
    marketTabTexts.forEach((tab, index) => tab.style.color = index === marketPage ? '#acccf9' : '#6f5b49');

    for (let index = 0; index < MARKET_ITEM_ROWS; index++) {
        const item = items[index];
        const owned = item && isMarketItemOwned(item);
        const priceText = marketPriceTexts[index], optionText = marketOptionTexts[index], image = marketItemImages[index];

        const label = item ? item.label : '';
        setUITextContent(optionText, label);
        optionText.style.color = owned && index !== selectedMarketOption ? '#7a6450' : rowColor(index);
        const price = !item ? '' : owned ? 'Owned' : `${item.price}c`;
        setUITextContent(priceText, price);
        priceText.style.color = owned ? '#8fbf7a' : item && playerCoins >= item.price ? '#e8c170' : '#9a5a47';
        if (image.visible !== Boolean(item)) image.setVisible(Boolean(item));
        if (item) {
            const icon = item.icon;
            if (image.texture.key !== icon) image.setTexture(icon);
            const tint = owned ? OWNED_ROD_TINT : 0xffffff;
            if (image.tintTopLeft !== tint) image.setTint(tint);
        }
    }

    marketOptionTexts[MARKET_SELL_INDEX].style.color = rowColor(MARKET_SELL_INDEX);
    marketOptionTexts[MARKET_EXIT_INDEX].style.color = rowColor(MARKET_EXIT_INDEX);

    const item = items[selectedMarketOption];
    if (marketDetailImage.visible !== Boolean(item)) marketDetailImage.setVisible(Boolean(item));

    if (selectedMarketOption === MARKET_SELL_INDEX) {
        const { count, value } = getFishInventorySummary();
        setMarketDetail('Sell fish', count ? `${count} fish · ${value}c` : 'No fish to sell', count ? '#e8c170' : '#c0a887', count ? 'Enter - Sell all' : '');
    } else if (selectedMarketOption === MARKET_EXIT_INDEX) {
        setMarketDetail('Leave shop', '', '#c0a887', 'Enter - Leave');
    } else if (!item) {
        setMarketDetail('', '', '#c0a887', '');
    } else {
        const owned = isMarketItemOwned(item);
        const status = getMarketItemStatus(item, owned);
        const held = baitInventory.get(item.id);

        if (marketDetailImage.texture.key !== item.texture) popIn(marketDetailImage.scene, marketDetailImage.setTexture(item.texture), MARKET_LIST_Y + 4);
        const tint = owned ? OWNED_ROD_TINT : 0xffffff;
        if (marketDetailImage.tintTopLeft !== tint) marketDetailImage.setTint(tint);
        setMarketDetail(
            item.label,
            status.text,
            status.color,
            owned || playerCoins < item.price ? '' : 'Enter - Buy',
            '#acccf9',
            [item.was && !owned && `Was ${item.was}c`, item.bundle && held && `Have ${held}`].filter(Boolean).join(' · ')
        );
    }
}

function animateCoinTotal(scene) {
    scene.tweens.killTweensOf(coinDisplay);
    scene.tweens.add({
        targets: coinDisplay,
        value: playerCoins,
        duration: 260,
        ease: 'Quad.Out',
        onUpdate: () => setUITextContent(marketMessageText, `${Math.round(coinDisplay.value)}c`)
    });
}

function buySelectedMarketItem(scene) {
    const item = MARKET_PAGES[marketPage].items[selectedMarketOption];

    if (selectedMarketOption === MARKET_EXIT_INDEX) {
        closeMarket(scene);
        return;
    }

    if (selectedMarketOption === MARKET_SELL_INDEX) {
        const summary = getFishInventorySummary();
        if (!summary.count) return;

        playerCoins = Math.min(Number.MAX_SAFE_INTEGER, playerCoins + summary.value);
        recordPlayerStat('moneyEarned', summary.value);
        recordPlayerStat('fishSold', summary.count);
        fishInventory.clear();
        marketFeedback = { text: `Sold for ${summary.value}c!`, color: '#8fbf7a' };
    } else if (!item || isMarketItemOwned(item) || playerCoins < item.price) {
        return;
    } else if (item.bundle) {
        playerCoins -= item.price;
        recordPlayerStat('moneySpent', item.price);
        addBait(item, item.bundle, true);
        marketFeedback = { text: `+${item.bundle} ${item.label}!`, color: '#8fbf7a' };
    } else {
        playerCoins -= item.price;
        recordPlayerStat('moneySpent', item.price);
        ownedRods.add(item.id);
        addHotbarItem(scene, item.icon, item.label);
        marketFeedback = { text: 'Purchased!', color: '#8fbf7a' };
    }

    saveDirty = true;
    sparkleOverPlayer(scene);
    animateCoinTotal(scene);
    refreshMarketOptions();
}

function moveMarketSelection(amount) {
    selectedMarketOption = Phaser.Math.Wrap(selectedMarketOption + amount, 0, MARKET_ROW_COUNT);
    marketFeedback = null;
    refreshMarketOptions();
}

function openMarket(scene) {
    if (isMenuOpen() || !marketContainer || !isMarketNear()) return;

    marketOpen = true;
    selectedMarketOption = 0;
    marketPage = 0;
    marketFeedback = null;
    coinDisplay.value = playerCoins;
    stopCharacterForMenu();
    refreshMarketOptions();
    showSlidingPanel(scene, MARKET_HIDDEN_Y, marketContainer, marketTextLayer);
}

function closeMarket(scene) {
    if (!marketOpen) return;

    marketOpen = false;
    hideSlidingPanel(scene, MARKET_HIDDEN_Y, () => marketOpen, marketContainer, marketTextLayer);
}

function handleMarketKey(scene, event) {
    const key = event.key.toLowerCase();
    const step = getVerticalMenuStep(event, key);
    const page = key === 'a' || event.key === 'ArrowLeft' ? -1 : key === 'd' || event.key === 'ArrowRight' ? 1 : 0;

    if (step) {
        moveMarketSelection(step);
    } else if (page) {
        setMarketPage(marketPage + page);
    } else if (event.key === 'Enter' || event.code === 'Space') {
        buySelectedMarketItem(scene);
    } else if (key === 'e' || event.key === 'Escape') {
        closeMarket(scene);
    }
}

function getMarketReach() {
    if (!store) return Infinity;

    const x = character.x + CHARACTER_SIZE / 2 - store.x - STORE_WIDTH / 2;
    const y = character.y + CHARACTER_SIZE / 2 - store.y - STORE_HEIGHT / 2;

    return (x * x + y * y) / MARKET_INTERACTION_DISTANCE_SQUARED;
}

function getGuideReach() {
    if (!guide) return Infinity;

    const x = character.x - guide.x;
    const y = character.y - guide.y;

    return (x * x + y * y) / GUIDE_INTERACTION_DISTANCE_SQUARED;
}

function isMarketNear() {
    return getMarketReach() < 1;
}

function isGuideNear() {
    return getGuideReach() < 1;
}

function getClickedWorldTarget(pointer) {
    const inside = (target, width, height) => pointer.worldX >= target.x && pointer.worldX < target.x + width &&
        pointer.worldY >= target.y && pointer.worldY < target.y + height;

    if (guide && isGuideNear() && inside(guide, GUIDE_SIZE, GUIDE_SIZE)) return 'guide';
    if (store && isMarketNear() && inside(store, STORE_WIDTH, STORE_HEIGHT)) return 'market';
    return null;
}

function getFacingPenalty(targetX, targetY) {
    const x = targetX - character.x - CHARACTER_SIZE / 2;
    const y = targetY - character.y - CHARACTER_SIZE / 2;
    const along = characterDirection === 'left' ? -x
        : characterDirection === 'right' ? x
        : characterDirection === 'back' ? -y
        : y;

    return along > 0 && along * along * 2 >= x * x + y * y ? 0 : 1;
}

function getInteractionTarget(guideAvailable, guideReach, marketReach) {
    guideReach = guideAvailable ? guideReach ?? getGuideReach() : Infinity;
    marketReach ??= getMarketReach();

    if (guideReach >= 1 && marketReach >= 1) return null;
    if (guideReach >= 1) return 'market';
    if (marketReach >= 1) return 'guide';

    const guideScore = guideReach + getFacingPenalty(guide.x + GUIDE_SIZE / 2, guide.y + GUIDE_SIZE / 2);
    const marketScore = marketReach + getFacingPenalty(store.x + STORE_WIDTH / 2, store.y + STORE_HEIGHT / 2);

    return guideScore <= marketScore ? 'guide' : 'market';
}

function refreshGuideDialogueOptions() {
    const options = dialogueNodes[dialogueNode].options;

    dialogueOptionTexts.forEach((optionText, index) => {
        const option = options[index], display = option ? 'block' : 'none';

        if (optionText.style.display !== display) optionText.style.display = display;
        if (!option) return;

        setUITextContent(optionText, option.label);
        optionText.style.color = index === selectedDialogueOption ? '#e0f2fd' : '#c0a887';
    });

    const highlightY = DIALOGUE_OPTION_TOP + selectedDialogueOption * DIALOGUE_OPTION_STEP;
    if (dialogueHighlight.y === highlightY) return;
    dialogueHighlight.scene.tweens.killTweensOf(dialogueHighlight);
    dialogueHighlight.scene.tweens.add({ targets: dialogueHighlight, y: highlightY, duration: 90, ease: 'Quad.Out', onUpdate: snapTweenTarget });
}

function finishGuideDialogueText() {
    if (!stopDialogueTyping()) return false;

    dialogueText.textContent = dialogueFullText;
    return true;
}

function openInteraction(scene, target) {
    if (target === 'guide') openGuideDialogue(scene);
    else if (target === 'market') openMarket(scene);
    else talkToNearestNpc(scene);
}

function stopDialogueTyping() {
    if (!dialogueTypingEvent) return false;

    dialogueTypingEvent.remove(false);
    dialogueTypingEvent = null;
    settleGuideTalking();
    return true;
}

function settleGuideTalking() {
    dialoguePortrait.y = DIALOGUE_PORTRAIT_Y;
    if (dialogueActor && dialogueActor.restY !== undefined) dialogueActor.y = dialogueActor.restY;
    showDialogueOptions(true);
}

function showDialogueOptions(visible) {
    for (const optionText of dialogueOptionTexts) optionText.style.visibility = visible ? '' : 'hidden';
    dialogueHighlight.setVisible(visible);
}

function showGuideDialogueNode(scene, nodeKey) {
    const node = dialogueNodes[nodeKey];
    if (dialogueNpc) setUITextContent(dialogueName, node.speaker || dialogueNpc.name);
    let characterIndex = 0;

    stopDialogueTyping();
    dialogueNode = nodeKey;
    selectedDialogueOption = 0;
    dialogueFullText = node.text;
    if (dialoguePortrait.texture.key !== node.portrait) dialoguePortrait.setTexture(node.portrait);
    dialoguePortrait.setScale(node.portraitScale || 1);
    const typingText = document.createTextNode('');
    dialogueText.replaceChildren(typingText);
    refreshGuideDialogueOptions();
    showDialogueOptions(false);

    if (dialogueActor) dialogueActor.restY ??= dialogueActor.y;

    const typeNext = () => {
        const letter = dialogueFullText.charAt(characterIndex);
        typingText.appendData(letter);
        characterIndex++;
        const bob = Math.floor(characterIndex / 3) % 2;
        dialoguePortrait.y = DIALOGUE_PORTRAIT_Y - bob;
        if (dialogueActor) dialogueActor.y = dialogueActor.restY - bob;
        if (characterIndex >= dialogueFullText.length) {
            dialogueTypingEvent = null;
            settleGuideTalking();
            return;
        }
        dialogueTypingEvent = scene.time.delayedCall(DIALOGUE_TYPE_DELAY * (/[.!?]/.test(letter) ? 8 : letter === ',' ? 4 : 1), typeNext);
    };

    dialogueTypingEvent = scene.time.delayedCall(DIALOGUE_TYPE_DELAY, typeNext);
}

function beginDialogue(scene, nodes, actor, name, npc) {
    dialogueNodes = nodes;
    dialogueActor = actor;
    dialogueNpc = npc;
    if (actor) actor.restY = actor.y;
    setUITextContent(dialogueName, name);
    dialogueOpen = true;
    stopCharacterForMenu();
    showSlidingPanel(scene, DIALOGUE_HIDDEN_Y, dialogueContainer, dialogueTextLayer);
    showGuideDialogueNode(scene, 'intro');
}

function openGuideDialogue(scene) {
    if (isMenuOpen() || !guide || !dialogueContainer) return;

    beginDialogue(scene, GUIDE_DIALOGUE, guide, 'Guide', null);
}

function closeGuideDialogue(scene) {
    if (!dialogueOpen) return;

    dialogueOpen = false;
    if (dialogueNpc) releaseDialogueNpc(scene);
    else guideHasMetPlayer = true;
    saveDirty = true;
    stopDialogueTyping();
    hideSlidingPanel(scene, DIALOGUE_HIDDEN_Y, () => dialogueOpen, dialogueContainer, dialogueTextLayer);
}

function selectGuideDialogueOption(scene) {
    if (finishGuideDialogueText()) return;

    const option = dialogueNodes[dialogueNode].options[selectedDialogueOption];

    if (option.close) {
        closeGuideDialogue(scene);
    } else if (option.action) {
        const next = option.action(scene);
        if (next) showGuideDialogueNode(scene, next);
        else closeGuideDialogue(scene);
    } else {
        showGuideDialogueNode(scene, option.next);
    }
}

function moveGuideDialogueSelection(amount) {
    selectedDialogueOption = Phaser.Math.Wrap(selectedDialogueOption + amount, 0, dialogueNodes[dialogueNode].options.length);
    refreshGuideDialogueOptions();
}

function handleGuideDialogueKey(scene, event) {
    const step = getVerticalMenuStep(event);

    if (step) {
        moveGuideDialogueSelection(step);
    } else if (event.key === 'Enter' || event.code === 'Space' || event.key.toLowerCase() === 'e') {
        selectGuideDialogueOption(scene);
    } else if (event.key === 'Escape') {
        closeGuideDialogue(scene);
    }
}

function updateGuideInteraction(scene, guideIsNear) {
    if (guideIsNear && !guideWasNear && !guideHasMetPlayer && !isMenuOpen()) {
        openGuideDialogue(scene);
    }

    guideWasNear = guideIsNear;
}

function runAutomatedTests(scene) {
    const results = [];
    const record = (name, passed, detail) => results.push({ name, passed, detail });
    const loaderPassed = scene.load.maxParallelDownloads === 6;
    record('Asset requests use a bounded queue', loaderPassed, loaderPassed ? 'At most 6 assets download together' : `Loader concurrency is ${scene.load.maxParallelDownloads}`);
    const speciesIds = new Set(FISH_SPECIES.map(species => species.id));
    const ordinarySizesValid = FISH_SPECIES
        .filter(species => species.id !== 'sturgeon')
        .every(species => species.size === 'small' || species.size === 'medium' || species.size === 'large');
    const sturgeon = FISH_SPECIES_BY_ID.get('sturgeon');
    const speciesPassed = FISH_SPECIES.length === 26 && speciesIds.size === 26 && ordinarySizesValid && sturgeon?.size === 'giant';
    record('Fish species have fixed size classes', speciesPassed, speciesPassed ? '26 unique species; sturgeon is the giant exception' : 'Species size table is invalid');
    const diagonalGrassPatch = getTerrainCornerPatch('grass', 'dirt', 'dirt', 'grass', 1);
    const solidDirtPatch = getTerrainCornerPatch('grass', 'dirt', 'dirt', 'dirt', 1);
    const terrainCornersPassed = diagonalGrassPatch === null && solidDirtPatch === 'dirtEdgeCorner';
    record('Diagonal grass connections stay clean', terrainCornersPassed, terrainCornersPassed ? 'Dirt corners yield to connected grass' : 'Diagonal terrain rule regressed');
    let crowdedProps = 0;
    let sampledProps = 0;

    for (let tileY = -96; tileY <= 96; tileY++) {
        for (let tileX = -96; tileX <= 96; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type) continue;
            sampledProps++;

            for (let offsetY = 0; offsetY <= TREE_CANOPY_TILES; offsetY++) {
                for (let offsetX = -3; offsetX <= 3; offsetX++) {
                    if (offsetY === 0 && offsetX <= 0) continue;

                    const nearby = getPropAt(tileX + offsetX, tileY + offsetY);
                    if (nearby && propsConflict(type, tileX, tileY, nearby, tileX + offsetX, tileY + offsetY)) crowdedProps++;
                }
            }
        }
    }

    record('Props keep a clear tile gap', crowdedProps === 0, `${sampledProps} generated props checked`);
    const leafyTrees = treeVariants.length === TREE_VARIANT_COUNT && treeVariants.every(variant =>
        scene.textures.exists(variant.key) && variant.hitRight > variant.hitLeft && variant.shadowPoints.length > 0
    );
    record('Trees grow seeded leaves', leafyTrees, leafyTrees ? `${treeVariants.length} canopy variants generated` : 'Tree variant generation failed');
    const fishingTextures = ['fishing-ui', 'fishing-catch-zone', 'fishing-fish', 'fishing-progress'];
    const texturesPassed = fishingTextures.every(key => scene.textures.exists(key));
    record('Fishing minigame PNGs are loaded', texturesPassed, texturesPassed ? 'Frame, zone, fish and progress assets found' : 'A fishing UI texture is missing');
    spawnShimmer(scene);
    const shimmerChunk = [...loadedShimmerChunks].find(chunk => chunk.shimmers.length);
    const shimmer = shimmerChunk?.shimmers[shimmerChunk.shimmers.length - 1];
    if (shimmer) finishShimmer(null, null, shimmer);
    const shimmerPoolPassed = shimmer && !shimmer.active && !shimmer.shimmerChunk &&
        !shimmerChunk.shimmers.includes(shimmer) && shimmerPool.includes(shimmer) &&
        shimmer.listenerCount(Phaser.Animations.Events.ANIMATION_COMPLETE) === 1;
    record('Shimmer completion returns sprites to the pool', shimmerPoolPassed, shimmerPoolPassed ? 'One permanent completion handler retained' : 'Shimmer lifecycle regressed');
    const deckLayers = [...loadedChunks.values()].map(chunk => chunk.upperLayer).filter(Boolean);
    const shimmerDepthPassed = shimmer && deckLayers.length > 0 && loadedWaterChunks.size > 0 &&
        deckLayers.every(layer => shimmer.depth < layer.depth) &&
        [...loadedWaterChunks].every(chunk => shimmer.depth > chunk.overlay.depth);
    record('Water sparkles stay below bridges and piers', shimmerDepthPassed, shimmerDepthPassed ? 'Sparkles render above water and below deck textures' : 'Water sparkle draw order is incorrect');
    const rodArtPassed = MARKET_RODS.every(rod =>
        scene.textures.exists(rod.texture) && scene.textures.exists(rod.icon) && rod.polePalette?.length === 3 &&
        rod.linePalette?.length === 4 && rod.bobberPalette?.length === 3
    ) && new Set(MARKET_RODS.map(rod => rod.linePalette.join(','))).size === MARKET_RODS.length;
    record('Rod art palettes are extracted', rodArtPassed, rodArtPassed ? 'Three distinct rod, line and bobber palettes found' : 'Rod artwork or palette extraction failed');
    const rodsImprove = MARKET_RODS.slice(1).every((rod, index) => {
        const previous = MARKET_RODS[index];
        return rod.castDistance > previous.castDistance &&
            rod.chargeTime < previous.chargeTime &&
            rod.lineStrength > previous.lineStrength &&
            rod.catchZone > previous.catchZone;
    });

    record('Rod upgrades improve all fishing stats', rodsImprove, rodsImprove ? 'Distance, speed, strength and zone are monotonic' : 'Rod progression regressed');
    const directionBuffer = getCastDirection();
    const handBuffer = getRodHand();
    const tipBuffer = getRodTip();
    const fishingBuffersPassed = directionBuffer === getCastDirection() && handBuffer === getRodHand() && tipBuffer === getRodTip();
    record('Fishing coordinates reuse stable buffers', fishingBuffersPassed, fishingBuffersPassed ? 'Direction, hand and tip buffers reused' : 'Fishing coordinates allocated again');
    const originalX = character.x;
    const originalY = character.y;
    let seed = 0x51f15e;
    let movementPassed = true;

    const random = () => {
        seed = Math.imul(seed ^ seed >>> 15, 2246822519);
        seed = Math.imul(seed ^ seed >>> 13, 3266489917);
        return ((seed ^= seed >>> 16) >>> 0) / 4294967296;
    };

    for (let step = 0; step < 20000; step++) {
        const axis = random() < 0.5;
        const direction = random() < 0.5 ? -1 : 1;

        stepCharacter(scene, axis ? direction : 0, axis ? 0 : direction, true);

        if (!canCharacterOccupy(scene, character.x, character.y)) {
            movementPassed = false;
            break;
        }
    }

    character.setPosition(originalX, originalY);
    record('20,000 collision-safe movement steps', movementPassed, movementPassed ? 'No water or solid overlap' : 'Invalid player position');

    let fishCount = 0;
    let fishPassed = true;

    for (const chunk of loadedWaterChunks) {
        for (const fish of chunk.fish) {
            fishCount++;
            if (!canFishSwim(chunk, fish, fish.x, fish.y)) fishPassed = false;
        }
    }

    record('Fish remain in valid water regions', fishPassed, `${fishCount} fish checked`);

    let connectedBorders = 0;
    let borderRoutingPassed = true;
    let migrationProbe = null;

    for (const chunk of loadedWaterChunks) {
        for (const [offsetX, offsetY] of [[1, 0], [0, 1]]) {
            const neighbor = loadedChunks.get(getChunkKey(chunk.chunkX + offsetX, chunk.chunkY + offsetY));
            if (!neighbor || !neighbor.fishRegions) continue;

            for (let offset = 0; offset < CHUNK_PIXEL_SIZE; offset++) {
                const sourceX = chunk.chunkX * CHUNK_PIXEL_SIZE + (offsetX ? CHUNK_PIXEL_SIZE - 0.5 : offset + 0.5);
                const sourceY = chunk.chunkY * CHUNK_PIXEL_SIZE + (offsetY ? CHUNK_PIXEL_SIZE - 0.5 : offset + 0.5);
                const targetX = sourceX + offsetX;
                const targetY = sourceY + offsetY;
                const sourceRegion = getFishRegionAt(chunk, sourceX, sourceY);

                if (
                    !sourceRegion ||
                    getFishDepth(chunk, sourceX, sourceY) < FISH_MIN_DEPTH + 1.5 ||
                    getFishDepth(neighbor, targetX, targetY) < FISH_MIN_DEPTH + 1.5
                ) {
                    continue;
                }

                connectedBorders++;
                const probe = { radius: 1.5, region: sourceRegion };
                if (!canFishSwim(chunk, probe, targetX, targetY)) borderRoutingPassed = false;
                if (!migrationProbe) migrationProbe = { chunk, neighbor, sourceRegion, targetX, targetY };
            }
        }
    }

    record(
        'Connected water crosses chunk borders',
        borderRoutingPassed,
        connectedBorders ? `${connectedBorders} deep-water border points checked` : 'No deep-water border in the initial test area'
    );

    if (migrationProbe) {
        const probeFish = {
            x: migrationProbe.targetX,
            y: migrationProbe.targetY,
            region: migrationProbe.sourceRegion
        };

        migrationProbe.chunk.fish.push(probeFish);
        fishMigrations.length = 0;
        queueFishMigration(migrationProbe.chunk, probeFish);
        const queued = fishMigrations[0] === migrationProbe.chunk &&
            fishMigrations[1] === migrationProbe.neighbor && fishMigrations[2] === probeFish;
        fishMigrations.length = 0;
        const migrated = migrateFishToChunk(migrationProbe.chunk, migrationProbe.neighbor, probeFish);
        const targetIndex = migrationProbe.neighbor.fish.indexOf(probeFish);
        const migrationPassed = queued && migrated && targetIndex !== -1 && migrationProbe.chunk.fish.indexOf(probeFish) === -1;

        if (targetIndex !== -1) migrationProbe.neighbor.fish.splice(targetIndex, 1);
        record('Fish ownership migrates between chunks', migrationPassed, migrationPassed ? 'Border crossing queued and transferred' : 'Migration failed');
    }

    const rope = createFishingRope(0, 0, 0, 0, 88);

    for (let frame = 0; frame < 240; frame++) {
        const amount = frame / 239;
        updateFishingRope(rope, 0, 0, 72 * amount, 12 - Math.sin(amount * Math.PI) * 18, 1000 / 60, frame > 180 ? 1 : 0.6);
    }

    const finite = rope.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    const first = rope.points[0];
    const last = rope.points[rope.points.length - 1];
    const anchored = first.x === 0 && first.y === 0 && Math.abs(last.x - 72) < 0.01 && Math.abs(last.y - 12) < 0.01;

    record('Cast rope stays finite and anchored', finite && anchored, `${rope.points.length} simulated points`);

    const activeParticlesBeforeSnap = particlePool.filter(image => image.active).length;
    spawnLineSnap(scene, scene.time.now, rope);
    const activeParticlesAfterSnap = particlePool.filter(image => image.active).length;
    const snapPassed = activeParticlesAfterSnap > activeParticlesBeforeSnap;

    record('Line failure creates visible fragments', snapPassed, `${activeParticlesAfterSnap - activeParticlesBeforeSnap} fragments spawned`);

    for (const image of particlePool) {
        if (image.active && image.particleBorn === scene.time.now && image.particleLifetime === 300) {
            releaseParticle(image);
        }
    }

    const particleCountBeforeReuse = particlePool.length;
    const availableBeforeReuse = availableParticles.length;
    spawnParticle(scene, shadowLayer, scene.time.now, 0, 0, 0, 0, 1, FISHING_LINE_COLOR);
    const reusedParticle = particlePool.length === particleCountBeforeReuse && availableParticles.length === availableBeforeReuse - 1;
    const reusedImage = particlePool.find(image => image.active && image.particleLifetime === 1);
    if (reusedImage) releaseParticle(reusedImage);
    record('Particle pool reuses objects in constant time', reusedParticle, reusedParticle ? 'Free-list object reused' : 'Unexpected allocation');

    showCatchCard(scene, scene.time.now, FISH_SPECIES[0]);
    const catchCardPassed = catchCardTitle.textContent === 'Bluegill' &&
        catchCardDetail.textContent.includes('7c') && catchCardContainer.visible;

    record('Catch card presents species and value', catchCardPassed, catchCardPassed ? 'Name and price rendered' : 'Catch card content missing');
    if (catchCardHideEvent) catchCardHideEvent.remove(false);
    scene.tweens.killTweensOf(catchCardContainer);
    scene.tweens.killTweensOf(catchCardTextLayer);
    catchCardContainer.setVisible(false);
    catchCardTextLayer.setVisible(false);
    catchCardUntil = 0;

    return {
        passed: results.every(result => result.passed),
        generatedAt: new Date().toISOString(),
        results
    };
}

const APP_CACHE_BUSTER = window.APP_CACHE_BUSTER;
const APP_QUERY = new URLSearchParams(window.location.search);
const TEST_MODE = APP_QUERY.has('test');
const CHEATS_ENABLED = APP_QUERY.get('cheats') === 'true';

const withCacheBuster = (path) => `${path}?v=${APP_CACHE_BUSTER}`;

function getPixelPerfectZoom() {
    const ratio = window.devicePixelRatio || 1;
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    const scale = Math.floor(Math.min(width * ratio / 320, height * ratio / 192));

    return Math.max(1, scale) / ratio;
}

let resizeFrame = 0;

window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        if (game) {
            const zoom = getPixelPerfectZoom();
            if (game.scale.zoom !== zoom) game.scale.setZoom(zoom);
        }
    });
});

window.addEventListener('beforeunload', saveProgress);
window.addEventListener('pagehide', saveProgress);
document.addEventListener('visibilitychange', () => { lastPlayTime = null; if (document.visibilityState === 'hidden') saveProgress(); });
document.getElementById('game-container').addEventListener('contextmenu', event => event.preventDefault());

const config = {
    type: Phaser.AUTO,

    width: 320,
    height: 192,

    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },

    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
        zoom: getPixelPerfectZoom()
    },

    parent: 'game-container',

    dom: {
        createContainer: true
    },

    loader: {
        maxParallelDownloads: 6
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

let game;

function startGame() {
    if (game) return;
    config.scale.zoom = getPixelPerfectZoom();
    game = new Phaser.Game(config);
}

setTimeout(startGame, 3000);
document.fonts ? (() => { try { document.fonts.load('16px m6x11').then(startGame, startGame); } catch (error) {} })() : startGame();

const TILE_SIZE = 16;
const DIRT_CLIFF_TILES = [
    ['dirtEdge', 'dirtEdgeOuterRight', 'dirtEdgeInnerRight'],
    ['dirtEdgeOuterLeft', 'dirtEdgeOuterBoth', 'dirtEdgeOuterLeftInnerRight'],
    ['dirtEdgeInnerLeft', 'dirtEdgeInnerLeftOuterRight', 'dirtEdgeInnerBoth']
];
const TERRAIN_CORNER_OFFSETS = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
];

const HOTBAR_X = 43;
const HOTBAR_Y = 155;
const HOTBAR_SLOT_SIZE = 26;
const ITEM_LABEL_DURATION = 1300;

const CHUNK_SIZE = 16;
const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE;
const WOOD_MASK_MARGIN = TILE_SIZE;
const WOOD_MASK_SIZE = CHUNK_PIXEL_SIZE + WOOD_MASK_MARGIN;
const WOOD_SHADOW_OFFSET = 2;
const SHORE_DISTANCE_MARGIN_TILES = 2;
const SHORE_DISTANCE_MAX = 24;
const WATER_BASE_COLOR = [0x68, 0x90, 0xca];
const WATER_FOAM_OFFSETS = [[0, -1], [-1, 0], [1, 0]];
const WATER_BANK_OFFSETS = [[0, -1], [0, -2], [0, -3], [-1, -1], [-1, 0]];
const CHUNK_LOAD_RADIUS = 1;
const MIN_POND_TILES = 4;
const CHUNK_DISCOVERY_RADIUS = 2;
const DEFAULT_WORLD_SEED = 6767676767676;
const WORLD_SEED_KEY = 'pixcation-seed';
const WORLD_SEED = loadWorldSeed();
const WORLD_SEED_CODE = getRequestedWorldSeed() || String(WORLD_SEED);
const WORLD_HASH_MULTIPLIER = 1442695040888963407;
const WORLD_FEATURE_SCALE = 0.42;
const MIN_BRIDGE_WATER_LENGTH = 2;
const MAX_BRIDGE_WATER_LENGTH = 6;
const MIN_PIER_WATER_LENGTH = 4;
const MAX_PIER_WATER_LENGTH = 7;
const WORLD_CACHE_LIMIT = 50000;
const TILE_CACHE_CHUNK_LIMIT = 256;

const FISH_MAX_VISIBLE = 24;
const FISH_VIEW_MARGIN = 12;
const FISH_SIZE_CLASSES = {
    small: { label: 'Small', length: 6, radius: 1.5, difficulty: 0.15 },
    medium: { label: 'Medium', length: 10, radius: 2.4, difficulty: 0.48 },
    large: { label: 'Large', length: 14, radius: 3.4, difficulty: 0.78 },
    giant: { label: 'Monstrous', length: 42, radius: 10, difficulty: 1.65 }
};
const FISH_MIN_DEPTH = 3;
const FISH_PER_CHUNK_MAX = 5;
const FISH_WATER_PER_FISH = 5000;
const FISH_MIN_REGION = 1800;
const FISH_SWIM_SPEED = 13;
const FISH_ACCELERATION = 40;
const FISH_FLEE_ACCELERATION = 220;
const FISH_IDLE_TURN = 0.5;
const FISH_DRAG = 0.6;
const FISH_COAST_DRAG = 1.6;
const FISH_BURST_MIN = 300;
const FISH_BURST_RANGE = 350;
const FISH_COAST_MIN = 350;
const FISH_COAST_RANGE = 700;
const FISH_BEAT_THRUST = 3.2;
const FISH_BEAT_COAST = 0.9;
const FISH_BEAT_IDLE = 0.7;
const FISH_SWEEP_THRUST = 0.16;
const FISH_SWEEP_FLEE = 0.2;
const FISH_SWEEP_COAST = 0.05;
const FISH_SWEEP_IDLE = 0.06;
const FISH_FLEE_SPEED = 42;
const FISH_TURN = 2.2;
const FISH_FLEE_TURN = 7;
const FISH_NOTICE_MIN_DISTANCE = 7;
const FISH_NOTICE_MAX_DISTANCE = 44;
const FISH_NOTICE_MIN_DISTANCE_SQUARED = FISH_NOTICE_MIN_DISTANCE * FISH_NOTICE_MIN_DISTANCE;
const FISH_NOTICE_MAX_DISTANCE_SQUARED = FISH_NOTICE_MAX_DISTANCE * FISH_NOTICE_MAX_DISTANCE;
const FISH_NOTICE_DOT = 0.48;
const FISH_NOTICE_SCAN_TIME = 160;
const FISH_LURE_SPEED = 10;
const FISH_LURE_TURN = 5;
const FISH_LURE_PULSE_TIME = 240;
const FISH_INSPECT_MIN = 380;
const FISH_INSPECT_RANGE = 360;
const FISH_NIBBLE_DIP_TIME = 150;
const FISH_IDLE_MIN = 700;
const FISH_IDLE_RANGE = 2600;
const FISH_SCARE_DISTANCE = 40;
const FISH_SCARE_DISTANCE_SQUARED = FISH_SCARE_DISTANCE * FISH_SCARE_DISTANCE;

const CHARACTER_SIZE = 16;
const CHARACTER_SPEED = 60;
const CHARACTER_ANIMATION_SPEED = 8;
const CHARACTER_SPRINT_MULTIPLIER = 1.65;
const CHARACTER_WALK_FRAMES = [0, 1, 0, 2];
const CHARACTER_HITBOX_X = 4;
const CHARACTER_HITBOX_Y = 12;
const CHARACTER_HITBOX_WIDTH = 8;
const CHARACTER_HITBOX_HEIGHT = 4;
const CHARACTER_CORNER_NUDGE = 4;

const GUIDE_SIZE = 16;
const ACTOR_SHADOW_X = 3;
const ACTOR_SHADOW_Y = 14;
const ACTOR_SHADOW_SHAPE = [
    '.########.',
    '##########',
    '..######..'
];
const SHADOW_PALETTE_TEXTURES = [
    'grass1', 'grass2', 'grass3', 'grass4', 'grassEdge', 'dirt1', 'dirtEdge',
    'corner', 'dirtEdgeCorner', 'dirtCliffCorner', 'cornerDirt1', 'cornerDirt2', 'cornerDirt3',
    'transition1', 'transition2', 'transition3', 'transition4', 'wood', 'woodLeft', 'woodRight', 'bush'
];
const GUIDE_INTERACTION_DISTANCE = 26;
const GUIDE_INTERACTION_DISTANCE_SQUARED = GUIDE_INTERACTION_DISTANCE ** 2;
const GUIDE_HITBOX_X = 4;
const GUIDE_HITBOX_Y = 12;
const GUIDE_HITBOX_WIDTH = 8;
const GUIDE_HITBOX_HEIGHT = 4;

const DIALOGUE_HIDDEN_Y = -78;
const DIALOGUE_VISIBLE_Y = 6;
const DIALOGUE_OPTION_X = 222;
const DIALOGUE_OPTION_TOP = 11;
const DIALOGUE_OPTION_STEP = 19;
const DIALOGUE_OPTION_WIDTH = 86;
const DIALOGUE_OPTION_HEIGHT = 17;
const DIALOGUE_TYPE_DELAY = 24;
const DIALOGUE_PORTRAIT_Y = 13;

const MAP_PANEL_HEIGHT = 142;
const MAP_WIDTH = 296;
const MAP_HEIGHT = 114;
const MAP_TOP = 22;
const MAP_HIDDEN_Y = -MAP_PANEL_HEIGHT;

const INVENTORY_HEIGHT = 142;
const INVENTORY_HIDDEN_Y = -INVENTORY_HEIGHT;
const FISHPEDIA_ROWS = 13;
const FISHPEDIA_LIST_X = 12;
const FISHPEDIA_LIST_Y = 22;
const FISHPEDIA_ROW_HEIGHT = 8;
const FISHPEDIA_COLUMN_WIDTH = 100;
const FISHPEDIA_DETAIL_X = 216;
const FISHPEDIA_DETAIL_WIDTH = 92;

const STORE_WIDTH_TILES = 3;
const STORE_HEIGHT_TILES = 2;
const STORE_WIDTH = STORE_WIDTH_TILES * TILE_SIZE;
const STORE_HEIGHT = STORE_HEIGHT_TILES * TILE_SIZE;
const STORE_HITBOX_X = 2;
const STORE_HITBOX_Y = STORE_HEIGHT - 8;
const STORE_HITBOX_WIDTH = STORE_WIDTH - 4;
const STORE_HITBOX_HEIGHT = 8;

const MARKET_INTERACTION_DISTANCE = 34;
const MARKET_INTERACTION_DISTANCE_SQUARED = MARKET_INTERACTION_DISTANCE ** 2;
const MARKET_HEIGHT = 142;
const MARKET_HIDDEN_Y = -MARKET_HEIGHT;
const MARKET_DIVIDER_Y = 19;
const MARKET_LIST_X = 12;
const MARKET_LIST_Y = 24;
const MARKET_LIST_WIDTH = 160;
const MARKET_ROW_HEIGHT = 20;
const MARKET_DETAIL_X = 178;
const MARKET_DETAIL_WIDTH = 130;
const MARKET_FOOTER_Y = 126;
const MARKET_TAB_Y = 5;
const MARKET_TAB_X = 14;
const MARKET_TAB_WIDTH = 34;
const BAIT_SLOT_X = HOTBAR_X + 9 * HOTBAR_SLOT_SIZE + 4;

const CHEST_SALT = 7331;
const CHEST_CHANCE = 0.4;
const CHEST_PLACEMENT_ATTEMPTS = 24;
const CHEST_MIN_DEPTH = 8;
const CHEST_SNAG_MARGIN = 2;
const CHEST_REEL_DURATION = 560;
const CHEST_FISH_CHANCE = 0.55;
const CHEST_FISH_WATER = 8000;
const CHEST_BUBBLE_MIN = 1400;
const CHEST_BUBBLE_RANGE = 2600;
const CHEST_BUBBLE_LIFETIME = 540;
const CHEST_BUBBLE_COLOR = 0xa9d4e4;
const CHEST_SPARKLE_COLORS = [0xe8c170, 0xf6f5e5, 0xd69a55];

const PROMPT_Y = HOTBAR_Y - 25;

const SHIMMER_RECOLOR_FROM = [0x87, 0xbe, 0xd8];
const SHIMMER_RECOLOR_TO = [0x78, 0xaf, 0xd3];
const SHIMMER_TINT_STEPS = 12;
const FISHING_WATER_SHADOW_COLOR = 0x4770b0;

const OWNED_ROD_TINT = 0x8a7c6e;

const HOOKED_REEL_PULL = 0.55;
const HOOKED_THRASH_RATE = 0.35;
const HOOKED_RADIUS_BASE = 3;
const HOOKED_RADIUS_PER_LENGTH = 0.3;
const HOOKED_SPIN_BASE = 8;
const HOOKED_SPIN_PER_LENGTH = 0.25;
const HOOKED_SPIN_MIN = 4;
const HOOKED_SQUASH = 0.72;
const HOOKED_BEAT = 6;
const HOOKED_SWEEP = 0.22;
const HOOKED_SPLASH_MIN = 180;
const HOOKED_SPLASH_RANGE = 160;

const CAST_MIN_DISTANCE = 16;
const CAST_METER_WIDTH = 14;
const CAST_DURATION = 420;
const CAST_ARC = 18;
const CAST_SWING_DURATION = 170;
const CAST_HANG_TIME = 55;
const REEL_DURATION = 220;

const ROPE_SEGMENT_LENGTH = 4;
const ROPE_GRAVITY = 52;
const ROPE_CONSTRAINT_PASSES = 5;

const BOBBER_LAND_TIME = 180;
const BOBBER_BOB_TIME = 450;

const SPLASH_LIFETIME = 300;
const CATCH_SPARKLES = 6;
const FISH_RISE_MIN = 1800;
const MOTE_INTERVAL = 260;
const MOTE_LIFETIME = 1800;
const MOTE_COLORS = [0xf6f5e5, 0xe1dc7a];
const FLOWER_PETAL_COLOR = 0xf6f5e5;
const PETAL_KICK_CHANCE = 0.6;
const PETAL_LIFETIME = 520;
const WOOD_DUST_CHANCE = 0.45;
const BOBBER_RIPPLE_INTERVAL = 1400;
const BOBBER_RIPPLE_LIFETIME = 420;
const BOBBER_RIPPLE_COLOR = 0x9bd2e1;
const WOOD_DUST_COLORS = [0xb88b61, 0xae7d57];
const FISH_RISE_RANGE = 2600;
const CATCH_SPARKLE_LIFETIME = 420;

const FISHING_LINE_COLOR = 0xf6f5e5;

const FISHING_GAME_X = 286;
const FISHING_GAME_Y = 34;
const FISHING_GAME_PROGRESS_WIDTH = 3;
const FISHING_GAME_PLAY_TOP = 5;
const FISHING_GAME_PLAY_HEIGHT = 91;

const CATCH_CARD_X = 60;
const CATCH_CARD_WIDTH = 200;
const CATCH_CARD_HEIGHT = 48;
const CATCH_CARD_Y = HOTBAR_Y - CATCH_CARD_HEIGHT - 4;
const CATCH_CARD_DURATION = 2400;

const BOBBER_TOP_COLOR = 0xb46044;
const BOBBER_BOTTOM_COLOR = 0xf6f5e5;

const LEAVES_PER_RUSTLE = 2;
const LEAF_LIFETIME = 420;
const LEAF_COLORS = [0x6c955d, 0x4a7a52];
const SEE_THROUGH_LEVEL = 8;
const SEE_THROUGH_STEP = 25;
const SEE_THROUGH_RANKS = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const TREE_LEAF_MIN = 4000;
const TREE_LEAF_RANGE = 6000;
const TREE_LEAF_LIFETIME = 1500;

const BUSH_FOOTPRINT_LEFT = 3;
const BUSH_FOOTPRINT_RIGHT = 29;
const BUSH_FOOTPRINT_HEIGHT = 12;
const BUSH_RUSTLE_PATTERN = [1, 0, -1, 0, 1, 0];
const BUSH_RUSTLE_STEP = 55;
const BUSH_RUSTLE_DURATION = BUSH_RUSTLE_PATTERN.length * BUSH_RUSTLE_STEP;
const BUSH_RUSTLE_REPEAT = 420;

const PROP_TYPES = {
    bush: { width: 2, solid: false, onDirt: false, hitbox: null },
    rock: { width: 1, solid: true, onDirt: true, hitbox: [2, 6] },
    boulder: { width: 2, solid: true, onDirt: true, hitbox: [2, 8] },
    tree: { width: 2, solid: true, onDirt: false, hitbox: null }
};
const PROP_SPAWN_CLEARANCE = 3;
const PROP_FOREST_SCALE = 14;
const PROP_FOREST_LEVEL = 0.72;

const TREE_CANOPY_TILES = 4;
const TREE_HITBOX_HEIGHT = 5;
const TREE_VARIANT_COUNT = 24;
const TREE_TONE_SHARES = [0.09, 0.42, 0.75, 0.97];
const TREE_DITHER_SHARE = 0.015;
const TREE_TRUNK_SHADES = [0.8, 0.88, 0.94, 1, 1.07];
const TREE_TRUNK_CURVES = [[0x553527, 0x674430, 0x75543c, 0x846549, 0x8e7352], [0x454643, 0x92978e, 0xc6cabe, 0xe0e4d8, 0xf2f1e4], [0x3d3834, 0x554e46, 0x716859, 0x8b826e, 0xa69c85], [0x343030, 0x47403d, 0x5b514c, 0x71635b, 0x87776b]];
const TREE_PAD_X = 14;
const TREE_PAD_TOP = 8;
const TREE_SHADOW_SHIFT = 7;
const TREE_SHADOW_DROP = 6;
const TREE_SHADOW_SQUASH = 0.5;
const TREE_SHADOW_DAPPLE = 0.03;
const TREE_SHADOW_EDGE_DAPPLE = 0.13;
const TREE_CONTACT_SHADOW_SPREAD = 3;
const TREE_LEAF_PALETTES = [
    { weight: 6, colors: [0x376451, 0x4a7a52, 0x6c955d, 0x8eb067, 0xb0c579], extras: [0x7e4332, 0xc0493b] },
    { weight: 2, colors: [0x3f5f3c, 0x587a45, 0x7a9a50, 0x9fb862, 0xc3d27e], extras: [] },
    { weight: 1, colors: [0x2c5348, 0x3a6a55, 0x4f8260, 0x6c9a6a, 0x8db47c], extras: [] },
    { weight: 1, colors: [0x7a4030, 0x9c5634, 0xbd7640, 0xd69a55, 0xe8bd72], extras: [] },
    { weight: 0.8, colors: [0x6b3a3a, 0x8c4a40, 0xae6249, 0xc9825a, 0xdea675], extras: [] },
    { weight: 0.6, colors: [0x8a5a6e, 0xab7085, 0xc98e9e, 0xe0aeb6, 0xf2cdcc], extras: [], trunk: 3 }
];

const DUST_PER_STEP = 3;
const DUST_LIFETIME = 330;
const DUST_COLORS = [0xa7825a, 0xb69a6c, 0x9f7751];
const GRASS_FLECK_COLORS = [0xb0c579, 0x8eb067];
const GRASS_FLECKS_PER_STEP = 2;

const MAP_PAN_SPEED = 90;
const MAP_MAX_ZOOM = 3;
const MAP_FOG_EDGE = 3;
const MAP_FOG_SALT = 9137;
const WATER_BIOME_SCALE = 600;
const WATER_BIOME_OFFSET = [WORLD_SEED % 997, Math.floor(WORLD_SEED / 997) % 991];
const WATER_TINTS = [[0.85, 1.05, 0.96], [1, 1, 1], [0.82, 0.93, 1]];
const FLOWER_COLORS = new Set([0xf6f5e5, 0xe1dc7a, 0xe69d66]);
const FLOWER_PATCH_SOURCE = 0xb46044;
const FLOWER_PATCH_SCALE = 10;
const FLOWER_PATCH_COLORS = [[180, 96, 68], [88, 118, 186], [146, 98, 176], [214, 118, 158]];
const DIRT_BIOME_SCALE = 50;
const DIRT_TINTS = [
    [0, 1.07, 0.98, 0.93],
    [0.5, 1, 1, 1],
    [1, 0.93, 0.95, 0.98]
];
const TREE_PALETTE_WEIGHTS = [
    [0, [1, 3, 0, 3, 2, 0]],
    [0.5, [6, 2, 1, 0.3, 0, 0]],
    [1, [3, 0.5, 4, 0, 0, 2]]
];
const GRASS_BIOME_SCALE = 50;
const GRASS_BIOME_CONTRAST = 1.9;
const GRASS_TINTS = [
    [0, 1.1, 0.98, 1.03],
    [0.28, 1.05, 1.01, 1.02],
    [0.5, 1, 1, 1],
    [0.76, 0.88, 0.98, 0.97],
    [1, 0.75, 0.92, 0.94]
];
const MAP_TREE_SHAPE = [
    [3, 0, 1, 'canopy'],
    [2, -1, 2, 'canopy'],
    [1, -1, 2, 'under'],
    [0, 2, 3, 'shadow'],
    [-1, 0, 3, 'shadow']
];

const CAMERA_EASE = 2;

const PROMPT_SLIDE = 4;

function isValidWorldSeed(value) {
    if (!/^[1-9][0-9]{0,86}$/.test(value)) return false;
    const seed = BigInt(value);
    return seed < (1n << 288n) && (seed <= BigInt(Number.MAX_SAFE_INTEGER) || (seed & 0xffffffffn) !== 0n);
}

function getRequestedWorldSeed() {
    if (typeof window === 'undefined' || !window.location?.search) return null;
    const value = new URLSearchParams(window.location.search).get('seed');
    if (!value || !isValidWorldSeed(value)) return null;
    const seed = BigInt(value);
    return seed < (1n << 288n) && (seed <= BigInt(Number.MAX_SAFE_INTEGER) || (seed & 0xffffffffn) !== 0n) ? value : null;
}

function loadWorldSeed() {
    const requested = getRequestedWorldSeed();
    if (requested) return BigInt(requested) > BigInt(Number.MAX_SAFE_INTEGER) ? Number(BigInt(requested) & 0xffffffffn) : Number(requested);
    try {
        if (TEST_MODE) return DEFAULT_WORLD_SEED;
        const saved = Number(localStorage.getItem(WORLD_SEED_KEY));
        if (Number.isSafeInteger(saved) && saved > 0) return saved;
        const seed = localStorage.getItem(SAVE_KEY) === null ? 1 + Math.floor(Math.random() * 2147483646) : DEFAULT_WORLD_SEED;
        localStorage.setItem(WORLD_SEED_KEY, String(seed));
        return seed;
    } catch (error) {
        return DEFAULT_WORLD_SEED;
    }
}

const NPC_PART_SIZE = 16;
const NPC_FACES = 3;
const NPC_ACCESSORIES = 7;
const NPC_HAIRSTYLES = 10;
const NPC_SHIRTS = 9;
const NPC_ACCESSORY_CHANCE = 0.35;
const NPC_RARE_VANITY_CHANCE = 0.0001, NPC_PASTEL_SKIN_CHANCE = 0.01, NPC_PANTS_STYLES = 5;
const NPC_EYE_COLORS = [0x191820, 0x633d2b, 0x46758b, 0x527349, 0x77794a, 0xadcddd, 0xb18c53], NPC_EYE_WEIGHTS = [0.64, 0.16, 0.07, 0.06, 0.04, 0.02, 0.01];
const NPC_EYE_PALETTES = NPC_EYE_COLORS.map(color => [color]);
const NPC_APPEARANCE_RADICES = [10000, 100, 65536, 65536, 3, 720, 9, 7, 100, 143, 120, 6, 7, 2, 8, 20, 6, 100, 2, 65536, 5, 65536, 10000, 4294967296];
const NPC_CELL_SIZE = 10;
const NPC_CELL_MARGIN = 2;
const NPC_CELL_CHANCE = 0.45;
const NPC_FISHER_CHANCE = 0.5;
const NPC_TRADER_CHANCE = 0.4;
const NPC_SPAWN_CLEARANCE = 10;
const NPC_TALK_DISTANCE_SQUARED = 24 * 24;
const NPC_TRADE_PERIOD = 60 * 60 * 1000;
const NPC_SKIN_TONES = [
    [0x83645a, 0x9d856f, 0xb5a58b, 0x443c38],
    [0xb07a62, 0xd3a383, 0xe8c4a0, 0x4a3530],
    [0x8c5a3c, 0xb07a52, 0xc99a6c, 0x3a2620],
    [0x5e3a2a, 0x7d4f37, 0x9a6a4a, 0x2a1a16],
    [0x3e2620, 0x58372a, 0x744b38, 0x1e1412],
    [0x9c7abd, 0xc9ace7, 0xebdcff, 0x64477d], [0x80a2bf, 0xafd2eb, 0xd6edf9, 0x506a85], [0x91ad91, 0xbad8b9, 0xe0f0dc, 0x587558], [0xbd93a2, 0xe4bfcd, 0xf8e1ea, 0x805d6c]
];
const NPC_HAIR_COLORS = [
    [0x1f1a1d, 0x2f282c, 0x463c40],
    [0x4a2e22, 0x6b4430, 0x8c5e40],
    [0x6b2f22, 0x8f4430, 0xb06040],
    [0xa07a3a, 0xc9a052, 0xe6c878],
    [0x6e6a6a, 0x969090, 0xbdb7b2],
    [0x9a4a20, 0xc0682c, 0xdc8c44],
    [0x590c85, 0x9215c9, 0xcf3bed]
];
const NPC_SHIRT_COLORS = [
    [0x505aa2, 0x6b88b8],
    [0x4a7a52, 0x6c955d],
    [0x8c3a3a, 0xb05050],
    [0xa07a30, 0xc9a04a],
    [0x2f6f6f, 0x4a9090],
    [0x5e4a7a, 0x7a669a],
    [0xb0a080, 0xd2c4a2],
    [0xb51f70, 0xf63f9b], [0x392348, 0x624078]
];
const NPC_PANTS_COLORS = [
    [0x5c2525, 0x773333, 0x9a4444],
    [0x222840, 0x2e3550, 0x434c70],
    [0x3a2b1f, 0x4e3a2a, 0x6b5240],
    [0x363b25, 0x4a5032, 0x666e46],
    [0x36363c, 0x4a4a52, 0x66666e],
    [0x9b7965, 0xc9a48e, 0xecd0b8], [0x261334, 0x3f1d54, 0x623580]
];
const PLAYER_LOOK = [0, 0, 0, 0, 0, 1, 0, 0];
const PERSON_ARM_TOP = 8;
const PERSON_ARM_BOTTOM = 13;
const PERSON_FOREARM_TOP = 11;
const PERSON_HAND_ROW = 12;
const PERSON_LEG_TOP = 13;
const PERSON_LEFT_ARM = [3, 4];
const PERSON_RIGHT_ARM = [11, 12];
const PERSON_LEFT_LEG = [5, 6, 7];
const PERSON_RIGHT_LEG = [8, 9, 10];
const PERSON_INNER_LEG_COLUMNS = [7, 8];
const NPC_ACCESSORY_COLORS = [
    [0x3f1919, 0x5c2525, 0x773333, 0x9a4444],
    [0x1c2340, 0x2e3a66, 0x43558a, 0x6276ab],
    [0x1e3320, 0x2f4f33, 0x426b46, 0x5e8c60],
    [0x5a4420, 0x8a6a34, 0xb08c48, 0xd2b06a],
    [0x6e6a64, 0xa8a49c, 0xcdc9c0, 0xeceae4],
    [0x9b7965, 0xc2a08a, 0xdfc0aa, 0xf4ddca]
];
const NPC_PART_COLORS = {
    shirtAccent: [0x00d9ff], pantsAccent: [0xdf8fff],
    skin: [0xa40000, 0xd20000, 0xff0000, 0x660000],
    pants: [0x4a0067, 0xb700ff],
    accessory: [0x004a16, 0x00ac34, 0x00ff4d, 0x8affad],
    hair: [0xd07d00, 0xff9900, 0xffdeab],
    shirt: [0x00129e, 0x001eff]
};
const NPC_CAST_REACH = 2;
const NPC_SPEED_MIN = 0.35;
const NPC_SPEED_RANGE = 0.2;
const NPC_ROAM_RADIUS = 4;
const NPC_TRADER_ROAM = 2;
const NPC_FISH_CHANCE = 0.55;
const NPC_PLAN_ATTEMPTS = 12;
const NPC_IDLE_MIN = 3000;
const NPC_IDLE_RANGE = 5000;
const NPC_CHAT_DISTANCE_MIN = 12;
const NPC_SOCIAL_APPROACH_TIME = 12000;
const NPC_HOME_EXIT_RETRY = 750;
const NPC_BLOCKED_PLAN_WAIT = 6000;
const NPC_BLOCKED_PLAN_RETRY = 750;
const NPC_STUCK_TIME = 600;
const NPC_AIM_MIN = 300;
const NPC_AIM_RANGE = 700;
const NPC_CAST_ERROR = 30;
const NPC_LURE_RADIUS = 48;
const NPC_LURE_TIME = 2500;
const NPC_LURE_DELAY = 1500;
const NPC_SCARE_RADIUS = 7;
const NPC_DISAPPOINT_TIME = 900;
const NPC_FISH_MIN = 5000;
const NPC_FISH_RANGE = 7000;
const NPC_PORTRAIT_SCALE = 3;
const NPC_HASTY_CHANCE = 0.4;
const NPC_SPRINT_DISTANCE = 8;
const NPC_MEMORY_LIMIT = 200;
const NPC_FAILED_SPOT_LIMIT = 16;
const NPC_PATH_LIMIT = 500;
const NPC_RETRY_DELAY = 900;
const NPC_MAX_NIBBLES = 3;
const NPC_LOOK_MIN = 2200;
const NPC_LOOK_RANGE = 5000;
const NPC_POWER_ERROR = 0.3;
const DAY_LENGTH_MINUTES = 24;
const RAIN_DEPTH = 40;
const SKY_DEPTH = 50;
const SKY_LIGHT_STOPS = [
    [0, 0.42, 0.47, 0.72],
    [5, 0.42, 0.47, 0.72],
    [6.5, 0.96, 0.8, 0.76],
    [8, 1, 1, 1],
    [17.5, 1, 1, 1],
    [19, 1, 0.82, 0.66],
    [20.5, 0.42, 0.47, 0.72],
    [24, 0.42, 0.47, 0.72]
];
const RAIN_CHANCE = 0.35;
const RAIN_EARLIEST_HOUR = 8;
const RAIN_LATEST_START_HOUR = 14;
const RAIN_LATEST_END_HOUR = 18;
const RAIN_MIN_HOURS = 1.5;
const RAIN_HOUR_RANGE = 2.5;
const RAIN_FADE_HOURS = 0.35;
const RAIN_DIM = 0.16;
const RAIN_DROPS_PER_SECOND = 140;
const RAIN_SPEED = 230;
const RAIN_DRIFT = 40;
const RAIN_FALL_MIN = 40;
const RAIN_FALL_RANGE = 70;
const RAIN_STREAK = 3;
const RAIN_ALPHA = 0.7;
const RAIN_COLOR = 0xc8dcf0;
const RAIN_RIPPLE_COLOR = 0x9bd2e1;
const RAIN_RIPPLE_LIFETIME = 240;
const RAIN_FLECK_LIFETIME = 150;
const FIREFLY_COUNT = 12;
const FIREFLY_MARGIN = 24;
const FIREFLY_WATER_TILES = 3;
const FIREFLY_DARK_LEVEL = 0.4;
const FIREFLY_MIN_HEIGHT = 4;
const FIREFLY_HEIGHT_RANGE = 26;
const FIREFLY_BOB = 4;
const FIREFLY_MAX_HEIGHT = 34;
const FIREFLY_NEAR_HEIGHT = 24;
const FIREFLY_CAMERA_HEIGHT = 160;
const FIREFLY_SPEED = 9;
const FIREFLY_TURN = 2.4;
const FIREFLY_TURN_RATE = 0.0011;
const FIREFLY_BOB_RATE = 0.0017;
const FIREFLY_PULSE_RATE = 0.0021;
const FIREFLY_BASE_GLOW = 0.08;
const FIREFLY_FADE = 900;
const FIREFLY_LIFE_MIN = 6000;
const FIREFLY_LIFE_RANGE = 9000;
const FIREFLY_CORE_COLOR = 0xfff3a6;
const FIREFLY_HALO_COLOR = 0xb8d65a;
const FIREFLY_HALO_ALPHA = 0.6;
const FIREFLY_POOL_COLOR = 0x8fae4a;
const FIREFLY_POOL_ALPHA = 0.35;
const RUMOR_CELL_CHUNKS = 5;
const RUMOR_ATTEMPTS = 4;
const RUMOR_NEAR_TILES = 40;
const RUMOR_FAR_TILES = 100;
const RUMOR_SPAWN_CHANCE = 0.35;
const RUMOR_MAP_COLOR = 0xe8c170;
const FISH_JUMP_MIN = 5000;
const FISH_JUMP_RANGE = 9000;
const FISH_JUMP_DISTANCE = 10;
const FISH_JUMP_HEIGHT = 7;
const FISH_JUMP_TIME = 620;
const FISH_JUMP_TILT = 0.45;
const FISH_JUMP_DEPTH = 6;
const FISH_JUMP_BIG_WEIGHT = 3;
const FISH_JUMP_RUMOR_WEIGHT = 3;
const FISH_JUMP_DROPLETS = 3;
const FISH_JUMP_DROPLET_LIFETIME = 260;
const FISH_JUMP_DROPLET_COLOR = 0xbce6eb;
const NPC_DRAW_MARGIN = 128;
const MYSTERY_CYCLE_MINUTES = 20;
const MYSTERY_FORECAST_CYCLES = 3;
const MYSTERY_CATCH_CHANCE = 0.85;
const MYSTERY_GIANT_WEIGHT = 0.6;
const MYSTERY_SIZE_WEIGHTS = { small: 1.4, medium: 1, large: 0.55 };
const MYSTERY_PLACEHOLDER_COLORS = [0x0026ff, 0x1f5aff, 0x3e8eff];
const MYSTERY_SHADES = [[0.6, 0.5], [0.52, 0.68], [0.42, 0.84]];
const DEAL_ROD_CHANCE = 0.4;
const DEAL_MYSTERY_CHANCE = 0.05;
const DEAL_DISCOUNT_MIN = 0.1;
const DEAL_DISCOUNT_RANGE = 0.15;
const DEAL_BUNDLE_MIN = 3;
const DEAL_BUNDLE_RANGE = 10;

let hotbarSelector;
const hotbarItemImages = [];
const hotbarItemNames = [];
let itemLabelUntil = 0;
let itemPrompt;
let selectedHotbarSlot = 0;
let worldObjectLayer;

const loadedChunks = new Map();
const loadedWaterChunks = new Set();
const loadedShimmerChunks = new Set();
const discoveredChunks = new Set();
const pendingChunks = [];
const pendingWaterChunks = [];
const shimmerPool = [];
const chunkCanvasPool = [];
let chunkCanvasCount = 0;
let waterPipeline;
let activeChunkX = null;
let activeChunkY = null;
let visibleChunkLeft = null;
let visibleChunkRight = null;
let visibleChunkTop = null;
let visibleChunkBottom = null;
let character;
let characterKeys;
let characterDirection = 'front';
let characterWalkPhase = 0;
let characterPace = 1;
let characterMoving = false;

const fishUniforms = new Float32Array(FISH_MAX_VISIBLE * 4);
const fishShapeUniforms = new Float32Array(FISH_MAX_VISIBLE * 4);

let horizontalPriority = 0;
let lastMenuWheelTime = -Infinity;
let verticalPriority = 0;
let guide;
let shadowLayer;
let characterShadow;
const shadowLut = new Map();
const propArt = new Map();
const treeVariants = [];
const treeVariantsByPalette = [];
const staticShadowCasters = [];
const particlePool = [];
const availableParticles = [];

let fishing = null;
let fishingLine;
let fishingWaterShadow;
const pixelPathX = new Int32Array(1024);
const pixelPathY = new Int32Array(1024);
const pixelPathColor = new Int32Array(1024);
let pixelPathLength = 0;
let inventoryFooterHints;
let fishingUiPanel;
let fishingCatchZoneTop;
let fishingCatchZoneMiddle;
let fishingCatchZoneBottom;
let fishingFishMarker;
let fishingProgressFill;
let fishingUiParts = [];
let fishingActionHeld = false;

let castCharge = null;
let spawnReturn = null;
let store;
let guideWasNear = false;
let guideHasMetPlayer = false;
let dialogueContainer;
let dialogueTextLayer;
let dialogueText;
let dialoguePortrait;
let dialogueOptionTexts = [];
let dialogueHighlight;
let dialogueOpen = false;

let mapOpen = false;
let mapContainer;
let mapImage;
let mapTexture;
let mapTextLayer;
let mapDrag = null;
let mapDirty = false;
const mapPan = { x: 0, y: 0 };
let mapZoom = 1;
let mapPalette = null;

let inventoryOpen = false;
let inventoryContainer;
let inventoryTextLayer;
let inventorySummaryText;
let inventoryRowTexts = [];
let inventoryCountTexts = [];
let inventoryNewGameText;
let inventoryHighlight;
let inventoryDetailImage;
let inventoryDetailTexts = [];
let selectedFishIndex = 0;
let newGameConfirmUntil = 0;
let newGameChoice = null;
let catchCardContainer;
let catchCardTextLayer;
let catchCardTitle;
let marketDetailNote;
let catchCardKicker;
let catchCardImage;
let catchCardDetail;
let catchCardHideEvent;
let catchCardUntil = 0;

let marketOpen = false;
let marketContainer;
let marketTextLayer;
let marketOptionTexts = [];
let marketMessageText;
let marketItemImages = [];
let marketPriceTexts = [];
let marketHighlight;
let marketDetailImage;
let marketDetailName;
let marketDetailStatus;
let marketDetailAction;
let marketFeedback = null;
let selectedMarketOption = 0;
let marketPage = 0;
let marketTabTexts = [];

let playerCoins = 100;
const coinDisplay = { value: playerCoins };
const ownedRods = new Set();
const fishInventory = new Map();
const catchLog = new Set();
const baitInventory = new Map();
const openedChests = new Set();
let activeBaitId = null;
let baitSlotImage;
let baitCountText;
let saveDirty = false;
let newGameResetting = false;
let interactionPromptLayer;
let marketPrompt;
let guidePrompt;
let npcPrompt;

let dialogueNode = 'intro';
let dialogueNodes = null;
let dialogueActor = null;
let dialogueNpc = null;
let dialogueName;
let selectedDialogueOption = 0;
let dialogueTypingEvent = null;
let dialogueFullText = '';

let characterMoveRemainderX = 0;
let characterMoveRemainderY = 0;
let characterTextureKey = 'character-front';
let mainCamera;
let cameraScrollX = 0;
let cameraScrollY = 0;
let cameraOffsetX = 0;
let cameraOffsetY = 0;

let promptState = -1;
const promptMotion = { value: 0 };
let startup = null;
let statsOpen = false;
let statsButton;
let statsButtonTextLayer;
let statsContainer;
let statsTextLayer;
const statsValueTexts = [];
const playerStats = { fishCaught: 0, playTimeMs: 0, moneyEarned: 0, fishSold: 0, casts: 0, moneySpent: 0 };
let lastPlayTime = null;

function preload() {
    this.load.atlas('atlas', withCacheBuster('media/atlas.png'), withCacheBuster('media/atlas.json'));
    this.load.image('title-logo', withCacheBuster('media/ui/title/logo.png'));
    this.load.image('ui-button', withCacheBuster('media/ui/title/button.png'));
    this.load.image('stats-panel', withCacheBuster('media/ui/stats/panel.png'));
}

function getTextureAliases() {
    const aliases = [];
    const alias = (key, path) => aliases.push([key, path]);
    const tileKeys = [
        'dirt1', 'dirtEdge', 'cornerDirt1', 'cornerDirt2', 'cornerDirt3', 'dirtEdgeCorner',
        'dirtEdgeOuterLeft', 'dirtEdgeOuterRight', 'dirtEdgeOuterBoth', 'dirtEdgeInnerLeft', 'dirtEdgeInnerRight',
        'dirtCliffCorner', 'waterDirtInnerLeft', 'waterDirtInnerRight', 'corner',
        'grass1', 'grass2', 'grass3', 'grass4', 'grassEdge', 'water', 'waterDirt', 'waterGrass',
        'wood', 'woodLeft', 'woodRight', 'transition1', 'transition2', 'transition3', 'transition4'
    ];

    for (const tileKey of tileKeys) {
        alias(tileKey, `environment/terrain/${tileKey}`);
    }

    for (const key of ['bush', 'boulder', 'rock', 'tree-bare', 'store', 'house']) {
        alias(key, `environment/objects/${key}`);
    }

    for (const mood of ['friendly', 'laughing', 'surprised']) {
        alias(`guide-portrait-${mood}`, `characters/guide/${mood}`);
    }

    for (const rod of MARKET_RODS) {
        alias(rod.texture, `items/rods/${rod.id}`);
        alias(rod.icon, `items/rods/${rod.id}-icon`);
    }

    for (const bait of MARKET_BAITS) {
        alias(bait.texture, `items/baits/${bait.id}Bait`);
        alias(bait.icon, `items/baits/${bait.id}-icon`);
    }

    alias('hotbar', 'ui/hud/hotbar');
    alias('selected', 'ui/hud/selected');
    alias('shop-ui', 'ui/shop/panel');
    alias('guide', 'characters/guide/sprite');
    alias('character-parts', 'characters/people/parts');
    alias('bait-mystery', 'items/baits/mysteryBait');
    alias('bait-mystery-icon', 'items/baits/mystery-icon');
    alias('chest', 'items/chest');
    alias('fishing-ui', 'ui/fishing/panel');
    alias('fishing-catch-zone', 'ui/fishing/catch-zone');
    alias('fishing-fish', 'ui/fishing/fish');
    alias('fishing-progress', 'ui/fishing/progress');
    alias('waterOverlay', 'environment/effects/water-overlay');
    alias('shimmer-art', 'environment/effects/shimmer');
    return aliases;
}

function unpackAtlas(scene) {
    const atlas = scene.textures.get('atlas');
    const source = atlas.getSourceImage();
    const paths = new Map(getTextureAliases().map(([key, path]) => [path, key]));

    for (const path of atlas.getFrameNames()) {
        const frame = atlas.get(path);
        const canvas = document.createElement('canvas');

        canvas.width = frame.cutWidth;
        canvas.height = frame.cutHeight;
        canvas.getContext('2d').drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
        scene.textures.addCanvas(paths.get(path) || path, canvas);
    }

    scene.textures.remove('atlas');
}

function bindGameInput(scene) {
    const heldActions = new Set();
    let cursor = null;
    const setCursor = nextCursor => {
        if (nextCursor === cursor) return;
        scene.input.setDefaultCursor(nextCursor);
        cursor = nextCursor;
    };
    const openMenu = open => { setCursor('default'); open(); };
    scene.input.on('pointermove', pointer => {
        if (newGameChoice?.open) { setCursor(pointer.x >= 48 && pointer.x < 272 && ((pointer.y >= 68 && pointer.y < 85) || (pointer.y >= 130 && pointer.y < 150)) ? 'pointer' : 'default'); return; }
        if (startup) {
            setCursor(startup.phase === 'title' && isStartButtonAt(pointer.x, pointer.y) ? 'pointer' : 'default');
            return;
        }
        const menuOpen = isMenuOpen();
        if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);

            if (row !== -1 && row !== selectedMarketOption) {
                selectedMarketOption = row;
                marketFeedback = null;
                refreshMarketOptions();
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option !== -1 && option !== selectedDialogueOption) {
                selectedDialogueOption = option;
                refreshGuideDialogueOptions();
            }
        } else if (mapOpen && mapDrag && pointer.isDown) {
            const beforeX = Math.round(mapPan.x);
            const beforeY = Math.round(mapPan.y);
            mapPan.x = mapDrag.panX + Math.round((mapDrag.x - pointer.x) / mapZoom);
            mapPan.y = mapDrag.panY + Math.round((mapDrag.y - pointer.y) / mapZoom);
            mapDirty ||= Math.round(mapPan.x) !== beforeX || Math.round(mapPan.y) !== beforeY;
        }

        const overStats = (!menuOpen || statsOpen) && isStatsButtonAt(pointer.x, pointer.y);
        const overActor = !menuOpen && getClickedWorldTarget(pointer);
        setCursor(overStats || overActor ? 'pointer' : 'default');
    });

    const releaseAction = source => {
        if (!heldActions.delete(source)) return;
        fishingActionHeld = heldActions.size > 0;
        if (!fishingActionHeld) releaseCast(scene.time.now);
    };

    const pressAction = source => {
        if (catchCardUntil === Infinity) hideCatchCard(scene);
        const wasHeld = heldActions.size > 0;
        heldActions.add(source);
        fishingActionHeld = true;
        if (!wasHeld) beginCast(scene.time.now);
    };

    const resetActions = () => {
        heldActions.clear();
        fishingActionHeld = false;
        castCharge = null;
        mapDrag = null;
        lastPlayTime = null;
    };
    const resetPlayClock = () => { lastPlayTime = null; };
    scene.game.events.on(Phaser.Core.Events.BLUR, resetActions);
    document.addEventListener('visibilitychange', resetActions);
    scene.game.events.on(Phaser.Core.Events.FOCUS, resetPlayClock);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.game.events.off(Phaser.Core.Events.BLUR, resetActions);
        document.removeEventListener('visibilitychange', resetActions);
        scene.game.events.off(Phaser.Core.Events.FOCUS, resetPlayClock);
        resetActions();
    });

    const releasePointer = pointer => {
        if (pointer.button !== 0) return;
        mapDrag = null;
        releaseAction('pointer');
    };
    scene.input.on('pointerup', releasePointer);
    scene.input.on('pointerupoutside', releasePointer);

    scene.input.keyboard.on('keyup', event => event.code === 'Space' && releaseAction('keyboard'));

    scene.input.on('pointerdown', pointer => {
        if (pointer.button !== 0) return;
        if (spawnReturn) return;
        if (newGameChoice?.open) { setCursor('default'); handleNewGameChoicePointer(pointer); return; }
        if (startup) {
            if (isStartButtonAt(pointer.x, pointer.y)) { setCursor('default'); beginStartup(scene.time.now); }
            return;
        }
        if (statsOpen) {
            if (pointer.x < 32 || pointer.x >= 288 || pointer.y < 24 || pointer.y >= 168) closeStats();
            return;
        }
        if (!isMenuOpen() && isStatsButtonAt(pointer.x, pointer.y)) {
            openMenu(openStats);
            return;
        }
        if (inventoryOpen) {
            const entry = getFishpediaRowAt(pointer.x, pointer.y);
            if (entry !== -1) selectFishpediaEntry(entry);
            else if (pointer.y > DIALOGUE_VISIBLE_Y + INVENTORY_HEIGHT) closeInventory(scene);
        } else if (marketOpen) {
            const row = getMarketRowAt(pointer.x, pointer.y);
            const tab = getMarketTabAt(pointer.x, pointer.y);

            if (tab !== -1) {
                setMarketPage(tab);
            } else if (row !== -1) {
                selectedMarketOption = row;
                buySelectedMarketItem(scene);
            } else if (pointer.y > DIALOGUE_VISIBLE_Y + MARKET_HEIGHT) {
                closeMarket(scene);
            }
        } else if (dialogueOpen) {
            const option = getDialogueOptionAt(pointer.x, pointer.y);

            if (option === -1) {
                finishGuideDialogueText();
            } else {
                selectedDialogueOption = option;
                selectGuideDialogueOption(scene);
            }
        } else if (!mapOpen) {
            const target = getClickedWorldTarget(pointer);

            if (target) {
                openMenu(() => openInteraction(scene, target));
            } else if (isBaitSlotAt(pointer.x, pointer.y)) {
                cycleBait(scene);
            } else {
                pressAction('pointer');
            }
        } else if (pointer.y < DIALOGUE_VISIBLE_Y + MAP_PANEL_HEIGHT) {
            mapDrag = { x: pointer.x, y: pointer.y, panX: mapPan.x, panY: mapPan.y };
        } else {
            closeMap(scene);
        }
    });

    scene.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        if (newGameChoice?.open) return;
        const step = Math.sign(deltaY);

        if (!step || inventoryOpen || startup || statsOpen) return;

        if (isMenuOpen()) {
            if (pointer.event.timeStamp - lastMenuWheelTime < 120) return;
            lastMenuWheelTime = pointer.event.timeStamp;
        }

        if (mapOpen) {
            const zoom = Phaser.Math.Clamp(mapZoom - step, 1, MAP_MAX_ZOOM);
            mapDirty ||= zoom !== mapZoom;
            if (zoom !== mapZoom) mapDrag = null;
            mapZoom = zoom;
        } else if (marketOpen) {
            moveMarketSelection(step);
        } else if (dialogueOpen) {
            moveGuideDialogueSelection(step);
        } else {
            selectHotbarSlot(scene, selectedHotbarSlot + step, true);
        }
    });

    scene.input.keyboard.on('keydown', event => {
        if (newGameChoice?.open) { setCursor('default'); handleNewGameChoiceKey(event); return; }
        if (event.code === 'Tab' || event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
        if (event.repeat) return;
        if (spawnReturn) return;
        if (startup) {
            if (event.code === 'Enter' || event.code === 'Space') { setCursor('default'); beginStartup(scene.time.now); }
            return;
        }

        const code = event.code;
        const key = event.key.toLowerCase();
        const slot = Number(event.key) - 1;

        if (code === 'KeyA' || code === 'ArrowLeft') horizontalPriority = -1;
        if (code === 'KeyD' || code === 'ArrowRight') horizontalPriority = 1;
        if (code === 'KeyW' || code === 'ArrowUp') verticalPriority = -1;
        if (code === 'KeyS' || code === 'ArrowDown') verticalPriority = 1;

        if (code === 'Enter' && !isMenuOpen() && hideCatchCard(scene)) return;
        if (statsOpen) {
            if (code === 'Escape' || code === 'Tab') closeStats();
        } else if (dialogueOpen) handleGuideDialogueKey(scene, event);
        else if (inventoryOpen) handleInventoryKey(scene, event);
        else if (mapOpen) handleMapKey(scene, event);
        else if (marketOpen) handleMarketKey(scene, event);
        else if (key === 'i') openMenu(() => openInventory(scene));
        else if (code === 'Tab') openMenu(openStats);
        else if (code === 'Space') pressAction('keyboard');
        else if (key === 'm') openMenu(() => openMap(scene));
        else if (key === 'b') cycleBait(scene);
        else if (code === 'KeyH') { resetActions(); returnToSpawn(scene); }
        else if (key === 'e') openMenu(() => openInteraction(scene, getInteractionTarget(true)));
        else if (CHEATS_ENABLED && key === 's') spawnSturgeonAtCursor(scene);
        else if (slot >= 0 && slot < 9) selectHotbarSlot(scene, slot);
    });
}

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

const LEGACY_ROD_IDS = { sturdy: 'intermediate', iron: 'master' };
const LEGACY_SPECIES_IDS = {
    minnow: 'common-minnow',
    carp: 'common-carp',
    bass: 'largemouth-bass',
    catfish: 'channel-catfish',
    koi: 'goldfish'
};

function getSavedList(value) {
    return Array.isArray(value) ? value : [];
}

function getSavedSpeciesId(id) {
    return typeof id === 'string' ? LEGACY_SPECIES_IDS[id] || id : null;
}

function getSavedInventory(value) {
    return getSavedList(value).filter(entry => Array.isArray(entry) && entry.length === 2 &&
        typeof entry[0] === 'string' && Number.isSafeInteger(entry[1]) && entry[1] > 0);
}

function restoreSavedRods(scene, rods) {
    for (const savedId of getSavedList(rods)) {
        if (typeof savedId !== 'string') continue;
        const id = LEGACY_ROD_IDS[savedId] || savedId;
        const rod = MARKET_RODS_BY_ID.get(id);

        if (rod && !ownedRods.has(id)) {
            ownedRods.add(id);
            addHotbarItem(scene, rod.icon, rod.label);
        }
    }
}

function restoreSavedFish(fish) {
    for (const [savedId, count] of getSavedInventory(fish)) {
        const id = getSavedSpeciesId(savedId);
        const total = (fishInventory.get(id) || 0) + count;
        if (FISH_SPECIES_BY_ID.has(id) && Number.isSafeInteger(total)) fishInventory.set(id, total);
    }
}

function restoreSavedCatchLog(ids) {
    for (const savedId of getSavedList(ids)) {
        const id = getSavedSpeciesId(savedId);
        if (FISH_SPECIES_BY_ID.has(id)) catchLog.add(id);
    }
}

function restoreSavedTileIds(target, ids) {
    for (const id of getSavedList(ids)) {
        if (Number.isSafeInteger(id)) target.add(id);
    }
}

function restoreSavedBait(bait) {
    for (const [id, count] of getSavedInventory(bait)) {
        if (MARKET_BAITS_BY_ID.has(id)) baitInventory.set(id, count);
    }
}

function restoreSavedStats(stats) {
    let knownFish = 0;
    for (const count of fishInventory.values()) knownFish = Math.min(Number.MAX_SAFE_INTEGER, knownFish + count);
    playerStats.fishCaught = knownFish;
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return;
    for (const key of Object.keys(playerStats)) {
        if (Number.isSafeInteger(stats[key]) && stats[key] >= 0) playerStats[key] = stats[key];
    }
}

function recordPlayerStat(key, amount = 1) {
    playerStats[key] = Math.min(Number.MAX_SAFE_INTEGER, playerStats[key] + amount);
    saveDirty = true;
}

function updatePlayTime(time) {
    if (!TEST_MODE && lastPlayTime !== null && document.visibilityState === 'visible' && document.hasFocus()) {
        recordPlayerStat('playTimeMs', Math.max(0, time - lastPlayTime));
    }
    lastPlayTime = time;
}

function loadProgress(scene) {
    let saved;

    try {
        saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    } catch (error) {
        return;
    }

    if (!saved || saved.version !== 1) return;

    if (typeof saved.coins === 'number' && saved.coins >= 0 && Number.isSafeInteger(Math.floor(saved.coins))) {
        playerCoins = Math.floor(saved.coins);
        coinDisplay.value = playerCoins;
    }

    guideHasMetPlayer = saved.guideMet === true;
    if (character && Array.isArray(saved.position) && saved.position.length === 2 && saved.position.every(Number.isSafeInteger)) character.setPosition(saved.position[0], saved.position[1]);

    restoreSavedRods(scene, saved.rods);
    restoreSavedFish(saved.fish);
    restoreSavedStats(saved.stats);
    restoreSavedCatchLog(saved.catchLog);
    restoreSavedTileIds(discoveredChunks, saved.explored);
    restoreSavedBait(saved.bait);
    activeBaitId = baitInventory.has(saved.activeBait) ? saved.activeBait : null;
    restoreSavedTileIds(openedChests, saved.chests);
    restoreSavedNpcs(scene, saved.npcs);

    for (const chunk of loadedWaterChunks) {
        if (chunk.chest && openedChests.has(chunk.chest.id)) eraseChestSilhouette(chunk);
    }

    refreshBaitSlot();
    refreshMarketOptions();
    mapDirty = true;
}

function saveProgress() {
    if (newGameResetting || !saveDirty || TEST_MODE) return;

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            version: 1,
            coins: playerCoins,
            rods: [...ownedRods],
            fish: [...fishInventory],
            catchLog: [...catchLog],
            explored: [...discoveredChunks],
            bait: [...baitInventory],
            activeBait: activeBaitId,
            chests: [...openedChests],
            guideMet: guideHasMetPlayer,
            position: character ? [Math.round(character.x), Math.round(character.y)] : null,
            npcs: mainCamera ? getSavedNpcs(mainCamera.scene.time.now) : [],
            stats: Object.fromEntries(Object.entries(playerStats).map(([key, value]) => [key, Math.floor(value)]))
        }));
        saveDirty = false;
    } catch (error) {
        saveDirty = true;
    }
}

function resetProgress(nextSeed) {
    try {
        localStorage.removeItem(SAVE_KEY);
        const nextKey = nextSeed ? 'pixcation-save-v1:' + nextSeed : 'pixcation-save-v1';
        if (nextSeed !== undefined && nextKey !== SAVE_KEY) localStorage.removeItem(nextKey);
        if (nextSeed === undefined || nextSeed === null || SAVE_KEY === 'pixcation-save-v1') localStorage.removeItem(WORLD_SEED_KEY);
    } catch (error) {
        return false;
    }

    newGameResetting = true;
    saveDirty = false;
    return true;
}

function createCharacterShadow(scene) {
    const width = ACTOR_SHADOW_SHAPE[0].length;
    const height = ACTOR_SHADOW_SHAPE.length;
    const texture = scene.textures.createCanvas('character-shadow', width, height);
    const image = scene.add.image(0, 0, texture.key).setOrigin(0);

    shadowLayer.add(image);
    const context = texture.getContext();
    characterShadow = { texture, image, context, width, height, pixels: context.createImageData(width, height), x: null, y: null };
}

function updateCharacterShadow(scene) {
    const x = character.x + ACTOR_SHADOW_X;
    const y = character.y + ACTOR_SHADOW_Y;

    if (characterShadow.x === x && characterShadow.y === y) return;

    characterShadow.x = x;
    characterShadow.y = y;
    characterShadow.image.setPosition(x, y);

    const { width, height } = characterShadow;
    const image = characterShadow.pixels;
    image.data.fill(0);

    for (let row = 0; row < height; row++) {
        const shape = ACTOR_SHADOW_SHAPE[row];
        const pixelRow = row * width;
        for (let column = 0; column < width; column++) {
            if (shape[column] !== '#') continue;

            const shaded = getGroundShadowColor(scene, x + column, y + row);
            if (!shaded) continue;

            const index = (pixelRow + column) * 4;
            image.data[index] = shaded[0];
            image.data[index + 1] = shaded[1];
            image.data[index + 2] = shaded[2];
            image.data[index + 3] = 255;
        }
    }

    characterShadow.context.putImageData(image, 0, 0);
    characterShadow.texture.refresh();
}

function isBlockedByProp(left, top, right, bottom) {
    const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);
    const rightTile = Math.floor((right - 1) / TILE_SIZE);
    const leftTile = Math.floor(left / TILE_SIZE) - 1;

    for (let tileY = Math.floor(top / TILE_SIZE); tileY <= bottomTile; tileY++) {
        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
            const type = getPropAt(tileX, tileY);
            if (!type || !PROP_TYPES[type].solid) continue;

            if (propBlocksRect(type, tileX, tileY, left, top, right, bottom)) return true;
        }
    }

    return false;
}

function actorBlocksRect(actor, hitX, hitY, width, height, left, top, right, bottom) {
    return actor && left < actor.x + hitX + width && right > actor.x + hitX &&
        top < actor.y + hitY + height && bottom > actor.y + hitY;
}

function canCharacterOccupy(scene, x, y, ignoreNpc) {
    const left = x + CHARACTER_HITBOX_X;
    const top = y + CHARACTER_HITBOX_Y;
    const right = left + CHARACTER_HITBOX_WIDTH;
    const bottom = top + CHARACTER_HITBOX_HEIGHT;

    if (
        actorBlocksRect(guide, GUIDE_HITBOX_X, GUIDE_HITBOX_Y, GUIDE_HITBOX_WIDTH, GUIDE_HITBOX_HEIGHT, left, top, right, bottom) ||
        actorBlocksRect(store, STORE_HITBOX_X, STORE_HITBOX_Y, STORE_HITBOX_WIDTH, STORE_HITBOX_HEIGHT, left, top, right, bottom) ||
        isBlockedByProp(left, top, right, bottom) ||
        isBlockedByNpc(left, top, right, bottom, ignoreNpc)
    ) {
        return false;
    }

    const leftTile = Math.floor(left / TILE_SIZE);
    const rightTile = Math.floor((right - 1) / TILE_SIZE);
    const topTile = Math.floor(top / TILE_SIZE);
    const bottomTile = Math.floor((bottom - 1) / TILE_SIZE);
    const wholePixels = Number.isInteger(x) && Number.isInteger(y);

    for (let tileY = topTile; tileY <= bottomTile; tileY++) {
        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
            const tile = getWorldTile(tileX, tileY);

            if (tile.blocking === 'full' && !tile.patches?.length) return false;
            if (tile.blocking === 'lower' && bottom > tileY * TILE_SIZE + TILE_SIZE / 2) return false;
            if (tile.blocking === 'lower' || tile.blocking !== 'full' && tile.baseKey !== 'water') continue;

            const surface = getTerrainSurface(scene, tile);
            const startX = Math.max(left, tileX * TILE_SIZE) - tileX * TILE_SIZE;
            const endX = Math.min(right, (tileX + 1) * TILE_SIZE) - tileX * TILE_SIZE;
            const startY = Math.max(top, tileY * TILE_SIZE) - tileY * TILE_SIZE;
            const endY = Math.min(bottom, (tileY + 1) * TILE_SIZE) - tileY * TILE_SIZE;

            if (wholePixels) {
                const rows = getSurfaceWaterRows(surface);
                // Bits startX through endX - 1 cover the hitbox in this tile.
                const columns = (1 << endX) - (1 << startX);
                for (let pixelY = startY; pixelY < endY; pixelY++) {
                    if (rows[pixelY] & columns) return false;
                }
                continue;
            }

            for (let pixelY = startY; pixelY < endY; pixelY++) {
                for (let pixelX = startX; pixelX < endX; pixelX++) {
                    if (surface.water[pixelY * TILE_SIZE + pixelX]) return false;
                }
            }
        }
    }

    return true;
}

function stepCharacter(scene, stepX, stepY, allowNudge) {
    if (canCharacterOccupy(scene, character.x + stepX, character.y + stepY)) {
        character.x += stepX;
        character.y += stepY;
        return true;
    }

    if (!allowNudge) return false;

    for (let offset = 1; offset <= CHARACTER_CORNER_NUDGE; offset++) {
        for (let side = -1; side <= 1; side += 2) {
            const nudgeX = stepX === 0 ? side * offset : 0;
            const nudgeY = stepY === 0 ? side * offset : 0;

            if (
                canCharacterOccupy(scene, character.x + nudgeX + stepX, character.y + nudgeY + stepY) &&
                canCharacterOccupy(scene, character.x + Math.sign(nudgeX), character.y + Math.sign(nudgeY))
            ) {
                character.x += Math.sign(nudgeX);
                character.y += Math.sign(nudgeY);
                return true;
            }
        }
    }

    return false;
}

function moveCharacterAxis(scene, amountX, amountY, allowNudge) {
    const steps = Math.abs(amountX + amountY);
    const stepX = Math.sign(amountX);
    const stepY = Math.sign(amountY);

    for (let step = 0; step < steps; step++) {
        if (!stepCharacter(scene, stepX, stepY, allowNudge)) return false;
    }

    return true;
}

let characterSlide = null;
function returnToSpawn(scene) {
    let destination = null;
    for (let radius = 0; radius <= 8 && !destination; radius++) {
        for (let y = -radius; y <= radius && !destination; y++) for (let x = -radius; x <= radius; x++) {
            if (canCharacterOccupy(scene, x * TILE_SIZE, y * TILE_SIZE)) { destination = [x * TILE_SIZE || 0, y * TILE_SIZE || 0]; break; }
        }
    }
    if (!destination) return;
    if (fishing?.hauling) { showItemLabel(scene, 'Finish hauling before returning'); return; }
    if (fishing) releaseTargetFish(true);
    fishing = null; castCharge = null; fishingActionHeld = false; characterSlide = null;
    stopCharacterForMenu();
    spawnReturn = { phase: 'out', start: scene.time.now, destination, from: [mainCamera.scrollX, mainCamera.scrollY] };
    saveDirty = true;
    itemLabelUntil = 0;
    if (catchCardUntil === Infinity) hideCatchCard(scene);
    fishingLine.clear(); fishingWaterShadow.clear(); drawFishingMinigame();
    if (interactionPromptLayer) { scene.tweens.killTweensOf(promptMotion); promptMotion.value = 0; promptState = 0; interactionPromptLayer.setVisible(false); }
}

function canCharacterRun(scene, x, y, stepX, stepY) {
    for (let step = 1; step <= CHARACTER_CORNER_NUDGE * 2; step++) {
        if (!canCharacterOccupy(scene, x + stepX * step, y + stepY * step)) return false;
    }

    return true;
}

function updateSpawnReturn(scene, time, delta) {
    const transition = spawnReturn;
    const age = time - transition.start;
    if (transition.phase === 'out') {
        ditherInCharacter(scene, Math.max(0, 16 - Math.round(age / 250 * 16)));
        if (age >= 250) {
            character.setPosition(...transition.destination);
            updateCharacterShadow(scene);
            ditherInCharacter(scene, 0);
            transition.phase = 'pan'; transition.start = time;
        }
    } else if (transition.phase === 'pan') {
        const amount = Math.min(1, age / 900), eased = amount < 0.5 ? 4 * amount * amount * amount : 1 - Math.pow(2 - 2 * amount, 3) / 2;
        const targetX = character.x + CHARACTER_SIZE / 2 - mainCamera.width / 2, targetY = character.y + CHARACTER_SIZE / 2 - mainCamera.height / 2;
        mainCamera.setScroll(Math.round(transition.from[0] + (targetX - transition.from[0]) * eased), Math.round(transition.from[1] + (targetY - transition.from[1]) * eased));
        if (amount >= 1) {
            cameraScrollX = targetX; cameraScrollY = targetY; cameraOffsetX = cameraOffsetY = 0;
            transition.phase = 'in'; transition.start = time;
        }
    } else {
        ditherInCharacter(scene, Math.min(16, Math.round(age / 250 * 16)));
        if (age >= 250) { spawnReturn = null; saveDirty = true; }
    }
    updateLoadedChunks(scene); buildPendingChunk(scene); updateChunkVisibility();
    updateTreeShadows(scene, time); updateParticles(time); updateNpcs(scene, time, delta);
    updateActorShading(scene);
    updateActorBlinks(scene, time);
    updateFish(delta); updateSky(scene, time, delta); updateChunkWater(time);
}

function findCharacterSlide(scene, moveX, moveY) {
    for (let offset = 1; offset <= CHARACTER_CORNER_NUDGE; offset++) {
        for (let side = -1; side <= 1; side += 2) {
            for (let axis = 0; axis < 2; axis++) {
                const dx = axis === 0 ? side : 0;
                const dy = axis === 1 ? side : 0;
                const fx = axis === 1 ? moveX : 0;
                const fy = axis === 0 ? moveY : 0;
                const x = character.x + dx * offset;
                const y = character.y + dy * offset;
                let clear = true;

                for (let step = 1; step < offset; step++) {
                    clear = clear && canCharacterOccupy(scene, character.x + dx * step, character.y + dy * step);
                }

                if (clear && canCharacterOccupy(scene, x, y) && canCharacterRun(scene, x, y, fx, fy)) {
                    return { dx, dy, fx, fy, moveX, moveY, steps: offset };
                }
            }
        }
    }

    return null;
}

function advanceCharacterSlide(scene) {
    const slide = characterSlide;
    const last = --slide.steps === 0;
    const x = character.x + slide.dx + (last ? slide.fx : 0);
    const y = character.y + slide.dy + (last ? slide.fy : 0);

    const free = canCharacterOccupy(scene, x, y);

    if (free) {
        character.x = x;
        character.y = y;
    }

    if (last || !free) characterSlide = null;
}

function moveCharacterBy(scene, wholeMoveX, wholeMoveY, moveX, moveY) {
    if (characterSlide && (characterSlide.moveX !== moveX || characterSlide.moveY !== moveY)) characterSlide = null;
    if (characterSlide) return advanceCharacterSlide(scene);

    const blockedX = !moveCharacterAxis(scene, wholeMoveX, 0, moveY === 0);
    const blockedY = !moveCharacterAxis(scene, 0, wholeMoveY, moveX === 0);

    if (blockedX && blockedY && moveX !== 0 && moveY !== 0) {
        characterSlide = findCharacterSlide(scene, moveX, moveY);
        if (characterSlide) return advanceCharacterSlide(scene);
    }

    if (blockedX) characterMoveRemainderX = 0;
    if (blockedY) characterMoveRemainderY = 0;
}

function setCharacterTexture(key) {
    if (character.personBlinkState?.closed && !key.endsWith('-blink') && key !== 'character-dither') key += '-blink';
    if (key === characterTextureKey) return false;

    characterTextureKey = key;
    character.setTexture(key);
    return true;
}

function updateCharacter(scene, time, delta) {
    let moveX = 0;
    let moveY = 0;

    if (!isMenuOpen()) {
        const left = characterKeys.left.isDown || characterKeys.leftArrow.isDown;
        const right = characterKeys.right.isDown || characterKeys.rightArrow.isDown;
        const up = characterKeys.up.isDown || characterKeys.upArrow.isDown;
        const down = characterKeys.down.isDown || characterKeys.downArrow.isDown;

        moveX = left && right ? horizontalPriority : left ? -1 : right ? 1 : 0;
        moveY = up && down ? verticalPriority : up ? -1 : down ? 1 : 0;
        if (moveX !== 0) characterDirection = moveX < 0 ? 'left' : 'right';
        if (moveY !== 0) characterDirection = moveY < 0 ? 'back' : 'front';
    }

    const isWalking = moveX !== 0 || moveY !== 0;
    characterMoving = isWalking;

    if (!isWalking) {
        characterWalkPhase = 1;
        setCharacterTexture(`character-${characterDirection}`);
    } else {
        const pace = characterKeys.sprint.isDown ? CHARACTER_SPRINT_MULTIPLIER : 1;
        const frameDelta = Math.min(delta, 50);
        const distance = CHARACTER_SPEED * pace * frameDelta / 1000 * (moveX !== 0 && moveY !== 0 ? Math.SQRT1_2 : 1);

        characterPace = pace;
        characterWalkPhase += frameDelta * CHARACTER_ANIMATION_SPEED * pace / 1000;
        characterMoveRemainderX += moveX * distance;
        characterMoveRemainderY += moveY * distance;

        const wholeMoveX = Math.trunc(characterMoveRemainderX);
        const wholeMoveY = Math.trunc(characterMoveRemainderY);

        characterMoveRemainderX -= wholeMoveX;
        characterMoveRemainderY -= wholeMoveY;
        moveCharacterBy(scene, wholeMoveX, wholeMoveY, moveX, moveY);

        const walkFrame = CHARACTER_WALK_FRAMES[Math.floor(characterWalkPhase) % 4];

        if (setCharacterTexture(`character-${characterDirection}${walkFrame ? `walk${walkFrame}` : ''}`) && walkFrame) {
            kickUpDust(scene, time, moveX, moveY);
        }
    }

    return isWalking;
}

function followCameraAxis(offset, lag) {
    return Math.abs(lag - offset) > 0.6 ? Math.round(lag) : offset;
}

function updateCamera(delta) {
    const baseScrollX = character.x + CHARACTER_SIZE / 2 - mainCamera.width / 2;
    const baseScrollY = character.y + CHARACTER_SIZE / 2 - mainCamera.height / 2;
    const targetX = baseScrollX + characterMoveRemainderX;
    const targetY = baseScrollY + characterMoveRemainderY;
    const followAmount = targetX === cameraScrollX && targetY === cameraScrollY ? 0 : 1 - Math.exp(-CAMERA_EASE * characterPace * delta / 1000);

    cameraScrollX += (targetX - cameraScrollX) * followAmount;
    cameraScrollY += (targetY - cameraScrollY) * followAmount;

    cameraOffsetX = followCameraAxis(cameraOffsetX, cameraScrollX - targetX);
    cameraOffsetY = followCameraAxis(cameraOffsetY, cameraScrollY - targetY);

    const scrollX = baseScrollX + cameraOffsetX;
    const scrollY = baseScrollY + cameraOffsetY;
    if (mainCamera.scrollX !== scrollX || mainCamera.scrollY !== scrollY) mainCamera.setScroll(scrollX, scrollY);
}

function update(time, delta) {
    if (!character) return;
    if (spawnReturn) { updateSpawnReturn(this, time, delta); return; }
    if (startup) {
        lastPlayTime = null;
        updateStartup(this, time, delta);
        return;
    }

    const isWalking = updateCharacter(this, time, delta);
    updatePlayTime(time);

    character.x = Math.round(character.x);
    character.y = Math.round(character.y);
    const characterDepth = character.y + CHARACTER_SIZE; if (character.depth !== characterDepth) character.setDepth(characterDepth);
    updateCharacterShadow(this);
    updateParticles(time);
    updateFishing(this, time, delta, isWalking);
    updateChestBubbles(this, time);
    updateBushRustle(this, time, isWalking);

    const guideReach = getGuideReach();
    const marketReach = getMarketReach();
    updateGuideInteraction(this, guideReach < 1);
    updateInteractionPrompt(this, guideReach, marketReach);
    updateStatsUI();

    if (mapOpen) updateMapPan(this, delta);

    if (inventoryOpen && newGameConfirmUntil && time >= newGameConfirmUntil) {
        newGameConfirmUntil = 0;
        refreshInventoryUI(time);
    }

    updateLoadedChunks(this);
    buildPendingChunk(this);
    updateCamera(delta);
    updateChunkVisibility();
    updateTreeShadows(this, time);
    updateFish(delta);
    spawnFishRise(this, time);
    spawnMeadowMote(this, time);
    updateNpcs(this, time, delta);
    updateActorBlinks(this, time);
    updateActorShading(this);
    updateFishJumps(this, time);
    updateSky(this, time, delta);
    updateFireflies(time, delta);
    updateChunkWater(time);
}

