# PROMPT: kinetic-type "hype promo" short in Remotion + three.js

Paste everything below into a fresh Claude Code session in this repo.

---

## Task
Build ONE vertical short (1080x1920, 30 fps, ~45-60 s) in the style of a fast **kinetic-typography / motion-graphics tech-hype promo**, using **Remotion 4 + three.js (@react-three/fiber, @react-three/postprocessing)**. Add it as a new composition (e.g. `HypeShort`) in `src/Root.tsx`, code in `src/videos/hype/`. Reuse the repo's post-FX engine from `src/videos/bridge/` where it fits (lens blur, grade, grain). Follow `SKILL.md` + `CLAUDE.md`. English only, one steady voice, no burned-in captions beyond the designed kinetic words. Verify with stills (`scripts/bridge-stills.mjs`, `GL=swangle`, `post.kick`), `npx tsc --noEmit` clean. Do not render the full film in the cloud.

Topic of the short is free (pick a product-reveal / "you won't believe this tool" script, ~100-140 words). Do NOT copy any real brand, logo, face, handle or watermark from the reference. Invent a fake product name + logo (text + shape).

## What the reference is
A creator promo for an AI animation tool. It is a **16:9 motion-graphics piece shown on a "laptop screen"** inside a 9:16 TikTok frame (warm wall + title on top, Mac dock + keyboard below, TikTok watermark). Then it cuts to phone screen-recordings (chat app, connector setup form) with big bold white word-by-word subtitles, a face-cam talking section, a yellow CTA ("Comment WORD"), and an end card.
For our short: make the **motion-graphics part full-frame vertical** (no laptop mockup). Optional: one flat "screen-record" UI section and a CTA card. No face-cam.

## Look (design tokens)
- Palette: near-black `#050507`, off-white `#EDEDF0`, **signal red `#FF3B1F`** (hero accent), deep red glow, orange `#FF7A1A` for 3D cube, blue-violet gradient `#3B4BE0 -> #8A3BE0` for the prompt box, acid yellow `#F2FF1F` for CTA only.
- Backgrounds alternate hard between **flat red**, **flat off-white**, and **black with dot-grid + red bokeh particles + red radial glow**. Contrast flips every 1-3 beats.
- Type: ultra-heavy all-caps grotesk (Archivo Black / Inter Display 900), tight leading, huge (word fills the full width, often cropped by the frame edge). Red full stop `.` after punchline words. Small mono (JetBrains Mono) for prompt/UI text with red highlight chips on key tokens. One contrast serif italic line ("the usual way") for irony. Outline-only text and stacked echo copies (3-5 copies, fading, offset in Y) for emphasis.
- Texture: film grain, vignette, light scanlines, bloom on red, chromatic aberration (RGB split) on hits, slight CRT/dot-matrix feel, red thin "laser" lines.

## Element library (build each as a small reusable component)
1. `KineticWord` - one big word/phrase, per-letter stagger, props: color, bg, align, crop, tracking, mode (`slam | stretch | scramble | extrude | outline-echo | tracking-in`).
2. `Slam` - scale 1.5 -> 1 + motion blur + 2-4 frame overshoot, lands on a voice word.
3. `Stretch` - letters scaleX/skew warp, tracking widens then snaps (word "STRETCH" itself stretching).
4. `Extruded3DText` - real 3D text (drei `Text3D`/troika) lit from side, camera dolly through it, blur trails.
5. `Starburst` / `Blob` - red 12-point spiky burst and red circle that morphs, drips; drawn behind/over words ("ARE YOU ... KIDDING ME?").
6. `QuestionMarks` - giant red `?`, black `?`, outline `?` popping with bounce around text.
7. `Laser` - thin red line that sweeps across, slices the frame, draws an X over a crossed-out UI (strike-through of the "old way").
8. `ParticleField` - red bokeh dots + dot-grid, slow parallax, burst from center at start (radial speed lines from a red dot).
9. `NodeGraph` - rounded cards (Model -> Protocol -> App) connected by glowing red wires with travelling pulses and small pill labels ("controlling").
10. `LogoReveal` - fake logo: swirl icon draws, text scrambles in, red laser underline, glow pill with glossy white text in a red capsule, flame-like flourish, tiny subtitle under it.
11. `PromptBox` - blue-violet rounded box, typewriter text with blinking cursor, red highlighted tokens ("15-second"), enter-key button, glow on type.
12. `TimelineMock` - fake editor window: keyframe diamonds on bars, playhead, mouse cursor that clicks; later crossed out by `Laser`.
13. `VideoPlayerMock` + `FilmStrip` - player card whose red play triangle morphs -> diamond -> rounded square (shape morph), film strip scrolling beside it.
14. `Viewfinder` - corner brackets, "CAMERA" label, red orb with radial tick ring and tiny text "and wait for the transition-".
15. `Cube3D` - orange 3D cube floating over white, soft contact shadow, slow rotation.
16. `RenderTimer` - checkerboard-filled giant "RENDER", progress text + hourglass + ETA `03:30:10` counting (pain-point gag).
17. `StackedList` - "KEYFRAMES. LAYERS. GRAPH EDITOR." repeated and stacked until it forms a wall of text.
18. `CTA` - yellow bold two-line call-to-action on dark blur, then end card.

