import type { MetaballParticleSource } from "../metaball-types";
import { type CubicPathDef } from "./helpers";
export interface PathSegment {
    path: CubicPathDef;
    /** Indices into segments[] that this segment can transition to when t >= 1.0 */
    next: number[];
    /** How to choose among multiple next segments. Default: 'lateral' */
    routing?: "lateral" | "random" | "round-robin";
    /** Speed multiplier on this segment. Default: 1.0 */
    speedScale?: number;
    /** Lateral spread multiplier. Default: 1.0 */
    lateralScale?: number;
    /** Radius multiplier. Default: 1.0 */
    radiusScale?: number;
}
export interface PathFlowConfig {
    segments: PathSegment[];
    particleCount?: number;
    baseSpeed?: number;
    baseRadius?: number;
    largeRadius?: number;
    lateralSpread?: number;
    whiteRatio?: number;
    /** Size distribution [small%, mid%, large%]. Default: [0.65, 0.25, 0.10] */
    sizeDistribution?: [number, number, number];
}
export declare function createPathFlowParticles(device: GPUDevice, config: PathFlowConfig): MetaballParticleSource;
export declare function createSvgFlowParticles(device: GPUDevice, svgPathD: string, options?: Partial<PathFlowConfig> & {
    viewBox?: {
        width: number;
        height: number;
    };
}): MetaballParticleSource;
