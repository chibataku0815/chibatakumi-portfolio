"use client";

// JournalMotionDemo — render boundary for `motion-demo` article blocks.
//
// Maps a demo id (carried by the block, authored in the i18n sections array)
// to a live, framework-independent motion component. Each demo runs a pure
// motion-grammar schedule on an rAF loop; the prose around it stays in the
// shared i18n block model. Adding a new motion study = registering one more
// id here and one more vendored verb under ./verbs.

import { renderInlineCode } from "../inline-code";
import { ComplementTangentPairFinishDemo } from "./ComplementTangentPairFinishDemo";
import { CoupledShearRotationFinishDemo } from "./CoupledShearRotationFinishDemo";
import { GatherReturnFinishDemo } from "./GatherReturnFinishDemo";
import { LatticeBreathFinishDemo } from "./LatticeBreathFinishDemo";
import { MasterRotationEchoFinishDemo } from "./MasterRotationEchoFinishDemo";
import { PulseGridFinishDemo } from "./PulseGridFinishDemo";
import { SharedHoldPulseFinishDemo } from "./SharedHoldPulseFinishDemo";
import { TangencyCoupledDriveFinishDemo } from "./TangencyCoupledDriveFinishDemo";
import { VelocitySeededOvershootFinishDemo } from "./VelocitySeededOvershootFinishDemo";
import { WhipCrawlPathCycleFinishDemo } from "./WhipCrawlPathCycleFinishDemo";

const DEMO_REGISTRY: Record<string, () => React.ReactElement> = {
  // WebGPU finish (grain + CA, parity-proven WGSL port); falls back to the
  // plain SVG LatticeBreathDemo internally when WebGPU is unavailable.
  "lattice-breath": LatticeBreathFinishDemo,
  // Same finish pipeline; article-own grain streams (no posted per-cell clip).
  "pulse-grid": PulseGridFinishDemo,
  "tangency-coupled-drive": TangencyCoupledDriveFinishDemo,
  "complement-tangent-pair": ComplementTangentPairFinishDemo,
  "master-rotation-echo": MasterRotationEchoFinishDemo,
  "shared-hold-pulse": SharedHoldPulseFinishDemo,
  "whip-crawl-path-cycle": WhipCrawlPathCycleFinishDemo,
  "coupled-shear-rotation": CoupledShearRotationFinishDemo,
  "gather-return": GatherReturnFinishDemo,
  "velocity-seeded-overshoot": VelocitySeededOvershootFinishDemo,
};

interface JournalMotionDemoProps {
  readonly demo: string;
  readonly caption?: string;
}

export function JournalMotionDemo({ demo, caption }: JournalMotionDemoProps) {
  const Demo = DEMO_REGISTRY[demo];
  if (!Demo) return null;

  return (
    <figure
      className="my-4 flex flex-col items-center gap-5 rounded-md border border-[var(--text-base-20)] bg-[var(--bg-secondary)]/40 px-6 py-10"
      style={{ color: "var(--text-base)" }}
    >
      <Demo />
      {caption ? (
        <figcaption className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
          {renderInlineCode(caption)}
        </figcaption>
      ) : null}
    </figure>
  );
}
