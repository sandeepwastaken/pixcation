# Pixcation

Little pixel world you can walk around in. Phaser 3, no build step, just open it in a browser.

The world is generated as you move (not loaded from `map.json` — that file is an old painted map / backup from earlier experiments). Almost everything lives in **`phaser.js`**, which is the game itself, not the Phaser engine (the engine comes from the CDN in `index.html`).

## Run it

Phaser needs HTTP, not `file://`.

```bash
cd pixcation
python3 -m http.server 8000
```

Then go to **http://localhost:8000/index.html**

`build.html` is a separate map painter for exporting JSON. Handy if you want to doodle tiles, but the live game does not read those maps.

## Controls

- **WASD** or arrow keys — move
- **Scroll** or **1–9** — hotbar slots (visual for now)
- **E** — interact with whatever is closest (the guide or the shop); also closes the shop
- **M** — world map, anywhere

First time you meet the guide, dialogue pops up on its own. After that, walking up to the guide or the brown store shows a small hint above the hotbar (`E Talk to the Guide` / `E Market`).

## What's in the repo

| File | What it is |
|------|------------|
| `index.html` | Loads Phaser + `phaser.js`, centers the canvas |
| `phaser.js` | Game code — world gen, player, guide, store, map, market |
| `media/` | Tiles, character frames, UI, font, `store.png` / `rod.png` placeholders |
| `map.json`, `map-old.json` | Unused tilemaps from an older version |
| `build.html` | Tile editor, not the game |

## Features (current)

- Infinite-ish procedural terrain (grass, dirt, water, bridges, piers, bushes)
- Chunk streaming around the player, water shader, shore shimmer
- Guide NPC with dialogue box (pixel font `m6x11`)
- Placeholder **store** (3×2 tiles) spawned behind the guide on valid terrain
- **Minimap** — explored tiles only, gray checkerboard for fog, guide marked in blue
- **Rod shop** — spend coins on rods; bought rods show up in the hotbar (placeholder art in `media/rod.png`)

## Assets

Keep paths in sync with `preload()` in `phaser.js`. Character walk frames live under `media/character/`.

## Credits

- [Phaser](https://phaser.io)
- Original art / starter — project author

No license file yet — add one if you ship this anywhere public.

