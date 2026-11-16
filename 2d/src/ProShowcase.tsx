// UčímePRO showcase (1920x1080, 30 fps, one continuous display). Source of truth: umime-skola
//   src/app/[locale]/pro/page.tsx, src/components/pro/{ProTabs,ProToolPile,ProTabView,SchoolShopCards,ProIcon}.tsx,
//   src/i18n/{pro-tools,pro-tabs}.ts (cs), src/lib/pro-tools/features.ts, public/brand/logo-tmave.svg (via ./logo.ts).
// Flow: tab Pro (8 tool cards, scroll) -> press tab Rodina (3 cards) -> press tab Škola (11 cards, first 5 + edge) -> brand icon docks into wordmark + URL.
// One frame clock drives UI, pointer and sound (audio/pro_sfx.py has the same frame numbers: keep CUE in step).
import React, {useId, useMemo, type ReactNode} from "react";
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from "remotion";
import {FAM, FontGate, tw} from "./Code";
import {LOGO_PARTS} from "./logo";
import {PRO_PATHS} from "./proIcons";

// ---------------------------------------------------------------- display kit (graphite)
export const SCREEN = {
  background: "#060908", panel: "#1B2323", inset: "#0B1210", raised: "#273530", selected: "#214C36",
  lift: "#B1E7D3", rim: "#667C74", side: "#0A1010", text: "#F6F1E4", muted: "#BAC5BF",
} as const;
export type Point = readonly [number, number];
export type Span = {start: number; end: number};
export const clamp = (v: number) => Math.min(1, Math.max(0, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeInOutQuintic = (t: number) => t ** 3 * (10 + t * (-15 + 6 * t));
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const beat = (f: number, start: number, duration: number) => clamp((f - start) / Math.max(Number.EPSILON, duration));
export const phase = (f: number, s: Span) => beat(f, s.start, s.end - s.start);
export const eased = (f: number, s: Span) => easeInOutQuintic(phase(f, s));
const svgId = (prefix: string, id: string) => prefix + Array.from(id, (c) => c.codePointAt(0)!.toString(16)).join("-");

export function CardInset({x, y, width, height, radius = 16, state = "inset", fill, children}: {
  x: number; y: number; width: number; height: number; radius?: number;
  state?: "panel" | "inset" | "raised" | "selected"; fill?: string; children?: ReactNode;
}) {
  const id = svgId("well-", useId());
  const p = SCREEN, raised = state === "raised";
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={id} x2="0%" y2="100%">
          <stop offset="0" stopColor={raised || state === "panel" ? p.lift : p.side} stopOpacity={raised || state === "panel" ? 0.11 : 0.42} />
          <stop offset=".30" stopColor={p.side} stopOpacity="0" />
          <stop offset="1" stopColor={p.side} stopOpacity=".15" />
        </linearGradient>
        {raised && <filter id={id + "-shadow"} x="-20%" y="-20%" width="140%" height="155%"><feGaussianBlur stdDeviation="7" /></filter>}
      </defs>
      {raised && <rect y="9" width={width} height={height} rx={radius} fill="#050506" opacity=".52" filter={`url(#${id}-shadow)`} />}
      <rect width={width} height={height} rx={radius} fill={fill ?? p[state]} />
      <rect width={width} height={height} rx={radius} fill={`url(#${id})`} />
      <rect x=".5" y=".5" width={Math.max(0, width - 1)} height={Math.max(0, height - 1)} rx={Math.max(0, radius - 0.5)} fill="none" stroke={p.rim} strokeOpacity={state === "selected" ? 0.78 : 0.43} />
      {children}
    </g>
  );
}

export function MonitorViewport({x, y, width, height, railHeight, scrollY, header, children}: {
  x: number; y: number; width: number; height: number; railHeight: number; scrollY: number; header: ReactNode; children: ReactNode;
}) {
  const clipId = svgId("monitor-body-", useId());
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><rect x="0" y={railHeight} width={width} height={Math.max(0, height - railHeight)} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}><g transform={`translate(0 ${railHeight - Math.max(0, scrollY)})`}>{children}</g></g>
      {header}
    </g>
  );
}

