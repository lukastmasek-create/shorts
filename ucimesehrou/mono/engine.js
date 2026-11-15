// MONO 2D "Učíme se hrou" 15.7 s, 1080x1920 @30. Canvas, deterministic: renderFrame(t). Silent cue sheet -> synth audio (no voice).
(() => {
'use strict';
const W = 1080, H = 1920, FPS = 30, TOTAL_DURATION = 15.7;
const SAFE = { top: 160, bottom: 1540, left: 60, right: 960, cx: 510, stageCx: 540 };
const SCENES = [
  { id: 1, start: 0.0, end: 3.1, fxOut: 'whipR' },
  { id: 2, start: 3.1, end: 6.2, fxOut: 'whipL' },
  { id: 3, start: 6.2, end: 9.3, fxOut: 'zoomIn' },
  { id: 4, start: 9.3, end: 12.4, fxOut: 'whipD' },
  { id: 5, start: 12.4, end: 15.7, fxOut: 'iris' }
];
const clamp = (min, max, v) => Math.max(min, Math.min(max, v));
const G = {
  clamp,
  normalize: (min, max, v) => (max === min ? 0 : clamp(0, 1, (v - min) / (max - min))),
  mapRange: (a, b, c, d, v) => { const t = clamp(0, 1, (v - a) / (b - a)); return c + (d - c) * t; },
  ease: {
    power2Out: (t) => 1 - (1 - t) * (1 - t),
    power2In: (t) => t * t,
    power2InOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    backOut: (t, s = 1.70158) => { const t1 = t - 1; return t1 * t1 * ((s + 1) * t1 + s) + 1; }
  },
  tween(time, start, dur, easeFn = G.ease.power2Out) {
    if (dur <= 0) return time >= start ? 1 : 0;
    return easeFn(G.normalize(start, start + dur, time));
  }
};

// ---- audio cue sheet + synth (works on live or offline ctx) ----
const CUES = [
  { t: 0.08, type: 'pop', freq: 320, dur: 0.14 }, { t: 0.25, type: 'ring', freq: 520, dur: 0.35 },
  { t: 0.38, type: 'pop', freq: 440, dur: 0.10 }, { t: 0.48, type: 'pop', freq: 554, dur: 0.10 },
  { t: 0.58, type: 'pop', freq: 659, dur: 0.10 }, { t: 0.68, type: 'pop', freq: 740, dur: 0.10 },
  { t: 0.78, type: 'pop', freq: 880, dur: 0.12 }, { t: 0.95, type: 'pill', freq: 480, dur: 0.16 },
  { t: 1.45, type: 'pill', freq: 620, dur: 0.18 }, { t: 1.85, type: 'xcross', freq: 900, dur: 0.22 },
  { t: 2.15, type: 'xcross', freq: 820, dur: 0.22 }, { t: 2.92, type: 'whip', dur: 0.18 },
  { t: 3.18, type: 'pop', freq: 392, dur: 0.14 }, { t: 3.35, type: 'pop', freq: 523, dur: 0.14 },
  { t: 3.55, type: 'tick', freq: 600 }, { t: 3.67, type: 'tick', freq: 650 }, { t: 3.79, type: 'tick', freq: 700 },
  { t: 3.91, type: 'tick', freq: 760 }, { t: 4.03, type: 'tick', freq: 820 }, { t: 4.16, type: 'tick', freq: 880 },
  { t: 4.30, type: 'tick', freq: 940 }, { t: 4.46, type: 'tick', freq: 1020 },
  { t: 4.65, type: 'ring', freq: 1046.5, dur: 0.45 }, { t: 4.85, type: 'pill', freq: 587, dur: 0.18 },
  { t: 5.25, type: 'xcross', freq: 780, dur: 0.20 }, { t: 6.02, type: 'whip', dur: 0.18 },
  { t: 6.28, type: 'pop', freq: 523.25, dur: 0.11 }, { t: 6.38, type: 'pop', freq: 659.25, dur: 0.11 },
  { t: 6.48, type: 'pop', freq: 783.99, dur: 0.11 }, { t: 6.58, type: 'pop', freq: 1046.5, dur: 0.14 },
  { t: 6.95, type: 'pill', freq: 540, dur: 0.18 }, { t: 7.25, type: 'xcross', freq: 880, dur: 0.22 },
  { t: 7.60, type: 'pop', freq: 440, dur: 0.10 }, { t: 7.72, type: 'pop', freq: 554, dur: 0.10 },
  { t: 7.84, type: 'pop', freq: 659, dur: 0.10 }, { t: 7.96, type: 'ring', freq: 880, dur: 0.35 },
  { t: 9.04, type: 'zoom', freq: 300, dur: 0.28 },
  { t: 9.38, type: 'pop', freq: 440, dur: 0.12 }, { t: 9.50, type: 'pop', freq: 554, dur: 0.12 },
  { t: 9.62, type: 'pop', freq: 659, dur: 0.12 }, { t: 9.90, type: 'slide', freq: 360, dur: 0.35 },
  { t: 10.35, type: 'tick', freq: 587 }, { t: 10.55, type: 'tick', freq: 698 }, { t: 10.75, type: 'tick', freq: 880 },
  { t: 10.95, type: 'ring', freq: 1174, dur: 0.40 }, { t: 11.20, type: 'pill', freq: 640, dur: 0.18 },
  { t: 12.22, type: 'whip', dur: 0.18 },
  { t: 12.48, type: 'ring', freq: 523.25, dur: 0.45 }, { t: 12.75, type: 'pill', freq: 523.25, dur: 0.14 },
  { t: 12.86, type: 'pill', freq: 659.25, dur: 0.14 }, { t: 12.97, type: 'pill', freq: 783.99, dur: 0.14 },
  { t: 13.08, type: 'pill', freq: 1046.5, dur: 0.16 }, { t: 13.35, type: 'chord', freq: 523.25, dur: 1.75 },
  { t: 15.20, type: 'iris', freq: 660, dur: 0.48 }
];
function playCue(ctx, dest, now, cue) {
  const mk = (type, t0, t1, g0, setF) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; setF(osc.frequency);
    gain.gain.setValueAtTime(g0, t0); gain.gain.exponentialRampToValueAtTime(0.001, t1);
    osc.connect(gain).connect(dest); osc.start(t0); osc.stop(t1);
  };
  switch (cue.type) {
    case 'pop': mk('sine', now, now + cue.dur, 0.14, (f) => { f.setValueAtTime(cue.freq * 0.7, now); f.exponentialRampToValueAtTime(cue.freq * 1.35, now + cue.dur); }); break;
    case 'pill': mk('triangle', now, now + cue.dur, 0.12, (f) => { f.setValueAtTime(cue.freq, now); f.exponentialRampToValueAtTime(cue.freq * 1.25, now + 0.08); }); break;
    case 'tick': mk('square', now, now + 0.045, 0.055, (f) => f.setValueAtTime(cue.freq, now)); break;
    case 'ring': [1, 1.5].forEach((m, i) => mk('sine', now + i * 0.03, now + cue.dur, 0.11, (f) => f.setValueAtTime(cue.freq * m, now + i * 0.03))); break;
    case 'xcross': mk('sawtooth', now, now + cue.dur, 0.07, (f) => { f.setValueAtTime(cue.freq, now); f.exponentialRampToValueAtTime(240, now + cue.dur); }); break;
    case 'whip': case 'zoom': case 'slide': case 'iris': {
      const iris = cue.type === 'iris';
      mk('sine', now, now + cue.dur, 0.16, (f) => { f.setValueAtTime(iris ? 720 : 160, now); f.exponentialRampToValueAtTime(iris ? 110 : 620, now + cue.dur); });
      break;
    }
    case 'chord': [261.63, 329.63, 392.0, 523.25, 587.33].forEach((n, idx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'; osc.frequency.setValueAtTime(n, now);
      gain.gain.setValueAtTime(0.001, now); gain.gain.linearRampToValueAtTime(0.055, now + 0.12); gain.gain.exponentialRampToValueAtTime(0.001, now + cue.dur);
      osc.connect(gain).connect(dest); osc.start(now); osc.stop(now + cue.dur);
    }); break;
  }
}
window.renderAudio = async () => {
  const sr = 48000, ctx = new OfflineAudioContext(2, Math.ceil((TOTAL_DURATION + 0.5) * sr), sr);
  CUES.forEach((c) => playCue(ctx, ctx.destination, c.t, c));
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1), i16 = new Int16Array(L.length * 2);
  for (let i = 0; i < L.length; i++) { i16[2 * i] = clamp(-1, 1, L[i]) * 32767; i16[2 * i + 1] = clamp(-1, 1, R[i]) * 32767; }
  let s = ''; const u8 = new Uint8Array(i16.buffer);
  for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(s);
};

