export const boilingPosterApertureFixtures = {
  copy: {
    eyebrow: "Phase 1 / PixiJS Library-Fit Reference Work",
    title: "Boiling Poster Aperture",
    description:
      "PixiJS を main home に固定し、boiling edge・mask gate・displacement-led reveal・secondary action を一枚絵の poster grammar に絞って検証する narrow browser-first proof。",
  },
  runtimeLabel: "PixiJS 8 / work-local runtime truth",
  techniqueFamily: [
    "Boiling",
    "Masking / Revealing",
    "Secondary Action",
    "displacement-led reveal",
  ],
  extractionTargets: [
    "boilField()",
    "alphaMaskGate()",
    "displacementReveal()",
    "secondaryFlickerAccent()",
  ],
  nonGoals: [
    "After Effects UI recreation",
    "physically-correct liquid motion",
    "full fluid simulation or particle system",
    "shared runtime helpers or generic Pixi framework",
    "Remotion adapter, export pipeline, or mixed renderer composition",
  ],
  poster: {
    issue: "ISSUE 02",
    slug: "APERTURE / 2026",
    taglines: ["LOCAL HEAT", "OFFSET MEMORY", "MASKED PRESSURE"],
    microCopy: "Reveal remains the main event.",
  },
} as const;
