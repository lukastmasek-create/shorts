// "Degree" short: 2D mono line-art, credentials-as-signal explainer. Layout language learned from a study clip; original wording.
import React from "react";
import { Stage, Scene, Pill, Num, Person, Ground, Cross, Ring, Icon, W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Hat, Waffle, Spot, Box, Txt, Trace } from "./kit2";

export const DEGREE_FRAMES = 2302;
const cx = W / 2;
const Bars: React.FC<{ x: number; y: number; vals: number[]; w?: number; max?: number; o?: number }> = ({ x, y, vals, w = 130, max = 420, o = 1 }) => (
  <g opacity={o}>{vals.map((v, i) => <rect key={i} x={x + i * (w + 36)} y={y - max * v} width={w} height={max * v} rx={5} fill="#fff" style={{ filter: "drop-shadow(0 0 10px #fff)" }} />)}</g>
);

// 0 crowd of 40, one gets a cap in a spotlight, counter of graduates
const Crowd = (t: number) => {
  const n = t < 80 ? 1 : Math.round(lerp(1, 12, easeOut(prog(t, 80, 150))));
  const cols = 8, caps = [11, 14, 21, 27, 29, 33, 3, 9, 17, 35, 5, 38];
  return <>
    <Txt x={cx} y={190} size={20} color="#999" spacing={5}>WITH A DEGREE (OUT OF 40)</Txt>
    <Num v={n} x={cx} y={330} size={110} o={prog(t, 80, 90)} />
    {Array.from({ length: 40 }, (_, i) => {
      const x = 170 + (i % cols) * 105 - 0, y = 640 + Math.floor(i / cols) * 160;
      const hero = i === 11 && t < 120, capped = caps.slice(0, n).includes(i);
      return <g key={i}><Person x={x} y={y} s={0.95} o={capped || hero ? 1 : 0.45} fill glow={capped || hero} />{(capped || (i === 11 && t > 30)) && <Hat x={x} y={y - 66} s={1.1} />}</g>;
    })}
    {t > 40 && t < 130 && <Spot x={170 + 3 * 105} top={0} bottom={760} o={prog(t, 40, 55) * (1 - prog(t, 115, 130))} />}
    <Pill text="Rare" x={170 + 3 * 105} y={440} a={60} o={1 - prog(t, 115, 125)} size={16} />
    <Pill text="Average" x={cx} y={1200} a={160} size={16} />
  </>;
};
// 1 safe path timeline: study hard -> diploma -> good job
const Path = (t: number) => {
  const px = lerp(90, 760, easeIO(prog(t, 20, 140)));
  const stops: [string, "book" | "cert" | "stack", number][] = [["Study hard", "book", 220], ["Diploma", "cert", 540], ["Good job", "stack", 860]];
  return <>
    <Pill text="The safe path" x={cx} y={250} size={16} />
    <line x1={60} x2={W - 60} y1={1100} y2={1100} stroke="#fff" strokeWidth={4} style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
    {stops.map(([s, k, x], i) => <g key={s}><circle cx={x} cy={1100} r={8} fill={px > x ? "#fff" : "#666"} />
      <Pill text={s} x={x} y={650} a={10 + i * 15} on={px > x - 40} size={12} />
      <Icon2 k={k === "stack" ? "chart" : k} x={x} y={880} s={0.9} o={prog(px, x - 140, x - 80)} /></g>)}
    <Person x={px} y={1090} s={1.6} />
  </>;
};
// 2 EU 2024 waffle: 0 -> 44%
const Share = (t: number) => {
  const p = easeOut(prog(t, 20, 100)), lit = 44 * p;
  return <>
    <Pill text="EU · 2024" x={cx - 250} y={300} on={false} size={14} />
    <Num v={Math.round(lit) + "%"} x={cx - 230} y={460} size={130} />
    <Txt x={cx - 230} y={520} size={20} color="#999" spacing={4}>OF YOUNG EUROPEANS (25-34)</Txt>
    <Waffle x={cx - 130} y={640} cols={10} rows={10} cell={64} lit={lit} />
    <Txt x={cx + 190} y={1330} size={16} color="#888" spacing={4}>HAVE A DEGREE</Txt>
  </>;
};
// 3 grid zoom: one stops standing out, raise the bar
const Common = (t: number) => <>
  <Waffle x={cx - 280} y={500} cols={10} rows={10} cell={56} lit={44} o={1 - prog(t, 100, 110)} />
  <Pill text="Stops standing out" x={cx} y={380} a={50} size={16} o={1 - prog(t, 100, 110)} />
  <rect x={cx - 280 + 4 * 56} y={500 + 4 * 56} width={51} height={51} rx={4} fill="#fff" style={{ filter: "drop-shadow(0 0 14px #fff)" }} opacity={prog(t, 30, 45) * (1 - prog(t, 100, 110))} />
  <Pill text="Raise the bar" x={cx} y={300} a={110} size={16} />
  <line x1={cx - 230} x2={cx - 230} y1={560} y2={1450} stroke="#fff" strokeWidth={3} opacity={prog(t, 110, 120)} />
  <line x1={cx + 230} x2={cx + 230} y1={560} y2={1450} stroke="#fff" strokeWidth={3} opacity={prog(t, 110, 120)} />
  <line x1={cx - 230} x2={cx + 230} y1={lerp(1000, 720, easeOut(prog(t, 120, 170)))} y2={lerp(1000, 720, easeOut(prog(t, 120, 170)))} stroke="#fff" strokeWidth={10} style={{ filter: "drop-shadow(0 0 10px #fff)" }} opacity={prog(t, 110, 120)} />
  <Person x={cx} y={1450} s={2.4} o={prog(t, 110, 120)} />
