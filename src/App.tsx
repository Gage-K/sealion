import { useEffect, useRef, useMemo } from "react";
import { ArrowsClockwise } from "phosphor-react";

// lib
import type { AudioTrack } from "./types/types";
import type { Step } from "./types/crdt";
import { getTrackOfNote } from "./utils/utils";
import { dotStyles } from "./lib/seqStyles";
import { DRUM_SYNTH_CONFIG } from "./config/drumSynthConfig";

// components
import {
  PlayButton,
  StepButton,
  TrackButton,
  UtilityButton,
} from "./components/UI/Button";

// hooks
import { useMainVolume } from "./hooks/useMainVolume";
import { useTransport } from "./hooks/useTransport";
import { useToneEngine } from "./hooks/useToneEngine";
import { useBPM } from "./hooks/useBPM";
import { useEnvelope } from "./hooks/useEnvelope";
import { useCurrentTrack } from "./hooks/useCurrentTrack";
import { useCRDT } from "./hooks/useCRDT";
import { useSequence } from "./hooks/useSequence";
import { useSwing } from "./hooks/useSwing";

// constants
const CURRENT_MODE: "synth" | "drum" = "drum";
const AUDIO_CONFIG: AudioTrack[] = [
  getTrackOfNote("kick"),
  getTrackOfNote("snare1"),
  getTrackOfNote("snare2"),
  getTrackOfNote("hihat1"),
  getTrackOfNote("hihat2"),
  getTrackOfNote("tom"),
];

