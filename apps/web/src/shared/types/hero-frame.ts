/**
 * Viewport-normalised mask geometry used by useHeroFrameMetrics
 * and consumed by both hero and photography features.
 */

export interface HeroMaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeroMaskSet {
  maskRects: HeroMaskRect[];
  anchorRect: HeroMaskRect | null;
  interactionEnabled: boolean;
  coarsePointer: boolean;
}
