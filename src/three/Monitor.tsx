import React, { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { CAMERA_EASE, ENTRANCE_EASE, UI_SPRING } from "../lib/ease";
import { beatPulse, GREEN_BEATS } from "../lib/beats";

const coneVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalView;
varying vec3 vViewPos;
void main() {
  vUv = uv;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mvPos.xyz;
  vNormalView = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPos;
}
`;

const coneFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec3 vNormalView;
varying vec3 vViewPos;
uniform float uIntensity;

void main() {
  vec3 viewDir = normalize(vViewPos);
  float edgeSoft = pow(abs(dot(vNormalView, viewDir)), 1.65);
  float axialFade = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
  float alpha = edgeSoft * axialFade * uIntensity;
  vec3 green = vec3(0.118, 0.843, 0.376); // #1ED760
  gl_FragColor = vec4(green * alpha * 1.4, alpha);
}
`;

function createRoundedSlabGeometry(
  w: number,
  h: number,
  depth: number,
  radius: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 16,
  });
  geo.center();
  return geo;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const TRACKS = [
  { title: "Solaris Tape", sub: "Midnight Club · Electronic", c1: "#1ED760", c2: "#0B3B22" },
  { title: "Velvet Static", sub: "Nora Vance · Indie Soul", c1: "#25A18E", c2: "#0F292E" },
  { title: "Afterglow FM", sub: "Kaito & Friends · Live Set", c1: "#4ADE80", c2: "#132A1E" },
  { title: "Subzero Drift", sub: "Analogue Dept · Ambient", c1: "#10B981", c2: "#0A221C" },
] as const;

const AVATARS = [
  { initials: "MY", name: "Maya", bg: "#15803D" },
  { initials: "LE", name: "Leo", bg: "#0F766E" },
  { initials: "SR", name: "Sara", bg: "#166534" },
  { initials: "KA", name: "Kai", bg: "#115E59" },
] as const;

function drawAppScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
  fps: number
) {
  // Base dark screen canvas (#070C08 -> #0B140E)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#0A130D");
  bgGrad.addColorStop(1, "#050906");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle moving green radial aura inside the app screen
  const auraX = w * (0.68 + Math.sin(frame * 0.04) * 0.08);
  const auraY = h * (0.22 + Math.cos(frame * 0.03) * 0.06);
  const aura = ctx.createRadialGradient(auraX, auraY, 10, auraX, auraY, w * 0.65);
  aura.addColorStop(0, "rgba(30, 215, 96, 0.16)");
  aura.addColorStop(1, "rgba(30, 215, 96, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, w, h);

  // Tab transition at 1.5s (frame 45): All -> Friends
  const tabShift = spring({
    frame: frame - 45,
    fps,
    config: UI_SPRING,
  });

  // Scroll + "Friends are live" card entrance (1.5s - 3.0s)
  const listScroll = interpolate(frame, [48, 72], [0, 1], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scrollVelocityBlur =
    Math.sin(
      Math.PI *
        interpolate(frame, [48, 72], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
    ) * 14;

  // Track-detail expansion (3.0s - 6.0s = frames 90..180)
  const detailMorph = interpolate(frame, [90, 114], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Top Pill Tabs Row (All / Friends / Podcasts) ---
  const topAlpha = 1 - detailMorph * 0.85;
  ctx.save();
  ctx.globalAlpha = topAlpha;
  const tabs = ["All", "Friends", "Podcasts"];
  const tabWidths = [128, 178, 206];
  let tabX = 56;
  const tabY = 62;
  const tabH = 62;

  tabs.forEach((label, idx) => {
    const tw = tabWidths[idx];
    const isAll = idx === 0;
    const isFriends = idx === 1;
    const activeAmt = isAll ? 1 - tabShift : isFriends ? tabShift : 0;

    roundRectPath(ctx, tabX, tabY, tw, tabH, 31);
    ctx.fillStyle =
      activeAmt > 0.5
        ? `rgba(30, 215, 96, ${(0.22 + 0.78 * activeAmt).toFixed(3)})`
        : "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    ctx.font = '600 26px "Inter", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = activeAmt > 0.55 ? "#050805" : "rgba(255,255,255,0.88)";
    ctx.fillText(label, tabX + tw / 2, tabY + tabH / 2 + 1);

    tabX += tw + 18;
  });
  ctx.restore();

  // --- Feed Layer (0 - 3.2s, crossfades into Track Detail at 3.0s) ---
  if (detailMorph < 0.99) {
    ctx.save();
    ctx.globalAlpha = 1 - detailMorph;
    const scrollOffsetY = -listScroll * 165;

    // "Friends are live" featured card sliding in at 1.65s (frame 50)
    const liveSpring = spring({
      frame: frame - 50,
      fps,
      config: UI_SPRING,
    });
    if (liveSpring > 0.01) {
      ctx.save();
      const cardY = 158 + (1 - liveSpring) * 72;
      ctx.globalAlpha = (1 - detailMorph) * Math.min(1, liveSpring * 1.15);
      roundRectPath(ctx, 56, cardY, w - 112, 248, 28);
      const cardGrad = ctx.createLinearGradient(56, cardY, w - 56, cardY + 248);
      cardGrad.addColorStop(0, "rgba(24, 58, 36, 0.96)");
      cardGrad.addColorStop(1, "rgba(12, 26, 17, 0.96)");
      ctx.fillStyle = cardGrad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(30, 215, 96, 0.45)";
      ctx.stroke();

      // Live green dot + header
      ctx.beginPath();
      ctx.arc(96, cardY + 48, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1ED760";
      ctx.fill();

      ctx.font = '600 28px "Inter", sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Friends are live", 118, cardY + 49);

      ctx.font = '500 22px "Inter", sans-serif';
      ctx.fillStyle = "#1ED760";
      ctx.fillText("4 listening now", w - 250, cardY + 49);

      // Stagger-popped friend avatars
      AVATARS.forEach((av, idx) => {
        const avPop = spring({
          frame: frame - (56 + idx * 4),
          fps,
          config: UI_SPRING,
        });
        if (avPop <= 0.01) return;
        const cx = 132 + idx * 188;
        const cy = cardY + 152;
        const r = 46 * avPop;

        // Green live ring
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#1ED760";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Avatar circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = av.bg;
        ctx.fill();

        ctx.font = `700 ${Math.max(12, Math.round(24 * avPop))}px "Inter", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(av.initials, cx, cy);

        ctx.font = '500 20px "Inter", sans-serif';
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.fillText(av.name, cx, cy + 68);
      });

      ctx.restore();
    }

    // Track Tiles Grid/List: scrolls smoothly below the "Friends are live" hero card
    const listStartY = 172 + liveSpring * 266;
    TRACKS.forEach((tr, i) => {
      const ty = listStartY + i * 206;
      if (ty < 90 || ty > h + 40) return;

      // Directional vertical motion blur ghosting during scroll
      const passes = scrollVelocityBlur > 2 ? 3 : 1;
      for (let p = 0; p < passes; p++) {
        const ghostOffset = (p - (passes - 1) / 2) * scrollVelocityBlur;
        ctx.save();
        ctx.globalAlpha = ((1 - detailMorph) / passes) * (passes > 1 ? 0.85 : 1);

        roundRectPath(ctx, 56, ty + ghostOffset, w - 112, 184, 26);
        ctx.fillStyle = "rgba(255, 255, 255, 0.055)";
        ctx.fill();

        // Album art square
        roundRectPath(ctx, 80, ty + 22 + ghostOffset, 140, 140, 18);
        const artGrad = ctx.createLinearGradient(80, ty + 22, 220, ty + 162);
        artGrad.addColorStop(0, tr.c1);
        artGrad.addColorStop(1, tr.c2);
        ctx.fillStyle = artGrad;
        ctx.fill();

        // Title & subtitle
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = '600 32px "Inter", sans-serif';
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(tr.title, 252, ty + 82 + ghostOffset);

        ctx.font = '500 23px "Inter", sans-serif';
        ctx.fillStyle = "rgba(255, 255, 255, 0.66)";
        ctx.fillText(tr.sub, 252, ty + 124 + ghostOffset);

        // Animated mini equalizer bars on right
        for (let b = 0; b < 4; b++) {
          const bh = 22 + 34 * (0.5 + 0.5 * Math.sin(frame * 0.22 + i * 1.4 + b * 1.1));
          roundRectPath(
            ctx,
            w - 148 + b * 16,
            ty + 118 - bh + ghostOffset,
            9,
            bh,
            4
          );
          ctx.fillStyle = "#1ED760";
          ctx.fill();
        }
        ctx.restore();
      }
    });
    ctx.restore();
  }

  // --- Track Detail Card (3.0s - 6.0s = frames 90..180) ---
  if (detailMorph > 0.01) {
    ctx.save();
    ctx.globalAlpha = detailMorph;
    const cardScale = 0.92 + 0.08 * detailMorph;
    ctx.translate(w / 2, h / 2);
    ctx.scale(cardScale, cardScale);
    ctx.translate(-w / 2, -h / 2);

    roundRectPath(ctx, 48, 84, w - 96, h - 148, 36);
    const detGrad = ctx.createLinearGradient(48, 84, 48, h - 64);
    detGrad.addColorStop(0, "#102417");
    detGrad.addColorStop(0.55, "#09130D");
    detGrad.addColorStop(1, "#060B08");
    ctx.fillStyle = detGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(30, 215, 96, 0.35)";
    ctx.stroke();

    // Header badge: Maya is playing live
    ctx.beginPath();
    ctx.arc(106, 152, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#15803D";
    ctx.fill();
    ctx.strokeStyle = "#1ED760";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '600 25px "Inter", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Maya + 3 friends listening", 150, 146);
    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillStyle = "#1ED760";
    ctx.fillText("LIVE SESSION · 02:14", 150, 178);

    // Track Hero Art + Title
    roundRectPath(ctx, 88, 224, 172, 172, 24);
    const heroArt = ctx.createLinearGradient(88, 224, 260, 396);
    heroArt.addColorStop(0, "#1ED760");
    heroArt.addColorStop(1, "#0B3B22");
    ctx.fillStyle = heroArt;
    ctx.fill();

    ctx.font = '700 42px "Inter", sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Solaris Tape", 292, 290);
    ctx.font = '500 26px "Inter", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("Midnight Club", 292, 338);

    // Animated 28-bar waveform
    const bars = 28;
    const waveX0 = 88;
    const waveW = w - 176;
    const barStep = waveW / bars;
    const playhead = interpolate(frame, [90, 180], [0.42, 0.74], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    for (let b = 0; b < bars; b++) {
      const u = b / bars;
      const amp =
        28 +
        58 *
          Math.abs(
            Math.sin(b * 0.62 + frame * 0.14) * Math.cos(b * 0.27 - frame * 0.08)
          );
      roundRectPath(
        ctx,
        waveX0 + b * barStep,
        476 - amp / 2,
        barStep * 0.58,
        amp,
        5
      );
      ctx.fillStyle = u <= playhead ? "#1ED760" : "rgba(255,255,255,0.22)";
      ctx.fill();
    }

    // Reactions row (vector Canvas icons — zero OS emoji font dependency)
    const reactPulse = frame >= 146 ? spring({ frame: frame - 146, fps, config: UI_SPRING }) : 0;
    const reactions = [
      { kind: "heart" as const, count: 28 + (frame >= 148 ? 1 : 0), active: true },
      { kind: "flame" as const, count: 12, active: false },
      { kind: "bolt" as const, count: 9, active: false },
    ];
    let rx = 88;
    reactions.forEach((rc, idx) => {
      const rw = 148;
      const boost = idx === 0 ? 1 + 0.08 * Math.sin(Math.PI * Math.min(1, reactPulse)) : 1;
      ctx.save();
      ctx.translate(rx + rw / 2, 588);
      ctx.scale(boost, boost);
      roundRectPath(ctx, -rw / 2, -28, rw, 56, 28);
      ctx.fillStyle = rc.active
        ? "rgba(30, 215, 96, 0.22)"
        : "rgba(255, 255, 255, 0.08)";
      ctx.fill();
      if (rc.active) {
        ctx.strokeStyle = "#1ED760";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Vector icon on left of pill
      ctx.save();
      ctx.translate(-30, 0);
      if (rc.kind === "heart") {
        ctx.fillStyle = "#1ED760";
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(-14, -2, -14, -12, -6, -12);
        ctx.bezierCurveTo(-2, -12, 0, -8, 0, -6);
        ctx.bezierCurveTo(0, -8, 2, -12, 6, -12);
        ctx.bezierCurveTo(14, -12, 14, -2, 0, 10);
        ctx.fill();
      } else if (rc.kind === "flame") {
        ctx.fillStyle = "#FFB347";
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.quadraticCurveTo(11, -3, 8, 7);
        ctx.quadraticCurveTo(4, 13, 0, 12);
        ctx.quadraticCurveTo(-8, 12, -9, 3);
        ctx.quadraticCurveTo(-10, -5, 0, -13);
        ctx.fill();
      } else {
        ctx.fillStyle = "#1ED760";
        ctx.beginPath();
        ctx.moveTo(3, -13);
        ctx.lineTo(-9, 2);
        ctx.lineTo(-1, 2);
        ctx.lineTo(-4, 13);
        ctx.lineTo(9, -2);
        ctx.lineTo(1, -2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.font = '600 24px "Inter", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(String(rc.count), -6, 2);
      ctx.restore();
      rx += rw + 18;
    });

    // Comments feed
    const comments = [
      { author: "Leo", body: "That synth drop at 02:10 hits different", delay: 98 },
      { author: "Sara", body: "On repeat all evening honestly", delay: 108 },
      { author: "Kai", body: "Turn the bass up on this part", delay: 118 },
    ];
    comments.forEach((cm, idx) => {
      const cp = interpolate(frame, [cm.delay, cm.delay + 12], [0, 1], {
        easing: ENTRANCE_EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      if (cp <= 0.01) return;
      const cy = 692 + idx * 104 + (1 - cp) * 24;
      ctx.save();
      ctx.globalAlpha = detailMorph * cp;
      roundRectPath(ctx, 88, cy, w - 176, 86, 20);
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.fill();

      ctx.font = '600 23px "Inter", sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#1ED760";
      ctx.fillText(cm.author, 116, cy + 34);

      ctx.font = '400 23px "Inter", sans-serif';
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(cm.body, 116, cy + 64);
      ctx.restore();
    });

    // Comment composer bar + small green round send-button appearing at right
    const barY = 1042;
    roundRectPath(ctx, 88, barY, w - 268, 76, 38);
    ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
    ctx.fill();

    const typedReply = "Drop is unreal — instant classic";
    const replyChars = Math.floor(
      interpolate(frame, [114, 140], [0, typedReply.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = replyChars > 0 ? "#FFFFFF" : "rgba(255,255,255,0.48)";
    ctx.fillText(
      replyChars > 0 ? typedReply.slice(0, replyChars) : "Add a live reaction...",
      124,
      barY + 38
    );

    // Small green round send-button appears at right (frame 122)
    const sendPop = spring({
      frame: frame - 122,
      fps,
      config: UI_SPRING,
    });
    if (sendPop > 0.01) {
      const btnX = w - 126;
      const btnY = barY + 38;
      const tapScale =
        frame >= 144 && frame <= 154
          ? 1 - 0.14 * Math.sin(Math.PI * ((frame - 144) / 10))
          : 1;
      const rad = 38 * sendPop * tapScale;

      ctx.save();
      ctx.shadowColor = "rgba(30, 215, 96, 0.75)";
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(btnX, btnY, Math.max(1, rad), 0, Math.PI * 2);
      ctx.fillStyle = "#1ED760";
      ctx.fill();
      ctx.restore();

      // Crisp send arrow glyph
      ctx.save();
      ctx.translate(btnX, btnY);
      ctx.scale(sendPop * tapScale, sendPop * tapScale);
      ctx.strokeStyle = "#050805";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-11, 2);
      ctx.lineTo(11, -10);
      ctx.lineTo(3, 12);
      ctx.lineTo(-1, 3);
      ctx.closePath();
      ctx.fillStyle = "#050805";
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

export interface MonitorProps {
  /** Overall visibility multiplier (fades smoothly during caption section) */
  visibility?: number;
}

/**
 * <Monitor> — Dark slat-wall room, RoundedBox monitor with per-frame CanvasTexture UI,
 * pulsing +/-8% green orb, green PointLight, volumetric light cone, dolly z: 6 -> 5.2 + 2x detail zoom.
 */
export const Monitor: React.FC<MonitorProps> = ({ visibility = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();

  const slabGeo = useMemo(() => createRoundedSlabGeometry(1.94, 2.58, 0.08, 0.11), []);

  const screenSurface = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return { canvas, ctx, texture };
  }, []);

  const coneMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coneVert,
        fragmentShader: coneFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uIntensity: { value: 0.22 },
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      slabGeo.dispose();
      screenSurface?.texture.dispose();
      coneMat.dispose();
    };
  }, [coneMat, screenSurface, slabGeo]);

  // Orb +/-8% harmonic pulse + 6% beat boost
  const beatBoost = beatPulse(frame, GREEN_BEATS, 0.06);
  const orbWave = 1 + 0.08 * Math.sin((frame / fps) * Math.PI * 1.6);
  const orbScale = orbWave * beatBoost;

  // Slight dolly z: 6 -> 5.2 across 0-3s, then smooth 2x punch-in on track detail (3-6s), easing back
  const baseDollyZ = interpolate(frame, [0, 90], [6.0, 5.2], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const detailZoomIn = interpolate(frame, [90, 118], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const detailZoomOut = interpolate(frame, [168, 186], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoomAmt = detailZoomIn * (1 - detailZoomOut);

  useLayoutEffect(() => {
    if (screenSurface?.ctx) {
      drawAppScreen(
        screenSurface.ctx,
        screenSurface.canvas.width,
        screenSurface.canvas.height,
        frame,
        fps
      );
      screenSurface.texture.needsUpdate = true;
    }

    const cam = camera as THREE.PerspectiveCamera;
    const targetZ = baseDollyZ - zoomAmt * 1.38;
    const targetX = zoomAmt * 0.02 + Math.sin(frame * 0.018) * 0.04;
    const targetY = zoomAmt * -0.14 + Math.cos(frame * 0.015) * 0.03;
    const rollRad = (noise2D("green-cam-roll", frame * 0.022, 0) * 0.3 * Math.PI) / 180;

    cam.position.set(targetX, targetY, targetZ);
    cam.lookAt(zoomAmt * 0.02, zoomAmt * -0.12, 0);
    cam.rotation.z += rollRad;
    cam.updateProjectionMatrix();

    coneMat.uniforms.uIntensity.value = 0.2 * orbWave * visibility;
  }, [baseDollyZ, camera, coneMat, fps, frame, orbWave, screenSurface, visibility, zoomAmt]);

  // 26 architectural warm-black vertical slats in background (z = -2.35, blurred by Bokeh DOF)
  const slats = useMemo(() => Array.from({ length: 26 }, (_, i) => (i - 12.5) * 0.22), []);

  return (
    <group visible={visibility > 0.005}>
      <ambientLight intensity={0.42 * visibility} color="#1E3024" />
      <directionalLight
        position={[-2.8, 3.2, 2.4]}
        intensity={0.95 * visibility}
        color="#D7F5E3"
      />
      {/* Rim light grazing the architectural vertical slat wall */}
      <pointLight
        position={[-1.1, 1.2, -1.2]}
        color="#38E078"
        intensity={2.4 * visibility}
        distance={7.5}
        decay={1.5}
      />
      {/* Green PointLight pulsing in sync with screen & orb */}
      <pointLight
        position={[0.55, -0.65, 1.45]}
        color="#1ED760"
        intensity={3.4 * orbScale * visibility}
        distance={9.5}
        decay={1.6}
      />

      {/* Vertical Slat Wall (warm-black dark room background for shallow DOF) */}
      <group position={[0, 0, -2.35]}>
        <mesh position={[0, 0, -0.12]}>
          <planeGeometry args={[6.8, 9.6]} />
          <meshStandardMaterial color="#030503" roughness={0.94} metalness={0.05} />
        </mesh>
        {slats.map((x, idx) => (
          <mesh key={idx} position={[x, 0, 0]}>
            <boxGeometry args={[0.125, 8.8, 0.16]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? "#131C15" : "#0F1711"}
              roughness={0.46}
              metalness={0.32}
            />
          </mesh>
        ))}
      </group>

      {/* Minimal Dark Monitor RoundedBox Slab */}
      <group position={[0, 0.08, 0]}>
        <mesh geometry={slabGeo}>
          <meshStandardMaterial
            color="#0B110D"
            roughness={0.34}
            metalness={0.48}
          />
        </mesh>

        {/* Emissive CanvasTexture Screen */}
        <mesh position={[0, 0, 0.061]}>
          <planeGeometry args={[1.82, 2.43]} />
          <meshBasicMaterial
            map={screenSurface?.texture ?? null}
            toneMapped={false}
            transparent
            opacity={visibility}
          />
        </mesh>

        {/* Soft Volumetric Green Light Cone spilling from screen */}
        <mesh
          position={[0.08, -0.35, 0.85]}
          rotation={[Math.PI * 0.42, 0, -0.08]}
          material={coneMat}
        >
          <cylinderGeometry args={[0.88, 1.85, 2.6, 40, 1, true]} />
        </mesh>
      </group>

      {/* Soft Green Glowing Orb bottom-right (MeshBasicMaterial + Bloom, pulses +/-8%) */}
      <group position={[0.82, -1.24, 0.42]} scale={orbScale}>
        <mesh>
          <sphereGeometry args={[0.19, 32, 32]} />
          <meshBasicMaterial
            color={new THREE.Color(0.24, 1.72, 0.78)}
            transparent
            opacity={0.95 * visibility}
          />
        </mesh>
        <mesh scale={1.65}>
          <sphereGeometry args={[0.19, 24, 24]} />
          <meshBasicMaterial
            color="#1ED760"
            transparent
            opacity={0.18 * visibility}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
};
