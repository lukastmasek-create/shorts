"""Sound for the YouTube short: synthesized SFX + an original light score, ducked under the Kokoro voice.
usage: python audio/yt_mix.py      (needs numpy + scipy; voice at yt/voice/voice.wav)
out:   yt/audio/mix.wav (48 kHz stereo 16-bit, exactly 1845 frames = 61.5 s).
All event times are frames of the YouTubeShort composition (30 fps); keep them in step with src/videos/yt/story.ts.
Mix rules (bridge short): voice unchanged, music about +3 dB over a plain bed, SFX about -6 dB under the voice peaks.
"""
import os, sys
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, fades, modal, phase, place, st, pan, widen, norm_to, integrated, true_peak, read_wav, write_wav
from instruments import pluck, vibes, musicbox, glock, pad, brush, m2f

ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "yt", "audio")
os.makedirs(OUT, exist_ok=True)
FPS, TOTAL = 30, 1845
DUR = TOTAL / FPS
N = ns(DUR)
T = lambda f: f / FPS


# ---------------------------------------------------------------- one-shot sounds (mono)
def whoosh(dur=0.5, vel=0.5, lo=250, hi=4500, seed=1, rise=False):
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    x = colored(n, r, 1.0)
    y = bp(x, lo, lo * 3) * (1 - u) + bp(x, hi * 0.4, hi) * u
    y = y[::-1] if rise else y
    return fades(y * np.sin(np.pi * u) ** 2 * vel * 0.5, 0.005, 0.02)


def thud(vel=0.8, f0=130, seed=2, dur=0.4):
    r = rng(seed); t = tt(dur)
    f = f0 * np.exp(-t / 0.05) + 42
    y = np.sin(phase(f)) * np.exp(-t / 0.09) + lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.012) * 0.5
    return fades(y * vel, 0.0005, 0.04)


def snap(vel=0.6, seed=3):
    r = rng(seed); t = tt(0.12)
    return fades(hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.012) * vel, 0.0003, 0.02)


def pop(vel=0.5, f0=500, f1=900, dur=0.12):
    t = tt(dur); f = np.linspace(f0, f1, len(t))
    return fades(np.sin(phase(f)) * np.exp(-t / 0.04) * vel, 0.0005, 0.02)


def bloop(vel=0.5, f0=720, f1=300, dur=0.26):
    t = tt(dur); f = (f1 + (f0 - f1) * np.exp(-t / 0.08)) * (1 + 0.03 * np.sin(TAU * 22 * t))
    return fades(np.sin(phase(f)) * np.exp(-t / 0.11) * vel, 0.001, 0.03)


def bwoop(vel=0.5):
    a, b = pop(vel, 380, 540, 0.09), pop(vel, 540, 820, 0.14)
    return np.concatenate([a, b])


def step(vel=0.35, seed=4, f=500):
    r = rng(seed); t = tt(0.07)
    return fades(lp(r.standard_normal(len(t)), f) * np.exp(-t / 0.022) * vel, 0.0004, 0.01)


def skid(dur=0.45, vel=0.4, seed=5):
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    x = bp(colored(n, r, 0.3), 2200, 7000)
    return fades(x * (1 - u) ** 0.7 * (0.5 + 0.5 * np.sin(TAU * 30 * u * dur)) * vel * 0.5, 0.005, 0.05)


def clack(vel=0.5, seed=6, f=900):
    r = rng(seed)
    return fades(modal(0.16, [(f, 1.0, 0.03), (f * 2.1, 0.5, 0.02), (f * 3.4, 0.2, 0.015)], r) * vel, 0.0003, 0.03)


def engine(dur=3.0, vel=0.45, f0=55, f1=150, seed=7):
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    f = f0 + (f1 - f0) * u ** 1.5
    saw = signal.sawtooth(phase(f)) + 0.5 * signal.square(phase(f * 2))
    y = lp(saw, 700) * (0.7 + 0.3 * np.sin(TAU * 11 * u * dur)) + 0.12 * lp(r.standard_normal(n), 300)
    return fades(y * vel * np.minimum(1, u * 6) * np.minimum(1, (1 - u) * 8), 0.01, 0.05)