// ---- drawing primitives ----
const D = {
  stroke(ctx, alpha = 1, lw = 5, glow = 1) {
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (glow > 0) { ctx.shadowColor = `rgba(255,255,255,${0.75 * alpha * glow})`; ctx.shadowBlur = 18 * glow; } else ctx.shadowBlur = 0;
  },
  roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + rad, y); ctx.lineTo(x + w - rad, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad); ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad); ctx.lineTo(x, y + rad); ctx.quadraticCurveTo(x, y, x + rad, y); ctx.closePath();
  },
  pill(ctx, cx, cy, text, o = {}) {
    const { scale = 1, alpha = 1, filled = true, fontSize = 30, letterSpacing = 5, padX = 48, height = 78, iconFn = null, crossedProgress = 0 } = o;
    if (scale <= 0.01 || alpha <= 0.01) return;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    const chars = Array.from(text); let textW = 0; chars.forEach((c) => { textW += ctx.measureText(c).width; });
    textW += Math.max(0, chars.length - 1) * letterSpacing;
    const iconSpace = iconFn ? 56 : 0, totalW = textW + padX * 2 + iconSpace;
    ctx.shadowColor = `rgba(255,255,255,${0.55 * alpha})`; ctx.shadowBlur = 22;
    this.roundRect(ctx, -totalW / 2, -height / 2, totalW, height, height / 2);
    if (filled) { ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill(); }
    else { ctx.fillStyle = `rgba(0,0,0,${0.9 * alpha})`; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.stroke(); }
    ctx.shadowBlur = 0;
    let tx = -totalW / 2 + padX;
    if (iconFn) {
      ctx.save(); ctx.translate(-totalW / 2 + padX + 14, 0); ctx.scale(0.42, 0.42);
      ctx.strokeStyle = filled ? '#000' : '#fff'; ctx.fillStyle = filled ? '#000' : '#fff';
      ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; iconFn(ctx); ctx.restore(); tx += iconSpace;
    }
    ctx.fillStyle = filled ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    let x = tx; chars.forEach((c) => { ctx.fillText(c, x, 2); x += ctx.measureText(c).width + letterSpacing; });
    if (crossedProgress > 0) this.cross(ctx, 0, 0, totalW * 0.86, height * 1.15, crossedProgress, alpha);
    ctx.restore();
  },
  cross(ctx, cx, cy, w, h, progress, alpha = 1) {
    if (progress <= 0) return;
    ctx.save(); ctx.translate(cx, cy);
    const p1 = clamp(0, 1, progress * 2), p2 = clamp(0, 1, (progress - 0.5) * 2);
    const x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    for (let pass = 0; pass < 2; pass++) {
      if (pass === 0) { ctx.strokeStyle = `rgba(0,0,0,${0.85 * alpha})`; ctx.lineWidth = 13; ctx.shadowBlur = 0; }
      else this.stroke(ctx, alpha, 6.5, 1.2);
      if (p1 > 0) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * p1, y0 + (y1 - y0) * p1); ctx.stroke(); }
      if (p2 > 0) { ctx.beginPath(); ctx.moveTo(x1, y0); ctx.lineTo(x1 - (x1 - x0) * p2, y0 + (y1 - y0) * p2); ctx.stroke(); }
    }
    ctx.restore();
  },
  ring(ctx, cx, cy, progress, maxR = 260) {
    if (progress <= 0 || progress >= 1) return;
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.14, lp = clamp(0, 1, (progress - delay) / (1 - delay));
      if (lp <= 0 || lp >= 1) continue;
      const r = 24 + G.ease.power2Out(lp) * (maxR - i * 28);
      this.stroke(ctx, (1 - lp) * 0.75, 4 - i * 0.8, 0.8); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  },
  icons: {
    document(ctx) { D.roundRect(ctx, -34, -44, 68, 88, 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-18, -18); ctx.lineTo(18, -18); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.moveTo(-18, 18); ctx.lineTo(8, 18); ctx.stroke(); },
    globe(ctx, rot = 0) {
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
      const rx = Math.max(4, Math.abs(Math.cos(rot)) * 24);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, 44, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(44, 0); ctx.moveTo(-36, -22); ctx.lineTo(36, -22); ctx.moveTo(-36, 22); ctx.lineTo(36, 22); ctx.stroke();
    },
    flag(ctx) { ctx.beginPath(); ctx.moveTo(-26, 46); ctx.lineTo(-26, -44); ctx.lineTo(32, -26); ctx.lineTo(-26, -6); ctx.stroke(); },
    chest(ctx) { D.roundRect(ctx, -42, -28, 84, 62, 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-42, -4); ctx.lineTo(42, -4); ctx.stroke(); D.roundRect(ctx, -8, -12, 16, 20, 4); ctx.stroke(); },
    padlock(ctx, unlocked = 0) {
      D.roundRect(ctx, -32, -6, 64, 50, 8); ctx.stroke(); ctx.beginPath();
      const lift = unlocked * 14; ctx.arc(0, -6 - lift, 20, Math.PI, 0, false); ctx.lineTo(20, -6);
      if (unlocked < 0.2) { ctx.moveTo(-20, -6 - lift); ctx.lineTo(-20, -6); }
      ctx.stroke(); ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI * 2); ctx.fill();
    },
    trophy(ctx) {
      ctx.beginPath(); ctx.moveTo(-28, -38); ctx.lineTo(28, -38); ctx.lineTo(22, -2); ctx.quadraticCurveTo(0, 22, -22, -2); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-28, -20, 12, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(28, -20, 12, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 36); ctx.moveTo(-24, 36); ctx.lineTo(24, 36); ctx.stroke();
    },
    scales(ctx, tilt = 0) {
      ctx.beginPath(); ctx.moveTo(-28, 42); ctx.lineTo(28, 42); ctx.moveTo(0, 42); ctx.lineTo(0, -34); ctx.stroke();
      ctx.save(); ctx.translate(0, -26); ctx.rotate(tilt); ctx.beginPath(); ctx.moveTo(-42, 0); ctx.lineTo(42, 0); ctx.stroke();
      [-42, 42].forEach((x) => { ctx.save(); ctx.translate(x, 0); ctx.rotate(-tilt); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, 26); ctx.lineTo(14, 26); ctx.closePath(); ctx.stroke(); ctx.restore(); });
      ctx.restore();
    },
    heart(ctx) {
      ctx.beginPath(); ctx.moveTo(0, 32); ctx.bezierCurveTo(-44, 4, -44, -34, -18, -34); ctx.bezierCurveTo(-4, -34, 0, -20, 0, -16);
      ctx.bezierCurveTo(0, -20, 4, -34, 18, -34); ctx.bezierCurveTo(44, -34, 44, 4, 0, 32); ctx.closePath(); ctx.stroke();
    },
    battery(ctx, fill = 1) {
      D.roundRect(ctx, -40, -22, 74, 44, 6); ctx.stroke(); D.roundRect(ctx, 34, -10, 8, 20, 2); ctx.fill();
      for (let i = 0; i < 3; i++) if (fill >= (i + 1) / 3.2) { D.roundRect(ctx, -30 + i * 21, -13, 15, 26, 2); ctx.fill(); }
    },
    finishPole(ctx) {
      ctx.beginPath(); ctx.moveTo(-24, 44); ctx.lineTo(-24, -42); ctx.stroke(); D.roundRect(ctx, -24, -40, 52, 34, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-24, -23); ctx.lineTo(28, -23); ctx.moveTo(-7, -40); ctx.lineTo(-7, -6); ctx.moveTo(10, -40); ctx.lineTo(10, -6); ctx.stroke();
    }
  }
};

