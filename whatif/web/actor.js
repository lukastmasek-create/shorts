// Rigged stick-figure cartoon character: IK arms/legs, gait driven by x position, blinking, expressions, gestures.
import { THREE, setAlpha, shape, circle, ell, line, rect, blobs, ellP, rrP, chaikin, spline, arcP, starP, kf, ease, clamp, lerp, rng, C, INK, D2R } from './engine.js';

const HIP = 1.64, SH = 1.16, HEAD = 1.8, UA = .88, LA = .88, UL = .83, LL = .83;
// arm pose: [dx,dy,wiggle] per arm (dx outward from body, from shoulder), + swing
const P2 = (a, b = a) => [...a, ...b];
export const POSE = {
  down: P2([.12, -1.66, 0]), up: P2([.35, 1.55, 0]), cheer: P2([.9, 1.45, .4]), panic: P2([1, 1.15, .6]),
  wave: [.12, -1.66, 0, .75, 1.2, .5], point: [.12, -1.66, 0, 1.65, .15, 0], pointup: [.12, -1.66, 0, .3, 1.65, 0], pointl: [1.65, .15, 0, .12, -1.66, 0],
  shrug: P2([1.05, -.2, 0]), hips: P2([.95, -1, 0]), think: [.12, -1.66, 0, -.05, .65, 0], cover: P2([.12, .72, 0]),
  hold: P2([-.05, -.7, 0]), clap: P2([-.12, -.55, .3]), stop: [.12, -1.66, 0, .9, .55, 0], reach: [.12, -1.66, 0, 1.5, .85, 0], hug: P2([-.4, -.9, 0]),
  ta: P2([1.1, -.45, 0]), run: P2([.55, -.5, 0]), tremble: P2([.15, -1.2, .12]), grab: P2([.55, .2, 0]),
};
const F = (eo, big, bs, bl, bt, mc, mo, mw, flap = 0) => [eo, big, bs, bl, bt, mc, mo, mw, flap];
export const FACE = {
  neutral: F(1, 0, 0, 0, 0, 0, 0, .28), happy: F(1, 0, 0, 0, 0, .9, 0, .42), grin: F(1, 0, 0, 0, 0, 1, .7, .52), laugh: F(.3, 0, 0, 0, 0, 1, 1, .6, 1),
  sad: F(1, 0, 1, .05, -.5, -.8, 0, .3), shock: F(1, 1, 1, .18, 0, 0, .9, .2), scream: F(1, 1, 1, .15, 0, 0, 1.2, .42, 1), worried: F(1, 0, 1, .08, -.45, -.35, 0, .32),
  angry: F(1, 0, 1, -.05, .6, -.6, .2, .34), smirk: F(1, 0, 1, 0, .2, .5, 0, .3), sleepy: F(.12, 0, 0, 0, 0, 0, .15, .2), think: F(1, 0, 1, .1, .2, -.1, 0, .2),
  awe: F(1, .6, 1, .2, 0, .6, .5, .3), flat: F(.55, 0, 0, 0, 0, 0, 0, .3), cry: F(.5, 0, 1, .05, -.6, -.9, .5, .4, 1), yawn: F(.2, 0, 0, 0, 0, 0, 1.1, .3),
};
const blend = (list, t, vec, def, dur = .25) => {
  let cur = def, prev = def, tc = -1e9;
  for (const [te, v] of list) { if (te <= t) { prev = cur; cur = v; tc = te; } else break; }
  const u = ease.o3(clamp((t - tc) / dur)), A = vec(prev), B = vec(cur); return A.map((x, i) => x + (B[i] - x) * u);
};
function ik(ax, ay, tx, ty, l1, l2, side) {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy); const mx = l1 + l2 - .002;
  if (d > mx) { tx = ax + dx * mx / d; ty = ay + dy * mx / d; dx = tx - ax; dy = ty - ay; d = mx; } d = Math.max(d, .25);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), bx = ax + dx / d * a, by = ay + dy / d * a, ux = dx / d, uy = dy / d;
  const c1 = [bx - uy * h, by + ux * h], c2 = [bx + uy * h, by - ux * h], sc = c => side * c[0] - c[1] * .6;
  return { e: sc(c1) > sc(c2) ? c1 : c2, h: [tx, ty] };
}

