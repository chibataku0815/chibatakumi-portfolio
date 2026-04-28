export interface FilmPostConfig {
    grain?: {
        intensity?: number;
        size?: number;
        radialMix?: number;
    };
    chromaticAberration?: {
        amount?: number;
    };
    bloom?: {
        threshold?: number;
        intensity?: number;
        warmth?: number;
    };
    vignette?: {
        strength?: number;
        warmShift?: number;
    };
    lightLeak?: {
        intensity?: number;
    };
    tonemap?: {
        shadowLift?: number;
        compression?: number;
    };
}
export interface FilmPostUniforms {
    time: number;
    pulse?: number;
}
export interface FilmPostPipeline {
    render(encoder: GPUCommandEncoder, sceneTextureView: GPUTextureView, outputView: GPUTextureView, uniforms: FilmPostUniforms): void;
    resize(width: number, height: number): void;
    updateConfig(config: Partial<FilmPostConfig>): void;
    destroy(): void;
}
export declare const DEFAULT_CONFIG: {
    readonly grainIntensity: 0.1;
    readonly grainSize: 0.3;
    readonly grainRadialMix: 0.6;
    readonly caAmount: 0.003;
    readonly bloomThreshold: 0.65;
    readonly bloomIntensity: 0.45;
    readonly bloomWarmth: 0.25;
    readonly vignetteStrength: 0.85;
    readonly vignetteWarmShift: 0.3;
    readonly leakIntensity: 0.25;
    readonly shadowLift: 0.012;
    readonly tonemapCompression: 0.35;
};