</>;
// 4 job ads 67% vs 16%
const Ads = (t: number) => <>
  <Pill text="Job study" x={cx} y={260} size={16} />
  <Num v={Math.round(67 * easeOut(prog(t, 20, 70))) + "%"} x={cx - 190} y={800 - 560 * 0.67 * easeOut(prog(t, 20, 70)) - 30} size={90} />
  <Bars x={cx - 255} y={1100} vals={[0.67 * easeOut(prog(t, 20, 70)) / 0.67 * 0.67 * 1.4, 0.16 * easeOut(prog(t, 70, 110)) * 1.4]} w={140} />
  <Num v={Math.round(16 * easeOut(prog(t, 70, 110))) + "%"} x={cx + 80} y={1100 - 420 * 0.16 * 1.4 * easeOut(prog(t, 70, 110)) - 80} size={80} />
  <Txt x={cx - 185} y={1160} size={14} color="#888" spacing={3}>JOB ADS ASKING</Txt><Txt x={cx - 185} y={1185} size={14} color="#888" spacing={3}>FOR A DEGREE</Txt>
  <Txt x={cx + 90} y={1160} size={14} color="#888" spacing={3}>PEOPLE DOING IT</Txt><Txt x={cx + 90} y={1185} size={14} color="#888" spacing={3}>WHO HAVE ONE</Txt>
  <line x1={60} x2={W - 60} y1={1100} y2={1100} stroke="#fff" strokeDasharray="8 8" opacity={0.5} />
</>;
// 5 same job, entry requirement changes
const Door = (t: number) => <>
  <Pill text="Same job" x={cx} y={560} a={5} />
  <Icon2 k="door" x={cx} y={900} s={1.6} />
  <Ground y={1130} />
  <Person x={lerp(170, 430, easeOut(prog(t, 5, 45)))} y={1130} s={1.5} o={1 - prog(t, 120, 140)} />
  <Pill text={t < 90 ? "Entry: school diploma" : "Entry: university degree"} x={cx + 120} y={760} a={30} on={false} size={14} />
