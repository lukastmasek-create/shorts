import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { PostFX } from "../../three/PostFX";
import { Grain } from "../../fx/Grain";
import { useStudioFonts } from "../../lib/fonts";
import { CameraRig, CamKey, CF, FadeBlock, KText, makeSoftSprite, smooth, useFontsReady } from "../../cinema/common";

export const PARTICLE_MORPH_FRAMES = 360;

const N = 38000;

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function buildShapes(textPts: Array<[number, number]> | null): Float32Array[] {
  const r = rng(42);
  const mk = () => new Float32Array(N * 3);
  const cloud = mk(), sphere = mk(), torus = mk(), helix = mk(), text = mk(), galaxy = mk(), loop = mk();
  for (let i = 0; i < N; i++) {
    const o = i * 3;
    // 0 scattered cloud (gaussian-ish)
    const cr = 2.2 + r() * 2.2;
    const cu = r() * 2 - 1;
    const ca = r() * Math.PI * 2;
    cloud[o] = Math.sqrt(1 - cu * cu) * Math.cos(ca) * cr;
    cloud[o + 1] = cu * cr * 0.8;
    cloud[o + 2] = Math.sqrt(1 - cu * cu) * Math.sin(ca) * cr;
    // 1 fibonacci sphere shell
    const y = 1 - (i + 0.5) * (2 / N);
    const rr = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    const sr = 1.55 * (0.985 + r() * 0.03);
    sphere[o] = Math.cos(th) * rr * sr;
    sphere[o + 1] = y * sr;
    sphere[o + 2] = Math.sin(th) * rr * sr;
    // 2 torus (axis y)
    const u = r() * Math.PI * 2;
    const v = r() * Math.PI * 2;
    const R = 1.55;
    const tr = 0.55 * (0.96 + r() * 0.08);
    torus[o] = (R + tr * Math.cos(v)) * Math.cos(u);
    torus[o + 1] = tr * Math.sin(v);
    torus[o + 2] = (R + tr * Math.cos(v)) * Math.sin(u);
    // 3 double helix + rungs
    const hy = (r() * 2 - 1) * 2.7;
    if (r() < 0.14) {
      const k = r();
      const a0 = hy * 2.6;
      const x0 = Math.cos(a0) * 0.95;
      const z0 = Math.sin(a0) * 0.95;
      helix[o] = x0 * (1 - 2 * k);
      helix[o + 1] = hy;
      helix[o + 2] = z0 * (1 - 2 * k);
    } else {
      const strand = i % 2;
      const a1 = hy * 2.6 + strand * Math.PI;
      const jr = 0.07 * r();
      const ja = r() * Math.PI * 2;
      helix[o] = Math.cos(a1) * 0.95 + Math.cos(ja) * jr;
      helix[o + 1] = hy + Math.sin(ja) * jr;
      helix[o + 2] = Math.sin(a1) * 0.95 + Math.sin(ja) * jr;
    }
    // 4 text glyph cloud
    if (textPts && textPts.length) {
      const p = textPts[Math.floor(r() * textPts.length)];
      text[o] = p[0];
      text[o + 1] = p[1];
      text[o + 2] = (r() - 0.5) * 0.2;
    } else {
      text[o] = (r() - 0.5) * 4.6;
      text[o + 1] = (r() - 0.5) * 1.4;
      text[o + 2] = (r() - 0.5) * 0.3;
    }
    // 5 galaxy (3 arms)
    const arm = i % 3;
    const gr = Math.pow(r(), 0.7) * 3.1;
    const ga = (arm / 3) * Math.PI * 2 + gr * 1.25 + (r() - 0.5) * 0.45 * (1 - gr / 4);
    galaxy[o] = Math.cos(ga) * gr;
    galaxy[o + 1] = (r() - 0.5) * 0.18 * (1.2 - gr / 4) + (r() < 0.07 ? (r() - 0.5) * 0.8 : 0);
    galaxy[o + 2] = Math.sin(ga) * gr;
    // 6 lemniscate ribbon (infinity)
    const lt = r() * Math.PI * 2;
    const den = 1 + Math.sin(lt) * Math.sin(lt);
    const la = 2.35;
    const lw = (r() - 0.5) * 0.34;
    loop[o] = (la * Math.cos(lt)) / den + lw * 0.5;
    loop[o + 1] = (la * Math.sin(lt) * Math.cos(lt)) / den + (r() - 0.5) * 0.06;
    loop[o + 2] = lw + Math.sin(lt * 2) * 0.35;
  }
  const sc = (a: Float32Array, k: number, ky = k) => {
    for (let i = 0; i < a.length; i += 3) {
      a[i] *= k;
      a[i + 1] *= ky;
      a[i + 2] *= k;
    }
  };
  sc(cloud, 0.75);
  sc(sphere, 0.66);
  sc(torus, 0.7);
  sc(helix, 0.72, 0.9);
  sc(galaxy, 0.66);
  sc(loop, 0.72);
  return [cloud, sphere, torus, helix, text, galaxy, loop];
}

