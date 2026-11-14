// Timeline of the aging short ("body stuck at 19, brain keeps aging"), timed to aging/voice/words.json (66.5 s, 1.2x Kokoro).
// Shot table and camera grammar follow aging/SHOTPLAN.md and the bridge story.ts: continuous slow push-ins, symmetric
// smootherstep glides of 18-40 f, big reframes are hard cuts, impact kicks flip sign every frame for 7 f, no hand-held float.
// World units: metres, y up, every set is built around its own origin. The hero stands at [0,0,0] (eye 1.6 m) unless a
// moving function below says otherwise; the camera mostly looks along +z from negative z.
// Every visual reaction should land 0-3 frames before its word.
export const FPS = 30;
export const TOTAL = 2025;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- sets, shots ----------------
export type Light = "day" | "golden";
export type SetId = "street" | "bathroom" | "cafe" | "bar" | "track" | "kitchen" | "fridge" | "explain" | "slowmo" | "books" | "car" | "crowd" | "restaurant" | "bench" | "field" | "skyline";
export type Age = "young" | "tired" | "grey" | "old";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetId; tau: (t: number) => number };
// tau = shot-local story time in seconds (t = seconds since the shot's first frame)
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 130, light: "day", set: "street", tau: (t) => t },
  { id: 2, a: 130, b: 247, light: "day", set: "bathroom", tau: (t) => t },
  { id: 3, a: 247, b: 345, light: "day", set: "cafe", tau: (t) => t },
  { id: 4, a: 345, b: 487, light: "golden", set: "bar", tau: (t) => t },
  { id: 5, a: 487, b: 604, light: "day", set: "track", tau: (t) => t },
  { id: 6, a: 604, b: 744, light: "day", set: "track", tau: (t) => t },
  { id: 7, a: 744, b: 852, light: "day", set: "kitchen", tau: (t) => t },
  { id: 8, a: 852, b: 915, light: "day", set: "kitchen", tau: (t) => t },
  { id: 9, a: 915, b: 1030, light: "day", set: "fridge", tau: (t) => t },
  { id: 10, a: 1030, b: 1172, light: "day", set: "explain", tau: (t) => t },
  { id: 11, a: 1172, b: 1259, light: "day", set: "slowmo", tau: (t) => t },
  { id: 12, a: 1259, b: 1360, light: "day", set: "books", tau: (t) => t },
  { id: 13, a: 1360, b: 1502, light: "golden", set: "car", tau: (t) => t },
  { id: 14, a: 1502, b: 1620, light: "day", set: "crowd", tau: (t) => t },
  { id: 15, a: 1620, b: 1726, light: "day", set: "restaurant", tau: (t) => t },
  { id: 16, a: 1726, b: 1860, light: "golden", set: "bench", tau: (t) => t },
  { id: 17, a: 1860, b: 1925, light: "golden", set: "field", tau: (t) => t },
  { id: 18, a: 1925, b: TOTAL, light: "golden", set: "skyline", tau: (t) => t },
];
/** crossfades (frames) at light / place changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 4: 8, 13: 8, 16: 8 };
export const FLASH_AT = 128;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- cast layout + story motion (consumed by cast.ts / build.ts / world.ts) ----------------
export const HERO_EYE = 1.6;
/** actor anchor points per set (x, y = ground, z); names are the roles cast.ts must provide */
export const LAYOUT: Record<SetId, Record<string, V3>> = {
  street: { hero: [0, 0, 0] },
  bathroom: { hero: [0, 0, 0], mirror: [0, 1.5, 0.9] },
  cafe: { hero: [0, 0, 0], friendA: [-1.5, 0, 0.5], friendB: [1.4, 0, 0.6], bouncer: [3.0, 0, 0.9], door: [3.2, 0, 1.6] },
  bar: { hero: [0, 0, 0], friendA: [-1.4, 0, -0.9], friendB: [-2.8, 0, -1.8], bouncer: [1.0, 0, 0.5], door: [1.9, 0, 0.9] },
  track: { hero: [0, 0, 0], tape: [20.6, 0, 0], bench: [8, 0, 3.5] },
  kitchen: { hero: [0, 0, 0], caneRack: [3.6, 0, 0.8], fridge: [-2.6, 0, 1.0] },
  fridge: { hero: [0, 0, 0], fridge: [0, 0, 1.2] },
  explain: { hero: [0, 0, 6], brainL: [-1.4, 1.4, 0], brainR: [1.4, 1.4, 0] },
  slowmo: { hero: [0, 0, 0], snail: [-3, 0, 0.3], holes: [1.2, 1.5, 0.8] },
  books: { hero: [-0.5, 0, 0], tower: [0.95, 0, 0.5] },
  car: { car: [0, 0, 0], grandpa: [0.35, 0.7, 0.1] },
  crowd: { hero: [0, 0, 0], mother: [1.5, 0, 0.4], walkerA: [-3, 0, 1.2], walkerB: [3, 0, 1.6] },
  restaurant: { hero: [0, 0, 0], waiter: [1.4, 0, 0.3], menu: [0.1, 0.85, 0.35] },
  bench: { hero: [0, 0, 0] },
  field: { hero: [-0.5, 0, -0.2], fieldCard: [3, 0, 14] },
  skyline: { hero: [0, 0, 0], kidA: [-2.8, 0, 1.0], kidB: [2.6, 0, 1.4] },
};
/** age of the hero's friends / bouncer's line per set (cast.ts picks face + hair + bags) */
export const FRIEND_AGE: Partial<Record<SetId, Age>> = { cafe: "tired", bar: "grey" };
/** hero x on the track: sprint 5.5 m/s, skid stop near "forgot" (shot 5), long run and stop near "starting line" (shot 6) */
export const heroX = (id: number, tau: number) =>
  id === 5 ? lin([[0, 0], [2.0, 11], [2.4, 12.1]], tau) : id === 6 ? lin([[0, 0], [3.0, 16.5], [3.4, 17.5]], tau) : 0;
