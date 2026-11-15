"""Action sound design for HypeShort (no voice). Reads src/videos/hype/shots.json -> public/hype/mix.wav (44.1 kHz stereo).
Every sound is keyed to a frame: transition whooshes land on the transition frames, hits on word slams, ticks on lists,
zips on laser/X draws, thumps on stairs, typing clicks. Music bed (bass + hats + arp) ducks under every hit.
EVENTS below uses LOCAL frames (same numbers as scenes.tsx). Needs numpy + scipy."""
import json, pathlib
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "src/videos/hype/shots.json").read_text())
FPS = D["fps"]; shots = D["shots"]
ids = [s["id"] for s in shots]
starts, a = [], 0
for s in shots: starts.append(a); a += s["dur"]
TOTAL = a / FPS
N = int((TOTAL + 0.6) * SR)
rng = np.random.default_rng(7)
SL = np.zeros(N); SR_ = np.zeros(N)      # sfx
ML = np.zeros(N); MR = np.zeros(N)       # music
hits = []                                # times that duck the music (s, strength)

def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i < 0 or i >= N: return
    sig = sig[: N - i]
    buf[0][i:i + len(sig)] += sig * gain * (1 - max(pan, 0))
    buf[1][i:i + len(sig)] += sig * gain * (1 + min(pan, 0))

def sfx(sig, t, gain=1.0, pan=0.0, duck=0.0):
    put((SL, SR_), sig, t, gain, pan)
    if duck: hits.append((t, duck))

def music(sig, t, gain=1.0, pan=0.0): put((ML, MR), sig, t, gain, pan)

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)

def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)

def noise(n): return rng.standard_normal(n)

# ---------- sfx synths ----------
def impact(big=1.0):
    n = int(0.7 * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 7) + 32) / SR) * np.exp(-t * 5.5)
    crack = filt(noise(n), "band", [800, 7000]) * np.exp(-t * 38) * 0.55
    body = filt(noise(n), "low", 900) * np.exp(-t * 14) * 0.35
    return (sub + crack + body) * big

def crack():
    n = int(0.22 * SR); t = np.arange(n) / SR
    return (filt(noise(n), "band", [1200, 9000]) * np.exp(-t * 45) * 0.8 + np.sin(2 * np.pi * 140 * t) * np.exp(-t * 30) * 0.5)

def thump(freq=90):
    n = int(0.3 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(freq * np.exp(-t * 12) + 38) / SR) * np.exp(-t * 11) * 0.9

def whoosh(dur, up=True, width=1.0):
    n = int(dur * SR); x = noise(n); out = np.zeros(n); k = 14
    for j in range(k):
        s, e = j * n // k, (j + 1) * n // k
        fc = (350 + (j / k) ** 2 * 7500) if up else (7850 - (j / k) ** 2 * 7500)
        if e - s > 40: out[s:e] = filt(x[s:e], "band", [fc * 0.65, min(fc * 1.45, SR / 2 - 100)], 1)
    t = np.linspace(0, 1, n)
    return out * np.sin(np.pi * t) ** (1.6 / width) * 0.8

def swell(dur):                      # reverse-cymbal swell that ends at its last sample
    n = int(dur * SR); t = np.linspace(0, 1, n)
    x = filt(noise(n), "high", 1500) * t ** 2.4
    return x * 0.8 + np.sin(2 * np.pi * np.cumsum(250 + 1500 * t ** 2) / SR) * t ** 2.4 * 0.2

def riser(dur):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    return (filt(noise(n), "high", 500) * t ** 2 * 0.5 + np.sin(2 * np.pi * np.cumsum(180 + 2200 * t ** 2) / SR) * t ** 2 * 0.28)

def zip_(dur=0.18, up=False, f0=5000, f1=700):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    f = (f1 + (f0 - f1) * t) if up else (f0 + (f1 - f0) * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR))
    return filt(x, "high", 600) * np.sin(np.pi * t) ** 0.6 * 0.5 + filt(noise(n), "high", 4000) * np.sin(np.pi * t) * 0.18

def stutter(dur, n_b=12):
    n = int(dur * SR); out = np.zeros(n); seg = n // n_b
    for i in range(n_b):
        m = min(int(seg * 0.6), n - i * seg)
        out[i * seg:i * seg + m] += filt(noise(m), "band", [900 + i * 350, 2500 + i * 500]) * np.exp(-np.arange(m) / SR / 0.012) * 1.2
    return out * 0.7

