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
import type { HeroMaskSet, HeroShaderUniforms } from "../shader/types";

const cfg = heroShaderConfig;
const rendererCfg = getRendererConfig();
const MAX_LINE_RECTS = 6;

interface HomeHeroLightLayerProps {
  maskSet: HeroMaskSet;
}

function createEmptyRects(): THREE.Vector4[] {
  return Array.from({ length: MAX_LINE_RECTS }, () => new THREE.Vector4(0, 0, 0, 0));
}

export function HomeHeroLightLayer({ maskSet }: HomeHeroLightLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const maskSetRef = useRef(maskSet);

  useEffect(() => {
    maskSetRef.current = maskSet;
    const material = materialRef.current;
    if (!material) return;

    const rects = createEmptyRects();
    const usableRects = maskSet.maskRects.slice(0, MAX_LINE_RECTS);

    for (const [index, rect] of usableRects.entries()) {
      rects[index].set(rect.x, rect.y, rect.width, rect.height);
    }

    material.uniforms.uLineCount.value = usableRects.length;
    material.uniforms.uLineRects.value = rects;
    material.uniforms.uAnchorRect.value.set(
      maskSet.anchorRect?.x ?? 0,
      maskSet.anchorRect?.y ?? 0,
      maskSet.anchorRect?.width ?? 0,
      maskSet.anchorRect?.height ?? 0
    );
  }, [maskSet]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isWebGLSupported()) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: rendererCfg.antialias,
      alpha: rendererCfg.alpha,
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
    let material: THREE.ShaderMaterial | null = null;
    let texture: THREE.Texture | null = null;
    let frameId: number | null = null;
    const startTime = performance.now();
    const targetPointer = { x: 0.5, y: 0.5 };
    const currentPointer = { x: 0.5, y: 0.5 };
    let targetInteraction: number = cfg.idleHeat;
    let currentInteraction: number = cfg.idleHeat;
    let lastPointerMove = performance.now();

    const updateScroll = () => {
      if (!material) return;
      const rect = container.getBoundingClientRect();
      const progress = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height * 0.8, 1), 0, 1);
      material.uniforms.uScroll.value = progress;
    };

    const animate = (now: number) => {
      if (material) {
        material.uniforms.uTime.value = (now - startTime) / 1000;
        currentPointer.x += (targetPointer.x - currentPointer.x) * 0.08;
        currentPointer.y += (targetPointer.y - currentPointer.y) * 0.08;
        currentInteraction += (targetInteraction - currentInteraction) * 0.06;
        material.uniforms.uPointer.value.set(currentPointer.x, currentPointer.y);
        material.uniforms.uInteraction.value = currentInteraction;

        if (!maskSetRef.current.interactionEnabled || now - lastPointerMove > 420) {
          targetInteraction = Math.max(cfg.idleHeat, targetInteraction * 0.94);
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!maskSetRef.current.interactionEnabled || event.pointerType === "touch") return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      targetPointer.x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
      targetPointer.y = THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
      lastPointerMove = performance.now();
      targetInteraction = cfg.activeHeat;
    };

    const handlePointerLeave = () => {
      targetInteraction = cfg.idleHeat;
    };

    const handleResize = () => {
      const nextSize = syncRendererSize();
      if (material) {
        material.uniforms.uResolution.value.set(nextSize.width, nextSize.height);
      }
      updateScroll();
    };

    loadTexture("/hero.jpg")
      .then(({ texture: loadedTexture, width: texWidth, height: texHeight }) => {
        texture = loadedTexture;

        const uniforms: HeroShaderUniforms = {
          uTexture: { value: texture },
          uResolution: { value: new THREE.Vector2(initialSize.width, initialSize.height) },
          uTextureSize: { value: new THREE.Vector2(texWidth, texHeight) },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uScroll: { value: 0 },
          uInteraction: { value: cfg.idleHeat },
          uLineCount: { value: 0 },
          uLineRects: { value: createEmptyRects() },
          uAnchorRect: { value: new THREE.Vector4(0, 0, 0, 0) },
        };

        material = new THREE.ShaderMaterial({
          uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
          vertexShader: heroVertexShader,
          fragmentShader: createHeroFragmentShader(),
        });
        materialRef.current = material;

        const rects = createEmptyRects();
        const usableRects = maskSetRef.current.maskRects.slice(0, MAX_LINE_RECTS);
        for (const [index, rect] of usableRects.entries()) {
          rects[index].set(rect.x, rect.y, rect.width, rect.height);
        }
        material.uniforms.uLineCount.value = usableRects.length;
        material.uniforms.uLineRects.value = rects;
        material.uniforms.uAnchorRect.value.set(
          maskSetRef.current.anchorRect?.x ?? 0,
          maskSetRef.current.anchorRect?.y ?? 0,
          maskSetRef.current.anchorRect?.width ?? 0,
          maskSetRef.current.anchorRect?.height ?? 0
        );

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        updateScroll();
        frameId = requestAnimationFrame(animate);
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
        window.addEventListener("scroll", updateScroll, { passive: true });
        window.addEventListener("resize", handleResize);
      })
      .catch((error) => {
        console.error("Failed to load home hero texture", error);
      });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      materialRef.current = null;
      if (material) material.dispose();
      if (texture) texture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    />
  );
}

export default HomeHeroLightLayer;
