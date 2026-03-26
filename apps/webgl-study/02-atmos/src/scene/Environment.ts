/**
 * @fileoverview Environment — theme.ts 参照 + scroll progress 連動
 *
 * Radix-inspired theme から色を取得し、scroll progress に応じて
 * fog / light / background を5セクション間で補間する。
 * ハードコード 0xRRGGBB はゼロ。
 *
 * ### 5セクションの雰囲気（theme colors 準拠）
 * ```
 * intro (0.0-0.2)  : neutral[1-2] 深い霧、暗め → 神秘的
 * ascent (0.2-0.4) : amber[3-4] 霧が晴れる → 夜明け
 * flight (0.4-0.6) : neutral[7-8] クリア、青空 → 解放感
 * detail (0.6-0.8) : amber[9-10] ゴールデンアワー → 暖かみ
 * outro (0.8-1.0)  : neutral[2-3] 霧が戻る → 余韻
 * ```
 */

import * as THREE from "three";
import { colors, themes, scaling, space } from "../../../shared/theme";

const t = themes.atmos;

/** セクションごとの環境パラメータ */
interface EnvironmentKeyframe {
  fogDensity: number;
  fogColor: THREE.Color;
  bgColor: THREE.Color;
  lightIntensity: number;
  lightColor: THREE.Color;
  hemiIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
}

/**
 * 5セクションのキーフレーム — theme colors から構築。
 * ハードコード値はゼロ。全てが colors.neutral / colors.amber を参照。
 */
const KEYFRAMES: EnvironmentKeyframe[] = [
  {
    // intro: 濃い霧（neutral[2] fog、neutral[1] bg）
    fogDensity: 0.04,
    fogColor: colors.neutral[2].clone(),
    bgColor: colors.neutral[1].clone(),
    lightIntensity: 0.3,
    lightColor: colors.neutral[7].clone(),
    hemiIntensity: 0.2,
    hemiSkyColor: colors.neutral[7].clone(),
    hemiGroundColor: colors.amber[3].clone(),
  },
  {
    // ascent: 霧が晴れる（amber[3] warm fog）
    fogDensity: 0.02,
    fogColor: colors.amber[3].clone(),
    bgColor: colors.neutral[1].clone(),
    lightIntensity: 0.8,
    lightColor: colors.amber[9].clone(),
    hemiIntensity: 0.4,
    hemiSkyColor: colors.neutral[7].clone(),
    hemiGroundColor: colors.amber[3].clone(),
  },
  {
    // flight: クリア（neutral[8] 青系 fog、neutral[5] bg）
    fogDensity: 0.008,
    fogColor: colors.neutral[8].clone(),
    bgColor: colors.neutral[5].clone(),
    lightIntensity: 1.2,
    lightColor: colors.neutral[8].clone(),
    hemiIntensity: 0.6,
    hemiSkyColor: colors.neutral[8].clone(),
    hemiGroundColor: colors.amber[3].clone(),
  },
  {
    // detail: ゴールデンアワー（amber[6] fog）— sky も warm に
    fogDensity: 0.015,
    fogColor: colors.amber[6].clone(),
    bgColor: colors.amber[1].clone(),
    lightIntensity: 1.0,
    lightColor: colors.amber[10].clone(),
    hemiIntensity: 0.5,
    hemiSkyColor: colors.amber[6].clone(),
    hemiGroundColor: colors.amber[4].clone(),
  },
  {
    // outro: 霧が戻る（neutral[3] 深い霧）
    fogDensity: 0.035,
    fogColor: colors.neutral[3].clone(),
    bgColor: colors.neutral[1].clone(),
    lightIntensity: 0.4,
    lightColor: colors.neutral[7].clone(),
    hemiIntensity: 0.3,
    hemiSkyColor: colors.neutral[7].clone(),
    hemiGroundColor: colors.amber[3].clone(),
  },
];

export class Environment {
  fog: THREE.FogExp2;
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;

  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Initial state from theme (intro section)
    this.fog = new THREE.FogExp2(t.fogColor.getHex(), t.fogDensity);
    scene.fog = this.fog;
    scene.background = t.background.clone();

    // Directional Light
    this.directionalLight = new THREE.DirectionalLight(
      colors.neutral[7].getHex(),
      0.3,
    );
    this.directionalLight.position.set(5, 10, 7);
    scene.add(this.directionalLight);

    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(
      t.ambientColor.getHex(),
      t.ambientIntensity,
    );
    scene.add(this.ambientLight);

    // Hemisphere Light — warm/cool split for natural sky/ground illumination
    this.hemisphereLight = new THREE.HemisphereLight(
      colors.neutral[7].getHex(),
      colors.amber[3].getHex(),
      0.2,
    );
    scene.add(this.hemisphereLight);
  }

  /**
   * progress (0-1) に応じて環境を補間更新。
   * 5キーフレーム間で線形補間し、fog / light / background を滑らかに変化させる。
   */
  update(progress: number): void {
    const p = Math.min(Math.max(progress, 0), 1);

    const segmentCount = KEYFRAMES.length - 1;
    const scaledProgress = p * segmentCount;
    const index = Math.min(Math.floor(scaledProgress), segmentCount - 1);
    const t = scaledProgress - index;

    const kf0 = KEYFRAMES[index]!;
    const kf1 = KEYFRAMES[index + 1]!;

    // fog
    this.fog.density = THREE.MathUtils.lerp(kf0.fogDensity, kf1.fogDensity, t);
    this.fog.color.copy(kf0.fogColor).lerp(kf1.fogColor, t);

    // background
    (this.scene.background as THREE.Color)
      .copy(kf0.bgColor)
      .lerp(kf1.bgColor, t);

    // light
    this.directionalLight.intensity = THREE.MathUtils.lerp(
      kf0.lightIntensity,
      kf1.lightIntensity,
      t,
    );
    this.directionalLight.color.copy(kf0.lightColor).lerp(kf1.lightColor, t);

    // hemisphere light
    this.hemisphereLight.intensity = THREE.MathUtils.lerp(
      kf0.hemiIntensity,
      kf1.hemiIntensity,
      t,
    );
    this.hemisphereLight.color.copy(kf0.hemiSkyColor).lerp(kf1.hemiSkyColor, t);
    this.hemisphereLight.groundColor
      .copy(kf0.hemiGroundColor)
      .lerp(kf1.hemiGroundColor, t);

    // CSS custom property bridge — fog color for future HTML text-shadow sync
    const fc = this.fog.color;
    document.documentElement.style.setProperty(
      '--atmos-fog-color',
      `rgb(${(fc.r * 255) | 0}, ${(fc.g * 255) | 0}, ${(fc.b * 255) | 0})`,
    );
  }
}
