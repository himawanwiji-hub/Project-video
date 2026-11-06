#!/usr/bin/env python3
"""
tts.py - Narasi per adegan -> audio/scene_N.mp3, lalu hitung timing.json, scenes.json, dan cue subtitle.

Pakai:  python3 tools/tts.py --dir video-02-ac                 (edge-tts, gratis)
        python3 tools/tts.py --dir video-02-ac --provider elevenlabs   (butuh ELEVENLABS_API_KEY)

Input : <dir>/script/narration.json  (adegan -> daftar frasa; satu frasa = satu baris subtitle)
Output: <dir>/audio/scene_N.mp3
        <dir>/script/timing.json     (waktu adegan + cue subtitle; acuan animasi dan .srt)
        <dir>/script/scenes.json     (format yang dibaca tools/assemble.py)

Durasi tiap file audio diukur dengan ffprobe; waktu kata diambil dari WordBoundary (edge-tts) atau
alignment karakter (ElevenLabs), lalu dipetakan ke frasa.
"""
import argparse
import asyncio
import base64
import json
import os
import re
import subprocess
import sys
from pathlib import Path


def norm(s):
    return re.sub(r"[^0-9a-z]", "", s.lower())


def probe(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                                capture_output=True, text=True, check=True).stdout.strip())


# ------------------------------------------------------------------ edge-tts
async def edge_scene(text, voice, rate, out):
    import certifi
    ca = "/root/.ccr/ca-bundle.crt"
    if os.path.exists(ca):                     # the session proxy re-signs TLS; trust its CA
        certifi.where = lambda: ca
    import edge_tts
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary", proxy=proxy)
    words = []
    with open(out, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return words


# ------------------------------------------------------------------ ElevenLabs (with timestamps)
def eleven_scene(text, voice_id, model, out):
    import urllib.request
    key = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": model}).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.load(r)
    Path(out).write_bytes(base64.b64decode(res["audio_base64"]))
    al = res["alignment"]
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None                       # rebuild words from characters
    for c, a, b in zip(chars, st, en):
        if c.isspace():
            if cur: words.append(tuple(cur)); cur = None
        elif cur is None: cur = [a, b, c]
        else: cur[1] = b; cur[2] += c
    if cur: words.append(tuple(cur))
    return words


# ------------------------------------------------------------------ phrase timing
def align(phrases, words):
    """Return (start, end) per phrase by consuming word boundaries until the phrase's letters are covered."""
    out, wi = [], 0
    for p in phrases:
        need, got, s, e = len(norm(p)), 0, None, None
        while wi < len(words) and got < need:
            a, b, t = words[wi]
            if s is None: s = a
            e = b; got += len(norm(t)); wi += 1
        if s is None:
            raise SystemExit(f"tidak bisa menyelaraskan frasa: {p!r}")
        out.append((s, e))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=".")
    ap.add_argument("--provider", choices=["edge", "elevenlabs"], default="edge")
    ap.add_argument("--voice-id", default=os.environ.get("ELEVENLABS_VOICE_ID", ""), help="ElevenLabs voice id")
    ap.add_argument("--model", default="eleven_multilingual_v2", help="ElevenLabs model id")
    ap.add_argument("--yes", action="store_true", help="lewati konfirmasi jumlah karakter (ElevenLabs)")
    a = ap.parse_args()

    base = Path(a.dir)
    cfg = json.loads((base / "script" / "narration.json").read_text(encoding="utf-8"))
    (base / "audio").mkdir(exist_ok=True)
    texts = [" ".join(sc["phrases"]) for sc in cfg["scenes"]]

    if a.provider == "elevenlabs":
        if not os.environ.get("ELEVENLABS_API_KEY"):
            sys.exit("ELEVENLABS_API_KEY belum diset.")
        if not a.voice_id:
            sys.exit("Isi --voice-id atau ELEVENLABS_VOICE_ID.")
        n = sum(len(t) for t in texts)
        print(f"ElevenLabs: {len(texts)} adegan, {n} karakter akan ditagih.")
        if not a.yes and input("Lanjut? [y/N] ").strip().lower() != "y":
            sys.exit("dibatalkan")

    v = cfg["voice"]
    scenes, cues, t = [], [], float(cfg.get("lead_in", 0.5))
    for sc, text in zip(cfg["scenes"], texts):
        out = base / "audio" / f"scene_{sc['no']}.mp3"
        if a.provider == "edge":
            words = asyncio.run(edge_scene(text, v["edge_voice"], v.get("rate", "+0%"), out))
        else:
            words = eleven_scene(text, a.voice_id, a.model, out)
        dur = probe(out)
        spans = align(sc["phrases"], words)
        for k, ((s, e), p) in enumerate(zip(spans, sc["phrases"])):
            cues.append({"scene": sc["no"], "text": p, "start": round(t + s, 3), "end": round(t + e + 0.25, 3)})
        scenes.append({"no": sc["no"], "id": sc["id"], "start": round(t, 3), "audio_seconds": round(dur, 3),
                       "audio": f"audio/scene_{sc['no']}.mp3"})
        print(f"adegan {sc['no']}: {dur:5.2f} dtk, {len(words)} kata")
        t += dur + float(cfg.get("gap", 0.6))
    total = round(t - float(cfg.get("gap", 0.6)) + float(cfg.get("tail", 1.5)), 3)

    for i, sc in enumerate(scenes):                  # each scene lasts until the next one starts
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else total
    for i, c in enumerate(cues):                     # no overlaps; never past the next cue
        nxt = cues[i + 1]["start"] - 0.04 if i + 1 < len(cues) else total
        c["end"] = round(min(c["end"], nxt), 3)
        c["i"] = i + 1

    timing = {"total_seconds": total, "fps": 30, "provider": a.provider, "scenes": scenes, "cues": cues}
    (base / "script" / "timing.json").write_text(json.dumps(timing, indent=1), encoding="utf-8")
    (base / "script" / "scenes.json").write_text(json.dumps(
        {"total_seconds": total, "scenes": [{"no": s["no"], "start": s["start"]} for s in scenes]}, indent=1), encoding="utf-8")
    print(f"total {total:.2f} dtk, {len(cues)} cue -> script/timing.json, script/scenes.json")


if __name__ == "__main__":
    main()
