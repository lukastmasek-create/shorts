# Showcase prompt for ucimesehrou.org (the only placeholder is `[]`)

Copy everything below the line. Replace `[]` (one place) with the website section to showcase (a URL path or a section name).

---

Make a cinematic vertical showcase of this section of ucimesehrou.org: **[]**. Format 1080x1920, 30 fps, **max 15 s per video**; if the section has more to show, make several videos (each max 15 s, same recipe). Everything below is already built and tested in the repos named in section 1, so **import and wire, do not rewrite**.

## 1. Repos to read (exact)
1. **Site = the source of truth for content and brand:** `lukastmasek-create/umime-skola` (public). Read:
   - the section page `src/app/[locale]/<section>/page.tsx` and every component it imports (`src/components/*`), the data behind it (`src/lib/*`)
   - brand: `src/app/globals.css` (dark theme variables), `public/brand/logo-tmave.svg` + `ikona.svg`, fonts in `src/app/[locale]/layout.tsx` (Unbounded, Pangolin, Onest)
   - take real labels, counts (count them with a node script, never guess), real sample code/text. Anything invented (sample chat lines) is reported as invented at the end.
2. **Tools = the finished engine and effect kit:** `lukastmasek-create/shorts`, branch `claude/eloquent-mendel-zow67i`. Read first:
   - `2d/src/Code.tsx` (engine `createFilm`, `KText`, `Morph`, `Tag`, `Win`, `Code`, `LogoRow`, `IntroScene`, `OutroScene`, `SceneFiles`, `SceneFinale`, palette `C`, fonts `FAM`) — everything is exported at the bottom of the file
   - `2d/src/fx2.tsx` (tested effects: `PixelMorph`, `Squash`, `PageRead`, `DollyZoom`, `Sparks`, `sparkCam`, `Katana`, `Cursor`, `Ripple`, `TypeLine`, `FilmDefs`/`FilmGrain`, `loopP`; demo comp `Fx2Demo`)
   - `2d/src/depth.tsx` (`Card3D`, `NeonRunner`, `depthStyle`; demo comp `DepthDemo`), `2d/src/logo.ts` (real logo in 20 pieces)
   - `audio/sfx_real.py` (realistic sound effects), `audio/showcase_sfx.py` (builds the sound track from `scenes.json`), `audio/dsp.py`
3. Access: attach both with `add_repo` (read), then `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/lukastmasek-create/umime-skola /home/user/lukastmasek-create/umime-skola`; work inside the `shorts` checkout on the branch above. `npm i` once.

## 2. Rules that never change
- On-screen language Czech. Look = the site: night blue `#12102a` (surface `#1c1936`, edge `#6a63ad`), cream `#f6f1e4`, logo colours blue `#3248f0` / coral `#ff5a3c` / yellow `#ffc933` / green `#17a864`; fonts Unbounded (labels, numbers), Onest (text), Pangolin with cyan neon glow (hero lines). Already wired in `Code.tsx`.
- Readability: headline fully visible >= 1.2 s, sentence >= 1.4 s, <= 7 words per sentence, text >= 44 px, inside the safe area (top 160, bottom 1540, sides 60). Nothing important starts while the camera moves fast (camera arrives at scene-local `t = 22`).
- No voice. **No music at all, only realistic sound effects** (section 6).
- One continuous world, flying camera, no hard cuts. Scenes are `Sc` objects (`{ C, len, k, cam?, fy? }`, about 2-4 s each) passed to `createFilm(scenes, "<name>/sfx.wav", { film: true, loop: true })`. Total <= 15 s: `sum(len * k) / 30 <= 15`.

