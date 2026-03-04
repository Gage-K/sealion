import { useState, useEffect } from "react";
import { PlayIcon, PauseIcon } from "@phosphor-icons/react";
import type { EffectName, EffectsState, LfoState } from "../types/synth";
import { defaultEffects, defaultLfo } from "../types/synth";
import Button from "../components/core/NewButton";
import GlobalControls from "../components/complex/GlobalControls";
import TrackPanel from "../components/complex/TrackPanel";
import EffectPanel from "../components/complex/EffectPanel";
import LfoPanel from "../components/complex/LfoPanel";
import Keyboard from "../components/complex/NewKeyboard";
import StepSequencer from "../components/complex/StepSequencer";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useCRDT } from "../hooks/useCRDT";
import { DRUM_SYNTH_CONFIG } from "../config/drumSynthConfig";

export default function Sketch() {
  const crdt = useCRDT();
  const {
    isPlaying,
    currentStep,
    bpm,
    swing,
    volume,
    envelopes,
    togglePlay,
    handleBPMChange,
    handleSwingChange,
    handleVolumeChange,
    handleEnvelopeChange,
    handleSequenceToggle,
  } = useAudioEngine();

  const [pan, setPan] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [effects, setEffects] = useState<EffectsState>(defaultEffects);
  const [lfo, setLfo] = useState<LfoState>(defaultLfo);

  const updateLfo = (patch: Partial<LfoState>) => {
    setLfo((prev) => ({ ...prev, ...patch }));
  };

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [octave, setOctave] = useState(2);

  const updateEffect = <K extends EffectName>(name: K, patch: Partial<EffectsState[K]>) => {
    setEffects((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...patch },
    }));
  };

  const numTracks = DRUM_SYNTH_CONFIG.length;
  const [sequenceGrid, setSequenceGrid] = useState<boolean[][]>(() =>
    crdt.tracks.map((t) => t.sequence.fullSequence)
  );

  useEffect(() => {
    const unsubs = crdt.tracks.map((track, i) =>
      track.sequence.subscribe(() => {
        setSequenceGrid((prev) => {
          const next = [...prev];
          next[i] = crdt.tracks[i].sequence.fullSequence;
          return next;
        });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [crdt]);

  return (
    <div className="bg-zinc-900 h-screen w-screen text-zinc-100 grid place-items-center text-sm">
      <div className="border border-zinc-600 rounded-sm p-4 grid grid-cols-[repeat(16,minmax(1.5rem,1fr))] gap-4 items-start">
        <div className="col-span-8 row-start-1 row-span-1 bg-zinc-600 w-full self-stretch">
        </div>
        <div className="col-span-8 row-start-1 row-span-1">
          <GlobalControls
            vol={volume}
            pan={pan}
            bpm={bpm}
            swing={swing}
            onChangeVol={handleVolumeChange}
            onChangePan={setPan}
            onChangeBpm={handleBPMChange}
            onChangeSwing={handleSwingChange}
          />
        </div>
        <div className="col-span-8 row-start-2 row-span-1">
          <EffectPanel
            effects={effects}
            selectedEffect={selectedEffect}
            onSelectEffect={setSelectedEffect}
            onUpdateEffect={updateEffect}
          />
        </div>
        <div className="col-span-8 row-start-2 row-span-3">
          <TrackPanel
            trackNames={DRUM_SYNTH_CONFIG.map((c) => c.name)}
            envelopes={envelopes}
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
            onEnvelopeChange={handleEnvelopeChange}
          />
        </div>
        <div className="col-span-8 row-start-3 row-span-1">
          <LfoPanel lfo={lfo} onUpdateLfo={updateLfo} />
        </div>
        <div className="col-span-full row-start-5 grid grid-cols-subgrid">
          <Button className="col-span-2" active onClick={() => setShowKeyboard(!showKeyboard)}>{showKeyboard ? "SEQ" : "KEY"}</Button>
          <Button className="col-span-2 grid place-items-center" active={isPlaying} activeClassName="bg-red-500 text-zinc-100" onClick={togglePlay} ariaLabel={isPlaying ? "Pause playback" : "Start playback"}>
            {isPlaying ? <PauseIcon size={12} weight="fill" /> : <PlayIcon size={12} weight="fill" />}
          </Button>
          <Button className="col-span-2" onClick={() => setOctave((o) => Math.max(1, o - 1))} ariaLabel="Decrease octave">OCT-</Button>
          <Button className="col-span-2" onClick={() => setOctave((o) => Math.min(6, o + 1))} ariaLabel="Increase octave">OCT+</Button>
        </div>
        <div className="col-span-16 row-start-6 grid grid-cols-subgrid min-h-48">
          {showKeyboard ?
            <Keyboard
              octaves={2}
              baseOctave={octave}
              onNoteDown={(note) => console.log("down", note)}
              onNoteUp={(note) => console.log("up", note)}
            /> :
            <StepSequencer
              rows={numTracks}
              cols={16}
              steps={sequenceGrid}
              currentStep={currentStep}
              onToggle={(row, col) => handleSequenceToggle(row, col)}
            />
          }
        </div>
      </div>
    </div>
  );
}
