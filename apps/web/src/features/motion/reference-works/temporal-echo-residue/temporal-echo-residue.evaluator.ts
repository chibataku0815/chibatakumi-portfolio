import type { TextStyleFontWeight } from "pixi.js";
import { temporalEchoResidueConfig } from "./temporal-echo-residue.config";
import {
  evaluateTemporalEchoResidueEchoes,
  type TemporalEchoPose,
} from "./temporal-echo-residue-family";

type CueOrientation = "vertical" | "horizontal";
type CueWorld = "cool" | "warm";

type CueDefinition = {
  id: string;
  text: string;
  orientation: CueOrientation;
  world: CueWorld;
  fontSize: number;
  fontWeight: TextStyleFontWeight;
  glyphGap: number;
  startFrame: number;
  entryFrames: number;
  holdFrames: number;
  releaseFrames: number;
  anchorX: number;
  anchorY: number;
  entryOffsetX: number;
  entryOffsetY: number;
  releaseOffsetX: number;
  releaseOffsetY: number;
  driftX: number;
  driftY: number;
  rotation: number;
  rotationSwing: number;
  scaleFrom: number;
  scaleTo: number;
  stretchAmount: number;
  outlineAlpha: number;
  fillAlpha: number;
  glowAlpha: number;
  echoAlphaBoost: number;
  phaseSeed: number;
};

type CueTransform = Omit<TemporalEchoPose, "speed"> & {
  alpha: number;
  outlineAlpha: number;
  fillAlpha: number;
  glowAlpha: number;
};

export type TemporalEchoResidueCueState = {
  id: string;
  text: string;
  orientation: CueOrientation;
  world: CueWorld;
  fontSize: number;
  fontWeight: TextStyleFontWeight;
  glyphGap: number;
  alpha: number;
  outlineAlpha: number;
  fillAlpha: number;
  glowAlpha: number;
  echoAlphaBoost: number;
  lead: TemporalEchoPose;
  echoes: Array<
    TemporalEchoPose & {
      alpha: number;
      frameOffset: number;
      decay: number;
      index: number;
    }
  >;
};

