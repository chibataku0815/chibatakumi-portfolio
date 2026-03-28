"use client";

import { useReducer, useState, useCallback, useEffect } from "react";
import { ControlSlider } from "./ui/ControlSlider";
import { LUTPanel } from "./LUTPanel";
import { PresetBar } from "./PresetBar";
import type { Viewport } from "../core/Viewport";
import { PRESETS, type PresetName, halationHueToHex } from "./FilmLabCanvas";
import { filmLabReducer, createInitialState, type Params } from "./film-lab-reducer";

interface ControlPanelProps {
  viewport: Viewport | null;
  onHistogramToggle?: () => void;
}

export function ControlPanel({ viewport, onHistogramToggle }: ControlPanelProps) {
  const [state, dispatch] = useReducer(
    filmLabReducer,
    { ...PRESETS.cinematic } as Params,
    createInitialState,
  );
  const [activePreset, setActivePreset] = useState<PresetName>("cinematic");
  const [bloomEnabled, setBloomEnabled] = useState(PRESETS.cinematic.bloomStrength > 0);
  const [halationEnabled, setHalationEnabled] = useState(PRESETS.cinematic.halationIntensity > 0);
  const [savedBloomStrength, setSavedBloomStrength] = useState(0.3);
  const [savedHalationIntensity, setSavedHalationIntensity] = useState(0.25);
  const [effectsOpen, setEffectsOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Mobile: close Effects section by default
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setEffectsOpen(false);
    }
  }, []);

  // Viewport sync — all param changes (including Undo/Redo) flow through here
  useEffect(() => {
    if (!viewport) return;
    viewport.setParams({
      ...state.params,
      halationColor: halationHueToHex(state.params.halationHue),
    } as Record<string, number | string>);
  }, [state.params, viewport]);

  // Sync toggle states after Undo/Redo
  useEffect(() => {
    setBloomEnabled(state.params.bloomStrength > 0);
  }, [state.params.bloomStrength]);

  useEffect(() => {
    setHalationEnabled(state.params.halationIntensity > 0);
  }, [state.params.halationIntensity]);

  const updateParam = useCallback((key: keyof Params, value: number) => {
    dispatch({ type: "SET_PARAM", key, value });
    setActivePreset("reset");
  }, []);

  const commit = useCallback(() => {
    dispatch({ type: "COMMIT" });
  }, []);

  const updateHalationHue = useCallback((hue: number) => {
    dispatch({ type: "SET_PARAM", key: "halationHue", value: hue });
    setActivePreset("reset");
  }, []);

  const toggleBloom = useCallback(
    (on: boolean) => {
      setBloomEnabled(on);
      if (on) {
        dispatch({ type: "SET_PARAM", key: "bloomStrength", value: savedBloomStrength || 0.3 });
      } else {
        if (state.params.bloomStrength > 0) setSavedBloomStrength(state.params.bloomStrength);
        dispatch({ type: "SET_PARAM", key: "bloomStrength", value: 0 });
      }
      dispatch({ type: "COMMIT" });
      setActivePreset("reset");
    },
    [state.params.bloomStrength, savedBloomStrength],
  );

  const toggleHalation = useCallback(
    (on: boolean) => {
      setHalationEnabled(on);
      if (on) {
        dispatch({ type: "SET_PARAM", key: "halationIntensity", value: savedHalationIntensity || 0.25 });
      } else {
        if (state.params.halationIntensity > 0) setSavedHalationIntensity(state.params.halationIntensity);
        dispatch({ type: "SET_PARAM", key: "halationIntensity", value: 0 });
      }
      dispatch({ type: "COMMIT" });
      setActivePreset("reset");
    },
    [state.params.halationIntensity, savedHalationIntensity],
  );

  const applyPreset = useCallback((name: PresetName) => {
    const preset = PRESETS[name];
    dispatch({ type: "APPLY_PRESET", preset: { ...preset } as Params });
    setActivePreset(name);
    setBloomEnabled(preset.bloomStrength > 0);
    setHalationEnabled(preset.halationIntensity > 0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const presetKeys: Record<string, PresetName> = {
      "1": "cinematic", "2": "portra", "3": "gold200", "4": "pro400h",
      "5": "ektar100", "6": "superia400", "7": "cinestill800t", "8": "bw", "0": "reset",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) return;

      const meta = e.metaKey || e.ctrlKey;

      // Redo: Cmd+Shift+Z (check before Undo — allow repeat)
      if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "REDO" });
        setActivePreset("reset");
        return;
      }
      // Undo: Cmd+Z (allow repeat)
      if (meta && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        setActivePreset("reset");
        return;
      }

      // For remaining shortcuts, skip key repeat
      if (e.repeat) return;

      // Preset shortcuts: 0-8
      if (presetKeys[e.key]) {
        applyPreset(presetKeys[e.key]);
        return;
      }
      // Space: Before/After (hold)
      if (e.key === " ") {
        e.preventDefault();
        dispatch({ type: "BEFORE_AFTER_ON" });
        return;
      }
      // H: Histogram toggle
      if (e.key === "h" || e.key === "H") {
        onHistogramToggle?.();
        return;
      }
      // ?: Shortcut help
      if (e.key === "?") {
        setShowHelp((prev) => !prev);
        return;
      }
      // Escape: close help
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        dispatch({ type: "BEFORE_AFTER_OFF" });
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keyup", handleKeyUp, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
    };
  }, [applyPreset, onHistogramToggle]);

  const { params } = state;

  return (
    <>
      <div className="rounded-lg border border-white/[0.06] bg-black/60 p-4 backdrop-blur-xl">
        {/* Grid: Color | Effects | LUT + Presets */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {/* === COLOR GRADING === */}
          <div>
            <SectionHeader title="Color" />
            <div className="flex flex-col gap-2.5">
              <ControlSlider label="Exposure" value={params.exposure} min={-3} max={3} step={0.01} defaultValue={0} onChange={(v) => updateParam("exposure", v)} onCommit={commit} />
              <ControlSlider label="Contrast" value={params.contrast} min={0} max={3} step={0.01} defaultValue={1} onChange={(v) => updateParam("contrast", v)} onCommit={commit} />
              <ControlSlider label="Saturation" value={params.saturation} min={0} max={3} step={0.01} defaultValue={1} onChange={(v) => updateParam("saturation", v)} onCommit={commit} />
              <ControlSlider label="Temperature" value={params.temperature} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("temperature", v)} onCommit={commit} />
              <ControlSlider label="Highlights" value={params.highlights} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("highlights", v)} onCommit={commit} />
              <ControlSlider label="Shadows" value={params.shadows} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("shadows", v)} onCommit={commit} />
              <ControlSlider label="Fade" value={params.fade} min={0} max={0.3} step={0.01} defaultValue={0} onChange={(v) => updateParam("fade", v)} onCommit={commit} />
            </div>
          </div>

          {/* === EFFECTS === */}
          <div>
            <CollapsibleHeader title="Effects" open={effectsOpen} onToggle={() => setEffectsOpen(!effectsOpen)} />
            {effectsOpen && (
              <div className="flex flex-col gap-2.5">
                <ControlSlider label="RGB Shift" value={params.rgbShift} min={0} max={0.05} step={0.001} defaultValue={0} onChange={(v) => updateParam("rgbShift", v)} onCommit={commit} />
                <ControlSlider label="Film Grain" value={params.grainIntensity} min={0} max={0.5} step={0.01} defaultValue={0} onChange={(v) => updateParam("grainIntensity", v)} onCommit={commit} />
                <ControlSlider label="Vignette" value={params.vignette} min={0} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("vignette", v)} onCommit={commit} />
              </div>
            )}

            <ToggleHeader title="Bloom" enabled={bloomEnabled} onToggle={toggleBloom} />
            <div className={`flex flex-col gap-2.5 ${!bloomEnabled ? "pointer-events-none opacity-30" : ""}`}>
              <ControlSlider label="Strength" value={params.bloomStrength} min={0} max={3} step={0.01} defaultValue={0} onChange={(v) => updateParam("bloomStrength", v)} onCommit={commit} />
              <ControlSlider label="Threshold" value={params.bloomThreshold} min={0} max={1} step={0.01} defaultValue={0.8} onChange={(v) => updateParam("bloomThreshold", v)} onCommit={commit} />
              <ControlSlider label="Radius" value={params.bloomRadius} min={0} max={1} step={0.01} defaultValue={0.4} onChange={(v) => updateParam("bloomRadius", v)} onCommit={commit} />
            </div>

            <ToggleHeader title="Halation" enabled={halationEnabled} onToggle={toggleHalation} />
            <div className={`flex flex-col gap-2.5 ${!halationEnabled ? "pointer-events-none opacity-30" : ""}`}>
              <ControlSlider label="Intensity" value={params.halationIntensity} min={0} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("halationIntensity", v)} onCommit={commit} />
              <ControlSlider label="Spread" value={params.halationSpread} min={0} max={50} step={0.5} defaultValue={15} onChange={(v) => updateParam("halationSpread", v)} onCommit={commit} />
              <HueSlider value={params.halationHue} onChange={updateHalationHue} onCommit={commit} />
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
      <ShortcutHelp open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-2 mt-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 first:mt-0">
      {title}
    </h3>
  );
}

function CollapsibleHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="mb-2 mt-3 flex w-full items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-white/60 first:mt-0"
      onClick={onToggle}
    >
      <span className={`text-[8px] transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
        &#9654;
      </span>
      {title}
    </button>
  );
}

function HueSlider({
  value,
  onChange,
  onCommit,
}: {
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
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
          onPointerUp={() => onCommit?.()}
          onTouchEnd={() => onCommit?.()}
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

function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const mod = isMac ? "\u2318" : "Ctrl";

  const shortcuts = [
    { key: "1 \u2013 8", action: "Select preset" },
    { key: "0", action: "Reset" },
    { key: "Space", action: "Before / After (hold)" },
    { key: `${mod}+Z`, action: "Undo" },
    { key: `${mod}+Shift+Z`, action: "Redo" },
    { key: "H", action: "Toggle histogram" },
    { key: "?", action: "This help" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-medium text-white/80">Keyboard Shortcuts</h2>
        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-8">
              <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/60">
                {s.key}
              </kbd>
              <span className="text-xs text-white/50">{s.action}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-white/30">Press ? or Esc to close</p>
      </div>
    </div>
  );
}
