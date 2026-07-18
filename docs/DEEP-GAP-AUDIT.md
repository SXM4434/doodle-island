# Doodle Island — Deep Gap Audit

Last reviewed: 2026-07-18. Sources: OUTLINE, PRD, ARCHITECTURE, BUILD-PLAN, and the current implementation.

## Pillar check

| Pillar | Current state | Gap / next action |
|---|---|---|
| Your hand is crafting | Strong: stroke JSON is canonical; tools, decor, friends, placement, restyle pipeline exist. | Add player inventory beyond visible hotbar; preserve all sources/sinks. |
| Shared persistent place | Partial: net seam, position sync and reliable placed-item sync exist. | Verify live two-client join; sync harvest/project/villager state or mark as solo fallback. |
| Flat things / deep world | Partial: player, residents, critters, Waddles, Miso, Sluggo are billboards over toon world. | Finish texture/material pass and avoid any raw primitive-only landmark. |

## PRD acceptance audit

| Requirement | Status | Evidence / gap |
|---|---|---|
| Paper player / camera / keyboard | Built | `Player.tsx`; 3 view atlas and bob. Touch joystick needs validation. |
| Handcrafted island zones | Built | terrain, pond, cliff, beach; landmarks exist. |
| Gathering + tools + drops | Built | node state, drops, audio and hit feedback. |
| 8 hotbar + 24 bag | Built | Persistent 32-slot inventory: 8 quick slots + 24 backpack slots. |
| Draw-to-craft | Built | class gate, stroke persistence, restyle, tool/furniture/friend routes. |
| Placement / pickup persistence | Built | 0.5 snap, rotate, indoor/outdoor persistence. Ownership rules remain solo. |
| Night combat + healing | Built | mobs, dodge, berry, explicit campfire rest. |
| Multiplayer | Partial | Playroom seam, positional sync, placed items, plants, dock project, and residents use host-owned world snapshots. Two-device acceptance still needs a real session. |
| Settings / reduced motion | Built | Persistent sound and reduce-motion controls are available in the HUD settings panel. |
| Sound | Built baseline | Event SFX plus sparse procedural day/night ambience; mute is persistent. |

## Economy flow

`nodes → wood/stone/fiber/shine/berry` → `draw tools/decor/friends/campfires/homes/dock`

`night mobs → ink` → `tier-2 tools / wallhang`

`fish + surplus resources → Waddles → shine → golden ink`

Current economy health: a persistent 24-slot backpack prevents silent loss. Do not expand currencies before live playtests show a genuine decision gap.

## Deliberately parked per BUILD-PLAN

No extrusion, terrain edits, pets, minimap, player trading, or island expansion were added.

## Verification gate

Every production pass must run `npx tsc --noEmit`, `npm run build`, and update the production preview port after rebuilding. The local Playwright browser cannot create WebGL on this VM, so it can verify module/runtime import errors but not the 3D render.
