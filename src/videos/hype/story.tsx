// The shot list. Every shot starts on a voice word (the numbers come from timing.ts, generated from the
// rendered voice) or on a designed beat that carries no voice. `draw` receives the shot-local frame and the
// global frame, so a mock that spans several words keeps running on the line's clock.
// Tweak the film from here: change a bg/mode/colour in a line's config, or add a bespoke shot.
import React from "react";
import { C, F, W, H, rgba } from "./theme";
import { BgKind } from "./components/Bg";
import { Tr } from "./fx/transitions";
import { KineticWord, WordMode } from "./components/KineticWord";
import { LINES, INSERTS, TOTAL, TLine } from "./timing";
import { WeekPlanner, QuizCard, NodeGraph, SubjectGrid, LevelTrack, FilmStrip, ShapeMorph, ProgressChart, ClassList, EscapeRoom, MockNote } from "./components/mocks";
import { StudyTimer, StackedList, Arrow } from "./components/gags";
import { Starburst, Blob, QuestionMarks, LaserX, Strike, OrbMeter } from "./components/shapes";
import { LogoReveal, CTA, EndCard } from "./components/brand";
import { MicroLabel, Brackets } from "./components/ui";
import { Cube3D } from "./three/Blocks";

export type Shot = {
  from: number;
  dur: number;
  bg: BgKind;
  tr: Tr;
  label: string;
  draw: (f: number, gf: number) => React.ReactNode;
};

export const HITS: number[] = []; // every cut: drives the 1-2 frame RGB split
export const BIG_HITS: number[] = []; // only the structural accents: drives the red bloom + the white flash frames
export const SHOTS: Shot[] = [];

const TABLE: Record<string, TLine> = Object.fromEntries(LINES.map((l) => [l.id, l]));
const L = (id: string): TLine => {
  const l = TABLE[id];
  if (!l) throw new Error(`no voice line ${id}`);
  return l;
};

const fg = (bg: BgKind) => (bg === "white" ? C.black : C.white);
const push = (s: Shot, big = false) => {
  SHOTS.push(s);
  HITS.push(s.from);
  if (big) BIG_HITS.push(s.from);
};

/* ------------------------------------------------------------------ line builder */

type LineCfg = {
  bg: (i: number, n: number) => string;
  mode?: (i: number, n: number) => string;
  target?: (i: number, n: number) => number;
  color?: (i: number, n: number, bg: BgKind) => string;
  y?: (i: number, n: number) => number | undefined;
  tr?: (i: number, n: number) => Tr;
  stagger?: (i: number) => number;
  ca?: (i: number) => number;
  shake?: (i: number) => number;
  skip?: (i: number) => boolean;
  /** draw only the mock behind (used when the serif line replaces the caps) */
  bare?: (i: number) => boolean;
  /** mock that persists behind the words; receives the global frame */
  behind?: (i: number, n: number) => undefined | ((gf: number) => React.ReactNode);
  extra?: (i: number, f: number, gf: number) => React.ReactNode;
};

const lineShots = (id: string, cfg: LineCfg) => {
  const ln = L(id);
  const n = ln.words.length;
  ln.words.forEach((word, i) => {
    if (cfg.skip?.(i)) return;
    const bg = cfg.bg(i, n) as BgKind;
    const mode = (cfg.mode?.(i, n) ?? "slam") as WordMode;
    const color = cfg.color?.(i, n, bg) ?? fg(bg);
    const dur = word.to - word.from;
    push({
      from: word.from,
      dur,
      bg,
      tr: cfg.tr?.(i, n) ?? (i === 0 ? { kind: "whip", dir: 1 } : { kind: "cut" }),
      label: `${id}:${word.w}`,
      draw: (f, gf) => (
        <>
          {cfg.behind?.(i, n)?.(gf)}
          {cfg.bare?.(i) ? null : (
          <KineticWord
            f={f}
            text={word.w}
            mode={mode}
            color={color}
            target={cfg.target?.(i, n) ?? 1000}
            y={cfg.y?.(i, n)}
            stagger={cfg.stagger?.(i) ?? (dur > 9 ? 1.25 : 0.7)}
            ca={cfg.ca?.(i) ?? 0}
            shake={cfg.shake?.(i) ?? 0}
          />
          )}
          {cfg.extra?.(i, f, gf)}
        </>
      ),
    }, i === 0);
  });
};

