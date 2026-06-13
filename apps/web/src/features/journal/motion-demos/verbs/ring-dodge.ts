// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/ring-dodge.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #17
//     (drawer "interference"/干渉) — see that study's
//     validation/ring-dodge-promotion-record.md (and interference-construction-record.md).
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here. Everything below this header comment is byte-
//     identical to the entire upstream file. The measured constants and the demo
//     re-realization live in ./ring-dodge.params.ts.

/**
 * ring-dodge — TWO coupled systems × TWO clocks: an inner dot on a PURE
 * LINEAR orbit, and ring-slot dots driven by (1) ONE authored radial pulse
 * cycle duplicated on an INTEGER frame clock — deliberately NOT tracking the
 * orbiter; the lag drift around the ring is the anti-expression-coupling
 * signature — and (2) two scalar INVERSE-SQUARE proximity dodge fields read
 * off the orbiter's actual position, with pulsed-distance feedback.
 *
 * MECHANISM (load-bearing; numbers below are the ORIGIN binding, disclosed
 * for calibration — the engine itself is fully parameterized):
 *  - inner orbit: pure linear sweep (origin 4°/f, one revolution per 90f
 *    loop, no easing; residual std 0.12° against the reference tracker).
 *  - clocked pulse channel: ONE authored cycle — attack bezier (origin 7.7f)
 *    → authored peak (peakValue; the VISUAL peak adds the dodge top-up) →
 *    bezier decay to rest → exit-velocity-SEEDED damped settle with ZERO free
 *    amplitudes (origin: exit slope −1.51 px/f seeds λ0.22/ω0.27 →
 *    undershoot −2.1 px and a +0.16 px second lobe EMERGE; a free-amplitude
 *    fit improved rms by zero) — duplicated per slot at integer
 *    pulseClockFrames offsets (origin 7×11+13 = 90; the 13f seam parks just
 *    before the top dot). The pulses do NOT track the orbiter: their lag
 *    drifts around the ring (origin 4.23 → 2.48f, sealed as a falsifiable
 *    parity check) — an expression-coupled implementation with constant lag
 *    was refuted in the origin battery.
 *  - dodge channel: two scalar inverse-square proximity fields read off the
 *    inner dot's ACTUAL position — tangential slide −C_t·sin(δ)/d^p and
 *    radial push +C_r·cos(δ)/d^p (origin p=2 both; the radial free fit was
 *    q=1.80 — binding q=2 is a unified-idiom CHOICE costing 0.011 px rms,
 *    disclosed). d uses the PULSED positions, so a dot already pushed outward
 *    is dodged more weakly — the asymmetry is feedback, not authoring (a
 *    rest-distance variant fits 3.37× worse). Field zeros lock to the passes
 *    (origin battery D4).
 *  - evaluation order (the origin python fixture mirrors it): authored clock
 *    pulse → pre-dodge radius r_pre; radial dodge from the distance at r_pre
 *    → final radius r_act; tangential dodge from the distance at r_act →
 *    slide along the ring.
 *  - EMERGENT (deliberately kept out of every identifier): the pre-attack
 *    "creep" (= the radial field's approach side — origin battery D7 proved
 *    it crossing-locked, not authored), the rest "sink" (antipode inward
 *    pull), the size pulsation of the reference (+0.4 px r_eq motion-blur
 *    trace — deliberately NOT implemented), the gooey neck (origin curated
 *    ADJUDICATION 6 — out of scope), the feedback asymmetry (consequence of
 *    pulsed-distance d), and the drawer word interference/干渉 — it names the
 *    proximity-causal READ this rig produces, not the mechanism.
 *
 * USAGE (origin demo v1 lesson, user-caught): the clock is a free ENGINE
 * DOF, but a rig that wants the proximity-causal read carries a SEMANTIC
 * coupling invariant — slot order follows the orbit direction, pulseClockFrames
 * ≈ slot angular spacing / |innerAngularVelocityDegPerFrame| (pass-locked;
 * origin demo v2: 72/4 = 18f, 5×18 = 90, no seam), and pulseAnchorFrame sets
 * a small constant lag. v1 fired slots against the passes and far dots
 * (sep>90°) popped 15.9 px; the re-coupled v2 reads 1.96 px. The engine has
 * NO collision clamp: never-merge is a property of the BINDING (the origin's
 * parity seal pins min edge gap 1.87 px), so a new rig must be checked.
 *
 * Promoted verbatim from studies/puttimw-motion-drawers verb `interference`
 * (cell #17; drawer slug banned from identifiers — it names the read). The
 * generality demo authors its OWN complete 14-field rig (5 slots, REVERSED
 * orbit −4°/f — the fields are odd in δ so the dodge flips sides
 * automatically, exponent-3 sharper fields, a different pulse cycle) and
 * re-realizes the numeric state as diamonds — the operational definition of
 * the promotion unit = the generic engine. Vocabulary mapping at promotion:
 * InterferenceDot/InterferenceOuterDot/InterferenceState →
 * RingDodgeDot/RingDodgeOuterDot/RingDodgeState (banned-stem swap ONLY);
 * interferenceRig (bound construction), interferenceColors, and the
 * createInterferenceSchedule default wrapper stay in the study shim;
 * loopFrame became a module-private copy (below); every other identifier is
 * verbatim, including the bare helper names PulseCycleSpec/DodgeFieldSpec/
 * evalPulseCycle/pulseExitSlope (see NAMING NOTE). The python fixture
 * measured/interference.construction.json is the frozen oracle — untouched;
 * the study parity script consumes the helpers via the shim.
 *
 * NAMING NOTE (priced trades): ring-dodge keeps the lane-era engine name
 * (the construction record's own phrase is "Generic ring-dodge engine");
 * "dodge" names the AUTHORED inverse-square field channel (the rig fields
 * tangentialDodge/radialDodge, origin battery D4/D5), not the banned viewer
 * read. (a) The name foregrounds the dodge channel and omits the clocked-
 * pulse channel — the same omission class as seeded-settle-jump's name
 * omitting its satellite and stretch channels; the pulse rides in
 * RingDodgeRig.pulseCycle and the Taxonomy. (b) Two ecosystem dissents
 * declined 2/3 and priced here: the output types do NOT take the sibling
 * *State suffix (the mandatory rename was bounded to the banned stem; the
 * study shapes carry no State suffix and RingDodgeState already ends in it),
 * and the pulse/dodge helpers keep their bare names (module-prefixing them
 * would be a gratuitous rename; package-uniqueness is not a naming
 * criterion — the pulse-stem shelf is disambiguated in the Taxonomy
 * instead). (c) The ring stem shelves this module with ring-orbit-3d/ring3d
 * (3D primitives) — ring-dodge is the 2D schedule member. (d) RingDodgeRig
 * keeps the Rig suffix (incumbent identifier; Rig is package vocabulary via
 * three-camera-rig) rather than harmonizing to Params.
 *
 * n=1 note: loopFrame and DEG are module-private on purpose — single-
 * consumer primitives, not public API (staggered-loop exports the canonical
 * positiveModulo with the identical formula; same private-copy pattern as
 * seeded-settle-jump).
 *
 * Taxonomy: tangency-coupled-drive = ONE eased driver angle with a HARD
 * geometric tangency constraint fully deriving the follower (no second
 * clock); ring-dodge = SOFT react-at-a-distance fields ADDED to an
 * independently clocked authored channel. pulse-grid = keyed grid pulses;
 * shared-hold-pulse = one rise-HOLD-fall envelope × amplitude map;
 * ring-dodge's PulseCycleSpec = one attack→peak→decay→seeded-settle cycle
 * duplicated on an integer clock around ring slots. The settle tail is the
 * same zero-free-amplitude exit-velocity-seeded damped-sine idiom as
 * seeded-settle-jump / velocity-seeded-overshoot — deliberately NOT a third
 * seeded-* shelf name (here the idiom is a sub-segment of the pulse cycle;
 * the settleLambda/settleOmega field names are kept identical across the
 * family on purpose).
 *
 * Pure schedule: numbers in (frame), numbers out. Realization stays in the
 * renderer; color is NOT schedule state — the origin study keeps
 * interferenceColors beside the shim. Params are REQUIRED — the origin
 * cell's bound constants live in the study shim, not here.
 */
