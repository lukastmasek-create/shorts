import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ENTRANCE_EASE } from "../../lib/ease";
import { FONTS } from "../../lib/fonts";
import { Grain } from "../../fx/Grain";

/**
 * Framed showcase layout (1080x1920). The 3D scene lives in its own viewport; the header and the
 * title band are separate strips, so text can never overlap the picture.
 *
 *   0 .. 210      header strip (chapter name, timecode)
 *   210 .. 1500   3D viewport (1080 x 1290, aspect 0.84: wider than a phone-tall canvas, shows more of the set)
 *   1500 .. 1920  title / credit band
 */
export const VIEW_W = 1080;
export const VIEW_H = 1290;
export const VIEW_TOP = 210;
export const BAND_TOP = VIEW_TOP + VIEW_H;
export const VIEW_ASPECT = VIEW_W / VIEW_H;

export interface ShowcaseFrameProps {
  bg: string;
  ink: string;
  accent: string;
  left: string;
  right?: string;
  /** Total frames, for the closing fade. */
  total: number;
  /** Content of the lower band (title lockup, credits). */
  bottom: React.ReactNode;
  grain?: number;
  children: React.ReactNode;
}

export const ShowcaseFrame: React.FC<ShowcaseFrameProps> = ({ bg, ink, accent, left, right, total, bottom, grain = 0.04, children }) => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [0, 26], [50, 0], { easing: ENTRANCE_EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [total - 14, total - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const head = interpolate(frame, [8, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: bg, opacity: fade }}>
      <div style={{ position: "absolute", top: 92, left: 80, right: 80, display: "flex", justifyContent: "space-between", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 8, color: ink, opacity: head }}>
        <span>{left}</span>
        <span style={{ color: accent }}>{right}</span>
      </div>
      <div style={{ position: "absolute", left: 0, top: VIEW_TOP, width: VIEW_W, height: VIEW_H, overflow: "hidden", clipPath: `inset(${open}% 0 ${open}% 0)` }}>{children}</div>
      <div style={{ position: "absolute", left: 80, right: 80, top: VIEW_TOP - 1, height: 2, background: accent, opacity: 0.35 * head }} />
      <div style={{ position: "absolute", left: 80, right: 80, top: BAND_TOP - 1, height: 2, background: accent, opacity: 0.35 * head }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: BAND_TOP, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{bottom}</div>
      <Grain opacity={grain} seed="frame" />
    </AbsoluteFill>
  );
};

/** Soft blob shadow that grounds an object on a floor (cheap ambient occlusion). */
export const ContactShadow: React.FC<{ radius?: number; opacity?: number; y?: number; position?: [number, number, number] }> = ({ radius = 2, opacity = 0.6, y = 0.004, position = [0, 0, 0] }) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.45, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], position[1] + y, position[2]]} renderOrder={1}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} color="#000000" />
    </mesh>
  );
};
