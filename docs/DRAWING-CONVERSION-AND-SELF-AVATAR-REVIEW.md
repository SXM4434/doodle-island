# Drawing Conversion & Self-Avatar Review

Reviewed and corrected: 2026-07-18

This document records the answer to two player-facing questions:

1. **How does Doodle Island decide whether something I draw is flat paper or a solid 3D object?**
2. **How does “Draw yourself” turn into a believable in-game character rather than a disconnected placeholder?**

It also records the visual defect found in the self-avatar path and its correction.

---

## 1. The 2D / 3D conversion system exists

The game does **not** try to guess an object from a child’s drawing with a hidden model. That would be unreliable and would often replace a player’s drawing with a generic asset.

Instead, the player tells the Draw Table what they are making first. That explicit choice is the semantic truth. The drawing’s strokes remain the canonical saved data in every case.

Source of truth: `src/draw/conversion.ts`.

| Player chooses | World result | Why |
|---|---|---|
| Axe, pick, sword, fishing rod | **Flat paper tool** held by the player | The exact silhouette needs to stay readable in the player’s hand. The selected tool class supplies behavior. |
| Decoration or trophy | **Flat paper cutout / wall art** | The drawing itself is the object. |
| Friend | **Flat paper character** | Friends live in the same paper-character layer as the player. |
| Furniture → chair | **Chunky solid chair** with the drawing as its painted maker-mark | A chair must read as sit-able/solid and collide physically. |
| Furniture → table | **Chunky solid table** with the drawing as its painted maker-mark | A table must read as a stable physical surface. |
| Furniture → planter | **Chunky solid planter** with the drawing as its painted maker-mark | A planter needs a dependable world silhouette. |
| Fence | **Solid low-poly fence** with maker-mark | A fence must make a physical boundary. |
| Campfire | **Solid stone-and-ember campfire** with maker-mark | It is a physical refuge and collision object. |

### Why furniture is not arbitrary freehand 3D extrusion

Freehand outlines self-intersect, have no obvious depth, and cannot reliably make a readable chair, table, or planter. Pretending every doodle can become a good 3D mesh would be dishonest and fragile.

The game instead uses a limited authored toy-world kit for physical affordances. The player’s drawing is **not discarded**: it remains a prominent painted emblem on the object. This is the “Gumball collage” contract:

- flat felt-tip drawing remains the player’s authorship;
- faceted, outlined 3D form supplies collision and physical readability;
- the two layers intentionally look different but belong to the same toy-diorama world.

### Visual contract for conversion

- **Paper results:** raw drawing geometry is restyled in the game’s ink and paper treatment, then rendered as a camera-facing cutout.
- **Physical results:** low-poly, outlined, toon-shaded wood/stone/leaf forms; the original drawing becomes the front-facing maker-mark.
- **Never:** silently replace the drawing with a stock icon, use opaque ML classification, or claim that an arbitrary scribble has been mechanically extruded.

### Current implementation locations

- Semantic decision: `src/draw/conversion.ts`
- Drawing texture bake: `src/draw/itemTexture.ts`
- Physical 3D kit and Rapier colliders: `src/world/ConvertedItem.tsx`
- Paper standees and placement preview: `src/world/Placed.tsx`
- Explicit furniture-form picker: `src/app/DrawTable.tsx`

---

## 2. Self-avatar design: corrected promise

The prior “paper-doll customization” interpretation was wrong for this game. **Draw yourself means the player draws the complete character.**

> **The player’s front, side, and back drawings are the actual in-world character.**

The game does not put the default kid beneath the drawing. It supplies only the conversion that makes raw strokes readable in the established world style:

- a felt-tip dark contour and white paper halo;
- the game palette;
- paper-cutout billboard placement;
- front / side / back paper-flip turns;
- a small walk bob and action lean.

A faint anatomy outline appears only while drawing. It is a temporary proportional guide and is never baked into the character.

Each view must contain a full upright figure (head-to-feet span and body width). This prevents a tiny face mark from silently becoming an avatar; player-facing failure text says what needs to be drawn.

The full replacement contract is recorded in `DRAW-YOUR-OWN-CHARACTER-CONTRACT.md`.

---

## 3. Real bug and design mismatch found during review

There were two problems:

1. the preview/bake scale mismatch made marks move or shrink; and
2. more importantly, the system used a default kid beneath the player’s art, which did not fulfill “draw yourself.”

Both are removed. The new renderer uses the same raw strokes for the easel preview and the six-cell runtime atlas. No preset kid body is drawn in either path.

---

## 4. Visual validation status

### Completed by source-path review

- The self-easel calls `drawCharacterStrokes()`.
- The runtime atlas calls the same `drawCharacterStrokes()` for each front/side/back frame.
- The player uses the baked six-cell atlas in `src/actors/Player.tsx`.
- The result therefore now has one shared body/mark composition path, rather than a preview path and a different output path.

### Still required: human WebGL review

This VM’s automated browser cannot create a WebGL context (`THREE.WebGLRenderer: Error creating WebGL context`), so a generated browser screenshot would be misleading. A production preview is available for human visual review.

Human checks to perform:

1. Put a hair stroke near the top of the front head; confirm it lands in the same place in the world.
2. Draw a shirt badge in the torso guide; confirm it is visible while walking.
3. Draw a backpack/cape on the back; rotate the player and confirm it is visible only on the back-facing cells.
4. Draw a side detail; confirm it is visible on the side and mirrors cleanly on the opposite side.
5. Create chair, table, planter, fence, and campfire drawings; verify each keeps the drawing as a maker-mark and physically collides.
6. Create decor/tool/friend drawings; verify they remain flat paper forms and do not become generic 3D assets.

---

## 5. Acceptance criteria

The system is acceptable only if a first-time player can answer these without help:

- “Will this drawing stay flat, or become a solid object?”
- “Where will my drawing be visible after I make it?”
- “Why does a chair turn into a chunky chair but my decoration stay paper?”
- “Is the avatar on this easel the same one I will control in the island?”

If any answer is unclear, repair the drawing UI or preview before adding more craft classes.
