import { useState } from "react";
import { PlayIcon, PauseIcon } from "@phosphor-icons/react";
import type { TrackState, EffectName, EffectsState, LfoState } from "../types/synth";
import { defaultTrack, defaultEffects, defaultLfo } from "../types/synth";
import Button from "../components/core/NewButton";
import GlobalControls from "../components/complex/GlobalControls";
import TrackPanel from "../components/complex/TrackPanel";
import EffectPanel from "../components/complex/EffectPanel";
import LfoPanel from "../components/complex/LfoPanel";
import Keyboard from "../components/complex/NewKeyboard";
import StepSequencer from "../components/complex/StepSequencer";

export default function Sketch() {
  // Global controls
  const [vol, setVol] = useState(0);
  const [pan, setPan] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(50);

  // Track state
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [tracks, setTracks] = useState<TrackState[]>(() =>
    Array.from({ length: 4 }, defaultTrack)
  );

  // Effect state
  const [selectedEffect, setSelectedEffect] = useState<EffectName>("delay");
  const [effects, setEffects] = useState<EffectsState>(defaultEffects);

  // LFO state
  const [lfo, setLfo] = useState<LfoState>(defaultLfo);

  const updateLfo = (patch: Partial<LfoState>) => {
    setLfo((prev) => ({ ...prev, ...patch }));
  };

  // UI toggle
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [octave, setOctave] = useState(2);

  const updateTrack = (index: number, patch: Partial<TrackState>) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  };

  const updateEffect = <K extends EffectName>(name: K, patch: Partial<EffectsState[K]>) => {
    setEffects((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...patch },
    }));
  };

  return (
    <div className="bg-zinc-900 h-screen w-screen text-zinc-100 grid place-items-center text-sm">
      <div className="border border-zinc-600 rounded-sm p-4 grid grid-cols-[repeat(16,minmax(1.5rem,1fr))] gap-4 items-start">
        <div className="col-span-8 row-start-1 row-span-1 bg-zinc-600 w-full self-stretch">
        </div>
        <div className="col-span-8 row-start-1 row-span-1">
          <GlobalControls
            vol={vol}
            pan={pan}
            bpm={bpm}
            swing={swing}
            onChangeVol={setVol}
            onChangePan={setPan}
            onChangeBpm={setBpm}
            onChangeSwing={setSwing}
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
            tracks={tracks}
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
            onUpdateTrack={updateTrack}
          />
        </div>
        <div className="col-span-8 row-start-3 row-span-1">
          <LfoPanel lfo={lfo} onUpdateLfo={updateLfo} />
        </div>
        <div className="col-span-full row-start-5 grid grid-cols-subgrid">
          <Button className="col-span-2" active onClick={() => setShowKeyboard(!showKeyboard)}>{showKeyboard ? "SEQ" : "KEY"}</Button>
          <Button className="col-span-2 grid place-items-center" active={playing} activeClassName="bg-red-500 text-zinc-100" onClick={() => setPlaying(!playing)} ariaLabel={playing ? "Pause playback" : "Start playback"}>
            {playing ? <PauseIcon size={12} weight="fill" /> : <PlayIcon size={12} weight="fill" />}
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
            <StepSequencer rows={4} cols={16} />
          }
        </div>
      </div>
    </div>
  );
}
