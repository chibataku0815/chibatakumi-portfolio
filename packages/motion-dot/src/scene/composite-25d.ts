/**
 * composite-25d.ts — Multi-Scene Gallery mode.
 *
 * Renders 2-4 particle scenes simultaneously in a grid layout.
 * Each panel renders to its own texture, then the compositor
 * arranges them as textured quads on the output.
 */

import {
  createCompositor,
  type CompositorLayer,
  type Quad,
} from "gpu-2.5d-presets";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export type PanelRenderer = (
  encoder: GPUCommandEncoder,
  targetView: GPUTextureView,
  sceneIdx: number,
  width: number,
  height: number,
) => void;

export interface GalleryMode {
  render(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
    sceneCount: number,
    renderPanel: PanelRenderer,
    time: number,
  ): void;
  resize(width: number, height: number): void;
  /** Advance to next layout. Returns false when past the last (caller should disable gallery). */
  nextLayout(): boolean;
  /** Go to previous layout. Returns false when before the first (caller should disable gallery). */
  prevLayout(): boolean;
  resetLayout(): void;
  resetLayoutToLast(): void;
  getLayoutName(): string;
  getBaseSceneIndex(): number;
  setBaseSceneIndex(idx: number): void;
  shiftBase(delta: number): void;
  getPanelCount(): number;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GAP_PX = 4;

const GAP_COLOR: GPUColor = {
  r: 0.82,
  g: 0.82,
  b: 0.82,
  a: 1.0,
};

const PANEL_TEXTURE_FORMAT: GPUTextureFormat = "rgba16float";

// ---------------------------------------------------------------------------
// Layout presets
// ---------------------------------------------------------------------------

interface LayoutPreset {
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
}

const LAYOUTS: LayoutPreset[] = [
  { name: "2", cols: 2, rows: 1 },
  { name: "4", cols: 2, rows: 2 },
  { name: "8", cols: 4, rows: 2 },
  { name: "12", cols: 4, rows: 3 },
];

// ---------------------------------------------------------------------------
// Layout computation (pure)
// ---------------------------------------------------------------------------

interface PanelLayout {
  readonly quad: Quad;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
}

function computeLayout(
  canvasW: number,
  canvasH: number,
  preset: LayoutPreset,
  gapPx: number,
): PanelLayout[] {
  const { cols, rows } = preset;
  const panelW = Math.floor((canvasW - (cols + 1) * gapPx) / cols);
  const panelH = Math.floor((canvasH - (rows + 1) * gapPx) / rows);

  const halfW = canvasW / 2;
  const halfH = canvasH / 2;

  const panels: PanelLayout[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pixelX = gapPx + col * (panelW + gapPx);
      const pixelY = gapPx + row * (panelH + gapPx);

      const ndcLeft = pixelX / halfW - 1;
      const ndcRight = (pixelX + panelW) / halfW - 1;
      const ndcTop = 1 - pixelY / halfH;
      const ndcBottom = 1 - (pixelY + panelH) / halfH;

      panels.push({
        quad: {
          topLeft: { x: ndcLeft, y: ndcTop },
          topRight: { x: ndcRight, y: ndcTop },
          bottomRight: { x: ndcRight, y: ndcBottom },
          bottomLeft: { x: ndcLeft, y: ndcBottom },
        },
        pixelWidth: panelW,
        pixelHeight: panelH,
      });
    }
  }

