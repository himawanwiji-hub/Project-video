#!/usr/bin/env python3
"""
tts_phrases.py - Narasi frasa demi frasa (edge-tts) -> audio/scene_N.wav + timing.json + scenes.json.

Pakai:  python3 tools/tts_phrases.py --dir video-03-ac-short

narration.json: tiap adegan berisi daftar [teks_diucapkan, teks_subtitle]. Setiap frasa disintesis
terpisah, keheningan di awal/akhir dipotong, lalu frasa disambung dengan jeda tetap (koma / akhir
kalimat). Karena posisi tiap frasa di audio diketahui persis, subtitle (bahasa apa pun) selalu
sinkron dengan suara. Jeda dan rate di narration.json mengatur tempo bicara.

Opsional di narration.json:
  "config": "config.json"   -> frasa boleh berisi {kunci} dan {kunci_w} (angka dibaca dalam kata Indonesia)
  per adegan "min_seconds"  -> adegan berdurasi tetap minimal sekian detik; audio mulai "audio_offset"
                               detik setelah adegan mulai, dan adegan diperpanjang bila narasinya lebih panjang
"""
import argparse
import asyncio
import json
import os
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100


async def synth(text, voice, rate, out):
    import certifi
    ca = "/root/.ccr/ca-bundle.crt"
    if os.path.exists(ca):                     # the session proxy re-signs TLS; trust its CA
        certifi.where = lambda: ca
    import edge_tts
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    await edge_tts.Communicate(text, voice, rate=rate, proxy=proxy).save(str(out))


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def trim(x, thr=0.012, pre=0.03, post=0.08):
    """Cut leading/trailing silence; keep a few ms so consonants are not clipped."""
    win = int(0.01 * SR)
    env = np.convolve(np.abs(x), np.ones(win) / win, mode="same")
    idx = np.where(env > thr)[0]
    if not len(idx):
        return x
    a, b = max(0, idx[0] - int(pre * SR)), min(len(x), idx[-1] + int(post * SR))
    return x[a:b]


SATUAN = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"]


