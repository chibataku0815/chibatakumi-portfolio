// Audio meter: horizontal bar visualisation of a subset of AudioBus signals.
// Each field gets a label and a filled bar. Caches last widths per key to
// avoid triggering layout when the value hasn't moved perceptibly.

import { createOverlayText } from "webgpu-motion-dom";
import type { AudioBands, OnsetBands } from "webgpu-motion-audio";

export type AudioMeterFieldKey =
  | keyof AudioBands
  | keyof OnsetBands
  | "intensity";

export type AudioMeterOptions = {
  readonly parent?: ParentNode;
  readonly fields: readonly AudioMeterFieldKey[];
  readonly position?: {
    readonly top?: string;
    readonly left?: string;
    readonly right?: string;
    readonly bottom?: string;
  };
};

export type AudioMeterReading = {
  readonly bands: AudioBands;
  readonly onsets: OnsetBands;
  readonly intensity: number;
};

export type AudioMeter = {
  readonly element: HTMLDivElement;
  readonly fields: readonly AudioMeterFieldKey[];
};

type MeterRow = {
  readonly key: AudioMeterFieldKey;
  readonly fillEl: HTMLDivElement;
  readonly valueEl: HTMLSpanElement;
  lastQuantum: number;
};

const TOKEN = {
  fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  barWidthPx: 90,
  rowGapPx: 3,
} as const;

const rowStore = new WeakMap<HTMLDivElement, MeterRow[]>();

export function createAudioMeter(options: AudioMeterOptions): AudioMeter {
  const pos = options.position ?? { top: "56px", right: "16px" };
  const element = createOverlayText({
    parent: options.parent,
    style: {
      position: "fixed",
      top: pos.top ?? "",
      left: pos.left ?? "",
      right: pos.right ?? "",
      bottom: pos.bottom ?? "",
      display: "flex",
      flexDirection: "column",
      gap: `${TOKEN.rowGapPx}px`,
      padding: "8px 10px",
      background: "rgba(255,255,255,0.60)",
      border: "1px solid rgba(26,26,26,0.14)",
      borderRadius: "2px",
      fontFamily: TOKEN.fontMono,
      fontSize: "9px",
      letterSpacing: "0.06em",
      color: "rgba(26,26,26,0.82)",
      pointerEvents: "none",
      userSelect: "none",
    },
  });

  const rows: MeterRow[] = [];
  for (const key of options.fields) {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "grid",
      gridTemplateColumns: `46px ${TOKEN.barWidthPx}px 28px`,
      gap: "6px",
      alignItems: "center",
    } satisfies Partial<CSSStyleDeclaration>);

    const labelEl = document.createElement("span");
    labelEl.textContent = key.toUpperCase().padEnd(6, " ");
    labelEl.style.textTransform = "uppercase";

    const track = document.createElement("div");
    Object.assign(track.style, {
      position: "relative",
      height: "4px",
      background: "rgba(26,26,26,0.10)",
      borderRadius: "1px",
      overflow: "hidden",
    } satisfies Partial<CSSStyleDeclaration>);

    const fillEl = document.createElement("div");
    Object.assign(fillEl.style, {
      position: "absolute",
      top: "0",
      left: "0",
      bottom: "0",
      width: "0%",
      background: "#1a1a1a",
      transition: "width 80ms linear",
    } satisfies Partial<CSSStyleDeclaration>);
    track.appendChild(fillEl);

    const valueEl = document.createElement("span");
    valueEl.textContent = "0.00";
    valueEl.style.textAlign = "right";

    row.append(labelEl, track, valueEl);
    element.appendChild(row);

    rows.push({ key, fillEl, valueEl, lastQuantum: -1 });
  }

  rowStore.set(element, rows);
  return { element, fields: options.fields };
}

function readField(reading: AudioMeterReading, key: AudioMeterFieldKey): number {
  if (key === "intensity") return reading.intensity;
  if (key === "bass" || key === "mid" || key === "treble" || key === "energy") {
    return reading.bands[key];
  }
  return reading.onsets[key];
}

export function updateAudioMeter(
  meter: AudioMeter,
  reading: AudioMeterReading,
): void {
  const rows = rowStore.get(meter.element);
  if (!rows) return;

  for (const row of rows) {
    const raw = readField(reading, row.key);
    const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const quantum = Math.round(clamped * 100);
    if (quantum === row.lastQuantum) continue;
    row.lastQuantum = quantum;
    row.fillEl.style.width = `${quantum}%`;
    row.valueEl.textContent = clamped.toFixed(2);
  }
}
