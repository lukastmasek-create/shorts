"""Voice for the Učíme se hrou HypeShort: Kokoro TTS + word timings + trailer chain.

usage:
  . .venv-tools/bin/activate
  python3 scripts/hype_voice.py candidates              # audition male voices (writes hype/voice/cand_*.wav)
  VOICE=am_puck python3 scripts/hype_voice.py script    # writes hype/voice/*.wav + words.json

Models (not committed, prepared per session; see CLAUDE.md):
  hype/voice-work/kokoro-v1.0.onnx    concat of npm kokoro-fp32{a,b,c}-shards package/kokoro-fp32.part*.bin
  hype/voice-work/voices-v1.0.bin     npz from npm kokoro-js voices/*.bin  (float32 (510,1,256) per voice)

faster-whisper needs Hugging Face (blocked here), so word times come from energy-based word
placement inside each beat's voiced span (local energy minima + syllable-length weights),
which is deterministic and frame-exact — the beats are short utterances of 1-5 words.
The take is then time-fitted to VOICE_TARGET_SEC by pitch-preserving time-stretch plus
proportional pauses, so the film lands in the 45-60 s window whatever the TTS tempo is.
"""
import json, os, re, sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src", "videos", "hype"))
WORK = os.path.join(ROOT, "hype", "voice-work")
OUT = os.path.join(ROOT, "hype", "voice")
PUB = os.path.join(ROOT, "public", "hype", "voice")
SR = 48000


# --------------------------------------------------------------------------- script parsing
def parse_beats(ts_path=None):
    """Read the Beat[] literal out of src/videos/hype/script.ts (single source of truth).

    Each beat is a flat `{ key: value, ... }` object with string and number values only, so a
    regex pass is enough and no JS parser is needed.
    """
    ts_path = ts_path or os.path.join(ROOT, "src", "videos", "hype", "script.ts")
    src = open(ts_path, encoding="utf-8").read()
    body = src.split("export const SCRIPT: Beat[] = [", 1)[1].split("\n];", 1)[0]
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    beats = []
    for blk in re.findall(r"\{([^{}]*)\}", body):
        obj = {}
        for k, v in re.findall(r"(\w+)\s*:\s*\"((?:[^\"\\\\]|\\\\.)*)\"", blk):
            obj[k] = v.replace('\\n', '\n')
        for k, v in re.findall(r"(\w+)\s*:\s*(-?[\d.]+)\b", blk):
            obj[k] = float(v)
        beats.append(obj)
    return beats


def ts_const(name, default):
    src = open(os.path.join(ROOT, "src", "videos", "hype", "script.ts"), encoding="utf-8").read()
    m = re.search(rf"export const {name} = ([\d.]+)", src)
    return float(m.group(1)) if m else default


# --------------------------------------------------------------------------- TTS
def synth(beats, voice, speed):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(WORK, "kokoro-v1.0.onnx"), os.path.join(WORK, "voices-v1.0.bin"))
    chunks = []
    for b in beats:
        text = (b.get("say") or "").strip()
        if not text:
            chunks.append((None, 0.0))
            continue
        s, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        s = np.asarray(s, dtype=np.float32)
        if sr != SR:  # Kokoro speaks at 24 kHz; work at 48 kHz throughout
            import librosa
            s = librosa.resample(s, orig_sr=sr, target_sr=SR).astype(np.float32)
        chunks.append((s, len(s) / SR))
    return chunks


def stretch_to(x, seconds):
    import librosa
    if seconds <= 0.01 or len(x) < 2048:
        return x
    rate = (len(x) / SR) / seconds
    if abs(rate - 1.0) < 0.02:
        return x
    y = librosa.effects.time_stretch(x.astype(np.float32), rate=float(rate))
    n = int(seconds * SR)
    if len(y) < n: y = np.pad(y, (0, n - len(y)))
    return y[:n].astype(np.float32)


# --------------------------------------------------------------------------- word times
def voiced_span(a, t0):
    import librosa
    if len(a) < 1024: return 0.0, len(a) / SR
    rms = librosa.feature.rms(y=a, frame_length=1024, hop_length=256)[0]
    thr = max(rms.max() * 0.05, 1e-4)
    idx = np.where(rms > thr)[0]
    if len(idx) == 0: return 0.0, len(a) / SR
    return float(idx[0] * 256 / SR), float(min(len(a), idx[-1] * 256 + 1024) / SR)


