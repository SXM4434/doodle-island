# Doodle Island — Drawing-Guided 3D and Character Studio Plan

Updated: 2026-07-19

This supersedes the earlier reset proposal where built objects would be dominated by a single flat hero cutout. That would be more honest than a pasted decal, but it does not meet the actual goal: **the player’s drawing must become the real physical item while preserving Doodle Island’s authored chunky 3D style.**

## The design decision

Doodle Island has two different, intentional authoring systems:

| System | What the game provides | What the player authors | Why it works |
|---|---|---|---|
| Character Studio | A rigged paper-doll master sheet, anchors, poses, and animation | recognisable body style, clothing, hair/hat/accessory shapes, one drawn personal feature | The kit preserves readable animation; the player makes the kid theirs. |
| Construction Studio | A semantic physical rig, connection points, collision envelope, and toon material rules | the actual profile/silhouette of each named physical part | The rig preserves chair/fence/fire function; the player makes the object’s visible physical form. |

Neither system should ask the player to do hidden renderer work. Neither system should turn their art into a sticker on a stock asset.

---

# 1. The honest drawing-to-3D rule

## What is impossible to promise

One arbitrary loose 2D doodle cannot deterministically and honestly reveal its unseen rear, depth, structure, or function as a watertight 3D mesh. A system that claims it can silently guesses, replaces player intent, or makes fragile extrusion tubes.

## What Doodle Island can promise

A player selects the item’s intended function **and explicitly authors the visible profiles of its meaningful construction parts**. The renderer then makes real low-poly 3D volumes from those profiles using the same constrained style language as the world.

That is not “basic extrusion.” It is **drawing-guided visual-hull construction**:

1. A player selects a named part, such as a chair back, chair seat, post, rail, pot, log, or flame.
2. They draw a closed front profile for that part. This determines its real visible silhouette.
3. They draw a closed side profile when depth matters. This determines its real side silhouette/depth.
4. Optional top profile is used for parts where top read matters, such as a seat, table top, planter rim, or log.
5. The renderer intersects those orthographic profiles inside a fixed class envelope to produce a deliberately low-resolution **visual hull**.
6. The resulting hull is simplified/faceted, softened only where the house style calls for it, toon shaded, outlined, and attached to named rig anchors.

The profile drawings are therefore the geometry input. They are not textures mounted onto a generic cube.

## Physical customisation is a second authored layer

Drawing controls the part’s visible form. The player also controls how that form becomes a Doodle Island physical object. These controls stay, but are made **part-specific and honest**: every option must alter generated geometry, material treatment, or assembly.

| Player choice | Actual 3D result |
|---|---|
| **Material family** | Wood, painted wood, stone, clay, or ember changes the part’s toon palette, facet recipe, and edge treatment. |
| **Paint / grain / speckle** | Changes the generated part surface treatment; it is never a stock texture pasted over the whole object. |
| **Thickness** | Changes the valid depth range used by the profile hull: thin rail, thick post, deep seat, shallow flame. |
| **Carve style** | Square-cut, rounded-cut, tapered, or picketed changes simplification/chamfer geometry. |
| **Support stance** | Four feet/rockers, trestle/square legs, paired posts/pickets, or round/rough stone ring changes the secondary physical assembly. |
| **Scale inside its class envelope** | Changes real width/height/depth while preserving a readable chair, table, fence, planter, or fire scale beside the kid/cottage. |

These are not a generic wall of primitive toggles. A clay pot gets pot-specific choices; a fence post gets post-specific choices. The player should be able to explain every choice by looking at the resulting object.

## Why this keeps the art style correct

The conversion is constrained by an authored Doodle Island part kit:

- low profile resolution and deliberate facet count;
- warm material palette with one chosen painted color per part;
- chunky proportion limits by part type;
- flat toon shading and ink outline;
- named attachment points, so a chair back joins a seat and legs in readable places;
- collision comes from a stable class envelope, not fragile arbitrary mesh triangulation.

This produces a **carved toy/paper-clay volume** from a player’s silhouette—not a wire extrusion, a cardboard slab, or a generic low-poly asset.

---

