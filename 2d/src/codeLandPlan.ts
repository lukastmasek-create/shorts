// Landscape (1920x1080, 30 fps) showcase of ucimesehrou.org/code. One timeline, in output frames, for camera, picture, lint and sound.
// Pure data + math (no DOM): the compositions in CodeLand.tsx, 2d/codeland/lint.mjs and the sound builder all read this file.
import { createCameraTrack, typeState, type CameraKey, type CardRect, type Span } from "./studioMotion";

export const FPS = 30;
export const SAFE = { x0: 96, x1: 1824, y0: 64, y1: 984 };
export const FADE_IN = 8, FADE_OUT = 18;                       // engine film mode: black in over 8 f, black out over the last 17 f (budgeted below)
export const SEED = 20261116;
export const graphemes = (s: string) => Array.from(new Intl.Segmenter("cs", { granularity: "grapheme" }).segment(s)).length;
export const readFrames = (g: number, min = 42) => Math.max(min, Math.ceil((g * 30) / 14));   // reading budget: >= 14 graphemes / s
export const typeFrames = (g: number) => Math.ceil((g * 30) / 14);                            // typing budget: <= 14 characters / s

export type Font = "Pangolin" | "Unbounded" | "Onest" | "mono";
export type Role = "hero" | "headline" | "body" | "label" | "code" | "cta" | "url";
export type Item = {
  id: string; scene: string; role: Role; text: string; font: Font; weight: number; size: number; anchor: "start" | "middle";
  x: number; y: number; space: "world" | "screen"; complete: number; leave: number; hold: number; fg: string; bg: string;
};
export type Ev = { f: number; kind: string; gain: number; pan?: number; id: string };

// ---- real data, counted with a node script from umime-skola (src/lib/code-exercises.ts, code-lessons.ts) ----
export const SITE = { exercises: 43, doplni: 39, projekty: 4, files: ["index.html", "style.css", "script.js"], lessonLines: [32, 12, 16], url: "ucimesehrou.org/code" };

// ---- palette (kept in sync with Code.tsx / studioMotion STUDIO) ----
export const COL = { cream: "#F6F1E4", ink: "#191D2E", cyan: "#6EE7FF", yellow: "#FFC933", yellowText: "#FFE08A", blue: "#3248F0", blueDeep: "#2433B8", green: "#168451", greenL: "#3DDC97", coral: "#FF5A3C", panel: "#0F0D24", navy: "#1C1936", edge: "#6A63AD", charcoalLit: "#3B414B" };

// ---- geometry shared by picture and lint ----
export const TITLE: CardRect = { x: 270, y: 190, width: 1380, height: 700 };
export const EX: CardRect = { x: 210, y: 260, width: 1500, height: 560 };
export const RES: CardRect = { x: 360, y: 250, width: 1200, height: 580 };
export const KC: CardRect = { x: 860, y: 290, width: 964, height: 440 };       // code card (video 2)
export const XC: CardRect = { x: 96, y: 290, width: 700, height: 440 };        // explanation card (video 2)
export const CH = 31.2;                                                         // JetBrains Mono advance at 52 px
export const LY = {
  logoCy: 250, logoScale: 1.1, hero: 520,
  label: { x: 40, y: 131 }, btn: { x: 940, y: 84, w: 520, h: 64 }, panel: { x: 40, y: 190, w: 1420, h: 330 },
  codeX: 88, codeBase: [290, 360, 430],
  resHead: { x: 128, y: 168 }, resSub: { x: 128, y: 246 }, resStat: { x: 40, y: 446 }, resTrophy: { x: 40, y: 112 },
  kBase: [158, 228, 298, 368], kX: 88, kSpark: 872, kLineH: 70,
  xChip: { x: 148, y: 114, h: 72 }, xTitle: { x: 40, y: 292 },
};
export const HOME = { x: 960, y: 540, zoom: 1 };

