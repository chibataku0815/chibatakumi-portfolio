import * as THREE from "three";
import { neutral, amber } from "@shared/palette";

/**
 * 02-atmos シーン環境設定。
 * Atmos サイト風の大気感ある暗いシーン。
 *
 * カラーは palette.ts の Radix 12段階スケールから参照する:
 * - neutral[1] : シーン背景
 * - neutral[2] : fog 遠景色
 * - neutral[4] : 環境光色
 * - amber[9]   : 主光源（アクセントオレンジ）
 * - amber[10]  : 補助スポット光
 * - neutral[7] : リム光（エッジ光）
 */
export class Environment {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private animationId: number | null = null;

  // ライト
  private ambientLight!: THREE.AmbientLight;
  private pointLight!: THREE.PointLight;
  private rimLight!: THREE.DirectionalLight;
  private fillLight!: THREE.PointLight;

  // メッシュ
  private sphere!: THREE.Mesh;
  private particles!: THREE.Points;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    // Step 1: シーン背景（最も暗い）
    this.scene.background = neutral[1];
    // Step 2: fog 遠景色
    this.scene.fog = new THREE.FogExp2(neutral[2].getHex(), 0.08);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 4);

    this.setupLights();
    this.setupGeometry();
    this.setupParticles();

    window.addEventListener("resize", this.onResize);
  }

  private setupLights(): void {
    // Step 4: 環境光（低輝度で全体を染める）
    this.ambientLight = new THREE.AmbientLight(neutral[4].getHex(), 0.6);
    this.scene.add(this.ambientLight);

    // Step 9: 主光源（amber — ポートフォリオ accent と統一）
    this.pointLight = new THREE.PointLight(amber[9].getHex(), 3.0, 12);
    this.pointLight.position.set(2, 2, 3);
    this.scene.add(this.pointLight);

    // Step 10: 補助スポット（amber hover tone）
    this.fillLight = new THREE.PointLight(amber[10].getHex(), 1.0, 8);
    this.fillLight.position.set(-3, -1, 2);
    this.scene.add(this.fillLight);

    // Step 7: リム光（エッジ光 / ハイライト）
    this.rimLight = new THREE.DirectionalLight(neutral[7].getHex(), 1.5);
    this.rimLight.position.set(-2, 3, -3);
    this.scene.add(this.rimLight);
  }

  private setupGeometry(): void {
    const geo = new THREE.SphereGeometry(1, 64, 64);

    // Step 5 → Step 8 のグラデーション質感をマテリアルで表現
    const mat = new THREE.MeshStandardMaterial({
      color: neutral[5],
      emissive: neutral[3],
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6,
    });

    this.sphere = new THREE.Mesh(geo, mat);
    this.scene.add(this.sphere);
  }

  private setupParticles(): void {
    const count = 800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Step 11: 低コントラスト — 大気感のある粒子色
    const mat = new THREE.PointsMaterial({
      color: neutral[11],
      size: 0.03,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  start(): void {
    const clock = new THREE.Clock();

    const tick = (): void => {
      this.animationId = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();

      // 球体の緩やかな回転
      this.sphere.rotation.y = elapsed * 0.1;
      this.sphere.rotation.x = elapsed * 0.05;

      // パーティクルの微細な漂い
      this.particles.rotation.y = elapsed * 0.02;

      // 主光源の軌道（大気感の演出）
      this.pointLight.position.x = Math.sin(elapsed * 0.3) * 3;
      this.pointLight.position.y = Math.cos(elapsed * 0.2) * 2;

      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
  }
}
