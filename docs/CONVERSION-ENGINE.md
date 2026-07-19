# Doodle Island — Drawing Conversion Contract

Updated: 2026-07-19

## Player promise

A drawing is never silently classified, replaced, or reduced to a tiny badge.
The player chooses the intended craft. That choice says what the thing *does*;
the player’s drawing says what it *looks like*.

## Two honest craft routes

| Player chooses | Authoring method | World result |
|---|---|---|
| Tool, decoration, trophy, friend | One complete drawing | A flat paper cutout in the 3D world. The silhouette is the drawing. |
| Fence, campfire, chair, table, planter | Named physical parts | A chunky low-poly physical assembly with player-authored ink on the selected physical surfaces. |

## Construction route

A constructed item is not a freehand-to-mesh illusion and not a stock prop with a decal.

1. The player selects a named part, such as a post, rail, seat, leg, pot, log, or flame.
2. The part begins as an intentionally readable Doodle Island construction kit part.
3. The player chooses a constrained physical form, proportion, depth, height, and paint color.
4. The player draws on the meaningful surfaces of that part: **Face**, **Edge**, and/or **Top**.
5. The same part kit and surface drawings are assembled in the editor preview and in the placed item.

The selected craft/form controls assembly and collision only: repeat four legs, use two fence posts, arrange crossed logs. It does not hide or overwrite player artwork.

## Character route

The original island kid remains a paper-doll master sheet. Form controls preserve the friendly proportions, ink, animation, and facing continuity. The player can add a personal drawing detail to a selected part on a selected facing using a focused, zoomed board. The exact same stored local layer is baked into the world atlas.

## Non-negotiable preview parity

- Paper preview and world cutout use the same strokes.
- Character board and world atlas use the same local mark layers.
- Construction preview and placed item use the same kit settings plus named surface layers.
- No resource spend occurs before the construction preview exists.

## Acceptance checks

1. Draw visibly different Face/Edge marks on two fence posts. Their placed fence posts remain visibly different.
2. Change a part from square to tapered, change its depth, and change its color. The final mesh changes, not merely its metadata.
3. Draw a shoe detail, save, reopen Character Studio, and confirm the same mark returns in the same place.
4. Place a requested construction near a finished resident home and confirm that resident acknowledges and displays the contribution.
