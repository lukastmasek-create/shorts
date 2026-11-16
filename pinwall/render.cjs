// node render.cjs [out.mp4] [samples=32] [fps=30]   needs: npm i (playwright-core, ffmpeg-static) and Google Chrome installed.
const { chromium } = require('playwright-core'), { spawn } = require('child_process'), fs = require('fs'), path = require('path');
const ffmpeg = require('ffmpeg-static');
const out = path.resolve(process.argv[2] || 'volcano.mp4'), samples = +process.argv[3] || 32, fps = +process.argv[4] || 30;
(async () => {
  const b = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('pageerror', (e) => console.log('[page error]', e.message));
  await pg.goto('file://' + path.join(__dirname, 'index.html') + `?render=1&samples=${samples}`);
  await pg.waitForFunction('window.ready', null, { timeout: 120000 });
  console.log('GPU:', await pg.evaluate(() => { const g = S.renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
  const D = await pg.evaluate('DURATION'), n = Math.round(D * fps);
  // sound: rendered offline by the page, passed back as 16-bit PCM
  const a = await pg.evaluate(async () => { const r = await SOUND.renderOffline((k) => STYLES[0].sound(k), DURATION, 48000, { voiceover: false }); const pcm = new Int16Array(r.inter.length); for (let i = 0; i < pcm.length; i++) pcm[i] = Math.max(-1, Math.min(1, r.inter[i])) * 32767; let s = '', u = new Uint8Array(pcm.buffer); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); });
  const wav = path.join(path.dirname(out), 'volcano_audio.wav'), pcm = Buffer.from(a, 'base64'), hd = Buffer.alloc(44);
  hd.write('RIFF', 0); hd.writeUInt32LE(36 + pcm.length, 4); hd.write('WAVEfmt ', 8); hd.writeUInt32LE(16, 16); hd.writeUInt16LE(1, 20); hd.writeUInt16LE(2, 22); hd.writeUInt32LE(48000, 24); hd.writeUInt32LE(192000, 28); hd.writeUInt16LE(4, 32); hd.writeUInt16LE(16, 34); hd.write('data', 36); hd.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(wav, Buffer.concat([hd, pcm]));
  const ff = spawn(ffmpeg, ['-y', '-framerate', String(fps), '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-i', wav, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok) => ff.on('close', ok));
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const d = await pg.evaluate((t) => { seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.97); }, i / fps);
    if (!ff.stdin.write(Buffer.from(d.slice(23), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 15 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await done; await b.close(); console.log('done', out);
})();
