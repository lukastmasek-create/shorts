# MONO style (2D) — learned from a 61 s pension-explainer TikTok (1840 f, 30 fps), studied frame by frame
Private study only. Never copy its script/wording; story is always our own. Ignore the TikTok watermark overlay.

## Look
- Pure black bg + faint grey radial vignette (centre ~#1c1c1c). Only white/grey. No colour, no characters with faces.
- Everything is white line art (stroke ~5 px @1080) or solid white fill, with a soft white bloom (tight 6 px + wide 22 px glow).
- Icons: chest, trophy, document, globe, heart, flag, battery, padlock, scales, finish pole. Person = head circle + rounded torso, solid white (alive) or outline (dim/past).
- Dashed ground line (8/8) under people. Dim ghost people trail behind the hero.
- Labels = tiny uppercase pills, wide letter-spacing, heavy sans. White-filled/black text = main, black/white outline = secondary.
- Big bold numbers (age, year, $) with small grey spaced caption beneath ("AGE", "YEAR", "AGE TO COLLECT", "YEARS WORKED").
- "Crossed out" = white X draws over icon or pill (reward, kindness, revolution, retire at 65).

## Motion
- One idea per ~3-5 s scene; every scene = icon/number + pill. Counters tick with ease (ages 20->66, year 2022->1889, $0->$4,000).
- Pop-in with small overshoot; progress bar fills white; scales tilt as weights stack; bars grow staggered.
- Transitions: whip with vertical/horizontal motion blur + fade (~5 f), ring pulses (3 expanding circles) on key beat.
- Camera: layout slides/zooms between scenes, no real camera.

## Timeline of the source (frames) -> our MonoShort scenes
0 timeline ages+chest | 175 "what most people think" bar+trophy | 315 year rewind 1889 Germany doc | 460 age-to-collect 0->70 + people row |
610 most never made it | 700 kindness/revolution crossed | 860 age 70->65 globe | 960 work/enjoy bar | 1020 scales "the trade" |
1250 finish line 65->67 | 1450 freedom + income bars | 1670 battery, retire crossed, gate "permission" | 1790 "your call" rings.

## Code
`2d/src/kit.tsx` (Stage, Scene, Pill, Num, Person, Icon, Bar, Cross, Ring) + `Mono.tsx` (composition `MonoShort`, 1080x1920, 1840 f).
Pure SVG, no three.js, renders on CPU: `COMP=MonoShort GL=swangle ... node scripts/bridge-stills.mjs out/m_ 60,900 0.5` (~1 s/frame).
Render: `npx remotion render src/index.ts MonoShort out/mono.mp4 --codec h264 --crf 16` (silent; add own voice).

## Batch 2 (two more clips: composure explainer 1702 f, credentials explainer 2302 f)
Same language, new vocabulary (all in `kit2.tsx`): suit-man outline person, ECG heartbeat, noisy/sine traces, gauge with needle,
waffle grid (cells light up to a %), spotlight cone + graduation cap, step cards ("STEP 1 / BREATHE SLOW"), checklist ticks,
branching path with travelling dots, funnel, door, building, hourglass, coins, eye, monitor, chair, flames ring, bars staircase.
Extra rules seen: dim ghost people = "everyone else"; hard pill swap for changing text ("entry: school diploma" -> "university degree");
ring pulse = resolution beat; whip-blur between every scene; last scene ends on glowing hero + "you can do it"-type pill, then fade.
Compositions: `CalmShort` (Calm.tsx, 11 scenes) and `DegreeShort` (Degree.tsx, 12 scenes). Content is generic/original; names of people/studies from the source clips were NOT reused.

## Transitions & full screen (kit: `2d/src/fx.tsx`, demo: `FxDemo` comp, `2d/src/FxDemo.tsx`)
Rule 1 — use the WHOLE 1080x1920 canvas, not just the middle band. Spread content over the full height (`spread(n)` gives y positions), let backdrops bleed past every edge, scale hero icons up (2-3x), and keep only text/pills inside `SAFE` (top 160, bottom 1540, left 60, right 960; the platform UI covers top ~150, bottom ~380, right ~120).
Rule 2 — every scene starts with an edge-to-edge backdrop (draw it first): `Starfield`, `GridBG`, `BigRings` (huge rings, often off-centre), `Rays` (speed lines from a point), `GhostBleed` (giant faint outline icon cropped by an edge). Opacity 0.08-0.2 so the icons stay the hero.
Rule 3 — scenes never just fade. Wrap each in `<SceneFx a b inT outT d>` and pick a transition pair:
- `zoomIn`: leaving scene pushes past the camera (scale 1 -> 3.2, blur), next scene arrives small and grows. Use for "go deeper / enter / look closer".
- `zoomOut`: leaving shrinks away, next arrives huge. Use for "pull back / see the bigger picture".
- `whipL` / `whipR` / `whipUp` / `whipDown`: slide off-screen with directional motion blur (x or y only). Use for time passing, next item, travel. Match direction to the story (left = forward in time on our shorts).
- `iris`: circle wipe from the centre. Use for reveals, "inside X", ending.
- `spin`: small rotate + scale. Use for chaos, dizziness, glitch beats.
- `fade` / `cut`: calm beats / hard cuts on a loud word.
Default `d` = 9 frames. Alternate types, do not use the same one 3x in a row; end the short on `iris` or `fade`.
In-scene camera: `<Cam t a b from={{s:1}} to={{s:1.4,x,y}}>` pushes in / pulls out / pans about a point while a scene plays (use on every scene longer than ~4 s so nothing sits still). `Flash` = white blink on a hard beat.
Use `SceneFx`, not the old `Scene` (kit.tsx) or per-file `S`/`Inner` wrappers, in new shorts. Old shorts stay as they are.
Check: `COMP=FxDemo node 2d/stills.mjs out/fx_ 30,55,63,114,124,175,183,215 0.4`.
