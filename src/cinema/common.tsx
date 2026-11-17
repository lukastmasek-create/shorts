import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { ENTRANCE_EASE, EXIT_EASE } from "../lib/ease";

/* ------------------------------------------------------------------ fonts */

/** Blocks the render until the given CSS font specs are decoded; returns true once canvas text can be drawn. */
export function useFontsReady(specs: string[]): boolean {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("cinema-fonts"));
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
      setTimeout(() => continueRender(handle), 60);
    };
    if (typeof document === "undefined" || !document.fonts) {
      finish();
      return;
    }
    Promise.all(specs.map((s) => document.fonts.load(s, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")))
      .then(() => document.fonts.ready)
      .then(finish)
      .catch(finish);
    const t = setTimeout(finish, 20000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ready;
}

export const CF = {
  anton: "Anton",
  archivo: "Archivo Black",
  serif: "Newsreader",
  mono: "JetBrains Mono",
  sans: "Inter",
} as const;

/* ------------------------------------------------------------- camera rig */

export function makeTrack(ts: number[], vs: number[][]): (t: number) => number[] {
  const n = ts.length;
  const m = vs.map((_, i) => {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const dt = ts[b] - ts[a];
    return vs[0].map((__, k) => (dt === 0 ? 0 : (vs[b][k] - vs[a][k]) / dt));
  });
  return (t: number) => {
    if (t <= ts[0]) return vs[0].slice();
    if (t >= ts[n - 1]) return vs[n - 1].slice();
    let i = 0;
    while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const s = (t - ts[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    return vs[i].map((_, k) => h00 * vs[i][k] + h10 * h * m[i][k] + h01 * vs[i + 1][k] + h11 * h * m[i + 1][k]);
  };
}

export interface CamKey {
  f: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov?: number;
  /** degrees */
  roll?: number;
}

/** C1-continuous camera path through keyframes (position, look-at, fov, roll) + subtle handheld drift. */
export const CameraRig: React.FC<{ keys: CamKey[]; shake?: number }> = ({ keys, shake = 0.035 }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const track = useMemo(
    () =>
      makeTrack(
        keys.map((k) => k.f),
        keys.map((k) => [...k.pos, ...k.look, k.fov ?? 40, k.roll ?? 0])
      ),
    [keys]
  );
  useLayoutEffect(() => {
    const v = track(frame);
    const t = frame * 0.021;
    const sx = noise2D("cam-x", t, 0) * shake;
    const sy = noise2D("cam-y", t, 9) * shake;
    const sz = noise2D("cam-z", t, 17) * shake * 0.6;
    camera.position.set(v[0] + sx, v[1] + sy, v[2] + sz);
    const roll = ((v[7] + noise2D("cam-r", t, 3) * shake * 8) * Math.PI) / 180;
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(v[3] + sx * 0.4, v[4] + sy * 0.4, v[5]);
    camera.fov = v[6];
    camera.updateProjectionMatrix();
  });
  return null;
};

/* ------------------------------------------------------- studio reflection */

export interface EnvPanel {
  pos: [number, number, number];
  size: [number, number];
  color: string;
  intensity: number;
}

/** Procedural studio environment (dark room + emissive light cards). Gives chrome/glass real reflections, no HDR download. */
export const StudioEnv: React.FC<{ panels: EnvPanel[]; spin?: number; base?: string; intensity?: number }> = ({
  panels,
  spin = 0.012,
  base = "#060608",
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const env = new THREE.Scene();
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(24, 24, 24),
      new THREE.MeshBasicMaterial({ color: base, side: THREE.BackSide })
    );
    env.add(room);
    for (const p of panels) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(p.size[0], p.size[1]),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(p.color).multiplyScalar(p.intensity),
          side: THREE.DoubleSide,
          toneMapped: false,
        })
      );
      m.position.set(...p.pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    }
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(env, 0.035);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    pm.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene, panels, base, intensity]);
  useLayoutEffect(() => {
    scene.environmentRotation.set(0, frame * spin, 0);
  });
  return null;
};

/* --------------------------------------------------------- 3D text planes */

export interface TextTexOpts {
  font: string;
  px: number;
  color?: string;
  /** letter-spacing in px */
  tracking?: number;
  /** outline only */
  outline?: number;
  italic?: boolean;
  weight?: number;
}

