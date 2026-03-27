/**
 * Film Lab Debug GUI (lil-gui, #debug hash)
 */

import type { Viewport } from "../scene/Viewport";

interface DebugGUIOptions {
  viewport: Viewport;
}

export async function setupDebugGUI(options: DebugGUIOptions): Promise<void> {
  const { GUI } = await import("lil-gui");
  const gui = new GUI({ title: "Film Lab #debug" });

  const { viewport } = options;

  // ===== Color Grading folder =====
  const gradingFolder = gui.addFolder("Color Grading");
  const grading = {
    exposure: 0.0,
    contrast: 1.0,
    saturation: 1.0,
    temperature: 0.0,
  };

  gradingFolder
    .add(grading, "exposure", -3.0, 3.0, 0.01)
    .name("Exposure")
    .onChange((v: number) => viewport.setExposure(v));
  gradingFolder
    .add(grading, "contrast", 0.0, 3.0, 0.01)
    .name("Contrast")
    .onChange((v: number) => viewport.setContrast(v));
  gradingFolder
    .add(grading, "saturation", 0.0, 3.0, 0.01)
    .name("Saturation")
    .onChange((v: number) => viewport.setSaturation(v));
  gradingFolder
    .add(grading, "temperature", -1.0, 1.0, 0.01)
    .name("Temperature")
    .onChange((v: number) => viewport.setTemperature(v));

  // ===== Effects folder =====
  const effectsFolder = gui.addFolder("Effects");
  const effects = {
    rgbShift: 0.0,
    grain: 0.0,
    vignette: 0.0,
  };

  effectsFolder
    .add(effects, "rgbShift", 0, 0.05, 0.001)
    .name("RGB Shift")
    .onChange((v: number) => viewport.setRGBShift(v));
  effectsFolder
    .add(effects, "grain", 0, 0.5, 0.01)
    .name("Film Grain")
    .onChange((v: number) => viewport.setGrainIntensity(v));
  effectsFolder
    .add(effects, "vignette", 0, 1.0, 0.01)
    .name("Vignette")
    .onChange((v: number) => viewport.setVignette(v));

  // ===== Before/After folder =====
  const splitFolder = gui.addFolder("Before / After");
  const split = { position: 0.5 };

  splitFolder
    .add(split, "position", 0, 1, 0.01)
    .name("Split Position")
    .onChange((v: number) => {
      viewport.setSplitPosition(v);
      // Update CSS handle position too
      const handle = document.getElementById("split-handle");
      if (handle) handle.style.left = `${v * window.innerWidth}px`;
    });

  // ===== LUT folder =====
  const lutFolder = gui.addFolder("LUT");
  const lutParams = {
    intensity: 1.0,
    clear: () => {
      viewport.clearLUT();
      lutParams.intensity = 1.0;
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    },
    load: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".cube";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        // parseCube を dynamic import で使う
        const { parseCube } = await import("./cube-parser");
        const text = await file.text();
        const lut = parseCube(text);
        viewport.setLUT(lut.data, lut.size);
        console.log(`LUT loaded: ${lut.title || file.name} (${lut.size}³)`);
      };
      input.click();
    },
  };

  lutFolder.add(lutParams, "load").name("Load .cube LUT");
  lutFolder
    .add(lutParams, "intensity", 0, 1, 0.01)
    .name("LUT Intensity")
    .onChange((v: number) => viewport.setLUTIntensity(v));
  lutFolder.add(lutParams, "clear").name("Clear LUT");

  // ===== Presets folder =====
  const presetsFolder = gui.addFolder("Presets");
  const presets = {
    reset: () => {
      grading.exposure = 0.0;
      grading.contrast = 1.0;
      grading.saturation = 1.0;
      grading.temperature = 0.0;
      effects.rgbShift = 0.0;
      effects.grain = 0.0;
      effects.vignette = 0.0;
      viewport.setExposure(0.0);
      viewport.setContrast(1.0);
      viewport.setSaturation(1.0);
      viewport.setTemperature(0.0);
      viewport.setRGBShift(0.0);
      viewport.setGrainIntensity(0.0);
      viewport.setVignette(0.0);
      viewport.clearLUT();
      lutParams.intensity = 1.0;
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    },
    cinematic: () => {
      grading.exposure = 0.1;
      grading.contrast = 1.3;
      grading.saturation = 0.85;
      grading.temperature = -0.15;
      effects.rgbShift = 0.002;
      effects.grain = 0.08;
      effects.vignette = 0.4;
      applyPreset();
    },
    portra: () => {
      grading.exposure = 0.2;
      grading.contrast = 1.1;
      grading.saturation = 0.9;
      grading.temperature = 0.1;
      effects.rgbShift = 0.0;
      effects.grain = 0.12;
      effects.vignette = 0.2;
      applyPreset();
    },
    bw: () => {
      grading.exposure = 0.1;
      grading.contrast = 1.4;
      grading.saturation = 0.0;
      grading.temperature = 0.0;
      effects.rgbShift = 0.0;
      effects.grain = 0.15;
      effects.vignette = 0.5;
      applyPreset();
    },
  };

  function applyPreset(): void {
    viewport.setExposure(grading.exposure);
    viewport.setContrast(grading.contrast);
    viewport.setSaturation(grading.saturation);
    viewport.setTemperature(grading.temperature);
    viewport.setRGBShift(effects.rgbShift);
    viewport.setGrainIntensity(effects.grain);
    viewport.setVignette(effects.vignette);
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  presetsFolder.add(presets, "reset").name("Reset All");
  presetsFolder.add(presets, "cinematic").name("Cinematic");
  presetsFolder.add(presets, "portra").name("Portra 400");
  presetsFolder.add(presets, "bw").name("B&W Film");
}
