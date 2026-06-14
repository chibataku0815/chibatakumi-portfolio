// Vendored — verbatim AE coordinate-space module from motion-grammar-lab.
//   source: packages/motion-grammar/src/ae-coordinate-space.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #6 (drawer
//     "auto-orient"/自動方向) as a 3-module set (ring-orbit-3d schedule +
//     ring3d + rotate-about-axis primitives) — see that study's
//     validation/ring-orbit-3d-promotion-record.md.
//   role here: the single source of the `Vec3` tuple type that the three 3D
//     modules below share (the AE parent/solid transforms it also exports are
//     unused by the ring path — vendored verbatim for byte-parity).
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     These modules are pure (numbers in → numbers out): no Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     edit here. (Proof: this file's tail is byte-identical to the source.)

// AE coordinate-space transforms.
//
// AE composes a layer's world transform from `anchorPoint`, `position`, and
// `scale` (rotation/orientation omitted here — promote when a study needs
// them). For a *child* layer parented to another layer, the child's
// `position` is interpreted in the *parent's* local frame. World-space
// composition is:
//
//   world = parent.position + parent.scale * (child.position - parent.anchor)
//
// For a solid/footage layer with anchor offset from its source origin, points
// expressed in the source's own coordinates (e.g. mask vertices, gradient
// effect points) map to comp space via
//
//   comp = position - anchor + source
//
// Both transforms operate on 3D vectors; pass z=0 for 2D layers. Scale is a
// ratio (0.54 for 54%) — convert from AE's percentage at the call site.

export type Vec3 = readonly [number, number, number];

export type AeParentSnapshot = {
  position: Vec3;
  anchorPoint: Vec3;
  scale: Vec3; // ratios (1 = 100%), not percentages
};

export type AeSolidLayerSnapshot = {
  position: Vec3;
  anchorPoint: Vec3;
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, b: Vec3): Vec3 => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];

export const applyAeParentTransform = (parent: AeParentSnapshot, childPoint: Vec3): Vec3 =>
  add(parent.position, mul(parent.scale, sub(childPoint, parent.anchorPoint)));

export const solidLayerCompOffset = (layer: AeSolidLayerSnapshot): Vec3 =>
  sub(layer.position, layer.anchorPoint);

export const solidPointToComp = (layer: AeSolidLayerSnapshot, sourcePoint: Vec3): Vec3 =>
  add(solidLayerCompOffset(layer), sourcePoint);

export const scaleRatioFromAePercent = (percent: Vec3): Vec3 =>
  [percent[0] / 100, percent[1] / 100, percent[2] / 100];
