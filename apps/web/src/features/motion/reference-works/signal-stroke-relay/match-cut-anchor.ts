export type MatchCutAnchorState = {
  sourceId: string;
  targetId: string;
  anchorT: number;
  continuityWeight: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function matchCutAnchor({
  frame,
  startFrame,
  durationFrames,
  sourceId,
  targetId,
  easing,
}: {
  frame: number;
  startFrame: number;
  durationFrames: number;
  sourceId: string;
  targetId: string;
  easing: (value: number) => number;
}): MatchCutAnchorState {
  const raw = clamp01((frame - startFrame) / Math.max(1, durationFrames));
  const anchorT = easing(raw);
  const continuityWeight = raw <= 0 || raw >= 1 ? 0 : 1 - Math.abs(raw - 0.5) * 2;

  return {
    sourceId,
    targetId,
    anchorT,
    continuityWeight,
  };
}
