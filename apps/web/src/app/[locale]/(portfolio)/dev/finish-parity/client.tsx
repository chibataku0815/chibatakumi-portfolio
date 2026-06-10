"use client";

// Finish parity harness — hop-2 of the proof chain (docs/journal/
// motion-demo-webgpu-finish-plan.md): the WGSL finish pipeline must agree with the
// CPU oracle (@bridges/webgpu-finish, itself hop-1 byte-proven against the lab
// deliverable pipeline) on identical source pixels.
//
//   main   — full chain (grain → CA), frames 0/24/38/60:
//            PASS = ≥99.5% of bytes within ±1 LSB and max|Δ| ≤ 2
//            (f32-vs-f64 rounding and unorm tie behavior are the only allowed sources)
//   leg a  — caFringing=0 vs CPU grain-only: isolates the grain pass (CA must be identity)
//   leg b  — strength=0 + fringing=0 via writeTexture: output must equal source EXACTLY
//            (catches pipeline-level corruption: colorspace, premultiply, quantization)
//   leg d  — same as b but uploaded via copyExternalImageToTexture: proves the live
//            demo's upload path is byte-clean too
//   leg c  — corrupted seed (+1) must FAIL the main criteria (the gate can fail)
//
// Results render as JSON in <pre data-parity-status> for the Playwright spec
// (e2e/finish-parity.spec.ts) and for manual reading.

import { useEffect, useState } from "react";
import {
  API_FINISH_LIGHT_STANDARD,
  applyFinishCpu,
  applyGrainOnlyCpu,
  createFinishPipeline,
  deriveGrainSeedU32,
  grainTemporalSeed,
  type FinishStandardParams,
} from "@bridges/webgpu-finish";
import {
  drawLatticeBreathSourceFrame,
  FINISH_RENDER_SIZE,
  FINISH_STREAM_NAMESPACE,
} from "@/features/journal/motion-demos/finish/lattice-breath-source";

const SIZE = FINISH_RENDER_SIZE;
const MAIN_FRAMES = [0, 24, 38, 60];
const LEG_FRAME = 38;
const P = API_FINISH_LIGHT_STANDARD;

interface CompareStats {
  total: number;
  mismatched: number;
  fracLe1: number;
  max: number;
}

const compareBytes = (
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): CompareStats => {
  const total = a.length;
  let mismatched = 0;
  let le1 = 0;
  let max = 0;
  for (let i = 0; i < total; i += 1) {
    const d = Math.abs((a[i] as number) - (b[i] as number));
    if (d !== 0) mismatched += 1;
    if (d <= 1) le1 += 1;
    if (d > max) max = d;
  }
  return { total, mismatched, fracLe1: le1 / total, max };
};

const passMain = (s: CompareStats): boolean => s.fracLe1 >= 0.995 && s.max <= 2;

