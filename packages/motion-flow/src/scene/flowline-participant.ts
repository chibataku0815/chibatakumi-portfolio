// ============================================================
// motion-flowline-webgpu — Phase 9 scene controller + participant
// Plan:    .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase8-plan.md
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §11.1
//
// Substrate characteristic: unlike motion-dot-new where each scene owns an
// independent particle simulation, the 3 flowline scenes share one compute
// handle — they differ only in runtime config (flowForce / noiseScale / drag
// / lifetimeMax / optional attractor) and ribbon multipliers (alphaScale).
// Scene switching therefore does NOT readback/import agent state; it blends
// config values over a short window and issues a one-shot reseed pass so the
// trail history visually resets without a flash-cut.
//
// The TransitionParticipant<FlowSnapshot> interface is still exposed for
// cross-substrate symmetry with motion-dot-new's KineticHandoffController —
// exportState/importState are no-ops (opaque marker snapshot) because the
// shared compute handle carries state across scenes without copying.
// ============================================================

import type { TransitionParticipant } from "webgpu-motion-scene";
import type { FlowlineConfig } from "../compute/flowline-config";
import type { FlowlineComputeHandle } from "../compute/flowline-compute";
import type { RibbonConfig } from "../render/ribbon-config";
import type { FlowlineScene, FlowlineSceneName } from "./laminar";

/**
 * Opaque snapshot marker. The flowline substrate does not serialize agent
 * state across scene switches because all scenes share a single compute
 * handle; the snapshot exists only to satisfy the generic participant
 * interface consumed by future cross-substrate orchestration.
 */
export type FlowSnapshot = {
  readonly kind: "flowline";
  readonly sceneName: FlowlineSceneName;
};

/** Duration of the config blend window at scene switch, in seconds. */
export const FLOWLINE_BLEND_DURATION = 0.5;

/**
 * Effective config snapshot for a single frame. `compute` drives the
 * flowline-update kernel; `ribbon` multiplies into the ribbon render pass.
 */
export type FlowlineFrameConfig = {
  readonly compute: FlowlineConfig;
  readonly ribbon: RibbonConfig;
};

export type FlowlineSceneController = {
  readonly current: FlowlineScene;
  readonly target: FlowlineScene;
  isTransitioning(): boolean;
  /**
   * Request a switch to `nextScene`. Subsequent `tick()` calls will blend
   * config over FLOWLINE_BLEND_DURATION seconds. A trail reseed is fired on
   * the next tick(). Calling switchTo() with the currently-active scene or
   * mid-transition with the same target is a no-op; switching to a new
   * target mid-transition restarts the blend from the current interpolated
   * position.
   */
  switchTo(nextScene: FlowlineScene): void;
  /**
   * Advance blend by `dt` and return the effective compute + ribbon config
   * for this frame. If a switch is pending, issues a single reseed pass via
   * the supplied encoder and clears the flag.
   */
  tick(encoder: GPUCommandEncoder, dt: number): FlowlineFrameConfig;
  /**
   * Cross-substrate participant view. `reset` triggers reseed on the next
   * tick; export/import are opaque markers.
   */
  readonly participant: TransitionParticipant<FlowSnapshot>;
};

// ── Internal blend helpers ─────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

function blendCompute(
  a: FlowlineConfig,
  b: FlowlineConfig,
  t: number,
): FlowlineConfig {
  // Discrete fields (nAgents, nTrail, colorMixBalance, lifetimeMin) are held
  // at the source value across the blend — mutating nAgents mid-flight would
  // require buffer reallocation. Continuous knobs blend smoothly.
  return {
    ...a,
    flowForce:         lerp(a.flowForce,         b.flowForce,         t),
    noiseScale:        lerp(a.noiseScale,        b.noiseScale,        t),
    noiseSpeed:        lerp(a.noiseSpeed,        b.noiseSpeed,        t),
    drag:              lerp(a.drag,              b.drag,              t),
    lifetimeMax:       lerp(a.lifetimeMax,       b.lifetimeMax,       t),
    attractorX:        lerp(a.attractorX,        b.attractorX,        t),
    attractorY:        lerp(a.attractorY,        b.attractorY,        t),
    attractorStrength: lerp(a.attractorStrength, b.attractorStrength, t),
    vorticity:         lerp(a.vorticity,         b.vorticity,         t),
    combStrength:      lerp(a.combStrength,      b.combStrength,      t),
    sdfEdgeSoft:       lerp(a.sdfEdgeSoft,       b.sdfEdgeSoft,       t),
    shapeR:            lerp(a.shapeR,            b.shapeR,            t),
    shapeSmall:        lerp(a.shapeSmall,        b.shapeSmall,        t),
    shapeD:            lerp(a.shapeD,            b.shapeD,            t),
    phaseSpeed:        lerp(a.phaseSpeed,        b.phaseSpeed,        t),
    shapeStrength:     lerp(a.shapeStrength,     b.shapeStrength,     t),
    shapeMode:         lerp(a.shapeMode,         b.shapeMode,         t),
  };
}

