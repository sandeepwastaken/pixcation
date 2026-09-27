# Pixcation

Little pixel world you can walk around in. Phaser 3, no build step, just open it in a browser.

The world is generated as you move (not loaded from `map.json` — that file is an old painted map / backup from earlier experiments). Almost everything lives in **`phaser.js`**, which is the game itself, not the Phaser engine (the engine comes from the CDN in `index.html`).

## Run it

Phaser needs HTTP, not `file://`.

```bash
cd pixcation
python3 -m http.server 8000
```

Then go to **http://localhost:8000/index.html?dev=1** while developing. The `dev=1` switch bypasses the browser cache; omit it for release-style cached loading.

`build.html` is a separate map painter for exporting JSON. Handy if you want to doodle tiles, but the live game does not read those maps.

Open **http://localhost:8000/tests.html** to run automated movement, fish-region and rope-casting checks.

## Controls

- **WASD** or arrow keys — move
- **Shift** — hold to run
- **Space** or **click** — with a rod selected, hold to charge and release to cast; press again to reel in
- **Scroll** or **1–9** — select a hotbar slot
- **E** — interact with whatever is closest (the guide or the shop); also closes the shop
- **M** — world map, anywhere (WASD / arrows or drag to pan, scroll to zoom)
- **I** — inventory and fishpedia; press **N** twice there to start a new game

First time you meet the guide, dialogue pops up on its own. After that, walking up to the guide or the brown store shows a small hint above the hotbar (`E Talk to the Guide` / `E Market`).

## What's in the repo

| File | What it is |
|------|------------|
| `index.html` | Loads Phaser and the game modules, centers the canvas |
| `phaser.js` | Core game code — world gen, player, fishing, UI and persistence |
| `water-pipeline.js` | Water, shoreline, shadow and fish-shape WebGL shader |
| `media/` | Tiles, character frames, UI, font, `store.png` / `rod.png` placeholders |
| `map.json`, `map-old.json` | Unused tilemaps from an older version |
| `build.html` | Tile editor, not the game |
| `tests.html` | Browser-based movement, fish-region and casting regression checks |

## Features (current)

- Infinite-ish procedural terrain (grass, dirt, water, bridges, piers, bushes)
- Chunk streaming around the player, spread across frames so walking never hitches
- **Water** — pixel-perfect shader with warped caustics, depth by distance to shore, lapping shallows, coastline shimmer, sparkles, and fish shadows swimming around
- **Shadows** — one-step palette shifts (never dark overlays) for bridges, piers, bushes, the store, the guide, and the player; overlapping shadows merge instead of stacking
- Footstep dust on dirt, bushes that rustle and drop leaves when you walk through them
- Guide NPC with dialogue box (pixel font `m6x11`); keyboard, scroll wheel, or mouse to pick options
- Placeholder **store** (3×2 tiles) spawned behind the guide on valid terrain
- **Map** — explored tiles only in the game's own palette, fog checkerboard, markers for you, the guide, and the store
- **Rod shop** — list + detail pane, spend coins on rods; bought rods show up in the hotbar (placeholder art in `media/rod.png`)
- **Casting** — overhead rod swing, point-chain rope physics, a bouncing and drifting bobber, water-tone splashes, and instant ground misses
- **Rod upgrades** — Basic, Sturdy and Iron rods differ in cast distance and charge speed, with line-strength and catch-zone stats ready for the catch mechanic
- **Fishing loop** — fish notice casts in front of them, approach in pulses, inspect the bobber, nibble 0–4 times, then bite with a size-scaled reaction window
- **Reeling minigame** — hold Space or the mouse to lift the catch zone; fish size controls movement difficulty, while better rods provide a larger zone and stronger line
- **Catch feedback** — successful catches get an animated species, size and value card; failures snap the line into falling fragments and send the fish fleeing
- **Fish progress** — six weighted species are selected by shadow size and water-area size, catches stack in inventory, and the shop buys the full haul for coins
- **Fishpedia** — press I to see discovered species, carried stacks, individual prices and total haul value
- **Saving** — coins, rods, catches, fish inventory, explored map chunks and guide progress autosave to local storage

## Assets

Keep paths in sync with `preload()` in `phaser.js`. Character walk frames live under `media/character/`.

## Credits

- [Phaser](https://phaser.io)
- Original art / starter — project author

No license file yet — add one if you ship this anywhere public.
