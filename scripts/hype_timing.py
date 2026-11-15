"""Turn the voice timeline into the shot list (frames) for HypeShort.

usage: . .venv-tools/bin/activate && python3 scripts/hype_timing.py
reads:  hype/voice/{marks,words}.json  +  src/videos/hype/script.ts
writes: hype/voice/timing.json   (imported by src/videos/hype/story.ts)

Timing model
  Every beat's word is spoken at its voice onset v_i. A beat's visible window is
  [v_i - pre_i, v_{i+1} - pre_{i+1}) so that the *incoming* beat's custom transition finishes
  exactly pre_{i+1} frames BEFORE its word — the element has landed and waits, then the word hits
  the screen together with the voice. With @remotion/transitions that means a Sequence duration of
  (end - start) + T and a Transition of duration T (T = 0 is a hard cut on the beat).
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
F = lambda s: int(round(s * FPS))

TRANS = {  # transition into the beat -> (frames, kind)
    "cut": (0, "cut"),
    "flash-blue": (2, "flash"),
    "flash-coral": (2, "flash"),
    "whip": (6, "whip"),
    "stripes": (7, "stripes"),
    "glitch": (5, "glitch"),
    "zoom": (8, "zoom"),
    "laser": (8, "laser"),
    "shape": (9, "shape"),
    "riser": (5, "zoom"),
    "record-stop": (0, "cut"),
}
# how long before its word a beat may pre-roll (frames); long reveals get more
PRE = {
    "logo": 10, "extrude": 8, "sub": 4, "cta": 8, "endcard": 0, "whisper": 10, "explain": 3,
    "player": 4, "quiz": 3, "quizright": 0, "code": 4, "town": 5, "room": 4,
    "montage": 4, "worksheets": 4, "timer": 4, "timerbig": 4, "kidding": 4,
}
DEFAULT_PRE = 2


def parse_beats():
    src = open(os.path.join(ROOT, "src", "videos", "hype", "script.ts"), encoding="utf-8").read()
    body = src.split("export const SCRIPT: Beat[] = [", 1)[1].split("\n];", 1)[0]
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    beats = []
    for blk in re.findall(r"\{([^{}]*)\}", body):
        obj = {}
        for m in re.finditer(r'(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"', blk):
            obj[m.group(1)] = m.group(2).replace("\\n", "\n")
        for k, v in re.findall(r"(\w+)\s*:\s*(-?[\d.]+)\b", blk):
            obj[k] = float(v)
        beats.append(obj)
    return beats


def main():
    marks = json.load(open(os.path.join(ROOT, "hype", "voice", "marks.json")))
    words = json.load(open(os.path.join(ROOT, "hype", "voice", "words.json")))
    beats = parse_beats()
    src = open(os.path.join(ROOT, "src", "videos", "hype", "script.ts"), encoding="utf-8").read()
    end_sec = float(re.search(r"export const ENDCARD_SEC = ([\d.]+)", src).group(1))
    mb = {m["beat"]: m for m in marks}
    assert len(beats) == len(marks) == len(mb), (len(beats), len(marks))

    # voice onset per beat, in frames
    onset = []
    for i, b in enumerate(beats):
        m = mb[i]
        onset.append(F(m["t0"]) if (b.get("say") or "").strip() else None)
    voice_end = F(marks[-1]["t1"])

    # per-beat pre-roll and transition length.
    # pre-roll = transition length + the beat's own head start, so the custom wipe gets its full
    # length AND the incoming element has landed `head` frames before its voice word.
    pre, tlen, kind, head = [], [], [], []
    for i, b in enumerate(beats):
        el = b.get("el", "word")
        t, k = TRANS[b.get("tr", "cut")]
        h = PRE.get(el, DEFAULT_PRE) if i > 0 else 0
        head.append(h)
        tlen.append(t if i > 0 else 0)
        pre.append(h + (t if i > 0 else 0))
        kind.append(k)

    # start frame of every beat window (frames) — onset minus pre-roll
    start = []
    prev = 0
    for i, b in enumerate(beats):
        if onset[i] is None:  # unspoken (end card): after the voice has finished
            start.append(max(prev + 12, voice_end + 6))
        else:
            s = onset[i] - pre[i]
            start.append(max(s, prev + 4 if i else 0))
        prev = start[-1]
    last_end = voice_end + F(end_sec)
    ends = start[1:] + [last_end]
    # a beat must not be shorter than its own transition + 3 frames of hold
    for i in range(len(start) - 1):
        if ends[i] - start[i] < tlen[i] + 3:
            ends[i] = start[i] + tlen[i] + 3

    segs = []
    for i, b in enumerate(beats):
        land = (onset[i] - start[i]) if onset[i] is not None else 0
        dur = ends[i] - start[i]
        # every word of this beat with its frame, for kinetic text that lands per word
        bw = [w for w in words if w["beat"] == i]
        segs.append({
            "i": i, "from": start[i], "dur": dur, "el": b.get("el", "word"),
            "text": b.get("show", ""), "bg": b.get("bg", "cream"), "mode": b.get("mode", "slam"),
            "tr": kind[i], "trFrames": tlen[i], "head": head[i],
            "land": land, "shake": float(b.get("shake") or 0), "hit": float(b.get("hit") or 0),
            "words": [{"w": w["word"], "f": F(w["start"]) - start[i], "e": F(w["end"]) - start[i]} for w in bw],
        })

    total = last_end + F(0.4)
    os.makedirs(os.path.join(ROOT, "hype", "voice"), exist_ok=True)
    data = {"fps": FPS, "total": total, "voiceEnd": voice_end, "segs": segs}
    json.dump(data, open(os.path.join(ROOT, "hype", "voice", "timing.json"), "w"), indent=1)
    # also emit a TS module: the composition imports it, so no resolveJsonModule is needed
    ts = ["// GENERATED by scripts/hype_timing.py from src/videos/hype/script.ts + the voice timeline.",
          "// Do not edit by hand: change script.ts (or re-record the voice) and rerun the script.",
          "import type { Word } from \"./story\";",
          "export type TimingSeg = { i: number; from: number; dur: number; el: string; text: string; bg: string;",
          "  mode: string; tr: string; trFrames: number; land: number; shake: number; hit: number; words: Word[] };",
          "export const TIMING = {",
          f"  fps: {FPS}, total: {total}, voiceEnd: {voice_end},",
          "  segs: ["]
    for s_ in segs:
        w = ", ".join(f'{{ w: {json.dumps(x["w"])}, f: {x["f"]}, e: {x["e"]} }}' for x in s_["words"])
        ts.append("    { i: %d, from: %d, dur: %d, el: %s, text: %s, bg: %s, mode: %s, tr: %s, trFrames: %d, land: %d, shake: %s, hit: %s, words: [%s] }," % (
            s_["i"], s_["from"], s_["dur"], json.dumps(s_["el"]), json.dumps(s_["text"]), json.dumps(s_["bg"]),
            json.dumps(s_["mode"]), json.dumps(s_["tr"]), s_["trFrames"], s_["land"], s_["shake"], s_["hit"], w))
    ts.append("  ],\n} as const;")
    open(os.path.join(ROOT, "src", "videos", "hype", "timing.generated.ts"), "w").write("\n".join(ts) + "\n")
    print(f"total {total} frames = {total / FPS:.2f} s, {len(segs)} beats, voice {voice_end / FPS:.2f} s")
    for s in segs:
        print(f'  {s["i"]:2d} {s["from"]:5d}+{s["dur"]:4d} land {s["land"]:3d} {s["tr"]:7s} {s["bg"]:7s} '
              f'{s["el"]:13s} "{s["text"][:26].replace(chr(10), " / ")}"')


if __name__ == "__main__":
    main()
