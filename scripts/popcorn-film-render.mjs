// Renders the popcorn Particle Swarm film (12 s) frame by frame in headless Chromium.
//
// usage: node scripts/popcorn-film-render.mjs [framesDir]
//   env: W H SAMPLES FPS BLUR SHADOW CHROME_PATH
//   defaults: 640x360, 2 samples, 30 fps, shutter 0.5, shadow x0.25  (draft quality, CPU box)
//   final on a GPU machine: W=1920 H=1080 SAMPLES=16 SHADOW=1
// Frames are written as f_00000.jpg… and skipped if they already exist, so the render is resumable.
// The picture comes from the same storyboard/popcorn/index.html the stills use, so they cannot drift apart.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve('storyboard/popcorn');
const OUT = path.resolve(process.argv[2] || 'out/popcorn/frames');
const W = Number(process.env.W || 640), H = Number(process.env.H || 360);
const SAMPLES = Number(process.env.SAMPLES || 2);
const FPS = Number(process.env.FPS || 30);
const BLUR = Number(process.env.BLUR || 0.5); // motion-blur shutter in frames (0 = off)
const SHADOW = Number(process.env.SHADOW || 0.25); // shadow-map scale (1 = the style's full 4096)
const DURATION = 12;
const EXE = process.env.CHROME_PATH || '/tmp/cb/chromium';
const TOTAL = Math.round(DURATION * FPS);

fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const pc = (await import('puppeteer-core')).default;
const browser = await pc.launch({
  headless: true, executablePath: EXE, protocolTimeout: 0,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage'],
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/cb/lib' },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?manual=1`, { waitUntil: 'load', timeout: 120000 });
console.log(`building stage ${W}x${H}, ${SAMPLES} samples, ${FPS} fps, shutter ${BLUR}, shadow x${SHADOW}`);
await page.evaluate((sh, w, h, s, blur) => {
  window.__shadowScale = sh;
  return window.__build(s, w, h).then((S) => { S.R.shutter = blur; return true; });
}, SHADOW, W, H, SAMPLES, BLUR);

// A tiny PNG (RGB, 1 filter byte + 3 bytes per row) written from Node, so the page never has to run
// canvas.toDataURL — on a software-GL box the in-page JPEG readback is ~100x slower than the render itself.
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const png = (rgba, w, h, level = 3) => {
  const stride = w * 3, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w * 4, dst = y * (stride + 1) + 1; // readPixels is bottom-up, PNG is top-down
    for (let x = 0; x < w; x++) { raw[dst + x * 3] = rgba[src + x * 4]; raw[dst + x * 3 + 1] = rgba[src + x * 4 + 1]; raw[dst + x * 3 + 2] = rgba[src + x * 4 + 2]; }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level })), chunk('IEND', Buffer.alloc(0))]);
};

const t0 = Date.now();
let done = 0;
for (let f = 0; f < TOTAL; f++) {
  const file = path.join(OUT, `f_${String(f).padStart(5, '0')}.png`);
  if (fs.existsSync(file) && fs.statSync(file).size > 2000) continue;
  // page helper: seek + readPixels + base64 of raw RGBA (no JPEG/PNG encode in the browser)
  const grab = await page.evaluate((t) => window.__grab(t), f / FPS);
  fs.writeFileSync(file, png(Buffer.from(grab.data, 'base64'), grab.w, grab.h));
  done++;
  if (done % 5 === 0 || f === TOTAL - 1) {
    const per = (Date.now() - t0) / 1000 / done;
    console.log(`frame ${f}/${TOTAL - 1}: ${per.toFixed(2)} s/frame, ${((per * (TOTAL - done)) / 60).toFixed(0)} min left`);
  }
}
await browser.close();
server.close();
console.log(`done: ${done} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min -> ${path.relative(process.cwd(), OUT)}`);
