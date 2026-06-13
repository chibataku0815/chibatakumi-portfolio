// Vendored — verbatim motion grammar from motion-grammar-lab.
//   source: packages/motion-grammar/src/arrangement-turntable.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #14
//     (drawer "arrangement-transition"/配置移行) — see that study's
//     validation/arrangement-transition-construction-record.md and
//     arrangement-turntable-promotion-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The module below is pure (numbers in → numbers out) — its only dependency
//     is the sibling ./unit-bezier easing primitive (also vendored, byte-
//     identical). No Remotion, no React, no DOM — safe in an rAF loop. Keep in
//     sync with upstream; do not re-derive the math here. Everything below this
//     header comment is byte-identical to the entire upstream file. The measured
//     arrangement constants and the demo recentring live in
//     ./arrangement-turntable.params.ts.

/**
 * arrangement-turntable — TWO KEYED ARRANGEMENTS (a rest arrangement = free
 * point list, and a ring arrangement = one radius + fixed slot angles) sharing
 * one center, joined by (1) a "pull-in then fling" expansion — each dot keeps
 * its own angle, dips toward the center on ONE shared anticipation lobe with
 * per-dot onsets, then arrives radially on its own ring slot — (2) a dead-still
 * ring hold, and (3) a TURNTABLE contraction: one shared rotation clock
 * (phiBezier, ending exactly at turntableDeg) carries every dot while its
 * local chord eases ring_local → dest_local (sConBezier), with departure
 * onsets staggered by per-slot delays (in the origin cell: a cosine wave of
 * slot angle — a stagger family of its own, not a ladder).
 *
 * MECHANISM (load-bearing):
 *   - Loop seal: when turntableDeg maps the ring slot family onto itself and
 *     ringToRest re-seats every dot onto an occupied rest seat, identity is
 *     permuted but the dot SET closes — f(period)≡f(0) (byte-exact in the
 *     origin cell, where the middle dot sits AT the shared center).
 *   - The central pile, the return swirl, the seat permutation and the
 *     ring-lattice "wobble" are all EMERGENT (result phenomena — kept out of
 *     every identifier here; the origin record refuted keyed-cluster, stagger
 *     -ladder and rigid-wobble models against the raster census).
 *   - centerSeatDot: dot whose REST seat is the shared center (no
 *     anticipation room at r≈0 — monotone radius on the lobe x-handles).
 *     centerDestinationDot: dot whose contraction DESTINATION is the shared
 *     center (the origin record's "diver" — observed-behavior vocabulary,
 *     kept to docs): its local chord aims at exactly (0,0) so the turntable
 *     carries it into the middle.
 *
 * Promoted verbatim from studies/puttimw-motion-drawers cell #14 (drawer
 * "arrangement-transition"/配置移行 — "arrangement" names the keyed inputs
 * and survives as mechanism vocabulary; "transition" was the result word and
 * is replaced by the mechanism word "turntable"). The generality demo
 * re-authored every param (n=5, vertical LINE ↔ pentagon ring, +144°
 * turntable) — the operational definition of the promotion unit = the whole
 * schedule. Vocabulary mapped at promotion (the study's python fixture keeps
 * the pre-rename keys; the parity script is the translation layer):
 * gridPositions/gridToRing/ringToGrid → restPositions/restToRing/ringToRest
 * ("grid" was the origin cell's 3×3 shape — the demo's rest arrangement is a
 * line, so the old name lied at the authoring surface); centerDot →
 * centerSeatDot; diverDot → centerDestinationDot.
 *
 * Taxonomy: offset-stagger-conveyor = a stagger LADDER riding a conveyor;
 * here the stagger is a per-slot delay wave shifting one shared contraction
 * clock. ring-orbit-3d = a 3D ring spinning under perspective; here a 2D
 * turntable TRANSITS dots between two keyed arrangements. lattice-breath =
 * the lattice itself respires; here the arrangements are static keyed
 * endpoints and only the dots travel.
 *
 * Pure schedule: numbers in (frame), numbers out. Realization (SVG, colors)
 * stays in the renderer; color is NOT part of the schedule type — a consumer
 * that needs fills extends the params. dotRadius IS schedule-read (stamped
 * into every ArrangementTurntableDotState.r). registrationOffsetDesign is a
 * generic placement-offset channel the schedule never reads (the origin cell
 * bound a raster-registration calibration constant there and applies it
 * render-side; generic consumers use {dx: 0, dy: 0}). NOTE the contract
 * differs from lattice-breath, whose schedule DOES consume the same-named
 * field — each module's header is the authority for its own contract.
 */

