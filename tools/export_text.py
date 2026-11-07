#!/usr/bin/env python3
"""
export_text.py - Tulis narasi.txt (naskah per adegan + waktu) dan subtitle.srt dari script/timing.json.

Pakai: python3 tools/export_text.py --dir video-04-espresso
Cue di subtitle.srt sama persis dengan subtitle yang tertanam di video.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from make_srt import ts, validate  # noqa: E402

NAMA = {"hook": "Hook", "dose": "Step 1 - Dose", "grind": "Step 2 - Grinding", "tamp": "Step 3 - Distribusi / Tamping",
        "extract": "Step 4 - Ekstraksi", "end": "Hasil Akhir"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=".")
    a = ap.parse_args()
    base = Path(a.dir)
    t = json.loads((base / "script" / "timing.json").read_text(encoding="utf-8"))
    out = base / "output"; out.mkdir(exist_ok=True)

    lines = [f"Naskah narasi - total {t['total_seconds']:.1f} detik", ""]
    for sc in t["scenes"]:
        lines.append(f"[{ts(sc['start'])[3:8]} - {ts(sc['end'])[3:8]}] {NAMA.get(sc['id'], sc['id'])}")
        lines.append(" ".join(c["text"] for c in t["cues"] if c["scene"] == sc["no"]))
        lines.append("")
    (out / "narasi.txt").write_text("\n".join(lines), encoding="utf-8")

    blocks = [f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n" for i, c in enumerate(t["cues"], 1)]
    (out / "subtitle.srt").write_text("\n".join(blocks), encoding="utf-8")
    cues, errs = validate(out / "subtitle.srt")
    print(f"narasi.txt + subtitle.srt: {len(cues)} cue, {'OK' if not errs else errs}")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
