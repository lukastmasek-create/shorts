// usage: node render.mjs [samples=16] [w=1920] [h=1080]  -> out/frames, out/tomato.mp4. env FRAMES=n, CHROME_PATH
import fs from 'node:fs'; import path from 'node:path'; import cp from 'node:child_process';
const { chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs');
const ROOT = path.dirname(new URL(import.meta.url).pathname), OUT = path.join(ROOT, 'out'), SAMPLES = +(process.argv[2] || 16);
fs.mkdirSync(OUT + '/frames', { recursive: true });
const FF = process.env.FFMPEG || 'ffmpeg';
const br = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] });
const p = await br.newPage({ viewport: { width: 1300, height: 800 } });
await p.route('https://cdn.jsdelivr.net/npm/three@0.187.0/build/**', (r) => { const f = path.join(ROOT, 'assets', path.basename(new URL(r.request().url()).pathname)); r.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }); });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 300)));
await p.goto('file://' + path.join(ROOT, 'tomato.html') + `?render&samples=${SAMPLES}`);
await p.waitForFunction('window.DURATION', null, { timeout: 600000 });
const dur = await p.evaluate('window.DURATION'), total = Math.min(+(process.env.FRAMES || 1e9), Math.ceil(dur * 30));
const b64 = await p.evaluate(async () => { const r = await SOUND.renderOffline((k) => STYLE.sound(k), STYLE.duration, 48000, { voiceover: false }); const i16 = new Int16Array(r.inter.length); for (let i = 0; i < i16.length; i++) i16[i] = Math.max(-1, Math.min(1, r.inter[i])) * 32767; let s = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); });
fs.writeFileSync(OUT + '/audio.raw', Buffer.from(b64, 'base64')); console.log('sound ok', total, 'frames');
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const f = `${OUT}/frames/f${String(i).padStart(4, '0')}.jpg`; if (fs.existsSync(f)) continue;
  const d = await p.evaluate((t) => { window.seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, i / 30);
  fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
  if (i % 30 === 0) console.log('frame', i, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await br.close();
cp.execSync(`"${FF}" -y -f s16le -ar 48000 -ac 2 -i "${OUT}/audio.raw" -af loudnorm=I=-15:TP=-1.5:LRA=11 -ar 48000 "${OUT}/audio.wav"`, { stdio: 'ignore' });
cp.execSync(`"${FF}" -y -framerate 30 -i "${OUT}/frames/f%04d.jpg" -i "${OUT}/audio.wav" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest "${OUT}/tomato.mp4"`, { stdio: 'ignore' });
console.log('done', OUT + '/tomato.mp4');
