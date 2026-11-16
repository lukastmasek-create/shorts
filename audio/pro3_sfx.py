"""SFX-only track for ProCinematic (2d/src/ProCinematic.tsx). Frame numbers = CUE in that file (30 fps). No music, no voice.
usage: python3 audio/pro_sfx.py public/pro/part1.wav"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from dsp import ns, place, pan, write_wav, integrated, true_peak
from sfx_real import KINDS

FRAMES, FPS = 450, 30
# (frame, kind, gain, pan, kwargs)  strongest cue = the two tab presses
EV = [(2, "whoosh", 0.55, 0.0, dict(dur=1.2, vel=0.6, seed=3)), (30, "impact", 0.50, 0.0, {}), (36, "tok", 0.35, -0.2, dict(seed=5)), (44, "tok", 0.35, 0.2, dict(seed=6)),
      (64, "whoosh", 0.70, 0.3, dict(dur=0.9, vel=0.7, seed=11)),
      (80, "tok", 0.36, -0.3, dict(seed=21)), (85, "tok", 0.34, -0.1, dict(seed=22)), (90, "tok", 0.34, 0.1, dict(seed=23)), (95, "tok", 0.32, 0.3, dict(seed=24)),
      (134, "whoosh", 0.70, -0.3, dict(dur=0.9, vel=0.7, seed=12)),
      (154, "click", 0.90, 0.0, {}), (158, "swish", 0.35, -0.2, {}), (150, "tok", 0.38, 0.0, dict(seed=31)), (156, "tok", 0.36, 0.0, dict(seed=32)), (162, "tok", 0.34, 0.0, dict(seed=33)),
      (204, "whoosh", 0.70, 0.3, dict(dur=0.9, vel=0.7, seed=13)),
      (218, "click", 0.90, 0.0, {}), (222, "swish", 0.35, 0.2, {}), (230, "cloth", 0.30, 0.0, dict(dur=0.8, vel=0.3, seed=41)),
      (266, "whoosh", 0.70, -0.3, dict(dur=0.9, vel=0.7, seed=14)),
      (280, "click", 0.90, 0.0, {}), (284, "swish", 0.35, 0.2, {}),
      (278, "tok", 0.40, -0.2, dict(seed=51)), (283, "tok", 0.40, 0.0, dict(seed=52)), (288, "tok", 0.40, 0.2, dict(seed=53)), (300, "impact", 0.45, 0.0, {}),
      (336, "whoosh", 0.75, 0.2, dict(dur=1.1, vel=0.7, seed=15)),
      (366, "cloth", 0.40, 0.0, dict(dur=0.8, vel=0.4, seed=61)), (392, "impact", 0.50, 0.0, {}), (400, "tok", 0.40, 0.0, dict(seed=62))]

def main(out):
    N = ns(FRAMES / FPS); buf = np.zeros((2, N))
    for i, (fr, kind, g, p, kw) in enumerate(EV):
        place(buf, pan(KINDS[kind](**({"seed": 100 + i} if not kw and kind != "swish" and False else kw)), p), fr / FPS, g)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.7
    k = ns(0.2); buf[:, -k:] *= np.linspace(1, 0, k)[None, :]
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True); write_wav(out, buf, bits=16)
    print(f"{len(EV)} events {FRAMES/FPS:.2f}s {integrated(buf):.1f} LUFS {true_peak(buf):.1f} dBTP -> {out}")

if __name__ == "__main__":
    main(sys.argv[1])
