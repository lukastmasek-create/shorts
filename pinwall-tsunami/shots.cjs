// node shots.cjs <times,comma> [samples=16] [tag=b]   -> shots/<tag>_<t>.jpg
// Uses the real GPU by default. GL=swiftshader forces the slow software renderer.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const times = process.argv[2].split(',').map(Number), n = +(process.argv[3] || 16), tag = process.argv[4] || 'b';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
}).listen(8123);
(async () => {
  const args = process.env.GL === 'swiftshader'
    ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'];
  const b = await chromium.launch({ args });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', (m) => console.log('[page]', m.text())); p.on('pageerror', (e) => console.log('[err]', e.message));
  await p.goto('http://localhost:8123/stills.html?n=' + n);
  await p.waitForFunction('window.READY', null, { timeout: 180000 });
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  for (const t of times) {
    const t0 = Date.now(), d = await p.evaluate((t) => window.shot(t), t);
    fs.writeFileSync(path.join(__dirname, `shots/${tag}_${t}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
    console.log('t', t, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await b.close(); srv.close();
})();
