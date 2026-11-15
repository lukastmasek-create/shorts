"""Sound for the HROU promo: original 120 bpm electronic score + hit-synced SFX, voice on top.

Input is hype_vo/timing.json (word/frame grid, written by scripts/hype_timing.py) and the silence-trimmed
voice lines in hype_vo/trim/. Everything is synthesized here with the repo's own DSP kit (audio/dsp.py,
numpy + scipy only) - no samples, no third-party audio.

Structure (all times from the picture, 30 fps):
    groove A   first word -> "so we turned it into a game"      four on the floor, bass, hats
    build      L4 -> logo reveal                                snare roll + riser
    drop B     logo + node graph + cube                         half-time, pad, arp, sub
    groove C   subjects -> capability montage                   main groove + percussion
    tension    "the usual way"                                  kick out, drone, riser
    gag        record stop, clock ticks, starburst
    groove D   "it is free"                                     heavier groove
    CTA        yellow card -> end card                          big chord, then pad out
Every cut that the picture makes on a voice word gets a sub-boom, a blip and (on line starts) a whoosh.
Writes public/hype/mix.wav (48 kHz stereo, exactly TOTAL/30 s, ~-14 LUFS, <= -1 dBTP).
usage: ./venv/bin/python audio/hype_mix.py
"""
import json
import os
import sys

import numpy as np
from scipy import signal as _sig

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from dsp import (SR, bp, colored, dbg, fades, hp, integrated, lp, make_ir, convolve_st, ns, pan, peq, place, ramp, rng, shelf, st, true_peak, tt)

VO = os.path.join(ROOT, "hype_vo")
T = json.load(open(os.path.join(VO, "timing.json")))
FPS = T["fps"]
TOTAL = T["total"]
DUR = TOTAL / FPS
N = ns(DUR)
A = np.zeros((2, N))  # music bus
S = np.zeros((2, N))  # sfx bus
V = np.zeros((2, N))  # voice bus
R = rng(120)

BPM = 120.0
BEAT = 60.0 / BPM  # 0.5 s = 15 frames


def f2s(f):
    return f / FPS


def line(name):
    for ln in T["lines"]:
        if ln["id"] == name:
            return ln
    raise KeyError(name)


INS = T["inserts"]

# ---------------------------------------------------------------- instruments
def kick(dur=0.36, f0=150.0, f1=44.0, click=0.5):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.045)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    y += click * colored(len(t), R, 0) * np.exp(-t / 0.004) * 0.3
    return np.tanh(y * 1.6) * 0.9


def snare(dur=0.22, tone=0.35):
    t = tt(dur)
    y = bp(colored(len(t), R, 0), 1200, 9000, 2) * np.exp(-t / 0.07)
    y += tone * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return y * 0.6


def clap(dur=0.3):
    n = ns(dur)
    y = np.zeros(n)
    for k, off in enumerate((0.0, 0.011, 0.023, 0.038)):
        i = ns(off)
        seg = bp(colored(n - i, R, 0), 900, 5000, 2) * np.exp(-np.arange(n - i) / SR / (0.012 if k < 3 else 0.16))
        y[i:] += seg * (0.7 if k < 3 else 1.0)
    return y * 0.5


def hat(dur=0.05, open_=False):
    t = tt(0.05 if not open_ else 0.16)
    return hp(colored(len(t), R, 1.2), 7200, 2) * np.exp(-t / (0.03 if not open_ else 0.09)) * 0.35


def saw(f, dur, detune=0.0, phase0=0.0):
    t = tt(dur)
    y = np.zeros(len(t))
    for k in range(1, 12):
        y += np.sin(2 * np.pi * (f * (1 + detune)) * k * t + phase0 * k) / k
    return y


def bass_note(f, dur):
    t = tt(dur)
    y = saw(f, dur) * 0.6 + np.sin(2 * np.pi * f * t) * 0.6
    env = np.minimum(1.0, t / 0.006) * np.exp(-t / (dur * 0.55))
    return lp(y * env, 320, 2) * 0.85