type Scene = { id: string; start: number; end: number };
type Plan = {
  id: string; name: string; frames: number; scenes: Scene[]; items: Item[]; events: Ev[]; camera: CameraKey[];
  cues: Record<string, any>; typing?: { text: string; span: Span; keyFrames: number[]; budget: number };
  features: { id: string; hero: boolean; actionStart: number; resultStart: number; resultEnd: number }[];
  flights: { start: number; end: number; blurFrames: number }[]; sample: { x: number; y: number }[];
  coverage: string[]; invented: string[]; skipped: string[];
};

const camTrack = (keys: CameraKey[]) => createCameraTrack(keys);

// =====================================================================================================================
// VIDEO 1 — Cvičení: doplň, zkontroluj, splněno (hero = the check)
// =====================================================================================================================
const v1 = () => {
  const intro = { logo: { start: 0, end: 58 } as Span, hero: { start: 34, end: 46 } as Span, heroStagger: 3 };
  const heroDone = intro.hero.end + 2 * intro.heroStagger;                   // 52: last word settled
  const t1: Span = { start: 90, end: 114 };                                  // title card -> exercise card (one shared shell)
  const click1 = 134, click2 = 188, pressIn = 3, release = 6;
  const type: Span = { start: 138, end: 152 };
  const t2: Span = { start: 198, end: 224 };                                 // exercise card -> cream result card
  const res = 224;
  const statSpan: Span = { start: 230, end: 242 };
  const mark = { pulse: { start: res, end: res + 20 }, check: { start: res + 2, end: res + 16 }, lap: 30 };
  const resHold = readFrames(graphemes("Jupí, splněno! Můžeš jít na další."));   // 73
  const exit: Span = { start: res + resHold, end: res + resHold + 22 };
  const logoEnd: Span = { start: exit.start + 15, end: exit.start + 39 };
  const urlEnter: Span = { start: exit.start + 33, end: exit.start + 45 };
  const urlDone = urlEnter.end;
  const urlHold = 60;
  const frames = urlDone + urlHold + FADE_OUT;
  const cursor = {
    appear: 112, start: [1500, 790] as const, blank: [0, 0] as [number, number], button: [0, 0] as [number, number],
    click1, click2, approach1: 116, approach2: 160, lead: 4, pressIn, release, exit: { start: 197, end: 207 } as Span,
  };
  const blankLocal: [number, number] = [LY.codeX + CH + (3 * CH) / 2, LY.codeBase[0] - 18];
  const btnLocal: [number, number] = [LY.btn.x + LY.btn.w / 2, LY.btn.y + LY.btn.h / 2];
  cursor.blank = [EX.x + blankLocal[0], EX.y + blankLocal[1]];
  cursor.button = [EX.x + btnLocal[0], EX.y + btnLocal[1]];
  const ts = typeState(type.end, type, ":hover", "cs", 16);
  const keyFrames = ts.keyFrames;
  const camera: CameraKey[] = [
    { frame: 0, x: 960, y: 540, zoom: 1.08 }, { frame: 52, x: 960, y: 540, zoom: 1 }, { frame: t2.start, x: 960, y: 540, zoom: 1 },
    { frame: t2.start + 20, x: 960, y: 548, zoom: 1.04 }, { frame: exit.end, x: 960, y: 548, zoom: 1.04 },
  ];
  const ex = (lx: number, ly: number) => [EX.x + lx, EX.y + ly] as const;
  const rs = (lx: number, ly: number) => [RES.x + lx, RES.y + ly] as const;
  const mk = (p: Partial<Item> & Pick<Item, "id" | "scene" | "role" | "text" | "font" | "weight" | "size" | "anchor" | "x" | "y" | "space" | "complete" | "leave" | "fg" | "bg">): Item =>
    ({ hold: readFrames(graphemes(p.text)), ...p }) as Item;
  const items: Item[] = [
    mk({ id: "hero", scene: "intro", role: "hero", text: "Kód na hraní", font: "Pangolin", weight: 400, size: 160, anchor: "middle", x: TITLE.x + TITLE.width / 2, y: TITLE.y + LY.hero, space: "world", complete: heroDone, leave: t1.start, fg: COL.cyan, bg: "#292541", hold: Math.max(36, readFrames(graphemes("Kód na hraní"), 36)) }),
    mk({ id: "ex-label", scene: "feature", role: "label", text: "Doplň stav při najetí", font: "Unbounded", weight: 700, size: 44, anchor: "start", x: ex(LY.label.x, LY.label.y)[0], y: ex(LY.label.x, LY.label.y)[1], space: "world", complete: t1.end, leave: t2.start, fg: COL.cream, bg: "#292541" }),
    mk({ id: "ex-button", scene: "feature", role: "cta", text: "Zkontrolovat", font: "Unbounded", weight: 700, size: 44, anchor: "middle", x: ex(LY.btn.x + LY.btn.w / 2, 0)[0], y: ex(0, LY.btn.y + 47)[1], space: "world", complete: t1.end, leave: t2.start, fg: COL.cream, bg: COL.blueDeep }),
    mk({ id: "code-1", scene: "feature", role: "code", text: "a:hover {", font: "mono", weight: 600, size: 52, anchor: "start", x: ex(LY.codeX, 0)[0], y: ex(0, LY.codeBase[0])[1], space: "world", complete: type.end, leave: t2.start, fg: COL.cream, bg: COL.panel }),
    mk({ id: "code-2", scene: "feature", role: "code", text: "  color: #3248f0;", font: "mono", weight: 600, size: 52, anchor: "start", x: ex(LY.codeX, 0)[0], y: ex(0, LY.codeBase[1])[1], space: "world", complete: t1.end, leave: t2.start, fg: COL.cream, bg: COL.panel }),
    mk({ id: "code-3", scene: "feature", role: "code", text: "}", font: "mono", weight: 600, size: 52, anchor: "start", x: ex(LY.codeX, 0)[0], y: ex(0, LY.codeBase[2])[1], space: "world", complete: t1.end, leave: t2.start, fg: COL.cream, bg: COL.panel }),
    mk({ id: "result-1a", scene: "feature", role: "body", text: "Jupí, splněno!", font: "Onest", weight: 800, size: 52, anchor: "start", x: rs(LY.resHead.x, 0)[0], y: rs(0, LY.resHead.y)[1], space: "world", complete: res, leave: exit.start, fg: COL.ink, bg: COL.cream, hold: resHold }),
    mk({ id: "result-1b", scene: "feature", role: "body", text: "Můžeš jít na další.", font: "Onest", weight: 600, size: 52, anchor: "start", x: rs(LY.resSub.x, 0)[0], y: rs(0, LY.resSub.y)[1], space: "world", complete: res, leave: exit.start, fg: COL.ink, bg: COL.cream, hold: resHold }),
    mk({ id: "result-stat", scene: "feature", role: "label", text: "Splněno 1 z 43", font: "Unbounded", weight: 700, size: 44, anchor: "start", x: rs(LY.resStat.x, 0)[0], y: rs(0, LY.resStat.y)[1], space: "world", complete: statSpan.end + 1, leave: exit.start, fg: COL.ink, bg: COL.cream }),
    mk({ id: "url", scene: "end", role: "url", text: SITE.url, font: "Onest", weight: 800, size: 52, anchor: "middle", x: 960, y: 700, space: "screen", complete: urlDone, leave: urlDone + urlHold, fg: COL.cream, bg: COL.charcoalLit, hold: readFrames(graphemes(SITE.url)) }),
  ];
  const events: Ev[] = [
    { f: 1, kind: "whoosh", gain: 0.42, pan: -0.2, id: "logo-in" },
    { f: 30, kind: "tok", gain: 0.34, pan: 0.1, id: "logo-face" },
    { f: 40, kind: "cloth", gain: 0.28, pan: 0.25, id: "logo-pop" },
    { f: t1.start, kind: "cloth", gain: 0.5, pan: -0.2, id: "card-morph-1" },
    { f: t1.end - 1, kind: "tok", gain: 0.4, pan: 0, id: "card-lands-1" },
    { f: click1, kind: "click", gain: 0.42, pan: 0.1, id: "click-blank" },
    ...keyFrames.map((f, i) => ({ f, kind: "key", gain: 0.34 + 0.04 * (i % 3), pan: -0.1 + 0.05 * i, id: `key-${i}` })),
    { f: click2, kind: "click", gain: 0.46, pan: 0.2, id: "click-check" },
    { f: t2.start, kind: "cloth", gain: 0.5, pan: 0.1, id: "card-morph-2" },
    { f: res, kind: "impact", gain: 1.0, pan: 0, id: "HERO-result" },
    { f: res + 1, kind: "tok", gain: 0.34, pan: 0.15, id: "result-tok" },
    { f: mark.check.start + 10, kind: "tok", gain: 0.3, pan: 0.25, id: "check-tick" },
    { f: exit.start, kind: "whoosh", gain: 0.3, pan: 0.2, id: "card-exit" },
    { f: logoEnd.start + 12, kind: "tok", gain: 0.36, pan: 0, id: "end-logo-face" },
    { f: logoEnd.end, kind: "cloth", gain: 0.28, pan: -0.1, id: "end-logo-settle" },
    { f: urlEnter.start + 2, kind: "tok", gain: 0.3, pan: 0.1, id: "end-url" },
  ];
  const cues = { intro, t1, t2, res, type, mark, statSpan, exit, logoEnd, urlEnter, urlDone, urlHold, cursor, pressIn, release, heroDone, click1, click2 };
  const typing = { text: ":hover", span: type, keyFrames, budget: typeFrames(6) };
  const scenes: Scene[] = [{ id: "intro", start: 0, end: t1.start }, { id: "feature", start: t1.start, end: exit.end }, { id: "end", start: exit.end, end: frames }];
  return {
    id: "KodLandDil1", name: "kod-01", frames, scenes, items, events, camera, cues, typing,
    features: [{ id: "cviceni-zkontrolovat", hero: true, actionStart: click2, resultStart: res, resultEnd: exit.start }],
    flights: [], sample: [{ x: 960, y: 540 }, { x: EX.x + 100, y: EX.y + 100 }],
    coverage: ["Cvičení „Doplň stav při najetí“: doplnění místa v kódu, tlačítko Zkontrolovat, zpráva „Jupí, splněno! Můžeš jít na další.“, počet Splněno 1 z 43"],
    invented: ["Doplněné slovo „:hover“ je řešení cvičení doplni-css-hover, ale psaní a kliknutí jsou nasazené. Počítadlo 1 z 43 ukazuje stav po prvním splněném cvičení (skutečný stavový řádek webu)."],
    skipped: ["Neúspěšná kontrola (seznam chybějících bodů) – kvůli limitu 15 s; Nápověda / Řešení; Doplň ostatních 42 cvičení"],
  } as Plan;
};

