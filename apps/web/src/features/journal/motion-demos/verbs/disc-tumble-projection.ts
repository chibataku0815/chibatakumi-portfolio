// Vendored — verbatim disc-tumble (2D→3D) schedule from motion-grammar-lab.
//   source: packages/motion-grammar/src/disc-tumble-projection.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #18 (the
//     last drawer-grid cell — drawer "planar-to-solid"/2D→3D) — see that
//     study's validation/disc-tumble-projection-promotion-record.md.
//   role here: createDiscTumbleProjectionSchedule — the pure (frame → disc
//     silhouette/bore/shading-cues) schedule the article's value-less skeleton
//     is proven equal to. Its private convexHull / projectAboutTiltedAxis /
//     loopFrame ride along inside this file. Imports the canonical ./unit-bezier.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule is pure (numbers in → numbers out): no Remotion, no React,
//     no DOM — safe in an rAF loop. Do not edit here. (Proof: this file's tail
//     is byte-identical to the source.)

/**
 * disc-tumble-projection — ONE thick bored disc on a fixed pivot, driven by a
 * shared symmetric there-and-back envelope, with its silhouette PRODUCED by
 * orthographic projection every frame.
 *
 * MECHANISM (construction-first, signature-tested 2026-06-09; frozen record =
 * studies/puttimw-motion-drawers/validation/planar-to-solid-construction-record.md):
 * - ONE solid thick disc (short cylinder + axial bore) on a FIXED pivot. TWO
 *   there-and-back properties share one symmetric envelope about the peak frame:
 *   - scale(t): eased uniform-scale pulse restScale -> 1 -> restScale
 *     (unitBezier rise/fall).
 *   - theta(t): eased tumble 0 -> 180 -> 0 deg about an IN-PLANE axis tilted
 *     axisTiltDeg from horizontal (unitBezier rise/fall; mild rise-slow/fall-fast
 *     in the origin binding).
 * - Width / height / hole are PRODUCED by the orthographic projection of the disc
 *   at (scale, theta): two rim circles at z = +-thicknessRatio*R are projected and
 *   convex-hulled; the bore is the projected inner-rim bbox, present only while
 *   |cos(theta)| > boreOpenCos. NO measured tables are consulted — geometry is
 *   emergent (the prior WIP replayed measured series; that is the doctrine's named
 *   last-resort failure mode and was rebuilt away).
 * - The tumble axis' in-plane diagonal FLIPS sign on the measured fall window
 *   local in [fallStartFrame, fallAxisEndFrame] (curated ADJUDICATION 1) — only
 *   the y-component of the axis negates.
 * - Rest hold AFTER the pulse: rest window [fallEndFrame, riseStartFrame+period].
 *   In the origin binding (period 90, riseStartFrame -3) that is f58-87, and
 *   f88-89 land on the FALL branch's p>1 clamp (theta=0 deg, scale=restScale —
 *   NOT the rest pose restThetaDeg) — reference-confirmed, adversarial-corrected.
 *   Do not "simplify" f88-89 into the rest window: it changes behavior. The clamp
 *   is COUPLED to unitBezierY's x>=1 early-return guard — never swap in a
 *   clamp-free bezier evaluator.
 * - NEGATIVE riseStartFrame is load-bearing phase pre-advance: the rise enters at
 *   p = -riseStartFrame/riseSpan at frame 0, and restHi = riseStartFrame + period
 *   derives the rest window's upper bound. Passing 0 instead silently shifts the
 *   rest window. The rising-branch wrap (local >= restHi ? local - period : local)
 *   is dead in the ORIGIN binding but goes live for other bindings — kept verbatim.
 * - fallAxisEndFrame (axis-diagonal un-flip) and fallEndFrame (envelope land) are
 *   TWO DISTINCT fall ends (56 vs 58 in the origin binding) — do not harmonize.
 *
 * NAMED RESIDUAL (not modeled, by design): the reference shows a +-6px centerY
 * migration + edge-on band-tilt that FLIPS WITH ROTATION DIRECTION (matched-theta
 * rise/fall masks are vertical mirrors). No static silhouette (SVG or 3D) can
 * produce a direction-dependent feature; it is the reference's motion blur.
 * Accepted as residual, like ring-orbit-3d's origin gamma — a future reader must
 * not "fix" the missing band as a bug.
 *
 * STATE NOTE: outline is a per-frame convex-hull polygon built from 192 projected
 * rim points (N=96 x 2 rims) — the heaviest per-frame state in this package.
 * Parity-style pins on the outline cover its bbox only; the interior shape is
 * owned by render-byte/golden proofs.
 *
 * PROMOTION PROVENANCE (2026-06-10, cell #18 — the last drawer-grid cell):
 * verbatim move from studies/puttimw-motion-drawers/src/verbs/planar-to-solid.ts.
 * The study/drawer label "planar-to-solid" / "2D->3D" names the APPEARANCE READ
 * (a flat thing becoming solid) and is banned from package identifiers, as are
 * the refuted/emergent reads: torus, donut, the flat-"ring" read, "rocking",
 * and the motion-blur band. Vocabulary mapping at promotion:
 * - PlanarToSolidState / PlanarToSolidParams -> DiscTumbleProjectionState /
 *   DiscTumbleProjectionParams (banned-stem swap; the study shim keeps the old
 *   names as type aliases so consumers need zero edits)
 * - HoleState -> DiscTumbleProjectionHoleState (exceeds the banned-stem minimum;
 *   priced below in the NAMING NOTE)
 * - planarToSolidParams (bound literal), the colors, fps, and the default-arg
 *   wrapper stay in the study shim — package params are REQUIRED.
 * - the verb-local unitBezierY copy is replaced by the canonical ./unit-bezier
 *   import (textually identical, bit-identical by construction; the copy predated
 *   the 2026-06-08 consolidation). Its verb-level export dies with zero importers.
 * - loopFrame (study lib) -> module-private 2-arg copy below (canonical
 *   positiveModulo lives in staggered-loop; ring-dodge/seeded-settle-jump precedent).
 *
 * NAMING NOTE (3-lens panel 2026-06-10; trades priced, dissents declined+priced):
 * - The name encodes body (disc) + drive (tumble) + discriminating machinery
 *   (projection) and OMITS: the synchronized uniform-scale pulse co-channel
 *   sharing the envelope (rides in restScale + scaleRise/FallBezier — same
 *   omission class as seeded-settle-jump's satellite/stretch and ring-dodge's
 *   clocked pulse channel); the bore + boreOpenCos gate (carried in State.hole);
 *   the rest hold (deliberately NOT foregrounded — unlike shared-hold-pulse the
 *   hold is not the discriminating signature here, projection emergence is); the
 *   axis tilt + fall-window diagonal flip (params carry them); and "orthographic"
 *   specificity (perspective was REFUTED velocity-even in the record).
 * - "disc" is mechanism vocabulary (the refutation-surviving solid body model),
 *   not an appearance read; the runner-up tumble-pulse-projection was priced down
 *   because dropping the disc underclaims that rim-cloud + bore generation are
 *   disc-HARDWIRED in this engine.
 * - HoleState gained the module stem (2/3): every sub-state *State type behind
 *   the star-export barrel is stem-prefixed; a bare HoleState would be the only
 *   generic-stem State type (Vec3 double-export lesson). The keep-bare dissent
 *   (forced renames should stop at banned stems) is declined and priced here;
 *   the shim aliases the bare name for continuity.
 * - The verb-local unitBezierY export is dropped, not re-exported by the shim
 *   (2/3): zero importers today, and a re-export would recreate a second public
 *   path to the canonical the consolidation reduced to one source.
 *
 * n=1 NOTE: single-origin promotion (this study). convexHull and
 * projectAboutTiltedAxis stay module-private and unpolished until a second study
 * NEEDS them. Two float-distinct Rodrigues spellings now coexist in this package
 * (rotate-about-axis's Mat3 builder vs the private fused projector below) —
 * accepted to preserve the render-byte proof; revisit only if a third appears.
 * rotate-about-axis stays n=1: this module is deliberately NOT its consumer #2
 * (different contract — radians, in-plane axis as cos/sin, fused projection,
 * [X,Y,Z] tuple — and a different float spelling; swapping would change bytes).
 *
 * Taxonomy:
 * - rotate-about-axis = pure Mat3 Rodrigues builder (degrees, arbitrary Vec3
 *   axis, no projection). This module's private projectAboutTiltedAxis = FUSED
 *   radians in-plane-axis rotation + orthographic drop-Z evaluator — algebraically
 *   equal, float-distinct, never calls the builder.
 * - ring-orbit-3d / ring3d = CONTINUOUS dual-axis spin of a tilted 3D ring under
 *   a consistent parallax projection. This module = THERE-AND-BACK (0->180->0)
 *   eased tumble of ONE thick bored disc about ONE in-plane tilted axis,
 *   silhouette + hole emergent from orthographic projection + convex hull, then
 *   a rest hold.
 * - shared-hold-pulse = one rise-HOLD-fall envelope x amplitude map across MANY
 *   elements (the plateau inside the pulse is the signature). This module = one
 *   rise-fall SYMMETRIC envelope about the peak driving TWO channels (uniform
 *   scale + tumble angle) of ONE rigid body, with the long REST hold AFTER the
 *   pulse, not inside it.
 * - seeded-settle-jump / velocity-seeded-overshoot = velocity-seeded settle
 *   tails. This envelope has NO settle or overshoot — bezier there-and-back into
 *   a hard rest window (f88-89 via the fall p>1 clamp).
 *
 * Pure schedule: numbers in (frame), plain numeric state out. Realization (SVG,
 * color, clipped shading) stays with the consumer. Colors and fps are NOT
 * schedule state and are NOT params here (the schedule never reads them); the
 * origin study re-attaches them in its shim type. Params are REQUIRED — the
 * origin's bound literal lives in the study shim.
 */
