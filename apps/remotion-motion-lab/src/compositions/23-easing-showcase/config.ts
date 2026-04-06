/**
 * Easing Showcase — Configuration
 *
 * Style: techHud — JetBrains Mono, cyan/magenta HUD palette,
 * digital grain, scanlines, monitor-view vignette.
 *
 * Three easing curves compared side-by-side: quintOut, expOut, backOut.
 * Change this file to add curves or adjust timing.
 */
export const config = {
  // --- Style: techHud ---
  palette: {
    bg: "#0a0a12",
    primary: "#00d4ff", // cyan
    secondary: "#5a8a9a", // desaturated cyan (brightened for readability)
    accent: "#ff00ff", // magenta
  },
  typography: {
    heroWeight: 300,
    heroSize: 64, // techHud hero = 64px (mono is wider)
    labelWeight: 400,
    labelSize: 18,
    letterSpacing: 0.15, // em — HUD wide spacing signature
  },
  texture: {
    grain: 15, // digital signal noise
    vignette: 0.3, // monitor-view edge darkening
    scanlineGap: 4, // px between scanlines
    scanlineAlpha: 0.06, // subtle persistent CRT lines
  },

  text: "MOVE",
  curves: [
    {
      name: "quintOut",
      label: "quintOut — Quintic deceleration",
      color: "#00d4ff", // cyan — primary data
    },
    {
      name: "expOut",
      label: "expOut — Exponential (AE punch)",
      color: "#ff00ff", // magenta — alert/highlight
    },
    {
      name: "backOut",
      label: "backOut — Overshoot s=1.7",
      color: "#5a8a9a", // secondary — background reference
    },
  ],
  totalFrames: 150,
  animDuration: 60,
  animStart: 30,
  holdEnd: 30,
} as const;
