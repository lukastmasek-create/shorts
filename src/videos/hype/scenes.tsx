// One component per shot (ids match shots.json). `f` is the local frame inside the shot's Sequence.
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { BurstLines, C, Chip, Cube3D, Dark, EchoStack, Extrude, Flat, HEAVY, Laser, MONO, SERIF, Scene3D, Stairs3D, Word, W, H, clamp01, pop, shake } from "./kit";

type P = { dur: number };
const abs = (s: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...s });

export const Burst: React.FC<P> = () => {
  const f = useCurrentFrame();
  const dot = interpolate(f, [0, 14, 20, 44], [0, 26, 18, 600], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const t = clamp01((f - 14) / 30);
  return (
    <Dark glow={0.15} dots={false}>
      <Scene3D bokeh={0}>{f > 14 ? <BurstLines t={t} /> : null}</Scene3D>
      <div style={abs({ left: W / 2 - dot / 2, top: H / 2 - dot / 2, width: dot, height: dot, borderRadius: "50%", background: C.red, boxShadow: `0 0 ${60 + dot}px ${C.red}`, opacity: f > 36 ? 0 : 1 })} />
    </Dark>
  );
};

export const Uceni: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  const q = pop(f, 8, 9, 200);
  return (
    <Flat color={C.paper}>
      <Word text="UČENÍ" f={f} color={C.ink} max={300} width={800} x={-150} dur={dur} />
      <div style={abs({ right: 10, top: H / 2 - 400, fontFamily: HEAVY, fontSize: 560, color: C.red, transform: `rotate(${10 * q}deg) scale(${q})`, lineHeight: 1 })}>?</div>
    </Flat>
  );
};

export const Nuda: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  const s = f < 10 ? shake(f, 22) : { x: 0, y: 0 };
  return (
    <Flat color={C.red}>
      <Word text="NUDA." f={f} color={C.ink} max={420} width={1060} x={s.x} y={s.y} dur={dur} />
    </Flat>
  );
};

export const Ne: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  const h1 = pop(f, 10), h2 = pop(f, 16);
  return (
    <Dark glow={0.7}>
      <Scene3D bokeh={70} seed={3} />
      <Word text="NE." f={f} color={C.paper} max={560} width={1000} glowc={C.red} dur={dur} />
      <div style={abs({ right: 60, top: 560, fontFamily: HEAVY, fontSize: 90, color: C.red, transform: `scale(${h1}) rotate(8deg)` })}>HA</div>
      <div style={abs({ left: 70, bottom: 560, fontFamily: HEAVY, fontSize: 90, color: C.red, transform: `scale(${h2}) rotate(-6deg)` })}>HA</div>
    </Dark>
  );
};

export const Znate: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Flat color={C.paper}>
      <Word text={"ZNÁTE\nTO."} f={f} color={C.ink} max={380} width={950} from="left" dur={dur} />
    </Flat>
  );
};

export const Sesit: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 12, 160);
  const x = clamp01((f - 34) / 16), x2 = clamp01((f - 44) / 14);
  const rows = ["7 × 8 = ____", "6 × 9 = ____", "12 × 4 = ____", "9 × 7 = ____"];
  const sh = f > 48 && f < 56 ? shake(f, 10) : { x: 0, y: 0 };
  return (
    <Dark glow={0.25}>
      <Word text="DOMÁCÍ ÚKOL" f={f} color={C.paper} max={150} width={960} y={-720} from="down" />
      <div style={abs({ left: 150, top: 330, width: 780, height: 1100, background: C.paper, borderRadius: 20, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${-4 * p}deg) scale(${p})`, boxShadow: "0 40px 90px rgba(0,0,0,.6)", padding: 60, filter: f > 56 ? "grayscale(1) brightness(.7)" : "none" })}>
        <div style={{ fontFamily: MONO, fontSize: 38, color: "#555", marginBottom: 20 }}>Cvičení 3 · násobilka</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, margin: "56px 0", opacity: pop(f, 6 + i * 4) }}>
            <div style={{ width: 54, height: 54, border: `6px solid ${C.ink}`, borderRadius: 8 }} />
            <div style={{ fontFamily: MONO, fontSize: 62, color: C.ink }}>{r}</div>
          </div>
        ))}
      </div>
      <svg width={W} height={H} style={abs({ left: 0, top: 0 })}>
        <g stroke={C.red} strokeWidth={26} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 18px ${C.red})` }}>
          <line x1={170} y1={350} x2={170 + 740 * x} y2={350 + 1060 * x} />
          <line x1={910} y1={350} x2={910 - 740 * x2} y2={350 + 1060 * x2} />
        </g>
      </svg>
    </Dark>
  );
};

