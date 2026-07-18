# Character Conversion Repair

Updated: 2026-07-18

## Complaint addressed

“Draw yourself” was not fixed by merely flood-filling raw strokes. A filled scribble still does not reliably read as a Doodle Island character.

## Correct conversion rule

The custom drawing must retain its own overall silhouette and distinctive details, but it also needs the game’s **character grammar**:

- flat felt-tip paper cutout;
- consistent dark ink contour;
- white paper edge;
- skin / shirt / shorts / legs color bands;
- friendly front-view eyes and smile;
- side-view eye and nose;
- back-view hair whorl;
- shirt-to-shorts seam;
- the existing front / side / back paper-flip atlas behavior.

The engine adds those readable internal character cues **inside** the player-drawn shape. It never replaces the player’s outline or removes accessories/marks. This is why a triangular-headed kid, a huge-hat kid, a cape, or strange limb proportions can remain personal while still looking like a finished resident of the same world.

## Renderer order

1. Normalize the player’s drawing into the character frame.
2. Determine closed regions and apply flat color bands.
3. Add facing-specific Doodle Island face/back grammar inside the drawing.
4. Redraw the player’s original ink and colored marks with paper halo and felt-tip contour.
5. Bake the same result for easel and runtime atlas.

## Honest limitation

A deterministic drawing engine cannot understand every abstract open scribble like a generative illustration model. It can, however, guarantee that a rough but complete outline is converted into a finished, coherent paper character without hiding the player’s own outer silhouette. The guide and copy now communicate that contract.
