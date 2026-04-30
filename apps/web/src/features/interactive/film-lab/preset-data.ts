/**
 * @fileoverview Film Lab の preset utility 互換レイヤー。
 *
 * 概要: 旧 Web / Desktop import path を壊さないため、このファイル名は残す。
 * 仕様: 実装は `film-lab-core` を正本にし、このファイルは public API をそのまま再公開する。
 * 制限: 新しい共有ロジックはここへ追加せず、必ず `film-lab-core` 側に置く。
 */
export {
  PRESETS,
  PRESET_BUTTONS,
  findMatchingPreset,
  halationHueToHex,
  type Params,
  type PresetName,
} from "film-lab-core";
