// import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

// import Keyboard from "./components/Keyboard";
import Metronome from "./components/Metronome";
import Sequencer from "./components/Sequencer";
import { useClock } from "./hooks/useClock";
import { type Track, type Sequence, type Step } from "./types/types";
import { getOctaveOfTracks, getTracksByScale } from "./utils/utils";

const dotStyle =
  "w-4 h-4 rounded-sm border-b inset-shadow-sm ease-in-out duration-100";

const styles = {
  dotInactive: `${dotStyle} bg-neutral-200 border-b-neutral-100`,
  dotActive: `${dotStyle} bg-cyan-200 border-b-cyan-100 shadow-cyan-200/50`,
  dotActiveStart: `${dotStyle} bg-orange-400 border-b-orange-300 shadow-orange-400/50`,
  input: "bg-neutral-100 px-2 py-1 rounded-sm",
  label: "font-medium",
  roundButton:
    "bg-neutral-200 p-4 rounded-3xl hover:bg-neutral-300 hover:cursor-pointer hover:shadow-sm active:bg-neutral-100",
};

const cMajor: Sequence = getTracksByScale("C", 4, "ionian");
const cPentatonic: Sequence = getTracksByScale("C", 4, "pentatonic");
console.log(cMajor);

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
      console.log(beatRef.current);
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
    console.log(isPlaying);
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
    console.log(e.target.value);
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      setBPM(newBPM);
    } else {
      setBPM(30);
    }
  };

  const updateSequence = (trackIndex: number, stepIndex: number) => {
    console.log(trackIndex);
    console.log(stepIndex);

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
          <label htmlFor="tempo" className={styles.label}>
            BPM
          </label>
          <input
            id="tempo"
            className={styles.input}
            type="number"
            min="30"
            max="240"
            value={bpm}
            onChange={(e) => handleBPMChange(e)}
          />
        </form>

        <div className="flex gap-2 flex-col">
          {/* {rows.map((row, rowIndex) => {
            // const trackSteps = row.length;
            return (
              <div className="grid, grid-cols-16 gap-2" key={rowIndex}>
                {row.map((step, stepIndex) => (
                  <button
                    key={stepIndex}
                    className={`w-8, h-8 rounded-sm cursor-pointer ${
                      step.active === true && stepIndex === beatRef.current
                        ? "bg-blue-400/50"
                        : step.active === true
                        ? "bg-blue-400"
                        : stepIndex === beatRef.current
                        ? "bg-neutral-400"
                        : "bg-neutral-300"
                    }`}></button>
                ))}
              </div>
            );
          })} */}
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
        {/* <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>
        <p>{currentNote}</p> */}
        {/* <Metronome
          tempo={tempo}
          setTempo={setTempo}
          timeSignature={timeSignature}
          setTimeSignature={setTimeSignature}
          sequenceLength={sequenceLength}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentNote={currentNote}
        /> */}
        {/* <Sequencer>
          <></>
        </Sequencer> */}

        {/* <h2 className="font-bold text-xl">Metronome</h2>
        <Metronome /> */}
      </div>
    </>
  );
}

export default App;
