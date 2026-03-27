"use client";

import { useState, useCallback } from "react";
import { ControlSlider } from "./ui/ControlSlider";
import { LUTPanel } from "./LUTPanel";
import { PresetBar } from "./PresetBar";
import type { Viewport } from "../core/Viewport";
import { PRESETS, type PresetName } from "./FilmLabCanvas";

interface ControlPanelProps {
  viewport: Viewport | null;
}

interface Params {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  rgbShift: number;
  grainIntensity: number;
  vignette: number;
}

const DEFAULTS: Params = { ...PRESETS.reset };

export function ControlPanel({ viewport }: ControlPanelProps) {
  const [params, setParams] = useState<Params>({ ...DEFAULTS });
  const [activePreset, setActivePreset] = useState<PresetName>("cinematic");

  const updateParam = useCallback(
    (key: string, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
      if (!viewport) return;

      // Viewport setter を呼ぶ
      switch (key) {
        case "exposure":
          viewport.setExposure(value);
          break;
        case "contrast":
          viewport.setContrast(value);
          break;
        case "saturation":
          viewport.setSaturation(value);
          break;
        case "temperature":
          viewport.setTemperature(value);
          break;
        case "rgbShift":
          viewport.setRGBShift(value);
          break;
        case "grainIntensity":
          viewport.setGrainIntensity(value);
          break;
        case "vignette":
          viewport.setVignette(value);
          break;
      }
      setActivePreset("reset"); // カスタム変更時はプリセット解除
    },
    [viewport],
  );

  const applyPreset = useCallback(
    (name: PresetName) => {
      const preset = PRESETS[name];
      setParams({ ...preset });
      setActivePreset(name);
      viewport?.setParams(preset);
    },
    [viewport],
  );

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/60 p-4 backdrop-blur-xl">
      {/* グリッド: Color | Effects | LUT + Presets */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {/* === COLOR GRADING === */}
        <div>
          <SectionHeader title="Color" />
          <div className="flex flex-col gap-2.5">
            <ControlSlider label="Exposure" value={params.exposure} min={-3} max={3} step={0.01} defaultValue={0} onChange={(v) => updateParam("exposure", v)} />
            <ControlSlider label="Contrast" value={params.contrast} min={0} max={3} step={0.01} defaultValue={1} onChange={(v) => updateParam("contrast", v)} />
            <ControlSlider label="Saturation" value={params.saturation} min={0} max={3} step={0.01} defaultValue={1} onChange={(v) => updateParam("saturation", v)} />
            <ControlSlider label="Temperature" value={params.temperature} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("temperature", v)} />
          </div>
        </div>

        {/* === EFFECTS === */}
        <div>
          <SectionHeader title="Effects" />
          <div className="flex flex-col gap-2.5">
            <ControlSlider label="RGB Shift" value={params.rgbShift} min={0} max={0.05} step={0.001} defaultValue={0} onChange={(v) => updateParam("rgbShift", v)} />
            <ControlSlider label="Film Grain" value={params.grainIntensity} min={0} max={0.5} step={0.01} defaultValue={0} onChange={(v) => updateParam("grainIntensity", v)} />
            <ControlSlider label="Vignette" value={params.vignette} min={0} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("vignette", v)} />
          </div>
        </div>

        {/* === LUT + PRESETS === */}
        <div>
          <LUTPanel viewport={viewport} />
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <SectionHeader title="Presets" />
            <PresetBar activePreset={activePreset} onPreset={applyPreset} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-2 mt-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 first:mt-0">
      {title}
    </h3>
  );
}

