/**
 * Shader Types and Interfaces
 */

import type { Texture, Vector2 } from "three";

/**
 * HeroShaderBackground用のUniform定義
 */
export interface HeroShaderUniforms {
  uTexture: { value: Texture | null };
  uResolution: { value: Vector2 };
  uTextureSize: { value: Vector2 };
  // Animation uniforms
  uTime: { value: number };
  uPointer: { value: Vector2 };
  uScroll: { value: number };
}

/**
 * シェーダーマテリアルの初期化オプション
 */
export interface HeroShaderOptions {
  imagePath?: string;
  fallbackColor?: string;
}
