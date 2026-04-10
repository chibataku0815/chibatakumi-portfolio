export type TrimWindowState = {
  visible: boolean;
  start: number;
  end: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function trimWindow({
  frame,
  startFrame,
  drawDurationFrames,
  holdFrames,
  eraseDurationFrames,
  easing,
}: {
  frame: number;
  startFrame: number;
  drawDurationFrames: number;
  holdFrames: number;
  eraseDurationFrames: number;
  easing: (value: number) => number;
}): TrimWindowState {
  if (frame < startFrame) {
    return {
      visible: false,
      start: 0,
      end: 0,
    };
  }

  const localFrame = frame - startFrame;
  const drawProgress = clamp01(localFrame / Math.max(1, drawDurationFrames));
  const eraseStart = drawDurationFrames + holdFrames;
  const eraseProgress = clamp01(
    (localFrame - eraseStart) / Math.max(1, eraseDurationFrames),
  );

  const end = easing(drawProgress);
  const start = easing(eraseProgress);
  const visible = end - start > 0.001;

  return {
    visible,
    start,
    end: Math.max(start, end),
  };
}
