import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion, ENTRANCE_EASE, EXPO_OUT } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";

/** Style G: stats / finance / news data film, one accent colour. 13.0s, 390 frames, 120 BPM. Pure SVG + CSS. */
export const DATA_PULSE_FRAMES = 390;

export interface DataPulseProps {
  headline?: string;
  bigValue?: number;
  bigSuffix?: string;
  barLabels?: string[];
  barValues?: number[];
  takeaway?: string;
  takeawayCaption?: string;
}

const BG = "#07090d";
const INK = "#eef2f7";
const DIM = "#5d6674";
const ACCENT = "#3df5a5";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const win = (frame: number, a: number, b: number, c: number, d: number) =>
  interpolate(frame, [a, b, c, d], [0, 1, 1, 0], clamp);

export const DataPulse: React.FC<DataPulseProps> = ({
  headline = "Customer retention",
  bigValue = 87.4,
  bigSuffix = "%",
  barLabels = ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Q4"],
  barValues = [32, 41, 38, 52, 60, 58, 71, 87],
  takeaway = "+312%",
  takeawayCaption = "growth since launch",
}) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);

  const s1 = win(frame, -1, 0, 66, 84);
  const s2 = win(frame, 72, 92, 168, 190);
  const s3 = win(frame, 178, 198, 280, 300);
  const s4 = win(frame, 288, 308, 372, 389);

  // Scene 1: counter + ring
  const count = interpolate(frame, [4, 60], [0, bigValue], { easing: EXPO_OUT, ...clamp });
  const ringP = interpolate(frame, [4, 60], [0, bigValue / 100], { easing: ENTRANCE_EASE, ...clamp });
  const R = 330;
  const C = 2 * Math.PI * R;
  const head = enterMotion(frame, 6, 12, 30);

  // Scene 2: bars
  const maxV = Math.max(...barValues);
  const barTop = 1330;
  const barArea = 760;

  // Scene 3: lines
  const draw = interpolate(frame, [198, 240], [0, 1], { easing: ENTRANCE_EASE, ...clamp });
  const split = interpolate(frame, [236, 270], [0, 1], { easing: ENTRANCE_EASE, ...clamp });
  const base = [0, 0.12, 0.2, 0.34, 0.42, 0.5];
  const xs = base.map((_, i) => 110 + (i / (base.length - 1)) * 860);
  const y0 = 1500;
  const yAt = (v: number) => y0 - v * 900;
  const spreads = [0.35, 0, -0.16];
  const lineColors = [ACCENT, INK, DIM];
  const lineNames = ["Pro", "Team", "Free"];
  const mkPath = (spread: number) =>
    base.map((v, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)} ${yAt(v + spread * split * (i / (base.length - 1))).toFixed(1)}`).join(" ");

  // Scene 4: takeaway
  const tk = enterMotion(frame, 296, 14, 50);
  const pulse = 1 + 0.05 * env;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONTS.sans, color: INK, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <line key={i} x1={0} x2={1080} y1={i * 100 + 40} y2={i * 100 + 40} stroke="#121722" strokeWidth={2} />
        ))}
      </svg>

      {/* Scene 1 */}
      <AbsoluteFill style={{ opacity: s1, filter: `blur(${(1 - s1) * 20}px)` }}>
        <div style={{ position: "absolute", top: 210, width: 1080, textAlign: "center", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 38, letterSpacing: 8, color: DIM, opacity: head.opacity, transform: `translateY(${head.translateY}px)` }}>
          {headline.toUpperCase()}
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={540} cy={960} r={R} fill="none" stroke="#141a24" strokeWidth={40} />
          <circle cx={540} cy={960} r={R} fill="none" stroke={ACCENT} strokeWidth={40} strokeLinecap="round" strokeDasharray={`${C * ringP} ${C}`} transform="rotate(-90 540 960)" style={{ filter: `drop-shadow(0 0 ${14 + env * 24}px ${ACCENT})` }} />
        </svg>
        <div style={{ position: "absolute", top: 960 - 130, width: 1080, textAlign: "center", fontFamily: FONTS.anton, fontSize: 250, lineHeight: 1, transform: `scale(${pulse})` }}>
          {count.toFixed(1)}<span style={{ color: ACCENT, fontSize: 130 }}>{bigSuffix}</span>
        </div>
      </AbsoluteFill>

      {/* Scene 2 */}
      <AbsoluteFill style={{ opacity: s2, filter: `blur(${(1 - s2) * 20}px)` }}>
        <div style={{ position: "absolute", top: 210, width: 1080, textAlign: "center", fontFamily: FONTS.anton, fontSize: 130, letterSpacing: 2 }}>EVERY QUARTER, HIGHER</div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {barValues.map((v, i) => {
            const t = interpolate(frame, [96 + i * 15, 96 + i * 15 + 14], [0, 1], { easing: ENTRANCE_EASE, ...clamp });
            const h = (v / maxV) * barArea * t;
            const w = 92;
            const x = 70 + i * 122;
            const last = i === barValues.length - 1;
            return (
              <g key={i}>
                <rect x={x} y={barTop - h} width={w} height={h} rx={10} fill={last ? ACCENT : "#1d2533"} style={last ? { filter: `drop-shadow(0 0 ${16 + env * 20}px ${ACCENT})` } : undefined} />
                <text x={x + w / 2} y={barTop + 52} textAnchor="middle" fontFamily={FONTS.mono} fontSize={28} fontWeight={700} fill={DIM}>{barLabels[i] ?? ""}</text>
                <text x={x + w / 2} y={barTop - h - 20} textAnchor="middle" fontFamily={FONTS.anton} fontSize={44} fill={last ? ACCENT : INK} opacity={t}>{Math.round(v * t)}</text>
              </g>
            );
          })}
          <line x1={50} x2={1030} y1={barTop} y2={barTop} stroke={DIM} strokeWidth={3} />
        </svg>
      </AbsoluteFill>

      {/* Scene 3 */}
      <AbsoluteFill style={{ opacity: s3, filter: `blur(${(1 - s3) * 20}px)` }}>
        <div style={{ position: "absolute", top: 210, width: 1080, textAlign: "center", fontFamily: FONTS.anton, fontSize: 130, letterSpacing: 2 }}>THEN IT SPLITS</div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2].map((k) => (
            <path key={k} d={mkPath(spreads[k])} fill="none" stroke={lineColors[k]} strokeWidth={k === 0 ? 12 : 8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={k === 0 ? { filter: `drop-shadow(0 0 ${12 + env * 20}px ${ACCENT})` } : undefined} />
          ))}
          <line x1={90} x2={990} y1={y0 + 30} y2={y0 + 30} stroke={DIM} strokeWidth={3} />
        </svg>
        {lineNames.map((n, k) => {
          const e = enterMotion(frame, 250 + k * 8, 12, 24);
          return (
            <div key={n} style={{ position: "absolute", left: 130 + k * 280, top: 1620, display: "flex", alignItems: "center", gap: 16, opacity: e.opacity, transform: `translateY(${e.translateY}px)` }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: lineColors[k] }} />
              <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 36, color: INK }}>{n}</div>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Scene 4 */}
      <AbsoluteFill style={{ opacity: s4, filter: `blur(${(1 - s4) * 20}px)`, alignItems: "center", justifyContent: "center" }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2].map((i) => {
            const t = ((frame - 300 + i * 20) % 60) / 60;
            return <circle key={i} cx={540} cy={900} r={260 + t * 360} fill="none" stroke={ACCENT} strokeWidth={4} opacity={(1 - t) * 0.5 * (frame > 300 ? 1 : 0)} />;
          })}
        </svg>
        <div style={{ opacity: tk.opacity, transform: `translateY(${tk.translateY - 60}px) scale(${pulse})`, filter: `blur(${tk.blur}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: FONTS.anton, fontSize: 290, lineHeight: 1, color: ACCENT, textShadow: `0 0 ${30 + env * 40}px ${ACCENT}88` }}>{takeaway}</div>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 44, letterSpacing: 8, color: INK, marginTop: 24 }}>{takeawayCaption.toUpperCase()}</div>
        </div>
      </AbsoluteFill>

      <Grain opacity={0.05} tintColor={ACCENT} tintOpacity={0.03} seed="data" />
    </AbsoluteFill>
  );
};
