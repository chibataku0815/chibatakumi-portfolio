import {
  mooographBasicPreset,
  mooographMarblePreset,
  mooographSmokePreset,
  type GradientPointConfig,
  type MarbleRecipe,
  type OrganicGradientRecipe,
  type ToneGrade,
  type TurbulencePass,
  type Vec2,
} from "../../lib/ae-tips/mooograph-gradient-backgrounds";

export type {
  GradientPointConfig,
  MarbleRecipe,
  OrganicGradientRecipe,
  ToneGrade,
  TurbulencePass,
  Vec2,
};

export const config = {
  id: "AETipMooographGradientBackgrounds",
  label: "AE TIP 71",
  title: "Mooograph Gradient Backgrounds",
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 240,
  background: "#06070b",
  panelInsetX: 56,
  panelTop: 164,
  panelGap: 28,
  panelHeight: 760,
  panelRadius: 30,
  panelPadding: 18,
  panelHeaderHeight: 58,
  panelFooterHeight: 56,
  internalWidth: 420,
  internalHeight: 480,
  headingLabelColor: "#94a8ff",
  headingTitleColor: "#f8f0e6",
  headingBodyColor: "rgba(236,229,219,0.72)",
  panelBackground: "rgba(11,13,20,0.94)",
  panelStroke: "rgba(255,255,255,0.08)",
  panelTitleColor: "#f7efe2",
  panelMetaColor: "rgba(255,255,255,0.44)",
  panelNoteColor: "rgba(238,228,214,0.72)",
  guideColor: "rgba(255,255,255,0.05)",
} as const;

export const panelWidth = Math.floor(
  (config.width - config.panelInsetX * 2 - config.panelGap * 2) / 3,
);

export const panelContentWidth = panelWidth - config.panelPadding * 2;
export const panelContentHeight =
  config.panelHeight -
  config.panelHeaderHeight -
  config.panelFooterHeight -
  config.panelPadding * 2;

export const basicGradientRecipe: OrganicGradientRecipe = mooographBasicPreset;
export const smokeGradientRecipe = mooographSmokePreset;
export const marbleRecipe: MarbleRecipe = mooographMarblePreset;

export const panels = [
  {
    kind: "organic",
    title: "Basic Flow",
    recipe: basicGradientRecipe,
  },
  {
    kind: "smoke",
    title: "Smoke Drift",
    recipe: smokeGradientRecipe,
  },
  {
    kind: "marble",
    title: "Marble Ribbon",
    recipe: marbleRecipe,
  },
] as const;