export type TemporalEchoResidueFrameState = {
  frame: number;
  time: number;
  progress: number;
  cues: TemporalEchoResidueCueState[];
  worldMix: number;
  topHaloX: number;
  topHaloY: number;
  topHaloRadius: number;
  circleAlpha: number;
  petalAlpha: number;
  petalSpin: number;
  waterArcAlpha: number;
  waterArcProgress: number;
  stageFade: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function inverseLerp(value: number, start: number, end: number) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  return clamp01((value - start) / (end - start));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function easeInCubic(value: number) {
  return value ** 3;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - (-2 * value + 2) ** 3 / 2;
}

const cueDefinitions: CueDefinition[] = [
  {
    id: "outline-chi",
    text: "ち",
    orientation: "vertical",
    world: "cool",
    fontSize: 122,
    fontWeight: "500",
    glyphGap: 0.92,
    startFrame: -8,
    entryFrames: 8,
    holdFrames: 8,
    releaseFrames: 10,
    anchorX: 485,
    anchorY: 360,
    entryOffsetX: 0,
    entryOffsetY: 26,
    releaseOffsetX: 0,
    releaseOffsetY: -12,
    driftX: 2.4,
    driftY: 3.4,
    rotation: -0.04,
    rotationSwing: 0.03,
    scaleFrom: 0.94,
    scaleTo: 1,
    stretchAmount: 0.04,
    outlineAlpha: 0.88,
    fillAlpha: 0.12,
    glowAlpha: 0.28,
    echoAlphaBoost: 1,
    phaseSeed: 0,
  },
  {
    id: "stack-chihaya",
    text: "ちはや",
    orientation: "vertical",
    world: "cool",
    fontSize: 76,
    fontWeight: "500",
    glyphGap: 0.88,
    startFrame: 6,
    entryFrames: 12,
    holdFrames: 12,
    releaseFrames: 12,
    anchorX: 446,
    anchorY: 138,
    entryOffsetX: 0,
    entryOffsetY: 38,
    releaseOffsetX: -10,
    releaseOffsetY: -6,
    driftX: 3.6,
    driftY: 5,
    rotation: -0.05,
    rotationSwing: 0.04,
    scaleFrom: 0.94,
    scaleTo: 1,
    stretchAmount: 0.05,
    outlineAlpha: 0.7,
    fillAlpha: 0.18,
    glowAlpha: 0.26,
    echoAlphaBoost: 0.88,
    phaseSeed: 11,
  },
  {
    id: "blue-buru",
    text: "ぶる",
    orientation: "vertical",
    world: "cool",
    fontSize: 66,
    fontWeight: "500",
    glyphGap: 0.9,
    startFrame: 10,
    entryFrames: 12,
    holdFrames: 12,
    releaseFrames: 12,
    anchorX: 172,
    anchorY: 276,
    entryOffsetX: 10,
    entryOffsetY: 24,
    releaseOffsetX: 8,
    releaseOffsetY: 10,
    driftX: 4.5,
    driftY: 5.2,
    rotation: 0.1,
    rotationSwing: 0.06,
    scaleFrom: 0.92,
    scaleTo: 1,
    stretchAmount: 0.06,
    outlineAlpha: 0.6,
    fillAlpha: 0.16,
    glowAlpha: 0.22,
    echoAlphaBoost: 0.82,
    phaseSeed: 23,
  },
  {
    id: "cluster-shindai",
    text: "神代",
    orientation: "vertical",
    world: "cool",
    fontSize: 94,
    fontWeight: "600",
    glyphGap: 0.92,
    startFrame: 34,
    entryFrames: 14,
    holdFrames: 14,
    releaseFrames: 18,
    anchorX: 520,
    anchorY: 138,
    entryOffsetX: 0,
    entryOffsetY: 42,
    releaseOffsetX: 0,
    releaseOffsetY: -10,
    driftX: 4.8,
    driftY: 5.4,
    rotation: -0.02,
    rotationSwing: 0.03,
    scaleFrom: 0.93,
    scaleTo: 1.04,
    stretchAmount: 0.07,
    outlineAlpha: 0.78,
    fillAlpha: 0.9,
    glowAlpha: 0.62,
    echoAlphaBoost: 1.12,
    phaseSeed: 31,
  },
  {
    id: "cluster-mokikazu",
    text: "もきかず",
    orientation: "vertical",
    world: "cool",
    fontSize: 40,
    fontWeight: "500",
    glyphGap: 0.92,
    startFrame: 40,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 18,
    anchorX: 528,
    anchorY: 250,
    entryOffsetX: 0,
    entryOffsetY: 36,
    releaseOffsetX: -6,
    releaseOffsetY: 8,
    driftX: 3.2,
    driftY: 4.2,
    rotation: 0.02,
    rotationSwing: 0.05,
    scaleFrom: 0.94,
    scaleTo: 1,
    stretchAmount: 0.05,
    outlineAlpha: 0.72,
    fillAlpha: 0.42,
    glowAlpha: 0.24,
    echoAlphaBoost: 0.94,
    phaseSeed: 41,
  },
  {
    id: "cluster-bu",
    text: "ぶ",
    orientation: "vertical",
    world: "cool",
    fontSize: 56,
    fontWeight: "500",
    glyphGap: 0.88,
    startFrame: 40,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 16,
    anchorX: 144,
    anchorY: 248,
    entryOffsetX: -24,
    entryOffsetY: 10,
    releaseOffsetX: 16,
    releaseOffsetY: 8,
    driftX: 3.6,
    driftY: 3.2,
    rotation: -0.08,
    rotationSwing: 0.05,
    scaleFrom: 0.92,
    scaleTo: 1,
    stretchAmount: 0.05,
    outlineAlpha: 0.56,
    fillAlpha: 0.12,
    glowAlpha: 0.14,
    echoAlphaBoost: 0.78,
    phaseSeed: 51,
  },
  {
    id: "cluster-ru",
    text: "る",
    orientation: "vertical",
    world: "cool",
    fontSize: 48,
    fontWeight: "500",
    glyphGap: 0.88,
    startFrame: 44,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 16,
    anchorX: 294,
    anchorY: 336,
    entryOffsetX: -12,
    entryOffsetY: 8,
    releaseOffsetX: 10,
    releaseOffsetY: 6,
    driftX: 3.1,
    driftY: 3.2,
    rotation: -0.14,
    rotationSwing: 0.04,
    scaleFrom: 0.93,
    scaleTo: 1,
    stretchAmount: 0.04,
    outlineAlpha: 0.54,
    fillAlpha: 0.12,
    glowAlpha: 0.14,
    echoAlphaBoost: 0.76,
    phaseSeed: 53,
  },
  {
    id: "cluster-chi",
    text: "ち",
    orientation: "vertical",
    world: "cool",
    fontSize: 48,
    fontWeight: "500",
    glyphGap: 0.88,
    startFrame: 36,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 16,
    anchorX: 806,
    anchorY: 104,
    entryOffsetX: 18,
    entryOffsetY: -18,
    releaseOffsetX: 8,
    releaseOffsetY: -12,
    driftX: 3,
    driftY: 3.2,
    rotation: 0.12,
    rotationSwing: 0.04,
    scaleFrom: 0.93,
    scaleTo: 1,
    stretchAmount: 0.04,
    outlineAlpha: 0.54,
    fillAlpha: 0.1,
    glowAlpha: 0.12,
    echoAlphaBoost: 0.74,
    phaseSeed: 59,
  },
  {
    id: "cluster-ha",
    text: "は",
    orientation: "vertical",
    world: "cool",
    fontSize: 42,
    fontWeight: "500",
    glyphGap: 0.88,
    startFrame: 42,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 16,
    anchorX: 812,
    anchorY: 208,
    entryOffsetX: 22,
    entryOffsetY: 4,
    releaseOffsetX: 10,
    releaseOffsetY: 10,
    driftX: 3,
    driftY: 3.1,
    rotation: 0.08,
    rotationSwing: 0.04,
    scaleFrom: 0.93,
    scaleTo: 1,
    stretchAmount: 0.04,
    outlineAlpha: 0.52,
    fillAlpha: 0.1,
    glowAlpha: 0.12,
    echoAlphaBoost: 0.72,
    phaseSeed: 61,
  },
  {
    id: "cluster-ya",
    text: "や",
    orientation: "vertical",
    world: "cool",
    fontSize: 54,
    fontWeight: "500",
    glyphGap: 0.88,
    startFrame: 46,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 16,
    anchorX: 730,
    anchorY: 302,
    entryOffsetX: 14,
    entryOffsetY: 12,
    releaseOffsetX: 10,
    releaseOffsetY: 12,
    driftX: 3.2,
    driftY: 3.3,
    rotation: 0.1,
    rotationSwing: 0.04,
    scaleFrom: 0.93,
    scaleTo: 1,
    stretchAmount: 0.04,
    outlineAlpha: 0.52,
    fillAlpha: 0.1,
    glowAlpha: 0.12,
    echoAlphaBoost: 0.72,
    phaseSeed: 67,
  },
  {
    id: "circle-name",
    text: "竜田川",
    orientation: "horizontal",
    world: "cool",
    fontSize: 56,
    fontWeight: "500",
    glyphGap: 0.92,
    startFrame: 84,
    entryFrames: 12,
    holdFrames: 20,
    releaseFrames: 18,
    anchorX: 480,
    anchorY: 276,
    entryOffsetX: 0,
    entryOffsetY: 12,
    releaseOffsetX: 0,
    releaseOffsetY: -10,
    driftX: 1.6,
    driftY: 2,
    rotation: 0,
    rotationSwing: 0.02,
    scaleFrom: 0.98,
    scaleTo: 1,
    stretchAmount: 0.03,
    outlineAlpha: 0.74,
    fillAlpha: 0.24,
    glowAlpha: 0.22,
    echoAlphaBoost: 0.96,
    phaseSeed: 71,
  },
  {
    id: "warm-phrase",
    text: "からくれなゐに",
    orientation: "horizontal",
    world: "warm",
    fontSize: 34,
    fontWeight: "500",
    glyphGap: 0.86,
    startFrame: 132,
    entryFrames: 12,
    holdFrames: 16,
    releaseFrames: 16,
    anchorX: 618,
    anchorY: 278,
    entryOffsetX: -52,
    entryOffsetY: 0,
    releaseOffsetX: 34,
    releaseOffsetY: 0,
    driftX: 3,
    driftY: 1.8,
    rotation: -0.02,
    rotationSwing: 0.02,
    scaleFrom: 0.96,
    scaleTo: 1,
    stretchAmount: 0.03,
    outlineAlpha: 0.78,
    fillAlpha: 0.52,
    glowAlpha: 0.3,
    echoAlphaBoost: 1.08,
    phaseSeed: 83,
  },
  {
    id: "warm-water",
    text: "水くくるとは",
    orientation: "vertical",
    world: "warm",
    fontSize: 84,
    fontWeight: "600",
    glyphGap: 0.92,
    startFrame: 172,
    entryFrames: 20,
    holdFrames: 44,
    releaseFrames: 28,
    anchorX: 86,
    anchorY: 276,
    entryOffsetX: 0,
    entryOffsetY: -88,
    releaseOffsetX: 0,
    releaseOffsetY: 18,
    driftX: 4.2,
    driftY: 5.6,
    rotation: 0,
    rotationSwing: 0.02,
    scaleFrom: 0.9,
    scaleTo: 1.03,
    stretchAmount: 0.06,
    outlineAlpha: 0.82,
    fillAlpha: 0.94,
    glowAlpha: 0.6,
    echoAlphaBoost: 1.2,
    phaseSeed: 97,
  },
];

function cueDuration(cue: CueDefinition) {
  return cue.entryFrames + cue.holdFrames + cue.releaseFrames;
}

function evaluateCueTransform(cue: CueDefinition, frame: number): CueTransform {
  const localFrame = frame - cue.startFrame;
  const total = cueDuration(cue);
  const entryProgress = inverseLerp(localFrame, 0, cue.entryFrames);
  const releaseStart = cue.entryFrames + cue.holdFrames;
  const releaseProgress = inverseLerp(localFrame, releaseStart, total);
  const appear = easeOutCubic(entryProgress);
  const releaseEase = easeInCubic(releaseProgress);
  const alpha = appear * (1 - releaseEase);
  const driftMix = 0.18 + alpha * 0.82;
  const wobble = Math.sin((frame + cue.phaseSeed) * 0.09);
  const wobbleSecondary = Math.cos((frame + cue.phaseSeed * 0.5) * 0.065);
  const scale = mix(cue.scaleFrom, cue.scaleTo, appear) * mix(1, 0.98, releaseEase);

  return {
    x:
      cue.anchorX +
      mix(cue.entryOffsetX, 0, appear) +
      cue.releaseOffsetX * releaseEase +
      wobble * cue.driftX * driftMix,
    y:
      cue.anchorY +
      mix(cue.entryOffsetY, 0, appear) +
      cue.releaseOffsetY * releaseEase +
      wobbleSecondary * cue.driftY * driftMix,
    rotation:
      cue.rotation +
      wobble * cue.rotationSwing * driftMix +
      cue.rotationSwing * 0.38 * releaseEase,
    scale,
    stretchX: 1 + wobbleSecondary * cue.stretchAmount * driftMix,
    stretchY: 1 - wobbleSecondary * cue.stretchAmount * 0.78 * driftMix,
    alpha,
    outlineAlpha: cue.outlineAlpha,
    fillAlpha: cue.fillAlpha,
    glowAlpha: cue.glowAlpha,
  };
}

function evaluateCuePose(cue: CueDefinition, frame: number): TemporalEchoPose {
  const current = evaluateCueTransform(cue, frame);
  const previous = evaluateCueTransform(cue, frame - 1);

  return {
    x: current.x,
    y: current.y,
    rotation: current.rotation,
    scale: current.scale,
    stretchX: current.stretchX,
    stretchY: current.stretchY,
    speed: Math.hypot(current.x - previous.x, current.y - previous.y),
  };
}

function evaluateCueState(
  cue: CueDefinition,
  frame: number,
): TemporalEchoResidueCueState | null {
  const transform = evaluateCueTransform(cue, frame);

  if (transform.alpha <= 0.01) {
    return null;
  }

  const lead = evaluateCuePose(cue, frame);
  const echoes = evaluateTemporalEchoResidueEchoes({
    frame,
    leadPose: lead,
    evaluatePose: (sampleFrame) => evaluateCuePose(cue, sampleFrame),
    sampleCount: temporalEchoResidueConfig.echo.sampleCount,
    baseFrameStep: temporalEchoResidueConfig.echo.baseFrameStep,
    taper: temporalEchoResidueConfig.echo.taper,
    maxAlpha: temporalEchoResidueConfig.echo.maxAlpha,
    minimumLeadSpeed: temporalEchoResidueConfig.echo.minimumLeadSpeed,
    minimumLeadDistance: temporalEchoResidueConfig.echo.minimumLeadDistance,
    minimumSampleSpacing: temporalEchoResidueConfig.echo.minimumSampleSpacing,
    idealSampleSpacing: temporalEchoResidueConfig.echo.idealSampleSpacing,
  })
    .map((sample) => ({
      ...sample,
      alpha: sample.alpha * transform.alpha * cue.echoAlphaBoost,
    }))
    .filter((sample) => sample.alpha >= 0.018);

  return {
    id: cue.id,
    text: cue.text,
    orientation: cue.orientation,
    world: cue.world,
    fontSize: cue.fontSize,
    fontWeight: cue.fontWeight,
    glyphGap: cue.glyphGap,
    alpha: transform.alpha,
    outlineAlpha: transform.outlineAlpha,
    fillAlpha: transform.fillAlpha,
    glowAlpha: transform.glowAlpha,
    echoAlphaBoost: cue.echoAlphaBoost,
    lead,
    echoes,
  };
}

export function getTemporalEchoResidueReducedMotionFrame() {
  return temporalEchoResidueConfig.reducedMotionFrame;
}

export function evaluateTemporalEchoResidueFrame(
  frame: number,
): TemporalEchoResidueFrameState {
  const normalizedFrame =
    ((frame % temporalEchoResidueConfig.durationFrames) +
      temporalEchoResidueConfig.durationFrames) %
    temporalEchoResidueConfig.durationFrames;
  const time = (normalizedFrame / temporalEchoResidueConfig.fps) * 1000;
  const progress =
    normalizedFrame / (temporalEchoResidueConfig.durationFrames - 1);
  const cues = cueDefinitions
    .map((cue) => evaluateCueState(cue, normalizedFrame))
    .filter((cue): cue is TemporalEchoResidueCueState => cue !== null);
  const worldMix = easeInOutCubic(inverseLerp(normalizedFrame, 120, 142));
  const circleCue = cues.find((cue) => cue.id === "circle-name");
  const warmCue = cues.find((cue) => cue.id === "warm-water");
  const waterArcAlpha =
    easeOutCubic(inverseLerp(normalizedFrame, 156, 174)) *
    (1 - easeInCubic(inverseLerp(normalizedFrame, 174, 194)));

  return {
    frame: normalizedFrame,
    time,
    progress,
    cues,
    worldMix,
    topHaloX:
      mix(474, 612, worldMix) + Math.sin(time * 0.00042) * mix(14, 22, worldMix),
    topHaloY: 34,
    topHaloRadius: mix(214, 268, worldMix),
    circleAlpha: (circleCue?.alpha ?? 0) * 0.24,
    petalAlpha: easeOutCubic(inverseLerp(normalizedFrame, 126, 144)) * 0.48,
    petalSpin: normalizedFrame * 0.0075,
    waterArcAlpha,
    waterArcProgress: easeOutCubic(inverseLerp(normalizedFrame, 156, 186)),
    stageFade:
      (1 - easeInOutCubic(inverseLerp(normalizedFrame, 242, 252))) *
      (0.92 + (warmCue?.alpha ?? 0) * 0.08),
  };
}
