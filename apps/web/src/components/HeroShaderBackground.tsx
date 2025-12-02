"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hero背景シェーダー:
 * - 画像をobject-contain風に中央表示
 * - 周囲はFBM+ノイズの暗色背景（画像端からサンプリングしてブレンド）
 * - 1テクスチャのみロード、前景img不要
 */
export function HeroShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    if (!gl) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const loader = new THREE.TextureLoader();

    loader.load(
      "/hero.jpg",
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uResolution: { value: new THREE.Vector2(width, height) },
            uTextureSize: {
              value: new THREE.Vector2(texture.image.width, texture.image.height),
            },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform vec2 uResolution;
            uniform vec2 uTextureSize;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              float frequency = 1.0;
              for (int i = 0; i < 5; i++) {
                value += amplitude * noise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
              }
              return value;
            }

            // Sample average color from image interior (weighted toward darker tones)
            vec3 sampleAverageColor(sampler2D tex) {
              vec3 sum = vec3(0.0);
              float totalWeight = 0.0;

              for (float x = 0.15; x <= 0.85; x += 0.14) {
                for (float y = 0.15; y <= 0.85; y += 0.14) {
                  vec3 s = texture2D(tex, vec2(x, y)).rgb;
                  float luma = dot(s, vec3(0.299, 0.587, 0.114));
                  // Weight darker pixels more heavily
                  float w = 1.0 - luma * 0.6;
                  sum += s * w;
                  totalWeight += w;
                }
              }

              vec3 avg = sum / totalWeight;
              float avgLuma = dot(avg, vec3(0.299, 0.587, 0.114));
              // Slightly desaturate and darken
              return mix(vec3(avgLuma), avg, 0.6) * 0.3;
            }

            // Blur sample from texture
            vec3 blurSample(sampler2D tex, vec2 center, float radius) {
              vec3 sum = vec3(0.0);
              float total = 0.0;

              for (float dx = -2.0; dx <= 2.0; dx += 1.0) {
                for (float dy = -2.0; dy <= 2.0; dy += 1.0) {
                  vec2 offset = vec2(dx, dy) * radius;
                  vec2 sampleUv = clamp(center + offset, vec2(0.02), vec2(0.98));
                  sum += texture2D(tex, sampleUv).rgb;
                  total += 1.0;
                }
              }

              return sum / total;
            }

            void main() {
              vec2 uv = vUv;

              // Calculate photo bounds (object-contain)
              float screenAspect = uResolution.x / uResolution.y;
              float imageAspect = uTextureSize.x / uTextureSize.y;

              vec2 photoScale;
              if (screenAspect > imageAspect) {
                photoScale = vec2(imageAspect / screenAspect, 1.0);
              } else {
                photoScale = vec2(1.0, screenAspect / imageAspect);
              }
              vec2 photoOffset = (vec2(1.0) - photoScale) * 0.5;
              vec2 photoUv = (uv - photoOffset) / photoScale;

              vec2 clampedUv = clamp(photoUv, vec2(0.0), vec2(1.0));
              vec3 photoColor = texture2D(uTexture, clampedUv).rgb;

              // Base background: average dark color from entire image
              vec3 baseColor = sampleAverageColor(uTexture);

              // Edge color: blurred sample from nearest edge, pushed slightly inward
              vec2 edgeSampleUv = clampedUv;
              // Push sample point slightly inward from hard edge
              float inset = 0.08;
              edgeSampleUv.x = clamp(edgeSampleUv.x, inset, 1.0 - inset);
              edgeSampleUv.y = clamp(edgeSampleUv.y, inset, 1.0 - inset);

              vec3 edgeColor = blurSample(uTexture, edgeSampleUv, 0.05);
              float edgeLuma = dot(edgeColor, vec3(0.299, 0.587, 0.114));
              edgeColor = mix(vec3(edgeLuma), edgeColor, 0.7) * 0.45;

              // Distance from photo bounds
              float outsideDist = 0.0;
              if (photoUv.x < 0.0) outsideDist = max(outsideDist, -photoUv.x);
              if (photoUv.x > 1.0) outsideDist = max(outsideDist, photoUv.x - 1.0);
              if (photoUv.y < 0.0) outsideDist = max(outsideDist, -photoUv.y);
              if (photoUv.y > 1.0) outsideDist = max(outsideDist, photoUv.y - 1.0);

              // Blend from edge color to base color as distance increases
              float blendToBase = smoothstep(0.0, 0.25, outsideDist);
              vec3 bgColor = mix(edgeColor, baseColor, blendToBase);

              // Subtle FBM variation
              float fbmValue = fbm(uv * 1.5);
              bgColor += bgColor * (fbmValue - 0.5) * 0.15;

              // Fine grain
              float grain = noise(uv * uResolution * 1.5) * 0.012;
              bgColor += grain;
              bgColor = max(bgColor, vec3(0.02));

              // Soft edge mask for photo/background blend
              float edgeFade = 0.1;
              float edgeMask = 1.0;
              edgeMask *= smoothstep(0.0, edgeFade, photoUv.x);
              edgeMask *= smoothstep(0.0, edgeFade, 1.0 - photoUv.x);
              edgeMask *= smoothstep(0.0, edgeFade, photoUv.y);
              edgeMask *= smoothstep(0.0, edgeFade, 1.0 - photoUv.y);

              vec3 color = mix(bgColor, photoColor, edgeMask);

              gl_FragColor = vec4(color, 1.0);
            }
          `,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        renderer.render(scene, camera);

        const handleResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          renderer.setSize(w, h);
          material.uniforms.uResolution.value.set(w, h);
          renderer.render(scene, camera);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      },
      undefined,
      (err) => console.error("Failed to load hero texture", err)
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: "#0a0a0a" }}
      aria-hidden="true"
    />
  );
}

export default HeroShaderBackground;
