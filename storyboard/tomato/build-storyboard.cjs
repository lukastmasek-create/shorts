// builds storyboard.html (standalone, stills embedded) and artifact-page.html (no doctype wrapper)
const fs = require('fs');
const B = [
  { n: 1, name: 'SEED', t: [0, 2.2], still: 1.0, text: 'SEED',
    move: 'Opening wave: the base drops in column by column from the front centre, with bounce; fence, bed, watering can, seed packet, trowel land with it. A seed cube is tossed from the packet into the hole, a ring of soil cubes tumbles back over it, then a cube cloud slides in and rains cube drops that darken the soil.',
    cam: 'Starts close and low-ish (yaw -13°, pitch 27°) on the bed and the word, begins to arc right and pull back.',
    snd: 'Rattling tocks as the base lands, tock of the seed in the hole, soil pop, cloud whoosh, rain bed and ticks.' },
  { n: 2, name: 'SPROUT', t: [2.2, 4.3], still: 3.6, text: 'SPROUT',
    move: 'SEED is knocked off the front face and SPROUT clicks on letter by letter (left to right). Cloud drifts off up-left. A two-leaf sprout pops up cube by cube. The cube sun pops open from its centre and its rays step out in turns; soil dries a little.',
    cam: 'Keeps arcing right and backing away; frame grows so the empty air above the bed is ready for the plant.',
    snd: 'Swish of the old word, tock per letter, four rising pops for the sprout, ding + sparkle for the sun.' },
  { n: 3, name: 'PLANT', t: [4.3, 6.5], still: 5.5, text: 'PLANT',
    move: 'PLANT replaces SPROUT. A wooden stake drops in beside the sprout. The stem climbs it layer by layer, side shoots spiral out and pad after pad of leaf cubes pop open and unfold; the sun rises with it. The seed leaves vanish when the real leaves come.',
    cam: 'The big pull-back: the frame height goes from about 36 to 45 cells and the target rises so the whole plant stays in frame.',
    snd: 'Wood tock for the stake, an 11-note rising pentatonic of pops following the growth.' },
  { n: 4, name: 'FLOWER', t: [6.5, 8.4], still: 7.65, text: 'FLOWER',
    move: 'FLOWER replaces PLANT. Eight yellow cube flowers pop open on the plant one after another. A cube bee flies in from the left with buzzing wings, lands on five flowers in turn; each flower squashes and flashes when touched, then the bee leaves to the upper right.',
    cam: 'Slow continued arc to the right (yaw about 9°), subject stays centred; focus sits between word and plant.',
    snd: 'Rising blips as flowers open, a continuous detuned buzz that moves with the bee, a tick and a bell note on every landing.' },
  { n: 5, name: 'FRUIT', t: [8.4, 11.5], still: 10.0, text: 'FRUIT',
    move: 'FRUIT replaces FLOWER. Flowers shrink away and a green tomato swells at each one (lowest first). The tomatoes turn from green through orange to red. Last second holds still, with gentle wind sway and the sun glowing.',
    cam: 'Settles into the final frame (yaw 9° to 12°, slight push), then holds the last second.',
    snd: 'A pop per tomato, a success chime when the last turns red, a soft closing ding, then the room and pad ring out.' },
];
const ASSUME = [
  'No real-world numbers are shown on screen. The only on-screen words are the five stage labels: SEED, SPROUT, PLANT, FLOWER, FRUIT.',
  'Length is 11.5 s at 1920x1080 (the brief asks for 7-12 s). Beat times above are my split; you can shift them.',
  'Stylised, not botanical: one stake-trained plant with 8 tomatoes in a single raised bed. Real tomatoes also grow from the stem with side shoots, which the model hints at.',
  'Water and sun are the helpers (cloud with rain, cube sun). Soil, warmth and water are the real needs for germination and growth.',
  'Tomato flowers are yellow and are pollinated by buzzing insects such as bumblebees; shown with one bee. Tomatoes ripen green, then orange, then red.',
  'The stills are rendered from the real scene code (same cubes, light, lens and grade as the film, 16 sub-renders at 1280x720), not a rough block-out, because this scene is cheap enough to render directly. The film reuses exactly this code.',
  'Colour palette, base, bed, fence, can, packet and trowel come from the Voxel reference style; story, FLOWER beat, bee, timings and sound score are new.',
  'Sound: no voiceover. Synth effects, a quiet room bed and a soft pad, all from the sound kit; nothing is mixed to loudness yet (the mux step targets about -15 LUFS).',
];
const img = (n) => 'data:image/jpeg;base64,' + fs.readFileSync(`stills/beat${n}.jpg`).toString('base64');
const css = `
:root{--bg:#f3f5f2;--fg:#1d2420;--mute:#5d6a62;--card:#ffffff;--line:#d9dfd8;--accent:#c8362b;--chip:#e7eee6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141a16;--fg:#e8eee9;--mute:#9aa8a0;--card:#1c241f;--line:#2b362f;--accent:#ef6a5d;--chip:#243029;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141a16;--fg:#e8eee9;--mute:#9aa8a0;--card:#1c241f;--line:#2b362f;--accent:#ef6a5d;--chip:#243029;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.5;padding-block:32px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.wrap{max-width:1180px;margin:0 auto}
h1{font-family:"Space Grotesk",Inter,sans-serif;font-size:clamp(26px,4vw,38px);margin:0 0 6px;text-wrap:balance}
.sub{color:var(--mute);margin:0 0 28px;max-width:70ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:20px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;min-width:0;display:flex;flex-direction:column}
.panel img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px;min-width:0}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.num{font-family:"Space Grotesk",Inter,sans-serif;font-weight:700;font-size:22px;color:var(--accent)}
.time{font-variant-numeric:tabular-nums;color:var(--mute);font-size:13px}
.txt{font-family:ui-monospace,Menlo,monospace;background:var(--chip);padding:2px 8px;border-radius:5px;font-size:13px}
dl{margin:0;display:grid;gap:8px}dt{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}dd{margin:0;font-size:14px}
h2{font-family:"Space Grotesk",Inter,sans-serif;font-size:20px;margin:36px 0 10px}
ul{margin:0;padding-left:20px;max-width:80ch}li{margin:4px 0}
.ask{margin-top:28px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--card);max-width:80ch}
`;
const panels = B.map((b) => `<article class="panel"><img src="${img(b.n)}" alt="Beat ${b.n}: ${b.name}, still at ${b.still} s"><div class="body"><div class="head"><span class="num">${b.n}</span><span class="time">${b.t[0].toFixed(1)} s to ${b.t[1].toFixed(1)} s · still at ${b.still.toFixed(2)} s</span></div><dl><div><dt>On-screen text</dt><dd><span class="txt">${b.text}</span> in cubes on the front of the base</dd></div><div><dt>What changes</dt><dd>${b.move}</dd></div><div><dt>Camera</dt><dd>${b.cam}</dd></div><div><dt>Sound</dt><dd>${b.snd}</dd></div></dl></div></article>`).join('\n');
const inner = `<title>Tomato Storyboard</title><meta name="claude:viewport-fit-sides" content="cover"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap"><style>${css}</style>
<div class="wrap"><h1>How do tomatoes grow? Voxel storyboard</h1><p class="sub">Five beats in one continuous cube world: the same base, bed and plant stay on screen and grow, the camera arcs and pulls back with them. Stills are the film's own frames.</p>
<div class="grid">${panels}</div>
<h2>Assumed facts and choices</h2><ul>${ASSUME.map((a) => `<li>${a}</li>`).join('')}</ul>
<div class="ask">Tell me to go ahead, or what to change (beats, words, timing, length). Then I build the full player with sound and render the MP4.</div></div>`;
fs.writeFileSync('artifact-page.html', inner);
fs.writeFileSync('storyboard.html', '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + inner);
console.log(fs.statSync('artifact-page.html').size);
