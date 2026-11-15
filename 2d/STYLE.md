# MONO Style (2D) — learned from a 61 s pension-explainer TikTok (1840 f, 30 fps), studied frame by frame
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
Check: `COMP=FxDemo node 2d/stills.mjs out/fx_ 30,55,63,114,124,175,183,215 0.4`

## INTEGRATED DESIGN SKILLS REFERENCES (GitHub Starred Projects)
The following GitHub skill repositories and starred projects (identified as "made with Claude" using design skills) are integrated into the MONO Style instructions for **Argon 4.0 High** prompts:

### 1. GSAP Skills Integration (`greensock/gsap-skills`)
**Source:** Official GreenSock AI skills (~18.5k stars as of 2026-11-15, referenced in `hustle-x/hustle-design-kit`, `Harikrish0406/claude-skills`, `hustinooo28/claudeskillgraphics`, `frankxai/awesome-motion-design-agent-skills`). Skills live under `skills/<name>/SKILL.md` in the upstream repo.
**Skills Included (Exact Content from Repo):**
- **gsap-core**: Core API: `gsap.to()` / `from()` / `fromTo()`, easing, duration, stagger, defaults. (Use for MONO Pop-in overshoot: `power2.inOut`).
- **gsap-timeline**: Timelines: sequencing, position parameter, labels, nesting, playback. (Use for 5-scene sequencing in Učíme se hrou showcase [15.7s] and 5 Videos [60-70s each]).
- **gsap-scrolltrigger**: ScrollTrigger: scroll-linked animations, pinning, scrub, triggers, refresh & cleanup. (Adapt for layout slides/zooms in MONO Rule 1).
- **gsap-plugins**: Plugins: ScrollToPlugin, ScrollSmoother, Flip, Draggable, Inertia, Observer, SplitText, ScrambleText, SVG & physics plugins, CustomEase, EasePack, GSDevTools, etc. (Use SplitText logic for MONO Pill labels).
- **gsap-utils**: gsap.utils: clamp, mapRange, normalize, interpolate, random, snap, toArray, selector, wrap, pipe, and other helpers. (Use for MONO Counter ticks and Progress bar fills).
- **gsap-react**: React: useGSAP hook, refs, `gsap.context()`, cleanup, SSR. (Reference for framework adaptation).
- **gsap-performance**: Performance: transforms over layout props, will-change, batching, ScrollTrigger tips. (Optimization for 1080x1920/30fps SVG/Canvas).
- **gsap-frameworks**: Vue, Svelte, etc.: lifecycle, scoping selectors, cleanup on unmount.

### 2. LottieFiles Motion Design Skill Integration (`LottieFiles/motion-design-skill`)
**Source:** Universal motion design principles for AI agents (~3.1k stars as of 2026-11-15, referenced in `hustle-x/hustle-design-kit`, `Harikrish0406/claude-skills`, `hustinooo28/claudeskillgraphics`, `frankxai/awesome-motion-design-agent-skills`). Files live under `skills/motion-design/` (`SKILL.md`, `director/`, `patterns/`, `reference/`) in the upstream repo.
**Skills Included (Exact Content from Repo):**
- **SKILL.md (Core)**: 8-step checklist, motion personality archetypes, duration/easing tables, property selection guide, common patterns, and quality rules. (Apply to MONO Whip Blur ~5f, Ring Pulse 3 circles).
- **director/core-philosophy.md**: Three Pillars deep dive. (Use for Učíme se hrou/Topics emotion mapping).
- **director/decision-framework.md**: Full decision pipeline.
- **director/disney-principles.md**: 12 principles, UI-adapted. (Apply to MONO Pop-in overshoot, Scale tilts).
- **director/motion-personality.md**: 4 archetypes + brand identity.
- **director/emotion-mapping.md**: Emotion → motion translation. (Joy/Curiosity/Fear/Clarity).
- **director/choreography.md**: Multi-element coordination. (SAFE zone layout: Top 160, Bottom 1540, Left 60, Right 960).
- **director/narrative-structure.md**: Micro-story framework. (Hook/Setting/Escalation/Mystery/Pivot/Payoff).
- **director/context-adaptation.md**: Platform, a11y, performance.
- **patterns/entrance-exit.md**: Entrance/exit recipes. (Whip Blur/Ring Pulse transitions).
- **patterns/state-feedback.md**: Success/error/loading/hover. (Progress bar fills, Pill swaps).
- **patterns/ambient-continuous.md**: Looping, breathing, parallax. (Background Starfield/GridBG).
- **patterns/multi-element.md**: Stagger + choreography recipes. (Multi-icon scenes).
- **reference/timing-easing-tables.md**: Duration + easing lookups. (Match GSAP `power2` defaults).
- **reference/property-selection.md**: Property communication guide.
- **reference/quality-checklist.md**: Evaluation criteria. (Check SAFE zone, Bloom, Stroke).
- **reference/troubleshooting.md**: Animation smells + fixes.

### INTEGRATION RULE FOR ARGON 4.0 HIGH PROMPTS
When generating prompts for **MONO Style** animations (e.g., **Učíme se hrou** showcase [15.7s] or **5 Topics Videos** [60-70s each]):
1. **Reference GSAP Skills** for technical timing/easing logic (`gsap-core` defaults, `gsap-timeline` sequencing, `gsap-utils` clamping).
2. **Reference LottieFiles Motion Design Skill** for creative direction (8-step checklist, Disney principles, Choreography patterns, Timing tables).
3. **Apply MONO Style Rules** (White line art, Black bg, Pill labels, SAFE zone, Whip/Ring/Iris transitions).
4. **Source Topics** from `/home/user/shorts/2d/ideas/SHORTS_IDEAS.md` (for 5 Videos) or `/home/user/shorts/ucimesehrou/README.md` (for Učíme se hrou).
5. **Output** Self-contained HTML/SVG or Canvas script (1080x1920, 30 fps) + Visual Storyboard Artifact.

---
**Integration Note:** This section was added via PR #6 (branch `arena/1cbbc7a5-shorts`, merged into `main` 2026-11-15). Upstream file lists and star counts re-verified against the live repos on 2026-11-15.
References:
- `greensock/gsap-skills` (GitHub, ~18.5k stars as of 2026-11-15, cited in `hustle-x/hustle-design-kit`, `Harikrish0406/claude-skills`, `hustinooo28/claudeskillgraphics`, `frankxai/awesome-motion-design-agent-skills`)
- `LottieFiles/motion-design-skill` (GitHub, ~3.1k stars as of 2026-11-15, cited in same starred projects)
