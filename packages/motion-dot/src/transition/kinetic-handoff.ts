import type { AttractorConfig, ParticleStateSnapshot } from "gpu-fx-presets";

export type TransitionPhase = "idle" | "playing" | "blending" | "handoff_pending";

export type TransitionParticipant = {
  readonly count: number;
  reset(): void;
  setAttractor?(config: AttractorConfig | null): void;
  exportState?(): ParticleStateSnapshot;
  exportStateAsync?(): Promise<ParticleStateSnapshot>;
  importState?(snapshot: ParticleStateSnapshot): void;
};

export interface TransitionScene {
  readonly name: string;
  readonly participant: TransitionParticipant | null;
}

export interface KineticHandoffController {
  readonly phase: TransitionPhase;
  readonly hudMessage: string;
  isActive(): boolean;
  start(sourceIdx: number): void;
  stop(): void;
  update(dt: number, time: number): void;
}

interface CreateKineticHandoffOptions {
  readonly scenes: readonly TransitionScene[];
  getCurrentIndex(): number;
  setCurrentIndex(nextIdx: number): void;
  onStateChange?: () => void;
}

type TransitionAnchorPolicy = {
  readonly anchor: { x: number; y: number };
  readonly orbitX?: number;
  readonly orbitY?: number;
  readonly wobbleX?: number;
  readonly wobbleY?: number;
  readonly driftX?: number;
  readonly driftY?: number;
  readonly startBlend?: number;
  readonly burstRadius?: number;
  readonly burstSpeed?: number;
  readonly burstScaleX?: number;
  readonly burstScaleY?: number;
};

const PLAY_DURATION = 5.5;
const BLEND_DURATION = 1.75;
const SETTLE_TIME = 1.25;
const ATTRACTOR_BLEND_BOOST = 1.8;

const DEFAULT_TRANSITION_ANCHOR_POLICY: TransitionAnchorPolicy = {
  anchor: { x: 0.5, y: 0.5 },
  orbitX: 0.7,
  orbitY: 0.55,
  wobbleX: 1.0,
  wobbleY: 1.0,
  driftX: 0,
  driftY: 0,
  startBlend: 0.32,
  burstRadius: 0.014,
  burstSpeed: 0.0022,
  burstScaleX: 1.0,
  burstScaleY: 1.0,
};

const TRANSITION_ANCHOR_POLICIES: Partial<Record<TransitionScene["name"], TransitionAnchorPolicy>> = {
  "River Flow": {
    anchor: { x: 0.05, y: 0.40 },
    orbitX: 0.42,
    orbitY: 0.30,
    wobbleX: 0.65,
    wobbleY: 0.85,
    driftX: 0.008,
    driftY: 0.012,
    startBlend: 0.42,
    burstRadius: 0.012,
    burstSpeed: 0.00215,
  },
  "River Delta": {
    anchor: { x: 0.09, y: 0.51 },
    orbitX: 0.48,
    orbitY: 0.40,
    wobbleX: 0.75,
    wobbleY: 1.15,
    driftX: 0.010,
    driftY: 0.006,
    startBlend: 0.40,
    burstRadius: 0.014,
    burstSpeed: 0.0022,
  },
  "Pendulum Wave": {
    anchor: { x: 0.5, y: 0.5 },
    orbitX: 10.0,
    orbitY: 0.16,
    wobbleX: 5.0,
    wobbleY: 0.55,
    driftX: 0,
    driftY: 0,
    startBlend: 0.30,
    burstRadius: 0.020,
    burstSpeed: 0.0023,
    burstScaleX: 1.8,
    burstScaleY: 0.45,
  },
  Chain: {
    anchor: { x: 0.5, y: 0.52 },
    orbitX: 8.5,
    orbitY: 0.60,
    wobbleX: 4.5,
    wobbleY: 0.90,
    driftX: 0,
    driftY: 0,
    startBlend: 0.28,
    burstRadius: 0.018,
    burstSpeed: 0.00225,
    burstScaleX: 1.55,
    burstScaleY: 0.60,
  },
};

function easeInCubic(t: number): number {
  return t * t * t;
}

function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

