// Showcase of ucimesehrou.org/cs/materialy, 3 vertical parts, Czech, same series look as Code.tsx / Ucime.tsx.
// Real content (src/lib/materials, src/i18n/materials.ts): 16 subjects, 324 topics, 4 levels, quiz "Ověř si", cards "Kartičky", "Procvičit v kurzech".
// Timings live in materialy.json (mirrored by audio/materialy_mix.py). Engine pieces are shared from Ucime.tsx / Code.tsx.
import React from "react";
import { W, prog, easeOut, easeIO, pop, clamp } from "./kit";
import { KText, Morph, SH, samp, Tag, Rings, LogoRow, C, FAM, NEON, WARM } from "./Code";
import { SparkWord, Extrude, Katana, Pill3, CutCard, CUT_A, CUT_B, CHIP, flash, burst, WORD_Y, makePart, dk } from "./Ucime";
import type { Geo } from "./Ucime";
import SPEC from "./materialy.json";

const cx = W / 2;

// ---------- object outlines for object -> logo morphs (each part opens from a different object) ----------
SH.doc = samp([[-0.7, -1], [0.3, -1], [0.7, -0.55], [0.7, 1], [-0.7, 1]]);                       // page with folded corner
SH.steps = samp([[-1, 0.8], [-1, 0.35], [-0.5, 0.35], [-0.5, -0.1], [0, -0.1], [0, -0.55], [0.5, -0.55], [0.5, -0.9], [1, -0.9], [1, 0.8]]); // 4 levels = stairs
SH.bulb = samp([[-0.35, 1], [-0.35, 0.55], [-0.75, 0.1], [-0.8, -0.35], [-0.45, -0.85], [0, -1], [0.45, -0.85], [0.8, -0.35], [0.75, 0.1], [0.35, 0.55], [0.35, 1]]);

const dkc = dk;

// ---------- part 1: all subjects ----------
const SUBJ: [string, string][] = [["Čeština", "#ffc933"], ["Matematika", "#7ee0b0"], ["Fyzika", "#8fd0ff"], ["Dějepis", "#c9b8ff"], ["Chemie", "#d98cff"], ["Informatika", "#6fc3ff"]];
const S1Subjects = (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => {
  const cnt = Math.round(324 * easeOut(prog(t, 28, 48)));
  return <>
    <Rings x={cx} y={760} t={t} />
    <KSpark t={t} geo={geo} leave={leave} />
    <Katana t={t} tc={tc} A={CUT_A} B={CUT_B} chip={CHIP} id="m1">
      <CutCard col={C.blue} t={t}>
        <text x={cx} y={640} textAnchor="middle" fontWeight={800} fontSize={250} fill={C.yellow} fontFamily={FAM.h} style={{ filter: WARM }} opacity={pop(t, 24, 10)}>{cnt}</text>
        <text x={cx} y={752} textAnchor="middle" fontSize={96} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 38, 10)}>témat</text>
      </CutCard>
    </Katana>
    <rect x={0} y={0} width={W} height={1920} fill="#fff" opacity={flash(t, tc)} />
    {burst(t, tc, 540, 560, C.yellow)}
    {SUBJ.map(([l, c], i) => <Pill3 key={l} x={i % 2 ? 775 : 305} y={940 + Math.floor(i / 2) * 146} w={440} h={118} col={c} text={l} size={46} t={t} a={tc + 8 + i * 3} />)}
    <Tag text="16 předmětů" x={cx} y={1420} t={t} a={tc + 28} kind="gold" size={24} />
  </>;
};

// headline word whose letters become sparks (same maths as Ucime's SparkWord)
const KSpark: React.FC<{ t: number; geo: () => Geo; leave: (k: number) => number }> = ({ t, geo, leave }) => <SparkWord id="mw" t={t} wl={geo().word} y={WORD_Y} a={16} leave={leave} />;

