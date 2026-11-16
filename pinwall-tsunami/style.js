{
  // ---------------------------------------------------------------- content: how a tsunami works and appears
  // One moving relief. Left: a fault line on the seafloor. Right: a coast with a few houses. In between: deep sea, then a shelf.
  // A pin shows whichever is higher, the water surface or the ground under it (sea floor, beach, land).
  const DURATION = 12.5;
  const WALL_W = 20.6, WALL_H = 15.4;
  const BEATS = [
    { at: 0.0, say: 'A quake jolts the seafloor' },
    { at: 2.3, say: 'The whole sea is lifted', note: '~700 km/h in deep water' },
    { at: 4.7, say: 'Shallows slow it and stack it up' },
    { at: 7.0, say: 'The sea drains away first' },
    { at: 9.2, say: 'Then it floods the coast' },
  ];
  const TINTS = { deep: '#46689e', pale: '#bfe9ff', land: '#ffc890', hot: '#ff5a12' };   // sea, shallows and foam, ground, quake energy

  const SEA = 0.5;                                   // resting sea level (how far pins stand out)
  const FAULT = { x: -6.4, y0: -3.3, y1: 3.3 };      // the rupture: a line on the seafloor
  const T0 = 1.2;                                    // the quake
  const C0 = 2.1;                                    // wave speed in deep water, units per second (speed ~ sqrt(depth))
  const DP = 1.6, SHELF = 5.0, EXPO = 1.6;           // deep-water depth, width of the shelf, how it shoals (depth ~ distance^1.6)
  const SWELL = [
    { dir: [0.95, 0.3], length: 2.8, speed: 1.5, height: 0.035 },
    { dir: [0.8, -0.6], length: 1.5, speed: 1.1, height: 0.02 },
  ];
  const HOUSES = [[0.9, -3.6, 0.5, 0.5, 0.32], [1.2, -1.2, 0.6, 0.4, 0.36], [0.8, 1.0, 0.4, 0.5, 0.3], [1.6, 2.4, 0.5, 0.5, 0.34], [1.9, -0.2, 0.4, 0.4, 0.3], [2.3, -3.0, 0.5, 0.4, 0.3], [2.6, 1.8, 0.4, 0.4, 0.34]];   // [inland distance, y, w, d, height]

  const N = K.noise(7), TAU = Math.PI * 2;
  const waves = SWELL.map((w) => ({ kx: TAU / w.length * w.dir[0], ky: TAU / w.length * w.dir[1], om: TAU / w.length * w.speed, h: w.height }));
  const coastX = (y) => 5.2 + 0.6 * Math.sin(0.5 * y + 1.0) + 0.3 * Math.sin(1.4 * y + 0.3);
  const depthAt = (dc) => (dc <= 0 ? 0 : DP * Math.pow(Math.min(1, dc / SHELF), EXPO));
  const speedAt = (dc) => K.lerp(C0 * Math.pow(Math.max(Math.min(dc, SHELF), 0.4) / SHELF, EXPO / 2), 1.3, K.smooth(0.4, -0.2, dc));   // slows over the shelf, a bore on land

  function setup(x, y) {
    const dc = coastX(y) - x, e = -dc;                                        // dc: distance to the shore (negative on land)
    const py = K.clamp(y, FAULT.y0, FAULT.y1), dx = x - FAULT.x, dy = y - py, ds = Math.hypot(dx, dy);   // ds: distance to the fault
    let T = 0; const n = 24;                                                   // travel time from the fault to this pin: add up 1/speed along the way
    for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; T += (ds / n) / speedAt(coastX(py + dy * f) - (FAULT.x + dx * f)); }
    const depth = depthAt(dc);
    let ground = dc > 0 ? SEA - depth + 0.03 * N.fbm(x * 1.4 + 3, y * 1.4, 1, 3)
      : SEA + Math.min(0.85, e * 0.15) + 0.3 * K.smooth(2.5, 6, e) * (0.5 + N.fbm(x * 0.5, y * 0.5, 5, 2)) + 0.05 * N.fbm(x * 1.4 + 3, y * 1.4, 1, 3);
    for (const h of HOUSES) if (Math.abs(e - h[0]) < h[2] / 2 && Math.abs(y - h[1]) < h[3] / 2) ground += h[4];
    const spread = 1 / Math.sqrt(1 + Math.max(0, ds - 1.2) / 7);               // the wave thins out as its front widens
    const absorb = 1 - 0.92 * K.smooth(-8.4, -10.1, x);                        // the far left edge swallows the wave
    return {
      dc, e, ds, T, ground, depth,
      aSea: 0.24 * spread * Math.pow(DP / Math.max(depth, 0.08), 0.25) * (1 + 2.0 * Math.exp(-Math.max(dc, 0) / 1.7)) * absorb,   // taller as the water gets shallow
      aLand: Math.exp(-Math.max(e, 0) / 2.4) * spread * (1 + 0.28 * N.n2(y * 1.1 + 9, 2.3)),                                    // the surge thins out inland
      landw: K.smooth(0.35, -0.5, dc),
      ph: waves.map((w) => w.kx * x + w.ky * y),
      rnd: K.hash(x * 9.1, y * 7.3),
    };
  }

  function moment(t) { return { q: Math.max(0, t - T0) }; }

  function relief(p, m, t, o) {
    const u = t - T0 - p.T;                                                    // where this pin is in the passing wave (0 = crest)
    const gate = K.smooth(T0 - 0.05, T0 + 0.3, t);
    const crest = Math.exp(-Math.pow(u / 0.6, 2));
    const trough = -0.7 * K.smooth(0.8, 2.6, p.T) * Math.exp(-Math.pow((u + 1.6) / 0.8, 2));     // the trough runs ahead of the crest
    const second = 0.35 * K.smooth(1, 3, p.T) * Math.exp(-Math.pow((u - 2.8) / 0.65, 2));        // and a smaller wave follows
    const seaEta = p.aSea * gate * (crest + trough + second);
    const flood = K.smooth(-0.3, 0.5, u) * (1 - 0.35 * K.smooth(1.8, 3.8, u));                   // on land: the water arrives and stays
    const eta = K.lerp(seaEta, p.aLand * flood, p.landw);
    let sw = 0;
    for (let i = 0; i < waves.length; i++) sw += waves[i].h * Math.sin(p.ph[i] - waves[i].om * t);
    sw *= (1 - 0.85 * p.landw) * (1 - 0.6 * K.smooth(1, 0, p.dc));
    const sea = SEA + eta + sw;

    const tq = t - T0 - p.ds / 6;                                                // seismic shock runs out at 6 units/s
    const shake = tq > 0 ? 0.07 * Math.exp(-p.ds / 5 - tq / 0.8) * Math.sin(t * 47 + p.rnd * 37) : 0;
    const q = m.q, ring = q > 0 ? Math.exp(-Math.pow((p.ds - 6 * q) / 0.55, 2) - q / 0.9) : 0;

    const wd = sea - p.ground, dry = K.smooth(-0.02, 0.05, p.ground - sea);
    o.lift = Math.max(sea, p.ground) + shake;
    o.land = dry;
    o.pale = K.clamp(0.9 * K.smooth(1.0, 0.05, wd) * (1 - dry) + 2.2 * Math.max(0, eta - 0.05) * (1 - dry));
    o.hot = K.clamp(Math.exp(-Math.pow(p.ds / 0.4, 2)) * (0.4 + (q > 0 ? 1.2 * Math.exp(-q / 1.0) : 0)) + 0.6 * ring);
  }

  // ---------------------------------------------------------------- the mechanism
  const PITCH = 0.1;

  registerStyle({
    id: 'pin-wall-tsunami',
    name: 'Pin Wall',
    family: 'Flat content made physical',
    topic: 'How tsunamis work and appear',
    duration: DURATION,
    fonts: ['500 60px "Oswald"', '500 40px "Inter"'],
    render: { samples: 40, shutter: 0.55, tone: 'filmic', exposure: 1.2, bloom: 0.4, bloomThreshold: 1.3, vignette: 0.4, grain: 0.012, saturation: 1.12, fov: 28, background: '#030304' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const patch = (m, lit) => {
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aPin; varying vec4 vPin; varying float vShaft;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShaft = position.z; vPin = aPin; transformed.z += aPin.x;');
          if (lit) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vPin; varying float vShaft; uniform vec3 uDeep, uPale, uLand, uHot;')
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat head = smoothstep(-0.085, -0.03, vShaft);\ndiffuseColor.rgb *= mix(mix(uDeep, uPale, vPin.w), uLand, vPin.y) * mix(0.42, 1.0, head);')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHot * vPin.z * vPin.z * mix(0.3, 1.0, head);');
        };
        return m;
      };
      const U = { uDeep: { value: new THREE.Color(TINTS.deep) }, uPale: { value: new THREE.Color(TINTS.pale) }, uLand: { value: new THREE.Color(TINTS.land) }, uHot: { value: new THREE.Color(TINTS.hot).multiplyScalar(7) } };
      const R = PITCH * 0.47, LEN = 7, prof = [];
      for (const q of [0, 0.3, 0.55, 0.75, 0.9, 0.98, 1]) prof.push(new THREE.Vector2(Math.max(1e-4, q * R), -0.62 * R * (1 - Math.sqrt(1 - q * q * 0.985))));
      prof.push(new THREE.Vector2(R, -0.075), new THREE.Vector2(R * 0.9, -0.085), new THREE.Vector2(R * 0.9, -LEN));
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
      const FB = 0.8, FRONT_Z = SEA + 0.3, FD = 2.2;
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
      const lamp = new THREE.PointLight(TINTS.hot, 0, 0, 2); scene.add(lamp);

      const cam = {
        pos: K.path([[0, [-8.8, -9.6, 2.5]], [3.5, [-5.0, -12.8, 5.6]], [7, [0.5, -15.2, 9.0]], [DURATION, [2.8, -17.6, 12.8]]]),
        aim: K.path([[0, [-5.8, -1.4, 0.5]], [3.5, [-2.4, -0.9, 0.5]], [7, [2.0, -0.5, 0.5]], [DURATION, [2.0, -0.2, 0.4]]]),
        ap: K.path([[0, 0.11], [4, 0.07], [8, 0.04], [DURATION, 0.03]]),
      };

      return {
        update(t) {
          show(t);
          const q = Math.max(0, t - T0);
          lamp.position.set(FAULT.x, 0, SEA + 1.4); lamp.intensity = 3 * (0.12 + (q > 0 ? Math.exp(-q / 1.2) : 0));
          key.position.set(-22, 6 + t * 0.3, 9.5);
          camera.position.set(...cam.pos(t)); camera.up.set(0, 0, 1); camera.lookAt(...cam.aim(t));
          K.focus(camera, cam.aim(t), cam.ap(t));
        },
        overlay(ctx, t, W, H) {
          BEATS.forEach((b, i) => {
            const next = BEATS[i + 1], a = (i ? K.seg(t, b.at + 0.05, b.at + 0.45, K.ease.out) : 1) * (next ? 1 - K.seg(t, next.at - 0.3, next.at) : 1);
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
            ctx.font = '500 52px "Oswald"'; ctx.letterSpacing = '3px';
            const main = b.say.toUpperCase(), wMain = ctx.measureText(main).width;
            ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px';
            const wNote = b.note ? ctx.measureText(b.note).width + 56 : 0;
            const w = wMain + wNote + 112, h = 96, x = (W - w) / 2, y = H - 150 + (1 - a) * 10;
            ctx.fillStyle = 'rgba(9,10,13,0.86)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(200,210,225,0.34)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,225,0.5)';
            for (const sx of [x + 24, x + w - 24]) { ctx.beginPath(); ctx.arc(sx, y + h / 2, 5, 0, 7); ctx.fill(); }
            ctx.font = '500 52px "Oswald"'; ctx.letterSpacing = '3px'; ctx.fillStyle = '#eef1f6'; ctx.fillText(main, x + 56, y + h / 2 + 3);
            if (b.note) {
              ctx.fillStyle = 'rgba(200,210,225,0.34)'; ctx.fillRect(x + 56 + wMain + 26, y + 24, 2, h - 48);
              ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px'; ctx.fillStyle = '#b9c3d2'; ctx.fillText(b.note, x + 56 + wMain + 56, y + h / 2 + 2);
            }
            ctx.restore();
          });
        },
      };
    },
  });
}
