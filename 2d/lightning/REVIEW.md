# REVIEW — LightningShort (self-review, stills only)
Checked: facts vs SOURCES (all on-screen numbers: 50,000 °F, 5×, 10 %/90 %, 1942–1977, 7 strikes, 1 in 15,300 trace to SOURCES; 1 in 15,300 shown vs voice "about one in fifteen thousand" = rounding; day 30/300/365 are illustration, labelled) · wording own · MONO only (white/grey, no faces; "ranger" = person + hat) · no Math.random, no `id=` in file (determinism, unique IDs) · FRAMES from frames.json, cue table at top · 2090 f = 69.7 s · tsc clean · stills at frames 20,150,340,560,800,1100,1300,1560,1800,2030,391,886,1342,1842,2067,2085.
Transitions: fade, zoomIn, whipL, whipUp, zoomOut, whipR, zoomIn, whipL, zoomOut, iris (no 3× repeat, ends iris).

| Sev | Where | Issue | Status |
|---|---|---|---|
| major | s8 (~1872–2090) | cloud overlapped "1 in 15,300" | fixed (cloud y 560→740, bolt moved) |
| polish | s0 ~150 | DAY counter sits behind bolt/cloud | open |
| polish | s4/s7 | flame icon (Icon2 "flame") reads as a droplet | open |
| polish | s5 ~1342 | X crosses the "Body adapts" pill text (intended) | ok |
| polish | cuts | 2–3 black frames per cut = shared fx.tsx behaviour, not touched | known |

Not checked: voice not listened to (cues for scenes 0,2,4 mapped by order, unlabelled in cues.json; whisper unavailable, sync = pauses only; "day three hundred" counter hits at cue 159 local, may be early/late); video not watched in full; max-Cam-zoom edge check by eye on stills only; Sullivan strike positions on timeline are placed by year (1942, 1969, 1970, 1972, 1973, 1976, 1977).
