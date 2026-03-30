/**
 * @fileoverview ブラウザ {@link Viewport} と同順の **多パス**（grade → bloom → halation → composite）を Remotion 上で実行する。
 *
 * 主な仕様:
 * - Pass1 は 2D LUT 付きグレードのみ（`gradeOnlyMultipassFragmentShader`）。
 * - Pass2〜は `apps/web` の bloom / halation / blur / composite シェーダを流用（GLSL3）。
 * - 最終合成はオフスクリーン RT に書き、`MeshBasicMaterial` 表示用テクスチャとして返す。
 *
 * 制限事項:
 * - A/B compare・split プレビューは未実装（`uSplitPosition = -1` 固定）。
 */

import * as THREE from "three";
import type { Params } from "film-lab-core";
import { bloomFragmentShader } from "../../web/src/features/interactive/film-lab/shader/bloom.frag";
import { blurFragmentShader } from "../../web/src/features/interactive/film-lab/shader/blur.frag";
import { compositeFragmentShader } from "../../web/src/features/interactive/film-lab/shader/composite.frag";
import { filmlabVertexShader } from "../../web/src/features/interactive/film-lab/shader/filmlab.vert";
import { halationFragmentShader } from "../../web/src/features/interactive/film-lab/shader/halation.frag";
import { gradeOnlyMultipassFragmentShader } from "./shaders/gradeOnlyMultipass.frag";

const RT_OPTIONS: THREE.WebGLRenderTargetOptions = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.HalfFloatType,
};

/** Web の Viewport.ABERRATION_EDGE_SOFTEN_SCALE と同値（rgbShift→composite 周辺ソフト） */
const ABERRATION_EDGE_SOFTEN_SCALE = 22;

let blackTexture: THREE.DataTexture | null = null;
function getBlackTexture(): THREE.DataTexture {
  if (!blackTexture) {
    blackTexture = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1,
      1,
      THREE.RGBAFormat,
    );
    blackTexture.needsUpdate = true;
  }
  return blackTexture;
}

export class FilmLabRemotionPipeline {
  private readonly width: number;
  private readonly height: number;

  private gradeMaterial: THREE.ShaderMaterial;
  private gradeScene: THREE.Scene;
  private gradeCamera: THREE.OrthographicCamera;
  private gradeMesh: THREE.Mesh;

  private postScene: THREE.Scene;
  private postCamera: THREE.OrthographicCamera;
  private postMesh: THREE.Mesh;

  private bloomMaterial: THREE.ShaderMaterial;
  private halationMaterial: THREE.ShaderMaterial;
  private blurMaterial: THREE.ShaderMaterial;
  private compositeMaterial: THREE.ShaderMaterial;

  private rtColorGraded: THREE.WebGLRenderTarget | null = null;
  private rtBloom0: THREE.WebGLRenderTarget | null = null;
  private rtBloom1: THREE.WebGLRenderTarget | null = null;
  private rtHalation0: THREE.WebGLRenderTarget | null = null;
  private rtHalation1: THREE.WebGLRenderTarget | null = null;
  /** 合成結果（表示用） */
  private rtPresent: THREE.WebGLRenderTarget | null = null;

