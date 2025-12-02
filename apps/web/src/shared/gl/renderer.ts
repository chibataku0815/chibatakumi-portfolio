/**
 * WebGL Renderer Utilities
 */

export interface RendererConfig {
  maxPixelRatio?: number;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: "default" | "high-performance" | "low-power";
}

const defaultConfig: Required<RendererConfig> = {
  maxPixelRatio: 1.5,
  antialias: false,
  alpha: false,
  powerPreference: "low-power",
};

/**
 * デバイスに応じたピクセル比を取得
 * モバイルや低電力デバイスでは制限をかける
 */
export function getOptimalPixelRatio(maxRatio: number = 1.5): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio, maxRatio);
}

/**
 * レンダラー設定をマージ
 */
export function getRendererConfig(
  overrides?: Partial<RendererConfig>
): Required<RendererConfig> {
  return { ...defaultConfig, ...overrides };
}

/**
 * リサイズハンドラを作成
 * @param onResize コールバック (width, height) => void
 * @returns cleanup関数
 */
export function createResizeHandler(
  onResize: (width: number, height: number) => void
): () => void {
  const handler = () => {
    onResize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", handler);

  return () => {
    window.removeEventListener("resize", handler);
  };
}
