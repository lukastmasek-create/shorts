# Showcase prompt for ucimesehrou.org (the only placeholder is `[]`)

Copy everything below the line. Replace `[]` (one place) with the website section to showcase, e.g. a URL path or a section name. This single file replaces the older cinematic prompts.

---

Make a cinematic vertical short (1080x1920, 30 fps, **max 15 s per video**, split into several parts if the section has more to show; each part is its own 15 s video with the same skeleton) that showcases this section of ucimesehrou.org: **[]**.

## Reference style: make it look and move like the "Kód na hraní" video
This is the exact style already shown to and approved by the user (`2d/src/Code.tsx`, comps `KodDil1..4`). New videos must look like the same series.
- **World:** night-blue radial background (`#26224a` centre -> `#12102a` -> `#0a0918` edges) with a dark vignette, two parallax layers of tiny cream dust dots (every fifth dot in a logo colour), faint concentric rings behind each scene.
- **UI objects:** rounded windows (`Win`: radius 26, fill `#1c1936`, 4 px edge `#6a63ad` with a soft blue glow, a hard dark offset shadow under it, three title-bar dots coral/yellow/green, tiny uppercase title at the right); pills (`Tag`: blue "on" and gold CTA with a darker offset underneath like the logo tiles, outline "off"); file chips in token colours; buttons and tiles with the logo's depth offset; a light cream mini web page (`#f6f4ee`) whenever a result of code is shown, so it contrasts with the dark UI.
- **Type:** hero lines in Pangolin with cream-white fill and cyan neon glow (`drop-shadow(0 0 6px #6ee7ff) drop-shadow(0 0 18px #2ab7ff)`), one accent word in yellow; headlines and numbers in Unbounded 800; sentences in Onest 600-800; code in monospace with site token colours; every text is per-letter kinetic (rise with mask, drop, pop, scatter, track) with 2-5 frames stagger and back-easing overshoot.
- **Motion:** every object pops with back-ease and a stagger; success = yellow ring pulse and a check mark that draws with dash-offset; the typed code and the result react together (typing a CSS line changes the preview colour with a pulse); a yellow spark icon hops line to line as the "pointer".
- **Camera:** one continuous world, zigzag scene path, swoops (zoom-out dip, roll about 7 deg, smootherstep) with motion blur only above a speed threshold, slow push-in or pull-out on every hold, tiny handheld drift. A long vertical path scene may be followed by the camera (like the 9-step plan).
- **Logo moment:** blob morphs, becomes the blue tile with the smiley face, flies into the real wordmark, letters and tiles pop around it. Every part opens with it (different source object) and ends with the logo + URL pill.
- **Sound:** original D-minor score, drone -> pulse -> groove -> breather -> riser/snare roll -> D-major climax on the last logo hit; whooshes on swoops, ticks on typing, zaps on UI actions, chime on success, boom on slams.
- **Now add on top of that style (the new wishes below):** more morphs, katana cut, sparks, chat, 3D.

## 0. Ground rules
- Work in this repo's Remotion 2D engine. Read first: `2d/src/Code.tsx` (engine: continuous world + flying camera, `KText` kinetic type, `Morph`, `Win`, `Tag`, `LogoRow`, `createFilm`), `2d/src/logo.ts` (real logo, 20 pieces), `audio/code_mix.py` (music + sfx, scene tables mirror the TSX). Copy their structure; add the new effects below as new components.
- Real content only. Find the section in the site repo (`lukastmasek-create/umime-skola`, `src/app/[locale]/<section>/`, its components and `src/lib/*`) and take real feature names, labels, numbers and sample code from it. Never invent features. Anything illustrative (sample chat lines) is reported as invented at the end.
- Language on screen: Czech. Look = the site: night blue `#12102a` (surface `#1c1936`, edge `#6a63ad`), cream text `#f6f1e4`, logo colours blue `#3248f0`, coral `#ff5a3c`, yellow `#ffc933`, green `#17a864` (each with its darker depth colour as in the logo), fonts Unbounded (labels), Onest (text), Pangolin with cyan neon glow (hero lines), via `@fontsource`. No voice. Music + sfx are original, synthesized.
- Readability beats speed: a headline stays fully visible >= 1.2 s, a sentence >= 1.4 s, <= 7 words per sentence, <= 3 sentences per part. Nothing important starts while the camera moves fast. Text >= 44 px, inside safe area (top 160, bottom 1540, sides 60).

