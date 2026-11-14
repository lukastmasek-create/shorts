// "Calm" short: 2D mono line-art, composure explainer. Layout language learned from a study clip; original wording.
import React from "react";
import { Stage, Scene, Pill, Num, Person, Ground, Cross, Ring, Icon, W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, SuitMan, Gauge, Beat, Trace, Box, Txt, Check } from "./kit2";

export const CALM_FRAMES = 1702;
const cx = W / 2;

// 0 threat meter climbs, heartbeat stays flat, calm man ringed
const Threat = (t: number) => {
  const th = Math.round(99 * easeIO(prog(t, 5, 105)));
  return <>
    <Txt x={80} y={190} size={20} anchor="start" color="#999" spacing={4}>THREAT</Txt>
    <Num v={th + "%"} x={W - 130} y={230} size={70} />
    <Trace x={80} y={340} w={W - 160} amp={50} t={t} o={prog(t, 10, 30)} />
    <Txt x={80} y={500} size={20} anchor="start" color="#999" spacing={4}>HIS HEART RATE</Txt>
    <Beat x={80} y={640} w={W - 160} t={t} />
    <Num v="60" label="bpm" x={W - 130} y={600} size={70} />
    {[[200, 1060], [W - 200, 1060], [330, 900], [W - 330, 900]].map(([x, y], i) => <Icon2 key={i} k="warning" x={x} y={y} s={0.5} o={pop(t, 10 + i * 6) * (0.4 + 0.6 * (Math.sin(t * 0.3 + i) > 0 ? 1 : 0.3))} />)}
    <Ground y={1250} />
    <SuitMan x={cx} y={1250} s={2.2} />
    {t > 80 && <Ring x={cx} y={1160} t={(t - 80) / 30} />}
    <Pill text="Never panics" x={cx} y={760} a={85} />
    <Pill text="Not the gun" x={cx + 200} y={1050} a={50} on={false} size={14} />
    <Cross x={cx + 230} y={1130} r={30} p={prog(t, 55, 68)} />
  </>;
};
// 1 most people think power is: strongest / richest / loudest
const Power = (t: number) => <>
  <Pill text="Most people think power is" x={cx} y={250} on={false} size={16} />
  <Ground y={900} />
  <Person x={260} y={900} s={3.2} o={pop(t, 5)} />
  <Pill text="The strongest" x={260} y={560} a={8} size={16} />
  <Person x={cx} y={900} s={2.2} o={pop(t, 45)} glow={false} />
  <Icon2 k="coins" x={cx} y={660} s={0.9} o={pop(t, 50)} />
  <Pill text="The richest" x={cx} y={470} a={50} size={16} />
  <Person x={W - 220} y={900} s={2.2} o={pop(t, 85)} />
  <Icon2 k="megaphone" x={W - 130} y={800} s={0.8} o={pop(t, 90)} />
  <Pill text="The loudest" x={W - 220} y={650} a={88} size={16} />
</>;
// 2 car destroyed / plan falling apart
const Wreck = (t: number) => <>
  <Ground y={1100} />
  <g transform={`rotate(${easeOut(prog(t, 50, 70)) * 14} ${cx} 1100) translate(0 ${easeOut(prog(t, 50, 70)) * 30})`}><Icon2 k="car" x={cx} y={1020} s={2.2} o={1 - prog(t, 70, 100) * 0.5} /></g>
  <Pill text="Car: destroyed" x={cx} y={760} a={55} on={false} size={16} />
  <Box x={cx} y={400} w={360} h={230} o={pop(t, 90)} />
  <polyline points={`${cx - 130},${330} ${cx - 90},${400} ${cx - 40},${360} ${cx},${420} ${cx + 60},${370}`} fill="none" stroke="#fff" strokeWidth={4} opacity={prog(t, 100, 115)} />
  <Pill text="Plan: falling apart" x={cx} y={230} a={95} size={16} />
