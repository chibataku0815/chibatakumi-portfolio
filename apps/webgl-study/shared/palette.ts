import * as THREE from "three";

/**
 * Radix Colors の「用途ベース12段階スケール」を WebGL/Three.js 向けに適用したパレット。
 *
 * ## 12段階の用途マッピング
 * - Step 1-2 : シーン背景 / fog 遠景色（最も暗い）
 * - Step 3-5 : 環境光 / 中間オブジェクト色
 * - Step 6-8 : エッジ光 / ハイライト / グロー境界
 * - Step 9-10: アクセントオブジェクト / 主光源色
 * - Step 11-12: HTML オーバーレイテキスト色（最も明るい）
 *
 * ## 使い方
 * ```ts
 * import { neutral, amber } from "@shared/palette";
 *
 * scene.background = neutral[1];
 * fogColor = neutral[2];
 * ambientLight.color = neutral[4];
 * pointLight.color = amber[9];
 * ```
 */

/** ニュートラルスケール（青紫系ダーク） */
export const neutral = {
  /** Step 1: シーン背景（最も暗い）*/
  1: new THREE.Color(0x0a0a0f),
  /** Step 2: subtle 背景 / fog 遠景色 */
  2: new THREE.Color(0x111118),
  /** Step 3: 要素背景 / 環境光ベース */
  3: new THREE.Color(0x1a1a2e),
  /** Step 4: ホバー要素 / 中間オブジェクト色 */
  4: new THREE.Color(0x222240),
  /** Step 5: アクティブ要素 */
  5: new THREE.Color(0x2a2a50),
  /** Step 6: subtle ボーダー / セパレーター / エッジ光 */
  6: new THREE.Color(0x333366),
  /** Step 7: UI ボーダー / ハイライト */
  7: new THREE.Color(0x444488),
  /** Step 8: ホバーボーダー / グロー境界 */
  8: new THREE.Color(0x5555aa),
  /** Step 9: solid アクセント */
  9: new THREE.Color(0x6666cc),
  /** Step 10: ホバーアクセント */
  10: new THREE.Color(0x7777dd),
  /** Step 11: 低コントラストテキスト */
  11: new THREE.Color(0x9999bb),
  /** Step 12: 高コントラストテキスト（最も明るい）*/
  12: new THREE.Color(0xeeeef0),
} as const;

/**
 * アンバースケール（暖色系 — ポートフォリオの --accent-amber1 に対応）
 *
 * Step 9 が portfolio の CSS 変数 `--accent-amber1` (#f0b25a) と一致。
 */
export const amber = {
  /** Step 1: アンバー最暗背景 */
  1: new THREE.Color(0x0f0c07),
  /** Step 2: アンバー subtle 背景 */
  2: new THREE.Color(0x1a1508),
  /** Step 3: アンバー要素背景 */
  3: new THREE.Color(0x2e2408),
  /** Step 9: solid アクセント（= portfolio --accent-amber1）*/
  9: new THREE.Color(0xf0b25a),
  /** Step 10: ホバーアクセント */
  10: new THREE.Color(0xe09f3a),
  /** Step 11: 低コントラスト暖色テキスト */
  11: new THREE.Color(0xd4a574),
  /** Step 12: 高コントラスト暖色テキスト */
  12: new THREE.Color(0xf5f0e8),
} as const;

// 模写ごとのテーマプリセットもここに追加していく
// 例: export const atmosTheme = { bg: neutral[1], fog: neutral[2], accent: amber[9] } as const;
