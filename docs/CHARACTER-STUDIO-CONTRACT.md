# Character Studio Contract

## Why the full-body easel was removed

A complete front, side, and back drawing is a character-sheet production task, not a cozy crafting action. It forced players to solve anatomy, silhouette, clothing, and facing continuity before they could have an island character. A deterministic renderer cannot honestly repair arbitrary marks into a coherent authored character without overriding the player.

The earlier tool also violated input trust by normalizing active marks while drawing. That implementation is retired from the player path.

## The new model

The normal island kid is an authored **modular paper-doll kit**. It has a common ink line, proportions, and animation-compatible anchors in all six runtime atlas cells.

The player directly changes the actual parts:

- head form and scale;
- skin;
- hair form, color, and volume;
- eyes and expression;
- top form, color, and length;
- bottom form and color;
- legs, shoes, and shoe color;
- a behind/in-front accessory;
- one optional drawn shirt patch.

These are real silhouette and layer changes, not filters or inferred labels. The same `drawCharacter()` function powers the studio front/side/back preview and the six-cell atlas in the 3D world. Preview/output parity is therefore structural.

## What drawing is for

Player drawing remains central at the Draw Table: it creates items with exact player geometry. On a character, drawing is deliberately constrained to a patch. It offers personal authorship without asking a player to provide all the professional illustration work that makes a readable animated character.

## Acceptance test

1. Open “Make your character” from the title screen.
2. Change a silhouette control (head form, hair, top, pants, accessory). Confirm front, side, and back all update without a redraw.
3. Change a proportion control. Confirm it changes the actual visible part.
4. Draw a patch. Confirm it stays still while drawing and appears only on the applicable top.
5. Press “Use this character.” Confirm the in-world player is the same paper doll shown in the studio.
6. Reload. Confirm every choice and patch persist.

## Honest limits

This version offers authored forms and continuous scale controls, not arbitrary mesh sculpting. Arbitrary freehand full-body conversion is not claimed to be solved. A future advanced mode would need explicit rigged vector/paper-part editing, rather than a fake magic converter.
