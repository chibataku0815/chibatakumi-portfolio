/**
 * Cross Dissolve — Configuration (#32)
 *
 * Cinematic film title card style: CinemaScope letterbox, EB Garamond 300,
 * warm Kodak palette, 35mm grain overlay, teal-orange accent.
 */
export const config = {
  palette: {
    bg: '#0c0c0e',
    primary: '#e8e4dc',
    secondary: '#8a8478',
    accent: '#d4856a',
    teal: '#2a8c8a',
  },
  sceneA: { color: '#0c0c10', label: 'ACT ONE' },
  sceneB: { color: '#0e0c0c', label: 'ACT TWO' },
  transitionStart: 15,
  transitionDuration: 20,
  sceneBStart: 36,
  totalFrames: 60,
  texture: {
    grain: 35,
    vignette: 0.4,
  },
  letterboxHeight: 140,
} as const;
