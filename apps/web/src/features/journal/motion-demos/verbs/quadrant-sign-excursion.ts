// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/quadrant-sign-excursion.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #15
//     (drawer "difference"/差) — see that study's
//     validation/quadrant-sign-excursion-promotion-record.md (and difference-construction-record.md).
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here. Everything below this header comment is byte-
//     identical to the entire upstream file. The measured constants and the demo
//     re-realization live in ./quadrant-sign-excursion.params.ts.

/**
 * quadrant-sign-excursion — ONE palindromic clock (mirrorFrame fold:
 * param(t>mirror) = param(2·mirror − t)) drives four keyed scalar channels
 * through one axis frame (axisDeg), and six equal constant-radius circles are
 * placed as SIGN PLACEMENTS of those shared channels: a QUARTET at the four
 * quadrant sign placements (±u(t), ±v(t)) of ONE shared trajectory (u = 2-key
 * ease ramp, v = apex bump), and an AXIAL PAIR at (±s(t), 0) (s = 2-key ease
 * ramp, lagging u in the origin cell) carrying a band-width scalar (w = apex
 * bump). Members couple ONLY by sharing channels — nothing is derived between
 * them (no contact, no constraint law).
 *
 * MECHANISM (load-bearing):
 *   - The sign placements are FACTORY STRUCTURE (the mk(±u,±v)/mk(±s,0) calls
 *     below), not a params property — contrast shared-hold-pulse, where
 *     mirror-ness lives in params (signed offsetAmp) and was therefore banned
 *     from that module's name. Here "sign" is authored mechanism vocabulary.
 *   - The f-mirror palindrome is THE temporal signature of the origin cell
 *     (mirror axis confirmed at 10× discrimination vs f44.5; rear twins
 *     0.13px). It is carried by the mirrorFrame param and
 *     quadrantSignExcursionMirrorTime — NOT by the module name, because
 *     "palindromic/mirrored" double-reads against the spatial sign mirrors
 *     (a priced trade, not an oversight).
 *   - Loop seal: loopFrame + the mirror clamp give param(period)≡param(0)
 *     (in the origin cell t(88)=t(89)=0, so f88/f89 ≡ f0 at the raster).
 *   - EMERGENT (kept out of every identifier): the symmetric-difference look
 *     (the origin drawer name "difference"/差 — an evenodd render result),
 *     the peanut outline ×2 at the mirror frame, the single ring at rest,
 *     parity extinction at the endpoints, the spatial cubic-bezier path shape
 *     of (u,v) (separated u-ease + v-bump won against a joint 2-key spatial
 *     curve), the overturned "counter-breathing ellipses" shadow model, and
 *     the pinwheel/crescent readings.
 *   - s.endF disclosure (carried verbatim from the origin record, not
 *     hardened): endF 42.5 is a FIT PARAMETER — "arrive then hold" vs a
 *     strong ease tail is footprint-indistinguishable (dIoU ≤ 0.005,
 *     adversarial verdict); mid-loop s carries ±1–2px systematic uncertainty
 *     across instrument families; endpoints are measured-firm.
 *
 * Promoted verbatim from studies/puttimw-motion-drawers cell #15 (drawer
 * "difference"/差 — a result word: the evenodd symmetric difference is what
 * the render shows, not what is keyed; banned from identifiers). The
 * generality demo authored every param (horizontal axis, smaller radii, its
 * own four channels) and called the factory directly — the operational
 * definition of the promotion unit = the whole schedule. Vocabulary mapped at
 * promotion (the study's python fixture keeps the pre-rename keys; the parity
 * script is the translation layer): rFill/rStroke → quadrantRadius/
 * axialRadius; fillCircles/strokeCircles/strokeWidth → quadrantCircles/
 * axialCircles/axialBandWidth ("fill"/"stroke" were renderer routing ops at
 * the schedule surface — the realization, an evenodd compound fill and a
 * Merge-Paths-union outline stroke, stays in the renderer); Ease →
 * UnitBezier (the package already owns the tuple type).
 *
 * n=1 note: QuadrantSignExcursionRampChannel/BumpChannel and their
 * evaluators are module-scoped channel primitives of THIS schedule — not a
 * generic easing-channel API (n=1 abstraction discipline; do not reach for
 * them from other modules before a survival test).
 *
 * Taxonomy: complement-tangent-pair = two circles MUTUALLY coupled by a
 * conserved radius sum at a fixed kiss point (radii animate, placement
 * derived). tangency-coupled-drive = followers DERIVED from one keyed
 * rotation via a clearance law (1-DOF contact coupling). Here NOTHING is
 * derived between members — six constant-radius circles only share scalar
 * channels. traveling-width-wave = a SPATIAL width profile traveling along
 * arc length; w here is a TEMPORAL band-width bump (one scalar per frame).
 *
 * Pure schedule: numbers in (frame), numbers out. Realization (SVG evenodd
 * path, union peanut path, stroke, colors) stays in the renderer; color is
 * NOT part of the schedule type — a consumer that needs fills extends the
 * params (the origin study's type = Params & {fillRgb, backgroundRgb}).
 */

import { unitBezierY, type UnitBezier } from "./unit-bezier";

