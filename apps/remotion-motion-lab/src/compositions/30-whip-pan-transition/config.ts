/**
 * Whip Pan Transition — Configuration (#30)
 *
 * Style: S2 Brutalist Tech — Bebas Neue, pure black, neon lime accent,
 * halftone-glitch grain, violent motion smear.
 *
 * High-speed horizontal pan with directional motion blur.
 * Scene A slides out left while Scene B enters from right.
 */
export const config = {
  palette: {
    bg: '#000000',
    primary: '#ffffff',
    accent: '#ccff00',
    muted: '#666666',
  },
  sceneA: { color: '#0a0a0a', label: 'DESTROY' },
  sceneB: { color: '#111111', label: 'CREATE' },
  transitionStart: 15,
  transitionDuration: 12,
  sceneAEnd: 15,
  sceneBStart: 28,
  ghostCopies: 6,
  ghostAlphas: [0.15, 0.12, 0.09, 0.07, 0.05, 0.03] as readonly number[],
  totalFrames: 60,
  texture: {
    grain: 40,
    vignette: 0,
  },
  font: {
    heading: 'Bebas Neue',
    weight: 900,
    sizeHero: 200,
    letterSpacing: -0.02,
    lineHeight: 0.9,
  },
  streakCount: 5,
  streakHeight: 4,
  dustCount: 7,
  registrationMarkAlpha: 0.65,
  underlineHeight: 4,
} as const;