// ---------- part 2: four levels ----------
const LEVELS: [string, string, string][] = [["Úplné základy", "1.–3. třída", C.green], ["Základní učivo", "4.–6. třída", C.blue], ["Pokročilé", "7.–9. třída", C.coral], ["Příprava na přijímačky", "9. třída", C.yellow]];
const S1Levels = (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => {
  const cnt = Math.round(4 * easeOut(prog(t, 28, 40)));
  return <>
    <Rings x={cx} y={760} t={t} />
    <KSpark t={t} geo={geo} leave={leave} />
    <Katana t={t} tc={tc} A={[140, 330]} B={[940, 800]} chip={[[920, 330], [720, 330], [920, 480]]} id="m2">
      <CutCard col={C.green} t={t}>
        {[0, 1, 2, 3].map(i => { const k = pop(t, 22 + i * 4, 10); return <rect key={i} x={250 + i * 140} y={560 - i * 70 + (1 - k) * 80} width={130} height={170 + i * 70} rx={14} fill={[C.coral, C.yellow, C.blue, "#fff"][i]} opacity={0.35 * k} />; })}
        <text x={cx} y={640} textAnchor="middle" fontWeight={800} fontSize={300} fill={C.yellow} fontFamily={FAM.h} style={{ filter: WARM }} opacity={pop(t, 24, 10)}>{cnt}</text>
        <text x={cx} y={752} textAnchor="middle" fontSize={96} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 36, 10)}>úrovně</text>
      </CutCard>
    </Katana>
    <rect x={0} y={0} width={W} height={1920} fill="#fff" opacity={flash(t, tc)} />
    {burst(t, tc, 540, 560, C.yellow)}
    {LEVELS.map(([title, hint, col], i) => {
      const k = pop(t, tc + 8 + i * 5, 10); if (k <= 0) return null;
      const y = 935 + i * 142, w = 860, h = 126;
      return <g key={title} transform={`translate(${cx} ${y}) scale(${k}) rotate(${(1 - clamp(k)) * 6})`} opacity={clamp(k * 1.6)}>
        <Extrude depth={9} dark={dkc(col)}>{f => <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={30} fill={f ?? col} />}</Extrude>
        <Morph names={["n3", "circle", "star5"]} u={clamp((t - tc - 14 - i * 5) / 14) * 2} x={w / 2 - 70} y={0} r={26} sw={5} stroke={i === 3 || i === 0 ? C.ink : "#fff"} glow="none" />
        <text x={-w / 2 + 34} y={-12} fontWeight={800} fontSize={44} fill={i === 3 || i === 0 ? C.ink : "#fff"} fontFamily={FAM.b}>{title}</text>
        <text x={-w / 2 + 34} y={36} fontWeight={600} fontSize={44} fill={i === 3 || i === 0 ? "#3a3350" : "#e8ecff"} fontFamily={FAM.b}>{hint}</text>
      </g>;
    })}
  </>;
};

