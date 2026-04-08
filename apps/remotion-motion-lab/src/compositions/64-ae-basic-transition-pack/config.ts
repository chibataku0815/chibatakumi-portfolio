export type TransitionKind =
  | "horizontal-wipe"
  | "diagonal-wipe"
  | "radial-wipe"
  | "center-open-line"
  | "circle-wipe";

export type TransitionEasingId =
  | "linear"
  | "ae-like"
  | "quint-out"
  | "expo-out";

export type TransitionEasingPreset = {
  readonly id: TransitionEasingId;
  readonly label: string;
  readonly note: string;
};

export type ScenePalette = {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly gradientA: string;
  readonly gradientB: string;
  readonly accent: string;
  readonly chips: readonly string[];
};

export type TransitionStudy = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly note: string;
  readonly kind: TransitionKind;
  readonly colors: readonly string[];
  readonly layerDelayFrames: number;
  readonly outgoing: ScenePalette;
  readonly incoming: ScenePalette;
};

export type AEBasicTransitionVariantProps = {
  readonly transitionId: string;
  readonly easingId: TransitionEasingId;
};

export const config = {
  id: "AEBasicTransitionPack",
  variantId: "AEBasicTransitionVariant",
  fps: 30,
  width: 1920,
  height: 1080,
  segmentFrames: 108,
  totalFrames: 540,
  defaultEasingId: "ae-like" as TransitionEasingId,
  entryStartFrame: 10,
  entryDurationFrames: 25,
  coverHoldFrames: 14,
  exitDurationFrames: 25,
  chromeInsetX: 72,
  chromeInsetY: 64,
  titleFontSize: 72,
  subtitleFontSize: 24,
  labelFontSize: 16,
  chipFontSize: 14,
  pathStrokeWidth: 420,
  pathD:
    "M -180 858 C 290 512 712 394 1102 538 S 1696 780 2100 226",
} as const;

export const easingPresets: readonly TransitionEasingPreset[] = [
  {
    id: "linear",
    label: "Linear",
    note: "No easing. Constant wipe velocity.",
  },
  {
    id: "ae-like",
    label: "AE-like",
    note: "Fast-out AE-style wipe with a soft settle.",
  },
  {
    id: "quint-out",
    label: "Quint Out",
    note: "Smoother deceleration with a longer settle.",
  },
  {
    id: "expo-out",
    label: "Expo Out",
    note: "Punchy front-loaded move, then a quick settle.",
  },
] as const;

export const defaultVariantProps: AEBasicTransitionVariantProps = {
  transitionId: "linear-left-to-right",
  easingId: config.defaultEasingId,
};

