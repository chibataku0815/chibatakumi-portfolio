// Vendored — verbatim motion grammar from motion-grammar-lab.
//   source: packages/motion-grammar/src/seeded-settle-jump.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #16
//     (drawer "time-delay"/時間遅延) — see that study's
//     validation/time-delay-construction-record.md and the package header.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The module below is pure (numbers in → numbers out) — its only deps are
//     the sibling ./staggered-loop and ./unit-bezier primitives (also vendored,
//     byte-identical). No Remotion, no React, no DOM — safe in an rAF loop. Keep
//     in sync with upstream; do not re-derive the math here. Everything below
//     this header comment is byte-identical to the entire upstream file. The
//     measured constants and the demo recentring live in
//     ./seeded-settle-jump.params.ts.

/**
 * seeded-settle-jump — ONE master loop phase drives a 3-key jump profile
 * (rest → extreme ease-out rise → single apex key → ease-in fall with an
 * Easy-Ease landing cushion) whose post-land settle is a damped sine SEEDED
 * by the fall bezier's exit velocity (ZERO free amplitude), with a DERIVED
 * velocity stretch (scaleY = 1 + k·|vy|) and a satellite emitted by two
 * generators anchored at the separation frame; the whole profile is replayed
 * per dot at exact stagger offsets (staggeredLoopSourceFrame).
 *
 * MECHANISM (load-bearing):
 *  - 3-key jump: rest → rise bezier (extreme ease-out; the origin spends ~62%
 *    of rise time decelerating into the apex) → ONE apex key → fall bezier
 *    (ease-in, with an Easy-Ease landing cushion trimming arrival speed).
 *    The ~5f apex plateau is EMERGENT from zero rise-exit × zero fall-entry
 *    slopes — an apex hold key was refuted in the origin battery (rms tie).
 *  - seeded settle TAKEOVER: past the land key the channel becomes
 *    rest + (vLand/ω)·e^(−λt)·sin(ωt), where vLand = fall-bezier exit slope ×
 *    jump height / fallDur (seededSettleJumpLandVelocity) — ZERO free
 *    amplitude (a free-amplitude damped cosine was refuted: same rms with one
 *    more DOF; this is the AE inertial-overshoot idiom). The loop seals
 *    NATURALLY: the sine decays below 1e-3 px before the next liftoff — no
 *    clamp, no freeze. With the origin binding (λ0.17/ω0.426) the liftoff
 *    residual is 4.49e-4 px and the study parity gate fails the seam check at
 *    λ≤0.10 — a falsifiable consequence of the binding, not a guarantee.
 *  - DERIVED velocity stretch: scaleY = 1 + stretchK·|vy| from the analytic
 *    velocity evaluator (seededSettleJumpVy) — never keyed. Classic landing
 *    squash was refuted (scaleY ≥ 1 throughout the fall-deceleration zone);
 *    width is dead-constant. One gain locks launch through settle (origin:
 *    k fitted on launch alone ≡ global k, 0.0314 vs 0.0313).
 *  - satellite: two generators anchored at separationLocalFrame — radius
 *    geometric decay rAnchor·rDecay^age, rise exponential ease-out toward
 *    cyAsymptote — rendered from age −preSeparationFrames so a same-fill
 *    union can show the body-top emergence before separation.
 *  - stagger replay is FACTORY STRUCTURE: dotCount replicas of the SAME
 *    profile at exact staggerFrames offsets via staggeredLoopSourceFrame
 *    (layerNumberBase 0), x positions a uniform series dotCx0 + i·dotSpacing.
 *    launchPhaseShift is capture-timeline calibration (origin curated
 *    ADJUDICATION 5); generality consumers set it to 0.
 *  - EMERGENT (deliberately kept out of every identifier): the apex plateau,
 *    the splash/droplet read, the "oozes out of the dot top then separates"
 *    union bump, the bounce read, and the drawer word time-delay/時間遅延 —
 *    the technique slug names the STAGGER, which is already promoted as
 *    staggeredLoopSourceFrame; this module is the per-dot jump rig.
 *  - Fit-parameter disclosures carried from the origin record: the landing
 *    cushion (Easy-Ease arrival influence halves speed in the final ~1.5f,
 *    ~23 → ~12.2 px/f; the seeded sink depth matches measurement only WITH
 *    the cushion), and super-linear stretch at speed extremes (+0.08-0.10
 *    above linear at n=2 phases, indistinguishable from sub-frame shutter
 *    smear) bound linear on purpose.
 *
 * Promoted verbatim from studies/puttimw-motion-drawers verb `time-delay`
 * (cell #16; drawer slug banned from identifiers — it names the stagger, not
 * this rig). The generality demo authors its OWN complete params (reversed
 * rise/fall asymmetry, different settle/stretch/satellite bindings, 3 dots ×
 * 7f stagger) and re-realizes the numeric state as rounded squares +
 * diamonds — the operational definition of the promotion unit = the whole
 * schedule. Vocabulary mapping at promotion: TimeDelay* → SeededSettleJump*;
 * TimeDelayJumpParams → SeededSettleJumpProfileParams (avoids the Jump-Jump
 * stutter; the params field `jump` is kept); splash → satellite (water-result
 * word purged; TimeDelaySplashParams → SeededSettleJumpSatelliteParams; the
 * factory destructures the field as `satelliteParams` to avoid shadowing the
 * per-dot satellite state local); emergenceFrames → preSeparationFrames
 * (emergent-look word purged; the param IS the pre-separation render window);
 * TIME_DELAY_PERIOD dropped (zero consumers); fillRgb removed from params
 * (color is not schedule state — the origin study type re-attaches it);
 * riseBezier/fallBezier retyped as the package UnitBezier tuple. The python
 * fixture (measured/time-delay.construction.json) keeps the pre-rename keys
 * (splash/emergenceFrames) as frozen provenance; the study parity script is
 * the translation layer.
 *
 * NAMING NOTE (priced trade): "seeded" is deliberately shared with
 * velocity-seeded-overshoot — same AE inertial-overshoot family; the head
 * noun (jump vs overshoot) and the Taxonomy below carry the structural
 * difference. The runner-up name velocity-stretch-jump (foregrounding the
 * package-unique derived stretch) was rejected 2/3: the stretch is a derived
 * co-channel riding the jump, not the drive.
 *
 * n=1 note: unitBezierSlope (analytic cubic-bezier derivative) and
 * positiveModulo are module-private on purpose — single-consumer primitives,
 * not a public easing API (staggered-loop exports the canonical
 * positiveModulo; unit-bezier exports only the n=15-consolidated unitBezierY).
 *
 * Taxonomy: velocity-seeded-overshoot = additive periodic arrival rings on a
 * spatially-mirrored 1-D multi-key channel (value-only evaluator);
 * seeded-settle-jump = ONE arrival takeover past the land key of a
 * rest→apex→rest piecewise jump, whose seed velocity is ALSO consumed by a
 * derived stretch, plus a satellite generator pair (it owns an analytic
 * velocity evaluator, which velocity-seeded-overshoot has not).
 * lattice-breath = master clip envelope with in-clip overshoot scheduled
 * across lattice roles; shared-hold-pulse = one rise-HOLD-fall envelope ×
 * per-element amplitude map; gather-return = pure 4-segment temporal
 * envelope p(frame).
 *
 * Pure schedule: numbers in (frame), numbers out. Realization stays in the
 * renderer; color is NOT part of the schedule type — the origin study type =
 * SeededSettleJumpParams & {fillRgb}. Params are REQUIRED — the origin
 * cell's bound constants live in the study shim, not here.
 */
