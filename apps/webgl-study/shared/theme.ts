/**
 * @fileoverview WebGL 学習環境 — Radix Themes 統合デザインシステム
 *
 * Radix Themes の設計思想（用途ベースのスケールシステム）を WebGL ワールドに翻訳。
 * 単なるカラーパレットではなく、Colors / Spacing / Container / Breakpoints / Scaling
 * の全概念を Three.js と HTML オーバーレイの両方で使える形で定義する。
 *
 * ## 使い方
 * ```typescript
 * import { colors, space, container, breakpoints, scaling, themes } from '@shared/theme';
 *
 * // シーン背景色
 * scene.background = colors.neutral[1];
 *
 * // カメラ距離
 * camera.position.z = space[8] * scaling.factor;
 *
 * // 新しい模写でテーマを定義する場合は theme.ts の themes オブジェクトに追加
 * // themes.myScene = { background: colors.neutral[1], ... }
 * ```
 *
 * ## Radix Themes → WebGL マッピング
 * | Radix 概念 | WebGL 対応 |
 * |-----------|-----------|
 * | Colors 12段階 | シーン背景〜テキスト色 |
 * | Spacing 9段階 | ワールド単位 (0.1〜1.6) |
 * | Container 4サイズ | Canvas max-width (px) |
 * | Breakpoints 6段階 | レスポンシブ切り替え (px) |
 * | Scaling | 全体密度係数 (0.9〜1.1) |
 */

import * as THREE from 'three';

// ============================================================================
// Colors — 12段階スケール
// ============================================================================
// Radix Themes のダークテーマ設計に準拠:
//   Step  1-2: アプリ背景 / シーン背景・fog 遠景色（最暗）
//   Step  3-5: サブ背景 / 環境光・中間オブジェクト色
//   Step  6-8: ボーダー / エッジ光・ハイライト・グロー境界
//   Step  9-10: アクセント / 主光源色・ポートフォリオの Amber 系
//   Step 11-12: テキスト / HTML オーバーレイテキスト色（最明）

/**
 * ニュートラル（大気・空間）カラースケール。
 * Step 1 = シーン最暗背景 → Step 12 = HTML テキスト最明色。
 * 大気感のある深い青黒を基調とし、Amber アクセントへ橋渡しする。
 */
const neutralColors = {
  /** シーン背景（最暗）— renderer.setClearColor / scene.background */
  1: new THREE.Color(0x080a0c),
  /** fog 遠景色 — THREE.FogExp2 の color */
  2: new THREE.Color(0x0c1018),
  /** 環境光基調色 — AmbientLight の color */
  3: new THREE.Color(0x111a24),
  /** 中間距離オブジェクト暗部 */
  4: new THREE.Color(0x18242e),
  /** 中間オブジェクト標準色 */
  5: new THREE.Color(0x243040),
  /** エッジ光基調 — HemisphereLight の groundColor */
  6: new THREE.Color(0x3a4f65),
  /** ハイライト基調 — HemisphereLight の color */
  7: new THREE.Color(0x5a7a9a),
  /** グロー境界 / ポストエフェクト glow しきい値色 */
  8: new THREE.Color(0x8aadc8),
  /** アクセント主光源色 (Amber-9) — PointLight / SpotLight の color */
  9: new THREE.Color(0xffc53d),
  /** アクセント補助光源色 (Amber-10) — 二次光源 */
  10: new THREE.Color(0xffba18),
  /** HTML オーバーレイ本文テキスト色 */
  11: new THREE.Color(0xfef3c7),
  /** HTML オーバーレイ見出しテキスト色（最明） */
  12: new THREE.Color(0xfffdf7),
} as const;

/**
 * Amber カラースケール（ポートフォリオブランドカラー）。
 * Radix Amber Dark テーマに準拠。
 * WebGL 光源・グロー・パーティクル色に直接使用可能。
 */
