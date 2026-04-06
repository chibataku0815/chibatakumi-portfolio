/**
 * Bounce Text — Configuration
 *
 * Playful per-character bounce with coral/teal/yellow palette,
 * Nunito font, radial gradient background, per-char glow,
 * subtle breathing after settle, and film-grain overlay.
 */
export const config = {
  palette: {
    bg: '#1a1a2e',
    primary: '#ffffff',
    accent: '#6366f1',
  },
  charColors: ['#ff6b6b', '#4ecdc4', '#ffe66d'] as const, // coral, teal, warm yellow
  text: 'SPRING',
  font: 'Nunito',
  fontSize: 150,
  fontWeight: '900',
  dropHeight: 350,       // dramatic physical impact
  staggerDelay: 5,       // frames between each char
  animDuration: 30,      // longer settle
  alphaFadeFrames: 6,
  totalFrames: 90,
  texture: {
    grain: 3,
    vignette: 0.1,
  },
} as const;
