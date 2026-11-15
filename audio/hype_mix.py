"""HypeShort mix: original 126 bpm C-major beat + SFX table keyed to story frames, ducked under voice.
usage: python audio/hype_mix.py   (numpy, scipy, soundfile) -> public/hype/mix.wav (48 kHz stereo, exact picture length)
Reads src/videos/hype/cues.json + shots.json, so it follows any shot-list change."""
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
SR = 48000; FPS = 30
cues = json.load(open("src/videos/hype/cues.json")); shots = json.load(open("src/videos/hype/shots.json"))
TOTAL = cues["total"]; N = int(TOTAL / FPS * SR); rng = np.random.default_rng(7)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def env(n, a=0.002, d=0.2): t = np.arange(n) / SR; return np.minimum(t / a, 1) * np.exp(-t / d)
def put(buf, x, at, g=1.0):
    s = int(at / FPS * SR) if isinstance(at, (int, np.integer)) else int(at * SR)
    if s >= len(buf): return
    e = min(len(buf), s + len(x)); buf[s:e] += x[: e - s] * g
def kick(): n = int(0.28 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (46 * t + 90 * (1 - np.exp(-t * 28)) / 28 * 28 / 28)) * env(n, 0.001, 0.09) * 1.0
def clap(): n = int(0.18 * SR); return hp(rng.standard_normal(n), 1200) * env(n, 0.001, 0.05) * 0.5
def hat(): n = int(0.05 * SR); return hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.012) * 0.25
def tone(f, d, w="tri", g=0.3):
    n = int(d * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * t
    x = {"tri": 2 / np.pi * np.arcsin(np.sin(ph)), "sq": np.sign(np.sin(ph)) * 0.6, "sin": np.sin(ph)}[w]; return x * env(n, 0.004, d * 0.5) * g
def whoosh(d=0.35, up=True):
    n = int(d * SR); x = rng.standard_normal(n); t = np.linspace(0, 1, n)
    f = (400 + 6000 * t ** 2) if up else (6400 - 5800 * t)
    out = np.zeros(n); ph = 0
    # time-varying band via block-wise filtering
    blk = 512
    for i in range(0, n, blk):
        c = f[min(i, n - 1)]; out[i:i + blk] = sosfilt(butter(2, [max(80, c * 0.6), min(SR / 2 - 100, c * 1.4)], "band", fs=SR, output="sos"), x[i:i + blk])
    return out * np.sin(np.pi * t) ** 1.5 * 0.9
def impact(): n = int(0.5 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 55 * t * np.exp(-t * 3)) * np.exp(-t / 0.18) + lp(rng.standard_normal(n), 900) * np.exp(-t / 0.05) * 0.5) * 0.9
def ding(f): n = int(0.7 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t / 0.22) * 0.35
def blip(): n = int(0.06 * SR); t = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * (900 + rng.integers(0, 1400)) * t)) * 0.25 * env(n, 0.001, 0.03)
def click(): n = int(0.012 * SR); return hp(rng.standard_normal(n), 2500) * env(n, 0.0002, 0.003) * 0.5
def riser(d): n = int(d * SR); t = np.linspace(0, 1, n); x = hp(rng.standard_normal(n), 500) * t ** 2 * 0.35; return x + np.sin(2 * np.pi * np.cumsum(200 + 1400 * t ** 2) / SR) * t * 0.12
def record_stop(): n = int(0.5 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(500 * np.exp(-t * 6)) / SR) * np.exp(-t / 0.3) * 0.35