export const Wall: React.FC<P> = () => {
  const f = useCurrentFrame();
  const words = ["BIFLOVÁNÍ.", "OPAKOVÁNÍ.", "ZNOVU.", "BIFLOVÁNÍ.", "OPAKOVÁNÍ.", "ZNOVU.", "BIFLOVÁNÍ.", "OPAKOVÁNÍ.", "ZNOVU.", "NUDA."];
  const n = Math.min(words.length, Math.floor(f / 4) + 1);
  const rowH = 138;
  return (
    <Dark glow={0.2} dots={false}>
      {words.slice(0, n).map((w, i) => {
        const last = i === n - 1;
        const age = n - 1 - i;
        return (
          <div key={i} style={abs({ left: 0, right: 0, top: H / 2 - rowH / 2 + (i - (n - 1) / 2) * rowH * 0.9 + (n - 1) * 0, textAlign: "center", fontFamily: HEAVY, fontSize: rowH, lineHeight: 1, color: last ? C.paper : "#6b6b78", opacity: Math.max(0.25, 1 - age * 0.08), transform: `scale(${last ? 1 + (1 - pop(f, i * 4)) * 0.35 : 1})` })}>{w}</div>
        );
      })}
    </Dark>
  );
};

export const Zeptate: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  const q1 = pop(f, 6, 8, 180), q2 = pop(f, 16, 8, 180), q3 = pop(f, 24, 8, 180);
  return (
    <Flat color={C.paper}>
      <Word text={"A NEŽ SE\nZEPTÁTE"} f={f} color={C.ink} max={240} width={900} y={-300} from="left" dur={dur} />
      <div style={abs({ right: -20, top: 600, fontFamily: HEAVY, fontSize: 1100, color: C.red, lineHeight: 1, transform: `scale(${q1}) rotate(${14 * q1}deg)` })}>?</div>
      <div style={abs({ left: 90, top: 1050, fontFamily: HEAVY, fontSize: 620, color: C.ink, lineHeight: 1, transform: `scale(${q2}) rotate(${-8 * q2}deg)` })}>?</div>
      <div style={abs({ left: 430, top: 1100, fontFamily: HEAVY, fontSize: 460, color: "transparent", WebkitTextStroke: `6px ${C.ink}`, lineHeight: 1, transform: `scale(${q3}) translateY(${Math.sin(f / 6) * 10}px)` })}>?</div>
    </Flat>
  );
};

export const Tohle: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <Dark glow={0.5}>
      <Scene3D bokeh={60} seed={5} speed={3} />
      <Extrude text={"TOHLE\nJE"} f={f} dur={24} size={420} />
    </Dark>
  );
};

