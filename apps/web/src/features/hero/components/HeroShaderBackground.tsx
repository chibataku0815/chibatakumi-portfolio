"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  isWebGLSupported,
  getOptimalPixelRatio,
  getRendererConfig,
  loadTexture,
} from "@/shared/gl";
import { heroShaderConfig } from "../shader/config";
import { heroVertexShader, createHeroFragmentShader } from "../shader/materials";
import type { HeroShaderUniforms } from "../shader/types";

const cfg = heroShaderConfig;
const rendererCfg = getRendererConfig();

/**
 * HeroShaderBackground
 * - 画像を中央にcontain配置（シェーダ内で描画）
 * - 画像外は平均暗部色 + FBM + ノイズで補完
 * - パラメータは lib/shaders/config/hero.ts で調整
 */
export function HeroShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isWebGLSupported()) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: rendererCfg.antialias,
      alpha: rendererCfg.alpha,
      powerPreference: rendererCfg.powerPreference,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(rendererCfg.maxPixelRatio));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    let material: THREE.ShaderMaterial | null = null;
    let texture: THREE.Texture | null = null;
    let animationFrameId: number | null = null;
    const startTime = performance.now();
    const targetPointer = { x: 0.5, y: 0.5 };
    const currentPointer = { x: 0.5, y: 0.5 };

    // Animation loop
    const animate = (now: number) => {
      if (material) {
        material.uniforms.uTime.value = (now - startTime) / 1000;
        // Lerp pointer for smooth following
        currentPointer.x += (targetPointer.x - currentPointer.x) * 0.08;
        currentPointer.y += (targetPointer.y - currentPointer.y) * 0.08;
        material.uniforms.uPointer.value.set(currentPointer.x, currentPointer.y);
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    // Pointer handler
    const handlePointer = (e: PointerEvent) => {
      targetPointer.x = e.clientX / window.innerWidth;
      targetPointer.y = 1 - e.clientY / window.innerHeight;
    };

    // Scroll handler
    const handleScroll = () => {
      if (!material) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      material.uniforms.uScroll.value = maxScroll > 0 ? window.scrollY / maxScroll : 0;
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

    loadTexture("/hero.jpg")
      .then(({ texture: loadedTexture, width: texWidth, height: texHeight }) => {
        texture = loadedTexture;

        const uniforms: HeroShaderUniforms = {
          uTexture: { value: texture },
          uResolution: { value: new THREE.Vector2(width, height) },
          uTextureSize: { value: new THREE.Vector2(texWidth, texHeight) },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uScroll: { value: 0 },
        };

        material = new THREE.ShaderMaterial({
          uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
          vertexShader: heroVertexShader,
          fragmentShader: createHeroFragmentShader(),
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Start animation loop
        animationFrameId = requestAnimationFrame(animate);

        // Add event listeners
        window.addEventListener("pointermove", handlePointer, { passive: true });
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);
      })
      .catch((err) => console.error("Failed to load hero texture", err));

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      if (material) {
        material.dispose();
      }
      if (texture) {
        texture.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    />
  );
}

export default HeroShaderBackground;
