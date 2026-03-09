/**
 * Three.js 共通ユーティリティ
 * React Three Fiber を使わずに Three.js を直接操作するためのヘルパー
 */

import * as THREE from 'three'

export interface ThreeSetup {
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  cleanup: () => void
}

/**
 * 2D シェーダー用の基本的な Three.js セットアップ
 * Orthographic camera でフルスクリーン quad を描画
 */
export function setupThreeCanvas(
  canvas: HTMLCanvasElement,
  options?: {
    antialias?: boolean
    alpha?: boolean
    powerPreference?: 'high-performance' | 'low-power' | 'default'
  }
): ThreeSetup {
  const { antialias = true, alpha = true, powerPreference = 'high-performance' } = options || {}

  // Scene
  const scene = new THREE.Scene()

  // Orthographic Camera (2D シェーダー用)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha,
    powerPreference,
  })

  // Canvas サイズをコンテナに合わせる
  const updateSize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 2) // 最大2倍まで

    renderer.setSize(width, height, false)
    renderer.setPixelRatio(dpr)
  }

  updateSize()

  // Cleanup 関数
  const cleanup = () => {
    renderer.dispose()
    scene.clear()
  }

  return {
    canvas,
    scene,
    camera,
    renderer,
    cleanup,
  }
}

/**
 * テクスチャを非同期でロード
 */
export function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (texture) => resolve(texture),
      undefined,
      (error) => reject(error)
    )
  })
}

/**
 * アニメーションループを開始
 * requestAnimationFrame を使用
 */
export function startAnimationLoop(
  callback: (time: number, delta: number) => void
): () => void {
  let rafId: number | null = null
  let lastTime = 0

  const loop = (time: number) => {
    const delta = time - lastTime
    lastTime = time

    callback(time / 1000, delta / 1000) // ミリ秒を秒に変換

    rafId = requestAnimationFrame(loop)
  }

  rafId = requestAnimationFrame(loop)

  // Cleanup 関数を返す
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
  }
}

/**
 * ResizeObserver でキャンバスサイズを監視
 */
export function observeCanvasResize(
  canvas: HTMLCanvasElement,
  callback: (width: number, height: number) => void
): () => void {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      callback(width, height)
    }
  })

  observer.observe(canvas)

  return () => observer.disconnect()
}
