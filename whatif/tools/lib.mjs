// Shared node helpers: static server, Chrome/FFmpeg discovery, browser launch, arg parsing.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(ROOT, 'out');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.png': 'image/png' };
export function serve(port = 0) {
  return new Promise(res => { const s = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'web/index.html' : u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(r); }); s.listen(port, '127.0.0.1', () => res({ server: s, port: s.address().port })); });
}
export function args(argv = process.argv.slice(2)) {
  const a = { _: [] }; for (let i = 0; i < argv.length; i++) { const x = argv[i]; if (x.startsWith('--')) { const k = x.slice(2), n = argv[i + 1]; if (n === undefined || n.startsWith('--')) a[k] = true; else { a[k] = n; i++; } } else a._.push(x); } return a;
}
export const pad2 = x => String(x).padStart(2, '0');
export function epId(a) { const e = a.episode ?? a.ep ?? a._[0]; return e === undefined || e === true ? null : pad2(parseInt(e, 10)); }
export function findChrome() {
  const env = process.env.CHROME_PATH || process.env.CHROME; if (env && fs.existsSync(env)) return env;
  const C = process.platform === 'win32' ? [process.env['PROGRAMFILES'] + '\\Google\\Chrome\\Application\\chrome.exe', process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe', process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe', process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe', process.env['PROGRAMFILES'] + '\\Microsoft\\Edge\\Application\\msedge.exe', process.env['PROGRAMFILES'] + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe']
    : process.platform === 'darwin' ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']
    : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium/chrome', ...globPw()];
  return C.find(p => p && fs.existsSync(p)) || null;
}
function globPw() { try { return fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-/.test(d)).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`); } catch { return []; } }
export function findFfmpeg() {
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try { const p = createRequire(import.meta.url)('ffmpeg-static'); if (p && fs.existsSync(p) && spawnSync(p, ['-version']).status === 0) return p; } catch { }
  return spawnSync('ffmpeg', ['-version']).status === 0 ? 'ffmpeg' : null;
}
export async function launch(a = {}) {
  const puppeteer = (await import('puppeteer-core')).default, exe = findChrome(); if (!exe) throw new Error('No Chrome/Edge found. Install Google Chrome or set CHROME_PATH.');
  const gl = a.gl || process.env.GL || 'auto', fl = ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1', '--hide-scrollbars', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--ignore-gpu-blocklist'];
  if (gl === 'swangle' || gl === 'cpu') fl.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox');
  else fl.push('--enable-webgl', '--use-angle=default');
  return puppeteer.launch({ executablePath: exe, headless: true, args: fl, defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 }, protocolTimeout: 600000 });
}
export async function openPage(a, port, extra = '') {
  const b = await launch(a), pg = await b.newPage(); pg.on('pageerror', e => console.error('[page error]', e.message)); pg.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/web/index.html${extra}`); await pg.waitForFunction('window.__ready===true', { timeout: 60000 }); return { b, pg };
}
