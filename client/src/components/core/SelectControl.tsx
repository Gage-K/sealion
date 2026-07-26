import { useId } from "react";

export default function SelectControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="grid grid-cols-[1fr_1fr_2fr] items-center h-6"
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <span />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-zinc-900 text-zinc-100 border border-zinc-600 rounded-xs px-1 cursor-pointer w-full"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
