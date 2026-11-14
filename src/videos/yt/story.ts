// Timeline of "The Brutal Truth About YouTube", timed to yt/voice/words.json (Kokoro am_michael, 1.2x, 60.4 s).
// Same engine + camera grammar as aging/story.ts: smootherstep glides, hard cuts on big jumps, every hold creeps in,
// impact kicks flip sign every frame for 7 f. Metres, y up, camera looks +z from negative z, story +x is screen-LEFT.
// Every visual reaction lands 0-3 frames before its word. No captions or labels anywhere (icons and scribbles only).
export const FPS = 30;
export const TOTAL = 1845;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

export type Light = "day" | "golden";
export type SetId = "desk" | "explain" | "crowd" | "bed";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetId; tau: (t: number) => number };
const S = (id: number, a: number, b: number, light: Light, set: SetId): ShotDef => ({ id, a, b, light, set, tau: (t) => t });
export const SHOTS: ShotDef[] = [
  S(1, 0, 173, "day", "desk"), S(2, 173, 250, "day", "desk"), S(3, 250, 319, "day", "desk"), S(4, 319, 383, "day", "desk"),
  S(5, 383, 442, "day", "desk"), S(6, 442, 483, "day", "desk"), S(7, 483, 520, "day", "desk"), S(8, 520, 546, "day", "desk"),
  S(9, 546, 649, "day", "explain"), S(10, 649, 697, "day", "explain"), S(11, 697, 770, "day", "desk"), S(12, 770, 826, "day", "desk"),
  S(13, 826, 876, "day", "desk"), S(14, 876, 941, "day", "crowd"), S(15, 941, 1036, "day", "desk"), S(16, 1036, 1214, "day", "explain"),
  S(17, 1214, 1301, "day", "explain"), S(18, 1301, 1373, "day", "explain"), S(19, 1373, 1463, "golden", "desk"), S(20, 1463, 1495, "golden", "desk"),
  S(21, 1495, 1558, "golden", "desk"), S(22, 1558, 1691, "golden", "bed"), S(23, 1691, TOTAL, "day", "desk"),
];
export const XFADE: Record<number, number> = { 19: 8, 22: 8, 23: 8 };
export const FLASH_AT = 171;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story state (consumed by cast.ts) ----------------
/** viewer-count screen: how many of the 12 icons are visible (n) and how many show the hero's own face (k) */
export const viewers = (f: number) => {
  const n = Math.round(12 * smooth((f - 322) / 22)), k = f < 349 ? 0 : Math.round(11 * smooth((f - 349) / 14));
  return { n: f >= 322 ? n : 0, k };
};
/** what the hero's thumbnail card looks like: 0 plain, 1 bigger face + yellow, 2 shocked + red arrow */
export const thumbStage = (f: number) => (f < 383 ? 0 : f < 442 ? 1 : f < 697 ? 1 : 2);
/** hero hair colour per frame (haircut beats) */
export const hairAt = (f: number) => (f < 483 ? "#3a2a22" : f < 497 ? "#3a2a22" : f < 520 ? "#4aa3e8" : "#3a2a22");
/** explainer: subs meter 0..1 (1106-1138 word "thousand subscribers"), watch-hour clock 0..1 (1154-1196) */
export const subsK = (f: number) => smooth((f - 1100) / 38);
export const hoursK = (f: number) => smooth((f - 1150) / 46);
/** graph 0..1 (shot 12 take-off) */
export const graphK = (f: number) => smooth((f - 772) / 36);
/** shot 15: calendar squares filled 0..35 */
export const calN = (f: number) => Math.round(35 * smooth((f - 985) / 40));
/** shot 21: channel bar vs joy */
export const grow = (f: number) => smooth((f - 1497) / 40);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixc = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 30) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const ROLL = 0.08;
/** one camera key: dolly toward `look` from `f` at `rate` per frame; `cut` = hard cut, else glide `dur` frames (centred on f) */
type K = { f: number; pos: V3; look: V3; fov?: number; rate?: number; roll?: number; cut?: boolean; dur?: number; punch?: number };
const key = (k: K) => ({ f: k.cut === false ? k.f - (k.dur ?? 24) / 2 : k.f, cut: k.cut ?? true, dur: k.dur, s: (f: number) => dolly(k.pos, k.look, pushK(f, k.f, k.rate ?? 0.002, k.punch ?? 0), { fov: k.fov ?? 38, roll: k.roll ?? 0 }) });
const first = (k: K) => ({ ...key(k), cut: false });
const glideTo = (k: K) => key({ ...k, cut: false, dur: k.dur ?? 22 });

