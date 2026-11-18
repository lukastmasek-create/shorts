// Live preview in your browser: npm run view -- --episode 01
import { spawn } from 'node:child_process'; import { serve, args, epId } from './lib.mjs';
const a = args(), id = epId(a) || '01', { server, port } = await serve(8765).catch(() => serve(0)), url = `http://127.0.0.1:${port}/web/index.html?mode=view&ep=${id}${a.captions ? '&cap=1' : ''}`;
console.log(`Preview: ${url}\n(space = play/pause, arrows = +-1 s, buttons = scenes). Ctrl+C to stop.`);
const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]]; try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).on('error', () => { }).unref(); } catch { }