/** shot 10: exaggerated shrink of the right brain card, 5 steps (one per decade beat, 5 % each in life, 7 % on screen) */
export const BRAIN_TICKS = [1.4, 1.9, 2.4, 2.9, 3.4];
export const brainScale = (tau: number) => 1 - 0.072 * BRAIN_TICKS.reduce((s, t) => s + smooth((tau - t) / 0.2), 0);
/** shot 11: hero moves at a quarter of real speed, the snail glides past him */
export const slowT = (tau: number) => 0.25 * tau;
export const snailX = (tau: number) => -3 + 1.9 * tau;
/** shot 12: book tower height (m), +1 step per beat */
export const bookH = (tau: number) => lin([[0, 0.6], [0.8, 2.0], [1.6, 3.6], [2.4, 5.5], [3.03, 7.5]], tau);

// ---------------- camera ----------------
// Glides are centred on the old key frame (the whoosh in the sound mix peaks there), so a glide key starts dur/2 earlier.
// Holds push in (dolly toward the look point or a fov zoom): 0.15-0.35 %/f, ~0.6 %/f for ~35 f on punch words.
// Rolls of 4-8 deg over >= 18 f on emphasis beats, held tilt <= 0.08 rad.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const tauOf = (id: number, f: number) => SHOTS[id - 1].tau(T(f - SHOTS[id - 1].a));
const HX = (id: number, f: number) => heroX(id, tauOf(id, f));
/** push-in factor since f0 with optional punch (raised rate for the first n frames, 8 f soft edges) */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const ROLL = 0.08; // 4.6 deg

