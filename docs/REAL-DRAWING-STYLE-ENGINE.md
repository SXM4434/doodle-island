# Real Drawing Style Engine

Updated: 2026-07-18 after visual review of the submitted recording.

## The previous failure

The recording showed that custom character creation was not conversion. It placed thick user strokes on top of a complete preset kid. That made the result look like graffiti on a placeholder, not a character the player had drawn.

The item path had the same structural weakness: it recolored strokes but did not derive a filled, coherent paper illustration from the drawing.

That behavior is removed.

## Actual deterministic conversion pipeline

The engine is in `src/draw/styleEngine.ts` and is shared by custom characters and crafted item textures.

1. **Raw strokes remain canonical.** The player’s points are always saved; no bitmap or model output replaces them.
2. **Normalize to a safe art frame.** Drawings are centered and uniformly scaled inside a paper-safe inset. A tiny or oversized sketch becomes usable without changing its proportions.
3. **Build an ink stencil.** The game converts every player path into its felt-tip outline thickness.
4. **Detect closed regions.** Transparent areas fully surrounded by the player’s ink become deterministic fill regions. Open scribbles remain open line art; the engine does not invent a shape the player did not close.
5. **Apply the authored flat palette.** Character closed regions receive skin / shirt / shorts / skin bands by their vertical position; object regions receive a warm paper/wood palette. This is a deliberately limited house-style kit, not semantic guessing.
6. **Redraw player lines.** The engine adds a white paper border, dark marker contour, then the player’s original colored stroke. The personal linework remains visible.
7. **Use the same renderer for preview and world.** The easel and live six-cell character atlas invoke the same function, so there is no preview/output mismatch.

## Character contract

- Default island kid remains available; drawing a character is optional.
- A custom player draws a full front, side, and back figure with the guide as a proportional reference only.
- To ask the engine for a filled head, shirt, shorts, cape, etc., draw that area as a closed outline.
- The game converts the drawing into a complete flat paper illustration in the Doodle Island language. It does **not** paste it on a preset body.

## Object contract

- Tools, decorations, wall art, and friends: converted filled paper illustrations/cutouts.
- Chair, table, planter, fence, campfire: the same converted illustration becomes the maker-mark on an authored, physically reliable 3D toy-world form.
- Object class/form is explicit player intent; no classifier silently decides what their drawing “really” is.

## Visual acceptance test

1. Draw a closed circular head, closed shirt, and closed shorts in the character easel.
2. Confirm the preview fills those areas and shows the player’s original contours.
3. Finish front/side/back and confirm the world sprite shows the same filled drawing rather than the default kid with marks pasted on it.
4. Draw a closed sword/object shape at the Draw Table and confirm the placed paper version is filled/outlined in the same language.
5. Make a chair/table/planter from the same drawing and confirm its converted maker-mark is visibly the filled version, not raw scribbles.

## Known honest limitation

This is a deterministic browser-side style engine, not a generative image model. It can normalize, ink, fill closed regions, and apply the project’s palette reliably. It cannot infer a fully painted anatomy from an open single-line scribble without overriding the player’s drawing. The drawing UI therefore tells players the clear control: **close a region to fill it.**