import { staggeredLoopSourceFrame } from "./staggered-loop";
import { unitBezierY, type UnitBezier } from "./unit-bezier";

export interface SeededSettleJumpSatelliteState {
  cx: number;
  cy: number;
  r: number;
}

export interface SeededSettleJumpDotState {
  cx: number;
  cy: number;
  /** body width, px (constant) */
  width: number;
  /** body height, px (= width * scaleY) */
  height: number;
  satellite: SeededSettleJumpSatelliteState | null;
}

export interface SeededSettleJumpProfileParams {
  /** loop-local phase where the rise key starts (soft liftoff) */
  tLift: number;
  riseDur: number;
  fallDur: number;
  cyApex: number;
  riseBezier: UnitBezier;
  fallBezier: UnitBezier;
  /** inertial-overshoot decay rate, 1/frame */
  settleLambda: number;
  /** inertial-overshoot angular frequency, rad/frame */
  settleOmega: number;
}

export interface SeededSettleJumpSatelliteParams {
  /** local frame where the satellite separates from the dot (generator age 0) */
  separationLocalFrame: number;
  /** frames rendered BEFORE separation (pre-separation render window) */
  preSeparationFrames: number;
  /** frames rendered from separation on */
  lifeFrames: number;
  /** radius generator: r(age) = rAnchor · rDecay^age */
  rAnchor: number;
  rDecay: number;
  /** rise generator: cy(age) = cyAsymptote + (cyAnchor − cyAsymptote) · cyRatio^age */
  cyAnchor: number;
  cyAsymptote: number;
  cyRatio: number;
}