def pad_chord(freqs, dur, bright=2400.0):
    y = np.zeros((2, ns(dur)))
    for i, f in enumerate(freqs):
        for k, det in enumerate((-0.004, 0.0, 0.004)):
            sig = saw(f, dur, detune=det, phase0=R.uniform(0, 6.28)) * 0.25
            y += pan(sig, (-0.5 + 0.5 * k) * 0.8) * (1.0 / len(freqs))
    t = tt(dur)
    env = np.minimum(1.0, t / 0.25) * np.minimum(1.0, (dur - t) / 0.35)
    return lp(y, bright, 2) * env * 0.5


def pluck(f, dur=0.22, bright=3800.0):
    t = tt(dur)
    y = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.18 * np.sin(6 * np.pi * f * t)) * np.exp(-t / 0.11)
    return bp(y, 400, bright, 2) * 0.35


def riser(dur, f0=300.0, f1=7000.0):
    n = ns(dur)
    t = np.arange(n) / SR
    x = colored(n, R, 1.0)
    y = np.zeros(n)
    # 6 overlap-add bands sweeping up
    bands = 8
    for i in range(bands):
        lo = f0 * (f1 / f0) ** (i / bands)
        hi = lo * 1.9
        g = np.clip(1 - np.abs(t / dur - (i + 0.5) / bands) * bands * 1.5, 0, 1)
        y += bp(x, lo, hi, 2) * g
    y *= np.linspace(0, 1, n) ** 2
    y += np.sin(2 * np.pi * np.cumsum(np.linspace(180, 1400, n)) / SR) * 0.12 * np.linspace(0, 1, n) ** 3
    return y * 0.5


def whoosh(dur=0.42, up=True):
    n = ns(dur)
    t = np.arange(n) / SR
    x = colored(n, R, 1.0)
    y = np.zeros(n)
    for i in range(6):
        c = (300 * (24 ** ((i + 0.5) / 6))) if up else (6000 / (20 ** ((i + 0.5) / 6)))
        y += bp(x, c * 0.6, c * 1.7, 2) * np.exp(-((t / dur - (i + 0.5) / 6) ** 2) / 0.02)
    y *= np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.4
    return y * 0.55


def impact(dur=1.1, size=1.0):
    t = tt(dur)
    f = 30 + 70 * np.exp(-t / 0.09)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.42 * size))
    y += bp(colored(len(t), R, 0.8), 200, 4200, 2) * np.exp(-t / 0.12) * 0.5
    y += hp(colored(len(t), R, 0.0), 5000, 2) * np.exp(-t / 0.02) * 0.35
    return np.tanh(y * 1.4) * 0.95


def blip(f=1500.0, dur=0.09):
    t = tt(dur)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.01)
    return y * 0.22


def keyclick():
    t = tt(0.035)
    return hp(colored(len(t), R, 0.4), 2200, 2) * np.exp(-t / 0.006) * 0.35


def tick(f=3000.0):
    t = tt(0.05)
    y = bp(colored(len(t), R, 0.2), f * 0.8, f * 2.2, 3) * np.exp(-t / 0.004)
    y += np.sin(2 * np.pi * f * 0.55 * t) * np.exp(-t / 0.012) * 0.4
    return y * 0.5


def chime(freqs=(1046.5, 1568.0, 2093.0), dur=1.2):
    t = tt(dur)
    y = np.zeros(len(t))
    for i, f in enumerate(freqs):
        y += np.sin(2 * np.pi * f * t) * np.exp(-t / (0.5 - i * 0.1)) * (0.5 ** i)
    return y * 0.22


def record_stop(dur=0.55):
    t = tt(dur)
    f = 240 * np.exp(-t / 0.18) + 34
    y = saw(1.0, dur) * 0  # placeholder shape
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.8
    y += 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    env = np.exp(-t / 0.35) * np.minimum(1, t / 0.01)
    return lp(y * env, 2600, 2) * 0.6


def laser_zap(dur=0.3):
    t = tt(dur)
    f = 2600 * np.exp(-t / 0.05) + 220
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    y += bp(colored(len(t), R, 0.5), 1500, 9000, 2) * np.exp(-t / 0.03) * 0.5
    return y * 0.4


def heartbeat(dur=0.5):
    a = kick(0.22, 120, 42, 0.2)
    b = kick(0.22, 100, 36, 0.1)
    out = np.zeros(ns(dur))
    out[: len(a)] += a
    i = ns(0.19)
    out[i: i + len(b)] += b * 0.7
    return out


