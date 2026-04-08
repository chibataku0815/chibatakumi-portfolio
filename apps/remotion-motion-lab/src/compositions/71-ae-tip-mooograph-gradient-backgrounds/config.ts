export type Vec2 = {
  x: number;
  y: number;
};

export type GradientPointConfig = {
  color: string;
  origin: Vec2;
  orbit: Vec2;
  drift: Vec2;
  speed: number;
  phase: number;
  weight: number;
};

export type TurbulencePass = {
  amount: number;
  size: number;
  complexity: number;
  evolutionSpeed: number;
  flow: Vec2;
  seed: number;
};

export type ToneGrade = {
  contrast: number;
  lift: number;
  gamma: number;
  saturation: number;
};

export type OrganicGradientRecipe = {
  label: string;
  note: string;
  baseColor: string;
  points: readonly GradientPointConfig[];
  blendStrength: number;
  turbulence: readonly TurbulencePass[];
  tone: ToneGrade;
  grain: number;
};

export type MarbleRecipe = {
  label: string;
  note: string;
  background: OrganicGradientRecipe;
  colors: readonly string[];
  circleCount: number;
  minRadius: number;
  maxRadius: number;
  seed: number;
  shadowOffsetFactor: number;
  shadowOpacity: number;
  blurAngleDeg: number;
  blurLengthFactor: number;
  blurSamples: number;
  lensStrength: number;
  transformTravelFactor: number;
  turbulence: TurbulencePass;
  surfaceOpacity: number;
  grain: number;
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

const basePoints = [
  {
    color: "#ffd43b",
    origin: { x: 0.08, y: 0.12 },
    orbit: { x: 0.18, y: 0.14 },
    drift: { x: 0.08, y: 0.05 },
    speed: 0.52,
    phase: 0.2,
    weight: 1.1,
  },
  {
    color: "#6ef2ff",
    origin: { x: 0.94, y: 0.18 },
    orbit: { x: 0.18, y: 0.16 },
    drift: { x: 0.06, y: 0.08 },
    speed: 0.46,
    phase: 1.3,
    weight: 1.05,
  },
  {
    color: "#375dff",
    origin: { x: 0.88, y: 0.92 },
    orbit: { x: 0.16, y: 0.12 },
    drift: { x: 0.07, y: 0.08 },
    speed: 0.58,
    phase: 2.2,
    weight: 1.0,
  },
  {
    color: "#ff5cb8",
    origin: { x: 0.14, y: 0.86 },
    orbit: { x: 0.18, y: 0.18 },
    drift: { x: 0.09, y: 0.07 },
    speed: 0.49,
    phase: 3.4,
    weight: 1.08,
  },
] as const;

export const basicGradientRecipe: OrganicGradientRecipe = {
  label: "Method 01",
  note: "4-color gradient + bulge-like turbulence + tone shaping",
  baseColor: "#120f17",
  points: basePoints,
  blendStrength: 0.34,
  turbulence: [
    {
      amount: 135,
      size: 100,
      complexity: 2,
      evolutionSpeed: 0.9,
      flow: { x: 0.08, y: -0.04 },
      seed: 11,
    },
  ],
  tone: {
    contrast: 1.18,
    lift: -0.04,
    gamma: 0.94,
    saturation: 1.12,
  },
  grain: 0.16,
};

export const smokeGradientRecipe: OrganicGradientRecipe = {
  label: "Method 02",
  note: "same 4-point base with two turbulence passes for vapor drift",
  baseColor: "#14162a",
  points: [
    {
      color: "#ffe1a0",
      origin: { x: 0.16, y: 0.18 },
      orbit: { x: 0.16, y: 0.1 },
      drift: { x: 0.07, y: 0.06 },
      speed: 0.22,
      phase: 0.1,
      weight: 1.08,
    },
    {
      color: "#78e4f8",
      origin: { x: 0.86, y: 0.24 },
      orbit: { x: 0.14, y: 0.14 },
      drift: { x: 0.06, y: 0.08 },
      speed: 0.2,
      phase: 1.4,
      weight: 1.02,
    },
    {
      color: "#6b58ff",
      origin: { x: 0.84, y: 0.82 },
      orbit: { x: 0.15, y: 0.12 },
      drift: { x: 0.07, y: 0.06 },
      speed: 0.29,
      phase: 2.4,
      weight: 0.98,
    },
    {
      color: "#d383ff",
      origin: { x: 0.18, y: 0.82 },
      orbit: { x: 0.16, y: 0.16 },
      drift: { x: 0.07, y: 0.07 },
      speed: 0.24,
      phase: 3.1,
      weight: 1.1,
    },
  ],
  blendStrength: 0.36,
  turbulence: [
    {
      amount: 350,
      size: 30,
      complexity: 3,
      evolutionSpeed: 1.1,
      flow: { x: 0.12, y: 0.01 },
      seed: 21,
    },
    {
      amount: 150,
      size: 100,
      complexity: 7,
      evolutionSpeed: 0.82,
      flow: { x: -0.07, y: -0.08 },
      seed: 29,
    },
  ],
  tone: {
    contrast: 1.14,
    lift: -0.03,
    gamma: 0.96,
    saturation: 1.08,
  },
  grain: 0.12,
};

export const marbleRecipe: MarbleRecipe = {
  label: "Method 03",
  note: "circle field + directional blur + lens warp + smooth displacement",
  background: {
    ...basicGradientRecipe,
    baseColor: "#0c1019",
    tone: {
      contrast: 1.08,
      lift: -0.02,
      gamma: 0.96,
      saturation: 1.02,
    },
    grain: 0.12,
  },
  colors: ["#79f0ff", "#ffd665", "#4a79ff", "#ff7cc2", "#8ff0c8"],
  circleCount: 26,
  minRadius: 34,
  maxRadius: 104,
  seed: 71,
  shadowOffsetFactor: 50 / 1920,
  shadowOpacity: 0.3,
  blurAngleDeg: 135,
  blurLengthFactor: 520 / 1920,
  blurSamples: 12,
  lensStrength: 0.42,
  transformTravelFactor: 0.28,
  turbulence: {
    amount: 96,
    size: 108,
    complexity: 3,
    evolutionSpeed: 0.82,
    flow: { x: 0.06, y: -0.04 },
    seed: 43,
  },
  surfaceOpacity: 0.96,
  grain: 0.14,
};

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
    title: "Marble Sheet",
    recipe: marbleRecipe,
  },
] as const;