## 0b. Must include (the wishes, all of them, in every part)
1. More morphing: at least five shape morphs per part, and the logo always morphs out of an object (a different object per part).
2. A katana cut with a real slice: the object splits, the halves slide apart and the cut edge crumbles, a corner chip breaks off and falls.
3. Typewriter effects (with caret, jitter, sometimes a typo + backspace) and kinetic typography (per-letter rise / drop / pop / scatter / track).
4. Fast glowing sparks with motion blur trails; sparks are born from a word (letters become sparks) and that is the transition into the next part of the animation, where they fly into a chat window and every spark becomes a sentence.
5. Seamless camera: one continuous cinematic motion sequence, smooth shape transitions, 3D elements (CSS 3D layers + extruded objects), no hard cuts.
6. Concrete code for all of it (snippets below), max 15 s per video, several videos if the section needs it.

## 0c. How the Kód na hraní showcase was made (follow the same pipeline)
1. **Read the real site code first.** Attach `lukastmasek-create/umime-skola` read-only (`add_repo`, then `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/lukastmasek-create/umime-skola /home/user/lukastmasek-create/umime-skola`). Open the section page `src/app/[locale]/<section>/page.tsx`, its components (hero showcase, workspace, curriculum, exercises, assistant) and data in `src/lib/*`. Write down real feature names, button labels, counts (count them with a small node script, do not guess) and real sample code lines. Those become the scenes; anything else is reported as invented.
2. **Brand from the repo, not from memory.** Colours: `src/app/globals.css` (dark theme variables), token colours in components (HTML `#ff7a5c`, CSS `#5ab8ff`, JS `#ffd24d`, strings `#7ee0b0`, keywords `#ff9bd2`). Fonts: `src/app/[locale]/layout.tsx` (Unbounded, Pangolin, Onest). Logo: `public/brand/logo-tmave.svg` + `ikona.svg`.
3. **Logo as pieces.** A small python script splits the logo SVG into its 20 top-level elements and computes each centre (rect centre, or bbox of path end points) and writes `2d/src/logo.ts`. `LogoRow` pops the pieces with staggered back-easing and a small spin around their own centre. Piece 0 (blue tile with the face) is replaced by the hero blob: blob morphs, fills blue, face draws on (dash-offset smile + popping eyes), then flies and shrinks into the tile's slot while the other pieces pop in around it.
4. **Fonts that really load.** `npm i @fontsource/unbounded @fontsource/onest @fontsource/pangolin`, import the weight CSS files, and block rendering with a `FontGate` (`delayRender` + `document.fonts.load(font, "Kód na hraní ČÍŘŠŽ čšřžýáíéěúů")` so the latin-ext Czech subset is loaded). Measure glyph advances with a canvas `measureText` (same Chromium renders and measures) so per-letter kinetic type is exact; give every text a `maxW` that auto-shrinks the size so nothing leaves the frame.
5. **Engine.** `createFilm(scenes, audio)`: authored virtual timeline `S` (frames per scene), played slower by a per-scene factor `K` (text-heavy scenes 1.4-1.5) to get real frames `R`; `warp(frame)` maps real to virtual. Scenes sit along a zigzag path `POS(i)`; camera = `hold(i, f)` (slow push-in/out + handheld drift) and a swoop between scenes (zoom-out dip, roll, smootherstep, motion blur only above a speed threshold). The camera arrives at scene-local `t = 22`, so important text starts after that. Scenes are mounted only while the camera can see them. Total length is derived, never typed.
6. **Stills before renders.** `COMP=<Id> GL=swangle CHROME_PATH=/opt/pw-browsers/chromium REMOTION_TMP=/tmp/remotion-tmp node 2d/stills.mjs out/c_ 30,80,125,170 0.3`, then `ffmpeg -i a.jpg -i b.jpg ... -filter_complex hstack=inputs=N sheet.jpg` and look at the sheet. Check the end of the logo morph, a mid-swoop frame, the cut frame +0/+6/+20, spark flight, every bubble, the last frame. Typical fixes found this way: text wider than the frame (`maxW`), overlaps between a headline and a card, content starting while the camera still moves.
7. **Music with the same tables.** `pip install scipy`; reuse `audio/dsp.py` + `audio/instruments.py`. The python script repeats the scene table (type, length, K) of the TSX, computes the same real frames, and places events by scene-local time (`virtual frame = S_i - 12 + t`). Bar length is chosen so the final logo hit lands on a downbeat; print per-scene loudness to confirm the arc rises. Output `public/<name>/partN.wav` with the exact video length; `<Audio src={staticFile(...)}/>` is inside the composition.
8. **Render as a tracked background job** (a paused container kills `nohup` jobs, a tracked one is restarted by hand if it dies). `npx remotion render 2d/src/index.ts <CompId> out/<name>.mp4 --codec h264 --crf 18 --audio-codec aac --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=2`, about 2.3 s per frame on 2 cores. Verify with `ffprobe` (size, duration, audio stream) before saying it is done, then send the file with `SendUserFile`.
9. **Repo hygiene.** Commit sources, `logo.ts`, the wav files and the audio script; never mp4; working copies in `<name>/audio/` are gitignored; push the session branch.
10. **Feedback loop used last time.** First cut was too fast to read, so every scene got a slow factor and long scenes were split into separate parts; Czech on-screen text was requested explicitly (it overrides the old "English only" note in CLAUDE.md); the site's colours, fonts and the real logo replaced the generic white line art.

