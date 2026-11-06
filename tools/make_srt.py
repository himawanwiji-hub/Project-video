#!/usr/bin/env python3
"""
make_srt.py - Ekspor subtitle YouTube dari cue yang sama persis dengan yang dipakai di video.

Pakai: python3 tools/make_srt.py --dir video-02-ac
Baca : script/timing.json (cue Inggris + waktu) dan script/subtitles-id.json (terjemahan, urutan sama)
Tulis: output/subtitles-en.srt, output/subtitles-id.srt, lalu validasi keduanya.
"""
import argparse
import json
import re
import sys
from pathlib import Path


def ts(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write(path, cues, texts):
    blocks = [f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{t}\n" for i, (c, t) in enumerate(zip(cues, texts), 1)]
    path.write_text("\n".join(blocks), encoding="utf-8")


def parse(path):
    out = []
    for b in path.read_text(encoding="utf-8").strip().split("\n\n"):
        lines = b.split("\n")
        m = re.fullmatch(r"(\d\d):(\d\d):(\d\d),(\d{3}) --> (\d\d):(\d\d):(\d\d),(\d{3})", lines[1])
        if not m:
            raise ValueError(f"{path.name}: format waktu salah: {lines[1]!r}")
        g = list(map(int, m.groups()))
        s = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        e = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        out.append((int(lines[0]), s, e, lines[2:]))
    return out


def validate(path):
    cues, errs = parse(path), []
    for k, (n, s, e, txt) in enumerate(cues):
        if n != k + 1: errs.append(f"nomor {n} seharusnya {k + 1}")
        if e <= s: errs.append(f"cue {n}: selesai sebelum mulai")
        if k and s < cues[k - 1][2]: errs.append(f"cue {n}: tumpang tindih dengan cue {n - 1}")
        if len(txt) != 1 or not txt[0].strip(): errs.append(f"cue {n}: harus tepat satu baris teks")
    return cues, errs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=".")
    a = ap.parse_args()
    base = Path(a.dir)
    timing = json.loads((base / "script" / "timing.json").read_text(encoding="utf-8"))
    cues = timing["cues"]
    idt = json.loads((base / "script" / "subtitles-id.json").read_text(encoding="utf-8"))
    if len(idt) != len(cues):
        sys.exit(f"jumlah terjemahan ({len(idt)}) tidak sama dengan jumlah cue ({len(cues)})")
    out = base / "output"; out.mkdir(exist_ok=True)
    write(out / "subtitles-en.srt", cues, [c["text"] for c in cues])
    write(out / "subtitles-id.srt", cues, idt)
    en, e1 = validate(out / "subtitles-en.srt")
    idc, e2 = validate(out / "subtitles-id.srt")
    same = [(a[1], a[2]) for a in en] == [(b[1], b[2]) for b in idc]
    print(f"subtitles-en.srt: {len(en)} cue, {'OK' if not e1 else e1}")
    print(f"subtitles-id.srt: {len(idc)} cue, {'OK' if not e2 else e2}")
    print("timestamp EN == ID:", "OK" if same else "BERBEDA")
    if e1 or e2 or not same:
        sys.exit(1)


if __name__ == "__main__":
    main()
