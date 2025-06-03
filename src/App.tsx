// import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

// lib
import { type Sequence } from "./types/types";
import { getTracksByScale } from "./utils/utils";
import { dotStyles } from "./lib/seqStyles";

// components
import Metronome from "./components/Metronome";

const cPentatonic: Sequence = getTracksByScale("C", 4, "pentatonic");

const DEFAULT_TRACK_SET: Sequence = cPentatonic; // specifies base octave

const synths = DEFAULT_TRACK_SET.map(() => new Tone.Synth().toDestination());

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBPM] = useState<number>(120);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [sequence, setSequence] = useState(DEFAULT_TRACK_SET);

  const beatRef = useRef(0);
  const sequenceRef = useRef(sequence);
  Tone.getTransport().bpm.value = bpm;

  const repeat = (time: number) => {
    setCurrentStep(beatRef.current);

    sequenceRef.current.forEach((track, index) => {
      const synth = synths[index];
      const note = track.steps[beatRef.current];
      if (note.active) synth.triggerAttackRelease(note.note, "16n", time);
    });
    beatRef.current = (beatRef.current + 1) % 16;
  };

  useEffect(() => {
    Tone.getTransport().scheduleRepeat(repeat, "16n");

    return () => {
      Tone.getTransport().cancel();
    };
  }, [isPlaying]);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  const togglePlay = async () => {
    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      Tone.getTransport().position = 0;
      setIsPlaying(false);
    } else {
      beatRef.current = 0;
      setCurrentStep(0);
      Tone.getTransport().start();
      setIsPlaying(true);
    }
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      setBPM(newBPM);
    } else {
      setBPM(30);
    }
  };

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
