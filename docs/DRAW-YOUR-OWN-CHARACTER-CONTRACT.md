# Draw Your Own Character — Correct Contract

Revised: 2026-07-18

## The player promise

**The player draws their own front, side, and back character. Those three drawings become the actual in-world character.**

This is not a preset avatar with doodle decals. The previous implementation treated the player’s marks as identity overlays on an authored kid. That did not fulfill the “draw yourself” fantasy and has been replaced.

## What the system does

1. The player draws a complete character in each facing: front, side, then back.
2. A faint dashed anatomy silhouette is visible only while drawing. It is a proportional scaffold, never part of the final character.
3. The game validates that each drawing reads as a full, upright character (not a tiny mark): it needs a substantial vertical head-to-feet span and some body width.
4. The exact raw strokes are preserved.
5. The game restyles those strokes in the Doodle Island paper language:
   - white paper halo;
   - dark felt-tip contour;
   - player-selected game ink colors;
   - no stock body rendered beneath the drawing.
6. The front, side, and back drawings bake to a six-cell atlas: front/side/back each repeat for the two walk frames. The existing paper-flip, bob, and turn behavior animate the drawing without pretending to derive limbs from arbitrary strokes.

## Why this is the correct conversion

A freehand character cannot honestly be transformed into a polished skeletal 3D mesh without redrawing it or hiding the player’s input. Doodle Island does neither.

Instead, the player’s full drawing becomes a flat 2D paper character in a 3D diorama—the documented visual language of the game. The game supplies:

- stroke cleanup and game palette;
- paper outline and separation from the environment;
- camera-facing billboard behavior;
- front / side / back paper-flip turns;
- a small walk bob and action lean.

The player supplies the silhouette, proportions, clothes, hair, face, limbs, and back details.

## Acceptance check

A successful first-time player should be able to say:

> “I drew that little person, and that exact little person is walking around the island.”

Required human test:

1. Draw a stick-person-like but complete character in all three views.
2. Confirm the default kid sprite is absent.
3. Confirm the front, side, and back drawings appear in their matching turn states.
4. Confirm a visually distinct character (wide hat, long arms, cape, backpack) retains those traits in the world.
5. Confirm invalid tiny/face-only drawings explain what is missing instead of silently accepting them.
