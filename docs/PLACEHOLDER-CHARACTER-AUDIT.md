# Placeholder Character Audit

Reviewed: 2026-07-18

## Finding

The character system still felt wrong for a structural reason, not because the production server was stale.

The default sprite in `src/actors/kidSprite.ts` is a simple round-headed, red-shirt/blue-shorts child. It provides movement readability, but it is too generic to serve as the design target for a “draw yourself” system. The first construction implementation made this worse by assembling a starter from disconnected circle, rectangle, arm-line, and leg-line stamps.

That produced a UI that taught “make a generic diagram person,” then asked the style engine to rescue it. It is the opposite of the intended Doodle Island fantasy.

## What was verified

- The production server on port 3022 was serving the current production bundle, not an old HMR graph.
- Restarting the preview is useful to eliminate cache/process uncertainty, but it does not change the source-design problem.
- The design problem is in the placeholder kit and construction primitives.

## Correction made

`Build starter` now creates a single cohesive, asymmetrical paper-doll silhouette rather than a circle + box + line-legs assembly. It includes a built-in clothing division and hair gesture as normal saved strokes, so the style engine can create a filled paper character from one connected figure.

## Remaining character-kit work

The correct next visual task is not more generic construction buttons. It is an authored character-kit pass:

1. Replace the default kid’s generic silhouette with a more specific Doodle Island paper-doll base.
2. Make construction parts match that same silhouette language (soft irregular head, tunic/overalls body, chunky shoes, expressive hair/accessory shapes).
3. Give the easel a visible “before drawing → converted character” proof state.
4. Human-review the three views in live WebGL before declaring the system done.

## Ship rule

Do not claim custom character conversion is fixed merely because it builds. The player must be able to draw or construct an odd little person and immediately recognize a coherent, authored Doodle Island resident—not a generic kid, a geometry diagram, or scribbles on a placeholder.
