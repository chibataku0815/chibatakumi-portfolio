import { stagger } from "motion";

export type StaggerChainConfig = {
  index: number;
  count: number;
  stepFrames: number;
  baseFrame: number;
  fps?: number;
  startDelayFrames?: number;
};

export function staggerChain({
  index,
  count,
  stepFrames,
  baseFrame,
  fps = 30,
  startDelayFrames = 0,
}: StaggerChainConfig) {
  const resolveDelay = stagger(stepFrames / fps, {
    startDelay: startDelayFrames / fps,
  });

  return baseFrame + Math.round(resolveDelay(index, count) * fps);
}