export const Graph: React.FC<P> = () => {
  const f = useCurrentFrame();
  const cards = [
    { y: 540, label: "ŽÁK", sub: "ty, kdo jiný", bg: C.blue, fg: C.paper, at: 6 },
    { y: 1000, label: "HRA", sub: "farma · město · únikovky", bg: C.red, fg: C.ink, at: 18 },
    { y: 1460, label: "ZNALOSTI", sub: "vysvětlení ke každé odpovědi", bg: C.paper, fg: C.ink, at: 30 },
  ];
  const pills = [{ y: 770, t: "body", at: 28 }, { y: 1230, t: "XP + úrovně", at: 40 }];
  return (
    <Dark glow={0.45}>
      <Word text="UČENÍ + HRA" f={f} color={C.paper} max={140} width={900} y={-760} from="down" />
      <svg width={W} height={H} style={abs({ left: 0, top: 0 })}>
        {[0, 1].map((i) => {
          const a = cards[i].y + 120, b = cards[i + 1].y - 120;
          const draw = clamp01((f - 22 - i * 12) / 14);
          const pulse = ((f - 34 - i * 12) % 24) / 24;
          return (
            <g key={i}>
              <line x1={W / 2} y1={a} x2={W / 2} y2={a + (b - a) * draw} stroke={C.red} strokeWidth={8} style={{ filter: `drop-shadow(0 0 12px ${C.red})` }} />
              {f > 34 + i * 12 ? <circle cx={W / 2} cy={a + (b - a) * pulse} r={16} fill="#fff" style={{ filter: `drop-shadow(0 0 14px ${C.red})` }} /> : null}
            </g>
          );
        })}
      </svg>
      {cards.map((c, i) => {
        const p = pop(f, c.at);
        return (
          <div key={i} style={abs({ left: 190, top: c.y - 120, width: 700, height: 240, borderRadius: 36, background: c.bg, color: c.fg, textAlign: "center", transform: `scale(${p})`, boxShadow: c.bg === C.red ? `0 0 90px ${C.red}` : "0 30px 60px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", justifyContent: "center" })}>
            <div style={{ fontFamily: HEAVY, fontSize: 110, lineHeight: 1 }}>{c.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 30, marginTop: 14 }}>{c.sub}</div>
          </div>
        );
      })}
      {pills.map((p, i) => (
        <div key={i} style={abs({ left: W / 2 - 140, top: p.y - 28, width: 280, textAlign: "center", transform: `scale(${pop(f, p.at)})` })}><Chip size={34} bg={C.ink} color={C.red} style={{ border: `3px solid ${C.red}` }}>{p.t}</Chip></div>
      ))}
    </Dark>
  );
};

export const Logo: React.FC<P> = () => {
  const f = useCurrentFrame();
  const sweep = clamp01(f / 16);
  const p = pop(f, 12, 10, 200);
  const glow = 40 + 30 * Math.sin(f / 6);
  return (
    <Dark glow={0.75}>
      <Scene3D bokeh={110} seed={7} speed={2} />
      <Laser t={sweep} y={H / 2} />
      <div style={abs({ left: 70, top: H / 2 - 330, width: 940, height: 660, borderRadius: 330, background: C.red, border: "14px solid #fff", boxShadow: `0 0 ${glow}px ${C.red}, 0 0 ${glow * 3}px ${C.red}`, transform: `scale(${p}) skewX(${-6 * (1 - p)}deg)`, opacity: f >= 12 ? 1 : 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: HEAVY, color: C.paper, lineHeight: 0.95, fontSize: 168, whiteSpace: "nowrap", letterSpacing: "-0.02em", textShadow: "0 8px 0 rgba(0,0,0,.25)", fontStyle: "italic" })}>
        <div>UČÍME SE</div><div>HROU</div>
      </div>
      <div style={abs({ left: 0, right: 0, top: H / 2 + 420, textAlign: "center", transform: `scale(${pop(f, 40)})` })}><Chip size={56} bg={C.paper}>ucimesehrou.org</Chip></div>
    </Dark>
  );
};