def honk(vel=0.5, dur=0.28):
    t = tt(dur)
    y = lp(signal.square(phase(np.full(len(t), 392.0))) + signal.square(phase(np.full(len(t), 494.0))), 2200) * 0.5
    return fades(y * vel * np.minimum(1, t / 0.01), 0.002, 0.04)


def chirp(vel=0.2, seed=8):
    r = rng(seed); out = np.zeros(ns(0.45))
    f0 = r.uniform(3000, 4200)
    for k in range(int(r.integers(2, 4))):
        t = tt(0.07); f = np.linspace(f0, f0 * r.uniform(1.15, 1.4), len(t))
        out[ns(k * 0.11): ns(k * 0.11) + len(t)] += np.sin(phase(f)) * np.sin(np.pi * np.linspace(0, 1, len(t))) * vel
    return out


def squeak(vel=0.25, dur=0.55):
    t = tt(dur); f = 1100 + 250 * np.sin(TAU * 3.2 * t) + 200 * t
    return fades(np.sin(phase(f)) * np.sin(np.pi * np.clip(t / dur, 0, 1)) * vel, 0.01, 0.05)


def rustle(vel=0.25, seed=9):
    r = rng(seed); n = ns(0.25); u = np.linspace(0, 1, n)
    return fades(hp(r.standard_normal(n), 3000) * np.exp(-u * 5) * vel * 0.4, 0.002, 0.03)



def cheer(dur=2.2, vel=0.5, seed=21):
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    x = bp(colored(n, r, 0.6), 500, 3200) * (0.6 + 0.4 * np.sin(TAU * 7 * u * dur) ** 2)
    return fades(x * np.sin(np.pi * u) ** 0.7 * vel, 0.1, 0.4)


def tick(vel=0.3, seed=22, f=2400):
    r = rng(seed); t = tt(0.04)
    return fades(hp(r.standard_normal(len(t)), f) * np.exp(-t / 0.006) * vel, 0.0002, 0.01)


def coin(vel=0.4, seed=23):
    r = rng(seed)
    return fades(modal(0.35, [(2900, 1.0, 0.12), (4300, 0.6, 0.09), (6100, 0.3, 0.06)], r) * vel, 0.0003, 0.05)


def sigh(vel=0.4, dur=0.9, seed=24):
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    return fades(bp(colored(n, r, 0.8), 700 - 300 * u[0], 2200) * np.sin(np.pi * u) * vel * 0.5, 0.15, 0.3)


def ding(vel=0.5):
    return glock(m2f(91), 0.6, rng(7), 1.0) * vel


# ---------------------------------------------------------------- buses
sfx = np.zeros((2, N)); music = np.zeros((2, N)); amb = np.zeros((2, N))
S = lambda x, t, g=1.0, p=0.0: place(sfx, pan(x, p), t, g)

# cuts + glides
CUTS = (173, 250, 319, 383, 442, 483, 520, 546, 697, 770, 826, 876, 941, 1036, 1214, 1301, 1558, 1691)
for f in CUTS:
    S(whoosh(0.22, 0.5, hi=6000, seed=f), T(f) - 0.08, 0.5, 0.2)
for f in (70, 100, 600, 735, 800, 1420, 1640, 1756):
    S(whoosh(0.32, 0.5, seed=f), T(f) - 0.12, 0.45, -0.2)
S(whoosh(1.0, 0.7, lo=200, hi=3500, seed=171, rise=True), T(171) - 0.9, 0.9)  # flash after the hook
S(whoosh(0.5, 0.6, seed=172), T(171) - 0.02, 0.8)
# 500 hours/min: raining video cards
for i in range(26):
    S(pop(0.35, 600 + 40 * (i % 7), 1000 + 30 * (i % 5), 0.08), T(76 + 3.4 * i + 30), 0.35, -0.5 + (i % 5) * 0.25)
# upload: card flies, lands, burst
S(whoosh(0.4, 0.5, lo=300, hi=3000, seed=174, rise=True), T(176), 0.6)
S(thud(0.5, 160, seed=195), T(195), 0.7); S(glock(m2f(88), 0.6, rng(3), 0.9), T(218), 0.25); S(pop(0.5, 500, 1100), T(218), 0.7)
# mom, refresh click
S(bwoop(0.4), T(262), 0.5); S(clack(0.4, seed=281, f=1400), T(284), 0.5); S(clack(0.4, seed=299, f=1400), T(298), 0.5)
# twelve viewers pop in, eleven turn into the hero
for i in range(12):
    S(pop(0.4, 520 + 40 * i, 800 + 40 * i, 0.07), T(322 + 1.8 * i), 0.45, -0.6 + 0.1 * i)
