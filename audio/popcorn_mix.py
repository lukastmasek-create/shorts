"""Sound for the popcorn short: SFX only, no voiceover, no music (just a quiet room bed), per the storyboard.

usage: python audio/popcorn_mix.py
out:   public/popcorn/mix.wav  (48 kHz stereo, exactly 12.0 s = 360 frames at 30 fps) + cue printout

Events are keyed to the beat timing of storyboard/popcorn/index.html:
  T = { heat: 2.0, press: 5.0, pop: 7.8 }, captions at 0.3-1.95 / 2.2-4.95 / 5.2-7.7 / 8.0-9.35 / 9.5-12
Beat 1  rain of tiny glass clicks as the beads land (0-1 s), one soft tick under the water drop
Beat 2  burner hum rises, fine sizzle on top, ~46 tiny pops as the water boils off (2.6-4.6 s)
Beat 3  hull creaks (tocks) speeding up, thin rising whine, riser; held breath just before the burst
Beat 4  sharp crack with a thud, steam hiss, whoosh, glass hissing through the air
Beat 5  rain of landing clicks, one soft chime as the flake sets, room bed fades under the hold
"""
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dsp import (SR, bp, colored, convolve_st, fades, hp, lp, make_ir, modal, ns, norm_to,
                 pan, place, rng, phase, tt, widen, write_wav, dbg)

ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public", "popcorn")
os.makedirs(OUT, exist_ok=True)
FPS, TOTAL = 30, 360
DUR = TOTAL / FPS
N = ns(DUR)
buf = np.zeros((2, N))

# ---------------------------------------------------------------- one-shots (mono)
def glass_click(seed, f=2400.0, vel=0.5):
    """one tiny glass bead landing: a short bright click with a couple of ringing modes"""
    r = rng(seed)
    y = modal(0.09, [(f * r.uniform(0.85, 1.15), 1.0, 0.012), (f * 2.7, 0.4, 0.006), (f * 0.5, 0.3, 0.03)], r)
    n = ns(0.006)
    y[:n] += lp(r.standard_normal(n), 8000) * 0.5
    return fades(y * vel, 0.0002, 0.02)


def tick(seed, vel=0.4):
    r = rng(seed)
    y = modal(0.25, [(880, 1.0, 0.05), (1760, 0.3, 0.02)], r)
    return fades(y * vel, 0.001, 0.1)


def boil_pop(seed, vel=0.35):
    """a bubble collapsing inside the hull: a small wet bleep"""
    r = rng(seed)
    t = tt(0.05)
    f = r.uniform(420, 1100) * np.exp(-t / 0.012) + 180
    y = np.sin(phase(f)) * np.exp(-t / 0.008) + 0.2 * bp(r.standard_normal(len(t)), 1200, 4000) * np.exp(-t / 0.004)
    return fades(y * vel, 0.0005, 0.012)


def creak(seed, vel=0.5, f0=190.0):
    """hull tock: a woody modal knock with a tiny pitch drop"""
    r = rng(seed)
    return fades(modal(0.12, [(f0, 1.0, 0.03), (f0 * 2.02, 0.5, 0.018), (f0 * 3.9, 0.25, 0.01)], r, glide=0.06), 0.0005, 0.03) * vel


def crack(seed, vel=1.0):
    """the burst: a hard transient, a low thud under it and a shower of debris"""
    r = rng(seed)
    t = tt(0.5)
    burst = r.standard_normal(len(t)) * np.exp(-t / 0.006)
    burst = bp(burst, 900, 9000) + 0.6 * lp(burst, 900)
    thud = np.sin(phase(160 * np.exp(-t / 0.04) + 48)) * np.exp(-t / 0.09)
    debris = np.zeros(len(t))
    for k in range(70):
        i = ns(r.uniform(0.01, 0.45))
        if i < len(t):
            debris[i] += r.uniform(-1, 1) * r.uniform(0.2, 1.0)
    debris = bp(debris, 1800, 12000) * np.exp(-t / 0.25)
    return fades((burst * 0.9 + thud * 0.8 + debris * 0.35) * vel, 0.0002, 0.12)


def hiss(dur=1.1, vel=0.4, seed=11, lo=1500, hi=9000):
    r = rng(seed)
    t = tt(dur)
    x = colored(len(t), r, 1.2)
    y = bp(x, lo, hi) * (np.exp(-t / 0.18) * 0.8 + np.exp(-t / 0.9) * 0.5)
    return fades(y * vel, 0.002, 0.2)


def whoosh(dur=0.7, vel=0.4, seed=12, rise=True):
    r = rng(seed)
    t = tt(dur)
    u = t / dur
    x = colored(len(t), r, 1.0)
    y = bp(x, 300, 1200) * (1 - u) + bp(x, 1500, 7000) * u
    return fades(y * np.sin(np.pi * u) ** 2 * vel, 0.01, 0.02)


def chime(seed=13, vel=0.5):
    r = rng(seed)
    y = modal(1.8, [(1046.5, 1.0, 0.9), (1568.0, 0.5, 0.6), (2093.0, 0.35, 0.45), (3136.0, 0.15, 0.3)], r)
    return fades(y * vel, 0.002, 0.3)


def sizzle(dur, vel=0.2, seed=14):
    """fine frying-water sizzle: high noise with a grain"""
    r = rng(seed)
    t = tt(dur)
    x = bp(colored(len(t), r, 1.4), 3500, 11000)
    grain = lp(np.abs(r.standard_normal(len(t))), 60) ** 2
    return fades(x * grain * 3.0 * vel, 0.05, 0.1)