## 1. Scene library and random order
Build every video from a **library of scenes**; never reuse a fixed running order. Each scene is a component `C(t)` plus metadata, and the order, the picks, the transitions and the objects are chosen **at random per video** (seeded, so one video is reproducible).

**Library** (scenes marked * already exist in `2d/src/Code.tsx`; write the others in the same style and same `createFilm` scene format). A scene may only be picked when the section really has the matching feature (`needs`), otherwise it is skipped.

| id | what happens | needs (real feature in the section) | len / K | audio intensity |
|---|---|---|---|---|
| `logoMorph`* | object -> blob -> logo tile (face) -> real logo, pieces pop | always | 100-165 / 1.25-1.3 | 0.35-0.45 |
| `cards3`* | one card splits into 3-4 cards (files, modes, levels, tabs) that fan out, chips pop | a list of 3-4 things | 105 / 1.3 | 0.65 |
| `explainer`* | code or UI with a spark hopping line to line, explanation card with kinetic title per step | step-by-step explanations | 165 / 1.4 | 0.75 |
| `livePreview`* | typed input on top, result below reacts with a pulse (colour, number, layout) | live result / preview | 110 / 1.3 | 0.85 |
| `suggest`* | typed prefix, popup list, selection moves, key cap, completion burst | autocomplete / search / suggestions | 100 / 1.3 | 0.85 |
| `exercise`* | counter counts up, fill-in blank gets answered, check mark draws, hint/solution pills | tasks / exercises / quizzes | 105 / 1.35 | 0.9 |
| `chatAI`* | user bubble, assistant bubble grows from a dot, typed answer | AI helper / chat / support | 105 / 1.35 | 0.5 |
| `pathPlan`* | camera flies down a curved path of numbered nodes whose shapes gain a side per step | steps / curriculum / roadmap | 135 / 1.5 | 0.95 |
| `finale`* | big claim slam, window morph, motto, logo + URL | always (once, last) or `outro`* | 90-150 / 1.3 | 0.9-1.0 |
| `katanaCut` | the title card or an object is sliced, halves part, corner chip falls, debris | always (at least once per part) | 60-90 / 1.3 | 0.85 |
| `sparkChat` | word -> sparks (motion blur) -> chat, every spark becomes a typed sentence | always (follows `katanaCut` or a word scene) | 130-170 / 1.35 | 0.8 |
| `terminalType` | big typewriter terminal / command line that types real commands or labels, lines morph into icons | any code or text feature | 90 / 1.3 | 0.7 |
| `statCounter` | huge number counts up (Unbounded), ring fills, unit label, small bars grow | a real number (count of exercises, lessons, users, levels) | 80 / 1.3 | 0.8 |
| `splitCompare` | screen splits with a slash line, before/after or with/without, slider sweeps | a real before/after | 100 / 1.3 | 0.85 |
| `deck3D` | cards on a CSS 3D carousel rotate in perspective, front card highlighted | several features of the same kind | 110 / 1.35 | 0.85 |
| `deviceZoom` | phone/laptop frame with the real UI drawn inside, camera dollies through the screen into the next scene | responsive / mobile / app | 100 / 1.3 | 0.8 |
| `progressBadge` | progress bar fills, badge/level morphs polygon -> star, streak bolt, confetti sparks | points, levels, rewards | 90 / 1.3 | 0.9 |
| `checklist` | rows tick one by one with draw-on check marks, row morphs into the next feature icon | a feature list | 90 / 1.3 | 0.75 |
| `keyboardRain` | key caps fall and land into a word, word morphs into a window | typing, writing, editing | 80 / 1.3 | 0.8 |
| `mapZoom` | camera pulls out from one object to reveal many (constellation of windows), then dives into one | many items/pages | 100 / 1.35 | 0.85 |

