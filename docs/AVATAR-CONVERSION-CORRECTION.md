# Avatar Conversion Correction

Updated: 2026-07-18

## Correct player-facing contract

Character styling is **optional**. A player may immediately enter Doodle Island using the normal, complete filled island kid.

If they choose **“Style your character,”** they make three quick drawings (front, side, back). Those drawings are not expected to be full-body illustrations, and the game does not force the player to redraw a character from scratch.

Instead the conversion is deterministic:

1. Draw a hair shape, face, shirt mark, sticker, backpack, cape, or other detail.
2. The chosen front / side / back view tells the system where it belongs.
3. The game renders the complete authored paper-kid silhouette for that view.
4. It adds a white paper edge and dark felt-tip contour to the player’s exact strokes.
5. It draws those strokes visibly on the matching filled character view.
6. The three results bake into the six-cell walking atlas.

The player’s linework stays visible. The filled body, front/side/back language, and walk motion are supplied by the game so the result always reads as a complete Doodle Island character.

## What this deliberately avoids

- No required character-creation gate before starting the game.
- No raw line-only stick figure unless that is actually the desired result.
- No hidden image model or opaque “guess what this is” system.
- No replacement of the player’s marks with a generic asset.

## Acceptance test

- “Wash ashore” is available with no character drawing.
- “Style your character” opens the optional three-view flow.
- A single hair/shirt/backpack mark on each view produces a complete filled character with those marks visible.
- The normal island kid remains the fallback when no valid custom character is saved.
- The preview and the in-world sprite use the same conversion renderer.
