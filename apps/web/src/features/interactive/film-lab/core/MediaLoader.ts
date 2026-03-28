/**
 * MediaLoader — File-to-Texture converter for Film Lab
 *
 * iPhone Safari 向け: HEIC の早期拒否、GPU maxTextureSize 超過時の Canvas 縮小、
 * 呼び出し側で表示できるよう MediaLoadError を投げる。
 */

import * as THREE from "three";

export interface LoadResult {
  texture: THREE.Texture;
  width: number;
  height: number;
  type: "image" | "video";
}

/** ブラウザがデコードできない形式・サイズなど（UI メッセージ用 code 付き） */
export class MediaLoadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "HEIC_UNSUPPORTED"
      | "IMAGE_DECODE_FAILED"
      | "VIDEO_DECODE_FAILED"
      | "UNKNOWN",
  ) {
    super(message);
    this.name = "MediaLoadError";
  }
}

export interface LoadFileOptions {
  /** WebGL の gl.MAX_TEXTURE_SIZE。未指定時は縮小しない */
  maxTextureSize?: number;
}

const HEIC_MIME = /heic|heif/i;

/**
 * iPhone の写真（HEIC/HEIF）かどうか。MIME が空のときは拡張子で推定する。
 */
export function isLikelyHeicFile(file: File): boolean {
  if (file.type && HEIC_MIME.test(file.type)) return true;
  return /\.(heic|heif)$/i.test(file.name);
}

/**
 * 長辺が maxDim を超える画像を Canvas に縮小する（WebGL テクスチャ上限対策）。
 * 縮小不要なら元の Image をそのまま返す。
 */
function scaleImageToMaxDimension(
  img: HTMLImageElement,
  maxDim: number,
): HTMLImageElement | HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return img;

  const longEdge = Math.max(w, h);
  if (longEdge <= maxDim) return img;

  const scale = maxDim / longEdge;
  const nw = Math.max(1, Math.floor(w * scale));
  const nh = Math.max(1, Math.floor(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img;

  ctx.drawImage(img, 0, 0, nw, nh);
  return canvas;
}

export class MediaLoader {
  async loadFile(file: File, options: LoadFileOptions = {}): Promise<LoadResult> {
    if (isLikelyHeicFile(file)) {
      throw new MediaLoadError(
        "HEIC/HEIF is not supported in the browser. Export as JPEG in Photos, then try again.",
        "HEIC_UNSUPPORTED",
      );
    }

    if (file.type.startsWith("video/")) {
      return this.loadVideo(file);
    }
    return this.loadImage(file, options.maxTextureSize);
  }

  private async loadImage(file: File, maxTextureSize?: number): Promise<LoadResult> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      const cleanupUrl = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      };

      img.onload = () => {
        try {
          const source = maxTextureSize
            ? scaleImageToMaxDimension(img, maxTextureSize)
            : img;

          const texture = new THREE.Texture(source as HTMLImageElement | HTMLCanvasElement);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;

          const width =
            source instanceof HTMLCanvasElement ? source.width : img.naturalWidth;
          const height =
            source instanceof HTMLCanvasElement ? source.height : img.naturalHeight;

          cleanupUrl();
          resolve({
            texture,
            width,
            height,
            type: "image",
          });
        } catch (err) {
          cleanupUrl();
          const message = err instanceof Error ? err.message : String(err);
          reject(
            new MediaLoadError(
              `Could not build texture from image (${message}). Try JPEG or PNG.`,
              "IMAGE_DECODE_FAILED",
            ),
          );
        }
      };

      img.onerror = () => {
        cleanupUrl();
        reject(
          new MediaLoadError(
            "Could not decode this image. Try JPEG, PNG, or WebP.",
            "IMAGE_DECODE_FAILED",
          ),
        );
      };

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
          console.warn("MediaLoader.loadVideo: autoplay blocked", err);
        });

        resolve({
          texture,
          width: video.videoWidth,
          height: video.videoHeight,
          type: "video",
        });
      };

      video.onerror = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
        reject(
          new MediaLoadError(
            "Could not open this video. Try MP4 (H.264).",
            "VIDEO_DECODE_FAILED",
          ),
        );
      };
    });
  }

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
        (err) => {
          reject(
            err instanceof Error
              ? new MediaLoadError(err.message, "IMAGE_DECODE_FAILED")
              : new MediaLoadError(String(err), "UNKNOWN"),
          );
        },
      );
    });
  }
}