## 3. Look: reference style and depth
The reference is the existing "Kód na hraní" series (`KodDil1..4` in `Code.tsx`): night-blue world with parallax dust and faint rings, shaded windows (3 coloured title-bar dots), pills with a darker underlay, hero lines in Pangolin + cyan neon, yellow accent word, per-letter kinetic type, back-eased pops, cream mini web page for results, yellow ring pulse + drawn check mark on success, the real logo built from a morphing blob. **Add depth and shading everywhere (use `2d/src/depth.tsx`):**
- Every object gets a depth value `z` (0 far, 1 front). `depthStyle(z)` gives line thickness 1.6 -> 9 px, glow 2 -> 26 px, glow strength, opacity, extrusion thickness, shadow size, and a small blur for the far layer: **the nearest object is the thickest and glows most, the farthest is thin, dim and slightly out of focus.**
- `Card3D` = contact shadow + extruded sides + gradient face lit from the top-left + specular + bevel + `NeonRunner` (a neon light with a bright head and fading tail that runs along the card edge; colour, phase and speed differ per card; glow scaled by `z`). Use it for windows, cards, chips and bubbles. Hover/active = runner faster, card lifts (`lift` up). Success = one green lap.
- One light direction (top-left) in the whole film; shadows get longer when an object is higher.
```tsx
import { Card3D } from "./depth";
<Card3D x={70} y={1220} w={940} h={380} z={1} t={frame} tilt={0.1} lift={0.8} accent="#6ee7ff" runPhase={0.3}>{/* content */}</Card3D>
<Card3D x={150} y={380} w={780} h={300} z={0.1} t={frame} tilt={0.25} lift={0.3} accent="#5a6cff" />   {/* far card: thin, dim, soft */}
```
- Real parallax: wrap layers in CSS 3D and tilt the plane with the camera (back layer `translateZ(-300px)`, scenes `0`, foreground sparks `translateZ(220px)`).
```tsx
<div style={{ perspective: 1600, width: W, height: H, overflow: "hidden" }}>
  <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
    <svg style={{ position: "absolute", transform: "translateZ(-300px) scale(1.3)" }}>{/* dust, rings */}</svg>
    <svg style={{ position: "absolute" }}>{/* scenes */}</svg>
    <svg style={{ position: "absolute", transform: "translateZ(220px)" }}>{/* sparks */}</svg>
  </div>
</div>
```

