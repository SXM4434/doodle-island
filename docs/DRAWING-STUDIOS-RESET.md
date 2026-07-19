# Doodle Island — Drawing Studios Reset

Updated: 2026-07-19

## Why this reset exists

The public construction screenshot exposed a failure that code/build checks did not catch: large, repeated stock chairs dominated the scene. The player’s drawing read, at best, as a rectangular applied panel. That breaks Doodle Island’s central promise.

> If removing the player’s drawing leaves an ordinary stock chair, fence, table, or campfire, the drawing was decoration—not construction.

The current Character Studio has a related problem. It offers a technically broad set of small parameters, but the player’s authoring act is scattered across a dense inspector. It feels like editing a configuration sheet rather than making a recognisable paper version of themself.

This document supersedes the optimistic claims in earlier conversion notes. The current construction-kit renderer is a **failed experiment**, not a completed feature.

---

## Evidence from the public screenshot

Observed result:

- repeated large brown chairs are visually the same stock asset;
- player authorship does not control the object’s primary silhouette;
- repeated default legs, rails, posts, seats, and panels overpower the player mark;
- scale is uncontrolled enough that furniture dominates cottages and the player;
- multiple “constructed” objects do not look like distinct player-made artifacts.

### Diagnosis using the 5-component mechanic check

| Component | Result | Why it fails |
|---|---|---|
| Clarity | Fail | A player cannot predict how their mark will become the main form. |
| Motivation | Fail | Drawing a chair is not meaningful if every result is the same chair. |
| Response | Fail | Shape/color/size knobs affect a hidden kit more than the authored outcome. |
| Satisfaction | Fail | Placing the result does not reveal a surprising, unmistakably personal object. |
| Fit | Fail | Generic low-poly furniture conflicts with the game’s “your hand is the crafting system” pillar. |

No additional colors, sliders, or per-face drawing prompts will repair this. The stock-first construction path must be replaced.

---

# Part I — Item Studio reset

## Non-negotiable player promise

There are only two legitimate item outcomes:

### A. Paper object — one drawing is the whole object

For tools, decorations, wall-hangs, trophies, and friends:

- The player draws one complete silhouette.
- That drawing is the visible object: transparent cutout, ink outline, optional restrained fill.
- The game never places it inside a generic rectangular panel.
- Intent/class gives it behavior and scale, not a replacement appearance.

### B. Built object — one drawing is the hero structure, not a decal

For a fence, chair, table, planter, or campfire:

- The player begins by drawing a complete **front construction silhouette** of the thing they want to make.
- The resulting ink silhouette is the dominant front/hero geometry of the placed object. It is a transparent cutout or constrained thickened slab shaped by the player’s drawing bounds—not a texture stretched over a stock rectangle.
- The selected class contributes only a minimal structural support that makes the drawing usable in the world: feet/legs, a rear brace, a pot rim, stone ring, or posts.
- Support pieces must be visually quieter than the authored silhouette: smaller, lower contrast, and never repeated in a way that outshouts the drawing.
- A second optional pass can author a **material trim** (wood grain, fabric stripe, flame color, leaf pattern) on the player silhouette. It cannot replace the silhouette.

The item should read as: **“I drew this weird chair, and the island made it stand up.”**
Not: **“I chose Chair 01 and drew on its back.”**

## What gets removed

- The mandatory “draw Face, Edge, Top for every stock part” workflow.
- Five generic primitive shape controls for every part.
- Repeated stock legs/rails/panels as the primary visible object.
- “Your pieces” UI that asks the player to decorate a pre-authored product.

The old code can remain temporarily behind a migration layer for saved items, but it is not the authoring experience for new items.

## New Item Studio flow

1. **Choose what it will do**
   - Paper thing: tool, decoration, trophy, friend.
   - Built thing: chair, table, fence, planter, campfire.

2. **Draw the thing people will recognise**
   - A single large paper board with a faint, non-binding example gesture—not a stock object drawing beneath the player.
   - Example for chair: “Draw its back, seat, and legs as one front view.”
   - Example for campfire: “Draw the flame you want to see above the coals.”

3. **Give it a physical stance**
   - At most two meaningful choices that alter visible support, e.g. chair “four feet / rocking base”; fence “two posts / pickets”; planter “round pot / box pot.”
   - These choices are secondary; no long control rack.

4. **Preview the exact placed result**
   - The player’s silhouette is visually dominant in the preview.
   - Build is disabled until there is a recognisable minimum mark.

5. **Place it**
   - World scale is class-clamped relative to player/cottage.
   - No construction may exceed the cottage doorway height unless explicitly a fence/gate class permits it.

## Rendering contract

The new built renderer should use an authored **alpha-cutout hero layer**, derived from the player’s full drawing, rather than a rectangular `CanvasTexture` mounted on each kit part.

