"""Realistic sound effects for the showcase videos: NO music, NO electric blips. Everything is built from what the real thing does:
a plastic mouse click, mechanical key thocks, air whooshes, a steel blade (air swish + ring of a free steel bar + cut thud), tiny
chips that clink and bounce, paper, fire-like crackle for sparks, wooden taps for chat bubbles. All mono one-shots (np arrays, 48 kHz).
usage:  from sfx_real import *;  place(buf, pan(katana_cut(), 0.1), t_seconds, gain)
"""
import os, sys
import numpy as np
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, fades, phase, modal


def _norm(x, peak):
    return x / (np.max(np.abs(x)) + 1e-12) * peak


def click(vel=0.8, seed=1):
    """mouse button: a sharp plastic 'tik' on press, a softer higher 'tak' on release 70 ms later, tiny hollow body"""
    r = rng(seed); out = np.zeros(ns(0.2))
    for t0, v, f in ((0.0, 1.0, 1.0), (0.07, 0.45, 1.25)):
        n = ns(0.06); t = np.arange(n) / SR
        tik = bp(r.standard_normal(n), 2200 * f, 6500 * f, 2) * np.exp(-t / 0.0022)
        body = modal(0.06, [(900 * f, 0.5, 0.006), (1650 * f, 0.35, 0.004), (3300 * f, 0.15, 0.003)], r)
        thud = lp(r.standard_normal(n), 380) * np.exp(-t / 0.008) * 0.6
        y = fades(tik * 1.0 + body * 0.8 + thud, 0.0002, 0.01) * v
        k = ns(t0); out[k:k + n] += y
    return _norm(out, vel)


def key(vel=0.6, seed=2):
    """mechanical keyboard 'thock': switch click + case thump, each press is a bit different"""
    r = rng(seed); n = ns(0.09); t = np.arange(n) / SR; f = 1 + 0.12 * (r.random() - 0.5)
    click_ = hp(r.standard_normal(n), 2500) * np.exp(-t / 0.0015) * 0.22
    thock = modal(0.09, [(185 * f, 1.0, 0.03), (340 * f, 0.5, 0.02), (690 * f, 0.22, 0.012)], r) + lp(r.standard_normal(n), 900) * np.exp(-t / 0.006) * 0.5
    return _norm(fades(click_ + thock * 1.5, 0.0002, 0.01), vel)


def whoosh(dur=0.9, vel=0.6, lo=180, hi=2600, seed=3, rise=0.6):
    """air moving past the mic: band-passed noise whose centre rises then falls, smooth swell, no tone at all"""
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n); x = colored(n, r, 0.7)
    a = bp(x, lo, lo * 3.2, 2); b = bp(x, hi * 0.35, hi, 2)
    mixu = np.clip(u / max(rise, 0.05), 0, 1) ** 1.5 * (1 - 0.6 * np.clip((u - rise) / (1 - rise + 1e-9), 0, 1))
    y = a * (1 - mixu) + b * mixu
    env = np.sin(np.pi * np.clip(u ** 0.8, 0, 1)) ** 2.2
    return _norm(fades(y * env, 0.01, 0.12), vel)


def swish(dur=0.2, vel=0.8, seed=4):
    """a blade cutting air: short, bright, fast rise, sharp fall (higher and quicker than a whoosh)"""
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n); x = colored(n, r, 0.2)
    y = bp(x, 1400, 4200, 2) * (1 - u) + bp(x, 3500, 9500, 2) * u
    env = (u ** 0.7) * np.exp(-((u - 0.72) / 0.28) ** 2 * 2.2)
    env[int(n * 0.92):] *= np.linspace(1, 0, n - int(n * 0.92))
    return _norm(fades(y * env, 0.004, 0.02), vel)