</>;
// 6 schools branch: jobs that need a degree vs don't
const Branch = (t: number) => {
  const n = Math.round(52 * easeOut(prog(t, 90, 150)));
  return <>
    <Icon2 k="building" x={170} y={620} s={0.9} />
    <Pill text="Graduates" x={170} y={480} size={14} />
    <path d={`M280 620 H${lerp(280, 600, easeOut(prog(t, 20, 45)))}`} stroke="#fff" strokeWidth={3} fill="none" />
    <path d="M600 620 C760 620 800 440 1040 440 M600 620 C760 620 800 800 1040 800" stroke="#fff" strokeWidth={3} fill="none" opacity={prog(t, 45, 65)} />
    <Pill text="Jobs that need a degree" x={820} y={390} on={false} size={12} a={80} />
    <Pill text="Jobs that don't" x={820} y={860} a={80} size={12} />
    <Num v={n + "%"} label="of graduates" x={cx} y={1250} size={140} o={prog(t, 90, 100)} />
    {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={lerp(280, 1000, easeOut(prog(t, 30 + i * 8, 120 + i * 8)))} cy={620 + (i % 3 ? 1 : -1) * 0} r={9} fill="#fff" opacity={prog(t, 30 + i * 8, 36 + i * 8)} style={{ filter: "drop-shadow(0 0 8px #fff)" }} />)}
    <Pill text="USA · one year after graduating" x={cx} y={190} a={150} on={false} size={12} />
  </>;
};
// 7 year counter + a certificate with a ring; book "teaches nothing?"
const Signal = (t: number) => <>
  <Num v={1973} label="year" x={cx} y={400} size={170} o={prog(t, 5, 15)} />
  <Icon2 k="cert" x={cx + 140} y={t < 60 ? 900 : 1020} s={1.8} o={pop(t, 50)} />
  <Pill text="Still worth something" x={cx + 140} y={1180} a={70} on={false} size={12} />
  <Icon2 k="book" x={cx - 300} y={1000} s={1} o={pop(t, 100)} />
  <Pill text="Teaches nothing?" x={cx - 300} y={1140} a={105} on={false} size={12} />
  <Pill text="It's a signal" x={cx + 100} y={700} a={130} size={20} />
  {t > 135 && <Ring x={cx + 140} y={1020} t={(t - 135) / 40} />}
  <Icon2 k="medal" x={cx + 340} y={1400} s={1} o={pop(t, 170)} />
  <Pill text="Nobel prize · 2001" x={cx + 340} y={1520} a={175} on={false} size={11} />
</>;
// 8 pipeline: school -> certificate -> employers filter ; you pay
const Pipe = (t: number) => <>
  <Icon2 k="building" x={300} y={600} s={1.1} />
  <Pill text="Schools" x={300} y={460} on={false} size={14} />
  <line x1={420} x2={W - 220} y1={600} y2={600} stroke="#fff" strokeDasharray="8 8" opacity={0.7} />
  <Icon2 k="cert" x={lerp(420, W - 270, easeIO(prog(t, 20, 90)))} y={600} s={0.3} />
  <Icon2 k="funnel" x={W - 150} y={620} s={0.9} o={pop(t, 60)} />
  <Pill text="Employers" x={W - 150} y={480} a={62} on={false} size={12} />
  <Pill text="Filter" x={W - 150} y={760} a={80} size={12} />
  <Person x={300} y={1100} s={2} o={pop(t, 110)} />
  <line x1={300} x2={300} y1={680} y2={960} stroke="#fff" strokeDasharray="6 6" opacity={prog(t, 105, 115) * 0.6} />
  <Pill text="You pay" x={300} y={1190} a={115} size={14} />
  <Icon2 k="hourglass" x={140} y={1100} s={0.7} o={pop(t, 130)} /><Pill text="Years" x={140} y={1220} a={132} on={false} size={11} />
  <Icon2 k="coins" x={560} y={1090} s={0.5} o={pop(t, 150)} /><Pill text="Debt" x={560} y={1200} a={152} on={false} size={11} />
