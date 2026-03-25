/**
 * CameraPath — CatmullRomCurve3 ベースのカメラパス管理
 *
 * scroll progress (0-1) を受け取り、カメラの位置と向きを返す。
 * 制御点は lil-gui でリアルタイム調整可能。
 *
 * ### カメラパスの仕組み
 * ```
 * P0 ──── P1 ──── P2 ──── P3 ──── P4 ──── P5
 * intro   ascent   flight   detail   outro   end
 * (0.0)   (0.2)   (0.4)    (0.6)    (0.8)   (1.0)
 * ```
 * CatmullRomCurve3 はこれらの制御点を通る滑らかなスプラインを生成する。
 */

import * as THREE from "three";

/** 制御点のデフォルト座標（DESIGN.md Section 3 準拠） */
const DEFAULT_POINTS: [number, number, number][] = [
  [0, 0, 0],       // P0: intro 開始
  [3, 2, -15],     // P1: intro → ascent
  [-2, 5, -30],    // P2: ascent → flight
  [4, 8, -50],     // P3: flight → detail
  [-1, 12, -70],   // P4: detail → outro
  [0, 15, -90],    // P5: outro 終了
];

/** カメラが接線方向のどれだけ先を見るか */
const LOOK_AHEAD_DISTANCE = 5.0;

/** バンク角の強さ（接線の X 成分に掛ける係数） */
const BANK_STRENGTH = 0.15;

export class CameraPath {
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];

  /** デバッグ用: パスを可視化する TubeGeometry */
  debugMesh: THREE.Mesh | null = null;

  constructor() {
    this.points = DEFAULT_POINTS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );
    this.curve = new THREE.CatmullRomCurve3(
      this.points,
      false,        // closed = false
      "catmullrom",
      0.5,          // tension
    );
  }

  /** カーブを再構築（制御点変更時に呼ぶ） */
  rebuild(): void {
    this.curve = new THREE.CatmullRomCurve3(
      this.points,
      false,
      "catmullrom",
      0.5,
    );
    this.updateDebugMesh();
  }

  /** progress (0-1) でのカメラ位置を取得 */
  getPosition(progress: number): THREE.Vector3 {
    return this.curve.getPointAt(Math.min(Math.max(progress, 0), 1));
  }

  /** progress (0-1) での接線ベクトルを取得 */
  getTangent(progress: number): THREE.Vector3 {
    return this.curve.getTangentAt(Math.min(Math.max(progress, 0), 1));
  }

  /**
   * progress に基づいてカメラの位置・向き・バンク角を更新
   *
   * ### データフロー
   * ```
   * progress → getPointAt → camera.position
   * progress → getTangentAt → lookAt target (position + tangent * distance)
   * tangent.x → camera.rotation.z (bank)
   * ```
   */
  applyToCamera(camera: THREE.PerspectiveCamera, progress: number): void {
    const position = this.getPosition(progress);
    const tangent = this.getTangent(progress);

    // カメラ位置
    camera.position.copy(position);

    // LookAt: 現在位置 + 接線方向 × 先読み距離
    const lookTarget = position
      .clone()
      .add(tangent.clone().multiplyScalar(LOOK_AHEAD_DISTANCE));
    camera.lookAt(lookTarget);

    // バンク角: 旋回時にカメラを傾ける（飛行機らしさ）
    camera.rotation.z = -tangent.x * BANK_STRENGTH;
  }

  /** デバッグ: パスを TubeGeometry で可視化 */
  createDebugMesh(): THREE.Mesh {
    const geometry = new THREE.TubeGeometry(this.curve, 200, 0.05, 8, false);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    this.debugMesh = new THREE.Mesh(geometry, material);
    return this.debugMesh;
  }

  /** デバッグメッシュのジオメトリを更新 */
  private updateDebugMesh(): void {
    if (!this.debugMesh) return;
    this.debugMesh.geometry.dispose();
    this.debugMesh.geometry = new THREE.TubeGeometry(
      this.curve,
      200,
      0.05,
      8,
      false,
    );
  }
}
