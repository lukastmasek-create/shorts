#!/usr/bin/env bash
# Render HypeShort in chunks and concatenate. This box has 2 cores and ~4 GB RAM, so a single
# 1574-frame render at concurrency 2 occasionally stalls on a delayRender timeout. Chunks are cheap
# to retry and the concat is lossless (same encoder settings everywhere).
#
#   bash scripts/hype-render-chunks.sh          # 6 chunks -> out/hype/HypeShort-1080x1920.mp4
set -u
cd "$(dirname "$0")/.."

FF=node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg
OUT=out/hype
SEG=$OUT/segments
mkdir -p "$SEG"

TOTAL=1574
CHUNKS=6
STEP=$(( (TOTAL + CHUNKS - 1) / CHUNKS ))

export GL=swangle
export CHROME_PATH=/tmp/chrome/chromium
export LD_LIBRARY_PATH=/tmp/chrome/lib
export FONTCONFIG_FILE=/tmp/chrome/fonts.conf
export REMOTION_TMP=/tmp/remotion-tmp
export INPUT_PROPS='{"post":{"audio":true,"kick":true}}'

for i in $(seq 0 $((CHUNKS - 1))); do
  A=$(( i * STEP ))
  B=$(( (i + 1) * STEP - 1 ))
  if [ "$B" -ge "$TOTAL" ]; then B=$((TOTAL - 1)); fi
  F="$SEG/part$i.mp4"
  if [ -s "$F" ]; then echo "part$i ($A-$B) already done"; continue; fi
  for attempt in 1 2 3; do
    echo "== part$i frames $A-$B (attempt $attempt)"
    if node scripts/hype-render.mjs "$F" "$A-$B" 1 1.0; then break; fi
    echo "   attempt $attempt failed, retrying"
    sleep 3
  done
  [ -s "$F" ] || { echo "part$i failed"; exit 1; }
done

# concat with the stream copied, so nothing is re-encoded
: > "$SEG/list.txt"
for i in $(seq 0 $((CHUNKS - 1))); do echo "file 'part$i.mp4'" >> "$SEG/list.txt"; done
"$FF" -y -hide_banner -loglevel error -f concat -safe 0 -i "$SEG/list.txt" -c copy "$OUT/HypeShort-1080x1920.mp4"
echo "wrote $OUT/HypeShort-1080x1920.mp4"
"$FF" -hide_banner -i "$OUT/HypeShort-1080x1920.mp4" 2>&1 | grep -E "Duration|Stream"
