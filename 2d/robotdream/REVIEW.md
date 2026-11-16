# REVIEW — RobotDreamShort (stranger pass, 2026-11-16)
Stills viewed: 100,300,550,800,1100,1350,1600,1800,2000 (0.5 scale, CPU).

## Defects (fixed, tsc clean)
| sev | where | defect | fix |
|---|---|---|---|
| major | s8 f~2000 | pills overlapped the lying robot | robot y 1060->1000, pills 1330/1440 |
| polish | s2 | "Sleep: practice on made-up samples" pill small (size 12) | size 13 |
| polish | s6 | dashed/solid draw-on hack conflicted | single dasharray draw-on |
| polish | all | unused LAYERS const | removed |

## Checks
- Facts vs SOURCES.md: all six dated claims map to a row. On-screen "finds diamonds" = authors' claim (DreamerV3). Spoken "without human examples" matches. Closing beat says "no evidence", no machine-feelings claim.
- Wording: written fresh. "Robots" = loose usage; sources are about networks/agents (in SOURCES "do not claim").
- MONO: white/grey only; robot has a visor line, no face.
- SAFE: pills y<=1440, x centered; Src 1510; Cam max 1.06.
- Transitions: fade/zoomIn, zoomIn/whipL, whipL/zoomOut, zoomOut/whipUp, whipUp/spin, spin/whipL, whipL/zoomIn, zoomIn/whipDown, whipDown/iris. No triple repeat, ends on iris.
- SVG IDs: none defined in RobotDream.tsx.
- Determinism: frame-driven only (no Math.random / state).
- FRAMES/cues from frames.json + cues.json (table at top). Runtime 2048 f = 68.3 s.

## NOT checked
- Voice not listened to; no whisper, so sync = pause cues, not word-exact. Scene 2 phrase split is fragmented ("Awake," / "it learns." / "Asleep,"): wake/sleep swap may be a beat off.
- Video not watched in full; only stills. Motion (maze dot, DeepDream eyes, bar recovery) unseen.
- Scene 5 bars are schematic (illustration, not data).
- 2-3 black frames at cuts = existing fx.tsx behaviour.
