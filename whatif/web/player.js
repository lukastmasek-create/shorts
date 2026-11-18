// Episode player: lazily builds scenes, applies transitions, hook title, optional captions. setTime(T) is a pure function of T.
import { THREE, Scene, W, H, rect, shape, text, ellP, setOrder, setAlpha, ease, clamp, lerp, C, INK } from './engine.js';
import { P } from './props.js';
import { timeline, cues } from './timeline.js';
const TR = { cut: { d: 0 }, push: { d: .5, dx: -1 }, pushr: { d: .5, dx: 1 }, pushu: { d: .55, dy: -1 }, pushd: { d: .55, dy: 1 }, wipe: { d: .7 }, iris: { d: .8 }, flash: { d: .4 } };
export class Player {
  constructor(ep, { canvas, w = 1080, h = 1920, captions = false, timing = {} } = {}) {
    this.ep = ep; this.tl = timeline(ep); this.captions = captions; this.cs = cues(ep, this.tl, timing); this.w = w; this.h = h;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); this.r.setPixelRatio(1); this.r.setSize(w, h, false); this.r.setClearColor(INK);
    this.cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -10, 10); this.scene = new THREE.Scene(); this.sc = []; this.built = [];
    this.trs = this.tl.scenes.map((s, i) => { const t = ep.scenes[i].tr || ep.tr || 'push', o = TR[t] || TR.push; return { k: i === 0 ? 'cut' : t, ...(i === 0 ? TR.cut : o), d: i === 0 ? 0 : (o.d) }; });
    const acc = (ep.pal && ep.pal.acc) || C.red; setOrder(5e6); this.hook = new THREE.Group(); this.scene.add(this.hook);
    this.hookT = text(this.hook, ep.hook, { size: .98, color: '#fff', stroke: INK, sw: .2, lh: 1.12 }); this.hook.position.set(0, 6.9, 0);
    setOrder(6e6); this.cap = new THREE.Group(); this.scene.add(this.cap); this.cap.position.set(0, -7.4, 0); this.capS = null; this.capT = null;
    setOrder(1e8); this.ov = new THREE.Group(); this.scene.add(this.ov); const wp = W * 1.6, pts = [];
    for (let i = 0; i <= 24; i++) pts.push([wp / 2 + Math.sin(i * .9) * .35, -H / 2 - 1 + (H + 2) * i / 24]); for (let i = 24; i >= 0; i--) pts.push([-wp / 2 + Math.sin(i * .9 + 2) * .35, -H / 2 - 1 + (H + 2) * i / 24]);
    this.wipe = shape(this.ov, pts, { fill: acc, stroke: INK, lw: .16 }); this.ring = shape(this.ov, [[-30, -30], [30, -30], [30, 30], [-30, 30]], { fill: INK, lw: 0, holes: [ellP(5, 5, 24)] }); this.ring.acc = acc;
    this.fl = rect(this.ov, 40, 40, '#fff', { lw: 0, r: 0 }); this.fade = rect(this.ov, 40, 40, INK, { lw: 0, r: 0 });
  }
  scene_(i) {
    if (!this.sc[i]) { setOrder(i * 3e5 + 1); const s = new Scene(this.ep, this.ep.scenes[i], i, this.tl.scenes[i], P); this.ep.scenes[i].build(s); this.sc[i] = s; this.scene.add(s.root); }
    return this.sc[i];
  }
  setTime(T) {
    const n = this.tl.scenes.length, S = this.tl.scenes, tr = this.trs, vis = [], ovl = { w: 0, r: 0, f: 0 };
    for (let i = 0; i < n; i++) {
      const ov = tr[i].k === 'push' || tr[i].k === 'pushr' || tr[i].k === 'pushu' || tr[i].k === 'pushd', d = tr[i].d, ni = i + 1 < n ? tr[i + 1] : null, nov = ni && ['push', 'pushr', 'pushu', 'pushd'].includes(ni.k);
      const a = i === 0 ? -1e9 : S[i].start - (ov ? d / 2 : 0), b = ni ? S[i + 1].start + (nov ? ni.d / 2 : 0) : 1e9; vis[i] = T >= a - 1e-6 && T < b + 1e-6 && !(ni && !nov && T >= S[i + 1].start);
    }
    for (let i = 0; i < n; i++) { const s = vis[i] ? this.scene_(i) : this.sc[i]; if (!s) continue; s.root.visible = vis[i]; s.root.position.set(0, 0, 0); if (vis[i]) s.update(T - S[i].start); }
    for (const o of [this.wipe, this.ring, this.fl]) o.g.visible = false;
    for (let j = 1; j < n; j++) {
      const t = tr[j], b = S[j].start, p = (T - (b - t.d / 2)) / t.d; if (!t.d || p < 0 || p > 1) continue;
      if (t.dx || t.dy) { const e = ease.io(p), A = this.sc[j - 1], B = this.sc[j]; if (A) A.root.position.set((t.dx || 0) * W * e, (t.dy || 0) * H * e, 0); if (B) B.root.position.set(-(t.dx || 0) * W * (1 - e), -(t.dy || 0) * H * (1 - e), 0); }
      else if (t.k === 'wipe') { this.wipe.g.visible = true; this.wipe.g.position.x = lerp(-W * 1.5, W * 1.5, ease.io(p)); }
      else if (t.k === 'iris') { this.ring.g.visible = true; const r = Math.max(.02, 13 * (p < .5 ? 1 - ease.io(p * 2) : ease.io(p * 2 - 1))); this.ring.set([[-30, -30], [30, -30], [30, 30], [-30, 30]], [ellP(r, r, 56)]); }
      else if (t.k === 'flash') { this.fl.g.visible = true; setAlpha(this.fl.g, Math.sin(Math.PI * p)); }
    }
    // hook
    const h = this.hook, hp = ease.back(clamp(T / .35)), ho = 1 - clamp((T - 2.7) / .3); h.visible = T < 3.05; h.scale.setScalar(Math.max(.001, hp)); h.position.y = 6.9 + (1 - ho) * 1.5; setAlpha(h, ho);
    // end fade
    const ef = clamp((T - (this.tl.total - .4)) / .4); this.fade.g.visible = ef > 0; setAlpha(this.fade.g, ef);
    if (this.captions) { const c = this.cs.find(c => T >= c.a && T < c.b); const k = c ? c.text : ''; if (k !== this.capS) { this.capS = k; if (this.capT) { this.cap.remove(this.capT.g); } setOrder(6e6); this.capT = k ? text(this.cap, k.replace(/(.{18,}?)\s/, '$1\n'), { size: .6, color: '#fff', stroke: INK, sw: .16 }) : null; } }
  }
  render() { this.r.render(this.scene, this.cam); }
  png(fmt = 'png', q = .92) { return this.r.domElement.toDataURL(fmt === 'jpg' ? 'image/jpeg' : 'image/png', q); }
}
