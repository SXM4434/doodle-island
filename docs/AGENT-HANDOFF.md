# Doodle Island — Agent Handoff

Updated: 2026-07-23

## Non-negotiable working agreement

1. Read `/home/bashtv/.pi/agent/skills/skill-router/SKILL.md` and relevant project docs before every task.
2. Read the PRD, architecture, drawing plan, release ledger, and this handoff before planning or coding.
3. Never claim a visual/gameplay issue is fixed from TypeScript/build success alone. For any visible change, require a real browser check and state exactly what was checked.
4. Keep public preview churn low. The intended server is one Vite dev server on `3022` with `--strictPort`; do not silently accept fallback ports.
5. Commit and push coherent milestones to `SXM4434/doodle-island` on `master`.
6. Update this handoff and `FULL-GAME-RELEASE-LEDGER.md` at every meaningful handoff.

## Current repository / server

- Repository: `https://github.com/SXM4434/doodle-island`
- Branch: `master`
- Intended preview server: `npm run dev -- --host 0.0.0.0 --port 3022 --strictPort`
- Do **not** call `vite preview` on another port while `3022` is occupied.

## What the player wants

Doodle Island is an Animal Crossing / Minecraft-inspired 3D island where drawings are the core authored crafting system.

- Paper route: a player drawing is one flat paper object.
- Construction route: player selects an explicit object/function and authors named physical parts. The player owns each part's silhouette; the semantic rig owns attachment points, safe scale, collision, repetition, and stable supports.
- Construction must never become template tracing. Boards stay blank.
- Construction must also not be arbitrary/no-guidance scribbling: show part-specific guidance and live fit feedback so a freehand shape still reads as the intended part.
- Character style remains the friendly original oversized-head paper island kid. Player art is a real layered paper component, not a white-bordered sticker.

## Current implementation state

### Construction studio

Implemented:

- Explicit Paper vs Construction routes.
- Named construction rigs for fence, chair, table, planter, campfire.
- Typed front / side / top profile data and generated low-resolution visual hulls.
- Direct part selection in the assembled preview.
- Per-part form, material, palette, dimensions, tilt/offset, and real support-stances.
- Blank construction boards; an explicit `Close my shape` action stores the actual closing segment.
- Primary profile completes a required part; side/top are additional depth control, not a forced technical worksheet.
- Live freehand **fit guidance** in `src/draw/construction.ts` / `src/app/DrawTable.tsx`:
  - too small;
  - too wide for upright forms;
  - too tall for rails/tops;
  - too square for supports;
  - ready.
  These messages are descriptive rails only. They must never auto-edit, replace, classify, or reject the player's authored contour.

Required visual proof:

- In a working WebGL browser, create three visibly different chairs and verify each shows its authored silhouette in preview and the placed world.
- Confirm profile hull quality is chunky/faceted rather than noisy/stock-looking.
- Confirm side/top views remain optional and their fit feedback is understandable.

### Character studio

Implemented:

- Original kid master sheet remains the base.
- Modular customization and selected visible parts.
- Zoomed contextual part boards.
- Signature art for hair/top/shoes/accessory, carried across poses.
- Signature size and offset controls; no forced white backing in character marks.

Required proof:

- In a working WebGL browser: draw a hair/top/shoe/accessory signature, save/reopen, and inspect all front/side/back runtime poses for no rectangular halo.

### Player movement / camera

- Player controller is `src/actors/Player.tsx` using pinned `ecctrl@1.0.97`.
- Original known controller configuration was restored in commit `3b25183` after unsuccessful fixed-camera experiments caused black rendering.
- Latest animation improvement is commit `bbd993a`: smoothed visual speed/direction, idle/walk hysteresis, facing/flip dead zones, and settled walk bob.
- User supplied `/home/bashtv/uploads/Screen Recording 2026-07-23 at 3.05.21_PM.mov`; extracted frames showed the island rendering and the issue was paper-kid animation chatter/jitter.

Next movement validation:

1. In the user's working normal browser, walk/stop/change direction/run for 30 seconds.
2. Confirm paper facing does not chatter or mirror-flip at thresholds.
3. Only then tune camera. Do not reintroduce `FixedCamera` or `disableFollowCam` without a visual test; both prior experiments produced a black screen.

### Black/blue preview issue

- The Bash VM Playwright browser repeatedly reports `THREE.WebGLRenderer: Error creating WebGL context`, `Sandboxed = yes`, `BindToCurrentSequence failed`.
- That VM browser cannot prove 3D visuals. The user reported the game working in a normal browser, so use that browser for human WebGL review.
- `src/app/App.tsx` now has renderer guards and a Canvas `onError` path so a failed canvas should surface a DOM fallback instead of silently showing a raw blue/black canvas. This is not proof of a working world.
- Do not keep changing render/camera code to chase the VM renderer failure. Ask the user for an actual browser screenshot/recording only if needed.

