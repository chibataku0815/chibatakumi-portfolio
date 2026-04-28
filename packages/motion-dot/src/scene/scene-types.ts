// ── Scene Interface ──────────────────────────────────────────
// All scenes produce particle data in the same GPU buffer format.
// The render pass reads from this buffer regardless of source.

export interface Scene {
  /** Scene display name */
  readonly name: string;
  /** Run compute/update passes for this frame */
  encode(encoder: GPUCommandEncoder, time: number, dt: number): void;
  /** Storage buffer containing Particle structs */
  readonly particleBuffer: GPUBuffer;
  /** Active particle count */
  readonly count: number;
  /** Reset scene to initial state */
  reset(): void;
  /** Release GPU resources */
  destroy(): void;
}

// Particle struct layout (32 bytes, matches WGSL):
// pos:      vec2f  ( 0) — normalized [0,1]
// vel:      vec2f  ( 8) — velocity (can be 0 for CPU scenes)
// radius:   f32    (16) — normalized radius
// phase:    f32    (20) — per-particle phase offset
// colorIdx: f32    (24) — 0.0=dark, 1.0=white
// life:     f32    (28) — lifetime [0,1]
export const PARTICLE_FLOATS = 8;
export const PARTICLE_BYTES = PARTICLE_FLOATS * 4; // 32
