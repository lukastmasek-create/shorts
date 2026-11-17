import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion, exitMotion, UI_SPRING } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";

/** Style E: frosted-glass app demo, light mode. 15.0s, 450 frames. Pure CSS (backdrop-filter), no WebGL. */
export const GLASS_UI_FRAMES = 450;

export interface GlassUIProps {
  appName?: string;
  feature?: string;
  price?: string;
  cta?: string;
}

const INK = "#15152b";
const MUTED = "#6a6a85";
const ACCENT = "#5b5bff";
const ACCENT2 = "#ff6ab0";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.46)",
  backdropFilter: "blur(26px) saturate(1.4)",
  WebkitBackdropFilter: "blur(26px) saturate(1.4)",
  border: "2px solid rgba(255,255,255,0.85)",
  borderRadius: 56,
  boxShadow: "0 40px 90px rgba(60,60,140,0.22), inset 0 2px 0 rgba(255,255,255,0.9)",
};

const Backdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const orb = (i: number, color: string, size: number) => {
    const x = 540 + noise2D("gx", i, frame * 0.004) * 420;
    const y = 960 + noise2D("gy", i, frame * 0.004) * 700;
    return (
      <div
        key={i}
        style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: color, filter: "blur(120px)", opacity: 0.85 }}
      />
    );
  };
  return (
    <AbsoluteFill style={{ background: "#eef0ff", overflow: "hidden" }}>
      {orb(0, "#b9c4ff", 900)}
      {orb(1, "#ffc2e0", 800)}
      {orb(2, "#bff3ff", 760)}
      {orb(3, "#ffe7b8", 620)}
    </AbsoluteFill>
  );
};

