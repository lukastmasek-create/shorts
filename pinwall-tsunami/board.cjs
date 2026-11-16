const fs = require('fs');
const B = [
 { n:1, a:'0.0', b:'2.3', f:'1.9', text:'A QUAKE JOLTS THE SEAFLOOR',
   move:'Opening frame: calm blue sea, a faint orange seam (the fault) glowing on the left. At 1.2 s the fault ruptures: the seam flares white-orange, pins above it shiver, an orange shock ring runs outwards, and the sea above lifts into a low dome that splits into two fronts.',
   cam:'Low pass across the pin heads at the fault, shallow focus, key light raking from the left. Starts to rise.',
   snd:'Low room bed. Rumble builds from 0.4 s. Rupture at 1.2 s: deep impact, brown-noise boom, a burst of pin ticks that thins out as the shock runs away.' },
 { n:2, a:'2.3', b:'4.7', f:'3.9', text:'THE WHOLE SEA IS LIFTED  |  ~700 km/h in deep water',
   move:'The lifted water runs east as a long, low wave: a trough in front, a tall pale crest behind, a small follower. Spacing is wide and height is small. The seam cools to a dull glow.',
   cam:'Crane up and drift right, following the wave across the deep water. Focus follows the aim point.',
   snd:'Long low whoosh under the wave. Soft ticks pan left to right with the front. Sea wash continues.' },
 { n:3, a:'4.7', b:'7.0', f:'6.0', text:'SHALLOWS SLOW IT AND STACK IT UP',
   move:'The seabed rises (shallows turn pale). The crest slows, its bands bunch up and it grows into a steep wall. Warm land and seven small houses are in view on the right.',
   cam:'Higher three-quarter angle, aim slides to the shoreline. Depth of field tightens.',
   snd:'Rising riser and tone, surf noise swells. Ticks get denser as the bands bunch up.' },
 { n:4, a:'7.0', b:'9.2', f:'8.2', text:'THE SEA DRAINS AWAY FIRST',
   move:'The trough arrives first. Water level falls below the seabed near the shore, so a warm band of bare seafloor widens along the coast. Beyond it, the wall is waiting.',
   cam:'High and wide, whole shelf and coast in frame. Nearly still.',
   snd:'Suction: filtered noise sliding down. Everything else drops to a small silence just before the wave lands.' },
 { n:5, a:'9.2', b:'12.5', f:'11.8', text:'THEN IT FLOODS THE COAST',
   move:'The crest hits the shoreline at about 9 s and runs inland as a pale sheet, covering the beach and swamping the houses. It stops about 2.5 units inland and stays there for the last second.',
   cam:'Final high three-quarter view. Holds for the last 1.5 s.',
   snd:'Big impact at the shoreline, roaring noise wash, hollow clatter of steel on the houses. Low D drone and a soft bell hold to the end.' },
];
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(`shots/b_${f}.jpg`).toString('base64');
const panels = B.map((p) => { const [m, n] = p.text.split('  |  '); return `
<article class="panel"><figure><img alt="Beat ${p.n} key frame" src="${img(p.f)}"><figcaption>key frame at ${p.f} s</figcaption></figure>
<div class="meta"><div class="head"><span class="no">Beat ${p.n}</span><span class="tm">${p.a} – ${p.b} s</span></div>
<p class="txt"><span class="k">On screen</span> <b>${m}</b>${n ? ' <i>' + n + '</i>' : ''}</p>
<p><span class="k">Change</span> ${p.move}</p><p><span class="k">Camera</span> ${p.cam}</p><p><span class="k">Sound</span> ${p.snd}</p></div></article>`; }).join('');
const html = `<title>Tsunami Pin Wall Storyboard</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Oswald:wght@500&display=swap">
<style>
:root{--bg:#0b0c0f;--panel:#12141a;--line:#2a2e38;--fg:#e8ebf1;--mute:#98a2b3;--accent:#ff8a4c;--font:Inter,system-ui,sans-serif;--disp:Oswald,Impact,sans-serif;color-scheme:dark}
*{box-sizing:border-box}body{background:var(--bg);color:var(--fg);font:15px/1.5 var(--font);margin:0;padding-inline:max(16px,env(safe-area-inset-left,0px)) max(16px,env(safe-area-inset-right,0px));padding-block:28px 48px}
.wrap{max-width:1500px;margin:0 auto}
h1{font:500 34px/1.1 var(--disp);letter-spacing:.04em;text-transform:uppercase;margin:0 0 6px;text-wrap:balance}
.sub{color:var(--mute);margin:0 0 24px;max-width:70ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,440px),1fr));gap:20px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;min-width:0}
figure{margin:0;position:relative}img{display:block;width:100%;height:auto}
figcaption{position:absolute;top:8px;left:10px;font-size:12px;color:#fff;background:rgba(0,0,0,.55);padding:2px 8px;border-radius:4px}
.meta{padding:14px 16px 16px;display:grid;gap:8px}.meta p{margin:0;font-size:14px}
.head{display:flex;justify-content:space-between;align-items:baseline}
.no{font:500 22px var(--disp);letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}.tm{color:var(--mute);font-variant-numeric:tabular-nums}
.k{display:inline-block;min-width:72px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.txt b{font:500 16px var(--disp);letter-spacing:.05em}.txt i{color:var(--mute);font-style:normal}
h2{font:500 20px var(--disp);letter-spacing:.06em;text-transform:uppercase;margin:34px 0 8px}
ul{margin:0;padding-left:20px;max-width:90ch}li{margin:4px 0}
</style>
<div class="wrap">
<h1>Pin Wall: how a tsunami works and appears</h1>
<p class="sub">12.5 s, one continuous crane over one pin relief. Left is the quake, right is the coast. Stills are rendered with the real scene code (8 samples), so the final film will look like this.</p>
<div class="grid">${panels}</div>
<h2>Facts and numbers I assumed</h2>
<ul>
<li>~700 km/h is the speed in a 4 km deep ocean: sqrt(9.81 x 4000) = 198 m/s.</li>
<li>Wave speed falls with the square root of depth, so the model slows the wave over the shelf, and the crest grows and bunches up (Green's law).</li>
<li>Heights are exaggerated for the picture. A real open-ocean tsunami is under 1 m tall and hundreds of km long.</li>
<li>The trough leads the crest, so the sea draws back first. This happens in many real tsunamis but not all. Some arrive crest first.</li>
<li>The flood stays in place for the last second. Real runup drains back within minutes, and later waves can be bigger.</li>
<li>Scene is a simplified plan view: one straight fault, one gently curved coast, seven houses. No real place.</li>
<li>Timing is compressed: minutes to hours of real travel time become about 8 s.</li>
<li>Sound is synthesized only: no voiceover. Beds, rumble, ticks, whooshes and impacts.</li>
</ul>
<h2>Next</h2><p class="sub">Say OK, or tell me what to change (captions, beat count, timing, camera). Then I build the full player, sound and MP4.</p>
</div>`;
fs.writeFileSync('storyboard.html', html);
console.log(html.length);