// ---- scene transitions ----
function sceneFx(ctx, st, dur, fxIn, fxOut, draw) {
  const enterDur = 0.18, exitDur = fxOut === 'zoomIn' ? 0.25 : fxOut === 'iris' ? 0.5 : 0.17;
  let dx = 0, dy = 0, scale = 1, alpha = 1, blurX = 0, blurY = 0;
  if (st < enterDur && fxIn) {
    const p = G.ease.power2Out(st / enterDur), inv = 1 - p;
    if (fxIn === 'whipR') { dx = -920 * inv; blurX = 48 * inv; alpha = p; }
    if (fxIn === 'whipL') { dx = 920 * inv; blurX = 48 * inv; alpha = p; }
    if (fxIn === 'zoomIn') { scale = 0.35 + 0.65 * p; alpha = p; }
    if (fxIn === 'whipD') { dy = -1200 * inv; blurY = 55 * inv; alpha = p; }
  }
  const rem = dur - st;
  if (rem < exitDur && fxOut && fxOut !== 'iris') {
    const p = G.ease.power2In(1 - Math.max(0, rem / exitDur));
    if (fxOut === 'whipR') { dx = 960 * p; blurX = 52 * p; alpha = 1 - p * 0.85; }
    if (fxOut === 'whipL') { dx = -960 * p; blurX = 52 * p; alpha = 1 - p * 0.85; }
    if (fxOut === 'whipD') { dy = 1350 * p; blurY = 60 * p; alpha = 1 - p * 0.85; }
    if (fxOut === 'zoomIn') { scale = 1 + 2.2 * p; blurX = 18 * p; alpha = 1 - p * 0.9; }
  }
  ctx.save();
  if (fxOut === 'iris' && rem < exitDur) {
    const p = G.ease.power2InOut(1 - Math.max(0, rem / exitDur)), radius = Math.max(0, 1220 * (1 - p));
    ctx.beginPath(); ctx.arc(SAFE.stageCx, H / 2, radius, 0, Math.PI * 2); ctx.clip();
    draw(ctx, alpha);
    if (radius > 4) { D.stroke(ctx, 1, 6, 1.2); ctx.beginPath(); ctx.arc(SAFE.stageCx, H / 2, radius, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore(); return;
  }
  if (blurX > 4 || blurY > 4) {
    for (let g = 1; g <= 3; g++) {
      ctx.save(); const r = g / 3;
      ctx.translate(SAFE.stageCx + dx - blurX * r * 1.4, H / 2 + dy - blurY * r * 1.4); ctx.scale(scale, scale); ctx.translate(-SAFE.stageCx, -H / 2);
      draw(ctx, alpha * 0.22 * (1 - r * 0.5)); ctx.restore();
    }
  }
  ctx.translate(SAFE.stageCx + dx, H / 2 + dy); ctx.scale(scale, scale); ctx.translate(-SAFE.stageCx, -H / 2);
  draw(ctx, alpha); ctx.restore();
}

// ---- scenes ----
const E = G.ease;
const S = {
  s1(ctx, st, alpha) {
    const cx = SAFE.cx;
    D.ring(ctx, cx, 640, G.normalize(0.15, 0.95, st), 330);
    const sh = G.tween(st, 0.05, 0.48, E.backOut);
    if (sh > 0) {
      ctx.save(); ctx.translate(cx, 640); ctx.scale(sh, sh); D.stroke(ctx, alpha, 5.5, 1);
      D.roundRect(ctx, -310, -260, 620, 500, 22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-310, -10); ctx.lineTo(310, -10); ctx.stroke();
      [{ x: -185, y: -135, icon: 'document', d: 0.30 }, { x: 0, y: -135, icon: 'globe', d: 0.40 }, { x: 185, y: -135, icon: 'flag', d: 0.50 },
       { x: -115, y: 115, icon: 'chest', d: 0.60 }, { x: 115, y: 115, icon: 'padlock', d: 0.70, crossAt: 1.80 }].forEach((it) => {
        const sc = G.tween(st, it.d, 0.38, E.backOut); if (sc <= 0) return;
        ctx.save(); ctx.translate(it.x, it.y); ctx.scale(sc * 1.15, sc * 1.15); D.stroke(ctx, alpha, 4.5, 0.9);
        D.icons[it.icon](ctx, st * 1.8);
        if (it.crossAt && st > it.crossAt) D.cross(ctx, 0, 0, 96, 96, G.tween(st, it.crossAt, 0.28), alpha);
        ctx.restore();
      });
      ctx.restore();
    }
    const sp = G.tween(st, 0.88, 0.38), sc = G.tween(st, 2.10, 0.28);
    if (sp > 0) D.pill(ctx, cx + (1 - sp) * -180, 1105, 'MATEMATIKA · HOTOVO', { scale: 0.82, alpha: alpha * sp, filled: false, fontSize: 24, height: 64, crossedProgress: sc });
    const mp = G.tween(st, 1.25, 0.42, E.backOut);
    if (mp > 0) D.pill(ctx, cx, 1255, 'VYBER PŘEDMĚT', { scale: mp, alpha, fontSize: 34, letterSpacing: 6, height: 86, padX: 54 });
  },
  s2(ctx, st, alpha) {
    const cx = SAFE.cx, sp = G.tween(st, 0.08, 0.42, E.backOut);
    if (sp > 0) {
      ctx.save(); ctx.translate(cx, 440); ctx.scale(sp, sp); D.stroke(ctx, alpha, 5, 1);
      D.roundRect(ctx, -310, -140, 620, 250, 20); ctx.stroke();
      ctx.save(); ctx.translate(-145, -15); ctx.scale(1.25, 1.25); D.icons.trophy(ctx); ctx.restore();
      ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(0, 70); ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.25})`; ctx.stroke();
      D.stroke(ctx, alpha, 5, 1);
      ctx.save(); ctx.translate(145, -15); ctx.scale(1.25, 1.25); D.icons.scales(ctx, Math.sin(st * 4.2) * 0.22 * Math.exp(-st * 0.45)); ctx.restore();
      ctx.restore();
    }
    D.ring(ctx, cx, 785, G.normalize(1.50, 2.35, st), 310);
    const tp = G.tween(st, 0.35, 1.20), pts = Math.round(clamp(0, 56, G.mapRange(0, 1, 0, 56, tp)));
    const pop = st > 1.50 && st < 1.85 ? 1 + Math.sin(((st - 1.50) / 0.35) * Math.PI) * 0.12 : 1;
    ctx.save(); ctx.translate(cx, 800); ctx.scale(pop, pop);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.shadowColor = `rgba(255,255,255,${0.7 * alpha})`; ctx.shadowBlur = 24;
    ctx.font = '900 184px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(pts), 0, 0);
    ctx.shadowBlur = 0; ctx.fillStyle = `rgba(140,140,140,${alpha})`; ctx.font = '800 28px Inter, sans-serif'; ctx.fillText('B O D Y', 0, 118);
    ctx.restore();
    const bw = 580, bh = 34, bx = cx - bw / 2, by = 985;
    ctx.save(); D.stroke(ctx, alpha, 4.5, 0.8); D.roundRect(ctx, bx, by, bw, bh, 17); ctx.stroke();
    const fw = Math.max(0, (bw - 16) * tp); if (fw > 8) { D.roundRect(ctx, bx + 8, by + 8, fw, bh - 16, 9); ctx.fill(); }
    ctx.restore();
    const qp = G.tween(st, 0.70, 0.35);
    if (qp > 0) {
      D.pill(ctx, cx - 155, 1110, 'OTÁZKA 1 ✓', { scale: 0.72 * qp, alpha, filled: false, fontSize: 22, height: 56, padX: 28 });
      D.pill(ctx, cx + 155, 1110, 'CHYBA', { scale: 0.72 * qp, alpha, filled: false, fontSize: 22, height: 56, padX: 34, crossedProgress: G.tween(st, 2.05, 0.25) });
    }
    const p1 = G.tween(st, 1.55, 0.40, E.backOut);
    if (p1 > 0) D.pill(ctx, cx, 1255, 'ODPOVÍDEJ, SBÍREJ', { scale: p1, alpha, fontSize: 32, letterSpacing: 5, height: 86, padX: 48 });
    const p2 = G.tween(st, 1.80, 0.38, E.backOut);
    if (p2 > 0) D.pill(ctx, cx, 1365, 'SBÍREJ BODY', { scale: p2 * 0.85, alpha, filled: false, fontSize: 26, height: 68, padX: 42 });
  },
  s3(ctx, st, alpha) {
    const cx = SAFE.cx;
    [{ x: cx - 225, icon: 'chest', d: 0.06 }, { x: cx - 75, icon: 'heart', d: 0.16 }, { x: cx + 75, icon: 'padlock', d: 0.26, cross: 1.05 }, { x: cx + 225, icon: 'trophy', d: 0.36 }].forEach((c) => {
      const p = G.tween(st, c.d, 0.42, E.backOut); if (p <= 0) return;
      const sq = st - c.d < 0.22 ? 1 + Math.sin(((st - c.d) / 0.22) * Math.PI) * 0.16 : 1;
      ctx.save(); ctx.translate(c.x, 390); ctx.scale(p * sq, p / sq); D.stroke(ctx, alpha, 4.5, 0.9); D.roundRect(ctx, -62, -62, 124, 124, 18); ctx.stroke();
      ctx.save(); ctx.scale(0.88, 0.88); D.icons[c.icon](ctx, c.cross ? G.tween(st, 0.9, 0.3) : 0); ctx.restore();
      if (c.cross && st > c.cross) D.cross(ctx, 0, 0, 110, 110, G.tween(st, c.cross, 0.25), alpha);
      ctx.restore();
    });
    const dp = G.tween(st, 0.35, 0.48, E.backOut), open = G.tween(st, 1.35, 0.65, E.power2InOut);
    D.ring(ctx, cx, 790, G.normalize(1.65, 2.45, st), 290);
    if (dp > 0) {
      ctx.save(); ctx.translate(cx, 815); ctx.scale(dp, dp); D.stroke(ctx, alpha, 5.5, 1.1);
      ctx.beginPath(); ctx.moveTo(-140, 185); ctx.lineTo(-140, -55); ctx.arc(0, -55, 140, Math.PI, 0, false); ctx.lineTo(140, 185); ctx.closePath(); ctx.stroke();
      const lw = 240 * (1 - open * 0.58);
      ctx.beginPath(); ctx.moveTo(-120, 175); ctx.lineTo(-120, -45); ctx.quadraticCurveTo(-120 + lw * 0.5, -155, -120 + lw, -35); ctx.lineTo(-120 + lw, 175); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-120 + lw - 32, 65, 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    [{ x: cx - 310, y: 895, s: 0.62, a: 0.28, d: 1.15 }, { x: cx - 235, y: 870, s: 0.76, a: 0.50, d: 1.28 }, { x: cx - 155, y: 845, s: 0.90, a: 0.75, d: 1.41 }, { x: cx + 225, y: 845, s: 1, a: 1, d: 1.54 }].forEach((g) => {
      const gp = G.tween(st, g.d, 0.35, E.backOut); if (gp <= 0) return;
      ctx.save(); ctx.translate(g.x, g.y); ctx.scale(gp * g.s, gp * g.s); D.stroke(ctx, alpha * g.a, 4.5, 0.8);
      ctx.beginPath(); ctx.arc(0, -38, 20, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 26, 36, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.restore();
    });
    const a = G.tween(st, 0.75, 0.42, E.backOut);
    if (a > 0) D.pill(ctx, cx, 1215, 'UČENÍ JE HRA', { scale: a, alpha, fontSize: 34, letterSpacing: 6, height: 86, padX: 54 });
    const b = G.tween(st, 1.05, 0.40, E.backOut);
    if (b > 0) D.pill(ctx, cx, 1330, 'ÚNIKOVKY · DENNÍ KVÍZY', { scale: b * 0.84, alpha, filled: false, fontSize: 25, letterSpacing: 4, height: 68, padX: 40 });
  },
  s4(ctx, st, alpha) {
    const cx = SAFE.cx;
    const triad = [{ x: cx - 235, y: 390, role: 'RODIČ', d: 0.08 }, { x: cx, y: 350, role: 'ŽÁK', d: 0.20 }, { x: cx + 235, y: 390, role: 'UČITEL', d: 0.32 }];
    const lp = G.tween(st, 0.35, 0.40);
    if (lp > 0) {
      ctx.save(); D.stroke(ctx, alpha * 0.45 * lp, 3.5, 0.5); ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(triad[0].x, triad[0].y); ctx.lineTo(triad[1].x, triad[1].y); ctx.lineTo(triad[2].x, triad[2].y); ctx.stroke(); ctx.restore();
    }
    triad.forEach((n) => {
      const np = G.tween(st, n.d, 0.40, E.backOut); if (np <= 0) return;
      ctx.save(); ctx.translate(n.x, n.y); ctx.scale(np, np); D.stroke(ctx, alpha, 4.5, 1);
      ctx.beginPath(); ctx.arc(0, 0, 66, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -14, 16, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 34, 28, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      D.pill(ctx, 0, 88, n.role, { scale: 0.62, alpha, fontSize: 22, letterSpacing: 3, height: 44, padX: 24 });
      ctx.restore();
    });
    const pp = G.tween(st, 0.55, 0.65, E.power2InOut);
    if (pp > 0) {
      ctx.save(); ctx.translate(cx + (1 - pp) * -260, 775); D.stroke(ctx, alpha * pp, 5, 1);
      D.roundRect(ctx, -320, -185, 640, 350, 22); ctx.fillStyle = `rgba(0,0,0,${0.92 * alpha})`; ctx.fill(); ctx.stroke();
      D.roundRect(ctx, 320, -55, 34, 110, 12); ctx.stroke();
      ctx.save(); ctx.translate(-205, -65); ctx.scale(1.05, 1.05); D.icons.battery(ctx, G.tween(st, 0.9, 0.8)); ctx.restore();
      ctx.save(); ctx.translate(-205, 65); D.icons.finishPole(ctx); ctx.restore();
      [0.42, 0.64, 0.84, 1.0].forEach((h, i) => {
        const bp = G.tween(st, 0.95 + i * 0.12, 0.45, E.backOut), ch = 210 * h * bp;
        D.roundRect(ctx, -75 + i * 88, 110 - ch, 52, Math.max(8, ch), 8); if (i === 3) ctx.fill(); else ctx.stroke();
      });
      ctx.restore();
    }
    D.ring(ctx, cx + 190, 720, G.normalize(1.55, 2.30, st), 220);
    const np = G.tween(st, 0.85, 1.05, E.power2InOut), bw = 600, bh = 30;
    ctx.save(); D.stroke(ctx, alpha, 4, 0.8); D.roundRect(ctx, cx - bw / 2, 1030, bw, bh, 15); ctx.stroke();
    if (np > 0.02) { D.roundRect(ctx, cx - bw / 2 + 7, 1037, (bw - 14) * np, bh - 14, 8); ctx.fill(); }
    ctx.restore();
    const pl = G.tween(st, 1.35, 0.42, E.backOut);
    if (pl > 0) D.pill(ctx, cx, 1235, 'POKROK VIDĚT', { scale: pl, alpha, fontSize: 34, letterSpacing: 6, height: 86, padX: 54 });
  },
  s5(ctx, st, alpha) {
    const cx = SAFE.cx;
    D.ring(ctx, cx, 500, G.normalize(0.10, 1.05, st), 340);
    const gp = G.tween(st, 0.05, 0.50, E.backOut);
    if (gp > 0) { ctx.save(); ctx.translate(cx, 500); ctx.scale(gp * 3.1, gp * 3.1); D.stroke(ctx, alpha, 2.2, 1.1); D.icons.globe(ctx, st * 1.1); ctx.restore(); }
    [{ x: cx - 195, y: 860, l: 'ZŠ (1.–9.)', i: D.icons.document, d: 0.30 }, { x: cx + 195, y: 860, l: 'SŠ', i: D.icons.flag, d: 0.40 },
     { x: cx - 195, y: 975, l: 'PŘIJÍMAČKY', i: (c) => D.icons.scales(c, 0), d: 0.50 }, { x: cx + 195, y: 975, l: 'MATURITA', i: D.icons.trophy, d: 0.60 }].forEach((c) => {
      const cp = G.tween(st, c.d, 0.42, E.backOut);
      if (cp > 0) D.pill(ctx, c.x, c.y, c.l, { scale: cp * 0.88, alpha, fontSize: 25, letterSpacing: 3, height: 76, padX: 34, iconFn: c.i });
    });
    const mp = G.tween(st, 0.68, 0.48, E.backOut);
    if (mp > 0) {
      D.pill(ctx, cx, 1185, 'OBJEVUJ SVĚT, KDE UČENÍ BAVÍ.', { scale: mp * 0.90, alpha, fontSize: 26, letterSpacing: 3.5, height: 90, padX: 40 });
      D.pill(ctx, cx, 1315, 'UCIMESEHROU.ORG', { scale: mp * 0.82, alpha, filled: false, fontSize: 24, letterSpacing: 6, height: 64, padX: 44 });
    }
  }
};

const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
function renderFrame(time) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(SAFE.cx, H * 0.46, 80, SAFE.cx, H * 0.46, 880);
  vig.addColorStop(0, '#1c1c1c'); vig.addColorStop(1, '#000'); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  const t = clamp(0, TOTAL_DURATION - 0.001, time);
  let idx = SCENES.findIndex((s) => t >= s.start && t < s.end); if (idx < 0) idx = SCENES.length - 1;
  const sc = SCENES[idx], prev = idx > 0 ? SCENES[idx - 1].fxOut : null;
  sceneFx(ctx, time - sc.start, sc.end - sc.start, prev, sc.fxOut, (c, a) => S['s' + sc.id](c, time - sc.start, a));
}
window.DURATION = TOTAL_DURATION;
window.seek = (t) => renderFrame(t);
renderFrame(0);
})();
