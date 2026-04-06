/**
 * Handheld Shake — Configuration (#37)
 *
 * Style: retro — ノスタルジー、温かみ、手作り感
 * Warm brown palette, Fraunces serif, heavy film grain (60/100),
 * documentary camera feel with viewfinder overlay.
 */
export const config = {
  palette: {
    bg: '#1a1410',         // warm dark brown
    primary: '#f0ece4',    // off-white (yellowed paper)
    secondary: '#b8a99a',  // sepia mid-tone
    accent: '#d4763a',     // burnt orange (70s earth tone)
    muted: '#b8a99a',
    rec: '#d4763a',        // warm orange REC (not bright red)
    guide: '#b8a99a30',    // warm safe area guide
  },
  typography: {
    heroSize: 120,         // retro dict: 120px
    heroWeight: 700,       // Bold — 70s heavy type
    headingSize: 36,
    headingWeight: 400,
    captionSize: 14,
    letterSpacing: 0.02,   // em — natural, classic
  },
  texture: {
    grain: 60,             // heavy film grain — retro DNA
    vignette: 0.45,        // strong lens falloff (older optics)
  },
  text: 'MEMORY',
  subtitle: 'A  FILM  BY',
  caption: 'SUPER  8  ×  2026',
  registrationMarkCount: 8,
  intensity: 1.2,          // slightly heavier camera
  fps: 30,
  totalFrames: 90,
  viewfinder: {
    letterboxHeight: 60,     // larger crop for vintage feel
    letterboxColor: '#0a0804', // warm black
    cornerMarkLength: 50,
    cornerMarkThickness: 1.5,  // thinner, delicate
    cornerMarkInset: 36,
    safeAreaRatio: 0.9,
    crosshairSize: 16,       // smaller, subtler
    crosshairThickness: 0.5, // very thin
    recDotRadius: 4,
  },
} as const;
