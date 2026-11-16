// UčímePRO showcase part 2 (1920x1080, 30 fps). Real guest flow in umime-skola:
//   /pro  -> card "AI doučovač" -> /pro/doucovatel (gate "Tohle je funkce UčímePRO") -> button "Tarify UčímePRO" -> /pro (section "Tarify": 3 plans).
// Sources: src/app/[locale]/pro/[feature]/page.tsx, pro/page.tsx, src/i18n/{pro,pro-extra,pro-tools}.ts (cs). Sound: audio/pro2_sfx.py (same frames as CUE2).
import React, {useMemo} from "react";
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from "remotion";
import {FAM, FontGate, tw} from "./Code";
import {LOGO_PARTS} from "./logo";
import {
  SCREEN, CardInset, MonitorViewport, clickMotion, brandDockPose, easeInOutQuintic, easeOut, beat, eased, clamp, mix, Icon, Row, PRO_TOOLS,
  TABS, ACCENT, STRIP_TITLE, URL_TEXT, W, H, MARK_ANCHOR, LOGO_O, LOCK_S, HEADER_DOCK, LOCK_DOCK, type Point,
} from "./ProShowcase";

export const CUE2 = {
  open: {start: 16, end: 50}, wordOut: {start: 16, end: 32}, uiIn: {start: 34, end: 54},
  click1: 96, click2: 190, aIn: 102, cIn: 198,
  scroll: {start: 268, end: 316},
  uiOut: {start: 332, end: 350}, dock: {start: 334, end: 370}, wordIn: 350, urlIn: 364,
};
export const PRO2_FRAMES = 444;
const RAIL = 252, BODY_BOTTOM = 1020;

// ---- real texts (cs)
const T = {
  tool: {title: "AI doučovač", text: "Vysvětlí úlohu krok za krokem a dovede tě k výsledku.", back: "UčímePRO"},
  gate: {title: "Tohle je funkce UčímePRO", text: "Přihlas se s účtem, který má aktivní UčímePRO, nebo se podívej na tarify.", login: "Přihlásit se", plans: "Tarify UčímePRO"},
  tiersTitle: "Tarify", trial: "30 dní zdarma",
};
const PLANS = [
  {title: "Jednotlivec", text: "Předplatné pro jeden účet. Platí jen pro tebe.", price: "100 Kč", per: "měsíčně", yearly: "nebo 1 000 Kč ročně (2 měsíce zdarma)", color: "#35d0ff",
    perks: ["1 účet", "Všechny výhody PRO pro jednotlivce", "Zrušení kdykoli"]},
  {title: "Rodina", text: "Jeden tarif pro více členů rodiny. Plátce ho spravuje a přidává členy.", price: "250 Kč", per: "měsíčně", yearly: "nebo 2 500 Kč ročně (2 měsíce zdarma)", color: "#ffd23f",
    perks: ["Až 5 členů rodiny s plným PRO", "Dětský bezpečný režim", "Začínat s dítětem: tipy, jak pomoci, aniž bys rušil/a", "Plán na prázdniny, ať se po létě nic nezapomene", "Rodinný souboj s handicapem pro vyrovnané šance"]},
  {title: "Škola", text: "Tarif pro žáky vybrané školy. Platí, když je škola uvedena ve tvém účtu.", price: "12 000 Kč", per: "ročně za školu", yearly: "", color: "#7cf29a",
    perks: ["Mapa mezer třídy s hotovou 20min lekcí na další hodinu", "Souběžná hodina: třída hraje týmově, učitel vidí, kdo se zasekl", "Nepsané testy podle RVP s klíčem a hodnocením", "Každý žák má jiné zadání, opisování nemá smysl", "Exit ticket za 2 minuty na konci hodiny", "Kamarád pro suplování: hodina zadaná jedním kliknutím", "Průvodce rodičovskými schůzkami: stránka o každém žákovi", "Pomalejší a rychlejší tempo bez nálepek", "Vlastní obsah školy z nahraných učebnic", "Zaškolení učitelů a přednostní podpora"]},
];

