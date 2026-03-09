"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

import {
  isWebGLSupported,
  getOptimalPixelRatio,
  getRendererConfig,
} from "@/shared/gl";
import { videoShaderConfig } from "../shader/config";
import {
  videoVertexShader,
  createVideoFragmentShader,
} from "../shader/materials";

const cfg = videoShaderConfig;
const rendererCfg = getRendererConfig();

interface VideoHeroBackgroundProps {
  /** Video source path */
  src?: string;
  /** Fallback image for non-WebGL / low-power devices */
  fallbackImage?: string;
  /** Video width for aspect ratio calculation */
  videoWidth?: number;
  /** Video height for aspect ratio calculation */
  videoHeight?: number;
}

/**
 * Low-power device detection
 */
function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const lowCores = (navigator.hardwareConcurrency || 4) <= 2;
  return isMobile && lowCores;
}

/**
 * VideoHeroBackground
 * - HTML5 Video → Three.js VideoTexture → Custom Shader
 * - Film grain, chromatic aberration, vignette, pointer warp
 * - Mobile fallback to static image
 */
export function VideoHeroBackground({
  src = "/photography/hero-video.mp4",
  fallbackImage = "/photography/cafe-cursor-01.jpg",
  videoWidth = 1920,
  videoHeight = 1080,
}: VideoHeroBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Skip WebGL for unsupported / low-power devices
    if (!isWebGLSupported() || isLowPowerDevice()) {
      container.style.backgroundImage = `url(${fallbackImage})`;
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: rendererCfg.antialias,
      alpha: true,
      powerPreference: rendererCfg.powerPreference,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(rendererCfg.maxPixelRatio));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    // --- Video Element ---
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    let material: THREE.ShaderMaterial | null = null;
    let videoTexture: THREE.VideoTexture | null = null;
    let animationFrameId: number | null = null;
    const startTime = performance.now();
    const targetPointer = { x: 0.5, y: 0.5 };
    const currentPointer = { x: 0.5, y: 0.5 };
    let targetHeat = 0.2;
    let currentHeat = 0.2;
    let heatResetTimeout: number | null = null;
    let introTimeout: number | null = null;

    // Animation loop
    const animate = (now: number) => {
      if (material) {
        material.uniforms.uTime.value = (now - startTime) / 1000;
        currentPointer.x += (targetPointer.x - currentPointer.x) * 0.08;
        currentPointer.y += (targetPointer.y - currentPointer.y) * 0.08;
        currentHeat += (targetHeat - currentHeat) * 0.06;
        material.uniforms.uPointer.value.set(
          currentPointer.x,
          currentPointer.y
        );
        material.uniforms.uHeat.value = currentHeat;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    // Pointer handler
    const handlePointer = (e: PointerEvent) => {
      targetPointer.x = e.clientX / window.innerWidth;
      targetPointer.y = 1 - e.clientY / window.innerHeight;
      targetHeat = 1.0;
      if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
      heatResetTimeout = window.setTimeout(() => {
        targetHeat = 0.42;
      }, 320);
    };

    // Pointer leave — reset heat to resting value
    const handlePointerLeave = () => {
      if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
      targetHeat = 0.18;
    };

    // Scroll handler
    const handleScroll = () => {
      if (!material) return;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress =
        maxScroll > 0 ? window.scrollY / maxScroll : 0;
      material.uniforms.uScroll.value = scrollProgress;
      targetHeat = Math.max(0.18, 0.48 - scrollProgress * 0.4);
    };

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      if (material) {
        material.uniforms.uResolution.value.set(w, h);
      }
    };

    // --- Video ready → create texture & material ---
    const onVideoReady = () => {
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;
      videoTexture.colorSpace = THREE.SRGBColorSpace;

      const uniforms = {
        uTexture: { value: videoTexture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTextureSize: { value: new THREE.Vector2(videoWidth, videoHeight) },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uScroll: { value: 0 },
        uHeat: { value: currentHeat },
      };

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: videoVertexShader,
        fragmentShader: createVideoFragmentShader(),
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      animationFrameId = requestAnimationFrame(animate);
      window.addEventListener("pointermove", handlePointer, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize);
      renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
      introTimeout = window.setTimeout(() => {
        targetHeat = 0.45;
      }, 280);
    };

    // Start video playback
    video.addEventListener("canplaythrough", onVideoReady, { once: true });
    video.play().catch(() => {
      // Autoplay blocked (e.g. iOS Low Power Mode) → fallback
      container.style.backgroundImage = `url(${fallbackImage})`;
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
    });

    // Pause/resume on visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
      if (introTimeout) window.clearTimeout(introTimeout);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      video.pause();
      video.removeAttribute("src");
      video.load();
      geometry.dispose();
      if (material) material.dispose();
      if (videoTexture) videoTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [src, fallbackImage, videoWidth, videoHeight]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    />
  );
}

export default VideoHeroBackground;
