// Product UI mocks, drawn in DOM/SVG so the mono text stays crisp at 1080x1920.
// These are the film's "flat screen-record" beats: the old-way revision planner, the quiz card (the
// prompt-box of this product), the subject -> levels -> explanation graph, and the five capability cards.
import React from "react";
import { random } from "remotion";
import { C, F, H, W, rgba } from "../theme";
import { clamp01, easeOut3, softIn, slam } from "../fx/ease";
import { Chip, MicroLabel, MockCard } from "./ui";

/* ------------------------------------------------- the old way: revision planner */

export const WeekPlanner: React.FC<{ f: number; at?: number; x?: number; y?: number }> = ({ f, at = 0, x = 70, y = 470 }) => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const rows = [0, 1, 2, 3];
  const playhead = ((f - at) * 9) % 760;
  return (
    <MockCard f={f} x={x} y={y} w={940} h={640} bg="#08080B" border={rgba(C.white, 0.16)} radius={22}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 54, background: "#101017", borderBottom: `1px solid ${rgba(C.white, 0.12)}` }} />
      {["", "", ""].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 20 + i * 22, top: 20, width: 13, height: 13, borderRadius: 7, background: rgba(C.white, 0.25) }} />
      ))}
      <div style={{ position: "absolute", left: 100, top: 15, fontFamily: F.mono, fontSize: 21, color: rgba(C.white, 0.6), letterSpacing: "0.08em" }}>REVISION_PLAN_v7 ◆ 3 HRS</div>
      <div style={{ position: "absolute", left: 24, top: 74, right: 24, bottom: 20 }}>
        {days.map((d, i) => (
          <div key={d}>
            <MicroLabel x={0} y={i * 126} size={19} color={rgba(C.white, 0.45)}>
              {d}
            </MicroLabel>
            {rows.map((r) => {
              const on = (i + r) % 3 !== 2;
              const wdt = 120 + random(`wp:${i}:${r}`) * 320;
              const x0 = 90 + random(`wpx:${i}:${r}`) * 300;
              return on ? (
                <div
                  key={r}
                  style={{
                    position: "absolute",
                    left: x0,
                    top: i * 126 + 6,
                    width: wdt,
                    height: 18,
                    borderRadius: 4,
                    background: rgba(r % 2 ? C.white : C.red, 0.28 + 0.18 * Math.abs(Math.sin((f + i * 9) / 40))),
                  }}
                />
              ) : null;
            })}
            {[0, 1, 2].map((k) => (
              <div
                key={`d${k}`}
                style={{
                  position: "absolute",
                  left: 120 + random(`wpd:${i}:${k}`) * 640,
                  top: i * 126 + 0.5,
                  width: 15,
                  height: 15,
                  background: C.red,
                  transform: "rotate(45deg)",
                  opacity: 0.95,
                }}
              />
            ))}
          </div>
        ))}
        <div style={{ position: "absolute", left: playhead, top: -10, bottom: 0, width: 2, background: C.white, boxShadow: `0 0 16px ${rgba(C.white, 0.8)}` }} />
      </div>
      {/* mouse cursor that keeps clicking the same clip */}
      <div
        style={{
          position: "absolute",
          left: 380 + Math.sin((f - at) / 9) * 130,
          top: 300 + Math.cos((f - at) / 11) * 90,
          width: 0,
          height: 0,
          borderLeft: "18px solid #fff",
          borderBottom: "26px solid transparent",
          transform: "rotate(-12deg)",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,.6))",
        }}
      />
      <div style={{ position: "absolute", left: 470, top: 430, padding: "6px 12px", borderRadius: 6, background: C.red, fontFamily: F.mono, fontSize: 18, color: "#fff" }}>CLICK</div>
    </MockCard>
  );
};

/* --------------------------------------------------------------- the quiz card */

