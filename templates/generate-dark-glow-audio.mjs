// Deterministic soundtrack + onset detector for "Dark Glow + Kinetic Poster Type"
// Generates public/dark-glow/soundtrack.wav (43.0s = 1290 frames @ 30fps, 120 BPM)
// Act I   [0..480f,   0.0..16.0s]: Style A — Ember Reveal
// Act II  [480..930f, 16.0..31.0s]: Style B — Green Screen Showcase
// Act III [930..1290f,31.0..43.0s]: Style C — Kinetic Poster Type
import fs from "node:fs";
import path from "node:path";

const FPS = 30;
const TOTAL_FRAMES = 1290; // 43.0s
const DURATION = TOTAL_FRAMES / FPS;
const SR = 24000;
const SAMPLES = Math.floor(DURATION * SR);

// Mulberry32 deterministic PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x6461726b);
const buf = new Float32Array(SAMPLES);

function addKick(startSec, amp = 0.42, pitchStart = 128, pitchEnd = 40, decay = 0.22) {
  const i0 = Math.floor(startSec * SR);
  const len = Math.floor(decay * 1.8 * SR);
  let phase = 0;
  for (let k = 0; k < len && i0 + k < SAMPLES; k++) {
    const t = k / SR;
    const env = Math.exp(-t / decay);
    const freq = pitchEnd + (pitchStart - pitchEnd) * Math.exp(-t * 28);
    phase += (2 * Math.PI * freq) / SR;
    const click = Math.exp(-t * 180) * 0.25 * Math.sin(2 * Math.PI * 1200 * t);
    buf[i0 + k] += amp * (Math.sin(phase) * env + click);
  }
}

function addSnareHat(startSec, amp = 0.16, decay = 0.075, toneFreq = 220) {
  const i0 = Math.floor(startSec * SR);
  const len = Math.floor(decay * 3.0 * SR);
  for (let k = 0; k < len && i0 + k < SAMPLES; k++) {
    const t = k / SR;
    const env = Math.exp(-t / decay);
    const n = (rand() * 2 - 1) * env;
    const body = Math.sin(2 * Math.PI * toneFreq * t) * Math.exp(-t / (decay * 0.5)) * 0.35;
    buf[i0 + k] += amp * (n + body);
  }
}

function addWhoosh(startSec, durSec, amp = 0.14, f0 = 180, f1 = 920) {
  const i0 = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  let lp = 0;
  for (let k = 0; k < len && i0 + k < SAMPLES; k++) {
    const u = k / len;
    const env = Math.sin(Math.PI * u) ** 1.6;
    const cutoff = f0 + (f1 - f0) * Math.sin(Math.PI * u);
    const alpha = Math.min(0.95, (2 * Math.PI * cutoff) / SR);
    const raw = rand() * 2 - 1;
    lp += alpha * (raw - lp);
    buf[i0 + k] += amp * lp * env * 2.2;
  }
}

function addChime(startSec, freqs, amp = 0.12, decay = 0.65) {
  const i0 = Math.floor(startSec * SR);
  const len = Math.floor(decay * 3.2 * SR);
  for (let k = 0; k < len && i0 + k < SAMPLES; k++) {
    const t = k / SR;
    const env = Math.exp(-t / decay) * Math.min(1, t * 80);
    let s = 0;
    for (const f of freqs) {
      s += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t);
    }
    buf[i0 + k] += (amp * env * s) / freqs.length;
  }
}

function addTick(startSec, freq = 1450, amp = 0.08) {
  const i0 = Math.floor(startSec * SR);
  const len = Math.floor(0.028 * SR);
  for (let k = 0; k < len && i0 + k < SAMPLES; k++) {
    const t = k / SR;
    buf[i0 + k] += amp * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 140);
  }
}

