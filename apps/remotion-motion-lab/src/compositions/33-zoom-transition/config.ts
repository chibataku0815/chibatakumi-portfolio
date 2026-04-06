/**
 * Zoom Transition — Configuration (#33)
 *
 * Style: techHud — Cyan/magenta HUD aesthetic with JetBrains Mono,
 * scanlines, digital grain, and tactical sector navigation feel.
 *
 * Scene A zooms out rapidly with increasing blur, then Scene B
 * zooms in from large scale with decreasing blur.
 * Scene B is magenta alert state.
 */
export const config = {
  palette: {
    bg: '#0a0a12',
    primary: '#00d4ff',
    secondary: '#4a6a7a',
    accent: '#ff00ff',
    muted: '#4a6a7a',
  },
  typography: {
    heroSize: 64,
    heroWeight: 300,
    labelSize: 16,
    labelWeight: 400,
    letterSpacing: 0.15,
  },
  texture: {
    grain: 15,
    vignette: 0.3,
  },
  hud: {
    frameInset: 24,
    frameBorderWidth: 1,
    cornerBracketLen: 40,
  },
  scanlineGap: 2,
  scanlineAlpha: 0.12,
  sceneA: {
    color: '#0a0a12',
    label: 'SECTOR_A',
    sublabel: '[ STATUS: NOMINAL ]',
  },
  sceneB: {
    color: '#0a0a12',
    label: 'SECTOR_B',
    sublabel: '[ ALERT: ACTIVE ]',
    isAlert: true,
  },
  transitionStart: 15,
  transitionMid: 22,
  transitionEnd: 29,
  sceneBStatic: 29,
  maxScale: 3.0,
  maxBlur: 15,
  totalFrames: 60,
} as const;
