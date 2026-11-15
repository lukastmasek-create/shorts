"""Music + sound design for the 3 ucimesehrou.org/cs homepage showcase parts (2d/src/Ucime.tsx, comps UcimeDil1..3). Original score, synthesized.
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
os.makedirs(os.path.join(ROOT, "ucime", "audio"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public", "ucime"), exist_ok=True)

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



CH = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]  # Dm Bb F C
PENT = [74, 77, 79, 81, 84, 86]
SCALE = [62, 64, 65, 67, 69, 70, 72, 74, 77]

import json
SPEC = json.load(open(os.path.join(ROOT, "2d", "src", "ucime.json")))["parts"]
CPS = 1.7
rndj = lambda i: (lambda x: x - np.floor(x))(np.sin(i * 127.1 + 311.7) * 43758.5453)


def katana_hit(vel=0.9):
    """metallic ring (resonant partials) + noise burst + sub boom"""
    t = tt(1.8); y = np.zeros(len(t))
    for f, a, d in ((1180, 1.0, 0.9), (1960, 0.7, 0.6), (3070, 0.5, 0.45), (4510, 0.35, 0.3), (6200, 0.2, 0.2)):
        y += a * np.sin(phase(np.full(len(t), f))) * np.exp(-t / d)
    y += hp(rng(31).standard_normal(len(t)), 2500) * np.exp(-t / 0.05) * 0.9
    return fades(y * 0.35 * vel, 0.0003, 0.2)


def fizz(dur=0.7, vel=0.3, seed=1, p0=-0.5, p1=0.5):
    rr = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    x = hp(rr.standard_normal(n), 3500) * np.sin(np.pi * u) ** 1.5
    return fades(x * vel, 0.01, 0.1) * np.ones(1)


def spec_build(idx, P):
    lens, ks = P["lens"], P["ks"]; n = len(lens); S = [0]; R = [0]; acc = 0.0
    for ln, k in zip(lens, ks):
        S.append(S[-1] + ln); acc += ln * k; R.append(int(np.floor(acc + 0.5)))
    TOTAL = R[n]; DUR = TOTAL / FPS; N = ns(DUR)

    def v2r(v):
        i = 0
        for q in range(n):
            if v >= S[q]: i = q
        return R[i] + (v - S[i]) * (R[i + 1] - R[i]) / (S[i + 1] - S[i])

    T = lambda v: v2r(v) / FPS
    LT = lambda i, t: T(S[i] - 12 + t)
    SEC = [R[i] / FPS for i in range(n + 1)]
    types = ["intro", "s1", "chat", "outro"]
    LEVEL = dict(intro=0.4, s1=0.85, chat=0.6, outro=0.9)
    CLIMAX = LT(3, 52)
    nb_ = max(3, int(round(CLIMAX / 2.4))); BAR = CLIMAX / nb_; BEAT = BAR / 4
    music = np.zeros((2, N)); sfx = np.zeros((2, N)); send = np.zeros((2, N))
    M = lambda x, t, g=1.0, p=0.0, rv=0.0: (place(music, pan(x, p) if np.ndim(x) == 1 else x, t, g), place(send, pan(x, p) if np.ndim(x) == 1 else x, t, g * rv))
    X = lambda x, t, g=1.0, p=0.0: place(sfx, pan(x, p) if np.ndim(x) == 1 else x, t, g)
    scene_of = lambda t: max(i for i in range(n) if t >= SEC[i] - 1e-6)
    t = tt(DUR); lv = np.interp(t, SEC[:-1] + [DUR], [LEVEL[x] for x in types] + [LEVEL["outro"]])
    drone = np.sin(phase(np.full(len(t), 36.71))) * 0.6 + lp(signal.sawtooth(phase(np.full(len(t), 73.42))), 260) * 0.28
    drone *= (0.25 + 0.75 * lv) * (1 - 0.35 * (np.sin(TAU * t / (BAR * 2)) * 0.5 + 0.5))
    drone[: ns(1.2)] *= np.linspace(0, 1, ns(1.2)) ** 2
    M(drone, 0, 0.5)
    for b in range(int(np.ceil(DUR / BAR)) + 1):
        t0 = b * BAR
        if t0 >= DUR: break
        root, tones = CH[b % 4]; sc = types[scene_of(t0)]; lv_ = LEVEL[sc]; final = t0 >= CLIMAX - 0.01
        if final: root, tones = 38, [62, 66, 69]
        M(pad([m2f(q - 12) for q in tones] + [m2f(tones[0] + 7)], BAR * (3 if final else 1), 0.5 * (0.55 + 0.45 * lv_), r, att=1.4 if t0 < 1 else 0.5, rel=1.4), t0, 0.5)
        if lv_ >= 0.55 and not final:
            for k, vv in ((0, 1.0), (1.5, 0.7), (2, 0.9), (3.5, 0.7)):
                M(pluck(m2f(root), 0.8 * vv, r, 0.5, bright=0.25), t0 + k * BEAT, 0.8)
        if final: M(sub(m2f(26), BAR * 2.0, 0.9), t0, 0.7)
        if lv_ >= 0.5 or final:
            steps = 8 if lv_ < 0.7 else 16
            seq = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12]
            for k in range(steps):
                M(pan(pluck(m2f(seq[k % 8]), 0.5 * (0.5 + 0.5 * lv_), r, 0.4, bright=0.6), 0.5 * np.sin(k * 0.9)), t0 + k * (BAR / steps), 0.34 * (0.6 + 0.4 * lv_), 0, 0.5)
        if lv_ < 0.55:
            for k in range(4):
                if r.random() < 0.6:
                    M(st(glock(m2f(PENT[int(r.integers(0, len(PENT)))]), 0.5, r, 2.0)), t0 + k * BEAT + (0.5 * BEAT if k % 2 else 0), 0.32, 0, 0.8)
        if lv_ >= 0.55 and not final:
            for k in ((0, 2) if lv_ < 0.7 else (0, 1, 2, 3)): M(kick(0.55 + 0.25 * lv_, seed=b * 7 + k), t0 + k * BEAT, 0.7)
            if lv_ >= 0.7:
                for k in range(8): M(hat(0.2 + 0.1 * (k % 2), seed=b * 11 + k, open_=(k == 7)), t0 + k * BEAT / 2, 0.45, 0.3 * (1 if k % 2 else -1))
            if lv_ >= 0.8:
                for k in (1, 3): M(clap(0.45, seed=b * 5 + k), t0 + k * BEAT, 0.5, 0.1)
        if final:
            for k in (0, 1, 2, 3): M(kick(0.8, seed=b * 3 + k), t0 + k * BEAT, 0.6)
    for i in range(1, n):
        tc = T(S[i] - 2)
        X(swoosh(1.15, 0.65, seed=70 + i + 10 * idx, lo=200 + 30 * i), tc - 0.62, 0.8, -0.35 if i % 2 else 0.35); X(thunk(0.35, 150), tc + 0.45, 0.5)

    def logo_notes(i, t_first, gap, vel=0.5):
        for e in range(1, 20):
            q = PENT[(e * 2 + e // 3) % len(PENT)] + (12 if e >= 18 else 0) - 12 * (e < 6)
            M(pan(musicbox(m2f(q), 0.45 + 0.01 * e, r, 1.4), -0.5 + 0.05 * e), LT(i, t_first + (e - 1) * gap), vel, 0, 0.8)
        X(zap(0.25, 600, 2200, 0.2), LT(i, t_first - 2), 0.5)

    # ---- scene events (scene-local t mirrors Ucime.tsx)
    L0 = lambda tl: LT(0, tl)
    X(swoosh(0.6, 0.45, seed=23 + idx), L0(8), 0.7)
    for k in range(4): X(bloop(0.2, 500 + 120 * k, 900 + 150 * k, 0.1), L0(6 + 7 * k + 2), 0.6)   # 4 object morphs
    X(boom(0.55, 46, 1.4, seed=6), L0(30), 0.7); logo_notes(0, 40, 0.9, 0.45); X(zap(0.3, 500, 1700, 0.15), L0(48), 0.6)
    for tl in (34, 40): X(thunk(0.3, 190), L0(tl), 0.5)
    tc = P["tc"]; L1 = lambda tl: LT(1, tl)
    X(zap(0.25, 420, 900, 0.12), L1(20), 0.5); X(riser(0.5, 0.35, seed=61 + idx, f0=400, f1=5000), L1(tc) - 0.55, 0.7)
    for tl in np.arange(28, 46, 2.0): X(tick(0.1, seed=int(tl * 10), f=3000 + 90 * tl), L1(float(tl)), 0.6)
    X(katana_hit(1.0), L1(tc), 1.0); X(boom(0.8, 42, 1.4, seed=12), L1(tc), 0.9)
    for k in range(6): X(zap(0.2, 600 + 90 * k, 1100 + 130 * k, 0.1), L1(tc + 8 + 3 * k), 0.45, -0.3 + 0.12 * k)
    letters = len([c for c in P["word"] if c != " "]); nb = len(P["chat"])
    grp = lambda i: min(nb - 1, int(np.floor(i * nb / letters)))
    first = lambda g: min(i for i in range(letters) if grp(i) == g)
    aL = lambda i: P["sparkBase"] + grp(i) * P["gap"] + (i - first(grp(i))) * P["stag"]
    dur = lambda i: 34 + float(rndj(i + 7)) * 8
    for i in range(letters):
        X(fizz(dur(i) / FPS * 1.2, 0.22, seed=100 + i), L1(aL(i)), 0.8)
    X(riser(max(1.0, LT(2, 8) - L1(P["sparkBase"])), 0.6, seed=41 + idx, f0=500, f1=9000), L1(P["sparkBase"]), 0.7)
    L2 = lambda tl: LT(2, tl)
    for j, c in enumerate(P["chat"]):
        arr = min(aL(i) + dur(i) for i in range(letters) if grp(i) == j) + (S[1] - 12) - (S[2] - 12)
        X(bloop(0.3, 300, 800, 0.2), L2(arr), 0.8, 0.2); M(pan(pluck(m2f([74, 77, 81][j % 3] - 12), 0.7, r, 0.6, bright=0.5), -0.3 + 0.3 * j), L2(arr), 0.5, 0, 0.7)
        nst = len(c["t"].replace("\n", "")) + (2 * len(c["typo"][1]) if "typo" in c else 0)
        for q in range(nst): X(tick(0.14, seed=500 + 31 * j + q, f=3200 + 400 * (q % 3)), L2(arr + 10 + q / CPS), 0.7, ((q % 5) - 2) * 0.08)
    L3 = lambda tl: LT(3, tl)
    logo_notes(3, 14, 0.9, 0.45)
    for k, q in enumerate((74, 78, 81, 86)): M(st(glock(m2f(q), 0.6, r, 2.0)), L3(36) + 0.06 * k, 0.45, 0, 0.9)
    X(boom(1.0, 38, 3.2, seed=9), CLIMAX, 1.0)
    M(timpani(m2f(38), 0.9, r, 3.0), CLIMAX, 0.7, 0, 0.5); M(timpani(m2f(45), 0.8, r, 3.0), CLIMAX + 0.01, 0.4); M(cymbal(0.8, r, 3.2), CLIMAX, 0.5, 0, 0.4)
    for k, q in enumerate((74, 78, 81, 86, 90, 93)): M(pan(musicbox(m2f(q), 0.6, r, 2.0), -0.5 + 0.2 * k), CLIMAX + 0.3 + 0.12 * k, 0.55, 0, 1.0)
    # katana: music drops out for 3 frames, then returns louder
    env = np.ones(N); a0 = ns(L1(tc)); env[a0:a0 + ns(3 / FPS)] = 0.05; env[a0 + ns(3 / FPS):a0 + ns(0.5)] = np.linspace(1.35, 1.0, ns(0.5) - ns(3 / FPS))
    music *= env[None, :]; send *= env[None, :]
    ir = make_ir(2.6, 5, hf=1.2, density_lp=9000); wet = convolve_st(send, ir)
    mus = norm_to(music * 0.9 + wet * 0.7, -17.0, "integrated"); fx = norm_to(sfx, -21.0, "momentary"); mix = norm_to(mus + fx, -15.0, "integrated")
    end = ns(1.6); mix[:, -end:] *= np.linspace(1, 0, end)[None, :] ** 1.5; mix[:, : ns(0.08)] *= np.linspace(0, 1, ns(0.08))[None, :]
    mix = 0.89 * np.tanh(mix / 0.89)
    write_wav(os.path.join(ROOT, "ucime", "audio", f"part{idx}.wav"), mix, bits=16); write_wav(os.path.join(ROOT, "public", "ucime", f"part{idx}.wav"), mix, bits=16)
    ps = [float(np.sqrt(np.mean(mix[:, int(SEC[i] * SR):int(SEC[i + 1] * SR)] ** 2))) for i in range(n)]
    print(f"part{idx}: frames {TOTAL} ({DUR:.2f} s) wav {mix.shape[1]/SR:.3f} s  {integrated(mix):.1f} LUFS tp {true_peak(mix):.1f} dBTP  rms/scene {[round(x,3) for x in ps]}")


for i_, P_ in enumerate(SPEC, 1):
    spec_build(i_, P_)
