/**
 * Text → coordinate sampler for particle-based typography.
 * Rasterizes text to an off-screen canvas, then samples dark-pixel
 * positions into normalised [0,1] coordinates (aspect-ratio preserved).
 */
export declare function sampleTextPositions(text: string, count: number, fontSize?: number): {
    x: number;
    y: number;
}[];
/**
 * Create a GPU texture mask from rendered text.
 * White pixels where text exists, black elsewhere.
 * High resolution (1024×1024) with soft anti-aliased edges.
 */
export declare function createTextMaskTexture(device: GPUDevice, text: string, fontSize?: number): GPUTexture;