def word_times(a, words):
    """Place words inside one beat's audio using local energy minima (cuts) + syllable weights."""
    import librosa
    if not words: return []
    v0, v1 = voiced_span(a, 0)
    if len(words) == 1:
        return [(words[0], v0, v1)]
    w = np.array([max(2, len(re.sub(r"[^A-Za-z']", "", x))) ** 0.72 for x in words])
    env = librosa.feature.rms(y=a, frame_length=1024, hop_length=128)[0]
    env = env / (env.max() + 1e-9)
    rel = np.arange(len(env)) * 128 / SR
    keep = (rel >= v0) & (rel <= v1)
    rel, env = rel[keep], env[keep]
    edges = np.concatenate([[0], np.cumsum(w / w.sum())])
    cuts = []
    for k in range(1, len(words)):
        target = v0 + (v1 - v0) * edges[k]
        span = 0.12
        cand = np.where((rel >= target - span) & (rel <= target + span))[0]
        if len(cand) < 3:
            cuts.append(target); continue
        best = cand[np.argmin(env[cand] - 0.30 * np.abs(rel[cand] - target))]
        cuts.append(float(rel[best]))
    bounds = [v0] + cuts + [v1]
    return [(wd, bounds[i], bounds[i + 1]) for i, wd in enumerate(words)]


# --------------------------------------------------------------------------- trailer chain
def chase(x, hits):
    """compressor -> saturation -> presence -> slap reverb on slam words -> soft limiter."""
    from scipy import signal
    x = x.astype(np.float32)
    # de-ess: subtract the >5.5 kHz band where it is hot
    band = signal.sosfilt(signal.butter(2, [5500, 9500], btype="bandpass", fs=SR, output="sos"), x)
    env = np.abs(signal.hilbert(band))
    sm = signal.lfilter(np.ones(400) / 400, 1, env)
    g = np.clip(1.0 - 0.5 * sm / (np.percentile(sm, 99) + 1e-9), 0.4, 1.0)
    x = x - band * (1 - g)
    # compressor 4:1 above the 70th-percentile level, fast attack / smooth release
    env = np.abs(signal.hilbert(x))
    sm = signal.lfilter(np.ones(160) / 160, 1, env)
    thr = np.percentile(sm, 70) + 1e-9
    gain = np.where(sm > thr, (thr / (sm + 1e-9)) ** 0.72, 1.0)
    gain = signal.lfilter(np.ones(240) / 240, 1, gain)
    x = x * gain
    # saturation + presence lift
    x = np.tanh(x * 2.1) / np.tanh(2.1)
    x = x + 0.20 * signal.sosfilt(signal.butter(2, 3100, btype="highpass", fs=SR, output="sos"), x)
    # slap reverb on the slam words only
    slap, tail = int(0.029 * SR), int(0.17 * SR)
    wet = np.zeros_like(x)
    wet[slap:] += x[:-slap] * 0.20
    wet[tail:] += x[:-tail] * 0.08
    y = x.copy()
    for h in hits:
        s = int(h * SR)
        e = min(len(y), s + int(0.55 * SR))
        if s < len(y): y[s:e] += wet[s:e]
    # low cut, soft limit
    y = signal.sosfilt(signal.butter(2, 70, btype="highpass", fs=SR, output="sos"), y)
    peak = np.percentile(np.abs(y), 99.98) + 1e-9
    return (np.tanh(y / peak * 1.1) * 0.93).astype(np.float32)


