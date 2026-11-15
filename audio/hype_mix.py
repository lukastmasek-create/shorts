"""Synth score + SFX for HypeShort (no voice). Reads src/videos/hype/shots.json -> public/hype/mix.wav (44.1 kHz stereo).
120 bpm, A minor. Kick on beats, offbeat hats, clap 2&4, bass, pluck arp from the logo reveal, whooshes on transitions,
impacts on every shot, typing clicks in the prompt shot, riser into the logo. Needs numpy + scipy."""
import json, pathlib
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "src/videos/hype/shots.json").read_text())
FPS = D["fps"]; shots = D["shots"]
starts, a = [], 0
for s in shots: starts.append(a); a += s["dur"]
TOTAL = a / FPS
N = int((TOTAL + 0.6) * SR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def put(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - max(pan, 0)); R[i:i + len(sig)] += sig * gain * (1 + min(pan, 0))

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)

def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)

def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.0 + filt(rng.standard_normal(len(t)), "low", 3000) * np.exp(-t * 90) * 0.15

def hat(open_=False):
    n = int((0.25 if open_ else 0.05) * SR)
    return filt(rng.standard_normal(n), "high", 7000) * env(n, 0.001, 0.12 if open_ else 0.02) * 0.25

def clap():
    n = int(0.25 * SR); x = filt(rng.standard_normal(n), "band", [900, 4500])
    e = sum(env(n, 0.001, 0.05) * (np.arange(n) / SR >= d) for d in (0, 0.012, 0.024))
    return x * e * 0.5 + x * env(n, 0.001, 0.12) * 0.15

def bass(freq, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.4 + np.sin(2 * np.pi * freq * t)
    return filt(x, "low", 380) * env(n, 0.004, dur * 0.6) * 0.55

def pluck(freq):
    n = int(0.28 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * freq * k * t) / k for k in (1, 2, 3, 4))
    return filt(x, "low", 4000) * env(n, 0.002, 0.11) * 0.22

def whoosh(dur=0.5, up=True):
    n = int(dur * SR); x = rng.standard_normal(n); out = np.zeros(n); k = 12
    for j in range(k):
        s, e = j * n // k, (j + 1) * n // k
        fc = (400 + (j / k) ** 2 * 7000) if up else (7400 - (j / k) ** 2 * 7000)
        out[s:e] = filt(x[s:e], "band", [fc * 0.7, fc * 1.3], 1) if e - s > 40 else 0
    t = np.arange(n) / SR
    return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 * 0.7

def impact():
    n = int(0.6 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 6) + 30) / SR) * np.exp(-t * 6)
            + filt(rng.standard_normal(n), "low", 1800) * np.exp(-t * 25) * 0.4) * 0.9

def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = filt(rng.standard_normal(n), "high", 600) * (t / dur) ** 2
    s = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / dur) ** 2) / SR) * (t / dur) ** 2 * 0.25
    return (x * 0.5 + s) * 0.8

def click():
    n = int(0.03 * SR); return filt(rng.standard_normal(n), "band", [2000, 6000]) * env(n, 0.0005, 0.008) * 0.5

def glitch():
    n = int(0.18 * SR); t = np.arange(n) / SR
    f = np.where((t * 40).astype(int) % 2, 1800, 650)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.001, 0.09) * 0.25

beat = 60 / 120
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
bass_line = [33, 33, 36, 31]            # A1 A1 C2 G1 per beat... per bar
arp = [57, 60, 64, 67, 64, 60, 62, 65]  # A3 C4 E4 G4 ...
logo_t = starts[[s["id"] for s in shots].index("logo")] / FPS
prompt_t = starts[[s["id"] for s in shots].index("prompt")] / FPS

# hook: sub boom on the red dot, riser into the burst
put(riser(0.5), 0.0, 0.8); put(impact(), 0.47, 1.0)
t0 = 1.5; bi = 0
while t0 < TOTAL - 0.2:
    b = int(round((t0 - 1.5) / beat))
    put(kick(), t0, 0.9)
    if b % 2 == 1: put(clap(), t0, 0.6)
    put(hat(), t0 + beat / 2, 0.7, 0.25)
    if b % 4 == 3: put(hat(True), t0 + beat / 2, 0.5, -0.25)
    if t0 > 4.0: put(bass(hz(bass_line[b % 4]), 0.4), t0 + beat / 2 * (b % 2), 0.9)
    if t0 >= logo_t - 0.05:
        for k in range(2): put(pluck(hz(arp[(b * 2 + k) % 8] + (12 if (b // 8) % 2 else 0))), t0 + k * beat / 2, 0.9, 0.3 if k else -0.3)
    t0 += beat

# per-shot SFX
for s, st in zip(shots, starts):
    t = st / FPS
    if t > 0.4: put(impact(), t, 0.55)
    k = s["t"]
    if k in ("whip", "zoom", "slice", "laser", "shape"):
        put(whoosh(0.45, up=k != "whip"), max(0, t - 0.05), 0.75, 0.4 if k == "whip" else 0)
    if k == "glitch": put(glitch(), t, 1.0)
    if k == "flash": put(whoosh(0.2, True), max(0, t - 0.05), 0.6)
put(riser(1.4), logo_t - 1.4, 0.9)
for i in range(34): put(click(), prompt_t + (18 + i * 1.6) / FPS, 0.8, (i % 3 - 1) * 0.2)
put(impact(), TOTAL - 3.0, 0.8)

end = int(TOTAL * SR); fade = int(1.2 * SR)
for ch in (L, R): ch[end - fade:end] *= np.linspace(1, 0, fade); ch[end:] = 0
m = np.stack([L, R], 1)
m = np.tanh(m * 1.3) / np.tanh(1.3)
m = m / np.max(np.abs(m)) * 0.89
out = ROOT / "public/hype/mix.wav"; out.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(out, SR, (m * 32767).astype(np.int16))
print("wrote", out, f"{TOTAL:.1f}s")
