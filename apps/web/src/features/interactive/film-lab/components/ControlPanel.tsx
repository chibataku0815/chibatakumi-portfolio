"use client";

import { useState, useCallback } from "react";
import { ControlSlider } from "./ui/ControlSlider";
import { LUTPanel } from "./LUTPanel";
import { PresetBar } from "./PresetBar";
import type { Viewport } from "../core/Viewport";
import { PRESETS, type PresetName, halationHueToHex } from "./FilmLabCanvas";

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
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  halationIntensity: number;
  halationSpread: number;
  halationHue: number;
  fade: number;
  highlights: number;
  shadows: number;
}

const DEFAULTS: Params = { ...PRESETS.reset };

export function ControlPanel({ viewport }: ControlPanelProps) {
  const [params, setParams] = useState<Params>({ ...DEFAULTS });
  const [activePreset, setActivePreset] = useState<PresetName>("cinematic");
  const [bloomEnabled, setBloomEnabled] = useState(false);
  const [halationEnabled, setHalationEnabled] = useState(false);
  const [savedBloomStrength, setSavedBloomStrength] = useState(0.3);
  const [savedHalationIntensity, setSavedHalationIntensity] = useState(0.25);

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
        case "bloomThreshold":
          viewport.setBloomThreshold(value);
          break;
        case "bloomStrength":
          viewport.setBloomStrength(value);
          break;
        case "bloomRadius":
          viewport.setBloomRadius(value);
          break;
        case "halationIntensity":
          viewport.setHalationIntensity(value);
          break;
        case "halationSpread":
          viewport.setHalationSpread(value);
          break;
        case "fade":
          viewport.setFade(value);
          break;
        case "highlights":
          viewport.setHighlights(value);
          break;
        case "shadows":
          viewport.setShadows(value);
          break;
      }
      setActivePreset("reset"); // カスタム変更時はプリセット解除
    },
    [viewport],
  );

  const updateHalationHue = useCallback(
    (hue: number) => {
      setParams((prev) => ({ ...prev, halationHue: hue }));
      if (!viewport) return;
      viewport.setHalationColor(halationHueToHex(hue));
      setActivePreset("reset");
    },
    [viewport],
  );

  const toggleBloom = useCallback(
    (on: boolean) => {
      setBloomEnabled(on);
      if (on) {
        const strength = savedBloomStrength || 0.3;
        updateParam("bloomStrength", strength);
      } else {
        if (params.bloomStrength > 0) setSavedBloomStrength(params.bloomStrength);
        updateParam("bloomStrength", 0);
      }
    },
    [params.bloomStrength, savedBloomStrength, updateParam],
  );

  const toggleHalation = useCallback(
    (on: boolean) => {
      setHalationEnabled(on);
      if (on) {
        const intensity = savedHalationIntensity || 0.25;
        updateParam("halationIntensity", intensity);
      } else {
        if (params.halationIntensity > 0) setSavedHalationIntensity(params.halationIntensity);
        updateParam("halationIntensity", 0);
      }
    },
    [params.halationIntensity, savedHalationIntensity, updateParam],
  );

  const applyPreset = useCallback(
    (name: PresetName) => {
      const preset = PRESETS[name];
      setParams({ ...preset });
      setActivePreset(name);
      viewport?.setParams({
        ...preset,
        halationColor: halationHueToHex(preset.halationHue),
      } as Record<string, number | string>);
      setBloomEnabled(preset.bloomStrength > 0);
      setHalationEnabled(preset.halationIntensity > 0);
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
            <ControlSlider label="Highlights" value={params.highlights} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("highlights", v)} />
            <ControlSlider label="Shadows" value={params.shadows} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("shadows", v)} />
            <ControlSlider label="Fade" value={params.fade} min={0} max={0.3} step={0.01} defaultValue={0} onChange={(v) => updateParam("fade", v)} />
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

          <ToggleHeader title="Bloom" enabled={bloomEnabled} onToggle={toggleBloom} />
          <div className={`flex flex-col gap-2.5 ${!bloomEnabled ? "pointer-events-none opacity-30" : ""}`}>
            <ControlSlider label="Strength" value={params.bloomStrength} min={0} max={3} step={0.01} defaultValue={0} onChange={(v) => updateParam("bloomStrength", v)} />
            <ControlSlider label="Threshold" value={params.bloomThreshold} min={0} max={1} step={0.01} defaultValue={0.8} onChange={(v) => updateParam("bloomThreshold", v)} />
            <ControlSlider label="Radius" value={params.bloomRadius} min={0} max={1} step={0.01} defaultValue={0.4} onChange={(v) => updateParam("bloomRadius", v)} />
          </div>

          <ToggleHeader title="Halation" enabled={halationEnabled} onToggle={toggleHalation} />
          <div className={`flex flex-col gap-2.5 ${!halationEnabled ? "pointer-events-none opacity-30" : ""}`}>
            <ControlSlider label="Intensity" value={params.halationIntensity} min={0} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("halationIntensity", v)} />
            <ControlSlider label="Spread" value={params.halationSpread} min={0} max={50} step={0.5} defaultValue={15} onChange={(v) => updateParam("halationSpread", v)} />
            <HueSlider value={params.halationHue} onChange={updateHalationHue} />
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

function HueSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const hex = halationHueToHex(value);
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[11px] text-white/50 sm:w-24">Hue</span>
      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="halation-hue-slider h-1.5 w-full cursor-pointer appearance-none rounded-full touch-none"
          style={{
            background: `linear-gradient(to right, #e81020, #d83818, #c86010)`,
          }}
        />
      </div>
      <div
        className="h-4 w-4 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: hex }}
      />
    </div>
  );
}

function ToggleHeader({
  title,
  enabled,
  onToggle,
}: {
  title: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div className="mb-2 mt-3 flex items-center justify-between">
      <h3 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
        {title}
      </h3>
      <button
        onClick={() => onToggle(!enabled)}
        className={`h-4 w-7 rounded-full transition-colors ${
          enabled ? "bg-[var(--accent-amber1)]" : "bg-white/15"
        }`}
      >
        <div
          className={`h-3 w-3 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

