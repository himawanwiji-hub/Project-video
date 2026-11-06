#!/bin/bash
# render_chunks.sh <page> <width> <height> <duration_s> <out.mp4>
# Renders a scene page in 20 s chunks (3 in parallel), keeps finished chunks, then concatenates.
set -e
cd "$(dirname "$0")/.."
PAGE=$1; W=$2; H=$3; END=$4; OUT=$5; STEP=20
TMP=output/parts/$(basename "$OUT" .mp4); mkdir -p "$TMP"
seq 0 $STEP $(python3 -c "print(int($END-0.001))") | xargs -P 3 -I{} bash -c '
  s={}; e=$(python3 -c "print(min($s+'$STEP', '$END'))"); f='$TMP'/c$(printf %04d $s).mp4
  if ffprobe -v error "$f" >/dev/null 2>&1; then exit 0; fi
  node video/render.js --page '$PAGE' --width '$W' --height '$H' --start $s --end $e --out $f.tmp.mp4 > $f.log 2>&1 && mv $f.tmp.mp4 $f && echo "done $f"'
ls "$TMP"/c*.mp4 | grep -v tmp | sed "s#^#file '$PWD/#;s#\$#'#" > "$TMP/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$TMP/list.txt" -c copy -movflags +faststart "$OUT"
echo "wrote $OUT"
