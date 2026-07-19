# Doodle Island — NPC Art Reset

Updated: 2026-07-19

## Evidence

The current NPC presentation is inconsistent and under-authored:

- Miso and Sluggo exist as simple procedural mascot cutouts in `Islanders.tsx`.
- Waddles and the other named residents exist in a separate critter-sprite language.
- Player-drawn residents are arbitrary item billboards, so they do not reliably read as fellow islanders.
- Quest bubbles carry too much of the identity; if the bubble is removed, most residents have no distinct silhouette, posture, prop, or role.

This is not solved by extra dialogue or more quest types.

## One resident visual grammar

Every named resident must be a **paper-doll resident**, sharing these traits with the player:

- large readable head/body ratio;
- chunky felt-tip outline and flat paper fill;
- a distinct three-pose front/side/back sheet;
- one stable job prop or costume signifier;
- blob shadow, idle sway, two-step walk/hop, and an interaction pose;
- an authored home display object once their request is complete.

They are not generic critters, arbitrary doodle billboards, or UI labels with bodies under them.

## The three original residents

| Resident | World role | Silhouette / prop | Palette | Motion / interaction |
|---|---|---|---|---|
| **Miso** | Pond keeper | round cat kid, oversized rain hood, tiny reed net | pond teal, cream, warm orange | patiently leans toward water; net wiggles after a catch request |
| **Waddles** | Beachcomber / swap keeper | squat duck kid, oversized shell satchel, pebble hat | shell cream, moss, coral bill | waddles low and stops to inspect shine; holds shell up when trading |
| **Sluggo** | Garden helper | long low snail kid, leaf parasol, soil basket | leaf green, dusty rose shell | slow gliding body with delayed antennae/parasol follow-through |

The purpose is not animal realism. Each must read from normal gameplay distance as a member of this particular island and communicate why the player might visit them.

## Player-drawn residents

The creator’s drawing remains central, but a resident needs a character grammar:

1. Player chooses a resident role/body family: sprout, bird, blob, cat, snail, or round kid.
2. Their drawing is used as a large signature paper component—hair, shell, cape, face marking, backpack, or held charm.
3. The role kit supplies an animation-compatible body/paper-doll anchor system.
4. The player chooses a name and one home/request theme.

This is the same honest division as Character Studio: player art is visible and personal; the kit makes it an animated readable resident without secretly replacing the art.

## Do not do

- Do not turn an arbitrary drawing into a generic mascot behind the player’s back.
- Do not use a stock animal body with a tiny player-drawing badge.
- Do not add NPC dialogue volume before visual identity exists.
- Do not run two competing resident visual languages.

## First implementation target

Build Miso as the reference resident paper doll first:

1. authored cat-kid sheet with pond hood + reed net;
2. 2-frame idle/walk motion, net secondary motion;
3. pond-side stance and one visible pond project/display anchor;
4. compare at gameplay distance beside player and cottage;
5. only then migrate Waddles and Sluggo to the same system.

## Acceptance

At normal camera distance, a player must identify Miso, Waddles, and Sluggo without reading names or speech bubbles, and explain each one’s island role from their silhouette/prop/home display.
