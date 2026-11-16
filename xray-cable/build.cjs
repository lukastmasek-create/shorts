// Builds xray_cable.html: inlines src/stage.js, src/sound.js, src/style.js into the player. Run: node build.cjs
const fs = require('fs');
const r = (f) => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const tpl = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Undersea Cable X-Ray</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Space+Grotesk:wght@500;700&display=swap">
<style>
html,body{margin:0;height:100%;background:#050607;color:#c6dcef;font-family:"IBM Plex Mono",ui-monospace,monospace}
#wrap{display:flex;flex-direction:column;height:100%}
#stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
canvas{width:100%;height:100%;object-fit:contain;display:block;cursor:pointer}
#bar{display:flex;align-items:center;gap:12px;padding:8px 14px;background:#0b0e12;border-top:1px solid #1b232c;font-size:13px}
#bar button{background:none;border:1px solid #2a3642;color:inherit;font:inherit;padding:5px 12px;cursor:pointer}
#bar button:focus-visible,#bar input:focus-visible{outline:2px solid #ff9a22}
#seek{flex:1;accent-color:#ff9a22;min-width:0}
#bar label{display:flex;align-items:center;gap:5px;white-space:nowrap}
body.render #bar{display:none}
</style></head><body>
<div id="wrap"><div id="stage"><canvas id="c" width="1920" height="1080"></canvas></div>
<div id="bar"><button id="play" aria-label="Play or pause">Pause</button><input id="seek" type="range" min="0" max="1000" value="0" aria-label="Scrub"><span id="time">0.00 / 0.00</span>
<button id="snd">Sound on</button><label><input id="loop" type="checkbox" checked> loop</label></div></div>
<script type="text/plain" id="src-stage">@@STAGE@@</script>
<script type="text/plain" id="src-sound">@@SOUND@@</script>
<script type="text/plain" id="src-style">@@STYLE@@</script>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
window.THREE = THREE;
for (const id of ['src-stage', 'src-sound', 'src-style']) { const s = document.createElement('script'); s.textContent = document.getElementById(id).textContent; document.head.appendChild(s); }
const q = new URLSearchParams(location.search), RENDER = q.has('render');
if (RENDER) document.body.classList.add('render');
const style = STYLES[0], canvas = document.getElementById('c');
window.DURATION = style.duration;
const S = await K.run(canvas, style, { samples: +q.get('samples') || (RENDER ? style.render.samples : 3) });
window.seek = (t) => S.seek(t);
window.style = style;
window.READY = true;
if (!RENDER) {
  const $ = (id) => document.getElementById(id), D = style.duration;
  let t = 0, playing = true, soundOn = true, stopSound = null, last = performance.now(), gesture = false;
  const stop = () => { if (stopSound) { stopSound(); stopSound = null; } };
  const startSound = () => { stop(); if (playing && soundOn && gesture) stopSound = SOUND.live((k) => style.sound(k), t, { voiceover: false }); };
  const ui = () => { $('seek').value = Math.round(t / D * 1000); $('time').textContent = t.toFixed(2) + ' / ' + D.toFixed(2); $('play').textContent = playing ? 'Pause' : 'Play'; $('snd').textContent = soundOn ? 'Sound on' : 'Sound off'; };
  const setPlay = (p) => { playing = p; last = performance.now(); if (p) startSound(); else stop(); ui(); };
  $('play').onclick = () => { gesture = true; setPlay(!playing); };
  canvas.onclick = () => { gesture = true; setPlay(!playing); };
  $('snd').onclick = () => { gesture = true; soundOn = !soundOn; if (soundOn) startSound(); else stop(); ui(); };
  $('seek').oninput = (e) => { t = +e.target.value / 1000 * D; stop(); S.seek(t); ui(); };
  $('seek').onchange = () => { gesture = true; last = performance.now(); if (playing) startSound(); };
  window.addEventListener('pointerdown', () => { if (!gesture) { gesture = true; startSound(); } }, { once: true });
  const frame = (now) => {
    if (playing) {
      t += (now - last) / 1000;
      if (t >= D) { if ($('loop').checked) { t = 0; startSound(); } else { t = D; setPlay(false); } }
    }
    last = now; S.seek(t); ui(); requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
</script></body></html>`;
const out = tpl.replace('@@STAGE@@', () => r('stage.js')).replace('@@SOUND@@', () => r('sound.js')).replace('@@STYLE@@', () => r('style.js'));
fs.writeFileSync(__dirname + '/xray_cable.html', out);
console.log('xray_cable.html', Math.round(out.length / 1024), 'KB');