# ---------------------------------------------------------------- beds
def burner_hum(dur, seed=21):
    """low gas-burner hum with a slow wobble and a little breath"""
    r = rng(seed)
    t = tt(dur)
    u = t / dur
    f = 58 + 3 * np.sin(2 * np.pi * 0.23 * t)
    y = np.sin(phase(f)) * 0.5 + np.sin(phase(f * 2.01)) * 0.2 + np.sin(phase(f * 3.03)) * 0.08
    y += lp(colored(len(t), r, 1.0), 220) * 0.25
    env = (1 - np.exp(-u * 8)) * (0.55 + 0.45 * np.sin(np.pi * np.minimum(u * 1.15, 1)))
    return y * env


def room(dur, seed=31):
    """quiet room tone: very low, very soft"""
    r = rng(seed)
    t = tt(dur)
    y = lp(colored(len(t), r, 1.0), 160) * 1.0 + lp(colored(len(t), r, 0.5), 700) * 0.12
    return y * fades(np.ones(len(t)), 0.4, 0.6)


IR = make_ir(1.1, 5, early=((0.011, 0.3, 0.0), (0.023, 0.2, 0.0)))  # small dead-ish room

# ---------------------------------------------------------------- score the beats
cues = []

# room bed, fading out under the hold
place(buf, convolve_st(room(DUR), IR) * 0.5, 0.0)

# beat 1: beads landing, 0-1.0 s (dense at the start, thinning out)
r = rng(101)
t = 0.02
while t < 1.02:
    place(buf, pan(glass_click(int(t * 1000), r.uniform(2000, 3400), r.uniform(0.10, 0.30)), r.uniform(-0.8, 0.8)), t)
    t += r.uniform(0.004, 0.020) * (1 + t)
place(buf, tick(7, 0.5), 1.12)                                   # the water drop settles
cues.append((0.0, 1.15, "rain of tiny glass clicks + one soft tick (water drop)"))

# beat 2: burner hum 2.0-6.0, sizzle 2.2-5.0, ~46 boil pops 2.6-4.6
place(buf, convolve_st(burner_hum(4.2), IR) * 0.32, 1.9)
place(buf, sizzle(3.0, 0.22), 2.15)
rr = rng(202)
times = np.sort(rr.uniform(2.6, 4.6, 46))
for i, tm in enumerate(times):
    place(buf, pan(boil_pop(300 + i, rr.uniform(0.10, 0.30)), rr.uniform(-0.6, 0.6)), tm)
cues.append((1.9, 6.1, "burner hum rising + fine sizzle"))
cues.append((2.6, 4.6, "46 tiny pops as the water boils off, one per bead"))

# beat 3: creaks speeding up 5.0-7.6, thin rising whine, riser into the burst, held breath
t, gap = 5.0, 0.30
k = 0
while t < 7.55:
    place(buf, pan(creak(400 + k, 0.18 + 0.5 * ((t - 5.0) / 2.6)), np.sin(k * 1.7) * 0.35), t)
    gap *= 0.87
    t += max(0.045, gap)
    k += 1
tw = tt(2.6)
whine = np.sin(phase(300 * (1 + 1.6 * tw / 2.6))) * 0.12 * (tw / 2.6) ** 2
place(buf, fades(whine, 0.3, 0.05), 5.0)
place(buf, whoosh(1.4, 0.22, 41, rise=True), 6.2)
cues.append((5.0, 7.62, "hull creaks speeding up, thin rising whine, riser"))
cues.append((7.62, 7.8, "held breath: near silence before the burst"))

# beat 4: the burst at 7.8
place(buf, crack(501, 1.0), 7.8)
place(buf, widen(hiss(1.6, 0.40, 55), rng(56), ms=14, amount=0.7), 7.82)
place(buf, whoosh(0.9, 0.35, 57), 7.86)
place(buf, pan(hiss(0.8, 0.18, 58, 2500, 14000), 0.4), 8.35)
cues.append((7.8, 9.3, "sharp crack + thud, steam hiss, whoosh, glass through the air"))

# beat 5: landing clicks settling 9.4-11.0, one chime as the flake sets 9.9, bed out
r = rng(303)
t = 9.42
while t < 11.05:
    place(buf, pan(glass_click(int(t * 777), r.uniform(1800, 3000), r.uniform(0.06, 0.20)), r.uniform(-0.7, 0.7)), t)
    t += r.uniform(0.02, 0.09) * (1 + (t - 9.4))
place(buf, convolve_st(chime(601, 0.42), IR), 9.9)
cues.append((9.4, 11.1, "rain of landing clicks + one soft chime as the flake sets"))
cues.append((11.0, 12.0, "room bed fades out under the hold"))

# ---------------------------------------------------------------- mix
mix = buf
mix = hp(mix, 35)                                  # clear out sub rumble
mix = mix / max(1.0, np.abs(mix).max() / 0.89)      # keep peaks under control
mix = norm_to(mix, -19.0, mode="integrated")        # short-form loudness, no voice to sit under
peak = np.abs(mix).max()
if peak > 0.92:
    mix = mix * (0.92 / peak)
out = os.path.join(OUT, "mix.wav")
write_wav(out, mix, bits=24)
print(f"{out}: {mix.shape[1] / SR:.3f} s, {mix.shape[1]} samples, peak {20 * np.log10(peak + 1e-12):.2f} dBFS")
for a, b, what in cues:
    print(f"  {a:5.2f}-{b:5.2f}s  {what}")
