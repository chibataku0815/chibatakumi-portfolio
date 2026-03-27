/**
 * Film Lab — WebGL Color Grading Tool
 *
 * Phase A: Core Effect Engine
 * - Drag & drop image/video
 * - Realtime shader effects (Exposure, Contrast, Saturation, Temperature, RGB Shift, Grain, Vignette)
 * - Before/After split view
 */

import * as THREE from "three";
import { Viewport } from "./scene/Viewport";
import { MediaLoader } from "./scene/MediaLoader";
import { parseCube } from "./utils/cube-parser";

// --- Renderer ---
const canvas = document.getElementById("webgl") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- Scene + OrthographicCamera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// --- Viewport ---
const viewport = new Viewport({ renderer });
scene.add(viewport.mesh);

// --- MediaLoader ---
const mediaLoader = new MediaLoader();

// --- Load default image ---
// public/images/img1.jpg がある場合はデフォルト表示
mediaLoader.loadURL("/images/img1.jpg").then((result) => {
  viewport.setTexture(result.texture);
  viewport.setImageResolution(result.width, result.height);
  hideDropOverlay();
}).catch(() => {
  // デフォルト画像がなければドロップオーバーレイのまま
});

// --- Drag & Drop ---
const dropOverlay = document.getElementById("drop-overlay") as HTMLDivElement;

// ドロップオーバーレイのクリックでファイル選択ダイアログ
dropOverlay.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,video/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) await handleFile(file);
  };
  input.click();
});

// ドラッグ&ドロップイベント
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropOverlay.classList.add("active");
});

document.addEventListener("dragleave", (e) => {
  // body を離れた時のみ非表示
  if (e.relatedTarget === null) {
    dropOverlay.classList.remove("active");
  }
});

document.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropOverlay.classList.remove("active");
  const file = e.dataTransfer?.files[0];
  if (file) await handleFile(file);
});

async function handleFile(file: File): Promise<void> {
  try {
    // .cube ファイルの場合は LUT として処理
    if (file.name.endsWith(".cube")) {
      const text = await file.text();
      const lut = parseCube(text);
      viewport.setLUT(lut.data, lut.size);
      console.log(
        `LUT loaded: ${lut.title || file.name} (${lut.size}x${lut.size}x${lut.size})`,
      );
      return;
    }

    // 画像/動画は既存のロジック
    const result = await mediaLoader.loadFile(file);
    viewport.setTexture(result.texture);
    viewport.setImageResolution(result.width, result.height);
    hideDropOverlay();
    showSplitHandle();
  } catch (err) {
    console.error("Failed to load file:", err);
  }
}

function hideDropOverlay(): void {
  dropOverlay.classList.remove("initial");
  dropOverlay.classList.remove("active");
}

function showSplitHandle(): void {
  const handle = document.getElementById("split-handle") as HTMLDivElement;
  handle.style.display = "block";
  handle.style.left = `${window.innerWidth * 0.5}px`;

  // ドラッグで Before/After 分割位置を変更
  let isDragging = false;

  handle.addEventListener("mousedown", () => { isDragging = true; });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const x = e.clientX / window.innerWidth;
    viewport.setSplitPosition(Math.max(0, Math.min(1, x)));
    handle.style.left = `${e.clientX}px`;
  });
  window.addEventListener("mouseup", () => { isDragging = false; });
}

// --- Debug GUI ---
if (location.hash === "#debug") {
  import("./utils/debug-gui").then(({ setupDebugGUI }) => {
    setupDebugGUI({ viewport });
  });
}

// --- Render Loop ---
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  viewport.setTime(clock.getElapsedTime());
  renderer.render(scene, camera);
}

// --- Resize ---
function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewport.setResolution(w, h);
}
window.addEventListener("resize", onResize);

animate();
