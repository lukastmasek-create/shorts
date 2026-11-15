# DESIGN: The Moon Never Turns Its Back
1080x1920, 30 fps, **1140 f** (use the beat table, not "~1110"). No code here: spec only. All coords are canvas px, origin top-left.

## Script tweaks
- Beat 8 narration, old: "Half of the Moon, we have never seen from home."
- New: **"Nearly half of the Moon is a side we can never see from Earth."** (libration shows ~59%, so the hidden part is ~41%; ~same length, keeps 3.5 s.)
- Beat 8 visual: pill reads `NEVER SEEN`, not "half". Left/right split stays 50/50 as a diagram (it is a schematic).
- Beat 3 voice "Twenty-seven days, both." keep; big number text is `27` (true value 27.3, fine).
- Frame total 1140, last frame fade/iris.

## Reuse (do not rebuild)
- `2d/src/kit.tsx`: `W,H,prog,easeOut,easeIO,lerp,pop,INK,SW,GLOW,Stage,Glow,Pill,Num,Ring,Icon k="lock",Bar`.
- `2d/src/kit2.tsx`: `Gauge` (needle a 0..1), `Txt`, `Check`.
- `2d/src/fx.tsx`: `SceneFx` (every beat), `Cam` (every beat > 4 s), `Flash` (beat 7 lock), backdrops `Starfield`, `BigRings`, `GhostBleed`, `GridBG`, `SAFE`.
- Composition file: new `2d/src/Moon.tsx` (comp id `MoonShort`), register in `Root.tsx`. Wrap in `Stage`. Put new components below in the same file (or `2d/src/moonkit.tsx`).

## Tokens
| token | value | use |
|---|---|---|
| INK | `#ffffff` | all strokes, fills |
| BG | `#000000`, Stage radial `#1c1c1c -> #0a0a0a -> #000` | background (Stage as is) |
| CAPTION | `#aaaaaa` | Num labels, "?" |
| DIM | `#bbbbbb` | dim numbers |
| GHOST | white at opacity 0.25 | ghost moons, far side |
| BACKDROP | white opacity 0.08-0.15 | Starfield, BigRings |
No other colour. Glow = `GLOW` filter on hero only (Moon, dot, arrows); NOT on ghosts or backdrops.

## Strokes
- Main shapes (Moon, Earth, clock, lock): `SW` 5, round caps/joins.
- Orbit ring: 3, dasharray `10 14`, opacity 0.55. Ghost Moons: 4, opacity 0.25.
- Arrows (spin, pull): 5, round, filled triangle head 22 px long, 20 wide.
- Link line dot->Earth: 3, solid, opacity 0.7.
- Pill: kit default (3 px outline, size 24 -> default). Never smaller.

## Safe areas
- Text/pills: kit `SAFE` (x 60..960, y 160..1540). Platform UI covers top 150, bottom 380, right 120.
- **Key content (Moon, Earth, hero shapes): box x 90..990, y 280..1480**, centred on (540, 880). Anything y>1480 or <280 is backdrop only (GhostBleed, stars).
- Pills: y 330 (top slot) or y 1380-1460 (bottom slot). Nothing at y>1500.

## Recurring elements
**Earth**: circle r 90, black fill, stroke SW. Details (stroke 3): equator line, ellipse rx 38 ry 90, one latitude arc. Glow. Small variant r 55 (beat 8) drops the latitude arc. Pop-in on appear.

**Orbit view** (beats 2, 4, 5, 6-ish): Earth centre **E = (540, 900)**, orbit ring r **330** centred E (spans x 210..870, y 570..1230). Moon position at angle th (0 = top, clockwise): `(540 + 330 sin th, 900 - 330 cos th)`. Start th = -50 deg on beat 2.

**Moon**: circle r 70 in orbit view (r 300 in beat 1, 230 in beat 7, 280 in beat 8). Black fill (hides ring behind), stroke SW, glow. Craters (relative to centre, in fractions of R): A (-0.37,-0.30) r 0.15; B (0.32,-0.12) r 0.21; C (-0.10,0.40) r 0.11. Filled white on beat 1 and 8; omit in orbit view (too small) and use only the marker.

