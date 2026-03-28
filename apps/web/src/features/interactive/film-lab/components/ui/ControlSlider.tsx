"use client";

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

export function ControlSlider({ label, value, min, max, step, defaultValue, onChange, onCommit }: ControlSliderProps) {
  // ダブルクリックでデフォルト値にリセット
  const handleDoubleClick = () => onChange(defaultValue);

  // 値に応じたトラック塗り率（%）
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="group flex items-center gap-3" onDoubleClick={handleDoubleClick}>
      {/* ラベル（左） */}
      <span
        className="w-16 shrink-0 cursor-pointer text-[11px] text-[var(--text-muted)] select-none sm:w-24"
        onClick={() => onChange(defaultValue)}
        title="Tap to reset"
      >
        {label}
      </span>

      {/* スライダー（中央） */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={() => onCommit?.()}
        onTouchEnd={() => onCommit?.()}
        className="film-lab-slider h-1.5 flex-1 cursor-pointer appearance-none rounded-full touch-none sm:h-1"
        style={{
          background: `linear-gradient(to right, var(--accent-amber1) 0%, var(--accent-amber1) ${percent}%, rgba(255,255,255,0.08) ${percent}%, rgba(255,255,255,0.08) 100%)`
        }}
      />

      {/* 値表示（右） */}
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-[var(--text-base-70)] tabular-nums sm:w-12 sm:text-[11px]">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
