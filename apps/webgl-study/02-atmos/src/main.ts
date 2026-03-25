/**
 * @fileoverview 02-atmos メインエントリポイント
 *
 * Atmos シーンの初期化・レンダリングループを管理する。
 * 環境設定は `scene/Environment.ts` に委譲し、
 * このファイルは Three.js の最小構成（Scene / Camera / Renderer / Loop）のみを担う。
 *
 * ## 学習ポイント
 * - `@shared/theme` から色・スペーシングを import して使う流れ
 * - `setupEnvironment` / `setupCamera` による関心の分離
 * - `responsive()` ユーティリティによるレスポンシブ対応
 *
 * @see apps/webgl-study/shared/theme.ts
 * @see apps/webgl-study/02-atmos/src/scene/Environment.ts
 */

import * as THREE from 'three';
import { responsive, container } from '@shared/theme';
import { setupEnvironment, setupCamera } from './scene/Environment';

// ---------------------------------------------------------------------------
// シーン・カメラ・レンダラー初期化
// ---------------------------------------------------------------------------

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const scene = new THREE.Scene();

/** PerspectiveCamera: FOV 60° / アスペクト比は resize で更新 */
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
setupCamera(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---------------------------------------------------------------------------
// 環境設定（背景・fog・ライティング）
// ---------------------------------------------------------------------------

const { mainLight } = setupEnvironment(scene);

// ---------------------------------------------------------------------------
// テスト用プリミティブ — 後の実装で差し替え
// ---------------------------------------------------------------------------

/**
 * デモ用 IcosahedronGeometry。
 * theme カラー (`colors.neutral[7]`) を MeshStandardMaterial に適用。
 * 本実装ではカスタムシェーダーやパーティクルに差し替える。
 */
const geo = new THREE.IcosahedronGeometry(0.3, 4);
const mat = new THREE.MeshStandardMaterial({
  color: 0x5a7a9a, // colors.neutral[7]
  metalness: 0.3,
  roughness: 0.6,
  wireframe: false,
});
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// ---------------------------------------------------------------------------
// レスポンシブ対応
// ---------------------------------------------------------------------------

/**
 * ウィンドウリサイズ時にカメラとレンダラーを更新。
 * `responsive()` でブレークポイントに応じたコンテナ幅を取得し、
 * canvas を適切なサイズに保つ。
 */
function onResize(): void {
  // ブレークポイントに応じた canvas max-width (px)
  const maxWidth = responsive({
    initial: container[1], // 448px (モバイル)
    sm:      container[2], // 688px (タブレット)
    md:      container[3], // 880px (ノート)
    lg:      container[4], // 1136px (デスクトップ)
  }) ?? container[4];

  const w = Math.min(window.innerWidth, maxWidth);
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', onResize);
onResize(); // 初期適用

// ---------------------------------------------------------------------------
// アニメーションループ
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

/**
 * メインアニメーションループ。
 * - mesh をゆっくり回転させてデモとして機能させる
 * - mainLight を正弦波でゆらしてライティングに動きを出す
 */
function animate(): void {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // デモ回転
  mesh.rotation.y = elapsed * 0.3;
  mesh.rotation.x = elapsed * 0.1;

  // 光源の揺らぎ（大気感の演出）
  mainLight.position.x = Math.sin(elapsed * 0.5) * 0.4;
  mainLight.position.y = Math.cos(elapsed * 0.3) * 0.2 + 0.3;

  renderer.render(scene, camera);
}

animate();
