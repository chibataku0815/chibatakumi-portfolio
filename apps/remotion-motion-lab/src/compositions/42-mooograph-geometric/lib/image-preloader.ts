/**
 * MOOOGRAPH Geometric — Image Preloader Hook
 *
 * Uses Remotion's delayRender/continueRender to ensure all raster
 * assets are loaded before the first frame is painted.
 * Gracefully handles missing assets (returns null entries).
 */
import { useState, useEffect } from "react";
import { delayRender, continueRender, staticFile } from "remotion";

export function useCanvasImages(
  sources: Record<string, string>,
): Record<string, HTMLImageElement> | null {
  const [images, setImages] = useState<Record<
    string,
    HTMLImageElement
  > | null>(null);
  const [handle] = useState(() => delayRender("Loading MOOOGRAPH assets"));

  useEffect(() => {
    const entries = Object.entries(sources);
    if (entries.length === 0) {
      setImages({});
      continueRender(handle);
      return;
    }

    const loaded: Record<string, HTMLImageElement> = {};
    let count = 0;

    for (const [key, src] of entries) {
      const img = new Image();
      img.onload = () => {
        loaded[key] = img;
        count++;
        if (count === entries.length) {
          setImages(loaded);
          continueRender(handle);
        }
      };
      img.onerror = () => {
        // Asset not yet available — skip gracefully
        console.warn(`[MOOOGRAPH] Failed to load: ${src}`);
        count++;
        if (count === entries.length) {
          setImages(loaded);
          continueRender(handle);
        }
      };
      img.src = staticFile(src);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return images;
}
