type AlphaResidueGateOptions = {
  sampleIndex: number;
  sampleCount: number;
  decay: number;
  leadSpeed: number;
  distanceFromLead: number;
  distanceFromPrevious: number;
  maxAlpha: number;
  minimumLeadSpeed: number;
  minimumLeadDistance: number;
  minimumSampleSpacing: number;
  idealSampleSpacing: number;
};

export type AlphaResidueGateResult = {
  alpha: number;
  visible: boolean;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * residue が泥化しないように、速度・距離・サンプル間隔で alpha を制御する。
 * Work 06 専用の gate であり、汎用 trail policy にはしない。
 */
export function alphaResidueGate({
  sampleIndex,
  sampleCount,
  decay,
  leadSpeed,
  distanceFromLead,
  distanceFromPrevious,
  maxAlpha,
  minimumLeadSpeed,
  minimumLeadDistance,
  minimumSampleSpacing,
  idealSampleSpacing,
}: AlphaResidueGateOptions): AlphaResidueGateResult {
  const speedGate = clamp01(
    (leadSpeed - minimumLeadSpeed) / (minimumLeadSpeed * 1.5),
  );
  const leadDistanceGate = clamp01(
    (distanceFromLead - minimumLeadDistance) /
      Math.max(minimumLeadDistance, 1),
  );
  const sampleSpacingGate = clamp01(
    (distanceFromPrevious - minimumSampleSpacing) /
      Math.max(idealSampleSpacing - minimumSampleSpacing, 1),
  );
  const orderGate =
    sampleCount <= 1 ? 1 : clamp01(1 - sampleIndex / (sampleCount + 0.5));
  const alpha =
    maxAlpha *
    decay *
    orderGate *
    speedGate *
    (0.34 + leadDistanceGate * 0.66) *
    (0.42 + sampleSpacingGate * 0.58);

  return {
    alpha,
    visible: alpha >= 0.025,
  };
}
