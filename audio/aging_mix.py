"""Sound for the aging short: synthesized SFX + an original light score, ducked under the Kokoro voice.
usage: python audio/aging_mix.py      (needs numpy + scipy; voice at aging/voice/voice.wav)
out:   aging/audio/mix.wav (48 kHz stereo 16-bit, exactly 2025 frames long = 67.5 s), cues printed.
All event times are frames of the AgingShort composition (30 fps); keep them in step with src/videos/aging/story.ts.
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
OUT = os.path.join(ROOT, "aging", "audio")
os.makedirs(OUT, exist_ok=True)
FPS, TOTAL = 30, 2025
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


# ---------------------------------------------------------------- buses
sfx = np.zeros((2, N)); music = np.zeros((2, N)); amb = np.zeros((2, N))
S = lambda x, t, g=1.0, p=0.0: place(sfx, pan(x, p), t, g)

# ---- SFX table: (frame, what) from story.ts / SHOTPLAN.md ----
# camera glides (soft swish) and hard cuts (short whoosh)
for f in (70, 100, 165, 383, 445, 872, 1212, 1545, 1877):
    S(whoosh(0.32, 0.5, seed=f), T(f) - 0.12, 0.55, -0.2)
for f in (210, 330, 556, 701, 996, 1456, 1696):
    S(whoosh(0.18, 0.5, hi=6000, seed=f), T(f) - 0.08, 0.5, 0.2)
S(whoosh(1.0, 0.7, lo=200, hi=3500, seed=128, rise=True), T(128) - 0.9, 0.9)  # flash after the hook
S(whoosh(0.5, 0.6, seed=129), T(128) - 0.02, 0.8)
S(whoosh(2.0, 0.6, lo=180, hi=3000, seed=1962), T(1962) - 0.2, 0.7)  # crane out
S(pop(0.5, 500, 1000), T(9 + 4), 0.8)  # thought bubble
S(bloop(0.5, 900, 450), T(9 + 10), 0.5)
# bathroom: knee squat -> small boing, hair
S(bloop(0.4, 400, 650), T(165), 0.6)
S(bloop(0.4, 650, 420), T(190), 0.6)
# ID stamp
S(thud(0.9, 150, seed=330), T(330), 1.0)
S(snap(0.7), T(330), 0.8)
S(glock(m2f(88), 0.6, rng(3), 0.9), T(331), 0.18)
# sprint: patter, skid, "?" pops
for a, b, sd in ((16.2, 18.45, 11), (20.45, 23.7, 12)):
    t = a; i = 0
    while t < b:
        S(step(0.28, seed=sd * 100 + i, f=450 + 120 * (i % 2)), t, 0.8, -0.4 if i % 2 else 0.4)
        t += 1 / 7.0; i += 1
S(skid(0.45, 0.5), T(547), 0.8)
S(bwoop(0.55), T(556), 0.8)
S(bwoop(0.5), T(697), 0.8)
S(bwoop(0.5), T(807), 0.8)
# kitchen: cane rack clatter
for k, dt in enumerate((0.0, 0.07, 0.15, 0.24)):
    S(clack(0.5, seed=880 + k, f=700 + 160 * k), T(880) + dt, 0.5, 0.3)
# fridge: sticky notes slap, door thunk
for k in range(5):
    S(pop(0.4, 700 + 120 * k, 400 + 60 * k, 0.07), T(950) + k * 0.1, 0.5, -0.3 + 0.15 * k)
S(thud(0.9, 120, seed=1005), T(1005), 0.9)
S(rustle(0.3), T(1005), 0.5)
# brain shrink ticks (ticks 1.4,1.9,2.4,2.9,3.4 s into shot 10)
for k, tt_ in enumerate((1.4, 1.9, 2.4, 2.9, 3.4)):
    S(bloop(0.5, 700 - 70 * k, 330 - 30 * k), T(1030) + tt_, 0.6)
# slow motion: snail squeaks, memory pops
S(squeak(0.3), T(1172) + 0.1, 0.6, -0.2)
S(squeak(0.25), T(1172) + 1.1, 0.5, 0.2)
S(pop(0.45, 900, 200, 0.2), T(1172) + 0.9, 0.7, 0.4)
# book tower grows
for k, tt_ in enumerate((0.8, 1.6, 2.4, 3.0)):
    S(thud(0.55, 190, seed=1259 + k, dur=0.3), T(1259) + tt_, 0.6, -0.1 * k)
    S(rustle(0.35, seed=k), T(1259) + tt_, 0.5, 0.1 * k)
# car: engine up to the cut, horn
S(engine(3.2, 0.45), T(1360) - 0.1, 0.65, -0.3)
S(honk(0.55), T(1462), 0.7, 0.3)
# restaurant: waiter's hand-bell and menu slap
S(glock(m2f(96), 0.6, rng(5), 1.2), T(1696), 0.4, 0.3)
S(rustle(0.4, seed=77), T(1698), 0.6)
# end: bench chirps (golden evening) + little final sting
r = rng(2025)
for t in np.arange(57.8, 66.2, 0.7):
    if r.random() < 0.55:
        S(chirp(0.25, seed=int(t * 100)), t + r.uniform(0, 0.3), 0.18, r.uniform(-0.7, 0.7))

# ---------------------------------------------------------------- music (original, C major, 96 bpm)
r = rng(11)
BEAT = 60 / 96; BAR = 4 * BEAT
CH = [(36, [60, 64, 67]), (31, [59, 62, 67]), (33, [60, 64, 69]), (29, [60, 65, 69])]  # C, G, Am, F (bass midi, chord tones)
PENT = [72, 74, 76, 79, 81, 84]
def section(t):
    return "A" if t < 25 else "B" if t < 34 else "C" if t < 50 else "D" if t < 62 else "E"
for b in range(int(DUR / BAR) + 1):
    t0 = b * BAR; root, tones = CH[b % 4]; sec = section(t0)
    if t0 >= DUR: break
    if sec in ("A", "D", "C"):
        place(music, st(pluck(m2f(root), 0.75, r, 0.7)), t0, 0.9 if sec != "C" else 0.6)
        place(music, st(pluck(m2f(root + 7), 0.6, r, 0.6)), t0 + 2 * BEAT, 0.7 if sec != "C" else 0.45)
    elif sec == "B":
        place(music, st(pluck(m2f(root), 0.6, r, 0.9)), t0, 0.6)
    if sec in ("A", "D"):
        for k in (0.5, 2.5):  # off-beat stabs
            for n in tones:
                place(music, pan(pluck(m2f(n), 0.4, r, 0.35, bright=0.7), -0.2 if n % 2 else 0.2), t0 + k * BEAT, 0.28)
        for k in range(8):
            place(music, pan(brush(0.35 if k % 2 else 0.22, r, 0.12), 0.4), t0 + k * BEAT / 2, 0.5)
        for k in range(4):  # musicbox melody, one note per beat with rests
            if r.random() < 0.7:
                n = PENT[int(r.integers(0, len(PENT)))]
                place(music, pan(musicbox(m2f(n), 0.5, r, 1.2), 0.3), t0 + k * BEAT, 0.5)
    if sec == "B":  # suspense: single wobbly vibes notes
        place(music, st(vibes(m2f(tones[0] + 12 + (b % 2) * 5), 0.5, r, 2.4, trem=3.0, trem_depth=0.5)), t0 + BEAT, 0.5)
    if sec == "C":
        for n in tones:
            place(music, st(vibes(m2f(n), 0.45, r, 2.4, damp=2.0)), t0 + (n % 3) * 0.04, 0.32)
        place(music, pan(musicbox(m2f(tones[2] + 12), 0.5, r, 1.2), 0.3), t0 + 3 * BEAT, 0.4)
    if sec in ("D", "E"):
        place(music, pad([m2f(n - 12) for n in tones], BAR, 0.5, r, att=0.9, rel=1.2), t0, 0.5)
# final sting (voice ends ~66.3 s): musicbox C-E-G-C up, glock on top
for k, n in enumerate((72, 76, 79, 84)):
    place(music, pan(musicbox(m2f(n), 0.6, r, 1.6), -0.2 + 0.15 * k), 65.4 + k * 0.17, 0.7)
place(music, st(glock(m2f(96), 0.6, r, 2.0)), 66.1, 0.5)
place(music, st(pad([m2f(48), m2f(55), m2f(64)], 1.6, 0.5, r, att=0.3, rel=1.0)), 65.9, 0.55)

# ---------------------------------------------------------------- voice + ducking + master
v, sr = read_wav(os.path.join(ROOT, "aging", "voice", "voice.wav"))
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
