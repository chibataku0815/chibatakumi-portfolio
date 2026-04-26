"use client";

/// <reference types="@webgpu/types" />

// Liquid-glass compose-pass factory.
//
// Builds a `ComposePass` (motion-dot's plug-in shape) that drives TWO render
// targets in the same encoder:
//
//   1. Back target (motion-dot swap chain, z=-10):
//      - Fullscreen blit (textureB → swap, loadOp:clear).
//      - Per `kind:"rail"` surface, scissored composite draw with
//        `fsComposite` (opaque output `mix(base, glass, mask)`). This is the
//        original rail material that mixes the substrate behind motion-dot.
//
//   2. Front target (LiquidGlassFrontChrome canvas, z=var(--z-nav-visual)):
//      - Optional. Provided each frame via the `frontTarget` callback.
//      - Cleared to (0,0,0,0) so outside SDFs the canvas is fully
//        transparent and HTML/page show through.
//      - Per `kind:"nav"` / `"panel"` / `"control"` surface, scissored
//        composite draw with `fsCompositeAlpha` (premultiplied alpha output;
//        opaque inside SDF, transparent outside). Same SDF/lensing math as
//        the back path, sampling the SAME motion-dot substrate texture —
//        which means the front rail genuinely refracts the WebGPU motion
//        beneath, even though it sits visually above HTML at z=1000.
//
// HTML cannot be sampled (project anti-targets forbid html2canvas /
// getDisplayMedia / captureStream / drawImage). Sampling motion-dot's
// own offscreen GPU texture is NOT DOM sampling; it is internal GPU RT
// access through the shared device, which is allowed.
//
// React owns surface registration / pointer / scroll / route state and
// pushes a snapshot through `getFrameState` every frame (via motion-dot's
// `onBeforeFrame` hook).

import type {
  ComposePass,
  ComposePassFrameContext,
} from "@chibatakumi/motion-dot";
import {
  LIQUID_GLASS_COMPOSITE_WGSL,
  LIQUID_GLASS_MAX_SURFACES,
  LIQUID_GLASS_UNIFORM_BYTE_SIZE,
  LIQUID_GLASS_UNIFORM_FLOAT_COUNT,
} from "./shaders/composite";

const SCISSOR_PADDING_PX = 32;

export interface LiquidGlassFrameSurface {
  /** DOM rect in CSS pixels. */
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  /** Corner radius in CSS pixels. */
  readonly radius: number;
  readonly intensity: number;
  readonly brightness: number;
  /** Encoded surface kind (0=nav, 1=panel, 2=rail, 3=control). */
  readonly kindId: number;
  /** Surface-specific tint (RGB 0..1) and how much to mix over the route accent (0..1). */
  readonly tint: readonly [number, number, number, number];
}

export interface LiquidGlassFrameState {
  readonly surfaces: ReadonlyArray<LiquidGlassFrameSurface>;
  /** Pointer position in CSS pixels (relative to the viewport). */
  readonly pointer: { readonly x: number; readonly y: number; readonly active: number };
  /** Scroll velocity in CSS pixels per frame. */
  readonly scrollVelocity: number;
  /** Route accent RGB (0..1). Used as the default tint when a surface has tintAmount=0. */
  readonly routeAccent: readonly [number, number, number];
  readonly reducedMotion: boolean;
}

export interface LiquidGlassFrontTarget {
  /** Front overlay canvas swap-chain texture view for the current frame. */
  readonly swapView: GPUTextureView;
  /** Front canvas pixel dimensions (GPU px). */
  readonly width: number;
  readonly height: number;
  /**
   * Front canvas device pixel ratio. The front canvas may use a different
   * dpr cap than motion-dot's swap chain, so coordinates must be scaled by
   * THIS dpr (not `ctx.dpr` from the motion-dot encoder context) when
   * rendering to the front target.
   */
  readonly dpr: number;
}

export interface LiquidGlassComposeController {
  readonly pass: ComposePass;
}

const BACK_KINDS = new Set([2]); // "rail"
const FRONT_KINDS = new Set([0, 1, 3]); // "nav", "panel", "control"