**Random selection rules (apply in this order)**
1. Seed: one integer per video (`Date.now() % 2**31` at authoring time, written to `scenes.json` and into the commit message; the same seed rebuilds the same video; never random per frame, never `Math.random()` inside a component).
2. Pick N scenes so the total stays <= 15 s real time (`sum(len*K)/30 <= 15`; typically 5-7 scenes). Always: first = `logoMorph` (random source object), last = `finale` or `outro`. Always once: `katanaCut` and `sparkChat` (`sparkChat` directly after `katanaCut`, so the sparks come out of the cut word). The rest is a random draw without repeats from the scenes whose `needs` the section satisfies, weighted toward features that are most important in the real section.
3. Shuffle the middle with the seed, then fix violations: no two scenes of the same family next to each other (`exercise`/`chatAI` family, `explainer`/`terminalType` family, etc.), `statCounter` never first after the intro.
4. Randomize the details the same way: the intro object, scene positions on the path (zigzag direction, spacing), camera swoop roll sign, hold push-in or pull-out, transition type between scenes (swoop, whip, dolly-through, spark-chase, slash-wipe; never the same twice in a row), accent colour order of the four logo colours, which word becomes the sparks, katana angle and which corner chips off, chat sentence slots.
5. Keep the pieces that must stay stable: palette, fonts, logo, readability rules (headline >= 1.2 s, sentence >= 1.4 s, text >= 44 px), safe area.
6. Audio follows the picked list: the music script reads `scenes.json` (ids, len, K, intensity, event tables per scene id), so the arc (quiet -> pulse -> groove -> breather -> riser -> climax on the last logo hit) is rebuilt for any order; put the breather (lowest intensity scene) in the middle and the highest-intensity scene last-but-one.
7. Report at the end: the seed, the picked order, which scenes were skipped because the section lacks the feature.

```ts
// deterministic seeded random for scene picking (Remotion must render every frame identically)
const mulberry32 = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
type SceneDef = { id: string; needs: string[]; len: number; k: number; fam: string; C: (t: number, r: () => number) => React.ReactNode };
export const pickScenes = (lib: SceneDef[], have: Set<string>, seed: number, budgetS = 15): SceneDef[] => {
  const r = mulberry32(seed), ok = lib.filter(s => s.needs.every(n => have.has(n)) && !["logoMorph", "finale", "katanaCut", "sparkChat"].includes(s.id));
  const sh = [...ok].sort(() => r() - 0.5), by = (id: string) => lib.find(s => s.id === id)!;
  const head = [by("logoMorph")], tail = [by("finale")], fixed = [by("katanaCut"), by("sparkChat")];
  const secs = (a: SceneDef[]) => a.reduce((x, s) => x + (s.len * s.k) / 30, 0);
  const mid: SceneDef[] = [];
  for (const s of sh) { if (secs([...head, ...fixed, ...mid, s, ...tail]) > budgetS) continue; if (mid.length && mid[mid.length - 1].fam === s.fam) continue; mid.push(s); }
  const at = Math.floor(r() * (mid.length + 1));                       // katana + sparks somewhere in the middle, always as a pair
  return [...head, ...mid.slice(0, at), ...fixed, ...mid.slice(at), ...tail];
};
// every random detail inside a scene comes from the same seed: const rr = mulberry32(seed + sceneIndex * 101);
```
Write the picked list to `2d/<name>/scenes.json` (`{ seed, order: [{id, len, k, intensity}] }`) and have both the composition and the audio script read it, so picture and music can never disagree.