import { unitBezierY, type UnitBezier } from "./unit-bezier";

/** frame → loop-local frame in [0, period). Safe for negative frames.
 *  (inlined from studies/puttimw-motion-drawers/src/lib/loop — the only
 *  non-verbatim edit vs the study verb; render-byte covers it.) */
const loopFrame = (frame: number, period: number): number =>
  ((frame % period) + period) % period;

export interface ArrangementTurntableParams {
  periodFrames: number;
  /** shared center of both arrangements (design px) */
  center: { x: number; y: number };
  /** rest arrangement positions, indexed g0..g(n-1) (design px) */
  restPositions: ReadonlyArray<readonly [number, number]>;
  /** ring arrangement: radius + FIXED slot angles (deg, screen y-down) */
  ringRadius: number;
  ringAnglesDeg: ReadonlyArray<number>;
  /** expansion destination: rest dot g sits on ring slot restToRing[g] */
  restToRing: ReadonlyArray<number>;
  /** contraction destination: ring slot k lands on rest seat ringToRest[k] */
  ringToRest: ReadonlyArray<number>;
  /** net turntable rotation per loop (deg, + = CW in screen y-down space) */
  turntableDeg: number;
  /**
   * dot whose REST seat is the shared center (no anticipation room: radius
   * eases monotonically 0→ring on the lobe x-handles, angle pinned to its
   * slot). null = no such dot.
   */
  centerSeatDot: number | null;
  /**
   * dot whose contraction DESTINATION is the shared center (the origin
   * record's "diver"): its local chord aims at exactly (0,0) so the turntable
   * carries it into the middle — screen angle = slot + Phi (1Phi default; the
   * measured near-origin whip is unidentifiable from clean data). null = no
   * such dot.
   */
  centerDestinationDot: number | null;
  expansion: {
    /** per-dot key times (frames): MEASURED departure / slot arrival */
    onsets: ReadonlyArray<number>;
    arrivals: ReadonlyArray<number>;
    /** ONE shared lobe shape: x-handles + per-dot dip depth L (negative-y1) */
    lobeXHandles: readonly [number, number];
    lobeDepths: ReadonlyArray<number>;
  };
  contraction: {
    /** shared contraction clock (frames); per-slot delay shifts the WHOLE clock */
    windowStart: number;
    windowEnd: number;
    delaysPerSlot: ReadonlyArray<number>;
    /** turntable angle ease (front-loaded; ends EXACTLY at turntableDeg) */
    phiBezier: UnitBezier;
    /** local chord progress ease ring_local → dest_local */
    sConBezier: UnitBezier;
  };
  /** schedule-read realization channel: stamped into every
   *  ArrangementTurntableDotState.r */
  dotRadius: number;
  /**
   * generic placement-offset channel — the schedule never reads it; the
   * origin cell binds a raster registration calibration here and applies it
   * at render time only (schedule, parity fixture and census-space residuals
   * stay pure). Generic consumers: {dx: 0, dy: 0}.
   */
  registrationOffsetDesign: { dx: number; dy: number };
}

export interface ArrangementTurntableDotState {
  cx: number;
  cy: number;
  r: number;
}

export interface ArrangementTurntableState {
  /** turntable phase angle of the LEAST-delayed slot (deg) — diagnostic
   *  channel; ends at params.turntableDeg each loop */
  phiDeg: number;
  dots: ArrangementTurntableDotState[];
}

const DEG = Math.PI / 180;

/**
 * Schedule factory. All angles are screen y-down degrees (matching the
 * measurement convention: x = cx + r·cos, y = cy + r·sin, CW positive).
 * Params are REQUIRED — the origin cell's bound constants live in the study
 * shim, not here.
 */