# ---- music: kick on beats, clap on 2/4, offbeat hats, bass + arp. Beat grid 126 bpm. ----
M = np.zeros(N); beat = 60 / 126; nb = int(TOTAL / FPS / beat) + 2
prog = [48, 53, 55, 43]  # C F G (low) per bar
k, c, h = kick(), clap(), hat()
for b in range(nb):
    t = b * beat; bar = (b // 4) % 4; root = prog[bar]
    if t < 0.4: continue
    put(M, k, t, 0.9)
    if b % 2 == 1: put(M, c, t, 0.8)
    put(M, h, t + beat / 2, 1.0)
    put(M, tone(440 * 2 ** ((root - 57) / 12), beat * 0.9, "sq", 0.12), t + beat / 2, 1.0)
    for s in range(4):
        sc = [0, 4, 7, 12][(s + b) % 4]; put(M, tone(440 * 2 ** ((root + 24 + sc - 57) / 12), beat * 0.22, "tri", 0.1), t + s * beat / 4, 1.0)
M = lp(M, 9000) * 0.8
# ---- sfx ----
S = np.zeros(N); L = cues["cues"]
for i, (kind, bg, tin, td) in enumerate(shots):
    f0 = L[i]["from"]
    if tin == "whip": put(S, whoosh(td / FPS + 0.1), f0 - td - 2, 0.8)
    elif tin == "zoom": put(S, whoosh(td / FPS + 0.15, False), f0 - td - 2, 0.9)
    elif tin == "glitch": [put(S, blip(), f0 - td + j * 2, 1.0) for j in range(4)]
    elif tin == "stripes": put(S, whoosh(0.3), f0 - td, 0.6)
    elif tin == "laser": put(S, tone(1800, 0.25, "sin", 0.2), f0 - td, 1.0); put(S, whoosh(0.3), f0 - td, 0.5)
    elif tin == "shape": put(S, whoosh(0.4), f0 - td - 3, 0.8)
    elif tin == "flash": put(S, impact(), f0 - 1, 0.6)
    if kind not in ("meet", "end"): put(S, impact(), f0, 0.55)
    if kind == "ask": put(S, riser(0.6), f0 - 18, 0.6)
    if kind == "better": put(S, riser(0.5), f0 - 15, 0.6)
    if kind == "study": [put(S, click(), f0 + j * 3, 1.0) for j in range(10)]
    if kind == "boring": put(S, whoosh(0.3), f0 + 8, 0.7); put(S, impact(), f0 + 18, 0.8)
    if kind == "timers": [put(S, click(), f0 + j * 15, 0.8) for j in range(6)]
    if kind == "kidding": put(S, record_stop(), f0 - 8, 0.9)
    if kind == "pick": [put(S, click(), f0 + 6 + j, 0.7) for j in range(0, 22, 2)]
    if kind == "points": [put(S, ding(1318 + 220 * j), f0 + 6 + 4 * j, 0.8) for j in range(3)]
    if kind == "levelup": [put(S, ding(f), f0 + 4 * j, 0.9) for j, f in enumerate([523, 659, 784, 1047])]
    if kind == "meet":
        put(S, riser(0.7), f0 - 22, 0.7)
        for j, f in enumerate([523, 659, 784, 988]): put(S, ding(f * 2), f0 + 5 * j, 1.0)  # bright ding per tile landing
        put(S, ding(2093), f0 + 26, 0.9)
    if kind == "answer": put(S, ding(784), f0 + 18, 0.7)
    if kind == "end": put(S, ding(1047), f0 + 46, 0.9)
# ---- voice + duck ----
v, vsr = sf.read("public/hype/voice.wav", dtype="float32"); v = resample_poly(v, SR, vsr) if vsr != SR else v
V = np.zeros(N); V[: min(N, len(v))] = v[:N]
e = np.abs(V); win = int(0.05 * SR); e = np.convolve(e, np.ones(win) / win, "same"); e = lp(e, 8)
duck = 1 - 0.55 * np.clip(e / 0.08, 0, 1)
mix = V * 1.0 + M * 0.5 * duck + S * 0.55
mix[: int(0.1 * SR)] *= np.linspace(0, 1, int(0.1 * SR)); mix[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
mix = np.tanh(mix * 0.9) / np.tanh(0.9) * 0.9
mix = mix / max(1e-9, np.abs(mix).max()) * 0.89
st = np.stack([mix, mix], 1); sf.write("public/hype/mix.wav", st, SR)
print("mix", N / SR, "s, peak", float(np.abs(st).max()))
