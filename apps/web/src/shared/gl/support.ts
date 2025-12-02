/**
 * WebGL Support Detection
 */

let cachedSupport: boolean | null = null;

/**
 * WebGL（2または1）のサポートを判定
 * 結果はキャッシュされる
 */
export function isWebGLSupported(): boolean {
  if (cachedSupport !== null) return cachedSupport;

  if (typeof document === "undefined") {
    cachedSupport = false;
    return false;
  }

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  cachedSupport = gl !== null;
  return cachedSupport;
}

/**
 * WebGL2のサポートを判定
 */
export function isWebGL2Supported(): boolean {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  return canvas.getContext("webgl2") !== null;
}
