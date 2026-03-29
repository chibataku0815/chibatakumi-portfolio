#!/usr/bin/env bash
# 合成テスト画像を再生成する（ffmpeg 必須）。
# リポジトリサイズを抑えるため、ノイズの多い PNG は .gitignore 対象。CI やローカルで必要ならこのスクリプトを実行する。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
# preset-quality-corpus → …/apps/web（5 段上げ）
WEB_PUBLIC="$(cd "$ROOT/../../../../.." && pwd)/public"
DEFAULT_JPG="$WEB_PUBLIC/images/film-lab/default.jpg"
if [[ ! -f "$DEFAULT_JPG" ]]; then
  echo "generate-synthetic-corpus.sh: missing $DEFAULT_JPG" >&2
  exit 1
fi
cp -f "$DEFAULT_JPG" "$ROOT/landscape_reference_01.jpg"
ffmpeg -y -f lavfi -i "smptebars=s=960x640:r=1" -frames:v 1 "$ROOT/technical_smptebars_01.png"
ffmpeg -y -f lavfi -i "color=c=0xE8D4C4:s=960x640,format=rgb24" -vf "noise=alls=8:allf=t+u" -frames:v 1 "$ROOT/skin_natural_synthetic_01.png"
ffmpeg -y -f lavfi -i "color=c=0xC8D0C0:s=960x640,format=rgb24" -vf "noise=alls=6:allf=t" -frames:v 1 "$ROOT/office_fluorescent_synthetic_01.png"
ffmpeg -y -f lavfi -i "color=c=0x1a2535:s=960x640,format=rgb24" -frames:v 1 "$ROOT/night_street_synthetic_01.png"
ffmpeg -y -f lavfi -i "color=c=0x2d5030:s=960x640,format=rgb24" -vf "noise=alls=12:allf=t+u" -frames:v 1 "$ROOT/green_foliage_synthetic_01.png"
ffmpeg -y -f lavfi -i "color=c=0xf5f5f2:s=960x640,format=rgb24" -vf "noise=alls=4:allf=t" -frames:v 1 "$ROOT/highkey_synthetic_01.png"
ffmpeg -y -f lavfi -i "testsrc2=size=960x640:rate=1" -frames:v 1 "$ROOT/pattern_testsrc2_01.png"
echo "OK: synthetic corpus under $ROOT"
