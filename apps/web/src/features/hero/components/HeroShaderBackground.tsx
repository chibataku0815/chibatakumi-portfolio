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
    let handleResize: (() => void) | null = null;

    loadTexture("/hero.jpg")
      .then(({ texture: loadedTexture, width: texWidth, height: texHeight }) => {
        texture = loadedTexture;

        const uniforms: HeroShaderUniforms = {
          uTexture: { value: texture },
          uResolution: { value: new THREE.Vector2(width, height) },
          uTextureSize: { value: new THREE.Vector2(texWidth, texHeight) },
        };

        material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: heroVertexShader,
          fragmentShader: createHeroFragmentShader(),
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        renderer.render(scene, camera);

        handleResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          renderer.setSize(w, h);
          if (material) {
            material.uniforms.uResolution.value.set(w, h);
          }
          renderer.render(scene, camera);
        };

        window.addEventListener("resize", handleResize);
      })
      .catch((err) => console.error("Failed to load hero texture", err));

    return () => {
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }
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
