"""Music + sound design for CodeShort (Kód na hraní showcase, 2d/src/Code.tsx). Original score, silent film otherwise.
usage: python audio/code_mix.py        (needs numpy + scipy)
out:   public/code/music.wav (48 kHz stereo 16-bit, exactly CODE_FRAMES long) + code/audio/music.wav (working copy)
Timing: events are given in VIRTUAL frames (the authored timeline S in Code.tsx) and mapped to real frames with the same
K factors; keep S, K below identical to Code.tsx. D minor, ~99 bpm, 4/4: Dm - Bb - F - C, ends on D major.
Arc: A drone + slam | B pulse starts | C-F groove builds, UI sounds | G breather | H riser + climbing nodes | I climax, D major.
"""
import os, sys
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, fades, phase, place, st, pan, norm_to, integrated, true_peak, write_wav, make_ir, convolve_st
from instruments import pluck, pad, musicbox, glock, vibes, timpani, cymbal, snare, m2f

ROOT = os.path.dirname(HERE)
os.makedirs(os.path.join(ROOT, "code", "audio"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public", "code"), exist_ok=True)

FPS = 30
S = [0, 100, 205, 370, 480, 580, 685, 780, 915, 1045]
K = [1.25, 1.3, 1.4, 1.3, 1.3, 1.3, 1.3, 1.5, 1.3]
R = [0]; _c = 0.0
for i, k in enumerate(K):
    _c += (S[i + 1] - S[i]) * k
    R.append(int(np.floor(_c + 0.5)))
TOTAL = R[9]; DUR = TOTAL / FPS; N = ns(DUR)


def v2r(v):
    i = 0
    for k in range(9):
        if v >= S[k]:
            i = k
    return R[i] + (v - S[i]) * (R[i + 1] - R[i]) / (S[i + 1] - S[i])


T = lambda v: v2r(v) / FPS            # virtual frame -> seconds
SEC = [R[i] / FPS for i in range(10)]  # scene starts (s)
SCENE = lambda t: max(i for i in range(9) if t >= SEC[i] - 1e-6)
CLIMAX = T(977)                        # motto slams here
BAR = CLIMAX / 18.0                    # so the climax lands on a downbeat
BEAT = BAR / 4
r = rng(2026)


# ---------------------------------------------------------------- one-shots (mono)
def kick(vel=0.8, seed=1):
    t = tt(0.32); f = 46 + 110 * np.exp(-t / 0.028)
    y = np.sin(phase(f)) * np.exp(-t / 0.13) + hp(rng(seed).standard_normal(len(t)), 1800) * np.exp(-t / 0.004) * 0.25
    return fades(y * vel, 0.0004, 0.05)


def hat(vel=0.3, seed=2, open_=False):
    n = ns(0.2 if open_ else 0.05); t = np.arange(n) / SR
    return fades(hp(rng(seed).standard_normal(n), 7000) * np.exp(-t / (0.08 if open_ else 0.014)) * vel, 0.0002, 0.01)


def clap(vel=0.5, seed=3):
    rr = rng(seed); n = ns(0.3); t = np.arange(n) / SR; y = np.zeros(n)
    for d in (0, 0.011, 0.023):
        k = ns(d); m = n - k
        y[k:] += bp(rr.standard_normal(m), 1100, 3800) * np.exp(-np.arange(m) / SR / 0.008)
    y += bp(rr.standard_normal(n), 900, 3000) * np.exp(-t / 0.09) * 0.5
    return fades(y * vel * 0.8, 0.0003, 0.03)


def sub(f=36.7, dur=1.6, vel=0.7):
    t = tt(dur); y = np.sin(phase(np.full(len(t), f))) + 0.25 * np.sin(phase(np.full(len(t), 2 * f)))
    return fades(y * vel * np.exp(-t / (dur * 0.5)), 0.003, 0.2)


def boom(vel=0.9, f=44, dur=2.4, seed=5):
    t = tt(dur); fr = f + 70 * np.exp(-t / 0.05)
    y = np.sin(phase(fr)) * np.exp(-t / 0.8) + lp(rng(seed).standard_normal(len(t)), 500) * np.exp(-t / 0.05) * 0.5
    return fades(y * vel, 0.001, 0.3)


def swoosh(dur=1.1, vel=0.5, seed=7, lo=220, hi=6500):
    rr = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    x = colored(n, rr, 1.0); a = bp(x, lo, lo * 3) * (1 - u) + bp(x, hi * 0.35, hi) * u
    mid = np.sin(np.pi * u) ** 2
    return fades(a * mid * vel * 0.55, 0.01, 0.1)


def riser(dur=3.0, vel=0.5, seed=9, f0=300, f1=9000):
    rr = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    x = colored(n, rr, 0.6); y = np.zeros(n); edges = np.geomspace(f0, f1, 24)
    for a, b in zip(edges[:-1], edges[1:]):
        band = bp(x, a, b, 1)
        c = np.log(np.sqrt(a * b) / f0) / np.log(f1 / f0)       # band opens up as the sweep passes it
        y += band * np.clip(1 - np.abs(u - c) * 2.2, 0, 1)
    tone = np.sin(phase(f0 * 0.5 * (f1 / f0) ** (u * 0.55))) * 0.25 * u
    return fades((y * 0.6 + tone) * vel * u ** 1.6, 0.01, 0.01)


def tick(vel=0.15, seed=11, f=3800):
    rr = rng(seed); n = ns(0.03); t = np.arange(n) / SR
    return fades(bp(rr.standard_normal(n), f * 0.7, f * 1.5, 1) * np.exp(-t / 0.005) * vel, 0.0002, 0.006)


def zap(vel=0.3, f0=500, f1=1800, dur=0.14):
    t = tt(dur); f = np.geomspace(f0, f1, len(t))
    y = np.sin(phase(f)) * np.exp(-t / 0.06) + 0.3 * np.sin(phase(f * 2)) * np.exp(-t / 0.03)
    return fades(y * vel, 0.001, 0.03)


def bloop(vel=0.3, f0=500, f1=950, dur=0.18):
    t = tt(dur); f = np.geomspace(f0, f1, len(t))
    return fades(np.sin(phase(f)) * np.exp(-t / 0.09) * vel, 0.002, 0.04)


def thunk(vel=0.4, f=180):
    t = tt(0.12); return fades((np.sin(phase(np.full(len(t), f))) * np.exp(-t / 0.03) + hp(rng(13).standard_normal(len(t)), 2500) * np.exp(-t / 0.003) * 0.4) * vel, 0.0005, 0.02)


# ---------------------------------------------------------------- buses
music = np.zeros((2, N)); sfx = np.zeros((2, N)); send = np.zeros((2, N))
M = lambda x, t, g=1.0, p=0.0, rv=0.0: (place(music, pan(x, p) if np.ndim(x) == 1 else x, t, g), place(send, pan(x, p) if np.ndim(x) == 1 else x, t, g * rv))
X = lambda x, t, g=1.0, p=0.0: place(sfx, pan(x, p) if np.ndim(x) == 1 else x, t, g)

LEVEL = [0.35, 0.6, 0.75, 0.85, 0.85, 0.9, 0.5, 0.95, 1.0]       # intensity per scene
CH = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]  # Dm Bb F C
PENT = [74, 77, 79, 81, 84, 86]
nbar = int(np.ceil(DUR / BAR))

# drone under everything: D1 sub + D2 soft saw, breathes with the scenes
t = tt(DUR); lv = np.interp(t, SEC[:-1] + [DUR], LEVEL + [LEVEL[-1]])
drone = np.sin(phase(np.full(len(t), 36.71))) * 0.6 + lp(signal.sawtooth(phase(np.full(len(t), 73.42))), 260) * 0.28
drone *= (0.25 + 0.75 * lv) * (1 - 0.35 * (np.sin(TAU * t / (BAR * 2)) * 0.5 + 0.5))
drone[: ns(1.5)] *= np.linspace(0, 1, ns(1.5)) ** 2
M(drone, 0, 0.5)

for b in range(nbar):
    t0 = b * BAR
    if t0 >= DUR:
        break
    root, tones = CH[b % 4]; sc = SCENE(t0); lv = LEVEL[sc]
    final = t0 >= CLIMAX - 0.01
    if final:
        root, tones = 38, [62, 66, 69]                                  # D major, resolved
    # pad: always, long
    M(pad([m2f(n - 12) for n in tones] + [m2f(tones[0] + 7)], BAR * (3 if final else 1), 0.5 * (0.55 + 0.45 * lv), r, att=1.6 if sc == 0 else 0.5, rel=1.4), t0, 0.5, 0, 0.0)
    # bass (not in the breather)
    if sc not in (0, 6) and not final:
        for k, vv in ((0, 1.0), (1.5, 0.7), (2, 0.9), (3.5, 0.7)):
            M(pluck(m2f(root), 0.8 * vv, r, 0.5, bright=0.25), t0 + k * BEAT, 0.8, 0)
    if final:
        M(sub(m2f(26), BAR * 2.5, 0.9), t0, 0.7)
    # arpeggio
    if sc >= 1 and sc != 6 or final:
        steps = 8 if sc in (1,) else 16
        seq = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 24 - 12, tones[2] + 12, tones[1] + 12]
        for k in range(steps):
            n = seq[k % len(seq)] + (12 if sc in (7, 8) and k % 8 == 6 else 0)
            tk = t0 + k * (BAR / steps)
            M(pan(pluck(m2f(n), 0.5 * (0.5 + 0.5 * lv), r, 0.4, bright=0.6), 0.5 * np.sin(k * 0.9)), tk, 0.34 * (0.6 + 0.4 * lv), 0, 0.5)
    if sc in (0, 6):                                                    # sparse bell melody
        for k in range(4):
            if r.random() < (0.7 if sc == 6 else 0.5):
                n = PENT[int(r.integers(0, len(PENT)))]
                M(st(glock(m2f(n), 0.5, r, 2.0)), t0 + k * BEAT + (0.5 * BEAT if k % 2 else 0), 0.3 if sc == 0 else 0.4, 0, 0.8)
    if sc == 6:
        M(st(vibes(m2f(tones[1] + 12), 0.5, r, 2.4, trem=3.0, trem_depth=0.4)), t0 + BEAT, 0.4, 0, 0.7)
    # drums
    if sc >= 1 and sc != 6 and not final:
        kicks = (0, 2) if sc == 1 else (0, 1, 2, 3)
        for k in kicks:
            M(kick(0.55 + 0.25 * lv, seed=b * 7 + k), t0 + k * BEAT, 0.7)
        if sc >= 2:
            for k in range(8):
                M(hat(0.2 + 0.1 * (k % 2), seed=b * 11 + k, open_=(k == 7)), t0 + k * BEAT / 2, 0.45, 0.3 * (1 if k % 2 else -1))
        if sc >= 3:
            for k in (1, 3):
                M(clap(0.45, seed=b * 5 + k), t0 + k * BEAT, 0.5, 0.1)
    if final:
        for k in (0, 1, 2, 3):
            M(kick(0.8, seed=b * 3 + k), t0 + k * BEAT, 0.6)
