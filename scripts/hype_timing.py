"""Voice timing for the HROU promo.

Takes the TTS lines in hype_vo/L*.wav, trims their silence, splits each line into word times and lays the
lines out on the 30 fps picture grid from the plan below. Writes:

  hype_vo/trim/L*.wav            silence-trimmed line audio (what the mixer places)
  src/videos/hype/timing.ts      LINES / INSERTS / TOTAL for the shot list (typed, so tsc checks it)
  hype_vo/timing.json            the same numbers for audio/hype_mix.py

Word boundaries: the TTS gives no word timestamps here (no whisper model in this sandbox, Hugging Face is
blocked), so each boundary is estimated from the line's character weights and then snapped to the nearest
real energy gap in the waveform (pauses between words). Punctuation gaps are usually 40-120 ms, so this
lands within a couple of frames; `NUDGE` below is the hand-fix table for anything that still reads early.
usage: ./venv/bin/python scripts/hype_timing.py
"""
import json, os, re, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "hype_vo")
TRIM = os.path.join(VO, "trim")
FPS = 30
SR = 44100
MIN_WORD = 5  # frames; a word must be readable, even the last one of a fast line

LINES = {
    "L1": "Studying is boring.",
    "L2": "Sit down. Open the book. Read it again. And again. Nothing sticks.",
    "L3": "Three hours. Highlighters. Flashcards. Zero recall.",
    "L4": "So we turned it into a game.",
    "L5": "Pick a subject. Any subject.",
    "L6": "Grade one to nine. High school. Entrance exams. Finals.",
    "L7": "Every course has five levels. Every answer comes with a reason.",
    "L8": "Get it wrong? Now you know why.",
    "L9": "Daily quiz. Reviews. Escape rooms. Parents see the progress. Teachers set the work.",
    "L10": "Think about doing all that the usual way.",
    "L11": "Are you kidding me?",
    "L12": "It is free. No card, no catch. Learning, by play.",
}

# frame layout: (item, frames of empty lead-in before it). VO items are L*, inserts are design beats
# that carry no voice (logo reveal, the "usual way" wall, the study-timer gag, the tail CTA + end card).
PLAN = [
    ("open", 12),
    ("L1", 0), ("L2", 5), ("L3", 6), ("L4", 7),
    ("LOGO", 40), ("L5", 8), ("L6", 9),
    ("CUBE", 7), ("L7", 8), ("L8", 9), ("L9", 10), ("L10", 7), ("L11", 9),
    ("GAG", 10), ("L12", 8), ("TAIL", 24),
]

# hand fixes in seconds, relative to the trimmed line start: {"L4": {"game": (0.42, 0.86)}}
NUDGE = {}


def load(path):
    with wave.open(path) as w:
        assert w.getsampwidth() == 2
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return x


def envelope(x, hop_ms=5.0, win_ms=20.0):
    hop = int(SR * hop_ms / 1000)
    win = int(SR * win_ms / 1000)
    n = max(1, 1 + (len(x) - win) // hop)
    e = np.array([np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2) + 1e-12) for i in range(n)])
    return e, hop / SR


def trim(x):
    e, dt = envelope(x)
    peak = e.max()
    loud = np.where(e > peak * 0.02)[0]
    a = max(0, int(loud[0] * dt * SR) - int(0.02 * SR))
    b = min(len(x), int(loud[-1] * dt * SR) + int(0.06 * SR))
    return x[a:b], a / SR


def gaps(e, dt):
    peak = e.max()
    quiet = e < peak * 0.045
    out, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) * dt >= 0.035:
                out.append((i + j) / 2 * dt)
            i = j
        else:
            i += 1
    return out


def weights(words):
    # characters, with a nudge for long vowels/clusters; good enough to pick which gap is which boundary
    return np.array([max(2.0, len(re.sub(r"[^A-Za-z0-9]", "", w)) + 0.5 * len(re.findall(r"[aeiouy]", w.lower()))) for w in words])


