import { useId } from "react";
import { uiToLogFreq, logFreqToUi } from "../../audio/units";

export const formatPan = (v: number) => {
  if (v === 0) return "C";
  return `${Math.abs(v)}${v < 0 ? "L" : "R"}`;
};

export const formatVolume = (v: number) => {
  return `${v} db`;
};

/** For sliders whose own travel is already 0-100. Compare {@link formatNormal}. */
export const formatPercent = (v: number) => {
  return `${v}%`;
};

export const formatFrequency = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `${Number.isInteger(v) ? v : v.toFixed(2)} hz`;
};

/** Seconds in, milliseconds out — the CRDT stores Tone-native seconds. */
export const formatMs = (v: number) => `${Math.round(v * 1000)} ms`;

/** A 0-1 normal rendered as a percentage. */
export const formatNormal = (v: number) => `${Math.round(v * 100)}%`;

export default function RangeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  curve = "linear",
  formatValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /**
   * "log" spaces the travel by octaves instead of hertz. `value`, `min` and
   * `max` stay in hz on both sides — only the slider's internal position is
   * normalized, so callers never see the mapping.
   */
  curve?: "linear" | "log";
  formatValue?: (value: number) => string;
}) {
  const id = useId();
  const isLog = curve === "log";

  const position = isLog
    ? logFreqToUi(value, min, max)
    : (value - min) / (max - min);
  const percent = position * 100;

  const handleChange = (raw: number) => {
    onChange(isLog ? Math.round(uiToLogFreq(raw, min, max)) : raw);
  };

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="grid grid-cols-[1fr_1fr_2fr] items-center h-6"
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <output htmlFor={id}>{formatValue ? formatValue(value) : value}</output>
      <input
        id={id}
        type="range"
        min={isLog ? 0 : min}
        max={isLog ? 1 : max}
        step={isLog ? 0.001 : step}
        value={isLog ? position : value}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="range-bar cursor-move w-full"
        style={{ "--val": `${percent}%` } as React.CSSProperties}
      />
    </div>
  );
}
