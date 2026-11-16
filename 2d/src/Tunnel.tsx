// "TunnelShort" (idea 90): what if you dropped a ball into a tunnel through the Earth? Facts only, see 2d/tunnel/SOURCES.md.
// fx kit (SceneFx, Cam, backdrops). Plan: 2d/tunnel/PLAN.md.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Ring, Cross, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Txt, Gauge } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Trans } from "./fx";
import frames from "../../2d/tunnel/frames.json";
import cues from "../../2d/tunnel/cues.json";

// ===== TIMING TABLE (single source) =====
// Regenerate from cues.json after any voice re-run: `python 2d/voice_short.py tunnel` rewrites frames.json + cues.json; nothing below is hand-timed.
// FR = scene bounds. cue(s, i) / cueEnd(s, i) = scene-local start / end frame of the i-th spoken segment in scene s (index clamps to the last).
// Segments are pause-based (no whisper); the segment -> story-beat mapping below is an assumption: listen and adjust the indices if a beat lands early/late.
const FR: number[] = frames;
export const TUNNEL_FRAMES = FR[FR.length - 1];
type Ph = { a: number; b: number };
const phr = (s: number): Ph[] => (cues as { phrases: Ph[] }[])[s].phrases;
const cue = (s: number, i: number) => phr(s)[Math.min(i, phr(s).length - 1)].a;
const cueEnd = (s: number, i: number) => phr(s)[Math.min(i, phr(s).length - 1)].b;
const len = (s: number) => FR[s + 1] - FR[s];
const SWING_Q = 90;  // frames for a quarter swing in looping scenes (animation speed, not voice timing)
// ========================================

const cx = W / 2, CY = 760, R = 400;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 26, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;

/** Earth cross-section: outline + faint schematic rings (unlabelled). d = draw progress 0..1 */
const Earth: React.FC<{ x?: number; y?: number; r?: number; d?: number; dens?: number; o?: number }> = ({ x = cx, y = CY, r = R, d = 1, dens = 0, o = 1 }) => (
  <g opacity={o} style={{ filter: GLOW }}>
    {dens > 0 && [0, 1, 2, 3, 4].map(k => <circle key={k} cx={x} cy={y} r={r * (1 - k / 5)} fill={INK} opacity={dens * (0.03 + 0.05 * k)} />)}
    <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={5} pathLength={1} strokeDasharray={`${d} 1`} transform={`rotate(-90 ${x} ${y})`} />
    <g fill="none" stroke={INK} strokeWidth={2} opacity={0.3 * d}><circle cx={x} cy={y} r={r * 0.66} strokeDasharray="8 8" /><circle cx={x} cy={y} r={r * 0.28} strokeDasharray="8 8" /></g>
  </g>
);
const Shaft: React.FC<{ d?: number; o?: number }> = ({ d = 1, o = 1 }) => (
  <rect x={cx - 26} y={CY - R * d} width={52} height={2 * R * d} rx={26} fill="#000" fillOpacity={0.85} stroke={INK} strokeWidth={3} opacity={o} />
);
const Ball: React.FC<{ x: number; y: number; r?: number; o?: number }> = ({ x, y, r = 20, o = 1 }) => <circle cx={x} cy={y} r={r} fill={INK} opacity={o} style={{ filter: GLOW }} />;
const swing = (t: number, t0: number, quarter: number) => CY - R * Math.cos((Math.PI / 2) * (t - t0) / quarter);  // y of a ball in the ideal tunnel, released at the top at t0, centre after `quarter` frames

// 0 hook
const Hook = (t: number) => {
  const d = easeOut(prog(t, 4, 40)), sd = easeOut(prog(t, 30, 60));
  return <>
    <Starfield t={t} o={0.7} />
    <Cam t={t} a={0} b={len(0)} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.05, x: cx, y: 900 }}>
      <Earth d={d} />
      <Shaft d={sd} />
      <Ball x={cx} y={CY - R - 70 + 12 * Math.sin(t * 0.2)} r={pop(t, cue(0, 0), 10) * 26} />
    </Cam>
    <Pill text="What if" x={cx} y={1400} a={8} size={19} on={false} />
    <Pill text="Drop a ball" x={cx} y={1500} a={cue(0, 0)} size={19} />
  </>;
};

