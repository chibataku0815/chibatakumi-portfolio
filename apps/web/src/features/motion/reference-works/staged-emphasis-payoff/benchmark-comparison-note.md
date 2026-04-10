# Staged Emphasis Payoff Benchmark Comparison Note

## Benchmark First Read

A single condensed station title enters by staggered grapheme arrival, locks briefly as a full read, then sheds characters in a delayed release on the same baseline.

## Narrow Reproduction Note

- the route now uses the benchmark phrase `Shinagawa Station` on a light `1000x500` stage instead of the previous dark poster-style proof
- timing is reduced to a `60`-frame, `30fps` pass so the runtime stays close to the benchmark’s `2.002s` window
- the reproduction stays narrow on purpose: grapheme build, short payoff hold, and delayed disappearance only
- exact source-specific release ranking is still approximate, but the route now matches the benchmark family read strongly enough for Phase 3 contract work

## Family Contract Evidence

- `textUnitSplitter()`
  - the helper now splits into grapheme units and preserves gaps, which is necessary because the benchmark’s motion meaning is per-character rather than per-word
- `textDelayedStack()`
  - the helper now evaluates entry, settle, and release together, which matches the benchmark’s core grammar of delayed completion followed by delayed disappearance
- `emphasisTrack()`
  - the helper now describes emphasis, handoff, payoff, and release as one text-only track, which lets the route stage the second-word completion without adding non-family primitives

## Recommendation

- `ready for direction review`
- this is a Phase 3 runtime-local result only; it is not a promotion or template admission signal
