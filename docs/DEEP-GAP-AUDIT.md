# Doodle Island — Deep Gap Audit

Last reviewed: 2026-07-18 (desktop-first pass). Sources: OUTLINE, PRD, ARCHITECTURE, BUILD-PLAN, current implementation.

## North-star test

**Explore → gather → draw → build/equip → survive night → show off.**

The island now supports the whole loop. The remaining priority is to make that loop trustworthy, legible, and tested—not inflate it with parked T2 systems.

## Pillar audit

| Pillar | State | Evidence | Remaining gap |
|---|---|---|---|
| Your hand is the crafting system | Strong | Stroke JSON remains canonical. The conversion engine preserves tool/decor silhouettes, and physical furniture carries the actual drawing as its maker-mark. | Validate with real players that a first drawing is clearly “mine” within one minute. |
| Shared persistent place | Partial | Positions, placed items, gardens, dock, and residents pass through `net/`; local save persists the solo island. | Real two-device validation is still required. Harvest, combat, and inventory remain local/solo-authoritative. |
| Flat things / deep world | Stronger | Paper player/NPCs/mobs/tools live in a toon 3D world. Furniture conversion now uses a limited physical kit with real colliders. | Runtime visual review is blocked by this VM’s WebGL-less automated browser. |
| A lived-in island | Built baseline | Player cottage + bed/chest, workshop pavilion, Waddles’ stand, Miso/Sluggo cottages, villagers’ fundable homes/interiors/routines. | NPC dialogue is short flavor; expand only from playtest evidence. |

## Player journey audit

1. **Arrive** — dock spawn, workshop and cottages visible; Miso, Sluggo, Waddles, critters already inhabit the island.
2. **Gather** — trees/rocks/fiber/shells have tools, feedback, drops, respawn, 32-slot inventory.
3. **Make** — Draw Table gives class-first costs; tools retain exact drawings; furniture explicitly chooses chair/table/planter before drawing.
4. **Place and inhabit** — decor remains paper; physical furniture/fences/campfires become chunky world objects with the player’s drawing applied; personal cottage offers chest and sleep.
5. **Night** — wild-zone Scribbles/Wasps, drawn weapons, dodge, berry/campfire/home safety.
6. **Grow community** — drawn friends ask favors, player funds homes, residents build and sleep in interiors.
7. **Show off** — placed stroke data syncs through the multiplayer seam, pending two-device acceptance testing.

## Conversion engine contract

| Intent selected by player | Render language | Behavioral truth |
|---|---|---|
| Axe/pick/sword/rod | Exact paper drawing | Tool class supplies behavior; drawing supplies visible silhouette. |
| Decoration/wall-hang | Exact paper drawing | Drawing is the object. |
| Friend | Paper character | Shares player/NPC art language. |
| Chair/table/planter | Chunky toon 3D form + drawing emblem | Explicit selected form supplies legible shape and real Rapier collider. |
| Fence/campfire | Chunky toon 3D form + drawing emblem | Stable boundary/refuge affordance. |

This is intentionally deterministic. A classifier that guesses a child’s doodle is a chair or sword would be less respectful of player intent than the explicit craft choice. A future model may offer suggestions, never silently substitute intent or discard strokes.

## PRD acceptance audit

| Requirement | Status | Evidence / required validation |
|---|---|---|
| Paper player, camera, keyboard | Built | Default and custom kid share the same 6-cell body/walk atlas. Validate visual readability in live browser. |
| Handcrafted island zones | Built | beach, pond, cliff, workshop, cottages, dock, wild zone. |
| Gathering + tools + feedback | Built | node state, hit-stop, shake, drop magnetism, SFX. |
| 8 hotbar + 24 bag | Built | 32 persistent slots, swap UI. |
| Draw-to-craft | Built | costs, strokes, undo/redo, restyle, exact tool paper form, explicit physical furniture forms. |
| Placement/pickup | Built baseline | snap/rotation/persistence; physical forms use colliders. Two-player authority remains unverified. |
| Combat/night/healing | Built | state machine, telegraphs, dodge, campfire, bed skip, no item loss. |
| Multiplayer | Partial | Seam + snapshots exist. **Must test two separate clients.** |
| Settings/sound/reduced motion | Built | persisted settings and procedural audio baseline. |

## Honest remaining ship blockers

1. **Two-client multiplayer test:** Verify late join, host migration, place/fund/harvest ownership, and no duplicate objects. Do not claim this is “shared persistent” until tested.
2. **Live visual review:** The automated VM browser cannot create a WebGL context. Use a human preview session to inspect overlap/camera/landmark legibility.
3. **Bundle size:** Main client is ~5.8 MB minified / ~2.0 MB gzip and the multiplayer chunk is ~842 KB. It builds, but desktop performance should be profiled before adding major packages.
4. **Preview discipline:** One active production preview only; stop obsolete Vite servers before builds. Old dev-transform graphs caused earlier black screens.
5. **Playtest the custom-kid flow:** The new body-overlay approach is designed to preserve the authored silhouette. Verify three drawings feel expressive, not restrictive.

## Explicitly not added

Per BUILD-PLAN / OUTLINE: no terrain editing, infinite world, pets, player trading, minimap, extrusion of arbitrary freehand polygons, PvP, or opaque ML classification.
