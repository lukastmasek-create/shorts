// node render.cjs [outdir=video] -> video/ucimesehrou-mono.mp4 (1080x1920, 30 fps, synth sound, no voice)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const out = path.resolve(process.argv[2] || 'video'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const p = await br.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', (e) => console.log('[page error]', e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html'));
  await p.waitForFunction('window.DURATION');
  await p.evaluate('document.fonts.ready');
  const total = Math.ceil((await p.evaluate('DURATION')) * 30);
  fs.writeFileSync(`${out}/audio.raw`, Buffer.from(await p.evaluate('renderAudio()'), 'base64'));
  for (let i = 0; i < total; i++) {
    const d = await p.evaluate((t) => { seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, i / 30);
    fs.writeFileSync(`${out}/f${String(i).padStart(4, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
  }
  await br.close();
  cp.execSync(`ffmpeg -y -f s16le -ar 48000 -ac 2 -i ${out}/audio.raw -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 ${out}/audio.wav`, { stdio: 'ignore' });
  cp.execSync(`ffmpeg -y -framerate 30 -i ${out}/f%04d.jpg -i ${out}/audio.wav -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -t 15.7 ${out}/ucimesehrou-mono.mp4`, { stdio: 'ignore' });
  console.log('done', `${out}/ucimesehrou-mono.mp4`);
})();
