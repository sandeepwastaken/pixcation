# Numeric seed search

The development-only search tool solves ordinary appearance-roll constraints against the current generator. The game also supports a generic reversible appearance family within the unchanged decimal seed format. No design names, seed literals, or per-character exceptions are stored in that system.

Install the isolated solver dependency with `.venv/bin/python -m pip install -r tools/requirements.txt`.

Run `.venv/bin/python tools/seed-search.py request.json`. JSON can also be supplied on stdin.

A request contains `worldSeed` (the underlying terrain seed), `targets` (NPC tile coordinates), and optional `minimumMatches` (defaults to all targets). Each target normally must actually spawn in its cell; `spawned: false` is for mathematical diagnostics only.

Targets accept `name`, `firstName`, and `look` objects containing zero-based final appearance indices. Face, gender, shirt, and rare first-name requirements are compiled from current game data. Other final appearance requirements are checked using actual generation after each candidate is reconstructed.

Optional `rolls` objects constrain raw appearance-roll indices to an exact integer or an inclusive `[minimum, maximum]` interval. The current radix table and hash constants are read directly from the game code.

Example: `{"worldSeed":13,"targets":[{"x":13,"y":4,"rolls":{"0":[0,100]}},{"x":-18,"y":-13,"rolls":{"0":[0,100]}}],"timeoutSeconds":10}`.

Use `node tools/seed-runtime.js` with JSON stdin `{"action":"scan","worldSeed":13,"count":100,"radius":20}` to discover real nearby spawn points. The scan never forces additional NPCs into a world.

The solver first reconstructs candidates that satisfy one target, checking their effects on every other target. It then tries an exact [Z3](https://z3prover.github.io/api/html/namespacez3py.html) bit-vector search. `sampleCandidates` defaults to 10000; `randomSeed` varies reconstruction and solver search order.

`timeoutSeconds` defaults to 30 and is capped at 300. `maxCandidates` bounds symbolic candidates rejected by runtime verification. `fixedSeed` is a diagnostic option for checking the symbolic model against an existing ordinary numeric seed.

`sat` includes a decimal `seed`, verified match count, and generated residents. `unsat` means no ordinary-generator seed satisfies the supplied raw constraints and match threshold; this search excludes reversible families. `unknown` means the time or verification limit was reached; it may include an independently verified `best` result below the requested match count. Raw-roll impossibility is not a proof that a final visual appearance is impossible.

The tool can find multi-NPC seeds, but cannot promise that arbitrarily many extremely rare matching appearances exist in a chosen region. Exact raw-roll requirements can be stricter than a visual appearance requirement. Never describe a timeout or a partial best result as satisfying the full request.

## Reversible numeric families

`node tools/seed-runtime.js` accepts JSON stdin with `action: "world"`, a 32-bit `worldSeed`, and one or two `designs`. Each design references a naturally generated appearance by `sourceSeed`, `x`, and `y`, plus a desired `count`.

Example: `{"action":"world","worldSeed":13,"designs":[{"sourceSeed":"13","x":13,"y":4,"count":12},{"sourceSeed":"13","x":-18,"y":-13,"count":8}]}`.

Counts from 1 to 127 select existing residents in expanding spawn-centered cell rings. A single design with count 0 applies to all procedurally generated residents. Neither mode adds residents or alters terrain. Separate IDs, movement speeds, roles and behavior seeds remain location-dependent.

The returned decimal seed is accepted by the normal seed field. It is reconstructed through the inverse appearance hash, not a prefixed format or a hardcoded seed exception. `verifiedCounts` reports actual runtime matches, and `examinedResidents` reports the number checked. A world-wide result verifies a sample rather than claiming to enumerate an infinite world.

The generic family selector occupies approximately one in 1,048,576 numeric seed states. Other states retain ordinary generation. Shared appearances are intentionally correlated inside a family, so those worlds are not statistically equivalent to ordinary independent-looking worlds.

Appearance genes are packed using the current trait radices. `getNpcWorldFeatureOffset(field, design)` returns the fixed additive seed offset for increasing a gene by one, modulo 2^288. This applies only to a valid non-wrapping gene change; arbitrary combinations may violate age, gender or color-contrast rules and are rejected by `makeNpcWorldSeed`.

Gene order: first name, surname, gender, age face, pastel mode, skin ramp, hair color, shirt style, shirt color, shirt accent, pants style, pants color, pants accent, headwear mode, hair/headwear style, headwear color, facing flip, eye color, color variation seed, teeth variant. `design` is 0 or 1.

Use `variant` to obtain additional seeds for the same requested designs and terrain. Trait-table dimensions or generation-rule changes may require reconstructing a family seed again. The tool stays outside the published site.
