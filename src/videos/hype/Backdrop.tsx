// The three.js layer: tile confetti in the four brand colours (instanced), a dot plane and a
// cursor light. Everything is posed from a single `f` prop, never from useFrame, so a still at any
// frame is reproducible. Post-processing is one composer for the whole film (see Hype.tsx);
// kicked by post.kick on no-GPU boxes (see CLAUDE.md).
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { Effect, BlendFunction } from "postprocessing";
import { Uniform, Vector2 } from "three";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { C } from "./brand";
import { hash } from "./motion";
import { GrainEffect } from "../bridge/lensblur";

// no cream: a near-white tile blooms into a blown-out blob over the type
const PALETTE = [C.blue, C.coral, C.yellow, C.green];

/** Instanced rounded tiles: a slow drift + a radial burst that resets on every impact. */
export const TileConfetti: React.FC<{ f: number; count?: number; burstF?: number; z?: number }> = ({ f, count = 150, burstF = 0, z = -6 }) => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: (hash(i, 1) - 0.5) * 26,
        y: (hash(i, 2) - 0.5) * 40,
        zz: z + hash(i, 3) * 8,
        a: hash(i, 4) * Math.PI * 2,
        sp: 0.004 + hash(i, 5) * 0.01,
        s: 0.14 + hash(i, 6) * 0.34,
        col: PALETTE[i % PALETTE.length],
        rot: hash(i, 7) * Math.PI,
      })),
    [count, z],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colour = useMemo(() => new THREE.Color(), []);
  const since = Math.max(0, f - burstF);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    data.forEach((p, i) => {
      const t = f;
      const r = since < 26 ? 1 + since * 0.09 * (0.4 + p.sp * 40) : 1 + 26 * 0.09 * (0.4 + p.sp * 40);
      const ang = p.a + t * p.sp;
      dummy.position.set(p.x * r * 0.35 + Math.cos(ang) * 2.2, p.y * 0.4 + Math.sin(ang * 1.3) * 1.4 - (since % 600) * 0.004, p.zz);
      dummy.rotation.set(p.rot + t * 0.006, p.rot * 1.7 + t * 0.008, ang);
      const sc = p.s * (since < 26 ? 1 - since / 40 : 1);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      colour.set(p.col);
      m.setColorAt(i, colour);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data, dummy, colour, f, since]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 0.34]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

/** A calm dot plane behind everything, drifting with the camera. */
export const DotPlane: React.FC<{ f: number }> = ({ f }) => {
  const tex = useMemo(() => {
    const s = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d")!;
    g.fillStyle = "rgba(255,255,255,0)";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "rgba(255,255,255,0.5)";
    g.beginPath();
    g.arc(s / 2, s / 2, 7, 0, Math.PI * 2);
    g.fill();
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(26, 46);
    t.offset.set(0, 0);
    return t;
  }, []);
  tex.offset.set((f * 0.0025) % 1, (f * 0.0018) % 1);
  return (
    <mesh position={[0, 0, -18]}>
      <planeGeometry args={[44, 78]} />
      <meshBasicMaterial map={tex} transparent opacity={0.07} depthWrite={false} />
    </mesh>
  );
};

/* ---------------- custom effects (transition shaders driven by uniforms, never useFrame) ---- */
const shiftFrag = /* glsl */ `
uniform vec2 amount;   // pixels
uniform float angle;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 off = amount / vec2(1080.0, 1920.0);
  float ca = cos(angle), sa = sin(angle);
  vec2 d = vec2(off.x * ca - off.y * sa, off.x * sa + off.y * ca);
  float r = texture2D(inputBuffer, uv + d).r;
  float g = texture2D(inputBuffer, uv).g;
  float b = texture2D(inputBuffer, uv - d).b;
  outputColor = vec4(r, g, b, inputColor.a);
}`;

/** Chromatic aberration / RGB split, in px, direction controlled by a transition uniform. */
export class ShiftEffect extends Effect {
  constructor(amount = 0, angle = 0) {
    super("ShiftEffect", shiftFrag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["amount", new Uniform(new Vector2(amount, amount))],
        ["angle", new Uniform(angle)],
      ]),
    });
  }
  set px(v: number) {
    (this.uniforms.get("amount")!.value as Vector2).set(v, v);
  }
  set dir(v: number) {
    this.uniforms.get("angle")!.value = v;
  }
}

const zoomFrag = /* glsl */ `
uniform float zoom;     // 0 = off, >0 = pull toward the centre
uniform float blur;     // radial blur strength
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 c = vec2(0.5);
  vec2 dir = (uv - c) * zoom;
  vec3 acc = vec3(0.0);
  const int N = 10;
  for (int i = 0; i < N; i++) {
    float t = float(i) / float(N - 1);
    acc += texture2D(inputBuffer, uv - dir * t * blur).rgb;
  }
  outputColor = vec4(acc / float(N), inputColor.a);
}`;

