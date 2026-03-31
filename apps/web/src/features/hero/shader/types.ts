/**
 * Shader Types and Interfaces
 */

import type { Texture, Vector2, Vector4 } from "three";
export type { HeroMaskRect, HeroMaskSet } from "@/shared/types/hero-frame";
import type { HeroMaskRect } from "@/shared/types/hero-frame";

export type HeroLineMaskRect = HeroMaskRect;

/**
 * HeroShaderBackground用のUniform定義
 */
export interface HeroShaderUniforms {
  uTexture: { value: Texture | null };
  uResolution: { value: Vector2 };
  uTextureSize: { value: Vector2 };
  uTime: { value: number };
  uPointer: { value: Vector2 };
  uScroll: { value: number };
  uInteraction: { value: number };
  uLineCount: { value: number };
  uLineRects: { value: Vector4[] };
  uAnchorRect: { value: Vector4 };
  uAccentColor: { value: import("three").Vector3 };
  uFocusPoint: { value: Vector2 };
  uAccentMix: { value: number };
  uDistortionBoost: { value: number };
}

/**
 * シェーダーマテリアルの初期化オプション
 */
export interface HeroShaderOptions {
  imagePath?: string;
  fallbackColor?: string;
}