const amberColors = {
  /** Amber 最暗背景 */
  1: new THREE.Color(0x16120a),
  /** Amber サブ背景 */
  2: new THREE.Color(0x1d180f),
  /** Amber UI 要素暗部 */
  3: new THREE.Color(0x2d2305),
  /** Amber UI 要素 */
  4: new THREE.Color(0x3a2e00),
  /** Amber ホバー状態 */
  5: new THREE.Color(0x473900),
  /** Amber ボーダー */
  6: new THREE.Color(0x573f00),
  /** Amber ソリッドホバー */
  7: new THREE.Color(0x714f00),
  /** Amber ソリッド */
  8: new THREE.Color(0x9e6c00),
  /** Amber メインアクセント — 最も目立つ Amber */
  9: new THREE.Color(0xffc53d),
  /** Amber ホバーアクセント */
  10: new THREE.Color(0xffba18),
  /** Amber 低コントラストテキスト */
  11: new THREE.Color(0xffb224),
  /** Amber 高コントラストテキスト */
  12: new THREE.Color(0xfff1c2),
} as const;

/**
 * 統合カラーシステム。
 * `colors.neutral[1]`（最暗）〜 `colors.neutral[12]`（最明）で用途が決まる。
 */
export const colors = {
  neutral: neutralColors,
  amber: amberColors,
} as const;

// ============================================================================
// Spacing — 9段階スケール（WebGL ワールド単位）
// ============================================================================
// Radix Themes の CSS spacing (4px〜64px) を Three.js ワールド単位に変換。
// `scaling.factor` を掛けて全体密度を一括調整できる。

/**
 * WebGL ワールド単位のスペーシングスケール。
 *
 * | Step | 値   | 用途例 |
 * |------|------|-------|
 * | 1    | 0.1  | オブジェクト微調整 / ジッター量 |
 * | 2    | 0.2  | 要素間の最小余白 |
 * | 3    | 0.3  | 標準余白 / パーティクル間距離 |
 * | 4    | 0.4  | セクション内余白 |
 * | 5    | 0.6  | セクション間距離 |
 * | 6    | 0.8  | 大きなグループ間 |
 * | 7    | 1.0  | カメラ近距離 |
 * | 8    | 1.2  | カメラ標準距離 |
 * | 9    | 1.6  | カメラ遠距離 |
 */
export const space = {
  1: 0.1,
  2: 0.2,
  3: 0.3,
  4: 0.4,
  5: 0.6,
  6: 0.8,
  7: 1.0,
  8: 1.2,
  9: 1.6,
} as const;

// ============================================================================
// Container — 4サイズ（Canvas max-width, px）
// ============================================================================

/**
 * Canvas コンテナの最大幅（ピクセル）。
 * Radix Themes の Container サイズに準拠し、レスポンシブ対応の基準値として使用。
 *
 * | Size | 値     | 想定環境 |
 * |------|--------|---------|
 * | 1    | 448px  | モバイル / 単一カード |
 * | 2    | 688px  | タブレット / 2カラム |
 * | 3    | 880px  | ノート / 3カラム |
 * | 4    | 1136px | デスクトップ / フルワイド |
 */
export const container = {
  1: 448,
  2: 688,
  3: 880,
  4: 1136,
} as const;

// ============================================================================
// Breakpoints — 6段階（px）
// ============================================================================

/**
 * レスポンシブ切り替えのブレークポイント（ピクセル）。
 * Radix Themes の breakpoints に完全準拠。
 *
 * 使用例:
 * ```typescript
 * const cols = window.innerWidth >= breakpoints.md ? 3 : 2;
 * ```
 *
 * | キー     | 値     | 想定デバイス |
 * |---------|--------|------------|
 * | initial | 0px    | モバイル縦 |
 * | xs      | 520px  | モバイル横 |
 * | sm      | 768px  | タブレット縦 |
 * | md      | 1024px | タブレット横 |
 * | lg      | 1280px | ラップトップ |
 * | xl      | 1640px | デスクトップ |
 */
export const breakpoints = {
  initial: 0,
  xs: 520,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1640,
} as const;

// ============================================================================
// Scaling — 全体密度係数
// ============================================================================

/**
 * 全体密度を一括調整する係数。
 * spacing, fontSize, カメラ距離に一律適用する。
 *
 * プリセット: 0.9 (コンパクト) | 0.95 | 1.0 (標準) | 1.05 | 1.1 (ゆったり)
 *
 * 使用例:
 * ```typescript
 * camera.position.z = space[8] * scaling.factor; // 標準: 1.2 * 1.0 = 1.2
 * ```
 */
