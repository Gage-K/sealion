// import * as Tone from "tone";
import { useState, useEffect } from "react";
import * as Tone from "tone";
import { ArrowsClockwise, Pause, Play } from "phosphor-react";

// lib
import { type Sequence, type Envelope } from "./types/types";
import { getTrackOfNote } from "./utils/utils";
import { updateStep } from "./utils/sequenceUtils";
import { dotStyles } from "./lib/seqStyles";

// components

// hooks
import { useMainVolume } from "./hooks/useMainVolume";
import { useWebSocketSync } from "./hooks/useWebSocketSync";
import { useTransport } from "./hooks/useTransport";
import { useToneEngine } from "./hooks/useToneEngine";

import Button from "./components/Buttons/Button";

// constants
const CURRENT_MODE: "synth" | "drum" = "drum";
const DEFAULT_TRACK_SET: Sequence = [
  getTrackOfNote("C", 1, "kick"),
  getTrackOfNote("C", 4, "snare"),
  getTrackOfNote("C", 1, "hihat"),
];

// style constants
// const seqBtnStyles =
//   "w-10 h-10 rounded-full bg-zinc-700 shadow-md shadow-black grid place-items-center text-neutral-50 inset-shadow-xs inset-shadow-zinc-500 active:bg-zinc-800 active:text-zinc-400 active:shadow-black/60 active:inset-shadow-zinc-500/50";
// const seqBtnWrapperStyles =
//   "step-container w-15 h-15 bg-zinc-700 grid place-items-center rounded-xs ";
// const seqActive = `${seqBtnStyles} text-red-500`;

function App() {
  const [bpm, setBPM] = useState<number>(120);
  const [sequence, setSequence] = useState(DEFAULT_TRACK_SET);
  const [currentTrackIndex, setCurrenTrackIndex] = useState(0);

  const { synthsRef, getInitADSR, updateEnvelope } = useToneEngine(
    CURRENT_MODE,
    sequence
  );
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

  const [trackADSR, setTrackADSR] = useState<Envelope[]>(getInitADSR());

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

  console.log(sequence[0]);

  // Updates the ADSR for the current track; ADSR is an array of objects; maps over each ADSR object and updates specified parameter with value
  const handleADSRChange = (parameter: keyof Envelope, value: number) => {
    setTrackADSR((prev) =>
      prev.map((adsr, index) =>
        index === currentTrackIndex ? { ...adsr, [parameter]: value } : adsr
      )
    );
  };

  useEffect(() => {
    updateEnvelope(currentTrackIndex, trackADSR[currentTrackIndex]);
  }, [trackADSR, currentTrackIndex]);

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        {/* <button onClick={sendWSMessage}>Send a WS Message</button> */}

        <div className="seq-container p-1 bg-zinc-900 rounded-sm flex shrink-1 border border-zinc-300 border-16 shadow-md">
          <section className="display row-span-2 col-span-4 text-amber-600 bg-amber-950/20 rounded-sm m-1 border border-amber-600 p-2 flex text-md gap-1 grid grid-rows-1 grid-cols-2">
            <div className="">
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
                onChange={(e) => handleBPMChange(e)}
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
                onChange={() => console.log("test")}
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
                onChange={() => console.log("test")}
              />
            </div>
          </form>

          <section className="display row-span-2 col-span-4 text-amber-600 bg-amber-950/20 rounded-sm m-1 border border-amber-600 p-2 flex text-md gap-1 grid grid-rows-1 grid-cols-2">
            <div className="flex-1 flex items-center justify-center">
              <svg width="180" height="80" className="z-10">
                <path
                  d={(() => {
                    const { attack, decay, sustain, release } =
                      trackADSR[currentTrackIndex];
                    const w = 160,
                      h = 60;
                    const totalTime = attack + decay + 0.5 + release;
                    const aX = (attack / totalTime) * w;
                    const dX = aX + (decay / totalTime) * w;
                    const sX = dX + (0.5 / totalTime) * w;
                    const rX = sX + (release / totalTime) * w;
                    const sustainY = 10 + (1 - sustain) * 40;

                    return `M 10 ${h} L ${10 + aX} 10 L ${
                      10 + dX
                    } ${sustainY} L ${10 + sX} ${sustainY} L ${10 + rX} ${h}`;
                  })()}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <ul>
              <li>Attack: {trackADSR[currentTrackIndex].attack}</li>
              <li>Decay: {trackADSR[currentTrackIndex].decay}</li>
              <li>Sustain: {trackADSR[currentTrackIndex].sustain}</li>
              <li>Release: {trackADSR[currentTrackIndex].release}</li>
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
                value={trackADSR[currentTrackIndex].attack}
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
                value={trackADSR[currentTrackIndex].decay}
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
                value={trackADSR[currentTrackIndex].sustain}
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
                value={trackADSR[currentTrackIndex].release}
                onChange={(e) =>
                  handleADSRChange("release", parseFloat(e.target.value))
                }
              />
            </div>
          </form>

          <Button
            text=""
            ariaLabel={isPlaying ? "Pause playback" : "Start playback"}
            primaryActive={false}
            baseColor="yellow"
            action={togglePlay}>
            {isPlaying ? (
              <Pause size={16} weight="fill" />
            ) : (
              <Play size={16} weight="fill" />
            )}
          </Button>
          {sequence.map((_, index) => (
            <Button
              text={`T${index + 1}`}
              ariaLabel="Track"
              baseColor="yellow"
              span="col-span-2"
              primaryActive={index === currentTrackIndex}
              itemKey={index}
              action={() => setCurrenTrackIndex(index)}></Button>
          ))}

          <Button
            text=""
            action={() => console.log("test")}
            baseColor="yellow"
            ariaLabel="test"
            primaryActive={false}>
            <ArrowsClockwise size={20} />
          </Button>

          {sequence[currentTrackIndex].steps.map((step, stepIndex) => (
            <Button
              action={() => handleSequenceChange(currentTrackIndex, stepIndex)}
              text={stepIndex + 1}
              baseColor={"zinc"}
              primaryActive={step.active}
              secondaryActive={currentStep === stepIndex}
              itemKey={stepIndex}
              tertiaryActive={step.active && stepIndex === currentStep}
              ariaLabel={`Step ${
                step.active ? "active" : "inactive"
              }`}></Button>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