  return panels;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Panel texture pool
// ---------------------------------------------------------------------------

interface TexturePool {
  textures: GPUTexture[];
  views: GPUTextureView[];
  width: number;
  height: number;
  count: number;
}

function createTexturePool(
  device: GPUDevice,
  count: number,
  width: number,
  height: number,
): TexturePool {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const textures: GPUTexture[] = [];
  const views: GPUTextureView[] = [];

  for (let i = 0; i < count; i++) {
    const tex = device.createTexture({
      label: `gallery-panel-${i}`,
      size: { width: safeW, height: safeH },
      format: PANEL_TEXTURE_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    textures.push(tex);
    views.push(tex.createView());
  }

  return { textures, views, width: safeW, height: safeH, count };
}

function destroyTexturePool(pool: TexturePool): void {
  for (const tex of pool.textures) {
    tex.destroy();
  }
  pool.textures.length = 0;
  pool.views.length = 0;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGalleryMode(
  device: GPUDevice,
  width: number,
  height: number,
): GalleryMode {
  const compositor = createCompositor(device, width, height, { maxLayers: 12 });

  let canvasW = width;
  let canvasH = height;
  let layoutIdx = 0;
  let baseSceneIndex = 0;
  let lastSceneCount = 1;

  let currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
  let pool = createTexturePool(
    device,
    currentLayout.length,
    currentLayout[0].pixelWidth,
    currentLayout[0].pixelHeight,
  );

  function rebuildPool(): void {
    destroyTexturePool(pool);
    currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
    if (currentLayout.length === 0) return;
    pool = createTexturePool(
      device,
      currentLayout.length,
      currentLayout[0].pixelWidth,
      currentLayout[0].pixelHeight,
    );
  }

  function needsPoolRebuild(): boolean {
    if (pool.count !== currentLayout.length) return true;
    if (currentLayout.length === 0) return false;
    const first = currentLayout[0];
    return pool.width !== Math.max(1, first.pixelWidth)
      || pool.height !== Math.max(1, first.pixelHeight);
  }

  function clearOutput(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
  ): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: outputView,
          clearValue: GAP_COLOR,
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });
    pass.end();
  }

  return {
    render(encoder, outputView, sceneCount, renderPanel, _time) {
      lastSceneCount = Math.max(1, sceneCount);

      currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
      if (needsPoolRebuild()) {
        rebuildPool();
      }

      const panelCount = currentLayout.length;
      if (panelCount === 0) return;

      // 1. Render each scene into its panel texture.
      //    Each panel gets its own encoder+submit so that the SDF's
      //    device.queue.writeBuffer() params are consumed before the
      //    next panel overwrites them.
      for (let i = 0; i < panelCount; i++) {
        const sceneIdx = (baseSceneIndex + i) % lastSceneCount;
        const panelEncoder = device.createCommandEncoder({
          label: `gallery-panel-${i}`,
        });
        renderPanel(
          panelEncoder,
          pool.views[i],
          sceneIdx,
          pool.width,
          pool.height,
        );
        device.queue.submit([panelEncoder.finish()]);
      }

      // 2. Clear output to gap color + composite panel textures
      //    (uses the caller's encoder — submitted after panel renders)
      clearOutput(encoder, outputView);

      const layers: CompositorLayer[] = currentLayout.map((panel, i) => ({
        texture: pool.textures[i],
        quad: panel.quad,
        opacity: 1.0,
        depth: panelCount - i,
      }));

      compositor.render(encoder, outputView, layers);
    },

    resize(w, h) {
      canvasW = w;
      canvasH = h;
      compositor.resize(w, h);
      currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
      rebuildPool();
    },

    nextLayout() {
      layoutIdx++;
      if (layoutIdx >= LAYOUTS.length) {
        layoutIdx = 0;
        return false;
      }
      currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
      rebuildPool();
      return true;
    },

    prevLayout() {
      layoutIdx--;
      if (layoutIdx < 0) {
        layoutIdx = LAYOUTS.length - 1;
        return false;
      }
      currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
      rebuildPool();
      return true;
    },

    resetLayout() {
      layoutIdx = 0;
      currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
      rebuildPool();
    },

    resetLayoutToLast() {
      layoutIdx = LAYOUTS.length - 1;
      currentLayout = computeLayout(canvasW, canvasH, LAYOUTS[layoutIdx], GAP_PX);
      rebuildPool();
    },

    getLayoutName() {
      return LAYOUTS[layoutIdx].name;
    },

    getBaseSceneIndex() {
      return baseSceneIndex;
    },

    setBaseSceneIndex(idx: number) {
      baseSceneIndex = idx;
    },

    shiftBase(delta: number) {
      baseSceneIndex =
        ((baseSceneIndex + delta) % lastSceneCount + lastSceneCount) %
        lastSceneCount;
    },

    getPanelCount() {
      return LAYOUTS[layoutIdx].cols * LAYOUTS[layoutIdx].rows;
    },

    destroy() {
      destroyTexturePool(pool);
      compositor.destroy();
    },
  };
}