# 2. Construction Studio: the player journey

## One clear object, built from visible authored parts

The current “Face / Edge / Top on every default part” workflow is retired. Those words describe renderer projections, not a creative task.

The replacement is a physical workbench with a simple construction sheet.

### Step 1 — Choose what it is for

Player picks: fence, chair, table, planter, or campfire.

This is semantic truth. It selects the structure rig and world behavior. It never classifies a drawing behind the player’s back.

### Step 2 — Draw the parts people will see

The object shows an assembled pale guide with the current selected part highlighted. The player sees a focused large board and a human prompt:

| Object | Player-authored parts | Rig-owned support |
|---|---|---|
| Fence | post profile, rail profile, optional picket/profile panel | repetition count, spacing, boundary collider |
| Chair | backrest profile, seat profile, leg profile | attachment points, stable leg count/collider |
| Table | tabletop profile, apron profile, leg profile | stable leg positions/collider |
| Planter | pot profile, rim profile, leaf profile | soil cavity/plant anchor/collider |
| Campfire | log profile, stone profile, flame profile | crossed-log arrangement, ember/rest anchor/collider |

The part is drawn as a **real closed form**, not as ink painted across a preset rectangle.

A faint starting gesture may help show scale, but it is never saved and never becomes a fallback stock form after a player commits their own drawing.

### Step 3 — Give depth only where it matters

After a front profile, the workbench asks a plain-language question only when needed:

- “What does the side of this backrest look like?”
- “How deep is this seat?”
- “What is the top shape of this table?”

The side/top board shows the player’s front profile as a translucent spatial cue. It does not make them redraw their entire chair from three full angles.

Parts with naturally shallow depth (fence panels, flame, leaves) can use a small, style-safe thickness default and skip a second drawing. Parts with a strong physical read (seat, pot, tabletop, log) need a side/top profile.

### Step 4 — Assemble and inspect

The exact authored volumes are shown in an orbitable workshop preview. The only secondary physical choices are meaningful and object-specific:

- Fence: paired posts / picket run.
- Chair: four feet / rocking runners.
- Table: square legs / trestle base.
- Planter: feet / no feet.
- Campfire: round stone ring / rough stone ring.

These choices affect support structure only. They cannot replace the player-authored primary forms.

### Step 5 — Place

The placed result uses the same construction rig and generated mesh. No separate fake preview renderer exists.

---

# 3. Geometry contract

## Profile capture requirements

A construction profile must be a closed, non-empty region. Open scribbles are still allowed for paper items, but physical construction needs an enclosed form.

The editor should make this clear before commit:

- show the ink region/fill the player is creating;
- if the line is open, offer an explicit “close this shape” gesture/tool;
- never silently invent a contour;
- save the raw strokes and the derived profile mask separately only as cache—raw strokes remain the source of truth.

## Visual-hull algorithm (implementation target)

For one part with front and side profiles:

1. Rasterize the player’s closed front and side drawings at a fixed small resolution inside the part envelope.
2. For each voxel `(x, y, z)`, keep it only if its `(x, y)` front sample and `(z, y)` side sample are both inside their respective profiles.
3. Build a low-poly surface from the occupied cells.
4. Merge/simplify coplanar surfaces; retain intentional large facets.
5. Apply a small chamfer or authored faceting pass—not a smooth subdivision pass.
6. Apply toon material and ink outline.
7. Keep the collision primitive as the rig’s reliable envelope.

For front + top profiles, use the equivalent `(x,y)` and `(x,z)` intersection. For a single-profile shallow part, create a constrained shallow hull from its front region with a class-owned depth range.

### Why not normal extrusion?

A normal extrusion copies one 2D contour straight through depth and produces flat cardboard silhouettes. A visual hull uses authored front/side/top constraints, so the player controls multiple dimensional silhouettes and the final volume can taper, widen, or carve inward according to their drawings.

### Why not arbitrary mesh inference?

The system never claims to know unseen geometry. The rig owns stable functionality and the player supplies the visible profiles. The result is explainable, inspectable, and deterministic.

## Size and scene discipline

Every rig owns a physical envelope relative to the player and cottage. The construction board shows that envelope as a subtle scale reference.