</>;
// 3 gun to his head, cuff, all the time in the world
const Cuff = (t: number) => <>
  <Pill text="Gun to his head" x={cx} y={560} a={5} size={16} />
  <circle cx={cx} cy={810} r={46} fill="none" stroke="#fff" strokeWidth={4} opacity={prog(t, 8, 16)} style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
  <line x1={cx - 70} x2={cx + 70} y1={810} y2={810} stroke="#fff" strokeWidth={3} opacity={prog(t, 8, 16)} />
  <Ground y={1000} />
  <SuitMan x={cx} y={1000} s={3.2} />
  <Pill text="Fixes his cuff" x={cx + 330} y={900} a={55} size={16} />
  <circle cx={cx + 110} cy={920} r={30} fill="none" stroke="#fff" strokeWidth={3} opacity={prog(t, 50, 60) * (1 - prog(t, 80, 95))} />
  <Beat x={cx - 260} y={420} w={520} t={t} o={prog(t, 80, 95)} />
  <Num v="60" label="bpm" x={cx} y={330} size={80} o={prog(t, 80, 95)} />
  <Pill text="All the time in the world" x={cx} y={190} a={110} on={false} size={14} />
</>;
// 4 arrogance gauge crossed -> control
const Control = (t: number) => <>
  <Gauge x={cx + 120} y={900} s={3} a={t < 60 ? lerp(0.9, 0.3, easeOut(prog(t, 0, 30))) : lerp(0.3, 0.5, easeOut(prog(t, 60, 80)))} ticks />
  <Pill text="Arrogance" x={cx - 250} y={600} size={16} o={1 - prog(t, 70, 80)} />
  <Cross x={cx - 250} y={600} r={70} p={prog(t, 40, 55)} />
  <Pill text="Control" x={cx + 120} y={640} a={80} size={18} />
  {t > 90 && <Ring x={cx + 120} y={900} t={(t - 90) / 30} />}
</>;
// 5 brain: panic, thinking vs reacting, bad decisions counter
const Panic = (t: number) => {
  const n = Math.round(9 * easeOut(prog(t, 100, 170)));
  return <>
    <Icon2 k="brain" x={cx - 200} y={640} s={2.2} />
    <Pill text="Panic" x={cx - 200} y={420} a={10} size={18} />
    <Pill text="Thinking" x={cx - 330} y={1000} on={false} size={14} o={0.5} />
    <Pill text="Reacting" x={cx - 90} y={1000} a={60} size={14} />
    <Icon2 k="warning" x={cx - 90} y={910} s={0.35} o={pop(t, 62)} />
    <Num v={n} label="bad decisions" x={W - 220} y={460} size={110} o={prog(t, 95, 105)} />
    {Array.from({ length: n }, (_, i) => <Cross key={i} x={W - 330 + (i % 3) * 110} y={620 + Math.floor(i / 3) * 110} r={22} p={1} />)}
  </>;
};
// 6 stays cold, everyone else reacting, 3 moves ahead
const Cold = (t: number) => <>
  <Ground y={1000} />
  {[0, 1, 2].map(i => <Person key={i} x={170 + i * 100} y={1000} fill={false} o={0.5 * prog(t, 50, 70)} />)}
  <Pill text="Everyone else: reacting" x={290} y={820} a={55} on={false} size={14} />
  <SuitMan x={W - 330} y={1000} s={2.2} />
  <Pill text="Stays cold" x={W - 330} y={800} a={5} size={16} />
  {[1, 2, 3].map(i => { const k = easeOut(prog(t, 90 + i * 14, 104 + i * 14)); return <g key={i} opacity={k}><circle cx={W - 330 - i * 120 + 60 + 0} cy={1000 - 120 * (i % 2 ? 1 : 0.6) - i * 20} r={18} fill="#000" stroke="#fff" strokeWidth={3} /><text x={W - 330 - i * 120 + 60} y={1000 - 120 * (i % 2 ? 1 : 0.6) - i * 20} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={20} fontWeight={800}>{i}</text></g>; })}
  <Pill text="3 moves ahead" x={cx} y={620} a={140} size={14} />
</>;
// 7 controls the room
const Room = (t: number) => <>
  <Pill text="Controls the room" x={cx} y={300} a={20} size={16} />
  <Box x={cx} y={760} w={760} h={720} o={prog(t, 20, 35) * 0.7} sw={2} />
  <Ground y={1100} />
  {[-2, -1, 1, 2].map(i => <Person key={i} x={cx + i * 150} y={1090 + Math.abs(i) * 6} s={0.9} fill={false} o={0.6} />)}
  <SuitMan x={cx} y={1100} s={2.2} />
  <defs><radialGradient id="rg"><stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
  <circle cx={cx} cy={980} r={260} fill="url(#rg)" />
  {["A fight", "A deal", "A crisis"].map((s, i) => <Pill key={s} text={s} x={cx} y={470} a={50 + i * 40} on={false} size={12} o={prog(t, 50 + i * 40, 55 + i * 40) * (1 - prog(t, 85 + i * 40, 92 + i * 40))} />)}
  <Pill text="A gift" x={cx} y={1500} a={175} on={false} size={16} />
  <Cross x={cx} y={1500} r={70} p={prog(t, 190, 205)} />
