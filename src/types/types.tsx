export interface Step {
  note: string;
  active: boolean;
}

export interface Track {
  name: string;
  steps: Step[];
  volume?: number;
  active?: boolean;
}

export type Sequence = Track[];

export type Octave = Array<string>;

export type Scale = Array<number>;

export type ModeName =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "pentatonic";
