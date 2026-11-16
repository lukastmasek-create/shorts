# NestedShort — plan (frames from frames.json: 0,216,457,639,846,1073,1276,1465,1729,1943,2073 = 2073 f / 69.1 s)
All cue times are scene-local frames from cues.json phrases (index i -> `.a`). Code reads them via the table at the top of Nested.tsx; do not hand-copy. Without whisper: pause-based, not word-exact. Backdrop first, hero 2–3x, text in SAFE, deterministic (frame-driven, no random).
Common: layer = rounded-square "screen" (outline, glow) with a Person inside; NESTING = same screen scaled 0.45 inside itself.

| # | frames | audience sees | change over time / hero moments (cue) | backdrop | text | Cam | in -> out |
|---|---|---|---|---|---|---|---|
| 0 | 0–216 | big screen with person, text "AI" box on top | ph0 start: screen pops; ph1 (cue 1): inner screen + tiny person pops inside, ring pulse | BigRings low | pill "What if" / "A world inside a world" | push in on inner screen | fade -> zoomIn |
| 1 | 216–457 | prompt bar typing a text, below a mini landscape (mountain line, sun, person walking in) | ph1: letters typed; landscape draws; ph2 "live": person moves | GridBG | Num 2025 "DeepMind" ; pill "Genie 3" | slow push | zoomIn -> whipL |
| 2 | 457–639 | doc icon big + "2003" | ph1: three numbered circles pop one by one | Rays | Num 2003 ; pill "Bostrom" , "One of three is true" | slight | whipL -> whipUp |
| 3 | 639–846 | 3 rows (spread(3)): fading ghost person+hourglass / screen with X / screen with person | ph0,1,2 each row pops; ph2 last row glows + ring | GhostBleed hourglass | pills "Die out" "Never run them" "Almost certainly in one" | pull | whipUp -> zoomOut |
| 4 | 846–1073 | 12x12 Life grid, glider walking (generations from frame), then grid of mini grids | ph1: cells start; ph2 "So Life can run Life": each lit cell becomes mini grid | GridBG | pills "Game of Life", "Life in Life" | push | zoomOut -> spin |
| 5 | 1073–1276 | one big cell square, "≈2,000 cells wide" bracket over a block grid; two spinners fast outer / slow inner | ph0: cell → block zoom; ph1 "layer runs slower": spinners | BigRings | pills "1 cell" "≈2,000 wide", labels OUTER / INNER | zoom into cell | spin -> whipR |
| 6 | 1276–1465 | globe icon + counter ticking to 10^120 and stopping at a cap line | ph0 counter ticks | Starfield | Num "10^120" label "operations", pill "A cap" | push | whipR -> whipUp |
| 7 | 1465–1729 | lattice with diagonal ray; test marks; X over "mark" | ph1 lattice lights; ph2 Cross + pill "None reported" | lattice rings | Num 2012; pills "Cosmic-ray test" | pan | whipUp -> whipL |
| 8 | 1729–1943 | 5 nested screens each with person; camera dives layer by layer | ph1 layers pop 1..5; ph2 pill | Starfield | pills "Simulator" , "Each thinks it is first" | dive (zoom in on nest) | whipL -> zoomIn |
| 9 | 1943–2073 | one screen with person; camera pulls back to reveal it sits in a bigger screen, again | ph0 pull back; ph1 ring pulse + big "?" | Starfield | pill "Which layer?" | pull back | zoomIn -> iris |

Transition pairs: fade,zoomIn | zoomIn,whipL | whipL,whipUp | whipUp,zoomOut | zoomOut,spin | spin,whipR | whipR,whipUp | whipUp,whipL | whipL,zoomIn | zoomIn,iris. Each type max 2x in a row; ends on iris.
Source lines (small grey) on scenes 1,2,5,6,7. Icons hand-drawn: ScreenFrame (rounded rect with inner notch), Life grid, Lattice.