async function runHarness(): Promise<Record<string, unknown>> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return { webgpu: false, overall: "SKIPPED", reason: "WebGPU unavailable" };
  }
  console.info("[parity] requesting adapter");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return { webgpu: false, overall: "SKIPPED", reason: "no adapter" };
  console.info("[parity] requesting device");
  const device = await adapter.requestDevice();
  console.info("[parity] device ready");

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const c2d = canvas.getContext("2d", { willReadFrequently: true });
  if (!c2d) {
    device.destroy();
    return { webgpu: true, overall: "ERROR", reason: "no 2d context" };
  }

  const gpuRun = async (
    params: FinishStandardParams,
    srcBytes: Uint8ClampedArray,
    seedU32: number,
    upload: "write" | "copyExternal",
  ): Promise<Uint8Array> => {
    const srcTex = device.createTexture({
      size: { width: SIZE, height: SIZE },
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    if (upload === "write") {
      device.queue.writeTexture(
        { texture: srcTex },
        new Uint8Array(srcBytes),
        { bytesPerRow: SIZE * 4 },
        { width: SIZE, height: SIZE },
      );
    } else {
      device.queue.copyExternalImageToTexture(
        { source: canvas },
        { texture: srcTex },
        { width: SIZE, height: SIZE },
      );
    }
    const outTex = device.createTexture({
      size: { width: SIZE, height: SIZE },
      format: "rgba8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    const pipeline = createFinishPipeline(device, {
      width: SIZE,
      height: SIZE,
      outputFormat: "rgba8unorm",
      params,
    });
    const readBuf = device.createBuffer({
      size: SIZE * SIZE * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = device.createCommandEncoder();
    pipeline.render(encoder, srcTex.createView(), outTex.createView(), { seedU32 });
    encoder.copyTextureToBuffer(
      { texture: outTex },
      { buffer: readBuf, bytesPerRow: SIZE * 4 },
      { width: SIZE, height: SIZE },
    );
    device.queue.submit([encoder.finish()]);
    await readBuf.mapAsync(GPUMapMode.READ);
    const out = new Uint8Array(readBuf.getMappedRange().slice(0));
    readBuf.unmap();
    pipeline.destroy();
    srcTex.destroy();
    outTex.destroy();
    readBuf.destroy();
    return out;
  };

  const sourceAt = (frame: number): Uint8ClampedArray => {
    drawLatticeBreathSourceFrame(c2d, SIZE, frame);
    return new Uint8ClampedArray(c2d.getImageData(0, 0, SIZE, SIZE).data);
  };
  const seedAt = (frame: number): number =>
    deriveGrainSeedU32(grainTemporalSeed(FINISH_STREAM_NAMESPACE, P.grainSeed, frame));

  // main — full chain across frames
  const main: Array<Record<string, unknown>> = [];
  for (const frame of MAIN_FRAMES) {
    console.info(`[parity] main frame ${frame}: source`);
    const src = sourceAt(frame);
    console.info(`[parity] main frame ${frame}: cpu oracle`);
    const cpu = applyFinishCpu(
      { buf: src, w: SIZE, h: SIZE },
      P,
      { namespace: FINISH_STREAM_NAMESPACE },
      frame,
    );
    console.info(`[parity] main frame ${frame}: gpu`);
    const gpu = await gpuRun(P, src, seedAt(frame), "write");
    const stats = compareBytes(cpu.buf, gpu);
    console.info(`[parity] main frame ${frame}: done`, stats);
    main.push({ frame, ...stats, pass: passMain(stats) });
  }

  const legSrc = sourceAt(LEG_FRAME);
  const legSeed = seedAt(LEG_FRAME);

  // leg a — CA off: GPU vs CPU grain-only
  const grainOnlyCpu = applyGrainOnlyCpu(
    { buf: legSrc, w: SIZE, h: SIZE },
    P,
    { namespace: FINISH_STREAM_NAMESPACE },
    LEG_FRAME,
  );
  const legAStats = compareBytes(
    grainOnlyCpu.buf,
    await gpuRun({ ...P, caFringing: 0 }, legSrc, legSeed, "write"),
  );
  const legA = { ...legAStats, pass: passMain(legAStats) };

  // leg b — all effects off via writeTexture: must equal source exactly
  const zeroParams = { ...P, grainStrength: 0, caFringing: 0 };
  const legBStats = compareBytes(
    legSrc,
    await gpuRun(zeroParams, legSrc, legSeed, "write"),
  );
  const legB = { ...legBStats, pass: legBStats.mismatched === 0 };

  // leg d — all effects off via copyExternalImageToTexture (the live demo's upload path)
  const legDStats = compareBytes(
    legSrc,
    await gpuRun(zeroParams, legSrc, legSeed, "copyExternal"),
  );
  const legD = { ...legDStats, pass: legDStats.mismatched === 0 };

  // leg c — corrupted seed must FAIL the main criteria
  const legCStats = compareBytes(
    applyFinishCpu(
      { buf: legSrc, w: SIZE, h: SIZE },
      P,
      { namespace: FINISH_STREAM_NAMESPACE },
      LEG_FRAME,
    ).buf,
    await gpuRun(P, legSrc, (legSeed + 1) >>> 0, "write"),
  );
  const legC = {
    ...legCStats,
    mismatchedFrac: legCStats.mismatched / legCStats.total,
    pass: legCStats.mismatched / legCStats.total > 0.05,
  };

  device.destroy();

  const overall =
    main.every((m) => m.pass) && legA.pass && legB.pass && legD.pass && legC.pass
      ? "PASS"
      : "FAIL";
  return { webgpu: true, size: SIZE, main, legA, legB, legD, legC, overall };
}

export default function FinishParityClient() {
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    runHarness()
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        setStatus("done");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setReport({ error: String(e) });
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[42rem] px-6 py-24">
      <h1 className="text-xl font-medium">finish parity harness (dev only)</h1>
      <pre
        data-parity-status={status}
        className="mt-6 overflow-x-auto rounded-md border border-[var(--text-base-20)] bg-[var(--bg-secondary)] p-4 text-[12px] leading-[1.6]"
      >
        {report ? JSON.stringify(report, null, 2) : "running…"}
      </pre>
    </main>
  );
}
