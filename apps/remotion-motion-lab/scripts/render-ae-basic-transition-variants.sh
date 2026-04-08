#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/.."

readonly composition_id="AEBasicTransitionVariant"
readonly out_dir="out/64-ae-basic-transition-variants"

transitions=(
  "linear-left-to-right"
  "linear-diagonal"
  "radial-counter-clockwise"
  "trim-paths-center-open"
  "circle-scale"
)

easings=(
  "linear"
  "ae-like"
  "quint-out"
  "expo-out"
)

mkdir -p "$out_dir"

props_file="$(mktemp)"
cleanup() {
  rm -f "$props_file"
}
trap cleanup EXIT

for transition_id in "${transitions[@]}"; do
  for easing_id in "${easings[@]}"; do
    cat >"$props_file" <<EOF
{"transitionId":"$transition_id","easingId":"$easing_id"}
EOF

    output_path="$out_dir/${transition_id}--${easing_id}.mp4"
    echo "[render-ae-basic-transition-variants] $transition_id × $easing_id -> $output_path"
    bun x remotion render src/index.ts "$composition_id" "$output_path" --props="$props_file" --gl=angle
  done
done
