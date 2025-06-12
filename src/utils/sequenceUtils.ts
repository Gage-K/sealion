import type { Sequence } from "../types/types";

/**
 * Updates whether status of step of a track is active/inactive
 * @param sequence
 * @param trackIndex
 * @param stepIndex
 * @returns Updated sequence
 */
export function updateStep(
  sequence: Sequence,
  trackIndex: number,
  stepIndex: number
): Sequence {
  const updated = sequence.map((track, i) => {
    if (i !== trackIndex) return track;
    const newSteps = track.steps.map((step, j) => {
      return j === stepIndex ? { ...step, active: !step.active } : step;
    });

    return { ...track, steps: newSteps };
  });

  return updated;
}
