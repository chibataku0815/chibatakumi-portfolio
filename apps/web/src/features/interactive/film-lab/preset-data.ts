import { PRESETS, PARAM_KEYS, type Params, type PresetName } from "film-lab-core";

export { PRESETS, type PresetName };

/** Dehancer-style hue: 0 = deep red → 100 = orange-red */
export function halationHueToHex(hue: number): string {
  const t = Math.max(0, Math.min(1, hue / 100));
  const r = Math.round(0xe8 + (0xc8 - 0xe8) * t);
  const g = Math.round(0x10 + (0x60 - 0x10) * t);
  const b = Math.round(0x20 + (0x10 - 0x20) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function findMatchingPreset(params: Params): PresetName | null {
  for (const [name, preset] of Object.entries(PRESETS) as [PresetName, Params][]) {
    if (PARAM_KEYS.every((key) => preset[key] === params[key])) {
      return name;
    }
  }
  return null;
}

export const PRESET_BUTTONS: {
  name: PresetName;
  label: string;
  subtitle: string;
}[] = [
  { name: "cinematic", label: "Cinematic", subtitle: "Teal & Orange" },
  { name: "portra", label: "Portra", subtitle: "Warm Pastel" },
  { name: "gold200", label: "Gold 200", subtitle: "Saturated Warm" },
  { name: "pro400h", label: "Pro 400H", subtitle: "Cool Soft" },
  { name: "ektar100", label: "Ektar 100", subtitle: "Vivid Sharp" },
  { name: "superia400", label: "Superia", subtitle: "Cool Green" },
  { name: "cinestill800t", label: "CineStill", subtitle: "Tungsten Glow" },
  { name: "bw", label: "B&W", subtitle: "Classic Mono" },
  { name: "reset", label: "Reset", subtitle: "No Grade" },
];
