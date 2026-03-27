/**
 * Debug GUI for product viewer — dynamic import, zero bytes in production.
 * Access via: URL#debug
 */

import type * as THREE from "three";
import type { Lighting } from "../scene/Lighting";
import type { PostProcessing } from "../../../02-atmos/src/utils/post-processing";
import type { CameraAnimation } from "../scene/CameraAnimation";

interface DebugGUIOptions {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  lighting: Lighting;
  postProcessing: PostProcessing;
  cameraAnimation?: CameraAnimation;
}

export async function setupDebugGUI(options: DebugGUIOptions): Promise<void> {
  const { default: GUI } = await import("lil-gui");
  const gui = new GUI({ title: "Product Viewer Debug" });

  const { renderer, camera, lighting, postProcessing } = options;

  // --- Renderer ---
  const rendererFolder = gui.addFolder("Renderer");
  rendererFolder
    .add(renderer, "toneMappingExposure", 0.1, 3.0, 0.05)
    .name("Exposure");
  rendererFolder.close();

  // --- Camera ---
  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "x", -10, 10, 0.1).name("Pos X");
  cameraFolder.add(camera.position, "y", -10, 10, 0.1).name("Pos Y");
  cameraFolder.add(camera.position, "z", -10, 10, 0.1).name("Pos Z");
  cameraFolder
    .add(camera, "fov", 15, 75, 1)
    .name("FOV")
    .onChange(() => camera.updateProjectionMatrix());
  cameraFolder.close();

  // --- Camera Animation ---
  if (options.cameraAnimation) {
    const camAnimFolder = gui.addFolder("Camera Animation");

    const animState = {
      timelineProgress: 0,
      overrideScroll: false,
    };

    camAnimFolder.add(animState, "overrideScroll").name("Override Scroll");
    camAnimFolder
      .add(animState, "timelineProgress", 0, 1, 0.001)
      .name("Timeline Progress")
      .onChange((v: number) => {
        if (animState.overrideScroll) {
          options.cameraAnimation!.update(v);
        }
      });

    // Expose keyframe info as read-only reference
    const keyframes = options.cameraAnimation.getKeyframes();
    const kfFolder = camAnimFolder.addFolder("Keyframes (read-only)");
    keyframes.forEach((kf, i) => {
      const shotFolder = kfFolder.addFolder(`Shot ${i + 1}: ${kf.id}`);
      shotFolder.add(kf.position, "x").name("pos.x").disable();
      shotFolder.add(kf.position, "y").name("pos.y").disable();
      shotFolder.add(kf.position, "z").name("pos.z").disable();
      shotFolder.add(kf.lookAt, "x").name("lookAt.x").disable();
      shotFolder.add(kf.lookAt, "y").name("lookAt.y").disable();
      shotFolder.add(kf.lookAt, "z").name("lookAt.z").disable();
      if (kf.fov !== undefined) {
        shotFolder.add({ fov: kf.fov }, "fov").disable();
      }
      shotFolder.close();
    });
  }

  // --- Key Light ---
  const keyFolder = gui.addFolder("Key Light");
  keyFolder
    .add(lighting.keyLight, "intensity", 0, 30, 0.5)
    .name("Intensity");
  keyFolder
    .add(lighting.params, "keyPenumbra", 0, 1, 0.05)
    .name("Penumbra")
    .onChange((v: number) => {
      lighting.keyLight.penumbra = v;
    });
  keyFolder.add(lighting.keyLight.position, "x", -10, 10, 0.1).name("X");
  keyFolder.add(lighting.keyLight.position, "y", -10, 10, 0.1).name("Y");
  keyFolder.add(lighting.keyLight.position, "z", -10, 10, 0.1).name("Z");
  keyFolder.close();

  // --- Fill Light ---
  const fillFolder = gui.addFolder("Fill Light");
  fillFolder
    .add(lighting.fillLight, "intensity", 0, 10, 0.1)
    .name("Intensity");
  fillFolder
    .add(lighting.fillLight, "width", 0.5, 10, 0.5)
    .name("Width");
  fillFolder
    .add(lighting.fillLight, "height", 0.5, 10, 0.5)
    .name("Height");
  fillFolder.close();

  // --- Rim Light ---
  const rimFolder = gui.addFolder("Rim Light");
  rimFolder
    .add(lighting.rimLight, "intensity", 0, 30, 0.5)
    .name("Intensity");
  rimFolder.add(lighting.rimLight.position, "x", -10, 10, 0.1).name("X");
  rimFolder.add(lighting.rimLight.position, "y", -10, 10, 0.1).name("Y");
  rimFolder.add(lighting.rimLight.position, "z", -10, 10, 0.1).name("Z");
  rimFolder.close();

  // --- Shadow ---
  const shadowFolder = gui.addFolder("Shadow");
  const shadowMat = lighting.shadowPlane.material as THREE.ShadowMaterial;
  shadowFolder
    .add(shadowMat, "opacity", 0, 1, 0.05)
    .name("Opacity");
  shadowFolder
    .add(lighting.shadowPlane.position, "y", -3, 0, 0.05)
    .name("Ground Y");
  shadowFolder.close();

  // --- Bloom ---
  const bloomFolder = gui.addFolder("Bloom");
  bloomFolder
    .add(postProcessing.bloomPass, "threshold", 0, 2, 0.05)
    .name("Threshold");
  bloomFolder
    .add(postProcessing.bloomPass, "strength", 0, 2, 0.05)
    .name("Strength");
  bloomFolder
    .add(postProcessing.bloomPass, "radius", 0, 1, 0.05)
    .name("Radius");
  bloomFolder.close();
}
