export const METABALL_PARTICLE_FLOATS = 8;
export const METABALL_PARTICLE_BYTES = METABALL_PARTICLE_FLOATS * 4;

/** Snapshot of particle state for cross-scene handoff */
export interface ParticleStateSnapshot {
  /** Interleaved [x0, y0, x1, y1, ...] in normalized [0,1] */
  positions: Float32Array;
  /** Interleaved [vx0, vy0, vx1, vy1, ...] */
  velocities: Float32Array;
  radii: Float32Array;
  count: number;
}

/** Central attractor config for cross-scene handoff blending */
export interface AttractorConfig {
  /** Target x in normalized [0,1] */
  x: number;
  /** Target y in normalized [0,1] */
  y: number;
  /** 0 = scene physics only, 1 = attractor only. Smoothly crossfades forces. */
  blend: number;
}

export interface MetaballParticleSource {
  readonly particleBuffer: GPUBuffer;
  readonly count: number;
  update(encoder: GPUCommandEncoder, time: number, dt: number): void;
  reset(): void;
  destroy(): void;

  /** Export current particle state for handoff to another scene */
  exportState?(): ParticleStateSnapshot;
  /** Import external particle state as initial conditions */
  importState?(snapshot: ParticleStateSnapshot): void;

  /** Set/clear central attractor — blends attractor force with scene physics */
  setAttractor?(config: AttractorConfig | null): void;

  /** Set/clear audio-reactive modulation of physics parameters */
  setAudioReactive?(bands: AudioReactiveBands | null): void;

  /** Compute forces without integrating — used by transition proxy for dual-physics blending */
  computeForces?(
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    time: number,
    dt: number,
  ): { forces: Float32Array };

  /** Optional text mask texture — SDF renderer clips output to this shape */
  readonly maskTexture?: GPUTexture;
  /** Mask blend factor: 0 = no mask (free metaballs), 1 = fully masked */
  readonly maskBlend?: number;
}

export interface AudioReactiveBands {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  intensity?: number;
  // Beat onset impulses (0-1, optional for backward compat)
  bassOnset?: number;
  midOnset?: number;
  trebleOnset?: number;
  globalOnset?: number;
}
