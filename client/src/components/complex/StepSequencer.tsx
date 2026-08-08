import { memo, useCallback, useState } from "react";

const StepButton = memo(function StepButton({
  label,
  row,
  col,
  active,
  current,
  onToggle,
}: {
  label: string;
  row: number;
  col: number;
  active: boolean;
  current?: boolean;
  onToggle: (row: number, col: number) => void;
}) {
  return (
    <button
      className="step-pushable"
      onClick={() => onToggle(row, col)}
      aria-pressed={active}
      data-current={current ? "true" : undefined}
    >
      <span className="step-shadow" aria-hidden="true" />
      <span className="step-edge" aria-hidden="true" />
      <span className="step-face" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
});

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
    Array.from({ length: rows }, () => Array(cols).fill(false)),
  );

  const steps = controlledSteps ?? internalSteps;

  const toggleStep = useCallback(
    (row: number, col: number) => {
      if (onToggle) {
        onToggle(row, col);
      } else {
        setInternalSteps((prev) =>
          prev.map((r, ri) =>
            ri === row ? r.map((v, ci) => (ci === col ? !v : v)) : r,
          ),
        );
      }
    },
    [onToggle],
  );

  return (
    <div
      className="col-span-16 grid grid-cols-subgrid gap-y-2"
      role="group"
      aria-label="Step sequencer"
    >
      {Array.from({ length: cols }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="text-xs text-center text-zinc-500"
        >
          {i + 1}
        </span>
      ))}
      {steps.map((row, ri) =>
        row.map((active, ci) => (
          <StepButton
            key={`${ri}-${ci}`}
            label={`Row ${ri + 1} Step ${ci + 1}`}
            row={ri}
            col={ci}
            active={active}
            current={currentStep === ci}
            onToggle={toggleStep}
          />
        )),
      )}
    </div>
  );
}

export { StepButton };
