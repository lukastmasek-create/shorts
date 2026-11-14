"""Sound for the pause short: voice (gain only) + original score (ducked under speech) + synthesized SFX -> mix.wav.
usage: python audio/pause_audio.py            (run from the repo root, venv active: numpy scipy soundfile)
in : pause/voice/voice.wav, pause/voice/words.json          out: pause/audio/{mix,stem_voice,stem_music,stem_sfx}.wav, cues.md
Every SFX lands on the frame of story.ts / SHOTPLAN.md (f / 30). Master: -15 LUFS integrated, soft limiter to <= -1.2 dBTP.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import SR, ns, tt, dbg, rng, lp, hp, bp, phase, colored, place, st, fades, write_wav, integrated, true_peak, momentary_max
import instruments as I
import sfx_gen as G

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "pause", "audio")
FPS, TOTAL = 30, 1800
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
FREEZE, FREEZE2, FLASH = 23, 1626, 106
R = rng(2026)

# ================================================================ voice
def load_voice():
    x, sr = sf.read(os.path.join(ROOT, "pause", "voice", "voice.wav"), dtype="float64")
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = signal.resample_poly(x, SR, sr)
    out = np.zeros(N); out[: min(N, len(x))] = x[:N]
    return st(out)
words = json.load(open(os.path.join(ROOT, "pause", "voice", "words.json")))

# ================================================================ synthesized one-shots (mono)
def freeze_whomp():
    t = tt(0.9)
    f = 150 * np.exp(-t / 0.13) + 34
    low = np.sin(phase(f)) * np.exp(-t / 0.30)
    swell = lp(colored(len(t), R, 0.8), 900) * np.exp(-t / 0.22) * (1 - np.exp(-t / 0.01))
    tick = I.glock(1568, 0.5, R, 1.2)[: len(t)]
    return fades(0.9 * low + 0.35 * swell + np.pad(tick, (0, len(t) - len(tick))) * 0.35, 0.002, 0.08)
def unfreeze():
    return freeze_whomp()[::-1] * np.linspace(0.3, 1, ns(0.9)) ** 1.5
def boing():
    t = tt(0.55)
    f = 260 + 380 * np.sin(np.pi * np.clip(t / 0.4, 0, 1)) ** 1.2 + 14 * np.sin(2 * np.pi * 22 * t)
    return fades(np.sin(phase(f)) * np.exp(-t / 0.28), 0.003, 0.06) * 0.7
def thump(big=1.0):
    t = tt(0.45)
    y = np.sin(phase(58 + 55 * np.exp(-t / 0.03))) * np.exp(-t / 0.16)
    y += lp(R.standard_normal(len(t)), 400) * np.exp(-t / 0.02) * 0.5
    return fades(y * big, 0.001, 0.05)
def pop(f0=900, f1=300):
    t = tt(0.09)
    return fades(np.sin(phase(f1 + (f0 - f1) * np.exp(-t / 0.015))) * np.exp(-t / 0.03), 0.0005, 0.02) * 0.8
def paper(dur=0.12):
    t = tt(dur)
    return fades(bp(R.standard_normal(len(t)), 2200, 8000, 1) * np.exp(-t / 0.035) * (1 - np.exp(-t / 0.004)), 0.002, 0.02) * 0.5
def scribble(dur=0.32):
    t = tt(dur)
    return fades(bp(R.standard_normal(len(t)), 1800, 6500, 1) * (0.5 + 0.5 * np.sin(2 * np.pi * 15 * t)) * np.sin(np.pi * t / dur), 0.01, 0.03) * 0.35
def tick(hi=True):
    t = tt(0.14)
    return fades(G.modal(0.14, [(2100 if hi else 1500, 1.0, 0.025)], R) * 0.6 + hp(R.standard_normal(len(t)), 4000) * np.exp(-t / 0.002) * 0.25, 0.0003, 0.02)
def cup_clink():
    return I.triangle(0.8, R, 0.9, 2400) * 1.2
def squeak(rise=True):
    t = tt(0.3)
    f = (900 + 500 * (t / 0.3)) if rise else (1400 - 500 * (t / 0.3))
    return fades(np.sin(phase(f)) * np.sin(np.pi * t / 0.3) ** 0.7 * 0.35, 0.01, 0.05)
def slide_down(dur=0.9, f0=520, f1=220):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    y = np.sin(phase(f)) + 0.3 * np.sin(2 * phase(f))
    return fades(lp(y, 2500) * np.exp(-t / (dur * 0.8)), 0.01, 0.15) * 0.5
def sting_down():
    t = tt(1.1)
    f = 440 * (0.28) ** (t / 1.1)
    y = (np.sin(phase(f)) + 0.5 * np.sin(phase(f * 1.06)) + 0.25 * np.sin(2 * phase(f))) * np.exp(-t / 0.7)
    return fades(lp(y, 1800), 0.01, 0.2) * 0.6
def rise_swish(dur):
    return G.whoosh(dur, R, peak=dur * 0.85, f_lo=300, f_hi=4200, width=0.9, tail=0.05)
def coo():
    t = tt(0.5)
    f = 380 - 60 * (t / 0.5) + 25 * np.sin(2 * np.pi * 9 * t)
    return fades(np.sin(phase(f)) * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 2 * 0.4, 0.02, 0.1)
def exhale(dur=0.9):
    return fades(lp(colored(ns(dur), R, 0.5), 1500) * np.sin(np.pi * np.linspace(0, 1, ns(dur))) ** 2, 0.05, 0.15) * 0.5

# ================================================================ SFX stem
sfx = np.zeros((2, N)); log = []
def ev(f, x, g=1.0, p=0.0, name=""):
    from dsp import pan
    place(sfx, pan(x if x.ndim == 1 else x.mean(0), p), fr(f), g); log.append((f, name))

# --- the live street: 0..FREEZE, gated off at the freeze
amb = np.zeros((2, N))
place(amb, G.breeze(fr(FREEZE) + 0.5, R, 0.5), 0, 1.0)
for k, (b, s, p) in enumerate([(120, 1.0, -0.5), (200, 1.2, 0.4), (150, 0.9, 0.0), (210, 1.15, 0.6)]):
    place(amb, np.stack([G.babble(1.3, R, b, s), G.babble(1.3, R, b * 1.05, s)]) * 0.5, 0.0, 1.0)
car = np.sin(phase(np.full(ns(1.3), 62.0))) * 0.12 + lp(colored(ns(1.3), R, 1.0), 300) * 0.15
place(amb, car, 0, 1.0)
for k in range(6): place(amb, paper(0.1) * 0.6 * np.sin(k + 1) ** 2, 0.05 + k * 0.12, 1.0)  # pigeon wing flutter
gate = np.ones(N); g0 = ns(fr(FREEZE) - 0.03)
gate[g0:] = np.exp(-np.arange(N - g0) / SR / 0.02)
sfx += amb * gate
ev(FREEZE - 2, freeze_whomp(), 1.1, 0, "freeze whomp")
# --- footsteps while the hero walks
for a, b in [(0, FREEZE), (108, 166), (236, 290)]:
    f = a + 6
    while f < b:
        ev(f, G.stroll_step(R, 0.5), 0.55, -0.1 + 0.2 * ((f // 17) % 2), "step"); f += 17
# --- hook flash + camera moves
ev(FLASH - 2, G.whoosh(0.5, R, 0.08, 500, 3500, 0.9, 0.3), 0.7, 0, "flash whoosh"); ev(FLASH, I.glock(1976, 0.6, R, 1.4), 0.45, 0, "flash sparkle")
for f in [141, 287, 419, 533, 597, 611, 623, 644, 725, 824, 1267, 1366, 1394, 1538]:
    ev(f - 5, G.whoosh(0.28, R, 0.1, 500, 2600, 0.8, 0.14), 0.35, 0, "cut/glide whoosh")
# --- shot 4: pigeon poke, spin, sticker
ev(188, boing(), 0.8, 0.2, "poke boing"); ev(195, rise_swish(0.45), 0.5, 0, "pigeon spin"); ev(213, pop(), 0.9, 0, "sticker pop"); ev(214, I.musicbox(1568, 0.7, R, 1.0), 0.5, 0, "sticker ting")
# --- shot 5-6: coffee, unfreeze
ev(290, cup_clink(), 0.5, 0.3, "cup clink")
ev(318, unfreeze(), 1.0, 0, "time restarts")
for k, (b, s) in enumerate([(130, 1.0), (205, 1.2), (160, 0.95)]): ev(322 + 3 * k, G.babble(1.1, R, b, s) * 0.5, 0.45, [-0.6, 0.5, 0][k], "queue babble")
# --- shot 7: homework scribble, page turns, stack thud
for k in range(5): ev(361 + k * 12, scribble(), 0.9, -0.2, "scribble")
ev(419, paper(0.2), 1.0, 0, "page"); ev(421, scribble(0.5), 0.9, 0.3, "neighbor scribble"); ev(428, thump(1.0), 0.8, 0, "stack thud")
# --- shot 8: growing book tower, pigeon coo
for k in range(10):
    f = 458 + k * 11; ev(f, thump(0.35) * 0.9, 0.6, 0.3, "book"); ev(f, paper(0.1), 0.4, -0.2, "book paper")
ev(533, coo(), 0.8, 0.0, "coo")
# --- shot 9: strangers
ev(596, I.triangle(0.6, R, 0.8, 2093), 0.5, 0, "hat tip ting"); ev(610, squeak(True), 0.8, -0.3, "hug squeak"); ev(622, I.musicbox(1319, 0.7, R, 0.7), 0.5, 0.3, "dance 1"); ev(626, I.musicbox(1568, 0.7, R, 0.7), 0.5, 0.3, "dance 2"); ev(630, I.musicbox(1760, 0.7, R, 0.7), 0.5, 0.3, "dance 3")
ev(644, rise_swish(0.5), 0.45, 0, "wide whoosh")
# --- shots 10-11: mirror, grey strand, friends, sting
ev(723, I.glock(2093, 0.8, R, 1.5), 0.5, 0, "strand glint"); ev(724, boing(), 0.35, 0.2, "strand boing")
ev(741, sting_down(), 0.5, 0, "grey sting"); ev(743, thump(0.9), 0.7, 0, "grey kick")
# --- shot 12: clocks accumulating
for i in range(14):
    f0 = 806 + 5 * i
    for k in range(4): ev(f0 + k * 30 + 2, tick(i % 2 == 0), 0.35, (-0.8 + 1.6 * (i % 7) / 6), "clock tick")
    ev(f0, pop(700 + 40 * i, 380), 0.45, (-0.8 + 1.6 * (i % 7) / 6), "clock pop")
ev(815, rise_swish(1.1), 0.35, -0.3, "pie spin")
# --- shot 13: ages
ev(905, I.pluck(220, 0.8, R, 0.8), 0.5, 0, "hair step 1"); ev(925, I.pluck(196, 0.8, R, 0.8), 0.5, 0, "hair step 2"); ev(938, sting_down(), 0.65, 0, "ages sting"); ev(938, thump(1.0), 0.8, 0, "ages kick"); ev(940, pop(), 0.5, 0, "glasses pop")
# --- shots 14-16: explainer
ev(981, G.whoosh(0.3, R, 0.08, 600, 3200), 0.4, 0, "slice whoosh"); ev(1021, tick(True), 0.6, 0, "tick 10 min")
for k in range(6): ev(1010 + 9 * k, paper(0.14), 0.7, -0.4 + 0.15 * k, "calendar page flick")
for k, f in enumerate([523, 587, 659, 784, 880, 1047]): ev(1046 + 4 * k, I.musicbox(f, 0.8, R, 0.6), 0.5, 0.2, "hour block")
for k in range(20): ev(1092 + int(k * 2.75), I.pluck(262 * 2 ** ((k % 8) / 8) * (1 + k // 8), 0.7, R, 0.35), 0.35, -0.2 + 0.4 * (k % 2), "tower note")
ev(1143, thump(1.2), 0.9, 0, "tower thud"); ev(1143, I.cymbal(0.4, R, 1.6), 0.25, 0, "tower cymbal")
ev(1190, rise_swish(0.8), 0.4, -0.2, "bar 1"); ev(1226, rise_swish(1.0), 0.4, 0.2, "bar 2")
ev(1262, I.glock(1760, 0.8, R, 1.6), 0.55, 0.3, "sliver ping"); ev(1282, I.timpani(98, 0.9, R, 1.8), 0.8, 0, "more timpani"); ev(1282, thump(0.8), 0.5, 0, "more thump")
# --- shots 17-18: party
ev(1298, I.glock(1568, 0.6, R, 1.2), 0.35, 0, "cake ding"); ev(1368, I.pluck(392, 0.9, R, 0.5), 0.45, 0, "glasses boop"); ev(1394, slide_down(1.0, 500, 200), 0.5, 0, "yawn slide")
ev(1396, exhale(0.8), 0.4, 0, "yawn breath"); ev(1430, I.vibes(392, 0.8, R, 0.9), 0.55, -0.4, "? 1"); ev(1447, I.vibes(330, 0.8, R, 1.0), 0.55, 0.4, "? 2")
ev(1473, thump(0.9), 0.7, 0, "why kick"); ev(1473, I.glock(1319, 0.7, R, 1.4), 0.4, 0, "why glock")
# --- shots 19-21: porch, ten minutes, freezes again, eyes close
murmur = np.zeros((2, N)); place(murmur, np.stack([G.babble(5.0, R, 130, 1.0), G.babble(5.0, R, 190, 1.1)]) * 0.45, fr(1490), 1.0); place(murmur, np.stack([G.babble(5.0, R, 170, 0.95), G.babble(5.0, R, 120, 1.05)]) * 0.4, fr(1492), 1.0)
g1 = np.ones(N); a1 = ns(fr(1540)); g1[a1:] = np.exp(-np.arange(N - a1) / SR / 0.6)   # the room hushes for "secret"
sfx += murmur * g1 * (np.arange(N) < ns(fr(1600))) * 0.7
for k, f in enumerate([1518, 1523, 1528]): ev(f, thump(0.2) * 0.8, 0.4, -0.5 + 0.5 * k, "mic bump")
for k, f in enumerate([1590, 1593, 1596, 1599]): ev(f, I.glock(1047 * 2 ** (k / 4), 0.8, R, 1.2), 0.5, 0, "ten fingers arp")
ev(1591, thump(0.8), 0.6, 0, "ten kick")
ev(FREEZE2 - 2, freeze_whomp(), 1.0, 0, "freeze again")
ev(1695, exhale(1.2), 0.7, 0, "eyes close breath")
ev(1727, I.musicbox(1047, 0.6, R, 2.5), 0.35, 0, "world waits note"); ev(1748, I.glock(2093, 0.6, R, 2.5), 0.3, 0, "world waits sparkle")

# ================================================================ music stem
BPM = 96; BAR = 4 * 60 / BPM
m2f = I.m2f
CH = {"C": [48, 52, 55, 59], "Am": [45, 52, 55, 60], "F": [41, 48, 53, 57], "G": [43, 50, 55, 59]}
ROOT_N = {"C": 36, "Am": 33, "F": 29, "G": 31}
PENT = [72, 74, 76, 79, 81, 84]
music = np.zeros((2, N))
t0 = fr(FLASH + 8)
prog = ["C", "Am", "F", "G"]
b = 0
while t0 + b * BAR < DUR - 0.1:
    tb = t0 + b * BAR; name = prog[b % 4]; left = DUR - tb
    quiet = tb > fr(1490) - 0.01
    place(music, I.pad([m2f(n) for n in CH[name]], min(BAR, left), 0.22 if not quiet else 0.3, R, att=0.5, rel=0.6, warm=800), tb, 1.0)
    for beat in (0, 2):
        place(music, I.pluck(m2f(ROOT_N[name] + 12), 0.65, R, 0.8), tb + beat * 60 / BPM, 0.7)
    if not quiet:
        for e in range(8):
            if R.uniform() < 0.72:
                n = PENT[int(R.integers(0, len(PENT)))]
                place(music, (I.vibes if tb > fr(790) else I.musicbox)(m2f(n), 0.45, R, 1.0), tb + e * 30 / BPM, 0.55)
        for beat in range(1, 8, 2): place(music, I.brush(0.35, R, 0.12), tb + beat * 30 / BPM, 0.5)
    else:
        for e in (0, 3, 6): place(music, I.musicbox(m2f(PENT[(b + e) % len(PENT)] - 12), 0.4, R, 1.4), tb + e * 30 / BPM, 0.5)
    b += 1
# final held C major with add9
tend = fr(1724)
place(music, I.pad([m2f(n) for n in (48, 55, 60, 64, 67, 74)], DUR - tend - 0.3, 0.3, R, att=1.0, rel=0.8, warm=700), tend, 1.0)
music[:, ns(fr(FREEZE2)) - ns(0.05): ns(fr(FREEZE2)) + ns(0.3)] *= 0.4   # dip at the second freeze

# ================================================================ mix
v = load_voice()
spans = []
for w in words:
    s, e = float(w["start"]), float(w["end"])
    if spans and s - spans[-1][1] < 0.3: spans[-1][1] = max(spans[-1][1], e)
    else: spans.append([s, e])
ctrl = 1000; nc = int(DUR * ctrl) + 2; va = np.zeros(nc)
for s, e in spans: va[max(0, int((s - 0.08) * ctrl)): int((e + 0.12) * ctrl)] = 1.0
ka, kr = 1 - np.exp(-1 / (0.07 * ctrl)), 1 - np.exp(-1 / (0.45 * ctrl)); env = np.zeros(nc); e_ = 0.0
for i in range(nc):
    e_ += (va[i] - e_) * (ka if va[i] > e_ else kr); env[i] = e_
duck = np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, -3.0 * env)
music = music * dbg(duck)[None, :]
Lv = integrated(v)
music *= dbg(Lv - 10.0 - integrated(music))      # music bed 10 LU under the voice
sfx *= dbg(Lv - 11.0 - integrated(sfx))          # sfx stem 11 LU under the voice (events punch above it)
mix = v + music + sfx
g = dbg(-15.0 - integrated(mix))
v, music, sfx, mix = v * g, music * g, sfx * g, mix * g
ceil = dbg(-1.2)
if true_peak(mix) > -1.2:
    k = np.tanh(np.abs(mix) / ceil * 0.9) / 0.9
    mix = np.sign(mix) * k * ceil
for _ in range(3):
    tp = true_peak(mix)
    if tp <= -1.2: break
    mix *= dbg(-1.25 - tp)
os.makedirs(OUT, exist_ok=True)
for n, x in [("mix", mix), ("stem_voice", v), ("stem_music", music), ("stem_sfx", sfx)]: write_wav(os.path.join(OUT, n + ".wav"), x)
with open(os.path.join(OUT, "cues.md"), "w") as f:
    f.write(f"# Pause short soundtrack cue sheet\n\nmix.wav 48 kHz stereo 24-bit, {N} samples = {DUR:.3f} s. Voice = pause/voice/voice.wav, gain only.\n\n")
    f.write(f"Master: integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP, max momentary {momentary_max(mix):.1f} LUFS\n")
    f.write(f"Stems: voice {integrated(v):.1f}, music {integrated(music):.1f}, sfx {integrated(sfx):.1f} LUFS\n\n| frame | time | event |\n|---|---|---|\n")
    for fm, nm in sorted(log): f.write(f"| {fm} | {fr(fm):.2f} | {nm} |\n")
print(f"mix {DUR:.2f}s  integrated {integrated(mix):.1f} LUFS  tp {true_peak(mix):.1f} dBTP  voice {integrated(v):.1f} music {integrated(music):.1f} sfx {integrated(sfx):.1f}  events {len(log)}")
