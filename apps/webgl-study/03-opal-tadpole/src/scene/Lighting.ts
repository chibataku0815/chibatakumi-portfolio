/**
 * Lighting — 3-point studio lighting + HDRI + ContactShadow
 *
 * Classic product photography lighting:
 *   Key Light (SpotLight)     — main illumination, upper-right
 *   Fill Light (RectAreaLight) — soft fill from left (softbox)
 *   Rim Light (SpotLight)     — edge separation from behind
 */

import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

export class Lighting {
  keyLight: THREE.SpotLight;
  fillLight: THREE.RectAreaLight;
  rimLight: THREE.SpotLight;
  ambientLight: THREE.AmbientLight;
  shadowPlane: THREE.Mesh;

  /** Tuning parameters (accessible from debug GUI) */
  params = {
    keyIntensity: 8.0,
    keyPenumbra: 0.8,
    fillIntensity: 2.0,
    rimIntensity: 15.0,
    ambientIntensity: 0.15,
    shadowOpacity: 0.3,
    exposure: 1.0,
  };

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    // Initialize RectAreaLight uniforms (required)
    RectAreaLightUniformsLib.init();

    // -----------------------------------------------------------------
    // Key Light — SpotLight, upper-right, warm
    // -----------------------------------------------------------------
    this.keyLight = new THREE.SpotLight(
      0xfff5e6, // warm white
      this.params.keyIntensity,
      20,
      Math.PI / 5,
      this.params.keyPenumbra,
      1.5,
    );
    this.keyLight.position.set(4, 5, 3);
    this.keyLight.target.position.set(0, 0, 0);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = -0.001;
    this.keyLight.shadow.normalBias = 0.02;
    scene.add(this.keyLight);
    scene.add(this.keyLight.target);

    // -----------------------------------------------------------------
    // Fill Light — RectAreaLight (softbox), left side
    // -----------------------------------------------------------------
    this.fillLight = new THREE.RectAreaLight(
      0xe8f0ff, // cool fill
      this.params.fillIntensity,
      3,
      3,
    );
    this.fillLight.position.set(-4, 2, 1);
    this.fillLight.lookAt(0, 0, 0);
    scene.add(this.fillLight);

    // -----------------------------------------------------------------
    // Rim Light — SpotLight, behind, edge separation
    // -----------------------------------------------------------------
    this.rimLight = new THREE.SpotLight(
      0xddeeff,
      this.params.rimIntensity,
      15,
      Math.PI / 4,
      0.9,
      1.5,
    );
    this.rimLight.position.set(-2, 3, -4);
    this.rimLight.target.position.set(0, 0, 0);
    scene.add(this.rimLight);
    scene.add(this.rimLight.target);

    // -----------------------------------------------------------------
    // Ambient — subtle base fill
    // -----------------------------------------------------------------
    this.ambientLight = new THREE.AmbientLight(
      0x404050,
      this.params.ambientIntensity,
    );
    scene.add(this.ambientLight);

    // -----------------------------------------------------------------
    // Contact Shadow — ground plane
    // -----------------------------------------------------------------
    const shadowGeometry = new THREE.PlaneGeometry(10, 10);
    const shadowMaterial = new THREE.ShadowMaterial({
      opacity: this.params.shadowOpacity,
    });
    this.shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.2;
    this.shadowPlane.receiveShadow = true;
    scene.add(this.shadowPlane);
  }

  update(_progress: number): void {
    // TODO: Phase C — section-driven lighting transitions
  }

  dispose(): void {
    this.keyLight.dispose();
    this.fillLight.dispose();
    this.rimLight.dispose();
    this.ambientLight.dispose();
  }
}
