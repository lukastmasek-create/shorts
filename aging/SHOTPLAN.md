# Shot plan: "What if your body stopped aging but your brain kept aging" (SKILL.md step 4)

Source of truth for timing: `aging/voice/words.json` (66.5 s at 1.2x, 1996 f at 30 fps). TOTAL = 2025 (29 f tail).
Rule: every visual reaction lands 0-3 f BEFORE its word. No captions or labels in the video (sticky note and menu = scribble lines, not text).
Hero = bean-head 19-year-old, never changes. Old brain shown only through behaviour (blank face, shuffling, wise nod) and cards.
Template to copy: `src/videos/bridge/` -> `src/videos/aging/`, register `AgingShort` in `src/Root.tsx`.

## Shots (frames from words.json; light = day|golden)

| # | frames | words | light | scene | camera (grammar: cut on big jumps, 18-40 f glides, every hold pushes in) | DOF cInf |
|---|---|---|---|---|---|---|
| 1 | 0-122 | You will stay nineteen forever... did not get that deal | day | town street, hero CU, thought-card of a grey wise head floats beside | CU eye level, push-in 0.25 %/f; punch roll 4.6 deg on "brain" (~f 85) | 15 |
| 2 | 134-241 | Year one is perfect. No wrinkles. No bad knees. Hair stays thick | day | bathroom mirror, hero checks skin, squats (knees silent), hair swish | flash 128-132, cut to mirror MS; glide to hair CU on "Hair" (~f 215) | 12 |
| 3 | 253-343 | At thirty... still get carded | day | street cafe: two friends with tired eye-bags, hero fresh; bouncer door; ID card stamp | MS friends -> cut on "carded" (~f 330) to bouncer + ID CU, kick at stamp | 10 |
| 4 | 347-482 | At fifty... bouncer asks if old enough | golden | bar door at dusk: friends grey-haired in line, hero first, bouncer squints at him | low 3/4 on line, glide to bouncer face on "bouncer" (~f 395), roll on "old enough" | 12 |
| 5 | 491-599 | At seventy, still sprint... forgot why running | day | park track: hero sprints (fast walk cycle), skids to stop, scratches head, "?" card | side tracking view riding with hero, cut to face CU on "forgot" (~f 560) | 0 then 14 |
| 6 | 614-738 | At ninety, body could win race... starting line | day | same track, body in sprint pose, face turned searching the other way for a start line | wide, push; cut to back-of-head search on "starting line" (~f 705) | 0 |
| 7 | 749-850 | Then one morning... in the kitchen, no idea why | day | kitchen wall cutaway, hero stands blank, "?" card | MS front, slow push, roll 4 deg on "no idea" (~f 820) | 12 |
| 8 | 850-908 | Luckily, you will never need a cane | day | hero strides past cane rack, one cane tips, thumbs-up grin | side MS glide | 0 |
| 9 | 925-1025 | Unluckily... note on the fridge | day | fridge CU, sticky notes covered in scribble, hero reads, blank | CU push-in (punch on "fridge" ~f 1005), kick | 14 |
| 10 | 1036-1164 | Here is the thing. After forty, brain shrinks five percent every decade | day | explainer on flat colour: two brain cards, left stays full, right shrinks one step per beat (decade ticks) | locked front, slow push-in only | 0 |
| 11 | 1178-1256 | Thinking gets slower. Memory gets patchy | day | hero in slow motion, snail passes him, memory-card with holes | MS push, roll | 10 |
| 12 | 1262-1353 | Vocabulary and stories keep growing | day | book tower beside hero grows each beat to above frame | low angle crane-up following the tower | 0 |
| 13 | 1367-1495 | Brand new sports car, wise confused grandpa | golden | red sports car, grandpa driver with white beard, cap, confused face | 3/4 front wide, cut to driver face on "confused" (~f 1460) | 8 then 12 |
| 14 | 1508-1612 | Everyone treats you like a teenager. Nobody listens | day | street: hero talking, crowd walks past, a mother pats his head | MS, push, roll on "Nobody" (~f 1560) | 10 |
| 15 | 1627-1723 | Eighty years of memories, face gets kids' menu | day | restaurant table: waiter gives crayon kids' menu, hero stares | MS two-shot, CU of crayons on "menu" (~f 1705) | 12 |
| 16 | 1723-1852 | You do the only thing... bench, look young, say: | golden | park bench, hero sits, hands on knees, wise squint | low 3/4, slow push, hold last 20 f | 7 |
| 17 | 1865-1916 | I remember when this was all a field | golden | over-shoulder: hero sweeps arm over modern town, a green field card fades in behind | wide glide, no DOF | 0 |
| 18 | 1931-2025 | And for once, nobody can prove you wrong | golden | kids pass bench, one kid nods; crane out to wide skyline | cut, crane pull-out 93 f (see S15c) | 0 |

Crossfades (XFADE): 3, 4 (day->golden), 13, 16. White flash 4 f at 128 after the hook. Hard cuts elsewhere.
Kicks (flip-shake 7 f): ~336 (ID stamp), ~1005 (fridge), ~1462 (grandpa face) - tune to the exact word frame.

## Code to write (nothing exists yet)
1. `story.ts`: SHOTS, XFADE, FLASH_AT, CAMS, KICKS, DOF, FOREGROUND from this table (copy bridge story.ts structure; drop bridge physics).
2. `build.ts` + `paint.ts`: new set pieces (street, cafe, bar door, track, kitchen wall, fridge, bench, restaurant). Kenney GLB kit missing -> build with primitives.
3. `toon.ts` / `cast.ts`: hero, 2 friends (young/old variants), bouncer, grandpa, waiter, kid; faces: blank, confused, smug, squint, tired.
4. FX cards: thought-head, "?", brain cards, snail, book tower, crayon menu.
5. Sound: `audio/timeline.py` event table from the kicks + ID stamp, car, snail, page.

## Open before building
- Cloud render is blank at frame 100 and ~16 s/frame on CPU: render on a GPU PC. Fix blank bug first.
- Voice not auditioned by a human yet.
