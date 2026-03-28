// === 型定義 ===

export interface Params {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  rgbShift: number;
  grainIntensity: number;
  vignette: number;
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  halationIntensity: number;
  halationSpread: number;
  halationHue: number;
  fade: number;
  highlights: number;
  shadows: number;
}

export type Action =
  | { type: "SET_PARAM"; key: keyof Params; value: number }
  | { type: "COMMIT" }
  | { type: "APPLY_PRESET"; preset: Params }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "BEFORE_AFTER_ON" }
  | { type: "BEFORE_AFTER_OFF" };

export interface State {
  params: Params;
  history: Params[];
  historyIndex: number;
  beforeAfterStash: Params | null;
}

// === 定数 ===
const MAX_HISTORY = 30;

// === reducer ===
export function filmLabReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PARAM": {
      // params を更新するだけ。history は触らない
      return {
        ...state,
        params: { ...state.params, [action.key]: action.value },
      };
    }
    case "COMMIT": {
      // 現在の params を history に push。future を切り捨て
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        { ...state.params },
      ].slice(-MAX_HISTORY);
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case "APPLY_PRESET": {
      // params を上書き + 即COMMIT相当
      const newParams = { ...action.preset };
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        newParams,
      ].slice(-MAX_HISTORY);
      return {
        ...state,
        params: newParams,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        params: { ...state.history[newIndex] },
        historyIndex: newIndex,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        params: { ...state.history[newIndex] },
        historyIndex: newIndex,
      };
    }
    case "BEFORE_AFTER_ON": {
      if (state.beforeAfterStash !== null) return state;
      return {
        ...state,
        beforeAfterStash: { ...state.params },
        params: {
          exposure: 0, contrast: 1, saturation: 1, temperature: 0,
          rgbShift: 0, grainIntensity: 0, vignette: 0,
          bloomThreshold: 0.8, bloomStrength: 0, bloomRadius: 0.4,
          halationIntensity: 0, halationSpread: 15, halationHue: 0,
          fade: 0, highlights: 0, shadows: 0,
        },
      };
    }
    case "BEFORE_AFTER_OFF": {
      if (state.beforeAfterStash === null) return state;
      return {
        ...state,
        params: { ...state.beforeAfterStash },
        beforeAfterStash: null,
      };
    }
    default:
      return state;
  }
}

// === 初期状態生成 ===
export function createInitialState(initialParams: Params): State {
  return {
    params: { ...initialParams },
    history: [{ ...initialParams }],
    historyIndex: 0,
    beforeAfterStash: null,
  };
}
