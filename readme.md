# Pixcation

Hello! Welcome to the world of Pixcation.

What started out as a simple, pixelated vacation, which is where the name comes from by the way, has turned into something a little more. Explore the island, meet some people, buy some gear, and most importantly, go fishing.

# How to Play

Start by talking to the guide to figure out the general gameplay loop and controls. Or you can just say hi and leave. It's up to you.

Whatever you decide to do, you'll want to head over to the shop and buy your first fishing rod. Once you've got one, equip it in your hotbar using slots 1-9 and head over to the water.

Hold left click or Space to cast your rod.

Now comes the waiting.

Once a fish bites, you'll notice your bobber start splashing up and down. When the fish is fully hooked, the bobber will go down and you'll see some small indicator lines.

Press M to open the map and see the layout of your tiny world

# Press Space again to reel it in.

You'll then have to play a small minigame to actually catch the fish. The harder the fish is to catch, the faster it moves during the minigame, so stay on your toes.

That's pretty much the basics. The rest is up to you.

# Art

As two creators who grew up with the games of the 2000s, we wanted Pixcation to have that same feeling of picking up a game and immediately wanting to explore everything.

We decided to go with a pixel-art-meets-Animal-Crossing style, with a lot of the game's visuals taking inspiration from the games we grew up playing.

You'll probably notice this most with the fish and their designs, but it carries through the rest of the world too. We wanted everything to feel colorful, simple, and nostalgic without taking itself too seriously.

Thanks for playing Pixcation. We hope you have fun.

# Working on the game

Use four spaces for indentation. The `.editorconfig` sets this for JavaScript and HTML, and the bundle keeps the source formatting.

Run `node build-bundle.js` after changing the source. This builds `game.js`, which is what the game loads. Serve this folder with `python3 -m http.server 8000` and open `http://localhost:8000`. Add `?test` to run the game's automated checks.

Run `node --test tests/*.test.js` to check builds, saves, storage behavior, input, particles, chunk streaming, and water sparkle placement without a browser.

The source is split up by what it does:

- `src/art` builds textures, trees, and cliffs.
- `src/world` handles terrain, bridges and piers, surfaces, shadows, water masks, chunks, and streaming.
- `src/environment` handles sparkles, props, the guide and store, shadows, particles, and bush movement.
- `src/fish` handles water regions, spawning, movement, lured fish, and fish updates.
- `src/fishing` handles rod coordinates, casting, bobbers, effects, the minigame, rope physics, and the fishing update.
- `src/ui` contains the screens and their controls.
- `src/runtime` handles startup, shared state, assets, the scene, input, saves, the character, the camera, and the main update.

Game sizes, speeds, timings, and palettes live in `src/runtime/settings.js`. The changing game state lives in `src/runtime/state.js`.

These files still share one script scope. `bundle-order.json` lists them in the order they need to load, including when shared state is initialized. If you add or rename a source file, update that list too. The build preserves source whitespace and checks for missing files, unlisted files, duplicate entries, and syntax errors before replacing the bundle.