# ---------------------------------------------------------------- music map
# chord roots (Hz) on an A-minor / F / C / G loop, one chord per 2 bars
PROG = [
    (55.00, [220.0, 261.63, 329.63]),  # Am
    (43.65, [174.61, 220.0, 261.63]),  # F
    (65.41, [196.0, 261.63, 329.63]),  # C
    (49.00, [196.0, 246.94, 293.66]),  # G
]


def chord_at(bar):
    return PROG[bar % 4]


def section_at(t):
    """(name, density 0..1) for a moment in the film, keyed to the picture's beats"""
    f = t * FPS
    gag0, gag1 = INS["GAG"]["from"], INS["GAG"]["to"]
    cta0, cta1 = INS["TAIL"]["from"], INS["TAIL"]["from"] + 58
    if f < line("L1")["from"]:
        return "intro", 0.15
    if f < line("L4")["from"]:
        return "grooveA", 0.75
    if f < INS["LOGO"]["from"]:
        return "build", 0.55
    if f < line("L5")["from"]:
        return "drop", 0.9
    if f < INS["CUBE"]["from"]:
        return "drop", 0.85
    if f < line("L7")["from"]:
        return "grooveB", 0.7
    if f < line("L10")["from"]:
        return "grooveC", 0.95
    if f < gag0:
        return "tension", 0.3
    if f < gag1:
        return "gag", 0.25
    if f < line("L12")["from"]:
        return "pulse", 0.5
    if f < cta0:
        return "grooveD", 1.0
    if f < cta1:
        return "cta", 0.8
    return "outro", 0.25


# drum + bass grid over the whole film
beats = int(np.ceil(DUR / BEAT)) + 1
for b in range(beats):
    t = b * BEAT
    sec, dens = section_at(t)
    bar = b // 4
    root, chord = chord_at(bar)
    in_bar = b % 4
    # kick
    if sec in ("grooveA", "grooveC", "grooveD", "drop") or (sec == "pulse" and in_bar in (0, 2)) or (sec == "intro" and b >= 22):
        place(A, kick(), t, dbg(-9.0 if sec != "grooveD" else -8.0))
    if sec == "cta" and in_bar == 0:
        place(A, kick(0.5, 160, 38), t, dbg(-6.0))
    # snare / clap on 2 and 4
    if sec in ("grooveA", "grooveC", "grooveD", "drop") and in_bar in (1, 3):
        place(A, clap(), t, dbg(-6.5))
        place(A, snare(), t, dbg(-8.5))
    # hats
    if dens > 0.4:
        for k in (0.0, 0.25, 0.5, 0.75):
            if sec == "tension":
                continue
            place(A, hat(open_=(k == 0.5 and in_bar % 2 == 1)), t + k * BEAT, dbg(-13.5 if k else -11.0))
    # bass
    if sec in ("grooveA", "grooveC", "grooveD", "drop", "pulse", "cta", "outro"):
        pat = [0, 0, 7, 0, 0, 12, 7, 0] if sec != "drop" else [0, 0, 0, 7]
        semis = pat[(b * 2) % len(pat)]
        f = root * (2 ** (semis / 12.0))
        place(A, bass_note(f, BEAT * 0.85), t, dbg(-14.0))
    # pad (one per bar, soft)
    if in_bar == 0 and sec not in ("intro", "tension", "gag"):
        place(A, pad_chord(chord, BEAT * 4 * 0.98, bright=2600 if sec != "drop" else 3800), t, dbg(-15.0 if sec != "cta" else -11.5))
    # arp in the drop + groove C
    if sec in ("drop", "grooveC") and dens > 0.6:
        for k in range(4):
            f = chord[(b + k) % len(chord)] * (2 if (b + k) % 3 == 0 else 1)
            place(A, pan(pluck(f), -0.35 + 0.23 * k), t + k * BEAT / 4, dbg(-15.0))

