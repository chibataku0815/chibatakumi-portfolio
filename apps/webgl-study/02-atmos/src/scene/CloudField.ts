/**
 * CloudField -- InstancedMesh based cloud clusters along the camera path.
 *
 * 12 clusters of oblate spheres are scattered around the ascent/flight
 * sections (progress 0.15-0.65). A single InstancedMesh keeps the draw
 * call count to 1 regardless of instance count.
 */

import * as THREE from "three";
import { colors } from "../../../shared/theme";
import type { CameraPath } from "./CameraPath";

const MAX_INSTANCES = 75;

export class CloudField {
  private mesh: THREE.InstancedMesh;

  params = {
    opacity: 0.25,
  };

  constructor(scene: THREE.Scene, cameraPath: CameraPath) {
    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: colors.neutral[5].clone(),
      transparent: true,
      opacity: this.params.opacity,
      depthWrite: false,
      roughness: 1,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
    this.mesh.renderOrder = 1;

    this.generateClusters(cameraPath);
    scene.add(this.mesh);
  }

  /** Scatter 12 clusters of 3-5 oblate spheres along the path. */
  private generateClusters(cameraPath: CameraPath): void {
    const dummy = new THREE.Object3D();
    let instanceIndex = 0;

    const CLUSTER_COUNT = 12;

    for (let c = 0; c < CLUSTER_COUNT; c++) {
      // Sample a random progress in the ascent/flight range
      const clusterProgress = 0.15 + Math.random() * 0.5;
      const base = cameraPath.getPosition(clusterProgress);

      // Perpendicular offset from path
      const offsetX = (Math.random() * 12 + 3) * (Math.random() < 0.5 ? -1 : 1);
      const offsetY = (Math.random() * 6 + 2) * (Math.random() < 0.5 ? -1 : 1);

      const sphereCount = 3 + Math.floor(Math.random() * 3); // 3-5

      for (let s = 0; s < sphereCount; s++) {
        if (instanceIndex >= MAX_INSTANCES) break;

        const x = base.x + offsetX + (Math.random() - 0.5) * 4;
        const y = base.y + offsetY + (Math.random() - 0.5) * 4;
        const z = base.z + (Math.random() - 0.5) * 4;

        const scale = 0.5 + Math.random() * 2.0;

        dummy.position.set(x, y, z);
        dummy.scale.set(scale, scale * 0.6, scale);
        dummy.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          0,
        );
        dummy.updateMatrix();
        this.mesh.setMatrixAt(instanceIndex, dummy.matrix);
        instanceIndex++;
      }

      if (instanceIndex >= MAX_INSTANCES) break;
    }

    this.mesh.count = instanceIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Sync material opacity from params for lil-gui reactivity. */
  update(_progress: number): void {
    (this.mesh.material as THREE.MeshStandardMaterial).opacity =
      this.params.opacity;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.MeshStandardMaterial).dispose();
    this.mesh.removeFromParent();
  }
}