// =====================================================================================================================
// VIDEO 2 — Řádek po řádku: klikni na řádek s jiskrou, vysvětlení se změní (hero = the second click)
// =====================================================================================================================
const v2 = () => {
  const intro = { logo: { start: 0, end: 58 } as Span, hero: { start: 34, end: 46 } as Span, heroStagger: 3 };
  const heroDone = intro.hero.end + 2 * intro.heroStagger;
  const t1: Span = { start: 90, end: 114 };                                  // title card -> code card
  const xIn: Span = { start: 96, end: 118 };                                 // explanation card arrives
  const click1 = 160, click2 = 220, pressIn = 3, release = 6;
  const s0Exit: Span = { start: 161, end: 169 };
  const s1: Span = { start: 164, end: 176 }, s1Exit: Span = { start: 221, end: 229 };
  const s2: Span = { start: 224, end: 236 };
  const bar1: Span = { start: 162, end: 174 }, bar2: Span = { start: 222, end: 234 };
  const res = s2.end + 1;                                                    // 237: second explanation settled
  const mark = { pulse: { start: res, end: res + 20 }, check: { start: res + 2, end: res + 16 }, lap: 30 };
  const resHold = 60;
  const exit: Span = { start: res + resHold, end: res + resHold + 22 };
  const logoEnd: Span = { start: exit.start + 15, end: exit.start + 39 };
  const urlEnter: Span = { start: exit.start + 33, end: exit.start + 45 };
  const urlDone = urlEnter.end, urlHold = 60;
  const frames = urlDone + urlHold + FADE_OUT;
  const sparkLocal = (i: number): [number, number] => [LY.kSpark + 28, LY.kBase[i] - 18];
  const cursor = {
    appear: 112, start: [1500, 790] as const, p1: [KC.x + sparkLocal(0)[0], KC.y + sparkLocal(0)[1]] as [number, number],
    p2: [KC.x + sparkLocal(1)[0], KC.y + sparkLocal(1)[1]] as [number, number],
    click1, click2, approach1: 134, approach2: 204, lead: 4, lead2: 3, pressIn, release, exit: { start: 231, end: 243 } as Span,
  };
  const camera: CameraKey[] = [
    { frame: 0, x: 960, y: 540, zoom: 1.08 }, { frame: 52, x: 960, y: 540, zoom: 1 }, { frame: s2.start, x: 960, y: 540, zoom: 1 },
    { frame: res + 4, x: 960, y: 546, zoom: 1.03 }, { frame: exit.end, x: 960, y: 546, zoom: 1.03 },
  ];
  const kx = (lx: number, ly: number) => [KC.x + lx, KC.y + ly] as const;
  const xx = (lx: number, ly: number) => [XC.x + lx, XC.y + ly] as const;
  const mk = (p: Partial<Item> & Pick<Item, "id" | "scene" | "role" | "text" | "font" | "weight" | "size" | "anchor" | "x" | "y" | "space" | "complete" | "leave" | "fg" | "bg">): Item =>
    ({ hold: readFrames(graphemes(p.text)), ...p }) as Item;
  const codeLines = ["<header>", "  <h1>Učíme se hrou</h1>", "</header>", "<main>"];
  const items: Item[] = [
    mk({ id: "hero", scene: "intro", role: "hero", text: "Řádek po řádku", font: "Pangolin", weight: 400, size: 160, anchor: "middle", x: TITLE.x + TITLE.width / 2, y: TITLE.y + LY.hero, space: "world", complete: heroDone, leave: t1.start, fg: COL.cyan, bg: "#292541", hold: Math.max(36, readFrames(graphemes("Řádek po řádku"), 36)) }),
    ...codeLines.map((t, i) => mk({ id: `code-${i + 1}`, scene: "feature", role: "code", text: t, font: "mono", weight: 600, size: 52, anchor: "start", x: kx(LY.kX, 0)[0], y: kx(0, LY.kBase[i])[1], space: "world", complete: t1.end, leave: exit.start, fg: "#8FD0FF", bg: "#17152D" })),
    mk({ id: "x0-title", scene: "feature", role: "body", text: "Vyber řádek", font: "Onest", weight: 800, size: 52, anchor: "start", x: xx(LY.xTitle.x, 0)[0], y: xx(0, LY.xTitle.y)[1], space: "world", complete: xIn.end, leave: s0Exit.start, fg: COL.cream, bg: "#292541" }),
    mk({ id: "x1-chip", scene: "feature", role: "code", text: "<header>", font: "mono", weight: 800, size: 52, anchor: "start", x: xx(LY.xChip.x + 28, 0)[0], y: xx(0, LY.xChip.y + 55)[1], space: "world", complete: s1.end + 1, leave: s1Exit.start, fg: COL.yellow, bg: "#201A36" }),
    mk({ id: "x1-title", scene: "feature", role: "body", text: "Horní část stránky", font: "Onest", weight: 800, size: 52, anchor: "start", x: xx(LY.xTitle.x, 0)[0], y: xx(0, LY.xTitle.y)[1], space: "world", complete: s1.end + 1, leave: s1Exit.start, fg: COL.cream, bg: "#292541" }),
    mk({ id: "x2-chip", scene: "feature", role: "code", text: "<h1>", font: "mono", weight: 800, size: 52, anchor: "start", x: xx(LY.xChip.x + 28, 0)[0], y: xx(0, LY.xChip.y + 55)[1], space: "world", complete: res, leave: exit.start, fg: COL.yellow, bg: "#201A36" }),
    mk({ id: "x2-title", scene: "feature", role: "body", text: "Hlavní nadpis", font: "Onest", weight: 800, size: 52, anchor: "start", x: xx(LY.xTitle.x, 0)[0], y: xx(0, LY.xTitle.y)[1], space: "world", complete: res, leave: exit.start, fg: COL.cream, bg: "#292541" }),
    mk({ id: "url", scene: "end", role: "url", text: SITE.url, font: "Onest", weight: 800, size: 52, anchor: "middle", x: 960, y: 700, space: "screen", complete: urlDone, leave: urlDone + urlHold, fg: COL.cream, bg: COL.charcoalLit, hold: readFrames(graphemes(SITE.url)) }),
  ];
  const events: Ev[] = [
    { f: 1, kind: "whoosh", gain: 0.42, pan: -0.2, id: "logo-in" },
    { f: 30, kind: "tok", gain: 0.34, pan: 0.1, id: "logo-face" },
    { f: 40, kind: "cloth", gain: 0.28, pan: 0.25, id: "logo-pop" },
    { f: t1.start, kind: "cloth", gain: 0.5, pan: 0.1, id: "card-morph" },
    { f: xIn.start + 4, kind: "cloth", gain: 0.42, pan: -0.35, id: "explain-card-in" },
    { f: xIn.end - 1, kind: "tok", gain: 0.36, pan: -0.3, id: "explain-card-lands" },
    { f: t1.end - 1, kind: "tok", gain: 0.32, pan: 0.3, id: "code-card-lands" },
    { f: click1, kind: "click", gain: 0.42, pan: 0.2, id: "click-line-1" },
    { f: bar1.start + 4, kind: "tok", gain: 0.34, pan: -0.2, id: "explain-1" },
    { f: click2, kind: "click", gain: 0.46, pan: 0.25, id: "click-line-2" },
    { f: res, kind: "impact", gain: 1.0, pan: 0, id: "HERO-result" },
    { f: s2.start + 2, kind: "tok", gain: 0.36, pan: -0.2, id: "explain-2" },
    { f: mark.check.start + 10, kind: "tok", gain: 0.3, pan: -0.3, id: "check-tick" },
    { f: exit.start, kind: "whoosh", gain: 0.3, pan: 0.2, id: "cards-exit" },
    { f: logoEnd.start + 12, kind: "tok", gain: 0.36, pan: 0, id: "end-logo-face" },
    { f: logoEnd.end, kind: "cloth", gain: 0.28, pan: -0.1, id: "end-logo-settle" },
    { f: urlEnter.start + 2, kind: "tok", gain: 0.3, pan: 0.1, id: "end-url" },
  ];
  const cues = { intro, t1, xIn, s0Exit, s1, s1Exit, s2, bar1, bar2, res, mark, exit, logoEnd, urlEnter, urlDone, urlHold, cursor, pressIn, release, heroDone, click1, click2, codeLines, sparkLocal };
  const scenes: Scene[] = [{ id: "intro", start: 0, end: t1.start }, { id: "feature", start: t1.start, end: exit.end }, { id: "end", start: exit.end, end: frames }];
  return {
    id: "KodLandDil2", name: "kod-02", frames, scenes, items, events, camera, cues,
    features: [{ id: "radek-po-radku", hero: true, actionStart: click2, resultStart: res, resultEnd: exit.start }],
    flights: [], sample: [{ x: 960, y: 540 }, { x: KC.x + 100, y: KC.y + 100 }, { x: XC.x + 100, y: XC.y + 100 }],
    coverage: ["Klikni na řádek s jiskrou: <header> a <h1> z index.html, vysvětlení „Horní část stránky“ a „Hlavní nadpis“, příkaz v nadpisu vysvětlení"],
    invented: ["Výřez čtyř řádků index.html je zkrácen o odsazení (řádky 9–12 souboru, skutečné texty); text vysvětlení pod nadpisem je vynechán, protože by byl pod 44 px."],
    skipped: ["Tlačítko Přehrát, přepínání souborů style.css / script.js, AI pomocník (odpověď přichází z API a nejde ji ověřit ze zdrojáků), Učební plán (9 kroků), Volný editor a Čistý list"],
  } as Plan;
};

export const PLANS = { kod1: v1(), kod2: v2() };
export const cameraOf = (p: Plan) => camTrack(p.camera);
export type { Plan, Scene };
