#!/usr/bin/env bash
# ThreeRanking の composition 全フレーム（0..209）を PNG 連番で出力します。
#
# 概要:
# - `remotion render --sequence` で 1 回バンドルし、全フレームを連続レンダーします（210 回 still より高速）。
# - 中間ファイル名 `element-*.png` を `frame_%04d.png` にリネームしてフレーム表と一致させます。
#
# 主な仕様:
# - 出力先: ./out/08-three-ranking-stills/frame_0000.png … frame_0209.png
#
# 制限事項:
# - bash 3 互換（macOS 既定の /bin/bash）を避け、可能なら bash 4+ または `bun run` から呼ばない場合は `brew bash` を使ってください。sort -V は macOS の sort で利用可能です。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${LAB_ROOT}"

TMP_DIR="${LAB_ROOT}/out/08-three-ranking-stills-tmp"
OUT_DIR="${LAB_ROOT}/out/08-three-ranking-stills"

echo "capture-three-ranking-stills: sequence render -> ${TMP_DIR}" >&2
rm -rf "${TMP_DIR}"
mkdir -p "${TMP_DIR}"

bunx remotion render src/index.ts ThreeRanking "${TMP_DIR}" \
  --sequence \
  --image-format=png \
  --gl=angle \
  --overwrite

# shellcheck disable=SC2207
ELEMENT_FILES=($(find "${TMP_DIR}" -maxdepth 1 -type f -name 'element-*.png' | LC_ALL=C sort -V))
if [[ ${#ELEMENT_FILES[@]} -eq 0 ]]; then
  echo "capture-three-ranking-stills: ERROR no element-*.png under ${TMP_DIR}" >&2
  exit 1
fi
if [[ ${#ELEMENT_FILES[@]} -ne 210 ]]; then
  echo "capture-three-ranking-stills: ERROR expected 210 element-*.png, got ${#ELEMENT_FILES[@]}" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"
rm -f "${OUT_DIR}"/frame_*.png

for f in "${ELEMENT_FILES[@]}"; do
  base="$(basename "${f}" .png)"
  n="${base#element-}"
  if [[ ! "${n}" =~ ^[0-9]+$ ]]; then
    echo "capture-three-ranking-stills: ERROR unexpected filename $(basename "${f}")" >&2
    exit 1
  fi
  printf -v out_name "frame_%04d.png" "$((10#${n}))"
  mv "${f}" "${OUT_DIR}/${out_name}"
done

rm -rf "${TMP_DIR}"

count="$(find "${OUT_DIR}" -maxdepth 1 -type f -name 'frame_*.png' | wc -l | tr -d ' ')"
echo "capture-three-ranking-stills: ${count} files in ${OUT_DIR}" >&2
if [[ "${count}" -ne 210 ]]; then
  echo "capture-three-ranking-stills: ERROR expected 210 frame_*.png, got ${count}" >&2
  exit 1
fi

echo "capture-three-ranking-stills: done." >&2
