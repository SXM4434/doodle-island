# Drawing Conversion Engine

## The contract

A player’s strokes are canonical and always survive. The selected crafting purpose is canonical semantic intent. The renderer never claims to infer an object category from an ambiguous doodle.

| Player chooses | Result | Why |
|---|---|---|
| Axe, pick, sword, rod | **Paper tool** using the exact doodle silhouette | A tool’s behavior is determined by class and the drawing remains visible while held. |
| Decoration, wall-hang | **Paper object** using the exact doodle silhouette | The drawing is the object. |
| Friend | **Paper character** | It must belong with the player and residents. |
| Chair, table, planter | **Chunky physical form** with the doodle as a painted maker-mark | The selected form provides honest collision/readability; the drawing preserves authorship. |
| Fence, campfire | **Chunky physical form** with doodle emblem | These require a reliable world silhouette and clear affordance. |

## Why not an opaque ML classifier?

A local classifier cannot reliably decide whether a child’s drawing is a chair, sword, flower, or abstract mark. More importantly, guessing would overwrite player intent. The craft menu supplies explicit ground truth; deterministic rules turn that intent into a stable gameplay and art-language decision.

A future assistive model may offer optional *suggestions* (“this could be a chair”), but it must never silently change the selected class or discard strokes.

## Acceptance checks

1. A custom player with three completed facings has the default kid’s body, walk cycle, and proportions, plus their own marks in every facing.
2. A drawn axe is visibly the user’s axe while still chopping trees.
3. A furniture draw requires a chair/table/planter choice and produces that chunky low-poly object with the user’s drawing visibly applied.
4. A decoration remains a flat hand-inked cutout.
