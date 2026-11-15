export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number, e?: (u: number) => number) => { const u = clamp((t - a) / (b - a)); return e ? e(u) : u; };
export const hash = (n: number, s = 1) => { const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
export const ease = {
  out: (t: number) => 1 - Math.pow(1 - t, 3), in: (t: number) => t * t * t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  outBack: (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
export const spring = (t: number, freq = 2.2, damp = 0.45) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (damp >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
};
export const track = (keys: [number, number | number[], (string | ((u: number) => number))?][]) => (t: number): any => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i];
    const fn = typeof e === 'function' ? e : (ease as any)[e || 'inOut'];
    const u = fn((t - t0) / (t1 - t0));
    return Array.isArray(v0) ? v0.map ( (a, k) => a + ((v1 as number[])[k] - a) * u) : (v0 as number) + ((v1 as number) - (v0 as number)) * u;
  }
  return keys[keys.length - 1][1];
};
export const pop = (t: number, t0: number, f = 2.6, d = 0.4) => {
  const a = spring(t - t0, f, d), w = spring(t - t0 - 0.05, f * 0.85, Math.min(0.9, d + 0.1));
  return { visible: t > t0 - 1e-3, sx: Math.max(0.001, w), sy: Math.max(0.001, a) };
};

/** Deterministic, phase-offset secondary motion for each performer. */
export const idle = (t: number, i: number) => {
  const ph = hash(i) * 6.28;
  return {breath: Math.sin(t * 1.6 + ph) * .004, headY: Math.sin(t * .5 + ph) * .12, headX: Math.sin(t * .7 + ph) * .04, blink: (t * .33 + hash(i, 2)) % 1 > .965};
};
