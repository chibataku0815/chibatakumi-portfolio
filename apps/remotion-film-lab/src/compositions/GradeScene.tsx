import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import type { Params } from "film-lab-core";

/** WebGL1 / GLSL100 — ヘッドレス SwiftShader 等での GL2 失敗を避ける */
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
varying vec2 vUv;

vec3 adjustTemperature(vec3 c, float t) {
  return c + vec3(t * 0.05, t * 0.02, -t * 0.04);
}

void main() {
  vec4 tex = texture2D(map, vUv);
  vec3 c = tex.rgb * pow(2.0, uExposure);
  c = (c - 0.5) * uContrast + 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSaturation);
  c = adjustTemperature(c, uTemperature);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), tex.a);
}
`;

export interface GradeSceneProps {
  grade: Params;
}

/**
 * フルスクリーン画像に解析グレード（露出・コントラスト・彩度・色温度）を適用するシーン。
 * Film Lab の 8-pass とは別物 — G2 は「体感合わせ」から開始する。
 */
export function GradeScene({ grade }: GradeSceneProps) {
  const texture = useTexture(staticFile("film-lab-default.jpg"));
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        uExposure: { value: 0 },
        uContrast: { value: 1 },
        uSaturation: { value: 1 },
        uTemperature: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });
  }, [texture]);

  useFrame(() => {
    material.uniforms.uExposure.value = grade.exposure;
    material.uniforms.uContrast.value = grade.contrast;
    material.uniforms.uSaturation.value = grade.saturation;
    material.uniforms.uTemperature.value = grade.temperature;
    material.uniforms.map.value = texture;
  });

  return (
    <>
      <orthographicCamera
        makeDefault
        args={[-1, 1, 1, -1, 0.1, 10]}
        position={[0, 0, 1]}
      />
      <mesh material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    </>
  );
}