export const Prompt: React.FC<P> = () => {
  const f = useCurrentFrame();
  const segs: { t: string; chip?: boolean }[] = [{ t: "Matematika · " }, { t: "7. třída", chip: true }, { t: " · " }, { t: "úroveň 3", chip: true }];
  const total = segs.reduce((a, s) => a + s.t.length, 0);
  const n = Math.min(total, Math.max(0, Math.floor((f - 18) / 1.6)));
  let left = n;
  const shown = segs.map((s) => { const k = Math.min(left, s.t.length); left -= k; return { ...s, t: s.t.slice(0, k) }; });
  const p = pop(f, 6, 12, 160);
  const done = n >= total;
  return (
    <Dark glow={0.35}>
      <Scene3D bokeh={50} seed={9} />
      <Word text={"VYBER SI\nKURZ."} f={f} color={C.paper} max={300} width={900} y={-480} from="up" />
      <div style={abs({ left: 70, top: 1000, width: 940, height: 420, borderRadius: 40, background: `linear-gradient(135deg, ${C.blue}, ${C.violet})`, border: "3px solid rgba(255,255,255,.5)", boxShadow: `0 0 ${done ? 90 : 50}px ${done ? C.red : C.blue}`, transform: `scale(${p})`, padding: 54 })}>
        <div style={{ fontFamily: MONO, fontSize: 56, color: "#fff", lineHeight: 1.5, minHeight: 260 }}>
          {shown.map((s, i) => s.chip ? <Chip key={i} size={56} style={{ boxDecorationBreak: "clone" }}>{s.t}</Chip> : <span key={i}>{s.t}</span>)}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1 }}>▌</span>
        </div>
        <div style={abs({ right: 40, bottom: 36, width: 110, height: 110, borderRadius: 28, background: C.red, color: C.ink, fontFamily: HEAVY, fontSize: 70, textAlign: "center", lineHeight: "110px", transform: `scale(${done ? 1 + 0.15 * Math.sin((f - 18 - total * 1.6) / 3) : 1})` })}>↵</div>
      </div>
    </Dark>
  );
};

export const Levels: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <Flat color={C.paper}>
      <Scene3D bokeh={0} z={22} camY={-1}><Stairs3D f={f} /></Scene3D>
      <Word text="5 ÚROVNÍ" f={f} color={C.ink} max={250} width={960} y={-680} />
      <div style={abs({ left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: MONO, fontSize: 46, color: C.ink, opacity: pop(f, 30) })}>od nejsnazší po nejtěžší</div>
    </Flat>
  );
};

export const Kurzy: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Flat color={C.red}>
      <Word text="OD 1. TŘÍDY" f={f} color={C.ink} max={260} width={1040} y={-250} from="stretch" dur={dur} />
      <Word text="PO MATURITU." f={f} start={14} color={C.paper} max={260} width={1040} y={250} from="stretch" dur={dur} />
    </Flat>
  );
};

export const Hry: React.FC<P> = () => {
  const f = useCurrentFrame();
  const words = ["FARMA.", "MĚSTO.", "ZÁKLADNA.", "MAZLÍČCI."];
  const i = Math.min(3, Math.floor(f / 15));
  return (
    <Dark glow={0.55}>
      <Scene3D bokeh={60} seed={11} speed={2}><Cube3D f={f} pos={[0, -4.6, 0]} size={3.2} wire /></Scene3D>
      <Word key={i} text={words[i]} f={f - i * 15} color={i % 2 ? C.red : C.paper} max={300} width={1040} y={-120} from={i % 2 ? "right" : "left"} glowc={C.red} />
      <div style={abs({ left: 0, right: 0, top: 360, textAlign: "center", fontFamily: MONO, fontSize: 44, color: C.paper, opacity: 0.8 })}>hry, které nikdy nekončí</div>
    </Dark>
  );
};

export const Unik: React.FC<P> = () => {
  const f = useCurrentFrame();
  const secs = Math.max(0, 59 - Math.floor(f * 0.55));
  const br = (s: React.CSSProperties) => abs({ width: 90, height: 90, borderColor: C.red, borderStyle: "solid", borderWidth: 0, ...s });
  const p = pop(f, 6);
  return (
    <Dark glow={0.3}>
      <Word text="ÚNIKOVKY" f={f} color={C.paper} max={210} width={980} y={-640} />
      <div style={br({ left: 80, top: 520, borderLeftWidth: 8, borderTopWidth: 8 })} />
      <div style={br({ right: 80, top: 520, borderRightWidth: 8, borderTopWidth: 8 })} />
      <div style={br({ left: 80, bottom: 380, borderLeftWidth: 8, borderBottomWidth: 8 })} />
      <div style={br({ right: 80, bottom: 380, borderRightWidth: 8, borderBottomWidth: 8 })} />
      <svg width={W} height={H} style={abs({ left: 0, top: 0 })}>
        <g transform={`translate(${W / 2} ${H / 2 + 40}) rotate(${f * 1.2}) scale(${p})`}>
          <circle r={250} fill={C.red} style={{ filter: `drop-shadow(0 0 60px ${C.red})` }} />
          <circle r={190} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={4} />
          {Array.from({ length: 60 }).map((_, i) => <line key={i} x1={0} y1={-300} x2={0} y2={i % 5 ? -318 : -340} stroke="#fff" strokeWidth={i % 5 ? 3 : 6} transform={`rotate(${i * 6})`} />)}
        </g>
      </svg>
      <div style={abs({ left: 0, right: 0, top: H / 2 - 30, textAlign: "center", fontFamily: MONO, fontSize: 130, color: C.paper })}>00:{String(secs).padStart(2, "0")}</div>
      <div style={abs({ left: 0, right: 0, bottom: 250, textAlign: "center", fontFamily: MONO, fontSize: 42, color: C.paper })}>uteč dřív, než dojde čas—</div>
    </Dark>
  );
};

