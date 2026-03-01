import { useId } from "react";

export const formatPan = (v: number) => {
  if (v === 0) return "C";
  return `${Math.abs(v)}${v < 0 ? "L" : "R"}`;
};

export const formatVolume = (v: number) => {
  return `${v} db`;
};

export const formatPercent = (v: number) => {
  return `${v}%`;
};

export const formatTime = (v: number) => {
  return `${v} ms`;
};

export const formatFrequency = (v: number) => {
  return `${v} hz`;
};

export default function RangeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  formatValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

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
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-bar cursor-move w-full"
        style={{ "--val": `${percent}%` } as React.CSSProperties}
      />
    </div>
  );
}
