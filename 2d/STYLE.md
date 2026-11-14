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

## Dynamic motion (rule: something new moves on screen every 0.5 s = every ~15 f)  — kit: `2d/src/motion.tsx`
Goal: hold the eye in the first 2 s and never let it drift. Silent still frames are the enemy.
- **Hook (0-2 s / 0-60 f):** open on motion, not a title. Frame 0 already has a hero shape mid-move (zoom, spin, count) + a big claim pill by frame 6. First SceneFx change inside 2 s. No fade from black.
- **Beat grid:** scenes 2.5-4 s (75-120 f). Inside a scene a *new event* every 12-18 f: item pops in, number ticks, ring fires, camera nudges. Plan the scene as a list of beats with frame numbers before coding.
- **Every element is alive:** wrap hero icons/people in `<Alive t a x y>` (spring pop-in + idle float). Held shapes never sit still: `float`, `beat` (heartbeat scale), slow rotation of backdrops, `Starfield` drift.
- **Entrances (rotate, never 3x same):** spring pop, draw-on stroke (`draw`), slide + overshoot, scale from 0 with blur, stagger rows (`stagger(i,a,4)`), split-in from both edges, count-up (`count`).
- **Impacts:** every "key word" beat gets `Burst` + `shake` + `Flash` (+ camera punch `Cam` 1 -> 1.08 -> 1 over 8 f). Max one per ~3 s so it stays punchy.
- **Camera:** every scene has a `Cam` move (push-in on tension, pull-out on reveal, pan on travel). Add a second move or a 3-5 deg tilt on scenes > 4 s.
- **Motion on words:** pills enter with a type-on or hard swap, important word scales to 1.15 for 6 f. Numbers always count, never appear.
- **Parallax:** 3 layers (far = faint rings/stars, mid = ghost icons, near = hero) drifting at different speeds, so camera moves read as depth.
- **Transitions:** ONE per scene boundary, always motivated (see "Transitions & full screen"). Add a *match cut* where a shape in scene N becomes a different shape in N+1 at the same position/size (circle -> sun -> eye -> ring). Use hard `cut` + `Flash` on the loudest beat.
- **Pacing curve:** slow-in (calm hook question) -> accelerate (more beats per second as stakes rise) -> one 1-s silence/hold on the biggest fact -> fast release. Cut on voice words, not on pauses.
- **Check:** render stills every 15 f of a scene; if two neighbouring stills are identical, add a beat. Still sheet: `COMP=X node 2d/stills.mjs out/x_ 0,15,30,45,60 0.4`.
- Perf: no scene-wide SVG filter (10x slower on CPU). Glow = one `<g style={{filter}}>` on small groups only.

## Models & visualization (better visuals, still mono line-art)
- **Show, do not label.** The idea must be understandable with the sound off: draw the thing (planet, body part, building, crowd) at scale, not an icon plus a word.
- **Scale models:** use real proportions and show scale by comparison (human next to the object, then zoom out until the human is a dot; ruler/tick marks with big numbers). One "scale zoom" scene per short where it fits.
- **Objects need construction detail:** outline + 2-3 inner details (panel lines, crater arcs, rib lines, window grid, cross-section hatch). 3-weight line system: 5 px silhouette, 3 px detail, 1.5 px hatch/dim.
- **Characters:** person = head + torso is the minimum. Add pose and action (running, falling, reaching, shrinking) by rotating limbs as line segments; 2-frame walk cycle for movement. Faces stay empty; emotion comes from posture and a `?`/`!` mark.
- **Cutaways and X-ray:** show insides (body, planet layers, building floors, brain regions) as concentric/segmented shapes that peel open (iris-clip or split along a line).
- **Data as picture:** replace numbers with shapes: waffle grid, bar staircase, filling vessel, shrinking circle, timeline with ticks. Always one big number + tiny caption.
- **Diagram motions:** arrows that draw on, dotted orbit paths with a travelling dot, force vectors that grow, before/after split screen with a sliding divider, ghost "what it would be without it" outline.
- **Mood by line:** danger = jittery/dashed lines + slow red-less pulse (brightness only), calm = long smooth arcs, scale = thin lines + huge empty space, tech = grid + straight segments.
- **New models to build into `kit2.tsx` as needed:** planet with rings/craters/terminator shading (hatch), human cross-section, city skyline with window grid, ocean with depth ticks, spaceship, rocket, atom, DNA helix, skull/brain hemispheres, clock face with moving hands, crowd of 50 dots, door, eye with iris zoom, mountain range, volcano.
- Reuse `Icon`/`Icon2` first; add new ones to `kit2.tsx` with the same `{k,x,y,s,o}` API and register them in `FxDemo`.

## Storytelling (every short = hook -> escalation -> twist -> landing)
- **Structure (55-60 s, 9-12 scenes):** 1 Hook question (0-3 s, one concrete image) -> 2 Normal state ("right now...") -> 3 First change (easy to picture) -> 4-7 Escalation: each scene ~1.5-2x bigger/worse/stranger than the last, one new fact each -> 8 Twist or turn (the thing nobody expects, a human consequence) -> 9 Reality check (what science actually says + a sourced number) -> 10 Landing: one line that reframes the opening, ends on glowing hero.
- **Open loop:** promise a payoff in the hook ("and the third thing is the real problem"), pay it off in the last 10 s. Loop-ready: last line echoes the first so autoplay replay feels seamless.
- **One protagonist:** a single person-shape ("you") carries the story from scene 1 to the end, so the viewer follows a character instead of slides. Show what *you* feel/lose/gain.
- **Concrete over abstract:** "In 10 minutes your lungs run out" beats "the atmosphere changes". Every claim = a number, a timer, or a comparison (a bus, a country, a human lifespan).
- **Countdown / ladder devices:** timers (0:10 ... 0:00), 1x -> 2x -> 4x -> 8x doubling ladders, day/hour/year counters give the viewer a reason to keep watching. Use on every "doubling/every minute" topic.
- **Tension beats:** question -> beat of silence (6-10 f of no motion except a pulse) -> answer. Do it at least twice.
- **Emotional turn:** by scene 7-8, move from facts to what it means for people (loneliness, hope, fear, awe). Last scene = feeling, not data.
- **Facts:** only real, sourced numbers (SOURCES.md per short); mark fiction clearly ("in this thought experiment"). One surprising counter-intuitive fact per short.
- **Voice/script rules:** ~2.4 words/s, sentences <= 12 words, one idea per line = one scene, no filler, present tense, second person. No captions in video, English only, one steady voice.
- **Variety across the feed:** rotate formats: countdown, journey (travel through layers), split-screen compare, "day 1 / day 100 / day 10 000", zoom-scale, mystery reveal. Do not make two neighbours in the same format.
- **Pre-flight checklist before coding:** hook in 3 s? beat list with frames? one escalation per scene? twist? sourced numbers? last line echoes first? transition per boundary chosen?
