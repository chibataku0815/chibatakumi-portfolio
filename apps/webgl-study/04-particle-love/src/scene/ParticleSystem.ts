/**
 * ParticleSystem — GPUComputationRenderer wrapper for GPGPU particles
 *
 * Manages FBO ping-pong (position + velocity textures) and renders
 * particles as Points with a custom ShaderMaterial.
 */

import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

import positionShader from "../shaders/gpgpu-position.glsl?raw";
import velocityShader from "../shaders/gpgpu-velocity.glsl?raw";
import particleVertex from "../shaders/particle-vertex.glsl?raw";
import particleFragment from "../shaders/particle-fragment.glsl?raw";

export interface ParticleParams {
  curlStrength: number;
  curlFrequency: number;
  damping: number;
  speed: number;
  mouseStrength: number;
  mouseRadius: number;
  pointSize: number;
  colorA: THREE.Color;
  colorB: THREE.Color;
}

export interface ParticleSystemOptions {
  gpgpuSize: number;
  renderer: THREE.WebGLRenderer;
  params?: Partial<ParticleParams>;
}

const DEFAULT_PARAMS: ParticleParams = {
  curlStrength: 0.3,
  curlFrequency: 0.4,
  damping: 0.95,
  speed: 1.0,
  mouseStrength: 0.5,
  mouseRadius: 1.5,
  pointSize: 0.008,
  colorA: new THREE.Color(0xff6b9d), // warm pink
  colorB: new THREE.Color(0x4ecdc4), // cool teal
};

export class ParticleSystem {
  readonly gpgpuSize: number;
  readonly particleCount: number;
  readonly points: THREE.Points;
  readonly params: ParticleParams;

  private gpuCompute: GPUComputationRenderer;
  private positionVariable: ReturnType<GPUComputationRenderer["addVariable"]>;
  private velocityVariable: ReturnType<GPUComputationRenderer["addVariable"]>;
  private particleMaterial: THREE.ShaderMaterial;

