"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  isWebGLSupported,
  getOptimalPixelRatio,
  getRendererConfig,
} from "@/shared/gl";
import type { HeroMaskSet } from "@/features/hero/shader/types";
import { videoShaderConfig } from "../shader/config";
import {
  videoVertexShader,
  createVideoFragmentShader,
} from "../shader/materials";

const cfg = videoShaderConfig;
const rendererCfg = getRendererConfig();

interface PhotographyHeroLightLayerProps {
  src?: string;
  fallbackImage?: string;
  videoWidth?: number;
  videoHeight?: number;
  maskSet: HeroMaskSet;
}

function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const lowCores = (navigator.hardwareConcurrency || 4) <= 2;
  return isMobile && lowCores;
}

export function PhotographyHeroLightLayer({
  src = "/photography/hero-video.mp4",
  fallbackImage = "/photography/cafe-cursor-01.jpg",
  videoWidth = 1920,
  videoHeight = 1080,
  maskSet,
}: PhotographyHeroLightLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const maskSetRef = useRef(maskSet);

  useEffect(() => {
    maskSetRef.current = maskSet;
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uMaskCount.value = Math.min(maskSet.maskRects.length, 6);
    material.uniforms.uMaskRects.value = Array.from({ length: 6 }, (_, index) => {
      const rect = maskSet.maskRects[index];
      return new THREE.Vector4(
        rect?.x ?? 0,
        rect?.y ?? 0,
        rect?.width ?? 0,
        rect?.height ?? 0
      );
    });
    material.uniforms.uAnchorRect.value = new THREE.Vector4(
      maskSet.anchorRect?.x ?? 0,
      maskSet.anchorRect?.y ?? 0,
      maskSet.anchorRect?.width ?? 0,
      maskSet.anchorRect?.height ?? 0
    );
  }, [maskSet]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isWebGLSupported() || isLowPowerDevice()) {
      container.style.backgroundImage = `url(${fallbackImage})`;
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
      return;
    }

    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: rendererCfg.antialias,
      alpha: true,
      powerPreference: rendererCfg.powerPreference,
    });

    const syncRendererSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      return { width, height };
    };

    const initialSize = syncRendererSize();
    renderer.setPixelRatio(getOptimalPixelRatio(rendererCfg.maxPixelRatio));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
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
    let frameId: number | null = null;
    const startTime = performance.now();
    const targetPointer = { x: 0.5, y: 0.5 };
    const currentPointer = { x: 0.5, y: 0.5 };
    let targetHeat: number = 0.2;
    let currentHeat: number = 0.2;
    let heatResetTimeout: number | null = null;
    let introTimeout: number | null = null;

    const updateMaskUniforms = () => {
      if (!material) return;
      material.uniforms.uMaskCount.value = Math.min(maskSetRef.current.maskRects.length, 6);
      material.uniforms.uMaskRects.value = Array.from({ length: 6 }, (_, index) => {
        const rect = maskSetRef.current.maskRects[index];
        return new THREE.Vector4(
          rect?.x ?? 0,
          rect?.y ?? 0,
          rect?.width ?? 0,
          rect?.height ?? 0
        );
      });
      material.uniforms.uAnchorRect.value = new THREE.Vector4(
        maskSetRef.current.anchorRect?.x ?? 0,
        maskSetRef.current.anchorRect?.y ?? 0,
        maskSetRef.current.anchorRect?.width ?? 0,
        maskSetRef.current.anchorRect?.height ?? 0
      );
    };

    const updateScroll = () => {
      if (!material) return;
      const rect = container.getBoundingClientRect();
      const progress = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height * 0.8, 1), 0, 1);
      material.uniforms.uScroll.value = progress;
      targetHeat = Math.max(0.18, 0.48 - progress * 0.4);
    };

    const animate = (now: number) => {
      if (material) {
        material.uniforms.uTime.value = (now - startTime) / 1000;
        currentPointer.x += (targetPointer.x - currentPointer.x) * 0.08;
        currentPointer.y += (targetPointer.y - currentPointer.y) * 0.08;
        currentHeat += (targetHeat - currentHeat) * 0.06;
        material.uniforms.uPointer.value.set(currentPointer.x, currentPointer.y);
        material.uniforms.uHeat.value = currentHeat;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!supportsFinePointer || !maskSetRef.current.interactionEnabled || event.pointerType === "touch") {
        return;
      }
      const rect = container.getBoundingClientRect();
      targetPointer.x = THREE.MathUtils.clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      targetPointer.y = THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
      targetHeat = 1.0;
      if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
      heatResetTimeout = window.setTimeout(() => {
        targetHeat = 0.42;
      }, 320);
    };

    const handlePointerLeave = () => {
      if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
      targetHeat = 0.18;
    };

    const handleResize = () => {
      const nextSize = syncRendererSize();
      if (material) {
        material.uniforms.uResolution.value.set(nextSize.width, nextSize.height);
      }
      updateScroll();
    };

    const onVideoReady = () => {
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;
      videoTexture.colorSpace = THREE.SRGBColorSpace;

      material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: videoTexture },
          uResolution: { value: new THREE.Vector2(initialSize.width, initialSize.height) },
          uTextureSize: { value: new THREE.Vector2(videoWidth, videoHeight) },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uScroll: { value: 0 },
          uHeat: { value: currentHeat },
          uMaskCount: { value: 0 },
          uMaskRects: { value: [] },
          uAnchorRect: { value: new THREE.Vector4(0, 0, 0, 0) },
        },
        vertexShader: videoVertexShader,
        fragmentShader: createVideoFragmentShader(),
      });
      materialRef.current = material;
      updateMaskUniforms();

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      updateScroll();
      frameId = requestAnimationFrame(animate);
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("scroll", updateScroll, { passive: true });
      window.addEventListener("resize", handleResize);
      renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
      introTimeout = window.setTimeout(() => {
        targetHeat = 0.45;
      }, 280);
    };

    video.addEventListener("canplaythrough", onVideoReady, { once: true });
    video.play().catch(() => {
      container.style.backgroundImage = `url(${fallbackImage})`;
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
    });

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
      if (frameId) cancelAnimationFrame(frameId);
      if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
      if (introTimeout) window.clearTimeout(introTimeout);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      video.pause();
      video.removeAttribute("src");
      video.load();
      geometry.dispose();
      if (material) material.dispose();
      materialRef.current = null;
      if (videoTexture) videoTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [fallbackImage, src, videoHeight, videoWidth]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    />
  );
}

export default PhotographyHeroLightLayer;