export const transitionStudies: readonly TransitionStudy[] = [
  {
    id: "linear-left-to-right",
    title: "Linear Wipe / Left to Right",
    subtitle: "Linear Wipe angle -90deg, 3 stacked solids, 8-frame stagger",
    note: "AE graph editor feel with 80 influence-like easing",
    kind: "horizontal-wipe",
    colors: ["#fff3df", "#ff9b45", "#ff5b3f"],
    layerDelayFrames: 8,
    outgoing: {
      eyebrow: "Scene A",
      title: "Portfolio Cut",
      subtitle: "soft grid / editorial warmup / outgoing plate",
      gradientA: "#0d1324",
      gradientB: "#243c64",
      accent: "#93d8ff",
      chips: ["OUTGOING", "GRID", "LOW PARALLAX"],
    },
    incoming: {
      eyebrow: "Scene B",
      title: "Launch Detail",
      subtitle: "glow panel / product close-up / incoming plate",
      gradientA: "#1f0d0b",
      gradientB: "#6f2619",
      accent: "#ffcc95",
      chips: ["INCOMING", "GLOW", "PRODUCT"],
    },
  },
  {
    id: "linear-diagonal",
    title: "Linear Wipe / Diagonal",
    subtitle: "Same stack, rotated to -45deg for top-left to bottom-right motion",
    note: "This is the same primitive as the first cut with only angle changed",
    kind: "diagonal-wipe",
    colors: ["#f7f1e5", "#78dbff", "#3266ff"],
    layerDelayFrames: 8,
    outgoing: {
      eyebrow: "Scene A",
      title: "Case Study",
      subtitle: "cool-white typography / browser frame / outgoing plate",
      gradientA: "#09111b",
      gradientB: "#1f304f",
      accent: "#89d5ff",
      chips: ["OUTGOING", "BROWSER", "CLEAN"],
    },
    incoming: {
      eyebrow: "Scene B",
      title: "Data Story",
      subtitle: "crisp panel / sky cyan / incoming plate",
      gradientA: "#05121a",
      gradientB: "#0d5972",
      accent: "#baf6ff",
      chips: ["INCOMING", "INFO", "COOL"],
    },
  },
  {
    id: "radial-counter-clockwise",
    title: "Radial Wipe / Counter-clockwise",
    subtitle: "Radial Wipe with counter-clockwise sweep and layered color offsets",
    note: "The exit matte uses the same sweep to clear the stack back to transparency",
    kind: "radial-wipe",
    colors: ["#ffe083", "#ff6e43"],
    layerDelayFrames: 8,
    outgoing: {
      eyebrow: "Scene A",
      title: "Signal Board",
      subtitle: "chart room / numeric pulse / outgoing plate",
      gradientA: "#0a1020",
      gradientB: "#343565",
      accent: "#ffe17d",
      chips: ["OUTGOING", "SIGNAL", "AMBER"],
    },
    incoming: {
      eyebrow: "Scene B",
      title: "Heat Map",
      subtitle: "deep red / radial energy / incoming plate",
      gradientA: "#180908",
      gradientB: "#6d2318",
      accent: "#ffb493",
      chips: ["INCOMING", "RADIAL", "ENERGY"],
    },
  },
  {
    id: "trim-paths-center-open",
    title: "Trim Paths / Center-open Line",
    subtitle: "Curved stroke grows from center, duplicated, delayed, then matted away",
    note: "AE path trimming is approximated as a curve clipped by a center-expanding window",
    kind: "center-open-line",
    colors: ["#f3efe8", "#89ddcb"],
    layerDelayFrames: 8,
    outgoing: {
      eyebrow: "Scene A",
      title: "Motion Notes",
      subtitle: "curve language / path study / outgoing plate",
      gradientA: "#0b1110",
      gradientB: "#23453c",
      accent: "#9ef3dc",
      chips: ["OUTGOING", "CURVE", "PATH"],
    },
    incoming: {
      eyebrow: "Scene B",
      title: "System Reveal",
      subtitle: "mint flare / split bars / incoming plate",
      gradientA: "#081415",
      gradientB: "#1f696f",
      accent: "#c6fff6",
      chips: ["INCOMING", "REVEAL", "MINT"],
    },
  },
  {
    id: "circle-scale",
    title: "Scale / Circle Wipe",
    subtitle: "Three circle layers scale from 0 to full-frame cover, then clear with a matte",
    note: "Equivalent to animating scale on ellipse solids with the same 8-frame offset",
    kind: "circle-wipe",
    colors: ["#f7f0ff", "#c48cff", "#ff6f78"],
    layerDelayFrames: 8,
    outgoing: {
      eyebrow: "Scene A",
      title: "Cover Frame",
      subtitle: "soft purple / centered editorial lockup / outgoing plate",
      gradientA: "#140d22",
      gradientB: "#3e235f",
      accent: "#ddc3ff",
      chips: ["OUTGOING", "COVER", "EDITORIAL"],
    },
    incoming: {
      eyebrow: "Scene B",
      title: "Hero Poster",
      subtitle: "rose-red / clean hold / incoming plate",
      gradientA: "#200910",
      gradientB: "#772030",
      accent: "#ffc5d0",
      chips: ["INCOMING", "POSTER", "HERO"],
    },
  },
] as const;
