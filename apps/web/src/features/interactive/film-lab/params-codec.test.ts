/**
 * @fileoverview Film Lab 共有 URL（`?v=1&p=`）用 params の encode / decode のテスト。
 *
 * 概要: `PARAM_KEYS` は `film-lab-core` 由来なので、0.4.0 で追加した Process 数値キーも
 *       デコード列挙に含まれることをここで固定する（旧 URL・新 URL の両方の回帰）。
 * 制限: Node（SSR）とブラウザの両方で base64 経路があるため、`bun test` では Node 側が主。
 */
import { describe, expect, test } from "bun:test";
import { PRESETS } from "./preset-data";
import {
  decodeParams,
  decodeSharedParamP,
  encodeParams,
} from "./params-codec";

describe("params-codec（life#93 surface / 共有 URL）", () => {
  test("0.4.0 Process 6 キーを含む Params の encode → decode で値が保持される", () => {
    const original = {
      ...PRESETS.cinematic,
      compressionAmount: 0.4,
      compressionRange: 0.35,
      printContrast: 0.2,
      cyan: -0.3,
      magenta: 0.1,
      yellow: 0.05,
    };
    const encoded = encodeParams(original);
    const decoded = decodeParams(encoded);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.compressionAmount).toBe(0.4);
    expect(decoded.compressionRange).toBe(0.35);
    expect(decoded.printContrast).toBe(0.2);
    expect(decoded.cyan).toBe(-0.3);
    expect(decoded.magenta).toBe(0.1);
    expect(decoded.yellow).toBe(0.05);
  });

  test("decodeSharedParamP は v=1 で encodeParams 結果を復元する", () => {
    const original = {
      ...PRESETS.cinematic,
      compressionAmount: 0.11,
      compressionRange: 0.22,
      printContrast: 0.33,
      cyan: 0,
      magenta: 0,
      yellow: 0,
    };
    const encoded = encodeParams(original);
    const fromShare = decodeSharedParamP("1", encoded);
    expect(fromShare).not.toBeNull();
    if (!fromShare) return;
    expect(fromShare.compressionAmount).toBeCloseTo(0.11);
    expect(fromShare.compressionRange).toBeCloseTo(0.22);
    expect(fromShare.printContrast).toBeCloseTo(0.33);
  });

  test("クエリ用に encodeURIComponent した p でも decodeSharedParamP が復元できる", () => {
    const original = { ...PRESETS.cinematic, compressionAmount: 0.5 };
    const encoded = encodeURIComponent(encodeParams(original));
    const fromShare = decodeSharedParamP("1", encoded);
    expect(fromShare).not.toBeNull();
    expect(fromShare?.compressionAmount).toBe(0.5);
  });

  test("旧形式想定: Process キー無しの部分オブジェクトでもデコードでき、欠損は reset 基底のまま", () => {
    const legacySubset = {
      exposure: 0.2,
      contrast: 1.1,
      saturation: 0.9,
    };
    const encoded = encodeParams(legacySubset as (typeof PRESETS)["reset"]);
    const decoded = decodeParams(encoded);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.exposure).toBe(0.2);
    expect(decoded.compressionAmount).toBe(PRESETS.reset.compressionAmount);
    expect(decoded.compressionRange).toBe(PRESETS.reset.compressionRange);
  });

  // === 0.5.0 後方互換: grainSize / diffusion ===

  test("v0.4.5 旧 URL（grainSize/diffusion 無し）でもデコードでき、reset 基底値で補填される", () => {
    const legacy = { ...PRESETS.cinematic } as Record<string, unknown>;
    delete legacy.grainSize;
    delete legacy.diffusion;
    const encoded = encodeParams(legacy as (typeof PRESETS)["reset"]);
    const decoded = decodeParams(encoded);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.grainSize).toBe(PRESETS.reset.grainSize);
    expect(decoded.diffusion).toBe(PRESETS.reset.diffusion);
  });

  test("v0.5.0 パラメータ（grainSize/diffusion）の encode → decode で値が保持される", () => {
    const original = { ...PRESETS.cinematic, grainSize: 0.6, diffusion: 0.15 };
    const encoded = encodeParams(original);
    const decoded = decodeParams(encoded);
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.grainSize).toBe(0.6);
    expect(decoded.diffusion).toBe(0.15);
  });
});
