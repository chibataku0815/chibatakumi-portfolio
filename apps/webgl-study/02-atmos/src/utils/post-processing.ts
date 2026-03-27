/**
 * post-processing.ts -- EffectComposer + UnrealBloomPass for 02-atmos
 *
 * HDR bloom pipeline: RenderPass → UnrealBloomPass → FXAAPass → OutputPass
 * OutputPass preserves the existing ACES filmic tone mapping.
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export interface PostProcessingParams {
  threshold: number;
  strength: number;
  radius: number;
}

export interface PostProcessing {
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  fxaaPass: ShaderPass;
  params: PostProcessingParams;
  setSize: (width: number, height: number) => void;
  dispose: () => void;
}

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): PostProcessing {
  const size = renderer.getSize(new THREE.Vector2());

  const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
  });

  const composer = new EffectComposer(renderer, renderTarget);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.4,  // strength
    0.6,  // radius
    0.85, // threshold
  );
  composer.addPass(bloomPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.uniforms["resolution"]!.value.set(1 / size.x, 1 / size.y);
  composer.addPass(fxaaPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const params: PostProcessingParams = {
    threshold: 0.85,
    strength: 0.4,
    radius: 0.6,
  };

  return {
    composer,
    bloomPass,
    fxaaPass,
    params,
    setSize(width: number, height: number) {
      composer.setSize(width, height);
      fxaaPass.uniforms["resolution"]!.value.set(1 / width, 1 / height);
    },
    dispose() {
      composer.dispose();
    },
  };
}
