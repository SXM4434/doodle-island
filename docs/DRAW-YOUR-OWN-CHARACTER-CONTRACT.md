# Optional Character Styling Contract

Updated: 2026-07-18

## Player promise

Doodle Island always starts with a complete, playable filled paper-kid character. No player is required to draw an avatar before playing.

Choosing **“Style your character”** is optional. The player adds quick front, side, and back marks—hair, face, clothing, badge, cape, or backpack—and the game converts those marks into a complete Doodle Island character.

## Deterministic conversion

For each of the three views:

1. The game renders the authored filled paper-kid body for that facing.
2. The player’s raw strokes are preserved exactly.
3. Each stroke gains a white paper halo and dark felt-tip contour.
4. The mark is composited onto the filled body in the same position shown in the drawing preview.
5. The result is baked into the matching front / side / back atlas cells.

The system does not use an opaque classifier or pretend to generate a 3D character from a scribble. It uses the selected facing as explicit intent and a consistent hand-inked paper-character kit for the readable filled result.

## Why this fits the game

- The player retains visible authorship: their marks remain their own paths and colors.
- The game retains readable animation: the existing front / side / back body and walk frames remain coherent.
- The result belongs with the other flat paper characters in the chunky 3D island.

## Acceptance checks

- A fresh player can select “Wash ashore” without drawing.
- A fresh player can select “Style your character” and preview a complete filled kid while drawing.
- A hair/shirt/backpack mark remains visibly present in the matching world-facing sprite.
- The saved character and easel preview use the same conversion renderer.
- If no complete custom set is saved, the normal island kid renders.
