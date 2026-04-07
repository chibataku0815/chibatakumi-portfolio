import { Easing } from "remotion";
import { interpolate as flubberInterpolate } from "flubber";
import type { Interpolator } from "flubber";
import { config, type MorphWord } from "../config";

type ChannelSpec = {
  key: string;
  label: string;
  path: string;
  x: number;
  scale: number;
  opacity: number;
};

type MorphPairKey = `${MorphWord}-${MorphWord}-${number}`;

const polygonPath = (points: Array<[number, number]>) =>
  `${points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ")} Z`;

const ellipsePath = (rx: number, ry: number) =>
  `M ${-rx} 0 C ${-rx} ${-ry * 0.55} ${-rx * 0.55} ${-ry} 0 ${-ry} C ${
    rx * 0.55
  } ${-ry} ${rx} ${-ry * 0.55} ${rx} 0 C ${rx} ${ry * 0.55} ${
    rx * 0.55
  } ${ry} 0 ${ry} C ${-rx * 0.55} ${ry} ${-rx} ${ry * 0.55} ${-rx} 0 Z`;

const LETTER_PATHS: Record<string, string> = {
  B: polygonPath([
    [-56, -92],
    [14, -92],
    [42, -84],
    [61, -62],
    [61, -34],
    [48, -11],
    [26, 0],
    [45, 8],
    [66, 34],
    [66, 64],
    [48, 88],
    [16, 98],
    [-56, 98],
  ]),
  I: polygonPath([
    [-50, -92],
    [50, -92],
    [50, -68],
    [17, -68],
    [17, 68],
    [50, 68],
    [50, 92],
    [-50, 92],
    [-50, 68],
    [-17, 68],
    [-17, -68],
    [-50, -68],
  ]),
  G: polygonPath([
    [54, -62],
    [32, -88],
    [-20, -94],
    [-50, -74],
    [-68, -36],
    [-68, 18],
    [-54, 58],
    [-16, 92],
    [34, 92],
    [64, 70],
    [64, 30],
    [18, 30],
    [18, 54],
    [38, 54],
    [38, 66],
    [6, 66],
    [-20, 50],
    [-34, 20],
    [-34, -20],
    [-24, -50],
    [0, -68],
    [28, -66],
    [54, -46],
  ]),
  M: polygonPath([
    [-70, 92],
    [-70, -92],
    [-30, -92],
    [0, -16],
    [30, -92],
    [70, -92],
    [70, 92],
    [38, 92],
    [38, -34],
    [7, 42],
    [-7, 42],
    [-38, -34],
    [-38, 92],
  ]),
  E: polygonPath([
    [58, -92],
    [-54, -92],
    [-54, 92],
    [58, 92],
    [58, 64],
    [-20, 64],
    [-20, 16],
    [34, 16],
    [34, -10],
    [-20, -10],
    [-20, -64],
    [58, -64],
  ]),
  D: polygonPath([
    [-58, -92],
    [8, -92],
    [40, -82],
    [64, -56],
    [74, -14],
    [74, 16],
    [62, 58],
    [38, 86],
    [4, 96],
    [-58, 96],
  ]),
  U: polygonPath([
    [-64, -92],
    [-28, -92],
    [-28, 30],
    [-18, 58],
    [0, 68],
    [18, 58],
    [28, 30],
    [28, -92],
    [64, -92],
    [64, 22],
    [54, 62],
    [24, 94],
    [-24, 94],
    [-54, 62],
    [-64, 22],
  ]),
  S: polygonPath([
    [56, -70],
    [28, -92],
    [-22, -92],
    [-56, -66],
    [-56, -28],
    [-34, -6],
    [16, 6],
    [34, 18],
    [34, 42],
    [16, 62],
    [-18, 62],
    [-48, 48],
    [-60, 72],
    [-20, 96],
    [26, 96],
    [60, 70],
    [60, 28],
    [38, 2],
    [-8, -10],
    [-30, -20],
    [-30, -42],
    [-16, -58],
    [14, -62],
    [42, -48],
  ]),
  A: polygonPath([
    [0, -98],
    [64, 92],
    [28, 92],
    [14, 48],
    [-14, 48],
    [-28, 92],
    [-64, 92],
    [-2, -98],
    [0, -98],
    [0, -20],
    [6, 6],
    [-6, 6],
    [0, -20],
  ]),
  L: polygonPath([
    [-54, -92],
    [-54, 92],
    [56, 92],
    [56, 62],
    [-18, 62],
    [-18, -92],
  ]),
};

