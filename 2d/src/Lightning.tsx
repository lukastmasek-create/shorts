// "LightningShort" (idea 85): what if you were hit by lightning every day? Facts only, see 2d/lightning/SOURCES.md.
// Timing: scene bounds from 2d/lightning/frames.json; cue-driven moments = scene-local phrase starts from cues.json.
import React from "react";
import { Audio, staticFile } from "remotion";
import FRAMES from "../lightning/frames.json";
import { Stage, Pill, Num, Person, Ring, Cross, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans, Flash, spread } from "./fx";

// ===== TIMING TABLE (the only place with timing numbers) =====
// Regenerate from cues.json after any voice re-run: FR = frames.json, C.* = scene-local phrase starts ("a") in cues.json.
const FR = FRAMES as number[];
export const LIGHTNING_FRAMES = FR[FR.length - 1];
const C = {
  hook: { strike: 13, notOnce: 89, daily: 137 },
  heat: { fifty: 10, five: 134 },
  surv: { dayOne: 11, ten: 81, weather: 154, ninety: 205 },
  nerve: { notFine: 10, nervous: 88, scans: 169 },
  symp: { slow: 11, memory: 88, day300: 159 },
  honest: { honest: 12, nobody: 66, adapt: 133 },
  sull: { name: 10, ranger: 71, seven: 139, years: 200 },
  det: { truck: 10, garden: 55, boat: 95, hair: 143 },
  end: { odds: 11, thunder: 137, inside: 175 },
};
// ===== end timing table =====

const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 24, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.05) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 960 } });
const count = (t: number, a: number, b: number, v0: number, v1: number) => Math.round(lerp(v0, v1, easeIO(prog(t, a, b))));

/** deterministic zig-zag path from (x0,y0) to (x1,y1) */
const boltPath = (x0: number, y0: number, x1: number, y1: number, seed: number, n = 9, j = 55) => {
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, o = i === 0 || i === n ? 0 : Math.sin(seed * 91.7 + i * 37.3) * j;
    return `${lerp(x0, x1, u) + o},${lerp(y0, y1, u)}`;
  });
  return "M" + pts.join(" L");
};
/** a bolt that strikes at local frame t0: draws down in 4 f, flickers out by +14 f */
const Bolt: React.FC<{ t: number; t0: number; x0: number; y0: number; x1: number; y1: number; seed?: number; w?: number; j?: number }> = ({ t, t0, x0, y0, x1, y1, seed = 1, w = 9, j = 55 }) => {
  const p = prog(t, t0, t0 + 4), o = t < t0 ? 0 : 1 - prog(t, t0 + 6, t0 + 15) * (0.6 + 0.4 * Math.abs(Math.sin(t * 2)));
  if (p <= 0 || o <= 0.02) return null;
  const d = boltPath(x0, y0, x1, y1, seed, 9, j);
  return <g opacity={o} style={{ filter: GLOW }} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={INK} strokeWidth={w} pathLength={1} strokeDasharray={`${p} 1`} />
    <path d={boltPath(x0, y0 + 80, x1 + 60, y1 - 60, seed + 5, 5, j)} stroke={INK} strokeWidth={w / 3} opacity={0.6} pathLength={1} strokeDasharray={`${clamp(p * 1.4 - 0.4)} 1`} />
  </g>;
};
const CLOUD = "M-190 40 C-250 40 -250 -30 -180 -32 C-180 -95 -90 -105 -60 -62 C-30 -118 70 -108 78 -52 C140 -76 200 -20 168 40 Z";
const Cloud: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d={CLOUD} fill="#000" stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={o} style={{ filter: GLOW }} />
);
const Sun: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round">
    <circle r={44} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * 62} y1={Math.sin(a) * 62} x2={Math.cos(a) * 86} y2={Math.sin(a) * 86} />; })}
  </g>
);
const HBar: React.FC<{ x: number; y: number; w: number; h?: number; p: number }> = ({ x, y, w, h = 56, p }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.7} />
    <rect x={x} y={y} width={Math.max(0, w * p)} height={h} rx={6} fill={INK} style={{ filter: GLOW }} />
  </g>
);

