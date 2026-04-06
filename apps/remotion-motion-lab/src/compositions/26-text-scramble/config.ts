/**
 * Text Scramble — Configuration (#26)
 *
 * Style: techHud — Cyan/magenta HUD aesthetic with JetBrains Mono,
 * scanlines, digital grain, and decryption protocol feel.
 *
 * Random characters cycle rapidly, then lock to the final text
 * left-to-right, creating a decryption / access key reveal effect.
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
  text: 'ACCESS_KEY',
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>{}[]|/\\~^',
  scrambleStart: 15,
  lockDelay: 4,
  flickerRate: 2,
  lockFlashDuration: 2,    // frames of magenta flash when char locks
  totalFrames: 120,
} as const;
