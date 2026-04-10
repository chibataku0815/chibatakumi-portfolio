export type OffsetGateState = {
  openFrame: number;
  closeFrame?: number;
  progress: number;
  active: boolean;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function offsetGate({
  frame,
  openFrame,
  durationFrames,
  closeFrame,
  easing,
}: {
  frame: number;
  openFrame: number;
  durationFrames: number;
  closeFrame?: number;
  easing: (value: number) => number;
}): OffsetGateState {
  if (frame < openFrame) {
    return {
      openFrame,
      closeFrame,
      progress: 0,
      active: false,
    };
  }

  const gatedProgress = easing(
    clamp01((frame - openFrame) / Math.max(1, durationFrames)),
  );
  const active = closeFrame === undefined ? true : frame <= closeFrame;

  return {
    openFrame,
    closeFrame,
    progress: active ? gatedProgress : 1,
    active,
  };
}
