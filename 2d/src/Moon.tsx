// "The Moon Never Turns Its Back" short: tidal locking. Spec: 2d/newshort/DESIGN.md, script: 2d/newshort/SCRIPT.md.
// Voice: not generated yet (see 2d/newshort). Pass props {"audio":true} once public/moon/voice.wav exists.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Ring, W, H, SW, INK, GLOW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Gauge, Txt } from "./kit2";
import { SceneFx, Cam, Flash, Starfield, BigRings, GridBG, GhostBleed, Trans } from "./fx";

export const MOON_FRAMES = 1140;
const cx = W / 2;
const D2R = Math.PI / 180;
const E = { x: 540, y: 900 };
const ORB = 330;
const st = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const orbitPos = (th: number) => ({ x: E.x + ORB * Math.sin(th * D2R), y: E.y - ORB * Math.cos(th * D2R) });
const dirPt = (x: number, y: number, a: number, d: number) => ({ x: x + d * Math.sin(a * D2R), y: y - d * Math.cos(a * D2R) });

// camera: slow push about (540,900)
const cam = (t: number, n: number, s1 = 1.08, x = 540, y = 900, s0 = 1) => ({ t, a: 0, b: n, from: { s: s0 }, to: { s: s1, x, y } });

// ---------- components ----------
const Earth: React.FC<{ x: number; y: number; r?: number; o?: number; lat?: boolean; a?: number; t?: number }> = ({ x, y, r = 90, o = 1, lat = true, a = 0, t = 0 }) => {
  const k = a ? pop(t, a) : 1;
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={o} style={{ filter: GLOW }}>
      <circle r={r} fill="#000" stroke={INK} strokeWidth={SW} />
      <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round">
        <line x1={-r} x2={r} y1={0} y2={0} />
        <ellipse rx={r * 0.42} ry={r} />
        {lat && <path d={`M${-r * 0.87} ${-r * 0.5} Q0 ${-r * 0.32} ${r * 0.87} ${-r * 0.5}`} />}
      </g>
    </g>
  );
};

// crater sets (fractions of R)
const CRATERS: [number, number, number][] = [[-0.37, -0.30, 0.15], [0.32, -0.12, 0.21], [-0.10, 0.40, 0.11]];
const NEAR_CRATERS: [number, number, number][] = [[-0.55, -0.30, 0.14], [-0.30, -0.02, 0.2], [-0.45, 0.42, 0.11]];

const Dot: React.FC<{ x: number; y: number; R: number; phi: number; o?: number; glow?: boolean }> = ({ x, y, R, phi, o = 1, glow = true }) => {
  const p = dirPt(x, y, phi, 0.62 * R);
  return <circle cx={p.x} cy={p.y} r={Math.max(12, 0.18 * R)} fill={INK} opacity={o} style={glow ? { filter: GLOW + " drop-shadow(0 0 10px rgba(255,255,255,.6))" } : undefined} />;
};

