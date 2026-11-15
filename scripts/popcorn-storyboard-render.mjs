// Renders the popcorn Particle-Swarm storyboard stills headlessly.
// usage: node scripts/popcorn-storyboard-render.mjs [samples]
// Serves storyboard/popcorn over http (three.js needs module + float targets over http/https),
// drives window.__S.seek(t) for every beat and saves the canvas to storyboard/popcorn/stills/.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const ROOT = path.resolve('storyboard/popcorn');
const OUT = path.join(ROOT, 'stills');
const SAMPLES = Number(process.argv[2] || 16);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
fs.mkdirSync(OUT, { recursive: true });
const EXE = process.env.CHROME_PATH || '/tmp/cb/chromium';
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?manual=1`;
const pc = (await import('puppeteer-core')).default;
const browser = await pc.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage'], env: { ...process.env, LD_LIBRARY_PATH: '/tmp/cb/lib' }, protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000 });
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR:', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
console.log('loaded, building swarm…');
const tBuild = Date.now();
let kick = false;
for (;;) {
  if (!kick) { kick = true; page.evaluate(() => window.__build(16)); }
  if (await page.evaluate(() => window.__READY === true)) break;
  if (Date.now() - tBuild > 1800000) throw new Error('swarm build timed out');
  await new Promise((r) => setTimeout(r, 2000));
}
console.log('swarm built in', ((Date.now() - tBuild) / 1000).toFixed(0), 's');
const beats = await page.evaluate(() => window.__BEATS.map((b) => ({ n: b.n, t: b.t, text: b.text })));
console.log('beats:', beats.map((b) => b.n).join(','));
await page.evaluate((s) => { window.__S.samples = s; }, SAMPLES);
for (const b of beats) {
  const t0 = Date.now();
  const data = await page.evaluate((t) => { window.__S.seek(t); return window.__CANVAS.toDataURL('image/jpeg', 0.94); }, b.t);
  const file = path.join(OUT, `beat${b.n}_t${b.t.toFixed(2)}.jpg`);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  console.log(`beat ${b.n} @ ${b.t}s -> ${path.relative(process.cwd(), file)} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
await browser.close();
server.close();
console.log('done');