export const Zebricky: React.FC<P> = () => {
  const f = useCurrentFrame();
  const rows = [
    { n: "KAMARÁD", w: 0.9, me: false }, { n: "5. A", w: 0.75, me: false }, { n: "TY", w: 1.0, me: true }, { n: "ŠKOLA", w: 0.6, me: false }, { n: "CELÁ ZEMĚ", w: 0.45, me: false },
  ];
  return (
    <Flat color={C.paper}>
      <Word text="ŽEBŘÍČKY" f={f} color={C.ink} max={230} width={980} y={-700} from="down" />
      {rows.map((r, i) => {
        const w = r.me ? interpolate(f, [4, 26, 38], [0.3, 0.7, 1], { extrapolateRight: "clamp" }) * 0.95 + 0.05 : r.w * clamp01(pop(f, 4 + i * 3));
        return (
          <div key={i} style={abs({ left: 70, top: 480 + i * 200, width: 940 })}>
            <div style={{ fontFamily: MONO, fontSize: 34, color: C.ink, marginBottom: 6 }}>{r.n}</div>
            <div style={{ width: 940 * w, height: 100, background: r.me ? C.red : C.ink, borderRadius: 14, boxShadow: r.me ? `0 0 40px ${C.red}` : "none" }} />
          </div>
        );
      })}
    </Flat>
  );
};

export const Vysvetl: React.FC<P> = () => {
  const f = useCurrentFrame();
  const sel = pop(f, 22, 14, 200);
  const cx = interpolate(f, [10, 30], [900, 250], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cy = interpolate(f, [10, 30], [1250, 1110], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0b1030" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.07) 2px, transparent 2px)", backgroundSize: "120px 120px" }} />
      <Word text={"KAŽDÁ\nODPOVĚĎ\nMÁ\nVYSVĚTLENÍ."} f={f} color={C.paper} max={220} width={1000} y={-120} from="left" />
      <div style={abs({ left: 70, top: 935, width: 940, height: 140, border: "4px solid #8fb4ff", opacity: sel, transform: `scaleX(${sel})`, transformOrigin: "left" })} />
      <svg width={40} height={40} viewBox="0 0 24 24" style={abs({ left: cx, top: cy })}><path d="M3 2l17 8-7 2-3 7z" fill="#fff" stroke="#000" strokeWidth={1.4} /></svg>
      <div style={abs({ left: 0, right: 0, bottom: 230, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 76, color: C.paper, opacity: pop(f, 34) })}>nejen správně, nebo špatně</div>
    </AbsoluteFill>
  );
};

