// ── Scene object factories (Canvas2D textures + WebGPU quads) ──────

// ── Canvas2D texture factories ─────────────────────────────────────

export function makeCharCv(ch: string): HTMLCanvasElement {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, S, S);
  x.fillStyle = '#f8ede5';
  x.font = `300 ${S * 0.74}px "Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(ch, S / 2, S / 2 + S * 0.04);
  return c;
}

export function makeNumberCv(n: number): HTMLCanvasElement {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, S, S);
  x.fillStyle = 'rgba(248,237,229,0.10)';
  x.font = '200 760px "Times New Roman","Hiragino Mincho ProN",serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('0' + n, S / 2, S / 2 + 40);
  // small caption
  x.fillStyle = 'rgba(242,148,56,0.55)';
  x.font = '300 32px "SF Mono", monospace';
  x.fillText('\u2014 OF \u00B7 04', S / 2, S / 2 + 420);
  return c;
}

export function makeGridCv(): HTMLCanvasElement {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, S, S);
  x.strokeStyle = 'rgba(248,237,229,0.09)';
  x.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    const p = (i / 16) * S;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, S); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(S, p); x.stroke();
  }
  // dots at intersections
  x.fillStyle = 'rgba(242,148,56,0.35)';
  for (let i = 0; i <= 16; i += 4) {
    for (let j = 0; j <= 16; j += 4) {
      x.fillRect((i / 16) * S - 2, (j / 16) * S - 2, 4, 4);
    }
  }
  return c;
}

export function makeLineCv(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 32;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, 1024, 32);
  x.fillStyle = '#f29438';
  x.fillRect(0, 14, 1024, 4);
  return c;
}

export function makeBgCv(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0a0807');
  g.addColorStop(1, '#15100a');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  return c;
}

// ── Scene object type ──────────────────────────────────────────────

export interface SceneObj {
  ub: GPUBuffer;
  bg: GPUBindGroup;
  w: number;
  h: number;
  color: number[];
  // Dynamic properties (set during animation)
  baseX?: number;
  baseY?: number;
  baseZ?: number;
  tx?: number;
  ty?: number;
  tz?: number;
  rz?: number;
  scl?: number;
  scaleX?: number;
  driftX?: number;
}

// ── GPU helpers ────────────────────────────────────────────────────

export function texFromCanvas(
  device: GPUDevice,
  cv: HTMLCanvasElement,
): GPUTexture {
  const tex = device.createTexture({
    size: [cv.width, cv.height],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture(
    { source: cv, flipY: false },
    { texture: tex },
    [cv.width, cv.height],
  );
  return tex;
}

export function makeObj(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  sampler: GPUSampler,
  tex: GPUTexture,
  w: number,
  h: number,
): SceneObj {
  // Uniform buffer: 16 floats (mat4 mvp) + 4 floats (vec4 color) = 80 bytes
  const ub = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const bg = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: ub } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: tex.createView() },
    ],
  });
  return { ub, bg, w, h, color: [1, 1, 1, 1] };
}

// Write MVP + color to object's uniform buffer
const ubScratch = new Float32Array(20); // 16 mvp + 4 color

export function writeObj(
  device: GPUDevice,
  obj: SceneObj,
  mvp: Float32Array,
): void {
  ubScratch.set(mvp, 0);
  ubScratch[16] = obj.color[0];
  ubScratch[17] = obj.color[1];
  ubScratch[18] = obj.color[2];
  ubScratch[19] = obj.color[3];
  device.queue.writeBuffer(obj.ub, 0, ubScratch);
}