const Floater: React.FC<{ i: number; frame: number; x: number; y: number; w: number; h: number; children?: React.ReactNode; scale?: number; rotY?: number }> = ({
  i, frame, x, y, w, h, children, scale = 1, rotY = 0,
}) => {
  const fps = 30;
  const s = spring({ frame: frame - 6 * i, fps, config: UI_SPRING });
  const fx = noise2D("fx", i, frame * 0.012) * 26;
  const fy = noise2D("fy", i, frame * 0.012) * 34;
  const rx = noise2D("rx", i, frame * 0.01) * 7;
  const ry = noise2D("ry", i, frame * 0.01) * 10 + rotY;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 1600, opacity: s }}>
      <div
        style={{
          ...glass,
          width: "100%",
          height: "100%",
          padding: 44,
          boxSizing: "border-box",
          transform: `translate(${fx}px, ${fy + (1 - s) * 120}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale * (0.85 + 0.15 * s)})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Dot: React.FC<{ c: string; size?: number }> = ({ c, size = 64 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.32, background: c, boxShadow: `0 14px 30px ${c}77` }} />
);

const Line: React.FC<{ w: number; strong?: boolean }> = ({ w, strong }) => (
  <div style={{ height: strong ? 26 : 18, width: `${w}%`, borderRadius: 14, background: strong ? INK : "rgba(21,21,43,0.16)", marginTop: 20 }} />
);

export const GlassUI: React.FC<GlassUIProps> = ({
  appName = "Orbit",
  feature = "Smart Inbox",
  price = "$12",
  cta = "Start free",
}) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const env = beatEnvelope(frame, BEATS);

  // Scene windows
  const s1 = interpolate(frame, [0, 6, 100, 124], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2 = interpolate(frame, [96, 124, 214, 240], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s3 = interpolate(frame, [216, 244, 330, 354], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s4 = interpolate(frame, [330, 358, 418, 440], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const flip = spring({ frame: frame - 132, fps, config: { damping: 16, stiffness: 90, mass: 1 } });
  const title1 = enterMotion(frame, 8, 14, 40);
  const title3 = enterMotion(frame, 244, 14, 40);
  const cta4 = spring({ frame: frame - 372, fps, config: UI_SPRING });
  const ctaPulse = 1 + 0.05 * env;
  const countUp = interpolate(frame, [250, 310], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tiles = [
    { label: "Unread", value: Math.round(128 * countUp), c: ACCENT },
    { label: "Replied", value: Math.round(94 * countUp), c: ACCENT2 },
    { label: "Hours saved", value: Math.round(12 * countUp), c: "#17b890" },
    { label: "Streak", value: Math.round(31 * countUp), c: "#ff9b3d" },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans, color: INK, overflow: "hidden" }}>
      <Backdrop frame={frame} />

      {/* Scene 1: drifting cards */}
      <AbsoluteFill style={{ opacity: s1, filter: `blur(${(1 - s1) * 18}px)` }}>
        <div style={{ position: "absolute", top: 210, width: 1080, textAlign: "center", opacity: title1.opacity, transform: `translateY(${title1.translateY}px)` }}>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: 10, color: MUTED }}>MEET</div>
          <div style={{ fontSize: 190, fontWeight: 700, letterSpacing: -6, marginTop: 6 }}>{appName}</div>
        </div>
        <Floater i={0} frame={frame} x={80} y={640} w={440} h={400}><Dot c={ACCENT} /><Line w={80} strong /><Line w={60} /><Line w={72} /></Floater>
        <Floater i={1} frame={frame} x={560} y={760} w={440} h={500}><Dot c={ACCENT2} /><Line w={70} strong /><Line w={90} /><Line w={50} /><Line w={66} /></Floater>
        <Floater i={2} frame={frame} x={120} y={1120} w={460} h={420}><Dot c="#17b890" /><Line w={74} strong /><Line w={86} /><Line w={44} /></Floater>
        <Floater i={3} frame={frame} x={600} y={1340} w={400} h={360}><Dot c="#ff9b3d" /><Line w={64} strong /><Line w={84} /></Floater>
        <Floater i={4} frame={frame} x={330} y={1560} w={420} h={260}><Dot c="#22b8ff" size={56} /><Line w={60} strong /></Floater>
      </AbsoluteFill>

      {/* Scene 2: one card flips to reveal feature */}
      <AbsoluteFill style={{ opacity: s2, filter: `blur(${(1 - s2) * 18}px)`, alignItems: "center", justifyContent: "center" }}>
        <div style={{ perspective: 2200, width: 820, height: 1100 }}>
          <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateY(${180 * flip}deg) scale(${1 + 0.02 * env})` }}>
            <div style={{ ...glass, position: "absolute", inset: 0, backfaceVisibility: "hidden", padding: 70, boxSizing: "border-box" }}>
              <Dot c={ACCENT} size={110} /><Line w={70} strong /><Line w={90} /><Line w={55} /><Line w={80} />
            </div>
            <div style={{ ...glass, position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", padding: 70, boxSizing: "border-box" }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 8, color: ACCENT }}>NEW</div>
              <div style={{ fontSize: 108, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, marginTop: 14 }}>{feature}</div>
              {["Sorts by what matters", "Drafts replies for you", "Silences the noise"].map((t, i) => {
                const e = enterMotion(frame, 160 + i * 10, 12, 30);
                return (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 56, opacity: e.opacity, transform: `translateY(${e.translateY}px)` }}>
                    <Dot c={[ACCENT, ACCENT2, "#17b890"][i]} size={74} />
                    <div style={{ fontSize: 46, fontWeight: 600 }}>{t}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Scene 3: dashboard */}
      <AbsoluteFill style={{ opacity: s3, filter: `blur(${(1 - s3) * 18}px)` }}>
        <div style={{ position: "absolute", top: 190, width: 1080, textAlign: "center", opacity: title3.opacity, transform: `translateY(${title3.translateY}px)`, fontSize: 96, fontWeight: 700, letterSpacing: -3 }}>
          Your week, at a glance
        </div>
        {tiles.map((t, i) => (
          <div key={t.label} style={{ ...glass, position: "absolute", left: 70 + (i % 2) * 480, top: 520 + Math.floor(i / 2) * 460, width: 450, height: 420, padding: 44, boxSizing: "border-box", transform: `translateY(${(1 - spring({ frame: frame - 244 - i * 5, fps, config: UI_SPRING })) * 120}px)` }}>
            <Dot c={t.c} size={56} />
            <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -5, marginTop: 30 }}>{t.value}</div>
            <div style={{ fontSize: 38, fontWeight: 500, color: MUTED }}>{t.label}</div>
          </div>
        ))}
        <div style={{ ...glass, position: "absolute", left: 70, top: 1440, width: 930, height: 280, padding: 44, boxSizing: "border-box", display: "flex", alignItems: "flex-end", gap: 24 }}>
          {[0.4, 0.62, 0.5, 0.82, 0.7, 1, 0.76].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h * countUp * 100}%`, borderRadius: 20, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT2})` }} />
          ))}
        </div>
      </AbsoluteFill>

      {/* Scene 4: price + CTA */}
      <AbsoluteFill style={{ opacity: s4, filter: `blur(${(1 - s4) * 18}px)`, alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...glass, width: 860, padding: "110px 70px", boxSizing: "border-box", textAlign: "center", transform: `scale(${0.88 + 0.12 * cta4})` }}>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: 10, color: MUTED }}>{appName.toUpperCase()} PRO</div>
          <div style={{ fontSize: 260, fontWeight: 700, letterSpacing: -10, lineHeight: 1, marginTop: 16 }}>
            {price}<span style={{ fontSize: 64, color: MUTED, letterSpacing: 0 }}>/mo</span>
          </div>
          <div style={{ marginTop: 70, display: "inline-block", padding: "40px 110px", borderRadius: 999, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`, color: "#fff", fontSize: 62, fontWeight: 700, boxShadow: `0 30px 70px ${ACCENT}66`, transform: `scale(${ctaPulse})` }}>
            {cta}
          </div>
        </div>
      </AbsoluteFill>

      <Grain opacity={0.035} blendMode="multiply" seed="glass" />
    </AbsoluteFill>
  );
};
