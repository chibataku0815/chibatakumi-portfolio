#!/usr/bin/env bash
# out/08-three-ranking-stills に frame_0000.png … frame_0209.png が欠番なく存在し、空でないことを検証します。
#
# 概要:
# - 期待枚数は 210（durationInFrames）。一致しなければ非ゼロ終了します。
#
# 主な仕様:
# - 各ファイルサイズが 1 byte 未満なら失敗とみなします。
#
# 制限事項:
# - capture-three-ranking-stills.sh の後に実行してください。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR="${LAB_ROOT}/out/08-three-ranking-stills"
EXPECTED=210
LAST_INDEX=$((EXPECTED - 1))

errors=0

if [[ ! -d "${OUT_DIR}" ]]; then
  echo "verify-three-ranking-stills: ERROR missing directory ${OUT_DIR}" >&2
  exit 1
fi

for i in $(seq 0 "${LAST_INDEX}"); do
  printf -v name "frame_%04d.png" "${i}"
  path="${OUT_DIR}/${name}"
  if [[ ! -f "${path}" ]]; then
    echo "verify-three-ranking-stills: ERROR missing file ${path}" >&2
    errors=$((errors + 1))
    continue
  fi
  size=$(wc -c < "${path}" | tr -d ' ')
  if [[ "${size}" -lt 1 ]]; then
    echo "verify-three-ranking-stills: ERROR empty file ${path}" >&2
    errors=$((errors + 1))
  fi
done

count=$(find "${OUT_DIR}" -maxdepth 1 -type f -name 'frame_*.png' | wc -l | tr -d ' ')
if [[ "${count}" -ne "${EXPECTED}" ]]; then
  echo "verify-three-ranking-stills: ERROR file count ${count} != expected ${EXPECTED}" >&2
  errors=$((errors + 1))
fi

if [[ "${errors}" -ne 0 ]]; then
  echo "verify-three-ranking-stills: FAILED (${errors} issue(s))" >&2
  exit 1
fi

echo "verify-three-ranking-stills: OK (${EXPECTED} PNGs, non-empty)." >&2
