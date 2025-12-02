/**
 * Shader core utilities
 * hash, noise, fbm などの基本GLSL関数
 */

export { glslHash } from "./hash.glsl";
export { glslNoise } from "./noise.glsl";
export { createFbmGlsl, type FbmOptions } from "./fbm.glsl";

import { glslHash } from "./hash.glsl";
import { glslNoise } from "./noise.glsl";
import { createFbmGlsl, type FbmOptions } from "./fbm.glsl";

/**
 * hash + noise + fbm をまとめて取得
 */
export function getNoiseGlsl(fbmOptions?: FbmOptions): string {
  return [glslHash, glslNoise, createFbmGlsl(fbmOptions)].join("\n");
}
