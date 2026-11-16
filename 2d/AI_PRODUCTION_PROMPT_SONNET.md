# 2D MONO Short — Sonnet 5.5, single agent (menu edition)

Paste into **Claude Sonnet 5.5** with this repo open at root. **One agent does everything itself, in order. No subagents, no Task/Agent tool.** Produces **one** 2D MONO line-art short: 1080x1920, 30 fps, 60–70 s (target ~65 s, 1,800–2,100 f), English, Kokoro voice. User picks the topic from a menu built from the repo.

Scope: `2d/` only. Do not mix in 3D (`src/`, `SKILL.md`), `ucimesehrou/`, or the low-poly variant.
Read, don't duplicate: `2d/STYLE.md` (style law), `2d/README.md`, `2d/ideas/SHORTS_IDEAS.md` (100 topics), `2d/insecure/` (gold-standard example).

## Rules

1. **Verify, never assume.** Statuses in this file can be stale. Check repo state with commands before each decision.
2. **Work the steps in order.** Finish and check a step before the next. No invented approval pauses; if the user said "proceed", proceed.
3. **Separate the passes.** Each step below is a "hat" (research, art plan, write, animate, code, review). Write each hat's output to its file before putting on the next one. Review pass: judge the code as a stranger would, not as its author.
4. **Never fake.** No invented sources, timings, assets, renders or completed steps. Missing model/tool → stop that step, say exactly what is missing.
5. **Keep context small.** Read only what you need; don't paste whole files into chat.
6. **Reply terse, in the user's language.** Findings go in files, not chat.
7. Never say "complete" for a script, storyboard or unrendered source.

## Step 1 — menu (always first)

