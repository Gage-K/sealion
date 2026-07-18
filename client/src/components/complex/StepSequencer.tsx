import { useState } from "react";

function StepButton({
  label,
  active,
  current,
  onToggle,
}: {
  label: string;
  active: boolean;
  current?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`aspect-square cursor-pointer rounded-xs border ${active
        ? "border-zinc-200 shadow-[inset_0_0_0_3px_theme(--color-zinc-900),inset_0_0_0_20px_theme(--color-zinc-200)]"
        : "border-zinc-600"
        } ${current ? "ring-1 ring-amber-500" : ""}`}
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
  steps: controlledSteps,
  currentStep,
  onToggle,
}: {
  rows?: number;
  cols?: number;
  steps?: boolean[][];
  currentStep?: number | null;
  onToggle?: (row: number, col: number) => void;
}) {
  const [internalSteps, setInternalSteps] = useState<boolean[][]>(
    Array.from({ length: rows }, () => Array(cols).fill(false))
  );

  const steps = controlledSteps ?? internalSteps;

  function toggleStep(row: number, col: number) {
    if (onToggle) {
      onToggle(row, col);
    } else {
      setInternalSteps((prev) =>
        prev.map((r, ri) =>
          ri === row ? r.map((v, ci) => (ci === col ? !v : v)) : r
        )
      );
    }
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
            current={currentStep === ci}
            onToggle={() => toggleStep(ri, ci)}
          />
        ))
      )}
    </div>
  );
}

export { StepButton };
