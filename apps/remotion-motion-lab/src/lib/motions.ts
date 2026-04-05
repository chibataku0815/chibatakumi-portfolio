/**
 * Filmtone motion utilities
 *
 * launch video 用の高速カット・ズーム・パン・モンタージュバースト等を提供します。
 * 全て pure function で React 非依存です。
 */
import { Easing, interpolate } from "remotion";

/**
 * montage burst で現在表示すべき state の index を返します。
 *
 * @param frame 現在の絶対 frame です。
 * @param startFrame burst が始まる frame です。
 * @param stateCount 切り替える visual state の数です。
 * @param framesPerState 1 state あたりの保持 frame 数です。default: 2 (67ms at 30fps)。
 * @returns 0-based index。burst 前なら -1、burst 後は最後の index で固定します。
 */
export function getMontageBurstIndex(
  frame: number,
  startFrame: number,
  stateCount: number,
  framesPerState = 2,
): number {
  if (frame < startFrame) return -1;
  const elapsed = frame - startFrame;
  const totalBurstFrames = stateCount * framesPerState;
  if (elapsed >= totalBurstFrames) return stateCount - 1;
  return Math.floor(elapsed / framesPerState) % stateCount;
}

export interface CanvasZoomConfig {
  startFrame: number;
  endFrame: number;
  startScale: number;
  endScale: number;
  originXPercent: number;
  originYPercent: number;
  direction: "in" | "out";
}

/**
 * canvas zoom の現在の scale と origin を返します。
 */
export function getCanvasZoom(
  frame: number,
  config: CanvasZoomConfig,
): { scale: number; originX: string; originY: string } {
  const easing =
    config.direction === "in"
      ? Easing.out(Easing.cubic)
      : Easing.in(Easing.cubic);
  const scale = interpolate(
    frame,
    [config.startFrame, config.endFrame],
    [config.startScale, config.endScale],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing },
  );
  return {
    scale,
    originX: `${config.originXPercent}%`,
    originY: `${config.originYPercent}%`,
  };
}

export interface CanvasPanConfig {
  startFrame: number;
  endFrame: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

/**
 * canvas pan の現在の translate 値を返します。
 */
export function getCanvasPan(
  frame: number,
  config: CanvasPanConfig,
): { translateX: number; translateY: number } {
  const translateX = interpolate(
    frame,
    [config.startFrame, config.endFrame],
    [config.startX, config.endX],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const translateY = interpolate(
    frame,
    [config.startFrame, config.endFrame],
    [config.startY, config.endY],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );
  return { translateX, translateY };
}

export interface TypingState {
  visibleText: string;
  showCursor: boolean;
  isComplete: boolean;
}

/**
 * typing animation の現在の状態を返します。
 *
 * @param charsPerSecond default: 15
 */
export function getTypingState(
  text: string,
  frame: number,
  startFrame: number,
  fps: number,
  charsPerSecond = 15,
): TypingState {
  if (frame < startFrame) {
    return { visibleText: "", showCursor: true, isComplete: false };
  }
  const elapsed = frame - startFrame;
  const charsVisible = Math.min(
    text.length,
    Math.floor((elapsed * charsPerSecond) / fps),
  );
  const visibleText = text.slice(0, charsVisible);
  const isComplete = charsVisible >= text.length;
  const showCursor = !isComplete || frame % 16 < 8;
  return { visibleText, showCursor, isComplete };
}

/**
 * 指定 frame が black flash 内かどうかを返します。
 */
export function isBlackFlash(
  frame: number,
  flashStart: number,
  flashDuration = 2,
): boolean {
  return frame >= flashStart && frame < flashStart + flashDuration;
}

/**
 * 複数の shot boundary のいずれかの black flash 内かどうかを返します。
 */
export function isBlackFlashAtBoundary(
  frame: number,
  shotBoundaries: number[],
  flashDuration = 2,
): boolean {
  return shotBoundaries.some(
    (boundary) => frame >= boundary && frame < boundary + flashDuration,
  );
}

export interface FilmStockFlashConfig {
  text: string;
  startFrame: number;
  holdFrames: number;
}

/**
 * film stock name flash の表示状態を返します。
 */
export function getFilmStockFlash(
  frame: number,
  config: FilmStockFlashConfig,
): { visible: boolean; scale: number } {
  const visible =
    frame >= config.startFrame &&
    frame < config.startFrame + config.holdFrames;
  if (!visible) return { visible: false, scale: 1 };
  const localFrame = frame - config.startFrame;
  const scale = interpolate(localFrame, [0, 3], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { visible, scale };
}

export interface ScaleTransitionConfig {
  startFrame: number;
  durationFrames: number;
  focusX: number;
  focusY: number;
  detailScale: number;
  panOffsetX: number;
  panOffsetY: number;
}

export interface ScaleTransitionState {
  scale: number;
  translateX: number;
  translateY: number;
  originX: string;
  originY: string;
  progress: number;
}

/**
 * full→detail のスケール遷移の状態を返します。
 */
export function getScaleTransition(
  frame: number,
  config: ScaleTransitionConfig,
): ScaleTransitionState {
  const endFrame = config.startFrame + config.durationFrames;
  const progress = interpolate(frame, [config.startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = interpolate(progress, [0, 1], [1.0, config.detailScale]);
  const translateX = interpolate(progress, [0, 1], [0, config.panOffsetX]);
  const translateY = interpolate(progress, [0, 1], [0, config.panOffsetY]);
  return {
    scale,
    translateX,
    translateY,
    originX: `${config.focusX}%`,
    originY: `${config.focusY}%`,
    progress,
  };
}
