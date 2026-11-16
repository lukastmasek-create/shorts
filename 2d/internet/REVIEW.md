# REVIEW — InternetShort (stranger pass, 2026-11-16)
Stills viewed: 60,200,330,440,600,780,1040,1300,1550,1780,2000,2085 + 150,520,660,830,1120,1350,1610,1700 (0.5 scale, CPU).

## Defects (all fixed, tsc clean, affected scenes re-checked by code, determinism re-run)
| sev | where | defect | fix |
|---|---|---|---|
| major | s2 f~520, s4, s5, s8 | pill overlapped the bottom source line (y 1480-1500 vs 1510) | pills moved to y 1330-1430 |
| major | s0 f~150 | "NOT CITIES" pill sat on top of the monitor | moved to y 250 above buildings |
| polish | s7 | "150-200" number touched snap ring | y 1330 -> 1350 |
| polish | s5 | "NEARLY ALL..." pill text small (13) | size 15 |
| polish | all | unused imports (Box, clamp, cueEnd) | removed |

## Checks
- Facts vs SOURCES.md: every number/claim on screen maps to a row (1969, 6.0 bn/3 in 4, 200 km/ms + 2/3, >1M km, 1858, 150-200 faults, 1.5% 2024). "Nearly all intercontinental data" is attributed on screen ("industry groups (ICPC/ITU)") and in SOURCES.md as secondary; spoken line says "groups say" (shortened to fit 70 s).
- Illustrations (not data): continents/seabed shape, ship, building outlines, waffle = 75 cells, hourglass.
- Originality: script written fresh, no wording copied from other shorts.
- MONO: white/grey only, no faces, ground dashed, pills, ring on resolution.
- SAFE: pills/text x within 130-950, y 250-1450; Cam max zoom 1.06 keeps text inside; source line y 1510 (above bottom UI ~1540).
- Transitions: fade/zoomIn, zoomIn/whipL, whipL/zoomOut, zoomOut/whipL, whipL/whipDown, whipDown/whipL, whipL/spin, spin/zoomIn, zoomIn/whipUp, whipUp/iris: no triple repeat, ends on iris.
- SVG IDs: Internet.tsx defines none (uses kit's own).
- Determinism: same frame (1330) rendered twice -> identical md5.
- FRAMES/cues used: frames.json + cues.json imported, one table at top. Runtime 2093 f = 69.8 s (in range 1800-2100).
- tsc: clean.

## NOT checked
- Voice never listened to; sync rests on pause cues (no whisper), not word-exact. Cue phrases sometimes split oddly ("Today," alone) so a few hero moments may land on a comma, not the keyword. Listen to s1 (L,O crash), s2 (count), s5 (cable draw) and nudge cue indices in the table if off.
- Video not watched end to end; only stills. Motion smoothness, transition blur, overlaps in 9-f transitions unseen.
- Bottom half of some scenes is sparse before the cue fires (s3, s8 early frames).
- 2-3 black frames at cuts = existing fx.tsx behaviour.
