// Small shared animation helpers for episodes.
import { C, W, H } from './engine.js';
export const flipKeys = (times, d = .5, a = 0, b = 180) => { const k = [[0, a]]; let s = a; for (const t of times) { s = s === a ? b : a; k.push([t, s === a ? b : a], [t + d, s, 'back']); } return k; };
export const pingY = (times, y0, y1, d = .9) => { const k = [[0, y0]]; let s = y0; for (const t of times) { const to = s === y0 ? y1 : y0; k.push([t, s], [t + d, to, 'i']); s = to; } return k; };
export const shake = (S, t0, t1, a = .15) => S.cam({ sh: [[0, 0], [t0, 0], [t0 + .05, a], [t1, 0]] });
export const buzz = (S, node, times, amp = .12) => S.mv(node, { r: [[0, 0], ...times.flatMap(t => [[t, 0], [t + .03, amp * 40], [t + .06, -amp * 40], [t + .09, amp * 40], [t + .12, 0]])] });
export const expK = (s0, t0, t1, period = 2, step = .25) => { const k = [[0, s0]]; for (let t = t0; t <= t1 + 1e-6; t += step) k.push([t, s0 * 2 ** ((t - t0) / period), 'l']); return k; };
export const orbit = (S, node, cx, cy, rx, ry, period, ph = 0) => S.on(t => { const a = ph + t / period * 6.283; node.g.position.set(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 0); });
export const spiral = (S, p, n = 140, R = 3, col = '#fff') => { const g = S.add('group', { parent: p }); for (let i = 0; i < n; i++) { const arm = i % 2, u = (i >> 1) / (n / 2), a = u * 9 + arm * 3.14159, r = u * R + .1 + (S.rnd() - .5) * .3; const d = S.add('disc', { parent: g.g, r: .05 + S.rnd() * .09 + (1 - u) * .05, fill: [col, '#ffe9a8', '#bcd8ff'][i % 3], lw: 0, x: Math.cos(a) * r, y: Math.sin(a) * r * .55 }); } S.add('disc', { parent: g.g, r: .5, fill: '#ffe9a8', lw: 0, o: .7 }); return g; };
