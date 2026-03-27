/**
 * Gallery — Fullscreen quad with shader-based texture transitions
 *
 * Responsibilities:
 * - PlaneGeometry(2, 2) fullscreen quad
 * - ShaderMaterial with gallery.vert + gallery.frag
 * - Texture loading and swapping based on scroll index
 * - Uniform updates for transition progress and resolution
 */

import * as THREE from "three";
import vertexShader from "../shaders/gallery.vert?raw";
import fragmentShader from "../shaders/gallery.frag?raw";

export interface GalleryOptions {
  images: string[];
  renderer: THREE.WebGLRenderer;
}

export class Gallery {
  mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private textures: THREE.Texture[] = [];
  private slideCount: number;

  constructor(options: GalleryOptions) {
    const { images, renderer } = options;
    this.slideCount = images.length;

    // --- Load textures ---
    const loader = new THREE.TextureLoader();
    this.textures = images.map((src) => {
      const tex = loader.load(src);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    });

    // --- ShaderMaterial ---
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture1: { value: this.textures[0] ?? null },
        uTexture2: { value: this.textures[1] ?? null },
        uProgress: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uImageResolution: { value: new THREE.Vector2(1280, 720) },
        uDistortion: { value: 0.0 },
        uRGBShift: { value: 0.003 },
        uGrainIntensity: { value: 0.03 },
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
    });

    // --- Fullscreen quad ---
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
  }

  /**
   * Update textures and progress based on scroll state
   */
  update(currentIndex: number, progress: number): void {
    const idx1 = currentIndex % this.slideCount;
    const idx2 = (currentIndex + 1) % this.slideCount;

    const tex1 = this.textures[idx1];
    const tex2 = this.textures[idx2];
    if (tex1) this.material.uniforms.uTexture1!.value = tex1;
    if (tex2) this.material.uniforms.uTexture2!.value = tex2;
    this.material.uniforms.uProgress!.value = progress;
  }

  /**
   * Update resolution uniform on resize
   */
  setResolution(width: number, height: number): void {
    this.material.uniforms.uResolution!.value.set(width, height);
  }

  /**
   * Set distortion intensity (Phase B effect)
   * Called from debug-gui; wired to uDistortion uniform.
   */
  setDistortion(value: number): void {
    this.material.uniforms.uDistortion!.value = value;
  }

  /**
   * Replace a texture slot with a VideoTexture.
   * Video element is created internally with muted + playsinline + loop.
   */
  addVideoTexture(src: string, index: number): void {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    // Play with promise handling (autoplay policy)
    video.play().catch((err) => {
      console.warn(`Video autoplay blocked for ${src}:`, err);
    });

    if (index >= 0 && index < this.textures.length) {
      this.textures[index] = videoTexture;
    }
  }

  setRGBShift(value: number): void {
    this.material.uniforms.uRGBShift!.value = value;
  }

  setGrain(value: number): void {
    this.material.uniforms.uGrainIntensity!.value = value;
  }

  setTime(time: number): void {
    this.material.uniforms.uTime!.value = time;
  }

  setMouse(x: number, y: number): void {
    this.material.uniforms.uMouse!.value.set(x, y);
  }
}
