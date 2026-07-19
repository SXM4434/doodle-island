# Doodle Island — Original Plan Reconciliation

Updated: 2026-07-19

This document restores the detailed checklist from the original `BUILD-PLAN.md`, `PRD.md`, and `OUTLINE.md`. It exists because the high-level full-game ledger was not a substitute for the features and polish explicitly promised in the original plan.

Legend:

- **Done in code** — implemented, but may still need human/live validation.
- **Partial** — an implementation exists but misses an original requirement or proof.
- **Missing** — planned, not yet delivered.
- **Changed deliberately** — original approach was replaced for a documented reason.
- **Parked** — explicitly T2/out of v1 scope; not a forgotten task.

## Build Plan phase checklist

### Phase 0 — Look before we leap

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Standard React/R3F/Rapier project scaffold | Done in code | Project builds and runs. |
| `ecctrl@1.0.97` pinned | Needs audit | Confirm package lock/version before release. |
| Platform hosting/persistence unknowns answered | Partial | Preview/VM established; persistent world behavior still unproven. |
| Toon ground visible in Preview | Done in code | Requires human WebGL art review. |

### Phase 1 — Somewhere worth standing

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Handcrafted island: beach, grass, pond, cliff, resource nodes, home plot, central Draw Table | Done in code | Human review of zone readability/camera composition remains. |
| Third-person fixed-ish follow camera with orbit/zoom | Partial | Orbit exists; verify three discrete zoom steps and no below-horizon camera on real browser. |
| WASD movement, run, optional jump | Done in code | Mobile joystick was deferred by explicit desktop-first decision. |
| 2D paper sprite in 3D scene | Done in code | Core visual contract retained. |
| Front/side/back paper flip, walk bob, land squash, blob shadow | Partial | Facing/bob/shadow exist; audit land squash and turning feel in live browser. |
| Capsule collision prevents clipping | Partial | Rapier collision exists; run real collision regression against props/homes/placed furniture. |
| Wander feels pleasant for a minute | Unproven | Requires human playtest, not build success. |

### Phase 2 — The first itch (gathering)

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Tree/rock/fiber/shell gathering | Done in code | Verify every source has clear visual read and respawn. |
| Tool gating, bare-hand fallback | Done in code | Verify player cannot become hard-stuck. |
| Node shake, hit-stop, pop, drops, pickup magnetism, SFX | Done in code | Needs human feel audit. |
| Respawn timing 2–4 minutes | Done in code / tune unproven | Starting values need playtest observation. |
| Compulsive gather loop | Unproven | Requires human playtest. |

### Phase 3 — The signature (draw-to-craft)

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Draw Table entry / full-screen workbench | Done in code | Item Studio is now the concrete implementation. |
| Class-first material-gated creation | Done in code | Costs/chips/insufficient state exist. |
| Undo, redo, three brushes, eraser, normalized raw strokes | Done in code | Draw/save/reopen regression is still required publicly. |
| Restyle never redraw | Done in code | Raw stroke data remains canonical. |
| Two same-class drawings visibly differ | Done in architecture/code | Human world check still required. |
| First craft in under 60 seconds | Unproven | First-time user observation required. |
| Item preview cannot blue-screen | Fixed in code | Public Item Studio confirmation is still required. |
| **Original “solid toggle extrudes one doodle”** | Changed deliberately | Replaced by named construction parts with authored Face/Edge/Top art. Freehand outline extrusion made cardboard/wire forms, failed style and authorship tests. |

### Phase 4 — Making it home

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Placement preview with valid/invalid feedback | Done in code | Real camera/visibility review required. |
| 0.5 grid snap and 90° rotate | Done in code | Verify with actual player. |
| Pick up returns item, no material loss | Done in code | Regression test save/reload/pickup. |
| Decorated space survives reload | Partial | Local persistence exists; shared durable persistence unproven. |
| Furniture/decor distinction is legible | Partial | Paper vs construction split exists; player comprehension untested. |

### Phase 5 — The night has teeth

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| 20-minute day/night, 25% night, lamps/warmth | Partial | Cycle/night/mobs exist; timing and lighting need live visual check. |
| Scribble + Wasp, six-mob cap, wild-zone spawning | Done in code | Verify cap/spawn area in live session. |
| Hearts, weapon swing, dodge i-frames, cooldown | Done in code | Live combat feel and i-frame proof required. |
| Hit-stop, shake, vignette, heart feedback | Done in code | Human game-feel review required. |
| No-loss death home respawn | Done in code | Regression test with occupied inventory. |
| Berries/campfire/calm healing | Done in code | Verify all recovery paths. |
| Forgiving first fight / learnable dodge | Unproven | Needs a novice playtest. |

