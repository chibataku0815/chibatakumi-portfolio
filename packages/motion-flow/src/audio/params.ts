// FlowlineParam: canon set of audio-driven parameters for the flowline app.
//
// Phase 10 canon — 6 wires:
//   flowline-specific 3 (compute + ribbon):
//     - field.breathStrength    (bass → per-frame velocity boost, whole-field breath)
//     - field.vorticityPulse    (bassOnset → transient vorticity kick)
//     - trail.rimPulse          (trebleOnset → ribbon rim highlight)
//   film canon 3 (shared with grid/dot):
//     - film.bloom.threshold    (globalOnset → shared with grid)
//     - film.bloom.intensity    (energy → shared with grid)
//     - film.tonemap.compression (intensity → shared with grid)
//
// Unused inputs by design (matches grid): mid, treble, midOnset. See plan §6.3.

export type FlowlineParam =
  | "field.breathStrength"
  | "field.vorticityPulse"
  | "trail.rimPulse"
  | "film.bloom.threshold"
  | "film.bloom.intensity"
  | "film.tonemap.compression"
  | "film.grain.intensity"
  | "film.chroma.amount";
