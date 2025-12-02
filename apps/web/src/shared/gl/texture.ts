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
    minFilter?: THREE.TextureFilter;
    magFilter?: THREE.TextureFilter;
  }
): Promise<TextureLoadResult> {
  const loader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.minFilter = options?.minFilter ?? THREE.LinearFilter;
        texture.magFilter = options?.magFilter ?? THREE.LinearFilter;

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
