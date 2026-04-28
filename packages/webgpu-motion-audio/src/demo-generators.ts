// Demo-mode onset generators. Band synthesis (sine) lives in AudioBus since it
// is uniform across styles; only the onset shape differs:
//   "beat"    → dot's 120 BPM kick/snare/hat pulse train
//   "ambient" → grid's silent-time aesthetic: bands sine, onsets ≈ 0
//
// Both operate in-place on the shared `OnsetBands` record so the hot path is
// allocation-free.

import type { OnsetBands } from "./types";

const ONSET_DECAY_TAU = 0.04;

/** Beat-mode: 120 BPM synthetic kick / snare / hi-hat pulses. */
export function generateBeatOnsets(
  out: OnsetBands,
  demoTime: number,
  dt: number,
): void {
  const decay = Math.exp(-dt / ONSET_DECAY_TAU);
  const beatPhase = (demoTime * 2.0) % 1.0;
  const snarePhase = ((demoTime * 2.0) + 0.5) % 1.0;
  const hatPhase = (demoTime * 4.0) % 1.0;

  const kickPulse = beatPhase < 0.05 ? 1.0 - (beatPhase / 0.05) : 0;
  const snarePulse = snarePhase < 0.05 ? 1.0 - (snarePhase / 0.05) : 0;
  const hatPulse = hatPhase < 0.03 ? 1.0 - (hatPhase / 0.03) : 0;

  out.bassOnset = Math.max(out.bassOnset * decay, kickPulse);
  out.midOnset = Math.max(out.midOnset * decay, snarePulse);
  out.trebleOnset = Math.max(out.trebleOnset * decay, hatPulse);
  out.globalOnset = Math.max(out.bassOnset, out.midOnset, out.trebleOnset);
}

/** Ambient-mode: no synthetic events, onsets decay quietly to zero. */
export function generateAmbientOnsets(out: OnsetBands, dt: number): void {
  const decay = Math.exp(-dt / ONSET_DECAY_TAU);
  out.bassOnset *= decay;
  out.midOnset *= decay;
  out.trebleOnset *= decay;
  out.globalOnset = Math.max(out.bassOnset, out.midOnset, out.trebleOnset);
}
