import type { FilmPostConfig, FilmPostPipeline } from "./types";
export declare function createFilmPostPipeline(device: GPUDevice, format: GPUTextureFormat, config?: Partial<FilmPostConfig>): FilmPostPipeline;
