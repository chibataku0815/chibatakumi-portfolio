/**
 * Viewport — Fullscreen quad with Film Lab color grading + Bloom/Halation multi-pass
 *
 * Architecture:
 *   Pass 1: Color grade (filmlab.frag) → RenderTarget A
 *   Pass 2-4: Bloom threshold → blur H → blur V (1/2 res)
 *   Pass 5-7: Halation threshold+tint → blur H → blur V (1/4 res)
 *   Pass 8: Composite (A + bloom + halation + vignette + grain + split) → screen
 */

import * as THREE from "three";
import { filmlabVertexShader } from "../shader/filmlab.vert";
import { bloomFragmentShader } from "../shader/bloom.frag";
import { halationFragmentShader } from "../shader/halation.frag";
import { blurFragmentShader } from "../shader/blur.frag";
import { compositeFragmentShader } from "../shader/composite.frag";

export interface ViewportOptions {
  vertexShader: string;
  fragmentShader: string;
  width: number;
  height: number;
}

let _blackTexture: THREE.DataTexture | null = null;
function getBlackTexture(): THREE.DataTexture {
  if (!_blackTexture) {
    _blackTexture = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1, 1,
      THREE.RGBAFormat,
    );
    _blackTexture.needsUpdate = true;
  }
  return _blackTexture;
}

const RT_OPTIONS: THREE.RenderTargetOptions = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.HalfFloatType,
};

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

/**
 * スプリットトーン（シャドウ）: `shadowTone` スカラー（-1〜1）に掛けて `uShadowTint` へ送る固定方向。
 * 青寄りで陰影に「冷たさ」を足す想定（filmlab.frag は lum マスク後に加算）。
 */
const SHADOW_TONE_DIRECTION = new THREE.Vector3(0.12, 0.18, 0.42);

/**
 * スプリットトーン（ハイライト）: `highlightTone` に掛けて `uHighlightTint` へ送る固定方向。
 * 暖色寄りでハイライトにフィルム感を足す想定。
 */
const HIGHLIGHT_TONE_DIRECTION = new THREE.Vector3(0.38, 0.16, 0.06);

export class Viewport {
  mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;

  // Post-processing scene (shared quad, swap material per pass)
  private postScene: THREE.Scene;
  private postCamera: THREE.OrthographicCamera;
  private postGeometry: THREE.PlaneGeometry;
  private postMesh: THREE.Mesh;

  // Post-processing materials
  private bloomMaterial: THREE.ShaderMaterial;
  private halationMaterial: THREE.ShaderMaterial;
  private blurMaterial: THREE.ShaderMaterial;
  private compositeMaterial: THREE.ShaderMaterial;

  // RenderTargets (lazy)
  private rtColorGraded: THREE.WebGLRenderTarget | null = null;
  private rtBloom0: THREE.WebGLRenderTarget | null = null;
  private rtBloom1: THREE.WebGLRenderTarget | null = null;
  private rtHalation0: THREE.WebGLRenderTarget | null = null;
  private rtHalation1: THREE.WebGLRenderTarget | null = null;
  /** A/B 比較: スロット A の最終合成（分割なし）を書き込む */
  private rtCompareComposite: THREE.WebGLRenderTarget | null = null;

  /** true のとき render() でスロット A→RT、続けてスロット B を画面に分割表示 */
  private abCompareEnabled = false;
  private compareParamsA: Record<string, number | string> = {};
  private compareParamsB: Record<string, number | string> = {};

  // Bloom/Halation params (stored here, not on color grade material)
  private bloomThreshold = 0.8;
  private bloomStrength = 0.0;
  private bloomRadius = 0.4;
  private halationIntensity = 0.0;
  private halationSpread = 15.0;
  private halationColor = new THREE.Vector3(0.91, 0.063, 0.125);

  private width: number;
  private height: number;

  private renderer: THREE.WebGLRenderer | null = null;
  private histogramBuffer: Float32Array | null = null;

