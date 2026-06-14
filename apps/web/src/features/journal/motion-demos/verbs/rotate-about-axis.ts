// Vendored — verbatim Rodrigues 3D-rotation primitive from motion-grammar-lab.
//   source: packages/motion-grammar/src/rotate-about-axis.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #6 (drawer
//     "auto-orient"/自動方向) as a 3-module set (ring-orbit-3d schedule +
//     ring3d + rotate-about-axis primitives) — see that study's
//     validation/ring-orbit-3d-promotion-record.md.
//   role here: cross / normalize / rotationAboutAxis (Rodrigues matrix) /
//     applyMat3 — the vector kit the ring schedule spins points with.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     These modules are pure (numbers in → numbers out): no Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     edit here. (Proof: this file's tail is byte-identical to the source.)

/** 任意軸まわりの 3D 回転（Rodrigues）。純数値 — フレームやイージングを知らない。 */

// Vec3 はパッケージ内の単一正本（ae-coordinate-space）を再利用する。ここで再定義・再 export
// すると barrel の `export *` が Vec3 を二重 export して衝突するため、型のみ import して使う
// （Vec3 の公開口は ae-coordinate-space 一本）。
import type { Vec3 } from "./ae-coordinate-space";
export type Mat3 = [Vec3, Vec3, Vec3];

const DEG = Math.PI / 180;

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const normalize = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
};

/** 単位軸 axis まわり deg 度の回転行列（Rodrigues: I + sinθ·K + (1−cosθ)·K²） */
export const rotationAboutAxis = (axis: Vec3, deg: number): Mat3 => {
  const [x, y, z] = normalize(axis);
  const th = deg * DEG;
  const s = Math.sin(th);
  const c = 1 - Math.cos(th);
  return [
    [1 + c * (x * x - 1), -s * z + c * x * y, s * y + c * x * z],
    [s * z + c * x * y, 1 + c * (y * y - 1), -s * x + c * y * z],
    [-s * y + c * x * z, s * x + c * y * z, 1 + c * (z * z - 1)],
  ];
};

export const applyMat3 = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];
