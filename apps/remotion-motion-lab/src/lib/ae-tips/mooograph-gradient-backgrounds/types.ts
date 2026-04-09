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

export type FlowDisplacePass = {
  amount: number;
  size: number;
  complexity: number;
  evolutionSpeed: number;
  flow: Vec2;
  seed: number;
};

export type TurbulencePass = FlowDisplacePass;

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
  turbulence: readonly FlowDisplacePass[];
  tone: ToneGrade;
  grain: number;
};

export type VaporCompositeParams = {
  density: number;
  densityBias: number;
  plumeScale: number;
  plumeSoftness: number;
  center: Vec2;
  plumeStretch: number;
  plumeWidth: number;
  headStrength: number;
  fiberScale: number;
  fiberStrength: number;
  edgeGain: number;
  opacity: number;
  highlightStrength: number;
  shadowStrength: number;
  tintMix: number;
  flow: Vec2;
  seed: number;
};

export type MooographBasicPreset = OrganicGradientRecipe;

export type MooographSmokePreset = OrganicGradientRecipe & {
  turbulence: readonly [FlowDisplacePass, FlowDisplacePass];
  vapor: VaporCompositeParams;
  highlightTint: string;
};

export type MarbleRibbonControlPoint = {
  position: Vec2;
  halfWidth: number;
  tangentBias: Vec2;
  colorMix: number;
};

export type MarbleRibbonShape = {
  kind: "ribbon";
  seed: number;
  controlPointCount: number;
  controlPoints: readonly MarbleRibbonControlPoint[];
  widthMin: number;
  widthMax: number;
  spineJitter: number;
  crossJitter: number;
  endTaper: number;
  coverage: number;
  colorDrift: number;
};

export type MarbleWarpParams = {
  stretch: number;
  widthScale: number;
  blurAngleDeg: number;
  blurLengthFactor: number;
  blurSamples: number;
  lensStrength: number;
  travelFactor: number;
  turbulence: FlowDisplacePass;
};

export type MarbleSurfaceParams = {
  opacity: number;
  thicknessGain: number;
  refractionStrength: number;
  fresnelStrength: number;
  highlightSharpness: number;
  shadowDensity: number;
};

export type MarbleRecipe = {
  label: string;
  note: string;
  background: OrganicGradientRecipe;
  palette: readonly string[];
  shape: MarbleRibbonShape;
  warp: MarbleWarpParams;
  surface: MarbleSurfaceParams;
  grain: number;
};

export type MooographMarblePreset = MarbleRecipe;

export type MooographPreset =
  | MooographBasicPreset
  | MooographSmokePreset
  | MooographMarblePreset;