  constructor(options: ViewportOptions) {
    this.width = options.width;
    this.height = options.height;

    // Pass 1: Color grade material
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: options.vertexShader,
      fragmentShader: options.fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uResolution: {
          value: new THREE.Vector2(options.width, options.height),
        },
        uImageResolution: { value: new THREE.Vector2(1280, 720) },
        uTime: { value: 0.0 },
        uExposure: { value: 0.0 },
        uContrast: { value: 1.0 },
        uSaturation: { value: 1.0 },
        uTemperature: { value: 0.0 },
        uTint: { value: 0.0 },
        uShadowTint: { value: new THREE.Vector3(0, 0, 0) },
        uHighlightTint: { value: new THREE.Vector3(0, 0, 0) },
        uRGBShift: { value: 0.0 },
        uGrainIntensity: { value: 0.0 },
        uVignette: { value: 0.0 },
        uFade: { value: 0.0 },
        uHighlights: { value: 0.0 },
        uShadows: { value: 0.0 },
        uSplitPosition: { value: 0.5 },
        uLUT: { value: null },
        uLUTIntensity: { value: 1.0 },
        uLUTEnabled: { value: 0.0 },
      },
    });

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Post-processing scene
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postGeometry = new THREE.PlaneGeometry(2, 2);
    this.postMesh = new THREE.Mesh(this.postGeometry);
    this.postScene.add(this.postMesh);

    // Bloom threshold material
    this.bloomMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: bloomFragmentShader,
      uniforms: {
        uSource: { value: null },
        uBloomThreshold: { value: 0.8 },
      },
    });

    // Halation material
    this.halationMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: halationFragmentShader,
      uniforms: {
        uSource: { value: null },
        uHalationColor: { value: new THREE.Vector3(0.91, 0.063, 0.125) },
      },
    });

    // Blur material (shared for bloom + halation)
    this.blurMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: blurFragmentShader,
      uniforms: {
        uSource: { value: null },
        uDirection: { value: new THREE.Vector2(1, 0) },
        uResolution: { value: new THREE.Vector2(options.width, options.height) },
        uRadius: { value: 0.4 },
      },
    });

    // Composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: {
        uSource: { value: null },
        uBloomTexture: { value: null },
        uHalationTexture: { value: null },
        uOriginalTexture: { value: null },
        uBloomStrength: { value: 0.0 },
        uHalationIntensity: { value: 0.0 },
        uVignette: { value: 0.0 },
        uGrainIntensity: { value: 0.0 },
        uTime: { value: 0.0 },
        uSplitPosition: { value: 0.5 },
        uAbCompare: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(options.width, options.height),
        },
        uImageResolution: { value: new THREE.Vector2(1280, 720) },
      },
    });
  }

  // ===== RenderTarget management =====

  private ensureRenderTargets(): void {
    if (this.rtColorGraded) return;

    const w = this.width;
    const h = this.height;

    this.rtColorGraded = new THREE.WebGLRenderTarget(w, h, RT_OPTIONS);
    this.rtCompareComposite = new THREE.WebGLRenderTarget(w, h, RT_OPTIONS);

    // Bloom at 1/2 resolution
    const bw = Math.max(1, Math.floor(w / 2));
    const bh = Math.max(1, Math.floor(h / 2));
    this.rtBloom0 = new THREE.WebGLRenderTarget(bw, bh, RT_OPTIONS);
    this.rtBloom1 = new THREE.WebGLRenderTarget(bw, bh, RT_OPTIONS);

    // Halation at 1/4 resolution
    const hw = Math.max(1, Math.floor(w / 4));
    const hh = Math.max(1, Math.floor(h / 4));
    this.rtHalation0 = new THREE.WebGLRenderTarget(hw, hh, RT_OPTIONS);
    this.rtHalation1 = new THREE.WebGLRenderTarget(hw, hh, RT_OPTIONS);
  }

  private resizeRenderTargets(w: number, h: number): void {
    if (!this.rtColorGraded) return;

    this.rtColorGraded.setSize(w, h);
    this.rtCompareComposite?.setSize(w, h);

    const bw = Math.max(1, Math.floor(w / 2));
    const bh = Math.max(1, Math.floor(h / 2));
    this.rtBloom0!.setSize(bw, bh);
    this.rtBloom1!.setSize(bw, bh);

    const hw = Math.max(1, Math.floor(w / 4));
    const hh = Math.max(1, Math.floor(h / 4));
    this.rtHalation0!.setSize(hw, hh);
    this.rtHalation1!.setSize(hw, hh);
  }

  // ===== Multi-pass render =====

  /**
   * 合成パス用ユニフォームをカラーグレード側（＋ Bloom/Halation 強度）に合わせる。
   */
  private syncCompositeUniformsFromMaterial(): void {
    const cu = this.compositeMaterial.uniforms;
    const mu = this.material.uniforms;
    cu.uVignette!.value = mu.uVignette!.value;
    cu.uGrainIntensity!.value = mu.uGrainIntensity!.value;
    cu.uTime!.value = mu.uTime!.value;
    cu.uResolution!.value.copy(mu.uResolution!.value as THREE.Vector2);
    cu.uImageResolution!.value.copy(
      mu.uImageResolution!.value as THREE.Vector2,
    );
    cu.uBloomStrength!.value = this.bloomStrength;
    cu.uHalationIntensity!.value = this.halationIntensity;
  }

  /**
   * A/B ルック比較のオンオフと両スロットのパラメータ（setParams と同形のレコード）。
   * オフ時は render が従来どおりアクティブ側のみ（setParams で渡した値）を使う。
   */
  setComparePair(
    enabled: boolean,
    paramsA: Record<string, number | string> | null,
    paramsB: Record<string, number | string> | null,
  ): void {
    this.abCompareEnabled = enabled;
    if (paramsA) this.compareParamsA = { ...paramsA };
    if (paramsB) this.compareParamsB = { ...paramsB };
  }

  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ): void {
    this.ensureRenderTargets();
    this.renderer = renderer;

    if (this.abCompareEnabled) {
      this.renderComparePair(renderer, scene, camera);
      return;
    }

    const cu = this.compositeMaterial.uniforms;
    const mu = this.material.uniforms;
    this.syncCompositeUniformsFromMaterial();
    cu.uSplitPosition!.value = mu.uSplitPosition!.value;
    cu.uOriginalTexture!.value = mu.uTexture!.value;
    cu.uAbCompare!.value = 0.0;

    // Pass 1: Color grade → RT_A
    renderer.setRenderTarget(this.rtColorGraded);
    renderer.render(scene, camera);

    const bloomOn = this.bloomStrength > 0;
    const halationOn = this.halationIntensity > 0;

    if (bloomOn) {
      this.renderBloom(renderer);
    }

    if (halationOn) {
      this.renderHalation(renderer);
    }

    renderer.setRenderTarget(null);
    const black = getBlackTexture();
    cu.uSource!.value = this.rtColorGraded!.texture;
    cu.uBloomTexture!.value = bloomOn ? this.rtBloom0!.texture : black;
    cu.uHalationTexture!.value = halationOn ? this.rtHalation0!.texture : black;
    this.postMesh.material = this.compositeMaterial;
    renderer.render(this.postScene, this.postCamera);
  }

  /**
   * スロット A を全パスで RT に書き、続けてスロット B を画面に分割合成する。
   */
  private renderComparePair(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ): void {
    const cu = this.compositeMaterial.uniforms;
    const mu = this.material.uniforms;
    const black = getBlackTexture();

    const runPipeline = () => {
      renderer.setRenderTarget(this.rtColorGraded);
      renderer.render(scene, camera);
      const bloomOn = this.bloomStrength > 0;
      const halationOn = this.halationIntensity > 0;
      if (bloomOn) {
        this.renderBloom(renderer);
      }
      if (halationOn) {
        this.renderHalation(renderer);
      }
    };

    const compositeToTarget = (
      target: THREE.WebGLRenderTarget | null,
      splitPosition: number,
      abCompare: number,
      originalTex: THREE.Texture,
    ) => {
      this.syncCompositeUniformsFromMaterial();
      cu.uSplitPosition!.value = splitPosition;
      cu.uAbCompare!.value = abCompare;
      cu.uOriginalTexture!.value = originalTex;
      const bloomOn = this.bloomStrength > 0;
      const halationOn = this.halationIntensity > 0;
      cu.uSource!.value = this.rtColorGraded!.texture;
      cu.uBloomTexture!.value = bloomOn ? this.rtBloom0!.texture : black;
      cu.uHalationTexture!.value = halationOn ? this.rtHalation0!.texture : black;
      this.postMesh.material = this.compositeMaterial;
      renderer.setRenderTarget(target);
      renderer.render(this.postScene, this.postCamera);
    };

    // —— スロット A: 分割なしでフルフレームを比較用 RT に ——
    this.setParams(this.compareParamsA);
    runPipeline();
    compositeToTarget(
      this.rtCompareComposite,
      -1.0,
      0.0,
      mu.uTexture!.value as THREE.Texture,
    );

    // —— スロット B: 左=A の合成結果、右=B ——
    this.setParams(this.compareParamsB);
    runPipeline();
    compositeToTarget(
      null,
      mu.uSplitPosition!.value as number,
      1.0,
      this.rtCompareComposite!.texture,
    );
  }

  private renderBloom(renderer: THREE.WebGLRenderer): void {
    const bw = this.rtBloom0!.width;
    const bh = this.rtBloom0!.height;

    // Threshold
    this.bloomMaterial.uniforms.uSource!.value = this.rtColorGraded!.texture;
    this.bloomMaterial.uniforms.uBloomThreshold!.value = this.bloomThreshold;
    this.postMesh.material = this.bloomMaterial;
    renderer.setRenderTarget(this.rtBloom0);
    renderer.render(this.postScene, this.postCamera);

    // Blur horizontal
    this.blurMaterial.uniforms.uSource!.value = this.rtBloom0!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(1, 0);
    this.blurMaterial.uniforms.uResolution!.value.set(bw, bh);
    this.blurMaterial.uniforms.uRadius!.value = this.bloomRadius;
    this.postMesh.material = this.blurMaterial;
    renderer.setRenderTarget(this.rtBloom1);
    renderer.render(this.postScene, this.postCamera);

    // Blur vertical
    this.blurMaterial.uniforms.uSource!.value = this.rtBloom1!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(0, 1);
    renderer.setRenderTarget(this.rtBloom0);
    renderer.render(this.postScene, this.postCamera);
  }

  private renderHalation(renderer: THREE.WebGLRenderer): void {
    const hw = this.rtHalation0!.width;
    const hh = this.rtHalation0!.height;

    // Threshold + tint
    this.halationMaterial.uniforms.uSource!.value = this.rtColorGraded!.texture;
    this.halationMaterial.uniforms.uHalationColor!.value.copy(
      this.halationColor,
    );
    this.postMesh.material = this.halationMaterial;
    renderer.setRenderTarget(this.rtHalation0);
    renderer.render(this.postScene, this.postCamera);

    // Blur horizontal (larger radius)
    const halationRadius = this.halationSpread / 50.0;
    this.blurMaterial.uniforms.uSource!.value = this.rtHalation0!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(1, 0);
    this.blurMaterial.uniforms.uResolution!.value.set(hw, hh);
    this.blurMaterial.uniforms.uRadius!.value = halationRadius;
    this.postMesh.material = this.blurMaterial;
    renderer.setRenderTarget(this.rtHalation1);
    renderer.render(this.postScene, this.postCamera);

    // Blur vertical
    this.blurMaterial.uniforms.uSource!.value = this.rtHalation1!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(0, 1);
    renderer.setRenderTarget(this.rtHalation0);
    renderer.render(this.postScene, this.postCamera);
  }

  // ===== Texture =====

  setTexture(texture: THREE.Texture): void {
    this.material.uniforms.uTexture!.value = texture;
  }

  // ===== Resolution =====

  setResolution(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.material.uniforms.uResolution!.value.set(width, height);
    this.resizeRenderTargets(width, height);
  }

  setImageResolution(width: number, height: number): void {
    this.material.uniforms.uImageResolution!.value.set(width, height);
  }

  // ===== Time =====

  setTime(time: number): void {
    this.material.uniforms.uTime!.value = time;
  }

  // ===== Color Grading Setters =====

  setExposure(value: number): void {
    this.material.uniforms.uExposure!.value = value;
  }

  setContrast(value: number): void {
    this.material.uniforms.uContrast!.value = value;
  }

  setSaturation(value: number): void {
    this.material.uniforms.uSaturation!.value = value;
  }

  setTemperature(value: number): void {
    this.material.uniforms.uTemperature!.value = value;
  }

  /**
   * グリーン／マゼンタ軸の色かぶり（シェーダー `uTint`）。
   * @param value -1〜1 程度（プリセットと `types.Params.tint` に対応）
   */
  setTint(value: number): void {
    this.material.uniforms.uTint!.value = value;
  }

  /**
   * シャドウ域へのスプリットトーン強度。内部で固定色ベクトルにスカラー倍して `uShadowTint` を更新する。
   * @param value -1〜1（`types.Params.shadowTone`）
   */
  setShadowTone(value: number): void {
    const u = this.material.uniforms.uShadowTint!.value as THREE.Vector3;
    u.copy(SHADOW_TONE_DIRECTION).multiplyScalar(value);
  }

  /**
   * ハイライト域へのスプリットトーン強度（`types.Params.highlightTone`）。
   * @param value -1〜1
   */
  setHighlightTone(value: number): void {
    const u = this.material.uniforms.uHighlightTint!.value as THREE.Vector3;
    u.copy(HIGHLIGHT_TONE_DIRECTION).multiplyScalar(value);
  }

  setFade(value: number): void {
    this.material.uniforms.uFade!.value = value;
  }

  setHighlights(value: number): void {
    this.material.uniforms.uHighlights!.value = value;
  }

  setShadows(value: number): void {
    this.material.uniforms.uShadows!.value = value;
  }

  // ===== Effects Setters =====

  setRGBShift(value: number): void {
    this.material.uniforms.uRGBShift!.value = value;
  }

  setGrainIntensity(value: number): void {
    this.material.uniforms.uGrainIntensity!.value = value;
  }

  setVignette(value: number): void {
    this.material.uniforms.uVignette!.value = value;
  }

  // ===== Bloom Setters =====

  setBloomThreshold(value: number): void {
    this.bloomThreshold = value;
  }

  setBloomStrength(value: number): void {
    this.bloomStrength = value;
  }

  setBloomRadius(value: number): void {
    this.bloomRadius = value;
  }

  // ===== Halation Setters =====

  setHalationIntensity(value: number): void {
    this.halationIntensity = value;
  }

  setHalationSpread(value: number): void {
    this.halationSpread = value;
  }

  setHalationColor(hex: string): void {
    this.halationColor = hexToVec3(hex);
  }

  // ===== LUT =====

  setLUT(data: Float32Array, size: number): void {
    const prev = this.material.uniforms.uLUT?.value as THREE.Data3DTexture | null;
    if (prev) prev.dispose();

    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.wrapR = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;

    this.material.uniforms.uLUT!.value = texture;
    this.material.uniforms.uLUTEnabled!.value = 1.0;
  }

  clearLUT(): void {
    const lutTexture = this.material.uniforms.uLUT?.value as THREE.Data3DTexture | null;
    if (lutTexture) lutTexture.dispose();
    this.material.uniforms.uLUT!.value = null;
    this.material.uniforms.uLUTEnabled!.value = 0.0;
  }

  setLUTIntensity(value: number): void {
    this.material.uniforms.uLUTIntensity!.value = value;
  }

  // ===== Before/After =====

  setSplitPosition(value: number): void {
    this.material.uniforms.uSplitPosition!.value = value;
  }

  // ===== Bulk Params (for presets) =====

  getParams(): Record<string, number | string> {
    return {
      exposure: this.material.uniforms.uExposure!.value as number,
      contrast: this.material.uniforms.uContrast!.value as number,
      saturation: this.material.uniforms.uSaturation!.value as number,
      temperature: this.material.uniforms.uTemperature!.value as number,
      tint: this.material.uniforms.uTint!.value as number,
      shadowTone: (() => {
        const u = this.material.uniforms.uShadowTint!.value as THREE.Vector3;
        const d = SHADOW_TONE_DIRECTION.x;
        return d !== 0 ? u.x / d : 0;
      })(),
      highlightTone: (() => {
        const u = this.material.uniforms.uHighlightTint!.value as THREE.Vector3;
        const d = HIGHLIGHT_TONE_DIRECTION.x;
        return d !== 0 ? u.x / d : 0;
      })(),
      rgbShift: this.material.uniforms.uRGBShift!.value as number,
      grainIntensity: this.material.uniforms.uGrainIntensity!.value as number,
      vignette: this.material.uniforms.uVignette!.value as number,
      fade: this.material.uniforms.uFade!.value as number,
      highlights: this.material.uniforms.uHighlights!.value as number,
      shadows: this.material.uniforms.uShadows!.value as number,
      bloomThreshold: this.bloomThreshold,
      bloomStrength: this.bloomStrength,
      bloomRadius: this.bloomRadius,
      halationIntensity: this.halationIntensity,
      halationSpread: this.halationSpread,
      halationColor: `#${new THREE.Color(this.halationColor.x, this.halationColor.y, this.halationColor.z).getHexString()}`,
    };
  }

  setParams(params: Record<string, number | string>): void {
    if (params.exposure !== undefined)
      this.setExposure(params.exposure as number);
    if (params.contrast !== undefined)
      this.setContrast(params.contrast as number);
    if (params.saturation !== undefined)
      this.setSaturation(params.saturation as number);
    if (params.temperature !== undefined)
      this.setTemperature(params.temperature as number);
    if (params.tint !== undefined) this.setTint(params.tint as number);
    if (params.shadowTone !== undefined)
      this.setShadowTone(params.shadowTone as number);
    if (params.highlightTone !== undefined)
      this.setHighlightTone(params.highlightTone as number);
    if (params.rgbShift !== undefined)
      this.setRGBShift(params.rgbShift as number);
    if (params.grainIntensity !== undefined)
      this.setGrainIntensity(params.grainIntensity as number);
    if (params.vignette !== undefined)
      this.setVignette(params.vignette as number);
    if (params.fade !== undefined) this.setFade(params.fade as number);
    if (params.highlights !== undefined) this.setHighlights(params.highlights as number);
    if (params.shadows !== undefined) this.setShadows(params.shadows as number);
    if (params.bloomThreshold !== undefined)
      this.setBloomThreshold(params.bloomThreshold as number);
    if (params.bloomStrength !== undefined)
      this.setBloomStrength(params.bloomStrength as number);
    if (params.bloomRadius !== undefined)
      this.setBloomRadius(params.bloomRadius as number);
    if (params.halationIntensity !== undefined)
      this.setHalationIntensity(params.halationIntensity as number);
    if (params.halationSpread !== undefined)
      this.setHalationSpread(params.halationSpread as number);
    if (params.halationColor !== undefined)
      this.setHalationColor(params.halationColor as string);
  }

  // ===== Histogram readback =====

  /** カラーグレード済みRTからピクセルデータを取得（ヒストグラム用） */
  getHistogramPixels(): { pixels: Float32Array; width: number; height: number } | null {
    if (!this.rtColorGraded || !this.renderer) return null;
    const rt = this.rtColorGraded;
    const w = rt.width;
    const h = rt.height;
    const size = w * h * 4;
    if (!this.histogramBuffer || this.histogramBuffer.length !== size) {
      this.histogramBuffer = new Float32Array(size);
    }
    // Three.js readRenderTargetPixels passes HALF_FLOAT type to gl.readPixels (from RT texture type),
    // but HALF_FLOAT requires Uint16Array. ANGLE/Metal also rejects UNSIGNED_BYTE on RGBA16F.
    // Direct gl.readPixels with FLOAT type + Float32Array works on RGBA16F framebuffers.
    const prevRT = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(rt);
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, this.histogramBuffer);
    this.renderer.setRenderTarget(prevRT);
    return { pixels: this.histogramBuffer, width: w, height: h };
  }

  // ===== Dispose =====

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.postGeometry.dispose();
    this.bloomMaterial.dispose();
    this.halationMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
    this.rtColorGraded?.dispose();
    this.rtBloom0?.dispose();
    this.rtBloom1?.dispose();
    this.rtHalation0?.dispose();
    this.rtHalation1?.dispose();
    this.rtCompareComposite?.dispose();
    const lutTexture = this.material.uniforms.uLUT?.value as THREE.Data3DTexture | null;
    if (lutTexture) lutTexture.dispose();
    const mediaTexture = this.material.uniforms.uTexture?.value as THREE.Texture | null;
    if (mediaTexture) mediaTexture.dispose();
    this.histogramBuffer = null;
    this.renderer = null;
  }
}
