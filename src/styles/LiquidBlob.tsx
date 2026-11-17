import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, TextPlane } from "../three/cine";

/** Style M: iridescent noise-displaced liquid blob, macro camera swoops, satellites merge in. 14.0s, 420 frames. */
export const LIQUID_BLOB_FRAMES = 420;

export interface LiquidBlobProps {
  brand?: string;
  tagline?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [0, 0.4, 9], look: [0, 0, 0], fov: 36, roll: 0 },
  { f: 90, pos: [2.5, 0.5, 3.4], look: [0, 0, 0], fov: 30, roll: 0.12 },
  { f: 170, pos: [-1.3, -0.5, 1.6], look: [0.9, 0.3, 0], fov: 64, roll: -0.18 },
  { f: 250, pos: [-6, 2.6, 6], look: [0, 0, 0], fov: 38, roll: -0.08 },
  { f: 330, pos: [4.2, -1.6, 6.6], look: [0, 0, 0], fov: 36, roll: 0.1 },
  { f: 419, pos: [0, 0, 8.6], look: [0, 0, 0], fov: 34, roll: 0 },
];

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = /* glsl */ `
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uSeed;
varying vec3 vN; varying vec3 vW; varying float vD;
${NOISE}
float disp(vec3 p){
  float n = snoise(p*uFreq + vec3(uSeed, uTime*0.55, uTime*0.3));
  n += 0.5*snoise(p*uFreq*2.1 - vec3(uTime*0.4, uSeed, 0.0));
  return n;
}
void main(){
  vec3 p = normalize(position);
  float d0 = disp(p);
  vec3 pos0 = p*(1.0 + uAmp*d0);
  vec3 t1 = normalize(cross(p, vec3(0.0,1.0,0.001)));
  vec3 t2 = normalize(cross(p, t1));
  float e = 0.012;
  vec3 pa = normalize(p + t1*e); vec3 pb = normalize(p + t2*e);
  vec3 posA = pa*(1.0 + uAmp*disp(pa));
  vec3 posB = pb*(1.0 + uAmp*disp(pb));
  vec3 n = normalize(cross(posA-pos0, posB-pos0));
  if (dot(n,p) < 0.0) n = -n;
  vD = d0;
  vN = normalize(mat3(modelMatrix)*n);
  vec4 wp = modelMatrix*vec4(pos0,1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

const FRAG = /* glsl */ `
uniform float uHue; uniform float uGlow;
varying vec3 vN; varying vec3 vW; varying float vD;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(N,V),0.0), 2.4);
  vec3 L = normalize(vec3(-0.5,0.8,0.6));
  vec3 H = normalize(L+V);
  float spec = pow(max(dot(N,H),0.0), 90.0);
  float spec2 = pow(max(dot(N,normalize(vec3(0.7,-0.2,0.5)+V)),0.0), 40.0);
  vec3 pal = 0.5 + 0.5*cos(6.28318*(vec3(0.0,0.33,0.67) + fres*1.1 + vD*0.55 + uHue));
  vec3 base = vec3(0.04,0.03,0.08);
  float sky = 0.5 + 0.5*N.y;
  vec3 col = mix(base + pal*0.22*sky, pal*1.25, fres);
  col += spec*vec3(1.4) + spec2*pal*0.8;
  col *= (1.0 + uGlow);
  gl_FragColor = vec4(col, 1.0);
}`;

function useBlobMaterial(): THREE.ShaderMaterial {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: { uTime: { value: 0 }, uAmp: { value: 0.25 }, uFreq: { value: 1.2 }, uSeed: { value: 0 }, uHue: { value: 0 }, uGlow: { value: 0 } },
      }),
    []
  );
}

const Blob: React.FC<{ seed: number; amp: number; freq: number; hue: number; glow?: number; time: number }> = ({ seed, amp, freq, hue, glow = 0, time }) => {
  const mat = useBlobMaterial();
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 48), []);
  mat.uniforms.uTime.value = time;
  mat.uniforms.uAmp.value = amp;
  mat.uniforms.uFreq.value = freq;
  mat.uniforms.uSeed.value = seed;
  mat.uniforms.uHue.value = hue;
  mat.uniforms.uGlow.value = glow;
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const t = frame / 30;
  const bg = interpolateColors(frame, [0, 140, 280, 419], ["#14002b", "#00283a", "#3a0a2a", "#14002b"]);
  const merge = interpolate(frame, [190, 260], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const orbitR = 3.1 * (1 - merge) + 0.2;
  const amp = 0.2 + 0.2 * env + 0.18 * merge;
  const mainScale = 1.45 + 0.12 * env + 0.35 * merge;

  const sats = Array.from({ length: 6 }, (_, k) => {
    const a = t * (0.9 + k * 0.08) + (k * Math.PI * 2) / 6;
    return {
      k,
      pos: [Math.cos(a) * orbitR, Math.sin(a * 1.3 + k) * orbitR * 0.55, Math.sin(a) * orbitR] as [number, number, number],
      s: 0.34 * (1 - merge * 0.6),
    };
  });

  const w1 = interpolate(frame, [10, 40, 150, 190], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w2 = interpolate(frame, [130, 160, 300, 340], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <>
      <color attach="background" args={[bg]} />
      <group scale={mainScale}>
        <Blob seed={0} amp={amp} freq={1.15} hue={frame * 0.0035} glow={0.25 * env} time={t} />
      </group>
      {sats.map((s) => (
        <group key={s.k} position={s.pos} scale={s.s}>
          <Blob seed={s.k * 3.7} amp={0.2 + 0.12 * env} freq={1.6} hue={frame * 0.0035 + s.k * 0.12} time={t} />
        </group>
      ))}
      <TextPlane text="LIQUID" family={FONTS.archivoBlack} color="#ffffff" height={2.7} position={[0, 1.2, -3.2]} opacity={w1} glow={1.2} />
      <TextPlane text="MOTION" family={FONTS.archivoBlack} color="#a8f0ff" height={2.7} position={[0, -1.4, -4.4]} opacity={w2} glow={1.2} />
    </>
  );
};

export const LiquidBlob: React.FC<LiquidBlobProps> = ({ brand = "YOUR BRAND", tagline = "Flow state" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const lock = enterMotion(frame, 352, 16, 50);
  const cap = enterMotion(frame, 6, 14, 24);
  const fade = interpolate(frame, [406, 419], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#14002b", opacity: fade }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0.4, 9], fov: 36, near: 0.1, far: 60 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.03} />
        <World />
        <CinePost bloom={0.85} bloomThreshold={0.5} aberration={0.0009 + env * 0.002} vignette={0.62} noise={0.16} />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 96, left: 80, right: 80, display: "flex", justifyContent: "space-between", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 7, color: "#e9dcff", opacity: cap.opacity * 0.9 }}>
        <span>LIQUID / 01</span>
        <span style={{ color: "#7ff0ff" }}>NOISE FIELD</span>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 210, opacity: lock.opacity, transform: `translateY(${lock.translateY}px) scale(${1 + 0.02 * env})`, filter: `blur(${lock.blur}px)` }}>
        <div style={{ fontFamily: FONTS.archivoBlack, fontSize: 112, color: "#fff", letterSpacing: 6, textShadow: "0 0 40px #b36bffaa" }}>{brand}</div>
        <div style={{ marginTop: 18, fontFamily: FONTS.newsreader, fontStyle: "italic", fontSize: 54, color: "#d8c8ff" }}>{tagline}</div>
      </AbsoluteFill>
      <Grain opacity={0.045} seed="blob" />
    </AbsoluteFill>
  );
};