**Marker dot** (the keystone): filled white circle r 13 (r 0.18R in big views), glow stronger. Sits at distance 0.62R from Moon centre, in direction `phi`. Locked: phi = direction Moon->Earth = `th + 180 deg` in the th convention (dot always on the Earth side). Free spin (beat 2 hint, beat 5): phi = spin angle, independent. Always draw the dot above the Moon outline.

**Link line**: from dot centre to Earth edge (stop 6 px short of r 90), stroke 3. Visible beats 4, 7, 8-lite. Beat 4: draw with a travelling pulse (dash offset).

**Spin arrow**: arc radius R+26 around Moon, sweep 250 deg, arrowhead at the end, stroke 5. Rotates with time; length (sweep) shrinks 250 -> 40 deg in beat 7 and disappears. Component `SpinArrow({x,y,r,sweep,rot,o})`.

**Ghost Moons** (beat 4): same Moon at th = 0, 90, 180, 270, opacity 0.25, no glow, each with its own dot + link line (also 0.25). Real Moon stays full opacity.

**Pull arrows** (beat 6): two white arrows, length 150, from Moon edge toward Earth.

**Clock** (beat 3): circle r 190 stroke SW; 12 tick marks (len 16, stroke 3, 4 longer ones 28); hand length 150 stroke 6 round, centre dot r 10; hand starts at 12 o'clock, clockwise. Clock A (left) centre **(300, 820)**, clock B (right) **(780, 820)**; each has a mini icon above hand: A = tiny Earth r 22 with tiny Moon orbit dot at hand tip (r 12), B = Moon r 24 with marker dot, rotating. Component `Clock({x,y,p,kind})`. A sweep-trail arc (3 px, opacity .5) follows the hand. Both sweep 0..360 deg over frames 340..440 (local ease-in-out), finish same frame; ring pulse (`Ring`) at 440.

**Padlock**: `Icon k="lock"` scale 1.5 (about 180x300 incl. shackle). Snap shut = shackle y offset -30 -> 0 with 4 frame overshoot, then `Ring` + `Flash`.

**Brake gauge**: `Gauge` (kit2) scale 1.8 at (540, 1290), ticks on, needle a: 0.9 -> 0.1 (right to left means "slow"; tick labels none). Caption pill below.

**Pills** (kit `Pill`, size default 24): main `on` (white, black text); secondary `on={false}`. Day counter uses `Num` (size 150, label caps).

**Night counter** (beat 1): `Num` size 150, label `NIGHT`, at (540, 330). Value 1, 2, 3 (hard swap, pop each).

## Backdrops / transitions
- Space: `Starfield` n=90 o=0.6 on every orbit beat; `BigRings` x=540 y=900 o=0.08 on beats 2,4,5. Beat 3 `GridBG` o=0.08. Beat 6 `GhostBleed` big Earth circle (s=5) off the left edge. Beat 8 `BigRings` centred on the Moon.
- Transitions (d=9): 1 in `zoomIn`; 1->2 `zoomIn` (leaving the face, entering space); 2->3 `whipL`; 3->4 `zoomOut`; 4->5 `whipL`; 5->6 `spin`; 6->7 `whipUp`; 7->8 `zoomIn`; 8 out `iris` (end).
- `Cam` on every beat: slow push s 1 -> 1.08 about (540, 900) unless noted.

## Per-beat layout (z-order bottom to top)
**1 (0-165)**. Backdrop Starfield. Big Moon R=300 at (540, 880), glow. Craters A,B,C white-filled. Each pulse (scale 1->1.04->1, ~10 f, at f 25, 70, 115) bumps Night counter 1/2/3 at (540, 330). Pill `EVERY NIGHT` at (540, 1330) pops at f 20. Cam pushes in s 1.06.

