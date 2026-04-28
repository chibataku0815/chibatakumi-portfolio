// ── WebGPU Kinetic Typography — gpu-film-post demo ─────────────────

import { createFilmPostPipeline } from '../../../src/index';
import * as M from './math';
import {
  PHRASES,
  clamp,
  easeOutCubic,
  easeInCubic,
  sstep,
} from './scene/data';
import { updateCamera } from './scene/camera';
import { drawHUD, HUD_W, HUD_H } from './scene/hud';
import {
  makeCharCv,
  makeNumberCv,
  makeGridCv,
  makeLineCv,
  makeBgCv,
  texFromCanvas,
  makeObj,
  writeObj,
  type SceneObj,
} from './scene/objects';
import sceneShaderCode from './scene/shaders/quad.wgsl?raw';

// ── Error display ──────────────────────────────────────────────────

const errEl = document.getElementById('err')!;
function fail(msg: string): never {
  errEl.style.display = 'flex';
  errEl.textContent = msg;
  throw new Error(msg);
}

// ── WebGPU init ────────────────────────────────────────────────────

if (!navigator.gpu) fail('WebGPU not supported in this browser.');
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) fail('No GPU adapter found.');
const device = await adapter.requestDevice();

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('webgpu')!;
const format = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({ device, format, alphaMode: 'opaque' });

// ── DPR & scene texture ────────────────────────────────────────────

const dpr = Math.min(devicePixelRatio, 2);
let sceneTex: GPUTexture;
let sceneView: GPUTextureView;

const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge',
});

// ── Quad vertex buffer ─────────────────────────────────────────────

const quadVerts = new Float32Array([
  -0.5, -0.5, 0, 1,
   0.5, -0.5, 1, 1,
  -0.5,  0.5, 0, 0,
   0.5,  0.5, 1, 0,
]);
const quadVB = device.createBuffer({
  size: quadVerts.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(quadVB, 0, quadVerts);

// ── Scene pipeline ─────────────────────────────────────────────────

const sceneShader = device.createShaderModule({ code: sceneShaderCode });
const scenePipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: sceneShader,
    entryPoint: 'vs',
    buffers: [
      {
        arrayStride: 16,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' as GPUVertexFormat },
          { shaderLocation: 1, offset: 8, format: 'float32x2' as GPUVertexFormat },
        ],
      },
    ],
  },
  fragment: {
    module: sceneShader,
    entryPoint: 'fs',
    targets: [
      {
        format: 'rgba8unorm' as GPUTextureFormat,
        blend: {
          color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        },
      },
    ],
  },
  primitive: { topology: 'triangle-strip' },
});

// ── Film post pipeline (THE LIBRARY!) ──────────────────────────────

const filmPost = createFilmPostPipeline(device, format, {
  grain: { intensity: 0.045, size: 0.3 },
  chromaticAberration: { amount: 0.003 },
  bloom: { threshold: 0.65, intensity: 0.45, warmth: 0.25 },
  vignette: { strength: 0.85, warmShift: 0.3 },
  lightLeak: { intensity: 0.25 },
  tonemap: { shadowLift: 0.012, compression: 0.35 },
});

// ── HUD canvas + texture ───────────────────────────────────────────

const hudCv = document.createElement('canvas');
hudCv.width = HUD_W;
hudCv.height = HUD_H;
const hctx = hudCv.getContext('2d')!;
const hudTex = device.createTexture({
  size: [HUD_W, HUD_H],
  format: 'rgba8unorm',
  usage:
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST |
    GPUTextureUsage.RENDER_ATTACHMENT,
});

// ── Create scene objects ───────────────────────────────────────────

// Background plane (Z = -8, 40x25)
const bgObj = makeObj(device, scenePipeline, sampler, texFromCanvas(device, makeBgCv()), 40, 25);
bgObj.tx = 0; bgObj.ty = 0; bgObj.tz = -8;
bgObj.rz = 0; bgObj.scl = 1; bgObj.scaleX = 1;
bgObj.color = [1, 1, 1, 1];

// Grid (far, Z = -4.5, 18x18)
const gridTex = texFromCanvas(device, makeGridCv());
const gridObj = makeObj(device, scenePipeline, sampler, gridTex, 18, 18);
gridObj.tx = 0; gridObj.ty = 0; gridObj.tz = -4.5;
gridObj.rz = 0; gridObj.scl = 1; gridObj.scaleX = 1;
gridObj.color = [1, 1, 1, 1];

