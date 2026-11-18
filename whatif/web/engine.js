// Shared 2D cartoon engine: flat shapes + bold round-joined outlines, drawn as Three.js meshes (orthographic camera).
import * as THREE from 'three';
export { THREE };
export const W = 10.8, H = 19.2, INK = '#1b1c21', FONT = "Montserrat, 'Arial Black', Arial, sans-serif";
export const C = { ink: INK, cream: '#fdfcf6', wall: '#e8ece8', floor: '#dfc49f', wood: '#a86a3c', blue: '#2f6faa', green: '#7a9650', red: '#cf5340', yellow: '#e3a83c', sky: '#b9dcf2', grey: '#bdbbb0', night: '#161a33', purple: '#6b4fa0', pink: '#e58aa6', teal: '#3a9d9a', orange: '#e8843c', brown: '#7a4a2a', dark: '#2b2f3a', white: '#ffffff' };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const D2R = Math.PI / 180;

// ---------- easing + keyframes ----------
const bo = t => { const c = 2.70158; return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2; };
const bn = t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
export const ease = {
  l: t => t, i: t => t * t, o: t => 1 - (1 - t) ** 2, io: t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  i3: t => t ** 3, o3: t => 1 - (1 - t) ** 3, io3: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
  back: bo, bounce: bn, step: t => (t < 1 ? 0 : 1),
  el: t => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - .75) * 2.0944) + 1),
};
const hc = {};
const rgb = h => hc[h] || (hc[h] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
export const mixc = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
const mix = (a, b, e) => (typeof a === 'number' ? a + (b - a) * e : mixc(a, b, clamp(e)));
// keys: [[t,value,ease?],...]; ease belongs to the key being approached
export function kf(keys, t) {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 1; while (keys[i][0] < t) i++;
  const a = keys[i - 1], b = keys[i];
  return mix(a[1], b[1], (ease[b[2]] || ease.io3)((t - a[0]) / (b[0] - a[0])));
}
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- geometry helpers ----------
export const ellP = (rx, ry = rx, n) => { n = n || clamp(Math.round(Math.max(rx, ry) * 56), 20, 90); return Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [Math.cos(a) * rx, Math.sin(a) * ry]; }); };
export function rrP(w, h, r = .2, n = 8) {
  r = Math.min(r, w / 2, h / 2); const P = [], cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= n; i++) { const a = (a0 + i / n * 90) * D2R; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return P;
}
export function chaikin(pts, it = 2, closed = true, q = .25) {
  let P = pts;
  for (let k = 0; k < it; k++) {
    const R = [], n = P.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = P[i], b = P[(i + 1) % n]; R.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q], [a[0] + (b[0] - a[0]) * (1 - q), a[1] + (b[1] - a[1]) * (1 - q)]); }
    if (!closed) { R.unshift(P[0]); R.push(P[n - 1]); } P = R;
  }
  return P;
}
export function spline(P, sub = 8) { // open Catmull-Rom
  const R = [], n = P.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    for (let s = 0; s < sub; s++) { const t = s / sub, t2 = t * t, t3 = t2 * t; R.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); }
  }
  R.push(P[n - 1]); return R;
}
export const starP = (r, ir, n = 5, rot = 90) => Array.from({ length: n * 2 }, (_, i) => { const a = (rot + i * 180 / n) * D2R, q = i % 2 ? ir : r; return [Math.cos(a) * q, Math.sin(a) * q]; });
export const arcP = (r, a0, a1, n = 24, cx = 0, cy = 0, ry = r) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * D2R; return [cx + Math.cos(a) * r, cy + Math.sin(a) * ry]; });