## 2. Camera and 3D (seamless, no cuts)
- One continuous world, scenes placed along a path; camera = position + zoom + roll with smootherstep swoops, tiny handheld drift, motion blur only while moving fast. Transitions are camera moves, match cuts or "dolly through" (zoom into a letter/hole until it fills the frame, next scene is behind it). Never hard cut.
- Real 3D feel without a 3D engine (CPU render, ~2.3 s/frame): wrap the SVG layers in CSS 3D and tilt the whole plane a few degrees with the camera, so layers get parallax:
```tsx
// layers at different z; camera tilt rx/ry/rz in degrees comes from the camera function
<div style={{ perspective: 1600, width: W, height: H, overflow: "hidden" }}>
  <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
    <svg style={{ position: "absolute", transform: "translateZ(-300px) scale(1.3)" }}>{/* dust, rings */}</svg>
    <svg style={{ position: "absolute", transform: "translateZ(0)" }}>{/* scenes */}</svg>
    <svg style={{ position: "absolute", transform: "translateZ(220px)" }}>{/* sparks, foreground */}</svg>
  </div>
</div>
```
- Extruded objects (cubes, tiles, buttons) with a cheap depth stack, light from top-left:
```tsx
const Extrude: React.FC<{ depth?: number; dark: string; children: (fill?: string) => React.ReactNode }> = ({ depth = 16, dark, children }) => (
  <g>{Array.from({ length: depth }, (_, i) => depth - i).map(d => <g key={d} transform={`translate(${d * 0.55} ${d})`}>{children(dark)}</g>)}{children()}</g>
);
```
  Use real three/R3F (already installed) only for one hero object and only if the render time is acceptable.

## 3. Effects to build (copy these shapes, then tune)
**Morph (object -> logo)** reuse `Morph` from `Code.tsx` (all shapes resampled to 140 points, `lerp` per point, eased, with trail copies). Add object outlines as point arrays (`samp([...vertices])`) for keycap/bubble/play/gear, fill colour fades from transparent to `#3248f0`, add the darker depth shape under it, then hand over to `LogoRow` piece 0 when it reaches its slot.

