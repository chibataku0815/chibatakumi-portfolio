"use client";

import type { PresetName } from "./FilmLabCanvas";

const PRESET_BUTTONS: { name: PresetName; label: string }[] = [
  { name: "cinematic", label: "Cinematic" },
  { name: "portra", label: "Portra" },
  { name: "gold200", label: "Gold 200" },
  { name: "pro400h", label: "Pro 400H" },
  { name: "ektar100", label: "Ektar 100" },
  { name: "superia400", label: "Superia" },
  { name: "cinestill800t", label: "CineStill" },
  { name: "bw", label: "B&W" },
  { name: "reset", label: "Reset" },
];

interface PresetBarProps {
  activePreset: PresetName;
  onPreset: (name: PresetName) => void;
}

export function PresetBar({ activePreset, onPreset }: PresetBarProps) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:overflow-visible md:px-0">
      <div className="flex gap-1.5 w-max md:w-auto md:flex-wrap">
        {PRESET_BUTTONS.map(({ name, label }) => (
          <button
            key={name}
            onClick={() => onPreset(name)}
            className={`rounded-full px-3 py-1 font-mono text-[10px] tracking-wide transition-all duration-200 ${
              activePreset === name
                ? "bg-[var(--accent-amber1)]/15 text-[var(--accent-amber1)] ring-1 ring-[var(--accent-amber1)]/30"
                : "bg-white/5 text-white/50 hover:bg-white/8 hover:text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