const wrap = (text: string, size: number, wt: number, maxW: number) => {
  const out: string[] = []; let line = "";
  for (const w of text.split(" ")) { const t = line ? line + " " + w : w; if (line && tw(t, size, wt, "b") > maxW) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
};

const CARD_W = (1728 - 56) / 3, PERK_LH = 34;
const Plan: React.FC<{p: (typeof PLANS)[number]; x: number; o: number; dy: number}> = ({p, x, o, dy}) => {
  const tl = wrap(p.text, 26, 600, CARD_W - 64), yl = p.yearly ? wrap(p.yearly, 26, 800, CARD_W - 64) : [];
  let y = 108 + tl.length * 34 + 22;
  const priceY = y + 52; y = priceY + 20 + (yl.length ? yl.length * 34 + 8 : 0) + 10;
  const perkRows = p.perks.map((perk) => { const lines = wrap(perk, 26, 600, CARD_W - 64 - 44); const row = {lines, y}; y += lines.length * PERK_LH + 24; return row; });
  const height = y + 14;
  return (
    <g opacity={o} transform={`translate(${x} ${12 + dy})`}>
      <CardInset x={0} y={0} width={CARD_W} height={height} radius={24} state="panel">
        <rect x={22} y={0} width={CARD_W - 44} height={6} rx={3} fill={p.color} />
        <text x={32} y={74} fontFamily={FAM.b} fontWeight={800} fontSize={44} fill={SCREEN.text}>{p.title}</text>
        {tl.map((l, i) => <text key={i} x={32} y={116 + i * 34} fontFamily={FAM.b} fontWeight={600} fontSize={26} fill={SCREEN.muted}>{l}</text>)}
        <text x={32} y={priceY} fontFamily={FAM.b} fontWeight={800} fontSize={60} fill={SCREEN.text}>{p.price}</text>
        <text x={32 + tw(p.price, 60, 800, "b") + 14} y={priceY} fontFamily={FAM.b} fontWeight={600} fontSize={26} fill={SCREEN.muted}>{p.per}</text>
        {yl.map((l, i) => <text key={i} x={32} y={priceY + 40 + i * 34} fontFamily={FAM.b} fontWeight={800} fontSize={26} fill="#7ee0b0">{l}</text>)}
        {perkRows.map((r, k) => (
          <g key={k}>
            <line x1={32} x2={CARD_W - 32} y1={r.y - 6} y2={r.y - 6} stroke={SCREEN.rim} strokeOpacity={0.4} />
            <Icon name="check" x={32} y={r.y + 8} size={26} color="#7ee0b0" sw={2.4} />
            {r.lines.map((l, i) => <text key={i} x={76} y={r.y + 30 + i * PERK_LH} fontFamily={FAM.b} fontWeight={600} fontSize={26} fill={SCREEN.text}>{l}</text>)}
          </g>
        ))}
      </CardInset>
    </g>
  );
};

export const ProShowcase2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <FontGate>
      <AbsoluteFill style={{background: SCREEN.background}}>
        <Audio src={staticFile("pro/part2.wav")} />
        <Scene f={f} />
      </AbsoluteFill>
    </FontGate>
  );
};