export const createArrangementTurntableSchedule = (
  params: ArrangementTurntableParams,
) => {
  const p = params;
  const n = p.restPositions.length;
  const cx = p.center.x;
  const cy = p.center.y;

  const signedArc = (a: number, b: number): number =>
    ((b - a + 180) % 360 + 360) % 360 - 180;

  // per-dot precompute (mirrors the validated python model_check2 exactly)
  const r0 = p.restPositions.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const originAng = p.restPositions.map(([x, y]) =>
    Math.atan2(y - cy, x - cx) / DEG,
  );
  const slotAng = p.restToRing.map((k) => p.ringAnglesDeg[k]);
  const angDelta = originAng.map((a, g) => signedArc(a, slotAng[g]));
  const ringPos = p.ringAnglesDeg.map((a) => [
    cx + p.ringRadius * Math.cos(a * DEG),
    cy + p.ringRadius * Math.sin(a * DEG),
  ]);
  // dest_local = Rot(−THETA)·(dest_rest − C); centerDestinationDot aims at (0,0)
  const th = -p.turntableDeg * DEG;
  const destLocal = p.restToRing.map((k, g) => {
    if (g === p.centerDestinationDot) return [0, 0];
    const [dx, dy] = p.restPositions[p.ringToRest[k]];
    const lx = dx - cx;
    const ly = dy - cy;
    return [lx * Math.cos(th) - ly * Math.sin(th), lx * Math.sin(th) + ly * Math.cos(th)];
  });

  const [lx1, lx2] = p.expansion.lobeXHandles;
  const expEnd = Math.max(...p.expansion.arrivals);

  const expPos = (f: number, g: number): readonly [number, number] => {
    const o = p.expansion.onsets[g];
    const a = p.expansion.arrivals[g];
    const x = f <= o ? 0 : f >= a ? 1 : (f - o) / (a - o);
    if (g === p.centerSeatDot) {
      // no anticipation room at r≈0: monotone radius on the lobe x-handles,
      // angle pinned to the slot
      const rad = r0[g] + unitBezierY(lx1, 0, lx2, 1, x) * (p.ringRadius - r0[g]);
      const ang = slotAng[g] * DEG;
      return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
    }
    const lobe = unitBezierY(lx1, -p.expansion.lobeDepths[g], lx2, 1, x);
    const rad = r0[g] + lobe * (p.ringRadius - r0[g]);
    const ang = (originAng[g] + unitBezierY(lx1, 0, lx2, 1, x) * angDelta[g]) * DEG;
    return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
  };

  const c = p.contraction;
  const phiOf = (f: number, dl: number): number => {
    const fe = f - dl;
    if (fe <= c.windowStart) return 0;
    if (fe >= c.windowEnd) return p.turntableDeg;
    const tau = (fe - c.windowStart) / (c.windowEnd - c.windowStart);
    return p.turntableDeg * unitBezierY(...c.phiBezier, tau);
  };
  const sConOf = (f: number, dl: number): number => {
    const fe = f - dl;
    if (fe <= c.windowStart) return 0;
    if (fe >= c.windowEnd) return 1;
    const tau = (fe - c.windowStart) / (c.windowEnd - c.windowStart);
    return unitBezierY(...c.sConBezier, tau);
  };

  const dotPos = (f: number, g: number): readonly [number, number] => {
    const k = p.restToRing[g];
    const dl = c.delaysPerSlot[k];
    if (f <= expEnd) return expPos(f, g);
    if (f - dl < c.windowStart) {
      return [ringPos[k][0], ringPos[k][1]]; // per-dot delay-shifted ring hold
    }
    const s = sConOf(f, dl);
    const rlx = ringPos[k][0] - cx;
    const rly = ringPos[k][1] - cy;
    const lpx = rlx + s * (destLocal[g][0] - rlx);
    const lpy = rly + s * (destLocal[g][1] - rly);
    const phi = phiOf(f, dl) * DEG;
    return [
      cx + lpx * Math.cos(phi) - lpy * Math.sin(phi),
      cy + lpx * Math.sin(phi) + lpy * Math.cos(phi),
    ];
  };

  const minDelay = Math.min(...c.delaysPerSlot);

  return (frame: number): ArrangementTurntableState => {
    const f = loopFrame(frame, p.periodFrames);
    const dots: ArrangementTurntableDotState[] = [];
    for (let g = 0; g < n; g += 1) {
      const [x, y] = dotPos(f, g);
      dots.push({ cx: x, cy: y, r: p.dotRadius });
    }
    return { phiDeg: phiOf(f, minDelay), dots };
  };
};
