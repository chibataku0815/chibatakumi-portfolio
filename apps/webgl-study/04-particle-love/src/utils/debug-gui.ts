/**
 * Debug GUI for GPGPU particles (lil-gui, #debug hash)
 */

import type * as THREE from "three";
import type { ParticleSystem } from "../scene/ParticleSystem";
import type { PostProcessing } from "../../../02-atmos/src/utils/post-processing";

interface DebugOptions {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  particleSystem: ParticleSystem;
  postProcessing: PostProcessing;
}

export async function setupDebugGUI(options: DebugOptions): Promise<void> {
  const { GUI } = await import("lil-gui");
  const gui = new GUI({ title: "Particle Love #debug" });

  const { particleSystem, camera, postProcessing } = options;
  const params = particleSystem.params;

  // Info
  const info = gui.addFolder("Info");
  info.add({ count: particleSystem.particleCount }, "count").name("Particles").disable();
  info.add({ size: particleSystem.gpgpuSize }, "size").name("Texture Size").disable();

  // Forces
  const forces = gui.addFolder("Forces");
  forces.add(params, "curlStrength", 0, 5, 0.1).name("Curl Strength").onChange(() => particleSystem.syncParams());
  forces.add(params, "curlFrequency", 0.1, 3, 0.05).name("Curl Frequency").onChange(() => particleSystem.syncParams());
  forces.add(params, "damping", 0.8, 1.0, 0.005).name("Damping").onChange(() => particleSystem.syncParams());
  forces.add(params, "speed", 0.1, 10, 0.1).name("Speed").onChange(() => particleSystem.syncParams());
  forces.add(params, "mouseStrength", 0, 3, 0.1).name("Mouse Strength").onChange(() => particleSystem.syncParams());
  forces.add(params, "mouseRadius", 0.5, 5, 0.1).name("Mouse Radius").onChange(() => particleSystem.syncParams());

  // Particles
  const particles = gui.addFolder("Particles");
  particles.add(params, "pointSize", 0.001, 0.1, 0.001).name("Point Size").onChange(() => particleSystem.syncParams());

  // Colors
  const colors = gui.addFolder("Colors");
  colors.addColor({ color: "#" + params.colorA.getHexString() }, "color").name("Color A").onChange((v: string) => {
    params.colorA.set(v);
  });
  colors.addColor({ color: "#" + params.colorB.getHexString() }, "color").name("Color B").onChange((v: string) => {
    params.colorB.set(v);
  });

  // Bloom
  const bloom = gui.addFolder("Bloom");
  bloom.add(postProcessing.bloomPass, "threshold", 0, 1, 0.01).name("Threshold");
  bloom.add(postProcessing.bloomPass, "strength", 0, 3, 0.05).name("Strength");
  bloom.add(postProcessing.bloomPass, "radius", 0, 2, 0.05).name("Radius");

  // Camera
  const cam = gui.addFolder("Camera");
  cam.add(camera.position, "x", -10, 10, 0.1).name("Pos X");
  cam.add(camera.position, "y", -10, 10, 0.1).name("Pos Y");
  cam.add(camera.position, "z", 1, 20, 0.1).name("Pos Z");
  cam.close();
}