1. List `2d/` folders and composition IDs in `2d/src/Root.tsx`. **Produced** = folder with `script.txt` exists or a `*Short` composition is registered. Folder with `script.txt` but no composition = **in progress**: don't overwrite; report.
2. Read `2d/ideas/SHORTS_IDEAS.md`. Build the menu **from that file** (not from memory): all titles + one-line hooks, grouped by the 7 categories, `[x]` produced / `[ ]` free. Map folders to numbers by title (e.g. `nohumans/` ≈ #51, `parallel/` ≈ #76, `millennium/` ≈ #77, `diamond/` = #4, `wormhole/` = #8). Unnumbered originals (`nosleep`, `universe`, `dim4`, `glitch`, `sun`, `chance`, `immortal`, `MonoShort`, `CalmShort`, `DegreeShort`) are not menu items.
3. Flag free topics overlapping a produced short (e.g. #43 vs `nohumans`, #75 vs `immortal`).
4. Ask one question: **"Which number? Or `auto` for lowest free."** Wait. Picked `[x]` → say so, offer nearest free. `auto` = lowest `[ ]`.

## Step 2 — setup

`git status` (don't clobber user work; stay on current branch). Choose `<name>` (lowercase folder) and `<Name>` (comp prefix) matching existing naming. `mkdir 2d/<name>`. Check: `node_modules` (`npm ci` if absent), `npx tsc --noEmit` baseline, `ls 2d/voice/` (Kokoro models), `2d/stills.mjs` exists, Chromium at `/opt/pw-browsers/chromium`. State topic, files and constraints in one short message before coding.

## Step 3 — research → `2d/<name>/SOURCES.md`

Search reliable public sources. Table: Claim | Source | Note, with URLs and today's date. Rank 6–10 story-usable facts. Add a "do not claim" list (contested/unverified; label secondary sources). Format ref: `2d/insecure/SOURCES.md`.

## Step 4 — concept

Read `2d/STYLE.md`, `kit.tsx`, `kit2.tsx`, `fx.tsx`, one finished short (`Insecure.tsx`/`Above.tsx`). Pitch 3 distinct framing devices in a few lines each (MONO-safe: white line art, no faces, ~65 s). Pick one, record why in `2d/<name>/CONCEPT.md`. Drop any idea the sources don't support.

## Step 5 — script → `script.txt`, `DESCRIPTION.md`

One line = one scene, 8–14 scenes, short conversational English, original wording (never copy other shorts or the private reference TikToks). Every factual line traceable to `SOURCES.md`. Kokoro ≈ 800–900 chars/min; `voice_short.py` enforces ≥130 f/scene. Also `DESCRIPTION.md` (TikTok + Shorts copy, hashtags, sources; format `2d/insecure/DESCRIPTION.md`).

## Step 6 — voice

`python 2d/voice_short.py <name> [voice]` → `voice.wav`, `frames.json`, `cues.json`, (`words.json` if faster-whisper available, else note skipped), copy to `public/<name>/voice.wav`. Models missing → stop and report (see `CLAUDE.md` for the npm shard workaround). Total must be 1,800–2,100 f; over → shorten script, re-run. Never hand-estimate timings.

## Step 7 — plan → `2d/<name>/PLAN.md`

Per scene: frame range (from `frames.json`), what the audience sees, what changes over time, hero moments on `cues.json` onsets, backdrop (`Starfield`/`GridBG`/`BigRings`/`Rays`/`GhostBleed`), hero icon/number/pill text, number captions, icon draw order, `Cam` move (scenes >4 s), transition in/out (alternate; never the same 3× in a row; end on `iris` or `fade`), `spread()` layout inside SAFE, icons to hand-draw. Deterministic only: frame-driven, no `Math.random`, no accumulated state.

## Step 8 — code → `2d/src/<Name>.tsx`

Pure SVG + Remotion; pattern-match `Insecure.tsx`, `Above.tsx`, `Delete.tsx`.
- `<SceneFx a b inT outT d>` (default d=9) with the plan's pairs; never the old `Scene`; `<Cam>` on >4 s scenes; `<Flash>` only on hard beats.
- Reuse `kit.tsx`/`kit2.tsx`/`fx.tsx`; do not edit them.
- Unique SVG filter/clip/gradient IDs per mounted instance (overlap bug in transitions).
- Audio: `staticFile('<name>/voice.wav')`.
- **Timing: export `FRAMES` derived from `frames.json`; scene bounds AND cue-driven moments come from one clearly marked table at top of file — no timing numbers scattered inline.** Comment: "regenerate from cues.json after any voice re-run". (Past run hardcoded cue frames; a voice re-run desynced everything.)
- Every arrow/line/label endpoint stays inside SAFE **at max Cam zoom**, not just zoom 1.
- No placeholders/TODO/pseudocode. `npx tsc --noEmit` clean.
Then register `<Name>Short` in `2d/src/Root.tsx` (one import + one `<Composition>`, same pattern as existing entries, unique ID, `durationInFrames` = total from `frames.json` incl. tail).

## Step 9 — review pass (as a stranger)

Check and write defects as blocker/major/polish with frame/time + fix in `2d/<name>/REVIEW.md`: facts vs SOURCES · wording originality · MONO consistency · SAFE + phone legibility · transition alternation + iris/fade ending · SVG ID uniqueness · determinism (same frame rendered twice is identical) · FRAMES/cues actually used · runtime in range · tsc · stills `COMP=<Name>Short node 2d/stills.mjs out/<name>_ 100,880 0.5` at first/middle/last scenes — look at them. List what you did NOT check. Fix all blockers + majors (+ cheap polish), re-run tsc + affected stills.

## Step 10 — render

Only after fixes: `npx remotion render 2d/src/index.ts <Name>Short out/<name>.mp4 --codec h264 --crf 16 --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=2` (CPU box: ~7–20 min; run in background, report progress honestly). After exit 0, verify with `ffprobe` (size, frame count, duration, audio stream). Deliver `out/<name>.mp4` if asked. Commit/push only if the user asks.

## Known quirks (don't "fix")

- **2–3 black frames at every cut** = existing `fx.tsx` behaviour for all shorts. Don't edit shared `fx.tsx`; mention in handoff and offer an overlap fix as separate task.
- Without whisper, sync rests on speech pauses (`cues.json`); not word-exact. Say so; ask the user to listen to counter moments.
- Renders (`*.mp4`) and working voice wavs in `2d/<name>/` are gitignored; committed voice = `public/<name>/voice.wav`.
- Fact traps: single-study psychology → label as single study; correlation ≠ causation; speculative physics/simulation → attribute as hypothesis/argument; every on-screen number traces to `SOURCES.md` or is marked "illustration".

## MONO non-negotiables (full: `2d/STYLE.md`)

Black bg + faint grey vignette (~#1c1c1c); white/grey only; **no colour, no faces**; ~5 px strokes + bloom (6 px tight + 22 px wide); person = head circle + rounded torso (solid = present, outline = past), dim ghosts for "everyone else"; dashed 8/8 ground line; uppercase pill labels (white fill/black text = primary, outline = secondary); big bold numbers + small grey spaced caption; crossed-out = white X; 3-circle ring pulse on the resolution beat; one idea per 3–5 s; pop-in with small overshoot; eased counters; staggered bars; whip/slide transitions with ~5 f blur.
**Rule 1** whole canvas, `spread()` for y, hero icons 2–3×, text inside SAFE (top 160 / bottom 1540 / left 60 / right 960). **Rule 2** every scene starts with an edge-to-edge backdrop (opacity 0.08–0.2), drawn first. **Rule 3** `SceneFx` pairs: `zoomIn`/`zoomOut`, `whipL|R|U|D`, `iris` (reveals/ending), `spin` (chaos), `fade` (calm), `cut` (loud word); alternate; end on `iris` or `fade`.

## Definition of done & handoff

Done = topic verified free · `SOURCES.md` covers every claim · original script, 1,800–2,100 f · tsc clean · comp registered uniquely · MONO rules, unique SVG IDs, determinism checked · stills inspected · defects triaged · MP4 rendered **and ffprobe-verified**, or exact command + missing piece stated · timing table regenerable from `frames.json`/`cues.json`.

Handoff (terse): topic + concept · deliverable paths · commands run with exit codes · defects found/fixed · **not checked** (voice not listened to, video not watched in full, whisper skipped, etc.) · remaining polish · next step.
