import { useState } from "react";

function StepButton({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`aspect-square cursor-pointer rounded-xs border ${active
        ? "border-zinc-200 shadow-[inset_0_0_0_3px_theme(--color-zinc-900),inset_0_0_0_20px_theme(--color-zinc-200)]"
        : "border-zinc-600"
        }`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default function StepSequencer({
  rows = 4,
  cols = 16,
}: {
  rows?: number;
  cols?: number;
}) {
  const [steps, setSteps] = useState<boolean[][]>(
    Array.from({ length: rows }, () => Array(cols).fill(false))
  );

  function toggleStep(row: number, col: number) {
    setSteps((prev) =>
      prev.map((r, ri) =>
        ri === row ? r.map((v, ci) => (ci === col ? !v : v)) : r
      )
    );
  }

  return (
    <div className="col-span-16 grid grid-cols-subgrid gap-y-4" role="group" aria-label="Step sequencer">
      {Array.from({ length: cols }, (_, i) => (
        <span key={i} aria-hidden="true" className="text-xs text-center text-zinc-500">
          {i + 1}
        </span>
      ))}
      {steps.map((row, ri) =>
        row.map((active, ci) => (
          <StepButton
            key={`${ri}-${ci}`}
            label={`Row ${ri + 1} Step ${ci + 1}`}
            active={active}
            onToggle={() => toggleStep(ri, ci)}
          />
        ))
      )}
    </div>
  );
}

export { StepButton };
