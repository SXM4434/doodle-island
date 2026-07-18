# Doodle Island — Full-Game Gap Analysis

Reviewed: 2026-07-18

Sources: current implementation; `OUTLINE.md`; `PRD.md`; `ARCHITECTURE.md`; `BUILD-PLAN.md`; game-design, economy-design, progression-systems, multiplayer-design, and playtest-design skills.

## Executive decision

Doodle Island has crossed the line from prototype to **promising vertical slice**. It has the signature moment (a player drawing an object that appears in the world), a legible island, gathering, a home, night danger, residents, and the beginnings of shared presence.

It is **not a full game yet**. The largest gaps are not “more props” or “more recipes.” They are:

1. **world authority and durable shared persistence**;
2. **a repeatable mid-game purpose for drawing and gathering**;
3. **a reason to return tomorrow and a reason to show a friend today**;
4. **real player validation and desktop performance measurement**.

The right next move is to make one narrow “shared island contract” trustworthy, then build one authored progression spine around it. Do not add terrain editing, a trading market, infinite generation, arbitrary freehand mesh extrusion, pets, PvP, or a grab-bag of Animal Crossing systems first.

---

## The reference games: what they actually contribute

### Drawing games / Crayon Physics / Scribblenauts spirit

The durable fantasy is not merely “a canvas exists.” It is:

> **My mark changes what is possible, remains recognizable, and becomes a story I can show.**

A strong drawing game needs all four:

| Need | Doodle Island today | Gap |
|---|---|---|
| Authorship | Strong: raw strokes persist and tools/decor visibly keep the drawing. | Validate that a first player recognizes their mark instantly in-world. |
| Intent | Stronger: explicit craft class/form avoids insulting doodle classification. | More distinct consequences are needed beyond tool/furniture/decor. |
| Constraint | Materials and craft costs exist. | Most choices are currently “make whichever thing”; there are few world goals that make one drawing strategically or emotionally preferable. |
| Display | Placement and houses exist. | No reliable visitor/gallery loop, showcase ritual, or visible “what did we make together?” moment yet. |

**Keep:** explicit player intent; restyle-never-redraw; maker-mark physical kit.

**Do not add:** an opaque classifier, automatic drawing replacement, or generic prompt-of-the-day generator before the world can honor the creation.

### Minecraft contribution

Minecraft’s enduring loop is a chain of changing capability:

> explore → acquire a material → convert it into a capability → safely reach/alter a new possibility → pursue a bigger project.

Doodle Island already has gathering, tools, material costs, night risk, and a dock/home project. The missing piece is that **capability unlocks rarely change the player’s relationship to the island**.

| Minecraft loop element | Current status | Needed interpretation for Doodle Island |
|---|---|---|
| Material identity | Wood, stone, fiber, shine, berry, ink, fish exist. | Give every material at least one desired sink and a clear visual source. |
| Tool progression | Base and stone tools exist. | Tie higher-tier tools to a tangible new project or richer source, not only faster damage. |
| Shelter / safety | Cottage, bed, campfire, and night mobs exist. | Make “home is safer because I made it mine” visible and useful. |
| Construction | Structural placement/collision is now credible. | Add only projects that alter daily routes or unlock a purposeful social/activity space. |
| Exploration gate | Zones exist visually. | Add one authored reason to visit each zone repeatedly, not more map area. |

**Keep:** cozy no-loss death, resource gathering, meaningful construction.

**Do not copy:** block terrain editing, survival hunger, infinite world, grind-heavy ore ladders, or destructive raids. They fight the one-island dollhouse premise.

### Animal Crossing contribution

Animal Crossing’s core is a gentle calendar of **place, people, rituals, and expression**:

> I return because the island has changed, someone remembers me, and I have a small self-directed goal.

| Animal Crossing loop element | Current status | Missing full-game requirement |
|---|---|---|
| Place ownership | Cottage, plot ring, interior, furnishing placement exist. | Need a visible before/after settlement arc and a reason for visitors to tour it. |
| Residents | Waddles, Miso, Sluggo, drawn villagers, homes/routines exist. | Relationships are currently very shallow: favors do not branch, residents do not develop a recognizable role or request a specific drawn thing. |
| Daily rhythm | Day/night and daily bottle exist. | A single bottle is not enough. One rotating daily “island condition” or resident request should shape the session without becoming chores. |
| Collection | Journal deeds and materials exist. | There is no coherent collection set with visible completion/progression payoff. |
| Social visit | Remote avatars and drawing presence exist. | Need shared projects, visitor readability, and trustable sync before it can be the payoff. |

**Keep:** calm pacing, housed residents, small daily surprise, personal interiors.

**Do not copy:** real-time chore overload, massive catalog UI, arbitrary currency bloat, or forced daily attendance.

---

## Current loop: honest state

### What is already real

