// Vendored — verbatim 3D-ring placement primitive from motion-grammar-lab.
//   source: packages/motion-grammar/src/ring3d.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #6 (drawer
//     "auto-orient"/自動方向) as a 3-module set (ring-orbit-3d schedule +
//     ring3d + rotate-about-axis primitives) — see that study's
//     validation/ring-orbit-3d-promotion-record.md.
//   role here: perpBasis / tiltedUnit / ringPoints3d — places equally-spaced
//     points on a circle whose normal is the tilted ring axis.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     These modules are pure (numbers in → numbers out): no Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     edit here. (Proof: this file's tail is byte-identical to the source.)

/** 3D リング配置: 法線 n0 に垂直な半径 r の円周上に count 点を等間隔配置。
 *
 * 基底規約（fit-auto-orient-single-axis.py の ring_points と同一 — パリティ必須）:
 *   ref = |n0.z| < 0.9 ? +z : +x
 *   e1  = normalize(n0 × ref),  e2 = n0 × e1
 * 点 i は位相 phi0Deg + (360/count)·i の cos·e1 + sin·e2。純数値。
 */
import type { Vec3 } from "./ae-coordinate-space";
import { cross, normalize } from "./rotate-about-axis";

const DEG = Math.PI / 180;

/** 軸に直交する右手系基底 (e1, e2) — ref-pick 規約は上記コメントの通り */
export const perpBasis = (axis: Vec3): [Vec3, Vec3] => {
  const n = normalize(axis);
  const ref: Vec3 = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1 = normalize(cross(n, ref));
  const e2 = cross(n, e1); // n⊥e1 の単位ベクトル同士なので既に単位
  return [e1, e2];
};

/** axis から tiltDeg 傾けた単位ベクトル（azimuthDeg は perpBasis(axis) 平面内の向き） */
export const tiltedUnit = (
  axis: Vec3,
  tiltDeg: number,
  azimuthDeg: number,
): Vec3 => {
  const n = normalize(axis);
  const [e1, e2] = perpBasis(n);
  const b = tiltDeg * DEG;
  const a = azimuthDeg * DEG;
  const s = Math.sin(b);
  return [
    Math.cos(b) * n[0] + s * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]),
    Math.cos(b) * n[1] + s * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]),
    Math.cos(b) * n[2] + s * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2]),
  ];
};

/** 法線 n0 のリング上の count 点（中心原点・半径 r・開始位相 phi0Deg） */
export const ringPoints3d = (
  n0: Vec3,
  phi0Deg: number,
  r: number,
  count: number,
): Vec3[] => {
  const [e1, e2] = perpBasis(n0);
  return Array.from({ length: count }, (_, i) => {
    const a = (phi0Deg + (360 / count) * i) * DEG;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [
      r * (c * e1[0] + s * e2[0]),
      r * (c * e1[1] + s * e2[1]),
      r * (c * e1[2] + s * e2[2]),
    ];
  });
};