const Starburst: React.FC<{ r: number; spikes?: number; fill: string }> = ({ r, spikes = 14, fill }) => {
  const pts = Array.from({ length: spikes * 2 }).map((_, i) => { const a = (i / (spikes * 2)) * Math.PI * 2; const rr = i % 2 ? r * 0.62 : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(" ");
  return <polygon points={pts} fill={fill} />;
};
export const Zdarma: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = pop(f, 2, 9, 170);
  const s = f < 14 ? shake(f, 14) : { x: 0, y: 0 };
  return (
    <Flat color={C.paper}>
      <svg width={W} height={H} style={abs({ left: 0, top: 0 })}>
        <g transform={`translate(${W / 2 + 120} ${H / 2 + 40}) rotate(${f * 1.5}) scale(${p})`}><Starburst r={820} fill={C.red} /></g>
      </svg>
      <Word text={"TO JE\nZDARMA?!"} f={f} start={4} color={C.ink} max={300} width={980} x={s.x} y={s.y} dur={dur} />
      <div style={abs({ left: 0, right: 0, bottom: 200, textAlign: "center", fontFamily: MONO, fontSize: 44, color: C.ink, opacity: pop(f, 30) })}>registrace je zdarma</div>
    </Flat>
  );
};

export const Reklam: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Flat color={C.red}>
      <Word text={"A BEZ\nREKLAM."} f={f} color={C.ink} max={400} width={1000} dur={dur} />
    </Flat>
  );
};

export const Chips: React.FC<P> = () => {
  const f = useCurrentFrame();
  const items = [
    { t: "ZŠ", s: "1.–9. třída", bg: C.paper, fg: C.ink }, { t: "SŠ", s: "střední školy", bg: C.red, fg: C.ink },
    { t: "PŘIJÍMAČKY", s: "příprava na přijímačky", bg: C.paper, fg: C.ink }, { t: "MATURITA", s: "příprava na maturitu", bg: C.red, fg: C.ink },
  ];
  return (
    <Dark glow={0.4}>
      <Scene3D bokeh={60} seed={13} />
      {items.map((it, i) => {
        const p = pop(f, 4 + i * 14, 10, 200);
        const dir = i % 2 ? 1 : -1;
        return (
          <div key={i} style={abs({ left: 90, top: 330 + i * 330, width: 900, height: 270, borderRadius: 135, background: it.bg, color: it.fg, transform: `translateX(${dir * (1 - clamp01(p)) * 1200}px) scale(${1})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: it.bg === C.red ? `0 0 70px ${C.red}` : "none" })}>
            <div style={{ fontFamily: HEAVY, fontSize: it.t.length > 4 ? 120 : 170, lineHeight: 1 }}>{it.t}</div>
            <div style={{ fontFamily: MONO, fontSize: 34 }}>{it.s}</div>
          </div>
        );
      })}
    </Dark>
  );
};

export const Motto: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Flat color={C.paper}>
      <div style={abs({ left: 0, right: 0, top: 560, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 130, color: C.ink, opacity: pop(f, 0), transform: `translateY(${(1 - pop(f, 0)) * 60}px)` })}>Objevuj svět,</div>
      <Word text={"KDE UČENÍ\nBAVÍ."} f={f} start={14} color={C.red} max={300} width={1000} y={120} from="up" dur={dur} />
    </Flat>
  );
};

export const Cta: React.FC<P> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Dark glow={0.45} hue={C.yellow}>
      <Scene3D bokeh={70} seed={17} color={C.yellow} />
      <Word text="REGISTRACE" f={f} color={C.paper} max={170} width={980} y={-420} from="down" />
      <Word text="ZDARMA." f={f} start={8} color={C.yellow} max={330} width={980} y={-150} glowc={C.yellow} dur={dur} />
      <div style={abs({ left: 0, right: 0, top: 1130, textAlign: "center", transform: `scale(${pop(f, 24)})` })}><Chip size={74} bg={C.yellow}>ucimesehrou.org</Chip></div>
      <div style={abs({ left: 0, right: 0, bottom: 260, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: C.paper, opacity: pop(f, 40) })}>Objevuj svět, kde učení baví.</div>
    </Dark>
  );
};

export const SCENES: Record<string, React.FC<P>> = {
  burst: Burst, uceni: Uceni, nuda: Nuda, ne: Ne, znate: Znate, sesit: Sesit, wall: Wall, zeptate: Zeptate, tohle: Tohle, graph: Graph, logo: Logo,
  prompt: Prompt, levels: Levels, kurzy: Kurzy, hry: Hry, unik: Unik, zebricky: Zebricky, vysvetl: Vysvetl, zdarma: Zdarma, reklam: Reklam, chips: Chips, motto: Motto, cta: Cta,
};
void random; void EchoStack;
