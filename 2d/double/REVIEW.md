# REVIEW — DoubleShort (#95), reviewed 2026-11-16

## Fixed
- major: scene 5 label "THE COMPUTER, WITH" overlapped monitor icon; rows crowded the source line -> icon up, rows spread(3,620,1300).
- major: scene 6 tick sat on the head; chart overlapped "ONLY GETS BETTER" pill, which hit the source line -> moved.
- major: scene 7 "VIDEO CALL" pill overlapped last tile row + source line -> grid/pill moved up.
- major: cues.json has a spurious last segment in scenes 5 and 8 (2-frame blip); code uses phrases 0..2 there only (scene 8 mapping: chief+colleagues / fakes / company lost). Spouse reveal = cue + OFF.spouse (28 f).

## Open
- polish: Src line is small grey 20 px, low contrast on phone.
- polish: scene 8 "FINANCE CHIEF" label is partly covered by the X.
- polish: scene 3 "Q3" mismatch (dashed circle) is unexplained on screen; honest nuance only.
- polish: Pill sitting inside Ring on scene 5 (ring pulse behind pill).
- known quirk: 2-3 black frames at each cut (fx.tsx).

## Checks
- Facts vs SOURCES.md: every number on screen (2024, 1,000+, ~2 hours, 85%, 2015, 70/150/300, 2024 Hong Kong, $25 million) in SOURCES. "Over 1,000" = "1,000+". 85% bar is schematic (labelled).
- Wording original; MONO only white/grey, no faces; transitions fade, zoomIn, whipL, whipUp, zoomOut, whipR, zoomIn, whipL, whipDown, zoomOut, iris-out; no 3x repeat.
- SVG ids: `dbl-rv2` (one scene), `barg`/`mbN` shared pattern from kit (existing behaviour).
- Determinism: no random, no state; frame-driven only.
- FRAMES/cues from frames.json/cues.json via imports; runtime 68.4 s, 2053 f. tsc clean.
- Stills viewed (0.4 scale): frames 130,340,520,800,1000,1210,1380,1640,1880,2040 (+ re-check 1210,1380,1640).

## NOT checked
- Voice not listened to; cue sync is pause-based, not word-exact (whisper unavailable).
- Max Cam zoom (1.05) not geometrically verified for every label; eyeballed from stills only at mid-scene.
- Final video not watched in full; transitions unseen.
- Frame-identical double render not run.
