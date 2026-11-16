# Landscape showcase of ucimesehrou.org/code (1920x1080, 30 fps)

Two standalone videos, each <= 15 s, English-free (Czech on screen), sound effects only.

| part | comp id | frames | hero |
|---|---|---|---|
| `kod-01` | `KodLandDil1` | 420 | Cvičení „Doplň stav při najetí“: doplnit `:hover`, Zkontrolovat, „Jupí, splněno!“ |
| `kod-02` | `KodLandDil2` | 420 | „Klikni na řádek s jiskrou“: `<header>` a `<h1>` z index.html, vysvětlení se změní |

Files

- `2d/src/studioMotion.tsx`: charcoal studio + card + motion primitives (spec blocks 10 and 11, unchanged).
- `2d/src/codeLandPlan.ts`: the single timeline (output frames) for camera, picture, lint and sound.
- `2d/src/CodeLand.tsx`: the two compositions. One persistent card shell per video (title -> exercise/code -> result), cursor and camera in one world group.
- `2d/codeland/lint.mjs`: measures all required text with the real fonts, projects through the camera over each reading hold, validates frames / holds / typing / flights, writes `kod-0N/lint.json`, `scenes.json`, `timeline.json`.
- `audio/showcase_sfx.py`: now also has explicit-cue mode (`events` in scenes.json, nothing random).

Rebuild

```bash
node 2d/codeland/lint.mjs                                            # must print LINT PASSED
python3 audio/showcase_sfx.py 2d/codeland/kod-01/scenes.json public/kod-01/sfx.wav
python3 audio/showcase_sfx.py 2d/codeland/kod-02/scenes.json public/kod-02/sfx.wav
npx remotion bundle 2d/src/index.ts                                  # -> build/
npx remotion render build KodLandDil1 out/kod-01.mp4 --codec h264 --crf 18 --muted --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=3
ffmpeg -i out/kod-01.mp4 -i public/kod-01/sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/kod-01-final.mp4
```

Notes

- No GPU here: `swangle`. All SVG, no WebGL, so no `post.kick` needed.
- Physical Blender stage not used (Blender not installed): StudioCard SVG fallback, as the spec allows.
- Camera never flies fast (max ~6 px/frame), so no chromatic aberration pass (identical to CA = 0) and no motion blur.
- Mono font: JetBrains Mono (`@fontsource/jetbrains-mono`) for deterministic metrics. The site itself uses the system monospace.