def glitch(dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.where((t * rng.integers(30, 60)).astype(int) % 2, 1700, 520)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + filt(noise(n), "high", 3000) * 0.3
    gate = ((t * 55).astype(int) % 3 != 0)
    return x * gate * np.exp(-t * 6) * 0.6

def pop(freq=520):
    n = int(0.14 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(freq * (1 + 1.6 * np.exp(-t * 40))) / SR) * np.exp(-t * 28) * 0.7

def tick(freq=1500):
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) * 0.6 + filt(noise(n), "high", 5000) * 0.4) * np.exp(-t * 90) * 0.7

def click():
    n = int(0.03 * SR); return filt(noise(n), "band", [2000, 6000]) * env(n, 0.0005, 0.008) * 0.55

def rumble(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return filt(noise(n), "low", 160) * (0.6 + 0.4 * np.sin(2 * np.pi * 22 * t)) * np.minimum(t / 0.03, 1) * np.exp(-t / (dur * 0.8)) * 1.6

def chime():
    n = int(0.9 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * a_ for f, a_ in ((880, 1), (1320, 0.6), (1760, 0.4), (2640, 0.2))) * np.exp(-t * 5) * 0.28

def sparkle(dur=0.9):
    n = int(dur * SR); out = np.zeros(n)
    for _ in range(26):
        t0 = int(rng.random() * (n - 3000)); f = rng.uniform(2500, 7500); m = 2600
        tt = np.arange(m) / SR; out[t0:t0 + m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 55) * 0.2
    return out

def zap(dur=0.5):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    return (np.sin(2 * np.pi * np.cumsum(7000 - 6300 * t ** 0.5) / SR) * 0.3 + filt(noise(n), "high", 5000) * 0.3) * np.minimum(t * 40, 1) * (1 - t) ** 1.2

# ---------- music bed ----------
def hat(open_=False):
    n = int((0.25 if open_ else 0.05) * SR)
    return filt(noise(n), "high", 7000) * env(n, 0.001, 0.12 if open_ else 0.02) * 0.2

def bass(freq, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.4 + np.sin(2 * np.pi * freq * t)
    return filt(x, "low", 380) * env(n, 0.004, dur * 0.6) * 0.5

def pluck(freq):
    n = int(0.28 * SR); t = np.arange(n) / SR
    return filt(sum(np.sin(2 * np.pi * freq * k * t) / k for k in (1, 2, 3, 4)), "low", 4000) * env(n, 0.002, 0.11) * 0.2

beat = 60 / 120
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
bass_line = [33, 33, 36, 31]
arp = [57, 60, 64, 67, 64, 60, 62, 65]
T = lambda shot, lf=0: (starts[ids.index(shot)] + lf) / FPS     # time of local frame lf in shot
logo_t = T("logo", 0)

t0 = 1.5; b = 0
while t0 < TOTAL - 0.2:
    music(hat(), t0 + beat / 2, 0.7, 0.25)
    if b % 4 == 3: music(hat(True), t0 + beat / 2, 0.5, -0.25)
    if t0 > 3.0: music(bass(hz(bass_line[b % 4])), t0, 0.9)
    if t0 >= logo_t - 0.05:
        for k in range(2): music(pluck(hz(arp[(b * 2 + k) % 8] + (12 if (b // 8) % 2 else 0))), t0 + k * beat / 2, 0.9, 0.3 if k else -0.3)
    t0 += beat; b += 1

# ---------- hook: riser, boom on the dot, radial burst ----------
sfx(riser(0.5), 0.0, 0.8)
sfx(impact(1.0), T("burst", 14), 1.0, duck=1)
sfx(sparkle(1.2), T("burst", 16), 0.7)
sfx(swell(0.4), T("burst", 36) - 0.4, 0.8)
sfx(impact(0.9), T("uceni", 0), 1.0, duck=1)

# ---------- transitions: sound peaks when the incoming shot finishes arriving ----------
for i, s in enumerate(shots):
    if i == 0: continue
    st = starts[i] / FPS; tl = s["tl"] / FPS; k = s["t"]
    if k == "whip":
        sfx(whoosh(tl + 0.16, up=False), st - 0.06, 0.85, 0.5)
        sfx(thump(), st + tl * 0.8, 0.5, duck=0.6)
    elif k == "zoom":
        sfx(swell(tl + 0.1), st - 0.1, 0.9)
        sfx(impact(0.8), st + tl, 0.9, duck=1)
    elif k == "slice":
        sfx(stutter(tl + 0.03, 12), st, 0.8, -0.2)
        sfx(crack(), st + tl, 0.7, duck=0.7)
    elif k == "glitch":
        for j in range(4): sfx(glitch(), st + j * 0.045, 0.9, rng.uniform(-0.5, 0.5))
        sfx(crack(), st + tl, 0.8, duck=0.8)
    elif k == "flash":
        sfx(crack(), st, 1.0, duck=1); sfx(impact(0.9), st, 0.9)
    elif k == "laser":
        sfx(zap(tl + 0.3), st - 0.02, 1.0)
        sfx(impact(0.9), st + tl, 0.9, duck=1)
    elif k == "shape":
        sfx(whoosh(tl + 0.1, up=True, width=0.6), st - 0.04, 0.9)
        sfx(thump(70), st + tl, 0.9, duck=0.8)

# ---------- in-shot events (local frames, same as scenes.tsx) ----------
def hit(shot, lf, big=0.8, duck=0.9, pan=0.0): sfx(impact(big), T(shot, lf), 0.9, pan, duck=duck)

hit("nuda", 0, 1.0); sfx(rumble(0.35), T("nuda", 0), 0.8)
hit("uceni", 8, 0.55); sfx(pop(380), T("uceni", 8), 0.7)
hit("ne", 0, 1.0)
sfx(pop(700), T("ne", 10), 0.8, 0.5); sfx(pop(560), T("ne", 16), 0.8, -0.5)
hit("znate", 8, 0.8)

# sesit: card pops, red X drawn by two laser zips, shake, dull thud
sfx(pop(300), T("sesit", 0), 0.9)
for i in range(4): sfx(tick(1100 + i * 120), T("sesit", 6 + i * 4), 0.6)
sfx(zip_(0.27, up=False), T("sesit", 34), 0.9, -0.4)
sfx(zip_(0.23, up=False), T("sesit", 44), 0.9, 0.4)
hit("sesit", 48, 1.0); sfx(rumble(0.3), T("sesit", 48), 0.7)

# wall: one rising tick per added line, final heavy hit on "NUDA."
for i in range(10):
    sfx(tick(700 + i * 160), T("wall", i * 4), 0.8, (i % 2 - 0.5) * 0.4)
    sfx(thump(110 + i * 8), T("wall", i * 4), 0.35)
hit("wall", 36, 1.0)

# zeptate: three question marks
for lf, fr in ((6, 300), (16, 430), (24, 560)): sfx(pop(fr), T("zeptate", lf), 0.9, (lf - 16) / 30); sfx(thump(), T("zeptate", lf), 0.4)
hit("zeptate", 0, 0.7)

hit("tohle", 8, 0.6)

# graph: cards, wires, travelling pulses
for lf in (6, 18, 30): sfx(pop(420 + lf * 8), T("graph", lf), 0.9)
for lf in (22, 34): sfx(zip_(0.15, up=True, f0=4500, f1=900), T("graph", lf), 0.7)
for lf in (28, 40): sfx(pop(900), T("graph", lf), 0.6)
for lf in (34, 58): sfx(tick(2200), T("graph", lf), 0.5)
sfx(sparkle(0.6), T("graph", 30), 0.5)

# logo: laser sweep, big hit on reveal, sparkle, url pop
sfx(zap(0.55), T("logo", 0), 1.0)
sfx(riser(0.4), T("logo", 0) - 0.0, 0.0)
hit("logo", 12, 1.0, 1.0); sfx(sparkle(1.0), T("logo", 13), 0.9)
sfx(pop(800), T("logo", 40), 0.9); sfx(chime(), T("logo", 40), 0.7)

# prompt: pops, typing, enter chime
sfx(pop(450), T("prompt", 6), 0.9)
for i in range(34): sfx(click(), T("prompt", 18 + i * 1.6), 0.8, (i % 3 - 1) * 0.2)
sfx(pop(1000), T("prompt", 18 + 34 * 1.6 + 2), 0.9); sfx(chime(), T("prompt", 18 + 34 * 1.6 + 2), 0.8)

# levels: five steps rise (rising pitch)
for i in range(5): sfx(thump(80 + i * 14), T("levels", 4 + i * 5), 0.9, (i - 2) * 0.2, duck=0.5); sfx(pop(400 + i * 120), T("levels", 4 + i * 5), 0.6)

hit("kurzy", 0, 0.8); hit("kurzy", 14, 0.9)
sfx(zip_(0.2, up=True), T("kurzy", 0), 0.6); sfx(zip_(0.2, up=True), T("kurzy", 14), 0.6)

# hry: four slammed words, alternating pan
for i in range(4): hit("hry", i * 15, 0.7 + i * 0.06, 0.8, -0.3 if i % 2 == 0 else 0.3); sfx(zip_(0.15, up=(i % 2 == 0)), T("hry", i * 15), 0.5)

# unik: second ticks + low pulse, alarm blip at the end
for i in range(5): sfx(tick(1800 if i % 2 else 1400), T("unik", 6 + i * 15), 0.8); sfx(thump(60), T("unik", 6 + i * 15), 0.4)
sfx(pop(300), T("unik", 6), 0.9)

# zebricky: bars grow, then TY overtakes
for i in range(5): sfx(pop(300 + i * 70), T("zebricky", 4 + i * 3), 0.7, (i - 2) * 0.2)
sfx(zip_(0.35, up=True, f0=3000, f1=400), T("zebricky", 14), 0.9); hit("zebricky", 38, 0.8)

# vysvetl: words slam, selection box click, cursor tick
hit("vysvetl", 0, 0.7); sfx(tick(900), T("vysvetl", 10), 0.6); sfx(zip_(0.3, up=False, f0=3000, f1=600), T("vysvetl", 10), 0.5)
sfx(click(), T("vysvetl", 22), 1.0); sfx(pop(900), T("vysvetl", 22), 0.8); sfx(pop(620), T("vysvetl", 34), 0.6)

# zdarma: starburst explosion + shake
hit("zdarma", 2, 1.0, 1.0); sfx(sparkle(0.8), T("zdarma", 2), 0.8); sfx(rumble(0.4), T("zdarma", 2), 0.8); hit("zdarma", 4, 0.7)
sfx(pop(700), T("zdarma", 30), 0.8)

hit("reklam", 0, 1.0)

# chips: each capsule flies in
for i in range(4): sfx(whoosh(0.2, up=(i % 2 == 0)), T("chips", 4 + i * 14) - 0.1, 0.8, -0.6 if i % 2 else 0.6); hit("chips", 10 + i * 14, 0.6, 0.6)

hit("motto", 0, 0.6); sfx(zip_(0.3, up=False, f0=4500, f1=900), T("motto", 0), 0.5)
hit("motto", 14, 1.0)

# cta: finale
hit("cta", 0, 0.9); hit("cta", 8, 1.0, 1.0); sfx(sparkle(1.2), T("cta", 8), 0.9)
sfx(pop(800), T("cta", 24), 0.9); sfx(chime(), T("cta", 24), 0.8); sfx(chime(), T("cta", 40), 0.5)
sfx(impact(1.0), TOTAL - 2.2, 0.8)

# ---------- mix: music ducks under every hit ----------
duck = np.ones(N)
for t, strength in hits:
    i = int(t * SR); m = int(0.28 * SR)
    if i >= N: continue
    c = 1 - 0.55 * strength * np.exp(-np.arange(min(m, N - i)) / SR / 0.09)
    duck[i:i + len(c)] = np.minimum(duck[i:i + len(c)], c)
L = SL * 1.0 + ML * duck * 0.8
R = SR_ * 1.0 + MR * duck * 0.8
end = int(TOTAL * SR); fade = int(1.0 * SR)
for ch in (L, R): ch[end - fade:end] *= np.linspace(1, 0, fade); ch[end:] = 0
m = np.stack([L, R], 1)
m = np.tanh(m * 1.1) / np.tanh(1.1)
m = m / np.max(np.abs(m)) * 0.66
out = ROOT / "public/hype/mix.wav"; out.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(out, SR, (m * 32767).astype(np.int16))
print("wrote", out, f"{TOTAL:.1f}s", "events", len(hits), "peak", float(np.max(np.abs(m))), "rms", float(np.sqrt((m ** 2).mean())))
