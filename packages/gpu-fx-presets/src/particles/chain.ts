import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

// ── Chain — Elastic spring-mass filament ───────────────────
// Two independent chains with drifting anchor endpoints.
// Neighbor-only springs create coherent filament motion —
// swaying deep-sea bioluminescent tendrils.

const CHAINS = 2;
const PER_CHAIN = 12;
const COUNT = CHAINS * PER_CHAIN;
const REST_LENGTH = 0.035;
const SPRING_K = 0.00015;
const BENDING_K = 0.00003;
const GRAVITY = -0.000003;
const DRAG = 0.994;
const BASE_RADIUS = 0.008;
const WHITE_RATIO = 0.08;
const ANCHOR_PERIOD = 125.0;  // seconds per full ellipse
const ANCHOR_A = 0.15;        // ellipse semi-major
const ANCHOR_B = 0.08;        // ellipse semi-minor
const MAX_SPEED = 0.004;
const ONSET_BURST = 0.006;
const TAU = Math.PI * 2;

interface ChainNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  isWhite: boolean;
  isAnchor: boolean;
}

function fract(v: number): number { return v - Math.floor(v); }
function hash01(seed: number): number {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
}

// Anchor endpoint positions (slow elliptical drift)
function anchorPos(time: number, chainIdx: number, endIdx: number): [number, number] {
  const baseAngle = (chainIdx / CHAINS) * Math.PI + endIdx * Math.PI;
  const angle = baseAngle + (time / ANCHOR_PERIOD) * TAU;
  const cx = 0.5 + Math.cos(angle) * ANCHOR_A;
  const cy = 0.5 + Math.sin(angle) * ANCHOR_B;
  return [clamp(cx, 0.12, 0.88), clamp(cy, 0.14, 0.86)];
}

function initialNodes(): ChainNode[] {
  const nodes: ChainNode[] = [];
  for (let c = 0; c < CHAINS; c++) {
    const [ax, ay] = anchorPos(0, c, 0);
    const [bx, by] = anchorPos(0, c, 1);
    for (let i = 0; i < PER_CHAIN; i++) {
      const t = i / (PER_CHAIN - 1);
      const isEnd = i === 0 || i === PER_CHAIN - 1;
      const globalIdx = c * PER_CHAIN + i;
      // Catenary sag: parabolic dip in the middle
      const sag = 0.025 * Math.sin(Math.PI * t);
      const sizeVar = 0.75 + hash01(globalIdx + 5.1) * 0.50;
      // White dots only at chain tips
      const isWhite = isEnd && globalIdx < Math.floor(COUNT * WHITE_RATIO) + 2;
      nodes.push({
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t + sag,
        vx: 0,
        vy: 0,
        radius: BASE_RADIUS * sizeVar,
        phase: hash01(globalIdx + 15.3),
        isWhite,
        isAnchor: isEnd,
      });
    }
  }
  return nodes;
}