const SUPPORT_PATHS = [
  polygonPath([
    [-64, 92],
    [-64, -20],
    [-36, -62],
    [0, -92],
    [36, -62],
    [64, -20],
    [64, 92],
    [28, 92],
    [28, -14],
    [12, -34],
    [-12, -34],
    [-28, -14],
    [-28, 92],
  ]),
  ellipsePath(62, 34),
  polygonPath([
    [-68, 86],
    [-16, -88],
    [16, -88],
    [68, 86],
    [30, 86],
    [0, -4],
    [-30, 86],
  ]),
  polygonPath([
    [0, -88],
    [16, -16],
    [88, 0],
    [16, 16],
    [0, 88],
    [-16, 16],
    [-88, 0],
    [-16, -16],
  ]),
  polygonPath([
    [-72, -34],
    [-18, -34],
    [0, -88],
    [18, -34],
    [72, -34],
    [72, 0],
    [18, 0],
    [0, 56],
    [-18, 0],
    [-72, 0],
  ]),
  polygonPath([
    [-80, -18],
    [14, -18],
    [14, -66],
    [80, 0],
    [14, 66],
    [14, 18],
    [-80, 18],
  ]),
] as const;

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const getWordSpacing = (word: MorphWord) => config.stage.letterSpacing[word];

const getCenteredXPositions = (word: MorphWord) => {
  const length = word.length;
  const spacing = getWordSpacing(word);
  const start = -((length - 1) * spacing) / 2;
  return Array.from({ length }, (_, index) => start + index * spacing);
};

const buildStage = (word: MorphWord): ChannelSpec[] => {
  const occupiedX = getCenteredXPositions(word);

  return Array.from({ length: config.stage.channelCount }, (_, index) => {
    const letter = word[index];
    const occupied = Boolean(letter);
    const fallbackX = lerp(-550, 550, index / (config.stage.channelCount - 1));

    return {
      key: occupied ? `${word}-${letter}-${index}` : `${word}-ghost-${index}`,
      label: occupied ? letter : `ghost-${index + 1}`,
      path: occupied ? LETTER_PATHS[letter] : SUPPORT_PATHS[index % SUPPORT_PATHS.length],
      x: occupied ? occupiedX[index] : fallbackX,
      scale: occupied ? 1 : config.stage.ghostScale,
      opacity: occupied ? 1 : config.stage.ghostOpacity,
    };
  });
};

const stages: Record<MorphWord, ChannelSpec[]> = {
  BIG: buildStage("BIG"),
  MEDIUM: buildStage("MEDIUM"),
  SMALL: buildStage("SMALL"),
};

const interpolators = new Map<MorphPairKey, Interpolator>();

const getInterpolator = (
  fromWord: MorphWord,
  toWord: MorphWord,
  index: number,
) => {
  const key = `${fromWord}-${toWord}-${index}` satisfies MorphPairKey;
  const cached = interpolators.get(key);
  if (cached) {
    return cached;
  }

  const interpolator = flubberInterpolate(
    stages[fromWord][index].path,
    stages[toWord][index].path,
    {
      maxSegmentLength: 10,
    },
  );

  interpolators.set(key, interpolator);
  return interpolator;
};

const morphEase = Easing.bezier(0.24, 0.9, 0.28, 1);

