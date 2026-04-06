/**
 * Glitch Transition — Configuration (#34)
 *
 * Style: techHud — 未来的、データドリブン、サイバー、SF
 * Cyan/magenta palette, JetBrains Mono, HUD aesthetics.
 *
 * Digital glitch: RGB channel split + horizontal displacement bands
 * + temporal posterize for corrupted data feel.
 */
export const config = {
  palette: {
    bg: '#0a0a12',         // near-black + blue shift
    primary: '#00d4ff',    // cyan (Tron / Blade Runner)
    secondary: '#4a6a7a',  // desaturated cyan
    accent: '#ff00ff',     // magenta — alert / highlight
    muted: '#4a6a7a',
  },
  typography: {
    heroSize: 64,          // techHud dict: 64px (mono is wider)
    heroWeight: 300,       // Light — machine output feel
    labelSize: 16,
    labelWeight: 400,
    letterSpacing: 0.15,   // em — wide spacing = HUD signature
  },
  texture: {
    grain: 15,             // digital noise (signal feel)
    vignette: 0.3,         // "viewing through monitor" feel
  },
  hud: {
    frameInset: 24,        // px from edge
    frameBorderWidth: 1,
    cornerBracketLen: 40,
  },
  sceneA: {
    color: '#0a0a12',
    label: 'SYS_INIT',
    sublabel: '[ STATUS: ONLINE ]',
  },
  sceneB: {
    color: '#0a0a12',
    label: 'BREACH',
    sublabel: '[ ALERT: CRITICAL ]',
    isAlert: true,
  },
  transitionStart: 15,
  transitionDuration: 16,
  transitionEnd: 31,
  maxRgbOffset: 18,        // px — aggressive split
  maxSliceShift: 40,       // px — large displacement
  sliceCount: 12,          // fine slicing
  posterizeStep: 3,
  scanlineGap: 2,          // px — dense scanlines
  scanlineAlpha: 0.12,     // more visible than default
  noiseBlockAlpha: 0.2,
  flashThreshold: 0.85,
  flashAlpha: 0.08,
  totalFrames: 60,
} as const;
