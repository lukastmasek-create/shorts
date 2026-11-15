"""Music + sound design for the four Kód na hraní parts (2d/src/Code.tsx, comps KodDil1..4). Original score, synthesized.
usage: python audio/code_mix.py        (needs numpy + scipy)
out:   public/code/part1..4.wav (48 kHz stereo 16-bit, exactly the video length) + code/audio/ working copies
Scene tables below (type, len, k) mirror createFilm(...) in Code.tsx: keep them identical. Event times are scene-local t
(virtual frame = S_i - 12 + t). D minor, ~100 bpm, 4/4, Dm - Bb - F - C, resolves to D major on the part's climax.
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


# ---------------------------------------------------------------- parts
PARTS = [
    [("introFull", 165, 1.25), ("files", 105, 1.3), ("explain", 165, 1.4), ("outro", 90, 1.3)],
    [("introShort", 98, 1.3), ("preview", 110, 1.3), ("auto", 100, 1.3), ("outro", 90, 1.3)],
    [("introShort", 98, 1.3), ("exercise", 105, 1.35), ("ai", 105, 1.35), ("outro", 90, 1.3)],
    [("introShort", 98, 1.3), ("plan", 135, 1.5), ("finale", 150, 1.35)],
]
LEVEL = dict(introFull=0.35, introShort=0.45, files=0.65, explain=0.75, preview=0.85, auto=0.85, exercise=0.9, ai=0.5, plan=0.95, finale=1.0, outro=0.9)
CH = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]  # Dm Bb F C
PENT = [74, 77, 79, 81, 84, 86]
SCALE = [62, 64, 65, 67, 69, 70, 72, 74, 77]


def build(idx, scenes):
    n = len(scenes); S = [0]; R = [0]; acc = 0.0
    for _, ln, k in scenes:
        S.append(S[-1] + ln); acc += ln * k; R.append(int(np.floor(acc + 0.5)))
    TOTAL = R[n]; DUR = TOTAL / FPS; N = ns(DUR)

    def v2r(v):
        i = 0
        for q in range(n):
            if v >= S[q]:
                i = q
        return R[i] + (v - S[i]) * (R[i + 1] - R[i]) / (S[i + 1] - S[i])

    T = lambda v: v2r(v) / FPS
    SEC = [R[i] / FPS for i in range(n + 1)]
    types = [x[0] for x in scenes]
    LT = lambda i, t: T(S[i] - 12 + t)                     # scene-local t -> seconds
    last = n - 1
    CLIMAX = LT(last, 74) if types[last] == "finale" else LT(last, 54)
    nb = max(3, int(round(CLIMAX / 2.4)))
    BAR = CLIMAX / nb; BEAT = BAR / 4
    music = np.zeros((2, N)); sfx = np.zeros((2, N)); send = np.zeros((2, N))
    M = lambda x, t, g=1.0, p=0.0, rv=0.0: (place(music, pan(x, p) if np.ndim(x) == 1 else x, t, g), place(send, pan(x, p) if np.ndim(x) == 1 else x, t, g * rv))
    X = lambda x, t, g=1.0, p=0.0: place(sfx, pan(x, p) if np.ndim(x) == 1 else x, t, g)
    scene_of = lambda t: max(i for i in range(n) if t >= SEC[i] - 1e-6)
    lv_of = lambda t: LEVEL[types[scene_of(t)]]

    # drone
    t = tt(DUR); lv = np.interp(t, SEC[:-1] + [DUR], [LEVEL[x] for x in types] + [LEVEL[types[-1]]])
    drone = np.sin(phase(np.full(len(t), 36.71))) * 0.6 + lp(signal.sawtooth(phase(np.full(len(t), 73.42))), 260) * 0.28
    drone *= (0.25 + 0.75 * lv) * (1 - 0.35 * (np.sin(TAU * t / (BAR * 2)) * 0.5 + 0.5))
    drone[: ns(1.2)] *= np.linspace(0, 1, ns(1.2)) ** 2
    M(drone, 0, 0.5)

    for b in range(int(np.ceil(DUR / BAR)) + 1):
        t0 = b * BAR
        if t0 >= DUR:
            break
        root, tones = CH[b % 4]; sc = types[scene_of(t0)]; lv = LEVEL[sc]
        final = t0 >= CLIMAX - 0.01
        if final:
            root, tones = 38, [62, 66, 69]
        M(pad([m2f(q - 12) for q in tones] + [m2f(tones[0] + 7)], BAR * (3 if final else 1), 0.5 * (0.55 + 0.45 * lv), r, att=1.4 if t0 < 1 else 0.5, rel=1.4), t0, 0.5)
        if lv >= 0.55 and sc != "ai" and not final:
            for k, vv in ((0, 1.0), (1.5, 0.7), (2, 0.9), (3.5, 0.7)):
                M(pluck(m2f(root), 0.8 * vv, r, 0.5, bright=0.25), t0 + k * BEAT, 0.8)
        if final:
            M(sub(m2f(26), BAR * 2.0, 0.9), t0, 0.7)
        if (lv >= 0.5 and sc != "ai") or final:
            steps = 8 if lv < 0.7 else 16
            seq = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12]
            for k in range(steps):
                q = seq[k % 8] + (12 if lv >= 0.95 and k % 8 == 6 else 0)
                M(pan(pluck(m2f(q), 0.5 * (0.5 + 0.5 * lv), r, 0.4, bright=0.6), 0.5 * np.sin(k * 0.9)), t0 + k * (BAR / steps), 0.34 * (0.6 + 0.4 * lv), 0, 0.5)
        if lv < 0.55 or sc == "ai":
            for k in range(4):
                if r.random() < 0.6:
                    q = PENT[int(r.integers(0, len(PENT)))]
                    M(st(glock(m2f(q), 0.5, r, 2.0)), t0 + k * BEAT + (0.5 * BEAT if k % 2 else 0), 0.32, 0, 0.8)
        if sc == "ai":
            M(st(vibes(m2f(tones[1] + 12), 0.5, r, 2.4, trem=3.0, trem_depth=0.4)), t0 + BEAT, 0.4, 0, 0.7)
        if lv >= 0.55 and sc != "ai" and not final:
            for k in ((0, 2) if lv < 0.7 else (0, 1, 2, 3)):
                M(kick(0.55 + 0.25 * lv, seed=b * 7 + k), t0 + k * BEAT, 0.7)
            if lv >= 0.7:
                for k in range(8):
                    M(hat(0.2 + 0.1 * (k % 2), seed=b * 11 + k, open_=(k == 7)), t0 + k * BEAT / 2, 0.45, 0.3 * (1 if k % 2 else -1))
            if lv >= 0.8:
                for k in (1, 3):
                    M(clap(0.45, seed=b * 5 + k), t0 + k * BEAT, 0.5, 0.1)
        if final:
            for k in (0, 1, 2, 3):
                M(kick(0.8, seed=b * 3 + k), t0 + k * BEAT, 0.6)

    # swoops between scenes
    for i in range(1, n):
        tc = T(S[i] - 2)
        X(swoosh(1.15, 0.65, seed=70 + i + 10 * idx, lo=200 + 30 * i), tc - 0.62, 0.8, -0.35 if i % 2 else 0.35)
        X(thunk(0.35, 150), tc + 0.45, 0.5)

    def logo_notes(i, t_first, gap, vel=0.5):
        for e in range(1, 20):
            q = PENT[(e * 2 + e // 3) % len(PENT)] + (12 if e >= 18 else 0) - 12 * (e < 6)
            M(pan(musicbox(m2f(q), 0.45 + 0.01 * e, r, 1.4), -0.5 + 0.05 * e), LT(i, t_first + (e - 1) * gap), vel, 0, 0.8)
        X(zap(0.25, 600, 2200, 0.2), LT(i, t_first - 2), 0.5)

    for i, ty in enumerate(types):
        L = lambda tl: LT(i, tl)
        if ty == "introFull":
            X(swoosh(0.9, 0.5, seed=21), L(14), 0.7); X(boom(0.6, 44, 1.6, seed=5), L(54), 0.7)
            for tl in (60, 64): X(bloop(0.2, 700, 1100, 0.1), L(tl), 0.6)
            X(swoosh(0.7, 0.4, seed=22), L(68), 0.6)
            logo_notes(i, 74, 2.4, 0.5)
            X(boom(0.9, 40, 2.6), L(114), 0.9); M(timpani(m2f(38), 0.7, r, 2.4), L(114), 0.5, 0, 0.5); M(cymbal(0.4, r, 2.4), L(116), 0.3, 0, 0.3)
            M(st(glock(m2f(86), 0.7, r, 2.0)), L(134), 0.4, 0, 0.8)
        elif ty == "introShort":
            X(swoosh(0.6, 0.45, seed=23 + idx), L(14), 0.7); X(boom(0.55, 46, 1.4, seed=6), L(32), 0.7)
            logo_notes(i, 44, 1.3, 0.45)
            X(zap(0.3, 500, 1700, 0.15), L(58), 0.6)
            for tl in (64, 72): X(thunk(0.35, 190), L(tl), 0.6)
        elif ty == "files":
            for k in range(3): X(zap(0.25, 420 + 120 * k, 900 + 200 * k, 0.12), L(20 + 4 * k), 0.5, -0.3 + 0.3 * k)
            X(thunk(0.4, 170), L(34), 0.6); X(boom(0.7, 46, 1.6, seed=6), L(46), 0.6)
        elif ty == "explain":
            for tl in np.arange(8, 66, 1.7): X(tick(0.13, seed=int(tl * 10), f=3600 + 500 * (int(tl) % 3)), L(float(tl)), 0.7, ((int(tl) % 5) - 2) * 0.08)
            for k in range(5):
                X(zap(0.32, 520 + 90 * k, 1500 + 160 * k, 0.16), L(30 + 22 * k), 0.7, 0.2); X(bloop(0.15, 700 + 80 * k, 1100 + 80 * k), L(30 + 22 * k) + 0.05, 0.6)
        elif ty == "preview":
            for tl in list(np.arange(24, 42, 1.5)) + list(np.arange(62, 82, 1.5)): X(tick(0.13, seed=int(tl * 10), f=3600 + 400 * (int(tl) % 3)), L(float(tl)), 0.7)
            for tl, q in ((52, 79), (84, 84)):
                M(st(glock(m2f(q), 0.7, r, 1.6)), L(tl), 0.45, 0, 0.6); X(swoosh(0.5, 0.3, seed=tl), L(tl) - 0.2, 0.5)
        elif ty == "auto":
            for tl in (34, 37): X(tick(0.18, seed=tl, f=3200), L(tl), 0.8)
            X(bloop(0.2, 500, 760, 0.12), L(40), 0.6)
            for tl in (56, 64): X(tick(0.2, seed=tl, f=2400), L(tl), 0.8)
            X(thunk(0.5, 210), L(80), 0.8)
            for k, q in enumerate((69, 72, 76, 81, 84)): M(pan(pluck(m2f(q), 0.6, r, 0.5, bright=0.7), -0.4 + 0.2 * k), L(80) + 0.05 + 0.055 * k, 0.4, 0, 0.7)
        elif ty == "exercise":
            for k in range(12): X(tick(0.12 + 0.01 * k, seed=300 + k, f=2200 + 260 * k), L(14 + k * 2.2), 0.7)
            for tl in (42, 46, 50, 54): X(tick(0.18, seed=tl, f=3300), L(tl), 0.8)
            for k, q in enumerate((74, 78, 81, 86, 90)): M(st(glock(m2f(q), 0.65, r, 2.0)), L(62) + 0.07 * k, 0.5, 0, 0.8)
            X(swoosh(0.6, 0.4, seed=33), L(62) - 0.25, 0.6)
        elif ty == "ai":
            X(bloop(0.3, 600, 300, 0.12), L(20), 0.7)
            for k in range(8): X(bloop(0.13, 420 + 40 * (k % 3), 520 + 40 * (k % 3), 0.07), L(36 + k * 3.2), 0.6, 0.2)
            X(bloop(0.3, 300, 800, 0.35), L(44), 0.8)
            for tl in (66, 78): X(zap(0.2, 800, 1500, 0.12), L(tl), 0.6)
        elif ty == "plan":
            for k, q in enumerate(SCALE):
                tk = L(22 + 111 * k / 8 - 16)
                M(pan(musicbox(m2f(q + 12), 0.55 + 0.04 * k, r, 1.4), -0.4 + 0.1 * k), tk, 0.55, 0, 0.8); X(bloop(0.12, 500 + 40 * k, 800 + 60 * k, 0.1), tk, 0.6)
            M(st(glock(m2f(89), 0.8, r, 2.4)), L(22 + 111 - 16), 0.5, 0, 0.9)
            nxt = LT(i + 1, 74) if i + 1 < n and types[i + 1] == "finale" else T(S[i + 1])
            X(riser(max(1.0, nxt - L(60)), 0.7, seed=41, f0=250, f1=11000), L(60), 0.8)
            tH0, tH1 = L(100), nxt
            if tH1 - tH0 > 0.5:
                tt_ = tH0
                while tt_ < tH1 - 0.05:
                    u = (tt_ - tH0) / (tH1 - tH0); M(snare(0.2 + 0.5 * u, r, 0.2, 1.1, 1.0, True), tt_, 0.6, 0.0); tt_ += max(0.045, BEAT / 2 * (1 - u * 0.9))
        elif ty == "finale":
            X(thunk(0.5, 140), L(30), 0.8); X(boom(0.6, 46, 1.4, seed=8), L(30), 0.55); X(swoosh(0.8, 0.5, seed=51), L(62) - 0.1, 0.6)
            logo_notes(i, 104, 1.4, 0.45)
            M(st(glock(m2f(98), 0.7, r, 3.2)), L(124), 0.5, 0, 1.0)
        elif ty == "outro":
            logo_notes(i, 14, 1.5, 0.45)
            for k, q in enumerate((74, 78, 81, 86)): M(st(glock(m2f(q), 0.6, r, 2.0)), L(54) + 0.06 * k, 0.45, 0, 0.9)
            for tl in (68, 76): X(thunk(0.3, 200), L(tl), 0.5)
    # climax hits
    X(boom(1.0, 38, 3.2, seed=9), CLIMAX, 1.0)
    M(timpani(m2f(38), 0.9, r, 3.0), CLIMAX, 0.7, 0, 0.5); M(timpani(m2f(45), 0.8, r, 3.0), CLIMAX + 0.01, 0.4)
    M(cymbal(0.8, r, 3.2), CLIMAX, 0.5, 0, 0.4)
    for k, q in enumerate((74, 78, 81, 86, 90, 93)): M(pan(musicbox(m2f(q), 0.6, r, 2.0), -0.5 + 0.2 * k), CLIMAX + 0.3 + 0.12 * k, 0.55, 0, 1.0)

    # master
    ir = make_ir(2.6, 5, hf=1.2, density_lp=9000)
    wet = convolve_st(send, ir)
    mus = norm_to(music * 0.9 + wet * 0.7, -17.0, "integrated")
    fx = norm_to(sfx, -21.0, "momentary")
    mix = norm_to(mus + fx, -15.0, "integrated")
    end = ns(1.6)
    mix[:, -end:] *= np.linspace(1, 0, end)[None, :] ** 1.5
    mix[:, : ns(0.08)] *= np.linspace(0, 1, ns(0.08))[None, :]
    mix = 0.89 * np.tanh(mix / 0.89)
    write_wav(os.path.join(ROOT, "code", "audio", f"part{idx}.wav"), mix, bits=16)
    write_wav(os.path.join(ROOT, "public", "code", f"part{idx}.wav"), mix, bits=16)
    print(f"part{idx}: frames {TOTAL} ({DUR:.2f} s)  wav {mix.shape[1]/SR:.3f} s  climax {CLIMAX:.2f}s  {integrated(mix):.1f} LUFS  tp {true_peak(mix):.1f} dBTP")


for i, sc_ in enumerate(PARTS, 1):
    build(i, sc_)
