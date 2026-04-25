// ── Particle Compute System ──────────────────────────────────
// Manages storage buffer, compute dispatch, and local handoff helpers.
// The shared scene interface stays unchanged; readback/import live here.

import particleShader from "./particle.wgsl?raw";
import type { AttractorConfig, ParticleStateSnapshot } from "gpu-fx-presets";

// ── Particle layout: 32 bytes (matches WGSL struct) ─────────
const PARTICLE_FLOATS = 8;
const PARTICLE_BYTES = PARTICLE_FLOATS * 4; // 32
const WORKGROUP_SIZE = 64;

// Params uniform: 48 bytes (12 x f32/u32 packed scalars)
const PARAMS_FLOATS = 12;
const PARAMS_BYTES = PARAMS_FLOATS * 4;

export interface ParticleConfig {
  count: number;
  noiseScale: number;
  noiseSpeed: number;
  flowForce: number;
  drag: number;
  whiteRatio: number;
}

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  count: 200,
  noiseScale: 3.0,
  noiseSpeed: 0.15,
  flowForce: 0.8,
  drag: 0.97,
  whiteRatio: 0.15,
};

export interface ParticleSystem {
  /** Run compute pass to update particle positions */
  compute(encoder: GPUCommandEncoder, time: number, dt: number): void;
  /** Get the GPU storage buffer (for render pass binding) */
  readonly storageBuffer: GPUBuffer;
  /** Particle count */
  readonly count: number;
  /** Reinitialize particles */
  reset(): void;
  /** Blend toward a local attractor while keeping scene physics active */
  setAttractor(config: AttractorConfig | null): void;
  /** Read back the current particle state through a staging buffer */
  exportStateAsync(): Promise<ParticleStateSnapshot>;
  /** Sync write a particle snapshot into the storage buffer */
  writeState(snapshot: ParticleStateSnapshot): void;
  /** Alias for writeState, used by the scene wrapper for handoff import */
  importState(snapshot: ParticleStateSnapshot): void;
  destroy(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildInitialParticleData(count: number, whiteRatio: number): Float32Array {
  const data = new Float32Array(count * PARTICLE_FLOATS);

  for (let i = 0; i < count; i++) {
    const off = i * PARTICLE_FLOATS;
    const isWhite = i < count * whiteRatio;

    data[off + 0] = 0.15 + Math.random() * 0.7;
    data[off + 1] = 0.15 + Math.random() * 0.7;
    data[off + 2] = (Math.random() - 0.5) * 0.02;
    data[off + 3] = (Math.random() - 0.5) * 0.02;

    const sizeRoll = Math.random();
    let radius: number;
    if (sizeRoll < 0.75) {
      radius = 0.003 + Math.random() * 0.006;
    } else if (sizeRoll < 0.95) {
      radius = 0.009 + Math.random() * 0.010;
    } else {
      radius = 0.019 + Math.random() * 0.012;
    }
    data[off + 4] = radius;
    data[off + 5] = Math.random();
    data[off + 6] = isWhite ? 1.0 : 0.0;
    data[off + 7] = 1.0;
  }

  return data;
}

function snapshotFromRaw(raw: Float32Array, count: number): ParticleStateSnapshot {
  const positions = new Float32Array(count * 2);
  const velocities = new Float32Array(count * 2);
  const radii = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const src = i * PARTICLE_FLOATS;
    const dst = i * 2;
    positions[dst + 0] = raw[src + 0];
    positions[dst + 1] = raw[src + 1];
    velocities[dst + 0] = raw[src + 2];
    velocities[dst + 1] = raw[src + 3];
    radii[i] = raw[src + 4];
  }

  return { positions, velocities, radii, count };
}

function buildImportData(
  baseData: Float32Array,
  snapshot: ParticleStateSnapshot,
  count: number,
): Float32Array {
  const upload = new Float32Array(baseData);
  const importCount = Math.min(snapshot.count, count);

  let centroidX = 0;
  let centroidY = 0;
  let speedSum = 0;
  let radiusSum = 0;

  for (let i = 0; i < importCount; i++) {
    const pos = i * 2;
    const vel = i * 2;
    centroidX += snapshot.positions[pos + 0];
    centroidY += snapshot.positions[pos + 1];
    speedSum += Math.hypot(snapshot.velocities[vel + 0], snapshot.velocities[vel + 1]);
    radiusSum += snapshot.radii[i] ?? 0;
  }

  if (importCount > 0) {
    centroidX /= importCount;
    centroidY /= importCount;
  } else {
    centroidX = 0.5;
    centroidY = 0.5;
  }

  const avgSpeed = importCount > 0 ? speedSum / importCount : 0;
  const avgRadius = importCount > 0 ? radiusSum / importCount : 0.006;
  const fillRadius = Math.max(avgRadius * 0.85, 0.003);
  const fillSpeed = clamp(avgSpeed * 0.35, 0.00006, 0.00024);

  for (let i = 0; i < importCount; i++) {
    const off = i * PARTICLE_FLOATS;
    const pos = i * 2;
    upload[off + 0] = snapshot.positions[pos + 0];
    upload[off + 1] = snapshot.positions[pos + 1];
    upload[off + 2] = snapshot.velocities[pos + 0];
    upload[off + 3] = snapshot.velocities[pos + 1];
    upload[off + 4] = snapshot.radii[i] ?? upload[off + 4];
  }

  for (let i = importCount; i < count; i++) {
    const off = i * PARTICLE_FLOATS;
    const angle = i * 2.399963229728653;
    const orbit = 0.0025 + ((i - importCount) % 4) * 0.0015;
    upload[off + 0] = centroidX + Math.cos(angle) * orbit;
    upload[off + 1] = centroidY + Math.sin(angle) * orbit;
    upload[off + 2] = Math.cos(angle + 0.7) * fillSpeed;
    upload[off + 3] = Math.sin(angle + 0.7) * fillSpeed;
    upload[off + 4] = fillRadius;
  }

  return upload;
}

export function createParticleSystem(
  device: GPUDevice,
  config?: Partial<ParticleConfig>,
): ParticleSystem {
  const cfg = { ...DEFAULT_PARTICLE_CONFIG, ...config };
  const count = cfg.count;
  let attractor: AttractorConfig | null = null;

  // ── Create compute pipeline ────────────────────────────────
  const shaderModule = device.createShaderModule({
    label: "particle-compute",
    code: particleShader,
  });

  const computePipeline = device.createComputePipeline({
    label: "particle-compute pipeline",
    layout: "auto",
    compute: {
      module: shaderModule,
      entryPoint: "main",
    },
  });

  // ── Buffers ────────────────────────────────────────────────

  // Particle storage buffer (GPU compute read/write + render read)
  const storageBuffer = device.createBuffer({
    label: "particle storage",
    size: count * PARTICLE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });

  // Params uniform
  const paramsBuffer = device.createBuffer({
    label: "particle params",
    size: PARAMS_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Pre-allocated typed arrays
  const paramsData = new Float32Array(PARAMS_FLOATS);
  const paramsU32 = new Uint32Array(paramsData.buffer);
  let seedParticleData = buildInitialParticleData(count, cfg.whiteRatio);

  // ── Bind group ─────────────────────────────────────────────
  const bindGroup = device.createBindGroup({
    label: "particle bind group",
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: paramsBuffer } },
      { binding: 1, resource: { buffer: storageBuffer } },
    ],
  });