# tension drone + build roll
ten0 = f2s(line("L10")["from"])
ten1 = f2s(INS["GAG"]["from"])
n = ns(ten1 - ten0)
tt_ = np.arange(n) / SR
drone = (np.sin(2 * np.pi * 55 * tt_) + 0.6 * np.sin(2 * np.pi * 82.4 * tt_) + 0.3 * np.sin(2 * np.pi * 110.4 * tt_))
drone = lp(drone * (0.35 + 0.65 * np.minimum(1, tt_ / 2.0)), 500, 2) * 0.5
place(A, st(drone), ten0, dbg(-13.0))
# snare roll into the logo and into the CTA
for start, end, gain in ((f2s(line("L4")["from"]), f2s(INS["LOGO"]["from"]), -16.0), (f2s(line("L12")["from"]), f2s(INS["TAIL"]["from"]), -14.0)):
    t = start
    step = 0.0625
    while t < end - 0.05:
        prog = (t - start) / max(1e-6, end - start)
        place(A, snare(0.12, 0.2), t, dbg(gain - 6 * (1 - prog)))
        t += step * (1.9 - 1.4 * prog)

# ---------------------------------------------------------------- SFX cues
def cue_impact(f, gain=-4.0, size=1.0):
    place(S, impact(1.2, size), f2s(f), dbg(gain))


def cue_whoosh(f, gain=-11.0, dur=0.42, up=True):
    place(S, pan(whoosh(dur, up), R.uniform(-0.5, 0.5)), f2s(f) - dur * 0.6, dbg(gain))


def cue_blip(f, gain=-15.0, note=None):
    place(S, blip(note or (900 + R.uniform(0, 1400))), f2s(f), dbg(gain))


# every line start: boom + whoosh; every word: a quiet blip so the type lands with the voice
for i, ln in enumerate(T["lines"]):
    cue_impact(ln["from"], -5.0, 0.9)
    if i > 0:
        cue_whoosh(ln["from"], -12.0)
    for w in ln["words"][1:]:
        cue_blip(w["from"], -16.5)
    cue_blip(ln["words"][0]["from"], -13.0)

for name, frames in INS.items():
    if name == "open":
        continue
    cue_impact(frames["from"], -3.0, 1.2)
    cue_whoosh(frames["from"], -9.0, 0.5, up=True)

# risers into the reveal and the CTA
place(S, riser(1.5), f2s(INS["LOGO"]["from"]) - 1.5, dbg(-13.0))
place(S, riser(1.8, 200, 9000), f2s(INS["TAIL"]["from"]) - 1.8, dbg(-12.0))
place(S, riser(1.0, 400, 6000), f2s(INS["GAG"]["from"]) - 1.0, dbg(-17.0))
# logo chime + level blips
place(S, chime(), f2s(INS["LOGO"]["from"]) + 0.55, dbg(-9.0))
place(S, chime((523.25, 784.0, 1046.5), 0.9), f2s(INS["CUBE"]["from"]) + 0.25, dbg(-14.0))
# laser zaps where the picture crosses the old-way planner out
l2 = line("L2")
lx = [w for w in l2["words"] if w["w"].startswith("STICKS")][0]["from"]
place(S, laser_zap(), f2s(lx) - 0.02, dbg(-7.0))
place(S, laser_zap(0.22), f2s(lx) + 0.16, dbg(-9.0))
# quiz typing
l8 = line("L8")
for k in range(9):
    place(S, keyclick(), f2s(l8["from"]) + 0.06 + k * 0.055, dbg(-13.0))
place(S, chime((880.0, 1320.0), 0.7), f2s([w for w in l8["words"] if w["w"].startswith("NOW")][0]["from"]), dbg(-12.0))
l7 = line("L7")
lv = [w for w in l7["words"] if w["w"].startswith("LEVELS")][0]["from"]
for k in range(5):
    place(S, blip(660 * (1.19 ** k)), f2s(lv) + 0.1 + k * 0.075, dbg(-12.0))
# gag: record stop, clock ticks, starburst boom
g0 = INS["GAG"]["from"]
place(S, record_stop(), f2s(g0) - 0.06, dbg(-5.0))
for k in range(int((INS["GAG"]["to"] - g0) / FPS / 0.25)):
    place(S, tick(2400 if k % 2 == 0 else 3000), f2s(g0) + 0.35 + k * 0.25, dbg(-19.0))
