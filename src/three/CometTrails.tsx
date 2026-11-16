import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { seededFloat, seededTuple3 } from "../lib/seed";

export interface CometArcSpec {
  id: string;
  startFrame: number;
  durationFrames: number;
  tailFraction: number;
  width: number;
  points: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
}

const SEGMENTS = 160;

const ribbonVert = /* glsl */ `
attribute float aCurveT;
attribute float aSide;
varying float vCurveT;
varying float vSide;

void main() {
  vCurveT = aCurveT;
  vSide = aSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ribbonFrag = /* glsl */ `
precision highp float;

varying float vCurveT;
varying float vSide;

uniform float uHeadT;
uniform float uTailT;
uniform float uOpacity;

void main() {
  float span = max(0.0001, uHeadT - uTailT);
  float along = clamp((vCurveT - uTailT) / span, 0.0, 1.0);

  // Soft across-ribbon profile + exponential tail falloff
  float across = pow(max(0.0, 1.0 - abs(vSide)), 1.75);
  float tailFade = pow(along, 2.35);

  vec3 cCrimson = vec3(0.75, 0.08, 0.01);
  vec3 cOrange = vec3(1.0, 0.48, 0.09);   // #FF7A18
  vec3 cAmber = vec3(1.15, 0.72, 0.28);   // #FFB347
  vec3 cHotHead = vec3(2.5, 1.85, 0.95);  // HDR core for Bloom

  vec3 col = mix(cCrimson, cOrange, smoothstep(0.0, 0.45, along));
  col = mix(col, cAmber, smoothstep(0.42, 0.85, along));
  col = mix(col, cHotHead, smoothstep(0.82, 1.0, along));

  float alpha = across * tailFade * uOpacity;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function buildHeadSpriteTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const center = (size - 1) * 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - center) / center;
      const dy = (y - center) / center;
      const r = Math.min(1, Math.hypot(dx, dy));
      const core = Math.pow(1 - r, 3.2);
      const halo = Math.pow(1 - r, 1.5) * 0.55;
      const v = Math.min(1, core + halo);
      const idx = (y * size + x) * 4;
      data[idx] = Math.round(255 * Math.min(1, v * 1.15));
      data[idx + 1] = Math.round(255 * Math.min(1, v * 0.82));
      data[idx + 2] = Math.round(255 * Math.min(1, v * 0.42));
      data[idx + 3] = Math.round(255 * v);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

function buildRibbonGeometry(
  curve: THREE.CubicBezierCurve3,
  halfWidth: number
): THREE.BufferGeometry {
  const vertCount = (SEGMENTS + 1) * 2;
  const positions = new Float32Array(vertCount * 3);
  const curveTs = new Float32Array(vertCount);
  const sides = new Float32Array(vertCount);
  const indices: number[] = [];

  const pt = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const viewAxis = new THREE.Vector3(0, 0, 1);
  const normal = new THREE.Vector3();

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    curve.getPoint(t, pt);
    curve.getTangent(t, tan);
    normal.crossVectors(tan, viewAxis);
    if (normal.lengthSq() < 1e-5) normal.set(0, 1, 0);
    normal.normalize();

    // Subtle taper along the curve ends
    const endTaper = 0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08));
    const w = halfWidth * endTaper;

    const i0 = i * 2;
    const i1 = i * 2 + 1;

    positions[i0 * 3] = pt.x + normal.x * w;
    positions[i0 * 3 + 1] = pt.y + normal.y * w;
    positions[i0 * 3 + 2] = pt.z + normal.z * w;
    curveTs[i0] = t;
    sides[i0] = 1;

    positions[i1 * 3] = pt.x - normal.x * w;
    positions[i1 * 3 + 1] = pt.y - normal.y * w;
    positions[i1 * 3 + 2] = pt.z - normal.z * w;
    curveTs[i1] = t;
    sides[i1] = -1;

    if (i < SEGMENTS) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aCurveT", new THREE.BufferAttribute(curveTs, 1));
  geo.setAttribute("aSide", new THREE.BufferAttribute(sides, 1));
  geo.setIndex(indices);
  return geo;
}

/**
 * Generates deterministic seeded looping Bezier arcs + signature choreographed comets for Style A.
 */
