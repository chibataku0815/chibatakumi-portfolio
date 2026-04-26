export type LiquidGlassSurfaceKind = "nav" | "panel" | "rail" | "control";

export interface LiquidGlassSurfaceOptions {
  readonly id: string;
  readonly radius?: number;
  readonly intensity?: number;
  readonly tint?: string;
  readonly brightness?: number;
  readonly kind?: LiquidGlassSurfaceKind;
}

export interface LiquidGlassSurfaceRecord {
  readonly element: HTMLElement;
  readonly options: LiquidGlassSurfaceOptions;
}

export type LiquidGlassSurfaceRegistry = Map<string, LiquidGlassSurfaceRecord>;
