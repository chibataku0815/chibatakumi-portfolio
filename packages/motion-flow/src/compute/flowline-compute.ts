// ============================================================
// motion-flowline-webgpu — Phase 7 host-side compute wiring
//
// Plan:     .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase7-plan.md §3 Stream 2
// Handoff:  docs/guides/2026-04-18-motion-flowline-webgpu-phase7-onward-complete-handoff.md §10.1
// Pattern:  output/motion-dot-new-webgpu/src/compute/particle-system.ts
//
// Responsibilities:
//   - Allocate 3 SEPARATE buffers (agent / trail / params) per Integration
//     Contract §2.6 writeBuffer-per-layer rule.
//   - Deterministic seeded init of agent state.
//   - Build compute pipeline with N_TRAIL pipeline-override constant.
//   - Expose pure helpers (advanceHeadIdx, shouldRespawn, applyRespawn,
//     clearJustSpawned) for Stream 4 bun:test — these have no WebGPU deps.
// ============================================================

import FLOWLINE_UPDATE_WGSL from "./flowline-update.wgsl?raw";
import type { FlowlineConfig } from "./flowline-config";

// ── Layout constants (exported for Stream 4 tests) ──────────

/** Number of f32 slots per Agent struct (48 B / 4 B). */
export const AGENT_FLOATS = 12;
/** Size of Agent struct in bytes (Integration Contract §2.1). */
export const AGENT_BYTES = 48;

/** Number of f32 slots per TrailVertex struct (16 B / 4 B). */
export const TRAIL_FLOATS = 4;
/** Size of TrailVertex struct in bytes (Integration Contract §2.2). */
export const TRAIL_BYTES = 16;

/**
 * Size of FlowlineParams uniform in bytes.
 *
 * Phase 7:  32 B (8 × f32/u32)
 * Phase 9:  48 B (12 × f32/u32) — added attractor{X,Y,Strength} + vorticity at
 *   offsets 32/36/40/44 (Integration Contract §2.3 rev. Phase 9).
 * Phase 10: 64 B (16 × f32/u32) — added audio canon slots breathStrength /
 *   vorticityPulse / rimPulse + _pad at offsets 48/52/56/60.
 * Phase 11: 96 B (24 × f32) — added glyph SDF slots glyphCenter{X,Y} /
 *   glyphWidth / glyphHeight / combStrength / sdfEdgeSoft + vec2 pad at
 *   offsets 64/68/72/76/80/84/88.
 * Phase 14: 128 B (32 × f32) — added shape attractor slots shapeR / shapeSmall /
 *   shapeD / phaseSpeed / shapeStrength / shapeMode + vec2 pad at offsets
 *   96/100/104/108/112/116/120. Uniform binding stride stays 16 B aligned.
 */
export const PARAMS_BYTES = 128;
/** Number of f32 slots in FlowlineParams. */
export const PARAMS_FLOATS = 32;

/** Workgroup size matching WGSL @workgroup_size(64). */
export const WORKGROUP_SIZE = 64;

/**
 * Float32Array indices into a single Agent struct (stride = AGENT_FLOATS).
 * `flags` and `headIdx` are u32 fields — read/write via a Uint32Array view
 * aliased onto the same ArrayBuffer.
 */
export const AGENT_OFFSETS = {
  pos: 0,
  vel: 2,
  age: 4,
  maxAge: 5,
  headIdx: 6,
  flags: 7,
  colorMix: 8,
  phase: 9,
  pad: 10,
} as const;

const TAU = Math.PI * 2;
const JUST_SPAWNED_BIT = 1;

// ── Pure helpers (exported for tests) ───────────────────────

/**
 * Advance a power-of-two ring-buffer head index without modulo.
 * Matches WGSL expression `(headIdx + 1u) & (N_TRAIL - 1u)`.
 *
 * @param headIdx Current head index (0 .. nTrail-1).
 * @param nTrail  Ring buffer length; MUST be a power of two.
 */