// 0 hook: the daily strike counter starts
const Hook = (t: number) => {
  const day = count(t, C.hook.notOnce, C.hook.daily + 40, 1, 365);
  const daily = [C.hook.daily, C.hook.daily + 9, C.hook.daily + 18, C.hook.daily + 27];
  return <>
    <Starfield t={t} o={0.7} />
    <BigRings x={cx} y={1300} t={t} o={0.1} />
    <Cam t={t} a={0} b={FR[1] - FR[0]} from={{ s: 1.25, x: cx, y: 1000 }} to={{ s: 1, x: cx, y: 960 }}>
      <Cloud x={cx} y={330} s={2.4} o={pop(t, 2)} />
      <Ground y={1300} />
      <Person x={cx} y={1300} s={3} o={pop(t, 4)} />
      <Bolt t={t} t0={C.hook.strike} x0={cx} y0={420} x1={cx} y1={1100} seed={3} />
      {daily.map((d, i) => <Bolt key={i} t={t} t0={d} x0={cx + (i % 2 ? 60 : -60)} y0={420} x1={cx} y1={1100} seed={7 + i * 2} w={8} />)}
      {t > C.hook.strike && t < C.hook.strike + 30 && <Ring x={cx} y={1100} t={(t - C.hook.strike) / 30} />}
      <Flash t={t} t0={C.hook.strike} />
      {daily.map((d, i) => <Flash key={i} t={t} t0={d} len={6} />)}
    </Cam>
    <Num v={day} label="day" x={cx} y={640} size={190} o={prog(t, C.hook.notOnce, C.hook.notOnce + 10)} />
    <Pill text="Every single day" x={cx} y={1460} a={C.hook.daily} size={19} />
  </>;
};
// 1 heat: 50,000 F, 5x the Sun
const Heat = (t: number) => {
  const v = count(t, C.heat.fifty + 10, C.heat.fifty + 70, 0, 50000), k = easeOut(prog(t, C.heat.five, C.heat.five + 30));
  return <>
    <Rays x={cx} y={760} t={t} o={0.07} />
    <Cam {...cam(t, 1, 1.05)}>
      <Num v={v.toLocaleString("en-US")} label="degrees fahrenheit" x={cx} y={400} size={170} o={prog(t, C.heat.fifty, C.heat.fifty + 8)} />
      <Bolt t={t} t0={C.heat.fifty} x0={cx} y0={520} x1={cx} y1={1010} seed={11} w={11} j={70} />
      <Bolt t={t} t0={C.heat.fifty + 24} x0={cx} y0={520} x1={cx} y1={1010} seed={13} w={11} j={70} />
      <Bolt t={t} t0={C.heat.five} x0={cx} y0={520} x1={cx} y1={1010} seed={17} w={11} j={70} />
      <Flash t={t} t0={C.heat.fifty} />
      <Sun x={190} y={1130} s={0.9} o={pop(t, C.heat.five - 24)} />
      <HBar x={290} y={1100} w={150} p={easeOut(prog(t, C.heat.five - 20, C.heat.five - 4))} />
      <Lbl x={365} y={1190} o={prog(t, C.heat.five - 14, C.heat.five)} size={20}>{"SUN SURFACE"}</Lbl>
      <g transform="translate(190 1300) scale(0.9)" opacity={pop(t, C.heat.five)} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round"><path d="M10 -70 L-30 6 H0 L-14 70 L34 -10 H4 Z" /></g>
      <HBar x={290} y={1270} w={720} p={k} />
      <Txt x={cx + 80} y={1370} size={34} o={prog(t, C.heat.five + 20, C.heat.five + 32)} color="#bbb" spacing={4}>{"5 X HOTTER"}</Txt>
    </Cam>
    <Pill text="Five times the Sun" x={cx} y={1450} a={C.heat.five + 14} size={17} />
    <Src>NWS, Understanding Lightning Science</Src>
  </>;
};
// 2 survival: 90 % survive, 10 % killed
const SURV_COLS = 10, SURV_CELL = 72, SURV_X0 = cx - (SURV_COLS * SURV_CELL) / 2, SURV_Y0 = 470;
const Survive = (t: number) => {
  const dim = easeOut(prog(t, C.surv.ten, C.surv.ten + 20)), glow = prog(t, C.surv.ninety, C.surv.ninety + 12);
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 2, 1.04)}>
      <Num v={1} label="day" x={cx} y={300} size={150} o={prog(t, C.surv.dayOne, C.surv.dayOne + 8)} />
      <g style={{ filter: glow > 0.5 ? GLOW : undefined }}>
        {Array.from({ length: 100 }, (_, i) => {
          const col = i % SURV_COLS, row = Math.floor(i / SURV_COLS), on = prog(t, C.surv.dayOne + i * 0.3, C.surv.dayOne + i * 0.3 + 6);
          const out = i >= 90, f = out ? on * (1 - dim) : on;
          return <rect key={i} x={SURV_X0 + col * SURV_CELL + 4} y={SURV_Y0 + row * SURV_CELL + 4} width={SURV_CELL - 8} height={SURV_CELL - 8} rx={8}
            fill={INK} fillOpacity={f} stroke={INK} strokeOpacity={out ? 0.25 + 0.5 * dim : 0.15 * on} strokeWidth={2.5} strokeDasharray={out && dim > 0.3 ? "6 6" : undefined} />;
        })}
      </g>
      <Cross x={cx} y={SURV_Y0 + 9.5 * SURV_CELL} r={40} p={prog(t, C.surv.ten + 10, C.surv.ten + 30)} />
      <Num v="10%" label="killed" x={300} y={1320} size={110} dim o={prog(t, C.surv.ten, C.surv.ten + 10)} />
      <Num v="90%" label="survive" x={780} y={1320} size={110} o={prog(t, C.surv.ninety, C.surv.ninety + 10)} />
      {t > C.surv.ninety && t < C.surv.ninety + 40 && <Ring x={780} y={1260} t={(t - C.surv.ninety) / 40} />}
    </Cam>
    <Pill text="Says the weather service" x={cx} y={1440} a={C.surv.weather} size={14} on={false} />
    <Src>NWS, How Dangerous is Lightning?</Src>
  </>;
};
// 3 nervous system: injury is in how the brain works, scans look normal
const Nerves = (t: number) => {
  const wob = prog(t, C.nerve.nervous, C.nerve.nervous + 12);
  return <>
    <BigRings x={160} y={560} t={t} o={0.09} />
    <Cam {...cam(t, 3, 1.05)}>
      <Icon2 k="brain" x={cx} y={560} s={2.4} o={pop(t, 2)} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <path key={i} d={`M${cx + sx * 220} ${560 + sy * 120} q${sx * 90} ${sy * 30} ${sx * 150} ${sy * 130}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={`${easeOut(prog(t, C.nerve.nervous + i * 4, C.nerve.nervous + 24 + i * 4))} 1`} opacity={0.8} style={{ filter: GLOW }} />
      ))}
      <Bolt t={t} t0={C.nerve.nervous} x0={cx} y0={140} x1={cx} y1={400} seed={21} w={8} />
      <path d={Array.from({ length: 49 }, (_, i) => { const x = 80 + i * 20, a = 20 + 55 * wob * Math.abs(Math.sin(i * 0.9 + t * 0.3)); return `${i ? "L" : "M"}${x} ${1010 + (i % 2 ? -a : a) * 0.6}`; }).join(" ")} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" opacity={0.9 * prog(t, C.nerve.notFine, C.nerve.notFine + 12)} style={{ filter: GLOW }} />
      <g opacity={pop(t, C.nerve.scans)} transform="translate(0 0)">
        <Icon2 k="monitor" x={cx} y={1220} s={1.5} />
        <path transform={`translate(${cx - 8} ${1190}) scale(2.2)`} d="M-14 0 L-4 11 L16 -12" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} />
      </g>
      <Pill text="Surviving is not fine" x={cx} y={820} a={C.nerve.notFine} size={15} on={false} />
      <Pill text="Nervous system" x={cx} y={1110} a={C.nerve.nervous} size={17} />
    </Cam>
    <Pill text="Scan looks normal" x={cx} y={1440} a={C.nerve.scans + 8} size={16} on={false} />
    <Src>NWS, Medical Aspects of Lightning</Src>
  </>;
};
// 4 symptoms, then "day 300" (illustration)
const SYM: [string, "hourglass" | "brain" | "flame", number][] = [["Slow reactions", "hourglass", C.symp.slow], ["Memory trouble", "brain", C.symp.memory], ["Chronic pain", "flame", C.symp.memory + 28]];
const Symptoms = (t: number) => {
  const ys = spread(3, 340, 860);
  return <>
    <Starfield t={t} o={0.6} />
    <Cam {...cam(t, 4, 1.05)}>
      {SYM.map(([txt, k, a], i) => <g key={i}>
        <Icon2 k={k} x={250} y={ys[i]} s={1.1} o={pop(t, a)} />
        <Pill text={txt} x={690} y={ys[i]} a={a + 4} size={17} on={i === 0} />
      </g>)}
      <Num v={count(t, C.symp.day300, C.symp.day300 + 50, 30, 300)} label="day" x={cx} y={1230} size={190} o={prog(t, C.symp.day300 - 8, C.symp.day300)} />
      <Bolt t={t} t0={C.symp.day300 + 40} x0={cx} y0={960} x1={cx} y1={1110} seed={31} w={7} j={25} />
    </Cam>
    <Pill text="Illustration" x={cx} y={1440} a={C.symp.day300 + 6} size={15} on={false} />
    <Src>NWS, Medical Aspects of Lightning (symptoms); day 300 is imagined</Src>
  </>;
};
// 5 honest part: no one has tested daily strikes, no sign the body adapts
const GC = 19, GCELL = 40, GX0 = cx - (GC * GCELL) / 2, GY0 = 380;
const Honest = (t: number) => {
  const shown = lerp(0, 365, easeOut(prog(t, C.honest.honest, C.honest.nobody)));
  return <>
    <BigRings x={cx} y={820} t={t} o={0.09} />
    <Cam {...cam(t, 5, 1.05)}>
      <Num v="365" label="days" x={cx} y={260} size={110} o={prog(t, 2, 10)} dim />
      <g>
        {Array.from({ length: 365 }, (_, i) => <rect key={i} x={GX0 + (i % GC) * GCELL + 3} y={GY0 + Math.floor(i / GC) * GCELL + 3} width={GCELL - 6} height={GCELL - 6} rx={5} fill="#262626" opacity={i < shown ? 1 : 0} />)}
      </g>
      <Txt x={cx} y={900} size={420} weight={900} o={0.95 * pop(t, C.honest.nobody, 10)} color={INK}>?</Txt>
      <Pill text="No data" x={cx} y={1290} a={C.honest.nobody + 6} size={19} />
      <Pill text="Body adapts" x={cx} y={1410} a={C.honest.adapt} size={17} on={false} />
      <Cross x={cx} y={1410} r={46} p={prog(t, C.honest.adapt + 20, C.honest.adapt + 42)} />
    </Cam>
  </>;
};
// 6 Roy Sullivan: seven recorded strikes, 1942-1977 (true years on the timeline)
const YRS = [1942, 1969, 1970, 1972, 1973, 1976, 1977];
const TX = (y: number) => 130 + ((y - 1942) / 35) * 820;
const Sullivan = (t: number) => {
  const line = easeOut(prog(t, C.sull.seven - 6, C.sull.seven + 20));
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 6, 1.05)}>
      <Num v="7" label="recorded strikes" x={cx} y={400} size={260} o={prog(t, C.sull.seven, C.sull.seven + 6)} />
      <Person x={cx} y={880} s={2.6} o={pop(t, 2)} />
      {/* ranger hat on the head (head centre y = 880 - 62*2.6 = 719) */}
      <g transform={`translate(${cx} ${688}) scale(${pop(t, C.sull.ranger - 20)})`} fill="#000" stroke={INK} strokeWidth={4} strokeLinejoin="round" style={{ filter: GLOW }}>
        <ellipse cy={22} rx={86} ry={13} /><path d="M-44 20 L-34 -30 Q0 -44 34 -30 L44 20 Z" />
      </g>
      <line x1={TX(1942)} x2={TX(1942) + (TX(1977) - TX(1942)) * line} y1={1150} y2={1150} stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
      {YRS.map((y, i) => {
        const a = C.sull.seven + i * 6, p = pop(t, a);
        return <g key={y} opacity={p > 0 ? 1 : 0}>
          <g transform={`translate(${TX(y)} ${1150 - 60 * p}) scale(${0.7 * p})`} style={{ filter: GLOW }} fill={INK}><path d="M10 -70 L-30 6 H0 L-14 70 L34 -10 H4 Z" /></g>
          <line x1={TX(y)} x2={TX(y)} y1={1150} y2={1175} stroke={INK} strokeWidth={4} />
        </g>;
      })}
      <Txt x={TX(1942)} y={1245} size={40} o={prog(t, C.sull.years, C.sull.years + 8)}>{"1942"}</Txt>
      <Txt x={TX(1977)} y={1245} size={40} o={prog(t, C.sull.years + 14, C.sull.years + 22)}>{"1977"}</Txt>
      <Pill text="Virginia park ranger" x={cx} y={1340} a={C.sull.ranger} size={15} on={false} />
      <Pill text="Guinness record" x={cx} y={1430} a={C.sull.seven + 4} size={16} />
    </Cam>
    <Src>Guinness World Records (Roy Sullivan)</Src>
  </>;
};
// 7 details: truck, garden, boat, hair on fire
const Details = (t: number) => {
  const ys = spread(4, 330, 1330);
  const row = (i: number, a: number, label: string, icon: React.ReactNode) => <g key={i}>
    <g opacity={pop(t, a)}>{icon}</g>
    <Pill text={label} x={730} y={ys[i]} a={a + 3} size={17} on={i === 3} />
    <Bolt t={t} t0={a + 6} x0={250} y0={ys[i] - 200} x1={250} y1={ys[i] - 40} seed={41 + i} w={7} j={22} />
  </g>;
  return <>
    <Rays x={250} y={900} t={t} o={0.05} />
    <Cam {...cam(t, 7, 1.04)}>
      {row(0, C.det.truck, "In his truck", <Icon2 k="car" x={250} y={ys[0]} s={1.2} />)}
      {row(1, C.det.garden, "In his garden",
        <g transform={`translate(250 ${ys[1]}) scale(1.2)`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }}>
          <path d="M0 70 V-30 M0 20 C-50 20 -60 -20 -60 -50 C-20 -50 0 -20 0 20 M0 -10 C40 -10 55 -45 55 -70 C20 -70 0 -40 0 -10" /><line x1={-80} x2={80} y1={70} y2={70} />
        </g>)}
      {row(2, C.det.boat, "On a fishing boat",
        <g transform={`translate(250 ${ys[2]}) scale(1.2)`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }}>
          <path d="M-100 10 H100 L70 60 H-70 Z M0 10 V-80 M0 -80 L60 -10 H0" /><path d="M-110 85 q27 -18 55 0 t55 0 t55 0 t55 0" strokeWidth={3} />
        </g>)}
      {row(3, C.det.hair, "Hair on fire", <Icon2 k="flame" x={250} y={ys[3]} s={1.4} />)}
    </Cam>
    <Src>Guinness World Records (Roy Sullivan)</Src>
  </>;
};
// 8 end: 1 in 15,300 lifetime odds (NWS est.), if you hear thunder go inside
const End = (t: number) => {
  const gridOut = 1 - prog(t, C.end.thunder - 6, C.end.thunder + 6), hi = pop(t, C.end.thunder + 6);
  return <>
    <Starfield t={t} o={0.7} />
    <Cam {...cam(t, 8, 1.04)}>
      <Num v="1 in 15,300" label="lifetime odds" x={cx} y={400} size={110} o={prog(t, C.end.odds, C.end.odds + 10)} />
      <g opacity={gridOut}>
        {Array.from({ length: 144 }, (_, i) => <rect key={i} x={204 + (i % 12) * 56 + 3} y={560 + Math.floor(i / 12) * 56 + 3} width={50} height={50} rx={6} fill={i === 77 ? INK : "#262626"} style={{ filter: i === 77 ? GLOW : undefined }} opacity={pop(t, C.end.odds + 4 + (i % 12) * 0.6) > 0 ? 1 : 0} />)}
      </g>
      <g opacity={hi}>
        <Cloud x={cx} y={740} s={1.6} />
        <path transform={`translate(${cx} ${1060}) scale(3.2)`} d="M-60 20 V-30 L0 -75 L60 -30 V20 Z M-18 20 V-12 H18 V20" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" style={{ filter: GLOW }} />
      </g>
      <Bolt t={t} t0={C.end.thunder + 18} x0={cx - 250} y0={790} x1={cx - 320} y1={960} seed={51} w={6} j={30} />
      {t > C.end.inside && t < C.end.inside + 45 && <Ring x={cx} y={1060} t={(t - C.end.inside) / 45} />}
    </Cam>
    <Pill text="Hear thunder" x={cx} y={1330} a={C.end.thunder} size={17} on={false} />
    <Pill text="Go inside" x={cx} y={1440} a={C.end.inside} size={22} />
    <Src>NWS estimate, US lifetime odds</Src>
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Heat, "zoomIn", "whipL"], [Survive, "whipL", "whipUp"], [Nerves, "whipUp", "zoomOut"], [Symptoms, "zoomOut", "whipR"],
  [Honest, "whipR", "zoomIn"], [Sullivan, "zoomIn", "whipL"], [Details, "whipL", "zoomOut"], [End, "zoomOut", "iris"],
];
export const LightningShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("lightning/voice.wav")} />
    {SC.map(([Comp, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{Comp}</SceneFx>)}
  </Stage>
);