export function monitorPillPose(f: number, span: Span, from: {x: number; width: number}, to: {x: number; width: number}) {
  const t = eased(f, span);
  return {x: mix(from.x, to.x, t), width: mix(from.width, to.width, t)};
}

export function clickMotion(frame: number, click: number, from: Point, target: Point, start: number, contactLead: number, pressIn: number, release: number) {
  const approach = easeInOutQuintic(beat(frame, start, click - contactLead - start));
  const dx = target[0] - from[0], dy = target[1] - from[1], len = Math.hypot(dx, dy);
  const curve = Math.min(32, len * 0.17) * 4 * approach * (1 - approach);
  const x = mix(from[0], target[0], approach) - (dy / Math.max(1, len)) * curve;
  const y = mix(from[1], target[1], approach) + (dx / Math.max(1, len)) * curve;
  const el = frame - click;
  const press = el < 0 ? 0 : el <= pressIn ? smooth(beat(el, 0, pressIn)) : 1 - smooth(beat(el, pressIn, release));
  return {x, y, press, buttonScale: 1 - 0.035 * press, buttonY: 3 * press};
}

export type Dock = {x: number; y: number; scale: number};
export function brandDockPose(f: number, span: Span, from: Dock, to: Dock) {
  const t = eased(f, span);
  return {x: mix(from.x, to.x, t), y: mix(from.y, to.y, t), scale: mix(from.scale, to.scale, t)};
}

// ---------------------------------------------------------------- real content (cs), copied from umime-skola
type Tool = {icon: string; title: string; text: string};
export const PRO_TOOLS: Tool[] = [
  {icon: "doucovatel", title: "AI doučovač", text: "Vysvětlí úlohu krok za krokem a dovede tě k výsledku."},
  {icon: "plan", title: "Osobní plán učení", text: "Týdenní plán po 15 minutách podle toho, co ti nejde."},
  {icon: "zkouska", title: "Příprava na přijímačky", text: "Zkoušky nanečisto s časovým limitem a odhadem bodů."},
  {icon: "fotka", title: "Fotka úlohy", text: "Vyfoť úlohu a dostaneš pět podobných příkladů."},
  {icon: "sesit-chyb", title: "Sešit chyb", text: "Tvoje chyby s vysvětlením, k opakování i k tisku."},
  {icon: "poznamky", title: "Import z poznámek", text: "Z poznámek nebo fotky udělá kartičky na učení."},
  {icon: "vyslovnost", title: "Výslovnost", text: "Řekni větu nahlas a uvidíš, jak jsi na tom."},
  {icon: "offline", title: "Offline režim", text: "Stáhni si kurzy a procvičuj i bez internetu."},
];
const FAMILY_TOOLS: Tool[] = [
  {icon: "rodina", title: "Rodina", text: "Členové, pozvánky, dětský bezpečný režim a tip, jak dítěti pomoct."},
  {icon: "souboj", title: "Rodinný souboj", text: "Rodič a dítě soutěží v kvízu, rodič má handicap."},
  {icon: "prazdniny", title: "Plán na prázdniny", text: "Denně 15 minut, aby se po létě nic nezapomnělo."},
];
const SCHOOL_TOOLS: Tool[] = [
  {icon: "skola-mezery", title: "Mapa mezer", text: "Kde má třída nejvíc potíží. U každého tématu je hotová 20minutová lekce."},
  {icon: "skola-soubeh", title: "Souběžná hodina", text: "Zadej cvičení a sleduj, kdo je kde, v reálném čase."},
  {icon: "skola-test", title: "Nepsaný test", text: "Krátký test bez stresu, hned vyhodnocený."},
  {icon: "skola-zadani", title: "Různá zadání", text: "Každý žák dostane jiné otázky a jiné pořadí možností."},
  {icon: "skola-exit", title: "Exit ticket", text: "Krátká otázka na konec hodiny. Hned vidíš, co zůstalo."},
  {icon: "skola-suplovani", title: "Suplování", text: "Připravené zadání pro suplování, když chybíš ty nebo kolega."},
  {icon: "skola-schuzka", title: "Průvodce schůzkami", text: "Podklady a body pro schůzku s rodiči nebo kolegy."},
  {icon: "skola-tempo", title: "Tempo ve skupinách", text: "Třída se sama rozdělí do skupin A, B a C podle výsledků."},
  {icon: "skola-obsah", title: "Vlastní obsah", text: "Vlastní otázky z tvého učiva, AI je pomůže připravit."},
  {icon: "skola-dilna", title: "Učitelská dílna", text: "Hry na párování, řazení, příběh nebo mluvení z textu či fotky."},
  {icon: "skola-podpora", title: "Podpora", text: "Něco nefunguje nebo potřebuješ poradit s tarifem? Napiš nám."},
];
export const TABS = ["Pro", "Rodina", "Škola"] as const;
export const LISTS = [PRO_TOOLS, FAMILY_TOOLS, SCHOOL_TOOLS];
export const ACCENT = ["#ffc933", "#ff8a6b", "#8fd0ff", "#7ee0b0"];            // FEATURE_COLORS in ProToolPile.tsx
export const STRIP_TITLE = "Nástroje UčímePRO", STRIP_HINT = "Vyber, s čím chceš pracovat.";
export const URL_TEXT = "ucimesehrou.org/ucime-pro";

