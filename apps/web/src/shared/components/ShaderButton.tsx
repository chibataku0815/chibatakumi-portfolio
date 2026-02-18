"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Shader for the glowing border effect
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uResolution;
  uniform vec3 uColor;

  varying vec2 vUv;

  // Simplex noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5);

    // Aspect ratio correction for pill shape
    float aspect = uResolution.x / uResolution.y;
    vec2 scaledUv = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    // Create pill/rounded rect shape
    float cornerRadius = 0.4;
    vec2 rectSize = vec2(aspect * 0.5 - cornerRadius, 0.5 - cornerRadius);
    vec2 d = abs(scaledUv) - rectSize;
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - cornerRadius;

    // Animated noise for organic border movement
    float time = uTime * 0.5;
    float noise1 = fbm(uv * 3.0 + time * 0.3);
    float noise2 = fbm(uv * 5.0 - time * 0.2);
    float combinedNoise = (noise1 + noise2) * 0.5;

    // Border thickness with noise variation
    float baseThickness = 0.02;
    float noiseThickness = combinedNoise * 0.015;
    float thickness = baseThickness + noiseThickness;

    // Breathing animation
    float breath = sin(uTime * 1.5) * 0.5 + 0.5;
    thickness += breath * 0.008;

    // Border mask
    float border = smoothstep(thickness + 0.01, thickness, abs(dist));

    // Inner glow
    float innerGlow = smoothstep(0.1, 0.0, dist) * 0.3;

    // Outer glow with noise
    float outerGlowDist = -dist;
    float glowIntensity = smoothstep(0.15, 0.0, outerGlowDist);
    glowIntensity *= (0.3 + combinedNoise * 0.2);
    glowIntensity *= (0.6 + breath * 0.4);

    // Color with amber accent
    vec3 borderColor = uColor;
    vec3 glowColor = uColor * 1.2;

    // Hover intensity boost
    float hoverBoost = 1.0 + uHover * 0.8;

    // Combine effects
    vec3 finalColor = vec3(0.0);
    finalColor += borderColor * border * hoverBoost;
    finalColor += glowColor * glowIntensity * hoverBoost;
    finalColor += borderColor * innerGlow * uHover;

    // Alpha
    float alpha = max(border, glowIntensity * 0.8);
    alpha *= (0.4 + breath * 0.3 + uHover * 0.3);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface ShaderMeshProps {
  hover: number;
  color: THREE.Color;
}

function ShaderMesh({ hover, color }: ShaderMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uColor: { value: color },
    }),
    [viewport.width, viewport.height, color]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = clock.elapsedTime;
      material.uniforms.uHover.value = hover;
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

interface ShaderButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  "data-transition"?: string;
}

/**
 * ShaderButton - Award-worthy CTA with WebGL glow effect
 *
 * Features:
 * - Constant breathing glow animation
 * - FBM noise for organic border movement
 * - Magnetic hover effect
 * - Amber color accent matching brand
 */
export function ShaderButton({
  href,
  children,
  className = "",
  ...props
}: ShaderButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 180, height: 48 });
  const boundingRef = useRef<DOMRect | null>(null);

  // Amber color from CSS variable
  const amberColor = useMemo(() => new THREE.Color("#ffc53d"), []);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width + 40, // Extra space for glow
          height: rect.height + 40,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Magnetic hover effect
  const handleMouseEnter = useCallback(() => {
    if (!buttonRef.current) return;
    boundingRef.current = buttonRef.current.getBoundingClientRect();
    gsap.to({ value: hover }, {
      value: 1,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: function() {
        setHover(this.targets()[0].value);
      }
    });
  }, [hover]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current || !boundingRef.current) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = boundingRef.current;

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distX = clientX - centerX;
    const distY = clientY - centerY;

    gsap.to(buttonRef.current, {
      x: distX * 0.3,
      y: distY * 0.3,
      duration: 0.3,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!buttonRef.current) return;

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });

    gsap.to({ value: hover }, {
      value: 0,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: function() {
        setHover(this.targets()[0].value);
      }
    });
  }, [hover]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* WebGL Canvas for glow effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: "translate(-20px, -20px)",
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        <Canvas
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 0, 1] }}
        >
          <ShaderMesh hover={hover} color={amberColor} />
        </Canvas>
      </div>

      {/* Actual button */}
      <Link
        ref={buttonRef}
        href={href}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform ${className}`}
        {...props}
      >
        {children}
      </Link>
    </div>
  );
}

export default ShaderButton;
