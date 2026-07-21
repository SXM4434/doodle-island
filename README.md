# Doodle Island

> A hand-drawn paper kid explores a chunky 3D island where the things you draw become part of the place.

**Play the current Bash preview:** [Open Doodle Island on Bash](https://3022-idqgm3fhln50ohvcbgpbs.onbash.tv)

## What it is

Doodle Island mixes a flat felt-tip paper world with a small toon-shaded 3D diorama. Gather island materials, draw tools and paper cutouts, build constrained physical objects from your own part profiles, decorate a cottage, meet residents, and share the island with visitors.

Player marks stay canonical as raw stroke data. The game restyles them, but never substitutes a generated illustration for the player’s shape.

## Run locally

```bash
npm install
npm run dev
```

For a production check:

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Run |
| E | Interact, gather, craft, place |
| R | Rotate a placement preview |
| Esc | Cancel placement |
| 1–8 | Equip hotbar slot |
| Q | Dodge |
| I | Open bag |
| J | Open journal |
| P | Plant an equipped berry |
| C | Eat an equipped berry |

## Drawing routes

- **Paper route:** tools, decorations, trophies, and friends remain distinct flat paper cutouts.
- **Construction route:** a player selects a named part—such as a chair back, seat, or leg—then authors closed front/side/top shapes. Those profiles generate the low-poly physical hull used in both the workshop preview and island placement.

## Project documents

- [`PRD.md`](../uploads/PRD.md) — game requirements
- [`ARCHITECTURE.md`](../uploads/ARCHITECTURE.md) — rendering, state, and multiplayer architecture
- [`docs/DRAWING-GUIDED-3D-AND-CHARACTER-PLAN.md`](docs/DRAWING-GUIDED-3D-AND-CHARACTER-PLAN.md) — authorship and construction contract
- [`docs/FULL-GAME-GAP-ANALYSIS.md`](docs/FULL-GAME-GAP-ANALYSIS.md) — honest release blockers and next priorities

## Current verification status

TypeScript and production builds are checked locally. The VM cannot provide a reliable WebGL context for automated visual validation, so construction silhouettes, camera readability, and preview-to-placement parity still require a real-browser human review.
