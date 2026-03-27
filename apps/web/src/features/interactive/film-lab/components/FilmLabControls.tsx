"use client";

import type { PresetName } from "./FilmLabCanvas";

interface FilmLabControlsProps {
  onPreset: (name: PresetName) => void;
  activePreset: PresetName;
}

const PRESET_BUTTONS: { name: PresetName; label: string }[] = [
  { name: "cinematic", label: "Cinematic" },
  { name: "portra", label: "Portra 400" },
  { name: "bw", label: "B&W Film" },
  { name: "reset", label: "Reset" },
];

export function FilmLabControls({
  onPreset,
  activePreset,
}: FilmLabControlsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {PRESET_BUTTONS.map(({ name, label }) => (
        <button
          key={name}
          onClick={() => onPreset(name)}
          className={`rounded px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
            activePreset === name
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          {label}
        </button>
      ))}
      <span className="ml-auto self-center text-[10px] text-white/30">
        Drag &amp; drop image / video / .cube LUT
      </span>
    </div>
  );
}
