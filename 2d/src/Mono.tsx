// "Mono" short: pure 2D white line-art on black (style study of a pension explainer, see references/MONO_STYLE.md).
// Original story + layout; only the visual language (glow icons, pills, big numbers, whip transitions) is reused.
import React from "react";
import { Stage, Scene, Pill, Num, Person, Ground, Cross, Ring, Icon, Bar, W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";

export const MONO_FRAMES = 1840;
const cx = W / 2;

// 1. timeline: ages tick by, dim past selves trail behind, chest waits at the far end
const Timeline = (t: number) => {
  const age = Math.round(lerp(20, 66, easeIO(prog(t, 0, 110))));
  const px = lerp(140, 640, easeIO(prog(t, 0, 110)));
  return <>
    <Num v={age} label="age" x={cx} y={300} size={130} />
    <Ground y={760} />
    {[0, 1, 2, 3].map(i => <Person key={i} x={px - 60 - i * 46} y={760} s={0.9} fill={false} o={0.5 - i * 0.08} />)}
    <Person x={px} y={760} s={1.1} />
    <Icon k="chest" x={940} y={730} s={0.55} p={pop(t, 20)} />
    <Pill text="Pension" x={940} y={610} a={20} size={20} />
    <Pill text="Most never collect" x={cx} y={470} a={90} on={false} size={20} />
    {t > 120 && <Ring x={940} y={730} t={(t - 120) / 25} />}
  </>;
};
// 2. "what most people think": work bar fills, trophy waits
const Think = (t: number) => <>
  <Pill text="What most people think" x={cx} y={300} on={false} size={20} />
  <Icon k="trophy" x={cx} y={1000} s={1.1} p={pop(t, 30)} />
  <Pill text="The reward" x={cx} y={820} a={30} />
  <Bar x={140} y={1300} w={800} p={easeIO(prog(t, 40, 150))} dashedTail={0.78} />
  <Num v={Math.round(40 * easeIO(prog(t, 40, 150)))} label="years worked" x={cx} y={1180} size={110} />
  <Person x={lerp(150, 800, easeIO(prog(t, 40, 150)))} y={1285} s={0.6} />
</>;
// 3. year rewind to 1889 + Germany + law
const Rewind = (t: number) => {
  const y = Math.round(lerp(2022, 1889, easeOut(prog(t, 0, 70))));
  return <>
    <Num v={y} label="year" x={cx} y={H / 2 - 40} size={230} />
    <text x={cx + 360} y={H / 2 - 120} fill="#fff" fontSize={90} fontWeight={800} opacity={1 - prog(t, 70, 80)}>«</text>
    <Pill text="Germany" x={cx} y={H / 2 + 260} a={80} />
    <Icon k="doc" x={cx} y={H / 2 + 520} s={1.4} p={pop(t, 110)} />
    <Pill text="World's first national pension" x={cx} y={H / 2 + 780} a={125} on={false} size={20} />
  </>;
};
// 4. age to collect: 0 -> 70, row of people
const Collect = (t: number) => {
  const a = Math.round(lerp(0, 70, easeOut(prog(t, 20, 70))));
  return <>
    <Num v={a} label="age to collect" x={cx} y={t < 100 ? 900 : 360} size={t < 100 ? 240 : 150} />
    <Ground y={1100} o={prog(t, 100, 115) * 0.5} />
    {Array.from({ length: 10 }, (_, i) => <Person key={i} x={110 + i * 95} y={1100} fill={false} o={prog(t, 100 + i * 2, 108 + i * 2)} />)}
  </>;
};
// 5. most never made it: two survivors light up, benefit flows to them
const Survivors = (t: number) => {
  const lit = [2, 7];
  return <>
    <Num v={70} label="age to collect" x={cx} y={190} size={110} o={0.5} />
    <Pill text="Most never made it" x={cx} y={470} on />
    <Ground y={760} o={.5} />
    {Array.from({ length: 10 }, (_, i) => <Person key={i} x={110 + i * 95} y={760} fill={lit.includes(i) && t > 25} glow o={lit.includes(i) ? 1 : 0.5 - prog(t, 40, 60) * 0.4} />)}
    <Icon k="chest" x={cx} y={1250} s={1} p={pop(t, 60)} />
    <Pill text="Pension" x={cx} y={1110} a={60} />
  </>;
};
// 6. why: kindness (crossed heart), revolution (crossed flag)
const Why = (t: number) => <>
  <Icon k="heart" x={cx - 190} y={560} s={1} p={pop(t, 5)} />
  <Pill text="Kindness?" x={cx + 120} y={540} a={20} on={false} size={20} />
  <Cross x={cx - 190} y={560} r={70} p={prog(t, 45, 60)} />
  <Icon k="flag" x={cx} y={1200} s={1.1} p={pop(t, 80)} />
  <Pill text="Revolution" x={cx} y={1000} a={85} on={false} size={20} />
  <Cross x={cx} y={1200} r={80} p={prog(t, 125, 140)} />
  <Pill text="Loyal" x={cx} y={1500} a={150} />
</>;
// 7. age falls 70 -> 65, globe copies the deal
const World = (t: number) => <>
  <Num v={Math.round(lerp(70, 65, easeIO(prog(t, 0, 40))))} label="age to collect" x={cx} y={300} size={150} />
  <Icon k="globe" x={cx} y={H / 2 + 100} s={2.2} p={pop(t, 45, 14)} />
  <Pill text="The world copied the deal" x={cx} y={H / 2 - 220} a={55} on={false} size={20} />
  {[[-60, -40], [70, -90], [150, 30], [-130, 50], [20, 80], [-20, -110]].map(([x, y], i) =>
    <rect key={i} x={cx + x * 2.2 - 14} y={H / 2 + 100 + y * 2.2 - 18} width={28} height={36} rx={5} fill="#fff" opacity={prog(t, 70 + i * 6, 76 + i * 6)} />)}
</>;
// 8. bar: work whole life / enjoy what's left
const Life = (t: number) => <>
  <Pill text="Work your whole life" x={cx - 150} y={1180} a={5} size={20} />
  <Bar x={80} y={1250} w={920} p={0.78 * easeIO(prog(t, 10, 80))} />
  <rect x={80 + 920 * 0.8} y={1250} width={920 * 0.2} height={56} rx={6} fill="none" stroke="#fff" strokeWidth={3} opacity={prog(t, 80, 90)} />
  <Pill text="Enjoy what's left" x={cx + 250} y={1180} a={90} on={false} size={20} />
</>;
// 9. scales: best years + energy + health vs a few years at the end
const Scales = (t: number) => {
  const stack = [["Best years", 40], ["Energy", 70], ["Health", 100]] as const;
  const tilt = easeIO(prog(t, 30, 55)) * 10 - easeIO(prog(t, 140, 170)) * 24;
  const ang = tilt * Math.PI / 180;
  const L = 330, py = 560;
  const lx = cx - L * Math.cos(ang), ly = py + L * Math.sin(ang), rx = cx + L * Math.cos(ang), ry = py - L * Math.sin(ang);
  return <>
    <Pill text="The trade" x={cx} y={250} a={6} size={20} />
    <g style={{ filter: "drop-shadow(0 0 8px #fff)" }}>
      <line x1={cx - 70} y1={1000} x2={cx} y2={py} stroke="#fff" strokeWidth={3} /><line x1={cx + 70} y1={1000} x2={cx} y2={py} stroke="#fff" strokeWidth={3} />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
      <circle cx={cx} cy={py} r={14} fill="#000" stroke="#fff" strokeWidth={4} />
      {[[lx, ly], [rx, ry]].map(([x, y], i) => <g key={i}><path d={`M${x} ${y} L${x - 90} ${y + 190} M${x} ${y} L${x + 90} ${y + 190} M${x - 100} ${y + 190} Q${x} ${y + 250} ${x + 100} ${y + 190}`} fill="none" stroke="#fff" strokeWidth={3} /></g>)}
    </g>
    {stack.map(([s, d], i) => { const k = pop(t, 20 + i * 40); const by = ly + 175 - i * 46 - (1 - k) * 200;
      return <g key={s} opacity={k}><rect x={lx - 85} y={by - 21} width={170} height={42} rx={4} fill="#fff" /><text x={lx} y={by} textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={20} letterSpacing={2} fill="#000">{s.toUpperCase()}</text></g>; })}
    <Pill text="A few years at the end" x={rx} y={ry + 130} a={150} on={false} size={18} />
  </>;
};
// 10. finish line moves 65 -> 67, reward crossed
const Finish = (t: number) => {
  const fx = lerp(500, 820, easeIO(prog(t, 60, 110)));
  const rx = lerp(130, 560, easeIO(prog(t, 0, 90))) + 0;
  return <>
    <Num v={t < 85 ? 65 : 67} label="finish line" x={fx} y={440} size={110} />
    <Ground y={760} />
    <g style={{ filter: "drop-shadow(0 0 8px #fff)" }}>{[-5, 5].map(d => <line key={d} x1={fx + d} x2={fx + d} y1={520} y2={760} stroke="#fff" strokeWidth={4} />)}</g>
    <Person x={rx} y={760} />
    <Pill text="In America" x={cx} y={1050} a={30} size={20} />
    <Pill text="It keeps moving" x={cx} y={1130} a={36} on={false} size={18} />
    <Icon k="trophy" x={cx} y={1500} s={1} p={pop(t, 100)} />
    <Pill text="Reward" x={cx} y={1340} a={100} on={false} size={18} />
    <Cross x={cx} y={1500} r={80} p={prog(t, 130, 145)} />
  </>;
};
// 11. freedom: time line now -> old, income bars climb
const Freedom = (t: number) => {
  const n = Math.round(lerp(0, 4000, easeOut(prog(t, 40, 120))));
  const bars = [0.1, 0.35, 0.8, 0.7].map(v => v * easeOut(prog(t, 40, 120)));
  return <>
    <Pill text="Someone else" x={cx} y={400} a={5} size={18} />
    <Person x={cx} y={500} s={2} fill={false} o={0.6} />
    <line x1={60} x2={W - 60} y1={900} y2={900} stroke="#fff" strokeWidth={2} opacity={prog(t, 25, 40)} />
    <text x={80} y={940} fill="#aaa" fontSize={20} letterSpacing={4}>NOW</text><text x={W - 80} y={940} textAnchor="end" fill="#aaa" fontSize={20} letterSpacing={4}>OLD</text>
    <Pill text="Freedom" x={lerp(150, 900, easeIO(prog(t, 30, 110)))} y={850} a={25} size={20} />
    <Num v={"$" + n.toLocaleString("en-US")} label="income you own / month" x={cx} y={1160} size={100} o={prog(t, 40, 50)} />
    <Ground y={1640} />
    <Person x={170} y={1640} s={1.4} />
    {bars.map((v, i) => <rect key={i} x={330 + i * 150} y={1640 - 380 * v} width={90} height={380 * v} rx={4} fill="#fff" style={{ filter: "drop-shadow(0 0 10px #fff)" }} />)}
  </>;
};
// 12. energy battery drains, retire at 65 crossed, locked gate "permission"
const Gate = (t: number) => <>
  <Icon k="battery" x={cx - 150} y={420} s={1.2} />
  <rect x={cx - 150 - 100} y={420 - 38} width={Math.max(0, 40 * (1 - prog(t, 20, 70)))} height={76} fill="#fff" />
  <Pill text="Energy" x={cx - 150} y={310} on={false} size={18} />
  <Pill text="Retire at 65" x={cx} y={900} a={60} />
  <Cross x={cx} y={900} r={90} p={prog(t, 110, 125)} />
  <Pill text="Permission" x={cx} y={1230} a={140} />
  <Icon k="lock" x={cx} y={1500} s={1.4} p={pop(t, 140)} />
  <Ground y={1700} />
  <Person x={lerp(150, 330, easeOut(prog(t, 130, 170)))} y={1700} s={1.3} />
</>;
// 13. your call
const Call = (t: number) => <>
  <Pill text="Your call" x={cx} y={H / 2 - 260} a={4} />
  <Ring x={cx} y={H / 2} t={(t % 40) / 30} />
  <Person x={cx} y={H / 2 + 70} s={2} o={1 - prog(t, 25, 40)} />
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 175, Timeline], [175, 315, Think], [315, 460, Rewind], [460, 610, Collect], [610, 700, Survivors],
  [700, 860, Why], [860, 960, World], [960, 1020, Life], [1020, 1250, Scales], [1250, 1450, Finish],
  [1450, 1670, Freedom], [1670, 1790, Gate], [1790, 1840, Call],
];

export const MonoShort: React.FC = () => (
  <Stage>{SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}</Stage>
);
