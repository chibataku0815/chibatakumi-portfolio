/**
 * Viewport — Fullscreen quad with Film Lab color grading shader
 *
 * Responsibilities:
 * - PlaneGeometry(2, 2) fullscreen quad
 * - ShaderMaterial with filmlab.vert + filmlab.frag
 * - Uniform management for all color grading / effect parameters
 * - Bulk get/set for preset support
 */

import * as THREE from "three";
import vertexShader from "../shaders/filmlab.vert?raw";
import fragmentShader from "../shaders/filmlab.frag?raw";

export interface ViewportOptions {
  renderer: THREE.WebGLRenderer;
}

export class Viewport {
  mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(options: ViewportOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uImageResolution: { value: new THREE.Vector2(1280, 720) },
        uTime: { value: 0.0 },
        // Color Grading
        uExposure: { value: 0.0 },
        uContrast: { value: 1.0 },
        uSaturation: { value: 1.0 },
        uTemperature: { value: 0.0 },
        // Effects
        uRGBShift: { value: 0.0 },
        uGrainIntensity: { value: 0.0 },
        uVignette: { value: 0.0 },
        // Before/After
        uSplitPosition: { value: 0.5 },
        // LUT
        uLUT: { value: null },
        uLUTIntensity: { value: 1.0 },
        uLUTEnabled: { value: 0.0 },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
  }

  // --- Texture ---

  setTexture(texture: THREE.Texture): void {
    this.material.uniforms.uTexture!.value = texture;
  }

  // --- Resolution ---

  setResolution(width: number, height: number): void {
    this.material.uniforms.uResolution!.value.set(width, height);
  }

  setImageResolution(width: number, height: number): void {
    this.material.uniforms.uImageResolution!.value.set(width, height);
  }

  // --- Time ---

  setTime(time: number): void {
    this.material.uniforms.uTime!.value = time;
  }

  // === Color Grading Setters ===

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

  // === Effects Setters ===

  setRGBShift(value: number): void {
    this.material.uniforms.uRGBShift!.value = value;
  }

  setGrainIntensity(value: number): void {
    this.material.uniforms.uGrainIntensity!.value = value;
  }

  setVignette(value: number): void {
    this.material.uniforms.uVignette!.value = value;
  }

  // === LUT ===

  /**
   * Set a 3D LUT texture parsed from .cube file.
   * Creates a Data3DTexture from the parsed CubeLUT data.
   */
  setLUT(data: Float32Array, size: number): void {
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
    this.material.uniforms.uLUT!.value = null;
    this.material.uniforms.uLUTEnabled!.value = 0.0;
  }

  setLUTIntensity(value: number): void {
    this.material.uniforms.uLUTIntensity!.value = value;
  }

  // === Before/After ===

  setSplitPosition(value: number): void {
    this.material.uniforms.uSplitPosition!.value = value;
  }

  // === Bulk Params (for presets) ===

  getParams(): Record<string, number> {
    return {
      exposure: this.material.uniforms.uExposure!.value as number,
      contrast: this.material.uniforms.uContrast!.value as number,
      saturation: this.material.uniforms.uSaturation!.value as number,
      temperature: this.material.uniforms.uTemperature!.value as number,
      rgbShift: this.material.uniforms.uRGBShift!.value as number,
      grainIntensity: this.material.uniforms.uGrainIntensity!.value as number,
      vignette: this.material.uniforms.uVignette!.value as number,
      splitPosition: this.material.uniforms.uSplitPosition!.value as number,
    };
  }

  setParams(params: Record<string, number>): void {
    if (params.exposure !== undefined) this.setExposure(params.exposure);
    if (params.contrast !== undefined) this.setContrast(params.contrast);
    if (params.saturation !== undefined) this.setSaturation(params.saturation);
    if (params.temperature !== undefined)
      this.setTemperature(params.temperature);
    if (params.rgbShift !== undefined) this.setRGBShift(params.rgbShift);
    if (params.grainIntensity !== undefined)
      this.setGrainIntensity(params.grainIntensity);
    if (params.vignette !== undefined) this.setVignette(params.vignette);
    if (params.splitPosition !== undefined)
      this.setSplitPosition(params.splitPosition);
  }
}
