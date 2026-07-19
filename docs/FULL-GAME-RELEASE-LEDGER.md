# Doodle Island — Full-Game Release Ledger

Updated: 2026-07-19

This is the current truth record. A checked implementation is **not** marked complete until its stated proof exists. “Build passes” is not visual, multiplayer, or playtest proof.

## Current verdict

**Status: promising vertical slice; not yet a full game.**

The signature loop exists: explore, gather, draw, craft, place, and see a personal mark persist in a cozy island world. The remaining work is mostly about trust, a durable shared world, and repeatable reasons to return—not indiscriminately adding more systems.

---

## A. Drawing studios and conversion

| Item | Status | Proof / remaining work |
|---|---|---|
| Paper objects use player strokes as their visible silhouette | Implemented | Human WebGL review still needed for placed-world readability. |
| Character parts can be customized without replacing the original island kid | Implemented | Character selection is now canvas-coordinate, not CSS overlay. |
| Character part drawing uses focused zoomed boards | Implemented | Regression: hair, top, shoes across front/side/back, save and reopen. |
| Character marks persist | Local browser regression passed | Needs public human confirmation after current deployment. |
| Constructed objects use named kit parts plus authored Face/Edge/Top art | Implemented | Human WebGL check required for every class: fence, chair, table, planter, campfire. |
| Construction preview shares actual placed-item model data | Implemented | Preview physics crash path fixed; live WebGL orbit still requires human validation. |
| Construction preview never creates gameplay Rapier bodies | Fixed | Confirm Item Studio no longer shows a blue/blank screen on public preview. |
| Unsupported WebGL is handled honestly | Implemented | The game/preview preflight and show explanatory fallback instead of blank blue UI. |
| Studio errors are contained locally | Implemented | If either studio fails, recovery must preserve the island and allow reopen. |
| Arbitrary freehand doodle to arbitrary functional 3D mesh | Deliberately out of scope | This would be dishonest and visually incompatible. Construction remains constrained kit geometry plus player-authored surfaces. |

**Do not call this category fully complete until:** public Item Studio and Character Studio draw → save → reopen → craft/place checks succeed in a real WebGL browser.

---

## B. Shared-world trust — release blocker (P0)

| Required contract | Status | Exact proof needed |
|---|---|---|
| Late join receives a current shared island | Partially implemented through host snapshot | Two independent browsers: new guest sees existing placements, plants, residents, projects, and depleted nodes. |
| Host migration preserves the latest island | Partially implemented | Host leaves; remaining client becomes host; third client joins and sees identical island. |
| Guest placement is host-authoritative | Missing | Guest sends intent; host validates bounds/overlap and allocates canonical ID; simultaneous guest/host placement yields no duplication. |
| Guest harvest is host-authoritative | Missing | Host validates range, node state, and tool; both clients see one depletion event; reward ownership is explicit. |
| Gardening, dock/home funding, resident progress are authoritative | Missing | Guest action resolves via host snapshot with matching costs and progress on both browsers. |
| Resource/reward ownership rules are explicit | Missing decision | Decide and document: shared depletion + private rewards, or shared drops with pickup ownership. |
| Persistence survives everyone leaving | Unproven | Verify Playroom persistent rooms, or ship player export/import backup before release. |

**Release rule:** do not market shared building until this table is green in a real two-client test.

---

## C. The three-chapter game spine

### Chapter 1 — Make a refuge

| Requirement | Status | Proof needed |
|---|---|---|
| First tool → first drawing → first placement | Implemented | New player reaches it without explanation beyond short in-game hints. |
| Cottage, storage, sleep, campfire read as useful | Implemented | Five-session observation: players find and understand each without prompted explanation. |
| Paper cutouts and constructed objects read as different kinds of thing | Implemented in design | Human observation: players can predict which objects are flat vs physical. |

### Chapter 2 — Help the island take shape

| Requirement | Status | Proof needed |
|---|---|---|
| Draw a resident, do favor, fund home | Implemented | Playtest completion and understandable goals. |
| Completed resident asks for a drawn display contribution near their home | Implemented | Public test: only correct class near the home completes; resident thank-you state persists. |
| Every named resident has one durable identity/payoff | Missing | Implement one role each; no giant procedural dialogue tree. |
| Settlement has visible before/after change | Partial | Home exists; connect several resident completions to a legible settlement composition. |

### Chapter 3 — Make a place worth visiting

| Requirement | Status | Proof needed |
|---|---|---|
| Dock gives an obvious visitor arrival/readability moment | Partial | Visitor arrives, sees path to draw table/settlement, and knows what to tour. |
| One voluntary finite shared project exists after dock | Missing | One permanent visible result; no chore treadmill or marketplace. |
| One visible collection/display payoff | Missing | Choose a single set: fish, shore finds, night trophies, or special drawings. |
| Daily condition changes a small priority without demanding attendance | Partial | Bottle condition exists; validate it affects a decision rather than only flavor text. |

---

## D. Economy and progression

| Item | Status | Required next step |
|---|---|---|
| Existing resource vocabulary is sufficient | Design decision | Do not add another currency without a source/sink map. |
| Wood has meaningful sinks | Strong | Measure whether it crowds out other decisions. |
| Stone, fiber, berry, fish, shine, ink have lasting desired sinks | Partial/weak | Add only bounded chapter/project sinks after shared authority is secure. |
| Crafting costs and yields are balanced | Unproven | Record per-session resource income, craft choices, and project completion from playtests before changing numbers. |
| Tool upgrades unlock new possibility, not only faster hits | Partial | Tie each higher tier to one tangible island/project capability. |

---

## E. Quality and release proof — release blocker (P0)

| Requirement | Status | Proof needed |
|---|---|---|
| Production TypeScript/build checks | Passing | Continue on every milestone. |
| WebGL visual review | Blocked in VM | Real desktop review of homes, interiors, placed constructions, camera/door readability, paper/3D separation. |
| Desktop performance measurement | Instrumented, unmeasured | Capture `window.__perf`: FPS, calls, triangles, textures for empty island, dense plot, night combat, interior. |
| Bundle size | Improved but still large | Initial JS now ~948 KB gzip after studio lazy loading; Rapier and multiplayer remain large chunks. Profile before adding dependencies. |
| Five-person first-session playtest | Missing | Observe first action, first drawing, first “what now?”, what they would show a friend. |
| Accessibility/reduced-motion pass | Partial | Keyboard focus, labels, contrast, and reduced-motion behavior need a final audit. |
| Save recovery | Partial | Confirm saved character/items/world survive close/reopen and establish explicit backup/export if shared persistence is not proven. |

---

## Next work order

1. Publicly verify the Item Studio and Character Studio reliability milestone in a real WebGL browser.
2. Implement host-authoritative **placement** first, then harvest and project/funding intents.
3. Run and record the two-client acceptance matrix.
4. Build one named-resident payoff and one finite post-dock shared project.
5. Choose one visible collection/display loop.
6. Run five first-session playtests; tune onboarding and resource sinks from observed behavior.
7. Perform desktop performance + human visual review before calling the game complete.

## Explicit non-goals until the ledger is green

- Arbitrary doodle-to-3D mesh generation.
- Terrain editing or infinite procedural worlds.
- PvP, marketplace, trading economy, or forced daily chores.
- New currencies, broad catalogs, pets, or feature accumulation in place of the shared-world contract.
