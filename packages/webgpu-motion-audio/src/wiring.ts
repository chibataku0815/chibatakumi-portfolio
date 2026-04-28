// defineAudioWiring<P>() — type-safe 1-input → 1-param canon.
//
// Design contract (see plan §B.1–B.6):
//   * Exhaustiveness is enforced at compile time via `ExhaustiveWires`.
//     Missing params surface in the type error as a literal union.
//   * Duplicate params throw at module-init time — runtime guard covers the
//     "two wires, same param" case that the type system lets slip.
//   * Empty-or-whitespace intent strings throw at module-init time. Intents
//     document WHY each param is modulated; we treat them as non-optional.
//   * `resolve` allocates; `resolveInto` reuses a caller-provided buffer for
//     the hot path (fixed-size, zero-alloc once the buffer is primed).
//
// The carried curry (`defineAudioWiring<P>()([...] as const)`) is required
// because TS cannot simultaneously (a) accept an explicit `P` type argument
// and (b) infer `const T` from the wire array without a partial-inference
// workaround. Two-stage calling resolves both independently.

import type { AudioBands, AudioInput, OnsetBands } from "./types";

export interface AudioWire<P extends string> {
  readonly param: P;
  readonly input: AudioInput;
  readonly coefficient: number;
  readonly baseline: number;
  readonly intent: string;
}

const WireSetBrand: unique symbol = Symbol.for("webgpu-motion-audio/AudioWireSet");

export interface AudioWireSet<P extends string> {
  readonly [WireSetBrand]: true;
  readonly params: readonly P[];
  readonly wires: ReadonlyMap<P, AudioWire<P>>;
  /** Fresh-buffer resolve. Allocates. Use for debug/init. */
  resolve(bands: AudioBands, onsets: OnsetBands, intensity: number): Record<P, number>;
  /** Hot-path resolve. Writes into `out`. No allocation after buffer priming. */
  resolveInto(
    out: Record<P, number>,
    bands: AudioBands,
    onsets: OnsetBands,
    intensity: number,
  ): void;
}

/**
 * Compile-time exhaustiveness:
 *   If every `P` is covered by some wire, collapses to `T`.
 *   Otherwise resolves to `["Error: unwired param(s)", <missing-union>]`,
 *   which `T & ExhaustiveWires<P, T>` cannot satisfy — so the call site
 *   fails with the missing union surfaced in the error literal.
 */
export type ExhaustiveWires<P extends string, T extends readonly AudioWire<P>[]> =
  [P] extends [T[number]["param"]]
    ? T
    : readonly ["Error: unwired param(s)", Exclude<P, T[number]["param"]>];

function readInput(
  input: AudioInput,
  bands: AudioBands,
  onsets: OnsetBands,
  intensity: number,
): number {
  switch (input) {
    case "bass": return bands.bass;
    case "mid": return bands.mid;
    case "treble": return bands.treble;
    case "energy": return bands.energy;
    case "bassOnset": return onsets.bassOnset;
    case "midOnset": return onsets.midOnset;
    case "trebleOnset": return onsets.trebleOnset;
    case "globalOnset": return onsets.globalOnset;
    case "intensity": return intensity;
  }
}

function buildWireSet<P extends string>(
  wireArray: readonly AudioWire<P>[],
): AudioWireSet<P> {
  const seen = new Map<string, string>();
  for (let i = 0; i < wireArray.length; i++) {
    const w = wireArray[i];
    if (w.intent.trim().length === 0) {
      throw new Error(
        `[audio-wiring] empty intent for param "${w.param}" — every wire must document WHY it exists`,
      );
    }
    const prev = seen.get(w.param);
    if (prev !== undefined) {
      throw new Error(
        `[audio-wiring] duplicate param "${w.param}" — already bound to input "${prev}", attempted to rebind to input "${w.input}"`,
      );
    }
    seen.set(w.param, w.input);
  }

  // Freeze the underlying array to block mutation after init.
  const frozenWires = Object.freeze([...wireArray]) as readonly AudioWire<P>[];
  const params = Object.freeze(frozenWires.map((w) => w.param)) as readonly P[];
  const wires: ReadonlyMap<P, AudioWire<P>> = new Map(
    frozenWires.map((w) => [w.param, w] as const),
  );

  function resolveInto(
    out: Record<P, number>,
    bands: AudioBands,
    onsets: OnsetBands,
    intensity: number,
  ): void {
    // Classical for-loop on the frozen array — no iterator alloc in V8's hot path.
    for (let i = 0, n = frozenWires.length; i < n; i++) {
      const w = frozenWires[i];
      const v = readInput(w.input, bands, onsets, intensity);
      out[w.param] = w.baseline + w.coefficient * v;
    }
  }

  function resolve(
    bands: AudioBands,
    onsets: OnsetBands,
    intensity: number,
  ): Record<P, number> {
    const out = Object.create(null) as Record<P, number>;
    resolveInto(out, bands, onsets, intensity);
    return out;
  }

  return {
    [WireSetBrand]: true as const,
    params,
    wires,
    resolve,
    resolveInto,
  };
}

/**
 * Carried factory. Usage:
 * ```
 * type MyParam = "a" | "b";
 * export const MY_WIRING = defineAudioWiring<MyParam>()([
 *   { param: "a", input: "bass", coefficient: 1, baseline: 0, intent: "…" },
 *   { param: "b", input: "intensity", coefficient: 0.5, baseline: 1, intent: "…" },
 * ] as const);
 * ```
 */
export function defineAudioWiring<P extends string>() {
  return <const T extends readonly AudioWire<P>[]>(
    wires: T & ExhaustiveWires<P, T>,
  ): AudioWireSet<P> => {
    return buildWireSet<P>(wires as unknown as readonly AudioWire<P>[]);
  };
}