  // ── Initialize particles ───────────────────────────────────
  function initParticles(): void {
    seedParticleData = buildInitialParticleData(count, cfg.whiteRatio);
    device.queue.writeBuffer(
      storageBuffer,
      0,
      seedParticleData.buffer,
      seedParticleData.byteOffset,
      seedParticleData.byteLength,
    );
  }

  initParticles();

  // ── Compute pass ───────────────────────────────────────────
  function compute(
    encoder: GPUCommandEncoder,
    time: number,
    dt: number,
  ): void {
    // Write params
    paramsData[0] = time;
    paramsData[1] = dt;
    paramsU32[2] = count;
    paramsData[3] = cfg.noiseScale;
    paramsData[4] = cfg.noiseSpeed;
    paramsData[5] = cfg.flowForce;
    paramsData[6] = cfg.drag;
    paramsData[7] = attractor ? 1.0 : 0.0;
    paramsData[8] = attractor?.x ?? 0.0;
    paramsData[9] = attractor?.y ?? 0.0;
    paramsData[10] = attractor?.blend ?? 0.0;
    paramsData[11] = 0;

    device.queue.writeBuffer(paramsBuffer, 0, paramsData.buffer, paramsData.byteOffset, paramsData.byteLength);

    // Dispatch compute
    const pass = encoder.beginComputePass({ label: "particle compute" });
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(count / WORKGROUP_SIZE));
    pass.end();
  }

  function setAttractor(config: AttractorConfig | null): void {
    attractor = config;
  }

  async function exportStateAsync(): Promise<ParticleStateSnapshot> {
    const byteLength = count * PARTICLE_BYTES;
    const stagingBuffer = device.createBuffer({
      label: "particle readback staging",
      size: byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    let mapped = false;
    try {
      const encoder = device.createCommandEncoder({ label: "particle readback" });
      encoder.copyBufferToBuffer(storageBuffer, 0, stagingBuffer, 0, byteLength);
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await stagingBuffer.mapAsync(GPUMapMode.READ);
      mapped = true;

      const mappedRange = stagingBuffer.getMappedRange();
      const raw = new Float32Array(mappedRange.slice(0));
      return snapshotFromRaw(raw, count);
    } finally {
      if (mapped) stagingBuffer.unmap();
      stagingBuffer.destroy();
    }
  }

  function writeState(snapshot: ParticleStateSnapshot): void {
    const upload = buildImportData(seedParticleData, snapshot, count);
    device.queue.writeBuffer(storageBuffer, 0, upload.buffer, upload.byteOffset, upload.byteLength);
  }

  function importState(snapshot: ParticleStateSnapshot): void {
    writeState(snapshot);
  }

  function reset(): void {
    initParticles();
  }

  function destroy(): void {
    storageBuffer.destroy();
    paramsBuffer.destroy();
  }

  return {
    compute,
    get storageBuffer() { return storageBuffer; },
    get count() { return count; },
    reset,
    setAttractor,
    exportStateAsync,
    writeState,
    importState,
    destroy,
  };
}
