#!/bin/sh
# Masters the soundtrack of a rendered reel and makes the WhatsApp-size copy.
#   tools/master.sh out/joyboy-pitch-reel-vo.mp4
# → out/<name>-master.mp4 (video stream copied, audio at -14 LUFS, true peak -1.5 dB)
# → out/<name>-share.mp4  (same, re-encoded at CRF 23 for messaging apps)
# A peak limiter goes first so the gain to -14 LUFS stays linear (no pumping).
set -e
cd "$(dirname "$0")/.."
in="$1"
base="${in%.mp4}"
tmp="$base.limited.wav"

ffmpeg -v error -y -i "$in" -vn -af "alimiter=limit=0.56:attack=4:release=80:level=disabled" -ar 48000 "$tmp"
meas=$(ffmpeg -hide_banner -i "$tmp" -af loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get() { echo "$meas" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ln="loudnorm=I=-14:TP=-1.5:LRA=20:linear=true:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset)"

ffmpeg -v error -y -i "$in" -i "$tmp" -map 0:v -map 1:a -c:v copy -af "$ln" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$base-master.mp4"
ffmpeg -v error -y -i "$base-master.mp4" -c:v libx264 -preset slow -crf 23 -profile:v high -pix_fmt yuv420p \
  -c:a copy -movflags +faststart "$base-share.mp4"
rm -f "$tmp"
for f in "$base-master.mp4" "$base-share.mp4"; do
  printf "%s: " "$f"
  ffmpeg -hide_banner -i "$f" -vn -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -E " I:|Peak:" | tr -s ' ' | tr '\n' ' '
  echo
done