export interface SeededSettleJumpParams {
  periodFrames: number;
  staggerFrames: number;
  /** capture-timeline alignment (origin curated ADJUDICATION 5) */
  launchPhaseShift: number;
  dotCount: number;
  /** dot x positions: uniform series dotCx0 + i·dotSpacing */
  dotCx0: number;
  dotSpacing: number;
  restCy: number;
  sizeBasePx: number;
  /** velocity-stretch gain: scaleY = 1 + stretchK·|vy| */
  stretchK: number;
  jump: SeededSettleJumpProfileParams;
  satellite: SeededSettleJumpSatelliteParams;
}

/** Unit cubic-bezier slope dy/dx at x (same bisection; end slopes from the
 *  control polygon). Drives the DERIVED velocity stretch. */
const unitBezierSlope = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  x: number,
): number => {
  if (x <= 0) return p1x > 1e-9 ? p1y / p1x : 0;
  if (x >= 1) return 1 - p2x > 1e-9 ? (1 - p2y) / (1 - p2x) : 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    const omt = 1 - mid;
    const bx = 3 * omt * omt * mid * p1x + 3 * omt * mid * mid * p2x + mid ** 3;
    if (bx < x) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  const omt = 1 - t;
  const dx = 3 * omt * omt * p1x + 6 * omt * t * (p2x - p1x) + 3 * t * t * (1 - p2x);
  const dy = 3 * omt * omt * p1y + 6 * omt * t * (p2y - p1y) + 3 * t * t * (1 - p2y);
  if (dx <= 1e-12) return 0;
  return dy / dx;
};

/** Land-key incoming velocity (px/f) — derived, seeds the overshoot sine. */
export const seededSettleJumpLandVelocity = (p: SeededSettleJumpParams): number => {
  const [, , c2x, c2y] = p.jump.fallBezier;
  const slope = 1 - c2x > 1e-9 ? (1 - c2y) / (1 - c2x) : 0;
  return (slope * (p.restCy - p.jump.cyApex)) / p.jump.fallDur;
};