**Typewriter** per character with jitter, caret and an optional typo + backspace:
```tsx
const TypeLine: React.FC<{ text: string; x: number; y: number; t: number; a: number; cps?: number; typo?: [number, string] }> = ({ text, x, y, t, a, cps = 0.9, typo }) => {
  let n = Math.floor(Math.max(0, t - a) * cps + 0.0), s = text.slice(0, n);
  if (typo && n > typo[0]) { const k = n - typo[0]; s = k < 3 ? text.slice(0, typo[0]) + typo[1].slice(0, k) : text.slice(0, typo[0]) + (k < 6 ? typo[1].slice(0, 6 - k) : "") + text.slice(typo[0], typo[0] + Math.max(0, k - 6)); }
  return <text x={x} y={y} fontFamily={MONO} fontSize={44} fill={C.cream}>{s}{Math.floor(t / 7) % 2 === 0 && <tspan fill={C.yellow}>▌</tspan>}</text>;
};
```
**Katana cut** two half-planes of the cut line clip the same object; slash flash first, then halves slide apart, a corner chip is masked out of one half and falls with gravity, spin and one small bounce, debris crumbles from the cut edge:
```tsx
const BIG = 4000;
const half = (A: Pt, B: Pt, side: 1 | -1) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), nx = -dy / l * side, ny = dx / l * side, ux = dx / l, uy = dy / l;
  return [[A[0] - ux * BIG, A[1] - uy * BIG], [B[0] + ux * BIG, B[1] + uy * BIG], [B[0] + ux * BIG + nx * BIG, B[1] + uy * BIG + ny * BIG], [A[0] - ux * BIG + nx * BIG, A[1] - uy * BIG + ny * BIG]].map(p => p.join(",")).join(" "); };
const G = 2.4, fall = (t0: number, t: number) => 0.5 * G * Math.max(0, t - t0) ** 2;       // px/frame^2
const Katana: React.FC<{ t: number; tc: number; A: Pt; B: Pt; chip: Pt[]; id: string; children: React.ReactNode }> = ({ t, tc, A, B, chip, id, children }) => {
  const s = Math.max(0, t - tc), p = easeOut(prog(t, tc, tc + 26)), n: Pt = [-(B[1] - A[1]), B[0] - A[0]], l = Math.hypot(n[0], n[1]);
  const nx = n[0] / l, ny = n[1] / l, shake = s < 10 ? Math.sin(s * 3.1) * (10 - s) * 0.8 : 0;
  const slash = prog(t, tc - 4, tc), mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  return <g transform={`translate(${shake} ${-shake * 0.6})`}>
    <clipPath id={id + "a"}><polygon points={half(A, B, 1)} /></clipPath><clipPath id={id + "b"}><polygon points={half(A, B, -1)} /></clipPath>
    <mask id={id + "m"}><rect x={-BIG} y={-BIG} width={2 * BIG} height={2 * BIG} fill="#fff" /><polygon points={chip.map(q => q.join(",")).join(" ")} fill="#000" /></mask>
    <g clipPath={`url(#${id}a)`} transform={`translate(${nx * 34 * p} ${ny * 34 * p}) rotate(${-2.5 * p} ${mid[0]} ${mid[1]})`}>{children}</g>
    <g clipPath={`url(#${id}b)`}><g mask={`url(#${id}m)`} transform={`translate(${-nx * 34 * p} ${-ny * 34 * p + fall(tc + 6, t) * 0.25}) rotate(${3 * p} ${mid[0]} ${mid[1]})`}>{children}</g></g>
    <clipPath id={id + "c"}><polygon points={chip.map(q => q.join(",")).join(" ")} /></clipPath>
    <g opacity={s > 0 ? 1 : 0}><g transform={`translate(${-nx * 34 * p + s * 3} ${-ny * 34 * p + Math.min(fall(tc + 2, t), 520)}) rotate(${s * 7} ${chip[0][0]} ${chip[0][1]})`}><g clipPath={`url(#${id}c)`}>{children}</g></g></g>
    {Array.from({ length: 16 }, (_, i) => { const u = i / 15, px = lerp(A[0], B[0], u), py = lerp(A[1], B[1], u), vx = (rnd(i) - 0.5) * 6, vy = -rnd(i + 5) * 3; return s > 0 && <rect key={i} x={px + vx * s} y={py + vy * s + fall(tc, t) * 0.6} width={7} height={7} rx={2} fill={C.cream} opacity={clamp(1 - s / 40)} transform={`rotate(${s * (rnd(i + 9) - 0.5) * 30} ${px + vx * s} ${py})`} />; })}
    <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], easeOut(slash))} y2={lerp(A[1], B[1], easeOut(slash))} stroke="#fff" strokeWidth={6 * (1 - clamp(s / 8))} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px #6ee7ff) drop-shadow(0 0 28px #2ab7ff)" }} opacity={slash > 0 && s < 10 ? 1 : 0} />
  </g>;
};
```
(`chip` = a triangle at one corner of the object, on side B of the cut. Add a white flash frame at `tc`.)

**Sparks with motion blur** deterministic particles on quadratic Béziers, drawn as a tapered trail of N samples behind the head (that trail IS the motion blur); spawn them from letter positions of a word, fade the letter as its spark leaves:
```tsx
type Spark = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; a: number; dur: number; w: number };
const bez = (s: Spark, u: number): Pt => { const m = 1 - u; return [m * m * s.x0 + 2 * m * u * s.cx + u * u * s.x1, m * m * s.y0 + 2 * m * u * s.cy + u * u * s.y1]; };
const Sparks: React.FC<{ t: number; list: Spark[] }> = ({ t, list }) => (
  <g style={{ filter: "drop-shadow(0 0 6px #ffc933) drop-shadow(0 0 18px #ff9b3c)" }}>
    {list.map((s, i) => { const u = easeIO(clamp((t - s.a) / s.dur)); if (u <= 0 || u >= 1) return null; const N = 9, tail = 0.05 + 0.22 * Math.sin(Math.PI * u);   // longer trail at speed
      const pts = Array.from({ length: N }, (_, j) => bez(s, clamp(u - (j / N) * tail)));
      return <g key={i}>{pts.slice(1).map((q, j) => <line key={j} x1={pts[j][0]} y1={pts[j][1]} x2={q[0]} y2={q[1]} stroke={j < 3 ? "#fff6cf" : "#ffc933"} strokeWidth={s.w * (1 - j / N)} strokeLinecap="round" opacity={1 - j / N} />)}<circle cx={pts[0][0]} cy={pts[0][1]} r={s.w * 0.8} fill="#fff" /></g>; })}
  </g>
);
// letters -> sparks: one spark per glyph, start = glyph centre, control point = random big arc, end = chat slot i
const sparksFromWord = (xs: Pt[], slots: Pt[], a: number): Spark[] => xs.map((p, i) => ({ x0: p[0], y0: p[1], cx: p[0] + (rnd(i) - 0.3) * 700, cy: p[1] - 300 - rnd(i + 3) * 500, x1: slots[i % slots.length][0], y1: slots[i % slots.length][1], a: a + i * 1.5, dur: 34 + rnd(i + 7) * 14, w: 5 + rnd(i + 1) * 5 }));
```
Add a speed-line/streak layer behind the sparks, and let the camera chase the sparks (camera target = centroid of the sparks in flight) so the transition is one move.

**Spark -> chat bubble -> sentence**: when spark i arrives (`t >= s.a + s.dur`) draw a ring burst at its end point, morph a circle (r 12) into a squircle bubble (`Morph` with `sx`,`sy` growing, fill `#1c1936`, stroke `#6a63ad`; user bubbles blue `#3248f0`), then `TypeLine` the sentence inside. Bubbles stack downward in the chat window (`Win` with title "chat"), earlier ones shift up by one slot with an eased translate.

