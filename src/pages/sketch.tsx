import { type ReactNode, useId, useState } from "react";
import { WaveSquareIcon, WaveSawtoothIcon, WaveSineIcon, WaveTriangleIcon, PlayIcon, PauseIcon } from "@phosphor-icons/react";

function Button({
  children,
  active = false,
  onClick,
  className = "",
  activeClassName = "bg-cyan-300 text-zinc-900",
  ariaLabel,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  activeClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      className={`rounded-xs cursor-pointer hover:opacity-75 active:opacity-50 ${active
        ? activeClassName
        : "bg-zinc-900 text-zinc-100 border border-zinc-600"
        } ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  name,
  className = "",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={className}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`grid flex-1 place-items-center rounded-xs cursor-pointer hover:opacity-75 active:opacity-50 ${value === option.value
            ? "bg-cyan-300 text-zinc-900"
            : "bg-zinc-900 text-zinc-100 border border-zinc-600"
            }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function RangeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  formatValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="grid grid-cols-[1fr_1fr_2fr] items-center h-6"
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <output htmlFor={id}>{formatValue ? formatValue(value) : value}</output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-bar cursor-move w-full"
        style={{ "--val": `${percent}%` } as React.CSSProperties}
      />
    </div>
  );
}

const formatPan = (v: number) => {
  if (v === 0) return "C";
  return `${Math.abs(v)}${v < 0 ? "L" : "R"}`;
};

const formatVolume = (v: number) => {
  return `${v} db`;
}

const formatPercent = (v: number) => {
  return `${v}%`
}

const formatTime = (v: number) => {
  return `${v} ms`;
}

const formatFrequency = (v: number) => {
  return `${v} hz`
}

function SelectControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="grid grid-cols-[1fr_1fr_2fr] items-center h-6"
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <span />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-zinc-900 text-zinc-100 border border-zinc-600 rounded-xs px-1 cursor-pointer w-full"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

function Keyboard({
  octaves = 2,
  baseOctave = 3,
  onNoteDown,
  onNoteUp,
}: {
  octaves?: number;
  baseOctave?: number;
  onNoteDown?: (note: string) => void;
  onNoteUp?: (note: string) => void;
}) {
  const whiteKeys: { note: string; index: number }[] = [];
  const blackKeys: { note: string; position: number }[] = [];

  for (let oct = 0; oct < octaves; oct++) {
    let whiteIndex = -1;
    for (let i = 0; i < 12; i++) {
      const note = `${NOTE_NAMES[i]}${oct + baseOctave}`;
      if (BLACK_KEY_INDICES.has(i)) {
        blackKeys.push({
          note,
          position: oct * 7 + whiteIndex,
        });
      } else {
        whiteKeys.push({ note, index: oct * 7 + whiteIndex });
        whiteIndex++;
      }
    }
  }

  const totalWhite = whiteKeys.length;

  return (
    <div
      className="col-span-16 relative h-full select-none"
      role="group"
      aria-label="Piano keyboard"
    >
      <div className="flex h-full">
        {whiteKeys.map(({ note }) => (
          <button
            key={note}
            className="flex-1 border border-zinc-600 bg-zinc-900 cursor-pointer active:bg-zinc-500 hover:bg-zinc-800"
            onPointerDown={() => onNoteDown?.(note)}
            onPointerUp={() => onNoteUp?.(note)}
            onPointerLeave={() => onNoteUp?.(note)}
            aria-label={note}
          />
        ))}
      </div>
      {blackKeys.map(({ note, position }) => (
        <button
          key={note}
          className="absolute top-0 w-[5%] h-[60%] bg-zinc-600 border border-zinc-600 cursor-pointer active:bg-zinc-500 hover:bg-zinc-800 z-10"
          style={{
            left: `${((position + 1) / totalWhite) * 100 - 2.5}%`,
          }}
          onPointerDown={() => onNoteDown?.(note)}
          onPointerUp={() => onNoteUp?.(note)}
          onPointerLeave={() => onNoteUp?.(note)}
          aria-label={note}
        />
      ))}
    </div>
  );
}

function StepButton({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`aspect-square cursor-pointer rounded-xs border ${active
        ? "border-zinc-200 shadow-[inset_0_0_0_3px_theme(--color-zinc-900),inset_0_0_0_20px_theme(--color-zinc-200)]"
        : "border-zinc-600"
        }`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="sr-only">{label}</span>
    </button>
  );
}

function StepSequencer({
  rows = 4,
  cols = 16,
}: {
  rows?: number;
  cols?: number;
}) {
  const [steps, setSteps] = useState<boolean[][]>(
    Array.from({ length: rows }, () => Array(cols).fill(false))
  );

  function toggleStep(row: number, col: number) {
    setSteps((prev) =>
      prev.map((r, ri) =>
        ri === row ? r.map((v, ci) => (ci === col ? !v : v)) : r
      )
    );
  }

  return (
    <div className="col-span-16 grid grid-cols-subgrid gap-y-4" role="group" aria-label="Step sequencer">
      {Array.from({ length: cols }, (_, i) => (
        <span key={i} aria-hidden="true" className="text-xs text-center text-zinc-500">
          {i + 1}
        </span>
      ))}
      {steps.map((row, ri) =>
        row.map((active, ci) => (
          <StepButton
            key={`${ri}-${ci}`}
            label={`Row ${ri + 1} Step ${ci + 1}`}
            active={active}
            onToggle={() => toggleStep(ri, ci)}
          />
        ))
      )}
    </div>
  );
}

// --- Types ---

type Waveform = "sine" | "square" | "triangle" | "sawtooth";

interface TrackState {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  vol: number;
  pan: number;
  waveform: Waveform;
}

type EffectName = "delay" | "reverb" | "chorus" | "distortion" | "filter";

type FilterType = "lowpass" | "highpass" | "bandpass";

interface EffectsState {
  delay: { time: number; feedback: number; wet: number };
  reverb: { decay: number; preDelay: number; wet: number };
  chorus: { frequency: number; depth: number; wet: number };
  distortion: { amount: number; wet: number };
  filter: { cutoff: number; resonance: number; type: FilterType };
}

type LfoTarget = "cutoff" | "resonance" | "volume" | "pan" | "pitch";

interface LfoState {
  rate: number;
  depth: number;
  waveform: Waveform;
  target: LfoTarget;
}

// --- Defaults ---

const defaultTrack = (): TrackState => ({
  attack: 50,
  decay: 50,
  sustain: 50,
  release: 50,
  vol: 50,
  pan: 0,
  waveform: "sine",
});

const defaultEffects = (): EffectsState => ({
  delay: { time: 50, feedback: 50, wet: 50 },
  reverb: { decay: 50, preDelay: 50, wet: 50 },
  chorus: { frequency: 50, depth: 50, wet: 50 },
  distortion: { amount: 50, wet: 50 },
  filter: { cutoff: 100, resonance: 0, type: "lowpass" },
});

const defaultLfo = (): LfoState => ({
  rate: 50,
  depth: 50,
  waveform: "sine",
  target: "cutoff",
});

// --- Section components ---

function GlobalControls({
  vol,
  pan,
  bpm,
  swing,
  onChangeVol,
  onChangePan,
  onChangeBpm,
  onChangeSwing,
}: {
  vol: number;
  pan: number;
  bpm: number;
  swing: number;
  onChangeVol: (v: number) => void;
  onChangePan: (v: number) => void;
  onChangeBpm: (v: number) => void;
  onChangeSwing: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <span className="text-zinc-500 text-xs">global</span>
      <RangeControl label="vol" value={vol} formatValue={formatVolume} onChange={onChangeVol} min={-12} max={8} />
      <RangeControl label="pan" value={pan} min={-50} max={50} onChange={onChangePan} formatValue={formatPan} />
      <RangeControl label="bpm" value={bpm} onChange={onChangeBpm} min={60} max={240} />
      <RangeControl label="swg" value={swing} onChange={onChangeSwing} min={0} max={25} formatValue={formatPercent} />
    </div>
  );
}

const waveOptions: { value: Waveform; label: ReactNode }[] = [
  { value: "sine", label: <WaveSineIcon size={20} /> },
  { value: "square", label: <WaveSquareIcon size={20} /> },
  { value: "triangle", label: <WaveTriangleIcon size={20} /> },
  { value: "sawtooth", label: <WaveSawtoothIcon size={20} /> },
];

function TrackPanel({
  tracks,
  selectedTrack,
  onSelectTrack,
  onUpdateTrack,
}: {
  tracks: TrackState[];
  selectedTrack: number;
  onSelectTrack: (i: number) => void;
  onUpdateTrack: (i: number, patch: Partial<TrackState>) => void;
}) {
  const track = tracks[selectedTrack];

  const setField = (field: keyof TrackState, value: number | Waveform) => {
    onUpdateTrack(selectedTrack, { [field]: value });
  };

  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <span className="text-zinc-500 text-xs">synth</span>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Button
            key={i}
            className="flex-1"
            active={selectedTrack === i}
            onClick={() => onSelectTrack(i)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      <RangeControl label="att" value={track.attack} onChange={(v) => setField("attack", v)} />
      <RangeControl label="dec" value={track.decay} onChange={(v) => setField("decay", v)} />
      <RangeControl label="sus" value={track.sustain} onChange={(v) => setField("sustain", v)} />
      <RangeControl label="rel" value={track.release} onChange={(v) => setField("release", v)} />
      <RangeControl label="vol" value={track.vol} onChange={(v) => setField("vol", v)} />
      <RangeControl label="pan" value={track.pan} min={-50} max={50} onChange={(v) => setField("pan", v)} formatValue={formatPan} />
      <RadioGroup
        options={waveOptions}
        value={track.waveform}
        onChange={(v) => setField("waveform", v)}
        name="waveform"
        className="flex gap-2"
      />
    </div>
  );
}

const EFFECT_TABS: { key: EffectName; label: string }[] = [
  { key: "delay", label: "dlay" },
  { key: "reverb", label: "rvrb" },
  { key: "chorus", label: "chrs" },
  { key: "distortion", label: "dist" },
  { key: "filter", label: "fltr" },
];

const filterTypeOptions: { value: FilterType; label: string }[] = [
  { value: "lowpass", label: "lowpass" },
  { value: "highpass", label: "highpass" },
  { value: "bandpass", label: "bandpass" },
];

function EffectPanel({
  effects,
  selectedEffect,
  onSelectEffect,
  onUpdateEffect,
}: {
  effects: EffectsState;
  selectedEffect: EffectName;
  onSelectEffect: (e: EffectName) => void;
  onUpdateEffect: <K extends EffectName>(name: K, patch: Partial<EffectsState[K]>) => void;
}) {
  const renderControls = () => {
    switch (selectedEffect) {
      case "delay": {
        const d = effects.delay;
        return (
          <>
            <RangeControl label="tim" value={d.time} formatValue={formatTime} onChange={(v) => onUpdateEffect("delay", { time: v })} />
            <RangeControl label="fdb" value={d.feedback} onChange={(v) => onUpdateEffect("delay", { feedback: v })} />
            <RangeControl label="wet" value={d.wet} onChange={(v) => onUpdateEffect("delay", { wet: v })} formatValue={formatPercent} />
          </>
        );
      }
      case "reverb": {
        const r = effects.reverb;
        return (
          <>
            <RangeControl label="dcy" value={r.decay} onChange={(v) => onUpdateEffect("reverb", { decay: v })} />
            <RangeControl label="pre" value={r.preDelay} onChange={(v) => onUpdateEffect("reverb", { preDelay: v })} />
            <RangeControl label="wet" value={r.wet} onChange={(v) => onUpdateEffect("reverb", { wet: v })} formatValue={formatPercent} />
          </>
        );
      }
      case "chorus": {
        const c = effects.chorus;
        return (
          <>
            <RangeControl label="frq" value={c.frequency} onChange={(v) => onUpdateEffect("chorus", { frequency: v })} formatValue={formatFrequency} />
            <RangeControl label="dpt" value={c.depth} onChange={(v) => onUpdateEffect("chorus", { depth: v })} />
            <RangeControl label="wet" value={c.wet} onChange={(v) => onUpdateEffect("chorus", { wet: v })} formatValue={formatPercent} />
          </>
        );
      }
      case "distortion": {
        const dist = effects.distortion;
        return (
          <>
            <RangeControl label="amt" value={dist.amount} onChange={(v) => onUpdateEffect("distortion", { amount: v })} />
            <RangeControl label="wet" value={dist.wet} onChange={(v) => onUpdateEffect("distortion", { wet: v })} formatValue={formatPercent} />
            <div aria-hidden="true" />
          </>
        );
      }
      case "filter": {
        const f = effects.filter;
        return (
          <>
            <RangeControl label="cut" value={f.cutoff} onChange={(v) => onUpdateEffect("filter", { cutoff: v })} min={0} max={5000} formatValue={formatFrequency} />
            <RangeControl label="res" value={f.resonance} onChange={(v) => onUpdateEffect("filter", { resonance: v })} />
            <SelectControl
              label="typ"
              value={f.type}
              onChange={(v) => onUpdateEffect("filter", { type: v })}
              options={filterTypeOptions}
            />
          </>
        );
      }
    }
  };

  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <span className="text-zinc-500 text-xs">effects</span>
      <div className="flex gap-2">
        {EFFECT_TABS.map((tab) => (
          <Button
            key={tab.key}
            className="flex-1"
            active={selectedEffect === tab.key}
            onClick={() => onSelectEffect(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr] gap-y-2 grid-rows-3">
        {renderControls()}
      </div>
    </div>
  );
}

const LFO_TARGET_OPTIONS: { value: LfoTarget; label: string }[] = [
  { value: "cutoff", label: "filter cutoff" },
  { value: "resonance", label: "filter resonance" },
  { value: "volume", label: "volume" },
  { value: "pan", label: "pan" },
  { value: "pitch", label: "pitch" },
];

function LfoPanel({
  lfo,
  onUpdateLfo,
}: {
  lfo: LfoState;
  onUpdateLfo: (patch: Partial<LfoState>) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <span className="text-zinc-500 text-xs">lfo</span>
      <RangeControl label="rte" value={lfo.rate} onChange={(v) => onUpdateLfo({ rate: v })} />
      <RangeControl label="dpt" value={lfo.depth} onChange={(v) => onUpdateLfo({ depth: v })} />
      <RadioGroup
        options={waveOptions}
        value={lfo.waveform}
        onChange={(v) => onUpdateLfo({ waveform: v })}
        name="lfo-waveform"
        className="flex gap-2"
      />
      <SelectControl
        label="dst"
        value={lfo.target}
        onChange={(v) => onUpdateLfo({ target: v })}
        options={LFO_TARGET_OPTIONS}
      />
    </div>
  );
}

// --- Main page ---

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
