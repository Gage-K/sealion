// import * as Tone from "tone";
import { useState } from "react";
import * as Tone from "tone";

// lib
import { type Sequence } from "./types/types";
import { getTrackOfNote } from "./utils/utils";
import { updateStep } from "./utils/sequenceUtils";
import { dotStyles } from "./lib/seqStyles";

// components
import Metronome from "./components/Metronome";

// hooks
import { useMainVolume } from "./hooks/useMainVolume";
import { useWebSocketSync } from "./hooks/useWebSocketSync";
import { useTransport } from "./hooks/useTransport";
import { useToneEngine } from "./hooks/useToneEngine";

// constants
const CURRENT_MODE: "synth" | "drum" = "drum";
const DEFAULT_TRACK_SET: Sequence = [
  getTrackOfNote("C", 1, "kick"),
  getTrackOfNote("C", 4, "snare"),
  getTrackOfNote("C", 1, "hihat"),
];

// style constants
const seqBtnStyles =
  "w-10 h-10 rounded-full bg-zinc-700 shadow-md shadow-black grid place-items-center text-neutral-50 inset-shadow-xs inset-shadow-zinc-500 active:bg-zinc-800 active:text-zinc-400 active:shadow-black/60 active:inset-shadow-zinc-500/50";
const seqBtnWrapperStyles =
  "step-container w-15 h-15 bg-zinc-700 grid place-items-center rounded-xs ";
const seqActive = `${seqBtnStyles} text-red-500`;

function App() {
  const [bpm, setBPM] = useState<number>(120);
  const [sequence, setSequence] = useState(DEFAULT_TRACK_SET);

  const synthsRef = useToneEngine(CURRENT_MODE, sequence);
  const { volume, setVolume } = useMainVolume(sequence);
  const { isPlaying, currentStep, togglePlay } = useTransport(
    sequence,
    synthsRef,
    CURRENT_MODE
  );
  const { sendUpdate } = useWebSocketSync({
    handleRemoteUpdate: (trackIndex, stepIndex) => {
      setSequence((prev) => updateStep(prev, trackIndex, stepIndex));
    },
  });

  Tone.getTransport().bpm.value = bpm;

  // TODO: add more checking to prevent numbers that break the BPM
  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      setBPM(newBPM);
    } else {
      setBPM(120);
    }
  };

  const handleMainVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (!isNaN(volume)) {
      setVolume(volume);
    }
  };

  // Updates the sequence data for client and sends update operations to other subscribed clients in web socket
  const handleSequenceChange = (trackIndex: number, stepIndex: number) => {
    setSequence((prev) => updateStep(prev, trackIndex, stepIndex));
    sendUpdate(trackIndex, stepIndex);
  };

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>
        {/* <button onClick={sendWSMessage}>Send a WS Message</button> */}
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

          <label htmlFor="volume" className={dotStyles.label}>
            Volume
          </label>
          <input
            id="volume"
            className={dotStyles.input}
            type="range"
            min={-12}
            max={8}
            step={0.01}
            value={volume}
            onChange={handleMainVolumeChange}
          />
        </form>

        <div className="flex gap-2 flex-col">
          <Metronome step={currentStep} />
          {sequence.map((track, trackIndex) => (
            <div className="grid grid-cols-17 gap-2" key={trackIndex}>
              {track.steps.map((step, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => handleSequenceChange(trackIndex, stepIndex)}
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
      <div className="w-full h-800 mt-16 p-32">
        <div className="max-w-55">
          <div className="grid grid-cols-3 grid-rows-auto gap-1 bg-neutral-950 p-4 rounded-sm">
            <div className={seqBtnWrapperStyles}>
              <button className={seqBtnStyles}>1</button>
            </div>
            <div className={seqBtnWrapperStyles}>
              <button className={seqBtnStyles}>2</button>
            </div>
            <div className={seqBtnWrapperStyles}>
              <button className={seqActive}>3</button>
            </div>
            <div className={seqBtnWrapperStyles}>
              <button className={seqBtnStyles}>4</button>
            </div>
            <div className={seqBtnWrapperStyles}>
              <button className={seqActive}>5</button>
            </div>
            <div className={seqBtnWrapperStyles}>
              <button className={seqBtnStyles}>6</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
