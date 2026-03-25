/**
 * @fileoverview 02-atmos: スクロール駆動3Dフライトシーン
 *
 * ## Phase A+B 統合: CameraPath + ScrollTrigger + theme.ts
 *
 * - CameraPath: CatmullRomCurve3 でスクロールに連動したカメラ移動
 * - Environment: theme.ts の Radix-inspired colors で5セクション補間
 * - lil-gui: 制御点・パラメータのリアルタイム調整
 *
 * @see apps/webgl-study/shared/theme.ts — Radix テーマシステム
 */

import * as THREE from "three";
import GUI from "lil-gui";
import { colors } from "../../shared/theme";
import { CameraPath } from "./scene/CameraPath";
import { Environment } from "./scene/Environment";
import { setupScrollProgress } from "./utils/scroll-progress";

// ---------------------------------------------------------------------------
// Renderer + Camera
// ---------------------------------------------------------------------------

const canvas = document.getElementById("webgl") as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

// ---------------------------------------------------------------------------
// Camera Path + Environment (theme.ts colors)
// ---------------------------------------------------------------------------

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
// lil-gui
// ---------------------------------------------------------------------------

const gui = new GUI({ title: "Atmos Debug" });

const debugParams = {
  progress: 0,
  showPath: true,
  showGrid: true,
};

const progressFolder = gui.addFolder("Progress");
progressFolder.add(debugParams, "progress", 0, 1, 0.001).listen().disable();

const viewFolder = gui.addFolder("View");
viewFolder.add(debugParams, "showPath").onChange((v: boolean) => {
  debugPathMesh.visible = v;
  controlPointMeshes.forEach((m) => (m.visible = v));
});
viewFolder.add(debugParams, "showGrid").onChange((v: boolean) => {
  gridHelper.visible = v;
});

const cpFolder = gui.addFolder("Control Points");
cameraPath.points.forEach((point, i) => {
  const folder = cpFolder.addFolder(`P${i}`);
  folder.add(point, "x", -20, 20, 0.5).onChange(() => {
    cameraPath.rebuild();
    controlPointMeshes[i]!.position.copy(point);
  });
  folder.add(point, "y", -5, 30, 0.5).onChange(() => {
    cameraPath.rebuild();
    controlPointMeshes[i]!.position.copy(point);
  });
  folder.add(point, "z", -120, 10, 1).onChange(() => {
    cameraPath.rebuild();
    controlPointMeshes[i]!.position.copy(point);
  });
  folder.close();
});
cpFolder.close();

const fogFolder = gui.addFolder("Fog (auto)");
const fogParams = { density: 0.04 };
fogFolder.add(fogParams, "density", 0, 0.1, 0.001).listen().disable();
fogFolder.close();

// ---------------------------------------------------------------------------
// Render Loop
// ---------------------------------------------------------------------------

function animate(): void {
  requestAnimationFrame(animate);

  cameraPath.applyToCamera(camera, currentProgress);
  environment.update(currentProgress);
  updateSectionVisibility(currentProgress);

  debugParams.progress = currentProgress;
  fogParams.density = environment.fog.density;

  renderer.render(scene, camera);
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
}

window.addEventListener("resize", onResize);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const loader = document.getElementById("loader");
if (loader) {
  loader.classList.add("is-hidden");
  setTimeout(() => loader.remove(), 800);
}

animate();
