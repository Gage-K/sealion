import * as Tone from "tone";

import {
  type Octave,
  type AudioTrack,
  type Scale,
  type ModeName,
} from "../types/types";

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
  "B",
];

// INTERVALS (in semitones or st)
// UNISON: 0 st
// MINOR 2: 1 st
// MAJOR 2: 2 st
// MINOR 3: 3 st
// MAJOR 3: 4 st
// PERF 4: 5 st
// AUG 4/DIM 5: 6 st
// PERF 5: 7 st
// MINOR 6: 8 st
// MAJOR 6: 9 st
// MINOR 7: 10 st
// MAJOR 7: 11 st
// OCTAVE: 12 st

// Each scale is an array of semitones
const MODES: Record<ModeName, Scale> = {
  ionian: [0, 2, 4, 5, 7, 9, 11], // Major scale
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural minor scale
  locrian: [0, 1, 3, 5, 6, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

// Returns a full chromatic octave starting at C
// TODO: make the starting note more flexible
export const getOctave = (octPosition: number): Octave => {
  const octave: Octave = [];

  for (const note of NOTES) {
    const octNote = `${note}${octPosition}`;
    octave.push(octNote);
  }
  return octave;
};

// Returns a complete Track array for a given note of a given octave
export const getTrackOfNote = (trackName: string) => {
  // returns a track with steps of specified note
  const track: AudioTrack = {
    name: trackName,
    steps: Array.from({ length: 16 }, () => false),
    volume: 0, // in deciabls
    mute: false,
    active: true,
    node: new Tone.Gain(),
  };

  return track;
};

// Returns a complete sequence for each note of the chromatic scale
export const getOctaveOfTracks = () => {
  const sequence: AudioTrack[] = NOTES.map((note: string) =>
    getTrackOfNote(note)
  );
  return sequence;
};

// Transpose the semitones of a given scale in C to a scale of the desired root note
export const transposeScale = (scale: Scale, rootNote: number): Scale => {
  return scale.map((semitone) => (semitone + rootNote) % 12);
};

// Returns a complete sequence of a given note, octave, and scale
export const getTracksByScale = (rootNote: string, scaleName: ModeName) => {
  const scale: Scale = MODES[scaleName];
  const noteIndex = NOTES.indexOf(rootNote);
  const transposedScale = transposeScale(scale, noteIndex);

  const sequence: AudioTrack[] = transposedScale.map((chromaticNoteIndex) => {
    const noteName = NOTES[chromaticNoteIndex];
    return getTrackOfNote(noteName);
  });

  return sequence;
};
