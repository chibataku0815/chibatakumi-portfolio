"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { imageRevealVertex, imageRevealFragment } from "../shader/materials/imageReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ShaderImageMeshProps {
  src: string;
  progress: React.MutableRefObject<number>;
}

function ShaderImageMesh({ src, progress }: ShaderImageMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const texture = useTexture(src);
  const { viewport } = useThree();

  // Preserve texture aspect ratio
  const aspect = useMemo(() => {
    if (texture.image) {
      return texture.image.width / texture.image.height;
    }
    return 1;
  }, [texture]);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uProgress: { value: 0 },
      uNoiseScale: { value: 8.0 },  // Frequency of organic distortion
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uAmberColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) },  // Amber accent
    }),
    [texture, viewport]
  );

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <mesh scale={[viewport.width, viewport.height / aspect, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={imageRevealVertex}
        fragmentShader={imageRevealFragment}
        transparent
      />
    </mesh>
  );
}

interface ShaderImageProps {
  src: string;
  alt: string;
  className?: string;
  triggerRef: React.RefObject<HTMLElement>;
}

/**
 * ShaderImage - Skills Page 画像の有機的 reveal
 *
 * @description
 * FBM ノイズを使った円形 reveal with amber glow。
 * 氷山が溶けて姿を現すような有機的な効果。
 *
 * @example
 * ```tsx
 * const sectionRef = useRef<HTMLElement>(null);
 *
 * <ShaderImage
 *   src="/images/skill.jpg"
 *   alt="Skill showcase"
 *   className="skill-image relative aspect-[4/5] overflow-hidden rounded-2xl"
 *   triggerRef={sectionRef}
 * />
 * ```
 */
export function ShaderImage({ src, alt, className, triggerRef }: ShaderImageProps) {
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top 70%",
      end: "top 30%",
      scrub: 0.8,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, [triggerRef]);

  return (
    <div className={className} aria-label={alt}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 1], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ShaderImageMesh src={src} progress={progressRef} />
      </Canvas>
    </div>
  );
}