export function createKineticHandoff(options: CreateKineticHandoffOptions): KineticHandoffController {
  const { scenes, getCurrentIndex, setCurrentIndex, onStateChange } = options;

  let transitionPhase: TransitionPhase = "idle";
  let transitionSourceIdx = 0;
  let transitionTargetIdx = 0;
  let transitionTimer = 0;
  let pendingHandoffToken = 0;
  let lastTransitionAttractorTarget = { x: 0.5, y: 0.5 };
  let transitionHudMsg = "";

  function notifyChange(): void {
    onStateChange?.();
  }

  function nextSceneIdx(currentIdx: number): number {
    return (currentIdx + 1) % scenes.length;
  }

  function syncTransitionHudMessage(sourceIdx: number, targetIdx: number): void {
    transitionHudMsg = `[Transition] ${scenes[sourceIdx].name} → ${scenes[targetIdx].name}`;
  }

  function clearAttractor(scene: TransitionScene): void {
    scene.participant?.setAttractor?.(null);
  }

  function importIntoScene(scene: TransitionScene, snapshot: ParticleStateSnapshot): void {
    scene.participant?.importState?.(snapshot);
  }

  function resetScene(scene: TransitionScene): void {
    scene.participant?.reset();
  }

  function transitionAnchorPolicy(scene: TransitionScene): TransitionAnchorPolicy {
    return TRANSITION_ANCHOR_POLICIES[scene.name] ?? DEFAULT_TRANSITION_ANCHOR_POLICY;
  }

  function mapSnapshotIndex(index: number, fromCount: number, toCount: number): number {
    if (fromCount <= 1 || toCount <= 1) {
      return 0;
    }
    return Math.round((index / (toCount - 1)) * (fromCount - 1));
  }

  function shapeHandoffSnapshot(
    snapshot: ParticleStateSnapshot,
    targetScene: TransitionScene,
  ): ParticleStateSnapshot {
    if (snapshot.count <= 0) {
      return snapshot;
    }

    const policy = transitionAnchorPolicy(targetScene);
    const count = snapshot.count;
    const positions = new Float32Array(snapshot.positions);
    const velocities = new Float32Array(snapshot.velocities);
    const radii = new Float32Array(snapshot.radii);

    let centroidX = 0;
    let centroidY = 0;
    let speedSum = 0;
    for (let i = 0; i < count; i++) {
      const off = i * 2;
      centroidX += snapshot.positions[off + 0];
      centroidY += snapshot.positions[off + 1];
      speedSum += Math.hypot(snapshot.velocities[off + 0], snapshot.velocities[off + 1]);
    }
    centroidX /= count;
    centroidY /= count;
    const avgSpeed = speedSum / count;
    const burstRadius = policy.burstRadius ?? DEFAULT_TRANSITION_ANCHOR_POLICY.burstRadius ?? 0.010;
    const burstSpeed = policy.burstSpeed ?? DEFAULT_TRANSITION_ANCHOR_POLICY.burstSpeed ?? 0.0011;
    const burstScaleX = policy.burstScaleX ?? DEFAULT_TRANSITION_ANCHOR_POLICY.burstScaleX ?? 1;
    const burstScaleY = policy.burstScaleY ?? DEFAULT_TRANSITION_ANCHOR_POLICY.burstScaleY ?? 1;

    for (let i = 0; i < count; i++) {
      const off = i * 2;
      const dx = snapshot.positions[off + 0] - centroidX;
      const dy = snapshot.positions[off + 1] - centroidY;
      const dist = Math.hypot(dx, dy);
      const angle = dist > 0.0001 ? Math.atan2(dy, dx) : i * 2.399963229728653;
      const shellT = Math.sqrt((i + 0.5) / count);
      const radial = burstRadius * (0.30 + shellT * 0.70);
      const dirX = Math.cos(angle) * burstScaleX;
      const dirY = Math.sin(angle) * burstScaleY;
      const dirLen = Math.hypot(dirX, dirY) || 1;
      const outX = dirX / dirLen;
      const outY = dirY / dirLen;

      positions[off + 0] = lastTransitionAttractorTarget.x + outX * radial * burstScaleX;
      positions[off + 1] = lastTransitionAttractorTarget.y + outY * radial * burstScaleY;
      velocities[off + 0] = snapshot.velocities[off + 0] * 0.45 + outX * (burstSpeed + avgSpeed * 0.35);
      velocities[off + 1] = snapshot.velocities[off + 1] * 0.45 + outY * (burstSpeed + avgSpeed * 0.35);
    }

    return { positions, velocities, radii, count };
  }

  function approximateTargetStartSnapshot(
    snapshot: ParticleStateSnapshot,
    targetStartSnapshot: ParticleStateSnapshot | null,
    targetScene: TransitionScene,
  ): ParticleStateSnapshot {
    const burstSnapshot = shapeHandoffSnapshot(snapshot, targetScene);
    if (!targetStartSnapshot || targetStartSnapshot.count <= 0) {
      return burstSnapshot;
    }

    const policy = transitionAnchorPolicy(targetScene);
    const count = targetStartSnapshot.count;
    const positions = new Float32Array(count * 2);
    const velocities = new Float32Array(count * 2);
    const radii = new Float32Array(count);
    const startBlend = policy.startBlend ?? DEFAULT_TRANSITION_ANCHOR_POLICY.startBlend ?? 0.32;

    for (let i = 0; i < count; i++) {
      const dst = i * 2;
      const srcIdx = mapSnapshotIndex(i, burstSnapshot.count, count);
      const src = srcIdx * 2;

      const burstX = burstSnapshot.positions[src + 0];
      const burstY = burstSnapshot.positions[src + 1];
      const targetX = targetStartSnapshot.positions[dst + 0];
      const targetY = targetStartSnapshot.positions[dst + 1];
      const posX = burstX + (targetX - burstX) * startBlend;
      const posY = burstY + (targetY - burstY) * startBlend;
      const toTargetX = targetX - posX;
      const toTargetY = targetY - posY;
      const toTargetLen = Math.hypot(toTargetX, toTargetY) || 1;
      const approachSpeed = Math.min(0.0024, 0.0007 + toTargetLen * 0.012);

      positions[dst + 0] = posX;
      positions[dst + 1] = posY;
      velocities[dst + 0] =
        burstSnapshot.velocities[src + 0] * 0.38
        + targetStartSnapshot.velocities[dst + 0] * 0.16
        + (toTargetX / toTargetLen) * approachSpeed;
      velocities[dst + 1] =
        burstSnapshot.velocities[src + 1] * 0.38
        + targetStartSnapshot.velocities[dst + 1] * 0.16
        + (toTargetY / toTargetLen) * approachSpeed;
      radii[i] = burstSnapshot.radii[srcIdx] + (targetStartSnapshot.radii[i] - burstSnapshot.radii[srcIdx]) * 0.65;
    }

    return { positions, velocities, radii, count };
  }

  async function captureSceneStartSnapshot(scene: TransitionScene): Promise<ParticleStateSnapshot | null> {
    const participant = scene.participant;
    if (!participant) {
      return null;
    }

    clearAttractor(scene);
    resetScene(scene);
    if (participant.exportState) {
      return participant.exportState();
    }
    if (participant.exportStateAsync) {
      return participant.exportStateAsync();
    }
    return null;
  }

  function finishHandoff(snapshot: ParticleStateSnapshot): void {
    const sourceScene = scenes[transitionSourceIdx];
    const targetScene = scenes[transitionTargetIdx];
    importIntoScene(targetScene, snapshot);
    resetScene(sourceScene);
    setCurrentIndex(transitionTargetIdx);
    start(transitionTargetIdx);
  }

  function beginHandoff(sourceSnapshotPromise: Promise<ParticleStateSnapshot>): void {
    transitionPhase = "handoff_pending";
    transitionTimer = 0;
    notifyChange();
    const handoffToken = ++pendingHandoffToken;
    const sourceIdx = transitionSourceIdx;
    const targetIdx = transitionTargetIdx;

    void sourceSnapshotPromise
      .then(async (sourceSnapshot) => {
        if (
          handoffToken !== pendingHandoffToken
          || transitionPhase !== "handoff_pending"
          || transitionSourceIdx !== sourceIdx
          || getCurrentIndex() !== sourceIdx
        ) {
          return;
        }

        const targetScene = scenes[targetIdx];
        const targetStartSnapshot = await captureSceneStartSnapshot(targetScene);
        if (
          handoffToken !== pendingHandoffToken
          || transitionPhase !== "handoff_pending"
          || transitionSourceIdx !== sourceIdx
          || getCurrentIndex() !== sourceIdx
        ) {
          return;
        }

        finishHandoff(approximateTargetStartSnapshot(sourceSnapshot, targetStartSnapshot, targetScene));
        notifyChange();
      })
      .catch((error) => {
        console.error("Handoff preparation failed", error);
        if (handoffToken === pendingHandoffToken) {
          stop();
        }
      });
  }

  function transitionAttractorTarget(
    targetScene: TransitionScene,
    time: number,
    blend: number,
    phaseT: number,
  ): { x: number; y: number } {
    const policy = transitionAnchorPolicy(targetScene);
    const collapseT = clamp01((phaseT - 0.68) / 0.32);
    const orbit = (0.004 + blend * 0.008) * (1 - easeInCubic(collapseT) * 0.92);
    const wobble = (0.0015 + blend * 0.001) * (1 - easeInCubic(collapseT) * 0.97);
    const x = policy.anchor.x
      + Math.cos(time * 0.9) * orbit * (policy.orbitX ?? DEFAULT_TRANSITION_ANCHOR_POLICY.orbitX ?? 0)
      + Math.sin(time * 0.37 + 0.6) * wobble * (policy.wobbleX ?? DEFAULT_TRANSITION_ANCHOR_POLICY.wobbleX ?? 0)
      + (policy.driftX ?? 0) * blend;
    const y = policy.anchor.y
      + Math.sin(time * 0.75 + 0.3) * orbit * (policy.orbitY ?? DEFAULT_TRANSITION_ANCHOR_POLICY.orbitY ?? 0)
      + Math.cos(time * 0.43 + 1.1) * wobble * (policy.wobbleY ?? DEFAULT_TRANSITION_ANCHOR_POLICY.wobbleY ?? 0)
      + (policy.driftY ?? 0) * blend;
    return {
      x: Math.min(Math.max(x, 0.03), 0.97),
      y: Math.min(Math.max(y, 0.05), 0.95),
    };
  }

  function start(sourceIdx: number): void {
    transitionSourceIdx = sourceIdx;
    transitionTargetIdx = nextSceneIdx(sourceIdx);
    transitionPhase = "playing";
    transitionTimer = 0;
    lastTransitionAttractorTarget = { ...transitionAnchorPolicy(scenes[transitionTargetIdx]).anchor };
    syncTransitionHudMessage(transitionSourceIdx, transitionTargetIdx);
    notifyChange();
  }

  function stop(): void {
    clearAttractor(scenes[transitionSourceIdx] ?? scenes[getCurrentIndex()]);
    pendingHandoffToken++;
    transitionPhase = "idle";
    transitionTimer = 0;
    transitionHudMsg = "";
    notifyChange();
  }

  function update(dt: number, time: number): void {
    if (transitionPhase === "idle") {
      return;
    }

    transitionTimer += dt;
    const sourceScene = scenes[transitionSourceIdx];
    const participant = sourceScene.participant;

    if (transitionPhase === "playing") {
      clearAttractor(sourceScene);
      if (transitionTimer >= PLAY_DURATION) {
        transitionPhase = "blending";
        transitionTimer = 0;
        notifyChange();
      }
      return;
    }

    if (transitionPhase === "blending") {
      const rawT = transitionTimer / BLEND_DURATION;
      const blend = rawT >= 1 ? 1 : easeInCubic(rawT);
      const attractorBlend = rawT >= 1 ? 1 : Math.min(1, blend + rawT * ATTRACTOR_BLEND_BOOST);
      const phaseT = clamp01(transitionTimer / (BLEND_DURATION + SETTLE_TIME));
      const attractTarget = transitionAttractorTarget(scenes[transitionTargetIdx], time, blend, phaseT);
      lastTransitionAttractorTarget = attractTarget;
      participant?.setAttractor?.({ x: attractTarget.x, y: attractTarget.y, blend: attractorBlend });

      if (transitionTimer >= BLEND_DURATION + SETTLE_TIME) {
        clearAttractor(sourceScene);

        if (participant?.exportStateAsync) {
          beginHandoff(participant.exportStateAsync());
        } else if (participant?.exportState) {
          beginHandoff(Promise.resolve(participant.exportState()));
        } else {
          stop();
        }
      }
      return;
    }

    clearAttractor(sourceScene);
  }

  return {
    get phase() {
      return transitionPhase;
    },
    get hudMessage() {
      return transitionHudMsg;
    },
    isActive() {
      return transitionPhase !== "idle";
    },
    start,
    stop,
    update,
  };
}
