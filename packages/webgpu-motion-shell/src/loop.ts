export interface FixedStepFrame {
  now: number;
  time: number;
  dt: number;
}

export interface FixedStepLoopOptions {
  fps: number;
  frame(frame: FixedStepFrame): void;
  maxDeltaSeconds?: number;
}

export interface FixedStepLoopHandle {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

export function createFixedStepLoop(options: FixedStepLoopOptions): FixedStepLoopHandle {
  const targetInterval = 1000 / options.fps;
  const maxDeltaSeconds = options.maxDeltaSeconds ?? 0.05;

  let animationFrameId = 0;
  let running = false;
  let lastTime = 0;
  let accumulator = 0;

  function tick(now: number): void {
    if (!running) {
      return;
    }

    const elapsed = now - lastTime;
    lastTime = now;
    accumulator += elapsed;

    if (accumulator >= targetInterval) {
      const dt = Math.min(accumulator / 1000, maxDeltaSeconds);
      accumulator -= targetInterval;
      options.frame({
        now,
        time: now / 1000,
        dt,
      });
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  return {
    start(): void {
      if (running) {
        return;
      }

      running = true;
      accumulator = 0;
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(tick);
    },
    stop(): void {
      if (!running) {
        return;
      }

      running = false;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    },
    isRunning(): boolean {
      return running;
    },
  };
}