// ---------- meshes ----------
let ORDER = 0;
export const setOrder = n => { ORDER = n; };
export const getOrder = () => ORDER;
const mat = (c, o = 1) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: o, depthTest: false, depthWrite: false, side: THREE.DoubleSide }); m.userData.o0 = o; return m; };
const dyn = (c, o) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat(c, o)); m.frustumCulled = false; m.renderOrder = ORDER++; return m; };
function upd(m, pos, idx) {
  const g = m.geometry, a = g.attributes.position;
  if (!a || a.array.length !== pos.length) g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); else { a.array.set(pos); a.needsUpdate = true; }
  if (!g.index || g.index.array.length !== idx.length) g.setIndex(new THREE.BufferAttribute(idx, 1)); else { g.index.array.set(idx); g.index.needsUpdate = true; }
}
const K = 12, UN = Array.from({ length: K }, (_, i) => [Math.cos(i / K * 6.28319), Math.sin(i / K * 6.28319)]);
function buildStroke(P, w, closed) {
  const n = P.length, r = w / 2, segs = closed ? n : n - 1, pos = new Float32Array((n * (K + 1) + segs * 4) * 3), idx = new Uint32Array(n * K * 3 + segs * 6);
  let v = 0, ii = 0;
  for (const [x, y] of P) {
    const c = v; pos.set([x, y, 0], v++ * 3);
    for (let k = 0; k < K; k++) pos.set([x + UN[k][0] * r, y + UN[k][1] * r, 0], v++ * 3);
    for (let k = 0; k < K; k++) { idx[ii++] = c; idx[ii++] = c + 1 + k; idx[ii++] = c + 1 + (k + 1) % K; }
  }
  for (let i = 0; i < segs; i++) {
    const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * r, ny = dx / l * r, s = v;
    pos.set([a[0] + nx, a[1] + ny, 0, a[0] - nx, a[1] - ny, 0, b[0] + nx, b[1] + ny, 0, b[0] - nx, b[1] - ny, 0], v * 3); v += 4;
    idx.set([s, s + 1, s + 2, s + 1, s + 3, s + 2], ii); ii += 6;
  }
  return [pos, idx];
}
function buildFill(P, holes = []) {
  const all = P.concat(...holes), tris = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), holes.map(h => h.map(p => new THREE.Vector2(p[0], p[1])))), pos = new Float32Array(all.length * 3), idx = new Uint32Array(tris.length * 3);
  all.forEach((p, i) => pos.set([p[0], p[1], 0], i * 3)); tris.forEach((t, i) => idx.set(t, i * 3));
  return [pos, idx];
}
// shape(parent, pts, {fill, stroke, lw, closed, o, holes}) -> {g, set(pts), fillC(c), strokeC(c)}
export function shape(p, pts, o = {}) {
  const n = { g: new THREE.Group(), o }; p.add(n.g);
  const closed = o.closed !== false;
  if (o.fill && closed) { n.f = dyn(o.fill, o.o); n.g.add(n.f); }
  if (o.lw !== 0 && o.stroke !== null) { n.l = dyn(o.stroke || INK, o.o); n.g.add(n.l); }
  n.set = (P, holes) => {
    if (n.f) upd(n.f, ...buildFill(P, holes || o.holes));
    if (n.l && P.length > 1) upd(n.l, ...buildStroke(P, o.lw ?? .09, closed));
    n.pts = P; return n;
  };
  n.fillC = c => n.f && n.f.material.color.set(c); n.strokeC = c => n.l && n.l.material.color.set(c);
  return n.set(pts);
}
export const line = (p, pts, o = {}) => shape(p, pts, { closed: false, lw: .12, ...o });
export const circle = (p, r, fill, o = {}) => shape(p, ellP(r), { fill, ...o });
export const ell = (p, rx, ry, fill, o = {}) => shape(p, ellP(rx, ry), { fill, ...o });
export const rect = (p, w, h, fill, o = {}) => shape(p, rrP(w, h, o.r ?? .08, 5), { fill, ...o });
export const poly = (p, pts, fill, o = {}) => shape(p, pts, { fill, ...o });
// union of circles with one outer outline (clouds, bushes, curls)
export function blobs(p, cs, fill, o = {}) {
  const lw = o.lw ?? .09, g = new THREE.Group(); p.add(g);
  if (lw) for (const [x, y, r] of cs) { const s = shape(g, ellP(r + lw / 2), { fill: o.stroke || INK, lw: 0 }); s.g.position.set(x, y, 0); }
  for (const [x, y, r] of cs) { const s = shape(g, ellP(r), { fill, lw: 0 }); s.g.position.set(x, y, 0); }
  return { g };
}
export function setAlpha(g, a) {
  if (g.userData.al === a) return; g.userData.al = a;
  g.traverse(m => { if (m.material) m.material.opacity = (m.material.userData.o0 ?? 1) * a; });
}

// ---------- text (canvas texture on a plane) ----------
const PX = 150;
export function text(p, str, o = {}) {
  const n = { g: new THREE.Group() }, plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat('#fff')); plane.renderOrder = ORDER++; plane.frustumCulled = false; n.g.add(plane); p.add(n.g);
  n.set = s => {
    const size = o.size ?? 1, fp = size * PX, sw = (o.sw ?? 0) * PX, lines = String(s).split('\n'), pad = sw + 6, cv = document.createElement('canvas'), cx = cv.getContext('2d');
    const font = `${o.weight ?? 800} ${fp}px ${FONT}`; cx.font = font; const ww = Math.max(...lines.map(l => cx.measureText(l).width)), lh = fp * (o.lh ?? 1.15);
    cv.width = Math.ceil(ww + pad * 2); cv.height = Math.ceil(lh * lines.length + pad * 2); cx.font = font; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
    lines.forEach((l, i) => { const y = pad + lh * (i + .5) + fp * .04; if (sw) { cx.strokeStyle = o.stroke || INK; cx.lineWidth = sw * 2; cx.strokeText(l, cv.width / 2, y); } cx.fillStyle = o.color || '#fff'; cx.fillText(l, cv.width / 2, y); });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.anisotropy = 4;
    if (plane.material.map) plane.material.map.dispose(); plane.material.map = tex; plane.material.color.set('#fff'); plane.material.needsUpdate = true;
    plane.scale.set(cv.width / PX, cv.height / PX, 1); const al = o.align || 'center'; plane.position.x = al === 'left' ? cv.width / PX / 2 : al === 'right' ? -cv.width / PX / 2 : 0; n.w = cv.width / PX; n.h = cv.height / PX;
    return n;
  };
  return n.set(str);
}

