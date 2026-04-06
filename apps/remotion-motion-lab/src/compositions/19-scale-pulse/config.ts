/**
 * Scale Pulse -- Configuration #19
 *
 * Retro film style: warm palette, serif fonts (Fraunces + LibreBaskerville),
 * film grain overlay, accent lines, VHS timestamp.
 */
export const config = {
  mainText: "PORTRA 400",
  subText: "Kodak",
  mainFontFamily: "Fraunces",
  mainFontSize: 160,
  mainFontWeight: "700",
  subFontFamily: "LibreBaskerville",
  subFontSize: 36,
  subFontWeight: "400",
  mainColor: "#f0ece4",
  subColor: "#b8a99a",
  accentColor: "#d4763a",
  bgColor: "#1a1410",
  minScale: 0.8,
  peakScale: 1.2,
  rampUpDuration: 24,
  rampDownDuration: 20,
  totalFrames: 90,
  texture: {
    grain: 60,
    vignette: 0.45,
  },
} as const;
