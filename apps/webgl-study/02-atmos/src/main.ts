/**
 * @fileoverview 02-atmos: スクロール駆動3Dフライトシーン
 *
 * ## Phase B: CameraPath + ScrollTrigger + AirplaneModel + CloudField
 *
 * - CameraPath: CatmullRomCurve3 でスクロールに連動したカメラ移動
 * - Environment: theme.ts の Radix-inspired colors で5セクション補間
 * - AirplaneModel: glTF 飛行機がカメラ前方を追従
 * - CloudField: InstancedMesh 雲クラスター
 * - debug-gui: #debug 条件で dynamic import（本番バンドルサイズ 0）
 *
 * @see apps/webgl-study/shared/theme.ts — Radix テーマシステム
 */

import * as THREE from "three";
import { colors } from "../../shared/theme";
import { CameraPath } from "./scene/CameraPath";
import { Environment } from "./scene/Environment";
import { CloudField } from "./scene/CloudField";
import { setupScrollProgress } from "./utils/scroll-progress";
import { initBlurText } from "./utils/blur-text";
import { getResponsiveConfig } from "./utils/responsive-config";
import { createPostProcessing } from "./utils/post-processing";
import type { PostProcessing } from "./utils/post-processing";
import type { AirplaneModel } from "./scene/AirplaneModel";

// ---------------------------------------------------------------------------
// Renderer + Camera
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  initialConfig.cameraFOV,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

// Post-processing (HDR bloom)
const postProcessing = createPostProcessing(renderer, scene, camera);
const postProcessingRef: { current: PostProcessing | null } = { current: postProcessing };

// ---------------------------------------------------------------------------
// Camera Path + Environment (theme.ts colors)
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();
const cameraPath = new CameraPath();
const environment = new Environment(scene);

// デバッグ: カメラパスの可視化
const debugPathMesh = cameraPath.createDebugMesh();
scene.add(debugPathMesh);

// 制御点をシーンに球体で可視化
const controlPointMeshes: THREE.Mesh[] = [];
const cpGeometry = new THREE.SphereGeometry(0.2, 8, 8);
// theme: amber[9] for accent visibility
const cpMaterial = new THREE.MeshBasicMaterial({
  color: colors.amber[9].getHex(),
});

for (const point of cameraPath.points) {
  const mesh = new THREE.Mesh(cpGeometry, cpMaterial);
  mesh.position.copy(point);
  scene.add(mesh);
  controlPointMeshes.push(mesh);
}

// グリッドヘルパー（theme: neutral[3] / neutral[2]）
const gridHelper = new THREE.GridHelper(
  100,
  50,
  colors.neutral[3].getHex(),
  colors.neutral[2].getHex(),
);
scene.add(gridHelper);

// ---------------------------------------------------------------------------
// Scroll Progress
// ---------------------------------------------------------------------------

let currentProgress = 0;

setupScrollProgress({
  trigger: ".scroll-container",
  scrub: 1.5,
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
// Debug mesh defaults (hidden until #debug GUI toggle)
// ---------------------------------------------------------------------------

debugPathMesh.visible = false;
controlPointMeshes.forEach((m) => (m.visible = false));
gridHelper.visible = false;

// ---------------------------------------------------------------------------
// Phase B: CloudField (sync) + AirplaneModel (async)
// ---------------------------------------------------------------------------

const cloudField = new CloudField(scene, cameraPath, {
  maxInstances: initialConfig.cloudMaxInstances,
  clusterCount: initialConfig.cloudClusterCount,
});

// Refs for debug-gui bridge
const progressRef = { value: 0 };
const fogDensityRef = { value: 0 };
const hemiIntensityRef = { value: 0 };
const dirIntensityRef = { value: 0 };
const rimIntensityRef = { value: 0 };
const cssGlowOpacityRef = { value: 0 };
const cssCaOffsetRef = { value: 0 };
const envCloudOpacityRef = { value: 0 };
const bloomThresholdRef = { value: 0 };
const bloomStrengthRef = { value: 0 };
const bloomRadiusRef = { value: 0 };
const airplaneRef: { current: AirplaneModel | null } = { current: null };
const cloudFieldRef: { current: CloudField | null } = { current: cloudField };

// Async airplane loading (non-blocking — scene renders immediately)
const loader = document.getElementById("loader");

import("./scene/AirplaneModel")
  .then(async ({ AirplaneModel: AirplaneModelClass }) => {
    const airplane = await AirplaneModelClass.create(scene);
    airplaneRef.current = airplane;
    if (loader) {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 800);
    }
  })
  .catch(() => {
    // Graceful degradation — scene works without airplane
    if (loader) {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 800);
    }
  });

// ---------------------------------------------------------------------------
// #debug conditional GUI (dynamic import — zero bytes in production)
// ---------------------------------------------------------------------------

if (location.hash === "#debug") {
  import("./utils/debug-gui").then(({ setupDebugGUI }) => {
    setupDebugGUI({
      cameraPath,
      environment,
      debugPathMesh,
      controlPointMeshes,
      gridHelper,
      progressRef,
      fogDensityRef,
      airplaneRef,
      cloudFieldRef,
      postProcessingRef,
      hemiIntensityRef,
      dirIntensityRef,
      rimIntensityRef,
      cssGlowOpacityRef,
      cssCaOffsetRef,
      envCloudOpacityRef,
      bloomThresholdRef,
      bloomStrengthRef,
      bloomRadiusRef,
    });
  });
}

// ---------------------------------------------------------------------------
// Render Loop
// ---------------------------------------------------------------------------

function animate(): void {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  cameraPath.applyToCamera(camera, currentProgress);
  environment.update(currentProgress);
  updateSectionVisibility(currentProgress);

  // Phase B updates
  airplaneRef.current?.update(currentProgress, cameraPath, elapsed);
  cloudField.update(currentProgress, environment.cloudParams.opacity);

  // Debug refs (cheap even when GUI absent)
  progressRef.value = currentProgress;
  fogDensityRef.value = environment.fog.density;
  hemiIntensityRef.value = environment.hemisphereLight.intensity;
  dirIntensityRef.value = environment.directionalLight.intensity;
  rimIntensityRef.value = environment.rimLight.intensity;
  envCloudOpacityRef.value = environment.cloudParams.opacity;

  // Section-specific bloom parameters
  const bp = environment.bloomParams;
  postProcessing.bloomPass.threshold = bp.threshold;
  postProcessing.bloomPass.strength = bp.strength;
  postProcessing.bloomPass.radius = bp.radius;

  bloomThresholdRef.value = bp.threshold;
  bloomStrengthRef.value = bp.strength;
  bloomRadiusRef.value = bp.radius;

  // CSS prop refs (parse from style for monitor accuracy)
  const rootStyle = document.documentElement.style;
  cssGlowOpacityRef.value = parseFloat(rootStyle.getPropertyValue('--atmos-glow-opacity')) || 0;
  cssCaOffsetRef.value = parseFloat(rootStyle.getPropertyValue('--atmos-ca-offset')) || 0;

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
