# Cartoon 3D Story Short — Prompt for Argon 4.0 High (Reusable Template)

**Role:** Expert 3D Animator / Director producing a vertical ~60–70 s cartoon story short in this repository's **Cartoon 3D** style (flat bean-head 2D cartoon characters in painted, ink-outlined 3D worlds), rendered with **three.js inside Remotion**. Execute the repo's production pipeline (`SKILL.md`), not a loose approximation of it.

**Task:** Create a new cartoon 3D story short about the topic below, starting from the working reference implementation in `src/videos/bridge/`. This is a reusable template: copy it, replace only the `[BRACKET]` items, and run it. Everything outside brackets is fixed unless I say otherwise. If anything is unclear, ask me before starting; otherwise proceed.

**MY CONTENT (fill in the brackets):**
- **TOPIC:** [ONE surprising TRUE story with a physical cause and effect, e.g. "1831 Broughton iron bridge collapse — 74 soldiers marching in step knocked it down". It must be visual and checkable.]
- **EVERYDAY ANALOGY:** [ONE everyday analogy that explains the mechanism, e.g. "a kid pumping a swing at the right moment".]
- **TONE:** [e.g. deadpan, matter-of-fact, wry — jokes are researched real facts, never invented.]
- **LANGUAGE:** English only. No Czech. No captions or labels burned into the video.
- **VOICE:** One steady male narrator (Kokoro default `am_michael`), fast, ~3.7 words/s, almost no pauses.
- **TOTAL LENGTH:** [65 s target; 60–70 s total runtime — this is the finished short's length, NOT per scene.]
- **ENDING:** [Callback twist — a short ironic line that lands the story; end on the last word.]
- **OUTPUT:** [e.g. `out/<name>/video.mp4`, H.264 CRF 16, final 1440x2560 vertical (2K).]

---

**1. STYLE & SOURCE REFERENCE (Cartoon 3D — read first, in this order):**
- `SKILL.md` — the ordered production pipeline this prompt follows. Follow it; do not improvise around it.
- `references/STYLE_BIBLE.md` (+ `references/reports/` if present) — measured look targets. This checkout does NOT include the private reference videos/frames: never claim you compared against files you cannot open.
- `CLAUDE.md` — environment setup, render gotchas (cloud container and old-Mac notes), repo hygiene.
- `src/videos/bridge/` — the working source implementation to **copy** (→ `src/videos/<name>/`): `story.ts`, `world.ts`, `lights.ts`, `shade.ts`, `build.ts`, `paint.ts`, `toon.ts`, `cast.ts`, `cardshade.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`, `Bridge.tsx` → rename/adapt. Composition: unique ID registered in `src/Root.tsx`. **Do not look for `templates/bridge/` — it does not exist in this checkout.** Full second example: `aging/` (`AgingShort`).
- Separate workflows — do NOT mix: 2D MONO (`2d/STYLE.md`), Paper Pop-Up / Low-Poly (`ucimesehrou/`). This prompt is the 3D cartoon-story workflow only.

**Look targets to hold (measured; implement, don't paraphrase into new values):**
- **Light presets** (`lights.ts`, sun camera-relative, frozen per shot): day az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36] with cool tint ONLY in shade, sky top #3e7fd2 → horizon #b8d0ec, fog = horizon 25→300 m. Golden: az 6 / el 7 (low backlit sun), key → #FFB36B ×1.5, violet-blue shade (facade ≈ #444380, never brown), sky #ffc47c → #8a6f8a.
- **Albedos:** muted brick / cream / ochre / terracotta houses, heights 7 / 8.4 / 9.8 m, warm grey/beige stone, ochre wood deck; never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, ~5.1 px near → 3.3 px far @1080x1920, creases ×0.8 from 35°, fog tint 0.3 only far; character cards on the `NOINK` layer (they carry their own plum ink #241726).
- **Lens** (`lensblur.ts` + `dofAt` in `story.ts`): cInf px @1080 — hook/inserts 15–16, close-ups 12–14, medium shots 10–12, park 7; wides/aerials sharp. Focus on the eyes. Ink is its OWN pass BEFORE the blur.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (threshold 1.0, int .5) → NEUTRAL tone map → grade; MSAA 4. No film grain. Scale every pixel parameter by (output height / 1920).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w ≈ .94, eyes .26 W apart, plum ink, adults ≈ 3.5 head-heights, stick limbs, walk bob ≈ 5 %, lean 1–7°, blinks every 0.5–2.3 s, tight contact shadow, golden rim inner-only.
- **Camera** (`story.ts`): hard cuts only on big place/time jumps; smootherstep glides 18–40 f; every hold pushes in ~0.15–0.35 %/f; no static hold ≥ 4 f; rolls 4–5° on drama; impact flip-kicks decaying over 7 f. Every visual reaction lands 0–3 frames BEFORE its word.

**2. PRODUCTION PIPELINE (ordered — this is the job):**
1. **Topic & facts.** Pick/confirm one true story with a physical cause → effect. Write the facts **with their sources at the top of `SCRIPT.md`** (URLs or citations). If a fact is shaky or disputed, say so in the script notes and pick the best-sourced version.
2. **Script** (~3.7 words/s → ≈240 words for 65 s). Beat formula: **Hook** = the absurd fact as sentence 1, no setup (~10–16 words) → **Setting** (year, place, pride; 1–2 lines, present tense) → **Action/escalation** over 3–4 beats, each bigger; others laugh/doubt/mock → **Snap** (the moment it breaks) → deadpan double line ("Luckily ... / Unluckily ...") → **Explanation**: one physics idea through the everyday analogy → **Consequence**: the rule it created → **Callback twist** ending. Sentences ≈ 13.5 words, spoken English, contractions, no jargon. Never describe what the viewer already sees.
3. **STOP — approval gate.** Show me the script + fact sources. Do not record voice or build anything before I approve. After I approve and say to proceed (or "just do it"), continue **without asking again**.
4. **Voice.** Generate `voice.wav`: `python scripts/voice.py <script.txt> <output-dir> [voice=am_michael]` (writes `voice.wav`, `v16.wav`, `words.json`; Kokoro stills: see `CLAUDE.md` for the npm/pip paths when GitHub releases or Hugging Face are unreachable; Kokoro model weights are NOT in this repo). Hand-correct `words.json`; confirm recording matches script. Everything downstream times to `words.json`.
5. **Shot plan (`story.ts`).** `SHOTS` (id, a/b frames, light day/golden, crowd mode, `tau`), `XFADE` (crossfades at place/time changes), `FLASH_AT` (white flash after hook), `CAMS` (`{f, dur?, cut?, s: f => {pos, look, fov, roll}}`), `KICKS`, `DOF`/`dofAt`, `FOREGROUND` (near props in ~1/3 of shots).
6. **World.** `lights.ts` (LIGHTS + LOOK presets), `shade.ts` (two-tone + `untone()`), `build.ts` (town/props recoloured to the palette, sight-line culling), `paint.ts` (HD Canvas2D painted textures, seams as dark tints), `world.ts` (sky shader, fog = horizon, river, per-frame posing). Kenney `.glb` kit props are NOT in this repo — the code falls back without them; build everything else in code.
7. **Characters.** `toon.ts` (Pen API, 600x1000 canvas, soles at y=975), `cast.ts` (billboards, crowds, blinks, walk cycles — all billboards on `NOINK`), `cardshade.ts` (cards lit by scene light — no emissive).
8. **Sound** (tools in `audio/`: `timeline.py`, `sfx_gen.py`, `sfx.py`, `music.py`, `instruments.py`, `dsp.py`, `mix.py`). Event table → synthesized original SFX + original score, ducked under voice. Standard mix: **music +3 dB, SFX −6 dB, voice unchanged**; loudness ≈ −14 LUFS; exact picture length (expect `mix.wav` 48 kHz). Update SFX/music cues if frame numbers change.
9. **Stills & QA.** `mkdir -p out/<name> && COMP=<Comp> node scripts/bridge-stills.mjs out/<name>/s_ 100,400 0.5` (env: `COMP`, `BRIDGE_ENTRY`, `REMOTION_TMP`, `CHROME_PATH`, `GL=swangle` on CPU boxes). Run `npx tsc --noEmit` after integrating. `python scripts/short_qa.py out/<name>/video.mp4 out/<name>/qa [shots.json]` for specs/black/white/frozen/pop + loudness/silence. Fix findings. Report honestly what was and wasn't checked.
10. **Final render.** `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333` (≈10 min on GPU; on no-GPU boxes set `--props='{"post":{"kick":true}}'` with `GL=swangle`, or on the user's old Mac use `--gl=swangle` with `{"post":{"kick":true}}`, even integer scale 1 or 1.5 — `--scale 1.3333` is invalid there — and `--sequence --image-format=jpeg` + `ffmpeg-static`). Mux if needed: `-map 0:v:0 -map 1:a:0`. MP4s are gitignored — deliver `out/<name>/video.mp4` directly.

**3. HARD RULES & FAILURE TRAPS:**
- English only; no captions; one steady voice; jokes are real researched facts; save after every step.
- **Disk**: Remotion copies `public/` (~1.3 GB) into the temp bundle on EVERY render — always use a big `REMOTION_TMP`/`TEMP`; never delete shared bundle folders without asking me.
- Keep post params scaled by height/1920; ink is its own pass before DOF; camera reactions land 0–3 f before words; no static holds; flip-kicks flip sign each frame; golden rim inner-only; foreground props recognisable or gone.
- Kenney materials are teal — recolour by material name. Characters go on `NOINK`. Sight-line cull anything blocking a camera.
- Never invent files, paths, assets, renders, or checks. If a tool/prereq isn't available, say so and do the closest honest equivalent.
- 2K renders are slow (~4 fps, ≈10 min); stills are the cheap way to check. Budget accordingly; do stills before any full render.

**4. MOTION FEEL — OPTIONAL SKILL REFERENCES (do not force new software):**
This pipeline animates by driving `update(t)` per frame in three.js/Remotion — **no GSAP timelines**. For animation *feel* you may consult, as taste references only:
- `LottieFiles/motion-design-skill` → `reference/timing-easing-tables.md` and `director/choreography.md` (ease-out camera bursts, crowd timing), `director/disney-principles.md` (squash/stretch and anticipation in the pop-ins and impact beats), `patterns/multi-element.md` (staggering crowd reactions). If you do, say you did; never claim their rules override the measured values in `SKILL.md`/`STYLE_BIBLE.md`.
- `greensock/gsap-skills` — reference ONLY for vocabulary (e.g. `power2`/`smootherstep` easing names, `gsap.utils.mapRange` thinking for counters/progress if needed). Do not add GSAP code to this pipeline.

**5. OUTPUT (what "done" means):**
- `SCRIPT.md` with facts + sources at the top; `voice.wav` + hand-corrected `words.json`; `src/videos/<name>/` adapted from `bridge/`; composition registered in `src/Root.tsx`; `audio/` mix (`mix.wav` 48 kHz ≈ picture length, ≈ −14 LUFS); a handful of checked stills + QA report for the final MP4; concise project notes saved in the right place (e.g. `CLAUDE.md` "Status" section) if anything material changed.
- In your final message: list exactly what was produced, what was verified (stills? typecheck? QA pass? human audition?), what was NOT checked, and known limitations. Never claim a render or verifier you didn't run.

**Housekeeping:** working branch `arena/5a0e5252-shorts` (PR open); commit only the intended files; `*.mp4` stays out of git; keep the 2D and Pop-Up/Low-Poly workflows untouched.
