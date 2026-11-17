{
  // ---------------------------------------------------------------- content: how do volcanoes appear
  // One moving relief. setup(x,y) once per pin, moment(t) once per moment, relief(p,m,t,o) per pin.
  // A flat plain of ground. Magma gathers under it (a glow seen through the crust), the ground swells and cracks,
  // magma breaks through, and three eruptions pile lava and ash into a cone.
  const DURATION = 11;
  const WALL_W = 20.6, WALL_H = 15.4;
  const BEATS = [
    { at: 0.0, say: 'Rock melts deep underground', note: 'magma: 700–1,300 °C' },
    { at: 2.4, say: 'Magma gathers and swells the ground' },
    { at: 4.7, say: 'It breaks through' },
    { at: 6.5, say: 'Lava and ash pile up, layer by layer' },
    { at: 9.0, say: 'A volcano', note: 'built by many eruptions' },
  ];
  const TINTS = { deep: '#4f6283', pale: '#d6d0e0', land: '#f0b078', hot: '#ff5a12' };   // plain, ash, fresh rock, lava

  const LEVEL = 0.5;                                 // height of the resting plain
  const VENT = [0.4, 0.7];
  const TREMORS = [{ at: 0.7, a: 0.05 }, { at: 1.5, a: 0.06 }, { at: 2.2, a: 0.08 }, { at: 2.9, a: 0.1 }, { at: 3.5, a: 0.12 }, { at: 4.05, a: 0.14 }, { at: 4.4, a: 0.16 }];
  const SWELL = { from: 1.8, to: 4.7, height: 1.25 };   // the dome under which the magma sits
  const ERUPTIONS = [{ at: 4.8, adds: 1.5 }, { at: 6.6, adds: 1.0 }, { at: 8.2, adds: 0.9 }];
  const CONE = { base: 4.6, round: 0.45, power: 1.6 };   // cone = adds x (1 - r/base)^power
  const CRATER = { radius: 0.6, depth: 1.5 };
  const FRONT = 6;                                   // speed of an eruption's shock and of the new layer running down
  const FLOW = 1.9, REACH = 3.9, COOL = 2.4;         // lava speed, how far it runs, how long it stays hot

  const N = K.noise(11), TAU = Math.PI * 2;
  const lastEruption = ERUPTIONS[ERUPTIONS.length - 1];

  function setup(x, y) {
    const dx = x - VENT[0], dy = y - VENT[1], r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const re = r * (1 + 0.3 * N.fbm(dx * 0.4 + 7, dy * 0.4, 0, 3) + 0.04 * Math.sin(ang * 7 + 4 * N.n2(dx * 0.3, dy * 0.3)));
    const rp = Math.hypot(re, CONE.round) - CONE.round;
    const warp = 0.55 * N.n2(dx * 0.7 + 3, dy * 0.7);
    return {
      r, re, ang,
      shape: Math.pow(Math.max(0, 1 - rp / CONE.base), CONE.power),
      dm: Math.exp(-Math.pow(re / 3.4, 2)),
      bowl: Math.exp(-Math.pow(r / CRATER.radius, 2)),
      hills: 0.16 * N.fbm(x * 0.33, y * 0.33, 9, 3) + 0.03 * N.n2(x * 1.7, y * 1.7),
      blob: 0.7 + 0.6 * (N.fbm(dx * 0.5 + 2, dy * 0.5 - 4, 0, 3) + 0.4),
      crack: (() => { const d = r * Math.abs(Math.sin(1.5 * (ang + warp))) / 1.5; return Math.exp(-Math.pow(d / 0.17, 2)) * K.smooth(2.5, 1.2, r) * K.smooth(0.1, 0.5, r); })(),
      chan: ERUPTIONS.map((e, i) => K.clamp(Math.pow(0.5 + 0.5 * Math.cos(ang * 3 + 3.2 * N.fbm(dx * 0.45 + i * 5, dy * 0.45, 2, 3) + i * 2.1), 2.2) * (0.55 + 1.1 * (N.fbm(x * 1.1, y * 1.1, i + 20, 3) + 0.4)))),
      crust: 0.5 + N.fbm(x * 1.9, y * 1.9, 40, 3),
      rnd: K.hash(x * 9.1, y * 7.3),
    };
  }

  function moment(t) {
    const E0 = ERUPTIONS[0].at;
    let burst = 0, glow = 0;
    ERUPTIONS.forEach((e) => {
      const tau = t - e.at; if (tau <= 0) return;
      burst += (1 - Math.exp(-tau / 0.04)) * Math.exp(-tau / 0.3);
      glow = Math.max(glow, (1 - Math.exp(-tau / 0.05)) * Math.exp(-tau / (e === lastEruption ? 3 : 1.1)));
    });
    const sw = K.ease.inOut(K.seg(t, SWELL.from, SWELL.to));
    const gone = K.smooth(E0, E0 + 0.5, t);
    const crack = K.smooth(3.3, 4.7, t) * (1 - K.smooth(E0 + 0.1, E0 + 0.8, t));
    return {
      dome: SWELL.height * sw * (1 - 0.55 * K.smooth(E0, E0 + 0.8, t)),
      shake: K.smooth(3.0, 4.7, t) * (1 - K.seg(t, E0, E0 + 0.2)),
      blobR: K.lerp(3.5, 1.7, sw),
      blobK: K.smooth(0.1, 1.5, t) * K.lerp(0.4, 0.62, sw) * (1 - gone) * (1 + 0.15 * Math.sin(t * 3.1)),
      crack, burst, glow,
      lake: K.smooth(E0 + 0.3, E0 + 1.2, t) * (0.82 + 0.18 * Math.sin(t * 7)),
      glowSeen: Math.max(glow, 0.3 * K.smooth(0.1, 1.5, t) * (1 - gone) + 0.35 * crack, 0.35 * K.smooth(E0 + 0.3, E0 + 1.2, t)),
    };
  }

  function relief(p, m, t, o) {
    // ---- the ground: gentle hills, tremor rings, the swelling dome, the cracks that open in it
    let h = LEVEL + p.hills, ring = 0;
    for (const e of TREMORS) {
      const tau = t - e.at; if (tau <= 0 || tau > 2.6) continue;
      const u = (p.r - 4 * tau) / 0.45; if (u > 4 || u < -4) continue;
      ring += e.a * Math.exp(-u * u) / (1 + 0.12 * p.r);
    }
    h += ring + m.dome * p.dm * (1 + m.shake * 0.04 * Math.sin(t * 33 + p.rnd * 40));
    h -= m.crack * p.crack * 0.18;

    // ---- the cone: each eruption raises the summit; the new layer runs down the flank with a bounce
    let top = 0, fresh = 0, heat = 0, ash = 0, cool = 0;
    ERUPTIONS.forEach((e, i) => {
      const tau = t - e.at - p.r / FRONT - p.rnd * 0.05;
      if (tau > 0) { top += e.adds * (tau > 2 ? 1 : K.spring(tau, 2.3, 0.5)); if (tau < 0.6) fresh += Math.exp(-tau / 0.1); }
      const te = t - e.at;
      if (te > 0) {
        // shock ring across the plain
        if (te < 3.4) { const u = (p.r - FRONT * te) / 0.5; if (u < 4 && u > -6) ring += (Math.exp(-u * u) - 0.45 * Math.exp(-Math.pow(u + 1.7, 2))) * e.adds * 0.22 / (1 + 0.14 * p.r); }
        // lava running down its channels, then cooling into a pale crust
        const tr = (p.re - 0.5) / FLOW + 0.15, ext = REACH * (0.7 + 0.3 * p.chan[i]);
        if (te > tr && p.re < ext && p.re > 0.4) {
          const f = K.smooth(0, 0.35, te - tr) * K.smooth(ext, ext - 0.8, p.re);
          heat = Math.max(heat, p.chan[i] * f * Math.exp(-(te - tr) / COOL) * K.clamp(0.62 + 0.55 * p.crust * (1 + 0.25 * Math.sin(t * 2.3 + p.rnd * 20))));
          cool = Math.max(cool, p.chan[i] * f * (1 - Math.exp(-(te - tr) / 1.2)));
        }
        ash = Math.max(ash, K.smooth(0.2, 1.4, te) * Math.exp(-p.re / (3.3 + i * 0.4)));
      }
    });
    const rise = top * p.shape;
    let lift = h + rise + ring * 0 - p.bowl * CRATER.depth * K.clamp(top / 1.6);
    if (m.burst > 0.01 && p.bowl > 0.04) lift += m.burst * p.bowl * 1.5 * (0.6 + 0.4 * Math.sin(t * 36 + p.rnd * 40));

    // ---- what the pin shows
    const elev = m.dome * p.dm * 0.55 + rise;
    const rock = K.smooth(0.15, 0.95, elev);
    const blob = m.blobK * p.blob * Math.exp(-Math.pow(p.r / m.blobR, 2)) * (1 - 0.5 * K.smooth(2, 4.7, t) * K.smooth(1.0, 2.2, p.r));   // magma seen through the crust
    const lake = m.lake * Math.exp(-Math.pow(p.r / 0.62, 2)) * K.clamp(0.7 + 0.5 * p.crust + 0.15 * Math.sin(t * 3 + p.rnd * 6), 0.3, 1);
    o.lift = lift;
    o.land = rock * (0.4 + 0.6 * K.smooth(ERUPTIONS[0].at - 0.1, ERUPTIONS[0].at + 1.0, t));
    o.pale = K.clamp(0.9 * ash * K.smooth(0.1, 0.8, elev + 0.3) + 3.2 * Math.max(0, ring) + 0.25 * K.clamp(fresh));
    o.hot = K.clamp(blob + m.crack * p.crack * 0.9 + lake * 0.9 + heat * 0.9 + 0.35 * K.clamp(fresh) * Math.exp(-p.r / 3) + m.burst * 0.7 * Math.exp(-Math.pow(p.r / 1.0, 2)));
  }

  // ---------------------------------------------------------------- the mechanism
  const PITCH = 0.17;            // fewer, bigger pins: calmer, less shimmer

  registerStyle({
    id: 'pin-wall',
    name: 'Pin Wall',
    family: 'Flat content made physical',
    topic: 'How do volcanoes appear',
    duration: DURATION,
    fonts: ['500 60px "Oswald"', '500 40px "Inter"'],
    render: { samples: 40, shutter: 0.55, tone: 'filmic', exposure: 1.2, bloom: 0.32, bloomThreshold: 1.3, vignette: 0.4, grain: 0.012, saturation: 1.12, fov: 28, background: '#030304' },

    build(S) {
      const { THREE, K, scene, camera } = S;

      const patch = (m, lit) => {
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aPin; varying vec4 vPin; varying float vShaft;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShaft = position.z; vPin = aPin; transformed.z += aPin.x;');
          if (lit) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vPin; varying float vShaft; uniform vec3 uDeep, uPale, uLand, uHot, uHot2;')
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat head = smoothstep(-0.085 * ' + (PITCH / 0.1).toFixed(3) + ', -0.03 * ' + (PITCH / 0.1).toFixed(3) + ', vShaft);\ndiffuseColor.rgb *= mix(mix(uDeep, uPale, vPin.w), uLand, vPin.y) * mix(0.42, 1.0, head);')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += mix(uHot, uHot2, vPin.z * vPin.z) * pow(vPin.z, 1.7) * mix(0.3, 1.0, head);');
        };
        return m;
      };
      const U = { uDeep: { value: new THREE.Color(TINTS.deep) }, uPale: { value: new THREE.Color(TINTS.pale) }, uLand: { value: new THREE.Color(TINTS.land) }, uHot: { value: new THREE.Color('#d83a08').multiplyScalar(5) }, uHot2: { value: new THREE.Color('#ffa040').multiplyScalar(8) } };
      const R = PITCH * 0.47, LEN = 7, prof = [];
      for (const q of [0, 0.3, 0.55, 0.75, 0.9, 0.98, 1]) prof.push(new THREE.Vector2(Math.max(1e-4, q * R), -0.62 * R * (1 - Math.sqrt(1 - q * q * 0.985))));
      prof.push(new THREE.Vector2(R, -0.075 * PITCH / 0.1), new THREE.Vector2(R * 0.9, -0.085 * PITCH / 0.1), new THREE.Vector2(R * 0.9, -LEN));
      const pinGeo = new THREE.LatheGeometry(prof.reverse(), 12); pinGeo.rotateX(Math.PI / 2);
      const cols = Math.floor(WALL_W / PITCH), rowH = PITCH * Math.sqrt(3) / 2, rows = Math.floor(WALL_H / rowH), count = cols * rows;
      const state = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); state.setUsage(THREE.DynamicDrawUsage);
      pinGeo.setAttribute('aPin', state);
      const pins = new THREE.InstancedMesh(pinGeo, patch(new THREE.MeshStandardMaterial({ color: '#c3c7cf', metalness: 0.9, roughness: 0.3 }), true), count);
      pins.customDepthMaterial = patch(new THREE.MeshDepthMaterial(), false);
      pins.castShadow = pins.receiveShadow = true; pins.frustumCulled = false;
      const tone = new THREE.Color(), spots = [];
      for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
        const x = (c - (cols - 1) / 2 + (r % 2 ? 0.25 : -0.25)) * PITCH, y = (r - (rows - 1) / 2) * rowH;
        K.place(pins, i, [x, y, 0]); spots.push(setup(x, y));
        pins.setColorAt(i, tone.setScalar(0.86 + 0.14 * K.hash(c, r)));
      }
      scene.add(pins);
      const out = { lift: 0, land: 0, hot: 0, pale: 0 }, buf = state.array;
      let shown = null, now = null;
      const show = (t) => {
        if (t === shown) return; shown = t; now = moment(t);
        for (let i = 0, j = 0; i < count; i++, j += 4) { relief(spots[i], now, t, out); buf[j] = out.lift; buf[j + 1] = out.land; buf[j + 2] = out.hot; buf[j + 3] = out.pale; }
        state.needsUpdate = true;
      };

      const coat = new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.7, metalness: 0.2 });
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
      const FB = 0.8, FRONT_Z = LEVEL + 0.3, FD = 2.2;
      for (const s of [-1, 1]) {
        add(K.roundedBox(WALL_W + FB * 2, FB, FD, 0.08, 4), coat, 0, s * (WALL_H + FB) / 2, FRONT_Z - FD / 2);
        add(K.roundedBox(FB, WALL_H + FB * 2, FD, 0.08, 4), coat, s * (WALL_W + FB) / 2, 0, FRONT_Z - FD / 2);
      }
      const bolt = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16); bolt.rotateX(Math.PI / 2);
      const boltMat = new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.4, metalness: 0.9 });
      for (let i = 0; i < 12; i++) for (const s of [-1, 1]) add(bolt, boltMat, (i - 5.5) * 1.9, s * (WALL_H + FB) / 2, FRONT_Z + 0.02);
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) add(bolt, boltMat, s * (WALL_W + FB) / 2, (i - 3.5) * 1.9, FRONT_Z + 0.02);
      add(new THREE.PlaneGeometry(WALL_W, WALL_H), new THREE.MeshStandardMaterial({ color: '#020202', roughness: 1 }), 0, 0, -0.6);

      K.env(S, { top: '#0a0c10', horizon: '#0b0c0f', bottom: '#040405', intensity: 0.75, panels: [
        { pos: [-14, 12, 16], size: [14, 8], color: '#eef3ff', power: 2.6 },
        { pos: [16, -6, 12], size: [5, 12], color: '#cfe0ff', power: 1.2 },
      ] });
      const key = K.sun(S, { pos: [-22, 6, 9.5], target: [0, 0, 0], color: '#fff4e6', power: 7, size: 14.5, soft: 1.1, mapSize: 4096, bias: -0.0012, normalBias: 0.01 });
      K.sun(S, { pos: [16, -9, 3.4], target: [0, 0, 0], color: '#5a98ff', power: 2.8, shadow: false });
      const lava = new THREE.PointLight(TINTS.hot, 0, 0, 2); scene.add(lava);

      const cam = {
        pos: K.path([[0, [6.0, -12.8, 3.6]], [DURATION / 3, [4.4, -13.6, 6.0]], [DURATION * 2 / 3, [0.8, -14.4, 9.0]], [DURATION, [-3.0, -14.0, 11.0]]]),
        aim: K.path([[0, [1.6, -3.0, 0.5]], [DURATION / 3, [0.8, -1.1, 0.5]], [DURATION * 2 / 3, [0.5, -0.9, 0.8]], [DURATION, [0.4, -0.6, 1.0]]]),
        ap: K.path([[0, 0.1], [DURATION / 3, 0.07], [DURATION * 2 / 3, 0.04], [DURATION, 0.028]]),
      };

      return {
        update(t) {
          show(t);
          const summit = LEVEL + now.dome * 0.45 + ERUPTIONS.reduce((s, e) => s + (t > e.at ? e.adds : 0), 0);
          lava.position.set(VENT[0], VENT[1], summit + 0.9); lava.intensity = 3.2 * now.glowSeen;
          key.position.set(-22, 6 + t * 0.3, 9.5);
          camera.position.set(...cam.pos(t)); camera.up.set(0, 0, 1); camera.lookAt(...cam.aim(t));
          K.focus(camera, [VENT[0], VENT[1] - 1.5, LEVEL], cam.ap(t));
        },
        overlay(ctx, t, W, H) {
          const k = W / 1920;
          BEATS.forEach((b, i) => {
            const next = BEATS[i + 1], a = (i ? K.seg(t, b.at + 0.05, b.at + 0.45, K.ease.out) : 1) * (next ? 1 - K.seg(t, next.at - 0.3, next.at) : 1);
            if (a <= 0) return;
            ctx.save(); ctx.scale(k, k); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
            ctx.font = '500 60px "Oswald"'; ctx.letterSpacing = '3px';
            const main = b.say.toUpperCase(), wMain = ctx.measureText(main).width;
            ctx.font = '500 42px "Inter"'; ctx.letterSpacing = '0px';
            const wNote = b.note ? ctx.measureText(b.note).width + 56 : 0;
            const w = wMain + wNote + 112, h = 108, x = (1920 - w) / 2, y = 1080 - 160 + (1 - a) * 10;
            ctx.fillStyle = 'rgba(9,10,13,0.88)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(200,210,225,0.34)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,225,0.5)';
            for (const sx of [x + 24, x + w - 24]) { ctx.beginPath(); ctx.arc(sx, y + h / 2, 5, 0, 7); ctx.fill(); }
            ctx.font = '500 60px "Oswald"'; ctx.letterSpacing = '3px'; ctx.fillStyle = '#eef1f6'; ctx.fillText(main, x + 56, y + h / 2 + 3);
            if (b.note) {
              ctx.fillStyle = 'rgba(200,210,225,0.34)'; ctx.fillRect(x + 56 + wMain + 26, y + 24, 2, h - 48);
              ctx.font = '500 42px "Inter"'; ctx.letterSpacing = '0px'; ctx.fillStyle = '#b9c3d2'; ctx.fillText(b.note, x + 56 + wMain + 56, y + h / 2 + 2);
            }
            ctx.restore();
          });
        },
      };
    },

    sound(k) {
      const K = globalThis.K, E0 = ERUPTIONS[0].at;
      k.bed('room', 0, DURATION, { gain: 1.0 });
      // pins sliding in their holes: a faint tick cloud all through
      k.withMinor(() => { for (let t = 0, j = 0; t < DURATION; t += 0.03, j++) k.play('tick', t + 0.01 * K.hash(j, 5), { gain: 0.05 + 0.04 * K.hash(j, 1), f: 4200 + 3600 * K.hash(j, 2), pan: K.hash(j, 3) * 1.6 - 0.8 }); });
      // caption plates: a small tock as each one lands
      BEATS.forEach((b, i) => { if (i) k.play('tock', b.at + 0.08, { gain: 0.3, f: 700 }); });
      // deep rumble swelling from below, cut dead just before the blast so the blast reads
      const rl = E0 - 0.07 - 0.3;
      k.tone(0.3, { f: [[0, 34], [rl, 62]], dur: rl, gain: 0.14, a: rl * 0.85 });
      k.noise(0.3, { dur: rl, color: 'brown', filter: 'lowpass', f: [[0, 110], [rl, 480]], gain: 0.12, a: rl * 0.9 });
      // tremors: a soft thud for each ring crossing the plain
      TREMORS.forEach((e) => k.play('thud', e.at, { gain: 0.18 + e.a * 2.5, f: 70 + e.a * 150 }));
      // cracks opening: ticks that get denser, then a riser
      for (let t = 3.3, j = 0; t < E0 - 0.08; t += 0.2 - 0.15 * K.seg(t, 3.3, E0), j++) k.play('click', t, { gain: 0.5 + 0.8 * K.seg(t, 3.3, E0), f: 1200 + 1800 * K.hash(j, 4), pan: (K.hash(j, 6) - 0.5) * 0.6 });
      k.play('riser', 4.05, { dur: 0.7, gain: 0.5 });
      // eruptions: blow, sub drop, steam, pins of the cone jumping, the ring leaving, lava hissing
      ERUPTIONS.forEach((e, n) => {
        k.play('impact', e.at, { gain: 0.85 * e.adds, f: 92 - n * 6 });
        k.tone(e.at, { f: [[0, 74 - n * 5], [0.6, 33]], dur: 1.0, gain: 0.5, a: 0.006 });
        k.noise(e.at, { dur: 0.7, filter: 'highpass', f: [[0, 2600], [0.7, 900]], gain: 0.2, a: 0.03, verb: 0.3 });
        k.withMinor(() => { for (let t = e.at, j = 0; t < e.at + 0.95; t += 0.008, j++) { const u = (t - e.at) / 0.95; k.play('tick', t, { gain: 0.5 * Math.pow(1 - u, 1.4) * (0.5 + 0.5 * K.hash(j, n)), f: 3000 + 3800 * K.hash(j, n, 3), pan: (K.hash(j, n, 4) - 0.5) * (0.4 + 1.2 * u) }); } });
        k.play('whoosh', e.at + 0.35, { gain: 0.42, dur: 1.5, top: 1800, pan: n % 2 ? 0.3 : -0.3 });
        k.noise(e.at + 0.3, { dur: 2.3, color: 'pink', filter: 'bandpass', f: 3200, q: 0.5, gain: 0.07 * (n === 0 ? 1 : 0.8), a: 0.5, pan: n % 2 ? 0.25 : -0.25 });
      });
      // the volcano stands: one low warm note, one bell, the room goes on
      const end = BEATS[BEATS.length - 1].at;
      k.tone(end, { f: 'D3', type: 'triangle', dur: DURATION - end, gain: 0.065, a: 0.5, hold: 1.2, filter: 'lowpass', f2: 900, verb: 0.3 });
      k.tone(end, { f: 'A3', dur: DURATION - end, gain: 0.045, a: 0.6, hold: 1.2, verb: 0.3 });
      k.play('ding', end + 0.1, { gain: 0.3, f: 'A5' });
    },
  });
}