function sampleText(text: string, worldW: number): Array<[number, number]> | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 420;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = '400 340px "Anton"';
  (g as unknown as { letterSpacing: string }).letterSpacing = "10px";
  g.fillText(text, c.width / 2, c.height / 2 + 14);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const pts: Array<[number, number]> = [];
  for (let y = 0; y < c.height; y += 2)
    for (let x = 0; x < c.width; x += 2)
      if (d[(y * c.width + x) * 4 + 3] > 120) pts.push([(x / c.width - 0.5) * worldW, (0.5 - y / c.width * (c.width / c.height)) * 0 + (0.5 - y / c.height) * worldW * (c.height / c.width)]);
  return pts;
}

const SCHED_F = [0, 20, 50, 80, 110, 135, 165, 190, 220, 250, 280, 295, 325, 360];
const SCHED_I = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];

const CAM: CamKey[] = [
  { f: 0, pos: [0, 0.6, 11.5], look: [0, 0, 0], fov: 38, roll: 8 },
  { f: 40, pos: [3.6, 1.0, 6.8], look: [0, 0, 0], fov: 38, roll: 3 },
  { f: 98, pos: [-2.4, 3.0, 5.0], look: [0, 0, 0], fov: 36, roll: -5 },
  { f: 150, pos: [4.1, 0.4, 3.9], look: [0, 0.1, 0], fov: 38, roll: 4 },
  { f: 205, pos: [0.2, 0.0, 9.6], look: [0, 0, 0], fov: 34, roll: 0 },
  { f: 245, pos: [0, 0.0, 8.4], look: [0, 0, 0], fov: 34, roll: 0 },
  { f: 272, pos: [0.5, 5.6, 5.4], look: [0, 0, 0], fov: 40, roll: 0 },
  { f: 312, pos: [0, 0.3, 7.6], look: [0, 0, 0], fov: 36, roll: -2 },
  { f: 360, pos: [0, 0.1, 9.0], look: [0, 0, 0], fov: 36, roll: 0 },
];

const Cloud: React.FC<{ shapes: Float32Array[] }> = ({ shapes }) => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.Points>(null);
  const sprite = useMemo(() => makeSoftSprite(64), []);
  const aux = useMemo(() => {
    const r = rng(9);
    const rv = new Float32Array(N * 3);
    const ph = new Float32Array(N);
    const rnd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      rv[i * 3] = Math.sqrt(1 - u * u) * Math.cos(a);
      rv[i * 3 + 1] = u;
      rv[i * 3 + 2] = Math.sqrt(1 - u * u) * Math.sin(a);
      ph[i] = r() * 6.283;
      rnd[i] = r();
    }
    return { rv, ph, rnd };
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const col = new Float32Array(N * 3);
    const c1 = new THREE.Color("#2ef0ff");
    const c2 = new THREE.Color("#ffffff");
    const c3 = new THREE.Color("#ff6a4d");
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const t = aux.rnd[i];
      if (t < 0.55) tmp.copy(c1).lerp(c2, t / 0.55 * 0.5);
      else if (t < 0.9) tmp.copy(c2).lerp(c1, (t - 0.55) / 0.35 * 0.4);
      else tmp.copy(c3);
      const gain = 0.55 + aux.ph[i] / 6.283 * 0.9;
      col[i * 3] = tmp.r * gain;
      col[i * 3 + 1] = tmp.g * gain;
      col[i * 3 + 2] = tmp.b * gain;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [aux]);

  useLayoutEffect(() => {
    const s = interpolate(frame, SCHED_F, SCHED_I);
    const i0 = Math.min(shapes.length - 1, Math.floor(s));
    const i1 = Math.min(shapes.length - 1, i0 + 1);
    const f = s - i0;
    const bump = Math.sin(Math.PI * f);
    const A = shapes[i0];
    const B = shapes[i1];
    const out = geo.attributes.position.array as Float32Array;
    const T = frame * 0.05;
    for (let i = 0; i < N; i++) {
      const o = i * 3;
      const rn = aux.rnd[i];
      // staggered per-particle progress -> organic dissolve instead of a uniform lerp
      const e = smooth(f * 1.7 - rn * 0.7);
      let x = A[o] + (B[o] - A[o]) * e;
      let y = A[o + 1] + (B[o + 1] - A[o + 1]) * e;
      let z = A[o + 2] + (B[o + 2] - A[o + 2]) * e;
      const bp = Math.sin(Math.PI * Math.min(1, Math.max(0, f * 1.7 - rn * 0.7)));
      // swirl about Y + radial scatter while in flight
      const ang = bp * (rn - 0.5) * 2.4;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const nx = x * ca - z * sa;
      const nz = x * sa + z * ca;
      x = nx + aux.rv[o] * bp * (0.6 + rn) * 1.3;
      y = y + aux.rv[o + 1] * bp * (0.6 + rn) * 1.3;
      z = nz + aux.rv[o + 2] * bp * (0.6 + rn) * 1.3;
      // idle breathing
      const br = 0.018 + bump * 0.01;
      out[o] = x + Math.sin(T + aux.ph[i]) * br;
      out[o + 1] = y + Math.cos(T * 1.1 + aux.ph[i] * 1.3) * br;
      out[o + 2] = z + Math.sin(T * 0.9 + aux.ph[i] * 0.7) * br;
    }
    geo.attributes.position.needsUpdate = true;
    if (ref.current) {
      // slow tumble except while the glyph cloud has to face camera
      const hold = interpolate(frame, [180, 205, 245, 275], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      ref.current.rotation.y = (1 - hold) * Math.sin(frame * 0.011) * 0.9;
      ref.current.rotation.x = (1 - hold) * Math.cos(frame * 0.009) * 0.12;
    }
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={sprite} size={0.038} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} sizeAttenuation />
    </points>
  );
};

