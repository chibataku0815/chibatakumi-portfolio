"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isWebGLSupported, getOptimalPixelRatio } from "@/shared/gl";
import {
  loadingGlowVertex,
  loadingGlowFragment,
} from "../shader/loadingGlow";

/**
 * LoadingOriginGlow - Award-Worthy Loading Experience
 *
 * Art Direction: "地層の最深部で脈動する原初の熱が、徐々に目覚める"
 * Motion Design: 1.5秒周期の呼吸、静寂の中の生命感
 * WebGL: Origin Glow 軽量版、mobile 30fps+ 維持
 *
 * Excellence Framework Level 5:
 * - ローディング自体が体験
 * - Pitch Black & Fire の世界観維持
 * - パフォーマンスと美学の完全両立
 *
 * @example
 * ```tsx
 * <LoadingOriginGlow />
 * ```
 */
export function LoadingOriginGlow() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // WebGL non-support: graceful degradation (fallback handled by parent)
    if (!isWebGLSupported()) return;

    // Reduced Motion support
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Performance: false on mobile
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(2)); // Max 2x for quality
    container.appendChild(renderer.domElement);

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAmberColor: { value: new THREE.Color(0xffc53d) }, // var(--accent-amber1)
        uPulseSpeed: { value: prefersReducedMotion ? 0 : 1.5 }, // 1.5秒周期
        uPulseAmount: { value: prefersReducedMotion ? 0 : 0.2 }, // 控えめな脈動
      },
      vertexShader: loadingGlowVertex,
      fragmentShader: loadingGlowFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (now: number) => {
      if (!prefersReducedMotion) {
        material.uniforms.uTime.value = (now - startTime) / 1000;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Loading"
      aria-live="polite"
      role="status"
    />
  );
}
