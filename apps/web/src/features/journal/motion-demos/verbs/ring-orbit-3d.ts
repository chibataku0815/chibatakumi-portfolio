// Vendored — verbatim ring-orbit schedule from motion-grammar-lab.
//   source: packages/motion-grammar/src/ring-orbit-3d.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #6 (drawer
//     "auto-orient"/自動方向) as a 3-module set (ring-orbit-3d schedule +
//     ring3d + rotate-about-axis primitives) — see that study's
//     validation/ring-orbit-3d-promotion-record.md.
//   role here: createRingOrbitSchedule — the pure (frame → projected dots)
//     schedule the article's value-less skeleton is proven equal to. Imports
//     the three sibling modules above (co-located in this verbs/ dir).
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     These modules are pure (numbers in → numbers out): no Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     edit here. (Proof: this file's tail is byte-identical to the source.)

/**
 * ring-orbit-3d — 傾いた 3D リング上を二軸スピンで回す汎用スケジュール。
 *
 * 機構（load-bearing）: 半径 ringRadius の円周に count 点を等間隔で置き、その法線を
 * `axis` から tiltDeg 傾ける。リング全体は `axis` まわりに回り（親ダイヤル
 * parentTurnsPerLoop）、点は法線まわりに循環する（子ダイヤル spinTurnsPerLoop）。
 * 各点は一貫パース m = 1 + depthK·(z/ringRadius) を **位置と半径の両方に同率**で掛けて
 * 2D 投影する — 見かけの緩急・縦の bob・近遠の入れ替わりは全部この投影から創発し、
 * キーフレームイージングは 1 本もない。返す `dark` は偶数インデックス群フラグ（drawer
 * セルが 2 トーン交互に使う）。カメラ向きビルボード等の描画（"auto-orient"）はホスト側。
 *
 * studies/puttimw-motion-drawers の auto-orient セルから昇格（2026-06-09）。
 * Pure schedule: numbers in (frame), numbers out。realization はレンダラに閉じる。
 */
import type { Vec3 } from "./ae-coordinate-space";
import { applyMat3, rotationAboutAxis } from "./rotate-about-axis";
import { ringPoints3d, tiltedUnit } from "./ring3d";

export interface RingOrbitDotState {
  /** projected center, design-cell coords */
  cx: number;
  cy: number;
  /** apparent radius (px) */
  r: number;
  /** signed depth toward viewer in [-1, 1]; bigger = nearer = draw later */
  z: number;
  /** even-index group flag (drawer は 2 トーン交互の dark/light に使う) */
  dark: boolean;
}

export interface RingOrbitParams {
  /** リング中心（投影座標） */
  center: [number, number];
  /** リング 3D 半径 */
  ringRadius: number;
  /** 複製数（dark フラグは i%2 で交互） */
  count: number;
  /** 親回転軸（画面座標・y は下向き）。例 = 画面縦軸 [0,-1,0] */
  axis: Vec3;
  /** リング法線の軸からの傾き（deg）と perpBasis(axis) 平面内の方位 */
  tiltDeg: number;
  tiltAzimuthDeg: number;
  /** ドット 0 の開始位相（deg） */
  spinPhase0Deg: number;
  /** 親回転 / 子循環のループあたり回転数（整数でループ封止） */
  parentTurnsPerLoop: number;
  spinTurnsPerLoop: number;
  periodFrames: number;
  /** 一貫パース係数: m = 1 + depthK·z/R が位置とサイズを同率拡大 */
  depthK: number;
  darkRadiusPx: number;
  lightRadiusPx: number;
}

export const createRingOrbitSchedule = (params: RingOrbitParams) => {
  const period = params.periodFrames;
  const n0 = tiltedUnit(params.axis, params.tiltDeg, params.tiltAzimuthDeg);
  const parentDegPerFrame = (360 * params.parentTurnsPerLoop) / period;
  const spinDegPerFrame = (360 * params.spinTurnsPerLoop) / period;

  return (frame: number): RingOrbitDotState[] => {
    // loop-local frame in [0, period)（負フレーム安全）— study lib/loop の loopFrame を inline
    const t = ((frame % period) + period) % period;
    // 子ダイヤル: リング位相の循環（法線まわり）
    const ring = ringPoints3d(
      n0,
      params.spinPhase0Deg + spinDegPerFrame * t,
      params.ringRadius,
      params.count,
    );
    // 親ダイヤル: 軸まわり等速回転
    const rot = rotationAboutAxis(params.axis, parentDegPerFrame * t);
    return ring.map((p0, i) => {
      const p = applyMat3(rot, p0);
      const z = p[2] / params.ringRadius;
      const m = 1 + params.depthK * z; // 近いほど大きく・外へ（一貫パース）
      const dark = i % 2 === 0;
      return {
        cx: params.center[0] + p[0] * m,
        cy: params.center[1] + p[1] * m,
        r: (dark ? params.darkRadiusPx : params.lightRadiusPx) * m,
        z,
        dark,
      };
    });
  };
};
