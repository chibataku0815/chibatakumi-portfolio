/**
 * TransitionProxy — Dual-physics blending adapter for seamless scene transitions.
 *
 * Implements MetaballParticleSource so the SDF renderer sees a single source.
 * Internally calls computeForces() on both old and new scenes, blends the
 * force vectors with asymmetric easing, and integrates a shared particle state.
 *
 * Key design decisions:
 * - No central convergence: particles stay in place, only forces change
 * - Asymmetric easing: old forces fade with easeOutQuad, new with easeInCubic
 * - Velocity inheritance: old scene velocities decay with easeOutExpo
 * - Particle count mismatch: excess particles fade via life field, new spawn near parents
 * - Chain anchors: smootherstep merge to parametric orbit over 4s
 */
import type { MetaballParticleSource } from "../metaball-types";
export interface TransitionProxyConfig {
    device: GPUDevice;
    oldScene: MetaballParticleSource;
    newScene: MetaballParticleSource;
    oldName: string;
    newName: string;
    duration?: number;
}
export interface TransitionProxy extends MetaballParticleSource {
    readonly progress: number;
    readonly isComplete: boolean;
    finalize(): void;
}
export declare function createTransitionProxy(config: TransitionProxyConfig): TransitionProxy;
