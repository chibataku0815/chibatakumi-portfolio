// Grid audio → film-post wiring. 1 input → 1 param canon, declared via
// defineAudioWiring<GridParam>(). ElectricFilmSignals (strikeFlag, flickerIntensity,
// glowMix, rgbSplitBump) live outside this wiring — they are non-audio scene
// signals composed on top of the audio-reactive baseline inside createFilmConfig.
//
// Coefficient values were previously exposed as CANON_FILM_AUDIO_WIRES from
// webgpu-motion-art/film-stock.ts. They are restated here so the wire intent
// and literal coefficients live together as the single source of truth.

import { defineAudioWiring } from "webgpu-motion-audio";

export type GridParam =
  | "film.bloom.threshold"
  | "film.bloom.intensity"
  | "film.tonemap.compression";

export const GRID_WIRING = defineAudioWiring<GridParam>()([
  {
    param: "film.bloom.threshold",
    input: "globalOnset",
    coefficient: -0.45,
    baseline: 0,
    intent: "ビートで発光閾値が瞬間的に下がり、光が滲み出す",
  },
  {
    param: "film.bloom.intensity",
    input: "energy",
    coefficient: 0.9,
    baseline: 0,
    intent: "全体ラウドネスで光の広がりが増す（体温）",
  },
  {
    param: "film.tonemap.compression",
    input: "intensity",
    coefficient: 0.35,
    baseline: 0,
    intent: "長期的な高揚でコントラストが蓄積する（緊張）",
  },
] as const);

export const GRID_AUDIO_DELTA_BUFFER: Record<GridParam, number> = {
  "film.bloom.threshold": 0,
  "film.bloom.intensity": 0,
  "film.tonemap.compression": 0,
};
