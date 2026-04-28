import {
  compileCurrentHeroWordPattern,
  CURRENT_HERO_WORD_PATTERN_ID,
} from "./current-hero-word-pattern";
import {
  compileAnchorSpreadHeroWordPattern,
  ANCHOR_SPREAD_HERO_WORD_PATTERN_ID,
} from "./anchor-spread-hero-word-pattern";
import {
  compileCenterOutHeroWordPattern,
  CENTER_OUT_HERO_WORD_PATTERN_ID,
} from "./center-out-hero-word-pattern";
import {
  compileStaggerSnapHeroWordPattern,
  STAGGER_SNAP_HERO_WORD_PATTERN_ID,
} from "./stagger-snap-hero-word-pattern";
import {
  compileOutlineFillHeroWordPattern,
  OUTLINE_FILL_HERO_WORD_PATTERN_ID,
} from "./outline-fill-hero-word-pattern";
import {
  compileWhiteWipeHeroWordPattern,
  WHITE_WIPE_HERO_WORD_PATTERN_ID,
} from "./white-wipe-hero-word-pattern";
import {
  compileOvershootCompressHeroWordPattern,
  OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID,
} from "./overshoot-compress-hero-word-pattern";
import {
  compileScreenSlamHeroWordPattern,
  SCREEN_SLAM_HERO_WORD_PATTERN_ID,
} from "./screen-slam-hero-word-pattern";
import type {
  CompiledTypographyPhrase,
  ElectricTickerCharacter,
  TypographyGridLayout,
} from "./hero-word-pattern-shared";
import {
  orderByAnchorDistance,
  orderByBilateralOvershoot,
  orderByBoundaryThenInterior,
  orderByCenterOutDistance,
  orderByFinalX,
  orderByScatter,
  orderByStagger3Band,
} from "./hero-word-pattern-shared";

export type HeroWordPatternId =
  | typeof CURRENT_HERO_WORD_PATTERN_ID
  | typeof ANCHOR_SPREAD_HERO_WORD_PATTERN_ID
  | typeof CENTER_OUT_HERO_WORD_PATTERN_ID
  | typeof STAGGER_SNAP_HERO_WORD_PATTERN_ID
  | typeof OUTLINE_FILL_HERO_WORD_PATTERN_ID
  | typeof WHITE_WIPE_HERO_WORD_PATTERN_ID
  | typeof OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID
  | typeof SCREEN_SLAM_HERO_WORD_PATTERN_ID;

type HeroWordPatternCompiler = (
  grid: TypographyGridLayout,
  token: string,
) => CompiledTypographyPhrase;

export const HERO_WORD_PATTERN_IDS: readonly HeroWordPatternId[] = [
  CURRENT_HERO_WORD_PATTERN_ID,
  ANCHOR_SPREAD_HERO_WORD_PATTERN_ID,
  CENTER_OUT_HERO_WORD_PATTERN_ID,
  STAGGER_SNAP_HERO_WORD_PATTERN_ID,
  OUTLINE_FILL_HERO_WORD_PATTERN_ID,
  WHITE_WIPE_HERO_WORD_PATTERN_ID,
  OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID,
  SCREEN_SLAM_HERO_WORD_PATTERN_ID,
];

export const DEFAULT_HERO_WORD_PATTERN_ID = CURRENT_HERO_WORD_PATTERN_ID;

const HERO_WORD_PATTERN_COMPILERS: Readonly<Record<HeroWordPatternId, HeroWordPatternCompiler>> = {
  [CURRENT_HERO_WORD_PATTERN_ID]: compileCurrentHeroWordPattern,
  [ANCHOR_SPREAD_HERO_WORD_PATTERN_ID]: compileAnchorSpreadHeroWordPattern,
  [CENTER_OUT_HERO_WORD_PATTERN_ID]: compileCenterOutHeroWordPattern,
  [STAGGER_SNAP_HERO_WORD_PATTERN_ID]: compileStaggerSnapHeroWordPattern,
  [OUTLINE_FILL_HERO_WORD_PATTERN_ID]: compileOutlineFillHeroWordPattern,
  [WHITE_WIPE_HERO_WORD_PATTERN_ID]: compileWhiteWipeHeroWordPattern,
  [OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID]: compileOvershootCompressHeroWordPattern,
  [SCREEN_SLAM_HERO_WORD_PATTERN_ID]: compileScreenSlamHeroWordPattern,
};

export function compileHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
  patternId: HeroWordPatternId = DEFAULT_HERO_WORD_PATTERN_ID,
): CompiledTypographyPhrase {
  const compiler = HERO_WORD_PATTERN_COMPILERS[patternId];
  if (!compiler) {
    throw new Error(`Unsupported hero word pattern: ${patternId}`);
  }

  return compiler(grid, token);
}

export function compileDefaultHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  return compileHeroWordPattern(grid, token, DEFAULT_HERO_WORD_PATTERN_ID);
}