**More morphs** (use at least five per part): object -> logo tile, word box -> chat window, spark cluster -> star -> logo, circle dot -> bubble, play triangle -> circle -> check mark, window -> card -> window. Always equal point counts, eased, with echo trails, colour cross-fade.

## 4. Audio (original, `audio/<name>_mix.py`, copy `audio/code_mix.py`)
D minor, ~100 bpm, bar grid chosen so the final logo hit is on a downbeat. Quiet drone while the logo forms, pulse enters at the title, **katana hit = metallic ring (resonant partials + noise burst) + sub boom at the exact cut frame, short silence of the music for 3 frames then it returns louder**, spark fizz = high-passed noise sweeps panned with the sparks, riser into the chat, one soft pluck note per bubble, typewriter ticks, chat pops, final D major chord + shimmer. Output `public/<name>/partN.wav` (exactly the video length), loudness -15 LUFS, peak < -1 dBFS.

## 5. Build and check
- Files: `2d/src/<Name>.tsx` with `createFilm(...)` per part, register `KodX`-style compositions in `Root.tsx`, `npx tsc --noEmit` clean.
- Check stills at: end of logo morph, mid title, the cut frame (+0, +6, +20), mid spark flight, each bubble, last frame; fix overlaps and cut-off text. Check that no text starts during a fast camera move.
- Render per part: `npx remotion render 2d/src/index.ts <CompId> out/<name>-dilN.mp4 --codec h264 --crf 18 --audio-codec aac --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=2` (run as a tracked background job, ~2.3 s/frame).
- Commit sources + wavs, never mp4. Deliver each mp4 directly; report length, what was invented, and that the mix was measured but not auditioned.
