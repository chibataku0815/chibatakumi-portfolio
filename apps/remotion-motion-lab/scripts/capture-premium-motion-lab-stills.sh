#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/out"
STILLS_DIR="$OUT_DIR/motion-lab-stills"

mkdir -p "$STILLS_DIR"

extract_still() {
  local input="$1"
  local timestamp="$2"
  local output="$3"

  ffmpeg -y -ss "$timestamp" -i "$input" -frames:v 1 "$output" >/dev/null 2>&1
}

extract_still "$OUT_DIR/premium-motion-push-in-lab.mp4" "2.5" "$STILLS_DIR/premium-motion-push-in-lab.png"
extract_still "$OUT_DIR/premium-motion-pull-back-lab.mp4" "2.6" "$STILLS_DIR/premium-motion-pull-back-lab.png"
extract_still "$OUT_DIR/premium-motion-long-settle-lab.mp4" "2.3" "$STILLS_DIR/premium-motion-long-settle-lab.png"
extract_still "$OUT_DIR/premium-motion-snap-in-lab.mp4" "2.0" "$STILLS_DIR/premium-motion-snap-in-lab.png"
extract_still "$OUT_DIR/premium-motion-continuity-lab.mp4" "2.3" "$STILLS_DIR/premium-motion-continuity-lab.png"
extract_still "$OUT_DIR/premium-motion-editorial-gap-lab.mp4" "2.5" "$STILLS_DIR/premium-motion-editorial-gap-lab.png"
extract_still "$OUT_DIR/premium-motion-layered-reveal-lab.mp4" "2.4" "$STILLS_DIR/premium-motion-layered-reveal-lab.png"

ffmpeg -y \
  -i "$OUT_DIR/premium-motion-reference-lab-overview.mp4" \
  -vf "fps=1/5,scale=640:-1,tile=3x3:padding=12:margin=20:color=0x0d1017" \
  "$STILLS_DIR/premium-motion-overview-contact-sheet.jpg" >/dev/null 2>&1

ffmpeg -y \
  -pattern_type glob \
  -i "$STILLS_DIR/premium-motion-*-lab.png" \
  -vf "scale=640:-1,tile=3x3:padding=12:margin=20:color=0x0d1017" \
  "$STILLS_DIR/premium-motion-study-contact-sheet.jpg" >/dev/null 2>&1

printf 'Captured stills and contact sheets in %s\n' "$STILLS_DIR"
