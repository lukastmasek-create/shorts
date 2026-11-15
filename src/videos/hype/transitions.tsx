import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { C, TILE } from "./brand";

type P = Record<string, never>;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
const mk = (render: (p: number, entering: boolean, children: React.ReactNode) => React.ReactNode): TransitionPresentation<P> => ({
  component: (({ children, presentationDirection, presentationProgress }: TransitionPresentationComponentProps<P>) => <AbsoluteFill>{render(presentationProgress, presentationDirection === "entering", children)}</AbsoluteFill>) as React.FC<TransitionPresentationComponentProps<P>>,
  props: {} as P,
});

/** whip-pan: directional smear, exp-out */
export const whipPan = () => mk((p, en, ch) => {
  const e = ease(p);
  const x = en ? interpolate(e, [0, 1], [1080, 0]) : interpolate(e, [0, 1], [0, -1080]);
  const b = Math.sin(Math.min(1, p) * Math.PI) * 42;
  return <AbsoluteFill style={{ transform: `translateX(${x}px) skewX(${en ? -8 * (1 - e) : 8 * e}deg)`, filter: `blur(${b}px)` }}>{ch}</AbsoluteFill>;
});
/** zoom-through: exiting scene zooms past camera, entering scene arrives from far */
export const zoomThrough = () => mk((p, en, ch) => {
  const e = ease(p);
  const s = en ? interpolate(e, [0, 1], [0.55, 1]) : interpolate(e, [0, 1], [1, 3.2]);
  const o = en ? interpolate(p, [0.35, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : interpolate(p, [0.4, 0.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${s})`, opacity: o, filter: `blur(${Math.sin(Math.min(1, p) * Math.PI) * 22}px)` }}>{ch}</AbsoluteFill>;
});
/** venetian-blind stripe wipe */
export const stripeWipe = () => mk((p, en, ch) => {
  if (!en) return ch;
  const n = 9, h = 1920 / n;
  const polys = Array.from({ length: n }, (_, i) => { const k = Math.min(1, Math.max(0, p * 1.6 - (i / n) * 0.6)); const y = i * h; return `0 ${y}px, 100% ${y}px, 100% ${y + h * k}px, 0 ${y + h * k}px`; });
  return <>{polys.map((pl, i) => <AbsoluteFill key={i} style={{ clipPath: `polygon(${pl})` }}>{ch}</AbsoluteFill>)}</>;
});
/** glitch cut: block displacement + RGB split */
export const glitchCut = () => mk((p, en, ch) => {
  const sw = p > 0.5 ? en : !en;
  const f = Math.floor(p * 12);
  const blocks = Array.from({ length: 7 }, (_, i) => ({ y: random(`gy${f}${i}`) * 1800, h: 40 + random(`gh${f}${i}`) * 200, dx: (random(`gx${f}${i}`) - 0.5) * 260 }));
  if (!sw) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "drop-shadow(14px 0 0 rgba(255,90,60,0.75)) drop-shadow(-14px 0 0 rgba(41,163,255,0.75))" }}>{ch}</AbsoluteFill>
      {blocks.map((b, i) => <AbsoluteFill key={i} style={{ clipPath: `inset(${b.y}px 0 ${Math.max(0, 1920 - b.y - b.h)}px 0)`, transform: `translateX(${b.dx}px)` }}>{ch}</AbsoluteFill>)}
    </AbsoluteFill>
  );
});
/** flat colour flash: one-two frames of full blue / coral / cream / yellow, then next scene */
export const flashCut = (color: string) => mk((p, en, ch) => en ? <>{ch}<AbsoluteFill style={{ background: color, opacity: p < 0.7 ? 1 - Math.max(0, p - 0.35) * 2.8 : 0 }} /></> : ch);
/** laser wipe: coral line reveals the next scene */
export const laserWipe = () => mk((p, en, ch) => {
  if (!en) return ch;
  const e = ease(p), y = e * 2100 - 90;
  return (<><AbsoluteFill style={{ clipPath: `polygon(0 0, 100% 0, 100% ${y - 80}px, 0 ${y + 80}px)` }}>{ch}</AbsoluteFill><div style={{ position: "absolute", left: -100, right: -100, top: y - 4, height: 10, background: C.coral, transform: "rotate(-4deg)", boxShadow: `0 0 30px 10px ${C.coral}aa`, opacity: p < 1 ? 1 : 0 }} /></>);
});
/** shape wipe: coloured tile scales up from a point and becomes the next bg */
export const shapeWipe = (k = 1) => mk((p, en, ch) => {
  const r = 2600 * ease(p);
  return en ? (<>
    <div style={{ position: "absolute", left: 540 - r - 70, top: 960 - r - 70, width: (r + 70) * 2, height: (r + 70) * 2, borderRadius: "50%", background: TILE[k], opacity: p < 0.98 ? 1 : 0 }} />
    <AbsoluteFill style={{ clipPath: `circle(${r}px at 540px 960px)` }}>{ch}</AbsoluteFill></>) : ch;
});
