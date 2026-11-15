# MONO Style Showcase Prompt for Argon 4.0 High (Učíme se hrou)

**Role:** Expert 2D Motion Graphics Director using the **MONO Style** (White Line Art / Black Background) and referencing **Official GSAP Skills** (`greensock/gsap-skills`) and **LottieFiles Motion Design Principles** (`LottieFiles/motion-design-skill`).
**Task:** Create a showcase animation (15.7s total) demonstrating **Učíme se hrou** (ucimesehrou.org) for students (1st–9th grade), entrance exams (příjímačky), and graduation (maturita).

**1. STYLE & REFERENCE (MONO + GitHub Skills):**
- **Style Name:** MONO (2D White Line Art) from `/home/user/shorts/2d/STYLE.md`.
  - Pure black bg (`#000000`) + faint grey vignette (`#1c1c1c`).
  - White stroke (~5px @1080) or solid white fill, soft white bloom (6px + 22px glow).
  - Icons: Chest, trophy, document, globe, heart, flag, battery, padlock, scales, finish pole (adapted for subjects/games/progress).
  - Labels: Tiny uppercase pills, wide letter-spacing, heavy sans (White-filled/Black text).
  - Numbers: Big bold numbers (e.g., "56" points) with small grey spaced caption ("BODY").
  - "Crossed out": White X draws over icons/pills.
- **GSAP Skills Integration (`greensock/gsap-skills`):**
  - **Timeline Sequencing:** Use `gsap-timeline` logic for the 5 scenes (0.0s-3.1s, 3.1s-6.2s, 6.2s-9.3s, 9.3s-12.4s, 12.4s-15.7s).
  - **Core API:** `gsap.to()` / `from()` for pop-ins (small overshoot), progress bar fills, and scale tilts.
  - **Easing:** Use `power2.inOut` or `power2` (from `gsap-core` quick reference) for the **MONO** motion rules (Pop-in, Whip Blur, Ring Pulse).
  - **Plugins:** Reference `gsap-plugins` (SplitText for pill labels, though SVG-based here, the logic applies to timing).
- **LottieFiles Motion Design Skill (`LottieFiles/motion-design-skill`):**
  - **8-Step Checklist & Disney Principles:** Apply "Emotion → Motion Translation" (Director/emotion-mapping.md) for the **Učíme se hrou** narrative (Joy of learning, Progress visibility).
  - **Timing/Easing Tables:** Use `reference/timing-easing-tables.md` for the **Whip Blur** (~5 frames) and **Ring Pulse** (3 expanding circles) durations.
  - **Choreography:** `patterns/multi-element.md` for sequencing the 5 scenes within the **SAFE** zone (Top 160, Bottom 1540, Left 60, Right 960).
  - **Philosophy:** "Philosophy-first, implementation-agnostic" (Director/core-philosophy.md) — ensure the animation communicates "Emotion → Motion" (e.g., "Joy" for Games, "Clarity" for Progress).

**2. MY CONTENT (Showcase Narrative - 15.7s):**
- **TOPIC:** Show how "Učíme se hrou" helps students learn via games, escape rooms, and daily quizzes.
- **TONE:** Educational, playful, professional, Czech language on-screen text (inside pills).
- **LANGUAGE:** Czech (e.g., "VYBER PŘEDMĚT", "SBÍREJ BODY", "UČENÍ JE HRA", "POKROK VIDĚT", "OBJEVUJ SVĚT").
- **TOTAL LENGTH:** 15.7 seconds (match the reference `DURATION` from the Pop-Up style: ~3-5s per scene).
- **ENDING:** 2.5s end screen with motto "OBJEVUJ SVĚT, KDE UČENÍ BAVÍ." and four SVG icons (ZŠ, SŠ, přijímačky, maturita) inside white pills.

**3. STORYBOARD (Beat-by-Beat - 5 Scenes) & SKILL APPLICATION:**
- **Scene 1 (0.0s - 3.1s):** [Subject Choice] White line art shelf icon pops in. Pills: "VYBER PŘEDMĚT".
  - **GSAP:** `gsap-timeline` sequence: Shelf icon `from()` (scale 0->1, overshoot) -> Pills `to()` (slide-in).
  - **LottieFiles:** **Entrance/Exit Recipe** (patterns/entrance-exit.md) + **Emotion Mapping** (Director/emotion-mapping.md: "Curiosity").
  - **Transition:** Whip-Right (`whipR` + fade ~5f).