</>;
// 9 signal vs noise waves
const Noise = (t: number) => <>
  <Pill text="Signal" x={cx} y={520} a={5} on={false} size={16} o={1 - prog(t, 95, 100)} />
  <Trace x={0} y={H / 2} w={W} amp={110} t={t} mode="sine" sw={6} o={1 - prog(t, 95, 105)} />
  {t > 40 && t < 100 && [0, 1, 2, 3].map(i => <Trace key={i} x={0} y={H / 2} w={W} amp={110 - i * 15} t={t + i * 12} mode="sine" sw={2} o={0.5 * prog(t, 40 + i * 6, 50 + i * 6)} />)}
  <Trace x={0} y={H / 2 + 20} w={W} amp={190} t={t * 3} sw={3} o={prog(t, 95, 105)} />
  <Pill text="Noise" x={cx} y={1250} a={105} size={18} />
</>;
// 10 collecting paper crossed -> build proof
const Proof = (t: number) => <>
  <Ground y={1100} o={0.6} />
  <Icon2 k="stack" x={cx} y={1010} s={1.4} o={(1 - prog(t, 110, 125)) * pop(t, 5)} />
  <Cross x={cx} y={1010} r={80} p={prog(t, 50, 65) * (1 - prog(t, 110, 120))} />
  <Pill text="Collecting paper" x={cx} y={730} a={25} on={false} size={14} o={1 - prog(t, 110, 120)} />
  <Pill text="Build proof" x={cx} y={300} a={125} size={20} />
  <rect x={cx - 190} y={1150 - 180} width={150} height={180} rx={10} fill="none" stroke="#fff" strokeWidth={3.5} opacity={pop(t, 135)} style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
  <Icon2 k="eye" x={cx - 115} y={870} s={0.6} o={pop(t, 150)} />
  <rect x={cx + 20} y={1150 - 300} width={150} height={300} rx={10} fill="none" stroke="#fff" strokeWidth={3.5} opacity={pop(t, 160)} style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
  <Icon2 k="monitor" x={cx - 115} y={750} s={0.6} o={pop(t, 170)} />
  <Icon2 k="chart" x={cx + 95} y={780} s={0.6} o={pop(t, 185)} />
  <Pill text="Skills people can see" x={cx} y={1220} a={150} on={false} size={14} />
</>;
// 11 you sat through it -> stairs, you can do it
const Finale = (t: number) => <>
  <Icon2 k="cert" x={cx} y={500} s={1.4} o={(1 - prog(t, 80, 95)) * pop(t, 5)} />
  <Icon2 k="chair" x={cx} y={900} s={1.2} o={(1 - prog(t, 80, 95)) * pop(t, 20)} />
  <Pill text="You sat through it" x={cx} y={300} a={25} on={false} size={14} o={1 - prog(t, 80, 95)} />
  <Bars x={cx - 260} y={1300} vals={[0.25, 0.5, 0.85].map((v, i) => v * easeOut(prog(t, 95 + i * 10, 115 + i * 10)))} w={150} max={420} o={prog(t, 95, 105)} />
  <Person x={lerp(cx - 190, cx + 230, easeIO(prog(t, 125, 160)))} y={1300 - lerp(0.25, 0.85, easeIO(prog(t, 125, 160))) * 420 - 0} s={1.6} o={prog(t, 120, 128)} />
  <Pill text="You can do it" x={cx} y={560} a={150} size={20} />
  {t > 160 && <Ring x={cx + 230} y={1230 - 260} t={(t - 160) / 40} />}
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 200, Crowd], [200, 320, Path], [320, 440, Share], [440, 640, Common], [640, 780, Ads], [780, 940, Door], [940, 1190, Branch],
  [1190, 1450, Signal], [1450, 1610, Pipe], [1610, 1750, Noise], [1750, 2000, Proof], [2000, 2302, Finale],
];
export const DegreeShort: React.FC = () => <Stage>{SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}</Stage>;
