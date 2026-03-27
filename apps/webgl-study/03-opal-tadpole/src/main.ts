/**
 * 03-opal-tadpole: Scroll-Driven Product Viewer
 *
 * Phase A: Model + HDRI + PBR + Lighting — "make it beautiful"
 */

import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { colors } from "../../shared/theme";
import { loadGLTF } from "../../shared/gltf-loader";
import { setupScrollProgress } from "./utils/scroll-progress";
import { initBlurText } from "./utils/blur-text";
import { getResponsiveConfig } from "./utils/responsive-config";
import { createPostProcessing } from "../../02-atmos/src/utils/post-processing";
import type { PostProcessing } from "../../02-atmos/src/utils/post-processing";
import { Lighting } from "./scene/Lighting";
import { CameraAnimation } from "./scene/CameraAnimation";
import cameraModelUrl from "../../assets/vintage-camera-optimized.glb?url";
import hdriUrl from "../../assets/studio_small_08_1k.hdr?url";

// ---------------------------------------------------------------------------
// Renderer — NeutralToneMapping for accurate product colors
// ---------------------------------------------------------------------------

const canvas = document.getElementById("webgl") as HTMLCanvasElement;
const initialConfig = getResponsiveConfig();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, initialConfig.pixelRatioCap));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// ---------------------------------------------------------------------------
// Scene + Camera
// ---------------------------------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color("#080a0c");

const camera = new THREE.PerspectiveCamera(
  initialConfig.cameraFOV,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.set(3, 2, 4);
camera.lookAt(0, 0, 0);
const cameraAnim = new CameraAnimation(camera);

// ---------------------------------------------------------------------------
// Post-processing (HDR Bloom + FXAA)
// ---------------------------------------------------------------------------

const postProcessing = createPostProcessing(renderer, scene, camera);
// Product viewer: higher bloom threshold than atmos (atmospheric vs subtle metallic highlights)
postProcessing.bloomPass.threshold = 1.2;
postProcessing.bloomPass.strength = 0.25;
postProcessing.bloomPass.radius = 0.4;

// ---------------------------------------------------------------------------
// HDRI Environment Map
// ---------------------------------------------------------------------------

const rgbeLoader = new RGBELoader();
rgbeLoader.load(hdriUrl, (texture) => {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  // Don't set as background — keep dark background
  texture.dispose();
  pmremGenerator.dispose();
});

// ---------------------------------------------------------------------------
// Lighting (3-point studio)
// ---------------------------------------------------------------------------

const lighting = new Lighting(scene, renderer);

// ---------------------------------------------------------------------------
// Scroll Progress
// ---------------------------------------------------------------------------

let currentProgress = 0;

setupScrollProgress({
  trigger: ".scroll-container",
  scrub: 1,
  onUpdate: (progress) => {
    currentProgress = progress;
  },
});

// ---------------------------------------------------------------------------
// Section Visibility
// ---------------------------------------------------------------------------

const sections = document.querySelectorAll<HTMLElement>(".section");

function updateSectionVisibility(progress: number): void {
  const sectionCount = sections.length;
  const activeIndex = Math.min(
    Math.floor(progress * sectionCount),
    sectionCount - 1,
  );

  sections.forEach((section, i) => {
    if (i === activeIndex) {
      section.classList.add("is-active");
    } else {
      section.classList.remove("is-active");
    }
  });
}

// ---------------------------------------------------------------------------
// Product Model (async load)
// ---------------------------------------------------------------------------

const loader = document.getElementById("loader");
let productGroup: THREE.Group | null = null;

loadGLTF(cameraModelUrl, true)
  .then((gltf) => {
    const model = gltf.scene;

    // Auto-center using bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);

    // Scale to fit — normalize to ~2 units
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.0 / maxDim;
    model.scale.setScalar(scale);
    model.position.multiplyScalar(scale);

    // Enable shadows
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Wrapper group for transforms
    productGroup = new THREE.Group();
    productGroup.add(model);
    scene.add(productGroup);

    // Hide loader
    if (loader) {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 800);
    }

    console.log(
      `Model loaded: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}, scale=${scale.toFixed(3)}`
    );
  })
  .catch((err) => {
    console.error("Model load failed:", err);
    if (loader) {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 800);
    }
  });

// ---------------------------------------------------------------------------
// #debug conditional GUI
// ---------------------------------------------------------------------------

if (location.hash === "#debug") {
  import("./utils/debug-gui").then(({ setupDebugGUI }) => {
    setupDebugGUI({
      renderer,
      scene,
      camera,
      lighting,
      postProcessing,
      cameraAnimation: cameraAnim,
    });
  });
}

// ---------------------------------------------------------------------------
// Render Loop
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Hero section: slow rotation
  if (productGroup && currentProgress < 0.2) {
    productGroup.rotation.y += 0.003;
  }

  // Camera animation driven by scroll progress
  cameraAnim.update(currentProgress);

  // Update section visibility for text animations
  updateSectionVisibility(currentProgress);

  // Render through post-processing pipeline
  postProcessing.composer.render();
}

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const config = getResponsiveConfig();
  camera.aspect = w / h;
  camera.fov = config.cameraFOV;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatioCap));
  postProcessing.setSize(w, h);
}

window.addEventListener("resize", onResize);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

animate();
initBlurText();