import { unitBezierY } from "./unit-bezier";

const DEG = Math.PI / 180;

/** frame → loop-local frame in [0, period). Private copy of the canonical
 * positiveModulo formula (public export lives in staggered-loop). */
const loopFrame = (frame: number, period: number): number =>
  ((frame % period) + period) % period;

export interface PulseCycleSpec {
  /** local tau of attack start (value 0 -> rises to peak at tau == period) */
  attackStartTau: number;
  /** authored peak value at tau 0 (the visual peak adds the dodge top-up) */
  peakValue: number;
  /** decay returns to rest (value 0) at this tau; settle tail seeds here */
  decayZeroTau: number;
  attackBez: readonly [number, number, number, number];
  decayBez: readonly [number, number, number, number];
  settleLambda: number;
  settleOmega: number;
}

export interface DodgeFieldSpec {
  /** px^(1+exponent) — displacement = strength * trig(delta) / d^exponent
   * (the Px3 suffix is exact at the origin binding's exponent 2) */
  strengthPx3: number;
  exponent: number;
}

export interface RingDodgeRig {
  periodFrames: number;
  ringCenter: readonly [number, number];
  innerOrbitRadiusPx: number;
  innerAngularVelocityDegPerFrame: number;
  innerStartAngleDeg: number;
  innerRenderRadiusPx: number;
  outerRestRadiusPx: number;
  outerRenderRadiusPx: number;
  outerRestAnglesDeg: readonly number[];
  /** integer duplication clock between consecutive pulse copies */
  pulseClockFrames: number;
  /** loop frame of dot 0's pulse peak */
  pulseAnchorFrame: number;
  pulseCycle: PulseCycleSpec;
  tangentialDodge: DodgeFieldSpec;
  radialDodge: DodgeFieldSpec;
}