const MoonDisc: React.FC<{ x: number; y: number; R: number; o?: number; glow?: boolean; sw?: number; craters?: boolean; scale?: number }> = ({ x, y, R, o = 1, glow = true, sw = SW, craters = false, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={o} style={glow ? { filter: GLOW } : undefined}>
    <circle r={R} fill="#000" stroke={INK} strokeWidth={sw} />
    {craters && CRATERS.map(([a, b, c], i) => <circle key={i} cx={a * R} cy={b * R} r={c * R} fill={INK} />)}
  </g>
);

/** arc around a centre, clockwise from top, with arrowhead at the end */
const SpinArrow: React.FC<{ x: number; y: number; r: number; sweep: number; rot: number; o?: number; sw?: number }> = ({ x, y, r, sweep, rot, o = 1, sw = 5 }) => {
  if (sweep < 3 || o <= 0) return null;
  const a0 = rot * D2R, a1 = (rot + sweep) * D2R;
  const p0 = { x: x + r * Math.sin(a0), y: y - r * Math.cos(a0) }, p1 = { x: x + r * Math.sin(a1), y: y - r * Math.cos(a1) };
  const tg = { x: Math.cos(a1), y: Math.sin(a1) }, nm = { x: Math.sin(a1), y: -Math.cos(a1) };
  const tip = { x: p1.x + tg.x * 22, y: p1.y + tg.y * 22 };
  return (
    <g opacity={o} style={{ filter: GLOW }}>
      <path d={`M${p0.x} ${p0.y} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M${tip.x} ${tip.y} L${p1.x + nm.x * 10} ${p1.y + nm.y * 10} L${p1.x - nm.x * 10} ${p1.y - nm.y * 10} Z`} fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
};

/** straight arrow, filled head 22 long, 20 wide */
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; o?: number }> = ({ x1, y1, x2, y2, o = 1 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const bx = x2 - ux * 22, by = y2 - uy * 22;
  return (
    <g opacity={o} style={{ filter: GLOW }}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d={`M${x2} ${y2} L${bx - uy * 10} ${by + ux * 10} L${bx + uy * 10} ${by - ux * 10} Z`} fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
};

/** link line from marker dot to the Earth edge (6 px short), optional travelling pulse */
const Link: React.FC<{ dx: number; dy: number; o?: number; pulse?: number }> = ({ dx, dy, o = 0.7, pulse }) => {
  const vx = E.x - dx, vy = E.y - dy, L = Math.hypot(vx, vy) || 1;
  const ex = E.x - (vx / L) * 96, ey = E.y - (vy / L) * 96;
  const len = Math.max(1, L - 96);
  return (
    <g>
      <line x1={dx} y1={dy} x2={ex} y2={ey} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={o} />
      {pulse !== undefined && <line x1={dx} y1={dy} x2={ex} y2={ey} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeDasharray={`28 ${len + 60}`} strokeDashoffset={-pulse * (len + 28) + 28} style={{ filter: GLOW }} />}
    </g>
  );
};

/** locked moon in orbit view: dot always faces Earth. th clockwise from top */
const LockedMoon: React.FC<{ th: number; o?: number; ghost?: boolean; pulse?: number }> = ({ th, o = 1, ghost, pulse }) => {
  const m = orbitPos(th), d = dirPt(m.x, m.y, th + 180, 0.62 * 70);
  return (
    <g>
      <Link dx={d.x} dy={d.y} o={ghost ? 0.25 : 0.7} pulse={ghost ? undefined : pulse} />
      <MoonDisc x={m.x} y={m.y} R={70} o={o} glow={!ghost} sw={ghost ? 4 : SW} />
      <Dot x={m.x} y={m.y} R={70} phi={th + 180} o={o} glow={!ghost} />
    </g>
  );
};

/** dashed orbit ring around Earth, drawn on with a mask (p 0..1) */
const OrbitRing: React.FC<{ id: string; p?: number; o?: number }> = ({ id, p = 1, o = 0.55 }) => {
  const C = 2 * Math.PI * ORB;
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-W} y={-H} width={W * 3} height={H * 3}>
          <circle cx={E.x} cy={E.y} r={ORB} fill="none" stroke="#fff" strokeWidth={12} strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform={`rotate(-90 ${E.x} ${E.y})`} />
        </mask>
      </defs>
      <circle cx={E.x} cy={E.y} r={ORB} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="10 14" opacity={o} mask={`url(#${id})`} />
    </g>
  );
};

/** beat 3 clock: kind A = orbit (tiny Earth + moon dot at the tip), B = spin (moon with marker) */
const Clock: React.FC<{ x: number; y: number; p: number; kind: "A" | "B"; k?: number }> = ({ x, y, p, kind, k = 1 }) => {
  if (k <= 0) return null;
  const ang = p * 360, C = 2 * Math.PI * 165;
  const tip = dirPt(0, 0, ang, 150);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} style={{ filter: GLOW }}>
      <circle r={190} fill="none" stroke={INK} strokeWidth={SW} />
      {Array.from({ length: 12 }, (_, i) => {
        const long = i % 3 === 0, a = dirPt(0, 0, i * 30, 190 - 8), b = dirPt(0, 0, i * 30, 190 - 8 - (long ? 28 : 16));
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={3} strokeLinecap="round" />;
      })}
      <circle r={165} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90)" />
      <line x1={0} y1={0} x2={tip.x} y2={tip.y} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {kind === "A" ? (
        <>
          <circle cx={tip.x} cy={tip.y} r={12} fill={INK} />
          <circle r={22} fill="#000" stroke={INK} strokeWidth={3} />
          <ellipse rx={9} ry={22} fill="none" stroke={INK} strokeWidth={2} />
        </>
      ) : (
        <>
          <circle r={24} fill="#000" stroke={INK} strokeWidth={3} />
          <circle cx={dirPt(0, 0, ang, 15).x} cy={dirPt(0, 0, ang, 15).y} r={6} fill={INK} />
        </>
      )}
      <circle r={10} fill={INK} opacity={kind === "A" ? 0 : 1} />
    </g>
  );
};

