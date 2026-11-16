"""SFX-only track for ProShowcase1 (2d/src/ProShowcase.tsx). Frame numbers = CUE in that file (30 fps). No music, no voice.
usage: python3 audio/pro_sfx.py public/pro/part1.wav"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from dsp import ns, place, pan, write_wav, integrated, true_peak
from sfx_real import KINDS

FRAMES, FPS = 432, 30
# (frame, kind, gain, pan, kwargs)  strongest cue = the two tab presses
EV = [(0, "impact", 0.35, 0.0, {}), (16, "swish", 0.4, 0.0, {}),            # logo opening, mark flies to header
      (58, "cloth", 0.30, 0.2, dict(dur=1.4, vel=0.3, seed=21)),            # list scroll
      (136, "click", 1.00, 0.0, {}), (138, "swish", 0.35, -0.2, {}),         # press Rodina
      (152, "tok", 0.40, -0.1, dict(seed=31)), (156, "tok", 0.38, 0.0, dict(seed=32)), (160, "tok", 0.36, 0.1, dict(seed=33)),
      (224, "click", 1.00, 0.0, {}), (226, "swish", 0.35, 0.2, {}),          # press Škola
      (234, "tok", 0.34, -0.15, dict(seed=41)), (238, "tok", 0.33, -0.05, dict(seed=42)), (242, "tok", 0.32, 0.05, dict(seed=43)),
      (246, "tok", 0.30, 0.1, dict(seed=44)), (250, "tok", 0.28, 0.15, dict(seed=45)),
      (320, "cloth", 0.40, 0.0, dict(dur=0.8, vel=0.4, seed=51)),
      (340, "impact", 0.38, 0.0, {}), (350, "tok", 0.40, 0.0, dict(seed=61))]

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
