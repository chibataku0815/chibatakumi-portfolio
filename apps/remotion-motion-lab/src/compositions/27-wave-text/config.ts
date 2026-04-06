/**
 * Wave Text — Configuration
 *
 * Retro / analog film style. Per-character sine-wave oscillation
 * with warm palette, film grain, and light-leak effects.
 */
export const config = {
  palette: {
    bg: '#1a1410',
    primary: '#f0ece4',
    accent: '#d4763a',
    secondary: '#b8a99a',
  },
  text: 'ANALOG',
  font: 'Fraunces',
  fontSize: 130,
  fontWeight: '700',
  amplitude: 75,      // 3× from 25 — must be clearly visible
  frequency: 0.3,     // slower = analog feel
  speed: 0.08,        // slower = organic
  totalFrames: 90,
  texture: {
    grain: 60,
    vignette: 0.45,
  },
} as const;
