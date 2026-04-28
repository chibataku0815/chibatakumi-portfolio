// Pure data + brand-spec types for the /experiments/wordmark A/B/C/D test.
// Owned by Stream C (Brand Spec Authority) during Tier 1 tuning.
// Stream A imports the Palette type and PALETTES; Stream B reads CANDIDATES + PALETTES.

export type PaletteKey = "mono" | "warm" | "raw";

export type Palette = {
  /** Primary layer fill (CHIBA) */
  primary: string;
  /** Secondary layer fill (TAKUMI) */
  secondary: string;
  /** Wireframe (EdgesGeometry) line color */
  wireframe: string;
  /** Canvas background */
  background: string;
};

// Three palette directions we'll evaluate. Stream C may refine the exact
// hex values once brand specs are locked, but the keys stay stable so
// Stream B's UI/URL params and Stream A's Scene wiring keep working.
//
// raw — Phase-3 baseline. Pure-white on near-black with red wireframe.
//       Preserves prior visual behavior when client.tsx hasn't yet been
//       extended (Phase 0 default).
// mono — Saint Laurent / display-logo direction. Slightly off-white
//        (#fafafa) on pure black for max-contrast luxury sans.
// warm — HBA / editorial / photo-book direction. Warm off-white on
//        warm near-black with terracotta wireframe.
export const PALETTES: Record<PaletteKey, Palette> = {
  mono: {
    primary: "#fafafa",
    secondary: "#9aa0a6",
    wireframe: "#ff3344",
    background: "#000000",
  },
  warm: {
    primary: "#f0ede5",
    secondary: "#b0a89c",
    wireframe: "#d8826b",
    background: "#0a0807",
  },
  raw: {
    primary: "#ffffff",
    secondary: "#9aa0a6",
    wireframe: "#ff3344",
    background: "#0e0e0e",
  },
};

/**
 * Procedural background preset. Tier 2 Lever 8.
 * Each preset is a tuned combination of three shader effects applied on top of
 * the palette's flat background color.
 *
 * - flat: no procedural effect (pure palette.background)
 * - vignette: subtle radial darkening from center to corners (luxury subtle)
 * - grain: static film noise (analog texture)
 * - editorial: composite of vignette + grain + slight vertical bias (HBA / photo-book)
 *
 * Stream 3 owns the actual numeric values; Phase 0 leaves them at zero so the
 * Background stub still produces the prior flat behavior.
 */
export type BackgroundType = "flat" | "vignette" | "grain" | "editorial";

export type BackgroundPreset = {
  /** 0 = no vignette, 1 = strong radial darken */
  vignette: number;
  /** 0 = no grain, ~0.01 = subtle film grain */
  grain: number;
  /** 0 = flat, 1 = strong darker-bottom bias (~15% delta at full) */
  verticalBias: number;
};

export const BACKGROUND_PRESETS: Record<BackgroundType, BackgroundPreset> = {
  flat:      { vignette: 0,    grain: 0,     verticalBias: 0    },
  vignette:  { vignette: 0.45, grain: 0,     verticalBias: 0    },
  grain:     { vignette: 0,    grain: 0.008, verticalBias: 0    },
  editorial: { vignette: 0.30, grain: 0.005, verticalBias: 0.12 },
};

export type Candidate = {
  /** Short label shown in the toggle UI (matched case-insensitively against ?font=) */
  label: string;
  /** Long-form name shown in the top-left caption */
  fullName: string;
  /** Brand reference for caption — explains which brand convention this matches */
  brandReference: string;
  /** Public URL of the OTF/TTF/WOFF (NOT WOFF2 — opentype.js 1.3.4 doesn't parse it) */
  url: string;
  /** Hint shown when the file is missing */
  acquireHint: string;
  /** Font size in font-em units (default 700) */
  fontSize: number;
  /** Letter-spacing as a fraction of fontSize. 0=default, 0.10=wide, -0.02=tight */
  tracking: number;
  /**
   * Brand-specific palette key. Stream C (Brand Spec Authority) assigns the
   * locked palette per candidate during Tier 1 tuning. When undefined, Stream B
   * falls back to "raw" so Phase 0 behavior is preserved.
   */
  palette?: PaletteKey;
  /**
   * Tier 2 Lever 5 — Per-pair kerning overrides keyed by 2-char pair (e.g., "TA").
   * Values are in font-em units (same scale as font.getKerningValue's return).
   * Negative tucks letters closer; positive opens space. Stream 3 (Tier 2 data
   * authority) tunes these per font after evaluating Tier 1 captures.
   */
  kerningOverrides?: Record<string, number>;
  /**
   * Tier 2 Lever 8 — Procedural background preset. Stream 3 assigns per font.
   * When undefined, client.tsx falls back to "flat".
   */
  background?: BackgroundType;
};

