// Flowline audio → compute/ribbon/film-post wiring. 1 input → 1 param canon,
// declared via defineAudioWiring<FlowlineParam>().
//
// Phase 10 post-tune (2026-04-18): coefficients raised 2-3× across the board
// after M4 review flagged reactions as "保守的すぎる". Grid's film canon was
// designed for architectural stillness; flowline is fluid motion and tolerates
// (needs) bigger swings. Also adds grain + chroma wires so film reads
// dynamically on hats and snares rather than bloom-only.

import { defineAudioWiring } from "webgpu-motion-audio";
import type { FlowlineParam } from "./params";

export const FLOWLINE_WIRING = defineAudioWiring<FlowlineParam>()([
  {
    param: "field.breathStrength",
    input: "bass",
    coefficient: 1.8,
    baseline: 0,
    intent: "低域で場全体が呼吸する — ribbon 幅と速度が膨らむ（flow 最大 2.8 倍）",
  },
  {
    param: "field.vorticityPulse",
    input: "bassOnset",
    coefficient: 2.8,
    baseline: 0,
    intent: "キックで渦が一瞬強まる — AttractorKnot でスピン kick、Turbulent でも旋回発生",
  },
  {
    param: "trail.rimPulse",
    input: "trebleOnset",
    coefficient: 1.6,
    baseline: 0,
    intent: "ハイハットで trail の先端が研がれる — 新鮮な点が強く光る",
  },
  {
    param: "film.bloom.threshold",
    input: "globalOnset",
    coefficient: -0.75,
    baseline: 0,
    intent: "ビートで発光閾値が深く沈み、光が大きく滲み出す",
  },
  {
    param: "film.bloom.intensity",
    input: "energy",
    coefficient: 1.6,
    baseline: 0,
    intent: "全体ラウドネスで光量が強く広がる（体温）",
  },
  {
    param: "film.tonemap.compression",
    input: "intensity",
    coefficient: 0.70,
    baseline: 0,
    intent: "長期高揚でコントラストが深く蓄積する（緊張）",
  },
  {
    param: "film.grain.intensity",
    input: "trebleOnset",
    coefficient: 0.55,
    baseline: 0,
    intent: "ハットで粒子感が強く跳ね上がる（film texture response、ベース 0.18 に +0.55s 上乗せ）",
  },
  {
    param: "film.chroma.amount",
    input: "midOnset",
    coefficient: 0.014,
    baseline: 0,
    intent: "スネア/ミッド transient で色収差が瞬間的に増える",
  },
] as const);

export const FLOWLINE_AUDIO_DELTA_BUFFER: Record<FlowlineParam, number> = {
  "field.breathStrength": 0,
  "field.vorticityPulse": 0,
  "trail.rimPulse": 0,
  "film.bloom.threshold": 0,
  "film.bloom.intensity": 0,
  "film.tonemap.compression": 0,
  "film.grain.intensity": 0,
  "film.chroma.amount": 0,
};
