/**
 * @fileoverview Film Lab の Base Look utility 互換レイヤー。
 *
 * 概要: 旧 Web / Desktop import path を壊さないため、このファイル名は残す。
 * 仕様: 実装は `film-lab-core` を正本にし、このファイルは public API をそのまま再公開する。
 *       Preset → Look canonical direction 反転 (2026-05-04) に伴い、Base Look canonical 名を
 *       primary に、Preset 名を deprecated alias として並列 export する。
 * 制限: 新しい共有ロジックはここへ追加せず、必ず `film-lab-core` 側に置く。
 */
export {
  // Base Look canonical
  BASE_LOOKS,
  BASE_LOOK_BUTTONS,
  findMatchingBaseLook,
  halationHueToHex,
  type Params,
  type BaseLookName,
  // Deprecated Preset-named aliases (legacy)
  PRESETS,
  PRESET_BUTTONS,
  findMatchingPreset,
  type PresetName,
} from "film-lab-core";
