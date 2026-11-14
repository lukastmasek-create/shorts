// Timeline of the pause short: "What if you could pause everyone except yourself for 10 minutes a day?"
// Shots timed to pause/voice/words.json (59.1 s, voice ends f1769); plan in pause/SHOTPLAN.md.
// Camera grammar (reference study): continuous slow push-ins; symmetric smootherstep glides 18-40 f; big reframes are
// cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float. Every visual reaction lands 0-3 f
// before its word.
// World layout: each SET is an own stage 200 m apart on x (so no set is ever in another's sight line). Ground y = 0,
// hero eye 1.6 m. Camera numbers are first-pass guesses from the shot plan: tune them against stills once build.ts
// has the sets. world.ts / cast.ts are still the bridge's; legacy.ts keeps them compiling.
import { V3, clamp01, smooth, easeOut, FPS } from "./legacy";
export * from "./legacy";
export const TOTAL = 1800;

// ---------------- sets ----------------
export type SetId = "street" | "cafe" | "desk" | "library" | "square" | "bath" | "lawn" | "explain" | "party" | "porch" | "town";
export const SET_X: Record<SetId, number> = {
  street: 0, cafe: 200, desk: 400, library: 600, square: 800, bath: 1000, lawn: 1200, explain: 1400, party: 1600, porch: 1800, town: 2000,
};
/** point in a set's own coordinates -> world */
const P = (s: SetId, x: number, y: number, z: number): V3 => [SET_X[s] + x, y, z];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none"; // bridge cast modes, all "none" here
/** frozen: crowd/cars/pigeon hold one pose (no walk cycle, blink); only the hero and unfrozen cast move. */
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetId; frozen: boolean; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
const S = (id: number, a: number, b: number, light: Light, set: SetId, frozen = true): ShotDef =>
  ({ id, a, b, light, set, frozen, crowd: "none", tau: (t) => t });
