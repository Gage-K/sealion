// import type { AudioTrack } from "../types/types";

// /**
//  * Updates whether status of step of a track is active/inactive
//  * @param sequence
//  * @param trackIndex
//  * @param stepIndex
//  * @returns Updated sequence
//  */
// export function updateStep(
//   sequence: AudioTrack[],
//   trackIndex: number,
//   stepIndex: number
// ): AudioTrack[] {
//   const updated = sequence.map((track, i) => {
//     if (i !== trackIndex) return track;
//     const newSteps = track.steps.map((step, j) => {
//       return j === stepIndex ? !step : step;
//     });

//     return { ...track, steps: newSteps };
//   });

//   return updated;
// }