for i in range(11):
    S(bloop(0.3, 500, 330, 0.12), T(349 + 1.2 * i), 0.4, -0.5 + 0.09 * i)
S(thud(0.9, 130, seed=364), T(364), 1.0); S(squeak(0.25, 0.4), T(366), 0.4)
# thumbnail / title / haircut swaps
for f in (383, 399, 415, 442, 450, 458, 466, 474, 483, 497):
    S(pop(0.4, 500, 900, 0.08), T(f), 0.5)
S(rustle(0.4, seed=497), T(497), 0.6)
S(sigh(0.35), T(520), 0.5)
# algorithm: hum + toss
S(engine(1.8, 0.2, 90, 130, seed=9), T(546), 0.35)
S(whoosh(0.4, 0.5, seed=604), T(604), 0.7)
for i in range(9):
    S(clack(0.35, seed=660 + i, f=1500 + 80 * i), T(660 + 3 * i), 0.4, -0.4 + 0.1 * i)
S(glock(m2f(96), 0.6, rng(5), 1.0), T(668), 0.3)
# shocked face + arrow
S(bwoop(0.55), T(740), 0.8); S(pop(0.5, 900, 300, 0.12), T(742), 0.7)
# take off + comments
S(whoosh(1.1, 0.7, lo=200, hi=4500, seed=780, rise=True), T(775), 0.8)
S(glock(m2f(96), 0.6, rng(9), 1.4), T(792), 0.5); S(glock(m2f(100), 0.6, rng(10), 1.4), T(796), 0.4)
S(thud(0.9, 120, seed=826), T(826), 0.9)
for i in range(14):
    S(thud(0.4, 220, seed=830 + i, dur=0.2), T(826 + 3.1 * i + 14), 0.45, -0.5 + 0.08 * i)
# a million people
S(cheer(2.4, 0.6), T(880), 0.9)
# the weekly treadmill
for i in range(35):
    S(tick(0.3, seed=985 + i), T(985 + i * 1.1), 0.5)
S(sigh(0.5, 1.1), T(1010), 0.6)
# math
S(ding(0.6), T(1138), 0.5)
for i in range(24):
    S(tick(0.28, seed=1150 + i, f=3000), T(1150 + 2.0 * i), 0.4)
S(ding(0.6), T(1196), 0.5)
S(pop(0.5, 400, 900, 0.1), T(1214), 0.6); S(thud(0.6, 100, seed=1245), T(1245), 0.7)
for i in range(8):
    S(coin(0.4, seed=1318 + i), T(1318 + 3.75 * i), 0.5, -0.3 + 0.1 * i)
# more videos, faster
for i in range(12):
    S(whoosh(0.15, 0.4, hi=6000, seed=1380 + i), T(1380 + 5 * i), 0.4, -0.5 + 0.09 * i)
S(sigh(0.5, 1.0), T(1468), 0.6)
S(thud(0.8, 120, seed=1496), T(1496), 0.8)
for i in range(6):
    S(bloop(0.4, 560 - 60 * i, 300 - 20 * i), T(1500 + 6 * i), 0.5)
S(bloop(0.5, 300, 120, 0.5), T(1535), 0.7)
# thought bubble, final
S(pop(0.5, 500, 1000), T(1600), 0.8); S(bloop(0.5, 900, 450), T(1606), 0.5)
S(thud(0.9, 130, seed=1796), T(1796), 1.0); S(glock(m2f(96), 0.6, rng(6), 1.2), T(1798), 0.4)

# ---------------------------------------------------------------- music (original, C major, 100 bpm, light "lo-fi pluck")
r = rng(11)
BEAT = 60 / 100; BAR = 4 * BEAT
CH = [(36, [60, 64, 67]), (31, [59, 62, 67]), (33, [60, 64, 69]), (29, [60, 65, 69])]
PENT = [72, 74, 76, 79, 81, 84]
def section(t):
    return "A" if t < 18.2 else "B" if t < 25.7 else "A" if t < 34.5 else "C" if t < 49 else "D" if t < 56.7 else "E"
