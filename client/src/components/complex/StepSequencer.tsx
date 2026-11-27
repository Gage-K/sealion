import { memo, useCallback, useState } from "react";
import clsx from "clsx";

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
  // Flat terminal cell: square, 1px border, solid fill when on. A downbeat
  // (every 4th column) reads a touch brighter so the bar grid stays legible;
  // the playhead is a cyan inset outline so it shows over on and off cells.
  const downbeat = col % 4 === 0;
  return (
    <button
      className={clsx(
        "aspect-square w-full rounded-xs border transition-colors",
        active
          ? "bg-red-500 border-red-500 hover:bg-red-400"
          : downbeat
            ? "bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
            : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800",
        current && "outline outline-1 -outline-offset-1 outline-cyan-300",
      )}
      onClick={() => onToggle(row, col)}
      aria-pressed={active}
      data-current={current ? "true" : undefined}
    >
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
