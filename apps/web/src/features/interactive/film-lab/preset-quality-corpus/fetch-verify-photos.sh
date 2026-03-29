#!/usr/bin/env bash
# Unsplash 上のフリー写真を、Film Lab（cinematic v2）確認用にまとめて取得する。
# 使い方: このディレクトリで ./fetch-verify-photos.sh
# 必要: curl（HTTPS リダイレクトに追従）
# ライセンス: 各画像は Unsplash License。再配布ビジネス用途は不可。確認用途に限定。
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

fetch() {
  local out="$1"
  local photo_id="$2"
  echo "Fetching $out <- unsplash.com/photos/$photo_id"
  curl -sLf "https://unsplash.com/photos/${photo_id}/download?force=true" -o "$out"
}

fetch "verify_skin_natural_01.jpg" "2gttIX7Xa2k"
fetch "verify_skin_golden_hour_01.jpg" "eeBCmBNwYGI"
fetch "verify_night_portrait_01.jpg" "Yh4P5gdbXME"
fetch "verify_office_indoor_01.jpg" "c7Ev87qEkRc"
fetch "verify_green_scene_01.jpg" "0zFkAaRLPe4"
fetch "verify_highkey_01.jpg" "8TJbrQGKFyU"
fetch "verify_office_dim_01.jpg" "BC_lzmF2R94"

echo "OK: saved under $DIR (verify_*.jpg)"
ls -la verify_*.jpg
