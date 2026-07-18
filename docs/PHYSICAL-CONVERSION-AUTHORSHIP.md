# Physical Item Conversion — Authorship Contract

Updated: 2026-07-18

## Problem found

The former physical-item renderer made every fence, chair, table, planter, and campfire mostly the same stock 3D prop. The player’s drawing appeared only as a tiny badge.

That technically preserved the drawing but did not preserve its **feel, shape, or authorship**. A triangle, a face, a flower, and a wild scribble all became essentially the same fence. That is not Doodle Island’s promise.

## Correct rule

> **For a physical craft, the converted player drawing must be the main visible structure. The selected form adds only the smallest 3D support kit needed for clear affordance and collision.**

### Implemented physical mappings

| Player selects | What carries the player’s drawing | What the authored 3D kit adds |
|---|---|---|
| Fence | Large central fence-board / picket panel | Two posts, two rails, fixed boundary collider |
| Chair | Tall chair backrest | Seat, legs, small support frame, fixed collider |
| Table | Large front apron/sign panel | Top and four legs, fixed collider |
| Planter | Pot body/front panel | Rim, leaves, fixed collider |
| Campfire | Tall flame above the coals | Stone ring, coal bed, fixed collider |

The conversion texture includes the same line-art normalizing, closed-region fill, white paper edge, and dark felt-tip outline used by paper items and custom characters.

## Intent and clarity

The craft choice still matters. It provides behavior and physical truth:

- selecting **fence** makes the player drawing a solid boundary;
- selecting **chair** makes it a sit/readable chair silhouette;
- selecting **campfire** makes it a warm, restable stone ring;
- selecting **table/planter** gives it a physically legible purpose.

But the selected class no longer erases the drawing’s silhouette from the result.

## Acceptance test

1. Draw three visibly different shapes as fences.
2. Place them side by side.
3. At a glance, each fence must clearly retain a different central drawn silhouette while all three read as a fence.
4. Repeat for chair, table, planter, and campfire.
5. The player should be able to say: “That is my weird drawing, but it works as a fence/chair/fire.”
