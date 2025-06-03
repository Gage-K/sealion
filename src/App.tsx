// import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

// lib
import { type Sequence } from "./types/types";
import { getTrackOfNote, getTracksByScale } from "./utils/utils";
import { dotStyles } from "./lib/seqStyles";

// components
import Metronome from "./components/Metronome";

const CURRENT_MODE: "synth" | "drum" = "drum";

const cPentatonic: Sequence = getTracksByScale("C", 4, "pentatonic");

type DrumKit = [
  kick: Tone.MembraneSynth,
  snare: Tone.NoiseSynth,
  hihat: Tone.MetalSynth
];

const kick = new Tone.MembraneSynth().toDestination();

const hihat = new Tone.MetalSynth({
  envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
}).toDestination();

const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
}).toDestination();

const drumKit: DrumKit = [kick, snare, hihat];

const kitSequence: Sequence = [
  getTrackOfNote("C", 1, "kick"),
  getTrackOfNote("C", 4, "snare"),
  getTrackOfNote("C", 1, "hihat"),
];

const DEFAULT_TRACK_SET: Sequence =
  CURRENT_MODE === "synth" ? cPentatonic : kitSequence;

const synths =
  CURRENT_MODE === "drum"
    ? drumKit
    : DEFAULT_TRACK_SET.map(() => new Tone.Synth().toDestination());

console.log(drumKit);
console.log(synths);

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBPM] = useState<number>(120);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [sequence, setSequence] = useState(DEFAULT_TRACK_SET);

  const beatRef = useRef(0);
  const sequenceRef = useRef(sequence);
  Tone.getTransport().bpm.value = bpm;

  // Handles logic for triggerign sounds on each repeat or tick of the clock
  const repeat = (time: number) => {
    setCurrentStep(beatRef.current);

    sequenceRef.current.forEach((track, index) => {
      const synth = synths[index];
      console.log(synth);
      const note = track.steps[beatRef.current];

      if (note.active) {
        // Note: Different Tone.js synths require different parameters. Especially when in drum mode, there
        // must be logic to handle the different synths used to generate the sounds.

        // DRUM MODE
        if (CURRENT_MODE === "drum") {
          if (synth instanceof Tone.NoiseSynth) {
            // Noise synth has specific parameters
            synth.triggerAttackRelease("16n", time);
          } else {
            // Membrane and Metal synth are more similar to the standard Synth parameters
            synth.triggerAttackRelease("C1", "16n", time);
          }
        } else {
          // SYNTH MODE
          synth.triggerAttackRelease(note.note, "16n", time);
        }
      }
      // if (note.active) synth.triggerAttackRelease(note.note, "16n", time);
    });
    beatRef.current = (beatRef.current + 1) % 16;
  };

  // Creates clock on mount and cleans it up on unmount to avoid memory leak
  useEffect(() => {
    // Instantiate clock
    const id = Tone.getTransport().scheduleRepeat(repeat, "16n");

    return () => {
      // Clean up
      Tone.getTransport().clear(id);
    };
  }, []);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  // Updates playing state & current step position; Starts/stops audio
  const togglePlay = async () => {
    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      setIsPlaying(false);
    } else {
      beatRef.current = 0;
      setCurrentStep(0);
      await Tone.start();
      Tone.getTransport().start();
      setIsPlaying(true);
    }
  };

  // TODO: add more checking to prevent numbers that break the BPM
  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      setBPM(newBPM);
    } else {
      setBPM(30);
    }
  };

  // Updates whether status of step of a track is active/inactive
  const updateSequence = (trackIndex: number, stepIndex: number) => {
    setSequence((prevSequence) => {
      const currentTrack = prevSequence[trackIndex];

      const updatedSteps = currentTrack.steps.map((step, index) => {
        if (index === stepIndex) {
          return { ...step, active: !step.active };
        }
        return step;
      });

      const updatedSequence = sequence.map((prevTrack, index) =>
        index === trackIndex ? { ...prevTrack, steps: updatedSteps } : prevTrack
      );
      return updatedSequence;
    });
  };

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>

        <form className="flex gap-4 items-center">
          <label htmlFor="tempo" className={dotStyles.label}>
            BPM
          </label>
          <input
            id="tempo"
            className={dotStyles.input}
            type="number"
            min="30"
            max="240"
            value={bpm}
            onChange={(e) => handleBPMChange(e)}
          />
        </form>

        <div className="flex gap-2 flex-col">
          <Metronome step={currentStep} />
          {sequence.map((track, trackIndex) => (
            <div className="grid grid-cols-17 gap-2" key={trackIndex}>
              {track.steps.map((step, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => updateSequence(trackIndex, stepIndex)}
                  aria-label={`Step ${step.active ? "active" : "inactive"}`}
                  className={`w-8 h-8 rounded-sm cursor-pointer ${
                    step.active && stepIndex === currentStep
                      ? "bg-blue-400/50"
                      : step.active
                      ? "bg-blue-400"
                      : stepIndex === currentStep
                      ? "bg-neutral-400"
                      : "bg-neutral-300"
                  }`}></button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