const PHASES = [
  { t: "CHAOS", a: 6, b: 54 },
  { t: "ORDER", a: 58, b: 104 },
  { t: "FLOW", a: 108, b: 150 },
  { t: "CODE", a: 154, b: 196 },
  { t: "FORM", a: 200, b: 252 },
  { t: "SCALE", a: 256, b: 298 },
];

export const ParticleMorph: React.FC = () => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const ready = useFontsReady([`400 100px "Anton"`, `400 100px "JetBrains Mono"`, `italic 400 100px "Newsreader"`]);
  const shapes = useMemo(() => (ready ? buildShapes(sampleText("MORPH", 3.1)) : null), [ready]);
  const fadeAll = interpolate(frame, [348, 359], [1, 0], { extrapolateLeft: "clamp" });
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.06);

  return (
    <AbsoluteFill style={{ backgroundColor: "#02060d" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #0a2236 0%, #04101c 45%, #02060d 100%)" }} />
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 9], fov: 38, near: 0.1, far: 60 }} gl={{ antialias: true, alpha: true }}>
        <CameraRig keys={CAM} shake={0.04} />
        {shapes ? <Cloud shapes={shapes} /> : null}
        <PostFX bloomIntensity={0.9 + glow * 0.25} bloomThreshold={0.35} bloomRadius={0.85} vignetteDarkness={0.55} chroma={0.0009} tone msaa={4} />
      </ThreeCanvas>

      <AbsoluteFill style={{ padding: "84px 76px", color: "#e9fbff", opacity: fadeAll }}>
        <FadeBlock start={2} end={340} style={{ display: "flex", justifyContent: "space-between", fontFamily: `"${CF.mono}"`, fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>
          <span>PARTICLES // 03</span>
          <span style={{ color: "#2ef0ff" }}>{N.toLocaleString("en-US")} PTS</span>
        </FadeBlock>
        {PHASES.map((p, i) => (
          <React.Fragment key={p.t}>
            <div style={{ position: "absolute", left: 76, bottom: 292 }}>
              <FadeBlock start={p.a} end={p.b} style={{ fontFamily: `"${CF.mono}"`, fontSize: 24, fontWeight: 700, letterSpacing: 5, color: "#ff6a4d" }}>
                {String(i + 1).padStart(2, "0")} / 06
              </FadeBlock>
            </div>
            <div style={{ position: "absolute", left: 76, right: 76, bottom: 86 }}>
              <KText text={p.t} start={p.a} end={p.b} size={210} font={CF.anton} glow="rgba(46,240,255,0.5)" />
            </div>
          </React.Fragment>
        ))}
        <div style={{ position: "absolute", left: 76, right: 76, bottom: 70 }}>
          <KText text="INFINITE" start={302} end={420} size={236} font={CF.anton} align="center" glow="rgba(255,106,77,0.55)" />
          <KText text="Form is just a choice." start={322} end={420} size={52} font={CF.serif} italic align="center" color="#bdeaf5" tracking={[0.2, 0]} style={{ marginTop: 6 }} />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.05} seed="particle-grain" />
    </AbsoluteFill>
  );
};