export function createChainParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "chain-particles", COUNT);
  const data = createParticleArray(COUNT);
  let nodes = initialNodes();
  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;
  const ANCHOR_LERP_FRAMES = 20; // ~0.44s at 45fps

  function resetNodes(): void {
    nodes = initialNodes();
  }

  function simulate(time: number, dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;
    const ATTRACT_K = 0.0015;

    for (let c = 0; c < CHAINS; c++) {
      const base = c * PER_CHAIN;

      // Anchor handling: lerp between parametric orbit and attractor target
      const [ax, ay] = anchorPos(time, c, 0);
      const [bx, by] = anchorPos(time, c, 1);
      const n0 = nodes[base];
      const nEnd = nodes[base + PER_CHAIN - 1];

      if (attractor && attractMix > 0) {
        // Blend anchor position between parametric orbit and attractor target
        n0.x = ax * sceneMix + attractor.x * attractMix;
        n0.y = ay * sceneMix + attractor.y * attractMix;
        nEnd.x = bx * sceneMix + attractor.x * attractMix;
        nEnd.y = by * sceneMix + attractor.y * attractMix;
      } else if (postImportFrames > 0) {
        // Smoothly lerp anchors from imported position toward orbit
        const t = 1 - (postImportFrames / ANCHOR_LERP_FRAMES);
        const smooth = t * t * (3 - 2 * t); // smoothstep
        n0.x += (ax - n0.x) * smooth * 0.2;
        n0.y += (ay - n0.y) * smooth * 0.2;
        nEnd.x += (bx - nEnd.x) * smooth * 0.2;
        nEnd.y += (by - nEnd.y) * smooth * 0.2;
      } else {
        n0.x = ax; n0.y = ay;
        nEnd.x = bx; nEnd.y = by;
      }
      n0.vx = 0; n0.vy = 0;
      nEnd.vx = 0; nEnd.vy = 0;

      // Interior nodes: spring forces from neighbors
      // Audio-reactive: mid tightens springs, bass amplifies gravity, energy loosens drag
      const springMul = audioBands ? 1 + audioBands.mid * 3 : 1;
      const gravityMul = audioBands ? 1 + audioBands.bass * 50 : 1;
      const chainDrag = audioBands ? DRAG - audioBands.energy * 0.008 : DRAG;
      const chainSpeedCap = audioBands ? MAX_SPEED * (1 + audioBands.energy * 2) : MAX_SPEED;

      for (let i = 1; i < PER_CHAIN - 1; i++) {
        const node = nodes[base + i];
        const prev = nodes[base + i - 1];
        const next = nodes[base + i + 1];

        // Spring to left neighbor
        let dx = prev.x - node.x;
        let dy = prev.y - node.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        let stretch = dist - REST_LENGTH;
        const springK = SPRING_K * springMul;
        let fx = (dx / dist) * stretch * springK * step * sceneMix;
        let fy = (dy / dist) * stretch * springK * step * sceneMix;

        // Spring to right neighbor
        dx = next.x - node.x;
        dy = next.y - node.y;
        dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        stretch = dist - REST_LENGTH;
        fx += (dx / dist) * stretch * springK * step * sceneMix;
        fy += (dy / dist) * stretch * springK * step * sceneMix;

        // Bending stiffness: penalize deviation from straight line
        const midX = (prev.x + next.x) * 0.5;
        const midY = (prev.y + next.y) * 0.5;
        fx += (midX - node.x) * BENDING_K * step * sceneMix;
        fy += (midY - node.y) * BENDING_K * step * sceneMix;

        // Gravity (amplified by bass)
        fy -= GRAVITY * gravityMul * step * sceneMix;

        // Central attractor force (blended in)
        if (attractor && attractMix > 0) {
          fx += (attractor.x - node.x) * ATTRACT_K * attractMix * step;
          fy += (attractor.y - node.y) * ATTRACT_K * attractMix * step;
        }

        node.vx = (node.vx + fx) * chainDrag;
        node.vy = (node.vy + fy) * chainDrag;

        // Beat onset impulse — gravity slam on kick + horizontal snap on mid
        if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
          node.vy += audioBands.bassOnset * ONSET_BURST * sceneMix;
        }
        if (audioBands?.midOnset && audioBands.midOnset > 0.4) {
          node.vx += (Math.random() - 0.5) * audioBands.midOnset * ONSET_BURST * 0.5 * sceneMix;
        }

        // Speed limit
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > MAX_SPEED * speedScale) {
          const s = MAX_SPEED * speedScale / speed;
          node.vx *= s;
          node.vy *= s;
        }

        node.x = clamp(node.x + node.vx * speedScale * step, 0.05, 0.95);
        node.y = clamp(node.y + node.vy * speedScale * step, 0.07, 0.93);
      }
    }
    if (postImportFrames > 0) postImportFrames--;
  }

  function writeBuffer(time: number): void {
    const intensity = audioBands?.intensity;
    const visibleCount = intensity == null
      ? COUNT
      : Math.max(1, Math.min(COUNT, Math.ceil(COUNT * (0.3 + intensity * 0.7))));
    for (let i = 0; i < COUNT; i++) {
      const n = nodes[i];
      // Two-frequency breathing to avoid mechanical regularity
      const breathe = 1.0 + Math.sin(time * 0.55 + n.phase * TAU) * 0.04;
      const breathe2 = 1.0 + Math.sin(time * 0.28 + n.phase * TAU * 2.3) * 0.025;
      writeParticle(
        data, i,
        n.x, n.y,
        i < visibleCount ? n.radius * breathe * breathe2 : 0.001,
        n.phase,
        n.isWhite ? 1.0 : 0.0,
        n.vx, n.vy,
      );
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  resetNodes();
  writeBuffer(0);

  return {
    particleBuffer,
    get count() { return COUNT; },
    update(_encoder, time, dt) {
      simulate(time, dt);
      writeBuffer(time);
    },
    reset() {
      resetNodes();
      writeBuffer(0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState() {
      const positions = new Float32Array(COUNT * 2);
      const velocities = new Float32Array(COUNT * 2);
      const radii = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        const nd = nodes[i];
        positions[i * 2] = nd.x;
        positions[i * 2 + 1] = nd.y;
        velocities[i * 2] = nd.vx;
        velocities[i * 2 + 1] = nd.vy;
        radii[i] = nd.radius;
      }
      return { positions, velocities, radii, count: COUNT };
    },
    importState(snapshot: ParticleStateSnapshot) {
      const n = Math.min(snapshot.count, COUNT);
      let cx = 0;
      let cy = 0;
      let speedSum = 0;
      for (let i = 0; i < n; i++) {
        nodes[i].x = snapshot.positions[i * 2];
        nodes[i].y = snapshot.positions[i * 2 + 1];
        nodes[i].vx = snapshot.velocities[i * 2];
        nodes[i].vy = snapshot.velocities[i * 2 + 1];
        cx += nodes[i].x;
        cy += nodes[i].y;
        speedSum += Math.hypot(nodes[i].vx, nodes[i].vy);
      }
      cx = n > 0 ? cx / n : 0.5;
      cy = n > 0 ? cy / n : 0.5;

      if (n < COUNT) {
        for (let i = n; i < COUNT; i++) {
          const ang = (i * 2.399963229728653) % TAU;
          const r = 0.003 + ((i - n) % 4) * 0.002;
          nodes[i].x = cx + Math.cos(ang) * r;
          nodes[i].y = cy + Math.sin(ang) * r;
          nodes[i].vx = Math.cos(ang) * 0.00008;
          nodes[i].vy = Math.sin(ang) * 0.00008;
        }
      }

      const avgSpeed = speedSum / Math.max(n, 1);
      if (avgSpeed < 0.0003) {
        for (let i = 0; i < COUNT; i++) {
          if (nodes[i].isAnchor) continue;
          const localIdx = i % PER_CHAIN;
          const along = localIdx / (PER_CHAIN - 1) - 0.5;
          const dx = nodes[i].x - cx;
          const dy = nodes[i].y - cy;
          const dist = Math.hypot(dx, dy);
          const ang = dist > 0.0015
            ? Math.atan2(dy, dx)
            : nodes[i].phase * TAU + along * 0.8;
          const kick = 0.00008 + Math.abs(along) * 0.00004;
          nodes[i].vx += Math.cos(ang) * kick;
          nodes[i].vy += Math.sin(ang) * kick + along * 0.00005;
        }
      }
      postImportFrames = ANCHOR_LERP_FRAMES;
      writeBuffer(0);
    },
    setAttractor(config: AttractorConfig | null) {
      attractor = config;
    },
    setAudioReactive(bands: AudioReactiveBands | null) {
      audioBands = bands;
    },
  };
}
