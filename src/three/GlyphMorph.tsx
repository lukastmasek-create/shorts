import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { interpolate, useCurrentFrame } from "remotion";
import { noise3D } from "@remotion/noise";
import { ENTRANCE_EASE } from "../lib/ease";
import { seededFloat, seededSigned } from "../lib/seed";

export interface GlyphMorphProps {
  /** Text whose glyph silhouettes are sampled via offscreen canvas */
  text: string;
  /** Frame when particles detach from incoming trail and begin morphing */
  startFrame: number;
  /** Frames required to coalesce onto glyph targets */
  morphDuration?: number;
  /** Frame when settled glyph particles smoothly fade into crisp HTML text */
  fadeOutStart: number;
  fadeOutDuration?: number;
  /** World-space center of the sampled text block */
  targetCenter?: [number, number, number];
  /** World-space width of the sampled text block */
  worldWidth?: number;
  /** Incoming trail curve control points */
  trailPoints?: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  particleCount?: number;
  seed?: string;
}

function sampleTextGlyphPoints(
  text: string,
  count: number,
  worldWidth: number,
  seed: string
): Array<[number, number]> {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 68px "Newsreader", Georgia, serif';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const candidates: Array<[number, number]> = [];
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const alpha = img[(y * canvas.width + x) * 4 + 3];
          if (alpha > 110) {
            const nx = (x / canvas.width - 0.5) * worldWidth;
            const ny = (0.5 - y / canvas.height) * (worldWidth * (canvas.height / canvas.width));
            candidates.push([nx, ny]);
          }
        }
      }

      if (candidates.length > 0) {
        return Array.from({ length: count }, (_, i) => {
          const idx = Math.floor(
            seededFloat(`${seed}:pick:${i}`, 0, candidates.length - 0.001)
          );
          const base = candidates[idx];
          return [
            base[0] + seededSigned(`${seed}:jx:${i}`, 0.006),
            base[1] + seededSigned(`${seed}:jy:${i}`, 0.006),
          ];
        });
      }
    }
  }

  // Deterministic procedural fallback if offscreen 2D context is unavailable
  return Array.from({ length: count }, (_, i) => {
    const u = (i / Math.max(1, count - 1)) - 0.5;
    return [
      u * worldWidth * 0.85,
      seededSigned(`${seed}:fby:${i}`, worldWidth * 0.06),
    ];
  });
}

/**
 * <GlyphMorph> — InstancedMesh of glowing ember particles sampled from text via offscreen canvas;
 * lerps deterministically from CubicBezierCurve3 trail points -> glyph points.
 */
export const GlyphMorph: React.FC<GlyphMorphProps> = ({
  text,
  startFrame,
  morphDuration = 22,
  fadeOutStart,
  fadeOutDuration = 12,
  targetCenter = [0, -0.18, 0.12],
  worldWidth = 1.55,
  trailPoints = [
    [1.15, 0.95, 0.25],
    [-0.75, 0.55, 0.35],
    [-0.85, -0.1, 0.22],
    [-0.45, -0.18, 0.12],
  ],
  particleCount = 520,
  seed = "glyph-morph",
}) => {
  const frame = useCurrentFrame();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const trailCurve = useMemo(
    () =>
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(...trailPoints[0]),
        new THREE.Vector3(...trailPoints[1]),
        new THREE.Vector3(...trailPoints[2]),
        new THREE.Vector3(...trailPoints[3])
      ),
    [trailPoints]
  );

  const particles = useMemo(() => {
    const glyphTargets = sampleTextGlyphPoints(text, particleCount, worldWidth, seed);
    const pt = new THREE.Vector3();

    return glyphTargets.map((target, i) => {
      const trailU = seededFloat(`${seed}:tu:${i}`, 0.12, 0.98);
      trailCurve.getPoint(trailU, pt);
      const source: [number, number, number] = [
        pt.x + seededSigned(`${seed}:sx:${i}`, 0.09),
        pt.y + seededSigned(`${seed}:sy:${i}`, 0.09),
        pt.z + seededSigned(`${seed}:sz:${i}`, 0.08),
      ];
      const delay = seededFloat(`${seed}:dl:${i}`, 0, 0.26);
      const radius = seededFloat(`${seed}:rad:${i}`, 0.008, 0.017);
      return { source, target, delay, radius };
    });
  }, [particleCount, seed, text, trailCurve, worldWidth]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(2.1, 1.18, 0.42),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  const visible =
    frame >= startFrame - 2 && frame <= fadeOutStart + fadeOutDuration + 1;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !visible) return;

    const rawMorph = interpolate(
      frame,
      [startFrame, startFrame + morphDuration],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const fadeIn = interpolate(frame, [startFrame - 2, startFrame + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fadeOut = interpolate(
      frame,
      [fadeOutStart, fadeOutStart + fadeOutDuration],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    material.opacity = fadeIn * fadeOut * 0.92;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const localT = Math.min(
        1,
        Math.max(0, (rawMorph - p.delay) / Math.max(0.01, 1 - p.delay))
      );
      const eased = ENTRANCE_EASE(localT);
      const swirlEnvelope = Math.sin(Math.PI * eased) * 0.14;

      const nx = noise3D(`${seed}:nx`, i * 0.09, frame * 0.04, 0) * swirlEnvelope;
      const ny = noise3D(`${seed}:ny`, i * 0.09, 0, frame * 0.04) * swirlEnvelope;

      const tx = targetCenter[0] + p.target[0];
      const ty = targetCenter[1] + p.target[1];
      const tz = targetCenter[2];

      const x = p.source[0] + (tx - p.source[0]) * eased + nx;
      const y = p.source[1] + (ty - p.source[1]) * eased + ny;
      const z = p.source[2] + (tz - p.source[2]) * eased;

      const s = p.radius * (1.25 - 0.42 * eased);
      dummy.position.set(x, y, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [
    dummy,
    fadeOutDuration,
    fadeOutStart,
    frame,
    material,
    morphDuration,
    particles,
    seed,
    startFrame,
    targetCenter,
    visible,
  ]);

  if (!visible) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particles.length]}
      material={material}
      frustumCulled={false}
    >
      <circleGeometry args={[1, 10]} />
    </instancedMesh>
  );
};
