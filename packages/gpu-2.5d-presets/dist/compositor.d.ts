/**
 * compositor.ts — WebGPU textured quad renderer for 2.5D compositions.
 *
 * Draws N layers as perspective-warped textured quads using painter's algorithm.
 * Each layer = 2 triangles (6 vertices) built from Quad corners.
 *
 * Convention: follows gpu-fx-presets factory pattern (createXxx → object with render/resize/destroy).
 */
import type { Quad } from "./types";
export interface CompositorConfig {
    readonly maxLayers: number;
}
export interface RimConfig {
    readonly intensity: number;
    readonly falloff: number;
    readonly color: readonly [number, number, number];
}
export interface CompositorLayer {
    readonly texture: GPUTexture;
    readonly quad: Quad;
    readonly opacity: number;
    readonly depth: number;
    readonly rim?: RimConfig;
}
export interface Compositor {
    render(encoder: GPUCommandEncoder, outputView: GPUTextureView, layers: CompositorLayer[]): void;
    resize(width: number, height: number): void;
    destroy(): void;
}
export declare function createCompositor(device: GPUDevice, width: number, height: number, userConfig?: Partial<CompositorConfig>): Compositor;