## 4. Everything is random per video (seeded, reproducible)
One integer `seed` per video (`Date.now() % 2**31` when you start; write it into `2d/<name>/scenes.json` and the commit message). Never `Math.random()` inside a component and never random per frame: derive all choices from the seed (`mulberry32(seed + sceneIndex * 101)` inside scenes). Random every time:
1. **Which scenes and in which order** (below).
2. **Which effects are used** (the effect pool, below).
3. **Which scenes get sound effects** and which extra sounds (section 6).
4. The small details: the intro object, scene positions on the path (zigzag direction, spacing), swoop roll sign, push-in or pull-out holds, transition type between scenes (swoop, whip, dolly-through, spark-chase, slash-wipe; never the same twice in a row), order of the four logo colours, which word turns into sparks, katana angle and which corner chips off, chat slots, which real items go on the cards.
Stable, never random: palette, fonts, logo, readability rules, safe area, <= 15 s.
```ts
const mulberry32 = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
type SceneDef = { id: string; fam: string; len: number; k: number; weight?: number; C: (t: number) => React.ReactNode };
const secs = (a: SceneDef[]) => a.reduce((x, s) => x + (s.len * s.k) / 30, 0);
export const pickScenes = (kit: Record<string, SceneDef>, features: SceneDef[], extras: SceneDef[], seed: number, budgetS = 15): SceneDef[] => {
  const r = mulberry32(seed), shuffle = <T,>(a: T[]) => a.map(v => [r(), v] as const).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const head = [kit.logoMorph], tail = [kit.finale], pair = [kit.katanaCut, kit.sparkChat], mid: SceneDef[] = [];
  const feats = features.map(f => [(f.weight ?? 1) * (0.7 + r() * 0.6), f] as const).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  for (const s of feats) if (secs([...head, ...pair, ...mid, s, ...tail]) <= budgetS) mid.push(s);
  for (const s of shuffle(extras)) if (secs([...head, ...pair, ...mid, s, ...tail]) <= budgetS) mid.push(s);
  const m = shuffle(mid), at = Math.floor(r() * (m.length + 1));              // katana + sparks always as a pair, somewhere in the middle
  return [...head, ...m.slice(0, at), ...pair, ...m.slice(at), ...tail];
};
// effect pool: katana and sparks are mandatory, 3-5 of these are drawn at random for every video
const EFFECTS = ["pixelMorph", "squash", "pageRead", "dollyZoom", "sparkChase", "filmLook", "endLoop"] as const;
export const pickEffects = (seed: number) => { const r = mulberry32(seed + 7), pool = [...EFFECTS].sort(() => r() - 0.5); return new Set(pool.slice(0, 3 + Math.floor(r() * 3))); };
```
**Scene kit** (generic, same for every section; `*` = exists in `Code.tsx`): `logoMorph`* (`IntroScene`, random source object), `cards3`* (`SceneFiles`, the section's real items), `katanaCut`, `sparkChat`, `logoSplitMenu`, `pickItem`, `scrollDive`, `statCounter`, `splitCompare`, `deck3D`, `deviceZoom`, `finale`* (`SceneFinale` / `OutroScene`). First = `logoMorph`, last = `finale`/`outro`, `katanaCut` directly followed by `sparkChat` once, `logoSplitMenu` right after the intro when the page has >= 3 real sections, `pickItem` when the section has a real selectable list, `scrollDive` once when more than one section is shown. Do NOT reuse the scenes of the "Kód na hraní" videos (explainer, preview, autocomplete, exercise, AI chat, plan): they belong to that section.
**Feature scenes** (the core, at least 3 per video when the section has them, they win over generic extras): for every real part of `[]` write ONE scene `feature_<name>` that redraws that real component in SVG (same structure, real labels) and animates what actually happens when it is used, so a stranger understands the function. Motion by UI pattern: list/ranking -> rows slide in, bars race and reorder, winner morphs into a badge; quiz -> card flips in, options pop, right one morphs into a check mark, score counts; form/search -> typed text, suggestions fan out, picked one morphs into the result card; editor -> typed pane + live result pane reacting with a pulse; chat -> bubbles grow from dots; dashboard/levels -> bars grow, ring fills, level shape gains a side; shop/rewards -> items fall into a basket (squash on landing), chest morphs open; calendar/plan -> days fill, camera flies along a path; lesson/reading -> `PageRead` highlighter + key words turn into sparks; settings/themes -> a colour swap sweeps over the UI; map/board -> camera pulls out, one tile is dived into.

## 5. Recipes (import, then use exactly like this)
**5.1 Logo morphs out of an object (`IntroScene`)**: the cream outline blob morphs through shapes, becomes the blue tile, the face draws on, the tile flies into the real logo and the other pieces pop. Random object = random list of morph names. Usage: `{ C: IntroScene(false, 1, ["Řádek 1", "Řádek 2"]), len: 98, k: 1.3, fy: -80 }`. Add object shapes in `SH` (`samp([...vertices])`, 140 points) e.g. keycap/bubble/play/gear and pass them as `names` in the `Morph` of `IntroScene`. Use >= 5 morphs per video: object -> logo tile, word box -> chat window, spark cluster -> star -> logo, dot -> bubble, play -> circle -> check, window -> card.

**5.2 Three cards (`SceneFiles`)**: one card splits into 3-4 that fan out with chips popping. Copy the scene, replace the `FILES` array by the section's real items (`[label, chip text, colour]`) and the two kinetic lines.

**5.3 Kinetic type and typewriter**: `<KText id="u1" text="..." x={540} y={1200} size={150} t={t} a={30} mode="rise" st={4} f="p" glow="neon" />` (`mode`: rise, drop, pop, scatter, track; `f`: h/b/p fonts; `maxW` auto-fits). Typewriter: `<TypeLine text="..." x={110} y={500} t={t} a={20} />` from `fx2.tsx`, or `Code` for syntax-coloured code.

**5.4 Katana cut (`Katana`)**. Order is fixed and tested: whole object, blade sweep (5 frames), halves part at `tc`, 5 frames later the corner cracks and falls, debris, small shake. Never mask the corner before the cut. Check stills at `tc-2`, `tc`, `tc+4`, `tc+8`, `tc+20`.
```tsx
import { Katana } from "./fx2";
<Katana t={t} tc={60} A={[170, 760]} B={[910, 1060]} chip={[[760, 830], [920, 830], [920, 930]]} id="k1">
  {/* the card / title object, drawn once; children are rendered several times */}
</Katana>
```
**5.5 Sparks and chat (`Sparks`, `sparksFromWord`)**: letters of the cut word become sparks with motion-blur trails, they fly into a chat window, each spark lands in a slot, a ring bursts, a circle morphs into a bubble (`Morph` with `sx`/`sy` growing) and a sentence is typed.
```tsx
const list = sparksFromWord(glyphCentres, slotPoints, t0);   // glyphCentres from the KText layout of the word
<Sparks t={t} list={list} />
```
**5.6 Spark chase camera (`sparkCam`)**: the camera rides behind one spark through the whole transition: give the scene `cam: t => sparkCam(list[0], t)` in its `Sc`.

**5.7 Pixel dissolve and reassemble (`PixelMorph`)**: a word / card bursts into square pixels that fly in and form the logo tile or the next object. Rasterize any drawing to cells once (module scope), then animate `p` from 0 to 1.
```tsx
import { rasterCells, PixelMorph } from "./fx2";
const A = rasterCells(720, 240, 10, g => { g.fillStyle = "#f6f1e4"; g.font = "800 190px Onest"; g.fillText("KÓD", 20, 200); });
const B = rasterCells(300, 300, 10, g => { g.fillStyle = "#3248f0"; g.beginPath(); g.roundRect(20, 20, 260, 260, 80); g.fill(); });
<PixelMorph A={A} B={B} ax={180} ay={620} bx={390} by={600} p={prog(t, 10, 52)} cell={10} />
```
**5.8 Rubber (squash and stretch)**: every card/button/bubble that lands or is pressed squashes and springs back, flying objects stretch along their motion.
```tsx
import { Squash, stretchAlong } from "./fx2";
<Squash t={t} t0={landingFrame} px={540} py={640}>{card}</Squash>          // pivot at the bottom edge of the object
<g transform={`translate(${x} ${y}) ${stretchAlong(vx, vy)}`}>{flyingCard}</g>
```
**5.9 Page reading (`PageRead`)**: a yellow highlighter glides word to word over a text, read words stay bright, unread dim, key words get a drawn underline.
`<PageRead x={90} y={1000} width={900} text="..." t={t} a={58} focus={[3, 7]} />`
**5.10 Dolly zoom (`DollyZoom`)**: just before the katana cut the subject grows while the background shrinks (vertigo).
`<DollyZoom t={t} a={20} b={58} cx={540} cy={900} amount={0.5} fg={<Subject />} bg={<Background />} />`
**5.11 Cursor, click, menu, pick, dive**: `Cursor` follows `lerpPath(points, u)`, the camera zooms to the target BEFORE the press, press = the button drops by its depth offset and `Ripple` fires, then the button expands into the next scene (match cut). `logoSplitMenu`: slice the real logo (`LogoRow`) with two half-planes and slide the halves apart, put the buttons (real section labels) in the gap. `pickItem`: cursor hovers two options, presses one, the chosen window flies in from the side with overshoot and squash. `scrollDive`: camera descends through the stacked sections of the page using `y = lerp(y0, y1, easeIO5(u))` (slow start, accelerating, soft landing), >= 40 frames, parallax layers at different speeds.
```tsx
import { Cursor, Ripple, lerpPath, easeIO5 } from "./fx2";
const [cx_, cy_] = lerpPath([[900, 1500], [560, 800], [540, 760]], prog(t, 20, 60));
<Cursor x={cx_} y={cy_} press={clamp(1 - Math.abs(t - 64) / 3)} /> <Ripple x={540} y={760} t={t} a={64} />
```
**5.12 Film look and seamless loop**: `createFilm(scenes, audio, { film: true, loop: true })` adds chromatic aberration (grows with camera speed) + animated grain and removes the fades. For the loop the closing 24 frames play the opening morph in reverse (`loopP(frame, total)` drives `u = 1 - loopP`), so the last frame equals the first. Check: render frame 0 and the last frame, `ffmpeg -i a.jpg -i b.jpg -lavfi psnr -f null -` must give PSNR above 30 dB.

## 6. Sound: effects only, no music
- **No music, no drone, no pads, no melodies, no sine blips, no electric zaps.** Only what the real thing would sound like: `audio/sfx_real.py` has them all: `click` (plastic mouse press + release), `key` (mechanical key thock), `whoosh` (air), `swish` (blade through air), `katana` (swish, then cut thud + steel ring on the hit frame), `chip` (corner chip clinks and bounces), `debris`, `crackle` (sparks like fire crackle), `page`, `tok` (wooden tap for a chat bubble), `cloth` (card sliding in), `impact` (short heavy body hit for slams), `thud`, `steel`.
- Mapping: cursor press = `click`; katana cut = `katana` placed so its hit lands on the cut frame (`t0 = cut - 0.18 s`) + `chip` 0.3 s after + `debris`; sparks = `crackle` + `whoosh`; every typed character = `key`; chat bubble arrives = `tok`; card landing = `cloth`/`tok`; slam = `impact`; camera swoops = soft `whoosh`.
- **Random:** `audio/showcase_sfx.py` decides per scene with the seed whether it gets sound (mandatory: katanaCut, sparkChat, logoSplitMenu, pickItem; others p = 0.7), randomizes seeds, pan and which swoops get a whoosh. Write the exact moments the picture decides (cut frame, click frame, spark arrivals) into `scenes.json` under `extra`, then:
```bash
python3 audio/showcase_sfx.py 2d/<name>/scenes.json public/<name>/sfx.wav     # needs numpy + scipy (pip install scipy)
```
```json
{ "seed": 4242, "fps": 30, "frames": 450, "order": [
  {"id": "logoMorph", "start": 0.0, "dur": 2.2},
  {"id": "katanaCut", "start": 4.2, "dur": 2.0, "extra": {"cut": 4.9}},
  {"id": "sparkChat", "start": 6.2, "dur": 3.2, "extra": {"arrive0": 7.4, "arrive1": 7.9, "arrive2": 8.4}},
  {"id": "logoSplitMenu", "start": 9.4, "dur": 2.6, "extra": {"click": 11.0}} ] }
```
- Level: peak about -3 dBFS, quiet bed (no music), the katana hit is the loudest event. The track starts at full level and ends in a short fade (loop friendly). Report that the effects were measured, not auditioned.

## 7. Build, check, deliver
1. Create `2d/src/<Name>.tsx` with the picked `Sc` list per video, register `<Name>Dil1` etc. in `Root.tsx`, `npx tsc --noEmit` clean.
2. Stills: `COMP=<Id> GL=swangle CHROME_PATH=/opt/pw-browsers/chromium REMOTION_TMP=/tmp/remotion-tmp node 2d/stills.mjs out/c_ <frames> 0.3`, then `ffmpeg -i a.jpg -i b.jpg ... -filter_complex hstack=inputs=N sheet.jpg` and look at it. Always check: the end of the logo morph, a mid-swoop frame, katana `tc-2/tc/tc+4/tc+8`, spark flight, each bubble, the frame before every click (cursor on the right target, camera already zoomed), the middle of the dive, first vs last frame (loop). Fix text wider than the frame (`maxW`), overlaps, text that starts while the camera is still fast.
3. Render as a tracked background job: `npx remotion render 2d/src/index.ts <Id> out/<name>.mp4 --codec h264 --crf 18 --audio-codec aac --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=2` (about 2.3 s/frame, film look a bit slower). Verify with `ffprobe` (1080x1920, <= 15 s, audio stream) before saying it is done, send the file directly.
4. Commit sources, `scenes.json`, `public/<name>/sfx.wav`; never mp4. Report: seed, picked scene order, picked effects, which real features got scenes and which were skipped and why, what is invented, and that the sound was measured but not auditioned.

## 8. Don'ts
No music, no voice, no captions over the picture, no stock sounds, no features or numbers that are not real, no hard cuts, no fast text, no rewriting what the repos already provide, no timeline tables in the answer.
