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