# H: snare roll accelerating into the climax (all frames of scene H hold)
tH0, tH1 = T(860), CLIMAX
tt_, gap = tH0, BEAT
while tt_ < tH1 - 0.05:
    u = (tt_ - tH0) / (tH1 - tH0)
    M(snare(0.2 + 0.5 * u, r, 0.2, 1.1, 1.0, True), tt_, 0.6, 0.0)
    gap = max(0.045, BEAT / 2 * (1 - u * 0.9)); tt_ += gap

# ---------------------------------------------------------------- sound design on the film (virtual frames)
for i in range(1, 9):                                  # camera swoops
    tc = T(S[i] - 2)
    X(swoosh(1.15, 0.6 if i not in (7, 8) else 0.75, seed=70 + i, lo=200 + 30 * i), tc - 0.62, 0.8, -0.35 if i % 2 else 0.35)
    X(thunk(0.35, 150), tc + 0.45, 0.5)
# A: slam of "KÓD"
X(boom(0.9, 40, 2.6), T(18), 0.9); M(timpani(m2f(38), 0.7, r, 2.4), T(18), 0.5, 0, 0.5)
X(riser(0.75, 0.5, seed=21), T(18) - 0.75, 0.6)
M(cymbal(0.45, r, 2.4), T(26), 0.35, 0, 0.3)
# B: the three files fan out, "SOUBORY." drops
for k in range(3):
    X(zap(0.25, 420 + 120 * k, 900 + 200 * k, 0.12), T(100 - 12 + 20 + 4 * k), 0.5, -0.3 + 0.3 * k)