// 1 the deepest hole: a hair on the way down
const Kola = (t: number) => {
  const tKm = cue(1, 1), tPct = cue(1, 2), d = prog(t, 6, 30);
  return <>
    <GridBG t={t} o={0.07} />
    <Cam t={t} a={0} b={len(1)} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.05, x: cx, y: 900 }}>
      <Earth />
      <rect x={cx - 3} y={CY - R} width={6} height={R * 2} rx={3} fill="none" stroke={INK} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.4 * d} />
      <rect x={cx - 5} y={CY - R} width={10} height={prog(t, tKm, tKm + 20) * 26} fill={INK} style={{ filter: GLOW }} />
      <Lbl x={cx + 200} y={CY - R - 30} size={22} o={prog(t, tKm + 8, tKm + 22)}>{"NOT TO SCALE"}</Lbl>
    </Cam>
    <Num v="12 KM" label="deepest hole" x={cx} y={270} size={120} o={prog(t, tKm, tKm + 12)} />
    <g opacity={prog(t, tPct, tPct + 14)}>
      <rect x={140} y={1330} width={800} height={36} rx={6} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />
      <rect x={140} y={1330} width={Math.max(3, 800 * 0.0019 * easeOut(prog(t, tPct, tPct + 24)))} height={36} fill={INK} style={{ filter: GLOW }} />
      <Lbl x={cx} y={1410} size={24}>{"0.2 % OF THE WAY TO THE CENTER"}</Lbl>
    </g>
    <Src>Kola Superdeep Borehole, 12,262 m, 1989</Src>
  </>;
};

// 2 no air, let go
const Release = (t: number) => {
  const t0 = cue(2, 0), t1 = cue(2, 1), t2 = cueEnd(2, 2), q = prog(t, t1, t2), y = CY - R + R * q * q, air = 1 - prog(t, t0 + 30, t0 + 60);
  return <>
    <BigRings x={cx} y={CY} t={t} o={0.07} />
    <Cam t={t} a={0} b={len(2)} from={{ s: 1.05, x: cx, y: 900 }} to={{ s: 1, x: cx, y: 960 }}>
      <Earth />
      <Shaft />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={cx + ((i * 7) % 5 - 2) * 8} cy={CY - R + 70 + i * 80} r={4} fill={INK} opacity={0.7 * air * prog(t, 8 + i, 18 + i)} />)}
      {[1, 2, 3, 4].map(i => <line key={i} x1={cx + (i - 2.5) * 9} x2={cx + (i - 2.5) * 9} y1={y - 28} y2={y - 28 - 120 * q * (1 - i * 0.12)} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.6 * q} />)}
      <Ball x={cx} y={t < t1 ? CY - R : y} />
    </Cam>
    <Pill text="No air" x={cx} y={1400} a={t0 + 10} size={19} on={false} />
    <Pill text="Let go" x={cx} y={1500} a={t1} size={19} />
  </>;
};

