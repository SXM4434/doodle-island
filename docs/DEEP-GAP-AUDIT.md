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
| 8 hotbar + 24 bag | Missing | 8 hotbar exists; 24-slot bag is the highest remaining core inventory gap. |
| Draw-to-craft | Built | class gate, stroke persistence, restyle, tool/furniture/friend routes. |
| Placement / pickup persistence | Built | 0.5 snap, rotate, indoor/outdoor persistence. Ownership rules remain solo. |
| Night combat + healing | Built | mobs, dodge, berry, explicit campfire rest. |
| Multiplayer | Partial | Playroom seam and positional/placed sync are implemented; projects/harvest/villagers are not host-authoritative. |
| Settings / reduced motion | Partial | mute exists; reduced motion styles exist; no explicit settings control. |
| Sound | Partial | event SFX exist; no day/night music loop. |

## Economy flow

`nodes → wood/stone/fiber/shine/berry` → `draw tools/decor/friends/campfires/homes/dock`

`night mobs → ink` → `tier-2 tools / wallhang`

`fish + surplus resources → Waddles → shine → golden ink`

Current healthy sink issue: the player can overflow the hotbar silently. The 24-slot bag is required before expanding sources or prices.

## Deliberately parked per BUILD-PLAN

No extrusion, terrain edits, pets, minimap, player trading, or island expansion were added.

## Verification gate

Every production pass must run `npx tsc --noEmit`, `npm run build`, and update the production preview port after rebuilding. The local Playwright browser cannot create WebGL on this VM, so it can verify module/runtime import errors but not the 3D render.
