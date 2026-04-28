// Minimal scene / transition contracts shared across motion apps.
//
// Each app extends these with its own substrate-specific types (particle
// snapshot shape, ring-buffer descriptor, glyph state, etc.). The base shape
// here is intentionally narrow — it captures only what the generic handoff
// orchestration cares about.

export type TransitionPhase =
  | "idle"
  | "playing"
  | "blending"
  | "handoff_pending";

export interface Scene {
  readonly name: string;
  encode(encoder: GPUCommandEncoder, time: number, dt: number): void;
  reset(): void;
  destroy(): void;
}

// Snapshot-agnostic participant. Substrates parameterize <TSnapshot> with
// their own state shape (dot-particle, flowline-agent, etc.).
export interface TransitionParticipant<TSnapshot> {
  readonly count: number;
  reset(): void;
  setAttractor?(config: { x: number; y: number; blend: number } | null): void;
  exportState?(): TSnapshot;
  exportStateAsync?(): Promise<TSnapshot>;
  importState?(snapshot: TSnapshot): void;
}

export interface TransitionScene<TSnapshot> {
  readonly name: string;
  readonly participant: TransitionParticipant<TSnapshot> | null;
}