export const QuizCard: React.FC<{
  f: number;
  at?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  question: string;
  answer: string;
  why?: string;
  typed?: number;
  showAnswer?: number;
  showWhy?: number;
  wrongAnswer?: string;
  wrongAt?: number;
}> = ({ f, at = 0, x = 90, y = 470, w = 900, h = 580, question, answer, why, typed = 60, showAnswer = 0, showWhy = 0, wrongAnswer, wrongAt = -99 }) => {
  const carets = Math.floor(clamp01((f - at) / typed) * question.length);
  const typing = f - at < typed;
  const ansP = slam(f, 30, at + showAnswer, { damping: 11, stiffness: 230 });
  const whyP = softIn(f, 30, at + showWhy, { damping: 180, stiffness: 130 });
  return (
    <MockCard f={f} x={x} y={y} w={w} h={h} bg={`linear-gradient(155deg, ${C.blueA} 0%, #4B3AC8 48%, ${C.blueB} 100%)`} border={rgba("#fff", 0.22)} radius={42} shadow={`0 40px 130px ${rgba(C.blueB, 0.55)}, inset 0 1px 0 rgba(255,255,255,.25)`}>
      <div style={{ position: "absolute", left: 38, top: 30, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.18em", color: rgba("#fff", 0.85) }}>TODAY'S QUIZ · MATH · LVL 3</div>
      <div style={{ position: "absolute", left: 38, top: 84, right: 30, fontFamily: F.mono, fontSize: 62, lineHeight: 1.18, color: "#fff", textShadow: `0 0 30px ${rgba("#fff", 0.35)}` }}>
        {question.slice(0, carets)}
        <span style={{ opacity: typing && f % 16 < 9 ? 1 : 0, color: C.acid }}>▌</span>
      </div>
      {f >= at + showAnswer ? (
        <div style={{ position: "absolute", left: 38, top: 258, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ transform: `scale(${0.6 + 0.4 * clamp01(ansP)})`, opacity: clamp01(ansP * 2) }}>
            <Chip color={C.red} fg="#fff" size={62} radius={14} style={{ fontFamily: F.mono, fontWeight: 700, letterSpacing: "0.02em", boxShadow: `0 0 40px ${rgba(C.red, 0.6)}` }}>
              {answer}
            </Chip>
          </div>
          {wrongAnswer && f >= at + showWhy ? (
            <div style={{ position: "relative", opacity: clamp01(whyP * 2) }}>
              <span style={{ fontFamily: F.mono, fontSize: 52, color: rgba("#fff", 0.5), textDecoration: "line-through", textDecorationColor: C.red, textDecorationThickness: 6 }}>{wrongAnswer}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {why && f >= at + showWhy ? (
        <div style={{ position: "absolute", left: 38, top: 372, right: 38, opacity: clamp01(whyP * 2), transform: `translateY(${(1 - whyP) * 24}px)` }}>
          <div style={{ display: "inline-block", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.2em", color: C.black, background: C.acid, padding: "4px 12px", borderRadius: 6, marginBottom: 16 }}>WHY?</div>
          <div style={{ fontFamily: F.mono, fontSize: 32, lineHeight: 1.42, color: rgba("#fff", 0.95) }}>{why}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", right: 34, bottom: 28, width: 92, height: 62, borderRadius: 14, background: rgba("#fff", 0.16), border: `1px solid ${rgba("#fff", 0.35)}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 26, color: "#fff" }}>
        ⏎
      </div>
      <div style={{ position: "absolute", left: 38, bottom: 34, fontFamily: F.mono, fontSize: 20, color: rgba("#fff", 0.7) }}>STREAK 7 ◆ +40 XP</div>
    </MockCard>
  );
};

/* ------------------------------------------------- subject -> levels -> explanation */

export const NodeGraph: React.FC<{ f: number; at?: number; labels?: string[]; pills?: string[] }> = ({
  f,
  at = 0,
  labels = ["SUBJECT", "FIVE LEVELS", "EXPLANATION"],
  pills = ["pick", "climb", "understand"],
}) => {
  const nodes = labels.map((t, i) => ({ y: 480 + i * 420, x: 150, w: 780, h: 200 }));
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {nodes.slice(0, -1).map((n, i) => {
          const y0 = n.y + n.h;
          const y1 = nodes[i + 1].y;
          const p = easeOut3(clamp01((f - at - 6 - i * 7) / 10));
          return (
            <g key={i}>
              <path d={`M ${n.x + n.w / 2} ${y0} C ${n.x + n.w / 2} ${y0 + 90}, ${nodes[i + 1].x + nodes[i + 1].w / 2} ${y1 - 90}, ${nodes[i + 1].x + nodes[i + 1].w / 2} ${y1}`} stroke={rgba(C.red, 0.18)} strokeWidth={5} fill="none" />
              <path
                d={`M ${n.x + n.w / 2} ${y0} C ${n.x + n.w / 2} ${y0 + 90}, ${nodes[i + 1].x + nodes[i + 1].w / 2} ${y1 - 90}, ${nodes[i + 1].x + nodes[i + 1].w / 2} ${y1}`}
                stroke={C.red}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset={1000 * (1 - p)}
                style={{ filter: `drop-shadow(0 0 14px ${rgba(C.red, 0.9)})` }}
              />
              {/* travelling pulse */}
              {p >= 1
                ? [0, 1].map((k) => {
                    const t = (((f - at) / 30 + k * 0.5) % 1);
                    const yy = y0 + (y1 - y0) * t;
                    return <circle key={k} cx={n.x + n.w / 2} cy={yy} r={9} fill="#fff" style={{ filter: `drop-shadow(0 0 16px ${C.red})` }} opacity={0.9} />;
                  })
                : null}
            </g>
          );
        })}
      </svg>
      {nodes.map((n, i) => {
        const p = softIn(f, 30, at + i * 7, { damping: 15, stiffness: 180 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              width: n.w,
              height: n.h,
              borderRadius: 34,
              background: i === nodes.length - 1 ? C.red : "#0C0C11",
              border: `2px solid ${i === nodes.length - 1 ? rgba("#fff", 0.5) : rgba(C.red, 0.55)}`,
              boxShadow: `0 30px 80px ${rgba(C.black, 0.6)}, 0 0 60px ${rgba(C.red, i === nodes.length - 1 ? 0.5 : 0.25)}`,
              transform: `translateY(${(1 - p) * 40}px) scale(${0.92 + 0.08 * p})`,
              opacity: clamp01(p * 2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.display,
              fontSize: 56,
              letterSpacing: "-0.02em",
              color: i === nodes.length - 1 ? "#fff" : C.white,
            }}
          >
            {labels[i]}
          </div>
        );
      })}
      {pills.map((p, i) => {
        const a = softIn(f, 30, at + 10 + i * 7, { damping: 180, stiffness: 140 });
        return (
          <div
            key={p}
            style={{
              position: "absolute",
              left: 640,
              top: nodes[i].y + nodes[i].h + 100,
              padding: "8px 18px",
              borderRadius: 999,
              background: rgba(C.black, 0.85),
              border: `1px solid ${rgba(C.red, 0.7)}`,
              fontFamily: F.mono,
              fontSize: 24,
              color: C.red,
              letterSpacing: "0.1em",
              opacity: clamp01(a * 2),
              transform: `translateY(${(1 - a) * 12}px)`,
            }}
          >
            {p}
          </div>
        );
      })}
    </>
  );
};

/* --------------------------------------------------------------- subject chips */

export const SubjectGrid: React.FC<{ f: number; at?: number; items?: string[]; cols?: number; x?: number; y?: number; chipH?: number }> = ({
  f,
  at = 0,
  items = ["GRADES 1–9", "HIGH SCHOOL", "ENTRANCE EXAMS", "FINALS"],
  cols = 2,
  x = 70,
  y = 640,
  chipH = 152,
}) => {
  const gap = 22;
  const w = (W - x * 2 - gap * (cols - 1)) / cols;
  return (
    <>
      {items.map((it, i) => {
        const p = slam(f, 30, at + i * 4, { damping: 12, stiffness: 220 });
        const col = i % 2 === 0 ? C.white : C.red;
        const fg = i % 2 === 0 ? C.black : "#fff";
        const cx = x + (i % cols) * (w + gap);
        const cy = y + Math.floor(i / cols) * (chipH + gap);
        return (
          <div
            key={it}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              width: w,
              height: chipH,
              borderRadius: 22,
              background: col,
              color: fg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.display,
              fontSize: 44,
              letterSpacing: "-0.01em",
              opacity: clamp01(p * 3),
              transform: `scale(${0.86 + 0.14 * clamp01(p)})`,
              boxShadow: i % 2 === 0 ? "0 20px 60px rgba(0,0,0,.55)" : `0 0 50px ${rgba(C.red, 0.5)}`,
            }}
          >
            {it}
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------- level track */

export const LevelTrack: React.FC<{ f: number; at?: number; x?: number; y?: number; fill?: number; w?: number; h?: number }> = ({ f, at = 0, x = 70, y = 640, fill = 3, w = 940, h = 210 }) => {
  const seg = (w - 4 * 22) / 5;
  return (
    <>
      {new Array(5).fill(0).map((_, i) => {
        const p = softIn(f, 30, at + i * 5, { damping: 140, stiffness: 150 });
        const on = i < fill;
        const pop = slam(f, 30, at + i * 5, { damping: 10, stiffness: 250 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + i * (seg + 22),
              top: y,
              width: seg,
              height: h,
              borderRadius: 20,
              background: on ? `linear-gradient(180deg, ${C.red}, ${C.deep})` : rgba(C.white, 0.06),
              border: `2px solid ${on ? rgba("#fff", 0.45) : rgba(C.white, 0.18)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.mono,
              fontSize: 72,
              color: on ? "#fff" : rgba(C.white, 0.32),
              transform: `translateY(${(1 - p) * 30}px) scale(${on ? 0.9 + 0.1 * clamp01(pop) : 1})`,
              boxShadow: on ? `0 0 46px ${rgba(C.red, 0.45)}` : "none",
            }}
          >
            {i + 1}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: x, top: y + h + 30, width: w, height: 10, borderRadius: 5, background: rgba(C.white, 0.14) }}>
        <div style={{ width: `${(w * fill) / 5}`, height: 10, borderRadius: 5, background: C.red, boxShadow: `0 0 22px ${rgba(C.red, 0.8)}` }} />
      </div>
      <div style={{ position: "absolute", left: x, top: y - 78, fontFamily: F.mono, fontSize: 24, letterSpacing: "0.2em", color: rgba(C.white, 0.6) }}>
        LEVEL {fill} / 5 · 120 XP
      </div>
    </>
  );
};

/* --------------------------------------------------------------------- filmstrip */

export const FilmStrip: React.FC<{ f: number; at?: number; y?: number; speed?: number }> = ({ f, at = 0, y = 760, speed = 7 }) => {
  const n = 9;
  const cw = 280;
  const off = -(((f - at) * speed) % (cw + 18)) + 40;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: 360, overflow: "hidden", background: rgba(C.black, 0.55), borderTop: `2px solid ${rgba(C.red, 0.5)}`, borderBottom: `2px solid ${rgba(C.red, 0.5)}` }}>
      {new Array(n + 2).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: off + i * (cw + 18),
            top: 24,
            width: cw,
            height: 312,
            borderRadius: 12,
            background: i % 3 === 0 ? C.red : "#101016",
            border: `2px solid ${rgba("#fff", 0.16)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 60,
            color: i % 3 === 0 ? "#fff" : rgba(C.white, 0.6),
          }}
        >
          {["7×8", "9+6", "⅔×¾", "12²", "0.5+⅛"][i % 5]}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------- shape morph */

/** the red play triangle that morphs -> diamond -> rounded square (shape morph beat) */
export const ShapeMorph: React.FC<{ f: number; at?: number; cx?: number; cy?: number; size?: number; color?: string }> = ({ f, at = 0, cx = W / 2, cy = H / 2, size = 320, color = C.red }) => {
  const seg = 26;
  // positive modulo: the mock is rendered from frames before its own start (the shot stack overlaps)
  const raw = (f - at) / seg;
  const t = ((raw % 3) + 3) % 3;
  const shapes: [number, number][][] = [
    [
      [0, -1],
      [1, 1],
      [-1, 1],
      [0, -1],
    ],
    [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ],
    [
      [0.72, -0.72],
      [0.72, 0.72],
      [-0.72, 0.72],
      [-0.72, -0.72],
    ],
  ];
  const i0 = Math.floor(t) % 3;
  const i1 = (i0 + 1) % 3;
  const k = easeOut3(clamp01(t - Math.floor(t)));
  const pts = shapes[i0].map((p, i) => {
    const q = shapes[i1][i];
    return [(p[0] + (q[0] - p[0]) * k) * (size / 2), (p[1] + (q[1] - p[1]) * k) * (size / 2)];
  });
  return (
    <svg width={size * 1.6} height={size * 1.6} style={{ position: "absolute", left: cx - size * 0.8, top: cy - size * 0.8 }}>
      <polygon points={pts.map((p) => `${size * 0.8 + p[0]},${size * 0.8 + p[1]}`).join(" ")} fill={color} style={{ filter: `drop-shadow(0 0 ${size * 0.16}px ${rgba(color, 0.65)})` }} />
    </svg>
  );
};

/* ------------------------------------------------------------ parent progress view */

export const ProgressChart: React.FC<{ f: number; at?: number; x?: number; y?: number; w?: number; h?: number }> = ({ f, at = 0, x = 70, y = 620, w = 940, h = 520 }) => {
  const p = easeOut3(clamp01((f - at) / 22));
  const pts = [0.3, 0.42, 0.38, 0.55, 0.62, 0.72, 0.86];
  const path = pts.map((v, i) => `${(i / (pts.length - 1)) * (w - 120) + 60},${h - 60 - v * (h - 140)}`).join(" L ");
  return (
    <MockCard f={f} x={x} y={y} w={w} h={h} bg="#0B0B10" border={rgba(C.white, 0.14)} radius={28}>
      <div style={{ position: "absolute", left: 34, top: 28, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.16em", color: rgba(C.white, 0.65) }}>PARENT VIEW · WEEKLY</div>
      <div style={{ position: "absolute", left: 34, top: 66, fontFamily: F.display, fontSize: 66, color: "#fff" }}>+38%</div>
      <div style={{ position: "absolute", right: 34, top: 78, fontFamily: F.mono, fontSize: 20, color: rgba(C.white, 0.5) }}>WK 1 → 7</div>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M ${path}`} fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - p)} style={{ filter: `drop-shadow(0 0 16px ${rgba(C.red, 0.8)})` }} />
        {new Array(7).fill(0).map((_, i) => (
          <line key={i} x1={60 + (i / 6) * (w - 120)} y1={30} x2={60 + (i / 6) * (w - 120)} y2={h - 50} stroke={rgba(C.white, 0.07)} strokeWidth={1} />
        ))}
        {pts.map((v, i) => {
          const a = clamp01((p - i / (pts.length + 1)) * 6);
          return <circle key={i} cx={(i / (pts.length - 1)) * (w - 120) + 60} cy={h - 60 - v * (h - 140)} r={11 * a} fill="#fff" opacity={a} />;
        })}
      </svg>
    </MockCard>
  );
};

/* ------------------------------------------------------------------ teacher view */

export const ClassList: React.FC<{ f: number; at?: number; x?: number; y?: number; w?: number; h?: number }> = ({ f, at = 0, x = 70, y = 640, w = 940, h = 520 }) => {
  const names = ["NOVAK", "DUSKOVA", "HORAK", "MALY", "KRIZ"];
  return (
    <MockCard f={f} x={x} y={y} w={w} h={h} bg="#0B0B10" border={rgba(C.white, 0.14)} radius={28}>
      <div style={{ position: "absolute", left: 34, top: 26, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.16em", color: rgba(C.white, 0.65) }}>TEACHER · CLASS 7.B · ASSIGNED</div>
      {names.map((n, i) => {
        const p = softIn(f, 30, at + i * 4, { damping: 150, stiffness: 160 });
        return (
          <div key={n} style={{ position: "absolute", left: 34, right: 34, top: 96 + i * 82, display: "flex", alignItems: "center", gap: 18, opacity: clamp01(p * 2), transform: `translateX(${(1 - p) * -24}px)` }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: i % 3 === 0 ? C.acid : C.red }} />
            <div style={{ fontFamily: F.mono, fontSize: 28, color: rgba(C.white, 0.92), width: 280 }}>{n}</div>
            <div style={{ flex: 1, height: 10, borderRadius: 5, background: rgba(C.white, 0.12) }}>
              <div style={{ width: `${40 + ((i * 37) % 60)}%`, height: 10, borderRadius: 5, background: i % 3 === 0 ? C.acid : C.red }} />
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 22, color: rgba(C.white, 0.6) }}>{60 + i * 7}%</div>
          </div>
        );
      })}
    </MockCard>
  );
};

/* ------------------------------------------------------------------- escape room */

export const EscapeRoom: React.FC<{ f: number; at?: number; cx?: number; cy?: number }> = ({ f, at = 0, cx = W / 2, cy = 780 }) => {
  const secs = Math.max(0, 240 - Math.floor((f - at) / 1.2));
  const p = softIn(f, 30, at, { damping: 150, stiffness: 150 });
  return (
    <div style={{ position: "absolute", left: cx - 300, top: cy - 300, width: 600, height: 600, opacity: clamp01(p * 2), transform: `scale(${0.9 + 0.1 * p})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 46, background: `linear-gradient(150deg, ${C.deep}, #1A0703)`, border: `3px solid ${rgba(C.red, 0.8)}`, boxShadow: `0 0 80px ${rgba(C.red, 0.45)}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 60, textAlign: "center", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.22em", color: C.acid }}>ESCAPE ROOM</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: F.display, fontSize: 170, color: "#fff", letterSpacing: "-0.03em", textShadow: `0 0 40px ${rgba(C.red, 0.7)}` }}>
        {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 370, display: "flex", justifyContent: "center", gap: 14 }}>
        {["KH6", "Q?2", "M4X"].map((c, i) => (
          <div key={c} style={{ padding: "10px 20px", borderRadius: 12, background: rgba(C.white, 0.1), border: `1px solid ${rgba(C.white, 0.25)}`, fontFamily: F.mono, fontSize: 26, color: "#fff", opacity: i === 1 ? 0.45 : 1 }}>
            {c}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontFamily: F.mono, fontSize: 22, letterSpacing: "0.16em", color: rgba(C.white, 0.6) }}>SOLVE · UNLOCK · LEARN</div>
    </div>
  );
};

/** tiny mono footnote used under a few mocks */
export const MockNote: React.FC<{ text: string; y?: number; align?: "left" | "center" }> = ({ text, y = 1560, align = "center" }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: align, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.18em", color: rgba(C.white, 0.55) }}>{text}</div>
);

export const hudH = H;
