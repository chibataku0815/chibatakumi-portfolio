"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isWebGLSupported, getOptimalPixelRatio } from "@/shared/gl";
import { fluidConfig, hexToRgb, type FluidConfig } from "../shader/config";
import { vertexShader, fluidShader, displayShader } from "../shader/materials";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Props {
  className?: string;
  config?: Partial<FluidConfig>;
  fadeIn?: boolean;
  accentColor?: string | null;
}

/**
 * FluidGradientBackground
 * - マウスインタラクティブな流体グラデーション背景
 * - Ping-Pongバッファによる流体シミュレーション
 * - パラメータは shader/config/fluid.ts で調整
 */
export function FluidGradientBackground({ className, config: overrides, fadeIn = false, accentColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fadeInTriggerRef = useRef<ScrollTrigger | null>(null);
  const displayMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const accentTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isWebGLSupported()) return;

    // Merge config with overrides
    const cfg = { ...fluidConfig, ...overrides };

    // === Three.js Setup ===
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    let width = container.clientWidth;
    let height = container.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(1.5));
    container.appendChild(renderer.domElement);

    // === Render Targets (Ping-Pong) ===
    const targetOptions: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    };
    let fluidTarget1 = new THREE.WebGLRenderTarget(width, height, targetOptions);
    let fluidTarget2 = new THREE.WebGLRenderTarget(width, height, targetOptions);
    let currentTarget = fluidTarget1;
    let previousTarget = fluidTarget2;

    // === Materials ===
    const fluidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        iFrame: { value: 0 },
        iPreviousFrame: { value: null },
        uBrushSize: { value: cfg.brushSize },
        uBrushStrength: { value: cfg.brushStrength },
        uFluidDecay: { value: cfg.fluidDecay },
        uTrailLength: { value: cfg.trailLength },
        uStopDecay: { value: cfg.stopDecay },
      },
      vertexShader,
      fragmentShader: fluidShader,
    });

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iFluid: { value: null },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        uDistortionAmount: { value: cfg.distortionAmount },
        uColor1: { value: new THREE.Vector3(...hexToRgb(cfg.color1)) },
        uColor2: { value: new THREE.Vector3(...hexToRgb(cfg.color2)) },
        uColor3: { value: new THREE.Vector3(...hexToRgb(cfg.color3)) },
        uColor4: { value: new THREE.Vector3(...hexToRgb(cfg.color4)) },
        uColorIntensity: { value: cfg.colorIntensity },
        uSoftness: { value: cfg.softness },
        uAccentColor: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
        uAccentMix: { value: 0.0 },
      },
      vertexShader,
      fragmentShader: displayShader,
    });
    displayMaterialRef.current = displayMaterial;

    // === Geometry & Meshes ===
    const geometry = new THREE.PlaneGeometry(2, 2);
    const fluidPlane = new THREE.Mesh(geometry, fluidMaterial);
    const displayPlane = new THREE.Mesh(geometry, displayMaterial);

    // === Mouse State ===
    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let lastMoveTime = 0;
    let frameCount = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Use document-level mouse tracking for z-index compatibility
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = height - e.clientY;
      lastMoveTime = performance.now();
      fluidMaterial.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY);
    };

    const handleMouseLeave = () => {
      fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
    };

    // Listen on document for mouse events (works even when behind other elements)
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // === Resize Handler ===
    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      fluidMaterial.uniforms.iResolution.value.set(width, height);
      displayMaterial.uniforms.iResolution.value.set(width, height);
      fluidTarget1.setSize(width, height);
      fluidTarget2.setSize(width, height);
      frameCount = 0;
    };

    window.addEventListener("resize", handleResize);

    // === Animation Loop ===
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const time = performance.now() * 0.001;
      fluidMaterial.uniforms.iTime.value = time;
      displayMaterial.uniforms.iTime.value = time;
      fluidMaterial.uniforms.iFrame.value = frameCount;

      // Reset mouse if no movement for 100ms
      if (performance.now() - lastMoveTime > 100) {
        fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
        displayMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
      } else {
        // Pass current mouse to display shader for glow effect
        displayMaterial.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY);
      }

      // Render fluid simulation
      fluidMaterial.uniforms.iPreviousFrame.value = previousTarget.texture;
      renderer.setRenderTarget(currentTarget);
      renderer.render(fluidPlane, camera);

      // Render display
      displayMaterial.uniforms.iFluid.value = currentTarget.texture;
      renderer.setRenderTarget(null);
      renderer.render(displayPlane, camera);

      // Swap targets
      const temp = currentTarget;
      currentTarget = previousTarget;
      previousTarget = temp;

      frameCount++;
    };

    animate();

    // === Cleanup ===
    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);

      geometry.dispose();
      fluidMaterial.dispose();
      displayMaterial.dispose();
      fluidTarget1.dispose();
      fluidTarget2.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      displayMaterialRef.current = null;
    };
  }, []);

  // FadeIn effect for transition
  useEffect(() => {
    if (!fadeIn || !containerRef.current) return;

    const container = containerRef.current;

    // Initial state: transparent
    gsap.set(container, { opacity: 0 });

    // Scroll-based fade-in
    fadeInTriggerRef.current = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      end: "top 20%",
      scrub: 0.5,
      onUpdate: (self) => {
        container.style.opacity = String(self.progress);
      },
    });

    return () => {
      if (fadeInTriggerRef.current) {
        fadeInTriggerRef.current.kill();
        fadeInTriggerRef.current = null;
      }
    };
  }, [fadeIn]);

  // Color-Responsive: accentColor変更時のGSAP tween
  useEffect(() => {
    console.log("[FluidGradient] accentColor changed:", accentColor);
    console.log("[FluidGradient] displayMaterialRef.current:", !!displayMaterialRef.current);

    if (!displayMaterialRef.current) return;

    // 既存tweenをkill
    accentTweenRef.current?.kill();

    const uniforms = displayMaterialRef.current.uniforms;

    if (accentColor) {
      // accent色をセット
      const [r, g, b] = hexToRgb(accentColor);
      console.log("[FluidGradient] Setting accent color RGB:", r, g, b);
      uniforms.uAccentColor.value.set(r, g, b);

      // 0→1 に遷移 (1.0秒)
      accentTweenRef.current = gsap.to(uniforms.uAccentMix, {
        value: 1.0,
        duration: 1.0,
        ease: "power2.out",
        onUpdate: () => {
          console.log("[FluidGradient] uAccentMix:", uniforms.uAccentMix.value);
        },
      });
    } else {
      // 1→0 に遷移 (1.5秒)
      accentTweenRef.current = gsap.to(uniforms.uAccentMix, {
        value: 0.0,
        duration: 1.5,
        ease: "power2.inOut",
      });
    }

    return () => {
      accentTweenRef.current?.kill();
    };
  }, [accentColor]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
    />
  );
}

export default FluidGradientBackground;