export function createLiquidGlassComposePass(opts: {
  readonly device: GPUDevice;
  readonly format: GPUTextureFormat;
  readonly getFrameState: () => LiquidGlassFrameState;
  /**
   * Optional callback returning the front overlay canvas's swap-chain view
   * + pixel dimensions for the current frame. When `null` the front render
   * is skipped (useful while the front canvas is still initialising or on
   * routes without a front overlay).
   */
  readonly frontTarget?: () => LiquidGlassFrontTarget | null;
}): LiquidGlassComposeController {
  const { device, format, getFrameState } = opts;
  const getFrontTarget = opts.frontTarget ?? (() => null);

  const alignment = Math.max(
    256,
    device.limits.minUniformBufferOffsetAlignment ?? 256,
  );
  const uniformStride =
    Math.ceil(LIQUID_GLASS_UNIFORM_BYTE_SIZE / alignment) * alignment;
  const uniformBuffer = device.createBuffer({
    label: "liquid-glass:uniforms",
    size: uniformStride * LIQUID_GLASS_MAX_SURFACES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const sampler = device.createSampler({
    label: "liquid-glass:substrate sampler",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  const bindGroupLayout = device.createBindGroupLayout({
    label: "liquid-glass:bind group layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform",
          hasDynamicOffset: true,
          minBindingSize: LIQUID_GLASS_UNIFORM_BYTE_SIZE,
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "filtering" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float", viewDimension: "2d" },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    label: "liquid-glass:pipeline layout",
    bindGroupLayouts: [bindGroupLayout],
  });

  const shaderModule = device.createShaderModule({
    label: "liquid-glass:composite",
    code: LIQUID_GLASS_COMPOSITE_WGSL,
  });

  const blitPipeline = device.createRenderPipeline({
    label: "liquid-glass:blit pipeline",
    layout: pipelineLayout,
    vertex: { module: shaderModule, entryPoint: "vsMain" },
    fragment: {
      module: shaderModule,
      entryPoint: "fsBlit",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
  });

  const compositePipeline = device.createRenderPipeline({
    label: "liquid-glass:composite pipeline",
    layout: pipelineLayout,
    vertex: { module: shaderModule, entryPoint: "vsMain" },
    fragment: {
      module: shaderModule,
      entryPoint: "fsComposite",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
  });

  // Alpha-aware composite for the front overlay. Premultiplied OVER blend so
  // (0,0,0,0) outside SDF leaves the cleared transparent background unchanged
  // and (glass*mask, mask) inside SDF composes naturally.
  const compositeAlphaPipeline = device.createRenderPipeline({
    label: "liquid-glass:composite alpha pipeline",
    layout: pipelineLayout,
    vertex: { module: shaderModule, entryPoint: "vsMain" },
    fragment: {
      module: shaderModule,
      entryPoint: "fsCompositeAlpha",
      targets: [
        {
          format,
          blend: {
            color: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  });

  let bindGroup: GPUBindGroup | null = null;
  let lastSubstrateView: GPUTextureView | null = null;
  const uniformScratch = new Float32Array(LIQUID_GLASS_UNIFORM_FLOAT_COUNT);
  const startTime = performance.now();

  function ensureBindGroup(substrateView: GPUTextureView): GPUBindGroup {
    if (bindGroup !== null && substrateView === lastSubstrateView) {
      return bindGroup;
    }
    bindGroup = device.createBindGroup({
      label: "liquid-glass:bind group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
            offset: 0,
            size: LIQUID_GLASS_UNIFORM_BYTE_SIZE,
          },
        },
        { binding: 1, resource: sampler },
        { binding: 2, resource: substrateView },
      ],
    });
    lastSubstrateView = substrateView;
    return bindGroup;
  }

  function packSurfaceUniforms(
    surface: LiquidGlassFrameSurface,
    state: LiquidGlassFrameState,
    targetWidth: number,
    targetHeight: number,
    dpr: number,
    time: number,
    rectGpu: { x: number; y: number; w: number; h: number },
  ): void {
    // resolution_time_dpr
    uniformScratch[0] = targetWidth;
    uniformScratch[1] = targetHeight;
    uniformScratch[2] = time;
    uniformScratch[3] = dpr;
    // pointer_state_scroll
    uniformScratch[4] = state.pointer.x * dpr;
    uniformScratch[5] = state.pointer.y * dpr;
    uniformScratch[6] = state.pointer.active;
    uniformScratch[7] = state.scrollVelocity;
    // accent_motion (route accent + reducedMotion flag)
    uniformScratch[8] = state.routeAccent[0];
    uniformScratch[9] = state.routeAccent[1];
    uniformScratch[10] = state.routeAccent[2];
    uniformScratch[11] = state.reducedMotion ? 1 : 0;
    // rail_rect (GPU px)
    uniformScratch[12] = rectGpu.x;
    uniformScratch[13] = rectGpu.y;
    uniformScratch[14] = rectGpu.w;
    uniformScratch[15] = rectGpu.h;
    // rail_params (radius, intensity, brightness, kind)
    uniformScratch[16] = surface.radius * dpr;
    uniformScratch[17] = surface.intensity;
    uniformScratch[18] = surface.brightness;
    uniformScratch[19] = surface.kindId;
    // tint (rgb + tintAmount)
    uniformScratch[20] = surface.tint[0];
    uniformScratch[21] = surface.tint[1];
    uniformScratch[22] = surface.tint[2];
    uniformScratch[23] = surface.tint[3];
  }

  interface DrawEntry {
    readonly scissor: { x: number; y: number; w: number; h: number };
    readonly offset: number;
  }

  function buildDrawList(
    state: LiquidGlassFrameState,
    targetWidth: number,
    targetHeight: number,
    dpr: number,
    time: number,
    kindFilter: Set<number>,
    startOffsetIndex: number,
  ): { draws: DrawEntry[]; usedSlots: number } {
    const draws: DrawEntry[] = [];
    let slot = startOffsetIndex;
    const surfaceCount = Math.min(state.surfaces.length, LIQUID_GLASS_MAX_SURFACES);
    for (let i = 0; i < surfaceCount; i++) {
      if (slot >= LIQUID_GLASS_MAX_SURFACES) break;
      const surface = state.surfaces[i];
      if (!kindFilter.has(surface.kindId)) continue;
      const rect = surface.rect;
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.left + rect.width <= 0 || rect.top + rect.height <= 0) continue;
      if (rect.left * dpr >= targetWidth || rect.top * dpr >= targetHeight) continue;

      const rectGpu = {
        x: rect.left * dpr,
        y: rect.top * dpr,
        w: rect.width * dpr,
        h: rect.height * dpr,
      };
      const padding = SCISSOR_PADDING_PX * dpr;
      const scissorX = Math.max(0, Math.floor(rectGpu.x - padding));
      const scissorY = Math.max(0, Math.floor(rectGpu.y - padding));
      const scissorRight = Math.min(
        targetWidth,
        Math.ceil(rectGpu.x + rectGpu.w + padding),
      );
      const scissorBottom = Math.min(
        targetHeight,
        Math.ceil(rectGpu.y + rectGpu.h + padding),
      );
      const scissorW = scissorRight - scissorX;
      const scissorH = scissorBottom - scissorY;
      if (scissorW <= 0 || scissorH <= 0) continue;

      const offset = slot * uniformStride;
      packSurfaceUniforms(surface, state, targetWidth, targetHeight, dpr, time, rectGpu);
      device.queue.writeBuffer(
        uniformBuffer,
        offset,
        uniformScratch.buffer,
        uniformScratch.byteOffset,
        uniformScratch.byteLength,
      );

      draws.push({
        scissor: { x: scissorX, y: scissorY, w: scissorW, h: scissorH },
        offset,
      });
      slot++;
    }
    return { draws, usedSlots: slot };
  }

  const pass: ComposePass = {
    render(ctx: ComposePassFrameContext) {
      const state = getFrameState();
      const dpr = Math.max(ctx.dpr, 1);
      const time = (performance.now() - startTime) / 1000;
      const bg = ensureBindGroup(ctx.substrateView);

      // Build BACK draw list (kind=rail). Slots 0..N-1.
      const back = buildDrawList(
        state,
        ctx.width,
        ctx.height,
        dpr,
        time,
        BACK_KINDS,
        0,
      );

      // Back render pass: blit substrate, then per-surface composite for rail.
      const backPass = ctx.encoder.beginRenderPass({
        label: "liquid-glass:compose back",
        colorAttachments: [
          {
            view: ctx.swapView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      backPass.setPipeline(blitPipeline);
      backPass.setBindGroup(0, bg, [0]);
      backPass.draw(3);
      if (back.draws.length > 0) {
        backPass.setPipeline(compositePipeline);
        for (const draw of back.draws) {
          backPass.setScissorRect(draw.scissor.x, draw.scissor.y, draw.scissor.w, draw.scissor.h);
          backPass.setBindGroup(0, bg, [draw.offset]);
          backPass.draw(3);
        }
      }
      backPass.end();

      // FRONT render — alpha-aware over a transparent (or dim-when-panel)
      // canvas at z=var(--z-nav-visual). Re-pack uniforms because the front
      // canvas may have different dimensions AND different dpr than
      // motion-dot's swap chain (motion-dot caps dpr at ~1.5 internally
      // while the front canvas may use 2.0). Use front.dpr for coordinate
      // scaling here; otherwise rect positions are off by the dpr ratio.
      const front = getFrontTarget();
      if (front) {
        const frontDraws = buildDrawList(
          state,
          front.width,
          front.height,
          front.dpr,
          time,
          FRONT_KINDS,
          back.draws.length,
        );

        // The scrim (dim + blur of HTML/page when sheet is open) is rendered
        // in the DOM with CSS `backdrop-filter` outside the panel area —
        // see Nav.tsx. The WebGPU front canvas only paints the per-surface
        // Liquid Glass material here.
        const frontPass = ctx.encoder.beginRenderPass({
          label: "liquid-glass:compose front",
          colorAttachments: [
            {
              view: front.swapView,
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });

        if (frontDraws.draws.length > 0) {
          frontPass.setPipeline(compositeAlphaPipeline);
          for (const draw of frontDraws.draws) {
            frontPass.setScissorRect(
              draw.scissor.x,
              draw.scissor.y,
              draw.scissor.w,
              draw.scissor.h,
            );
            frontPass.setBindGroup(0, bg, [draw.offset]);
            frontPass.draw(3);
          }
        }
        frontPass.end();
      }
    },
    destroy() {
      uniformBuffer.destroy();
      bindGroup = null;
      lastSubstrateView = null;
    },
  };

  return { pass };
}
