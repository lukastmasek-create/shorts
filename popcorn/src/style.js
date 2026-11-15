{

  const DURATION = 12;
  const WALL = '#2a5a63';
  const SHARE = { corn: 0.96, water: 0.04 };
  const T = { heat: 2.0, press: 5.0, pop: 7.8 };

  const KX = 480, KY = 236, TILT = -0.16;
  const kernelPath = (ctx, s = 1) => {
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2, c = Math.cos(a); ctx.lineTo(s * 188 * Math.sin(a) * Math.pow(Math.sin(a / 2), 0.6), s * (c > 0 ? 226 : 170) * c); }
    ctx.closePath();
  };
  const tilted = (ctx, fn) => { ctx.save(); ctx.translate(KX, KY); ctx.rotate(TILT); fn(); ctx.restore(); };
  const ramp = (ctx, y0, y1, colors) => { const g = ctx.createLinearGradient(0, y0, 0, y1); colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c)); return g; };
  const kernel = (body, hull, cap, germ) => (ctx) => tilted(ctx, () => {
    kernelPath(ctx); ctx.fillStyle = ramp(ctx, -170, 226, body); ctx.fill();
    ctx.save(); ctx.translate(0, 113); ctx.fillStyle = germ; kernelPath(ctx, 0.5); ctx.fill(); ctx.restore();
    kernelPath(ctx); ctx.clip(); ctx.strokeStyle = hull; ctx.lineWidth = 44; ctx.stroke();
    ctx.fillStyle = cap; ctx.beginPath(); ctx.arc(0, 232, 54, 0, 7); ctx.fill();
  });
  const drop = (ctx, cx, cy, r) => {
    ctx.fillStyle = ramp(ctx, cy - 2 * r, cy + r, ['#7cc4ff', '#1d7fe6', '#1463c8']); ctx.beginPath(); ctx.moveTo(cx, cy - 1.9 * r);
    ctx.bezierCurveTo(cx + 0.35 * r, cy - 1.1 * r, cx + r, cy - 0.55 * r, cx + r, cy); ctx.arc(cx, cy, r, 0, Math.PI);
    ctx.bezierCurveTo(cx - r, cy - 0.55 * r, cx - 0.35 * r, cy - 1.1 * r, cx, cy - 1.9 * r); ctx.fill();
  };
  const steam = (inner, outer) => (ctx) => tilted(ctx, () => {
    ctx.fillStyle = '#f2f8ff'; kernelPath(ctx, outer); ctx.fill();
    if (inner) { ctx.globalCompositeOperation = 'destination-out'; kernelPath(ctx, inner); ctx.fill(); }
  });
  const LOBES = [[212, 262, 66, 58, 0], [742, 248, 72, 62, 0], [476, 102, 78, 62, 0], [466, 404, 84, 58, 0],
    [330, 172, 114, 84, 0.49], [636, 154, 122, 88, -0.56], [304, 348, 108, 80, -0.51], [646, 358, 104, 76, 0.57],
    [410, 256, 122, 106, -0.2], [566, 246, 116, 110, 0.3], [498, 346, 54, 46, 0.2]];
  const lobe = (ctx, [x, y, rx, ry, turn], k, grow) => {
    ctx.beginPath();
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, w = 1 + 0.09 * Math.sin(3 * a + k * 2.4) + 0.06 * Math.sin(5 * a + k * 4.1), c = Math.cos(turn), s = Math.sin(turn), px = (rx * w + grow) * Math.cos(a), py = (ry * w + grow) * Math.sin(a); ctx.lineTo(x + px * c - py * s, y + px * s + py * c); }
    ctx.closePath(); ctx.fill();
  };
  const popcorn = (ctx) => {
    LOBES.forEach((l, k) => {
      ctx.globalCompositeOperation = 'destination-out'; lobe(ctx, l, k, 3);
      ctx.globalCompositeOperation = 'source-over';
      const [x, y, rx, ry] = l, g = ctx.createRadialGradient(x - rx * 0.15, y - ry * 0.2, ry * 0.25, x, y, rx * 1.05); g.addColorStop(0, '#ffffff'); g.addColorStop(0.8, '#fff6dc'); g.addColorStop(1, '#f5d88c');
      ctx.fillStyle = g; lobe(ctx, l, k, 0);
    });
    ctx.lineCap = 'round';
    for (const [x, y, r, a0, a1, w, c] of [[566, 246, 104, 2.75, 3.4, 13, '#a04e0a'], [410, 256, 112, -0.62, -0.3, 10, '#c06c14']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); }
  };
  const hotGlow = (lo, hi) => (x, y) => lo + (hi - lo) * Math.min(1, Math.max(0, (y - 60) / 400));

  const TARGETS = [
    { id: 'cloud', cloud: { at: [2.5, 0.8, 4.5], size: [5.5, 3.0, 3.5] } },
    { id: 'kernel', swell: 1, parts: {
      corn: { puff: 0.62, draw: kernel(['#e69612', '#f3b422', '#f8cc4c'], '#bd680e', '#f6e6b4', '#fadc80') },
      water: { puff: 0.6, restless: 0.012, draw: (ctx) => drop(ctx, KX + 12, KY - 30, 43) } } },
    { id: 'hot', swell: 1, parts: {
      corn: { puff: 0.62, glow: hotGlow(0.0, 0.8), draw: kernel(['#eb9c18', '#ee7410', '#e8440c'], '#b84a0a', '#f7a860', '#f6b040') },
      water: { puff: 0, float: 0.4, restless: 0.06, draw: steam(0, 0.8) } } },
    { id: 'strained', swell: 1, parts: {
      corn: { puff: 0.62, glow: hotGlow(0.4, 1), draw: kernel(['#f08a14', '#ee5c0e', '#e2340a'], '#b83808', '#ffb470', '#f89a30') },
      water: { puff: 0, float: 0.3, restless: 0.05, draw: steam(0.62, 0.86) } } },
    { id: 'popcorn', parts: {
      corn: { puff: 0.48, body: 0.42, glow: 0.4, draw: popcorn },
      water: { cloud: { at: [0.8, 8.5, 1.0], size: [3.0, 0.9, 0.8] } } } },
  ];

  const FLIGHTS = [
    { to: 'kernel', t0: -1.45, dur: 1.2, spread: 0.6, waves: 3, wave: [-1, 0.3, 0], push: 1.2, flow: 1.4, lift: 5, swirl: 0.5, late: 0.5 },
    { to: 'hot', t0: T.heat, dur: 0.9, spread: 1.1, waves: 1, wave: [0, 1, 0], push: 0, flow: 0.25, lift: 0, swirl: 0, scatter: 0.6, late: 0 },
    { to: 'strained', t0: T.press, dur: 0.9, spread: 0.7, waves: 1, wave: [0, 1, 0], push: 0, flow: 0.15, lift: 0, swirl: 0, scatter: 0.5, late: 0 },
    { to: 'popcorn', t0: T.pop, dur: 1.05, spread: 0.14, waves: 1, wave: [0, 0, 1], push: 0.9, flow: 0.45, lift: 2, swirl: 0.2, late: 0.4 },
  ];

  const DIALS = {
    swell: (t) => { const u = K.seg(t, T.press, T.pop); return 0.075 * Math.pow(u, 1.4) + 0.011 * u * u * Math.sin(t * 2 * Math.PI * 9) + 0.05 * K.seg(t, T.pop - 0.22, T.pop, K.ease.in); },
    shake: (t) => K.seg(t, T.heat - 0.3, T.heat + 0.8) * (1 + 1.3 * K.seg(t, T.press, T.pop)),
    heat: (t) => K.seg(t, T.heat - 0.4, T.heat + 1.2, K.ease.inOut) * (1 + 0.5 * K.seg(t, T.press, T.pop)) * (1 - 0.8 * K.seg(t, T.pop, T.pop + 1.6, K.ease.out)),
  };

  const CAPTIONS = [
    { t0: 0.3, t1: T.heat - 0.05, text: 'Every kernel hides a drop of water' },
    { t0: T.heat + 0.2, t1: T.press - 0.05, text: 'Heat turns that water into steam' },
    { t0: T.press + 0.2, t1: T.pop - 0.1, text: 'Sealed in, the steam builds to ~9 atmospheres' },
    { t0: T.pop + 0.2, t1: 9.35, text: 'At 180 °C the hull bursts' },
    { t0: 9.5, t1: 99, text: 'Starch puffs out and sets, up to 40× bigger' },
  ];

  registerStyle({
    id: 'particle-swarm-popcorn',
    name: 'Particle Swarm',
    topic: 'Why does popcorn pop?',
    duration: DURATION,
    fonts: ['600 52px "Inter"'],
    render: { samples: 96, shutter: 0.45, tone: 'neutral', exposure: 1.0, bloom: 0.25, bloomThreshold: 1.3, vignette: 0.4, grain: 0.004, fov: 30, background: WALL },

    build(S) {
      const { THREE, K, scene, camera, renderer } = S;
      const TW = 256, TH = 240, N = TW * TH;
      const FW = 32 / 3, FH = 6, UNIT = 90;
      const RADIUS = 0.026;
      const PARTS = Object.keys(SHARE), COUNT = PARTS.map((id) => Math.round(N * SHARE[id]));
      COUNT[0] += N - COUNT.reduce((a, b) => a + b, 0);

      const W = 960, H = 540, HW = W / 2, HH = H / 2;
      function inflate(px, bridge = 0) {
        let m = new Uint8Array(HW * HH), x0 = HW, x1 = 0, y0 = HH, y1 = 0; const u = new Float32Array(HW * HH);
        for (let y = 1; y < HH - 1; y++) for (let x = 1; x < HW - 1; x++) {
          const i = (2 * y * W + 2 * x) * 4 + 3;
          if (px[i] > 127 && px[i + 4] > 127 && px[i + W * 4] > 127 && px[i + W * 4 + 4] > 127) { m[y * HW + x] = 1; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        }
        for (let b = 0; b < bridge; b++) {
          const g = m.slice(); x0 = Math.max(1, x0 - 1); y0 = Math.max(1, y0 - 1); x1 = Math.min(HW - 2, x1 + 1); y1 = Math.min(HH - 2, y1 + 1);
          for (let y = y0; y <= y1; y++) for (let x = x0, i = y * HW + x0; x <= x1; x++, i++) if (m[i - 1] || m[i + 1] || m[i - HW] || m[i + HW]) g[i] = 1;
          m = g;
        }
        for (let n = 0; n < 500; n++) for (let y = y0; y <= y1; y++) for (let x = x0, i = y * HW + x0; x <= x1; x++, i++) if (m[i]) u[i] += 1.93 * ((u[i - 1] + u[i + 1] + u[i - HW] + u[i + HW]) / 4 + 1 - u[i]);
        return (i) => 2 * Math.sqrt(u[(Math.floor(i / W) >> 1) * HW + ((i % W) >> 1)]) / UNIT;
      }
      function sample(tg) {
        const top = new Float32Array(W * H), box = [1e9, 1e9, -1e9, -1e9], all = [];
        PARTS.forEach((id, pi) => {
          const part = tg.parts ? tg.parts[id] : tg, n = COUNT[pi], r = K.rng(20 + pi), pts = [];
          if (part.cloud) {
            const { at, size } = part.cloud;
            for (let i = 0; i < n; i++) pts.push({ x: at[0] + r.gauss() * size[0], y: at[1] + r.gauss() * size[1], z: at[2] + r.gauss() * size[2], w: -r.range(0.3, 0.9), c: null, g: 0 });
          } else {
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
            const ctx = cv.getContext('2d', { willReadFrequently: true }); part.draw(ctx, W, H);
            const px = ctx.getImageData(0, 0, W, H).data, ink = [];
            for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > 127) ink.push(i);
            const bulge = part.puff ? inflate(px) : () => 0, whole = part.body ? inflate(px, 3) : () => 0, height = (i) => (part.puff || 0) * bulge(i) + (part.body || 0) * whole(i);
            const per = n / ink.length, picks = [];
            for (const i of ink) { let m = Math.floor(per + ((i % W) * 0.7548776662 + Math.floor(i / W) * 0.5698402909) % 1); while (m-- > 0) picks.push(i); }
            for (let i = picks.length - 1; i > 0; i--) { const j = r.int(0, i); [picks[i], picks[j]] = [picks[j], picks[i]]; }
            while (picks.length < n) picks.push(r.pick(ink));
            for (let k = 0; k < n; k++) {
              const i = picks[k], x = (i % W) + r(), y = Math.floor(i / W) + r(), h = height(i);
              const z = top[i] + h - Math.min(h, 0.5) * Math.pow(r(), 3) + (part.float || 0) * r();
              pts.push({ x: x / UNIT - FW / 2, y: FH / 2 - y / UNIT, z, w: part.restless || 0, c: [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]], g: typeof part.glow === 'function' ? part.glow(x, y) : part.glow || 0 });
            }
            for (const i of ink) { top[i] += height(i); const x = i % W, y = Math.floor(i / W); box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); }
          }
          for (const p of pts) p.key = p.x + 0.45 * r.gauss();
          all.push(...pts.sort((a, b) => a.key - b.key));
        });
        const drawn = box[2] > box[0], cx = drawn ? (box[0] + box[2]) / 2 : W / 2, cy = drawn ? (box[1] + box[3]) / 2 : H / 2;
        const hx = drawn ? (box[2] - box[0]) / 2 / UNIT : FW / 2, hy = drawn ? (box[3] - box[1]) / 2 / UNIT : FH / 2;
        return { pts: all, centre: [(cx - W / 2) / UNIT, (H / 2 - cy) / UNIT, 0], half: [hx, hy, drawn ? Math.max(hx, hy) : 3] };
      }
      const pos = new Float32Array(N * TARGETS.length * 4), col = new Uint8Array(N * TARGETS.length * 4);
      const sets = TARGETS.map(sample);
      sets.forEach((set, k) => set.pts.forEach((p, i) => {
        const o = (k * N + i) * 4, c = p.c || (k + 1 < sets.length && sets[k + 1].pts[i].c) || sets[k - 1].pts[i].c;
        pos[o] = p.x; pos[o + 1] = p.y; pos[o + 2] = p.z; pos[o + 3] = p.w;
        col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2]; col[o + 3] = Math.round(255 * Math.min(1, Math.max(0, p.g)));
      }));
      const posTex = new THREE.DataTexture(pos, TW, TH * TARGETS.length, THREE.RGBAFormat, THREE.FloatType); posTex.needsUpdate = true;
      const colTex = new THREE.DataTexture(col, TW, TH * TARGETS.length, THREE.RGBAFormat, THREE.UnsignedByteType); colTex.colorSpace = THREE.SRGBColorSpace; colTex.needsUpdate = true;
      const index = (id) => TARGETS.findIndex((tg) => tg.id === id);

      const U = {
        uTargets: { value: posTex }, uColors: { value: colTex }, uFrom: { value: 0 }, uTo: { value: 1 }, uTime: { value: 0 },
        uT0: { value: 0 }, uDur: { value: 1 }, uSpread: { value: 0.3 }, uWave: { value: new THREE.Vector3() }, uFlow: { value: 1 }, uLift: { value: 1 }, uSwirl: { value: 0 }, uLate: { value: 0.5 }, uScatter: { value: 0 }, uPush: { value: 1 }, uWaves: { value: 3 }, uSeed: { value: 0 },
        uCa: { value: new THREE.Vector3() }, uCb: { value: new THREE.Vector3() }, uHalfA: { value: new THREE.Vector3() }, uSwellA: { value: 0 }, uSwellB: { value: 0 }, uShake: { value: 0 },
      };
      const motion = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: `
        precision highp float; precision highp int; precision highp sampler2D;
        uniform sampler2D uTargets; uniform int uFrom, uTo;
        uniform float uTime, uT0, uDur, uSpread, uFlow, uLift, uSwirl, uLate, uScatter, uPush, uWaves, uSeed, uSwellA, uSwellB, uShake; uniform vec3 uWave, uCa, uCb, uHalfA;
        float hash(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
        vec4 permute(vec4 x){ x = ((x * 34.0) + 1.0) * x; return x - floor(x / 289.0) * 289.0; }
        float snoise(vec3 v, out vec3 grad){
          const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy)), x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz), l = 1.0 - g, i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - D.yyy;
          i = i - floor(i / 289.0) * 289.0;
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          vec3 ns = 0.142857142857 * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z), x_ = floor(j * ns.z), y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy, y = y_ * ns.x + ns.yyyy, h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw), s0 = floor(b0) * 2.0 + 1.0, s1 = floor(b1) * 2.0 + 1.0, sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy, a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
          vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0), m2 = m * m, m4 = m2 * m2;
          vec4 pdx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)), tmp = m2 * m * pdx;
          grad = 42.0 * (-8.0 * (tmp.x * x0 + tmp.y * x1 + tmp.z * x2 + tmp.w * x3) + m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3);
          return 42.0 * dot(m4, pdx);
        }
        vec3 curl(vec3 p){
          vec3 a, b, c; snoise(p, a); snoise(p + vec3(31.4, 17.2, 47.9), b); snoise(p + vec3(-23.7, 61.1, 9.3), c);
          return vec3(c.y - b.z, a.z - c.x, b.x - a.y);
        }
        vec3 rest(vec4 T, vec3 c, float swell, float t, vec4 rnd){
          vec3 p = T.xyz;
          if (T.w < 0.0) return p - T.w * sin(t * vec3(0.37, 0.29, 0.23) + rnd.xyz * 6.283);
          p += (p - c) * swell;
          p.z += 0.035 * sin(dot(p.xy, vec2(0.9, 0.6)) - t * 1.3);
          p.xy += 0.012 * sin(p.yx * 1.7 + t * vec2(0.9, 1.1));
          p += T.w * uShake * (sin(t * (4.0 + 6.0 * rnd.xyz) + rnd.yzw * 40.0) + 0.6 * sin(t * (10.0 + 7.0 * rnd.zxy) + rnd.wxy * 23.0));
          return p + 0.003 * sin(t * (2.0 + 3.0 * rnd.xyz) + rnd.yzw * 40.0);
        }
        void main(){
          ivec2 px = ivec2(gl_FragCoord.xy);
          float id = float(px.x + px.y * ${TW});
          vec4 rnd = vec4(hash(id * 1.31 + uSeed), hash(id * 2.17 + 13.0 + uSeed), hash(id * 3.71 + 29.0), hash(id * 5.03 + 41.0));
          vec4 TA = texelFetch(uTargets, ivec2(px.x, px.y + uFrom * ${TH}), 0), TB = texelFetch(uTargets, ivec2(px.x, px.y + uTo * ${TH}), 0);
          vec3 a = rest(TA, uCa, uSwellA, uTime, rnd), b = rest(TB, uCb, uSwellB, uTime, rnd);
          float moves = smoothstep(0.0, 0.04, distance(TA.xyz, TB.xyz));

          vec2 dir = normalize(uWave.xy + 1e-5), out2 = TA.xy - uCa.xy;
          float front = mix(clamp(dot(out2, dir) / (2.0 * dot(abs(dir), uHalfA.xy)) + 0.5, 0.0, 1.0), clamp(length(out2) / uHalfA.z, 0.0, 1.0), uWave.z);
          vec3 wind = normalize(mix(vec3(dir, 0.35), vec3(out2, 1.3), uWave.z));
          front += 0.06 * sin(dot(TA.xy, vec2(2.3, 1.7)) + uSeed) + 0.08 * rnd.x;
          if (uWaves > 1.5) front = (floor(front * uWaves) + smoothstep(0.0, 0.45, fract(front * uWaves))) / uWaves;
          float wait = uSpread * front + moves * uScatter * rnd.x + (rnd.y > 0.975 ? uLate * (0.4 + 0.6 * rnd.z) : 0.0);
          float u = clamp((uTime - uT0 - wait) / (uDur * mix(0.75, 1.0, rnd.w)), 0.0, 1.0);

          float w = pow(u, 2.2), s = 1.0 - exp(-6.5 * w) * (cos(8.67 * w) + 0.75 * sin(8.67 * w));
          s = mix(s, 1.0, smoothstep(0.85, 1.0, u));
          vec3 p = mix(a, b, s);

          float E = moves * (u < 0.3 ? 1.0 - pow(1.0 - u / 0.3, 3.0) : 1.0 - smoothstep(0.3, 0.68, u));
          float far = 0.5 + 0.5 * rnd.z, hero = pow(rnd.w, 6.0);
          float sw = uSwirl * E * far, cs = cos(sw), sn = sin(sw);
          p.xy = mat2(cs, sn, -sn, cs) * p.xy;
          p += E * wind * (uPush * far + uLift * hero);
          vec3 q = p;
          for (int i = 0; i < 3; i++) q += E * uFlow * far * 0.33 * curl(q * 0.22 + vec3(uSeed * 7.0, 0.0, uTime * 0.15));
          p = q;
          gl_FragColor = vec4(p, smoothstep(0.03, 0.45, u));
        }` });
      const posRT = new THREE.WebGLRenderTarget(TW, TH, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
      const pass = new THREE.Scene(), passCam = new THREE.Camera(); pass.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), motion));

      const geo = new THREE.InstancedBufferGeometry().copy(new THREE.SphereGeometry(1, 8, 6)); geo.instanceCount = N;
      const KEY = [-8.5, 8.5, 8.5];
      const BU = { uPos: { value: posRT.texture }, uColors: U.uColors, uFrom: U.uFrom, uTo: U.uTo, uRadius: { value: RADIUS }, uKey: { value: new THREE.Vector3(...KEY).normalize() }, uGlow: { value: 0.4 }, uHot: { value: 0.45 } };
      const head = `uniform sampler2D uPos, uColors; uniform int uFrom, uTo; uniform float uRadius; varying vec3 vBead; varying float vHot;
        float beadHash(float n){ return fract(sin(n * 78.233) * 43758.5453); }`;
      const body = `ivec2 bt = ivec2(gl_InstanceID % ${TW}, gl_InstanceID / ${TW}); vec4 bp = texelFetch(uPos, bt, 0);
        vec3 transformed = position * uRadius * mix(0.65, 1.0, beadHash(float(gl_InstanceID))) * (1.0 + 0.6 * pow(beadHash(float(gl_InstanceID) + 0.25), 8.0)) + bp.xyz;
        vec4 ca = texelFetch(uColors, ivec2(bt.x, bt.y + uFrom * ${TH}), 0), cb = texelFetch(uColors, ivec2(bt.x, bt.y + uTo * ${TH}), 0);
        vBead = mix(ca.rgb, cb.rgb, bp.w) * mix(0.7, 1.12, beadHash(float(gl_InstanceID) + 0.5)); vHot = mix(ca.a, cb.a, bp.w);
        vBead.g += 0.012 * pow(beadHash(float(gl_InstanceID) + 0.75), 3.0);`;
      const beadify = (mat, lit) => {
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, BU);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + head).replace('#include <begin_vertex>', body);
          if (!lit) return;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBead; varying float vHot; uniform vec3 uKey; uniform float uGlow, uHot;')
            .replace('#include <color_fragment>', 'diffuseColor.rgb *= vBead;')
            .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance += vBead * (uGlow * pow(saturate(-dot(normal, normalize((viewMatrix * vec4(uKey, 0.0)).xyz))), 1.5) + uHot * vHot);')
            .replace('#include <lights_physical_fragment>', THREE.ShaderChunk.lights_physical_fragment.replaceAll('+= geometryRoughness', '+= 0.0'));
        };
        return mat;
      };
      const beads = new THREE.Mesh(geo, beadify(new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.07 }), true));
      beads.customDepthMaterial = beadify(new THREE.MeshDepthMaterial(), false);
      beads.castShadow = beads.receiveShadow = true; beads.frustumCulled = false; scene.add(beads);

      const paper = K.canvasTex(1024, 1024, (ctx, w, h) => {
        ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); const r = K.rng(3);
        for (let i = 0; i < 26000; i++) { const v = r.int(96, 160); ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`; ctx.lineWidth = r.range(0.5, 1.4); const x = r.range(0, w), y = r.range(0, h), a = r.range(0, 6.28), l = r.range(3, 16); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
      }, { data: true, repeat: [10, 6] });
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 48), new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.93, bumpMap: paper, bumpScale: 0.6 }));
      wall.position.z = -0.4; wall.receiveShadow = true; scene.add(wall);

      K.env(S, { top: '#c9b499', horizon: '#9c8468', bottom: '#4f3f30', intensity: 0.32, panels: [
        { pos: [-9, 8, 11], size: [11, 8], color: '#fff2df', power: 7 },
        { pos: [12, -2, 6], size: [1.5, 9], color: '#dfe9ff', power: 14 },
      ] });
      K.spot(S, { pos: KEY, target: [-0.8, 0.8, 0], color: '#fff0dc', power: 1150, angle: 0.56, penumbra: 1, soft: 1.3, mapSize: 4096, near: 4, far: 40, bias: -0.0002, normalBias: 0.006 });
      K.skyLight(S, { color: '#ffdfbd', power: 0.5, size: 7.5, mapSize: 4096, bias: -0.0003, normalBias: 0.006 });
      const stove = K.spot(S, { pos: [0.4, -6.5, 4.5], target: [0, -0.6, 0], color: '#ff6a1c', power: 0, angle: 0.75, penumbra: 1, shadow: false });

      const cam = {
        pos: K.path([[0, [-3.4, -1.0, 10.2]], [T.heat, [-2.4, -0.8, 10.5]], [T.press, [-1.3, -0.6, 10.9]], [T.pop, [-0.2, -0.4, 11.9]], [T.pop + 1.0, [0.5, -0.2, 13.0]], [DURATION, [0.2, -0.15, 12.3]]]),
        aim: K.path([[0, [0.0, -0.2, 0.4]], [T.pop, [0.0, -0.2, 0.4]], [T.pop + 1.0, [0, -0.08, 0.3]], [DURATION, [0, -0.08, 0.3]]]),
        ap: K.track([[0, 0.1], [T.pop, 0.085], [T.pop + 1.5, 0.065], [DURATION, 0.065]]),
      };

      return {
        update(t) {
          let k = 0; while (k < FLIGHTS.length - 1 && FLIGHTS[k + 1].t0 <= t) k++;
          const f = FLIGHTS[k], from = k ? index(FLIGHTS[k - 1].to) : 0, to = index(f.to), swell = DIALS.swell(t);
          U.uTime.value = t; U.uFrom.value = from; U.uTo.value = to; U.uSeed.value = k + 1;
          U.uT0.value = f.t0; U.uDur.value = f.dur; U.uSpread.value = f.spread; U.uWave.value.fromArray(f.wave); U.uFlow.value = f.flow; U.uLift.value = f.lift; U.uSwirl.value = f.swirl; U.uLate.value = f.late; U.uScatter.value = f.scatter || 0; U.uPush.value = f.push; U.uWaves.value = f.waves;
          U.uCa.value.fromArray(sets[from].centre); U.uCb.value.fromArray(sets[to].centre); U.uHalfA.value.fromArray(sets[from].half);
          U.uSwellA.value = swell * (TARGETS[from].swell || 0); U.uSwellB.value = swell * (TARGETS[to].swell || 0); U.uShake.value = DIALS.shake(t);
          renderer.setRenderTarget(posRT); renderer.render(pass, passCam); renderer.setRenderTarget(null);
          stove.intensity = 110 * DIALS.heat(t);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.aim(t), cam.ap(t));
        },
        overlay(ctx, t, W, H) {
          ctx.font = '600 52px "Inter"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          for (const c of CAPTIONS) {
            const up = K.seg(t, c.t0, c.t0 + 0.35, K.ease.out), a = up * (1 - K.seg(t, c.t1 - 0.25, c.t1));
            if (a <= 0) continue;
            ctx.globalAlpha = a; ctx.shadowColor = 'rgba(6, 22, 26, 0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 2;
            ctx.fillStyle = '#f8eeda'; ctx.fillText(c.text, W / 2, H - 84 + (1 - up) * 16);
          }
        },
      };
    },

    // The score: no voiceover, every sound is placed from the same schedule T that drives the picture.
    sound(k) {
      const r = globalThis.K.rng(5), D = DURATION;
      k.bed('room', 0, D, { gain: 0.5 });
      // 1: beads rain in and land, one soft tick when the water drop settles
      for (let i = 0; i < 70; i++) { const t = 0.02 + Math.pow(r(), 0.8) * 1.15; k.play('tick', t, { f: 3000 + r() * 3500, gain: 0.35 + r() * 0.4, pan: r() * 1.6 - 0.8 }); }
      k.play('whoosh', 0.0, { dur: 0.9, gain: 0.25, top: 1800 }); k.play('tock', 1.25, { f: 900, gain: 0.35, pan: -0.2 });
      // 2: burner hum, sizzle, the boiling water as tiny pops
      k.bed('hum', T.heat - 0.2, T.pop - 0.15, { gain: 0.9 }); k.bed('hiss', T.heat + 0.2, T.pop - 0.1, { gain: 1.4 });
      k.play('whoosh', T.heat - 0.1, { dur: 0.7, gain: 0.25, top: 1200 });
      for (let i = 0; i < 46; i++) k.play('pop', 2.6 + (i / 45) * 2.0 + r() * 0.04, { f: 900 + r() * 900, gain: 0.12 + r() * 0.12, pan: r() * 1.2 - 0.6 });
      // 3: hull creaks speeding up and growing, a thin whine and a riser, then a held breath
      let t = T.press + 0.1, gap = 0.5;
      while (t < T.pop - 0.35) { const u = (t - T.press) / (T.pop - T.press); k.play('tock', t, { f: 180 + u * 120 + r() * 40, gain: 0.25 + u * 0.55, pan: r() * 0.6 - 0.3 }); t += gap; gap = Math.max(0.07, gap * 0.82); }
      k.play('riser', T.press + 0.3, { dur: T.pop - T.press - 0.55, gain: 0.7 });
      k.play('blip', T.press + 0.4, { f: 'A6', type: 'sine', dur: 2.2, gain: 0.25 });
      // 4: crack, thud, steam escaping, glass hissing through the air
      k.play('click', T.pop - 0.01, { f: 2600, gain: 1.4 }); k.play('impact', T.pop, { f: 120, gain: 0.9 }); k.play('tick', T.pop, { f: 5200, gain: 1.0 });
      k.play('whoosh', T.pop + 0.05, { dur: 1.1, gain: 0.7, top: 3800 }); k.play('swish', T.pop + 0.15, { dur: 0.7, gain: 0.6, pan: 0.2 });
      k.bed('hiss', T.pop, T.pop + 1.8, { gain: 3 });
      // 5: landing clicks, one soft chime as the flake sets
      for (let i = 0; i < 60; i++) k.play('tick', 8.7 + Math.pow(r(), 1.4) * 1.9, { f: 3200 + r() * 3000, gain: 0.25 + r() * 0.35, pan: r() * 1.6 - 0.8 });
      k.play('success', 10.35, { f: 'G5', gain: 0.5 }); k.play('sparkle', 10.45, { gain: 0.35, n: 5 });
    },
  });
}
