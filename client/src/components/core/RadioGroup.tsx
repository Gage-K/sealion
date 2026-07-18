import type { ReactNode } from "react";

export default function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  name,
  className = "",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={className}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`grid flex-1 place-items-center rounded-xs cursor-pointer hover:opacity-75 active:opacity-50 ${value === option.value
            ? "bg-cyan-300 text-zinc-900"
            : "bg-zinc-900 text-zinc-100 border border-zinc-600"
            }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
