# Shot plan: "What if you could pause everyone except yourself for 10 minutes a day?" (SKILL.md step 4)

Source of truth for timing: `pause/voice/words.json` (59.1 s at 1.2x, voice ends f1769 at 30 fps). TOTAL = 1800 (31 f tail).
Rule: every visual reaction lands 0-3 f BEFORE its word. No captions or labels in the video (clocks, calendars, bars = pictures only, no digits or letters).
Hero = bean-head ~20-year-old. Aging shown only through hair, bags, glasses (cards), never text.
"Frozen" = billboards held on one pose (no walk cycle, no blink), pigeon and cars parked mid-motion. Only hero and unfrozen cast animate.
Template: `src/videos/pause/` (copied from bridge). Composition `PauseShort`, `PAUSE_FRAMES` in `Pause.tsx` (currently 1800).

## Shots (frames from words.json; light = day|golden)

| # | frames | words | light | scene | camera (cut on big jumps, 18-40 f glides, every hold pushes in) | DOF cInf |
|---|---|---|---|---|---|---|
| 1 | 0-76 | Every day the world freezes for 10 minutes | day | busy town street, crowd walking, cars moving, pigeon flying; at f23 everything holds a pose (freeze kick, crowd stops mid-stride) | wide high 3/4, slow push, kick at f23 | 0 |
| 2 | 76-108 | Everyone except you | day | hero CU in frozen crowd, only he blinks, smug turn of the head | CU eye level, push-in 0.3 %/f, roll 4 deg on "you" (~f 94) | 14 |
| 3 | 108-166 | No traffic, no noise | day | frozen cars mid-street, horn-wave card stuck in the air, hero strolls between them | flash 106-110, cut to low side track riding with hero; glide up on "noise" (~f 141) | 8 |
| 4 | 166-236 | A pigeon hangs in the air like a sticker | day | pigeon CU hovering mid-flap, hero pokes it, it spins and holds; ends stuck at head height like a sticker | cut to pigeon CU, push-in, kick at "sticker" (~f 215) | 12 |
| 5 | 236-320 | On day one you skip the line at the coffee shop | day | cafe queue of frozen customers, hero walks past all of them to the counter, takes his coffee | cut MS along the queue, glide to counter on "coffee" (~f 287) | 10 |
| 6 | 320-358 | Nobody notices | day | time restarts: queue blinks, shrugs, looks at empty counter, hero already sipping | MS front, cut at f320, small roll 3 deg | 10 |
| 7 | 358-454 | By day 10 you finish your homework, then your neighbor's | day | desk, notebook pile; hero scribbles fast (blur card); cut at "then" (~f 419) to a second, bigger pile through a window, neighbor's desk | MS desk, cut to neighbor window MS, kick at "neighbors" (~f 428) | 12 |
| 8 | 454-570 | By day 100 you have read a whole library while the pigeon watches | day | book tower grows beside hero each beat, shelves fill; pigeon perched frozen on a book looking at him | low angle, crane up following the tower; cut to pigeon CU on "pigeon" (~f 533) | 0 then 14 |
| 9 | 570-668 | By year 10 you know every frozen stranger in town | day | town square, hero tips hat to a frozen man, hugs a frozen woman, dances with a frozen kid; each on a beat | three quick cuts on "know" (~f 597), "frozen" (~f 611), "stranger" (~f 623), wide on "town" (~f 644) | 10 |
| 10 | 668-757 | Then one morning you look in the mirror. Your hair | day | bathroom mirror, hero checks his face; at f725 one grey strand pops up on his head | MS front, slow push, cut to hair CU on "Your" (~f 725) | 12 |
| 11 | 757-790 | is greyer than your friends | day | line-up: two friends with dark hair next to hero, hero's head visibly grey | cut f757 to wide front two-shot, kick on "greyer" (~f 743, from shot 10 end), roll 3 deg | 0 |
| 12 | 790-888 | Luckily, you gain 60 extra hours every year | golden | hero lounging in a frozen-world deckchair, clock cards pile up, a sixty-slice pie card spins once | cut f790, low 3/4, glide up with the pile on "extra" (~f 824) | 8 |
| 13 | 888-980 | Unluckily, you are the only one who ages during them | golden | hero in same pose; hair greys, glasses, bags appear in three steps; friends beside him stay young | CU hero, push-in, kick at "ages" (~f 938) | 12 |
| 14 | 980-1088 | Here is the math. 10 minutes a day is 60 hours a year | day | explainer on flat colour: 10-minute slice of a clock, 365 page fan, hours block grows to sixty | locked front, slow push-in only | 0 |
| 15 | 1088-1176 | Over 80 years, that is about 200 days | day | calendar tower grows block by block as years tick, last thud at "days" | locked low, crane up with the tower, kick at "days" (~f 1143) | 0 |
| 16 | 1176-1296 | Everyone else lives 80 years. You live 80 years and half a year more | day | two horizontal bars: friends bar, hero bar a sliver longer; sliver glows on "half a year" | locked front, push to the sliver on "half" (~f 1267), kick at "more" (~f 1282) | 0 |
| 17 | 1296-1426 | You are always a little older than your friends, a little wiser, a little more tired | golden | birthday table: cake, friends young, hero older; cut on "wiser" (~f 1366) to hero with glasses + book; cut on "tired" (~f 1394) to yawn, bags | MS, two cuts on those words | 10 |
| 18 | 1426-1490 | And nobody can ever explain why | day | friends scratch heads, "?" cards, hero shrugs | MS push, kick at "why" (~f 1473) | 10 |
| 19 | 1490-1560 | So at the end, they ask for your secret | golden | old hero on a porch bench, white hair, crowd with microphones leaning in | crossfade 8 f, low 3/4, glide in on "secret" (~f 1538) | 8 |
| 20 | 1560-1626 | You smile and say: 10 minutes | golden | CU smile, hero lifts ten fingers at "10"; reporters blank stares | CU push-in, kick at "10" (~f 1591) | 12 |
| 21 | 1626-1724 | Then you do what you always do with them. You close your eyes | golden | the world freezes again (crowd and reporters hold pose), hero settles back in a deckchair, closes eyes slowly | MS, slow push, last eyelid close at "eyes" (~f 1703) | 10 |
| 22 | 1724-1800 | and the whole world waits for you | golden | wide frozen town at sunset, pigeon parked above, hero a tiny napping dot in the centre | crane pull-out 76 f, no DOF, hold last 31 f | 0 |

