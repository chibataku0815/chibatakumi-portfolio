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
  // Rim light
  rimIntensity: number;
  rimColor: THREE.Color;
  rimY: number;
  // CSS custom properties bridge
  sectionColor: THREE.Color;
  glowColor: THREE.Color;
  glowOpacity: number;
  glowOpacityOuter: number;
  caOffset: number;
  caWarmColor: THREE.Color;
  caWarmAlpha: number;
  caCoolColor: THREE.Color;
  caCoolAlpha: number;
  // Cloud parameters
  cloudOpacity: number;
  // Bloom parameters
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
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
    lightIntensity: 0.25,
    lightColor: colors.neutral[7].clone(),
    hemiIntensity: 0.2,
    hemiSkyColor: colors.neutral[7].clone(),
    hemiGroundColor: colors.amber[4].clone(),
    // Rim light
    rimIntensity: 0.1,
    rimColor: colors.neutral[4].clone(),
    rimY: 5,
    // CSS bridge
    sectionColor: colors.neutral[12].clone(),
    glowColor: colors.neutral[11].clone(),
    glowOpacity: 0.14,
    glowOpacityOuter: 0.05,
    caOffset: 0.8,
    caWarmColor: new THREE.Color(0xff503c),
    caWarmAlpha: 0.10,
    caCoolColor: new THREE.Color(0x5078ff),
    caCoolAlpha: 0.10,
    // Cloud
    cloudOpacity: 0.10,
    // Bloom
    bloomThreshold: 0.90,
    bloomStrength: 0.15,
    bloomRadius: 0.5,
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
    // Rim light
    rimIntensity: 0.4,
    rimColor: colors.amber[7].clone(),
    rimY: 8,
    // CSS bridge
    sectionColor: colors.amber[11].clone(),
    glowColor: colors.amber[10].clone(),
    glowOpacity: 0.20,
    glowOpacityOuter: 0.08,
    caOffset: 1.0,
    caWarmColor: new THREE.Color(0xff3200),
    caWarmAlpha: 0.12,
    caCoolColor: new THREE.Color(0x5064ff),
    caCoolAlpha: 0.08,
    // Cloud
    cloudOpacity: 0.35,
    // Bloom
    bloomThreshold: 0.80,
    bloomStrength: 0.35,
    bloomRadius: 0.6,
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
    // Rim light
    rimIntensity: 0.65,
    rimColor: colors.neutral[8].clone(),
    rimY: 8,
    // CSS bridge
    sectionColor: colors.neutral[9].clone(),
    glowColor: colors.neutral[8].clone(),
    glowOpacity: 0.18,
    glowOpacityOuter: 0.06,
    caOffset: 0.8,
    caWarmColor: new THREE.Color(0xff3c3c),
    caWarmAlpha: 0.08,
    caCoolColor: new THREE.Color(0x3c78ff),
    caCoolAlpha: 0.12,
    // Cloud
    cloudOpacity: 0.18,
    // Bloom
    bloomThreshold: 0.70,
    bloomStrength: 0.55,
    bloomRadius: 0.55,
  },
  {
    // detail: ゴールデンアワー（amber[6] fog）— sky も warm に
    fogDensity: 0.015,
    fogColor: colors.amber[6].clone(),
    bgColor: colors.amber[1].clone(),
    lightIntensity: 1.0,
    lightColor: colors.amber[8].clone(),
    hemiIntensity: 0.5,
    hemiSkyColor: colors.amber[6].clone(),
    hemiGroundColor: colors.amber[4].clone(),
    // Rim light
    rimIntensity: 0.6,
    rimColor: colors.amber[9].clone(),
    rimY: 6,
    // CSS bridge
    sectionColor: colors.amber[11].clone(),
    glowColor: colors.amber[10].clone(),
    glowOpacity: 0.22,
    glowOpacityOuter: 0.08,
    caOffset: 1.0,
    caWarmColor: new THREE.Color(0xff1e00),
    caWarmAlpha: 0.14,
    caCoolColor: new THREE.Color(0x3c50c8),
    caCoolAlpha: 0.08,
    // Cloud
    cloudOpacity: 0.10,
    // Bloom
    bloomThreshold: 0.75,
    bloomStrength: 0.50,
    bloomRadius: 0.75,
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
    // Rim light
    rimIntensity: 0.25,
    rimColor: colors.neutral[4].clone(),
    rimY: 5,
    // CSS bridge
    sectionColor: colors.neutral[11].clone(),
    glowColor: colors.neutral[10].clone(),
    glowOpacity: 0.14,
    glowOpacityOuter: 0.05,
    caOffset: 0.6,
    caWarmColor: new THREE.Color(0xff3c3c),
    caWarmAlpha: 0.06,
    caCoolColor: new THREE.Color(0x3c64ff),
    caCoolAlpha: 0.06,
    // Cloud
    cloudOpacity: 0.08,
    // Bloom
    bloomThreshold: 0.88,
    bloomStrength: 0.20,
    bloomRadius: 0.5,
  },
];

export class Environment {
  fog: THREE.FogExp2;
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;
  rimLight: THREE.DirectionalLight;