import { unitBezierY, type UnitBezier } from "./unit-bezier";

/** frame → loop-local frame in [0, period). Module-private copy (canonical
 *  positiveModulo lives in staggered-loop; n=1 discipline, 2-arg explicit). */
const loopFrame = (frame: number, period: number): number =>
  ((frame % period) + period) % period;

export interface DiscTumbleProjectionHoleState {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface DiscTumbleProjectionState {
  /** outer silhouette polygon, design coords, hull order */
  outline: Array<[number, number]>;
  /** hole ellipse (subtracted negative space) or null when the bore is occluded */
  hole: DiscTumbleProjectionHoleState | null;
  /** projected disc face-normal (screen), points where the lit face looks */
  faceNormal: [number, number];
  /** |sin(theta)| — how edge-on the disc reads (1 = edge-on, wall fully shown) */
  edgeOnness: number;
  /** projected half-thickness of the wall band in screen px (for shading) */
  wallBandPx: number;
  /** uniform scale at this frame (debug / parity) */
  scale: number;
  /** tumble angle in degrees (debug / parity) */
  thetaDeg: number;
}

/** Construction params: scalars + easing control points (no series). An explicit
 *  interface (not `typeof`) so consumers can pass varied discs/timings. The 18
 *  fields below are exactly the set the schedule reads — realization meta
 *  (colors, fps) is deliberately not here. */
export interface DiscTumbleProjectionParams {
  periodFrames: number;
  pivot: [number, number];
  peakOuterR: number;
  thicknessRatio: number;
  holeRatio: number;
  axisTiltDeg: number;
  boreOpenCos: number;
  peakFrame: number;
  riseStartFrame: number;
  fallEndFrame: number;
  fallStartFrame: number;
  fallAxisEndFrame: number;
  restScale: number;
  restThetaDeg: number;
  scaleRiseBezier: UnitBezier;
  scaleFallBezier: UnitBezier;
  thetaRiseBezier: UnitBezier;
  thetaFallBezier: UnitBezier;
}

/** Andrew monotone-chain convex hull (CCW, drops collinear). */
const convexHull = (pts: Array<[number, number]>): Array<[number, number]> => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: Array<[number, number]> = [];
  for (let i = p.length - 1; i >= 0; i -= 1) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
};