  constructor(options: ParticleSystemOptions) {
    const { gpgpuSize, renderer } = options;
    this.gpgpuSize = gpgpuSize;
    this.particleCount = gpgpuSize * gpgpuSize;

    // Merge params
    this.params = { ...DEFAULT_PARAMS, ...options.params };
    // Clone colors to avoid shared references
    this.params.colorA = this.params.colorA.clone();
    this.params.colorB = this.params.colorB.clone();

    // --- GPGPU Setup ---
    this.gpuCompute = new GPUComputationRenderer(gpgpuSize, gpgpuSize, renderer);

    // Initial textures
    const posTexture = this.gpuCompute.createTexture();
    const velTexture = this.gpuCompute.createTexture();
    this.fillPositionTexture(posTexture);
    this.fillVelocityTexture(velTexture);

    // Register variables
    this.positionVariable = this.gpuCompute.addVariable(
      "texturePosition",
      positionShader,
      posTexture,
    );
    this.velocityVariable = this.gpuCompute.addVariable(
      "textureVelocity",
      velocityShader,
      velTexture,
    );

    // Dependencies: both read both
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.positionVariable,
      this.velocityVariable,
    ]);

    // Position uniforms
    this.positionVariable.material.uniforms.uDeltaTime = { value: 0.0 };

    // Velocity uniforms
    const velUniforms = this.velocityVariable.material.uniforms;
    velUniforms.uTime = { value: 0.0 };
    velUniforms.uDeltaTime = { value: 0.0 };
    velUniforms.uCurlStrength = { value: this.params.curlStrength };
    velUniforms.uCurlFrequency = { value: this.params.curlFrequency };
    velUniforms.uDamping = { value: this.params.damping };
    velUniforms.uSpeed = { value: this.params.speed };
    velUniforms.uMouse = { value: new THREE.Vector3(9999, 9999, 9999) };
    velUniforms.uMouseStrength = { value: this.params.mouseStrength };
    velUniforms.uMouseRadius = { value: this.params.mouseRadius };

    // Init
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error("GPUComputationRenderer init error:", error);
    }

    // --- Particle Rendering ---
    const geometry = this.createParticleGeometry();
    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uPointSize: { value: this.params.pointSize },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uColorA: { value: this.params.colorA },
        uColorB: { value: this.params.colorB },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, this.particleMaterial);
    this.points.frustumCulled = false;
  }

  private fillPositionTexture(texture: THREE.DataTexture): void {
    const data = texture.image.data as Float32Array;
    const radius = 2.0;

    for (let i = 0; i < data.length; i += 4) {
      // Uniform distribution in sphere (rejection sampling)
      let x: number, y: number, z: number;
      do {
        x = (Math.random() * 2 - 1) * radius;
        y = (Math.random() * 2 - 1) * radius;
        z = (Math.random() * 2 - 1) * radius;
      } while (x * x + y * y + z * z > radius * radius);

      data[i + 0] = x;
      data[i + 1] = y;
      data[i + 2] = z;
      data[i + 3] = 1.0;
    }
  }

  private fillVelocityTexture(texture: THREE.DataTexture): void {
    const data = texture.image.data as Float32Array;
    for (let i = 0; i < data.length; i += 4) {
      data[i + 0] = 0.0;
      data[i + 1] = 0.0;
      data[i + 2] = 0.0;
      data[i + 3] = 1.0;
    }
  }

  private createParticleGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const count = this.particleCount;

    // Dummy positions (real positions come from GPGPU texture)
    const positions = new Float32Array(count * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // UV coordinates for GPGPU texture lookup (0.5 offset for pixel center)
    const uvs = new Float32Array(count * 2);
    for (let y = 0; y < this.gpgpuSize; y++) {
      for (let x = 0; x < this.gpgpuSize; x++) {
        const i = y * this.gpgpuSize + x;
        uvs[i * 2 + 0] = (x + 0.5) / this.gpgpuSize;
        uvs[i * 2 + 1] = (y + 0.5) / this.gpgpuSize;
      }
    }
    geometry.setAttribute("aParticlesUv", new THREE.BufferAttribute(uvs, 2));

    return geometry;
  }

  /**
   * Update mouse position in 3D space
   */
  setMousePosition(position: THREE.Vector3): void {
    this.velocityVariable.material.uniforms.uMouse.value.copy(position);
  }

  /**
   * Sync params to GPU uniforms (call after modifying params via debug GUI)
   */
  syncParams(): void {
    const velU = this.velocityVariable.material.uniforms;
    velU.uCurlStrength.value = this.params.curlStrength;
    velU.uCurlFrequency.value = this.params.curlFrequency;
    velU.uDamping.value = this.params.damping;
    velU.uSpeed.value = this.params.speed;
    velU.uMouseStrength.value = this.params.mouseStrength;
    velU.uMouseRadius.value = this.params.mouseRadius;

    this.particleMaterial.uniforms.uPointSize.value = this.params.pointSize;
  }

  update(elapsed: number, deltaTime: number): void {
    // Clamp deltaTime to prevent explosion on tab refocus
    const dt = Math.min(deltaTime, 0.05);

    this.positionVariable.material.uniforms.uDeltaTime.value = dt;
    this.velocityVariable.material.uniforms.uTime.value = elapsed;
    this.velocityVariable.material.uniforms.uDeltaTime.value = dt;

    this.gpuCompute.compute();

    this.particleMaterial.uniforms.uPositionTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.particleMaterial.uniforms.uVelocityTexture.value =
      this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
  }

  setSize(width: number, height: number): void {
    this.particleMaterial.uniforms.uResolution.value.set(width, height);
  }

  dispose(): void {
    this.gpuCompute.dispose();
    this.points.geometry.dispose();
    this.particleMaterial.dispose();
  }
}