/** padlock with shackle offset dy (negative = open) */
const Padlock: React.FC<{ x: number; y: number; s: number; dy: number; o?: number }> = ({ x, y, s, dy, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M-38 -5 V-45 C-38 -90 38 -90 38 -45 V-5" transform={`translate(0 ${dy})`} {...st} />
    <rect x={-60} y={-5} width={120} height={95} rx={8} {...st} fill="#000" />
    <circle cy={38} r={9} fill={INK} />
  </g>
);

// ---------- beats (t = local frame) ----------
// 1: 0-165 the same face
const B1 = (t: number) => {
  const pulses = [25, 70, 115];
  const sc = 1 + pulses.reduce((s, p0) => s + 0.04 * Math.sin(Math.PI * prog(t, p0, p0 + 10)), 0);
  const night = t < 70 ? 1 : t < 115 ? 2 : 3;
  const lastP = pulses.filter(p0 => t >= p0).pop() ?? 0;
  const numK = t < 20 ? 0 : 1 + 0.18 * Math.max(0, 1 - (t - lastP) / 8) * (t >= 25 ? 1 : 0);
  return <>
    <Starfield t={t} n={90} o={0.6} />
    <Cam {...cam(t, 165, 1.06, 540, 880, 1)}>
      <MoonDisc x={540} y={880} R={300} craters scale={sc} />
    </Cam>
    {numK > 0 && <g transform={`translate(${cx} 330) scale(${numK}) translate(${-cx} -330)`}><Num v={night} label="NIGHT" x={cx} y={330} size={150} /></g>}
    <Pill text="EVERY NIGHT" x={cx} y={1330} a={20} />
  </>;
};

// 2: 165-300 orbit + spin
const B2 = (t: number) => {
  const th = lerp(-50, 120, easeIO(prog(t, 0, 135)));
  const m = orbitPos(th);
  const phi = (t / 135) * 720;
  const orbitOn = t >= 40 && t < 80, spinOn = t >= 80 && t < 112;
  return <>
    <Starfield t={t} n={90} o={0.6} />
    <BigRings x={540} y={900} o={0.08} t={t} />
    <Cam {...cam(t, 135)}>
      <OrbitRing id="ring2" p={easeOut(prog(t, 0, 20))} o={orbitOn ? 0.9 : 0.55} />
      <Earth x={E.x} y={E.y} a={0} />
      <MoonDisc x={m.x} y={m.y} R={70} />
      <SpinArrow x={m.x} y={m.y} r={96} sweep={250} rot={phi * 0.8} sw={spinOn ? 7 : 5} o={spinOn ? 1 : 0.8} />
      <Dot x={m.x} y={m.y} R={70} phi={phi} />
    </Cam>
    <Pill text="ORBIT" x={300} y={1400} a={40} on={false} />
    <Pill text="SPIN" x={780} y={1400} a={80} />
  </>;
};

// 3: 300-465 two clocks, 27 days
const B3 = (t: number) => {
  const p = easeIO(prog(t, 40, 140));
  return <>
    <GridBG o={0.08} t={t} />
    <Cam {...cam(t, 165, 1.05, 540, 900)}>
      <Clock x={300} y={820} p={p} kind="A" k={pop(t, 5)} />
      <Clock x={780} y={820} p={p} kind="B" k={pop(t, 5)} />
      {t >= 140 && <><Ring x={300} y={820} t={(t - 140) / 25} n={2} /><Ring x={780} y={820} t={(t - 140) / 25} n={2} /></>}
    </Cam>
    <Pill text="ORBIT" x={300} y={560} a={10} on={false} />
    <Pill text="SPIN" x={780} y={560} a={14} on={false} />
    {t >= 130 && <g transform={`translate(${cx} 1290) scale(${pop(t, 130, 10)}) translate(${-cx} -1290)`}><Num v={27} label="DAYS" x={cx} y={1290} size={240} /></g>}
  </>;
};

// 4: 465-630 locked dot, ghost moons
const B4 = (t: number) => {
  const th = lerp(0, 360, easeIO(prog(t, 15, 150)));
  const ghosts = [[0, 25], [90, 55], [180, 85], [270, 115]];
  return <>
    <Starfield t={t} n={90} o={0.6} />
    <BigRings x={540} y={900} o={0.08} t={t} />
    <Cam {...cam(t, 165)}>
      <OrbitRing id="ring4" />
      <Earth x={E.x} y={E.y} />
      {ghosts.map(([g, a]) => { const k = pop(t, a); return k > 0 ? <g key={g} transform={`translate(${orbitPos(g).x} ${orbitPos(g).y}) scale(${k}) translate(${-orbitPos(g).x} ${-orbitPos(g).y})`}><LockedMoon th={g} o={0.25} ghost /></g> : null; })}
      <LockedMoon th={th} pulse={((t - 15) / 40) % 1} />
    </Cam>
    <Pill text="ALWAYS FACING EARTH" x={cx} y={1400} a={30} />
  </>;
};

// 5: 630-765 billions of years ago, fast spin
const FREE_GHOST = [40, 130, 250];
const B5 = (t: number) => {
  const th = lerp(0, 60, prog(t, 0, 135));
  const m = orbitPos(th);
  const phi = (t / 135) * 2160;
  const arc = (r: number, a0: number, a1: number, o: number, key: number) => {
    const p0 = dirPt(m.x, m.y, a0, r), p1 = dirPt(m.x, m.y, a1, r);
    return <path key={key} d={`M${p0.x} ${p0.y} A${r} ${r} 0 0 1 ${p1.x} ${p1.y}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={o} />;
  };
  return <>
    <Starfield t={t} n={90} o={0.6} />
    <BigRings x={540} y={900} o={0.08} t={t} />
    <Cam {...cam(t, 135, 1.15, 705, 614, 1)}>
      <OrbitRing id="ring5" />
      <Earth x={E.x} y={E.y} />
      <MoonDisc x={m.x} y={m.y} R={70} />
      {FREE_GHOST.map((g, i) => { const p = dirPt(m.x, m.y, g, 0.62 * 70); return <circle key={i} cx={p.x} cy={p.y} r={12} fill={INK} opacity={0.3} />; })}
      {[0, 1, 2].map(i => arc(0.62 * 70 + (i - 1) * 9, phi - 55 + i * 4, phi - 12 + i * 2, 0.5 - i * 0.1, i))}
      <SpinArrow x={m.x} y={m.y} r={96} sweep={250} rot={phi} />
      <Dot x={m.x} y={m.y} R={70} phi={phi} />
    </Cam>
    <Pill text="BILLIONS OF YEARS AGO" x={cx} y={330} a={0} />
  </>;
};

// 6: 765-930 tidal stretch + brake
const B6 = (t: number) => {
  const e = easeIO(prog(t, 20, 60));
  const rx = lerp(130, 150, e), ry = lerp(130, 118, e);
  const pull = 20 * Math.sin(t * 0.25) * e;
  const aN = easeOut(prog(t, 35, 50));
  return <>
    <Starfield t={t} n={60} o={0.5} />
    <GhostBleed x={-100} y={880} s={5} o={0.08}><circle r={90} fill="none" stroke={INK} strokeWidth={3} /><ellipse rx={38} ry={90} fill="none" stroke={INK} strokeWidth={3} /></GhostBleed>
    <Cam {...cam(t, 165)}>
      <Earth x={230} y={880} r={110} />
      <g style={{ filter: GLOW }}>
        <ellipse cx={720} cy={880} rx={rx} ry={ry} fill="#000" stroke={INK} strokeWidth={SW} />
      </g>
      <circle cx={720 - 0.62 * rx} cy={880} r={20} fill={INK} style={{ filter: GLOW }} />
      {aN > 0 && [820, 940].map(y => <Arrow key={y} x1={600} y1={y} x2={600 - (170 * aN + pull)} y2={y} />)}
      <Gauge x={540} y={1290} s={1.8} a={lerp(0.9, 0.1, easeIO(prog(t, 60, 160)))} ticks />
    </Cam>
    <Pill text="TIDAL BRAKE" x={cx} y={1440} a={50} />
  </>;
};

// 7: 930-1035 the lock
const B7 = (t: number) => {
  const R = 230, M = { x: 540, y: 820 };
  const sl = prog(t, 0, 55);
  const phi = 270 + 720 * (1 - easeOut(sl));
  const sweep = t >= 62 ? 0 : lerp(250, 40, easeIO(sl));
  const dot = dirPt(M.x, M.y, phi, 0.62 * R);
  const lk = prog(t, 60, 64), bump = 3 * Math.sin(Math.PI * prog(t, 64, 68));
  const dy = t < 60 ? -30 : lerp(-30, 0, lk * lk) + bump;
  return <>
    <Starfield t={t} n={90} o={0.6} />
    <Cam {...cam(t, 105, 1.06, 540, 880)}>
      {t < 62 && Array.from({ length: 6 }, (_, i) => { const a = dirPt(M.x, M.y, phi + i * 60, R + 44), b = dirPt(M.x, M.y, phi + i * 60, R + 58); return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.8} />; })}
      {t >= 40 && <LockLink t={t} dot={dot} M={M} />}
      <line x1={90} x2={90} y1={790} y2={850} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      <MoonDisc x={M.x} y={M.y} R={R} />
      <SpinArrow x={M.x} y={M.y} r={R + 26} sweep={sweep} rot={phi} />
      <Dot x={M.x} y={M.y} R={R} phi={phi} />
      {t >= 52 && <Padlock x={700} y={960} s={1.5} dy={dy} o={pop(t, 52)} />}
      {t >= 62 && <Ring x={M.x} y={M.y} t={(t - 62) / 30} />}
    </Cam>
    <Flash t={t} t0={62} />
    <Pill text="LOCKED" x={cx} y={1330} a={66} />
  </>;
};
// link from the dot to the far-left tick, growing in as the dot locks (only once phi is close to 270)
const LockLink: React.FC<{ t: number; dot: { x: number; y: number }; M: { x: number; y: number } }> = ({ t, dot }) => {
  const o = 0.7 * prog(t, 40, 56);
  return <line x1={dot.x} y1={dot.y} x2={96} y2={820} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={o} />;
};

// 8: 1035-1140 near side vs far side
const B8 = (t: number) => {
  const R = 280, M = { x: 560, y: 880 };
  return <>
    <BigRings x={560} y={880} o={0.08} t={t} />
    <Cam {...cam(t, 105, 1.04, 540, 880)}>
      <Earth x={130} y={880} r={55} lat={false} a={0} />
      <line x1={191} y1={880} x2={M.x - R - 6} y2={880} stroke={INK} strokeWidth={3} opacity={0.7} strokeLinecap="round" />
      <g style={{ filter: GLOW }}>
        <path d={`M${M.x} ${M.y - R} A${R} ${R} 0 0 0 ${M.x} ${M.y + R} Z`} fill={INK} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {NEAR_CRATERS.map(([a, b, c], i) => <circle key={i} cx={M.x + a * R} cy={M.y + b * R} r={c * R} fill="#000" />)}
      </g>
      <path d={`M${M.x} ${M.y - R} A${R} ${R} 0 0 1 ${M.x} ${M.y + R}`} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 14" strokeLinecap="round" opacity={0.6} />
      <Txt x={690} y={980} size={200} color="#aaa" o={pop(t, 20)}>?</Txt>
    </Cam>
    <Pill text="NEAR SIDE" x={330} y={1310} a={25} on={false} />
    <Pill text="NEVER SEEN" x={780} y={1310} a={40} />
  </>;
};

const SCENES: { a: number; b: number; inT: Trans; outT: Trans; C: (t: number) => React.ReactNode }[] = [
  { a: 0, b: 165, inT: "zoomIn", outT: "zoomIn", C: B1 },
  { a: 165, b: 300, inT: "zoomIn", outT: "whipL", C: B2 },
  { a: 300, b: 465, inT: "whipL", outT: "zoomOut", C: B3 },
  { a: 465, b: 630, inT: "zoomOut", outT: "whipL", C: B4 },
  { a: 630, b: 765, inT: "whipL", outT: "spin", C: B5 },
  { a: 765, b: 930, inT: "spin", outT: "whipUp", C: B6 },
  { a: 930, b: 1035, inT: "whipUp", outT: "zoomIn", C: B7 },
  { a: 1035, b: MOON_FRAMES, inT: "zoomIn", outT: "iris", C: B8 },
];

export const MoonShort: React.FC<{ audio?: boolean }> = ({ audio = false }) => (
  <Stage>
    {audio && <Audio src={staticFile("moon/voice.wav")} />}
    {SCENES.map((s, i) => <SceneFx key={i} a={s.a} b={s.b} inT={s.inT} outT={s.outT}>{s.C}</SceneFx>)}
  </Stage>
);