export function advanceHeadIdx(headIdx: number, nTrail: number): number {
  return (headIdx + 1) & (nTrail - 1);
}

/**
 * Returns true when the agent must respawn this frame: lifetime expired,
 * or position left the unit square.
 */
export function shouldRespawn(
  age: number,
  maxAge: number,
  x: number,
  y: number,
): boolean {
  if (age > maxAge) return true;
  if (x < 0 || x > 1 || y < 0 || y > 1) return true;
  return false;
}

/** Agent state view used by host-side pure helpers and tests. */
export type AgentState = {
  pos: [number, number];
  vel: [number, number];
  age: number;
  maxAge: number;
  headIdx: number;
  flags: number;
  colorMix: number;
  phase: number;
};

/**
 * Mutate `agent` in place with a fresh respawned state.
 *   - pos: two independent rng draws (uniform [0,1))
 *   - vel: zeroed
 *   - age: 0
 *   - maxAge: uniform in [lifetimeMin, lifetimeMax)
 *   - flags: OR-in justSpawned bit (bit 0)
 *   - colorMix: 0 (ink) if rng() < colorMixBalance, else 1 (paper)
 * headIdx and phase are left untouched (phase is a render-side cosmetic seed).
 */
export function applyRespawn(
  agent: AgentState,
  rng: () => number,
  lifetimeMin: number,
  lifetimeMax: number,
  colorMixBalance: number,
): void {
  agent.pos = [rng(), rng()];
  agent.vel = [0, 0];
  agent.age = 0;
  agent.maxAge = lifetimeMin + rng() * (lifetimeMax - lifetimeMin);
  agent.flags = agent.flags | JUST_SPAWNED_BIT;
  agent.colorMix = rng() < colorMixBalance ? 0 : 1;
}

/** Clear the justSpawned bit (bit 0) while preserving all other flag bits.
 *  Result is coerced to unsigned 32-bit so callers that compare against
 *  literal u32 values (e.g. 0xfffffffe) see the expected positive number. */
export function clearJustSpawned(flags: number): number {
  return (flags & ~JUST_SPAWNED_BIT) >>> 0;
}

// ── Deterministic PRNG (mulberry32) ─────────────────────────

/**
 * Seeded deterministic PRNG. Same seed → same stream of values.
 * Used for init-time reproducibility in tests and debugging.
 */
export function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Initial agent data builder ──────────────────────────────

type InitialAgentData = {
  agentData: Float32Array;
  agentDataU32: Uint32Array;
};

/**
 * Build the initial agent storage buffer contents.
 * Returns both a Float32Array and a Uint32Array view aliased onto the SAME
 * underlying ArrayBuffer — the u32 view is required to write `headIdx` and
 * `flags` without the bit-pattern corruption that `Float32Array` would cause.
 *
 * maxAge is assigned via stratified uniform sampling: each agent is placed in
 * a distinct lifetime bin and jittered within it, avoiding the "collective
 * death" pulse that would arise from pure iid uniform draws (CD §1.3).
 */