export const ELECTRIC_TICKER_CHARACTERS: Readonly<Record<HeroWordPatternId, ElectricTickerCharacter>> = {
  [CURRENT_HERO_WORD_PATTERN_ID]: {
    template: "sequential",
    delayOrderer: orderByFinalX,
    strikeAxis: "horizontal",
    flickerMode: "chain",
    scrollDirection: "RtoL",
    chargeDuration: 0.20,
    strikeDuration: 0.15,
    glowDuration: 0.75,
    settleDuration: 0.40,
    flickerFreq: 24,
    flickerAmp: 0.08,
    displacementAmp: 0.05,
    yOffsetAmp: 0,
    rgbSplitBump: 0,
    zoomPush: 0,
    bgFlashIntensity: 0.08,
    gridPulseSync: "none",
  },
  [ANCHOR_SPREAD_HERO_WORD_PATTERN_ID]: {
    template: "spatial",
    delayOrderer: orderByAnchorDistance,
    strikeAxis: "radial",
    flickerMode: "burst",
    scrollDirection: "RtoL",
    chargeDuration: 0.12,
    strikeDuration: 0.35,
    glowDuration: 0.60,
    settleDuration: 0.43,
    flickerFreq: 40,
    flickerAmp: 0.18,
    displacementAmp: 0.25,
    yOffsetAmp: 1.0,
    rgbSplitBump: 0.8,
    zoomPush: 0.04,
    bgFlashIntensity: 0.15,
    gridPulseSync: "radial",
  },
  [CENTER_OUT_HERO_WORD_PATTERN_ID]: {
    template: "spatial",
    delayOrderer: orderByCenterOutDistance,
    strikeAxis: "horizontal",
    flickerMode: "burst",
    scrollDirection: "centerOut",
    chargeDuration: 0.14,
    strikeDuration: 0.30,
    glowDuration: 0.60,
    settleDuration: 0.46,
    flickerFreq: 50,
    flickerAmp: 0.20,
    displacementAmp: 0.30,
    yOffsetAmp: 0,
    rgbSplitBump: 1.0,
    zoomPush: 0.06,
    bgFlashIntensity: 0.18,
    gridPulseSync: "horizontal",
  },
  [STAGGER_SNAP_HERO_WORD_PATTERN_ID]: {
    template: "sequential",
    delayOrderer: orderByStagger3Band,
    strikeAxis: "vertical",
    flickerMode: "chain",
    scrollDirection: "RtoL",
    chargeDuration: 0.10,
    strikeDuration: 0.20,
    glowDuration: 0.70,
    settleDuration: 0.50,
    flickerFreq: 45,
    flickerAmp: 0.15,
    displacementAmp: 0,
    yOffsetAmp: 1.5,
    rgbSplitBump: 1.2,
    zoomPush: 0.02,
    bgFlashIntensity: 0.10,
    gridPulseSync: "tier",
  },
  [OUTLINE_FILL_HERO_WORD_PATTERN_ID]: {
    template: "sequential",
    delayOrderer: orderByBoundaryThenInterior,
    strikeAxis: "radial",
    flickerMode: "chain",
    scrollDirection: "RtoL",
    chargeDuration: 0.18,
    strikeDuration: 0.22,
    glowDuration: 0.60,
    settleDuration: 0.50,
    flickerFreq: 40,
    flickerAmp: 0.12,
    displacementAmp: 0.15,
    yOffsetAmp: 0,
    rgbSplitBump: 0.4,
    zoomPush: 0,
    bgFlashIntensity: 0.12,
    gridPulseSync: "radial",
  },
  [WHITE_WIPE_HERO_WORD_PATTERN_ID]: {
    template: "sequential",
    delayOrderer: orderByFinalX,
    strikeAxis: "horizontal",
    flickerMode: "wipe",
    scrollDirection: "RtoL",
    chargeDuration: 0.10,
    strikeDuration: 0.25,
    glowDuration: 0.65,
    settleDuration: 0.50,
    flickerFreq: 60,
    flickerAmp: 0.18,
    displacementAmp: 0.12,
    yOffsetAmp: 0,
    rgbSplitBump: 0.6,
    zoomPush: 0.03,
    bgFlashIntensity: 0.10,
    gridPulseSync: "column",
  },
  [OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID]: {
    template: "spatial",
    delayOrderer: orderByBilateralOvershoot,
    strikeAxis: "horizontal",
    flickerMode: "burst",
    scrollDirection: "bilateral",
    chargeDuration: 0.10,
    strikeDuration: 0.28,
    glowDuration: 0.55,
    settleDuration: 0.57,
    flickerFreq: 35,
    flickerAmp: 0.20,
    displacementAmp: 0.50,
    yOffsetAmp: 0,
    rgbSplitBump: 1.5,
    zoomPush: 0.08,
    bgFlashIntensity: 0.22,
    gridPulseSync: "radial",
  },
  [SCREEN_SLAM_HERO_WORD_PATTERN_ID]: {
    template: "spatial",
    delayOrderer: orderByScatter,
    strikeAxis: "radial",
    flickerMode: "scatter",
    scrollDirection: "scatter",
    chargeDuration: 0.08,
    strikeDuration: 0.35,
    glowDuration: 0.57,
    settleDuration: 0.50,
    flickerFreq: 70,
    flickerAmp: 0.25,
    displacementAmp: 3.0,
    yOffsetAmp: 3.0,
    rgbSplitBump: 2.5,
    zoomPush: 0.15,
    bgFlashIntensity: 0.40,
    gridPulseSync: "full",
  },
};
