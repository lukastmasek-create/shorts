#!/bin/bash
# Render PauseShort without Remotion's own ffmpeg (broken on macOS 12): JPEG frames via Remotion, encode with a separate ffmpeg.
# usage: bash scripts/render_pause.sh [draft|final] [first-frame] [last-frame]
#   draft = 1080x1920 (scale 0.75, ~2x faster), final = 1440x2560 (scale 4/3).   env: CONC=<tabs> (default 2), FFMPEG=<path> (default ~/bin/ffmpeg)
set -e
MODE=${1:-final}; A=${2:-0}; B=${3:-1799}; CONC=${CONC:-2}; FFMPEG=${FFMPEG:-$HOME/bin/ffmpeg}
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
if [ "$MODE" = draft ]; then SCALE=0.75; else SCALE=1.3333333333333333; fi
OUT=out/pause_frames_$MODE; mkdir -p "$OUT"
START=$(date +%s)
npx remotion render src/index.ts PauseShort "$OUT" --sequence --image-format=jpeg --jpeg-quality=95 --scale "$SCALE" --frames="$A-$B" \
  --concurrency "$CONC" --browser-executable="$CHROME" --gl=angle 2>&1 | grep -v kenney
echo "frames done in $(( $(date +%s) - START )) s"
# Remotion names files element-0000.jpeg ... ; audio = the repo mix (starts at frame 0, so seek to the first frame)
"$FFMPEG" -y -framerate 30 -start_number "$A" -i "$OUT/element-%04d.jpeg" -ss "$(python3 -c "print($A/30)")" -i public/pause/mix.mp3 \
  -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest "out/pause_$MODE.mp4"
echo "done: out/pause_$MODE.mp4 ($(( $(date +%s) - START )) s total)"