export function buildInitialAgentData(
  nAgents: number,
  config: FlowlineConfig,
  rng: () => number,
): InitialAgentData {
  const agentData = new Float32Array(nAgents * AGENT_FLOATS);
  const agentDataU32 = new Uint32Array(agentData.buffer);

  const lifespan = config.lifetimeMax - config.lifetimeMin;
  const bucketSize = lifespan / nAgents;
  const PHI = 0.6180339887498949; // golden-ratio fractional part

  for (let i = 0; i < nAgents; i++) {
    const base = i * AGENT_FLOATS;

    // stratified bin index via golden-ratio low-discrepancy sequence
    const binIdx = Math.floor(((i * PHI) % 1) * nAgents);
    const jitter = rng();
    const maxAge =
      config.lifetimeMin + (binIdx + jitter) * bucketSize;

    // pos: keep a small margin so agents don't instantly OOB-respawn
    const px = 0.02 + rng() * 0.96;
    const py = 0.02 + rng() * 0.96;

    const colorMix = rng() < config.colorMixBalance ? 0 : 1;
    const phase = rng() * TAU;

    agentData[base + AGENT_OFFSETS.pos + 0] = px;
    agentData[base + AGENT_OFFSETS.pos + 1] = py;
    agentData[base + AGENT_OFFSETS.vel + 0] = 0;
    agentData[base + AGENT_OFFSETS.vel + 1] = 0;
    agentData[base + AGENT_OFFSETS.age] = 0;
    agentData[base + AGENT_OFFSETS.maxAge] = maxAge;
    agentDataU32[base + AGENT_OFFSETS.headIdx] = 0;
    agentDataU32[base + AGENT_OFFSETS.flags] = JUST_SPAWNED_BIT; // bit 0 set
    agentData[base + AGENT_OFFSETS.colorMix] = colorMix;
    agentData[base + AGENT_OFFSETS.phase] = phase;
    agentData[base + AGENT_OFFSETS.pad + 0] = 0;
    agentData[base + AGENT_OFFSETS.pad + 1] = 0;
  }

  return { agentData, agentDataU32 };
}

// ── Public API types ────────────────────────────────────────

export type FlowlineRuntimeParams = {
  time: number;
  dt: number;
  flowForce: number;
  noiseScale: number;
  noiseSpeed: number;
  drag: number;
  /** Optional u32 override; falls back to the seed captured at create time. */
  seed?: number;
  /** Attractor target X in normalized [0,1]. Active only when strength > 0. */
  attractorX: number;
  /** Attractor target Y in normalized [0,1]. Active only when strength > 0. */
  attractorY: number;
  /** Attractor pull coefficient. 0 disables the attractor term. */
  attractorStrength: number;
  /** Curl vorticity coefficient. 0 disables the vorticity term. */
  vorticity: number;
  /** Audio bass → whole-field breath. Multiplies flowForce by (1 + 0.35*s). */
  breathStrength: number;
  /** Audio bassOnset → transient vorticity kick added on top of scene vorticity. */
  vorticityPulse: number;
  /** Audio trebleOnset → ribbon rim highlight (consumed by ribbon shader, forwarded for parity). */
  rimPulse: number;
  /** Phase 11 — Glyph centre in agent unit-square coords (0..1). */
  glyphCenterX: number;
  glyphCenterY: number;
  /** Phase 11 — Glyph world extent along X/Y. Used by compute to map pos → SDF uv. */
  glyphWidth: number;
  glyphHeight: number;
  /**
   * Phase 11 — Comb/Flow weight. 0 means SDF block is short-circuited; non-
   * Comb scenes keep this at 0 for an equivalent-cost no-op.
   */
  combStrength: number;
  /** Phase 11 — SDF smoothstep band in world units (distance to glyph edge). */
  sdfEdgeSoft: number;
  /** Phase 14 — Outer rolling-circle radius (unit square). */
  shapeR: number;
  /** Phase 14 — Inner rolling-circle radius. */
  shapeSmall: number;
  /** Phase 14 — Pen offset controlling petal depth. */
  shapeD: number;
  /** Phase 14 — Angular scrub speed (rad/s) applied via `time * phaseSpeed`. */
  phaseSpeed: number;
  /** Phase 14 — Spring coefficient toward parametric target. 0 disables block. */
  shapeStrength: number;
  /** Phase 14 — Curve family selector (1=hypotrochoid). */
  shapeMode: number;
};

export type CreateFlowlineComputeOptions = {
  config: FlowlineConfig;
  /**
   * Phase 11 — SDF texture + sampler bound into the update kernel at slots
   * 3 and 4. Required: the uniform layout references both unconditionally,
   * so callers must upload a glyph SDF before constructing the handle.
   */
  sdfTextureView: GPUTextureView;
  sdfSampler: GPUSampler;
  /** Deterministic init seed. If omitted, derived from Date.now(). */
  seed?: number;
};

