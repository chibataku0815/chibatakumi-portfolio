/**
 * CameraAnimation --- GSAP timeline-driven camera keyframes
 *
 * Unlike 02-atmos (CatmullRomCurve3 spline), this uses discrete
 * GSAP `.to()` chain for product viewer camera shots.
 * Each shot is a specific position + lookAt target.
 *
 * ### 5-shot camera layout
 * ```
 * Shot 1 (hero)       : 3/4 view, slight orbit
 * Shot 2 (design)     : Front -> angled, texture emphasis
 * Shot 3 (detail)     : Zoom into specific feature
 * Shot 4 (experience) : Handheld/usage angle
 * Shot 5 (cta)        : Pull back, full product view
 * ```
 */

import * as THREE from "three";
import gsap from "gsap";

/** Camera keyframe definition */
interface CameraKeyframe {
  /** Section ID (matches data-section attribute) */
  id: string;
  /** Camera position */
  position: THREE.Vector3;
  /** Camera lookAt target */
  lookAt: THREE.Vector3;
  /** Camera FOV (optional override) */
  fov?: number;
}

/** 5-shot keyframe definitions. */
const KEYFRAMES: CameraKeyframe[] = [
  {
    // Shot 1: hero - 3/4 view from upper right
    id: "hero",
    position: new THREE.Vector3(3, 2, 4),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 35,
  },
  {
    // Shot 2: design - front-angled view
    id: "design",
    position: new THREE.Vector3(-1.5, 0.5, 3),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 40,
  },
  {
    // Shot 3: detail - close-up zoom
    id: "detail",
    position: new THREE.Vector3(0.5, 0.3, 1.5),
    lookAt: new THREE.Vector3(0, 0.1, 0),
    fov: 30,
  },
  {
    // Shot 4: experience - handheld angle
    id: "experience",
    position: new THREE.Vector3(-2, 1, 2.5),
    lookAt: new THREE.Vector3(0, -0.2, 0),
    fov: 38,
  },
  {
    // Shot 5: cta - pulled-back full view
    id: "cta",
    position: new THREE.Vector3(0, 1.5, 5),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 35,
  },
];

export class CameraAnimation {
  private camera: THREE.PerspectiveCamera;
  private timeline: gsap.core.Timeline;
  private lookAtTarget: THREE.Vector3;

  /** Current interpolation state (mutated by GSAP) */
  private state = {
    posX: KEYFRAMES[0]!.position.x,
    posY: KEYFRAMES[0]!.position.y,
    posZ: KEYFRAMES[0]!.position.z,
    lookX: KEYFRAMES[0]!.lookAt.x,
    lookY: KEYFRAMES[0]!.lookAt.y,
    lookZ: KEYFRAMES[0]!.lookAt.z,
    fov: KEYFRAMES[0]!.fov ?? 35,
  };

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.lookAtTarget = new THREE.Vector3();

    // Set initial camera state
    this.camera.position.set(this.state.posX, this.state.posY, this.state.posZ);
    this.camera.fov = this.state.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(KEYFRAMES[0]!.lookAt);

    this.timeline = this.buildTimeline();
  }

  /**
   * Build the GSAP timeline with `.to()` chain.
   *
   * Each keyframe transition uses power2.inOut for smooth camera movement.
   * The timeline is paused and controlled by scroll progress.
   */
  private buildTimeline() {
    const tl = gsap.timeline({ paused: true });

    for (let i = 1; i < KEYFRAMES.length; i++) {
      const kf = KEYFRAMES[i]!;
      const duration = 1; // Normalized - each section gets equal duration

      tl.to(
        this.state,
        {
          posX: kf.position.x,
          posY: kf.position.y,
          posZ: kf.position.z,
          lookX: kf.lookAt.x,
          lookY: kf.lookAt.y,
          lookZ: kf.lookAt.z,
          fov: kf.fov ?? 35,
          duration,
          ease: "power2.inOut",
        },
      );
    }

    return tl;
  }

  /**
   * Update camera from current interpolation state.
   *
   * Called every frame with current scroll progress (0-1).
   * Hero section (progress 0-0.2): camera stays at Shot 1.
   * Scroll 0.2-1.0 maps to timeline 0-1 (Shot 1 -> Shot 5).
   */
  update(progress: number): void {
    const tlProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.8));
    this.timeline.progress(tlProgress);

    // Apply interpolated state to camera
    this.camera.position.set(this.state.posX, this.state.posY, this.state.posZ);

    this.lookAtTarget.set(this.state.lookX, this.state.lookY, this.state.lookZ);
    this.camera.lookAt(this.lookAtTarget);

    if (this.camera.fov !== this.state.fov) {
      this.camera.fov = this.state.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Get keyframe definitions (for debug GUI) */
  getKeyframes(): readonly CameraKeyframe[] {
    return KEYFRAMES;
  }
}
