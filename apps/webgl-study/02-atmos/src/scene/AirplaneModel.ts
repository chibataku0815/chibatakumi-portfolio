/**
 * AirplaneModel --- glTF 飛行機モデルを CameraPath 上に配置
 *
 * scroll progress + offset でカメラより少し先を飛行し、
 * 接線方向に lookAt + bank 角を適用する。
 * params は lil-gui から読み書きされる想定。
 */

import * as THREE from "three";
import airplaneUrl from "../../../assets/lowpoly-airplane.glb?url";
import { loadGLTF } from "../../../shared/gltf-loader";
import type { CameraPath } from "./CameraPath";

export class AirplaneModel {
  private group: THREE.Group;
  private model: THREE.Group;

  /** lil-gui で読み書きされるチューニングパラメータ */
  params = {
    scale: 0.5,
    offset: 0.05,
    bankStrength: 0.2,
    wobble: false,
    wobbleAmplitude: 0.02,
  };

  private constructor(group: THREE.Group, model: THREE.Group) {
    this.group = group;
    this.model = model;
  }

  /** glTF をロードし、Box3 でセンタリングしてシーンに追加 */
  static async create(scene: THREE.Scene): Promise<AirplaneModel> {
    const gltf = await loadGLTF(airplaneUrl);
    const model = gltf.scene;

    // Auto-center using bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // World transform wrapper
    const group = new THREE.Group();
    group.add(model);
    scene.add(group);

    return new AirplaneModel(group, model);
  }

  /**
   * 毎フレーム呼び出し --- progress に応じてパス上の位置・向きを更新
   *
   * 1. progress + offset でカメラより少し先の位置を取得
   * 2. 接線方向に lookAt で向きを合わせる
   * 3. lookAt 後に bank 角を上書き（lookAt が rotation.z をリセットするため）
   * 4. wobble 有効時は Y 軸に sin 揺れを加算
   */
  update(progress: number, cameraPath: CameraPath, elapsed: number): void {
    const ap = Math.min(progress + this.params.offset, 0.999);

    // Position on path
    this.group.position.copy(cameraPath.getPosition(ap));

    // Orientation: look along tangent
    const tangent = cameraPath.getTangent(ap);
    const target = this.group.position.clone().add(tangent);
    this.group.lookAt(target);

    // Bank angle (must be after lookAt)
    this.group.rotation.z = -tangent.x * this.params.bankStrength;

    // Scale
    this.group.scale.setScalar(this.params.scale);

    // Optional wobble
    if (this.params.wobble) {
      this.group.position.y +=
        Math.sin(elapsed * 0.7) * this.params.wobbleAmplitude;
    }
  }

  /** ジオメトリ・マテリアルを破棄し、シーンから除去 */
  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.group.removeFromParent();
  }
}
