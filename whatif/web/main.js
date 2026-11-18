import { Player } from './player.js';
import { load } from './registry.js';
const q = new URLSearchParams(location.search);
await Promise.all(['700', '800'].map(w => document.fonts.load(`${w} 40px Montserrat`)));
let pl = null;
window.__init = async ({ ep, w = 1080, h = 1920, captions = false, timing = {} }) => {
  const e = await load(ep), cv = document.getElementById('c'); cv.width = w; cv.height = h;
  pl = new Player(e, { canvas: cv, w, h, captions, timing }); window.__pl = pl; return { total: pl.tl.total, frames: pl.tl.frames, scenes: pl.tl.scenes };
};
window.__set = T => { pl.setTime(T); pl.render(); return true; };
window.__shot = (T, fmt, qual) => { pl.setTime(T); pl.render(); return pl.png(fmt, qual); };
window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message)));
window.__ready = true;
if (q.get('mode') === 'view') {
  document.body.className = 'view'; const info = await window.__init({ ep: q.get('ep') || '01', w: 540, h: 960, captions: q.get('cap') === '1' });
  const bar = document.getElementById('bar'); bar.hidden = false; const sl = document.getElementById('sl'), tt = document.getElementById('tt'), pb = document.getElementById('pb'); sl.max = info.total; let T = 0, play = true, last = performance.now();
  info.scenes.forEach(s => { const b = document.createElement('button'); b.textContent = s.i + 1; b.onclick = () => { T = s.start; }; bar.appendChild(b); });
  pb.onclick = () => { play = !play; pb.textContent = play ? 'pause' : 'play'; }; sl.oninput = () => { T = +sl.value; };
  addEventListener('keydown', e => { if (e.key === ' ') pb.click(); if (e.key === 'ArrowRight') T += 1; if (e.key === 'ArrowLeft') T -= 1; });
  (function loop(now) { if (play) T += (now - last) / 1000; last = now; if (T > info.total) T = 0; if (T < 0) T = 0; sl.value = T; tt.textContent = T.toFixed(1) + ' / ' + info.total.toFixed(1) + ' s'; window.__set(T); requestAnimationFrame(loop); })(last);
}