Crossfades (XFADE): 6 f at 10 (time jump), 14 (explainer bg), 8 f at 12, 17, 19, 22. White flash 4 f at 106 after the hook. Hard cuts elsewhere.
Kicks (flip-shake 7 f): 23, 215, 428, 743, 938, 1143, 1282, 1473, 1591 - tune to the exact word frame.

## Code to write
1. `story.ts`: drop bridge physics; SHOTS, XFADE, FLASH_AT, CAMS, KICKS, DOF, FOREGROUND from this table; set TOTAL = 1800.
2. `build.ts` + `paint.ts`: street, cafe, desk/window, library, square, bathroom mirror, deckchair lawn, porch, sunset town. Kenney GLB kit missing -> primitives.
3. `toon.ts` / `cast.ts`: hero (young, grey, old), 2 friends, cafe crowd, neighbor, pigeon, reporters; faces: smug, blank, tired, smile, shrug. Freeze = held pose, no walk cycle/blink.
4. FX cards: horn wave, clock + 10-min slice, calendar fan, hours block, book tower, bars, "?" cards, microphone.
5. `Pause.tsx`: play `pause/voice/voice.wav` (copy to `public/pause/`), timings from `words.json`.
6. Sound (`audio/timeline.py`): freeze whoomp at f23, poke boing, page flips, mirror ping, thud at 1143, kicks above, snore-free ending hush.

## Open before building
- Cloud render is blank at frame 100 and ~16 s/frame on CPU: render on a GPU PC. Fix blank bug first.
- Voice not auditioned by a human yet.
- Check "10" vs "ten": voice reads "ten", words.json shows "10" (whisper); timings are fine.