  private bloomStrength = 0;
  private bloomRadius = 0.4;
  private bloomThreshold = 0.8;
  private halationIntensity = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.gradeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: gradeOnlyMultipassFragmentShader,
      uniforms: {
        uTexture: { value: null },
        uImageAspect: { value: 1 },
        uCompAspect: { value: width / height },
        uExposure: { value: 0 },
        uContrast: { value: 1 },
        uSaturation: { value: 1 },
        uTemperature: { value: 0 },
        uTint: { value: 0 },
        /** RGB チャンネル横ずらし量（`Params.rgbShift`） */
        uRgbShift: { value: 0 },
        uFade: { value: 0 },
        uHighlights: { value: 0 },
        uShadows: { value: 0 },
        uLUT2D: { value: null },
        uLutEnabled: { value: 0 },
        uLutIntensity: { value: 1 },
        uLutSize: { value: 2 },
      },
    });

    const gPlane = new THREE.PlaneGeometry(2, 2);
    this.gradeMesh = new THREE.Mesh(gPlane, this.gradeMaterial);
    this.gradeScene = new THREE.Scene();
    this.gradeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.gradeScene.add(this.gradeMesh);

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pGeom = new THREE.PlaneGeometry(2, 2);
    this.postMesh = new THREE.Mesh(pGeom);
    this.postScene.add(this.postMesh);

    this.bloomMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: bloomFragmentShader,
      uniforms: {
        uSource: { value: null },
        uBloomThreshold: { value: 0.8 },
      },
    });

    this.halationMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: halationFragmentShader,
      uniforms: {
        uSource: { value: null },
        uHalationColor: { value: new THREE.Vector3(0.91, 0.063, 0.125) },
      },
    });

    this.blurMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: blurFragmentShader,
      uniforms: {
        uSource: { value: null },
        uDirection: { value: new THREE.Vector2(1, 0) },
        uResolution: { value: new THREE.Vector2(width, height) },
        uRadius: { value: 0.4 },
      },
    });

    this.compositeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: filmlabVertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: {
        uSource: { value: null },
        uBloomTexture: { value: null },
        uHalationTexture: { value: null },
        uOriginalTexture: { value: null },
        uBloomStrength: { value: 0 },
        uHalationIntensity: { value: 0 },
        uVignette: { value: 0 },
        uGrainIntensity: { value: 0 },
        uGrainRadialMix: { value: 1 },
        uTime: { value: 0 },
        uSplitPosition: { value: -1 },
        uAbCompare: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uImageResolution: { value: new THREE.Vector2(1280, 720) },
        uAberrationEdgeSoften: { value: 0.0 },
      },
    });
  }

  private ensureTargets(): void {
    if (this.rtColorGraded) {
      return;
    }
    const w = this.width;
    const h = this.height;
    this.rtColorGraded = new THREE.WebGLRenderTarget(w, h, RT_OPTIONS);
    this.rtPresent = new THREE.WebGLRenderTarget(w, h, RT_OPTIONS);

    const bw = Math.max(1, Math.floor(w / 2));
    const bh = Math.max(1, Math.floor(h / 2));
    this.rtBloom0 = new THREE.WebGLRenderTarget(bw, bh, RT_OPTIONS);
    this.rtBloom1 = new THREE.WebGLRenderTarget(bw, bh, RT_OPTIONS);

    const hw = Math.max(1, Math.floor(w / 4));
    const hh = Math.max(1, Math.floor(h / 4));
    this.rtHalation0 = new THREE.WebGLRenderTarget(hw, hh, RT_OPTIONS);
    this.rtHalation1 = new THREE.WebGLRenderTarget(hw, hh, RT_OPTIONS);
  }

  /**
   * 入力動画／画像テクスチャとソース解像度（composite の cover 用）を設定する。
   */
  setInputTexture(tex: THREE.Texture, imageWidth: number, imageHeight: number): void {
    this.ensureTargets();
    const gm = this.gradeMaterial.uniforms;
    gm.uTexture!.value = tex;
    gm.uImageAspect!.value = imageWidth / Math.max(1, imageHeight);
    const cu = this.compositeMaterial.uniforms;
    cu.uImageResolution!.value.set(imageWidth, imageHeight);
    cu.uOriginalTexture!.value = tex;
  }

  /**
   * Pass1 の coverUv 用（ソース縦横比とコンポ縦横比）。動画フレームごとに変わりうる。
   */
  setCoverAspects(sourceAspectWidthOverHeight: number, compAspect: number): void {
    const gm = this.gradeMaterial.uniforms;
    gm.uImageAspect!.value = sourceAspectWidthOverHeight;
    gm.uCompAspect!.value = compAspect;
  }

  /**
   * core の grade・LUT・エフェクト強度をシェーダへ反映する（毎フレーム）。
   */
  syncFromProps(
    grade: Params,
    lutTexture: THREE.DataTexture | THREE.Texture,
    lutOn: number,
    lutIntensity: number,
    lutSize: number,
    halationColor: THREE.Vector3,
    grainTime: number,
  ): void {
    this.lastHalationSpread = grade.halationSpread;
    const gm = this.gradeMaterial.uniforms;
    gm.uExposure!.value = grade.exposure;
    gm.uContrast!.value = grade.contrast;
    gm.uSaturation!.value = grade.saturation;
    gm.uTemperature!.value = grade.temperature;
    gm.uTint!.value = grade.tint;
    gm.uRgbShift!.value = grade.rgbShift;
    gm.uFade!.value = grade.fade;
    gm.uHighlights!.value = grade.highlights;
    gm.uShadows!.value = grade.shadows;
    gm.uLUT2D!.value = lutTexture;
    gm.uLutEnabled!.value = lutOn;
    gm.uLutIntensity!.value = lutIntensity;
    gm.uLutSize!.value = lutSize;

    this.bloomThreshold = grade.bloomThreshold;
    this.bloomStrength = grade.bloomStrength;
    this.bloomRadius = grade.bloomRadius;
    this.halationIntensity = grade.halationIntensity;

    this.halationMaterial.uniforms.uHalationColor!.value.copy(halationColor);

    const cu = this.compositeMaterial.uniforms;
    cu.uVignette!.value = grade.vignette;
    cu.uGrainIntensity!.value = grade.grainIntensity;
    cu.uGrainRadialMix!.value = grade.grainRadialMix ?? 1;
    cu.uTime!.value = grainTime;
    cu.uBloomStrength!.value = this.bloomStrength;
    cu.uHalationIntensity!.value = this.halationIntensity;
    cu.uResolution!.value.set(this.width, this.height);
    cu.uAberrationEdgeSoften!.value = Math.min(
      1,
      Math.max(0, grade.rgbShift * ABERRATION_EDGE_SOFTEN_SCALE),
    );
  }

  private renderBloom(renderer: THREE.WebGLRenderer): void {
    const bw = this.rtBloom0!.width;
    const bh = this.rtBloom0!.height;

    this.bloomMaterial.uniforms.uSource!.value = this.rtColorGraded!.texture;
    this.bloomMaterial.uniforms.uBloomThreshold!.value = this.bloomThreshold;
    this.postMesh.material = this.bloomMaterial;
    renderer.setRenderTarget(this.rtBloom0);
    renderer.render(this.postScene, this.postCamera);

    this.blurMaterial.uniforms.uSource!.value = this.rtBloom0!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(1, 0);
    this.blurMaterial.uniforms.uResolution!.value.set(bw, bh);
    this.blurMaterial.uniforms.uRadius!.value = this.bloomRadius;
    this.postMesh.material = this.blurMaterial;
    renderer.setRenderTarget(this.rtBloom1);
    renderer.render(this.postScene, this.postCamera);

    this.blurMaterial.uniforms.uSource!.value = this.rtBloom1!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(0, 1);
    renderer.setRenderTarget(this.rtBloom0);
    renderer.render(this.postScene, this.postCamera);
  }

  private renderHalation(renderer: THREE.WebGLRenderer): void {
    const hw = this.rtHalation0!.width;
    const hh = this.rtHalation0!.height;
    const halationRadiusSpread = this.lastHalationSpread / 50.0;

    this.halationMaterial.uniforms.uSource!.value = this.rtColorGraded!.texture;
    this.postMesh.material = this.halationMaterial;
    renderer.setRenderTarget(this.rtHalation0);
    renderer.render(this.postScene, this.postCamera);

    this.blurMaterial.uniforms.uSource!.value = this.rtHalation0!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(1, 0);
    this.blurMaterial.uniforms.uResolution!.value.set(hw, hh);
    this.blurMaterial.uniforms.uRadius!.value = halationRadiusSpread;
    this.postMesh.material = this.blurMaterial;
    renderer.setRenderTarget(this.rtHalation1);
    renderer.render(this.postScene, this.postCamera);

    this.blurMaterial.uniforms.uSource!.value = this.rtHalation1!.texture;
    this.blurMaterial.uniforms.uDirection!.value.set(0, 1);
    renderer.setRenderTarget(this.rtHalation0);
    renderer.render(this.postScene, this.postCamera);
  }

  private lastHalationSpread = 15;

  /**
   * 全パスを実行し `rtPresent` に最終画像を書き込む。
   */
  render(renderer: THREE.WebGLRenderer): void {
    this.ensureTargets();
    const black = getBlackTexture();
    const cu = this.compositeMaterial.uniforms;

    renderer.setRenderTarget(this.rtColorGraded);
    renderer.render(this.gradeScene, this.gradeCamera);

    const bloomOn = this.bloomStrength > 0;
    const halationOn = this.halationIntensity > 0;

    if (bloomOn) {
      this.renderBloom(renderer);
    }
    if (halationOn) {
      this.renderHalation(renderer);
    }

    cu.uSource!.value = this.rtColorGraded!.texture;
    cu.uBloomTexture!.value = bloomOn ? this.rtBloom0!.texture : black;
    cu.uHalationTexture!.value = halationOn ? this.rtHalation0!.texture : black;
    cu.uSplitPosition!.value = -1;
    cu.uAbCompare!.value = 0;

    this.postMesh.material = this.compositeMaterial;
    renderer.setRenderTarget(this.rtPresent);
    renderer.render(this.postScene, this.postCamera);
    renderer.setRenderTarget(null);
  }

  getOutputTexture(): THREE.Texture {
    this.ensureTargets();
    return this.rtPresent!.texture;
  }

  dispose(): void {
    this.gradeMaterial.dispose();
    this.bloomMaterial.dispose();
    this.halationMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
    this.rtColorGraded?.dispose();
    this.rtPresent?.dispose();
    this.rtBloom0?.dispose();
    this.rtBloom1?.dispose();
    this.rtHalation0?.dispose();
    this.rtHalation1?.dispose();
    this.rtColorGraded = null;
    this.rtPresent = null;
    this.rtBloom0 = null;
    this.rtBloom1 = null;
    this.rtHalation0 = null;
    this.rtHalation1 = null;
  }
}