def kata(n):
    """Angka bulat -> kata dalam bahasa Indonesia (0-999)."""
    n = int(n)
    if n < 12: return SATUAN[n]
    if n < 20: return SATUAN[n - 10] + " belas"
    if n < 100: return (SATUAN[n // 10] + " puluh" + (" " + SATUAN[n % 10] if n % 10 else "")).strip()
    if n < 200: return "seratus" + (" " + kata(n - 100) if n > 100 else "")
    return SATUAN[n // 100] + " ratus" + (" " + kata(n % 100) if n % 100 else "")


def template_vars(base, cfg):
    if "config" not in cfg:
        return {}
    conf = json.loads((base / cfg["config"]).read_text(encoding="utf-8"))
    out = {k: v for k, v in conf.items() if not isinstance(v, (dict, list))}
    for k, v in list(out.items()):
        if isinstance(v, (int, float)) and float(v).is_integer():
            out[k + "_w"] = kata(v)
    return out


def chunks(text, maxc):
    """Split a subtitle into one-line pieces: prefer breaks after , ; : then the word nearest the middle."""
    text = text.strip()
    if len(text) <= maxc:
        return [text]
    words = text.split()
    best, score = None, None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        sc = abs(len(a) - len(b)) - (25 if a.endswith((",", ";", ":")) else 0)
        if score is None or sc < score:
            best, score = i, sc
    a, b = " ".join(words[:best]), " ".join(words[best:])
    return chunks(a, maxc) + chunks(b, maxc)


def split_words(text, n):
    """Split text into n parts with roughly equal word counts (used for the same-timing second language)."""
    w = text.split(); out, k = [], 0
    for i in range(n):
        m = round(len(w) * (i + 1) / n); out.append(" ".join(w[k:m])); k = m
    return out


def write_wav(path, x):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=".")
    ap.add_argument("--reuse", action="store_true", help="pakai ulang audio/phrases/*.mp3 yang sudah ada")
    a = ap.parse_args()
    base = Path(a.dir)
    cfg = json.loads((base / "script" / "narration.json").read_text(encoding="utf-8"))
    v = cfg["voice"]
    tv = template_vars(base, cfg)
    for sc in cfg["scenes"]:
        sc["phrases"] = [[x.format(**tv) if tv else x for x in p] for p in sc["phrases"]]
    pdir = base / "audio" / "phrases"; pdir.mkdir(parents=True, exist_ok=True)

    scenes, cues = [], []
    t = float(cfg.get("lead_in", 0.6))
    for sc in cfg["scenes"]:
        fixed = "min_seconds" in sc
        vis_start = t
        if fixed:
            t = vis_start + float(cfg.get("audio_offset", 0.4))
        parts, pos = [], 0.0
        for k, ph in enumerate(sc["phrases"]):
            spoken, sub = ph[0], ph[1]
            written = ph[2] if len(ph) > 2 else spoken      # teks narasi untuk subtitle bahasa asli (tanpa ejaan TTS)
            mp3 = pdir / f"s{sc['no']}_{k + 1:02d}.mp3"
            if not (a.reuse and mp3.exists()):
                asyncio.run(synth(spoken, v["edge_voice"], v.get("rate", "+0%"), mp3))
            x = trim(decode(mp3))
            dur = len(x) / SR
            cues.append({"scene": sc["no"], "phrase": k + 1, "text": sub, "spoken": written, "tts": spoken,
                         "start": round(t + pos, 3), "end": round(t + pos + dur + 0.12, 3)})
            parts.append(x); pos += dur
            if k + 1 < len(sc["phrases"]):
                gap = cfg["pause_comma"] if spoken.rstrip().endswith((",", ":")) else cfg["pause_sentence"]
                parts.append(np.zeros(int(gap * SR), np.float32)); pos += gap
        audio = np.concatenate(parts)
        write_wav(base / "audio" / f"scene_{sc['no']}.wav", audio)
        dur = len(audio) / SR
        entry = {"no": sc["no"], "id": sc["id"], "start": round(vis_start if fixed else t, 3), "audio_start": round(t, 3),
                 "audio_seconds": round(dur, 3), "audio": f"audio/scene_{sc['no']}.wav"}
        scenes.append(entry)
        if fixed:
            length = max(float(sc["min_seconds"]), (t - vis_start) + dur + float(cfg.get("scene_pad", 0.6)))
            print(f"adegan {sc['no']}: audio {dur:5.2f} dtk, adegan {length:5.2f} dtk (min {sc['min_seconds']})")
            t = vis_start + length
        else:
            print(f"adegan {sc['no']}: {dur:5.2f} dtk, {len(sc['phrases'])} frasa")
            t += dur + float(sc.get("hold_after_s", cfg.get("scene_gap", 0.8)))
    if fixed:
        total = round(t + float(cfg.get("tail", 0.0)), 3)
    else:
        total = round(t - float(cfg["scenes"][-1].get("hold_after_s", cfg.get("scene_gap", 0.8))) + float(cfg.get("tail", 1.5)), 3)

    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else total
    maxc = int(cfg.get("sub_max_chars", 0))
    if maxc:                                   # long subtitles -> several one-line cues spread over the phrase
        split = []
        for c in cues:
            parts = chunks(c["text"], maxc)
            if len(parts) == 1:
                split.append(c); continue
            ids = split_words(c["spoken"], len(parts))
            tot = sum(len(p) for p in parts); a = c["start"]
            for k, (p, idt) in enumerate(zip(parts, ids)):
                b = c["end"] if k == len(parts) - 1 else a + (c["end"] - c["start"]) * len(p) / tot
                split.append({**c, "text": p, "spoken": idt, "start": round(a, 3), "end": round(b, 3)}); a = b
        cues = split
    for i, c in enumerate(cues):
        nxt = cues[i + 1]["start"] - 0.04 if i + 1 < len(cues) else total
        c["end"] = round(min(c["end"], nxt), 3); c["i"] = i + 1

    (base / "script" / "timing.json").write_text(json.dumps(
        {"total_seconds": total, "fps": 30, "provider": "edge-tts", "voice": v, "scenes": scenes, "cues": cues},
        indent=1, ensure_ascii=False), encoding="utf-8")
    (base / "script" / "scenes.json").write_text(json.dumps(
        {"total_seconds": total, "scenes": [{"no": s["no"], "start": s["audio_start"]} for s in scenes]}, indent=1), encoding="utf-8")
    print(f"total {total:.2f} dtk, {len(cues)} cue")


if __name__ == "__main__":
    main()