</>;
// 8 trained: 3 step cards
const Trained = (t: number) => {
  const cards: [string, "lungs" | "brain" | "arrow"][] = [["Breathe slow", "lungs"], ["Think first", "brain"], ["Move second", "arrow"]];
  return <>
    <Icon2 k="lungs" x={160} y={230} s={0.4} o={0.7} /><Cross x={160} y={230} r={40} p={1} />
    <Pill text="Trained" x={W - 220} y={230} a={5} size={16} />
    {cards.map(([s, k], i) => { const y = 520 + i * 290; const o = pop(t, 30 + i * 35);
      return <g key={s} opacity={o}><Box x={cx} y={y} w={640} h={200} sw={2.5} />
        <Txt x={cx - 290} y={y - 60} size={14} anchor="start" color="#888" spacing={4}>{`STEP ${i + 1}`}</Txt>
        <Txt x={cx - 290} y={y + 70} size={28} anchor="start" spacing={3}>{s.toUpperCase()}</Txt>
        <Icon2 k={k} x={cx + 200} y={y - 10} s={0.75} /></g>; })}
  </>;
};
// 9 flames around man, don't flinch, checklist
const Flinch = (t: number) => <>
  <Pill text="Don't flinch" x={cx} y={190} a={20} />
  <Num v="60" label="bpm" x={cx} y={400} size={90} o={prog(t, 30, 40)} />
  <Ground y={1000} />
  {[-420, -300, -190, 190, 300, 420].map((d, i) => <Icon2 key={d} k="flame" x={cx + d} y={960 - (i === 0 || i === 5 ? 0 : 0)} s={[1.05, 0.7, 0.5, 0.5, 0.7, 1.05][i] * (1 + 0.06 * Math.sin(t * 0.4 + i))} />)}
  <SuitMan x={cx} y={1000} s={2.2} />
  {[["Fix your cuff", 60], ["Breathe", 95], ["Handle it", 130]].map(([s, a], i) => <g key={s as string}><Pill text={s as string} x={cx - 40} y={1250 + i * 90} a={a as number} on={i === 2} size={14} /><Check x={cx + 220} y={1250 + i * 90} o={prog(t, (a as number) + 6, (a as number) + 12)} /></g>)}
</>;
// 10 pressure gauge + performance bar, at his best
const Best = (t: number) => {
  const p = easeIO(prog(t, 10, 70));
  return <>
    <Gauge x={260} y={500} s={2.2} a={lerp(0.5, 0.82, p) * (t < 30 ? 1 : 1)} ticks />
    <Txt x={260} y={560} size={16} color="#999" spacing={4}>PRESSURE</Txt>
    <Pill text="Max" x={420} y={380} on={false} size={12} />
    <Txt x={W - 380} y={370} size={14} anchor="start" color="#999" spacing={4}>PERFORMANCE</Txt>
    <rect x={W - 380} y={395} width={300} height={14} fill="none" stroke="#fff" strokeWidth={2} opacity={0.7} />
    <rect x={W - 380} y={395} width={300 * p} height={14} fill="#fff" style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
    <Ground y={1100} />
    <SuitMan x={cx} y={1100} s={2.4} />
    <Pill text="At his best" x={cx} y={760} a={80} />
    {t > 90 && <Ring x={cx} y={1000} t={(t - 90) / 40} />}
  </>;
};

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 190, Threat], [190, 340, Power], [340, 470, Wreck], [470, 620, Cuff], [620, 760, Control], [760, 930, Panic],
  [930, 1090, Cold], [1090, 1290, Room], [1290, 1450, Trained], [1450, 1590, Flinch], [1590, 1702, Best],
];
export const CalmShort: React.FC = () => <Stage>{SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}</Stage>;