def word_times(text, x):
    words = [w for w in re.split(r"\s+", text.strip()) if w]
    e, dt = envelope(x)
    dur = len(x) / SR
    gs = gaps(e, dt)
    w = weights(words)
    cum = np.concatenate([[0], np.cumsum(w)])
    targets = cum / cum[-1] * dur
    bounds = [0.0]
    used = set()
    for t in targets[1:-1]:
        if gs:
            arr = np.array(gs)
            cand = np.argsort(np.abs(arr - t))
            pick = None
            for c in cand[:4]:
                if c in used:
                    continue
                if abs(arr[c] - t) <= 0.16:
                    pick = c
                break
            if pick is not None:
                used.add(pick)
                bounds.append(float(arr[pick]))
                continue
        bounds.append(float(t))
    bounds.append(dur)
    return [(words[i], bounds[i], bounds[i + 1]) for i in range(len(words))]


def main():
    os.makedirs(TRIM, exist_ok=True)
    # first pass: trims + durations
    audio, meta = {}, {}
    for lid, text in LINES.items():
        num = int(lid[1:])
        p = os.path.join(VO, f"L{num:02d}.wav")
        if not os.path.exists(p):
            raise SystemExit(f"missing {p}")
        x = load(p)
        t, _ = trim(x)
        audio[lid] = t
        with wave.open(os.path.join(TRIM, f"L{num:02d}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(t, -1, 1) * 32767).astype(np.int16).tobytes())
        meta[lid] = {"dur": len(t) / SR, "words": word_times(text, t)}

    cur = 0
    lines, inserts = [], {}
    for item, lead in PLAN:
        cur += lead
        if item in ("open",):
            inserts["open"] = {"from": 0, "to": cur}
            continue
        if item in LINES:
            dur = int(round(meta[item]["dur"] * FPS))
            nudge = NUDGE.get(item, {})
            ws = []
            for (wd, a, b) in meta[item]["words"]:
                if wd in nudge:
                    a, b = nudge[wd]
                ws.append({"w": wd.upper(), "from": cur + int(round(a * FPS)), "to": cur + int(round(b * FPS))})
            # a punchline must never flash for a single frame: enforce a minimum on-screen time per word
            bounds = [w["from"] for w in ws] + [ws[-1]["to"]]
            for i in range(len(bounds) - 2, 0, -1):
                bounds[i] = min(bounds[i], bounds[i + 1] - MIN_WORD)
            for i in range(1, len(bounds)):
                bounds[i] = max(bounds[i], bounds[i - 1] + MIN_WORD)
            for i, w in enumerate(ws):
                w["from"], w["to"] = bounds[i], bounds[i + 1]
            lines.append({"id": item, "from": cur, "to": bounds[-1], "words": ws})
            cur = bounds[-1]
        else:
            start = cur
            dur = {"LOGO": 40, "CUBE": 34, "GAG": 44, "TAIL": 150}[item]
            inserts[item] = {"from": start, "to": start + dur}
            cur += dur

    total = cur
    ts = [
        "// GENERATED by scripts/hype_timing.py from hype_vo/*.wav - do not edit by hand.",
        "// Absolute 30 fps frames. word.from is where the syllable starts in the voice, which is where",
        "// the kinetic word has to land (the slam's overshoot runs 2-3 frames past it).",
        "export type TWord = { w: string; from: number; to: number };",
        "export type TLine = { id: string; from: number; to: number; words: TWord[] };",
        "export const LINES: TLine[] = [",
    ]
    for ln in lines:
        ws = ", ".join(f'{{ w: "{w["w"]}", from: {w["from"]}, to: {w["to"]} }}' for w in ln["words"])
        ts.append(f'  {{ id: "{ln["id"]}", from: {ln["from"]}, to: {ln["to"]}, words: [{ws}] }},')
    ts.append("];")
    ts.append("export const INSERTS: Record<string, { from: number; to: number }> = {")
    for k, v in inserts.items():
        ts.append(f'  {k}: {{ from: {v["from"]}, to: {v["to"]} }},')
    ts.append("};")
    ts.append(f"export const TOTAL = {total};")
    open(os.path.join(ROOT, "src/videos/hype/timing.ts"), "w").write("\n".join(ts) + "\n")
    json.dump({"lines": lines, "inserts": inserts, "total": total, "fps": FPS, "sr": SR}, open(os.path.join(VO, "timing.json"), "w"), indent=1)

    for ln in lines:
        print(f'{ln["id"]} {ln["from"]:5d}-{ln["to"]:5d} ' + " ".join(f'{w["w"]}@{w["from"]}' for w in ln["words"]))
    print("inserts", {k: (v["from"], v["to"]) for k, v in inserts.items()}, "TOTAL", total, f"{total/FPS:.2f}s")


if __name__ == "__main__":
    main()