const Scene: React.FC<{f: number}> = ({f}) => {
  const g = useMemo(() => {
    const markW = 95 * HEADER_DOCK.scale, x0 = 96 + markW + 44, pad = 36, gap = 14; let x = x0;
    const tabs = TABS.map((label) => { const w = tw(label, 34, 800, "b") + pad * 2; const t = {label, x, width: w}; x += w + gap; return t; });
    const backW = tw("UčímePRO", 34, 800, "b") + 36 * 2 + 34;
    const bw = [tw(T.gate.login, 34, 800, "b") + 72, tw(T.gate.plans, 34, 800, "b") + 72];
    return {tabs, x0, backW, bw, labelW: tw(STRIP_TITLE, 30, 700, "h"), tiersW: tw(T.tiersTitle, 30, 700, "h")};
  }, []);
  const tabY = 64, tabH = 64;
  const GATE_Y = 28, BTN_Y = GATE_Y + 196, BTN_H = 76;                       // relative to the body origin (RAIL)
  const btn2c: Point = [132 + g.bw[0] + 20 + g.bw[1] / 2, RAIL + BTN_Y + BTN_H / 2];
  const row1c: Point = [1000, RAIL + 12 + 60];

  // pages: A = /pro list, B = tool gate, C = /pro Tarify
  const A = 1 - beat(f, CUE2.click1 + 3, 14);
  const B = Math.min(beat(f, CUE2.aIn, 14), 1 - beat(f, CUE2.click2 + 3, 14));
  const C = beat(f, CUE2.cIn, 14);
  const uiO = Math.min(beat(f, CUE2.uiIn.start, CUE2.uiIn.end - CUE2.uiIn.start), 1 - beat(f, CUE2.uiOut.start, CUE2.uiOut.end - CUE2.uiOut.start));
  const tabsVis = Math.max(A, C);

  // pointer
  const C0: Point = [1500, 640], D1: Point = [1240, 820], D2: Point = [1560, 700];
  const cm1 = clickMotion(f, CUE2.click1, C0, row1c, 62, 6, 3, 8), cm2 = clickMotion(f, CUE2.click2, D1, btn2c, 160, 6, 3, 8);
  let cur: {x: number; y: number; press: number};
  if (f < 106) cur = cm1;
  else if (f < 140) { const t = easeInOutQuintic(beat(f, 106, 34)); cur = {x: mix(row1c[0], D1[0], t), y: mix(row1c[1], D1[1], t), press: 0}; }
  else if (f < 200) cur = cm2;
  else { const t = easeInOutQuintic(beat(f, 200, 40)); cur = {x: mix(btn2c[0], D2[0], t), y: mix(btn2c[1], D2[1], t), press: 0}; }
  const curO = Math.min(beat(f, 40, 10), 1 - beat(f, 204, 14));

  const scrollY = 500 * eased(f, CUE2.scroll);
  const dock = f < CUE2.dock.start ? brandDockPose(f, CUE2.open, LOCK_DOCK, HEADER_DOCK) : brandDockPose(f, CUE2.dock, HEADER_DOCK, LOCK_DOCK);
  const pr = cm1.press, pr2 = cm2.press;

  const header = (
    <g>
      <rect x={0} y={0} width={W} height={RAIL} fill={SCREEN.background} />
      <g opacity={uiO}>
        {/* tabs (pages A and C) */}
        <g opacity={tabsVis}>
          {g.tabs.map((t) => <CardInset key={t.label} x={t.x} y={tabY} width={t.width} height={tabH} radius={tabH / 2} state="raised" />)}
          <g style={{filter: "drop-shadow(0 0 16px rgba(90,108,255,.55))"}}>
            <rect x={g.tabs[0].x} y={tabY} width={g.tabs[0].width} height={tabH} rx={tabH / 2} fill="#2433b8" />
            <rect x={g.tabs[0].x} y={tabY} width={g.tabs[0].width} height={tabH} rx={tabH / 2} fill="none" stroke="#8d99ff" strokeWidth={2} />
            <rect x={g.tabs[0].x + 14} y={tabY + 3} width={g.tabs[0].width - 28} height={tabH / 2 - 6} rx={(tabH / 2 - 6) / 2} fill="#fff" opacity={0.09} />
          </g>
          {g.tabs.map((t, i) => <text key={t.label} x={t.x + t.width / 2} y={tabY + tabH / 2 + 12} textAnchor="middle" fontFamily={FAM.b} fontWeight={800} fontSize={34} fill={i === 0 ? "#FFFFFF" : SCREEN.text}>{t.label}</text>)}
        </g>
        {/* back pill (page B) */}
        <g opacity={B}>
          <CardInset x={g.x0} y={tabY} width={g.backW} height={tabH} radius={tabH / 2} state="raised" />
          <path d={`M${g.x0 + 40} ${tabY + 32}H${g.x0 + 18}M${g.x0 + 28} ${tabY + 22}L${g.x0 + 18} ${tabY + 32}L${g.x0 + 28} ${tabY + 42}`} fill="none" stroke={SCREEN.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" transform="translate(8 0)" />
          <text x={g.x0 + 76} y={tabY + 44} fontFamily={FAM.b} fontWeight={800} fontSize={34} fill={SCREEN.text}>{T.tool.back}</text>
        </g>
        {/* A: summary strip */}
        <g opacity={A}>
          <rect x={96} y={152} width={1728} height={84} rx={22} fill="#1A2234" />
          <rect x={96.5} y={152.5} width={1727} height={83} rx={21.5} fill="none" stroke="#8d99ff" strokeOpacity={0.35} />
          <text x={132} y={205} fontFamily={FAM.h} fontWeight={700} fontSize={30} fill={SCREEN.text}>{STRIP_TITLE}</text>
          {PRO_TOOLS.slice(0, 3).map((t, k) => { const ax = 96 + 36 + g.labelW + 40 + 26 + k * 44; return (
            <g key={k}><circle cx={ax} cy={194} r={27} fill="#1A2234" /><circle cx={ax} cy={194} r={24} fill={SCREEN.inset} stroke={ACCENT[k % 4]} strokeOpacity={0.7} /><Icon name={t.icon} x={ax - 13} y={181} size={26} color={ACCENT[k % 4]} sw={2} /></g>); })}
          <text x={1788} y={204} textAnchor="end" fontFamily={FAM.b} fontWeight={600} fontSize={30} fill={SCREEN.muted}>Vyber, s čím chceš pracovat.</text>
        </g>
        {/* B: page title + subtitle */}
        <g opacity={B} transform={`translate(0 ${10 * (1 - B)})`}>
          <text x={96} y={196} fontFamily={FAM.h} fontWeight={800} fontSize={52} fill={SCREEN.text}>{T.tool.title}</text>
          <text x={96} y={238} fontFamily={FAM.b} fontWeight={600} fontSize={30} fill={SCREEN.muted}>{T.tool.text}</text>
        </g>
        {/* C: strip "Tarify" + trial */}
        <g opacity={C}>
          <rect x={96} y={152} width={1728} height={84} rx={22} fill="#1A2234" />
          <rect x={96.5} y={152.5} width={1727} height={83} rx={21.5} fill="none" stroke="#8d99ff" strokeOpacity={0.35} />
          <text x={132} y={205} fontFamily={FAM.h} fontWeight={700} fontSize={30} fill={SCREEN.text}>{T.tiersTitle}</text>
          <text x={1788} y={207} textAnchor="end" fontFamily={FAM.b} fontWeight={800} fontSize={34} fill="#7ee0b0">{T.trial}</text>
        </g>
      </g>
    </g>
  );

  const bodyIn = (i: number, start: number) => { const t = easeOut(beat(f, start + i * 5, 16)); return {o: t, dy: 26 * (1 - t)}; };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
      <defs><linearGradient id="bodyFade2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SCREEN.background} stopOpacity="0" /><stop offset="1" stopColor={SCREEN.background} stopOpacity="1" /></linearGradient></defs>
      <g opacity={uiO}>
        <MonitorViewport x={0} y={0} width={W} height={BODY_BOTTOM} railHeight={RAIL} scrollY={C > 0.001 ? scrollY : 0} header={<g />}>
          {/* A: /pro list (first card is pressed) */}
          {A > 0.001 && (
            <g opacity={A}>
              {PRO_TOOLS.map((t, i) => (
                <g key={t.title} transform={i === 0 ? `translate(1000 ${12 + 60 + 2 * pr}) scale(${1 - 0.012 * pr}) translate(-1000 ${-12 - 60})` : undefined}>
                  <Row tool={t} i={i} y={12 + i * 132} o={1} dy={0} />
                </g>
              ))}
              {pr > 0 && <rect x={96.5} y={12.5} width={1727} height={119} rx={23.5} fill="none" stroke={SCREEN.lift} strokeWidth={3} opacity={pr} />}
            </g>
          )}
          {/* B: gate card */}
          {B > 0.001 && (() => { const b = bodyIn(0, CUE2.aIn + 4); return (
            <g opacity={Math.min(B, b.o)} transform={`translate(0 ${b.dy})`}>
              <CardInset x={96} y={GATE_Y} width={1728} height={BTN_Y + BTN_H + 40 - GATE_Y + GATE_Y} radius={24} state="panel">
                <text x={36} y={82} fontFamily={FAM.b} fontWeight={800} fontSize={48} fill={SCREEN.text}>{T.gate.title}</text>
                <text x={36} y={134} fontFamily={FAM.b} fontWeight={600} fontSize={30} fill={SCREEN.muted}>{T.gate.text}</text>
              </CardInset>
              <g>
                <CardInset x={132} y={BTN_Y} width={g.bw[0]} height={BTN_H} radius={22} state="raised" />
                <text x={132 + g.bw[0] / 2} y={BTN_Y + 49} textAnchor="middle" fontFamily={FAM.b} fontWeight={800} fontSize={34} fill={SCREEN.text}>{T.gate.login}</text>
              </g>
              <g transform={`translate(${132 + g.bw[0] + 20 + g.bw[1] / 2} ${BTN_Y + BTN_H / 2 + 3 * pr2}) scale(${1 - 0.035 * pr2}) translate(${-(132 + g.bw[0] + 20 + g.bw[1] / 2)} ${-(BTN_Y + BTN_H / 2)})`} style={{filter: "drop-shadow(0 0 18px rgba(90,108,255,.6))"}}>
                <rect x={132 + g.bw[0] + 20} y={BTN_Y} width={g.bw[1]} height={BTN_H} rx={22} fill="#2433b8" />
                <rect x={132 + g.bw[0] + 20} y={BTN_Y} width={g.bw[1]} height={BTN_H} rx={22} fill="none" stroke="#8d99ff" strokeWidth={2} />
                <text x={132 + g.bw[0] + 20 + g.bw[1] / 2} y={BTN_Y + 49} textAnchor="middle" fontFamily={FAM.b} fontWeight={800} fontSize={34} fill="#FFFFFF">{T.gate.plans}</text>
              </g>
            </g>
          ); })()}
          {/* C: three plans */}
          {C > 0.001 && (
            <g opacity={C}>
              {PLANS.map((p, i) => { const b = bodyIn(i, CUE2.cIn + 2); return <Plan key={p.title} p={p} x={96 + i * (CARD_W + 28)} o={b.o} dy={b.dy} />; })}
            </g>
          )}
        </MonitorViewport>
        <rect x={0} y={972} width={W} height={H - 972} fill="url(#bodyFade2)" />
        <rect x={0} y={BODY_BOTTOM} width={W} height={H - BODY_BOTTOM} fill={SCREEN.background} />
      </g>
      {header}
      <g transform={`translate(${W / 2 - 942.5 * LOCK_S / 2} 400) scale(${LOCK_S}) translate(${-LOGO_O[0]} ${-LOGO_O[1]})`}>
        {LOGO_PARTS.slice(5).map((p, j) => {
          const t = f < CUE2.wordIn ? 1 - beat(f, CUE2.wordOut.start + j * 0.8, 12) : easeOut(beat(f, CUE2.wordIn + j * 1.4, 12));
          if (t <= 0) return null;
          return <g key={j} opacity={t} transform={`translate(${p.cx} ${p.cy + 10 * (1 - t)}) scale(${0.8 + 0.2 * t}) translate(${-p.cx} ${-p.cy})`} dangerouslySetInnerHTML={{__html: p.svg}} />;
        })}
      </g>
      <g transform={`translate(${dock.x} ${dock.y}) scale(${dock.scale}) translate(${-MARK_ANCHOR[0]} ${-MARK_ANCHOR[1]})`}>
        {LOGO_PARTS.slice(0, 5).map((p, j) => <g key={j} dangerouslySetInnerHTML={{__html: p.svg}} />)}
      </g>
      {(() => { const t = easeOut(beat(f, CUE2.urlIn, 16)); return t > 0 && (
        <text x={W / 2} y={400 + 106.8 * LOCK_S + 112 + 12 * (1 - t)} textAnchor="middle" opacity={t} fontFamily={FAM.b} fontWeight={800} fontSize={60} letterSpacing={1} fill={SCREEN.text}>{URL_TEXT}</text>
      ); })()}
      {([[CUE2.click1, row1c], [CUE2.click2, btn2c]] as [number, Point][]).map(([c, [px, py]], k) => { const t = beat(f, c, 16); return t > 0 && t < 1 && <circle key={k} cx={px} cy={py} r={26 + 56 * easeOut(t)} fill="none" stroke={SCREEN.lift} strokeWidth={4 * (1 - t)} opacity={1 - t} />; })}
      {curO > 0 && (
        <g transform={`translate(${cur.x} ${cur.y}) scale(${1 - 0.1 * cur.press})`} opacity={curO} style={{filter: "drop-shadow(0 4px 6px rgba(0,0,0,.55))"}}>
          <path d="M0 0 L0 38 L10 29 L17 44 L25 40 L18 26 L31 26 Z" fill={SCREEN.text} stroke="#06090880" strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};