// ---------------------------------------------------------------- one timeline (frames @30)
export const CUE = {
  open: {start: 16, end: 50}, wordOut: {start: 16, end: 32}, uiIn: {start: 34, end: 54},
  scroll: {start: 58, end: 102},
  click1: 136, click2: 224,
  pill1: {start: 138, end: 164}, pill2: {start: 226, end: 252},
  rodIn: 148, rodOut: 228, skIn: 234,
  uiOut: {start: 316, end: 334}, dock: {start: 318, end: 354},
  wordIn: 334, urlIn: 348,
};
export const PRO_FRAMES = 432;
export const W = 1920, H = 1080;
export const ROW_H = 120, ROW_S = 132, RAIL = 252, BODY_BOTTOM = 1020, SCROLL_MAX = 330;

export const Icon: React.FC<{name: string; x: number; y: number; size: number; color: string; sw?: number}> = ({name, x, y, size, color, sw = 1.8}) => (
  <g transform={`translate(${x} ${y}) scale(${size / 24})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{color}}>{PRO_PATHS[name]}</g>
);

export const Row: React.FC<{tool: Tool; i: number; y: number; o: number; dy: number}> = ({tool, i, y, o, dy}) => {
  const c = ACCENT[i % 4];
  return (
    <g opacity={o} transform={`translate(0 ${y + dy})`}>
      <CardInset x={96} y={0} width={1728} height={ROW_H} radius={24} state="panel">
        <text x={42} y={70} fontFamily={FAM.h} fontWeight={700} fontSize={26} fill={SCREEN.muted} opacity={0.8}>{String(i + 1).padStart(2, "0")}</text>
        <CardInset x={118} y={20} width={80} height={80} radius={22} state="inset" />
        <rect x={118.5} y={20.5} width={79} height={79} rx={21.5} fill="none" stroke={c} strokeOpacity={0.55} />
        <Icon name={tool.icon} x={138} y={40} size={40} color={c} />
        <text x={232} y={56} fontFamily={FAM.b} fontWeight={800} fontSize={44} fill={SCREEN.text}>{tool.title}</text>
        <text x={232} y={95} fontFamily={FAM.b} fontWeight={600} fontSize={28} fill={SCREEN.muted}>{tool.text}</text>
        <path d="M1604 60H1632M1621 49L1632 60L1621 71" fill="none" stroke={SCREEN.muted} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      </CardInset>
    </g>
  );
};

// mark = LOGO_PARTS[0..4] (anchor = top-left of its box in logo space), wordmark = [5..]
export const MARK_ANCHOR: Point = [5, 5];
export const LOGO_O: Point = [2.5, 2.3];                                         // viewBox origin of logo-tmave.svg
export const LOCK_S = 1.58, LOCK_X = (W - 942.5 * LOCK_S) / 2, LOCK_Y = 400;
export const HEADER_DOCK: Dock = {x: 96, y: 64, scale: 0.63};
export const LOCK_DOCK: Dock = {x: LOCK_X + (MARK_ANCHOR[0] - LOGO_O[0]) * LOCK_S, y: LOCK_Y + (MARK_ANCHOR[1] - LOGO_O[1]) * LOCK_S, scale: LOCK_S};

export const ProShowcase: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <FontGate>
      <AbsoluteFill style={{background: SCREEN.background}}>
        <Audio src={staticFile("pro/part1.wav")} />
        <Scene f={f} />
      </AbsoluteFill>
    </FontGate>
  );
};

const Scene: React.FC<{f: number}> = ({f}) => {
  // ---- measured geometry (fonts are loaded by FontGate)
  const geo = useMemo(() => {
    const markW = 95 * HEADER_DOCK.scale, x0 = 96 + markW + 44, pad = 36, gap = 14;
    let x = x0;
    const tabs = TABS.map((label) => { const w = tw(label, 34, 800, "b") + pad * 2; const t = {label, x, width: w}; x += w + gap; return t; });
    const labelW = tw(STRIP_TITLE, 30, 700, "h");
    return {tabs, labelW};
  }, []);
  const tabY = 64, tabH = 64;
  const centre = (i: number): Point => [geo.tabs[i].x + geo.tabs[i].width / 2, tabY + tabH / 2];

  // ---- tab selection
  const pill: {x: number; width: number} = f < CUE.pill2.start ? monitorPillPose(f, CUE.pill1, geo.tabs[0], geo.tabs[1]) : monitorPillPose(f, CUE.pill2, geo.tabs[1], geo.tabs[2]);
  const pillX = pill.x, pillW = pill.width;

  // ---- pointer (same clock as the sound cues)
  const D1: Point = [1180, 560], C0: Point = [1460, 700], D2: Point = [1500, 640];
  const cm1 = clickMotion(f, CUE.click1, C0, centre(1), 100, 6, 3, 8);
  const cm2 = clickMotion(f, CUE.click2, D1, centre(2), 192, 6, 3, 8);
  let cur: {x: number; y: number; press: number};
  if (f < 146) cur = cm1;
  else if (f < 192) { const t = easeInOutQuintic(beat(f, 146, 42)); cur = {x: mix(centre(1)[0], D1[0], t), y: mix(centre(1)[1], D1[1], t), press: 0}; }
  else if (f < 240) cur = cm2;
  else { const t = easeInOutQuintic(beat(f, 240, 40)); cur = {x: mix(centre(2)[0], D2[0], t), y: mix(centre(2)[1], D2[1], t), press: 0}; }
  const curO = Math.min(beat(f, 40, 10), 1 - beat(f, 302, 14));
  const press = (i: number) => (i === 1 ? cm1 : i === 2 ? cm2 : {buttonScale: 1, buttonY: 0, press: 0});

  // ---- layers
  const scrollY = SCROLL_MAX * eased(f, CUE.scroll);
  const vis = [
    1 - beat(f, CUE.click1 + 4, 16),
    Math.min(beat(f, CUE.rodIn, 14), 1 - beat(f, CUE.rodOut, 14)),
    beat(f, CUE.skIn, 14),
  ];
  const inAt = [0, CUE.rodIn, CUE.skIn];
  const rowEnter = (tab: number, i: number) => (tab === 0 ? {o: 1, dy: 0} : {o: easeOut(beat(f, inAt[tab] + i * 4, 16)), dy: 26 * (1 - easeOut(beat(f, inAt[tab] + i * 4, 16)))});
  const uiO = Math.min(beat(f, CUE.uiIn.start, CUE.uiIn.end - CUE.uiIn.start), 1 - beat(f, CUE.uiOut.start, CUE.uiOut.end - CUE.uiOut.start));

  // ---- brand icon: the single mark instance, header -> lockup
  const dock = f < CUE.dock.start ? brandDockPose(f, CUE.open, LOCK_DOCK, HEADER_DOCK) : brandDockPose(f, CUE.dock, HEADER_DOCK, LOCK_DOCK);

  const stripIcons = (tab: number) => LISTS[tab].slice(0, 3);
  const avX = 96 + 36 + geo.labelW + 40;

  const header = (
    <g>
      <rect x={0} y={0} width={W} height={RAIL} fill={SCREEN.background} />
      <g opacity={uiO}>
        {/* tabs */}
        {geo.tabs.map((t, i) => {
          const p = press(i);
          return (
            <g key={t.label} transform={`translate(${t.x + t.width / 2} ${tabY + tabH / 2 + p.buttonY}) scale(${p.buttonScale}) translate(${-t.x - t.width / 2} ${-tabY - tabH / 2})`}>
              <CardInset x={t.x} y={tabY} width={t.width} height={tabH} radius={tabH / 2} state="raised" />
            </g>
          );
        })}
        {(() => {
          const p = press(f < 188 ? 1 : 2);
          return (
            <g transform={`translate(${pillX + pillW / 2} ${tabY + tabH / 2 + p.buttonY}) scale(${p.buttonScale}) translate(${-pillX - pillW / 2} ${-tabY - tabH / 2})`} style={{filter: "drop-shadow(0 0 16px rgba(90,108,255,.55))"}}>
              <rect x={pillX} y={tabY} width={pillW} height={tabH} rx={tabH / 2} fill="#2433b8" />
              <rect x={pillX} y={tabY} width={pillW} height={tabH} rx={tabH / 2} fill="none" stroke="#8d99ff" strokeWidth={2} />
              <rect x={pillX + 14} y={tabY + 3} width={pillW - 28} height={tabH / 2 - 6} rx={(tabH / 2 - 6) / 2} fill="#fff" opacity={0.09} />
            </g>
          );
        })()}
        {geo.tabs.map((t, i) => {
          const p = press(i);
          const near = clamp(1 - Math.abs(pillX + pillW / 2 - (t.x + t.width / 2)) / (t.width / 2 + 20));
          return <text key={t.label} x={t.x + t.width / 2} y={tabY + tabH / 2 + p.buttonY + 12} textAnchor="middle" fontFamily={FAM.b} fontWeight={800} fontSize={34} fill={near > 0.5 ? "#FFFFFF" : SCREEN.text}>{t.label}</text>;
        })}
        {/* summary strip */}
        <g>
          <rect x={96} y={152} width={1728} height={84} rx={22} fill="#1A2234" />
          <rect x={96.5} y={152.5} width={1727} height={83} rx={21.5} fill="none" stroke="#8d99ff" strokeOpacity={0.35} />
          <text x={132} y={205} fontFamily={FAM.h} fontWeight={700} fontSize={30} fill={SCREEN.text}>{STRIP_TITLE}</text>
          {LISTS.map((_, tab) => (
            <g key={tab} opacity={vis[tab]}>
              {stripIcons(tab).map((t, k) => (
                <g key={k}>
                  <circle cx={avX + 26 + k * 44} cy={194} r={27} fill="#1A2234" />
                  <circle cx={avX + 26 + k * 44} cy={194} r={24} fill={SCREEN.inset} stroke={ACCENT[k % 4]} strokeOpacity={0.7} />
                  <Icon name={t.icon} x={avX + 26 + k * 44 - 13} y={181} size={26} color={ACCENT[k % 4]} sw={2} />
                </g>
              ))}
            </g>
          ))}
          <text x={1824 - 36} y={204} textAnchor="end" fontFamily={FAM.b} fontWeight={600} fontSize={30} fill={SCREEN.muted}>{STRIP_HINT}</text>
        </g>
      </g>
    </g>
  );

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
      <defs>
        <linearGradient id="bodyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SCREEN.background} stopOpacity="0" />
          <stop offset="1" stopColor={SCREEN.background} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g opacity={uiO}>
        <MonitorViewport x={0} y={0} width={W} height={BODY_BOTTOM} railHeight={RAIL} scrollY={scrollY} header={<g />}>
          {LISTS.map((list, tab) => vis[tab] > 0.001 && (
            <g key={tab} opacity={vis[tab]} transform={`translate(0 ${tab === 0 ? 0 : scrollY})`}>
              {list.map((tool, i) => { const e = rowEnter(tab, i); return <Row key={tool.title} tool={tool} i={i} y={12 + i * ROW_S} o={tab === 0 ? 1 : e.o} dy={tab === 0 ? 0 : e.dy} />; })}
            </g>
          ))}
        </MonitorViewport>
        <rect x={0} y={972} width={W} height={H - 972} fill="url(#bodyFade)" />
        <rect x={0} y={BODY_BOTTOM} width={W} height={H - BODY_BOTTOM} fill={SCREEN.background} />
      </g>
      {header}
      {/* wordmark (parts 5..) appears at its destination while the mark docks */}
      <g transform={`translate(${LOCK_X} ${LOCK_Y}) scale(${LOCK_S}) translate(${-LOGO_O[0]} ${-LOGO_O[1]})`}>
        {LOGO_PARTS.slice(5).map((p, j) => {
          const t = f < CUE.wordIn ? 1 - beat(f, CUE.wordOut.start + j * 0.8, 12) : easeOut(beat(f, CUE.wordIn + j * 1.4, 12));
          if (t <= 0) return null;
          return <g key={j} opacity={t} transform={`translate(${p.cx} ${p.cy + 10 * (1 - t)}) scale(${0.8 + 0.2 * t}) translate(${-p.cx} ${-p.cy})`} dangerouslySetInnerHTML={{__html: p.svg}} />;
        })}
      </g>
      {/* the single brand mark */}
      <g transform={`translate(${dock.x} ${dock.y}) scale(${dock.scale}) translate(${-MARK_ANCHOR[0]} ${-MARK_ANCHOR[1]})`}>
        {LOGO_PARTS.slice(0, 5).map((p, j) => <g key={j} dangerouslySetInnerHTML={{__html: p.svg}} />)}
      </g>
      {/* target URL */}
      {(() => { const t = easeOut(beat(f, CUE.urlIn, 16)); return t > 0 && (
        <text x={W / 2} y={LOCK_Y + 106.8 * LOCK_S + 112 + 12 * (1 - t)} textAnchor="middle" opacity={t} fontFamily={FAM.b} fontWeight={800} fontSize={60} letterSpacing={1} fill={SCREEN.text}>{URL_TEXT}</text>
      ); })()}
      {/* pointer + click highlight (same clock as sound) */}
      {[CUE.click1, CUE.click2].map((c, k) => { const t = beat(f, c, 16); const [px, py] = centre(k + 1); return t > 0 && t < 1 && <circle key={k} cx={px} cy={py} r={26 + 56 * easeOut(t)} fill="none" stroke={SCREEN.lift} strokeWidth={4 * (1 - t)} opacity={1 - t} />; })}
      {curO > 0 && (
        <g transform={`translate(${cur.x} ${cur.y}) scale(${1 - 0.1 * cur.press})`} opacity={curO} style={{filter: "drop-shadow(0 4px 6px rgba(0,0,0,.55))"}}>
          <path d="M0 0 L0 38 L10 29 L17 44 L25 40 L18 26 L31 26 Z" fill={SCREEN.text} stroke="#06090880" strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};
