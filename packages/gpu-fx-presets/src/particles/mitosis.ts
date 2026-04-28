import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

const MAX_PARTICLES = 40;
const GROW_DUR = 2.0;
const ELONGATE_DUR = 2.5;
const DRIFT_DUR = 3.0;
const PHASE_DUR = GROW_DUR + ELONGATE_DUR + DRIFT_DUR;
const RESET_PAUSE = 3.0;
const MAX_GEN = 4;
const INITIAL_RADIUS = 0.035;
const CHILD_SCALE = 0.72;
const REPEL_STRENGTH = 0.000005;
const REPEL_RADIUS = 0.07;
const DRAG = 0.993;
const ATTRACT_K = 0.0015;
const POST_IMPORT_FRAMES = 18;
const IMPORT_KICK = 0.00006;
const MAX_IMPORT_SPEED = 0.004;
const ONSET_BURST = 0.004;
const TAIL_RADIUS = 0.001;

interface PhaseAudioResponse {
  growthMul: number;
  separationMul: number;
}

interface Cell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  splitAngle: number;
  generation: number;
}

function smoothPhase(t: number): number {
  return t * t * (3 - 2 * t);
}

function getPhaseAudioResponse(phaseInGen: number, bass: number): PhaseAudioResponse {
  if (phaseInGen < GROW_DUR) {
    const growT = smoothPhase(phaseInGen / GROW_DUR);
    return {
      growthMul: 1 + bass * (0.60 - growT * 0.15),
      separationMul: 1,
    };
  }

  if (phaseInGen < GROW_DUR + ELONGATE_DUR) {
    const elongateT = smoothPhase((phaseInGen - GROW_DUR) / ELONGATE_DUR);
    return {
      growthMul: 1 + bass * (0.34 - elongateT * 0.14),
      separationMul: 1 + bass * (0.18 + elongateT * 0.18),
    };
  }

  return {
    growthMul: 1 + bass * 0.18,
    separationMul: 1 + bass * 0.42,
  };
}

