import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { C, FONT, LIP, TILE, lip } from "./brand";
import type { Scene } from "./story";
import { Confetti, DotGrid, Hold, KineticWord, Laser, QuestionMarks, Starburst, Tile, clamp, pop } from "./components/fx";
import { CTA, HomeworkMock, LogoReveal, NodeGraph, PlayerMock, PromptBox, StackedList, TimerGag, Viewfinder, FilmStrip } from "./components/mocks";
import { Tile3D } from "./components/Tile3D";

const img = (n: string) => staticFile(`hype/img/${n}.webp`);
const Pic: React.FC<{ n: string; t: number; y: number; h?: number; k?: number }> = ({ n, t, y, h = 560, k = 0 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top: y, height: h, transform: `scale(${pop(t)}) rotate(${(k - 1.5) * 1.2}deg)` }}>
    <Img src={img(n)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 54, border: `6px solid ${TILE[k]}`, boxShadow: lip(LIP[k], 18) }} />
  </div>
);
const Hand: React.FC<{ children: React.ReactNode; color: string; t: number; y: number; size?: number }> = ({ children, color, t, y, size = 92 }) => (
  <div style={{ position: "absolute", top: y, width: "100%", textAlign: "center", fontFamily: FONT.hand, fontSize: size, color, transform: `rotate(-3deg) scale(${pop(t)})`, opacity: t > 0 ? 1 : 0 }}>{children}</div>
);
const W: React.FC<React.ComponentProps<typeof KineticWord> & { top?: number }> = ({ top = 520, style, ...p }) => <div style={{ position: "absolute", left: 0, right: 0, top, ...style }}><KineticWord {...p} /></div>;

const Quiz: React.FC<{ t: number; explain?: boolean }> = ({ t, explain }) => {
  const ans = ["54", "56", "63", "64"];
  const ok = t > 18;
  return (
    <>
      <div style={{ position: "absolute", left: 80, right: 80, top: 360, transform: `scale(${pop(t)})` }}>
        <Tile color={explain ? C.surface : C.dsurface} lipC={explain ? C.border : C.deep} w={920} h={300} r={0.2} d={16} style={{ border: `4px solid ${explain ? C.border : C.dborder}` }}>
          <span style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 130, color: explain ? C.ink : C.text }}>7 × 8 = ?</span>
        </Tile>
      </div>
      {ans.map((a, i) => {
        const good = a === "56" && ok;
        return <div key={a} style={{ position: "absolute", left: 80 + (i % 2) * 470, top: 740 + Math.floor(i / 2) * 250, transform: `scale(${pop(t - 4 - i * 3)})` }}>
          <Tile color={good ? C.green : explain ? C.cream : C.dsurface} lipC={good ? C.greenLip : explain ? C.border : C.deep} w={450} h={210} r={0.28} d={12} style={{ border: `4px solid ${good ? C.ink : explain ? C.border : C.dborder}` }}><span style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 96, color: good ? "#fff" : explain ? C.ink : C.text }}>{a}</span></Tile>
        </div>;
      })}
      {explain ? <div style={{ position: "absolute", left: 80, right: 80, top: 1290, transform: `scale(${pop(t - 22)})`, opacity: t > 22 ? 1 : 0 }}>
        <Tile color={C.yellow} lipC={C.yellowLip} w={920} h={290} r={0.2} d={14} style={{ flexDirection: "column", padding: 30, border: `4px solid ${C.ink}` }}>
          <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.ink }}>WHY?</span>
          <span style={{ fontFamily: FONT.hand, fontSize: 70, color: C.ink, lineHeight: 1.1 }}>8 groups of 7 = 56</span>
        </Tile></div> : null}
    </>
  );
};

