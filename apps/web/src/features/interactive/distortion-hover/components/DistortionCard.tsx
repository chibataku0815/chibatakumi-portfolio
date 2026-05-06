/**
 * @module DistortionCard
 *
 * ディストーション・ホバーエフェクトの中核コンポーネント。
 * ホバー時に2枚の画像をノイズベースの displacement で歪ませながらクロスフェードする。
 *
 * ## R3F vs Vanilla Three.js の違い
 *
 * Vanilla Three.js では `new THREE.Mesh()`, `scene.add(mesh)` のように命令的に書くが、
 * R3F（React Three Fiber）では JSX の宣言的記法で Three.js オブジェクトを構築する。
 *
 * ```
 * // Vanilla Three.js（命令的）
 * const geometry = new THREE.PlaneGeometry(2, 1.4);
 * const material = new THREE.ShaderMaterial({ ... });
 * const mesh = new THREE.Mesh(geometry, material);
 * scene.add(mesh);
 *
 * // R3F（宣言的） — このファイルのアプローチ
 * <mesh>
 *   <planeGeometry args={[2, 1.4]} />
 *   <shaderMaterial uniforms={uniforms} ... />
 * </mesh>
 * ```
 *
 * R3F は Three.js のクラスを小文字キャメルケースの JSX 要素として自動マッピングする。
 * `args` は対応するクラスのコンストラクタ引数に渡される。
 * `ref` を使えば生の Three.js オブジェクトへの参照も取得可能。
 *
 * ## アニメーションパターン: GSAP + useRef + useFrame
 *
 * R3F では React の state を毎フレーム更新すると再レンダリングが発生してパフォーマンスが崩壊する。
 * そのため、以下の3層パターンでアニメーションを制御する:
 *
 * 1. **useRef（値の保持）** — `progressRef.current.value` でフレーム間の状態を保持
 * 2. **GSAP（イージング）** — `gsap.to()` で ref の中の値をスムーズに補間
 * 3. **useFrame（GPU同期）** — 毎フレーム ref の値を uniform にコピー
 *
 * ```
 * イベント発火 → GSAP が progressRef.value を補間（React再レンダリングなし）
 *                         ↓
 *              useFrame が毎フレーム uniform にコピー
 *                         ↓
 *              GPU が新しい uniform 値でシェーダーを実行
 * ```
 *
 * この方法なら React の reconciliation をバイパスし、60fps を維持できる。
 *
 * ## ポインターイベント: onPointerOver/Out vs Raycaster
 *
 * Vanilla Three.js では Raycaster を自前で管理する必要がある:
 * ```
 * const raycaster = new THREE.Raycaster();
 * raycaster.setFromCamera(mouse, camera);
 * const intersects = raycaster.intersectObjects(scene.children);
 * ```
 *
 * R3F では `<mesh>` に `onPointerOver`/`onPointerOut` を渡すだけで、
 * 内部の Raycaster が自動的にヒットテストを行い、イベントを発火してくれる。
 * DOM のイベントシステムと同じ感覚で 3D オブジェクトにインタラクションを追加できる。
 */
"use client";

import { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import { distortionVertex, distortionFragment } from "../shader/distortion";

/** 元画像の解像度。fragment shader 内で object-fit: cover 相当の UV 計算に使用 */
const IMAGE_RESOLUTION = new THREE.Vector2(1200, 840);

/** displacement の最大強度。大きいほど歪みが激しくなる */
const DISTORTION_STRENGTH = 0.12;

/** ホバー in/out のアニメーション秒数 */
const TWEEN_DURATION = 1.2;

/**
 * 手続き的ノイズテクスチャを生成する。
 *
 * 外部画像ファイルへの依存を排除するため、三角関数の重ね合わせで
 * 擬似ノイズパターンを CPU 上で生成し、DataTexture に格納する。
 *
 * 3オクターブの正弦波を重畳（振幅 0.5, 0.25, 0.125）し、
 * 細かさの異なるノイズを混合することで自然な揺らぎを作る。
 *
 * @param size - テクスチャの一辺のピクセル数（デフォルト 512）
 * @returns RepeatWrapping が設定された RedFormat の DataTexture
 *
 * @remarks
 * - {@link THREE.RedFormat} を使用し、R チャンネルのみ（1byte/pixel）でメモリを節約
 * - `needsUpdate = true` を設定しないと GPU にアップロードされないので注意
 * - Perlin/Simplex ノイズではなく三角関数ベースだが、displacement 用途には十分
 */
function createNoiseTexture(size = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      let v = 0;
      // 3オクターブの正弦波重畳: 周波数が上がるにつれ振幅を半減
      v += Math.sin(nx * 8.3 + ny * 5.7) * Math.cos(ny * 7.1 - nx * 3.2) * 0.5;
      v += Math.sin(nx * 17.0 + ny * 23.0) * Math.cos(ny * 19.0 - nx * 11.0) * 0.25;
      v += Math.sin(nx * 43.0 - ny * 37.0) * Math.cos(ny * 47.0 + nx * 31.0) * 0.125;
      // [-1, 1] → [0, 1] にリマップ
      v = v * 0.5 + 0.5;
      data[y * size + x] = Math.floor(Math.max(0, Math.min(1, v)) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * DistortionCard の Props
 *
 * @property imageA - ホバー前に表示する画像パス（public/ 配下）
 * @property imageB - ホバー後に表示する画像パス（public/ 配下）
 * @property position - 3D空間上の配置座標 [x, y, z]
 * @property width - カードの幅（Three.js のワールド単位）
 * @property height - カードの高さ（Three.js のワールド単位）
 */
interface DistortionCardProps {
  imageA: string;
  imageB: string;
  position: [number, number, number];
  width: number;
  height: number;
}

/**
 * ディストーション・ホバーカード。
 *
 * 2枚の画像を ShaderMaterial で合成し、ホバーで GSAP アニメーションを駆動する。
 *
 * @param props - {@link DistortionCardProps}
 *
 * @example
 * ```tsx
 * // R3F の Canvas 内で使用する（Canvas の外では使えない）
 * <Canvas>
 *   <DistortionCard
 *     imageA="/img/photo-a.jpg"
 *     imageB="/img/photo-b.jpg"
 *     position={[0, 0, 0]}
 *     width={2}
 *     height={1.4}
 *   />
 * </Canvas>
 * ```
 *
 * @remarks
 * ## Hooks の役割
 *
 * | Hook | 提供元 | 役割 |
 * |------|--------|------|
 * | `useRef` | React | materialRef / progressRef / tweenRef の参照保持。state と違い更新しても再レンダリングしない |
 * | `useMemo` | React | uniforms オブジェクトの再生成を抑制。Three.js オブジェクトは参照安定が重要 |
 * | `useCallback` | React | ポインターハンドラの参照安定化 |
 * | `useTexture` | @react-three/drei | 画像パスから THREE.Texture を読み込む。内部で Suspense と連携しローディングを管理 |
 * | `useFrame` | @react-three/fiber | requestAnimationFrame ループに毎フレーム処理を登録。React の外で GPU 更新を行う |
 *
 * ## 3つの useRef の使い分け
 *
 * - **materialRef**: ShaderMaterial への直接参照。useFrame 内で uniform を書き換えるために必要
 * - **progressRef**: `{ value: 0 }` オブジェクト。GSAP が `.value` をトゥイーンする対象
 * - **tweenRef**: 実行中の GSAP Tween 参照。ホバー反転時に `kill()` で前のアニメーションをキャンセル
 */
export function DistortionCard({ imageA, imageB, position, width, height }: DistortionCardProps) {
  /** ShaderMaterial への参照。useFrame 内で uniform を毎フレーム更新するために使用 */
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  /**
   * GSAP のトゥイーン対象。`{ value: 0 }` というオブジェクトにしているのは、
   * GSAP がプリミティブ値を直接トゥイーンできないため。
   * GSAP は `gsap.to(target, { value: 1 })` のように target のプロパティを補間する。
   */
  const progressRef = useRef({ value: 0 });

  /** 実行中の Tween 参照。ホバーが反転した際に前のアニメーションを kill() するため */
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  /**
   * useTexture — @react-three/drei が提供するテクスチャローダー。
   *
   * 内部で THREE.TextureLoader を使い、React Suspense と統合されている。
   * テクスチャの読み込み中は親の <Suspense> の fallback が表示される。
   * 配列を渡すと複数テクスチャを並列読み込みし、配列で返す。
   */
  const [texA, texB] = useTexture([imageA, imageB]);

  /** displacement 用ノイズテクスチャ。依存配列が空なので初回のみ生成される */
  const displacementTexture = useMemo(() => createNoiseTexture(), []);

  /**
   * シェーダー uniform の定義。
   *
   * useMemo で包むのは、R3F が uniforms オブジェクトの参照が変わると
   * ShaderMaterial を再構築してしまうため。
   * ただし u_progress は毎フレーム useFrame 内で直接書き換えるので、
   * ここでの初期値 0.0 はあくまで初期状態。
   *
   * Three.js の uniform は `{ value: T }` 形式のオブジェクトで、
   * value プロパティを書き換えることで GPU に新しい値が送られる。
   */
  const uniforms = useMemo(
    () => ({
      u_texture1: { value: texA },
      u_texture2: { value: texB },
      u_displacement: { value: displacementTexture },
      u_progress: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_imageResolution: { value: IMAGE_RESOLUTION.clone() },
      u_distortionStrength: { value: DISTORTION_STRENGTH },
    }),
    [texA, texB, displacementTexture, width, height]
  );

  /**
   * useFrame — R3F の毎フレームコールバック。
   *
   * requestAnimationFrame ごとに呼ばれ、React の再レンダリングとは無関係に実行される。
   * ここで progressRef の値（GSAP が補間中）を uniform にコピーすることで、
   * React のライフサイクルを経由せずに GPU へ値を渡す。
   *
   * 注意: useFrame 内で setState を呼ぶと毎フレーム再レンダリングが発生して
   * パフォーマンスが壊滅するので、必ず ref 経由で値を受け渡す。
   */
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_progress.value = progressRef.current.value;
    }
  });

  /**
   * ホバーイン: GSAP で progress を 0 → 1 にトゥイーン。
   * kill() で前回のトゥイーンをキャンセルしてから新しいトゥイーンを開始する。
   * これにより、ホバーを素早く行き来しても途中から滑らかに方向転換する。
   */
  const handlePointerOver = useCallback(() => {
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(progressRef.current, {
      value: 1.0,
      duration: TWEEN_DURATION,
      ease: "power2.inOut",
    });
  }, []);

  /**
   * ホバーアウト: GSAP で progress を 1 → 0 にトゥイーン。
   * handlePointerOver と対称的な処理。
   */
  const handlePointerOut = useCallback(() => {
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(progressRef.current, {
      value: 0.0,
      duration: TWEEN_DURATION,
      ease: "power2.inOut",
    });
  }, []);

  /**
   * JSX による Three.js シーングラフ構築。
   *
   * - `<mesh>` → THREE.Mesh に対応
   * - `<planeGeometry>` → THREE.PlaneGeometry に対応。args はコンストラクタ引数 (width, height)
   * - `<shaderMaterial>` → THREE.ShaderMaterial に対応
   *
   * onPointerOver / onPointerOut は R3F が内部で Raycaster を走らせ、
   * この mesh にレイがヒットしたときに自動的に呼ばれる。
   * Vanilla Three.js のように自分で Raycaster を管理する必要がない。
   */
  return (
    <mesh
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={distortionVertex}
        fragmentShader={distortionFragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
