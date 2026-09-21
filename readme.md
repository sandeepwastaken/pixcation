# Pixcation

A small Phaser-based pixel-art demo/game prototype. This repository contains a lightweight HTML+JS game using Phaser, a tilemap (`map.json`), and local media assets under `media/`.

## Contents
- **index.html** — main development entry (loads Phaser and game assets)
- **build.html** — production/build preview (if available)
- **phaser.js** — Phaser library (bundled copy)
- **map.json** — map/tilemap data used by the demo
- **map-old.json** — older map backup
- **media/** — image and character assets (see `media/character/`)

## How to run
Open the project in a local HTTP server (Phaser requires loading assets over HTTP). From the project root run one of the following:

```bash
# Python 3
python3 -m http.server 8000

# or using npm http-server (install globally first)
npm install -g http-server
http-server -c-1
```

Then open http://localhost:8000/ in your browser and load `index.html` or `build.html`.

## Development notes
- The game is built on Phaser. `phaser.js` is included for convenience — you can replace it with a CDN or npm-managed version if you prefer.
- Tilemap data lives in `map.json`. Edit or regenerate it with your preferred map editor (e.g., Tiled) and keep the format compatible with the loader used in `index.html`.

## Assets
All visual assets are stored in the `media/` folder. Keep asset filenames and relative paths consistent with the loading code in `index.html`.

## Contributing
- Open an issue for feature requests or bugs.
- For code changes, fork the repo and open a pull request. Keep changes small and focused.

## License
This project is provided as-is. Add a `LICENSE` file (for example, MIT) if you want to set an explicit license.

## Credits
- Phaser (https://phaser.io) — game framework
- Project starter and assets — original author

---

If you'd like, I can:
- add a proper `LICENSE` file,
- wire up a simple build script or npm setup,
- expand the README with developer-specific notes (controls, map format details).

Tell me which of the above you'd like next.