X(boom(0.7, 46, 1.6, seed=6), T(134), 0.6)
# C: typing + spark hops
for v in np.arange(201, 259, 1.7):
    X(tick(0.13, seed=int(v * 10), f=3600 + 500 * ((int(v) % 3))), T(float(v)), 0.7, ((int(v) % 5) - 2) * 0.08)
for k in range(5):
    X(zap(0.32, 520 + 90 * k, 1500 + 160 * k, 0.16), T(223 + 22 * k), 0.7, 0.2)
    X(bloop(0.15, 700 + 80 * k, 1100 + 80 * k), T(223 + 22 * k) + 0.05, 0.6)
# D: typing css, colour pulses
for v in list(np.arange(382, 400, 1.5)) + list(np.arange(420, 440, 1.5)):
    X(tick(0.13, seed=int(v * 10), f=3600 + 400 * ((int(v) % 3))), T(float(v)), 0.7)
for v, n in ((410, 79), (442, 84)):
    M(st(glock(m2f(n), 0.7, r, 1.6)), T(v), 0.45, 0, 0.6)
    X(swoosh(0.5, 0.3, seed=v), T(v) - 0.2, 0.5)
# E: autocomplete: typing, popup, selection, TAB, completion run
for v in (502, 505):
    X(tick(0.18, seed=v, f=3200), T(v), 0.8)