- Explore a readable handcrafted island.
- Gather tree, rock, fiber, and shell resources with feedback and respawn.
- Draw tools, decor, friends, furniture forms, fences, and campfires.
- Place/pick up saved items; physical forms collide and placement has spatial rules.
- Sleep, rest, fight night creatures, fish, garden, use storage, and improve a resident’s home.
- Meet named islanders and create/fund drawn residents.
- See remote movement; serialize placed drawings as strokes; see that a remote visitor is drawing.

### Where the loop breaks

```
EXPLORE → GATHER → DRAW → PLACE
              ↑              ↓
       “what next?”      mostly aesthetic / local
```

The first four verbs work. The loop lacks a sufficiently strong **next desire**:

- Why draw a second or tenth item besides self-expression?
- Why choose one material sink instead of another?
- Why visit a friend’s island beyond a brief look?
- Why return after the first cottage, campfire, and resident are made?

This is a mid-game motivation gap, not a feature-count gap.

---

## Critical engineering blockers — before calling it a shared full game

### P0 — Shared-world authority is incomplete

The architecture requires host-applied reliable world edits. Current snapshots help late join and host migration, but current code still permits unsafe behavior:

| Action | Current risk | Required contract |
|---|---|---|
| Guest harvest | Guest mutates local node state and local drops; host does not receive a host-applied harvest command. | Guest sends an intent with monotonic action ID; host validates node/range/tool/state, mutates canonical world, broadcasts snapshot/result. |
| Guest placement | `pushPlaced()` can write reliable global placement outside host authority. Simultaneous placements can race. | Host alone allocates object IDs and accepts/rejects placement after bounds/overlap validation. |
| Garden/dock/home funding | Local state may diverge until/if host snapshot changes. | Same action-intent → host-validation → canonical snapshot pattern. |
| Drops/inventory | Designed as private, but harvest ownership is ambiguous. | Decide explicitly: shared node depletion + individual private rewards, or shared drops with pickup ownership. Do not leave it accidental. |
| Persistence after everyone leaves | Playroom room state alone is not proof of durable world persistence; localStorage is per browser. | Validate Playroom persistent-room behavior or add an explicit backend/export-import Tier 0 fallback. |

**Definition of done:** two independent browsers complete the test matrix below with no duplicate placed object, no orphan object, no divergent node state, and successful host departure/rejoin.

### P0 — Runtime/performance is unmeasured

The main bundle is approximately 5.8 MB minified / 2.05 MB gzip. It builds, but that is not a frame-time result.

Measure on a real desktop browser before adding packages:

- loading time and first interactive time;
- FPS in empty island, dense plot, night with six mobs, and interior;
- draw calls / triangles / textures via the existing `window.__perf` hook;
- memory after creating and picking up many drawings.

### P0 — Human visual review remains required

The VM browser cannot create a trustworthy WebGL context. Automated TypeScript/build checks prove wiring, not composition. Every major art pass needs a human check for camera occlusion, door readability, cottage scale, and paper/3D layer separation.

---

## The missing game spine

The smallest viable “full game” spine should be **three authored chapters**, not an endless tech tree.

### Chapter 1 — Make a refuge (first session)

**Player promise:** “I washed up, made my first useful thing, and now this little cottage is mine.”

Already mostly present:

- gather → tool → draw table → place;
- cottage, chest, bed, campfire;
- named islanders.

Needs validation, not more systems:

- Can a new player make a first tool and first placement within one session without instruction beyond the four hints?
- Can they find the cottage and understand sleep/storage without a verbal explanation?
- Can they tell decor from solid physical furniture at a glance?

### Chapter 2 — Help the island take shape (sessions 2–4)

**Player promise:** “My drawings helped a person settle here, and the settlement visibly changed.”

The resident-home loop exists but needs to become the primary mid-game spine:

1. Draw a friend.
2. Complete a small favor.
3. Fund their home.
4. See them build it.
5. Their completed home gives a specific new social or functional payoff.

Current missing payoff: a completed resident is mainly another person to talk to. Each resident needs **one durable identity**, not a massive dialogue tree:

| Resident role (proposal) | Desired player behavior | Minimal payoff |
|---|---|---|
| Miso, pond keeper | fish/garden/notice water | asks for a drawn pond decoration; unlocks one fishing or garden display project. |
| Sluggo, beachcomber | explore beach / collect shine | asks for a drawn shell display; reveals a rotating beach discovery. |
| Waddles, swap keeper | convert surplus | offers one rotating blueprint-material exchange, not a broad economy. |
| Drawn resident | express friendship | asks for a themed object of a chosen class, then visibly uses/displays it at home. |

This is intentionally **one meaningful request per resident**, then repeatable light flavor. It makes a drawing socially consequential without needing procedural NPC content.

### Chapter 3 — Make a place worth visiting (ongoing)

**Player promise:** “Come see what we made.”

The shared-project payoff should be one visible town change plus a visitor ritual:

- dock completion should lead to a specific social/scene reward, not just a completed dock mesh;
- a visitor arrives at the dock, sees an obvious path to the Draw Table and settlement, and can tour created objects;
- one limited shared project at a time (for example: pond display, beach lanterns, workshop expansion) provides cooperation without chores.