/** Exit slope (value/frame) of the decay segment at its rest key. */
export const pulseExitSlope = (cycle: PulseCycleSpec): number => {
  const [, , x2, y2] = cycle.decayBez;
  return ((1 - y2) / (1 - x2)) * ((0 - cycle.peakValue) / cycle.decayZeroTau);
};

/**
 * ONE authored pulse cycle: attack [attackStartTau..period] -> peak (tau 0)
 * -> decay [0..decayZeroTau] -> rest hold, plus the additive exit-velocity-
 * seeded damped settle in periodic steady state (zero free amplitudes).
 */
export const evalPulseCycle = (
  cycle: PulseCycleSpec,
  tau: number,
  period: number,
): number => {
  const t = loopFrame(tau, period);
  let base = 0;
  if (t <= cycle.decayZeroTau) {
    const [x1, y1, x2, y2] = cycle.decayBez;
    base =
      cycle.peakValue +
      (0 - cycle.peakValue) * unitBezierY(x1, y1, x2, y2, t / cycle.decayZeroTau);
  } else if (t >= cycle.attackStartTau) {
    const [x1, y1, x2, y2] = cycle.attackBez;
    base =
      cycle.peakValue *
      unitBezierY(
        x1,
        y1,
        x2,
        y2,
        (t - cycle.attackStartTau) / (period - cycle.attackStartTau),
      );
  }
  const v = pulseExitSlope(cycle);
  const { settleLambda: lam, settleOmega: om } = cycle;
  let tail = 0;
  for (const m of [0, 1]) {
    const d = loopFrame(t - cycle.decayZeroTau, period) + m * period;
    tail += (v * Math.exp(-lam * d) * Math.sin(om * d)) / om;
  }
  return base + tail;
};

export interface RingDodgeDot {
  cx: number;
  cy: number;
  r: number;
}

export interface RingDodgeOuterDot extends RingDodgeDot {
  /** radial distance from ring center (rest + pulse + radial dodge) */
  radial: number;
  /** tangential slide along the ring, +CW (the dodge channel) */
  tangential: number;
}

export interface RingDodgeState {
  inner: RingDodgeDot;
  outer: RingDodgeOuterDot[];
}

/**
 * Generic ring-dodge engine. Evaluation order (fixture builder mirrors it):
 * 1. authored clock pulse -> pre-dodge radius r_pre
 * 2. radial dodge from the distance at r_pre -> final radius r_act
 * 3. tangential dodge from the distance at r_act -> slide along the ring.
 */
export const createRingDodgeSchedule = (rig: RingDodgeRig) => {
  const period = rig.periodFrames;
  const [cx, cy] = rig.ringCenter;
  return (frame: number): RingDodgeState => {
    const f = loopFrame(frame, period);
    const innerAngle =
      (rig.innerStartAngleDeg + rig.innerAngularVelocityDegPerFrame * f) * DEG;
    const ix = cx + rig.innerOrbitRadiusPx * Math.sin(innerAngle);
    const iy = cy - rig.innerOrbitRadiusPx * Math.cos(innerAngle);

    const outer = rig.outerRestAnglesDeg.map((angDeg, k) => {
      const tau = loopFrame(
        f - (rig.pulseAnchorFrame + rig.pulseClockFrames * k),
        period,
      );
      const rPre = rig.outerRestRadiusPx + evalPulseCycle(rig.pulseCycle, tau, period);
      const a = angDeg * DEG;
      const ux = Math.sin(a);
      const uy = -Math.cos(a);
      const innerAngleDeg = rig.innerStartAngleDeg + rig.innerAngularVelocityDegPerFrame * f;
      const delta = (((innerAngleDeg - angDeg + 180) % 360) + 360) % 360 - 180;
      const dPre = Math.hypot(ix - (cx + rPre * ux), iy - (cy + rPre * uy));
      const rAct =
        rPre +
        (rig.radialDodge.strengthPx3 * Math.cos(delta * DEG)) /
          dPre ** rig.radialDodge.exponent;
      const dAct = Math.hypot(ix - (cx + rAct * ux), iy - (cy + rAct * uy));
      const tangential =
        (-rig.tangentialDodge.strengthPx3 * Math.sin(delta * DEG)) /
        dAct ** rig.tangentialDodge.exponent;
      const effDeg = angDeg + (tangential / rAct) / DEG;
      const ea = effDeg * DEG;
      return {
        cx: cx + rAct * Math.sin(ea),
        cy: cy - rAct * Math.cos(ea),
        r: rig.outerRenderRadiusPx,
        radial: rAct,
        tangential,
      };
    });

    return {
      inner: { cx: ix, cy: iy, r: rig.innerRenderRadiusPx },
      outer,
    };
  };
};
