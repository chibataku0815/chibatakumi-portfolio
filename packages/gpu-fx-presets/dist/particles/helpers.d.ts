import type { ParticleStateSnapshot } from "../metaball-types";
export interface ParticleStateLike {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    phase: number;
    colorIdx: number;
}
export interface SnapshotStats {
    centerX: number;
    centerY: number;
    centerVx: number;
    centerVy: number;
    avgSpeed: number;
    count: number;
}
export declare function createParticleStorageBuffer(device: GPUDevice, label: string, count: number): GPUBuffer;
export declare function createParticleArray(count: number): Float32Array;
export declare function snapshotFromParticles(particles: readonly ParticleStateLike[], count?: number): ParticleStateSnapshot;
export declare function snapshotStats(snapshot: ParticleStateSnapshot, count?: number): SnapshotStats;
export declare function seedParticleFromCentroid(particle: ParticleStateLike, index: number, stats: SnapshotStats): void;
export declare function importSnapshotIntoParticles<T extends ParticleStateLike>(particles: T[], snapshot: ParticleStateSnapshot, options?: {
    maxSpeed?: number;
    fillMissing?: (particle: T, index: number, stats: SnapshotStats) => void;
}): SnapshotStats;
export declare function writeParticle(data: Float32Array, idx: number, x: number, y: number, radius: number, phase: number, colorIdx: number, vx?: number, vy?: number, life?: number): void;
export declare function clamp(value: number, min: number, max: number): number;
export declare function smootherstep(t: number): number;
export declare function simpleNoise(x: number): number;
export declare function cubicBezier(p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, t: number): [number, number];
export interface CubicPathDef {
    readonly p0: readonly [number, number];
    readonly p1: readonly [number, number];
    readonly p2: readonly [number, number];
    readonly p3: readonly [number, number];
}
export declare function evalPath(path: CubicPathDef, t: number): [number, number];
export declare function pathTangent(path: CubicPathDef, t: number): [number, number];
export declare function pathCurvature(path: CubicPathDef, t: number): number;
