"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getOptimalPixelRatio, isWebGL2Supported } from "@/shared/gl";

/**
 * @description LP の proof セクションで使う WebGL 動画カードの props です。
 * @property {string} src - `public` 配下から読む mp4 の URL。
 * @property {string} title - 読み上げとデバッグで使う短い識別名です。
 */
interface FilmLabProofVideoCardProps {
  src: string;
  title: string;
}

/**
 * @description 動画の縦横比を保ちながら、表示領域を cover するように平面サイズを決めます。
 * @param {THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>} mesh - 動画テクスチャを貼る平面です。
 * @param {number} videoWidth - 元動画の横幅です。
 * @param {number} videoHeight - 元動画の高さです。
 * @param {number} containerWidth - 表示枠の横幅です。
 * @param {number} containerHeight - 表示枠の高さです。
 */
function filmLabApplyVideoCoverScale(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number,
): void {
  const safeVideoWidth = Math.max(videoWidth, 1);
  const safeVideoHeight = Math.max(videoHeight, 1);
  const safeContainerWidth = Math.max(containerWidth, 1);
  const safeContainerHeight = Math.max(containerHeight, 1);

  const videoAspect = safeVideoWidth / safeVideoHeight;
  const containerAspect = safeContainerWidth / safeContainerHeight;

  if (videoAspect > containerAspect) {
    mesh.scale.set(videoAspect / containerAspect, 1, 1);
    return;
  }

  mesh.scale.set(1, containerAspect / videoAspect, 1);
}

/**
 * @description graded 済み mp4 を WebGL 上に敷き、proof 用の動く見本として見せます。
 * まず WebGL2 を試し、難しい環境では通常の `<video>` にフォールバックします。
 * 公開前の仮 asset を素早く差し込むための用途に限定します。
 * @param {FilmLabProofVideoCardProps} root0 - proof 動画カードの props。
 */
export function FilmLabProofVideoCard({ src, title }: FilmLabProofVideoCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showFallbackVideo, setShowFallbackVideo] = useState(false);

  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    if (!isWebGL2Supported()) {
      setShowFallbackVideo(true);
      return;
    }

    let animationFrameId = 0;
    let isDisposed = false;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(getOptimalPixelRatio(1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerElement.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const videoElement = document.createElement("video");
    videoElement.src = src;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.playsInline = true;
    videoElement.preload = "auto";
    videoElement.crossOrigin = "anonymous";
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("webkit-playsinline", "");
    videoElement.setAttribute("aria-label", title);

    let videoTexture: THREE.VideoTexture | null = null;

    const syncRendererSize = () => {
      const containerWidth = Math.max(containerElement.clientWidth, 1);
      const containerHeight = Math.max(containerElement.clientHeight, 1);
      renderer.setSize(containerWidth, containerHeight, false);
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        filmLabApplyVideoCoverScale(
          mesh,
          videoElement.videoWidth,
          videoElement.videoHeight,
          containerWidth,
          containerHeight,
        );
      }
    };

    const renderFrame = () => {
      if (isDisposed) return;
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    const startWebglVideo = async () => {
      try {
        await videoElement.play();
      } catch {
        // muted autoplay が止められても、最初のフレームが読めれば proof としては成立させる
      }

      if (isDisposed) return;

      videoTexture = new THREE.VideoTexture(videoElement);
      /**
       * @description DOM の `<video>` と同じ見え方を優先します。
       * proof 用 clip はここで sRGB を明示すると暗く見えるケースがあったため、
       * Three.js 側では追加の色空間変換をかけません。
       */
      videoTexture.colorSpace = THREE.NoColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      material.map = videoTexture;
      material.needsUpdate = true;
      syncRendererSize();
      renderFrame();
    };

    const handleLoadedMetadata = () => {
      void startWebglVideo();
    };

    const handleVideoError = () => {
      setShowFallbackVideo(true);
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("error", handleVideoError);

    syncRendererSize();
    window.addEventListener("resize", syncRendererSize);
    videoElement.load();

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", syncRendererSize);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("error", handleVideoError);
      window.cancelAnimationFrame(animationFrameId);
      videoElement.pause();
      videoElement.removeAttribute("src");
      videoElement.load();
      videoTexture?.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      if (containerElement.contains(renderer.domElement)) {
        containerElement.removeChild(renderer.domElement);
      }
    };
  }, [src, title]);

  return (
    <div className="relative min-h-[clamp(200px,36vw,320px)] overflow-hidden rounded-t-2xl rounded-b-none bg-black">
      <div ref={containerRef} className="absolute inset-0" aria-hidden={showFallbackVideo} />
      {showFallbackVideo ? (
        <video
          src={src}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={title}
        />
      ) : null}
    </div>
  );
}