Do not build a marketplace or forced contribution treadmill. A shared project must be voluntary, visible, finite, and have a permanent world result.

---

## Economy audit — current sources and sinks

### Current source/sink graph

```text
Trees ─────────► wood ───► tools / furniture / fences / campfires / homes / dock
Rocks ─────────► stone ──► picks / swords / campfires
Fiber plants ──► fiber ──► tools / decor / friends / rods
Beach shells ──► shine ──► golden ink / shop exchanges
Berry plants ──► berry ──► healing / friends / gardening loop
Night mobs ────► ink ────► tier-2 tools / wall-hangs
Fishing ───────► fish ───► shop sale (currently weakly connected)
```

### Risks

1. **Wood has the only robust set of desirable sinks.** It can dominate decisions.
2. **Stone’s main role is tool/campfire gating.** After basic gear it risks stockpiling.
3. **Fiber and berry sources have weak long-term demand after the first friend/rod.**
4. **Shine converts to golden ink but the shop’s continuing purpose needs proof.**
5. **Fish needs a clear identity beyond being an inventory entry.**

### Recommendation: no new currency

Use the existing resource vocabulary. Add **desired, bounded sinks**, each tied to a chapter/project, only after the multiplayer contract is secure.

Examples to test, not commit yet:

- wood + stone: settlement project stages;
- fiber + berry: resident hospitality/display requests;
- shine + fish: rotating Waddles exchange for a non-power cosmetic material or special paper palette;
- ink: night trophies and one or two distinct, visibly different crafted forms.

Every proposed cost must be modeled per session before implementation. The current numbers are starting values and should not be changed by intuition.

---

## What to build next — priority order

### P0: trust and shipping proof

1. **Implement host-authoritative action intents** for place, pickup, harvest, plant, harvest plant, home funding, dock funding, and resident-build progress.
2. **Run a two-client acceptance test** using a written matrix.
3. **Measure desktop runtime** and profile the large bundle before dependency growth.
4. **Run a human visual review** of home exterior/interior, settlement composition, and conversion readability.
5. **Playtest the first 20 minutes** with 5–8 people before expanding NPC content.

### P1: one complete mid-game chapter

6. Make completed residents request/display one **specific drawn contribution**.
7. Give dock completion one concrete, visible social payoff.
8. Add one rotating daily island condition/request that changes priorities, not a chore list.
9. Establish one small collection with a visible display payoff (not another menu checklist).

### P2: polish only when evidence demands it

10. Tune resource sources/sinks from playtest/session data.
11. Add resident dialogue breadth only if players seek it.
12. Optimize or code-split only after profiling identifies the heavy module/path.
13. Consider a legally vetted, heavily stylized CC0 material ingredient only if human visual review says geometry/material contrast needs it.

### Explicitly defer

- terrain editing and infinite worlds;
- arbitrary freehand extrusion;
- trading / marketplace / economy scale-up;
- PvP;
- pets;
- minimap;
- opaque drawing recognition;
- broad catalog collecting without a world display function.

---

## Two-client acceptance matrix

| Scenario | Pass condition |
|---|---|
| Host starts, guest joins late | Guest sees current placements, gardens, villagers, dock, node depletion, and host avatar. |
| Guest harvests a tree | Both see the same hit/deplete state within one second; reward ownership is explicit and correct. |
| Both place simultaneously | Exactly two objects exist with distinct IDs; neither disappears after a later snapshot. |
| Guest funds home/dock | Both see correct wood/progress; no duplicated cost or progress. |
| Host leaves after edits | New host republishes same current island; remaining guest continues editing. |
| New player joins after migration | New player sees the migrated snapshot, not a reset island. |
| Guest draws | Host sees the Draw Table “drawing…” signal, but no strokes. |
| Both try a contested action | Host validation rejects one cleanly; neither client silently diverges. |

---

## Playtest plan: first 20 minutes

### Observe

- Time to first meaningful action (target: under 60 seconds).
- Time to first crafted drawing.
- Whether the player voluntarily enters their cottage.
- Whether they understand why a resident needs wood.
- Whether they distinguish paper decor from physical furniture.
- Whether they visit a second zone without being told.
- Where they stop or ask “what now?”

### Ask only after observation

1. “Tell me about a moment that stood out—good or bad.”
2. “What were you trying to do when you last felt unsure?”
3. “What would you do first if you came back tomorrow?”
4. “Whose island object would you want a friend to notice?”

### Decisions from evidence

- If players do not draw in the first session: repair onboarding/material gate before adding recipes.
- If players draw once but do not draw again: add a meaningful resident/project request, not more brush options.
- If players gather without choosing a sink: clarify project goals before changing drop rates.
- If players visit but do not interact: add one shared finite project/ritual, not chat or trading.
- If players collide with visual/camera confusion: repair scale/composition before adding art content.

---

## Final test

A “full enough” Doodle Island is not one that copies all of Minecraft or Animal Crossing. It is one where a player can truthfully say:

> “I drew that thing. It helped this island become a real place. My friend saw it, and we made the next part together.”

Everything in the priority list serves that sentence.