export const PRIMARY = "CHIBA";
export const SECONDARY = "TAKUMI";

// All 4 OFL fonts are bundled. Migra/PP Editorial/Bagoss require user-provided files.
//
// Tracking (letter-spacing) is brand-tuned to match the convention each font was
// chosen to evoke. e.g. luxury fashion (HBA / Saint Laurent) typically pairs
// Helvetica Neue Bold with very wide tracking (0.10–0.15 em); Bebas Neue logos
// commonly use 0.08–0.12 em for breathing room since the font is condensed by
// default; Supreme's Futura Heavy Oblique is set tight (~-0.02 to 0).
//
// Stream C will refine these values to brand-spec exact during Tier 1 tuning.
export const CANDIDATES: Candidate[] = [
  {
    label: "Jost",
    fullName: "Jost 800 Italic",
    brandReference: "Supreme — Futura STD Heavy Oblique alt (OFL, ~0.00em tracking)",
    url: "/fonts/Jost-800-HevyItalic.otf",
    fontSize: 700,
    tracking: 0.00,
    acquireHint: "Already bundled (OFL).",
    palette: "raw",
    background: "flat",
    // MI: both vertical-stroke-heavy; +15 prevents visual collision at tight tracking
    kerningOverrides: { "MI": 15 },
  },
  {
    label: "Inter",
    fullName: "Inter ExtraBold",
    brandReference: "Saint Laurent — Helvetica Neue Bold alt (OFL, +0.18em tracking)",
    url: "/fonts/Inter-ExtraBold.woff",
    fontSize: 700,
    tracking: 0.18,
    acquireHint: "Already bundled (OFL).",
    palette: "mono",
    background: "vignette",
    // TA: +0.18em wide tracking leaves A's diagonal ramp too far from T's overhang; -40 tucks it back
    // MI: at +0.18em the pair has enough air — visual inspection confirms no collision, skip override
    kerningOverrides: { "TA": -40 },
  },
  {
    label: "Hanken",
    fullName: "Hanken Grotesk Black Italic",
    brandReference: "HBA italic — Helvetica Neue Black Italic alt (OFL, +0.06em tracking)",
    url: "/fonts/HankenGrotesk-BlackItalic.woff",
    fontSize: 700,
    tracking: 0.06,
    acquireHint: "Already bundled (OFL).",
    palette: "warm",
    background: "editorial",
    // TA: italic A's right slope leans away from T's overhang; -50 pulls it under
    // AK: italic A closes nicely with K's left diagonal; -20 sharpens the pocket
    kerningOverrides: { "TA": -50, "AK": -20 },
  },
  {
    label: "Bebas",
    fullName: "Bebas Neue Regular",
    brandReference: "Display-logo standard — Bebas Neue Regular (OFL, +0.05em tracking)",
    url: "/fonts/BebasNeue-Regular.ttf",
    fontSize: 900,
    tracking: 0.05,
    acquireHint: "Already bundled (OFL).",
    palette: "mono",
    background: "vignette",
    // Bebas Neue has well-engineered built-in condensed kerning; +0.05em is subtle enough to not disturb it
    kerningOverrides: {},
  },
  {
    label: "Migra",
    fullName: "Migra Italic",
    brandReference: "Pangram Pangram — paid (free trial available)",
    url: "/fonts/Migra-Italic.otf",
    fontSize: 700,
    tracking: 0,
    acquireHint:
      "Get the trial OTF from pangrampangram.com/products/migra → save as public/fonts/Migra-Italic.otf",
  },
  {
    label: "PP Editorial",
    fullName: "PP Editorial New Italic",
    brandReference: "Pangram Pangram — paid (free trial available)",
    url: "/fonts/PPEditorialNew-Italic.otf",
    fontSize: 700,
    tracking: 0,
    acquireHint:
      "Get the trial OTF from pangrampangram.com/products/editorial-new → save as public/fonts/PPEditorialNew-Italic.otf",
  },
  {
    label: "Bagoss",
    fullName: "Bagoss Standard Italic",
    brandReference: "Studio Bergini — paid only",
    url: "/fonts/Bagoss-Italic.otf",
    fontSize: 700,
    tracking: 0,
    acquireHint:
      "Studio Bergini license required. Save the licensed OTF as public/fonts/Bagoss-Italic.otf",
  },
];
