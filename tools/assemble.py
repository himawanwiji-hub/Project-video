#!/usr/bin/env python3
"""
assemble.py - Menggabungkan video animasi + narasi per adegan + musik latar.

Pakai:  python tools/assemble.py --dir video-01-4-stroke
Opsi :  --video path/ke/FourStroke.mp4   (bila tidak diisi, dicari otomatis)
        --music-volume 0.12              (musik latar, 0-1)

Langkah: tiap audio/scene_N.* diletakkan tepat di waktu mulai adegannya,
musik (audio/musik.mp3|wav|m4a, opsional) diulang, diperkecil, dan di-fade out,
lalu video dan audio digabung ke output/final.mp4 (video tidak di-render ulang).
Butuh ffmpeg + numpy.
"""
import argparse
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
EXTS = (".mp3", ".wav", ".m4a")


def find(audio, stem):
    for e in EXTS:
        p = audio / f"{stem}{e}"
        if p.exists():
            return p
    return None


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def probe(path):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True).stdout.strip())


def find_video(base):
    cands = [p for p in base.rglob("FourStroke.mp4")] + \
            [p for p in base.rglob("*.mp4") if "final" not in p.name and "partial" not in str(p)]
    if not cands:
        sys.exit("Video animasi tidak ditemukan. Render dulu dengan manim atau pakai --video.")
    return max(cands, key=lambda p: p.stat().st_mtime)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=".")
    ap.add_argument("--video")
    ap.add_argument("--music-volume", type=float, default=0.12)
    a = ap.parse_args()

    base = Path(a.dir)
    cfg = json.loads((base / "script" / "scenes.json").read_text(encoding="utf-8"))
    scenes, total_s = cfg["scenes"], float(cfg["total_seconds"])
    audio = base / "audio"
    total = int(round(total_s * SR))

    video = Path(a.video) if a.video else find_video(base)
    vd = probe(video)
    print(f"video: {video} ({vd:.2f} dtk)")
    if abs(vd - total_s) > 0.5:
        print(f"PERINGATAN: durasi video {vd:.1f} dtk, naskah {total_s:.0f} dtk. Cek timing animasi.")

    narr = np.zeros(total, dtype=np.float32)
    for i, sc in enumerate(scenes):
        clip = find(audio, f"scene_{sc['no']}")
        if clip is None:
            print(f"adegan {sc['no']}: audio tidak ada, dilewati")
            continue
        x = decode(clip)
        off = int(sc["start"] * SR)
        nxt = int(scenes[i + 1]["start"] * SR) if i + 1 < len(scenes) else total
        if off + len(x) > nxt:
            print(f"PERINGATAN adegan {sc['no']}: audio melewati slot sebesar {(off + len(x) - nxt) / SR:.2f} dtk")
        end = min(off + len(x), total)
        narr[off:end] += x[:end - off]
    peak = float(np.max(np.abs(narr))) or 1.0
    narr *= 0.89 / peak                                   # normalisasi puncak ke sekitar -1 dBFS

    mix = narr.copy()
    music = find(audio, "musik")
    if music:
        m = decode(music)
        m = np.tile(m, int(np.ceil(total / max(len(m), 1))))[:total]
        m = m / (float(np.max(np.abs(m))) or 1.0) * a.music_volume
        fade = int(2 * SR)
        m[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
        mix += m
        print(f"musik latar: {music.name} (volume {a.music_volume})")
    else:
        print("musik latar: tidak ada (audio/musik.mp3 opsional)")
    mix = np.clip(mix, -1, 1)

    (base / "output").mkdir(exist_ok=True)
    wav_path = base / "output" / "mix.wav"
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())

    out = base / "output" / "final.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-i", str(wav_path),
                    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "192k", "-shortest", str(out)], check=True)
    print(f"SELESAI: {out} ({probe(out):.2f} dtk)")


if __name__ == "__main__":
    main()