export const SHOTS: ShotDef[] = [
  S(1, 0, 76, "day", "street", false), // live street, freeze at f23 (see FREEZE_AT)
  S(2, 76, 108, "day", "street"),
  S(3, 108, 166, "day", "street"),
  S(4, 166, 236, "day", "street"),
  S(5, 236, 320, "day", "cafe"),
  S(6, 320, 358, "day", "cafe", false), // time restarts
  S(7, 358, 454, "day", "desk"),
  S(8, 454, 570, "day", "library"),
  S(9, 570, 668, "day", "square"),
  S(10, 668, 757, "day", "bath", false),
  S(11, 757, 790, "day", "bath", false),
  S(12, 790, 888, "golden", "lawn"),
  S(13, 888, 980, "golden", "lawn"),
  S(14, 980, 1088, "day", "explain", false),
  S(15, 1088, 1176, "day", "explain", false),
  S(16, 1176, 1296, "day", "explain", false),
  S(17, 1296, 1426, "golden", "party", false),
  S(18, 1426, 1490, "day", "party", false),
  S(19, 1490, 1560, "golden", "porch", false),
  S(20, 1560, 1626, "golden", "porch", false),
  S(21, 1626, 1724, "golden", "lawn"), // freezes again at f1626 (FREEZE_AGAIN)
  S(22, 1724, TOTAL, "golden", "town"),
];
/** frames at which the whole world holds its pose (shot 1: stops mid-stride; shot 21: freezes again) */
export const FREEZE_AT = 23, FREEZE_AGAIN = 1626;
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 10: 6, 12: 8, 14: 6, 17: 8, 19: 8, 22: 8 };
export const FLASH_AT = 106;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- hero path (set coordinates) ----------------
const WALK = 0.047; // m per frame (1.4 m/s)
/** hero standing / walking: shot 1 street walk, shot 3 stroll between cars, shot 5 past the queue */
export const heroPos = (id: number, f: number): V3 => {
  const s = SHOTS[id - 1];
  const t = Math.max(0, f - s.a);
  if (id === 3) return P("street", -1.2, 0, -6 + WALK * t);
  if (id === 5) return P("cafe", -2 + WALK * 1.4 * Math.min(t, 50), 0, 0);
  return P(s.set, 0, 0, 0);
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
/** reference camera ease: symmetric smootherstep */
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
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** a roll-only move on top of an existing framing */
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const E = 1.6; // hero eye height

// shot 1: wide high 3/4 over the busy street, slow push
const S1a = (f: number) => dolly(P("street", 9, 6, -16), P("street", 0, 1.5, 2), pushK(f, 0, 0.003), { fov: 44 });
// shot 2: CU on the hero's face in the frozen crowd; roll on "you"
const S2a = (f: number) => dolly(P("street", 0.5, E, -2.6), P("street", 0, E, 0), pushK(f, 76, 0.003), { fov: 34 });
// shot 3: low side track riding with the hero between frozen cars; glide up on "noise"
const S3a = (f: number) => { const h = heroPos(3, f); return dolly([h[0] + 6.5, 0.9, h[2] + 0.5], [h[0], 1.1, h[2] + 1.5], pushK(f, 108, 0.0015), { fov: 40 }); };
const S3b = (f: number) => { const h = heroPos(3, f); return dolly([h[0] + 7, 3.4, h[2] - 2], [h[0], 1.3, h[2] + 2.5], pushK(f, 141, 0.002), { fov: 42 }); };
// shot 4: pigeon CU at head height, push; kick at "sticker"
const S4a = (f: number) => dolly(P("street", 1.0, 1.9, -2.4), P("street", 0, 1.9, 0), pushK(f, 166, 0.003), { fov: 32 });
// shot 5: MS along the frozen queue, glide to the counter on "coffee"
const S5a = (f: number) => { const h = heroPos(5, f); return dolly([h[0] + 1, 1.5, -5.5], [h[0] + 1.5, 1.4, 0], pushK(f, 236, 0.002), { fov: 42 }); };
const S5b = (f: number) => dolly(P("cafe", 7, 1.5, -3.8), P("cafe", 8, 1.4, 0), pushK(f, 287, 0.002), { fov: 38 });
// shot 6: MS front of the unfrozen queue, hero sipping at the counter
const S6a = (f: number) => dolly(P("cafe", 6, 1.5, -5), P("cafe", 6, 1.45, 0), pushK(f, 320, 0.0025), { fov: 40 });
// shot 7: desk MS, then neighbor window MS
const S7a = (f: number) => dolly(P("desk", 0, 1.6, -3.8), P("desk", 0, 1.1, 0), pushK(f, 358, 0.0025), { fov: 40 });
const S7b = (f: number) => dolly(P("desk", 6, 1.8, -4.2), P("desk", 6, 1.3, 0), pushK(f, 419, 0.0025), { fov: 42 });
// shot 8: low crane up beside the book tower; cut to the pigeon on "pigeon"
const S8a = (f: number) => { const u = glide((f - 454) / 76); return { pos: P("library", 3.2, 0.5 + 3.2 * u, -4.5), look: P("library", 0, 1.2 + 3.5 * u, 0), fov: 44 } as Shot; };
const S8b = (f: number) => dolly(P("library", 1.0, 2.2, -2.2), P("library", 0, 2.1, 0), pushK(f, 533, 0.003), { fov: 32 });
// shot 9: town square, three quick cuts and a wide
const S9a = (f: number) => dolly(P("square", 1.5, E, -4), P("square", 0, E, 0), pushK(f, 570, 0.002), { fov: 40 });
const S9b = (f: number) => dolly(P("square", -2, E, -4.5), P("square", -3, E, 0), pushK(f, 597, 0.002), { fov: 38 });
const S9c = (f: number) => dolly(P("square", 3, 1.4, -4), P("square", 3.5, 1.3, 0), pushK(f, 611, 0.002), { fov: 38 });
const S9d = (f: number) => dolly(P("square", 0, 1.3, -4.5), P("square", 0.4, 1.2, 0), pushK(f, 623, 0.002), { fov: 38 });
const S9e = (f: number) => dolly(P("square", 6, 6, -16), P("square", 0, 1.5, 0), pushK(f, 644, 0.002), { fov: 46 });
// shot 10: mirror MS, hair CU on "Your"
const S10a = (f: number) => dolly(P("bath", 0, E, -3.2), P("bath", 0, E, 0), pushK(f, 668, 0.002), { fov: 38 });
const S10b = (f: number) => dolly(P("bath", 0.2, 1.95, -1.6), P("bath", 0, 1.9, 0), pushK(f, 725, 0.003), { fov: 30 });
// shot 11: front two-shot, hero grey next to two dark-haired friends
const S11a = (f: number) => dolly(P("bath", 0, 1.5, -6.5), P("bath", 0, E, 0), pushK(f, 757, 0.002), { fov: 42, roll: 0.04 });
// shot 12: golden lawn, hero in a deckchair; low 3/4, glide up with the clock pile on "extra"
const S12a = (f: number) => dolly(P("lawn", 3.2, 0.9, -5), P("lawn", 0, 1.0, 0), pushK(f, 790, 0.002), { fov: 42 });
const S12b = (f: number) => dolly(P("lawn", 3, 2.4, -5.2), P("lawn", 0, 1.8, 0), pushK(f, 824, 0.002), { fov: 42 });
// shot 13: CU hero + aging, push
const S13a = (f: number) => dolly(P("lawn", 0.6, 1.2, -2.6), P("lawn", 0, 1.15, 0), pushK(f, 888, 0.003), { fov: 34 });
// shots 14-16: explainer on flat colour, locked front
const S14a = (f: number) => dolly(P("explain", 0, 1.5, -9), P("explain", 0, 1.5, 0), pushK(f, 980, 0.0015), { fov: 40 });
const S15a = (f: number) => { const u = glide((f - 1088) / 86); return { pos: P("explain", 0, 1.0 + 3.5 * u, -10), look: P("explain", 0, 1.5 + 3.5 * u, 0), fov: 40 } as Shot; };
const S16a = (f: number) => dolly(P("explain", 0, 1.5, -9), P("explain", 0, 1.5, 0), pushK(f, 1176, 0.001), { fov: 40 });
const S16b = (f: number) => dolly(P("explain", 3, 1.5, -6), P("explain", 3.5, 1.5, 0), pushK(f, 1267, 0.0025), { fov: 36 });
// shot 17: birthday table MS, cut to glasses + book on "wiser", cut to the yawn on "tired"
const S17a = (f: number) => dolly(P("party", 0, 1.7, -6), P("party", 0, 1.2, 0), pushK(f, 1296, 0.002), { fov: 42 });
const S17b = (f: number) => dolly(P("party", 0.8, 1.6, -3), P("party", 0.8, 1.5, 0), pushK(f, 1366, 0.0025), { fov: 36 });
const S17c = (f: number) => dolly(P("party", 0.8, 1.6, -2.4), P("party", 0.8, 1.55, 0), pushK(f, 1394, 0.003), { fov: 32 });
// shot 18: MS of the head-scratching friends
const S18a = (f: number) => dolly(P("party", 0, 1.6, -6.2), P("party", 0, 1.4, 0), pushK(f, 1426, 0.0025), { fov: 42 });
// shot 19: porch, low 3/4, glide in on "secret"
const S19a = (f: number) => dolly(P("porch", 4, 1.0, -6), P("porch", 0, 1.2, 0), pushK(f, 1490, 0.002), { fov: 44 });
const S19b = (f: number) => dolly(P("porch", 2, 1.3, -4), P("porch", 0, 1.4, 0), pushK(f, 1538, 0.0025), { fov: 38 });
// shot 20: CU smile, ten fingers
const S20a = (f: number) => dolly(P("porch", 0.4, 1.45, -2.4), P("porch", 0, 1.4, 0), pushK(f, 1560, 0.003), { fov: 32 });
// shot 21: MS deckchair, slow push to the closing eyes
const S21a = (f: number) => dolly(P("lawn", 2.2, 1.3, -5), P("lawn", 0, 1.1, 0), pushK(f, 1626, 0.002), { fov: 40 });
// shot 22: crane pull-out over the frozen town, hero a dot in the centre
const S22a = (f: number): Shot => {
  const u = glide((f - 1724) / 76);
  return { pos: P("town", 0, 3 + 52 * u, -6 - 78 * u), look: P("town", 0, 1 + 1 * (1 - u), 0), fov: 40 + 8 * u, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 76, s: S2a }, { f: 94, dur: 18, s: rolled(S2a, 0.04) }], // roll 4 deg on "you"
  3: [{ f: 108, s: S3a }, { f: 141, dur: 24, s: S3b }], // cut under the flash, glide up on "noise"
  4: [{ f: 166, s: S4a }],
  5: [{ f: 236, s: S5a }, { f: 287, dur: 24, s: S5b }], // glide to the counter on "coffee"
  6: [{ f: 320, s: S6a }, { f: 330, dur: 18, s: rolled(S6a, 0.05) }],
  7: [{ f: 358, s: S7a }, { f: 419, cut: true, s: S7b }], // cut on "then"
  8: [{ f: 454, s: S8a }, { f: 533, cut: true, s: S8b }], // crane up, cut on "pigeon"
  9: [{ f: 570, s: S9a }, { f: 597, cut: true, s: S9b }, { f: 611, cut: true, s: S9c }, { f: 623, cut: true, s: S9d }, { f: 644, cut: true, s: S9e }],
  10: [{ f: 668, s: S10a }, { f: 725, cut: true, s: S10b }], // cut to the hair on "Your"
  11: [{ f: 757, s: S11a }],
  12: [{ f: 790, s: S12a }, { f: 824, dur: 30, s: S12b }], // glide up with the pile on "extra"
  13: [{ f: 888, s: S13a }],
  14: [{ f: 980, s: S14a }],
  15: [{ f: 1088, s: S15a }],
  16: [{ f: 1176, s: S16a }, { f: 1267, dur: 20, s: S16b }], // push to the sliver on "half"
  17: [{ f: 1296, s: S17a }, { f: 1366, cut: true, s: S17b }, { f: 1394, cut: true, s: S17c }],
  18: [{ f: 1426, s: S18a }],
  19: [{ f: 1490, s: S19a }, { f: 1538, dur: 24, s: S19b }], // glide in on "secret"
  20: [{ f: 1560, s: S20a }],
  21: [{ f: 1626, s: S21a }],
  22: [{ f: 1724, s: S22a }], // crane pull-out 76 f, hold the last 31
};

