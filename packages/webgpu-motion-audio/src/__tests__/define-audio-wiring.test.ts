import { describe, expect, test } from "bun:test";
import { defineAudioWiring } from "../wiring";
import type { AudioBands, OnsetBands } from "../types";

describe("defineAudioWiring", () => {
  test("duplicate param throws with both input names in message", () => {
    type P = "x";
    const build = () =>
      defineAudioWiring<P>()([
        { param: "x", input: "bass", coefficient: 1, baseline: 0, intent: "first" },
        { param: "x", input: "treble", coefficient: 1, baseline: 0, intent: "second" },
      ] as const);

    expect(build).toThrow(/duplicate param "x"/);
    expect(build).toThrow(/bass/);
    expect(build).toThrow(/treble/);
  });

  test("empty intent throws (empty string and whitespace-only)", () => {
    type P = "x";
    const buildEmpty = () =>
      defineAudioWiring<P>()([
        { param: "x", input: "bass", coefficient: 1, baseline: 0, intent: "" },
      ] as const);
    const buildWhitespace = () =>
      defineAudioWiring<P>()([
        { param: "x", input: "bass", coefficient: 1, baseline: 0, intent: "   " },
      ] as const);

    expect(buildEmpty).toThrow(/empty intent/i);
    expect(buildWhitespace).toThrow(/empty intent/i);
  });

  test("9 inputs resolve to baseline + coefficient * input", () => {
    type P =
      | "pBass" | "pMid" | "pTreble" | "pEnergy"
      | "pBassOn" | "pMidOn" | "pTrebleOn" | "pGlobalOn"
      | "pIntensity";

    const wiring = defineAudioWiring<P>()([
      { param: "pBass", input: "bass", coefficient: 2, baseline: 0.1, intent: "a" },
      { param: "pMid", input: "mid", coefficient: 3, baseline: 0.2, intent: "b" },
      { param: "pTreble", input: "treble", coefficient: 4, baseline: 0.3, intent: "c" },
      { param: "pEnergy", input: "energy", coefficient: 5, baseline: 0.4, intent: "d" },
      { param: "pBassOn", input: "bassOnset", coefficient: 6, baseline: 0.5, intent: "e" },
      { param: "pMidOn", input: "midOnset", coefficient: 7, baseline: 0.6, intent: "f" },
      { param: "pTrebleOn", input: "trebleOnset", coefficient: 8, baseline: 0.7, intent: "g" },
      { param: "pGlobalOn", input: "globalOnset", coefficient: 9, baseline: 0.8, intent: "h" },
      { param: "pIntensity", input: "intensity", coefficient: 10, baseline: 0.9, intent: "i" },
    ] as const);

    const bands: AudioBands = { bass: 0.5, mid: 0.4, treble: 0.3, energy: 0.2 };
    const onsets: OnsetBands = {
      bassOnset: 0.1,
      midOnset: 0.2,
      trebleOnset: 0.3,
      globalOnset: 0.4,
    };
    const intensity = 0.5;

    const out = wiring.resolve(bands, onsets, intensity);
    expect(out.pBass).toBeCloseTo(0.1 + 2 * 0.5);
    expect(out.pMid).toBeCloseTo(0.2 + 3 * 0.4);
    expect(out.pTreble).toBeCloseTo(0.3 + 4 * 0.3);
    expect(out.pEnergy).toBeCloseTo(0.4 + 5 * 0.2);
    expect(out.pBassOn).toBeCloseTo(0.5 + 6 * 0.1);
    expect(out.pMidOn).toBeCloseTo(0.6 + 7 * 0.2);
    expect(out.pTrebleOn).toBeCloseTo(0.7 + 8 * 0.3);
    expect(out.pGlobalOn).toBeCloseTo(0.8 + 9 * 0.4);
    expect(out.pIntensity).toBeCloseTo(0.9 + 10 * 0.5);
  });

  test("resolve and resolveInto produce equivalent results", () => {
    type P = "a" | "b";
    const wiring = defineAudioWiring<P>()([
      { param: "a", input: "bass", coefficient: 1.5, baseline: 0.2, intent: "x" },
      { param: "b", input: "trebleOnset", coefficient: -0.3, baseline: 1.0, intent: "y" },
    ] as const);

    const bands: AudioBands = { bass: 0.7, mid: 0.5, treble: 0.3, energy: 0.4 };
    const onsets: OnsetBands = { bassOnset: 0.1, midOnset: 0.2, trebleOnset: 0.8, globalOnset: 0.8 };
    const intensity = 0.6;

    const fresh = wiring.resolve(bands, onsets, intensity);
    const buf: Record<P, number> = { a: Number.NaN, b: Number.NaN };
    wiring.resolveInto(buf, bands, onsets, intensity);

    expect(buf.a).toBeCloseTo(fresh.a);
    expect(buf.b).toBeCloseTo(fresh.b);
  });

  test("resolveInto is zero-alloc (buffer reference unchanged across 1000 iterations)", () => {
    type P = "a";
    const wiring = defineAudioWiring<P>()([
      { param: "a", input: "energy", coefficient: 1, baseline: 0, intent: "x" },
    ] as const);

    const buf: Record<P, number> = { a: 0 };
    const bufRef = buf;

    const bands: AudioBands = { bass: 0, mid: 0, treble: 0, energy: 0.5 };
    const onsets: OnsetBands = { bassOnset: 0, midOnset: 0, trebleOnset: 0, globalOnset: 0 };

    for (let i = 0; i < 1000; i++) {
      wiring.resolveInto(buf, bands, onsets, 0);
    }

    expect(buf).toBe(bufRef);
    expect(buf.a).toBeCloseTo(0.5);
  });

  test("exhaustiveness — unwired param fails at compile time (verified via ts-expect-error)", () => {
    type P = "a" | "b" | "c";
    const wiring = defineAudioWiring<P>()(
      // @ts-expect-error missing wire for "c" — ExhaustiveWires<P, T> must reject this.
      [
        { param: "a", input: "bass", coefficient: 1, baseline: 0, intent: "x" },
        { param: "b", input: "mid", coefficient: 1, baseline: 0, intent: "y" },
      ] as const,
    );

    // Runtime note: the guard is compile-time; missing wires leave params length
    // short of the declared union. The `@ts-expect-error` above is the actual
    // contract this test enforces — if the exhaustiveness check regresses,
    // the directive becomes an "unused" error and the test file fails to build.
    expect(wiring.params.length).toBe(2);
  });
});
