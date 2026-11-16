// Renders xray_cable.html to out/xray_cable.mp4 (1920x1080, 30 fps, with sound at -15 LUFS) in headless Chromium on the GPU.
// Usage: node render.cjs            env: SAMPLES=48 (quality), FROM / TO (frame range), GL=software (no GPU, slow), CHROME=path to a Chrome/Chromium binary (optional)
// Resumable: frames are saved to frames/ and skipped if they already exist. Delete frames/ to start over.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const ROOT = __dirname, SAMPLES = +process.env.SAMPLES || 48, FPS = 30;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css' };

(async () => {
  const server = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const font = (fam, w, file) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(${base}/node_modules/@fontsource/${file})}`;
  const fontsCss = [font('Space Grotesk', 700, 'space-grotesk/files/space-grotesk-latin-700-normal.woff2'), font('Space Grotesk', 500, 'space-grotesk/files/space-grotesk-latin-500-normal.woff2'), font('IBM Plex Mono', 500, 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')].join('\n');

  const args = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--no-sandbox'];
  if (process.env.GL === 'software') args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args } : { channel: 'chromium', args });   // new headless mode: real GPU
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.log('page error:', e.message));
  await page.route('**/*', (r) => {
    const u = r.request().url(), m = /three@0\.187\.0\/(.+)$/.exec(u);
    if (m) return r.fulfill({ path: path.join(ROOT, 'node_modules/three', m[1]), contentType: 'text/javascript' });
    if (u.includes('fonts.googleapis.com')) return r.fulfill({ body: fontsCss, contentType: 'text/css' });
    if (u.includes('fonts.gstatic.com')) return r.abort();
    return r.continue();
  });
  await page.goto(`${base}/xray_cable.html?render&samples=${SAMPLES}`);
  await page.waitForFunction('window.READY', null, { timeout: 300000 });
  const gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  console.log('GPU:', gpu);
  if (/swiftshader|software|llvmpipe/i.test(gpu) && process.env.GL !== 'software') console.log('WARNING: software rendering, this will be slow. Update the graphics driver or see README.');

  const D = await page.evaluate('window.DURATION'), N = Math.round(D * FPS), from = +(process.env.FROM || 0), to = process.env.TO ? +process.env.TO : N;
  fs.mkdirSync(path.join(ROOT, 'frames'), { recursive: true }); fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const t00 = Date.now();
  for (let i = from; i < to; i++) {
    const fn = path.join(ROOT, 'frames', `f${String(i).padStart(4, '0')}.jpg`);
    if (fs.existsSync(fn)) continue;
    const d = await page.evaluate((i) => { window.seek(i / 30); return document.getElementById('c').toDataURL('image/jpeg', 0.97); }, i);
    fs.writeFileSync(fn, Buffer.from(d.split(',')[1], 'base64'));
    console.log(`frame ${i + 1}/${N}  ${((Date.now() - t00) / 1000).toFixed(0)} s elapsed`);
  }
  // sound: the same score the player uses, rendered offline
  const f32 = path.join(ROOT, 'out', 'audio.f32');
  const a = await page.evaluate(() => SOUND.renderOffline((k) => window.style.sound(k), window.DURATION, 48000, { voiceover: false }).then((r) => { let s = ''; const u = new Uint8Array(r.inter.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }));
  fs.writeFileSync(f32, Buffer.from(a, 'base64'));
  await browser.close(); server.close();

  const run = (args) => { const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
  const wav = path.join(ROOT, 'out', 'audio.wav'), out = path.join(ROOT, 'out', 'xray_cable.mp4');
  run(['-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', f32, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '48000', wav]);
  run(['-framerate', String(FPS), '-start_number', String(from), '-i', path.join(ROOT, 'frames', 'f%04d.jpg'), '-i', wav, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', out]);
  console.log('done:', out);
})();
