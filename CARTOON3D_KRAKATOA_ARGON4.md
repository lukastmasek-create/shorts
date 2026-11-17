# Cartoon 3D Story Short — Krakatoa, 1883 (Prompt for Argon 4.0 High)

**Role:** Expert 3D Animator / Director producing a vertical ~60–70 s cartoon story short in this repository's **Cartoon 3D** style (flat bean-head 2D cartoon characters in painted, ink-outlined 3D worlds), rendered with **three.js inside Remotion**. Execute the repo's production pipeline (`SKILL.md`), not a loose approximation of it.

**Task:** Create the cartoon 3D story short described below, starting from the working reference implementation in `src/videos/bridge/`. Content is fixed here; everything outside the filled-in items is as in `CARTOON_3D_PROMPT_ARGON4.md` (the template). If anything is unclear, ask me before starting; otherwise proceed.

**MY CONTENT:**
- **TOPIC:** Krakatoa (Krakatau), Sunda Strait, 27 August 1883 — the loudest explosion in recorded history: an island volcano blew itself apart at 10:02 in the morning, and the sound was heard 4,800 km away.
- **EVERYDAY ANALOGY:** "The whole atmosphere is a bell — Krakatoa struck it, and it rang four times around the world in each direction." (One idea: pressure waves. Keep it at the kid-on-swing-simplicity of the bridge short.)
- **TONE:** Deadpan, matter-of-fact, wry. Every joke is a researched real fact. Humour targets the era's hubris (sightseer boats, journalists, professors with barometers) — never the 36,000 dead.
- **LANGUAGE:** English only. No Czech. No captions or labels burned into the video.
- **VOICE:** One steady male narrator (Kokoro `am_michael`), fast, ~3.7 words/s, almost no pauses.
- **TOTAL LENGTH:** 65 s target; 60–70 s total runtime — the finished short's length, NOT per scene.
- **ENDING (callback twist):** "Forty-four years later, out of the flooded hole it left, a new island rose. They named it Anak Krakatau — the son of Krakatoa. It is still growing." *(Optional Director's-cut coda, include only if comfortable with the gravity: "In 2018, its flank slid into the sea, and the Sunda Strait stood up again — same way its father did it." If in doubt, cut it and end on 'still growing'.)*
- **OUTPUT:** `out/krakatoa/video.mp4` (H.264 CRF 16), 1440x2560 vertical (2K). Project: `src/videos/krakatoa/`, composition `KrakatoaShort` (copy of `src/videos/bridge/`, unique ID in `src/Root.tsx`).

---

**1. STYLE & SOURCE REFERENCE (Cartoon 3D — read first, in this order):**
- `SKILL.md` — the ordered pipeline. Follow it; do not improvise around it.
- `references/STYLE_BIBLE.md` (+ `references/reports/` if present) — measured look targets. This checkout does NOT include the private reference videos/frames: never claim you compared against files you cannot open.
- `CLAUDE.md` — environment setup, render gotchas, repo hygiene.
- `src/videos/bridge/` (+ `aging/` as second example) — the source implementation to copy. **Do not look for `templates/bridge/` — it does not exist.**
- Separate workflows — do NOT mix: 2D MONO (`2d/STYLE.md`), Paper Pop-Up / Low-Poly (`ucimesehrou/`).

**Look targets (measured; implement, don't paraphrase into new values):** day az 75 / el 48 (lit [1.58,1.5,1.33], shade cool-only, sky #3e7fd2 → #b8d0ec, fog = horizon 25→300 m); golden az 6 / el 7 (key → #FFB36B ×1.5, violet shade ≈ #444380, sky #ffc47c → #8a6f8a, sun disc #ffcf9e). Albedos: muted brick/cream/ochre/terracotta, 7 / 8.4 / 9.8 m heights, warm stone, ochre wood; never lemon, never lavender lit faces. Ink #030303 ~5.1→3.3 px, creases ×0.8 from 35°, cards on `NOINK` with plum ink #241726. DOF cInf @1080 — hook/inserts 15–16, close-ups 12–14, mediums 10–12, establishing/wides sharp. Post: ink → lens pre → lens main → bloom (thr 1.0, int .5) → NEUTRAL tone map → grade, MSAA 4, no grain, pixel params × (height/1920). Characters: bean heads h/w ≈ .94, eyes .26 W, adults 3.5 HH, walk bob ≈ 5 %, lean 1–7°, blinks 0.5–2.3 s, contact shadow, golden rim inner-only. Camera: cuts only on big place/time jumps, smootherstep glides 18–40 f, creeping holds (0.15–0.35 %/f, no static hold ≥ 4 f), 4–5° rolls, 7 f flip-kicks on impacts, reactions land 0–3 f before the word.

**2. PRODUCTION PIPELINE (ordered):**
1. **Topic & facts.** Fact pack for this script is at the bottom of this file — use it, cite it in `SCRIPT.md`, do not invent numbers.
2. **Script** (~3.7 words/s → ≈240 words for 65 s). Structure: **Hook** = the absurd fact in sentence 1 ("In 1883, an island exploded so loudly the sound went around the world.") → **Setting**: Sunda Strait, 1883; Krakatoa rumbling since May; *sightseeing steamers crowding in to watch it* (true) → **Action/escalation** over 3–4 beats: pre-dawn explosions (5:30, 6:42, 8:20 a.m.), ships' barometers spiking, eardrums bursting 65 km away, the 10:02 cataclysm → **Snap**: the island splits, caldera opens to the sea → deadpan double line ("Luckily … / Unluckily …" — e.g. "Luckily, the steamboats hadn't quite reached the best seats. / Unluckily, everybody else had.") → **Explanation**: ONE physics idea via the analogy (the atmosphere is a bell; air carries pressure around the planet — stations in 50+ cities kept logging the ring every ~34 hours for days) → **Consequence**: ~36,000 dead, mostly the tsunami; raked coastlines of Java and Sumatra; red-purple sunsets for three years → **Callback**: the son of Krakatoa.
   - Sentences ≈ 13.5 words, contractions, spoken English, no jargon; never describe what the viewer can see.
3. **STOP — approval gate.** Show the script + fact sources. No voice, no build before I approve. After approval ("just do it"), proceed without asking again.
4. **Voice.** `python scripts/voice.py <script.txt> <output-dir> [voice=am_michael]` → `voice.wav`, `words.json` (hand-correct). Everything times to `words.json`.
5–10. **Shot plan → World → Characters → Sound → Stills/QA → Final render** — exactly as in the template (`SHOTS`/`XFADE`/`FLASH_AT`/`CAMS`/`KICKS`/`DOF`/`FOREGROUND`; `COMP=KrakatoaShort node scripts/bridge-stills.mjs out/krakatoa/s_ 100,400 0.5`; `npx tsc --noEmit`; `python scripts/short_qa.py …`; final render `--scale 1.3333`, or the Mac/no-GPU caveats from `CLAUDE.md`; mux `-map 0:v:0 -map 1:a:0` if needed). Disk warning applies — big `REMOTION_TMP`; never delete shared bundle folders.

**Suggested beat map (draft — lock timings at script stage):** 0–3.1 s Hook (the impossible sound) → 3.1–9 s Setting (Sunda Strait, 1883, sightseer steamers) → 9–28 s Escalation (morning explosions, barometers, eardrums) → 28–34 s Snap (10:02, island opens) → 34–44 s Analogy ("the atmosphere is a bell"; 50+ stations; one circuit ≈ 34 h) → 44–56 s Consequence (tsunami, 36,000, red sunsets) → 56–65 s Callback (Anak Krakatau, still growing).

**3. HARD RULES & FAILURE TRAPS:** English only; no captions; one steady voice; jokes are researched real facts; save after every step; ~4 fps at 2K (budget stills first); ink before DOF pass; no static holds; visibility culling on every camera path; Kenney GLBs are absent — build in code; never invent files/assets/renders/checks; report honestly what was and wasn't verified.

**4. MOTION FEEL — OPTIONAL:** three.js/Remotion drives `update(t)` per frame — **no GSAP**. Taste references only (say so if used; measured repo values win): `LottieFiles/motion-design-skill` → `reference/timing-easing-tables.md`, `director/choreography.md` (tableau dispersals, crowd reactions), `director/disney-principles.md` (anticipation/overshoot in the impact beats), `patterns/multi-element.md` (staggered crowd); GSAP skill names for vocabulary only. Do not add GSAP code.

**5. OUTPUT (what "done" means):** `SCRIPT.md` with the fact pack + sources at the top; `voice.wav` + hand-corrected `words.json`; `src/videos/krakatoa/` adapted from `bridge/`; `KrakatoaShort` registered; `audio/` mix (`mix.wav` 48 kHz ≈ picture length, ≈ −14 LUFS, music +3 dB / SFX −6 dB / voice unchanged); checked stills + QA report for the final MP4; project notes updated if anything material. Final message: list what was produced, what was verified, what was NOT checked, known limitations. Never claim a render or verifier you didn't run.

---

### FACT PACK (verified 2026-11-15 — cite in `SCRIPT.md`; if a number is contested, say so, pick the best-sourced version)

- **27 Aug 1883, ~10:02 a.m.:** the final and largest cataclysmic explosion. Four enormous morning explosions (~5:30, 6:42, 8:20, 10:02). Paroxysmal phase began 26 Aug evening.
- **Island ~2/3 destroyed**; caldera opened to the sea; remaining high ground is Rakata. VEI 6 (largest eruption since Tambora 1815). Est. energy ≈ 200 Mt (estimates vary widely, ~100–300 Mt).
- **Sound heard:** Perth (≈3,100–3,400 km), Rodrigues near Mauritius (≈4,800 km); audible over ~1/13 of Earth's surface (Report of the Krakatoa Committee, Royal Society, **London, 1888** — canonical source).
- **Pressure waves:** recorded at 50+ stations; circled the globe ~3–4 times in each direction (up to 7 spikes per station), one circuit ≈ **34 hours**; logged for days (some stations ~5 days).
- **Tsunamis:** locally >30 m (up to ~40 m cited); struck coasts of Java and Sumatra (Anyer/Anjer, Merak destroyed); ~**36,000 dead**, mostly tsunami. Ships 65 km away had eardrums burst by the blast.
- **Sky:** aerosol veil; red/purple sunsets worldwide for ~3 years (1883–86); global cooling ≈ 1.2 °C for several years. (Sunset/“The Scream” link is commonly suggested, still debated.)
- **Aftermath:** 1927–29 **Anak Krakatau** (“son of Krakatoa”) emerged in the caldera; still growing; **22 Dec 2018** its flank collapsed into the sea, tsunami killed **437** in the Sunda Strait.
- **Sources:** Report of the Krakatoa Committee of the Royal Society, *The Eruption of Krakatoa and Subsequent Phenomena* (London, 1888); Simkin & Fiske, *Krakatau 1883: The Volcanic Eruption and Its Effects* (Smithsonian Institution, 1983); Smithsonian Global Volcanism Program; Encyclopaedia Britannica; Aatish Bhatia, “The Sound So Loud” (99% Invisible / Discover).
