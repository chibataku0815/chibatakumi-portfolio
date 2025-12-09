"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { originGlowVertex, originGlowFragment } from "../shader/materials/originGlow";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GlowMeshProps {
  progress: React.MutableRefObject<number>;
}

function GlowMesh({ progress }: GlowMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAmberColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) },  // Amber
      uPulseSpeed: { value: 1.5 },   // Slow, meditative pulse
      uPulseAmount: { value: 0.15 },  // Subtle pulsing
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  return (
    <mesh scale={[viewport.width * 0.6, viewport.width * 0.6, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={originGlowVertex}
        fragmentShader={originGlowFragment}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

interface OriginGlowGLProps {
  triggerRef: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * OriginGlowGL - Profile Page 最深層の根源の光
 *
 * @description
 * Timeline の最後のセクション（2011 Origin）で表示される
 * 脈動する amber の光。地層の最深部に到達した感覚。
 *
 * Art Direction: "根源に到達した" という Peak Experience
 *
 * @example
 * ```tsx
 * {isDeepest && (
 *   <OriginGlowGL
 *     triggerRef={sectionRef}
 *     className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
 *     style={{ width: "300px", height: "300px" }}
 *   />
 * )}
 * ```
 */
export function OriginGlowGL({ triggerRef, className }: OriginGlowGLProps) {
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top 50%",
      end: "bottom 20%",
      scrub: 2.0,  // Slow, meditative reveal
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, [triggerRef]);

  return (
    <div className={className}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <GlowMesh progress={progressRef} />
      </Canvas>
    </div>
  );
}
