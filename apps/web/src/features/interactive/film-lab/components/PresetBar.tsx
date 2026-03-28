"use client";

import { PRESET_BUTTONS, type PresetName } from "../preset-data";

interface PresetBarProps {
  activePreset: PresetName | null;
  onPreset: (name: PresetName) => void;
}

export function PresetBar({ activePreset, onPreset }: PresetBarProps) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:overflow-visible md:px-0">
      <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
        {PRESET_BUTTONS.map(({ name, label, subtitle }) => (
          <button
            key={name}
            onClick={() => onPreset(name)}
            className={`flex min-w-[108px] flex-col items-start rounded-2xl px-3 py-2 text-left transition-all duration-200 ${
              activePreset === name
                ? "bg-[var(--accent-amber1)]/14 text-[var(--accent-amber1)] ring-1 ring-[var(--accent-amber1)]/30"
                : "bg-white/5 text-white/55 hover:bg-white/8 hover:text-white/75"
            }`}
          >
            <span className="font-mono text-[10px] tracking-wide">{label}</span>
            <span className="mt-1 text-[10px] leading-tight text-white/38">
              {subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
