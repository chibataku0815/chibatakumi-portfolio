"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getOptimalPixelRatio, isWebGL2Supported } from "@/shared/gl";

/**
 * @description LP の proof セクションで使う WebGL 動画カードの props です。
 * @property {string} src - route handler 経由で読む mp4 の URL。
 * @property {string} title - 読み上げとデバッグで使う短い識別名です。
 */
interface FilmLabProofVideoCardProps {
  src: string;
  title: string;
  initialTimeSeconds?: number;
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
export function FilmLabProofVideoCard({
  src,
  title,
  initialTimeSeconds = 0,
}: FilmLabProofVideoCardProps) {
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
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const videoElement = document.createElement("video");
    videoElement.src = src;
    videoElement.muted = true;
    videoElement.loop = false;
    videoElement.playsInline = true;
    videoElement.preload = "auto";
    videoElement.crossOrigin = "anonymous";
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("webkit-playsinline", "");
    videoElement.setAttribute("aria-label", title);

    let videoTexture: THREE.VideoTexture | null = null;
    let hasStartedPlayback = false;

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
      if (hasStartedPlayback) return;
      hasStartedPlayback = true;

      try {
        await videoElement.play();
      } catch {
        // muted autoplay が止められても、最初のフレームが読めれば proof としては成立させる
      }

      if (isDisposed) return;

      videoTexture = new THREE.VideoTexture(videoElement);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      material.map = videoTexture;
      material.needsUpdate = true;
      syncRendererSize();
      renderFrame();
    };

    const handleLoadedMetadata = () => {
      const targetStartSeconds =
        initialTimeSeconds > 0 && videoElement.duration > initialTimeSeconds
          ? initialTimeSeconds
          : 0;

      if (targetStartSeconds > 0) {
        videoElement.currentTime = targetStartSeconds;
        return;
      }

      void startWebglVideo();
    };

    const handleSeeked = () => {
      void startWebglVideo();
    };

    const handleEnded = () => {
      const restartSeconds =
        initialTimeSeconds > 0 && videoElement.duration > initialTimeSeconds
          ? initialTimeSeconds
          : 0;
      videoElement.currentTime = restartSeconds;
      void videoElement.play().catch(() => {});
    };

    const handleVideoError = () => {
      setShowFallbackVideo(true);
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("seeked", handleSeeked);
    videoElement.addEventListener("ended", handleEnded);
    videoElement.addEventListener("error", handleVideoError);

    syncRendererSize();
    window.addEventListener("resize", syncRendererSize);
    videoElement.load();

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", syncRendererSize);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("seeked", handleSeeked);
      videoElement.removeEventListener("ended", handleEnded);
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
  }, [initialTimeSeconds, src, title]);

  return (
    <div className="relative min-h-[clamp(200px,36vw,320px)] overflow-hidden rounded-t-2xl rounded-b-none bg-black">
      <div ref={containerRef} className="absolute inset-0" aria-hidden={showFallbackVideo} />
      {showFallbackVideo ? (
        <video
          src={initialTimeSeconds > 0 ? `${src}#t=${initialTimeSeconds}` : src}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-label={title}
        />
      ) : null}
    </div>
  );
}