export const SceneBody: React.FC<{ s: Scene; t: number; f: number }> = ({ s, t }) => {
  const k = s.kind;
  const dk = s.dark;
  const fg = dk ? C.text : C.ink;
  switch (k) {
    case "nowway":
      return (
        <>
          <Hold t={t} shake><W text={"NO\nWAY"} t={t} color={C.ink} dot top={600} size={300} /></Hold>
          <Confetti t={t} n={26} opacity={0.9} />
          <AbsoluteFill style={{ background: C.indigo, opacity: t < -1 ? 1 : 0 }}>
            <Confetti t={t + 12} t0={5} burst n={44} seed={3} />
            <div style={{ position: "absolute", left: 540 - 22, top: 960 - 22, width: 44, height: 44, borderRadius: 22, background: C.coral, transform: `scale(${1 + clamp((t + 12) / 12) * 1.5})` }} />
          </AbsoluteFill>
        </>
      );
    case "homework":
      return <><DotGrid color="#fff" t={t} /><Hold t={t} shake><W text={"HOME\nWORK"} t={t} color="#fff" mode="stretch" size={350} dot top={480} style={{ marginLeft: -30 }} /></Hold></>;
    case "worksheets":
      return <><DotGrid color={C.glow} t={t} /><div style={{ position: "absolute", inset: 0, opacity: 0.35, transform: "scale(0.8)" }}><HomeworkMock t={t + 20} y={900} /></div><Hold t={t} shake><W text={"WORK\nSHEETS"} t={t} color={C.text} mode="scramble" size={250} top={300} /></Hold></>;
    case "timers":
      return <Hold t={t}><TimerGag t={t} /><div style={{ position: "absolute", top: 230, width: "100%" }}><KineticWord text="TIMERS" t={t} color={C.ink} mode="extrude" lipColor={C.coral} size={200} /></div></Hold>;
    case "study":
      return <Hold t={t}><StackedList t={t * 1.4} words={["STUDY."]} colors={[C.ink, C.blue, C.coral, C.muted]} fs={190} rows={11} /></Hold>;
    case "boring":
      return (
        <>
          <DotGrid color={C.glow} t={t} />
          <HomeworkMock t={t} y={300} />
          <Laser t={t - 4} x={{ cx: 540, cy: 690, w: 840, h: 720 }} />
          <Hand color={C.text} t={t - 10} y={1230} size={118}>the boring way</Hand>
          <Hand color={C.coral} t={t - 16} y={1420} size={96}>…again?</Hand>
        </>
      );
    case "ask":
      return <><QuestionMarks t={t} /><Hold t={t} shake><W text={"AND\nBEFORE\nYOU ASK"} t={t} color={C.ink} mode="slam" size={165} top={660} stagger={0.8} /></Hold></>;
    case "better":
      return <><Confetti t={t} t0={0} burst n={52} seed={11} size={44} /><Hold t={t} shake><W text={"YES.\nA BETTER\nONE."} t={t} color="#fff" mode="tracking-in" size={190} top={620} /></Hold></>;
    case "meet":
      return <><Tile3D t={t} spread={3.4} hit={t < 8 ? 1 : 0} z={10} /><LogoReveal t={t} dark scale={1} /></>;
    case "tagline":
      return (
        <>
          <Confetti t={t} n={24} seed={5} opacity={0.7} />
          <AbsoluteFill style={{ top: -80 }}><LogoReveal t={t + 60} dark={false} scale={0.82} /></AbsoluteFill>
          <W text={"LEARNING THAT\nFEELS LIKE\nA GAME"} t={t} color={C.ink} mode="tracking-in" size={96} top={1360} stagger={0.5} />
        </>
      );
    case "pick":
      return <><DotGrid color="#fff" t={t} /><PromptBox t={t} y={640} label="Pick a course" parts={[{ s: "Maths · " }, { s: "Grade 5", chip: true }, { s: " · five levels, easiest to hardest" }]} /><FilmStrip t={t} y={1360} /></>;
    case "answer":
      return <><DotGrid color={C.glow} t={t} /><Quiz t={t} /></>;
    case "points":
      return <><Confetti t={t} burst n={40} seed={21} size={40} /><Hold t={t} shake><W text={"EARN\nPOINTS"} t={t} color={C.ink} mode="extrude" lipColor={C.yellowLip} size={290} top={500} /></Hold><div style={{ position: "absolute", top: 1300, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${pop(t - 8)})` }}><Tile color={C.blue} lipC={C.blueLip} w={520} h={150} r={0.4} d={10}><span style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 84, color: "#fff" }}>+10 XP</span></Tile></div></>;
    case "levelup":
      return <><Tile3D t={t} spread={4.2} hit={t < 8 ? 1 : 0.2} z={11} /><Viewfinder t={t} label="LEVEL UP" color={C.ink} /></>;
    case "quiz":
      return <><Quiz t={t + 18} explain /><Confetti t={t} n={18} seed={9} opacity={0.6} /></>;
    case "five":
      return (
        <>
          <DotGrid color={C.glow} t={t} />
          {[0, 1, 2, 3, 4].map((i) => { const p = pop(t - i * 5, 30, 12, 200); const c = [C.green, C.sky, C.blue, C.yellow, C.coral][i]; return <div key={i} style={{ position: "absolute", left: 100, top: 1400 - i * 190, width: 160 + i * 190, height: 150, transform: `scaleX(${p})`, transformOrigin: "left" }}><Tile color={c} lipC={C.deep} w={160 + i * 190} h={150} r={0.3} d={10}><span style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 80, color: i === 3 || i === 0 || i === 1 ? C.ink : "#fff" }}>{i + 1}</span></Tile></div>; })}
          <W text={"FIVE\nLEVELS"} t={t} color={C.text} mode="slam" size={260} top={230} />
        </>
      );
    case "farm": return <><Hold t={t} shake><W text={"BUILD\nA FARM"} t={t} color={C.ink} size={230} top={220} /></Hold><Pic n="funkce-hry" t={t - 4} y={900} h={760} k={2} /></>;
    case "city": return <><Hold t={t} shake><W text={"GROW\nA CITY"} t={t} color={C.ink} mode="stretch" size={230} top={220} /></Hold><Pic n="funkce-kurzy" t={t - 4} y={900} h={760} k={0} /></>;
    case "pets":
      return <><Hold t={t} shake><W text={"LOOK AFTER\nPETS"} t={t} color={C.ink} size={175} top={230} /></Hold>
        {["bunny-happy", "cat-happy", "dragon-happy"].map((n, i) => <Img key={n} src={img(n)} style={{ position: "absolute", left: 20 + i * 350, top: 820 + Math.sin(t / 6 + i * 2) * 26 + (i % 2) * 190, width: 380, height: 380, objectFit: "contain", transform: `scale(${pop(t - 3 - i * 4)})` }} />)}
        <div style={{ position: "absolute", top: 1560, width: "100%", textAlign: "center", fontFamily: FONT.hand, fontSize: 90, color: "#fff", opacity: t > 14 ? 1 : 0 }}>feed them. cuddle them.</div></>;
    case "escape":
      return <><DotGrid color={C.glow} t={t} /><Hold t={t} shake><W text={"ESCAPE\nTHE LAB"} t={t} color={C.text} mode="scramble" size={215} top={210} /></Hold><Pic n="funkce-unikovky" t={t - 4} y={870} h={700} k={1} /><div style={{ position: "absolute", right: 110, top: 800, transform: `scale(${pop(t - 10)})` }}><Tile color={C.coral} lipC={C.coralLip} w={300} h={110} r={0.4} d={8}><span style={{ fontFamily: FONT.mono, fontSize: 60, color: C.ink }}>0:{String(Math.max(0, 59 - Math.floor(t / 2))).padStart(2, "0")}</span></Tile></div></>;
    case "board": {
      const rows = ["YOUR CLASS", "YOUR SCHOOL", "OTHER SCHOOLS"];
      return <><Hold t={t} shake><W text={"CLIMB THE\nBOARD"} t={t} color="#fff" mode="outline-echo" size={140} top={300} /></Hold>
        {rows.map((r, i) => <div key={r} style={{ position: "absolute", left: 100, top: 900 + i * 220 - clamp((t - 10 - i * 4) / 12) * (2 - i) * 0, transform: `scale(${pop(t - 4 - i * 4)})` }}><Tile color={TILE[(i + 2) % 4]} lipC={LIP[(i + 2) % 4]} w={880} h={180} r={0.3} d={12}><span style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 60, color: C.ink }}>#{3 - i} {r}</span></Tile></div>)}</>;
    }
    case "kidding":
      return <><AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Starburst t={t} color={C.yellow} size={1500} /></AbsoluteFill><Hold t={t} shake><W text={"ARE YOU\nKIDDING\nME?"} t={t} color={C.ink} mode="slam" size={160} top={640} stagger={0.7} /></Hold></>;
    case "practice":
      return <><DotGrid color={C.glow} t={t} /><NodeGraph t={t} nodes={[{ label: "KID", color: 0 }, { label: "GAME", color: 1 }, { label: "LESSON", color: 3 }]} pill="practice kids look forward to" /><Hand color={C.yellow} t={t} y={170} size={104}>no more “study, study”</Hand></>;
    case "teachers":
      return <><Confetti t={t} n={28} seed={4} /><CTA t={t} lines={["TEACHERS:", "FREE", "FOR YOU."]} sub="a free class tool on ucimesehrou.org" /></>;
    case "register":
      return <><Confetti t={t} n={24} seed={14} opacity={0.8} /><AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ transform: `scale(${pop(t)}) rotate(2deg)` }}><Tile color={C.blue} lipC={C.blueLip} w={900} h={640} r={0.18} d={22} style={{ flexDirection: "column", gap: 20, alignItems: "center" }}><KineticWord text={"SIGN UP\nIS FREE"} t={t} color="#fff" size={150} mode="slam" /><span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 44, color: "#fff" }}>for everyone</span></Tile></div></AbsoluteFill></>;
    case "play":
      return <><DotGrid color="#fff" t={t} /><PlayerMock t={t} /><W text={"LEARN\nTHROUGH\nPLAY"} t={t - 6} color="#fff" mode="tracking-in" size={170} top={1330} stagger={0.8} /></>;
    case "end":
      return <><Tile3D t={t + 40} spread={3.8} hit={0} z={11} /><LogoReveal t={t + 10} dark scale={1.05} /><div style={{ position: "absolute", bottom: 230, width: "100%", textAlign: "center", fontFamily: FONT.hand, fontSize: 84, color: fg, opacity: t > 40 ? 1 : 0 }}>learn through play.</div></>;
  }
  return null;
};
export { interpolate };