function App() {
  const drumSynthCRDT = useCRDT();
  // Defensive code guarding against multiple re-renders
  const hasInit = useRef(false);

  const sequenceData: Step[][] = useMemo(() => {
    return drumSynthCRDT.getAllTrackSequences();
  }, [drumSynthCRDT]);

  useEffect(() => {
    if (hasInit.current) return;

    hasInit.current = true;
  }, [drumSynthCRDT]);

  const { currentTrackIndex, updateCurrentTrackIndex } = useCurrentTrack();
  const { handleSequenceChange } = useSequence({
    currentTrackIndex: currentTrackIndex,
  });
  const { synthsRef, updateEnvelope } = useToneEngine(
    CURRENT_MODE,
    AUDIO_CONFIG
  );
  const { volume, updateVolume } = useMainVolume(AUDIO_CONFIG);
  const { isPlaying, currentStep, togglePlay } = useTransport(
    AUDIO_CONFIG,
    synthsRef,
    sequenceData
  );
  const { swing, handleSwingChange } = useSwing();
  const { bpm, handleBPMChange } = useBPM();
  const { handleADSRChange } = useEnvelope({
    updateEnvelope: updateEnvelope,
    currentTrackIndex: currentTrackIndex,
  });

  const handleMainVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (!isNaN(volume)) {
      updateVolume(volume);
    }
  };

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-12">
        <div className="seq-container p-1 bg-zinc-900 rounded-sm flex shrink-1 border-16 border-zinc-300 shadow-lg">
          <section className="display row-span-2 col-span-4 text-amber-600 bg-amber-950/20 rounded-sm m-1 border border-amber-600 p-2 text-md gap-1 grid grid-rows-1 grid-cols-2">
            <div className="display-info">
              <h1>SEALION-1000</h1>
              <h2>TRACK {currentTrackIndex + 1}</h2>
              <ul>
                <li>Track Vol: 0 db</li>
              </ul>
            </div>
            <ul>
              <li>Vol: {volume} db</li>
              <li>BPM: {bpm}</li>
              <li>Step: {currentStep === null ? "0" : currentStep + 1}</li>
              <li>Swing: {Math.floor(swing * 100)}%</li>
            </ul>
            <div></div>
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
                min={0}
                max={0.25}
                step={0.01}
                value={swing}
                onChange={handleSwingChange}
              />
            </div>
            {/* <div className="grid grid-cols-4 items-center">
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
            </div> */}
          </form>

          <section className="display row-span-2 col-span-4 text-amber-600 bg-amber-950/20 rounded-sm m-1 border border-amber-600 p-2 text-md gap-1 grid grid-rows-1 grid-cols-2 display-info">
            <h2>ENVELOPE</h2>
            <ul>
              <li>
                Attack:{" "}
                {
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .attack
                }
              </li>
              <li>
                Decay:{" "}
                {
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .decay
                }
              </li>
              <li>
                Sustain:{" "}
                {
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .sustain
                }
              </li>
              <li>
                Release:{" "}
                {
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .release
                }
              </li>
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
                min={0.01}
                max={2}
                step={0.01}
                value={
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .attack
                }
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
                min={0.01}
                max={2}
                step={0.01}
                value={
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .decay
                }
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
                min={0.01}
                max={1}
                step={0.01}
                value={
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .sustain
                }
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
                min={0.01}
                max={2}
                step={0.01}
                value={
                  drumSynthCRDT.tracks[currentTrackIndex].settings.envelope
                    .release
                }
                onChange={(e) =>
                  handleADSRChange("release", parseFloat(e.target.value))
                }
              />
            </div>
          </form>

          <PlayButton isPlaying={isPlaying} onToggle={togglePlay} />
          {DRUM_SYNTH_CONFIG.map((_, index) => (
            <TrackButton
              key={index}
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

          {drumSynthCRDT
            .getTrackSequence(currentTrackIndex)
            .map((step, stepIndex) => (
              <StepButton
                key={stepIndex}
                stepNumber={stepIndex + 1}
                isCurrent={currentStep === stepIndex}
                isActive={step[0]}
                onToggle={() =>
                  handleSequenceChange(currentTrackIndex, stepIndex)
                }
              />
            ))}
        </div>
      </div>
      <div className="px-16 grid place-items-center gap-4 my-12">
        <div className="text-container px-16 grid place-items-center gap-4 mt-12 border-2 border-amber-600 rounded-sm p-4 max-w-xl bg-zinc-900">
          <h1>welcome to my lil synth</h1>
          <p className="text-zinc-100">
            sealion is a collaborative drum synth that uses a CRDT to
            synchronize the synth's state across multiple clients. synthesize
            some terrible beats with your friends and colleagues
          </p>

          <h2>how to use</h2>
          <ul>
            <li>
              bpm: <span className="text-zinc-100">the tempo of the synth</span>
            </li>
            <li>
              volume:{" "}
              <span className="text-zinc-100">the volume of the synth</span>
            </li>
            <li>
              swing:{" "}
              <span className="text-zinc-100">
                the swing (how much offbeat deviate from the beat) of the synth
              </span>
            </li>
            <li>
              envelope:{" "}
              <span className="text-zinc-100">
                the attack, decay, sustain, and release of the synth of the
                track you're currently on
              </span>
            </li>
            <li>
              tracks (T1, etc.):{" "}
              <span className="text-zinc-100">
                the track of the synth you are currently modifying
              </span>
            </li>
            <li>
              click on any of the steps to have the synth on that track play at
              that beat
            </li>
          </ul>

          <h2>synths</h2>
          <ul className="list-disc align-left">
            <li>
              T1 (kick): <span className="text-zinc-100">a membrane synth</span>
            </li>
            <li>
              T2 (snare): <span className="text-zinc-100">a noise synth</span>
            </li>
            <li>
              T3 (snare): <span className="text-zinc-100">a noise synth</span>
            </li>
            <li>
              T4 (hihat): <span className="text-zinc-100">a metal synth</span>
            </li>
            <li>
              T5 (hihat): <span className="text-zinc-100">a metal synth</span>
            </li>
            <li>
              T6 (low tom):{" "}
              <span className="text-zinc-100">a membrane synth</span>
            </li>
          </ul>
          <p>
            note:{" "}
            <span className="text-zinc-100">
              when you're both in the same location, only have one person
              playing audio at a time (or not if you want lol)
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

export default App;
