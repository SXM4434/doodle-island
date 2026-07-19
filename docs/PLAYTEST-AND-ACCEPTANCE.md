# Doodle Island — Release Acceptance Script

Updated: 2026-07-19

This is a test script, not a claim that a build passed. Record observations separately from explanations.

## 1. Character drawing regression

1. Open Character Workbench.
2. Choose **Shoes** → **Draw a detail on these shoes**.
3. Draw a line, dot, and loop. Verify no oversized black/white circles appear.
4. Press Done drawing → Use this character.
5. Reopen Shoes drawing board. Verify every mark remains in the same position.
6. Switch front / side / back, add a distinct detail to each, save, reopen, and verify each face independently.

Pass: every detail is usable at zoomed scale, persists, and is recognisable in the full preview.

## 2. Construction authoring regression

Repeat for fence, chair, table, planter, and campfire.

1. Select a construction part.
2. Change its physical shape, width, depth, height, and color.
3. Draw on each required surface in order.
4. Verify the action advances to the unfinished surface of the *same* part before moving to the next part.
5. Use the orbit preview to inspect the build.
6. Craft and place it. Compare the placed result to the preview.

Pass: shape settings alter the actual physical volume; Face/Edge/Top art appears on the matching physical face; no raw-debug wording or blank undecorated workflow remains.

## 3. Resident chapter regression

1. Draw a resident, fulfill their first favor, and fund their home.
2. Wait for/observe home completion.
3. Read the resident’s display request in the interaction prompt and speech.
4. Craft the requested item class and place it within the cottage display radius.
5. Confirm the request changes to thanks and does not complete when the same item is placed elsewhere.

Pass: a drawing has a social, persistent consequence.

## 4. Two-client shared-world matrix

Use two independent browsers/devices in the same room. Record host and guest outcome separately.

| Scenario | Expected result |
|---|---|
| Late join | Current island snapshot appears: placements, plants, residents, dock, depleted nodes. |
| Guest harvest | Both see matching depletion within one second; reward ownership is explicitly observed. |
| Simultaneous placement | Two unique objects survive later snapshots. |
| Guest home/dock funding | Cost and progress match on both clients. |
| Host leaves | Remaining player publishes the same island; a new player sees it. |
| Drawing presence | Other player sees drawing signal, never live strokes. |

## 5. Desktop performance capture

On an actual WebGL-capable desktop browser, open DevTools and inspect `window.__perf`.
Capture screenshots/values for:

- empty island;
- dense placement plot;
- night with six mobs;
- interior.

Record FPS, draw calls, triangles, and textures. Do not infer performance from a production build.

## 6. First-20-minute human playtest

Observe silently. Record timestamped behavior:

- time to first meaningful action;
- time to first drawing;
- whether cottage/storage/sleep are discovered;
- whether paper items and solid objects are distinguished;
- first “what now?” moment;
- what the player says they would show a friend.

Ask after play only:

1. What stood out?
2. What were you trying to do when you felt unsure?
3. What would you do first tomorrow?
4. What would you want a friend to notice?

Run at least five qualitative sessions before using findings to retune costs or add content.