## Release blockers (source: FULL-GAME-RELEASE-LEDGER.md)

### P0: proof / stability

- Public WebGL visual review: construction, character marks, placement, homes/interiors, camera.
- Desktop performance measurement: FPS, draw calls, triangles, textures via `window.__perf`.
- Five-person first-session playtest.
- Save/reopen and backup/export verification.

### P0: shared-world authority

Current snapshot/multiplayer foundations exist, but host-authoritative actions are incomplete.

Implement in this order:

1. Placement intent → host validates bounds/overlap → host allocates canonical ID → snapshot/result.
2. Harvest intent → host validates range/tool/node state → canonical depletion → explicit private/shared reward rule.
3. Funding/garden/resident actions use the same intent-validation pattern.
4. Run the documented two-client acceptance matrix: late join, simultaneous place, guest harvest, funding, host migration, third-client join, drawing presence, contested action.

### P1: the game spine after authority

- Give each completed named resident one durable role payoff/request.
- Give dock completion one visible social/visitor payoff.
- Add one finite voluntary post-dock shared project.
- Add one visible collection/display loop.
- Do not add currencies, marketplace/trading, PvP, pets, terrain editing, or arbitrary mesh inference.

## Commands

```bash
cd /home/bashtv/doodle-island
npx tsc --noEmit
NODE_OPTIONS=--max-old-space-size=3072 npm run build
git diff --check
git status --short
git push origin master
```

## Three-chairs acceptance test (plan §5 items #1) — 2026-07-30

Software-rendered the actual `profileHullGeometry` output for three intentionally different chair-back drawings (arch/tomato, zigzag/sky, heart/leaf) side by side:

- v1 (12×14×10 grid, restyle-sampled colors): shapes distinguishable but muddy warm speckle everywhere; heart lobes blurred into a blob. FAIL on style.
- Fixes: sample colors from the RAW stroke pass (not the restyle pass), snap sampled colors to the crayon palette, require ~12% cell ink coverage before a cell takes ink color, raise grid to 16×18×12 (`a64353a`).
- v5 result: three clearly different silhouettes; contour carries the exact chosen ink; interiors take the paint swatch; carved-toy facets retained. PASS pending final human WebGL confirmation in-world.

## Rebuild verification results (2026-07-29)

End-to-end tests run in a live browser against the real modules (not unit stubs):

| Chain | Result |
|---|---|
| Character: draw on hair board → strokes land in dashed region | PASS (screenshot) |
| Character: save → reload → `loadCharacter()` → `drawCharacter()` renders mark | PASS (pixel diff: 303px; enlarged render confirms placement) |
| Construction: closed tomato loop → `profileHullGeometry` | PASS (5,424 verts, color attribute present) |
| Construction: ink color carried to hull + paint swatch fills paper regions | PASS after fix `7011280` (3,432 tomato verts + 792 blue paint verts) |
| Conversion routing: fence/chair/table/planter/campfire → correct archetype | PASS |
| Paper route: strokes → world texture keeps leaf/sun ink colors | PASS (15,026 leaf px, 3,317 sun px) |
| Craft: views/kits/support persist onto DrawnItem | PASS |
| Place: physical builds restricted to cottage plot (by design) → commit inside plot | PASS |
| World save (debounced 1s) → reload → fence rehydrates with views/kit/support | PASS |

Known behavior worth remembering: physical builds (fence/furniture/campfire) may only be placed on the player plot (`PLAYER_PLOT` in `src/sim/placement.ts`); world save is debounced 1s.

## Studio polish state (2026-07-28)

- Build preview no longer zoom-fights the studio scroll: `OrbitControls` has `enableZoom={false}`, calm rotate speed, and the canvas is clipped inside `.build-stage` (`c740aff`).
- Side/top construction boards now show the player's own front profile as a 13%-alpha spatial cue — their drawing, never a supplied template (`a1b4410`).
- Character Studio has a live pose strip: front/side/back thumbnails re-render on every config change so a broken pose is caught before saving (`a1b4410`).
- Visually verified in-sandbox: Character Studio layout, part rail, pose strip, and inspector render correctly (screenshot check). Item Studio 3D preview still needs a WebGL-capable browser check.

## Recent commits

- `1096d42 fix: surface failed canvas instead of black screen`
- `bbd993a feat: smooth paper kid walk state and facing transitions`
- `3b25183 fix: restore original working player and camera controller`
- `205c92c feat: give free-drawn construction parts live fit guidance`
- `ec508f5 feat: guide free-drawn parts and lock island camera zoom`

## Handoff checklist

Before ending a work session:

- [ ] Update this document.
- [ ] Update `FULL-GAME-RELEASE-LEDGER.md` if a proof/status changed.
- [ ] Run TypeScript, production build, and `git diff --check`.
- [ ] Commit and push all project changes.
- [ ] State what was actually visually tested and what remains unverified.