// Grid 2 (closer, Z = -1.5, 10x10)
const grid2Obj = makeObj(device, scenePipeline, sampler, gridTex, 10, 10);
grid2Obj.tx = 0; grid2Obj.ty = 0; grid2Obj.tz = -1.5;
grid2Obj.rz = 0; grid2Obj.scl = 1; grid2Obj.scaleX = 1;
grid2Obj.color = [1, 1, 1, 0.4];

// Big number meshes (Z = -3.2, 7x7) — one per phrase
const numberObjs: SceneObj[] = [];
for (let i = 0; i < 4; i++) {
  const obj = makeObj(device, scenePipeline, sampler, texFromCanvas(device, makeNumberCv(i + 1)), 7, 7);
  obj.tx = 2.6; obj.ty = -0.3; obj.tz = -3.2;
  obj.rz = 0; obj.scl = 1; obj.scaleX = 1;
  obj.color = [1, 1, 1, 0];
  numberObjs.push(obj);
}

// Accent line (Z = 0.3, 3x0.09)
const accentObj = makeObj(device, scenePipeline, sampler, texFromCanvas(device, makeLineCv()), 3, 0.09);
accentObj.tx = 0; accentObj.ty = -1.0; accentObj.tz = 0.3;
accentObj.rz = 0; accentObj.scl = 1; accentObj.scaleX = 1;
accentObj.color = [1, 1, 1, 1];

// Per-phrase character groups
interface CharInfo {
  obj: SceneObj;
  baseX: number;
  baseY: number;
  baseZ: number;
  index: number;
}

const phraseChars: CharInfo[][] = PHRASES.map((phrase) => {
  const chars = [...phrase];
  const charW = 0.78;
  const tracking = 0.06;
  const totalW = chars.length * (charW + tracking) - tracking;
  return chars.map((ch, i) => {
    const obj = makeObj(device, scenePipeline, sampler, texFromCanvas(device, makeCharCv(ch)), charW, charW);
    const baseX = -totalW / 2 + i * (charW + tracking) + charW / 2;
    const baseZ = (i % 2 === 0 ? -0.20 : 0.18) + Math.sin(i * 1.7) * 0.06;
    obj.tx = baseX; obj.ty = 0; obj.tz = baseZ;
    obj.rz = 0; obj.scl = 1; obj.scaleX = 1;
    obj.color = [1, 1, 1, 1];
    return { obj, baseX, baseY: 0, baseZ, index: i };
  });
});

// HUD quad (fullscreen, rendered last — screen-space)
const hudObj = makeObj(device, scenePipeline, sampler, hudTex, 2, 2);
hudObj.color = [1, 1, 1, 1];

// ── Resize handler ─────────────────────────────────────────────────

function resize() {
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  if (sceneTex) sceneTex.destroy();
  sceneTex = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  });
  sceneView = sceneTex.createView();
  filmPost.resize(canvas.width, canvas.height);
}
resize();
addEventListener('resize', resize);

// ── Per-frame animation update ─────────────────────────────────────

function updatePhraseObjects(phaseIdx: number, lt: number): void {
  // Character entrance/exit animation applying "Musical-Visual Motion Principles"
  for (let p = 0; p < phraseChars.length; p++) {
    const visible = p === phaseIdx;
    for (const ci of phraseChars[p]) {
      if (!visible) {
        ci.obj.color[3] = 0;
        continue;
      }
      const i = ci.index;
      
      // 1. Syncopation: Staggered, slightly "off-beat" delays per character
      // Adding a small pseudo-random jitter based on character index for organic feel
      const syncopatedDelay = i * 0.045 + (Math.sin(i * 3.14) * 0.012);
      
      // 2. Voice Leading (Attention Handoff): Guided focus through the phrase
      const enter = clamp((lt - 0.08 - syncopatedDelay) / 0.50, 0, 1);
      const enterE = easeOutCubic(enter);
      
      // 3. Fermata (The Held Moment): A prolonged hold between 0.6 and 1.6 in phrase timeline
      // Slowing down the secondary motion significantly during this phase
      const fermata = 1.0 - sstep(0.6, 1.6, lt);
      
      const exit = clamp((lt - 1.75 - i * 0.015) / 0.18, 0, 1);
      const exitE = easeInCubic(exit);

      // 4. Heterophonic Texture: Slight variations in path and rotation per character
      const fromAbove = i % 2 === 0;
      const yOff = (1 - enterE) * (fromAbove ? 0.60 : -0.60);
      const xOff = exitE * 0.50 + (Math.cos(lt * 2.0 + i) * 0.01 * fermata); // Subtle drift during hold
      const rot = (1 - enterE) * (fromAbove ? -0.50 : 0.50);
      const scl = 0.50 + 0.50 * enterE;

      ci.obj.tx = ci.baseX + xOff;
      ci.obj.ty = ci.baseY + yOff;
      ci.obj.tz = ci.baseZ;
      ci.obj.rz = rot;
      ci.obj.scl = scl;
      ci.obj.color[3] = enterE * (1 - exitE);
    }
  }

  // Accent line draw-in / out
  const drawP = sstep(0.55, 0.92, lt) * (1 - sstep(1.65, 1.85, lt));
  accentObj.scaleX = easeOutCubic(drawP);
  accentObj.color[3] = drawP;

  // Big number per phrase
  for (let i = 0; i < 4; i++) {
    if (i === phaseIdx) {
      numberObjs[i].color[3] = sstep(0.10, 0.55, lt) * (1 - sstep(1.65, 1.92, lt));
      numberObjs[i].tx = 2.6 + Math.sin(lt * Math.PI) * 0.05;
    } else {
      numberObjs[i].color[3] = 0;
    }
  }

  // Grid fade
  const gridFade = sstep(0.0, 0.2, lt) * (1 - sstep(1.85, 2.0, lt));
  gridObj.color[3] = 0.7 * gridFade;
  grid2Obj.color[3] = 0.4 * gridFade;
}

