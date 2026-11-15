// Showcase of ucimesehrou.org/cs/pro/{doucovatel,fotka,poznamky}, 3 vertical parts, Czech. Same engine as Ucime.tsx (Kód na hraní look).
// Real texts come from src/i18n/pro-tools.ts + src/components/pro/{AiTutor,PhotoTasks,NotesCards}.tsx of the site repo. Timings: pro.json (mirrored by audio/pro_mix.py).
import React from "react";
import { prog, easeOut, pop, clamp } from "./kit";
import { KText, SH, samp, Tag, C, FAM, NEON, WARM, FontGate } from "./Code";
import { Intro, Outro, SparkWord, Pill3, CutCard, Katana, CUT_A, CUT_B, CHIP, WORD_Y, flash, burst, makePart } from "./Ucime";
import type { Geo, PartSpec } from "./Ucime";
import SPEC from "./pro.json";
import { W, H } from "./kit";

const cx = W / 2;
void FontGate; void H;

// object outlines for the object -> logo morph
SH.bubble = samp([[-1, -0.7], [1, -0.7], [1, 0.4], [0.1, 0.4], [-0.4, 0.95], [-0.35, 0.4], [-1, 0.4]]);
SH.cam = samp([[-1, -0.45], [-0.45, -0.45], [-0.3, -0.8], [0.3, -0.8], [0.45, -0.45], [1, -0.45], [1, 0.75], [-1, 0.75]]);
SH.note = samp([[-0.8, -0.9], [0.4, -0.9], [0.8, -0.5], [0.8, 0.9], [-0.8, 0.9]]);

type Leave = (k: number) => number;
type S1 = (tc: number, geo: () => Geo, leave: Leave) => (t: number) => React.ReactNode;

const Frame: React.FC<{ id: string; kid: string; t: number; tc: number; geo: () => Geo; leave: Leave; col: string; shake?: boolean; children: React.ReactNode }> = ({ id, kid, t, tc, geo, leave, col, children }) => (
  <>
    <SparkWord id={id} t={t} wl={geo().word} y={WORD_Y} a={16} leave={leave} />
    <Katana t={t} tc={tc} A={CUT_A} B={CUT_B} chip={CHIP} id={kid}>
      <CutCard col={col} t={t}>{children}</CutCard>
    </Katana>
    <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={flash(t, tc)} />
    {burst(t, tc, 540, 560, C.yellow)}
  </>
);
const Pills: React.FC<{ items: [string, string][]; t: number; a: number }> = ({ items, t, a }) => (
  <>{items.map(([l, c], i) => <Pill3 key={l} x={i % 2 ? 775 : 305} y={960 + Math.floor(i / 2) * 230} w={440} h={190} col={c} text={l} size={44} t={t} a={a + i * 4} rx={36} />)}</>
);

// ---------- part 1: AI doučovač ----------
const S1Tutor: S1 = (tc, geo, leave) => t => <>
  <Frame id="w1" kid="p1" t={t} tc={tc} geo={geo} leave={leave} col={C.blue}>
    <text x={cx} y={560} textAnchor="middle" fontSize={112} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 28, 10)}>Dovede tě</text>
    <text x={cx} y={700} textAnchor="middle" fontSize={112} fill={C.yellow} fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 36, 10)}>k výsledku</text>
  </Frame>
  <Pills t={t} a={tc + 8} items={[["Krok za krokem", "#7ee0b0"], ["Přidat fotku", "#ffc933"], ["Uložit do sady", "#ff8a6b"], ["Zeptej se", "#8fd0ff"]]} />
  <KText id="t9" text="Hotové řešení ti nedá." x={cx} y={1440} size={52} t={t} a={tc + 26} mode="rise" st={1} fill={C.muted} />
</>;

// ---------- part 2: Fotka úlohy ----------
const S1Photo: S1 = (tc, geo, leave) => t => {
  const cnt = Math.round(5 * easeOut(prog(t, 28, 40)));
  return <>
    <Frame id="w2" kid="p2" t={t} tc={tc} geo={geo} leave={leave} col={C.green}>
      <text x={cx} y={640} textAnchor="middle" fontWeight={800} fontSize={300} fill={C.yellow} fontFamily={FAM.h} style={{ filter: WARM }} opacity={pop(t, 24, 10)}>{cnt}</text>
      <text x={cx} y={752} textAnchor="middle" fontSize={84} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 36, 10)}>podobných příkladů</text>
    </Frame>
    <Pills t={t} a={tc + 8} items={[["Vyfotit úlohu", "#ffc933"], ["Úloha", "#8fd0ff"], ["Postup", "#ff8a6b"], ["Pět příkladů", "#7ee0b0"]]} />
    <KText id="f9" text="Procvičíš stejný postup." x={cx} y={1440} size={52} t={t} a={tc + 26} mode="rise" st={1} fill={C.muted} />
  </>;
};

// ---------- part 3: Import z poznámek ----------
const S1Notes: S1 = (tc, geo, leave) => t => {
  const p = easeOut(prog(t, 34, 54)), sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * p))), back = p > 0.5, ok = prog(t, 52, 62);
  return <>
    <Frame id="w3" kid="p3" t={t} tc={tc} geo={geo} leave={leave} col={C.coral}>
      <text x={cx} y={470} textAnchor="middle" fontSize={84} fill="#fff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 26, 10)}>Otoč kartičku</text>
      <g transform={`translate(${cx} 640) scale(${sx} 1)`} opacity={pop(t, 28, 10)}>
        <rect x={-190} y={-100} width={380} height={200} rx={28} fill={back ? "#f6f4ee" : C.surf2} stroke={back ? C.yellow : C.edge} strokeWidth={6} />
        <text y={-30} textAnchor="middle" fontWeight={800} fontSize={40} fill={back ? "#1c1936" : C.cream} fontFamily={FAM.h}>{back ? "Odpověď" : "Otázka"}</text>
        {back ? <path d="M-50 40 L-14 76 L56 0" transform="scale(0.9)" fill="none" stroke={C.green} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" strokeDashoffset={200 * (1 - ok)} />
          : <text y={70} textAnchor="middle" fontWeight={800} fontSize={90} fill={C.yellow} fontFamily={FAM.h}>?</text>}
      </g>
    </Frame>
    <Pills t={t} a={tc + 8} items={[["Otázka", "#ffc933"], ["Odpověď", "#7ee0b0"], ["Z fotky", "#8fd0ff"], ["Udělat kartičky", "#ff8a6b"]]} />
    <KText id="n9" text="Z poznámek jsou kartičky." x={cx} y={1440} size={52} t={t} a={tc + 26} mode="rise" st={1} fill={C.muted} />
  </>;
};

const [A, B, D] = SPEC.parts as unknown as PartSpec[];
const U1 = makePart(A, "bubble", ["Doučovač", "krok za krokem."], S1Tutor, Outro(null, ["Fotka", "úlohy"], "30 dní zdarma"), A.tc);
const U2 = makePart(B, "cam", ["Vyfoť úlohu", "z učebnice."], S1Photo, Outro(null, ["Poznámky", "na kartičky"], "30 dní zdarma"), B.tc);
const U3 = makePart(D, "note", ["Poznámky", "na kartičky."], S1Notes, Outro("Vyzkoušej UčímePRO", [], "30 dní zdarma"), D.tc);
export const PRO_FRAMES = [U1.frames, U2.frames, U3.frames];
export const ProPart1 = U1.Comp, ProPart2 = U2.Comp, ProPart3 = U3.Comp;
void Tag;
