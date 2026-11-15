// Small shared atoms: mono micro-labels, red highlight chips, corner brackets, waved rules.
import React from "react";
import { C, F, H, W, rgba } from "../theme";

export const MicroLabel: React.FC<{
  children: React.ReactNode;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ children, x, y, size = 26, color = C.white, opacity = 0.75, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontFamily: F.mono,
      fontSize: size,
      letterSpacing: "0.14em",
      color,
      opacity,
      fontWeight: 400,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** red highlight chip behind a token (prompt / quiz text) */
export const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  fg?: string;
  size?: number;
  scale?: number;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ children, color = C.red, fg = C.white, size = 34, scale = 1, radius = 8, style }) => (
  <span
    style={{
      display: "inline-block",
      background: color,
      color: fg,
      fontFamily: F.mono,
      fontSize: size,
      fontWeight: 700,
      padding: `${size * 0.16}px ${size * 0.42}px`,
      borderRadius: radius,
      transform: `scale(${scale})`,
      transformOrigin: "center",
      ...style,
    }}
  >
    {children}
  </span>
);

export const Brackets: React.FC<{ inset?: number; size?: number; color?: string; opacity?: number }> = ({
  inset = 64,
  size = 74,
  color = C.white,
  opacity = 0.8,
}) => {
  const s: React.CSSProperties = { position: "absolute", width: size, height: size, borderColor: rgba(color, 0.9), borderStyle: "solid", borderWidth: 0, opacity };
  return (
    <>
      <div style={{ ...s, left: inset, top: inset, borderLeftWidth: 3, borderTopWidth: 3 }} />
      <div style={{ ...s, right: inset, top: inset, borderRightWidth: 3, borderTopWidth: 3 }} />
      <div style={{ ...s, left: inset, bottom: inset, borderLeftWidth: 3, borderBottomWidth: 3 }} />
      <div style={{ ...s, right: inset, bottom: inset, borderRightWidth: 3, borderBottomWidth: 3 }} />
    </>
  );
};

/** the 4:5 rounded card the UI mocks live in */
export const MockCard: React.FC<{
  f?: number;
  children: React.ReactNode;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  radius?: number;
  bg?: string;
  border?: string;
  shadow?: string;
  style?: React.CSSProperties;
}> = ({ children, x = 90, y = 520, w = 900, h = 820, radius = 38, bg = "#0E0E13", border = rgba(C.white, 0.14), shadow, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      background: bg,
      border: `2px solid ${border}`,
      boxShadow: shadow ?? `0 40px 120px ${rgba(C.black, 0.55)}`,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const FullFrame: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", inset: 0, width: W, height: H, overflow: "hidden", ...style }}>{children}</div>
);
