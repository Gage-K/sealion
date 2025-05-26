export type Octave = Array<string>;

const NOTES: Octave = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "Bb",
];

export function getOctave(octPosition: number): Octave {
  // desired output: ["C1", "C#1", "D1", ...]
  // octPosition refers to the numbered octave (e.g., the "1" in "C1", or "2" in "C2")
  // const range: number = 12;
  const octave: Octave = [];

  for (const note of NOTES) {
    const octNote = `${note}${octPosition}`;
    octave.push(octNote);
  }
  return octave;
}