// ── Frame loop ─────────────────────────────────────────────────────

const start = performance.now();

function frame() {
  const time = (performance.now() - start) / 1000;
  const T = time % 8;
  const phaseF = T / 2;
  const phaseIdx = Math.floor(phaseF) % 4;
  const lt = phaseF - Math.floor(phaseF);

  // Camera
  const { viewMat, projMat } = updateCamera(phaseIdx, lt, time, canvas.width, canvas.height);
  const VP = M.mul(projMat, viewMat);

  // Update animated objects
  updatePhraseObjects(phaseIdx, lt);

  // Draw HUD to canvas then upload
  drawHUD(hctx, time, phaseIdx, lt);
  device.queue.copyExternalImageToTexture(
    { source: hudCv, flipY: false },
    { texture: hudTex },
    [HUD_W, HUD_H],
  );

  // Build draw list (back to front)
  const drawList: SceneObj[] = [];

  // Helper: compute MVP for a 3D object
  function push3D(obj: SceneObj) {
    if (obj.color[3] <= 0.001) return;
    const model = M.trs(
      obj.tx ?? 0,
      obj.ty ?? 0,
      obj.tz ?? 0,
      obj.rz ?? 0,
      obj.w * (obj.scl ?? 1) * (obj.scaleX ?? 1),
      obj.h * (obj.scl ?? 1),
      1,
    );
    const mvp = M.mul(VP, model);
    writeObj(device, obj, mvp);
    drawList.push(obj);
  }

  // 1. Background (Z=-8)
  push3D(bgObj);

  // 2. Grid far (Z=-4.5)
  push3D(gridObj);

  // 3. Big number (Z=-3.2)
  for (const n of numberObjs) push3D(n);

  // 4. Grid close (Z=-1.5)
  push3D(grid2Obj);

  // 5. Characters (Z ~ -0.20..+0.18)
  // Sort by Z depth (back to front relative to camera)
  const activeChars = phraseChars[phaseIdx];
  if (activeChars) {
    // Stable sort by Z ascending (farther first)
    const sorted = [...activeChars].sort((a, b) => (a.obj.tz ?? 0) - (b.obj.tz ?? 0));
    for (const ci of sorted) push3D(ci.obj);
  }

  // 6. Accent line (Z=0.3)
  push3D(accentObj);

  // 7. HUD — screen-space, scale quad (-0.5..0.5) to NDC (-1..1)
  {
    const hudMVP = M.trs(0, 0, 0, 0, 2, 2, 1);
    writeObj(device, hudObj, hudMVP);
    drawList.push(hudObj);
  }

  // Pulse for post-processing (transition flash)
  const pulse = Math.exp(-Math.pow((lt - 1.0) * 40.0, 2.0));

  const enc = device.createCommandEncoder();

  // Pass 1: scene -> sceneTex
  {
    const pass = enc.beginRenderPass({
      colorAttachments: [
        {
          view: sceneView,
          clearValue: { r: 0.04, g: 0.03, b: 0.025, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(scenePipeline);
    pass.setVertexBuffer(0, quadVB);
    for (const o of drawList) {
      pass.setBindGroup(0, o.bg);
      pass.draw(4);
    }
    pass.end();
  }

  // Pass 2: post-process -> swapchain (LIBRARY CALL!)
  filmPost.render(enc, sceneView, ctx.getCurrentTexture().createView(), {
    time,
    pulse,
  });

  device.queue.submit([enc.finish()]);
  requestAnimationFrame(frame);
}

frame();
