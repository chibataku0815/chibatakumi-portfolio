// Compose pass — final stage of every motion-* render pipeline.
//
// Render topology:
//   scene render → offscreen (rgba16float, persistent)
//   MotionFilmPostPass → substrate (swap-chain format, persistent)
//   ComposePass.render → swap chain
//
// The motion package (motion-dot/grid/flow) owns the substrate texture and the
// swap-chain view. ComposePass implementations are handed both views per frame
// and are responsible for encoding their own render pass that writes to
// swapView while sampling substrateView.
//
// When no composePass is registered, the package uses createDefaultBlitPass(),
// which performs a pure pass-through copy from substrate to swap chain. The
// default blit is guaranteed to be visually identical to the legacy
// "MFP writes directly to swap chain" behavior (matching format, nearest
// sampling at exact pixel centers).
//
// Hoisted to motion-core/compose so motion-grid and motion-flow can implement
// the same plug-in shape and be driven by the same Apple Liquid Glass compose
// pass that motion-dot uses.

export interface ComposePassFrameContext {
  readonly encoder: GPUCommandEncoder;
  readonly device: GPUDevice;
  readonly queue: GPUQueue;
  /** Substrate view — the post-effect output to sample. */
  readonly substrateView: GPUTextureView;
  /** Shared point sampler (filter: nearest) provided by the motion package. */
  readonly substrateSampler: GPUSampler;
  /** Current swap-chain view to write into. */
  readonly swapView: GPUTextureView;
  /** Swap-chain format (also matches substrate format). */
  readonly format: GPUTextureFormat;
  /** Canvas pixel dimensions. */
  readonly width: number;
  readonly height: number;
  /** Device pixel ratio (capped). */
  readonly dpr: number;
  /** Time in seconds since loop start. */
  readonly time: number;
  /** Delta seconds for the current frame. */
  readonly dt: number;
}

export interface ComposePass {
  /**
   * Encode one frame. Consumer creates its own render pass writing to
   * `ctx.swapView`, sampling `ctx.substrateView` via its own bind group.
   *
   * The encoder is finalized and submitted by the motion package after this
   * call. Do NOT call encoder.finish() or queue.submit() inside render().
   */
  render(ctx: ComposePassFrameContext): void;
  /** Optional cleanup (called from MountHandle.stop). */
  destroy?(): void;
}

const BLIT_WGSL = /* wgsl */ `
struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var srcSampler: sampler;
@group(0) @binding(1) var srcTexture: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );
  let position = positions[i];
  var output: VOut;
  output.pos = vec4f(position, 0.0, 1.0);
  output.uv = vec2f((position.x + 1.0) * 0.5, 1.0 - (position.y + 1.0) * 0.5);
  return output;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  return textureSample(srcTexture, srcSampler, in.uv);
}
`;

export function createDefaultBlitPass(
  device: GPUDevice,
  format: GPUTextureFormat,
): ComposePass {
  const shaderModule = device.createShaderModule({
    label: "motion-core:compose default blit",
    code: BLIT_WGSL,
  });

  const pipeline = device.createRenderPipeline({
    label: "motion-core:compose default blit",
    layout: "auto",
    vertex: { module: shaderModule, entryPoint: "vs" },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
  });

  let bindGroup: GPUBindGroup | null = null;
  let lastSubstrateView: GPUTextureView | null = null;
  let lastSampler: GPUSampler | null = null;

  return {
    render(ctx) {
      if (
        bindGroup === null
        || ctx.substrateView !== lastSubstrateView
        || ctx.substrateSampler !== lastSampler
      ) {
        bindGroup = ctx.device.createBindGroup({
          label: "motion-core:compose default blit",
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: ctx.substrateSampler },
            { binding: 1, resource: ctx.substrateView },
          ],
        });
        lastSubstrateView = ctx.substrateView;
        lastSampler = ctx.substrateSampler;
      }

      const pass = ctx.encoder.beginRenderPass({
        label: "motion-core:compose default blit",
        colorAttachments: [
          {
            view: ctx.swapView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
    },
    destroy() {
      bindGroup = null;
      lastSubstrateView = null;
      lastSampler = null;
    },
  };
}