export const getMorphProgress = (
  frameInSegment: number,
  morphFrames: number,
  channelIndex: number,
) => {
  const stagger = channelIndex * config.stage.channelStaggerFrames;
  const localDuration = Math.max(1, morphFrames - stagger);
  const raw = Math.max(0, Math.min(1, (frameInSegment - stagger) / localDuration));
  return morphEase(raw);
};

export const getTimelineState = (frame: number) => {
  const { holdFrames, morphFrames, settleFrames } = config.stage;
  const segmentLength = holdFrames + morphFrames + settleFrames;
  const secondSegmentStart = segmentLength;

  if (frame < holdFrames) {
    return {
      fromWord: "BIG" as MorphWord,
      toWord: "MEDIUM" as MorphWord,
      mode: "hold-start" as const,
      frameInSegment: frame,
      segmentProgress: 0,
      activeWord: "BIG" as MorphWord,
    };
  }

  if (frame < holdFrames + morphFrames) {
    return {
      fromWord: "BIG" as MorphWord,
      toWord: "MEDIUM" as MorphWord,
      mode: "morph-forward" as const,
      frameInSegment: frame - holdFrames,
      segmentProgress: (frame - holdFrames) / morphFrames,
      activeWord: "MEDIUM" as MorphWord,
    };
  }

  if (frame < segmentLength) {
    return {
      fromWord: "BIG" as MorphWord,
      toWord: "MEDIUM" as MorphWord,
      mode: "hold-middle" as const,
      frameInSegment: frame - holdFrames - morphFrames,
      segmentProgress: 1,
      activeWord: "MEDIUM" as MorphWord,
    };
  }

  if (frame < secondSegmentStart + holdFrames + morphFrames) {
    const frameInMorph = frame - secondSegmentStart - holdFrames;

    if (frame < secondSegmentStart + holdFrames) {
      return {
        fromWord: "MEDIUM" as MorphWord,
        toWord: "SMALL" as MorphWord,
        mode: "hold-middle-2" as const,
        frameInSegment: frame - secondSegmentStart,
        segmentProgress: 0,
        activeWord: "MEDIUM" as MorphWord,
      };
    }

    return {
      fromWord: "MEDIUM" as MorphWord,
      toWord: "SMALL" as MorphWord,
      mode: "morph-final" as const,
      frameInSegment: frameInMorph,
      segmentProgress: frameInMorph / morphFrames,
      activeWord: "SMALL" as MorphWord,
    };
  }

  return {
    fromWord: "MEDIUM" as MorphWord,
    toWord: "SMALL" as MorphWord,
    mode: "hold-end" as const,
    frameInSegment: Math.max(
      0,
      frame - (secondSegmentStart + holdFrames + morphFrames),
    ),
    segmentProgress: 1,
    activeWord: "SMALL" as MorphWord,
  };
};

export const getChannelMorphState = (
  frame: number,
  channelIndex: number,
): ChannelSpec & {
  progress: number;
  fromWord: MorphWord;
  toWord: MorphWord;
} => {
  const timeline = getTimelineState(frame);
  const from = stages[timeline.fromWord][channelIndex];
  const to = stages[timeline.toWord][channelIndex];

  const progress =
    timeline.mode === "morph-forward" || timeline.mode === "morph-final"
      ? getMorphProgress(
          timeline.frameInSegment,
          config.stage.morphFrames,
          channelIndex,
        )
      : timeline.segmentProgress;

  return {
    key: `${timeline.fromWord}-${timeline.toWord}-${channelIndex}`,
    label: to.label,
    path: getInterpolator(timeline.fromWord, timeline.toWord, channelIndex)(progress),
    x: lerp(from.x, to.x, progress),
    scale: lerp(from.scale, to.scale, progress),
    opacity: lerp(from.opacity, to.opacity, progress),
    progress,
    fromWord: timeline.fromWord,
    toWord: timeline.toWord,
  };
};