// Continuous evolving harmonic pads per act
for (let i = 0; i < SAMPLES; i++) {
  const t = i / SR;
  if (t < 16.0) {
    // Act I: Warm dark D-minor / Fmaj7 ember pad
    const fade = Math.min(1, t / 0.8) * Math.min(1, (16.1 - t) / 0.4);
    const swell = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.125 * t);
    const d1 = Math.sin(2 * Math.PI * 73.42 * t); // D2
    const a1 = Math.sin(2 * Math.PI * 110.0 * t) * 0.6; // A2
    const f2 = Math.sin(2 * Math.PI * 174.61 * t + 0.4 * Math.sin(2 * Math.PI * 0.4 * t)) * 0.35;
    const e2 = Math.sin(2 * Math.PI * 329.63 * t) * (t > 9.5 ? 0.25 : 0.08);
    buf[i] += 0.085 * fade * swell * (d1 + a1 + f2 + e2);
  } else if (t < 31.0) {
    // Act II: Sleek emerald E-minor9 ambient tech bed
    const lt = t - 16.0;
    const fade = Math.min(1, lt / 0.4) * Math.min(1, (15.1 - lt) / 0.4);
    const e1 = Math.sin(2 * Math.PI * 82.41 * t); // E2
    const b1 = Math.sin(2 * Math.PI * 123.47 * t) * 0.55; // B2
    const g2 = Math.sin(2 * Math.PI * 196.0 * t) * 0.35; // G3
    const fs3 = Math.sin(2 * Math.PI * 369.99 * t) * 0.2; // F#4
    buf[i] += 0.08 * fade * (e1 + b1 + g2 + fs3);
  } else {
    // Act III: Driving kinetic sub bass (A1 -> F1 -> G1 progression)
    const lt = t - 31.0;
    const fade = Math.min(1, lt / 0.15) * Math.min(1, (12.0 - lt) / 0.45);
    const bar = Math.floor(lt / 2.0);
    const bassFreq = [55.0, 65.41, 49.0, 55.0, 43.65, 55.0][bar % 6];
    const sidechain = 0.35 + 0.65 * ((lt % 0.5) / 0.5);
    const sub = Math.tanh(1.8 * Math.sin(2 * Math.PI * bassFreq * t));
    buf[i] += 0.13 * fade * sidechain * sub;
  }
}

// 120 BPM master beat grid (every 0.5s = 15 frames)
const totalBeats = Math.floor(TOTAL_FRAMES / 15);
for (let b = 0; b < totalBeats; b++) {
  const sec = (b * 15) / FPS;
  if (sec < 16.0) {
    // Ember Reveal: deep warm heartbeat kick + shimmer on section beats
    const amp = b === 0 ? 0.22 : b % 4 === 0 ? 0.36 : 0.26;
    addKick(sec, amp, 108, 38, 0.24);
    if (b % 2 === 1) addSnareHat(sec, 0.06, 0.05, 320);
  } else if (sec < 31.0) {
    // Green Showcase: crisp minimal pocket groove
    addKick(sec, b % 2 === 0 ? 0.36 : 0.28, 122, 42, 0.19);
    if (b % 2 === 1) addSnareHat(sec, 0.12, 0.065, 260);
    addTick(sec + 0.25, 2400, 0.04);
  } else {
    // Kinetic Reel: hard poster-slam kicks + snares + glitch cuts every 4 beats
    const isCut = (b * 15 - 930) % 60 === 0;
    addKick(sec, isCut ? 0.48 : 0.39, 148, 42, 0.2);
    if (b % 2 === 1) addSnareHat(sec, 0.2, 0.085, 240);
    addSnareHat(sec + 0.25, 0.08, 0.04, 420);
    if (isCut) {
      addSnareHat(sec, 0.24, 0.11, 520);
    }
  }
}