function blendRibbon(
  a: RibbonConfig,
  b: RibbonConfig,
  t: number,
): RibbonConfig {
  return {
    maxWidth:    lerp(a.maxWidth,    b.maxWidth,    t),
    minWidth:    lerp(a.minWidth,    b.minWidth,    t),
    widthSpeedK: lerp(a.widthSpeedK, b.widthSpeedK, t),
    curvatureK:  lerp(a.curvatureK,  b.curvatureK,  t),
    widthScale:  lerp(a.widthScale,  b.widthScale,  t),
    alphaScale:  lerp(a.alphaScale,  b.alphaScale,  t),
  };
}

function resolveScene(
  scene: FlowlineScene,
  baseCompute: FlowlineConfig,
  baseRibbon: RibbonConfig,
): FlowlineFrameConfig {
  return {
    compute: { ...baseCompute, ...scene.compute },
    ribbon:  { ...baseRibbon,  ...scene.ribbon  },
  };
}

// ── Controller factory ─────────────────────────────────────────

export type CreateFlowlineSceneControllerOptions = {
  readonly compute: FlowlineComputeHandle;
  readonly initialScene: FlowlineScene;
  readonly baseCompute: FlowlineConfig;
  readonly baseRibbon: RibbonConfig;
};

export function createFlowlineSceneController(
  options: CreateFlowlineSceneControllerOptions,
): FlowlineSceneController {
  const { compute, initialScene, baseCompute, baseRibbon } = options;

  let currentScene = initialScene;
  let targetScene = initialScene;
  // Frozen source frame-config at the moment of switch (may itself be an
  // interpolation mid-transition). Blending always runs from this snapshot
  // to the target scene's resolved config.
  let sourceFrame: FlowlineFrameConfig = resolveScene(
    initialScene,
    baseCompute,
    baseRibbon,
  );
  let targetFrame: FlowlineFrameConfig = sourceFrame;
  let blendProgress = 1; // 1 == settled at target, 0 == just started
  let pendingReseed = false;

  function switchTo(nextScene: FlowlineScene): void {
    if (nextScene.name === targetScene.name) {
      return;
    }
    // Freeze whatever we're currently displaying (may be an in-flight blend).
    sourceFrame = blendProgress >= 1
      ? resolveScene(targetScene, baseCompute, baseRibbon)
      : {
          compute: blendCompute(
            sourceFrame.compute,
            targetFrame.compute,
            smoothstep(blendProgress),
          ),
          ribbon: blendRibbon(
            sourceFrame.ribbon,
            targetFrame.ribbon,
            smoothstep(blendProgress),
          ),
        };
    currentScene = targetScene;
    targetScene = nextScene;
    targetFrame = resolveScene(nextScene, baseCompute, baseRibbon);
    blendProgress = 0;
    pendingReseed = true;
  }

  function tick(encoder: GPUCommandEncoder, dt: number): FlowlineFrameConfig {
    if (pendingReseed) {
      compute.reseedTrails(encoder);
      pendingReseed = false;
    }
    if (blendProgress < 1) {
      blendProgress = Math.min(
        1,
        blendProgress + dt / FLOWLINE_BLEND_DURATION,
      );
      if (blendProgress >= 1) {
        currentScene = targetScene;
        sourceFrame = targetFrame;
      }
    }
    if (blendProgress >= 1) {
      return targetFrame;
    }
    const t = smoothstep(blendProgress);
    return {
      compute: blendCompute(sourceFrame.compute, targetFrame.compute, t),
      ribbon:  blendRibbon(sourceFrame.ribbon,  targetFrame.ribbon,  t),
    };
  }

  const participant: TransitionParticipant<FlowSnapshot> = {
    get count() {
      return compute.nAgents;
    },
    reset(): void {
      // Schedule a reseed on the next tick — same mechanism used by switchTo.
      pendingReseed = true;
    },
    exportState(): FlowSnapshot {
      return { kind: "flowline", sceneName: currentScene.name };
    },
    importState(_snapshot: FlowSnapshot): void {
      // No-op: the shared compute handle already carries agent state. The
      // snapshot is accepted for interface conformance but does not mutate
      // buffers — a real import would require a second compute handle with
      // its own buffers, which Phase 9 intentionally does not create.
    },
  };

  return {
    get current() {
      return currentScene;
    },
    get target() {
      return targetScene;
    },
    isTransitioning(): boolean {
      return blendProgress < 1;
    },
    switchTo,
    tick,
    participant,
  };
}