export class Actor {
  constructor(S, parent, o = {}) {
    this.S = S; this.o = o; this.ev = {}; this.g = new THREE.Group(); parent.add(this.g); this.ph = (o.seed ?? S.rnd()) * 6.28; this.dir = 1;
    const sk = o.skin || C.cream, shirt = o.shirt || C.blue, ink = o.ink || INK, hcol = o.hc || C.brown, lw = .09, ar = S.rnd;
    const ft = o.feat || ink; this.eyeCol = o.eyeCol || ft; this.ink = ink;
    // blink schedule
    const R = rng(Math.floor(this.ph * 1000)); this.bl = []; let tb = .6 + R() * 2; while (tb < 130) { this.bl.push(tb); tb += 2 + R() * 3.2; }
    const al = o.alpha; this.alpha = al;
    // legs (root space)
    this.legs = [-1, 1].map(() => ({ l: line(this.g, [[0, 0], [0, 0]], { stroke: ink, lw: .13 }), f: line(this.g, [[0, 0], [0, 0]], { stroke: ink, lw: .13 }) }));
    this.body = new THREE.Group(); this.g.add(this.body); const b = this.body;
    // torso
    const tp = o.dress ? chaikin([[-.42, SH], [.42, SH], [.72, -.2], [-.72, -.2]], 3, true, .22) : chaikin([[-.5, SH], [.5, SH], [.44, -.02], [-.44, -.02]], 3, true, .2);
    this.torso = shape(b, tp, { fill: shirt, stroke: ink, lw });
    if (o.collar !== false) { const nk = line(b, [[-.1, SH - .02], [0, SH - .13], [.1, SH - .02]], { stroke: ink, lw: .05 }); }
    this.arms = [-1, 1].map(() => line(b, [[0, 0], [0, 0]], { stroke: ink, lw: .13 }));
    // head
    this.head = new THREE.Group(); this.head.position.y = HEAD; b.add(this.head); const hd = this.head;
    const hairs = [].concat(o.hair || []), back = [], front = [];
    const dome = (k = 1) => [...arcP(.67, 12, 168, 22), [-.5, .3 * k + .06], [-.2, .42 * k], [.15, .33 * k], [.5, .34 * k]];
    for (const h of hairs) {
      if (h === 'puffs') [-1, 1].forEach(s => { const c = circle(hd, .22, hcol, { lw }); c.g.position.set(s * .64, .02, 0); });
      if (h === 'long') { const c = shape(hd, rrP(1.5, 1.9, .5), { fill: hcol, stroke: ink, lw }); c.g.position.set(0, -.4, 0); }
      if (h === 'curly') for (let a = 15; a <= 165; a += 30) { const c = circle(hd, .27, hcol, { lw }); c.g.position.set(Math.cos(a * D2R) * .62, Math.sin(a * D2R) * .6, 0); }
      if (h === 'bun') { const c = circle(hd, .26, hcol, { lw }); c.g.position.set(0, .86, 0); }
      if (h === 'ears') [-1, 1].forEach(s => { const c = shape(hd, [[s * .25, .55], [s * .72, .5], [s * .68, 1.1]], { fill: hcol, stroke: ink, lw }); });
      if (h === 'antenna') { line(hd, [[0, .6], [.05, 1.05]], { stroke: ink, lw: .07 }); const c = circle(hd, .13, C.red, { lw: .06 }); c.g.position.set(.05, 1.1, 0); }
    }
    this.skinS = circle(hd, .66, sk, { stroke: ink, lw });
    this.face = new THREE.Group(); hd.add(this.face);
    for (const h of hairs) {
      if (h === 'short' || h === 'bun' || h === 'long') shape(hd, dome(1), { fill: hcol, stroke: ink, lw });
      if (h === 'spiky') shape(hd, [...Array.from({ length: 9 }, (_, i) => { const a = (165 - i * 18) * D2R, q = i % 2 ? .66 : .98; return [Math.cos(a) * q, Math.sin(a) * q]; }), [.5, .34], [.15, .4], [-.2, .3], [-.5, .32]], { fill: hcol, stroke: ink, lw });
      if (h === 'cap') { shape(hd, dome(1.1), { fill: hcol, stroke: ink, lw }); shape(hd, chaikin([[.1, .36], [.95, .3], [.95, .18], [.1, .22]], 2, true), { fill: hcol, stroke: ink, lw }); }
      if (h === 'beanie') { shape(hd, [...arcP(.7, 8, 172, 22), [-.62, .28], [.62, .28]], { fill: hcol, stroke: ink, lw }); const pm = circle(hd, .17, C.cream, { lw: .07 }); pm.g.position.set(0, .8, 0); }
      if (h === 'beard') shape(hd, [...arcP(.665, 192, 348, 18), [.48, -.02], [.2, -.1], [-.2, -.1], [-.48, -.02]], { fill: hcol, stroke: ink, lw });
      if (h === 'stache') shape(hd, chaikin([[-.3, -.14], [0, -.08], [.3, -.14], [.2, -.24], [-.2, -.24]], 2), { fill: hcol, stroke: ink, lw: .05 });
    }
    const fg = this.face; this.eyes = [-1, 1].map(s => {
      const g = new THREE.Group(); g.position.set(s * .22, .08, 0); fg.add(g);
      const w = circle(g, .16, '#fff', { lw: .05 }), d = circle(g, .075, this.eyeCol, { lw: 0 }); return { g, w, d };
    });
    this.brows = [-1, 1].map(() => line(fg, [[0, 0], [0, 0]], { stroke: ft, lw: .065 }));
    this.mouth = shape(fg, [[0, 0], [0, 0], [0, 0]], { fill: o.mouthIn || '#7c2a35', stroke: ft, lw: .075 });
    if (o.glasses) [-1, 1].forEach(s => { const r = shape(fg, ellP(.2), { stroke: ink, lw: .06 }); r.g.position.set(s * .22, .08, 0); }); if (o.glasses) line(fg, [[-.03, .1], [.03, .1]], { stroke: ink, lw: .05 });
    if (o.blush) [-1, 1].forEach(s => { const r = circle(fg, .1, '#f4a3a0', { lw: 0 }); r.g.position.set(s * .42, -.12, 0); });
    // hands (on top)
    this.hand = [-1, 1].map(() => { const g = new THREE.Group(); b.add(g); circle(g, .13, ink, { lw: 0 }); return g; });
    if (o.accessory) o.accessory(this);
    this.g.scale.set(o.s ?? 1, o.s ?? 1, 1); this.g.position.set(o.x ?? 0, o.y ?? 0, 0); this.flip = o.flip || 1; if (o.flip) this.g.scale.x *= o.flip;
    if (al !== undefined) setAlpha(this.g, al);
    S.on(t => this.upd(this.clock ? this.clock(t) : t)); this.clock = o.clock;
  }
  at(t, obj) { for (const k in obj) { (this.ev[k] || (this.ev[k] = [])).push([t, obj[k]]); this.ev[k].sort((a, b) => a[0] - b[0]); } return this; }
  st(k, t, vec, def, dur) { return blend(this.ev[k] || [], t, vec, def, dur); }
  upd(t) {
    const pose = this.st('pose', t, v => (typeof v === 'string' ? POSE[v] : v), POSE.down), fa = this.st('face', t, v => (typeof v === 'string' ? FACE[v] : v), FACE.neutral, .18);
    const wv = this.st('walk', t, v => [v], 0, .3)[0], look = this.st('look', t, v => v, [0, 0], .22), tilt = this.st('tilt', t, v => [v], 0)[0], lean = this.st('lean', t, v => [v], 0, .3)[0];
    const sit = this.st('sit', t, v => [v], 0, .35)[0], air = this.st('air', t, v => [v], 0, .2)[0], shake = this.st('shake', t, v => [v], 0, .1)[0], sq = this.st('squash', t, v => [v], 0, .12)[0];
    const w = Math.abs(wv); if (w > .02) this.dir = Math.sign(wv);
    const x = this.g.position.x, c0 = (x * this.dir / 1.8) % 1, A = .45, wr = [0, 1].map(i => { const c = ((c0 + i * .5) % 1 + 1) % 1; let rel, lift; if (c < .5) { rel = A * (1 - 2 * c / .5); lift = 0; } else { const u = (c - .5) / .5; rel = -A + 2 * A * (.5 - .5 * Math.cos(Math.PI * u)); lift = Math.sin(Math.PI * u) * .38; } return [rel * this.dir, lift]; });
    const bob = Math.sin(t * 2.3 + this.ph) * .018 + w * Math.abs(Math.sin((c0) * 6.283)) * .07 - sit * .02;
    const sx = shake ? Math.sin(t * 70) * shake : 0, hy = HIP - sit + bob - sq * .35;
    this.body.position.set(sx, hy, 0); this.body.rotation.z = (lean + Math.sin(t * 1.4 + this.ph) * .5) * D2R; this.body.scale.set(1 + sq * .12, 1 - sq * .1 + Math.sin(t * 2.3 + this.ph) * .008, 1);
    // legs
    [-1, 1].forEach((s, i) => {
      const hx = s * .2 + sx, idle = [s * (.22 + .3 * sit), 0], wk = [s * .22 + wr[i][0], wr[i][1]], fx = lerp(idle[0], wk[0], w) + s * air * .15, fy = lerp(idle[1], wk[1], w) + air * .5 + sit * 0;
      const r = ik(hx, hy, fx, fy, UL, LL, s), L = this.legs[i]; L.l.set(spline([[hx, hy], r.e, r.h], 5)); L.f.set([[r.h[0], r.h[1] + .02], [r.h[0] + s * .26, r.h[1] + .02]]);
    });
    // arms (body space)
    [-1, 1].forEach((s, i) => {
      const k = i * 3, wg = pose[k + 2], swing = w * (-wr[1 - i][0]) * .55 * (pose === POSE.run ? 2 : 1), hx0 = s * .46 + s * pose[k] + s * Math.sin(t * 11 + i * 1.7) * wg + swing, hy0 = SH - .06 + pose[k + 1] + Math.cos(t * 11 + i * 1.7) * wg * .4 + (w * Math.abs(wr[i][1]) * .15);
      const r = ik(s * .46, SH - .06, hx0, hy0, UA, LA, s); this.arms[i].set(spline([[s * .46, SH - .06], r.e, r.h], 5)); this.hand[i].position.set(r.h[0], r.h[1], 0);
    });
    // head + face
    this.head.position.set(0, HEAD + Math.sin(t * 2.3 + this.ph + .5) * .01, 0); this.head.rotation.z = (tilt + look[0] * -3 + Math.sin(t * 1.1 + this.ph) * 1.2) * D2R; this.face.position.set(look[0] * .15, look[1] * .06, 0);
    let bl = 1; for (const b of this.bl) { if (t >= b && t < b + .16) { bl = 1 - Math.sin((t - b) / .16 * Math.PI); break; } if (b > t) break; }
    const [eo, big, bs, bl2, bt, mc, mo, mw, flap] = fa, op = Math.max(.07, eo * bl);
    this.eyes.forEach((e, i) => { e.g.scale.set(1, op, 1); e.w.g.visible = big > .05; e.w.g.scale.setScalar(Math.max(.01, big)); e.d.g.scale.setScalar(lerp(1, .8, big)); e.d.g.position.set(look[0] * .05, look[1] * .035, 0); });
    [-1, 1].forEach((s, i) => { const y = .36 + bl2, tl = bt * .12, B = this.brows[i]; B.g.visible = bs > .05; B.set([[s * .1, y - tl], [s * .36, y + tl]]); B.g.scale.y = bs; });
    const o = mo * (flap ? .45 + .55 * Math.abs(Math.sin(t * 15)) : 1), y0 = -.27, f = lerp(1, .3, clamp(o * 3)), N = 12, up = [], lo = [];
    for (let j = 0; j <= N; j++) { const u = -1 + 2 * j / N, xx = u * mw / 2; up.push([xx, y0 + mc * .14 * f * (u * u - .5)]); lo.push([xx, y0 + mc * .14 * (u * u - .5) - o * .3 * (1 - u * u) ** .6]); }
    this.mouth.set(up.concat(lo.reverse())); this.mouth.f.material.opacity = clamp(o * 8);
    if (this.alpha !== undefined) this.setAlpha(this.g, this.alpha);
  }
}