// shot 1 (hook, 0-122): CU of the hero's face with a roll punch on "brain" (~85), then pull back to the street
const S1a = (f: number) => dolly([0.4, 1.65, -2.6], [0, 1.62, 0], pushK(f, 0, 0.0025), { fov: 34 });
const S1b = (f: number) => ({ pos: [3, 2.2, -7] as V3, look: [0, 1.4, 0] as V3, fov: 44 });
// shot 2 (bathroom, 134-241): mirror MS -> low on the knees ("No bad knees" ~175) -> hair CU ("Hair" ~215)
const S2a = (f: number) => dolly([0.5, 1.5, -3.2], [0, 1.45, 0], pushK(f, 134, 0.002), { fov: 38 });
const S2b = (f: number) => dolly([0.6, 0.5, -2.6], [0, 0.5, 0], pushK(f, 165, 0.002));
const S2c = (f: number) => dolly([0.3, 1.85, -1.6], [0, 1.82, 0], pushK(f, 213, 0.003), { fov: 32 });
// shot 3 (cafe, 253-343): MS friends and hero -> cut on "carded" (~330) to the ID card CU, kick at the stamp
const S3a = (f: number) => dolly([1.5, 1.5, -5.5], [0, 1.4, 0], pushK(f, 247, 0.0022), { fov: 42 });
const S3b = (f: number) => dolly([0.4, 1.5, -1.6], [0.1, 1.35, 0], pushK(f, 330, 0.003), { fov: 30 });
// shot 4 (bar at dusk, 347-482): low 3/4 on the line -> bouncer face ("bouncer" ~395) -> roll on "old enough" (~455)
const S4a = (f: number) => dolly([-2.2, 0.9, -5.5], [0.2, 1.3, 0], pushK(f, 345, 0.002), { fov: 44 });
const S4b = (f: number) => dolly([-0.6, 1.7, -2.4], [0.9, 1.75, 0.2], pushK(f, 383, 0.0025), { fov: 34 });
// shot 5 (track, "At seventy" 491-599): side tracking view riding with the hero, cut to the face on "forgot" (~560)
const S5a = (f: number) => { const x = HX(5, f); return dolly([x + 1.0, 1.1, -6], [x + 0.5, 1.0, 0], pushK(f, 487, 0.0015), { fov: 42 }); };
const S5b = (f: number) => { const x = HX(5, f); return dolly([x + 0.5, 1.65, -2.2], [x, 1.62, 0], pushK(f, 556, 0.003), { fov: 32 }); };
// shot 6 (track, "At ninety" 614-738): same side ride, cut to the back of the head on "starting line" (~705)
const S6a = (f: number) => { const x = HX(6, f); return dolly([x + 1.0, 1.1, -6], [x + 0.5, 1.0, 0], pushK(f, 604, 0.0015), { fov: 44 }); };
const S6b = (f: number) => { const x = HX(6, f); return dolly([x - 2.2, 1.65, -1.2], [x + 0.5, 1.6, 0], pushK(f, 701, 0.003), { fov: 34 }); };
// shot 7 (kitchen, 749-850): MS front, roll on "no idea" (~820)
const S7a = (f: number) => dolly([0.4, 1.5, -4.2], [0, 1.4, 0], pushK(f, 744, 0.0022), { fov: 38 });
// shot 8 ("Luckily" 850-908): side MS, glide closer as he passes the cane rack (~880)
const S8a = (f: number) => dolly([-3.5, 1.3, -4.5], [0.5, 1.2, 0], pushK(f, 852, 0.0015));
const S8b = (f: number) => dolly([-2.2, 1.2, -3.2], [1.5, 1.1, 0], pushK(f, 872, 0.002), { fov: 38 });
// shot 9 (fridge, 925-1025): CU, push punch on "fridge" (~1005), kick
const S9a = (f: number) => dolly([0.2, 1.4, -4.2], [0, 1.35, 0], pushK(f, 915, 0.002), { fov: 38 });
const S9b = (f: number) => dolly([0.05, 1.45, -2.6], [0, 1.4, 0], pushK(f, 996, 0.004), { fov: 32 });
// shot 10 (explainer, 1036-1164): locked front, creep only
const S10a = (f: number) => dolly([0, 1.25, -9.5], [0, 1.25, 0], pushK(f, 1030, 0.0012), { fov: 36 });
// shot 11 (slow motion, 1178-1256): MS, roll on "Memory" (~1222)
const S11a = (f: number) => dolly([1.2, 0.9, -4], [0, 0.8, 0], pushK(f, 1172, 0.0022));
// shot 12 (book tower, 1262-1353): crane up with the growing tower
const S12a = (f: number): Shot => { const u = glide((f - 1259) / 90); return { pos: [1.5, 0.4 + 4 * u, -5], look: [0, 0.8 + 3.5 * u, 0], fov: 42 }; };
// shot 13 (sports car, 1367-1495): wide 3/4, cut to the driver on "confused" (~1460)
const S13a = (f: number) => dolly([3.2, 0.95, -6.5], [0.3, 0.7, 0], pushK(f, 1360, 0.002), { fov: 42 });
const S13b = (f: number) => dolly([1.0, 1.4, -2.2], [0.3, 1.2, 0.2], pushK(f, 1456, 0.003), { fov: 32 });
// shot 14 (crowd ignores him, 1508-1612): MS, roll on "Nobody" (~1555)
const S14a = (f: number) => dolly([0.8, 1.5, -5], [0, 1.4, 0], pushK(f, 1502, 0.002));
// shot 15 (restaurant, 1627-1723): two-shot, cut to the crayon menu on "menu" (~1700)
const S15a = (f: number) => dolly([1.0, 2.0, -4.6], [0, 0.9, 0], pushK(f, 1620, 0.002));
const S15b = (f: number) => dolly([0.3, 1.6, -1.8], [0.1, 0.85, 0], pushK(f, 1696, 0.003), { fov: 32 });
// shot 16 (bench, 1723-1852): low 3/4, slow creep, a long hold
const S16a = (f: number) => dolly([-2.2, 0.7, -4.5], [0, 1.0, 0], pushK(f, 1726, 0.0015));
// shot 17 (field, 1865-1916): over the hero's shoulder, glide wider on "all a field" (~1890)
const S17a = (f: number) => dolly([-1.5, 1.9, -3.5], [1.5, 2.0, 10], pushK(f, 1860, 0.0012), { fov: 46 });
const S17b = (f: number) => ({ pos: [-1.3, 1.9, -3.0] as V3, look: [2.5, 1.8, 14] as V3, fov: 50 });
// shot 18 (skyline, 1931-2025): MS on the bench, then crane out on its own path (93 f, whoosh at the start)
const S18a = (f: number) => dolly([0, 1.1, -5], [0, 1.0, 0], pushK(f, 1925, 0.0015));
const S18c = (f: number): Shot => {
  const s = glide((f - 1962) / 63), a = S18a(1962), r = 1 - s;
  const ctrl: V3 = [4, 8, -16], B: V3 = [6, 14, -26], L: V3 = [0, 2, 10];
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * ctrl[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: 40 + 6 * s, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 70, dur: 22, s: rolled(S1a, ROLL) }, // roll punch on "brain"
    { f: 100, dur: 24, s: S1b }, // pull back to the street before the flash
  ],
  2: [
    { f: 130, s: S2a }, // cut after the flash
    { f: 165, dur: 18, s: S2b },
    { f: 210, cut: true, s: S2c }, // hair
  ],
  3: [
    { f: 247, s: S3a },
    { f: 330, cut: true, s: S3b }, // "carded" (+ kick)
  ],
  4: [
    { f: 345, s: S4a },
    { f: 383, dur: 22, s: S4b },
    { f: 445, dur: 20, s: rolled(S4b, -ROLL) }, // "old enough"
  ],
  5: [
    { f: 487, s: S5a },
    { f: 556, cut: true, s: S5b }, // "forgot"
  ],
  6: [
    { f: 604, s: S6a },
    { f: 701, cut: true, s: S6b }, // "starting line"
  ],
  7: [
    { f: 744, s: S7a },
    { f: 810, dur: 20, s: rolled(S7a, ROLL) }, // "no idea"
  ],
  8: [
    { f: 852, s: S8a },
    { f: 872, dur: 22, s: S8b },
  ],
  9: [
    { f: 915, s: S9a },
    { f: 996, dur: 16, s: S9b }, // punch on "fridge" (+ kick)
  ],
  10: [{ f: 1030, s: S10a }],
  11: [
    { f: 1172, s: S11a },
    { f: 1212, dur: 20, s: rolled(S11a, -ROLL) }, // "Memory"
  ],
  12: [{ f: 1259, s: S12a }],
  13: [
    { f: 1360, s: S13a },
    { f: 1456, cut: true, s: S13b }, // "confused" (+ kick)
  ],
  14: [
    { f: 1502, s: S14a },
    { f: 1545, dur: 20, s: rolled(S14a, ROLL) }, // "Nobody"
  ],
  15: [
    { f: 1620, s: S15a },
    { f: 1696, cut: true, s: S15b }, // "menu"
  ],
  16: [{ f: 1726, s: S16a }],
  17: [
    { f: 1860, s: S17a },
    { f: 1877, dur: 26, s: S17b }, // centred on 1890
  ],
  18: [
    { f: 1925, s: S18a },
    { f: 1962, dur: 63, s: S18c }, // crane out
  ],
};

