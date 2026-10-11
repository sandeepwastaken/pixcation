const NPC_FIRST_NAMES = [
    'Ada', 'Abe', 'Agnes', 'Alba', 'Alder', 'Alma', 'Alvin', 'Amos', 'Anika', 'Ansel', 'April', 'Arlo', 'Arden', 'Ashby', 'Aster', 'Astrid',
    'Aubrey', 'August', 'Ava', 'Avery', 'Basil', 'Bea', 'Benny', 'Bernie', 'Bess', 'Birdie', 'Blair', 'Bodhi', 'Bram', 'Briar', 'Brook', 'Bruno',
    'Cal', 'Calla', 'Calvin', 'Camille', 'Carmen', 'Cass', 'Cedar', 'Cecil', 'Celia', 'Chester', 'Clara', 'Clem', 'Cleo', 'Clover', 'Cody', 'Cora',
    'Cosmo', 'Cyrus', 'Dahlia', 'Daisy', 'Dale', 'Darby', 'Dawn', 'Dean', 'Della', 'Dex', 'Dina', 'Dot', 'Drew', 'Dusty', 'Edie', 'Edgar',
    'Effie', 'Elan', 'Elio', 'Eliza', 'Ellis', 'Elmer', 'Elsie', 'Emil', 'Enzo', 'Esme', 'Etta', 'Ezra', 'Fawn', 'Felix', 'Fern', 'Fig',
    'Finn', 'Fiona', 'Flint', 'Flo', 'Floyd', 'Frankie', 'Fritz', 'Gale', 'Georgie', 'Gil', 'Ginger', 'Gus', 'Hal', 'Hana', 'Hank', 'Harlow',
    'Hattie', 'Hazel', 'Heath', 'Hollis', 'Holly', 'Hugo', 'Ida', 'Ike', 'Imani', 'Indy', 'Ines', 'Iris', 'Ivo', 'Ivy', 'Jada', 'Jasper',
    'Jem', 'Jett', 'Jo', 'Joel', 'Jonah', 'Joni', 'Jude', 'June', 'Juno', 'Kai', 'Kat', 'Keiko', 'Kenji', 'Kit', 'Kona', 'Lark',
    'Laurel', 'Lena', 'Leo', 'Levi', 'Lila', 'Linus', 'Lola', 'Lou', 'Luca', 'Lucy', 'Lulu', 'Mabel', 'Mack', 'Mae', 'Maggie', 'Malia',
    'Maple', 'Marco', 'Margo', 'Marlo', 'Mateo', 'Maude', 'Mavis', 'Max', 'Meadow', 'Mei', 'Mila', 'Milo', 'Mina', 'Miso', 'Moss', 'Murphy',
    'Nadia', 'Nell', 'Nico', 'Nina', 'Noah', 'Noor', 'Nora', 'Oak', 'Odette', 'Olive', 'Ollie', 'Omar', 'Opal', 'Orla', 'Oscar', 'Otis',
    'Otto', 'Pablo', 'Paloma', 'Peg', 'Pepper', 'Percy', 'Pip', 'Piper', 'Poppy', 'Priya', 'Quill', 'Quinn', 'Rafi', 'Ramona', 'Ravi', 'Reed',
    'Reggie', 'Remy', 'Rhea', 'Rio', 'River', 'Robin', 'Rosa', 'Rowan', 'Ruby', 'Rufus', 'Rye', 'Sage', 'Sal', 'Sami', 'Sasha', 'Scout',
    'Selma', 'Shay', 'Sid', 'Sky', 'Sol', 'Sonny', 'Sora', 'Stella', 'Sunny', 'Suki', 'Tad', 'Tali', 'Tam', 'Tess', 'Theo', 'Thea',
    'Tilly', 'Toby', 'Tomas', 'Tova', 'Tuck', 'Uma', 'Una', 'Vera', 'Vic', 'Vida', 'Viggo', 'Vince', 'Wade', 'Walt', 'Wren', 'Wes',
    'Willa', 'Willow', 'Winnie', 'Wyatt', 'Xavi', 'Yara', 'Yuki', 'Yusuf', 'Zadie', 'Zane', 'Zara', 'Zeke', 'Zion', 'Zoe', 'Zora', 'Zuri'
];

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
