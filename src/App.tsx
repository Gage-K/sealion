// import * as Tone from "tone";
import { useState } from "react";
import { ArrowsClockwise } from "phosphor-react";

// lib
import type { Sequence } from "./types/types";
import { getTrackOfNote } from "./utils/utils";
import { updateStep } from "./utils/sequenceUtils";
import { dotStyles } from "./lib/seqStyles";

// components
import {
  PlayButton,
  StepButton,
  TrackButton,
  UtilityButton,
} from "./components/UI/Button";

// hooks
import { useMainVolume } from "./hooks/useMainVolume";
import { useWebSocketSync } from "./hooks/useWebSocketSync";
import { useTransport } from "./hooks/useTransport";
import { useToneEngine } from "./hooks/useToneEngine";
import { useBPM } from "./hooks/useBPM";
import { useEnvelope } from "./hooks/useEnvelope";
import { useCurrentTrack } from "./hooks/useCurrentTrack";

// constants
const CURRENT_MODE: "synth" | "drum" = "drum";
const DEFAULT_TRACK_SET: Sequence = [
  getTrackOfNote("C", 1, "kick"),
  getTrackOfNote("C", 4, "snare"),
  getTrackOfNote("C", 1, "hihat"),
];

function App() {
  const [sequence, setSequence] = useState(DEFAULT_TRACK_SET);
  const { currentTrackIndex, updateCurrentTrackIndex } = useCurrentTrack();

  const { synthsRef, getInitEnvelope, updateEnvelope } = useToneEngine(
    CURRENT_MODE,
    sequence
  );
  const { volume, updateVolume } = useMainVolume(sequence);
  const { isPlaying, currentStep, togglePlay } = useTransport(
    sequence,
    synthsRef,
    CURRENT_MODE
  );
  const { bpm, handleBPMChange } = useBPM(120);
  const { handleADSRChange, currentTrackEnvelope } = useEnvelope({
    getInitADSR: getInitEnvelope,
    updateEnvelope: updateEnvelope,
    currentTrackIndex: currentTrackIndex,
  });

  const { sendUpdate } = useWebSocketSync({
    handleRemoteUpdate: (trackIndex, stepIndex) => {
      setSequence((prev) => updateStep(prev, trackIndex, stepIndex));
    },
  });

  const handleMainVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (!isNaN(volume)) {
      updateVolume(volume);
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
        <div className="seq-container p-1 bg-zinc-900 rounded-sm flex shrink-1 border-16 border-zinc-300 shadow-md">
          <section className="display row-span-2 col-span-4 text-amber-600 bg-amber-950/20 rounded-sm m-1 border border-amber-600 p-2 text-md gap-1 grid grid-rows-1 grid-cols-2">
            <div className="display-info">
              <h1>SEALION-1000</h1>
              <ul>
                <li>Vol: {volume} db</li>
                <li>BPM: {bpm}</li>
                <li>Step: {currentStep === null ? "0" : currentStep + 1}</li>
              </ul>
            </div>
            <div>
              <h2>TRACK {currentTrackIndex + 1}</h2>
              <ul>
                <li>Track Vol: 0 db</li>
              </ul>
            </div>
          </section>
          <form className="rounded-sm inset-shadow-md col-start-5 col-span-4 row-span-2 bg-zinc-300 p-2 inset-shadow-zinc-50/75 inset-shadow-sm grid items-center">
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="tempo" className={dotStyles.label}>
                BPM
              </label>
              <input
                id="tempo"
                className={dotStyles.input}
                type="range"
                min="1"
                max="240"
                step={1}
                value={bpm}
                onChange={handleBPMChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center">
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
            </div>
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="swing" className={dotStyles.label}>
                Swing
              </label>
              <input
                id="swing"
                className={dotStyles.input}
                type="range"
                min={-12}
                max={8}
                step={0.01}
                value={volume}
                onChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="pan" className={dotStyles.label}>
                Pan
              </label>
              <input
                id="pan"
                className={dotStyles.input}
                type="range"
                min={-50}
                max={50}
                step={1}
                value={volume}
                onChange={() => {}}
              />
            </div>
          </form>

          <section className="display row-span-2 col-span-4 text-amber-600 bg-amber-950/20 rounded-sm m-1 border border-amber-600 p-2 text-md gap-1 grid grid-rows-1 grid-cols-2 display-info">
            <h2>ADSR</h2>
            <ul>
              <li>Attack: {currentTrackEnvelope.attack}</li>
              <li>Decay: {currentTrackEnvelope.decay}</li>
              <li>Sustain: {currentTrackEnvelope.sustain}</li>
              <li>Release: {currentTrackEnvelope.release}</li>
            </ul>
          </section>

          <form className="rounded-sm inset-shadow-md col-start-5 col-span-4 row-span-2 bg-zinc-300 p-2 inset-shadow-zinc-50/75 inset-shadow-sm grid items-center">
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="attack" className={dotStyles.label}>
                Attack
              </label>
              <input
                id="attack"
                className={dotStyles.input}
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={currentTrackEnvelope.attack}
                onChange={(e) =>
                  handleADSRChange("attack", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="decay" className={dotStyles.label}>
                Decay
              </label>
              <input
                id="decay"
                className={dotStyles.input}
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={currentTrackEnvelope.decay}
                onChange={(e) =>
                  handleADSRChange("decay", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="sustain" className={dotStyles.label}>
                Sustain
              </label>
              <input
                id="sustain"
                className={dotStyles.input}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={currentTrackEnvelope.sustain}
                onChange={(e) =>
                  handleADSRChange("sustain", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center">
              <label htmlFor="release" className={dotStyles.label}>
                Release
              </label>
              <input
                id="release"
                className={dotStyles.input}
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={currentTrackEnvelope.release}
                onChange={(e) =>
                  handleADSRChange("release", parseFloat(e.target.value))
                }
              />
            </div>
          </form>

          <PlayButton isPlaying={isPlaying} onToggle={togglePlay} />
          {sequence.map((_, index) => (
            <TrackButton
              trackNumber={index + 1}
              isActive={currentTrackIndex === index}
              onSelect={() => updateCurrentTrackIndex(index)}
            />
          ))}
          <UtilityButton
            icon={<ArrowsClockwise size={20} />}
            label="Sync"
            onClick={() => {}}
            // baseColor="yellow"
          />

          {sequence[currentTrackIndex].steps.map((step, stepIndex) => (
            <StepButton
              stepNumber={stepIndex + 1}
              isCurrent={currentStep === stepIndex}
              isActive={step.active}
              onToggle={() =>
                handleSequenceChange(currentTrackIndex, stepIndex)
              }
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
