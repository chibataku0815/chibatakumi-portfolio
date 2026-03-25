/**
 * @fileoverview Atmos シーン環境設定
 *
 * Three.js のシーン環境（背景色・fog・ライティング）を
 * `@shared/theme` の `themes.atmos` プリセットから構築する。
 *
 * ## 設計思想
 * ハードコードされた 0xRRGGBB 値を一切持たず、
 * すべての色・距離値を theme.ts から取得する。
 * これにより、`themes.atmos` の値を変えるだけで
 * シーン全体の見た目を一括変更できる。
 *
 * ## ライティング構成
 * ```
 * HemisphereLight  (天空 neutral[7] / 地面 neutral[6])
 *   └─ 全体に柔らかい上下グラデーション光
 * AmbientLight     (neutral[3])
 *   └─ 均一な環境光（影を消す最小限の光）
 * PointLight × 1  (amber neutral[9] / 主光源)
 *   └─ カメラ前方に配置、大気感の核心
 * PointLight × 1  (amber neutral[10] / 補助光)
 *   └─ カメラ後方右上に配置、リム光
 * ```
 */

import * as THREE from 'three';
import { themes, scaling, space } from '@shared/theme';

/** Atmos テーマのショートハンド */
const t = themes.atmos;

/**
 * シーン環境を構築して返す。
 *
 * @param scene - Three.js シーン（background / fog を設定される）
 * @returns `{ ambientLight, hemiLight, mainLight, subLight }` — 追加済みライトへの参照
 *
 * @example
 * ```typescript
 * const { mainLight } = setupEnvironment(scene);
 * // アニメーション中に主光源を動かす
 * mainLight.position.x = Math.sin(time) * 2;
 * ```
 */
export function setupEnvironment(scene: THREE.Scene): {
  ambientLight: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  mainLight: THREE.PointLight;
  subLight: THREE.PointLight;
} {
  // --- 背景色 (colors.neutral[1]) ---
  scene.background = t.background.clone();

  // --- Fog (colors.neutral[2], fogDensity) ---
  // FogExp2: 指数的に濃くなる霧。大気感・被写界深度を演出。
  scene.fog = new THREE.FogExp2(t.fogColor.getHex(), t.fogDensity);

  // --- HemisphereLight (neutral[7] / neutral[6]) ---
  // 天空色と地面色のグラデーション光。
  // 人工光なしでも自然な陰影を生む Radix Step 6-7 の「ボーダー帯」。
  const hemiLight = new THREE.HemisphereLight(
    t.hemiSkyColor.getHex(),
    t.hemiGroundColor.getHex(),
    t.hemiIntensity,
  );
  scene.add(hemiLight);

  // --- AmbientLight (neutral[3]) ---
  // 均一な環境光。影を完全に落としたくない箇所の最低輝度を担保。
  const ambientLight = new THREE.AmbientLight(
    t.ambientColor.getHex(),
    t.ambientIntensity,
  );
  scene.add(ambientLight);

  // --- PointLight 主光源 (amber neutral[9]) ---
  // カメラ前方に配置し、大気中の光散乱を演出。
  // space[5] = 0.6 × scaling.factor: 画面中央寄りのやや前方
  const mainLight = new THREE.PointLight(
    t.mainLightColor.getHex(),
    t.mainLightIntensity,
    /* distance */ space[9] * scaling.factor * 10,
    /* decay    */ 2,
  );
  mainLight.position.set(0, space[3] * scaling.factor, space[5] * scaling.factor);
  scene.add(mainLight);

  // --- PointLight 補助光源 (amber neutral[10]) ---
  // カメラ後方右上に配置し、リム光 / バックライトとして機能。
  const subLight = new THREE.PointLight(
    t.subLightColor.getHex(),
    t.subLightIntensity,
    /* distance */ space[9] * scaling.factor * 8,
    /* decay    */ 2,
  );
  subLight.position.set(
    space[4] * scaling.factor,
    space[6] * scaling.factor,
    -space[4] * scaling.factor,
  );
  scene.add(subLight);

  return { ambientLight, hemiLight, mainLight, subLight };
}

/**
 * カメラ初期設定を適用する。
 * `themes.atmos` の `cameraZ` / `cameraNearZ` / `cameraFarZ` を使用。
 *
 * @param camera - 設定対象の PerspectiveCamera
 */
export function setupCamera(camera: THREE.PerspectiveCamera): void {
  camera.position.set(0, 0, t.cameraZ);
  camera.lookAt(0, 0, 0);
}
