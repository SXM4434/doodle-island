# Drawing System Rebuild Note

Updated: 2026-07-18 after review of the 4:59 PM screen recording.

## Hard failure found

The old character easel ran the conversion renderer every pointer-move. The renderer normalized the entire drawing from its current bounds. Each new stroke changed the bounds, so all existing strokes rescaled and moved under the cursor.

This made the drawing visibly crawl, twist, and overlap while the player was trying to make a character. It invalidated the tool.

## Rebuilt default interaction

The default character route is now **Draw freely**:

- a stable paper canvas;
- strokes remain exactly where the cursor placed them;
- no normalization, filling, or conversion is shown while dragging;
- the guide appears only on an empty canvas;
- conversion occurs after a view is finished, during save/bake, not as a moving live effect.

## Retained secondary option

The previous assisted construction tool is retained as **Build with parts**. It is no longer the default and is labeled assisted. It offers head/body/arms/legs/hair/cape stamps and Build starter for players who want help constructing a readable person.

## Principle

Drawing input and conversion output must be separate states:

1. **Input state:** stable, direct, predictable marks under the pointer.
2. **Finished state:** deterministic restyle/normalization after the player commits a view.
3. **World state:** baked front/side/back paper atlas.

A rendering transformation must never mutate the spatial relationship of existing marks while a user is still drawing.

## Validation required

1. Draw a long stroke across the canvas: it must not move while adding another stroke.
2. Draw several separate marks: none may rescale during input.
3. Finish Front, then confirm the baked/converted version is stable in the later view/world result.
4. Switch to Build with parts: stamp placement must be stable and the freehand brush must return to Draw freely.