// ---------- part 3: quiz "Ověř si" ----------
const OPTS = ["F = m · a", "m = F · a", "v = s / t", "p = m · g"];
const S1Quiz = (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => {
  const wrong = prog(t, tc + 16, tc + 24), right = prog(t, tc + 32, tc + 44), shake = wrong > 0 && wrong < 1 ? Math.sin(wrong * 28) * 10 * (1 - wrong) : 0;
  const flip = easeIO(prog(t, 30, 44)), fw = Math.abs(Math.cos(flip * Math.PI));
  return <>
    <Rings x={cx} y={760} t={t} />
    <KSpark t={t} geo={geo} leave={leave} />
    <Katana t={t} tc={tc} A={[120, 600]} B={[960, 520]} chip={[[160, 330], [370, 330], [160, 430]]} id="m3">
      <CutCard col={C.coral} t={t}>
        <g transform={`translate(${cx} 560) scale(${Math.max(0.04, fw)} 1) translate(${-cx} -560)`}>
          <text x={cx} y={640} textAnchor="middle" fontWeight={800} fontSize={300} fill={C.yellow} fontFamily={FAM.h} style={{ filter: WARM }} opacity={pop(t, 24, 10)}>{flip < 0.5 ? "?" : "!"}</text>
        </g>
        <text x={cx} y={752} textAnchor="middle" fontSize={92} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 38, 10)}>klikni a otoč</text>
      </CutCard>
    </Katana>
    <rect x={0} y={0} width={W} height={1920} fill="#fff" opacity={flash(t, tc)} />
    {burst(t, tc, 540, 560, C.yellow)}
    <KText id="mq" text="Druhý Newtonův zákon?" x={cx} y={898} size={50} t={t} a={tc + 6} mode="rise" st={1} fill={C.cream} maxW={900} />
    {OPTS.map((o, i) => {
      const k = pop(t, tc + 12 + i * 3, 10); if (k <= 0) return null;
      const y = 1000 + i * 112, col = i === 0 && right > 0 ? C.green : i === 1 && wrong > 0 && right <= 0 ? C.coral : C.surf2, w = 760, h = 92;
      const sx = i === 1 ? shake : 0;
      return <g key={o} transform={`translate(${cx + sx} ${y}) scale(${k})`} opacity={clamp(k * 1.6)}>
        <Extrude depth={8} dark={i === 0 && right > 0 ? "#0e7d48" : i === 1 && wrong > 0 && right <= 0 ? "#d63f24" : "#0a0918"}>{f => <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={f ?? col} stroke={f ? undefined : C.edge} strokeWidth={f ? 0 : 3} />}</Extrude>
        <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={46} fill="#fff" fontFamily={FAM.b}>{o}</text>
        {i === 0 && right <= 0 && <Morph names={["n3", "circle"]} u={clamp((t - tc - 20) / 12)} x={w / 2 - 60} y={0} r={24} sw={5} stroke="#fff" glow="none" />}
        {i === 0 && right > 0 && <path d="M300 2 L322 24 L360 -20" transform="translate(-30 0)" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="120" strokeDashoffset={120 * (1 - right)} />}
      </g>;
    })}
    {burst(t, tc + 32, cx, 1000, C.greenL, 80)}
    <Tag text="Správně!" x={cx} y={1480} t={t} a={tc + 36} kind="gold" size={26} />
  </>;
};

// ---------- outro: logo + url pill ----------
const Outro = (cta: string | null, teaser: string[]) => (t: number) => <>
  <Rings x={cx} y={700} t={t} />
  <LogoRow y={700} t={t} a={14} gap={0.9} />
  <Tag text="ucimesehrou.org/cs/materialy" x={cx} y={900} t={t} a={34} kind="gold" size={22} />
  {cta ? <>
    <KText id="mc0" text={cta} x={cx} y={1130} size={72} t={t} a={38} f="h" wt={800} mode="rise" st={1} />
    <Tag text="Procvičit v kurzech" x={cx} y={1290} t={t} a={46} kind="on" size={22} />
  </> : <>
    <Tag text="Další díl" x={cx} y={1130} t={t} a={38} kind="off" size={20} />
    {teaser.map((l, i) => <KText key={i} id={"mt" + i} text={l} x={cx} y={1250 + i * 110} size={72} t={t} a={42 + i * 5} f="h" wt={800} mode="rise" st={1} />)}
  </>}
</>;

const [P1S, P2S, P3S] = SPEC.parts;
const M1 = makePart(P1S, "doc", ["Učivo na", "jednom místě."], S1Subjects, Outro(null, ["Čtyři", "úrovně"]), P1S.tc);
const M2 = makePart(P2S, "steps", ["Od základů", "po přijímačky."], S1Levels, Outro(null, ["Ověř si", "a procvič"]), P2S.tc);
const M3 = makePart(P3S, "bulb", ["Přečti.", "Pak si ověř."], S1Quiz, Outro("Přečti si to dnes.", []), P3S.tc);
export const MATERIALY_FRAMES = [M1.frames, M2.frames, M3.frames];
export const MaterialyPart1 = M1.Comp, MaterialyPart2 = M2.Comp, MaterialyPart3 = M3.Comp;