### Phase 6 — Company

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Room/share multiplayer up to eight | Partial | Playroom setup exists; load/room sharing not validated with 8 people. |
| Smooth remote movement around 150ms delayed | Done in code | Requires two-client live network measurement. |
| Show drawing occupancy but never strokes | Done in code | Needs two-client human check. |
| Placed items travel as stroke data | Done in code | Needs real two-client construction + paper test. |
| Guests gather/place and everyone sees it | Partial / unsafe | Current sync exists, but host authority for guest actions is not complete. This is a release blocker. |
| Late join snapshot / dock arrival wave | Partial | Snapshot exists; arrival presentation/late-join proof remains. |
| Persistent world after all leave | Missing proof | Must validate Playroom persistence or add export/import backup. |
| “Two phones feel like hanging out” | Unproven | Needs real device test. |

### Phase 7 — The face it deserves

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Chunky toon/cel 3D world with outlines | Done in code | Human WebGL art review is mandatory. |
| Hand-drawn kid, mobs, critters, player drawings | Done in code | Character Studio preserves original kid sheet. |
| Distinct sticker/toybox UI | Done in code | Final interaction/a11y review remains. |
| Warm procedural SFX and sound controls | Done in code | Audio balance/accessibility needs human review. |
| “30-second clip cannot be mistaken for another game” | Unproven | Requires a real recorded/human visual review, not a code claim. |

### Phase 8 — Open the gates

| Original promise | Status | Notes / remaining proof |
|---|---|---|
| Deploy and watch real people play | Partial | Public preview is live; structured external playtests have not happened. |
| Stranger gathers, draws, places without instruction | Unproven | This is the primary first-session acceptance test. |
| Fix observed pain rather than imagined pain | Ongoing process | Use `PLAYTEST-AND-ACCEPTANCE.md`; no claim of completion. |

---

## PRD items that were easy to lose in phase summaries

| Requirement | Status | What remains |
|---|---|---|
| 8-slot hotbar + 24-slot bag, stacks to 50, drag arranging | Partial | Inventory exists; drag-to-arrange and stack-cap behavior need explicit verification. |
| Camera has three zoom steps | Needs audit | Verify or implement after source audit. |
| Home plot per player | Partial | Cottage/interior exist; multiplayer ownership/plot rules need authority design. |
| Common areas only allow decor | Partial | Placement policy exists but needs multiplayer validation. |
| Furniture is sittable/placeable | Partial | Placeable is implemented; sitting interaction needs audit/implementation confirmation. |
| Mobs drop ink splat/loot | Done in code | Live proof needed. |
| Late join is under stated visual/network timing | Unproven | Measure in real two-client test. |
| Settings include sound + reduced motion | Done in code | Audit focus and persistence. |
| Zero tutorial beyond four contextual hints | Done in intent | Validate whether hints actually suffice in first playtests. |
| Desktop performance budget | Unproven | `window.__perf` exists; capture real WebGL metrics. |

---

## Outline/T2 items: not missing, intentionally parked

These were explicitly outside v1/T0–T1 and should not be quietly reintroduced as “missing”:

- Island expansion.
- Pets/creature drawing as a deep system.
- Drawing-affects-stats.
- Trading economy / marketplace.
- Terrain editing / block building.
- Infinite procedural worlds.
- PvP.
- Curved horizon shader and minimap.
- Freehand arbitrary extrusion.

The one exception is **construction**: it was revisited because the user explicitly asked for real physical items. It is now constrained construction-kit authoring, not the fragile original arbitrary-extrusion idea.

---

## Immediate missing-work queue from the original plan

1. Confirm Item Studio and Character Studio work in the public real-WebGL preview: draw → save → reopen; build → place.
2. Audit/complete the three camera zoom steps and no-below-horizon constraint.
3. Audit inventory drag arrangement, stack cap, furniture sitting, and home-plot/common-area policy.
4. Make multiplayer world edits host-authoritative; then complete the original two-phone test.
5. Prove persistent world behavior after all players leave, or implement export/import backup.
6. Perform human visual/audio/game-feel review of Phase 1, 2, 5, and 7.
7. Run Phase 8 stranger playtests and fix the observed first-session problems.