const hhmm = (f: number) => {
  const s = Math.max(0, Math.floor(f / 30));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------- 0. cold open */

push({
  from: 0,
  dur: 12,
  bg: "black",
  tr: { kind: "cut" },
  label: "open",
  draw: (f) => (
    <>
      <MicroLabel x={44} y={72} size={24} color={rgba(C.white, 0.55)}>
        HROU · 001
      </MicroLabel>
      <MicroLabel x={44} y={H - 96} size={24} color={rgba(C.white, 0.4)}>
        {hhmm(f)}
      </MicroLabel>
      <div
        style={{
          position: "absolute",
          left: W / 2 - 16,
          top: H / 2 - 16,
          width: 32,
          height: 32,
          borderRadius: 16,
          background: C.red,
          boxShadow: `0 0 ${40 + f * 22}px ${rgba(C.red, 0.9)}`,
          transform: `scale(${1 + f * 0.22})`,
        }}
      />
    </>
  ),
}, true);

/* --------------------------------------------------------- 1. studying is boring. */

lineShots("L1", {
  bg: (i) => ["white", "red", "grid"][i],
  mode: (i) => ["slam", "slam", "slam"][i],
  target: (i) => [1160, 520, 1090][i],
  tr: (i) => (i === 0 ? { kind: "flash" } : i === 1 ? { kind: "whip", dir: 1 } : { kind: "glitch" }),
  ca: (i) => (i === 2 ? 5 : 0),
  extra: (i, f) =>
    i === 1 ? (
      <MicroLabel x={0} y={1420} size={30} color={rgba(C.black, 0.55)} style={{ width: W, textAlign: "center" }}>
        THE OLD WAY, IN THREE WORDS
      </MicroLabel>
    ) : i === 2 ? (
      <MicroLabel x={0} y={1300} size={34} color={C.red} style={{ width: W, textAlign: "center", letterSpacing: "0.3em" }}>
        HA. HA.
      </MicroLabel>
    ) : null,
});

/* --------------------------------------------- 2. sit down. open the book. again. */

const PLANNER = (gf: number) => <WeekPlanner f={gf - L("L2").from} at={0} x={70} y={600} />;
lineShots("L2", {
  bg: (i) => ["red", "white", "grid", "black", "white", "grid", "red", "white", "grid", "white", "grid", "grid"][i] ?? "grid",
  mode: (i) => (i === 3 ? "outline" : i === 4 ? "extrude" : i === 7 || i === 9 ? "echo" : "slam"),
  target: (i) => [780, 900, 720, 520, 980, 800, 460, 980, 560, 1060, 1140, 1120][i] ?? 900,
  y: (i) => (i >= 5 ? 380 : undefined),
  tr: (i) => (i === 0 ? { kind: "whip", dir: -1 } : i === 5 ? { kind: "stripes" } : { kind: "cut" }),
  behind: (i) => (i >= 5 ? PLANNER : undefined),
  extra: (i, f, gf) =>
    i === 11 ? (
      <LaserX f={gf - L("L2").from - (L("L2").words[11].from - L("L2").from)} at={0} x={70} y={600} w={940} h={640} thickness={8} />
    ) : i === 4 ? (
      <MicroLabel x={0} y={1500} size={26} color={rgba(C.white, 0.6)} style={{ width: W, textAlign: "center" }}>
        SAME PAGE. SEVENTH TIME.
      </MicroLabel>
    ) : null,
});

/* ------------------------------------------ 3. three hours. highlighters. zero. */

lineShots("L3", {
  bg: (i) => ["grid", "red", "white", "grid", "red", "grid"][i] ?? "grid",
  mode: (i) => (i === 3 ? "echo" : i === 5 ? "scramble" : "slam"),
  target: (i) => [760, 880, 1180, 1000, 620, 1120][i] ?? 1000,
  tr: (i) => (i === 0 ? { kind: "glitch" } : i === 2 ? { kind: "whip", dir: 1 } : i === 4 ? { kind: "stripes" } : { kind: "cut" }),
  ca: (i) => (i === 5 ? 4 : 0),
  extra: (i, f) => (i === 2 ? <Strike f={f} at={4} y={1000} x1={30} x2={W - 30} color={C.red} thickness={16} tilt={-1.6} /> : null),
});

/* ---------------------------------------------------- 4. so we turned it into a game */

lineShots("L4", {
  bg: (i) => ["red", "white", "grid", "red", "white", "grid", "red"][i] ?? "grid",
  mode: (i) => (i === 6 ? "slam" : "slam"),
  target: (i) => [520, 480, 900, 420, 640, 380, 1080][i] ?? 900,
  tr: (i) => (i === 0 ? { kind: "zoom" } : i === 6 ? { kind: "shape" } : { kind: "cut" }),
  behind: (i) => (i === 6 ? (gf) => <Starburst f={gf - L("L4").words[6].from} at={0} size={1500} color={C.deep} spin={0.3} /> : undefined),
  extra: (i) => (i === 6 ? <MicroLabel x={0} y={1560} size={28} color={rgba(C.white, 0.75)} style={{ width: W, textAlign: "center", letterSpacing: "0.28em" }}>LEVELS · POINTS · EXPLANATIONS</MicroLabel> : null),
});

/* ------------------------------------------------------------- logo reveal insert */

push({
  from: INSERTS.LOGO.from,
  dur: INSERTS.LOGO.to - INSERTS.LOGO.from,
  bg: "grid",
  tr: { kind: "laser" },
  label: "logo",
  draw: (f) => (
    <>
      <LogoReveal f={f} at={2} y={800} />
      <MicroLabel x={0} y={1600} size={22} color={rgba(C.white, 0.45)} style={{ width: W, textAlign: "center", letterSpacing: "0.34em" }}>
        CZ · FREE TO START · 2026
      </MicroLabel>
    </>
  ),
}, true);

/* ------------------------------------------------------ 5. pick a subject. any subject */

const GRAPH = (gf: number) => <NodeGraph f={gf - L("L5").from} at={0} />;
lineShots("L5", {
  bg: (i) => ["white", "grid", "red", "white", "grid"][i] ?? "grid",
  target: (i) => [720, 400, 1040, 640, 1080][i] ?? 900,
  y: (i) => (i >= 3 ? 250 : 900),
  tr: (i) => (i === 0 ? { kind: "whip", dir: 1 } : i === 3 ? { kind: "stripes" } : { kind: "cut" }),
  behind: (i) => (i >= 3 ? GRAPH : undefined),
});

/* ------------------------------------------------------ level block (real three.js) */

push({
  from: INSERTS.CUBE.from,
  dur: INSERTS.CUBE.to - INSERTS.CUBE.from,
  bg: "white",
  tr: { kind: "zoom" },
  label: "cube",
  draw: (f) => (
    <>
      <Cube3D f={f} />
      <MicroLabel x={70} y={160} size={26} color={rgba(C.black, 0.6)}>
        LVL 3 · 3D ELEMENT
      </MicroLabel>
      <MicroLabel x={0} y={1560} size={30} color={rgba(C.black, 0.55)} style={{ width: W, textAlign: "center", letterSpacing: "0.24em" }}>
        1 → 5, ONE LEVEL AT A TIME
      </MicroLabel>
    </>
  ),
}, true);

/* ---------------------------------------- 6. grade one to nine. high school. finals. */

lineShots("L6", {
  bg: (i) => ["grid", "red", "grid", "white", "grid", "red", "grid", "red", "white"][i] ?? "grid",
  target: (i) => [700, 520, 400, 820, 900, 860, 1060, 880, 900][i] ?? 900,
  y: (i) => (i >= 3 ? 330 : 900),
  tr: (i) => (i === 0 ? { kind: "stripes" } : i === 3 ? { kind: "whip", dir: -1 } : { kind: "cut" }),
  behind: (i) => (i >= 3 ? (gf) => <SubjectGrid f={gf - L("L6").words[3].from} at={0} y={700} /> : undefined),
});

/* --------------------------------- 7. every course has five levels. every answer ... */

const LEVELS = (gf: number) => <LevelTrack f={gf - L("L7").words[3].from} at={0} y={620} fill={3} />;
const QUIZ_WHY = (gf: number) => (
  <QuizCard
    f={gf - L("L7").words[6].from}
    at={0}
    y={600}
    h={580}
    question="Why is 7 × 8 = 56?"
    answer="56"
    why="8 groups of 7 · 7 × 8 = 7 × (4 + 4) = 28 + 28"
    typed={14}
    showAnswer={8}
    showWhy={16}
  />
);
lineShots("L7", {
  bg: (i) => ["grid", "red", "grid", "white", "grid", "red", "grid", "white", "grid", "grid", "red"][i] ?? "grid",
  mode: (i) => (i === 4 ? "slam" : "slam"),
  target: (i) => [620, 760, 380, 700, 1020, 700, 860, 660, 900, 300, 940][i] ?? 900,
  y: (i) => (i >= 3 && i < 6 ? 300 : i >= 6 ? 300 : undefined),
  tr: (i) => (i === 0 ? { kind: "whip", dir: 1 } : i === 3 ? { kind: "zoom" } : i === 6 ? { kind: "shape" } : { kind: "cut" }),
  behind: (i) => (i >= 3 && i < 6 ? LEVELS : i >= 6 ? QUIZ_WHY : undefined),
  extra: () => null,
});

/* ------------------------------------------ 8. get it wrong? now you know why. */

const QUIZ_WHY2 = (gf: number) => (
  <QuizCard
    f={gf - L("L8").from}
    at={0}
    y={640}
    h={540}
    question="7 × 8 = ?"
    answer="56"
    why="8 groups of 7. Count them: 7, 14, 21, 28, 35, 42, 49, 56."
    typed={10}
    showAnswer={14}
    showWhy={24}
    wrongAnswer="54"
  />
);
lineShots("L8", {
  bg: (i) => ["red", "grid", "grid", "white", "grid", "grid", "red"][i] ?? "grid",
  mode: (i) => (i === 6 ? "slam" : "slam"),
  target: (i) => [560, 460, 900, 620, 640, 760, 940][i] ?? 900,
  y: (i) => (i >= 2 ? 360 : 900),
  tr: (i) => (i === 0 ? { kind: "zoom" } : i === 3 ? { kind: "whip", dir: 1 } : i === 6 ? { kind: "glitch" } : { kind: "cut" }),
  behind: (i) => (i >= 2 ? QUIZ_WHY2 : undefined),
  ca: (i) => (i === 6 ? 6 : 0),
});

/* ----------------------------------------- 9. daily quiz. reviews. escape rooms ... */

const DAILY = (gf: number) => (
  <QuizCard f={gf - L("L9").from} at={0} y={680} h={500} w={880} x={100} question="Today: 5 questions" answer="+40 XP" typed={12} showAnswer={10} why="keeps the streak alive" showWhy={16} />
);
const REVIEWS = (gf: number) => (
  <>
    <FilmStrip f={gf - L("L9").words[2].from} at={0} y={700} speed={9} />
    <ShapeMorph f={gf - L("L9").words[2].from} at={0} cx={W / 2} cy={1290} size={210} color={C.red} />
    <MockNote text="WRONG ONES COME BACK TOMORROW" y={1470} />
  </>
);
const ESCAPE = (gf: number) => <EscapeRoom f={gf - L("L9").words[3].from} at={0} cy={1000} />;
const PARENT = (gf: number) => <ProgressChart f={gf - L("L9").words[5].from} at={0} y={760} />;
const TEACHER = (gf: number) => <ClassList f={gf - L("L9").words[9].from} at={0} y={780} />;

lineShots("L9", {
  mode: (i) => (i === 8 ? "stretch" : "slam"), // "STRETCH" as an element: the word itself warps
  bg: (i) => ["red", "white", "grid", "black", "red", "grid", "white", "grid", "grid", "black", "grid", "red", "grid"][i] ?? "grid",
  target: (i) => [720, 640, 900, 700, 640, 760, 420, 340, 1080, 820, 380, 360, 780][i] ?? 900,
  y: (i) => (i >= 1 ? 380 : 900),
  tr: (i) => (i === 0 ? { kind: "glitch" } : i === 2 ? { kind: "stripes" } : i === 3 ? { kind: "whip", dir: -1 } : i === 5 ? { kind: "zoom" } : i === 9 ? { kind: "whip", dir: 1 } : { kind: "cut" }),
  behind: (i) => (i <= 1 ? DAILY : i === 2 ? REVIEWS : i >= 3 && i <= 4 ? ESCAPE : i >= 5 && i <= 8 ? PARENT : TEACHER),
});

/* ------------------------------- 10. think about doing all that the usual way. */

const WALL = (gf: number) => <StackedList f={gf - L("L10").words[3].from} at={0} count={12} y={200} step={132} size={112} />;
const SERIF = (
  <>
    <div style={{ position: "absolute", left: 0, top: 640, width: W, height: 460, background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${rgba(C.black, 0.93)} 22%, ${rgba(C.black, 0.95)} 78%, rgba(0,0,0,0) 100%)` }} />
    <div style={{ position: "absolute", left: 0, top: 748, width: W, height: 8, background: C.red, boxShadow: `0 0 30px ${rgba(C.red, 0.9)}` }} />
    <div style={{ position: "absolute", left: 60, top: 790, width: W - 120, fontFamily: F.serif, fontStyle: "italic", fontSize: 156, lineHeight: 1.0, color: C.white, textAlign: "center", letterSpacing: "-0.02em", textShadow: `0 8px 40px ${rgba(C.black, 0.9)}` }}>
      the usual way
    </div>
  </>
);
lineShots("L10", {
  bg: () => "blue",
  bare: (i) => i >= 5,
  target: (i) => [700, 620, 780, 420, 540, 900, 900, 700][i] ?? 900,
  y: (i) => (i >= 5 ? 460 : 900),
  tr: (i) => (i === 0 ? { kind: "shape" } : i === 5 ? { kind: "glitch" } : { kind: "cut" }),
  behind: (i) => (i >= 5 ? (gf) => <>{WALL(gf)}{SERIF}</> : i >= 3 ? WALL : undefined),
});

/* ------------------------------------------------- the study-timer gag insert */

push({
  from: INSERTS.GAG.from,
  dur: INSERTS.GAG.to - INSERTS.GAG.from,
  bg: "grid",
  tr: { kind: "laser" },
  label: "gag",
  draw: (f) => (
    <>
      <Brackets inset={40} size={70} opacity={0.55} />
      <MicroLabel x={44} y={72} size={24} color={rgba(C.white, 0.5)}>
        THE USUAL WAY · v7 · FINAL_FINAL
      </MicroLabel>
      <MicroLabel x={44} y={118} size={24} color={C.red}>
        ● REC
      </MicroLabel>
      <MicroLabel x={W - 250} y={118} size={24} color={rgba(C.white, 0.55)}>
        CAMERA 02
      </MicroLabel>
      <StudyTimer f={f} at={0} y={520} speed={47} />
      <Arrow f={f} x={806} y={952} len={200} rot={184} />
      <OrbMeter f={f} cx={175} cy={1700} r={54} progress={0.42} />
      <MicroLabel x={248} y={1686} size={22} color={rgba(C.white, 0.6)}>
        and wait for the explanation
      </MicroLabel>
    </>
  ),
}, true);

/* --------------------------------------------------- 11. are you kidding me? */

lineShots("L11", {
  bg: (i) => ["grid", "red", "white", "grid"][i] ?? "grid",
  color: (i, _n, bg) => (i === 2 ? C.white : fg(bg)),
  target: (i) => [720, 640, 980, 1040][i] ?? 900,
  y: (i) => (i === 3 ? 860 : 900),
  tr: (i) => (i === 0 ? { kind: "flash" } : i === 1 ? { kind: "whip", dir: 1 } : i === 2 ? { kind: "stripes" } : { kind: "glitch" }),
  ca: (i) => (i === 3 ? 9 : 0),
  shake: (i) => (i === 3 ? 4 : 0),
  behind: (i) =>
    i === 3
      ? (gf) => (
          <>
            <Starburst f={gf - L("L11").words[3].from} at={0} size={1560} cy={820} color={C.red} spin={0.4} />
            <QuestionMarks f={gf - L("L11").words[3].from} at={0} count={6} />
          </>
        )
      : i === 2
      ? (gf) => <Blob f={gf - L("L11").words[2].from} at={0} size={880} cy={880} color={C.red} />
      : undefined,
  extra: (i) =>
    i === 0 ? (
      <>
        <Brackets inset={54} size={64} opacity={0.5} />
        <MicroLabel x={70} y={118} size={24} color={C.red}>
          ● REC
        </MicroLabel>
        <MicroLabel x={W - 260} y={118} size={24} color={rgba(C.white, 0.6)}>
          03:00:00:00
        </MicroLabel>
        <MicroLabel x={0} y={1480} size={30} color={C.acid} style={{ width: W, textAlign: "center", letterSpacing: "0.3em" }}>
          THREE HOURS LATER
        </MicroLabel>
      </>
    ) : null,
});

/* -------------------------------------- 12. it is free. no card, no catch. by play. */

lineShots("L12", {
  bg: (i) => ["grid", "red", "white", "red", "grid", "white", "grid", "red"][i] ?? "grid",
  mode: (i) => (i === 7 ? "echo" : "slam"),
  target: (i) => [420, 400, 1000, 640, 560, 760, 900, 1000][i] ?? 900,
  tr: (i) => (i === 0 ? { kind: "whip", dir: 1 } : i === 2 ? { kind: "glitch" } : i === 5 ? { kind: "zoom" } : { kind: "cut" }),
  ca: (i) => (i === 2 ? 5 : 0),
});

/* ------------------------------------------------------------- CTA + end card */

push({
  from: INSERTS.TAIL.from,
  dur: 58,
  bg: "grid",
  tr: { kind: "whiteout" },
  label: "cta",
  draw: (f) => <CTA f={f} at={2} />,
}, true);

push({
  from: INSERTS.TAIL.from + 58,
  dur: INSERTS.TAIL.to - INSERTS.TAIL.from - 58,
  bg: "black",
  tr: { kind: "cut" },
  label: "endcard",
  draw: (f) => (
    <>
      <EndCard f={f} at={2} />
    </>
  ),
}, true);

/* ------------------------------------------------------------------- normalise */

SHOTS.sort((a, b) => a.from - b.from);
for (let i = 0; i < SHOTS.length; i++) {
  const next = SHOTS[i + 1];
  if (next) SHOTS[i].dur = Math.max(1, next.from - SHOTS[i].from);
  else SHOTS[i].dur = Math.max(1, TOTAL - SHOTS[i].from);
}

export const HYPE_FRAMES = TOTAL;
export const HYPE_HITS = HITS;
export const HYPE_BIG_HITS = BIG_HITS;
export { TOTAL };
