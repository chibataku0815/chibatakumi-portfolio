export interface MotionAppElementOptions {
  canvasId?: string;
  fallbackId?: string;
}

export interface MotionAppElements {
  canvas: HTMLCanvasElement;
  fallback: HTMLDivElement;
}

export function requireMotionAppElements(
  options: MotionAppElementOptions = {},
): MotionAppElements {
  const canvasId = options.canvasId ?? "canvas";
  const fallbackId = options.fallbackId ?? "fallback";

  const canvas = document.getElementById(canvasId);
  const fallback = document.getElementById(fallbackId);

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(`Canvas element not found: #${canvasId}`);
  }

  if (!(fallback instanceof HTMLDivElement)) {
    throw new Error(`Fallback element not found: #${fallbackId}`);
  }

  return { canvas, fallback };
}

export function showFallback(fallback: HTMLDivElement, error?: unknown): void {
  if (error) {
    console.error(error);
  }

  fallback.classList.add("show");
}