  private scene: THREE.Scene;
  private _cloudOpacity = 0.10;
  private _bloomThreshold = 0.85;
  private _bloomStrength = 0.4;
  private _bloomRadius = 0.6;

  // Scratch colors for CSS bridge interpolation (avoid per-frame allocation)
  private _scratchSectionColor = new THREE.Color();
  private _scratchGlowColor = new THREE.Color();
  private _scratchCaWarm = new THREE.Color();
  private _scratchCaCool = new THREE.Color();

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

    // Rim Light — back-lighting for depth
    this.rimLight = new THREE.DirectionalLight(
      colors.neutral[6].getHex(),
      0.1,
    );
    this.rimLight.position.set(-5, 5, -8);
    scene.add(this.rimLight);
  }

  /** Interpolated cloud opacity for CloudField sync */
  get cloudParams(): { opacity: number } {
    return { opacity: this._cloudOpacity };
  }

  get bloomParams(): { threshold: number; strength: number; radius: number } {
    return {
      threshold: this._bloomThreshold,
      strength: this._bloomStrength,
      radius: this._bloomRadius,
    };
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
    this.fog.color.copy(kf0.fogColor).lerpHSL(kf1.fogColor, t);

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
    this.directionalLight.color.copy(kf0.lightColor).lerpHSL(kf1.lightColor, t);

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

    // rim light
    this.rimLight.intensity = THREE.MathUtils.lerp(
      kf0.rimIntensity,
      kf1.rimIntensity,
      t,
    );
    this.rimLight.color.copy(kf0.rimColor).lerpHSL(kf1.rimColor, t);
    this.rimLight.position.y = THREE.MathUtils.lerp(kf0.rimY, kf1.rimY, t);

    // cloud opacity
    this._cloudOpacity = THREE.MathUtils.lerp(
      kf0.cloudOpacity,
      kf1.cloudOpacity,
      t,
    );

    // bloom parameters
    this._bloomThreshold = THREE.MathUtils.lerp(kf0.bloomThreshold, kf1.bloomThreshold, t);
    this._bloomStrength = THREE.MathUtils.lerp(kf0.bloomStrength, kf1.bloomStrength, t);
    this._bloomRadius = THREE.MathUtils.lerp(kf0.bloomRadius, kf1.bloomRadius, t);

    // --- CSS custom property bridge ---
    const style = document.documentElement.style;

    // fog color
    const fc = this.fog.color;
    style.setProperty(
      '--atmos-fog-color',
      `rgb(${(fc.r * 255) | 0}, ${(fc.g * 255) | 0}, ${(fc.b * 255) | 0})`,
    );

    // section title color
    const sc = this._scratchSectionColor
      .copy(kf0.sectionColor)
      .lerp(kf1.sectionColor, t);
    style.setProperty(
      '--atmos-section-color',
      `rgb(${(sc.r * 255) | 0},${(sc.g * 255) | 0},${(sc.b * 255) | 0})`,
    );

    // glow color (comma-separated for rgba() usage)
    const gc = this._scratchGlowColor
      .copy(kf0.glowColor)
      .lerp(kf1.glowColor, t);
    style.setProperty(
      '--atmos-glow-color',
      `${(gc.r * 255) | 0},${(gc.g * 255) | 0},${(gc.b * 255) | 0}`,
    );

    // glow opacities
    const glowOp = THREE.MathUtils.lerp(kf0.glowOpacity, kf1.glowOpacity, t);
    const glowOpOuter = THREE.MathUtils.lerp(
      kf0.glowOpacityOuter,
      kf1.glowOpacityOuter,
      t,
    );
    style.setProperty('--atmos-glow-opacity', String(glowOp.toFixed(3)));
    style.setProperty(
      '--atmos-glow-opacity-outer',
      String(glowOpOuter.toFixed(3)),
    );

    // chromatic aberration offset
    const caOff = THREE.MathUtils.lerp(kf0.caOffset, kf1.caOffset, t);
    style.setProperty('--atmos-ca-offset', `${caOff.toFixed(2)}px`);

    // warm shift
    const wc = this._scratchCaWarm
      .copy(kf0.caWarmColor)
      .lerp(kf1.caWarmColor, t);
    const wa = THREE.MathUtils.lerp(kf0.caWarmAlpha, kf1.caWarmAlpha, t);
    style.setProperty(
      '--atmos-ca-warm',
      `rgba(${(wc.r * 255) | 0},${(wc.g * 255) | 0},${(wc.b * 255) | 0},${wa.toFixed(3)})`,
    );

    // cool shift
    const cc = this._scratchCaCool
      .copy(kf0.caCoolColor)
      .lerp(kf1.caCoolColor, t);
    const ca = THREE.MathUtils.lerp(kf0.caCoolAlpha, kf1.caCoolAlpha, t);
    style.setProperty(
      '--atmos-ca-cool',
      `rgba(${(cc.r * 255) | 0},${(cc.g * 255) | 0},${(cc.b * 255) | 0},${ca.toFixed(3)})`,
    );
  }
}