# --------------------------------------------------------------------------- main
def run_script():
    import librosa
    beats = parse_beats()
    voice = os.environ.get("VOICE", "am_puck")
    speed = float(os.environ.get("SPEED", "1.12"))
    target = float(os.environ.get("TARGET", ts_const("VOICE_TARGET_SEC", 46)))
    os.makedirs(OUT, exist_ok=True); os.makedirs(PUB, exist_ok=True)

    raw = synth(beats, voice, speed)
    speech = sum(d for _, d in raw)
    gaps = [float(b.get("gap") or 0.10) if (b.get("say") or "").strip() else 0.0 for b in beats]
    if beats[-1].get("say", "").strip() == "":
        gaps[-1] = 0.0
    gsum = sum(gaps)
    # pick the slow-down factor (pitch-preserving) that leaves gaps ~2x their authored weight
    best = None
    for st in (1.0, 1.06, 1.12, 1.18, 1.24, 1.30):
        need = (target - speech * st) / gsum if gsum else 0
        score = abs(need - 2.0)
        if best is None or score < best[0]:
            best = (score, st, need)
    _, st, gscale = best
    if gscale < 1.0:
        # too long even at 1.0: never compress pauses below authored length, shrink speech instead
        st = max(0.9, (target - gsum) / speech); gscale = 1.0
    print(f"voice={voice} speed={speed} speech={speech:.1f}s stretch={st:.2f} gap x{gscale:.2f} target={target}s")

    parts, marks, words = [], [], []
    t = 0.0
    for i, ((s, d), b) in enumerate(zip(raw, beats)):
        written = [w for w in (b.get("say") or "").split() if re.search(r"[A-Za-z]", w)]
        if s is None:
            gap = 0.0 if i == len(beats) - 1 else 0.10
            parts.append(np.zeros(int(SR * gap), np.float32)); t += gap
            marks.append({"beat": i, "say": "", "t0": t, "t1": t, "dur": 0.0, "gap": gap})
            continue
        s2 = stretch_to(s, d * st)
        gap = gaps[i] * gscale
        parts.append(s2); parts.append(np.zeros(int(SR * gap), np.float32))
        marks.append({"beat": i, "say": b.get("say"), "t0": round(t, 4), "t1": round(t + len(s2) / SR, 4),
                      "dur": round(len(s2) / SR, 4), "gap": round(gap, 4)})
        for (wd, a0, a1) in word_times(s2, written):
            words.append({"beat": i, "word": wd, "start": round(t + a0, 4), "end": round(t + a1, 4)})
        t += len(s2) / SR + gap

    audio = np.concatenate(parts) if parts else np.zeros(1, np.float32)
    sf.write(os.path.join(OUT, "voice_raw.wav"), audio, SR)

    hits = [w["start"] for w in words for b in [beats[w["beat"]]] if float(b.get("hit_n") or 0) >= 0.8]
    hits = sorted(set(round(h, 4) for h in hits))
    wet = chase(audio, hits)

    # level-match beats (keeps the near-whisper beats quiet: only pulls up, never squashes a drop)
    lv = []
    for m in marks:
        if m["dur"] > 0.05:
            seg = wet[int(m["t0"] * SR): int(m["t1"] * SR)]
            lv.append(float(np.sqrt(np.mean(seg ** 2)) + 1e-9))
    med = float(np.median(lv)) if lv else 1.0
    for m in marks:
        if m["dur"] <= 0.05: continue
        a, b_ = int(m["t0"] * SR), int(m["t1"] * SR)
        e = float(np.sqrt(np.mean(wet[a:b_] ** 2)) + 1e-9)
        wet[a:b_] *= float(np.clip(med / e, 0.85, 1.6))

    sf.write(os.path.join(OUT, "voice.wav"), wet, SR)
    sf.write(os.path.join(PUB, "voice.wav"), wet, SR, subtype="PCM_16")
    json.dump(words, open(os.path.join(OUT, "words.json"), "w"), indent=1)
    json.dump(marks, open(os.path.join(OUT, "marks.json"), "w"), indent=1)
    json.dump({"voice": voice, "speed": speed, "stretch": st, "gap_scale": round(gscale, 3),
               "total": round(len(wet) / SR, 3)}, open(os.path.join(OUT, "take.json"), "w"), indent=1)
    db = 20 * np.log10(np.abs(wet).max() + 1e-9)
    print(f"wrote {len(wet)/SR:.2f} s, peak {db:.1f} dBFS, {len(words)} words, {len(marks)} beats")
    for m in marks[:5]:
        print(f'  {m["beat"]:2d} {m["t0"]:6.2f}-{m["t1"]:6.2f} gap {m["gap"]:.2f} "{m["say"]}"')


def run_candidates():
    from kokoro_onnx import Kokoro
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(os.path.join(WORK, "kokoro-v1.0.onnx"), os.path.join(WORK, "voices-v1.0.bin"))
    line = ("No way. Homework? Dead. Boring? Gone. Meet Oo-chee-meh seh Hrohw. "
            "Learning that feels like a game. Quizzes. Pets. Code. A whole town. All yours. Play now.")
    for v in ["am_onyx", "am_puck", "am_michael", "am_fenrir", "am_liam", "am_eric", "am_adam"]:
        s, sr = k.create(line, voice=v, speed=1.12, lang="en-us")
        p = os.path.join(OUT, f"cand_{v}.wav")
        sf.write(p, s, sr)
        print(f"{os.path.basename(p):22s} {len(s)/sr:5.2f}s peak {np.abs(s).max():.2f}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "script"
    run_candidates() if cmd == "candidates" else run_script()
