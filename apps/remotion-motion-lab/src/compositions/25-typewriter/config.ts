/**
 * Typewriter — Configuration (#25)
 *
 * Style: techHud — Cyan/magenta HUD aesthetic with JetBrains Mono,
 * scanlines, digital grain, and terminal boot sequence feel.
 *
 * Characters appear one by one with a blinking cursor,
 * simulating a system boot / terminal output.
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
  text: 'SYSTEM_BOOT',
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_<>|/\\{}[]!@#$%',
  charDelay: 3,
  cursorBlinkCycle: 32,
  flickerRate: 2,          // random chars change every N frames
  lockFlashDuration: 2,    // frames of magenta flash on character lock
  leftMargin: 0.25,
  totalFrames: 120,
} as const;
