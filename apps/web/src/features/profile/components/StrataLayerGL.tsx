"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { strataLayerVertex, strataLayerFragment } from "../shader/materials/strataLayer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StrataLayerMeshProps {
  depth: number;  // 0.0 ~ 1.0
  progress: React.MutableRefObject<number>;
}

function StrataLayerMesh({ depth, progress }: StrataLayerMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepth: { value: depth },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uAmberColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) },
    }),
    [depth, viewport]
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
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={strataLayerVertex}
        fragmentShader={strataLayerFragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

interface StrataLayerGLProps {
  depth: number;  // 0.0 (surface) ~ 1.0 (deepest)
  triggerRef: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * StrataLayerGL - Profile Timeline の地層シェーダー
 *
 * @description
 * Timeline の各セクション背景に表示される地層効果。
 * 深さ (depth) に応じて:
 * - 地層線の密度が増加
 * - 色が若干暗くなる
 * - 深層（70%+）で化石の痕跡が出現
 *
 * Art Direction: "掘り進むほど現れる歴史の層と、
 *                 最深部に眠る原初の痕跡"
 *
 * @example
 * ```tsx
 * <StrataLayerGL
 *   depth={index / total}  // 0.0 ~ 1.0
 *   triggerRef={sectionRef}
 *   className="pointer-events-none absolute inset-0 -z-10"
 * />
 * ```
 */
export function StrataLayerGL({ depth, triggerRef, className }: StrataLayerGLProps) {
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1.5,
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
        <StrataLayerMesh depth={depth} progress={progressRef} />
      </Canvas>
    </div>
  );
}