def steel_ring(dur=1.1, f0=1850.0, vel=0.5, seed=5):
    """a struck steel bar / blade tip: free-bar mode ratios (1, 2.76, 5.40, 8.93, 13.3), highs die first, slight beating"""
    r = rng(seed); ratios = [1.0, 2.756, 5.404, 8.933, 13.34]; amps = [1.0, 0.6, 0.42, 0.26, 0.14]; taus = [0.9, 0.55, 0.34, 0.2, 0.12]
    modes = []
    for k, (q, a, tau) in enumerate(zip(ratios, amps, taus)):
        modes.append((f0 * q, a, tau * dur)); modes.append((f0 * q * 1.0035, a * 0.6, tau * dur * 0.9))   # beating pair
    y = modal(dur, modes, r); n = len(y); t = np.arange(n) / SR
    y += hp(r.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.6           # the metallic strike
    y = hp(y, 700)
    return _norm(fades(y, 0.0003, 0.08), vel)


def cut_thud(vel=0.8, seed=6):
    """the blade biting through a card: a short low thump plus a crisp split, like cutting dense paper board"""
    r = rng(seed); n = ns(0.22); t = np.arange(n) / SR
    thump = np.sin(phase(np.full(n, 105.0) * (1 + 0.5 * np.exp(-t / 0.02)))) * np.exp(-t / 0.05)
    split = bp(r.standard_normal(n), 600, 4500, 2) * np.exp(-t / 0.012) * 0.6 + hp(r.standard_normal(n), 4000) * np.exp(-t / 0.003) * 0.18
    return _norm(fades(thump * 1.4 + split, 0.0002, 0.03), vel)


def katana_cut(vel=1.0, seed=7):
    """swish -> hit -> ring: air swish (180 ms) ends at t = 0.18 s, then cut thud + steel ring right on the hit. Place so t0+0.18 = the cut frame."""
    sw = swish(0.18, 0.85, seed); out = np.zeros(ns(1.5))
    out[:len(sw)] += sw
    hit = ns(0.18)
    th = cut_thud(0.9, seed + 1); out[hit:hit + len(th)] += th
    rg = steel_ring(1.2, 1700 + 500 * rng(seed).random(), 0.42, seed + 2); out[hit:hit + len(rg)] += rg
    return _norm(out, vel)


def chip_fall(vel=0.6, seed=8):
    """a broken corner chip bouncing: three clinks with falling level and spacing (gravity), small and hard"""
    r = rng(seed); out = np.zeros(ns(0.9)); t0 = 0.0; v = 1.0; gap = 0.24
    for k in range(4):
        f = 2600 + 1400 * r.random(); y = modal(0.12, [(f, 1.0, 0.012), (f * 2.3, 0.5, 0.008), (f * 3.9, 0.25, 0.005)], r) * v
        y += hp(r.standard_normal(len(y)), 5000) * np.exp(-np.arange(len(y)) / SR / 0.002) * 0.4 * v
        i = ns(t0); out[i:i + len(y)] += y; t0 += gap; gap *= 0.55; v *= 0.5
    return _norm(out, vel)


def debris(vel=0.4, n_=14, seed=9):
    """small fragments crumbling and scattering: random tiny ticks, denser at first"""
    r = rng(seed); out = np.zeros(ns(0.8))
    for k in range(n_):
        t0 = 0.5 * (r.random() ** 1.8); f = 2200 + 3000 * r.random(); y = modal(0.05, [(f, 1, 0.006), (f * 1.9, 0.4, 0.004)], r) * (0.3 + 0.7 * r.random())
        i = ns(t0); out[i:i + len(y)] += y
    return _norm(out, vel)


def crackle(dur=0.8, vel=0.4, seed=10, rate=70):
    """sparks: fire-like crackle, random pops that thin out, bright, no tonal parts"""
    r = rng(seed); out = np.zeros(ns(dur)); t = 0.0
    while t < dur:
        t += r.exponential(1.0 / (rate * (1 - 0.7 * t / dur)))
        if t >= dur: break
        n = ns(0.012); y = hp(r.standard_normal(n), 1600 + 2400 * r.random()) * np.exp(-np.arange(n) / SR / 0.0025) * (0.2 + r.random())
        i = ns(t); out[i:i + n] += y[:max(0, len(out) - i)]
    return _norm(fades(out, 0.002, 0.1), vel)


def page(dur=0.45, vel=0.5, seed=11):
    """paper turning: dry broadband rustle with a few flutter pulses"""
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n); x = hp(colored(n, r, 0.1), 1200)
    flutter = 0.55 + 0.45 * np.abs(np.sin(TAU * (9 + 6 * u) * u * dur))
    return _norm(fades(bp(x, 1500, 7500, 1) * np.sin(np.pi * u) ** 1.5 * flutter, 0.01, 0.06), vel)


def tok(vel=0.5, seed=12):
    """wooden tap for a chat bubble landing: soft, hollow, short"""
    r = rng(seed); f = 640 + 160 * r.random()
    y = modal(0.12, [(f, 1.0, 0.022), (f * 2.1, 0.45, 0.012), (f * 3.4, 0.2, 0.008)], r) + lp(r.standard_normal(ns(0.12)), 1800) * np.exp(-tt(0.12) / 0.004) * 0.4
    return _norm(fades(y, 0.0003, 0.02), vel)


def impact(vel=0.8, seed=13):
    """a heavy but short body-hit for slams: low thump and a dull slap, no pitch glide, decays in 0.35 s"""
    r = rng(seed); n = ns(0.4); t = np.arange(n) / SR
    y = np.sin(phase(np.full(n, 58.0) * (1 + 0.8 * np.exp(-t / 0.03)))) * np.exp(-t / 0.11) + lp(r.standard_normal(n), 500) * np.exp(-t / 0.02) * 0.7
    return _norm(fades(y, 0.0005, 0.06), vel)


def cloth(dur=0.5, vel=0.35, seed=14):
    """window/card sliding in: soft low swish with a little friction"""
    r = rng(seed); n = ns(dur); u = np.linspace(0, 1, n)
    return _norm(fades(bp(colored(n, r, 1.0), 300, 2200, 2) * np.sin(np.pi * u) ** 1.5, 0.02, 0.1), vel)


KINDS = dict(click=click, key=key, whoosh=whoosh, swish=swish, katana=katana_cut, steel=steel_ring, thud=cut_thud, chip=chip_fall, debris=debris,
             crackle=crackle, page=page, tok=tok, impact=impact, cloth=cloth)
