// ── Metaball SDF Render Pass ──────────────────────────────────
// Reads particle data directly from compute storage buffer (GPU-only path).

import metaballShader from "./metaball.wgsl?raw";

// Params uniform: 48 bytes (12 x f32, padded to 16-byte alignment)
const PARAMS_FLOATS = 12;
const PARAMS_BYTES = PARAMS_FLOATS * 4; // 48

export interface MetaballRenderParams {
  time: number;
  width: number;
  height: number;
  count: number;
  bgColor: [number, number, number, number];
  threshold?: number;
  softness?: number;
}

export interface MetaballPass {
  render(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
    particleBuffer: GPUBuffer,
    params: MetaballRenderParams,
  ): void;
  destroy(): void;
}

export function createMetaballPass(
  device: GPUDevice,
  format: GPUTextureFormat,
): MetaballPass {
  const shaderModule = device.createShaderModule({
    label: "metaball-sdf",
    code: metaballShader,
  });

  const renderPipeline = device.createRenderPipeline({
    label: "metaball-sdf pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // Uniform buffer for params
  const paramsBuffer = device.createBuffer({
    label: "metaball params",
    size: PARAMS_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Pre-allocated typed array
  const paramsData = new Float32Array(PARAMS_FLOATS);

  // Bind group cache (recreate when particle buffer changes)
  let cachedParticleBuffer: GPUBuffer | null = null;
  let bindGroup: GPUBindGroup | null = null;

  function getBindGroup(particleBuffer: GPUBuffer): GPUBindGroup {
    if (particleBuffer !== cachedParticleBuffer) {
      bindGroup = device.createBindGroup({
        label: "metaball bind group",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: paramsBuffer } },
          { binding: 1, resource: { buffer: particleBuffer } },
        ],
      });
      cachedParticleBuffer = particleBuffer;
    }
    return bindGroup!;
  }

  function render(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
    particleBuffer: GPUBuffer,
    params: MetaballRenderParams,
  ): void {
    // Write params uniform
    paramsData[0] = params.width;        // resolution.x
    paramsData[1] = params.height;       // resolution.y
    paramsData[2] = params.time;         // time
    new Uint32Array(paramsData.buffer, paramsData.byteOffset + 12, 1)[0] = params.count;
    paramsData[4] = params.bgColor[0];   // bgColor.r
    paramsData[5] = params.bgColor[1];   // bgColor.g
    paramsData[6] = params.bgColor[2];   // bgColor.b
    paramsData[7] = params.bgColor[3];   // bgColor.a
    paramsData[8] = params.threshold ?? 1.0;
    paramsData[9] = params.softness ?? 0.02;
    paramsData[10] = 0;                  // _pad.x
    paramsData[11] = 0;                  // _pad.y

    device.queue.writeBuffer(paramsBuffer, 0, paramsData);

    // Render pass
    const bg = getBindGroup(particleBuffer);
    const pass = encoder.beginRenderPass({
      label: "metaball pass",
      colorAttachments: [
        {
          view: outputView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    pass.setPipeline(renderPipeline);
    pass.setBindGroup(0, bg);
    pass.draw(3);
    pass.end();
  }

  function destroy(): void {
    paramsBuffer.destroy();
  }

  return { render, destroy };
}
