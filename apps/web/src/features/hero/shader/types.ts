/**
 * Shader Types and Interfaces
 */

import type { Texture, Vector2, Vector4 } from "three";

export interface HeroMaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeroMaskSet {
  maskRects: HeroMaskRect[];
  anchorRect: HeroMaskRect | null;
  interactionEnabled: boolean;
  coarsePointer: boolean;
}

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