// impact kicks (reference v14): the image offset flips sign every frame (~3 px at 720p per unit), decays to 0 in
// 7 f, roll +-0.23 deg per unit; they start on the first frame at/after the event. [frame, gain]
export const KICKS: [number, number][] = [
  [FREEZE_AT, 1.2], [215, 0.6], [428, 0.6], [743, 0.8], [938, 0.8], [1143, 1.0], [1282, 0.8], [1473, 0.6], [1591, 0.7],
];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor(f - f0 + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a; // metres at the look distance for 3 px x a
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** frame at which the current key's move has finished (for picking billboard views per key, not per frame) */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
/** Lens blur per shot (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp.
 *  Entries switch on cuts (no dur) or ramp with the camera glide they share f/dur with. focus = world point (else the
 *  camera look point). */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const hero = (id: number, y = E) => (f: number): V3 => { const h = heroPos(id, f); return [h[0], y, h[2]]; };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // hook wide, sharp
  { f: 76, cInf: 14 }, // hero CU
  { f: 108, cInf: 8, focus: hero(3) },
  { f: 166, cInf: 12 }, // pigeon CU (focus = look)
  { f: 236, cInf: 10, focus: hero(5) },
  { f: 320, cInf: 10 },
  { f: 358, cInf: 12 },
  { f: 454, cInf: 0 }, // library crane
  { f: 533, cInf: 14 }, // pigeon CU
  { f: 570, cInf: 10 },
  { f: 668, cInf: 12 },
  { f: 757, cInf: 0 },
  { f: 790, cInf: 8 },
  { f: 888, cInf: 12 },
  { f: 980, cInf: 0 }, // explainer shots 14-16 all sharp
  { f: 1296, cInf: 10 },
  { f: 1490, cInf: 8 },
  { f: 1560, cInf: 12 },
  { f: 1626, cInf: 10 },
  { f: 1724, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
/** what the lens focuses on (DOF): the DOF table's focus point, else the camera look point */
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop(). None planned yet
 *  (candidates: a frozen cup in front of the cafe CU, a bush on the porch); world.ts still reads the bridge entries. */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
