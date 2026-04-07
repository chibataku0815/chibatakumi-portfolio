#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${LAB_ROOT}"

OUT_DIR="${LAB_ROOT}/out/stills/48-overlay-ring-title-minimal"
FRAMES=(12 30 42 66)

mkdir -p "${OUT_DIR}"

for frame in "${FRAMES[@]}"; do
  printf -v out_file "%s/frame-%04d.png" "${OUT_DIR}" "${frame}"
  echo "capture-overlay-ring-title-minimal-stills: frame ${frame} -> ${out_file}" >&2
  bunx remotion still src/index.ts OverlayRingTitleMinimal "${out_file}" \
    --frame="${frame}" \
    --gl=angle \
    --overwrite
done

echo "capture-overlay-ring-title-minimal-stills: done." >&2