// impact kicks: the image offset flips sign every frame (~3 px at 720p per unit), decays to 0 in 7 f; seconds. No hand-held float.
const KICKS: [number, number][] = [[330 / FPS, 1], [1005 / FPS, 1.2], [1456 / FPS, 0.8]]; // ID stamp, fridge, grandpa face
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** frame at which the current key's move has finished (for picking billboard views per key, not per frame) */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
/** Thin-lens blur. cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp. Close-ups 12-16,
 *  MS 10-12, golden mood 7-8, wides/explainers 0. Entries switch on cuts (no dur) or ramp over `dur`. focus = world point
 *  (else the camera look point). */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (id: number) => (f: number): V3 => [HX(id, f), HERO_EYE, 0];
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: eyes(1) }, // hook CU
  { f: 100, dur: 24, cInf: 0 }, // pull back to the street
  { f: 130, cInf: 12, focus: eyes(2) }, // mirror MS
  { f: 247, cInf: 10 }, // cafe MS
  { f: 330, cInf: 12 }, // ID card CU
  { f: 345, cInf: 12 }, // bar low 3/4, bouncer face
  { f: 487, cInf: 0 }, // track side ride
  { f: 556, cInf: 14, focus: eyes(5) }, // face CU on "forgot"
  { f: 604, cInf: 0 },
  { f: 701, cInf: 12, focus: eyes(6) }, // back of head
  { f: 744, cInf: 12 }, // kitchen MS
  { f: 852, cInf: 0 }, // cane walk
  { f: 915, cInf: 14 }, // fridge CU
  { f: 1030, cInf: 0 }, // explainer
  { f: 1172, cInf: 10 }, // slow motion MS
  { f: 1259, cInf: 0 }, // book tower
  { f: 1360, cInf: 8 }, // car wide golden
  { f: 1456, cInf: 12 }, // driver CU
  { f: 1502, cInf: 10 }, // crowd MS
  { f: 1620, cInf: 12 }, // restaurant
  { f: 1726, cInf: 7 }, // bench golden
  { f: 1860, cInf: 0 }, // field wide
  { f: 1925, cInf: 0 }, // skyline crane
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b (inside one shot); kit = prop name for build.ts (to be provided) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 247, b: 330, kit: "plant_bushSmall", pos: [1.9, 0, -3.4], s: 0.7, yaw: 0.3 }, // cafe: flower pot bottom-right
  { a: 345, b: 487, kit: "fence", pos: [-1.6, 0, -3.6], s: 1.0, yaw: 0.2 }, // bar queue rope post bottom-left
  { a: 1726, b: 1860, kit: "plant_bushDetailed", pos: [1.5, 0, -2.8], s: 0.9, yaw: 0.4 }, // bench: bush bottom-right
];
