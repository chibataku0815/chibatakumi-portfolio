// Lazy default — referencing GPUTextureUsage at module top breaks SSR
// (the global only exists in browser contexts). Resolved on first use.
function getDefaultUsage(): GPUTextureUsageFlags {
  return GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
}

export interface OffscreenTargetOptions {
  label?: string;
  width: number;
  height: number;
  format: GPUTextureFormat;
  usage?: GPUTextureUsageFlags;
}

interface OffscreenTargetEntry {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
}

export interface OffscreenTargetPool {
  get(name: string, options: OffscreenTargetOptions): GPUTextureView;
  destroy(name?: string): void;
  destroyAll(): void;
}

export function createOffscreenTargetPool(device: GPUDevice): OffscreenTargetPool {
  const targets = new Map<string, OffscreenTargetEntry>();

  function destroyEntry(name: string): void {
    const entry = targets.get(name);
    if (!entry) {
      return;
    }

    entry.texture.destroy();
    targets.delete(name);
  }

  return {
    get(name: string, options: OffscreenTargetOptions): GPUTextureView {
      const usage = options.usage ?? getDefaultUsage();
      const current = targets.get(name);

      if (
        current
        && current.width === options.width
        && current.height === options.height
        && current.format === options.format
        && current.usage === usage
      ) {
        return current.view;
      }

      destroyEntry(name);

      const texture = device.createTexture({
        label: options.label,
        size: {
          width: options.width,
          height: options.height,
        },
        format: options.format,
        usage,
      });

      const entry: OffscreenTargetEntry = {
        texture,
        view: texture.createView(),
        width: options.width,
        height: options.height,
        format: options.format,
        usage,
      };

      targets.set(name, entry);
      return entry.view;
    },
    destroy(name?: string): void {
      if (name) {
        destroyEntry(name);
        return;
      }

      for (const key of targets.keys()) {
        destroyEntry(key);
      }
    },
    destroyAll(): void {
      for (const key of targets.keys()) {
        destroyEntry(key);
      }
    },
  };
}