// Desk rig: hero seated at [0,.45,.3], wall screen at z=2.4 (x 0, y 2.0, 3.6 x 2.0), ring light x=+1.3, desk z=-.4.
const EYE: V3 = [0, 1.45, 0.3];
const CAMS: Record<number, ReturnType<typeof key>[]> = {
  1: [first({ f: 0, pos: [0.35, 1.5, -2.7], look: EYE, fov: 34, rate: 0.0022 }), glideTo({ f: 70, pos: [0.35, 1.5, -2.7], look: EYE, fov: 34, roll: ROLL, dur: 20 }), glideTo({ f: 100, pos: [0.9, 1.9, -6.2], look: [0, 1.7, 1], fov: 44, dur: 40, rate: 0.0015 })],
  2: [first({ f: 173, pos: [-1.2, 1.5, -4.2], look: [0, 1.5, 0.6], fov: 40 })],
  3: [first({ f: 250, pos: [2.2, 1.5, -4.8], look: [0.6, 1.4, 0.6], fov: 42 }), glideTo({ f: 280, pos: [1.3, 1.5, -3.2], look: [0.9, 1.45, 0.6], fov: 36, dur: 20 })],
  4: [first({ f: 319, pos: [0, 1.9, -4.4], look: [0, 1.95, 2.4], fov: 34, rate: 0.0025 }), glideTo({ f: 349, pos: [0, 1.9, -4.4], look: [0, 1.95, 2.4], fov: 34, roll: -ROLL, dur: 16 })],
  5: [first({ f: 383, pos: [0.3, 1.6, -2.4], look: [0, 1.5, 0.4], fov: 32, rate: 0.0028 })],
  6: [first({ f: 442, pos: [-0.8, 1.6, -3.0], look: [0, 1.5, 0.4], fov: 34, rate: 0.0028 })],
  7: [first({ f: 483, pos: [0.3, 1.8, -1.9], look: [0, 1.75, 0.3], fov: 32, rate: 0.003 })],
  8: [first({ f: 520, pos: [0, 1.9, -4.0], look: [0, 1.95, 2.4], fov: 34, rate: 0.0025 })],
  9: [first({ f: 546, pos: [0, 1.5, -8.5], look: [0, 1.5, 0], fov: 38, rate: 0.0016 }), glideTo({ f: 600, pos: [0.4, 1.4, -6.2], look: [-0.6, 1.4, 0], fov: 38, dur: 30 })],
  10: [first({ f: 649, pos: [0, 1.5, -7.0], look: [0, 1.5, 0], fov: 38, rate: 0.003, punch: 0.006 })],
  11: [first({ f: 697, pos: [0.6, 1.5, -3.6], look: [0, 1.4, 0.4], fov: 38, rate: 0.002 }), glideTo({ f: 735, pos: [0.2, 1.5, -2.2], look: [0, 1.5, 0.4], fov: 32, dur: 20 })],
  12: [first({ f: 770, pos: [0, 2.0, -5.2], look: [0, 2.0, 2.4], fov: 36, rate: 0.002 }), glideTo({ f: 800, pos: [0, 2.0, -4.2], look: [0, 2.2, 2.4], fov: 34, roll: ROLL, dur: 22 })],
  13: [first({ f: 826, pos: [0.2, 1.5, -2.8], look: EYE, fov: 34, rate: 0.003, punch: 0.006 })],
  14: [first({ f: 876, pos: [0, 1.2, -7.0], look: [0, 1.6, 4], fov: 46, rate: 0.0016 })],
  15: [first({ f: 941, pos: [-1.0, 1.6, -3.4], look: [0, 1.4, 0.5], fov: 40, rate: 0.002 }), glideTo({ f: 985, pos: [0.4, 1.8, -5.2], look: [0, 1.9, 1.6], fov: 40, dur: 30 })],
  16: [first({ f: 1036, pos: [0, 1.5, -9], look: [0, 1.5, 0], fov: 36, rate: 0.0012 })],
  17: [first({ f: 1214, pos: [0, 1.5, -8], look: [0, 1.5, 0], fov: 36, rate: 0.0018 })],
  18: [first({ f: 1301, pos: [0, 1.4, -7.5], look: [0, 1.4, 0], fov: 36, rate: 0.002 })],
  19: [first({ f: 1373, pos: [1.6, 1.4, -3.8], look: [0, 1.4, 0.4], fov: 40, rate: 0.002 }), glideTo({ f: 1420, pos: [-0.2, 1.5, -2.6], look: [0, 1.5, 0.3], fov: 34, dur: 24 })],
  20: [first({ f: 1463, pos: [0.2, 1.5, -2.0], look: EYE, fov: 32, rate: 0.004 })],
  21: [first({ f: 1495, pos: [0, 1.5, -6.5], look: [0, 1.2, 0], fov: 38, rate: 0.002 })],
  22: [first({ f: 1558, pos: [-1.4, 0.8, -4.6], look: [0, 0.9, 0], fov: 40, rate: 0.0016 }), glideTo({ f: 1640, pos: [-0.6, 1.0, -3.0], look: [0, 1.1, 0], fov: 34, dur: 30 })],
  23: [first({ f: 1691, pos: [0.4, 1.5, -3.6], look: EYE, fov: 36, rate: 0.0018 }), glideTo({ f: 1756, pos: [0, 1.9, -4.4], look: [0, 1.95, 2.4], fov: 34, dur: 28 })],
};
const KICKS: [number, number][] = [[364 / FPS, 1], [826 / FPS, 0.9], [1496 / FPS, 0.8], [1796 / FPS, 1]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
const run = (keys: ReturnType<typeof key>[], f: number): Cam => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixc(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (): V3 => EYE;
export const DOF: Dof[] = [
  { f: 0, cInf: 14, focus: eyes }, { f: 100, dur: 30, cInf: 0 }, { f: 173, cInf: 10, focus: eyes }, { f: 250, cInf: 10 }, { f: 319, cInf: 8 },
  { f: 383, cInf: 13, focus: eyes }, { f: 442, cInf: 12, focus: eyes }, { f: 483, cInf: 14, focus: eyes }, { f: 520, cInf: 8 },
  { f: 546, cInf: 0 }, { f: 697, cInf: 12, focus: eyes }, { f: 770, cInf: 6 }, { f: 826, cInf: 13, focus: eyes }, { f: 876, cInf: 0 },
  { f: 941, cInf: 10 }, { f: 1036, cInf: 0 }, { f: 1373, cInf: 8 }, { f: 1463, cInf: 14, focus: eyes }, { f: 1495, cInf: 0 }, { f: 1558, cInf: 7 }, { f: 1691, cInf: 12, focus: eyes },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