export const scaling = {
  factor: 1.0,
} as const;

// ============================================================================
// Utility — レスポンシブヘルパー
// ============================================================================

type BreakpointKey = keyof typeof breakpoints;

/**
 * 現在の画面幅に応じてブレークポイントごとの値を返すユーティリティ。
 * Radix Themes の responsive props と同じ設計思想。
 *
 * @param values - ブレークポイントをキーとした値のマップ（未指定は下位から継承）
 * @returns 現在の画面幅に対応する値（未指定の場合は undefined）
 *
 * @example
 * ```typescript
 * // 画面幅 1024px のとき → 3
 * const cols = responsive({ initial: 1, sm: 2, md: 3, lg: 4 });
 * ```
 */
export function responsive<T>(values: Partial<Record<BreakpointKey, T>>): T | undefined {
  const width = window.innerWidth;
  const keys: BreakpointKey[] = ['xl', 'lg', 'md', 'sm', 'xs', 'initial'];
  for (const key of keys) {
    if (width >= breakpoints[key] && values[key] !== undefined) {
      return values[key];
    }
  }
  return values.initial;
}

// ============================================================================
// Scene Theme Presets — シーン別テーマ定義
// ============================================================================

/**
 * Atmos シーン（模写 #2）のテーマ定義。
 * 5つのセクション（Intro / Horizon / Storm / Calm / Outro）の
 * 色・ライティング・カメラ距離を一元管理。
 *
 * 使用例:
 * ```typescript
 * import { themes } from '@shared/theme';
 * const t = themes.atmos;
 * scene.background = t.background.clone(); // THREE.Color は mutable なので clone() 必須
 * ambientLight.color.copy(t.ambientColor);
 * ```
 */
export const themes = {
  atmos: {
    /** シーン背景色 (Step 1 — 最暗) */
    background: neutralColors[1],
    /** fog 遠景色 (Step 2) */
    fogColor: neutralColors[2],
    /** fog 密度 — THREE.FogExp2 の density */
    fogDensity: 0.12,
    /** 環境光色 (Step 3) */
    ambientColor: neutralColors[3],
    /** 環境光強度 */
    ambientIntensity: 0.4,
    /** 主光源色 Amber-9 (Step 9) — メイン PointLight */
    mainLightColor: neutralColors[9],
    /** 主光源強度 */
    mainLightIntensity: 2.0,
    /** 補助光源色 Amber-10 (Step 10) */
    subLightColor: neutralColors[10],
    /** 補助光源強度 */
    subLightIntensity: 0.8,
    /** ヘミ天空色 (Step 7) */
    hemiSkyColor: neutralColors[7],
    /** ヘミ地面色 (Step 6) */
    hemiGroundColor: neutralColors[6],
    /** ヘミ光強度 */
    hemiIntensity: 0.6,
    /** HTML オーバーレイ テキスト色 (Step 11) */
    textColor: '#' + neutralColors[11].getHexString(),
    /** HTML オーバーレイ 見出し色 (Step 12) */
    headingColor: '#' + neutralColors[12].getHexString(),
    /** カメラ初期位置 Z (space[8] × scaling.factor) */
    cameraZ: space[8] * scaling.factor,
    /** カメラ遠距離 Z (space[9] × scaling.factor) */
    cameraFarZ: space[9] * scaling.factor,
    /** カメラ近距離 Z (space[7] × scaling.factor) */
    cameraNearZ: space[7] * scaling.factor,
    /** オブジェクト間標準余白 (space[3]) */
    objectGap: space[3],
    /** セクション間距離 (space[5]) */
    sectionGap: space[5],
  },
} as const;

// ============================================================================
// Type exports — 型定義
// ============================================================================

/** カラースケールのインデックス型 (1〜12) */
export type ColorStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** スペーシングスケールのインデックス型 (1〜9) */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** コンテナサイズのインデックス型 (1〜4) */
export type ContainerSize = 1 | 2 | 3 | 4;