export type FlowlineComputeHandle = {
  update(encoder: GPUCommandEncoder, params: FlowlineRuntimeParams): void;
  /**
   * One-shot reseed pass: sets `flags |= 1` (justSpawned) and zeroes `age` on
   * every agent. Used by Phase 9 scene transitions to hide stale trail
   * segments until the ring buffer refills with fresh samples at the new
   * scene's noise frequency.
   *
   * Preserves pos/vel/maxAge/colorMix so the ensemble's spatial distribution
   * carries across the scene switch — only the trail history is discarded.
   */
  reseedTrails(encoder: GPUCommandEncoder): void;
  readonly agentBuffer: GPUBuffer;
  readonly trailBuffer: GPUBuffer;
  readonly paramsBuffer: GPUBuffer;
  readonly nAgents: number;
  destroy(): void;
};

// ── Main factory ────────────────────────────────────────────

export function createFlowlineCompute(
  device: GPUDevice,
  options: CreateFlowlineComputeOptions,
): FlowlineComputeHandle {
  const { config } = options;
  const nAgents = config.nAgents;
  const nTrail = config.nTrail;
  const initSeed = (options.seed ?? Date.now()) >>> 0;

  // ── Shader & pipeline ────────────────────────────────────
  const module = device.createShaderModule({
    label: "flowline-update-module",
    code: FLOWLINE_UPDATE_WGSL,
  });

  const pipeline = device.createComputePipeline({
    label: "flowline-update",
    layout: "auto",
    compute: {
      module,
      entryPoint: "update",
      constants: { N_TRAIL: nTrail },
    },
  });

  // Phase 9: one-shot reseed entry point (sets flags|=1, age=0 on all agents).
  // Shares the same shader module but uses a distinct pipeline with its own
  // auto-derived bind group layout. Bound only to the agent storage — trails
  // and params are untouched.
  const reseedPipeline = device.createComputePipeline({
    label: "flowline-reseed-trails",
    layout: "auto",
    compute: {
      module,
      entryPoint: "reseed_trails",
    },
  });

  // ── Buffers (3 separate allocations — Integration Contract §2.6) ──

  const agentBuffer = device.createBuffer({
    label: "flowline-agents",
    size: nAgents * AGENT_BYTES,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });

  const trailBuffer = device.createBuffer({
    label: "flowline-trails",
    size: nAgents * nTrail * TRAIL_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const paramsBuffer = device.createBuffer({
    label: "flowline-params",
    size: PARAMS_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // ── Seed agent buffer with deterministic init data ───────
  const rng = createMulberry32(initSeed);
  const { agentData } = buildInitialAgentData(nAgents, config, rng);
  device.queue.writeBuffer(
    agentBuffer,
    0,
    agentData.buffer,
    agentData.byteOffset,
    agentData.byteLength,
  );

  // Trail buffer: zero-initialised. GPU buffers are not guaranteed to be
  // zeroed on allocation, so we write one zero block explicitly.
  const trailZeros = new Float32Array(nAgents * nTrail * TRAIL_FLOATS);
  device.queue.writeBuffer(
    trailBuffer,
    0,
    trailZeros.buffer,
    trailZeros.byteOffset,
    trailZeros.byteLength,
  );

  // ── Bind group ───────────────────────────────────────────
  const bindGroup = device.createBindGroup({
    label: "flowline-compute-bg",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: agentBuffer } },
      { binding: 1, resource: { buffer: trailBuffer } },
      { binding: 2, resource: { buffer: paramsBuffer } },
      { binding: 3, resource: options.sdfTextureView },
      { binding: 4, resource: options.sdfSampler },
    ],
  });

  // Phase 9 reseed bind group — only agents at binding 0.
  const reseedBindGroup = device.createBindGroup({
    label: "flowline-reseed-bg",
    layout: reseedPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: agentBuffer } },
    ],
  });

  // ── Params scratch (single allocation, reused every frame) ──
  const paramsScratch = new ArrayBuffer(PARAMS_BYTES);
  const paramsF32 = new Float32Array(paramsScratch);
  const paramsU32 = new Uint32Array(paramsScratch);

  // ── DEV perf probe (sampled every 60 frames to avoid log spam) ──
  const DEV = Boolean(
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV,
  );
  let frameCounter = 0;
  const PERF_SAMPLE_INTERVAL = 60;
  const PERF_TIMER_LABEL = "flowline.compute";

  function update(
    encoder: GPUCommandEncoder,
    params: FlowlineRuntimeParams,
  ): void {
    // Pack uniform — layout matches WGSL FlowlineParams struct (§2.3 rev Phase 10)
    paramsF32[0] = params.time;
    paramsF32[1] = params.dt;
    paramsF32[2] = params.flowForce;
    paramsF32[3] = params.noiseScale;
    paramsF32[4] = params.noiseSpeed;
    paramsF32[5] = params.drag;
    paramsU32[6] = nTrail >>> 0;
    paramsU32[7] = (params.seed ?? initSeed) >>> 0;
    paramsF32[8]  = params.attractorX;
    paramsF32[9]  = params.attractorY;
    paramsF32[10] = params.attractorStrength;
    paramsF32[11] = params.vorticity;
    paramsF32[12] = params.breathStrength;
    paramsF32[13] = params.vorticityPulse;
    paramsF32[14] = params.rimPulse;
    paramsF32[15] = 0;
    paramsF32[16] = params.glyphCenterX;
    paramsF32[17] = params.glyphCenterY;
    paramsF32[18] = params.glyphWidth;
    paramsF32[19] = params.glyphHeight;
    paramsF32[20] = params.combStrength;
    paramsF32[21] = params.sdfEdgeSoft;
    paramsF32[22] = 0;
    paramsF32[23] = 0;
    paramsF32[24] = params.shapeR;
    paramsF32[25] = params.shapeSmall;
    paramsF32[26] = params.shapeD;
    paramsF32[27] = params.phaseSpeed;
    paramsF32[28] = params.shapeStrength;
    paramsF32[29] = params.shapeMode;
    paramsF32[30] = 0;
    paramsF32[31] = 0;

    device.queue.writeBuffer(paramsBuffer, 0, paramsScratch);

    const sampleThisFrame =
      DEV && frameCounter % PERF_SAMPLE_INTERVAL === 0;
    if (sampleThisFrame) {
      // eslint-disable-next-line no-console
      console.time(PERF_TIMER_LABEL);
    }

    const pass = encoder.beginComputePass({ label: "flowline-update" });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(nAgents / WORKGROUP_SIZE));
    pass.end();

    if (sampleThisFrame) {
      // eslint-disable-next-line no-console
      console.timeEnd(PERF_TIMER_LABEL);
    }
    frameCounter++;
  }

  function reseedTrails(encoder: GPUCommandEncoder): void {
    const pass = encoder.beginComputePass({ label: "flowline-reseed-trails" });
    pass.setPipeline(reseedPipeline);
    pass.setBindGroup(0, reseedBindGroup);
    pass.dispatchWorkgroups(Math.ceil(nAgents / WORKGROUP_SIZE));
    pass.end();
  }

  function destroy(): void {
    agentBuffer.destroy();
    trailBuffer.destroy();
    paramsBuffer.destroy();
  }

  return {
    update,
    reseedTrails,
    get agentBuffer() {
      return agentBuffer;
    },
    get trailBuffer() {
      return trailBuffer;
    },
    get paramsBuffer() {
      return paramsBuffer;
    },
    get nAgents() {
      return nAgents;
    },
    destroy,
  };
}
