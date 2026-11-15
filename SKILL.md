---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

## Purpose and scope

This file is the detailed production prompt/runbook for an AI making a new vertical 3D cartoon story short in this repository's visual style. Follow it as an ordered workflow, not as a loose inspiration document. Use the actual repository files and commands; never invent missing templates, assets, scripts, results, or completed checks. This skill covers the 3D cartoon-story workflow only. For the separate 2D workflow use `2d/README.md` and `2d/STYLE.md`; for the Učíme se hrou standalone animation use `ucimesehrou/README.md` and `ucimesehrou/PROMPT_TEMPLATE.md`.

Before production, confirm the requested topic, language, deliverable, and whether the user wants a new short or changes to an existing one. Research factual claims and preserve their sources. Ask for approval at the script/voice stage when the user's instruction or project context requires it; once the user approves and says to proceed, continue without repeatedly asking. Never claim a render, test, research check, or human audition was completed unless it actually was.

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` in this repository (composition `BridgeShort`, 1080x1920, 30 fps).
- Script example: `SCRIPT_example.md`; project scripts and shot plans also live beside their projects (for example `aging/SCRIPT.md` and `aging/SHOTPLAN.md`).
- Voice and audio: follow the selected project's files and scripts; reusable Python audio tools live in `audio/` and `scripts/`.
- Style research: `references/STYLE_BIBLE.md` and `references/reports/`.

The style research is in `references/STYLE_BIBLE.md` and `references/reports/`. The source channel and videos are private study material; they are not included in this checkout.
- Never upload, publish, or send private reference videos or materials.
- Never copy reference scripts, characters, or shots. Story, characters, and voice are always original.
- Never say the source channel's name in a voice-over or description.

User rules that apply:
- No captions or labels in the video.
- English only.
- Voice: one steady tone.
- Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Final export 2K vertical: 1440x2560, `--scale 1.3333`.
- Use an independent verifier when one is actually available; otherwise do a separate QA/reviewer pass and state its limits honestly.
- Save after every step.
- "Just do it" once the script is approved.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice.** Record or generate `voice.wav`, then make word timings in `words.json` with speech recognition that supports word timestamps. The included generator is `scripts/voice.py`; its usage is `python scripts/voice.py <script.txt> <output-dir> [voice=am_michael]` (see its header for Python packages and Kokoro model requirements). It writes `voice.wav`, `v16.wav`, and `words.json` to the output directory. Keep these in the relevant short's folder or the output directory chosen for that project; do not assume a home-directory path. Hand-correct timings and confirm the script and recording match. Everything is timed to `words.json`.
4. **Shot plan** in `story.ts`: copy `src/videos/bridge/` (the working bridge source in this repository) to `src/videos/<name>/`, adapt the story/world/cast, register a new composition in `src/Root.tsx`, and use a unique composition ID. Do not look for `templates/bridge/`; that path is not present in this checkout.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
5. **World.**
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters.**
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (reusable tools are in this repository's `audio/`: `timeline.py`, `sfx_gen.py`, `sfx.py`, `music.py`, `instruments.py`, `dsp.py`, `mix.py`).
   - Build an event table, then synthesize original SFX and an original score ducked under the voice.
   - Keep generated audio with the relevant short (for example `aging/audio/`) or in an explicitly chosen output directory. Expected deliverables may include `mix.wav` (48 kHz, exact picture length), stems, and `cues.md`; confirm the actual project's mixer before choosing filenames.
   - Lock the picture's timing before finalizing sound. If timing changes later, update and rerun the sound workflow.
9. **Look checks.** Create the output directory, then run representative stills, for example `mkdir -p out/<name> && COMP=<Comp> node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`. The script writes JPEGs named with the frame number. For a sandbox, set `BRIDGE_ENTRY` to an entry file that exists. Use `python scripts/sbs_sheet.py out.jpg --ours <ours.jpg> ... --ref <reference.jpg> ...` only when actual reference images are available; this checkout does not include them. Review frames yourself or request an independent review only if that capability is available.
10. **Final render.**
    - `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333` (confirm the target environment accepts the requested scale and output dimensions; see `CLAUDE.md` for known Mac-specific limitations).
    - If the audio is external, mux with `-map 0:v:0 -map 1:a:0` (Remotion may write a silent audio track). If audio is already in the composition, check the output before muxing.
    - QA: `python scripts/short_qa.py out/<name>/video.mp4 out/<name>/qa [shots.json]` checks frame specs, black/white/frozen/pop frames and, when audio exists, loudness/silence; it also creates contact sheets and a report. Fix findings and inspect output visually and aurally. Do not claim a verifier audit unless one was actually performed.
11. **Deliver.** Provide the final MP4 through the available file-delivery mechanism, summarize what was made, and note any incomplete checks or known limitations. Save concise project notes in the project's existing documentation location when appropriate.

## Final look values (bridge after 4 verifier rounds; implemented in `src/videos/bridge/`)
Start every new 3D cartoon-story short from `src/videos/bridge/` (copy to `src/videos/<name>/`): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** Use `references/STYLE_BIBLE.md` and the existing measured reports in `references/reports/` (motion, depth, textures, characters, lighting, outlines, grade). `references/reports/CONTEXT.md` is the shared brief. This checkout does not include the private reference videos, frames, or contact sheets: do not claim to have compared against files that are absent. Record measurable observations, not adjectives, when adding new research.
2. **Isolate parallel work only when the environment actually supports independent agents.** If separate agents are available, assign one owner per area and make them work in separate copies/sandboxes; otherwise do these passes sequentially and do not imply that subagents were started. Bridge ownership: cam: `story.ts`; world: `world.ts`, `lights.ts`, `shade.ts`, `grade.ts`; mat: `paint.ts`, `build.ts`; char: `toon.ts`, `cast.ts`, `cardshade.ts`; post: `ink.ts`, `Bridge.tsx`, `lensblur.ts`. These ownership boundaries were used for prior bridge look passes, not a guarantee that sandbox files or directories already exist. Check paths before running.
3. **Render and integrate cautiously.** `scripts/bridge-stills.mjs` accepts `<output-prefix> <comma-separated-frames> [scale]`; environment variables include `COMP` (default `BridgeShort`), `BRIDGE_ENTRY` (default `src/index.ts`), `REMOTION_TMP`, `CHROME_PATH`, and `GL`. Example for the existing bridge composition: `COMP=BridgeShort node scripts/bridge-stills.mjs out/bridge/s_ 100,400 0.5`. Set a valid `BRIDGE_ENTRY` only after creating the sandbox entry file. `scripts/bridge_merge.py` contains a placeholder project root and expects pre-existing `src/videos/bridge_<owner>/` folders; inspect and configure it for the current checkout before execution. Never run it unchanged or assume backup/merge paths are ready. After integration, run `npx tsc --noEmit` and inspect the diff.
4. **Verify** with the available stills and QA. `scripts/sbs_sheet.py` usage is `python scripts/sbs_sheet.py out.jpg --ours a.jpg b.jpg --ref r1.jpg r2.jpg [--h 640]` (requires real input images). `python scripts/short_qa.py <video.mp4> <output-dir> [shots.json]` creates a report and contact sheets; the optional JSON is an object with `shots` (each `{"id": 1, "a": 0, "b": 130}`) and optional `xfade`, `planned`, or `flash` frame ranges. Review the generated images and report; automated checks do not replace visual/audio review. If an independent verifier is available, request a scored verdict and frame-specific fixes; otherwise perform a separate reviewer pass yourself. Historical bridge scores are notes, not a promise of results.
5. **Keep interfaces coordinated.** Contracts include exported constants such as `NOINK` from `ink.ts`, `dofAt`/`FOREGROUND` from `story.ts`, and `LIGHTS`/`LOOK` from `lights.ts`. If a contract changes, find and update all imports/callers, then typecheck and render representative frames.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- If your environment provides subagents, verify their actual file/tool permissions before assigning writes; otherwise perform the review sequentially. Do not claim subagent work that was not run.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.