/** Radial (zoom-through) blur for the zoom transitions. */
export class ZoomBlurEffect extends Effect {
  constructor() {
    super("ZoomBlurEffect", zoomFrag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([["zoom", new Uniform(0)], ["blur", new Uniform(0.5)]]),
    });
  }
  set values({ zoom, blur }: { zoom: number; blur: number }) {
    this.uniforms.get("zoom")!.value = zoom;
    this.uniforms.get("blur")!.value = blur;
  }
}

const glitchFrag = /* glsl */ `
uniform float amount;    // 0..1
uniform float seed;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // block displacement: 12 horizontal bands, each snapped by a random offset
  float band = floor(uv.y * 14.0);
  float r = h(vec2(band, floor(seed)));
  float shift = (r - 0.5) * 0.16 * amount;
  vec2 uv2 = vec2(fract(uv.x + shift), uv.y);
  float split = 0.012 * amount;
  float rr = texture2D(inputBuffer, uv2 + vec2(split, 0.0)).r;
  float gg = texture2D(inputBuffer, uv2).g;
  float bb = texture2D(inputBuffer, uv2 - vec2(split, 0.0)).b;
  vec3 c = vec3(rr, gg, bb);
  // scanline dropout
  float drop = step(0.86, h(vec2(floor(uv.y * 90.0), floor(seed * 0.5))));
  c *= 1.0 - drop * 0.55 * amount;
  outputColor = vec4(c, inputColor.a);
}`;

export class GlitchEffect extends Effect {
  constructor() {
    super("GlitchEffect", glitchFrag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([["amount", new Uniform(0)], ["seed", new Uniform(0)]]),
    });
  }
  set values({ amount, seed }: { amount: number; seed: number }) {
    this.uniforms.get("amount")!.value = amount;
    this.uniforms.get("seed")!.value = seed;
  }
}

/** Bloom + CA + glitch + zoom blur in one composer (order: bloom -> CA -> zoom -> glitch -> grain). */
/** `off` renders the WebGL layer without the composer (debug stills on software GL) */
export const Post: React.FC<{
  ca: { px: number; angle: number };
  glitch: { amount: number; seed: number };
  zoom: { zoom: number; blur: number };
  grainSeed: number;
  grainOn?: boolean;
  off?: boolean;
}> = ({ ca, glitch, zoom, grainSeed, grainOn = true, off = false }) => {
  const { size } = useThree();
  const shift = useMemo(() => new ShiftEffect(0), []);
  const gl = useMemo(() => new GlitchEffect(), []);
  const zb = useMemo(() => new ZoomBlurEffect(), []);
  const grain = useMemo(() => new GrainEffect({ amount: 0.035, cellPx: 1.6 }), []);
  shift.px = ca.px;
  shift.dir = ca.angle;
  gl.values = glitch;
  zb.values = zoom;
  grain.seed = grainSeed;
  void size;
  if (off) return null;
  // No bloom pass: it is applied to the whole transparent layer, so it also softens the type that
  // sits under it. The brand glow is done in the DOM (radial gradients on the logo beats).
  if (ca.px === 0 && glitch.amount === 0 && zoom.zoom === 0) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <primitive object={shift} dispose={null} />
      <primitive object={zb} dispose={null} />
      <primitive object={gl} dispose={null} />
      {grainOn ? <primitive object={grain} dispose={null} /> : null}
    </EffectComposer>
  );
};

/** software-GL aid (see CLAUDE.md): with the composer mounted, Remotion's manual advance can render
 * before the composer exists, which gives a blank frame. One delayed extra advance per frame fixes it. */
export const Kick: React.FC = () => {
  const f = useCurrentFrame();
  const { advance } = useThree();
  React.useEffect(() => {
    const h = delayRender("hype kick");
    const t = setTimeout(() => {
      advance(performance.now());
      continueRender(h);
    }, 260);
    return () => {
      clearTimeout(t);
      continueRender(h);
    };
  }, [f, advance]);
  return null;
};

/** camera: slow push + shake on impacts, all from f */
export const CamRig: React.FC<{ f: number; shake: number; bg?: string; transparent?: boolean }> = ({ f, shake, bg, transparent }) => {
  const { camera, scene } = useThree();
  const bgc = bg === "cream" || bg === "yellow" ? C.cream : bg === "coral" ? C.coral : bg === "blue" ? C.blue : C.indigo;
  useLayoutEffect(() => {
    scene.background = transparent ? null : new THREE.Color(bgc);
    const s = shake * 0.35;
    camera.position.set(Math.sin(f * 0.031) * 0.5 + (hash(f, 1) - 0.5) * s, Math.cos(f * 0.027) * 0.35 + (hash(f, 2) - 0.5) * s, 12 - (f % 90) * 0.004);
    camera.lookAt(0, 0, 0);
  }, [camera, scene, f, shake, bgc, transparent]);
  return null;
};