- Chairs must remain chair-sized beside the island kid.
- Tables must not obscure a cottage doorway.
- Fences may be tall enough to read as a boundary but not become house-scale walls.
- The player can make something wide, skinny, lopsided, or weird **inside the class envelope**.

This prevents the screenshot failure where repeated furniture became huge generic brown scenery.

---

# 4. Character Studio: make the drawing matter

The current modular character renderer is the right foundation. **Existing head, hair, face, top, arms, bottoms, legs, shoes, accessory, color, scale, and placement controls remain part of the character system.** The weak part is the authoring experience: a player’s drawing is currently a small optional local mark among too many technical controls.

The rebuild keeps meaningful existing toggles and controls, but changes their presentation: major visual choices remain directly available; fine width/height/offset controls move behind an optional “fine tune” disclosure. Nothing that changes real character geometry or layers is thrown away.

## Character Studio should use the same authored-kit principle

The island kid provides:

- animation-compatible front/side/back paper silhouettes;
- body anchors;
- visual consistency, line weight, and palette;
- a default character ready in one click.

The player should author **one large, semantically meaningful paper part**, not merely a tiny patch. This complements existing kit controls; it does not replace hair forms, head shapes, outfits, palettes, accessories, or optional fine tuning.

### Default journey

1. **Keep the kid / make it yours**
   - one-click default kid always remains first.

2. **Choose the big reads**
   - skin/head, hair/hat, outfit, carried/worn item.
   - choices appear as visual mini paper silhouettes, not a technical slider wall.

3. **Draw one personal paper piece**
   The player chooses a strong slot:
   - custom hair/hat silhouette;
   - a shirt graphic/patch that is actually visible at normal camera distance;
   - custom backpack/charm silhouette;
   - shoe decoration.

   Their drawing becomes a real layered paper component attached at the selected anchor. It is not an invisible metadata layer or a tiny decorative scribble.

4. **Optional advanced detail**
   Only after the basic result works: per-facing variants and fine proportion tuning can be disclosed. They do not block the default path.

## Facing rule

The player draws the personal part once by default. The renderer applies it coherently to each facing using the corresponding anchor/template transform. If the user wants different front/side/back art, that is an advanced explicit option—not a first-run requirement.

## Character success test

Put five customised kids in a line at normal gameplay distance. A viewer must identify each player’s hair/hat/outfit/personal drawing without opening any menu, while every one still belongs to the Doodle Island paper-kid family.

---

# 5. Shared acceptance criteria

## Items

1. Three bizarre chair drawings produce three visibly different 3D chair volumes, not three variants of the same brown chair.
2. The player can point to the backrest/seat/legs and say “I drew that shape.”
3. A fence stays physically readable but varied posts/rails/pickets visibly retain their profiles.
4. The Item Studio has no technical renderer terminology in its main flow.
5. The preview and placed object use the same generated parts.

## Characters

1. The original kid works without any editing.
2. A player makes a recognisably personal kid in under one minute.
3. Their authored paper part is visible in the studio and in the world.
4. Controls alter real renderer layers, not metadata.
5. Save/reopen preserves the exact personal part.

---

# 6. Work sequence

1. Preserve old items in a legacy renderer; do not destroy player saves.
2. Map every existing construction control to either a retained honest 3D control (material, depth, carve, support, bounded scale) or remove it only if it has no visible physical effect.
3. Prototype one part type: **chair backrest** with front + side profile visual-hull generation.
4. Compare three intentionally different real drawings and material/support choices side by side in the world.
5. Add seat/leg profiles and assemble the first drawing-guided chair rig.
6. Validate live WebGL scale and camera readability before applying to table/planter/campfire.
7. Rebuild Item Studio around the construction sheet.
8. Rebuild Character Studio’s default path around large visual choices and one authored paper part, retaining its existing real geometry/layer controls under optional fine tuning.
9. Run save/reopen, item placement, and human visual acceptance tests.

## Non-negotiable stop rule

Do not re-deploy a “new construction system” because it builds. It must pass the side-by-side strange-chair test in a real WebGL browser first.