- Ink remains transparent outside the drawing; no opaque rectangular board.
- The hero layer uses the normalized drawing bounds, centered and scaled in the object’s class envelope.
- A shallow constrained depth/duplicate silhouette can provide a physical paper-diorama stance where appropriate.
- The support kit is assembled behind/beneath it and receives a quieter fixed palette.
- Collision follows the class envelope, not unreliable freehand contour triangulation.

This retains honest player geometry without pretending arbitrary strokes generate watertight furniture meshes.

## Item acceptance gates

Do not ship a rebuilt Item Studio until all are true in a real WebGL browser:

1. Draw three absurdly different chairs—a wide creature chair, a skinny zig-zag chair, and a flower chair.
2. Place them side by side.
3. From normal camera distance, each is immediately distinguishable by its **player-drawn silhouette**, while all still read as chairs.
4. Remove the support kit in a debug capture: the authored drawing still communicates most of the object.
5. Change support style: the object changes stance, but never loses identity.
6. Repeat for fence, table, planter, and campfire.
7. No placed furniture is taller than the cottage roof or larger than the camera framing envelope without an explicit intended class rule.

---

# Part II — Character Studio reset

## Non-negotiable player promise

The default island kid is an immediately playable, polished paper character. Customisation should let a player recognise themselves in that kid in under a minute—not require them to understand head scale, torso width, local coordinate layers, or six editing categories.

The studio must make one visual question easy:

> “Does this still look like the Doodle Island kid, but now clearly feel like mine?”

## What is wrong with the current approach

- The part rail + inspector + many sliders reads as a technical design tool.
- Labels such as width, height, thickness, offset, and local part marks shift work onto the player that the art system should own.
- The drawing option is small and fragmented; it has no satisfying role in the finished character.
- The front/side/back system is necessary for the renderer but too exposed as an authoring burden.
- A player must make too many micro-decisions before seeing a meaningful personal result.

## New Character Studio flow

### Step 0 — Keep the original kid

A clear primary option: **“Use the island kid”**. No setup is required.

### Step 1 — Make the kid feel like you

One large live paper-doll preview and four direct, visual choices:

1. **Head & skin** — three hand-authored head shapes, skin palette.
2. **Hair / hat** — visual swatches shown as mini paper silhouettes, not text-heavy form controls.
3. **Outfit** — a small set of complete clothing looks with color palette.
4. **One thing you carry/wear** — backpack, scarf, bow, cape, or a player-drawn badge.

The controls change the actual renderer, but only expose the choices a player can understand at a glance. Advanced proportion tweaking is removed from the first-run path and may return later as a separate “fine tune” disclosure only if playtests ask for it.

### Step 2 — Add one unmistakable hand-drawn signature

The player picks one clear location with a meaningful prompt:

- draw a badge on the shirt;
- draw a pattern on the hat/hair;
- draw a charm on the backpack;
- draw a patch on the shoes.

The board is large. The selected local region is shown in context. The mark is visible in the main preview immediately.

The player does **not** draw separate front/side/back versions in the default journey. The renderer carries the one authored signature to the available visible faces using a clearly documented, stable placement rule. An optional advanced “different details by facing” mode can exist only after the basic character experience works.

### Step 3 — Use this kid

One final three-facing flip preview. No surprise behavior; this is the exact atlas used in the world.

## What gets removed or hidden

- First-run rail of nine separate parts.
- Continuous sliders for most dimensions/offsets.
- A requirement/expectation to author each facing.
- Technical labels about local coordinates, part surfaces, or render layers.
- The idea that more controls equals deeper personalisation.

## Character acceptance gates

1. A new player reaches a recognisable personal kid in under one minute without instruction.
2. They can identify which choice changed hair, outfit, or carried item from the preview alone.
3. Their one drawn signature is visible in the studio and at normal in-world camera distance.
4. The default kid remains selectable in one click.
5. Save, reload, and all three runtime facings preserve a coherent character.
6. Five players produce visibly different kids without any one becoming an off-style generic avatar doll.

---

# Migration and safety

- Existing character config/marks are retained. The reset UI reads old configuration and maps it into its nearest visual choices; no player work is deleted.
- Existing constructed items remain renderable under a `legacy construction` path until migration is tested. New construction creation uses only the hero-silhouette route.
- Do not silently transform an old player item into a different object.
- No public deployment occurs until the new studio is tested with real drawings and visual screenshots.

# Decision

The next studio work is a **replacement**, not polish:

1. Build the hero-silhouette construction renderer and a simpler one-board Item Studio.
2. Rebuild Character Studio as a short paper-doll journey with one clear authored signature.
3. Test each against the gates above before touching further progression/content work.

Until these gates pass, do not describe item conversion or character creation as complete.