// ---------- scene (one story beat) ----------
export class Scene {
  constructor(ep, spec, i, tl, props) {
    Object.assign(this, { ep, spec, i, start: tl.start, dur: tl.dur, pal: ep.pal || {}, P: props });
    this.root = new THREE.Group(); this.w = new THREE.Group(); this.ui = new THREE.Group(); this.root.add(this.w, this.ui);
    this.ups = []; this.mvs = []; this.ck = {}; this.pars = []; this.rnd = rng((ep.seed || 1) * 977 + i * 131 + 7);
  }
  on(fn) { this.ups.push(fn); return this; }
  tw(keys, fn) { this.ups.push(t => fn(kf(keys, t))); return this; }
  add(name, o = {}) { const f = this.P[name]; if (!f) throw new Error('unknown prop ' + name); const n = f(this, o.parent || this.w, o); this.place(n, o); return n; }
  actor(o = {}) { return this.P.actor(this, o.parent || this.w, o); }
  bg(kind, o) { return this.P.bg(this, kind, o); }
  place(n, o) { if (!n || !n.g) return n; const g = n.g; if (o.x !== undefined) g.position.x = o.x; if (o.y !== undefined) g.position.y = o.y; if (o.s !== undefined) g.scale.set(o.s * (o.flip || 1), o.s, 1); else if (o.flip) g.scale.x *= o.flip; if (o.r) g.rotation.z = o.r * D2R; if (o.a !== undefined) setAlpha(g, o.a); n.flip = o.flip || 1; return n; }
  // mv(node,{x,y,s,sx,sy,r,o: keys})  (r in degrees)
  mv(n, spec, clock) {
    if (clock) n.clock = clock;
    if (!n.tr) { const g = n.g; n.tr = { x: g.position.x, y: g.position.y, s: Math.abs(g.scale.y) || 1, sx: 1, sy: 1, r: g.rotation.z / D2R, o: 1 }; n.k = {}; this.mvs.push(t => { if (n.clock) t = n.clock(t); for (const k in n.k) n.tr[k] = kf(n.k[k], t); const T = n.tr; g.position.set(T.x, T.y, 0); g.rotation.z = T.r * D2R; g.scale.set(T.s * T.sx * (n.flip || 1), T.s * T.sy, 1); if (n.k.o) setAlpha(g, T.o); }); }
    Object.assign(n.k, spec); return n;
  }
  cam(spec) { Object.assign(this.ck, spec); return this; }
  par(n, k) { n.pk = k; n.pb = [n.g.position.x, n.g.position.y]; this.pars.push(n); return n; }
  chip(str, o = {}) {
    const g = new THREE.Group(), t = text(g, str, { size: o.size ?? .62, color: '#fff' }), w = t.w + .7, r = rect(g, w, 1.1, o.color || C.red, { r: .55, lw: 0 });
    g.position.set(o.x ?? -W / 2 + .45 + w / 2, o.y ?? H / 2 - 1.5, 0); this.ui.add(g); const t0 = o.t ?? .3;
    t.g.children[0].renderOrder = ORDER++; this.on(t1 => { const s = ease.back(clamp((t1 - t0) / .4)) * (1 - ease.i(clamp((t1 - (t0 + (o.hold ?? 4)) ) / .25))); g.scale.setScalar(Math.max(.0001, s)); });
    return { g };
  }
  blink(times, o = {}) { // eyelids close over the whole frame at each time (ui layer)
    const a = rect(this.ui, W * 2, H, o.col || INK, { lw: 0, r: 0 }), b = rect(this.ui, W * 2, H, o.col || INK, { lw: 0, r: 0 });
    this.on(t => { let c = 0; for (const x of times) { const u = (t - x) / (o.d ?? .3); if (u > 0 && u < 1) c = Math.max(c, Math.sin(Math.PI * u) ** .7); } a.g.position.y = H - c * H / 2; b.g.position.y = -(H - c * H / 2); });
    return this;
  }
  flash(t0, d = .35, col = '#fff') { const r = rect(this.ui, W * 2, H * 2, col, { lw: 0, r: 0 }); this.on(t => setAlpha(r.g, (1 - ease.o(clamp((t - t0) / d))) * (t >= t0 ? .9 : 0))); return r; }
  update(t) {
    for (const f of this.mvs) f(t); for (const f of this.ups) f(t);
    const k = this.ck, v = (n, d) => (k[n] ? kf(k[n], t) : d), z = v('z', 1), r = v('r', 0) * D2R, cx = v('x', 0), cy = v('y', 0), sh = v('sh', 0);
    const ox = sh * (Math.sin(t * 61) * Math.cos(t * 37)), oy = sh * Math.cos(t * 53) * Math.sin(t * 29), cs = Math.cos(-r), sn = Math.sin(-r), X = cx + ox, Y = cy + oy;
    this.w.rotation.z = -r; this.w.scale.setScalar(z); this.w.position.set(-(cs * X - sn * Y) * z, -(sn * X + cs * Y) * z, 0);
    for (const n of this.pars) n.g.position.set(n.pb[0] + cx * n.pk, n.pb[1] + cy * n.pk, 0);
  }
}
