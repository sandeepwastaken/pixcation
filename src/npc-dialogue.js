const NPC_PERSONALITIES = [
    {
        greetings: ["Oh, hello! I'm {first}. Isn't it a gorgeous day?", "Hi there! {first}, nice to meet you. You picked a great day to be out!"],
        familiar: ["Oh, it's you again! Good to see you.","Welcome back! How has your day been?"],
        rainGreetings: ["Oh, hello! I'm {first}. A little rain won't ruin the day.", "Oh, it's you again! We keep meeting in wet weather."],
        chatter: ["I counted three kinds of flowers on my walk this morning. I'm going for four tomorrow.", "The guide by the shop knows everything. Well, almost everything!", "Have you seen the blue flower patches? They make me so happy."],
        fishing: ["Not a nibble yet, but the sun's warm, so who's complaining?", "One almost bit! It changed its mind at the last second, the rascal."],
        tradeDone: "We already traded this hour! Come back a little later, okay?",
        thanks: "Wonderful! Here's {coins}c. You're a natural!"
    },
    {
        greetings: ["Hm? Oh. {first}. What do you want?", "{first}. If you're here to chat, make it quick."],
        familiar: ["You again. All right, what is it?","Back already? Make yourself comfortable, I suppose."],
        rainGreetings: ["{first}. Mind the puddles, and don't drip on my gear.", "You again. At least the rain is quieter than most people."],
        chatter: ["Everyone thinks fishing is relaxing. It is not. It is war.", "The fish around here are smarter than they look. Don't let them fool you.", "Shop prices keep going up. Mark my words."],
        fishing: ["Shh. You'll scare them off. Again.", "They keep nibbling and running. I swear they're laughing at me."],
        tradeDone: "We're done for this hour. Shoo.",
        thanks: "Fine. {coins}c. Don't spend it all at once."
    },
    {
        greetings: ["Oh... hello. I'm {first}. I was just watching the water ripple.", "Mm, hi. {first}. Did you know clouds look like fish if you squint?"],
        familiar: ["Oh... we meet again. The water is different today.","Hello again. I was hoping our paths would cross."],
        rainGreetings: ["I'm {first}. I like listening to the rain on the water.", "Oh... hello again. The rain makes everything sound softer."],
        chatter: ["Sometimes I think the island hums when it's quiet. Can you hear it?", "I like the way the water changes color out in the deep. Teal, then blue, then darker blue.", "I dreamt about a fish as big as a bridge. I'm still looking for it."],
        fishing: ["I'm not really trying to catch anything. The bobber is good company.", "Something swam right up and then... left. Like a thought you almost had."],
        tradeDone: "We traded already, didn't we? Time is so slippery. Maybe in an hour.",
        thanks: "Oh, how lovely. Here, {coins}c. Thank you, truly."
    },
    {
        greetings: ["Ah! Oh, sorry, you startled me. I'm {first}.", "H-hi! I'm {first}. Please don't step on my line!"],
        familiar: ["Oh, h-hi again! I recognize you now.","It's you! That is a relief. How are you?"],
        rainGreetings: ["H-hi, I'm {first}. Do you think this rain will get worse?", "Oh, it's you again! I feel better with someone familiar around."],
        chatter: ["Do you think the cliffs ever crumble? I try not to stand too close.", "I keep a spare bobber in every pocket. Just in case. You never know.", "The chests in the deep water make me nervous. What if something's guarding them?"],
        fishing: ["I had one! Then I panicked and it swam off. Again.", "The splash always scares me more than it scares the fish."],
        tradeDone: "W-we already traded this hour. Sorry! Come back later?",
        thanks: "Th-thank you! Here's {coins}c. I counted it twice."
    },
    {
        greetings: ["Well, well. The name's {first}. Best angler on the island.", "{first}, at your service. You've probably heard of me."],
        familiar: ["Welcome back. Come for more expert advice?","There you are! Ready to hear from the island's finest?"],
        rainGreetings: ["{first}, at your service. A bit of rain is no match for experience.", "Back for more advice? Even in this weather, I see."],
        chatter: ["I once caught a bass so big the scale broke. Nobody believes me.", "A good cast is all in the wrist. And the confidence. Mostly the confidence.", "I've fished every pond on this island. Twice."],
        fishing: ["They're just warming up. Champions are patient.", "That fish was too small for me anyway. I let it go. On purpose."],
        tradeDone: "One deal an hour, friend. Even legends have rules.",
        thanks: "A fine haul. {coins}c, as promised. Tell your friends who paid you."
    },
    {
        greetings: ["Hey, hey! I'm {first}! Oh, I love meeting people. Where are you from?", "Hi! {first} here! Have you been fishing? What did you catch? Tell me everything!"],
        familiar: ["Hey, you're back! What have you been up to?","My friend! Tell me everything since we last talked!"],
        rainGreetings: ["Hey! I'm {first}. Have you noticed how different the island sounds in the rain?", "You're back! Did you get caught in the rain too?"],
        chatter: ["My cousin says the shop gets new rods sometimes. Or was it new bait? Something new, anyway!", "If you walk far enough, the grass goes from gold to green. I tested it. Twice!", "I tried to name every tree on the island. I got to forty and forgot the first one."],
        fishing: ["Nothing yet, but I've been talking the whole time, so that might be why.", "A fish came right up to my bobber and stared at me! Then it left. Rude!"],
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