/** frame → loop-local frame in [0, period). Safe for negative frames.
 *  (inlined from studies/puttimw-motion-drawers/src/lib/loop — the only
 *  non-verbatim edit vs the study verb; render-byte covers it.) */
const loopFrame = (frame: number, period: number): number =>
  ((frame % period) + period) % period;

/** 2-key ease channel (t0 → endF, 0 → end) */
export interface QuadrantSignExcursionRampChannel {
  t0: number;
  endF: number;
  end: number;
  ease: UnitBezier;
}

/** 3-key bump channel (base → apex @apexF → base, per-segment ease) */
export interface QuadrantSignExcursionBumpChannel {
  t0: number;
  apexF: number;
  apex: number;
  /** end key (frame by which the channel returns from apex to base) */
  endF: number;
  base: number;
  e1: UnitBezier;
  e2: UnitBezier;
}

export interface QuadrantSignExcursionParams {
  periodFrames: number;
  /** palindrome axis (param(t>mirror) = param(2*mirror − t)) */
  mirrorFrame: number;
  /** radius of the 4 quadrant circles (constant — origin signature S2) */
  quadrantRadius: number;
  /** radius of the 2 axial circles (constant) */
  axialRadius: number;
  /** quartet trajectory u (axis-direction component) */
  u: QuadrantSignExcursionRampChannel;
  /** quartet trajectory v (perpendicular component, bump) */
  v: QuadrantSignExcursionBumpChannel;
  /** axial-pair separation s (on the axis; lags u in the origin cell) */
  s: QuadrantSignExcursionRampChannel;
  /** band width w of the axial pair's outline (bump) */
  w: QuadrantSignExcursionBumpChannel;
  /** figure center (design px) */
  center: [number, number];
  /** separation-axis angle (deg, y-down; origin cell = 45 = lower-right diagonal) */
  axisDeg: number;
}

export interface QuadrantSignExcursionCircleState {
  cx: number;
  cy: number;
  r: number;
}

export interface QuadrantSignExcursionState {
  /**
   * 4 circles at the sign placements [(+u,+v), (−u,−v), (+u,−v), (−u,+v)] —
   * the origin cell composites them into ONE evenodd path (renderer-side)
   */
  quadrantCircles: QuadrantSignExcursionCircleState[];
  /**
   * 2 circles at [(+s,0), (−s,0)] — the origin cell unions them
   * (Merge Paths "add") and strokes the outline (renderer-side)
   */
  axialCircles: QuadrantSignExcursionCircleState[];
  axialBandWidth: number;
}

export const quadrantSignExcursionRampValue = (
  ch: QuadrantSignExcursionRampChannel,
  t: number,
): number => ch.end * unitBezierY(...ch.ease, (t - ch.t0) / (ch.endF - ch.t0));

export const quadrantSignExcursionBumpValue = (
  ch: QuadrantSignExcursionBumpChannel,
  t: number,
): number => {
  if (t <= ch.apexF) {
    return (
      ch.base +
      (ch.apex - ch.base) *
        unitBezierY(...ch.e1, (t - ch.t0) / (ch.apexF - ch.t0))
    );
  }
  return (
    ch.base +
    (ch.apex - ch.base) *
      (1 - unitBezierY(...ch.e2, (t - ch.apexF) / (ch.endF - ch.apexF)))
  );
};

/** channel evaluation time including the palindrome fold */
export const quadrantSignExcursionMirrorTime = (
  params: QuadrantSignExcursionParams,
  frame: number,
): number => {
  let t = loopFrame(frame, params.periodFrames);
  if (t > params.mirrorFrame) {
    t = 2 * params.mirrorFrame - t;
    if (t < 0) t = 0;
  }
  return t;
};

/**
 * quadrant-sign-excursion schedule — returns the 6 circle states + the band
 * width. All values are pure numbers. Center, axis angle, radii and channels
 * are arguments — reusable as-is for other objects and timings. Params are
 * REQUIRED — the origin cell's bound constants live in the study shim,
 * not here.
 */
export const createQuadrantSignExcursionSchedule = (
  params: QuadrantSignExcursionParams,
) => {
  const rad = (params.axisDeg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  // v direction (perpendicular to the axis — left-hand side in y-down space)
  const vx = -Math.sin(rad);
  const vy = Math.cos(rad);
  const mk = (
    u: number,
    v: number,
    r: number,
  ): QuadrantSignExcursionCircleState => ({
    cx: params.center[0] + ux * u + vx * v,
    cy: params.center[1] + uy * u + vy * v,
    r,
  });
  return (frame: number): QuadrantSignExcursionState => {
    const t = quadrantSignExcursionMirrorTime(params, frame);
    const u = quadrantSignExcursionRampValue(params.u, t);
    const v = quadrantSignExcursionBumpValue(params.v, t);
    const s = quadrantSignExcursionRampValue(params.s, t);
    const w = quadrantSignExcursionBumpValue(params.w, t);
    return {
      quadrantCircles: [
        mk(u, v, params.quadrantRadius),
        mk(-u, -v, params.quadrantRadius),
        mk(u, -v, params.quadrantRadius),
        mk(-u, v, params.quadrantRadius),
      ],
      axialCircles: [
        mk(s, 0, params.axialRadius),
        mk(-s, 0, params.axialRadius),
      ],
      axialBandWidth: w,
    };
  };
};