export function createEmberCometArcs(seed = "ember-comets"): CometArcSpec[] {
  const seededArcs: CometArcSpec[] = Array.from({ length: 6 }, (_, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const startFrame = 58 + i * 6;
    const durationFrames = Math.round(seededFloat(`${seed}:${i}:dur`, 32, 44));
    const p0: [number, number, number] = [
      -1.55 * dir,
      seededFloat(`${seed}:${i}:y0`, -1.3, 1.35),
      seededFloat(`${seed}:${i}:z0`, -0.35, 0.25),
    ];
    const p1 = seededTuple3(`${seed}:${i}:p1`, [
      [-1.1, 1.1],
      [-1.6, 1.6],
      [-0.4, 0.45],
    ]);
    const p2 = seededTuple3(`${seed}:${i}:p2`, [
      [-1.1, 1.1],
      [-1.4, 1.5],
      [-0.35, 0.45],
    ]);
    const p3: [number, number, number] = [
      1.55 * dir,
      seededFloat(`${seed}:${i}:y3`, -1.2, 1.25),
      seededFloat(`${seed}:${i}:z3`, -0.25, 0.3),
    ];

    return {
      id: `whip-${i}`,
      startFrame,
      durationFrames,
      tailFraction: 0.52,
      width: seededFloat(`${seed}:${i}:w`, 0.036, 0.062),
      points: [p0, p1, p2, p3],
    };
  });

  return [
    // 1.5 - 2.0s (45 - 60f): Comet sweeps across wordmark right -> left as letters clip away
    {
      id: "wordmark-sweep",
      startFrame: 44,
      durationFrames: 18,
      tailFraction: 0.55,
      width: 0.055,
      points: [
        [0.95, 0.06, 0.2],
        [0.35, 0.14, 0.3],
        [-0.35, -0.05, 0.25],
        [-1.35, -0.28, 0.0],
      ],
    },
    ...seededArcs,
    // 3.4 - 4.1s (102 - 123f): Trail arcs down into the prompt input card as characters begin typing
    {
      id: "prompt-type-dive",
      startFrame: 100,
      durationFrames: 24,
      tailFraction: 0.58,
      width: 0.05,
      points: [
        [1.25, 1.15, 0.15],
        [-0.85, 0.65, 0.35],
        [-0.95, -0.15, 0.25],
        [-0.58, -0.18, 0.1],
      ],
    },
    // 6.75 - 7.5s (202 - 225f): Final sweeping comet dissolving the UI into the editorial paragraph
    {
      id: "ui-dissolve-sweep",
      startFrame: 201,
      durationFrames: 24,
      tailFraction: 0.62,
      width: 0.068,
      points: [
        [-1.55, -0.85, 0.2],
        [-0.35, 0.55, 0.45],
        [0.45, -0.25, 0.35],
        [1.6, 0.95, 0.1],
      ],
    },
  ];
}

export interface CometTrailsProps {
  arcs: readonly CometArcSpec[];
}

interface CompiledComet {
  spec: CometArcSpec;
  curve: THREE.CubicBezierCurve3;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  spriteMaterial: THREE.SpriteMaterial;
}

/**
 * <CometTrails> — Tapered 3D Bezier ribbons with head position t=(frame-start)/dur,
 * tail controlled via geometry.setDrawRange(), vertex alpha falloff, and emissive additive head sprite.
 */
export const CometTrails: React.FC<CometTrailsProps> = ({ arcs }) => {
  const frame = useCurrentFrame();

  const headTexture = useMemo(() => buildHeadSpriteTexture(), []);

  const compiled = useMemo<CompiledComet[]>(() => {
    return arcs.map((spec) => {
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(...spec.points[0]),
        new THREE.Vector3(...spec.points[1]),
        new THREE.Vector3(...spec.points[2]),
        new THREE.Vector3(...spec.points[3])
      );
      const geometry = buildRibbonGeometry(curve, spec.width);
      const material = new THREE.ShaderMaterial({
        vertexShader: ribbonVert,
        fragmentShader: ribbonFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uHeadT: { value: 0 },
          uTailT: { value: 0 },
          uOpacity: { value: 0 },
        },
      });
      const spriteMaterial = new THREE.SpriteMaterial({
        map: headTexture,
        color: new THREE.Color(2.4, 1.55, 0.65),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      });

      return { spec, curve, geometry, material, spriteMaterial };
    });
  }, [arcs, headTexture]);

  useEffect(() => {
    return () => {
      headTexture.dispose();
      compiled.forEach((c) => {
        c.geometry.dispose();
        c.material.dispose();
        c.spriteMaterial.dispose();
      });
    };
  }, [compiled, headTexture]);

  const headPos = useMemo(() => new THREE.Vector3(), []);

  return (
    <group>
      {compiled.map((c) => {
        const totalWindow = c.spec.durationFrames * (1 + c.spec.tailFraction);
        const localFrame = frame - c.spec.startFrame;
        if (localFrame < 0 || localFrame > totalWindow) {
          c.geometry.setDrawRange(0, 0);
          return null;
        }

        const rawProgress = localFrame / c.spec.durationFrames;
        const headT = Math.min(1, Math.max(0, rawProgress));
        const tailT = Math.min(1, Math.max(0, rawProgress - c.spec.tailFraction));

        const startSeg = Math.max(0, Math.floor(tailT * SEGMENTS));
        const endSeg = Math.min(SEGMENTS, Math.ceil(headT * SEGMENTS));
        const indexCount = Math.max(0, (endSeg - startSeg) * 6);
        c.geometry.setDrawRange(startSeg * 6, indexCount);

        const enterFade = Math.min(1, localFrame / 4);
        const exitFade = Math.min(1, (totalWindow - localFrame) / 6);
        const opacity = Math.max(0, enterFade * exitFade);

        c.material.uniforms.uHeadT.value = headT;
        c.material.uniforms.uTailT.value = tailT;
        c.material.uniforms.uOpacity.value = opacity;

        c.curve.getPoint(headT, headPos);
        const headVisible = rawProgress <= 1.04 ? Math.max(0, 1 - Math.max(0, rawProgress - 0.92) / 0.12) : 0;
        c.spriteMaterial.opacity = opacity * headVisible;
        const headScale = c.spec.width * 5.4 * (0.85 + 0.15 * Math.sin(localFrame * 0.5));

        return (
          <group key={c.spec.id}>
            <mesh geometry={c.geometry} material={c.material} frustumCulled={false} />
            {headVisible > 0.01 && (
              <sprite
                position={[headPos.x, headPos.y, headPos.z + 0.02]}
                scale={[headScale, headScale, 1]}
                material={c.spriteMaterial}
              />
            )}
          </group>
        );
      })}
    </group>
  );
};