/** Rotate body point about in-plane axis (cosA,sinA,0) by th (Rodrigues), return
 *  screen (X,Y) [orthographic] and depth Z. Module-private fused evaluator —
 *  deliberately NOT rotate-about-axis's Mat3 builder (see header n=1 note). */
const projectAboutTiltedAxis = (
  x: number,
  y: number,
  z: number,
  axisCos: number,
  axisSin: number,
  th: number,
): [number, number, number] => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const t = 1 - c;
  const ax = axisCos;
  const ay = axisSin;
  const X = (t * ax * ax + c) * x + t * ax * ay * y + s * ay * z;
  const Y = t * ax * ay * x + (t * ay * ay + c) * y + -s * ax * z;
  const Z = -s * ay * x + s * ax * y + c * z;
  return [X, Y, Z];
};

export const createDiscTumbleProjectionSchedule = (params: DiscTumbleProjectionParams) => {
  const {
    periodFrames: period,
    peakFrame,
    riseStartFrame,
    fallEndFrame,
    restScale,
    restThetaDeg,
    peakOuterR,
    thicknessRatio: Tr,
    holeRatio,
    axisTiltDeg,
    boreOpenCos,
    pivot,
    fallStartFrame,
    fallAxisEndFrame,
  } = params;
  const axisTilt = (axisTiltDeg * Math.PI) / 180;
  const riseSpan = peakFrame - riseStartFrame; // 32
  const fallSpan = fallEndFrame - peakFrame; // 29
  const restLo = fallEndFrame; // 58
  const restHi = riseStartFrame + period; // 87

  /** rise/fall phase p∈[0,1]; null while in the rest hold. */
  const pulsePhase = (local: number): { p: number; rising: boolean } | null => {
    if (local >= restLo && local <= restHi) return null;
    if (local <= peakFrame) {
      // dead in practice: rising requires local <= peakFrame (29) < restHi (87);
      // f88-89 take the fall branch (p>1 clamp: theta=0, scale=rest) — reference-supported.
      const unwrapped = local >= restHi ? local - period : local;
      return { p: (unwrapped - riseStartFrame) / riseSpan, rising: true };
    }
    return { p: (local - peakFrame) / fallSpan, rising: false };
  };

  const scaleOf = (local: number): number => {
    const ph = pulsePhase(local);
    if (!ph) return restScale;
    const amp = 1 - restScale;
    if (ph.rising) {
      const [a, b, c, d] = params.scaleRiseBezier;
      return restScale + amp * unitBezierY(a, b, c, d, ph.p);
    }
    const [a, b, c, d] = params.scaleFallBezier;
    return restScale + amp * (1 - unitBezierY(a, b, c, d, ph.p));
  };

  const thetaDegOf = (local: number): number => {
    const ph = pulsePhase(local);
    if (!ph) return restThetaDeg;
    if (ph.rising) {
      const [a, b, c, d] = params.thetaRiseBezier;
      return 180 * unitBezierY(a, b, c, d, ph.p);
    }
    const [a, b, c, d] = params.thetaFallBezier;
    return 180 * (1 - unitBezierY(a, b, c, d, ph.p));
  };

  return (frame: number): DiscTumbleProjectionState => {
    const local = loopFrame(frame, period);
    const scale = scaleOf(local);
    const thetaDeg = thetaDegOf(local);
    const th = (thetaDeg * Math.PI) / 180;
    const R = peakOuterR * scale;

    // axis tilt flips its in-plane diagonal on the measured fall window
    // (curated ADJUDICATION 1) — only the y-component negates.
    const onFall = local >= fallStartFrame && local <= fallAxisEndFrame;
    const axisCos = Math.cos(axisTilt);
    const axisSin = Math.sin(axisTilt) * (onFall ? -1 : 1);

    // outer rim point cloud (two rims at z = +/-Tr*R), projected, hulled.
    const N = 96;
    const raw: Array<[number, number]> = [];
    for (const fz of [Tr * R, -Tr * R]) {
      for (let i = 0; i < N; i += 1) {
        const ph = (2 * Math.PI * i) / N;
        const [X, Y] = projectAboutTiltedAxis(R * Math.cos(ph), R * Math.sin(ph), fz, axisCos, axisSin, th);
        raw.push([X + pivot[0], Y + pivot[1]]);
      }
    }
    const outline = convexHull(raw);

    // hole: projected inner-rim bbox, present only when the bore reads see-through
    let hole: DiscTumbleProjectionHoleState | null = null;
    if (Math.abs(Math.cos(th)) > boreOpenCos) {
      const rh = holeRatio * R;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const fz of [Tr * R, -Tr * R]) {
        for (let i = 0; i < N; i += 1) {
          const ph = (2 * Math.PI * i) / N;
          const [X, Y] = projectAboutTiltedAxis(rh * Math.cos(ph), rh * Math.sin(ph), fz, axisCos, axisSin, th);
          const px = X + pivot[0];
          const py = Y + pivot[1];
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
      hole = {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        rx: (maxX - minX) / 2,
        ry: Math.max(0.5, (maxY - minY) / 2),
      };
    }

    // shading helpers (CLIPPED by the consumer — never alter the footprint)
    const [fnx, fny] = projectAboutTiltedAxis(0, 0, 1, axisCos, axisSin, th);
    const fnLen = Math.hypot(fnx, fny) || 1;
    const faceNormal: [number, number] = [fnx / fnLen, fny / fnLen];
    const edgeOnness = Math.abs(Math.sin(th));
    const wallBandPx = Tr * R * edgeOnness;

    return { outline, hole, faceNormal, edgeOnness, wallBandPx, scale, thetaDeg };
  };
};