## Transitions (the signature - make these custom, not stock fades)
Use `@remotion/transitions` `TransitionSeries` with **custom presentations**, plus `@remotion/motion-blur`.
- **Whip-pan / directional smear**: outgoing scene slides + horizontal blur, incoming scene arrives from the other side (6-10 frames).
- **Zoom-through**: scale 1 -> 6 with radial blur into the next scene (camera "flies through" a letter/hole), common out of dark scenes.
- **Slice / venetian-blind wipe**: vertical stripes of the old frame stretch and slide off (looks like the barcode frame).
- **Glitch cut**: 2-4 frames of horizontal block displacement + RGB split + pixel-sort bars, then new scene.
- **Flat-color flash cut**: one frame of full red or full white, then the next word.
- **Laser wipe**: a red line sweeps and reveals the next scene behind it.
- **Shape wipe**: red blob/starburst scales up from a point and becomes the next background.
- **Hard cut on the beat** (most common). Average shot is 0.4-1.2 s, some single words are 6-10 frames.
- Implement the zoom/RGB/glitch/stripe effects as custom `postprocessing` `Effect`s (GLSL) driven by a `transition` uniform from `useCurrentFrame()`; never use `useFrame`.

## Animation rules
- Everything is a pure function of `useCurrentFrame()` (Remotion rule). No CSS transitions, no `useFrame`, no random without `random(seed)`.
- Motion curves: `spring({damping: 10-14, stiffness: 180-260})` for slams with overshoot; `Easing.out(Easing.exp)` for whips; `Easing.inOut(Easing.cubic)` for camera moves. Hold, snap, hold. Never linear.
- Words land exactly on the voice word timestamp. Generate voice with `scripts/voice.py` (or repo voice pipeline), get word times, and build the shot list from those times (`story.ts`: array of `{from, dur, scene, text, bg, transitionIn}`).
- Constant micro-motion on holds: slow scale 1 -> 1.04, 1-2 px jitter, particle drift, so no frame is static.
- Camera moves in 3D scenes: dolly-in, orbit around the cube, fly along a curved spline through floating words ("FLUID CAMERA MOVES").
- Text reveals: tracking-in (letter spacing collapses), per-letter scramble, mask-wipe up, typewriter.
- Emphasis: red chip highlight on a keyword, strike-through, outline echo, shake 4-6 frames.

## Suggested structure (map to your own script)
1. 0-1.5 s: black, red dot, radial particle burst -> first slam word on white ("NO WAY.").
2. 1.5-8 s: rapid single-word slams on red / black / white, laughing "HA HA" micro-text, extruded-text zoom-through.
3. 8-14 s: "the old way" - timeline mock, crossed out by laser X, whip to white "AND BEFORE YOU ASK ?" with giant question marks.
4. 14-24 s: reveal - node graph, then logo reveal in red glow, product subtitle.
5. 24-34 s: "you tell it what you want" - chat/prompt card, typewriter prompt, film strip + morphing player shape, "ALL YOU NEED IS TO WRITE:".
6. 34-52 s: capability montage, one word per beat each with its own demo (KINETIC TYPE / MORPHING SHAPES / 3D ELEMENTS / FLUID CAMERA MOVES / STRETCH / CAMERA), then "and wait for the transition-".
7. Pain-point gag: starburst "ARE YOU ... KIDDING ME?", dark-blue grid "THINK ABOUT MAKING THIS the usual way", stacked KEYFRAMES/LAYERS/GRAPH EDITOR, RENDER + ETA.
8. Last 5-8 s: CTA card (yellow), end card.

## Sound (match the energy)
Bass-heavy electronic beat ~120-128 bpm, cuts on beats; whoosh on every whip, riser into reveals, impact/boom on slams, glitch blips on glitch cuts, keyboard clicks on typing, short vinyl-scratch/record-stop at the gag. Duck music under voice. Build with `audio/` scripts like `aging_mix.py`.

## Technical plan
- Layers per scene: (a) `<ThreeCanvas>` for 3D + particles + shader FX, (b) DOM/SVG overlay for UI mocks and crisp text, (c) one global `EffectComposer` pass chain: bloom -> chromatic aberration -> grain -> vignette -> transition shader. Keep text crisp: render big words in DOM/SVG when no 3D needed; use 3D text only for extrude/dolly scenes.
- Fonts via `@remotion/google-fonts` (+ `delayRender` if using troika).
- Perf: cap particles ~2k instanced points, reuse geometries, `dpr=1`. On no-GPU box use `GL=swangle` + `post.kick`.
- Deliver: `story.ts` (shot list), `components/*`, `Hype.tsx`, composition registered, 8-10 stills checked (one per scene type), short README of how to tweak the shot list.

## Definition of done
Looks like the reference energy: constant motion, high contrast color flips, every cut on a beat/word, custom transitions visible (whip, zoom-through, glitch, stripes, laser), tsc clean, stills verified, no real logos/faces/handles.
