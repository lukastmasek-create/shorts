# 2D MONO Short — Sonnet 5.5 Lead + subagent team (menu edition)

Paste into **Claude Sonnet 5.5** (agentic, with a Task/subagent tool), repo open at root. Produces **one** 2D MONO line-art short: 1080x1920, 30 fps, 60–70 s (target ~65 s, 1,800–2,100 f), English, Kokoro voice. User picks the topic from a menu built from the repo.

Scope: `2d/` only. Do not mix in 3D (`src/`, `SKILL.md`), `ucimesehrou/`, or the low-poly variant.
Sibling docs (read, don't duplicate): `2d/STYLE.md` (style law), `2d/README.md`, `2d/ideas/SHORTS_IDEAS.md` (100 topics), `2d/insecure/` (gold-standard example), `2d/AI_PRODUCTION_PROMPT.md` (Opus version, full subagent briefs).

## How to work (Sonnet rules — follow literally)

1. **Verify, never assume.** Statuses in this file can be stale. Check repo state with commands before every decision.
2. **Keep your own context small.** You are the Lead. Subagents write deliverables to files and report a short envelope (files · commands+results · blockers · not checked). Do not paste whole files into chat; read only what you need.
3. **Do the checklist, in order.** Don't skip a wave, don't merge waves, don't invent extra approval pauses. If the user said "proceed", proceed.
4. **One owner per file.** Only the Coder writes `2d/src/<Name>.tsx`. Only you edit `2d/src/Root.tsx` (one import + one `<Composition>`). Reviewer and QA edit nothing. Never run two agents that write the same file.
5. **Never fake.** No invented sources, timings, assets, renders or completed steps. Missing model/tool → stop that step, say exactly what is missing.
6. **Reply terse, in the user's language.** Status lines short; findings in files, not chat.
7. **Subagent models:** Analyst, Writer, Coder → `sonnet`. QA Runner → `haiku`. Reviewer → `opus` if the account allows, else `sonnet`. Launch independent subagents **in one message**. If a subagent dies (rate/usage limit), retry once; if it fails again, do that role yourself as a separate pass and say so. No Task tool → run roles sequentially and state it. Claim concurrency only if it happened.

## Step 1 — menu (always first)

1. List `2d/` folders and composition IDs in `2d/src/Root.tsx`. A topic is **produced** if a folder with `script.txt` exists or a `*Short` composition is registered. Folder with `script.txt` but no composition = **in progress**: don't overwrite; report.
2. Read `2d/ideas/SHORTS_IDEAS.md`. Build the menu **from that file** (don't retype from memory): all 100 titles with their one-line hooks, grouped by the 7 categories, `[x]` produced / `[ ]` free. Map folders to numbers by title (e.g. `nohumans/` ≈ #51, `parallel/` ≈ #76, `millennium/` ≈ #77, `diamond/` = #4, `wormhole/` = #8). Unnumbered originals (`nosleep`, `universe`, `dim4`, `glitch`, `sun`, `chance`, `immortal`, `MonoShort`, `CalmShort`, `DegreeShort`) are not menu items.
3. Flag free topics that overlap a produced short (e.g. #43 vs `nohumans`, #75 vs `immortal`).
4. Ask one question: **"Which number? Or `auto` for lowest free."** Wait. Picked `[x]` → say so, offer nearest free. `auto` = lowest `[ ]`.

## Step 2 — brief (after the pick)

Topic #n + title · audience: short-form viewers (TikTok/Shorts) · English narration + on-screen text · 1080x1920 · 60–70 s · MONO style per `2d/STYLE.md` · voice `python 2d/voice_short.py <name> [voice]` (default `am_michael`; models in `2d/voice/` or `KOKORO_DIR`) · deliverables: `2d/<name>/` (SOURCES.md, script.txt, DESCRIPTION.md, frames.json, cues.json, words.json if whisper), `public/<name>/voice.wav`, `2d/src/<Name>.tsx`, unique registration, stills checked, `out/<name>.mp4` if feasible. Choose `<name>` (lowercase folder) and `<Name>` (comp prefix) to match existing naming. Ask concisely only if a material field is missing.

## Step 3 — waves

**Wave 0 (you, solo):** `git status` (don't clobber user work; stay on current branch); confirm topic free; `mkdir 2d/<name>`; env check: `node_modules` present (`npm ci` if not), `npx tsc --noEmit` baseline, `ls 2d/voice/`, `2d/stills.mjs` exists, Chromium path (`/opt/pw-browsers/chromium`). If env was verified earlier this session, skip QA in Wave 1. State topic, files, constraints before any code.

**Wave 1 (parallel):**
- *Analyst* → `2d/<name>/SOURCES.md`: table Claim | Source | Note, URLs, today's date; 6–10 story-usable facts ranked; "do not claim" list (contested/unverified; label secondary sources). Format ref: `2d/insecure/SOURCES.md`. No code, no script.
- *Art Director* → per-scene plan: backdrop (`Starfield`/`GridBG`/`BigRings`/`Rays`/`GhostBleed`), hero icon/number/pill, transition pair, `Cam` move, SAFE layout, kit parts to reuse, icons to hand-draw. Read `2d/STYLE.md`, `kit.tsx`, `kit2.tsx`, `fx.tsx`, one finished short first. No code.
- *QA Runner* (only if env unverified) → exact commands + outputs for the Wave 0 checks.

**Wave 2 (one Innovator subagent):** reads fact sheet; pitches 3 distinct concepts (different framing devices), MONO-safe (white line art, no faces), ~65 s; recommends one. You pick and record why (or the user, if gated).

**Wave 3 (Writer):** `script.txt` — one line = one scene, 8–14 scenes, short conversational English sentences, every factual line traceable to `SOURCES.md`, original wording (never copy other shorts or the private reference TikToks). Kokoro ≈ 800–900 chars/min; `voice_short.py` enforces ≥130 f/scene. Plus `DESCRIPTION.md` (TikTok + Shorts copy, hashtags, sources; format `2d/insecure/DESCRIPTION.md`).

**Wave 4 (you, solo):** `python 2d/voice_short.py <name> [voice]` → `voice.wav`, `frames.json`, `cues.json`, (`words.json` if faster-whisper available, else note skipped), copy to `public/<name>/voice.wav`. Models missing → stop and report. Total must be 1,800–2,100 f; over → tell Writer to shorten, re-run. Commit only if the user asked.

**Wave 5 (parallel):**
- *Animation Director* → beat plan from `frames.json` + `cues.json`: per scene frame range, what changes over time, hero moments on cue onsets, counters/bars/rings tied to spoken phrases, `Cam` on scenes >4 s, transitions alternating (never the same 3× in a row), end on `iris` or `fade`. Deterministic only (frame-driven, no `Math.random`, no accumulated state).
- *Art Director pass 2* → final pill texts, number captions, icon draw order, `spread()` full-height layout, SAFE zone, backdrop opacity 0.08–0.2.
Merge both into one plan file for the Coder.

**Wave 6 (Coder, single owner):** implement `2d/src/<Name>.tsx` — pure SVG + Remotion; read `Insecure.tsx`, `Above.tsx`, `Delete.tsx` first and pattern-match.
- `<SceneFx a b inT outT d>` (default d=9) with plan's pairs; never the old `Scene`; `<Cam>` on >4 s scenes; `<Flash>` only on hard beats.
- Reuse `kit.tsx`/`kit2.tsx`/`fx.tsx`; don't edit them.
- Unique SVG filter/clip/gradient IDs per mounted instance (overlap bug in transitions).
- Audio: `staticFile('<name>/voice.wav')`.
- **Timing: export `FRAMES` derived from `frames.json`; scene starts/ends AND cue-driven moments must come from `frames.json`/`cues.json` constants, imported or in one clearly marked table at top of file — no timing numbers scattered inline.** (Past run hardcoded cue frames; re-generating the voice desynced everything.) Add a comment: "regenerate this table from cues.json after any voice re-run".
- Every arrow/line/label endpoint must stay inside SAFE **at the max Cam zoom**, not just at zoom 1.
- No placeholders/TODO/pseudocode. `npx tsc --noEmit` clean.
Then you register `<Name>Short` in `Root.tsx` (same pattern as existing entries, unique ID, `durationInFrames` = total from `frames.json` incl. tail).

**Wave 7 (parallel):**
- *Reviewer* (read-only) → defect list blocker/major/polish, each with frame/time + concrete fix: facts vs SOURCES, wording originality, MONO consistency, SAFE + phone legibility, transition alternation + iris/fade ending, SVG ID uniqueness, determinism, FRAMES/cues actually used, runtime in range, tsc, stills `COMP=<Name>Short node 2d/stills.mjs out/<name>_ 100,880 0.5` at first/middle/last scenes. Must list what it did NOT check.
- *QA Runner* → typecheck, stills at checkpoints, determinism check (same frame rendered twice identical). **Do not start the full render yet** (burns CPU on code about to change).

**Wave 8 (you):** triage. Coder fixes all blockers + majors (+ cheap polish). Re-run tsc + affected stills; look at the stills yourself (contact sheet). Then run the full render:
`npx remotion render 2d/src/index.ts <Name>Short out/<name>.mp4 --codec h264 --crf 16 --gl=swangle --browser-executable=/opt/pw-browsers/chromium` (CPU-only box: ~7–20 min; use `--concurrency=2` on 2 cores). Run in background, report progress honestly. After exit 0, verify with `ffprobe` (size, frame count, duration, audio stream). Send/deliver `out/<name>.mp4` if the user asks.

## Known quirks (don't "fix" these)

- **2–3 black frames at every cut** is existing `fx.tsx` behaviour for all shorts (pass-through black). Not a bug of the new short. Don't edit shared `fx.tsx`; mention it in the handoff and offer an overlap fix as a separate task.
- Sync rests on speech pauses (`cues.json`) when whisper/Hugging Face is unavailable; word-exact timing is not guaranteed. Say so; ask the user to listen to the numeric-counter moments.
- Kokoro weights are not in git; if blocked from the usual downloads see `CLAUDE.md` (npm shard workaround).
- Renders (`*.mp4`) and working voice wavs in `2d/<name>/` are gitignored; the committed voice is `public/<name>/voice.wav`.
- Facts traps: single-study psychology → label as single study; correlation ≠ causation; simulation/speculative physics → attribute as argument/hypothesis; any on-screen number traces to `SOURCES.md` or is marked "illustration". Drop scenes the sources don't support rather than keep them.

## MONO non-negotiables (full: `2d/STYLE.md`)

Black bg + faint grey vignette (~#1c1c1c); white/grey only; **no colour, no faces**; ~5 px strokes + bloom (6 px tight + 22 px wide); person = head circle + rounded torso (solid = present, outline = past), dim ghosts for "everyone else"; dashed 8/8 ground line; uppercase pill labels (white fill/black text = primary, outline = secondary); big bold numbers + small grey spaced caption; crossed-out = white X; 3-circle ring pulse on the resolution beat; one idea per 3–5 s; pop-in with small overshoot; eased counters; staggered bars; whip/slide transitions with ~5 f blur.
**Rule 1** whole canvas, `spread()` for y, hero icons 2–3×, text inside SAFE (top 160 / bottom 1540 / left 60 / right 960). **Rule 2** every scene starts with an edge-to-edge backdrop (opacity 0.08–0.2), drawn first. **Rule 3** `SceneFx` pairs: `zoomIn`/`zoomOut`, `whipL|R|U|D`, `iris` (reveals/ending), `spin` (chaos), `fade` (calm), `cut` (loud word); alternate; end on `iris` or `fade`.

## Subagent brief template (give every subagent all of this)

> You are the **<Role>** on a 2D MONO line-art short "<title>" (idea #<n>). Repo root = cwd. Read: `<files>`. You may write only: `<paths>`. You must not touch: `<everything else>`. Deliverable: `<exact files/format>`. If a fact, asset or tool is missing, say so — never invent it. Finish with a short report: files touched · commands run + results · blockers · what you did not check.

Worked role examples: `2d/AI_PRODUCTION_PROMPT.md` §4.

## Definition of done & handoff

Done = topic verified free · `SOURCES.md` covers every claim · original script, 1,800–2,100 f · tsc clean · comp registered uniquely · MONO rules, unique SVG IDs, determinism checked · stills inspected by you · defects triaged (blockers/majors fixed, polish disclosed) · MP4 rendered **and ffprobe-verified**, or exact command + missing piece stated · timing table regenerable from `frames.json`/`cues.json`.

Handoff (terse): topic + concept · deliverable paths · commands run with exit codes · how many subagents ran concurrently (true number) · review stats and what was fixed · **not checked** (voice not listened to, video not watched in full, whisper skipped, etc.) · remaining polish · next step. Never say "complete" for a script, storyboard, or unrendered source.
