// Re-export shim for webgpu-motion-shell.
// Resolves via root workspaces glob; will be backed by
// vendor/webgpu-motion-libs/packages/webgpu-motion-shell once Phase A submodule lands.

export {
  requireMotionAppElements,
  showFallback,
  initGpu,
  resizeCanvas,
  createOffscreenTargetPool,
  createFixedStepLoop,
} from "webgpu-motion-shell";

export type {
  GpuContext,
  OffscreenTargetOptions,
  OffscreenTargetPool,
  FixedStepFrame,
  FixedStepLoopHandle,
  FixedStepLoopOptions,
} from "webgpu-motion-shell";
