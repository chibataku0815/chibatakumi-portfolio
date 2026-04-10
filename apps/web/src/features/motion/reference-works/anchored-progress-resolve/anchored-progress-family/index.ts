import { anchoredProgressResolveFixtures } from "../fixtures";

type PhaseName = "loading" | "waiting" | "resolve";

/**
 * Anchored Progress family の時間評価結果。
 * SVG/DOM 側はこの state を読むだけに保ち、描画責務と分離する。
 */
export type ProgressState = {
  frame: number;
  phase: PhaseName;
  cycleProgress: number;
  loadingProgress: number;
  waitingProgress: number;
  resolveProgress: number;
  anchoredProgress: number;
};

/**
 * Rail 上の anchored fill を描くための幾何状態。
 */
export type AnchoredFillState = {
  headX: number;
  width: number;
  glowX: number;
};

/**
 * Waiting/resolve 中に使う blink channel の表示状態。
 */
export type BlinkChannelState = {
  laneOpacity: number[];
  nodeOpacity: number[];
  pulseRadius: number;
};

/**
 * Resolve phase の終端演出だけを担う表示状態。
 */
export type ResolveVisualState = {
  ringScale: number;
  ringOpacity: number;
  checkOpacity: number;
  checkScale: number;
  flashOpacity: number;
  labelShift: number;
};

const { rail, totalFrames } = anchoredProgressResolveFixtures;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function easeInOutCubic(value: number) {
  const x = clamp01(value);
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutQuint(value: number) {
  const x = clamp01(value);
  return 1 - Math.pow(1 - x, 5);
}

/**
 * 1 周期の loading / waiting / resolve を固定順で評価する。
 * Anchored Progress family の source of truth になる evaluator。
 */
export function progressStateMachine(frameValue: number): ProgressState {
  const frame =
    ((Math.floor(frameValue) % totalFrames) + totalFrames) % totalFrames;

  if (frame < 96) {
    const loadingProgress = easeInOutCubic(frame / 96);

    return {
      frame,
      phase: "loading",
      cycleProgress: frame / totalFrames,
      loadingProgress,
      waitingProgress: 0,
      resolveProgress: 0,
      anchoredProgress: mix(0.06, 0.68, loadingProgress),
    };
  }

  if (frame < 168) {
    const waitingProgress = (frame - 96) / 72;

    return {
      frame,
      phase: "waiting",
      cycleProgress: frame / totalFrames,
      loadingProgress: 1,
      waitingProgress,
      resolveProgress: 0,
      anchoredProgress: 0.68 + Math.sin(waitingProgress * Math.PI * 2) * 0.012,
    };
  }

  const resolveProgress = easeOutQuint((frame - 168) / 72);

  return {
    frame,
    phase: "resolve",
    cycleProgress: frame / totalFrames,
    loadingProgress: 1,
    waitingProgress: 1,
    resolveProgress,
    anchoredProgress: mix(0.68, 1, resolveProgress),
  };
}

/**
 * Anchored origin を崩さずに fill head と glow の位置を解決する。
 */
export function anchoredFill(progress: number): AnchoredFillState {
  const clamped = clamp01(progress);
  const headX = rail.x + rail.width * clamped;

  return {
    headX,
    width: Math.max(headX - rail.x, rail.height),
    glowX: mix(rail.x, headX, 0.9),
  };
}

/**
 * Loading/Waiting/Resolve の phase ごとに lane/node/pulse を同期評価する。
 */
export function blinkChannel(state: ProgressState): BlinkChannelState {
  const base =
    state.phase === "loading"
      ? state.loadingProgress
      : state.phase === "waiting"
        ? state.waitingProgress
        : state.resolveProgress;

  const speed = state.phase === "waiting" ? 2.4 : 1.35;

  return {
    laneOpacity: anchoredProgressResolveFixtures.laneYs.map((_, index) => {
      const wave = 0.5 + 0.5 * Math.sin(base * Math.PI * (speed + index * 0.65));
      return state.phase === "resolve"
        ? mix(0.18, 0.08, state.resolveProgress)
        : mix(0.14, 0.54, wave);
    }),
    nodeOpacity: anchoredProgressResolveFixtures.checkpointXs.map((_, index) => {
      const travel = base * 1.8 - index * 0.22;
      const wave = 0.5 + 0.5 * Math.sin(travel * Math.PI * 2);
      return state.phase === "resolve"
        ? mix(0.3, 0.9, state.resolveProgress)
        : mix(0.22, 0.88, wave);
    }),
    pulseRadius:
      state.phase === "resolve"
        ? mix(18, 46, state.resolveProgress)
        : mix(14, 24, 0.5 + 0.5 * Math.sin(base * Math.PI * 2)),
  };
}

/**
 * Resolve 終端の ring / check / flash だけを narrow に切り出す。
 */
export function resolveState(state: ProgressState): ResolveVisualState {
  const progress = state.resolveProgress;

  return {
    ringScale: mix(0.78, 1, progress),
    ringOpacity: mix(0.08, 0.82, progress),
    checkOpacity: clamp01((progress - 0.2) / 0.8),
    checkScale: mix(0.76, 1, progress),
    flashOpacity: mix(0, 0.22, Math.sin(progress * Math.PI)),
    labelShift: mix(16, 0, progress),
  };
}