export function createMitosisParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "mitosis-particles", MAX_PARTICLES);
  const data = createParticleArray(MAX_PARTICLES);

  let cells: Cell[] = [];
  let genTimer = 0;
  let currentGen = 0;
  let resetTimer = 0;
  let isResetting = false;
  let activeCount = 1;
  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;
  let postImportCenterX = 0.5;
  let postImportCenterY = 0.5;

  function initCells(): void {
    cells = [{
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: 0,
      radius: INITIAL_RADIUS,
      phase: 0,
      splitAngle: Math.random() * Math.PI * 2,
      generation: 0,
    }];
    currentGen = 0;
    genTimer = 0;
    resetTimer = 0;
    isResetting = false;
  }

  function radiusForGen(gen: number): number {
    return INITIAL_RADIUS * Math.pow(CHILD_SCALE, gen);
  }

  function simulate(dt: number): void {
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;

    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const repelMul = audioBands ? 1 + audioBands.energy * 4 : 1;
    const mitosisDrag = audioBands ? DRAG - audioBands.energy * 0.005 : DRAG;

    for (let i = 0; i < cells.length; i++) {
      const a = cells[i];
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < cells.length; j++) {
        if (i === j) {
          continue;
        }
        const b = cells[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const force = (REPEL_STRENGTH * repelMul * sceneMix) / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      if (a.x < 0.08) fx += 0.00001 * sceneMix;
      if (a.x > 0.92) fx -= 0.00001 * sceneMix;
      if (a.y < 0.08) fy += 0.00001 * sceneMix;
      if (a.y > 0.92) fy -= 0.00001 * sceneMix;

      if (attractor && attractMix > 0) {
        fx += (attractor.x - a.x) * ATTRACT_K * attractMix;
        fy += (attractor.y - a.y) * ATTRACT_K * attractMix;
      }

      if (postImportFrames > 0) {
        const releaseMix = postImportFrames / POST_IMPORT_FRAMES;
        const dx = a.x - postImportCenterX;
        const dy = a.y - postImportCenterY;
        const dist = Math.hypot(dx, dy) || 1;
        const kick = IMPORT_KICK * releaseMix;
        fx += (dx / dist) * kick;
        fy += (dy / dist) * kick;
      }

      a.vx = (a.vx + fx) * mitosisDrag;
      a.vy = (a.vy + fy) * mitosisDrag;

      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const bx = a.x - 0.5;
        const by = a.y - 0.5;
        const bd = Math.hypot(bx, by) || 0.01;
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        a.vx += (bx / bd) * burst;
        a.vy += (by / bd) * burst;
      }

      const speed = Math.hypot(a.vx, a.vy);
      const maxSpeed = MAX_IMPORT_SPEED * speedScale;
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        a.vx *= scale;
        a.vy *= scale;
      }
      a.x += a.vx * speedScale;
      a.y += a.vy * speedScale;
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }
  }

  function writeBuffer(time: number): void {
    const phaseInGen = genTimer;
    const bass = audioBands?.bass ?? 0;
    const phaseAudio = getPhaseAudioResponse(phaseInGen, bass);
    const intensity = audioBands?.intensity;
    const hasIntensity = intensity != null;
    const visibleCount = hasIntensity
      ? Math.max(1, Math.min(activeCount, Math.ceil(activeCount * clamp(0.3 + intensity * 0.7, 0.3, 1.0))))
      : activeCount;
    let particleIndex = 0;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const breathe = 1.0 + Math.sin(time * 1.2 + cell.phase * 6.28) * 0.06;

      let separation = 0;
      let radiusScale = 1.0;

      if (phaseInGen < GROW_DUR) {
        const t = phaseInGen / GROW_DUR;
        const smoothT = smoothPhase(t);
        radiusScale = 1.0 + smoothT * 0.4;
      } else if (phaseInGen < GROW_DUR + ELONGATE_DUR) {
        const t = (phaseInGen - GROW_DUR) / ELONGATE_DUR;
        const smoothT = smoothPhase(t);
        separation = smoothT * cell.radius * 3.0;
        radiusScale = 1.4 - smoothT * 0.4;
      } else {
        separation = cell.radius * 3.0;
      }

      separation *= phaseAudio.separationMul;
      const radius = cell.radius * radiusScale * breathe * phaseAudio.growthMul;
      const dx = Math.cos(cell.splitAngle) * separation * 0.5;
      const dy = Math.sin(cell.splitAngle) * separation * 0.5;

      writeParticle(
        data,
        particleIndex,
        cell.x + dx,
        cell.y + dy,
        particleIndex < visibleCount ? radius : TAIL_RADIUS,
        cell.phase,
        0.0,
      );
      particleIndex++;
      writeParticle(
        data,
        particleIndex,
        cell.x - dx,
        cell.y - dy,
        particleIndex < visibleCount ? radius : TAIL_RADIUS,
        cell.phase + 0.5,
        0.0,
      );
      particleIndex++;
    }

    for (let i = particleIndex; i < MAX_PARTICLES; i++) {
      writeParticle(data, i, -1, -1, 0, 0, 0, 0, 0, 0);
    }

    activeCount = particleIndex;
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function exportState(): ParticleStateSnapshot {
    const phaseInGen = genTimer;
    let particleIndex = 0;
    const positions = new Float32Array(MAX_PARTICLES * 2);
    const velocities = new Float32Array(MAX_PARTICLES * 2);
    const radii = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      let separation = 0;
      let radiusScale = 1.0;

      if (phaseInGen < GROW_DUR) {
        const t = phaseInGen / GROW_DUR;
        const smoothT = smoothPhase(t);
        radiusScale = 1.0 + smoothT * 0.4;
      } else if (phaseInGen < GROW_DUR + ELONGATE_DUR) {
        const t = (phaseInGen - GROW_DUR) / ELONGATE_DUR;
        const smoothT = smoothPhase(t);
        separation = smoothT * cell.radius * 3.0;
        radiusScale = 1.4 - smoothT * 0.4;
      } else {
        separation = cell.radius * 3.0;
      }

      const radius = cell.radius * radiusScale;
      const dx = Math.cos(cell.splitAngle) * separation * 0.5;
      const dy = Math.sin(cell.splitAngle) * separation * 0.5;

      positions[particleIndex * 2] = cell.x + dx;
      positions[particleIndex * 2 + 1] = cell.y + dy;
      velocities[particleIndex * 2] = cell.vx;
      velocities[particleIndex * 2 + 1] = cell.vy;
      radii[particleIndex] = radius;
      particleIndex++;

      positions[particleIndex * 2] = cell.x - dx;
      positions[particleIndex * 2 + 1] = cell.y - dy;
      velocities[particleIndex * 2] = cell.vx;
      velocities[particleIndex * 2 + 1] = cell.vy;
      radii[particleIndex] = radius;
      particleIndex++;
    }

    return { positions, velocities, radii, count: particleIndex };
  }

  function importState(snapshot: ParticleStateSnapshot): void {
    const cellCount = Math.max(1, Math.min(Math.ceil(snapshot.count / 2), MAX_PARTICLES / 2));
    const nextCells: Cell[] = [];
    let cx = 0;
    let cy = 0;
    let speedSum = 0;

    for (let i = 0; i < cellCount; i++) {
      const i0 = Math.min(i * 2, Math.max(snapshot.count - 1, 0));
      const i1 = Math.min(i0 + 1, Math.max(snapshot.count - 1, 0));
      const x0 = snapshot.positions[i0 * 2] ?? 0.5;
      const y0 = snapshot.positions[i0 * 2 + 1] ?? 0.5;
      const x1 = snapshot.positions[i1 * 2] ?? x0;
      const y1 = snapshot.positions[i1 * 2 + 1] ?? y0;
      const vx0 = snapshot.velocities[i0 * 2] ?? 0;
      const vy0 = snapshot.velocities[i0 * 2 + 1] ?? 0;
      const vx1 = snapshot.velocities[i1 * 2] ?? vx0;
      const vy1 = snapshot.velocities[i1 * 2 + 1] ?? vy0;
      const radius0 = snapshot.radii[i0] ?? INITIAL_RADIUS;
      const radius1 = snapshot.radii[i1] ?? radius0;
      const x = (x0 + x1) * 0.5;
      const y = (y0 + y1) * 0.5;
      const vx = (vx0 + vx1) * 0.5;
      const vy = (vy0 + vy1) * 0.5;
      const radius = Math.max(0.008, (radius0 + radius1) * 0.5);
      const speed = Math.hypot(vx, vy);

      nextCells.push({
        x,
        y,
        vx: clamp(vx, -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED),
        vy: clamp(vy, -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED),
        radius,
        phase: Math.random(),
        splitAngle: speed > 0.0001 ? Math.atan2(vy, vx) : Math.random() * Math.PI * 2,
        generation: 0,
      });

      cx += x;
      cy += y;
      speedSum += speed;
    }

    cells = nextCells;
    currentGen = 0;
    genTimer = 0;
    resetTimer = 0;
    isResetting = false;
    activeCount = cellCount * 2;

    cx = cellCount > 0 ? cx / cellCount : 0.5;
    cy = cellCount > 0 ? cy / cellCount : 0.5;

    const avgSpeed = speedSum / Math.max(cellCount, 1);
    if (avgSpeed < 0.00025) {
      for (const cell of cells) {
        const dx = cell.x - cx;
        const dy = cell.y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = dist > 0.001 ? Math.atan2(dy, dx) : cell.splitAngle;
        const kick = IMPORT_KICK * 1.5;
        cell.vx += Math.cos(angle) * kick;
        cell.vy += Math.sin(angle) * kick;
      }
    }

    postImportCenterX = cx;
    postImportCenterY = cy;
    postImportFrames = POST_IMPORT_FRAMES;
    writeBuffer(0);
  }

  function splitGeneration(): void {
    const newCells: Cell[] = [];
    const childRadius = radiusForGen(currentGen + 1);

    for (const cell of cells) {
      const angle = cell.splitAngle;
      const offset = cell.radius * 1.2;
      newCells.push({
        x: cell.x + Math.cos(angle) * offset,
        y: cell.y + Math.sin(angle) * offset,
        vx: Math.cos(angle) * 0.0003,
        vy: Math.sin(angle) * 0.0003,
        radius: childRadius,
        phase: Math.random(),
        splitAngle: Math.random() * Math.PI * 2,
        generation: currentGen + 1,
      });
      newCells.push({
        x: cell.x - Math.cos(angle) * offset,
        y: cell.y - Math.sin(angle) * offset,
        vx: -Math.cos(angle) * 0.0003,
        vy: -Math.sin(angle) * 0.0003,
        radius: childRadius,
        phase: Math.random(),
        splitAngle: Math.random() * Math.PI * 2,
        generation: currentGen + 1,
      });
    }

    cells = newCells;
    currentGen++;
    genTimer = 0;
  }

  initCells();
  writeBuffer(0);

  return {
    particleBuffer,
    get count() {
      return activeCount || 1;
    },
    update(_encoder, time, dt) {
      if (isResetting) {
        resetTimer += dt;
        if (resetTimer >= RESET_PAUSE) {
          initCells();
        }
        writeBuffer(time);
        return;
      }

      genTimer += dt;
      simulate(dt);

      if (genTimer >= PHASE_DUR) {
        if (currentGen >= MAX_GEN) {
          isResetting = true;
          resetTimer = 0;
        } else {
          splitGeneration();
        }
      }

      writeBuffer(time);
    },
    reset() {
      initCells();
      attractor = null;
      postImportFrames = 0;
      writeBuffer(0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState,
    importState,
    setAttractor(config: AttractorConfig | null) {
      attractor = config;
    },
    setAudioReactive(bands: AudioReactiveBands | null) {
      audioBands = bands;
    },
  };
}
