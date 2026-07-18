# Character Construction Tool

Added: 2026-07-18

## Problem

A blank canvas plus “draw a person” is a weak tool. It asks every player to solve anatomy, scale, front/side/back consistency, and style before the conversion engine can help. That made character drawing feel fragile and unlike the rest of Doodle Island’s authored paper world.

## New construction interaction

The character easel is now a **construction kit plus drawing surface**.

### Construction pieces

- head;
- body;
- arms;
- legs;
- hair;
- cape/back accessory;
- freehand pen.

Clicking a construction piece, then clicking the canvas adds a correctly proportioned, editable marker-stroke part at that position. The player can then use the freehand pen to add their own face, clothes, hair, stickers, and details.

**Build starter** lays down a complete, editable little person for the active front/side/back view. It is not a hidden stock character: the starter is simply a set of ordinary saved strokes. Players can add, undo, and draw over it, and the same style conversion engine treats it like any other drawing.

## Conversion contract

1. Construction parts + freehand marks are saved as canonical stroke data.
2. The conversion engine normalizes them and fills enclosed regions.
3. It applies Doodle Island’s paper/ink character grammar: color bands, face/side/back cues, paper edge, and marker contour.
4. Preview and runtime atlas use the exact same conversion renderer.

## Why this solves the weak-character issue

The player no longer needs to be an illustrator to get a complete, readable little person. Their effort moves to the expressive parts—hair, face, outfit, cape, accessories, proportions—while the tool provides the stable construction language that the game needs.

## Acceptance test

- A player who only uses Build starter should get a readable completed character.
- A player who uses head/body/arms/legs at odd positions should get a visibly personal but coherent character.
- A player who draws only freehand can still make a complete character.
- Custom details survive preview, save, and runtime paper-flip views.