// Signature narrative Foley & musical accents
// Act I accents
addChime(0.28, [293.66, 440, 587.33], 0.13, 0.9); // RingGlow reveal
addWhoosh(1.5, 0.55, 0.16, 260, 1100); // Wordmark comet sweep
addWhoosh(2.15, 0.9, 0.14, 190, 860); // Bezier comet arcs
addWhoosh(2.85, 0.7, 0.13, 220, 960);
addTick(4.8, 1300, 0.1); // Dropdown open
addChime(6.0, [440, 659.25, 880], 0.14, 0.55); // Opus 4.7 selection flash
addWhoosh(6.75, 0.7, 0.16, 240, 980); // Dissolve comet
addChime(10.0, [293.66, 440, 659.25], 0.13, 0.8); // Code
addChime(11.3, [349.23, 523.25, 698.46], 0.13, 0.8); // Build
addChime(12.6, [392.0, 587.33, 880.0], 0.15, 0.95); // Learn

// Act II accents (offset +16.0s)
addTick(16.0 + 1.5, 1600, 0.12); // Friends pill active
for (let a = 0; a < 4; a++) addTick(16.0 + 2.1 + a * 0.1, 1100 + a * 180, 0.08); // Avatars stagger-pop
addTick(16.0 + 4.3, 1800, 0.11); // Send button pop
// Typewriter ticks 6.0-8.0s local
for (let c = 0; c < 18; c++) addTick(16.0 + 6.05 + c * 0.1, 2100 + (c % 3) * 160, 0.055);
addChime(16.0 + 8.0, [329.63, 493.88, 659.25], 0.14, 0.75); // Green glyph
addChime(16.0 + 9.2, [493.88, 739.99, 987.77], 0.18, 0.95); // "2.0" superscript flash

// Soft-clip master limiter to -1.5 dBFS
let peak = 0;
for (let i = 0; i < SAMPLES; i++) {
  buf[i] = Math.tanh(buf[i] * 1.15);
  const a = Math.abs(buf[i]);
  if (a > peak) peak = a;
}
const norm = peak > 0 ? 0.84 / peak : 1;
for (let i = 0; i < SAMPLES; i++) buf[i] *= norm;

// Onset detection at 30 fps (positive frame-to-frame RMS energy flux peaks)
const frameRms = new Float32Array(TOTAL_FRAMES);
const spf = Math.floor(SR / FPS);
for (let f = 0; f < TOTAL_FRAMES; f++) {
  let sum = 0;
  const start = f * spf;
  for (let k = 0; k < spf && start + k < SAMPLES; k++) {
    sum += buf[start + k] * buf[start + k];
  }
  frameRms[f] = Math.sqrt(sum / spf);
}
const flux = new Float32Array(TOTAL_FRAMES);
for (let f = 1; f < TOTAL_FRAMES; f++) {
  flux[f] = Math.max(0, frameRms[f] - frameRms[f - 1]);
}
const detectedOnsets = [0];
for (let f = 2; f < TOTAL_FRAMES - 2; f++) {
  if (
    flux[f] > 0.035 &&
    flux[f] >= flux[f - 1] &&
    flux[f] >= flux[f + 1] &&
    f - detectedOnsets[detectedOnsets.length - 1] >= 7
  ) {
    detectedOnsets.push(f);
  }
}

// Write 16-bit mono WAV
const outDir = path.resolve("public/dark-glow");
fs.mkdirSync(outDir, { recursive: true });
const wavPath = path.join(outDir, "soundtrack.wav");
const dataBytes = SAMPLES * 2;
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + dataBytes, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // 1 channel
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(dataBytes, 40);

const pcm = Buffer.alloc(dataBytes);
for (let i = 0; i < SAMPLES; i++) {
  const s = Math.max(-1, Math.min(1, buf[i]));
  pcm.writeInt16LE(Math.round(s * 32767), i * 2);
}
fs.writeFileSync(wavPath, Buffer.concat([header, pcm]));

console.log(
  `Wrote ${wavPath} (${((44 + dataBytes) / 1024 / 1024).toFixed(2)} MB), detected ${detectedOnsets.length} onsets.`
);
console.log("First 25 detected onset frames:", detectedOnsets.slice(0, 25).join(", "));