// 3 gravity fades to zero at the centre, the ball shoots through
const Centre = (t: number) => {
  const t0 = cue(3, 0), tC = cueEnd(3, 1), t2 = cue(3, 2), q = tC - t0;
  const y = t < t0 ? CY - R : Math.min(CY + R - 20, swing(t, t0, q)), dist = (y - CY) / R, L = 110 * Math.abs(dist), dir = dist < 0 ? 1 : -1;
  return <>
    <Rays x={cx} y={CY} t={t} o={0.05} />
    <Earth />
    <Shaft />
    {L > 5 && <g style={{ filter: GLOW }} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M${cx + 90} ${y} V${y + dir * L} M${cx + 72} ${y + dir * (L - 22)} L${cx + 90} ${y + dir * L} L${cx + 108} ${y + dir * (L - 22)}`} />
    </g>}
    <Lbl x={cx + 230} y={CY - 250} size={22} o={prog(t, t0, t0 + 14)}>{"GRAVITY"}</Lbl>
    <Ball x={cx} y={y} />
    {t > tC && t < tC + 40 && <Ring x={cx} y={CY} t={(t - tC) / 40} />}
    <Pill text="Zero at the center" x={cx} y={1400} a={cue(3, 1)} size={15} on={false} />
    <Pill text="Shoots through" x={cx} y={1500} a={t2} size={18} />
  </>;
};

// 4 peak speed in the simple model
const Speed = (t: number) => {
  const t1 = cue(4, 1), g = easeOut(prog(t, t1, t1 + 40));
  return <>
    <Rays x={cx} y={760} t={t * 1.5} o={0.12} />
    <Cam t={t} a={0} b={len(4)} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.06, x: cx, y: 800 }}>
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={cx + (i - 4) * 18} x2={cx + (i - 4) * 18} y1={540 - ((t * 22 + i * 61) % 240)} y2={700 - ((t * 22 + i * 61) % 240) + 120} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.35} />)}
      <Ball x={cx} y={780} r={pop(t, 4, 10) * 46} />
    </Cam>
    <Num v="~8" label="km per second" x={cx} y={330} size={190} o={prog(t, t1, t1 + 12)} />
    <Gauge x={cx} y={1160} s={1.7} a={0.82 * g} ticks o={prog(t, t1, t1 + 14)} />
    <Pill text="Simple model" x={cx} y={1450} a={cue(4, 0)} size={19} on={false} />
  </>;
};

// 5 42 minutes, but real Earth: 38
const Times = (t: number) => {
  const tClk = cue(5, 0), tDen = cue(5, 1), tBar = cue(5, 2), c = easeOut(prog(t, 8, cueEnd(5, 0) - 14)), m = Math.round(42 * c), b = easeOut(prog(t, tBar, tBar + 30));
  return <>
    <GridBG t={t} o={0.07} />
    <Cam t={t} a={0} b={len(5)} from={{ s: 1.04, x: cx, y: 940 }} to={{ s: 1, x: cx, y: 960 }}>
      <Earth x={cx} y={500} r={200} dens={prog(t, tDen, tDen + 30)} />
      <Shaft d={0} />
      <line x1={cx} x2={cx} y1={300} y2={700} stroke={INK} strokeWidth={5} strokeLinecap="round" style={{ filter: GLOW }} />
    </Cam>
    <Num v={`${String(m).padStart(2, "0")}:00`} label="minutes: uniform Earth" x={cx} y={940} size={150} o={prog(t, tClk - 6, tClk + 6)} />
    <g opacity={prog(t, tBar, tBar + 10)} style={{ filter: GLOW }}>
      <Lbl x={cx} y={1090} size={22}>{"UNIFORM EARTH: 42 MIN"}</Lbl>
      <rect x={140} y={1110} width={800 * b} height={44} rx={8} fill={INK} />
      <Lbl x={cx} y={1250} size={22}>{"2015 STUDY, REAL EARTH: 38 MIN"}</Lbl>
      <rect x={140} y={1270} width={800 * b * 0.905} height={44} rx={8} fill="#bbb" />
    </g>
    <Pill text="Denser core" x={cx} y={1440} a={tDen} size={18} on={false} />
    <Src>Klotz, Am. J. Phys. 83, 231 (2015)</Src>
  </>;
};

// 6 any straight tunnel takes the same time
const CHORDS: [[number, number], [number, number]][] = [[[cx, CY - R], [cx, CY + R]], [[cx - 330, CY - 220], [cx + 330, CY - 220]], [[cx - 280, CY + 285], [cx + 120, CY - 382]]];
const Chords = (t: number) => {
  const a = prog(t, cue(6, 0), cue(6, 0) + 24), w = Math.cos((Math.PI / 2) * t / SWING_Q);
  return <>
    <BigRings x={cx} y={CY} t={t} o={0.07} />
    <Num v="42 MIN" label="every tunnel" x={cx} y={250} size={110} o={prog(t, 6, 18)} />
    <Cam t={t} a={0} b={len(6)} from={{ s: 1.05, x: cx, y: 900 }} to={{ s: 1, x: cx, y: 960 }}>
      <Earth />
      {CHORDS.map(([[x1, y1], [x2, y2]], i) => {
        const o = i === 0 ? 1 : prog(t, cue(6, i), cue(6, i) + 20) * a, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return <g key={i} opacity={o}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={4} strokeLinecap="round" style={{ filter: GLOW }} />
          <Ball x={mx - w * (x2 - x1) / 2} y={my - w * (y2 - y1) / 2} r={16} />
        </g>;
      })}
    </Cam>
    <Pill text="Any straight tunnel" x={cx} y={1420} a={cue(6, 1)} size={16} on={false} />
    <Pill text="Same time" x={cx} y={1500} a={cue(6, 2)} size={19} />
  </>;
};

// 7 it swings forever
const Swing = (t: number) => {
  const q = SWING_Q, y = CY - R * Math.cos((Math.PI / 2) * t / q), tEnd = cue(7, 3);
  return <>
    <Starfield t={t} o={0.7} />
    <Earth />
    <Shaft />
    {[1, 2, 3, 4].map(i => <Ball key={i} x={cx} y={CY - R * Math.cos((Math.PI / 2) * (t - i * 4) / q)} r={20 - i * 3} o={0.4 / i} />)}
    <Ball x={cx} y={y} />
    <Txt x={cx} y={250} size={170} o={prog(t, tEnd, tEnd + 12)}>∞</Txt>
    <Pill text="Without friction" x={cx} y={1400} a={cue(7, 2)} size={16} on={false} />
    <Pill text="Swings forever" x={cx} y={1500} a={tEnd} size={19} />
  </>;
};

// 8 reality: spin pushes the ball into the wall; air damps the swing
const Reality = (t: number) => {
  const t1 = cue(8, 1), tHit = cueEnd(8, 1) - 10, t2 = cue(8, 2), q = SWING_Q;
  const fall = prog(t, 14, tHit), yA = CY - R + R * 0.62 * fall * fall, xA = cx + 18 * easeIO(prog(t, 40, tHit));
  const tt = t - t2, damp = Math.exp(-tt / 55), yB = CY - R * damp * Math.cos((Math.PI / 2) * tt / q);
  return <>
    <GhostBleed x={cx} y={CY} s={1.15} o={0.06}><circle r={R} fill="none" stroke={INK} strokeWidth={6} /></GhostBleed>
    <Earth />
    <g style={{ filter: GLOW }} opacity={prog(t, 4, 16)}>
      <path d={`M${cx - 120} ${CY - R - 60} A 140 140 0 0 1 ${cx + 120} ${CY - R - 60} M${cx + 96} ${CY - R - 78} L${cx + 120} ${CY - R - 60} L${cx + 102} ${CY - R - 36}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <Shaft />
    {t < t2 && <Ball x={xA} y={yA} />}
    {t > tHit && t < t2 && <circle cx={cx + 24} cy={CY - R + R * 0.62} r={14 + 46 * easeOut(prog(t, tHit, tHit + 24))} fill="none" stroke={INK} strokeWidth={4} opacity={1 - prog(t, tHit, tHit + 24)} />}
    {t >= t2 && <>
      {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={cx + ((i * 7) % 5 - 2) * 8} cy={CY - R + 60 + i * 76} r={4} fill={INK} opacity={0.6 * prog(t, t2, t2 + 10 + i)} />)}
      <Ball x={cx} y={tt < 0 ? CY - R : yB} />
    </>}
    <Pill text="Earth spins" x={cx} y={1400} a={t1 - 40 > 0 ? t1 - 40 : 8} size={18} on={false} />
    <Pill text="Air slows it" x={cx} y={1500} a={t2} size={18} />
  </>;
};

// 9 end
const End = (t: number) => {
  const t1 = cue(9, 1), y = CY - R * Math.cos((Math.PI / 2) * t / SWING_Q);
  return <>
    <Starfield t={t} />
    <Cam t={t} a={0} b={len(9)} from={{ s: 1.05, x: cx, y: 900 }} to={{ s: 1, x: cx, y: 960 }}>
      <Earth />
      <Shaft />
      <Ball x={cx} y={y} />
      {t > t1 && t < t1 + 45 && <Ring x={cx} y={CY} t={(t - t1) / 45} />}
    </Cam>
    <Pill text="42 down, 42 back" x={cx} y={1400} a={cue(9, 0)} size={17} on={false} />
    <Pill text="Same fall, forever" x={cx} y={1500} a={t1} size={18} />
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Kola, "zoomIn", "whipL"], [Release, "whipL", "whipUp"], [Centre, "whipUp", "zoomOut"], [Speed, "zoomOut", "whipR"],
  [Times, "whipR", "whipDown"], [Chords, "whipDown", "zoomIn"], [Swing, "zoomIn", "whipL"], [Reality, "whipL", "whipUp"], [End, "whipUp", "iris"],
];
export const TunnelShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("tunnel/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
