// usage: node render-stills.mjs [samples] [w] [h]   renders the beat key frames to stills/
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path';
const { chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs');
const ROOT = path.dirname(new URL(import.meta.url).pathname), SAMPLES = +(process.argv[2] || 16), W = +(process.argv[3] || 1280), H = +(process.argv[4] || 720);
const BEATS = [1.0, 3.6, 5.5, 7.65, 10.0];
const TY = { '.html': 'text/html', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0] === '/' ? 'harness.html' : q.url.split('?')[0]); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': TY[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage'] });
const p = await br.newPage({ viewport: { width: 1300, height: 800 } });
p.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 300)); }); p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 400)));
await p.goto(`http://127.0.0.1:${srv.address().port}/harness.html?samples=${SAMPLES}&w=${W}&h=${H}&shadow=${process.env.SHADOW || 2048}`);
await p.waitForFunction('window.__READY', null, { timeout: 600000 });
console.log('ready');
fs.mkdirSync(path.join(ROOT, 'stills'), { recursive: true });
const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
for (let i = 0; i < BEATS.length; i++) {
  if (only && !only.includes(i + 1)) continue;
  const t0 = Date.now();
  const d = await p.evaluate(async (t) => { window.__S.seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, BEATS[i]);
  fs.writeFileSync(path.join(ROOT, 'stills', `beat${i + 1}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
  console.log('beat', i + 1, BEATS[i], ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await br.close(); srv.close();
