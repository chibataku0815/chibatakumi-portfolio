// Vendored — verbatim from motion-grammar-lab.
//   source: packages/motion-grammar/src/staggered-loop.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   why vendored, not imported: the upstream package is private:true with raw
//   TS exports + a Remotion-coupled barrel, so it is not consumable from this
//   deployed app. This file is the pure, dependency-free stagger-replay
//   primitive only. Keep byte-identical to upstream; do not edit the math here.
//
// Staggered loop replay — the source frame for layer i is the master frame
// shifted back by i·offsetFrames (mod loopFrames): the "time-delay" cascade.

export const positiveModulo = (value: number, modulo: number): number => {
  return ((value % modulo) + modulo) % modulo;
};

export const staggeredLoopSourceFrame = (input: {
  frame: number;
  layerNumber: number;
  offsetFrames: number;
  loopFrames: number;
  layerNumberBase?: number;
}): number => {
  const layerOffset = input.layerNumber - (input.layerNumberBase ?? 1);
  return positiveModulo(input.frame - layerOffset * input.offsetFrames, input.loopFrames);
};

export const staggeredLoopSourceTime = (input: {
  frame: number;
  fps: number;
  layerNumber: number;
  offsetFrames: number;
  loopFrames: number;
  layerNumberBase?: number;
}): number => {
  return staggeredLoopSourceFrame(input) / input.fps;
};

export const stackedLayerAxisOffset = (input: {
  baseValue: number;
  layerNumber: number;
  step: number;
  layerNumberBase?: number;
}): number => {
  return input.baseValue + (input.layerNumber - (input.layerNumberBase ?? 1)) * input.step;
};