- **Scene 2 (3.1s - 6.2s):** [Answer & Points] Stage icon (white line). Big bold number "56" with caption "BODY". Pills: "ODPOVÍDEJ, SBÍREJ".
  - **GSAP:** `gsap-utils` (clamp/mapRange) for progress bar fill. `gsap-timeline` for number tick (ease).
  - **LottieFiles:** **State Feedback** (patterns/state-feedback.md: Success/Error) + **Timing/Easing Tables** (reference/timing-easing-tables.md) for the tick speed.
  - **Transition:** Whip-Left (`whipL`).
- **Scene 3 (6.2s - 9.3s):** [Games & Revision] Arcade grid icon + Escape room door icon. Pills: "UČENÍ JE HRA". Ghost people trail.
  - **GSAP:** `gsap-plugins` (SplitText logic for pill swaps) + `gsap-core` (stagger for grid icons).
  - **LottieFiles:** **Multi-Element Choreography** (patterns/multi-element.md) + **Disney Principles** (Squash/Stretch for pop-in overshoot).
  - **Transition:** Zoom-In (`zoomIn` scale 1->3.2 blur).
- **Scene 4 (9.3s - 12.4s):** [Progress Visibility] Class scene (Parent/Student/Teacher circles). Pull tab chart icon slides out. Pills: "POKROK VIDĚT".
  - **GSAP:** `gsap-scrolltrigger` logic (adapted for layout slide/zoom) + `gsap-utils` (normalize progress).
  - **LottieFiles:** **State Feedback** (Progress bar fill) + **Choreography** (Parent/Student/Teacher circles movement).
  - **Transition:** Whip-Down (`whipDown`).
- **Scene 5 (12.4s - 15.7s):** [Motto] World globe icon (white line). Four pills: "ZŠ", "SŠ", "PŘIJÍMAČKY", "MATURITA". Motto pill: "OBJEVUJ SVĚT, KDE UČENÍ BAVÍ."
  - **GSAP:** `gsap-timeline` final sequence (Iris wipe end).
  - **LottieFiles:** **Quality Checklist** (reference/quality-checklist.md) + **Iris Wipe** (Rule 3: `iris` circle wipe).
  - **Transition:** Iris (end).

**4. TECHNICAL IMPLEMENTATION (2D SVG/Canvas Logic + Skill References):**
- **Canvas:** 1080x1920, 30 fps.
- **Kit Integration:** Use `SceneFx` wrappers (ZoomIn, ZoomOut, WhipL/R/U/D, Iris, Spin, Fade) from `2d/STYLE.md`.
- **Skill Logic:**
  - **GSAP:** Reference `gsap-core` for `duration: 0.5, ease: "power2"` defaults in the code logic (even if pure SVG/Canvas, the *timing* logic follows GSAP skill reference).
  - **LottieFiles:** Apply **Disney Principles** (12 principles adapted for UI) to the "Pop-in with small overshoot" and "Ring pulses".
- **Sound:** Synthesized Web Audio (matching `ucimesehrou/src/sound.js` schedule) synced to GSAP/LottieFiles timing tables.
- **Build:** Self-contained HTML/SVG or Canvas script. No Three.js. Pure white line art on black.
- **Constraints:** No external models/textures. Build everything in code. Ensure "Crossed out" X draws on completed items.

**5. OUTPUT:**
- **Deliverable:** One self-contained HTML file (2D MONO style).
- **Artifact:** Visual storyboard grid (5 panels) showing white line art icons, pill labels, transition types (Whip/Ring/Iris), and **GSAP/LottieFiles timing references** before full build.
- **Instruction:** Ensure the layout slides/zooms fill the 1080x1920 canvas and text stays in the SAFE zone (Rule 1-3 from `2d/STYLE.md`).

***

**Note for Argon 4.0 High:**
This prompt integrates the **GitHub Search Results** (`greensock/gsap-skills` and `LottieFiles/motion-design-skill`) directly into the **MONO Style Showcase** (2D White Line Art) for **Učíme se hrou**, while adhering to the **Repository Instructions** (`2d/STYLE.md` + `ucimesehrou/README.md`).

---
**Integration Note:** This file is added to `ucimesehrou/MONO_PROMPT_ARGON4.md` in branch `arena/f7636ae2-shorts`.