/** Master jump profile cy(tau), tau = frames since liftoff in [0, period). */
export const seededSettleJumpCy = (tau: number, p: SeededSettleJumpParams): number => {
  const { jump } = p;
  const amp = p.restCy - jump.cyApex;
  if (tau < jump.riseDur) {
    const [b1x, b1y, b2x, b2y] = jump.riseBezier;
    return p.restCy - amp * unitBezierY(b1x, b1y, b2x, b2y, tau / jump.riseDur);
  }
  const landTau = jump.riseDur + jump.fallDur;
  if (tau < landTau) {
    const [c1x, c1y, c2x, c2y] = jump.fallBezier;
    return (
      jump.cyApex + amp * unitBezierY(c1x, c1y, c2x, c2y, (tau - jump.riseDur) / jump.fallDur)
    );
  }
  const t = tau - landTau;
  const vLand = seededSettleJumpLandVelocity(p);
  return (
    p.restCy +
    (vLand / jump.settleOmega) *
      Math.exp(-jump.settleLambda * t) *
      Math.sin(jump.settleOmega * t)
  );
};

/** Master jump velocity vy(tau), px/frame (analytic — drives the stretch). */
export const seededSettleJumpVy = (tau: number, p: SeededSettleJumpParams): number => {
  const { jump } = p;
  const amp = p.restCy - jump.cyApex;
  if (tau < jump.riseDur) {
    const [b1x, b1y, b2x, b2y] = jump.riseBezier;
    return (-amp / jump.riseDur) * unitBezierSlope(b1x, b1y, b2x, b2y, tau / jump.riseDur);
  }
  const landTau = jump.riseDur + jump.fallDur;
  if (tau < landTau) {
    const [c1x, c1y, c2x, c2y] = jump.fallBezier;
    return (
      (amp / jump.fallDur) *
      unitBezierSlope(c1x, c1y, c2x, c2y, (tau - jump.riseDur) / jump.fallDur)
    );
  }
  const t = tau - landTau;
  const vLand = seededSettleJumpLandVelocity(p);
  const e = Math.exp(-jump.settleLambda * t);
  return (
    (vLand / jump.settleOmega) *
    e *
    (jump.settleOmega * Math.cos(jump.settleOmega * t) -
      jump.settleLambda * Math.sin(jump.settleOmega * t))
  );
};

const positiveModulo = (v: number, m: number): number => ((v % m) + m) % m;

export const createSeededSettleJumpSchedule = (params: SeededSettleJumpParams) => {
  const { jump, satellite: satelliteParams } = params;
  return (frame: number): SeededSettleJumpDotState[] => {
    const states: SeededSettleJumpDotState[] = [];
    for (let i = 0; i < params.dotCount; i += 1) {
      // launchPhaseShift: capture-timeline alignment (origin curated ADJUDICATION 5)
      const p = staggeredLoopSourceFrame({
        frame: frame + params.launchPhaseShift,
        layerNumber: i,
        offsetFrames: params.staggerFrames,
        loopFrames: params.periodFrames,
        layerNumberBase: 0,
      });
      const tau = positiveModulo(p - jump.tLift, params.periodFrames);
      const vy = seededSettleJumpVy(tau, params);
      const scaleY = 1 + params.stretchK * Math.abs(vy);
      const cx = params.dotCx0 + i * params.dotSpacing;
      // satellite age, wrap-centered so demo timings near the seam still work
      const half = params.periodFrames / 2;
      const age =
        positiveModulo(p - satelliteParams.separationLocalFrame + half, params.periodFrames) -
        half;
      const satellite =
        age >= -satelliteParams.preSeparationFrames && age < satelliteParams.lifeFrames
          ? {
              cx,
              cy:
                satelliteParams.cyAsymptote +
                (satelliteParams.cyAnchor - satelliteParams.cyAsymptote) *
                  satelliteParams.cyRatio ** age,
              r: satelliteParams.rAnchor * satelliteParams.rDecay ** age,
            }
          : null;
      states.push({
        cx,
        cy: seededSettleJumpCy(tau, params),
        width: params.sizeBasePx,
        height: params.sizeBasePx * scaleY,
        satellite,
      });
    }
    return states;
  };
};
