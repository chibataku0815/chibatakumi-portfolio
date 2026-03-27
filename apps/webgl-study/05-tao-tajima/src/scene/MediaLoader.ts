/**
 * MediaLoader — File-to-Texture converter for Film Lab
 *
 * Responsibilities:
 * - Load image files → THREE.Texture (via ImageBitmap)
 * - Load video files → THREE.VideoTexture (muted + playsinline + loop)
 * - Load URL → THREE.Texture (for default/initial display)
 * - Proper memory management (revokeObjectURL)
 * - SRGBColorSpace for correct color rendering
 */

import * as THREE from "three";

export interface LoadResult {
  texture: THREE.Texture;
  width: number;
  height: number;
  type: "image" | "video";
}

export class MediaLoader {
  /**
   * File オブジェクトからテクスチャを生成
   * 画像: Image → THREE.Texture
   * 動画: HTMLVideoElement → THREE.VideoTexture (muted + playsinline + loop)
   */
  async loadFile(file: File): Promise<LoadResult> {
    if (file.type.startsWith("video/")) {
      return this.loadVideo(file);
    }
    return this.loadImage(file);
  }

  private async loadImage(file: File): Promise<LoadResult> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        URL.revokeObjectURL(url);
        resolve({
          texture,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: "image",
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private async loadVideo(file: File): Promise<LoadResult> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      video.onloadedmetadata = () => {
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        video.play().catch((err) => {
          console.warn("Video autoplay blocked:", err);
        });

        resolve({
          texture,
          width: video.videoWidth,
          height: video.videoHeight,
          type: "video",
        });
      };
      video.onerror = reject;
    });
  }

  /**
   * URL からデフォルト画像をロード（初期表示用）
   */
  async loadURL(url: string): Promise<LoadResult> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          resolve({
            texture,
            width: texture.image.width as number,
            height: texture.image.height as number,
            type: "image",
          });
        },
        undefined,
        reject,
      );
    });
  }
}
