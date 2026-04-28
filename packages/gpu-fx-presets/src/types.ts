export interface Effect<C = Record<string, unknown>> {
  render(encoder: GPUCommandEncoder, outputView: GPUTextureView, time: number): void;
  resize(width: number, height: number): void;
  updateConfig(config: Partial<C>): void;
  getConfig(): C;
  destroy(): void;
}
