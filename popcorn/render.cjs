// Vyrenderuje MP4 (1920x1080, 30 fps, zvuk kolem -16 LUFS).
//   npm i (ve složce ucimesehrou/)   a pak:   node render.cjs [samples=32] [outdir=video]
// samples = podsnímky na snímek (motion blur, hloubka ostrosti, měkké stíny): 32 je dobré, 64 je plná kvalita.
// env: CHROME=/cesta/k/chrome, FRAMES=N (jen prvních N snímků na test),
//      LOCAL_ASSETS=<složka s three.module.js, three.core.js a fonts/{fonts.css,map.json,*.woff2}> pro render bez přístupu na CDN.
// Přerušený render naváže, kde skončil (hotové snímky f0000.jpg... se přeskočí).
const { chromium } = require('playwright-core');
const fs = require('fs'), http = require('http'), path = require('path'), cp = require('child_process');
let FF = 'ffmpeg'; try { FF = require('ffmpeg-static'); } catch (e) {}
const samples = +(process.argv[2] || 32), out = path.resolve(process.argv[3] || path.join(__dirname, 'video')), FPS = 30;
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((q, r) => { const u = q.url.split('?')[0], f = path.join(__dirname, u === '/' ? 'index.html' : u); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(d); } }); });
(async () => {
  await new Promise((ok) => server.listen(0, ok));
  const br = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('[page error]', e.message));
  const A = process.env.LOCAL_ASSETS;
  if (A) {
    const map = JSON.parse(fs.readFileSync(A + '/fonts/map.json'));
    await p.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ path: A + '/' + (r.request().url().endsWith('three.core.js') ? 'three.core.js' : 'three.module.js'), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }));
    await p.route('https://fonts.googleapis.com/**', (r) => { let css = fs.readFileSync(A + '/fonts/fonts.css', 'utf8'); for (const [u, f] of Object.entries(map)) css = css.split(u).join('https://fonts.gstatic.com/local/' + f); r.fulfill({ body: css, contentType: 'text/css', headers: { 'access-control-allow-origin': '*' } }); });
    await p.route('https://fonts.gstatic.com/local/**', (r) => r.fulfill({ path: A + '/fonts/' + r.request().url().split('/').pop(), contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' } }));
  }
  await p.goto(`http://localhost:${server.address().port}/index.html?render=1&samples=${samples}`);
  await p.waitForFunction('window.__done', null, { timeout: 300000 });
  if ((await p.evaluate('String(window.__done)')) !== 'true') throw new Error('stránka se nenačetla (WebGL?)');
  const dur = await p.evaluate('window.DURATION'), total = Math.min(+(process.env.FRAMES || Infinity), Math.ceil(dur * FPS));
  console.log(`délka ${dur.toFixed(2)} s, ${total} snímků, ${samples} vzorků`);
  fs.writeFileSync(`${out}/score.wav`, Buffer.from(await p.evaluate('window.renderAudio()'), 'base64')); console.log('zvuk hotový');
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const f = `${out}/f${String(i).padStart(4, '0')}.jpg`; if (fs.existsSync(f)) continue;
    const d = await p.evaluate((t) => { window.seek(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.95); }, i / FPS);
    fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
    if (i % 15 === 0) console.log(`snímek ${i}/${total}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await br.close(); server.close();
  const mp4 = `${out}/popcorn.mp4`;
  cp.execSync(`"${FF}" -y -v error -framerate ${FPS} -i "${out}/f%04d.jpg" -i "${out}/score.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest "${mp4}"`, { stdio: 'inherit' });
  for (const f of fs.readdirSync(out)) if (/^f\d+\.jpg$|^score\.wav$/.test(f)) fs.unlinkSync(path.join(out, f));
  console.log('hotovo:', mp4);
})();