export function makeTextTexture(text: string, o: TextTexOpts): { tex: THREE.CanvasTexture; aspect: number } {
  const pad = Math.round(o.px * 0.25);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  const font = `${o.italic ? "italic " : ""}${o.weight ?? 400} ${o.px}px "${o.font}"`;
  ctx.font = font;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.tracking ?? 0}px`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = Math.ceil(o.px * 1.35) + pad;
  c.width = Math.min(8192, w);
  c.height = h;
  const ctx2 = c.getContext("2d")!;
  ctx2.font = font;
  (ctx2 as unknown as { letterSpacing: string }).letterSpacing = `${o.tracking ?? 0}px`;
  ctx2.textBaseline = "middle";
  ctx2.textAlign = "left";
  ctx2.lineJoin = "round";
  const col = o.color ?? "#ffffff";
  if (o.outline) {
    ctx2.strokeStyle = col;
    ctx2.lineWidth = o.outline;
    ctx2.strokeText(text, pad, h / 2 + o.px * 0.02);
  } else {
    ctx2.fillStyle = col;
    ctx2.fillText(text, pad, h / 2 + o.px * 0.02);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return { tex, aspect: c.width / c.height };
}

export interface TextPlaneProps extends TextTexOpts {
  text: string;
  /** world height of the plane */
  height: number;
  position: [number, number, number];
  opacity?: number;
  /** >1 pushes the colour into HDR so bloom picks it up */
  gain?: number;
  scale?: number;
  rotation?: [number, number, number];
  ready: boolean;
}

export const TextPlane: React.FC<TextPlaneProps> = ({
  text,
  height,
  position,
  opacity = 1,
  gain = 1,
  scale = 1,
  rotation,
  ready,
  ...o
}) => {
  const made = useMemo(
    () => (ready ? makeTextTexture(text, o) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, text, o.font, o.px, o.color, o.tracking, o.outline, o.italic, o.weight]
  );
  if (!made || opacity <= 0.001) return null;
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[height * made.aspect, height]} />
      <meshBasicMaterial
        map={made.tex}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        color={new THREE.Color(gain, gain, gain)}
      />
    </mesh>
  );
};

/** Soft round sprite used by glow cards + particles. */
export function makeSoftSprite(size = 128): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.55)");
  gr.addColorStop(0.6, "rgba(255,255,255,0.12)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------ kinetic type */

export interface KTextProps {
  text: string;
  start: number;
  end: number;
  size: number;
  font: string;
  color?: string;
  weight?: number;
  italic?: boolean;
  /** [from, to] tracking in em: type tightens as it lands */
  tracking?: [number, number];
  stagger?: number;
  glow?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  style?: React.CSSProperties;
  /** accent colour for every nth letter range e.g. [from,to] indices */
  accent?: { from: number; to: number; color: string };
}

/** Per-letter masked rise + blur + tracking-settle entrance; staggered rise-out exit. */
export const KText: React.FC<KTextProps> = ({
  text,
  start,
  end,
  size,
  font,
  color = "#fff",
  weight = 400,
  italic,
  tracking = [0.22, -0.01],
  stagger = 1.6,
  glow,
  align = "left",
  lineHeight = 1,
  style,
  accent,
}) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  if (frame < start - 1 || frame > end + 30) return null;
  const inDur = 18;
  const outDur = 12;
  const settle = interpolate(frame, [start, start + inDur + chars.length * stagger + 6], [tracking[0], tracking[1]], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const jc = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: jc,
        overflow: "hidden",
        paddingTop: size * 0.06,
        paddingBottom: size * 0.16,
        marginBottom: -size * 0.1,
        marginTop: -size * 0.04,
        fontFamily: `"${font}", Impact, sans-serif`,
        fontSize: size,
        lineHeight,
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        letterSpacing: `${settle}em`,
        whiteSpace: "pre",
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const pin = interpolate(frame, [start + i * stagger, start + i * stagger + inDur], [0, 1], {
          easing: ENTRANCE_EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const pout = interpolate(frame, [end + i * stagger * 0.6, end + i * stagger * 0.6 + outDur], [0, 1], {
          easing: EXIT_EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = (1 - pin) * 112 - pout * 112;
        const blur = (1 - pin) * 14 + pout * 10;
        const isAcc = accent && i >= accent.from && i <= accent.to;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${y.toFixed(2)}%) rotate(${((1 - pin) * 4).toFixed(2)}deg)`,
              filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
              opacity: Math.min(1, pin * 1.6) * (1 - pout),
              color: isAcc ? accent!.color : color,
              textShadow: glow ? `0 0 ${size * 0.18}px ${glow}` : undefined,
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </div>
  );
};

/** Fade/blur wrapper for small supporting UI. */
export const FadeBlock: React.FC<{ start: number; end: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  start,
  end,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [start, start + 14, end, end + 10], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (a <= 0.001) return null;
  return (
    <div style={{ opacity: a, filter: `blur(${(1 - a) * 8}px)`, transform: `translateY(${(1 - a) * 14}px)`, ...style }}>
      {children}
    </div>
  );
};

export const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
