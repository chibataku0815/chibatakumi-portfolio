/**
 * 04-particle-love: GPGPU Particle System
 *
 * Phase B: Curl Noise physics + Mouse interaction + Bloom + Color design
 */

import * as THREE from "three";
import { ParticleSystem } from "./scene/ParticleSystem";
import { createPostProcessing } from "../../02-atmos/src/utils/post-processing";
import type { PostProcessing } from "../../02-atmos/src/utils/post-processing";

// ---------------------------------------------------------------------------
// Responsive config
// ---------------------------------------------------------------------------

function getGpgpuSize(): number {
  return window.innerWidth < 768 ? 128 : 256;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const canvas = document.getElementById("webgl") as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---------------------------------------------------------------------------
// Scene + Camera
// ---------------------------------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// ---------------------------------------------------------------------------
// Post-processing (Bloom + FXAA)
// ---------------------------------------------------------------------------

const postProcessing = createPostProcessing(renderer, scene, camera);
postProcessing.bloomPass.threshold = 0.3;
postProcessing.bloomPass.strength = 0.8;
postProcessing.bloomPass.radius = 0.4;

// ---------------------------------------------------------------------------
// Particle System
// ---------------------------------------------------------------------------

const particleSystem = new ParticleSystem({
  gpgpuSize: getGpgpuSize(),
  renderer,
});

scene.add(particleSystem.points);

console.log(
  `Particle Love: ${particleSystem.particleCount} particles (${particleSystem.gpgpuSize}x${particleSystem.gpgpuSize})`,
);

// ---------------------------------------------------------------------------
// Mouse Interaction
// ---------------------------------------------------------------------------

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouseWorld = new THREE.Vector3(9999, 9999, 9999);

function onMouseMove(event: MouseEvent): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const ray = raycaster.ray;
  ray.intersectPlane(mousePlane, mouseWorld);
  particleSystem.setMousePosition(mouseWorld);
}

function onTouchMove(event: TouchEvent): void {
  if (event.touches.length === 0) return;
  const touch = event.touches[0];
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(mousePlane, mouseWorld);
  particleSystem.setMousePosition(mouseWorld);
}

function onMouseLeave(): void {
  mouseWorld.set(9999, 9999, 9999);
  particleSystem.setMousePosition(mouseWorld);
}

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("touchmove", onTouchMove, { passive: true });
window.addEventListener("mouseleave", onMouseLeave);

// ---------------------------------------------------------------------------
// #debug conditional GUI
// ---------------------------------------------------------------------------

if (location.hash === "#debug") {
  import("./utils/debug-gui").then(({ setupDebugGUI }) => {
    setupDebugGUI({ renderer, scene, camera, particleSystem, postProcessing });
  });
}

// ---------------------------------------------------------------------------
// Render Loop
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  particleSystem.update(elapsed, deltaTime);

  postProcessing.composer.render();
}

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  particleSystem.setSize(w, h);
  postProcessing.setSize(w, h);
}

window.addEventListener("resize", onResize);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

animate();
