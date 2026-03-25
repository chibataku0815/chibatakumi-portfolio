/**
 * @module DistortionScene
 *
 * R3F Canvas のセットアップと DistortionCard の配置を担当するコンポーネント。
 * WebGL コンテキストの初期化、カメラ設定、ローディング状態の管理を行う。
 *
 * ## Canvas コンポーネントの役割
 *
 * R3F の `<Canvas>` は以下を自動で行う:
 * - WebGLRenderer の生成と DOM へのマウント
 * - Scene, Camera の自動構築
 * - requestAnimationFrame ループの開始
 * - リサイズイベントのハンドリング
 * - React の reconciler を Three.js 用に差し替え
 *
 * Vanilla Three.js では手動で書く初期化コードが、Canvas 1つで完結する。
 *
 * ## Suspense と R3F の連携
 *
 * R3F のテクスチャローダー（useTexture）や GLTFLoader は内部で
 * React Suspense プロトコルを使う。テクスチャ読み込み中は Promise を throw し、
 * 最も近い `<Suspense>` の fallback が表示される。
 *
 * ```
 * <Suspense fallback={<LoadingSpinner />}>
 *   <DistortionCard ... />  ← useTexture が完了するまで Suspense が catch
 * </Suspense>
 * ```
 *
 * Canvas の外に `<Suspense>` を置いても R3F 内の Suspense は catch できないので、
 * 必ず Canvas の内側に配置する必要がある。
 */
"use client";

import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { DistortionCard } from "./DistortionCard";

/** 画像ペアの定義。a がデフォルト表示、b がホバー時の表示 */
const IMAGE_PAIRS = [
  { a: "/interactive/pair1-a.jpg", b: "/interactive/pair1-b.jpg" },
  { a: "/interactive/pair2-a.jpg", b: "/interactive/pair2-b.jpg" },
  { a: "/interactive/pair3-a.jpg", b: "/interactive/pair3-b.jpg" },
];

/** カードのアスペクト比（元画像 1200x840 に合わせる） */
const CARD_ASPECT = 1200 / 840;
/** カードの高さ（Three.js ワールド単位）。カメラ distance=3, fov=45 で見切れない値 */
const CARD_HEIGHT = 1.2;
/** アスペクト比から算出したカード幅 */
const CARD_WIDTH = CARD_HEIGHT * CARD_ASPECT;
/** カード間の余白（ワールド単位） */
const GAP = 0.15;

/**
 * 3D シーン内部のレイアウトコンポーネント。
 *
 * 複数の DistortionCard を横一列に中央揃えで配置する。
 * 全体幅を算出し、中央が原点に来るよう startX をオフセットする。
 *
 * @remarks
 * このコンポーネントは Canvas の内側でのみ使用される。
 * Canvas 外で使うと R3F の hooks（useFrame 等）がコンテキストを見つけられずエラーになる。
 */
function Scene() {
  const totalWidth = IMAGE_PAIRS.length * CARD_WIDTH + (IMAGE_PAIRS.length - 1) * GAP;
  const startX = -totalWidth / 2 + CARD_WIDTH / 2;

  return (
    <>
      {IMAGE_PAIRS.map((pair, i) => (
        <DistortionCard
          key={i}
          imageA={pair.a}
          imageB={pair.b}
          position={[startX + i * (CARD_WIDTH + GAP), 0, 0]}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
        />
      ))}
    </>
  );
}

/**
 * DistortionScene — WebGL Canvas と UI フォールバックを含むラッパー。
 *
 * WebGL の初期化完了（onCreated）を検知し、フェードインで Canvas を表示する。
 * 初期化中はスピナーを表示して、Canvas の黒画面が一瞬見えることを防ぐ。
 *
 * @example
 * ```tsx
 * // Next.js ページ内での使用（dynamic import 経由を推奨）
 * import { DistortionScene } from "./DistortionScene";
 * <DistortionScene />
 * ```
 *
 * @remarks
 * ## Canvas props の解説
 *
 * ### gl（WebGLRenderer オプション）
 * ```ts
 * gl={{
 *   antialias: true,        // エッジのジャギーを軽減
 *   alpha: true,            // 背景を透明にする（CSS 背景が透けるようになる）
 *   powerPreference: "default",  // GPU の電力設定
 *   // "high-performance" にすると dGPU が選ばれるが、バッテリー消費が増える
 *   // ポートフォリオ閲覧のデモなので "default" で十分
 * }}
 * ```
 *
 * ### dpr（Device Pixel Ratio）
 * ```ts
 * dpr={[1, 1.5]}  // 最小 1x、最大 1.5x にクランプ
 * ```
 * Retina ディスプレイ（dpr=2-3）でネイティブ解像度を使うと
 * GPU 負荷が 4-9 倍になる。1.5x で十分な品質を維持しつつ負荷を抑える。
 * 範囲指定 `[min, max]` により、低スペック端末では 1x、高スペックでは 1.5x になる。
 *
 * ### camera
 * ```ts
 * camera={{ position: [0, 0, 3], fov: 45 }}
 * ```
 * - `position: [0, 0, 3]` — カメラを Z 方向に 3 ユニット後退
 * - `fov: 45` — 視野角 45 度（デフォルト 75 より狭く、パースの歪みが少ない）
 * - R3F は PerspectiveCamera をデフォルトで作成するので、
 *   `new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)` 相当が自動生成される
 *
 * ### onCreated
 * Canvas の WebGL コンテキストが初期化完了したタイミングで呼ばれるコールバック。
 * ここで isReady を true にし、CSS transition で Canvas をフェードインさせる。
 */
export function DistortionScene() {
  const [isReady, setIsReady] = useState(false);

  const handleCreated = useCallback(() => {
    setIsReady(true);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-[#0a0a0a]"
      style={{ aspectRatio: "16 / 9", minHeight: 300 }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "default",
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        onCreated={handleCreated}
        style={{
          width: "100%",
          height: "100%",
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        {/**
         * Suspense は Canvas の内側に配置する。
         *
         * R3F の useTexture / useGLTF は内部で suspend するため、
         * Canvas 内に Suspense boundary が必要。
         * fallback={null} はテクスチャ読み込み中に何も表示しない設定。
         * Canvas 外の isReady スピナーがローディング表示を担当するので、
         * ここではシンプルに null で良い。
         */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* WebGL 初期化中のフォールバック UI（スピナー） */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      )}
    </div>
  );
}
