export interface GpuContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  canvas: HTMLCanvasElement;
  dpr: number;
}

export interface GpuOptions {
  readonly maxDpr?: number;
}

export async function initGpu(
  canvas: HTMLCanvasElement,
  options: GpuOptions = {},
): Promise<GpuContext> {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) {
    throw new Error("No WebGPU adapter found");
  }

  // Opt into float32-filterable when the adapter supports it. r32float SDFs
  // (flowline Phase 11) use a linear sampler; without this feature the texture
  // falls back to UnfilterableFloat and the compute bind group is rejected.
  const requiredFeatures: GPUFeatureName[] = [];
  if (adapter.features.has("float32-filterable")) {
    requiredFeatures.push("float32-filterable");
  }

  const device = await adapter.requestDevice({
    requiredFeatures,
    requiredLimits: {
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      maxBufferSize: adapter.limits.maxBufferSize,
    },
  });

  device.lost.then((info) => {
    console.error("WebGPU device lost:", info.message);
  });

  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Failed to get WebGPU context");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  const maxDpr = options.maxDpr ?? 1.5;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  context.configure({
    device,
    format,
    alphaMode: "premultiplied",
  });

  return { device, context, format, canvas, dpr };
}

export function resizeCanvas(gpu: GpuContext): { width: number; height: number } {
  const { canvas, dpr } = gpu;
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return { width, height };
}