place(S, heartbeat(), f2s(g0) + 0.05, dbg(-8.0))
place(S, heartbeat(), f2s(g0) + 0.9, dbg(-11.0))
l11 = line("L11")
me = [w for w in l11["words"] if w["w"].startswith("ME")][0]["from"]
cue_impact(me, -2.0, 1.35)
place(S, laser_zap(0.4), f2s(me) - 0.03, dbg(-10.0))
# "GAME." starburst
l4 = line("L4")
game = [w for w in l4["words"] if w["w"].startswith("GAME")][0]["from"]
cue_impact(game, -6.0, 1.0)
# end card: single low boom, then a warm held chord that fades out with the picture
ec = INS["TAIL"]["from"] + 58
place(S, impact(1.8, 1.4), f2s(ec), dbg(-6.0))
place(A, pad_chord([130.81, 196.0, 261.63, 329.63], max(0.2, DUR - f2s(ec))), f2s(ec), dbg(-9.0))
tail_t = tt(max(0.2, DUR - f2s(ec)))
place(A, st(np.sin(2 * np.pi * 65.41 * tail_t) * 0.3 * np.exp(-tail_t / 3.0)), f2s(ec), dbg(-11.0))

# ---------------------------------------------------------------- voice
for ln in T["lines"]:
    p = os.path.join(VO, "trim", f"L{int(ln['id'][1:]):02d}.wav")
    import wave

    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    x = hp(x, 75, 2)
    x = np.tanh(x * 1.15) * 0.9  # gentle saturation for presence
    x = peq(x, 2600, 2.5, 0.9)  # presence, so the voice stays on top of a dense bed
    place(V, st(x), f2s(ln["from"]), 1.0)

# ---------------------------------------------------------------- duck + master
# key the duck from the voice itself (10 ms envelope, smoothed), so nothing has to be hand-timed
env = np.abs(V).mean(axis=0)
w = ns(0.05)
env = np.convolve(env, np.ones(w) / w, mode="same")
thr = np.percentile(env[env > 0], 55) if (env > 0).any() else 0
key = np.clip(env / (thr * 1.2 + 1e-9), 0, 1)
key = np.convolve(key, np.ones(ns(0.12)) / ns(0.12), mode="same")

# master: pull the sub out of the music bus, lift presence, then set the level. The first pass measured almost
# all energy below 80 Hz (kick + 55 Hz bass + drone), which buries a 1-4 kHz voice, so the low end is trimmed
# and the percussion/pad/arp are up (gains above) before the bus EQ.
A = hp(A, 34, 2)
A = peq(A, 72, -2.5, 0.9)
A = shelf(A, 2200, 1.5, "high")
A = shelf(A, 4200, 2.0, "high")
S = hp(S, 40, 2)

duck = dbg(-7.5) + (1 - dbg(-7.5)) * (1 - key)
A *= duck[None, :]
S *= (dbg(-2.5) + (1 - dbg(-2.5)) * (1 - key))[None, :]

ir = make_ir(1.6, 7, hf=0.7)
wet = convolve_st(A * 0.22 + S * 0.18, ir)
mix = V * dbg(3.5) + A + S + wet * 0.55

# bus compression + master
# soft-knee limiter: tame the impact transients before the loudness trim, so the trim does not cost level
k = 1.35
mix = np.tanh(mix * k) / np.tanh(k) * 0.98
mix *= dbg(-14.0 - integrated(mix))
tp = true_peak(mix)
if tp > -1.0:
    mix *= dbg(-1.0 - tp)
mix = np.clip(mix, -1.0, 1.0)
mix = fades(mix, 0.005, 0.35)

# stems for checking the balance without ears on the box
sd = os.path.join(VO, "stems")
os.makedirs(sd, exist_ok=True)

out = os.path.join(ROOT, "public", "hype", "mix.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)


def write_wav(path, x, bits=16):
    import wave

    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(bits // 8)
        w.setframerate(SR)
        w.writeframes((x.T.reshape(-1) * 32767).astype(np.int16).tobytes())


write_wav(out, mix)
write_wav(os.path.join(sd, "music.wav"), A)
write_wav(os.path.join(sd, "sfx.wav"), S)
write_wav(os.path.join(sd, "voice.wav"), V)
print("stems:", *[f"{n} {integrated(v):.1f} LUFS" for n, v in (("music", A), ("sfx", S), ("voice", V))])
print(f"wrote {out}  {mix.shape[1]/SR:.3f}s  {integrated(mix):.1f} LUFS  peak {true_peak(mix):.2f} dBTP")
