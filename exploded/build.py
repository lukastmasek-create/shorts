# builds steam-engine.html: lib/stage.js + lib/sound.js + styles/steam-engine.js + player, all inline
r=lambda p:open(p).read()
html='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Steam Engine Exploded View</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Space+Grotesk:wght@700&display=swap">
<style>
html,body{margin:0;height:100%;background:#14171f;color:#e9e6df;font:14px system-ui,sans-serif}
#app{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100%;gap:10px;padding:10px;box-sizing:border-box}
#stage{width:min(100%,calc((100vh - 80px) * 16 / 9));aspect-ratio:16/9;background:#fbf7ee}
canvas{width:100%;height:100%;display:block}
#bar{display:flex;align-items:center;gap:12px;width:min(100%,calc((100vh - 80px) * 16 / 9));font:500 13px "IBM Plex Mono",monospace}
button{background:#2a3050;color:#fff;border:0;border-radius:4px;padding:6px 12px;font:inherit;cursor:pointer}
button[aria-pressed=false]{opacity:.55}
input[type=range]{flex:1;min-width:0}
#time{min-width:92px;text-align:right}
body.render #bar{display:none} body.render #app{padding:0;gap:0} body.render #stage{width:1920px}
</style></head><body>
<div id="app"><div id="stage"><canvas id="c"></canvas></div>
<div id="bar"><button id="play">Play</button><input id="scrub" type="range" min="0" max="1" step="0.001" value="0" aria-label="Time"><span id="time">0.00 / 0.00</span>
<button id="snd" aria-pressed="true">Sound on</button><button id="loop" aria-pressed="true">Loop on</button></div></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js"}}</script>
<script type="module">import * as THREE from 'three'; window.THREE = THREE;</script>
<script type="module">
@@STAGE@@
</script>
<script type="module">
@@SOUND@@
</script>
<script type="module">
@@STYLE@@
const style = STYLES[STYLES.length - 1], q = new URLSearchParams(location.search), render = q.has('render');
if (render) document.body.classList.add('render');
const $ = (id) => document.getElementById(id), D = style.duration;
const S = await K.run($('c'), style, { samples: +q.get('samples') || 3 });
window.S = S; window.seek = (t) => S.seek(t); window.DURATION = D; window.STYLE = style;
window.renderAudio = async () => { const r = await SOUND.renderOffline((k) => style.sound(k), D, 48000, { voiceover: false }); let bin = ''; const u8 = new Uint8Array(r.inter.buffer); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return { peak: r.peak, b64: btoa(bin) }; };
let t = 0, playing = false, t0 = 0, stopSound = null, soundOn = true, loop = true, raf = 0, settle = 0;
const fmt = (x) => x.toFixed(2);
const ui = () => { $('scrub').value = t / D; $('time').textContent = fmt(t) + ' / ' + fmt(D); };
const draw = (n) => { S.seek(t, n); ui(); };
const stopS = () => { if (stopSound) { stopSound(); stopSound = null; } };
const startS = () => { stopS(); if (soundOn && playing) stopSound = SOUND.live((k) => style.sound(k), t, { voiceover: false }); };
const tick = (now) => {
  if (!playing) return;
  t = (now - t0) / 1000;
  if (t >= D) { if (loop) { t = 0; t0 = now; startS(); } else { t = D; pause(); draw(); return; } }
  draw(); raf = requestAnimationFrame(tick);
};
const later = () => { clearTimeout(settle); settle = setTimeout(() => { if (!playing) draw(10); }, 200); };
function play() { if (t >= D - 0.02) t = 0; playing = true; t0 = performance.now() - t * 1000; $('play').textContent = 'Pause'; startS(); raf = requestAnimationFrame(tick); }
function pause() { playing = false; cancelAnimationFrame(raf); stopS(); $('play').textContent = 'Play'; later(); }
$('play').onclick = () => (playing ? pause() : play());
$('scrub').oninput = (e) => { t = +e.target.value * D; stopS(); if (playing) { t0 = performance.now() - t * 1000; startS(); } draw(); if (!playing) later(); };
$('snd').onclick = () => { soundOn = !soundOn; $('snd').setAttribute('aria-pressed', soundOn); $('snd').textContent = soundOn ? 'Sound on' : 'Sound off'; if (soundOn) startS(); else stopS(); };
$('loop').onclick = () => { loop = !loop; $('loop').setAttribute('aria-pressed', loop); $('loop').textContent = loop ? 'Loop on' : 'Loop off'; };
draw(render ? undefined : 10); window.READY = true;
</script></body></html>'''
html=html.replace('@@STAGE@@',r('lib/stage.js')).replace('@@SOUND@@',r('lib/sound.js')).replace('@@STYLE@@',r('styles/steam-engine.js'))
open('steam-engine.html','w').write(html); print(len(html)//1024,'KB')