**2 (165-300)**. Backdrop Starfield + BigRings. Earth at E, ring r 330 draws on (stroke-dash) f 0-20. Moon r 70 travels th -50 -> +120 deg over the beat (ease in-out, linear-ish). Marker dot spins independently at 2 turns / beat (obviously not facing Earth). SpinArrow around Moon (r 96). Pills: `ORBIT` (secondary) at (300, 1400) f 40; `SPIN` (main) at (780, 1400) f 80. While ORBIT shows, ring brightens to opacity 0.9; while SPIN shows, SpinArrow flashes.

**3 (300-465)**. Backdrop GridBG. Clock A (300, 820), Clock B (780, 820), pop-in f 5. Pills above clocks at y 560: `ORBIT` (300) and `SPIN` (780), secondary. Sweep both in f 40-140 with Ring at f 140. `Num v=27 label=DAYS` at (540, 1290) size 240, pop f 130. Pill none (Num is the hero).

**4 (465-630)**. Backdrop Starfield + BigRings. Orbit view as beat 2 (E, ring). Four ghost Moons th 0/90/180/270 appear one by one f 25/55/85/115 (pop). Real Moon moves th 0 -> 360 over f 15-150 with locked dot + link line. Pill `ALWAYS FACING EARTH` main at (540, 1400) f 30 (1 line, 20 chars; fits). Dancer comparison is voice only.

**5 (630-765)**. Pill `BILLIONS OF YEARS AGO` main at (540, 330) f 0. Orbit view; Moon orbits slowly (th 0 -> 60 over the beat), dot spins fast (6 turns), 3 motion arcs (stroke 4, opacity 0.5, trailing 40 deg each) behind the dot on Moon rim; faint ghost dots at random angles (3, opacity 0.3). `Cam` s 1 -> 1.15 about the Moon. SpinArrow sweep 250, rot fast.

**6 (765-930)**. Backdrop GhostBleed big Earth left. Earth r 110 at (230, 880). Moon egg at (720, 880): ellipse rx 150 ry 118, long axis toward Earth (x), start as circle r 130 morphing over f 20-60; marker dot on near end. Two pull arrows at y 820 and y 940 from x 600 to x 430 (above/below the axis, parallel), pulse in length. Gauge at (540, 1290) needle 0.9 -> 0.1 over f 60-160. Pill `TIDAL BRAKE` main at (540, 1440) f 50.

**7 (930-1035)**. Moon r 230 at (540, 820), dot + link line pointing left, ending at a short tick at x 90 (no Earth drawn). SpinArrow sweep shrinks 250 -> 40, rot slows to 0 (f 0-55); tick row (6 small ticks along the ring, stroke 3) slows with it. At f 60 padlock (scale 1.5) snaps at (700, 960), Flash + Ring at Moon centre. Pill `LOCKED` main at (540, 1330) f 66. Spin arrow gone at f 62.

**8 (1035-1140)**. Backdrop BigRings at (560, 880) o=0.08. Earth small (r 55) at (130, 880). Moon R=280 at (560, 880), vertical split at x = 560: left half solid white fill with the craters A,B,C in black (near side, faces Earth); right half black with dashed outline (stroke 4, `10 14`, opacity 0.6) and a `?` (Txt size 200, #aaa) at (690, 920). Thin link line Earth->left half edge. Pills: `NEAR SIDE` secondary at (330, 1230), `NEVER SEEN` main at (780, 1230) f 40 (both inside SAFE; keep x gap >= 40). Last 9 f `iris` out.

## Animator notes
- Everything is pure SVG; no per-frame random: use fixed arrays (see ghost dot angles 40, 130, 250 deg).
- Exact th/phi maths: dot position = `C + 0.62R*(sin phi, -cos phi)` with phi = th+180 deg when locked (th measured clockwise from top, same as Moon position).
- Beat 7 dot state continues from beat 4 (locked); beat 5 dot is free. Dot must visibly snap to locked when the lock closes (phi eased to th+180 over the last 20 frames of the slowdown).
- Voice: build with `python 2d/voice_short.py moon` from `2d/moon/script.txt` (or the writer's dir) and align pill pops to `words.json`.