X(bloop(0.2, 500, 760, 0.12), T(508), 0.6)
for v in (524, 532):
    X(tick(0.2, seed=v, f=2400), T(v), 0.8)
X(thunk(0.5, 210), T(548), 0.8)
for k, n in enumerate((69, 72, 76, 81, 84)):
    M(pan(pluck(m2f(n), 0.6, r, 0.5, bright=0.7), -0.4 + 0.2 * k), T(548) + 0.05 + 0.055 * k, 0.4, 0, 0.7)
# F: counter pings climbing, success chime on the correct answer
for k in range(12):
    X(tick(0.12 + 0.01 * k, seed=300 + k, f=2200 + 260 * k), T(582 + k * 2.2), 0.7)
for v in (610, 614, 618, 622):
    X(tick(0.18, seed=v, f=3300), T(v), 0.8)
tw_ = T(630)
for k, n in enumerate((74, 78, 81, 86, 90)):
    M(st(glock(m2f(n), 0.65, r, 2.0)), tw_ + 0.07 * k, 0.5, 0, 0.8)
X(swoosh(0.6, 0.4, seed=33), tw_ - 0.25, 0.6)
# G: AI bubble: pop, typing dots, grow, words
X(bloop(0.3, 600, 300, 0.12), T(693), 0.7)
for k in range(8):
    X(bloop(0.13, 420 + 40 * (k % 3), 520 + 40 * (k % 3), 0.07), T(709 + k * 3.2), 0.6, 0.2)
X(bloop(0.3, 300, 800, 0.35), T(719), 0.8)
for v in (739, 751):
    X(zap(0.2, 800, 1500, 0.12), T(v), 0.6)
# H: nodes climb the D natural minor scale, riser into the climax
for k, n in enumerate((62, 64, 65, 67, 69, 70, 72, 74, 77)):
    tk = T(774 + 13.875 * k)
    M(pan(musicbox(m2f(n + 12), 0.55 + 0.04 * k, r, 1.4), -0.4 + 0.1 * k), tk, 0.55, 0, 0.8)
    X(bloop(0.12, 500 + 40 * k, 800 + 60 * k, 0.1), tk, 0.6)
tk = T(885)
M(st(glock(m2f(89), 0.8, r, 2.4)), tk, 0.5, 0, 0.9)
X(riser(CLIMAX - T(840), 0.75, seed=41, f0=250, f1=11000), T(840), 0.8)
# I: install line, ring morph, climax
X(thunk(0.5, 140), T(933), 0.8); X(boom(0.6, 46, 1.4, seed=8), T(933), 0.55)
X(swoosh(0.8, 0.5, seed=51), T(965) - 0.1, 0.6)
X(boom(1.0, 38, 3.2, seed=9), CLIMAX, 1.0)
M(timpani(m2f(38), 0.9, r, 3.0), CLIMAX, 0.7, 0, 0.5)
M(timpani(m2f(45), 0.8, r, 3.0), CLIMAX + 0.01, 0.4)
M(cymbal(0.8, r, 3.2), CLIMAX, 0.5, 0, 0.4)
for k, n in enumerate((74, 78, 81, 86, 90, 93)):
    M(pan(musicbox(m2f(n), 0.6, r, 2.0), -0.5 + 0.2 * k), CLIMAX + 0.4 + 0.14 * k, 0.55, 0, 1.0)
M(st(glock(m2f(98), 0.7, r, 3.2)), T(1011), 0.5, 0, 1.0)

# ---------------------------------------------------------------- reverb send + master
ir = make_ir(2.6, 5, hf=1.2, density_lp=9000)
wet = convolve_st(send, ir)
mus = music * 0.9 + wet * 0.7
mus = norm_to(mus, -17.0, "integrated")
fx = norm_to(sfx, -21.0, "momentary")
mix = mus + fx
sc_ = lambda x, c: c * np.tanh(x / c)
mix = norm_to(mix, -15.0, "integrated")
end = ns(1.8)
mix[:, -end:] *= np.linspace(1, 0, end)[None, :] ** 1.5      # tail fade with the picture
mix[:, : ns(0.08)] *= np.linspace(0, 1, ns(0.08))[None, :]
mix = sc_(mix, 0.89)
write_wav(os.path.join(ROOT, "code", "audio", "music.wav"), mix, bits=16)
write_wav(os.path.join(ROOT, "public", "code", "music.wav"), mix, bits=16)
print(f"frames {TOTAL}  length {mix.shape[1]/SR:.3f} s (video {DUR:.3f} s)  scene starts {SEC}")
print(f"integrated {integrated(mix):.1f} LUFS  peak {20*np.log10(np.abs(mix).max()):.1f} dBFS  true peak {true_peak(mix):.1f} dBTP")