for b in range(int(DUR / BAR) + 1):
    t0 = b * BAR; root, tones = CH[b % 4]; sec = section(t0)
    if t0 >= DUR: break
    if sec in ("A", "D", "C"):
        place(music, st(pluck(m2f(root), 0.75, r, 0.7)), t0, 0.9 if sec != "C" else 0.6)
        place(music, st(pluck(m2f(root + 7), 0.6, r, 0.6)), t0 + 2 * BEAT, 0.7 if sec != "C" else 0.45)
    elif sec == "B":
        place(music, st(pluck(m2f(root), 0.6, r, 0.9)), t0, 0.6)
    if sec in ("A", "D"):
        for k in (0.5, 2.5):
            for n in tones:
                place(music, pan(pluck(m2f(n), 0.4, r, 0.35, bright=0.7), -0.2 if n % 2 else 0.2), t0 + k * BEAT, 0.28)
        for k in range(8):
            place(music, pan(brush(0.35 if k % 2 else 0.22, r, 0.12), 0.4), t0 + k * BEAT / 2, 0.5)
        for k in range(4):
            if r.random() < 0.7:
                n = PENT[int(r.integers(0, len(PENT)))]
                place(music, pan(musicbox(m2f(n), 0.5, r, 1.2), 0.3), t0 + k * BEAT, 0.5)
    if sec == "B":
        place(music, st(vibes(m2f(tones[0] + 12 + (b % 2) * 5), 0.5, r, 2.4, trem=3.0, trem_depth=0.5)), t0 + BEAT, 0.5)
        place(music, pan(brush(0.3, r, 0.12), 0.4), t0 + 2 * BEAT, 0.4)
    if sec == "C":
        for n in tones:
            place(music, st(vibes(m2f(n), 0.45, r, 2.4, damp=2.0)), t0 + (n % 3) * 0.04, 0.32)
        place(music, pan(musicbox(m2f(tones[2] + 12), 0.5, r, 1.2), 0.3), t0 + 3 * BEAT, 0.4)
    if sec in ("D", "E"):
        place(music, pad([m2f(n - 12) for n in tones], BAR, 0.5, r, att=0.9, rel=1.2), t0, 0.5)
for k, n in enumerate((72, 76, 79, 84)):
    place(music, pan(musicbox(m2f(n), 0.6, r, 1.6), -0.2 + 0.15 * k), 59.9 + k * 0.17, 0.7)
place(music, st(glock(m2f(96), 0.6, r, 2.0)), 60.6, 0.5)
place(music, st(pad([m2f(48), m2f(55), m2f(64)], 1.6, 0.5, r, att=0.3, rel=1.0)), 60.4, 0.55)

# ---------------------------------------------------------------- voice + ducking + master
v, sr = read_wav(os.path.join(ROOT, "yt", "voice", "voice.wav"))
v = v.mean(0)
if sr != SR:
    v = signal.resample_poly(v, SR, sr)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
sc = lambda x, c: c * np.tanh(x / c)  # soft limiter
voice = sc(norm_to(st(v), -16.0, "integrated"), 0.8)
env = lp(np.abs(voice[0]), 5, 1)
env = env / (np.percentile(env, 99) + 1e-9)
duck = 1 - 0.6 * np.clip((env - 0.05) / 0.2, 0, 1)
duck = lp(duck, 6, 1)
music = norm_to(music, -27.0, "integrated") * duck[None, :]
sfx = norm_to(sfx, -22.0, "momentary")
mix = voice + music + sfx
mix = sc(norm_to(mix, -16.0, "integrated"), 0.89)  # short-form target about -16 LUFS, soft-limited under -1 dBFS
write_wav(os.path.join(OUT, "mix.wav"), mix, bits=16)
for name, x in (("voice", voice), ("music", music), ("sfx", sfx), ("mix", mix)):
    print(f"{name:6s} integrated {integrated(x):6.1f} LUFS  peak {20*np.log10(np.abs(x).max()+1e-12):6.1f} dBFS")
print(f"mix true peak {true_peak(mix):.1f} dBTP, length {mix.shape[1]/SR:.3f} s (video {DUR:.3f} s)")
