/**
 * Texture Loading Utilities
 */

import * as THREE from "three";

export interface TextureLoadResult {
  texture: THREE.Texture;
  width: number;
  height: number;
}

/**
 * テクスチャをロードし、結果をPromiseで返す
 */
export function loadTexture(
  path: string,
  options?: {
    minFilter?: THREE.MinificationTextureFilter;
    magFilter?: THREE.MagnificationTextureFilter;
  }
): Promise<TextureLoadResult> {
  const loader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.minFilter =
          options?.minFilter ??
          (THREE.LinearFilter as THREE.MinificationTextureFilter);
        texture.magFilter =
          options?.magFilter ??
          (THREE.LinearFilter as THREE.MagnificationTextureFilter);

        resolve({
          texture,
          width: texture.image.width,
          height: texture.image.height,
        });
      },
      undefined,
      (err) => reject(err)
    );
  });
}
