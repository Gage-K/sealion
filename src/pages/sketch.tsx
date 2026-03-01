import { type ReactNode, useId, useState } from "react";
import { WaveSquareIcon, WaveSawtoothIcon, WaveSineIcon, WaveTriangleIcon } from "@phosphor-icons/react";

function Button({
  children,
  active = false,
  onClick,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      className={`rounded-xs cursor-pointer hover:opacity-75 active:opacity-50 ${active
        ? "bg-cyan-300 text-zinc-900"
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
          className={`grid col-span-2 place-items-center rounded-xs cursor-pointer hover:opacity-75 active:opacity-50 ${value === option.value
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
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="col-span-8 grid grid-cols-subgrid items-center"
    >
      <label id={`${id}-label`} htmlFor={id} className="col-span-2">
        {label}
      </label>
      <output htmlFor={id} className="col-span-1">{value}</output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-bar cursor-move col-span-5"
        style={{ "--val": `${percent}%` } as React.CSSProperties}
      />
    </div>
  );
}

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

function Keyboard({
  octaves = 2,
  onNoteDown,
  onNoteUp,
}: {
  octaves?: number;
  onNoteDown?: (note: string) => void;
  onNoteUp?: (note: string) => void;
}) {
  const whiteKeys: { note: string; index: number }[] = [];
  const blackKeys: { note: string; position: number }[] = [];

  for (let oct = 0; oct < octaves; oct++) {
    let whiteIndex = -1;
    for (let i = 0; i < 12; i++) {
      const note = `${NOTE_NAMES[i]}${oct + 3}`;
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

export default function Sketch() {
  const [delay, setDelay] = useState(50);
  const [reverb, setReverb] = useState(50);
  const [chorus, setChorus] = useState(50);
  const [distortion, setDistortion] = useState(50);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [waveform, setWaveform] = useState<"sine" | "square" | "triangle" | "sawtooth">("sine");

  const waveOptions: { value: typeof waveform; label: ReactNode }[] = [
    { value: "sine", label: <WaveSineIcon size={24} /> },
    { value: "square", label: <WaveSquareIcon size={24} /> },
    { value: "triangle", label: <WaveTriangleIcon size={24} /> },
    { value: "sawtooth", label: <WaveSawtoothIcon size={24} /> },
  ];

  return (
    <div className="bg-zinc-900 h-screen w-screen text-zinc-100 grid place-items-center text-sm">
      <div className="border border-zinc-600 rounded-sm p-4 grid grid-cols-[repeat(16,minmax(1.5rem,1fr))] gap-4 items-center">
        <div className="col-span-8 row-span-1 bg-zinc-600 w-full h-full"></div>
        <fieldset className="col-span-8 grid grid-cols-subgrid gap-y-2">
          <legend className="sr-only">Effect controls</legend>
          <RangeControl label="vol" value={delay} onChange={setDelay} />
          <RangeControl label="pan" value={reverb} onChange={setReverb} />
          <RangeControl label="bpm" value={chorus} onChange={setChorus} />
          <RangeControl label="swg" value={distortion} onChange={setDistortion} />
        </fieldset>
        <fieldset className="col-span-8 grid grid-cols-subgrid gap-y-2">
          <legend className="sr-only">Effect controls</legend>
          <RangeControl label="delay" value={delay} onChange={setDelay} />
          <RangeControl label="reverb" value={reverb} onChange={setReverb} />
          <RangeControl label="chorus" value={chorus} onChange={setChorus} />
          <RangeControl label="distortion" value={distortion} onChange={setDistortion} />
        </fieldset>
        <div className="col-span-8 row-span-2 grid grid-cols-subgrid gap-y-2">
          <button className="col-span-2">1</button>
          <button className="col-span-2">2</button>
          <button className="col-span-2">3</button>
          <button className="col-span-2">4</button>
          <RangeControl label="att" value={delay} onChange={setDelay} />
          <RangeControl label="dec" value={delay} onChange={setDelay} />
          <RangeControl label="sus" value={delay} onChange={setDelay} />
          <RangeControl label="rel" value={delay} onChange={setDelay} />
          <RangeControl label="vol" value={delay} onChange={setDelay} />
          <RangeControl label="pan" value={delay} onChange={setDelay} />
          <RadioGroup
            options={waveOptions}
            value={waveform}
            onChange={setWaveform}
            name="waveform"
            className="col-span-8 grid grid-cols-subgrid"
          />
        </div>

        <div className="col-span-8 row-span-1 grid grid-cols-subgrid gap-y-2">
          <button className="col-span-2">dlay</button>
          <button className="col-span-2">rvrb</button>
          <button className="col-span-2">chrs</button>
          <button className="col-span-2">dist</button>
          <RangeControl label="rate" value={delay} onChange={setDelay} />
          <RangeControl label="decay" value={delay} onChange={setDelay} />
          <RangeControl label="feedback" value={delay} onChange={setDelay} />
        </div>
        <div className="col-span-full row-span-1 grid grid-cols-subgrid gap-y-2">
          <Button className="col-span-2" active onClick={() => setShowKeyboard(!showKeyboard)}>{showKeyboard ? "SEQ" : "KEY"}</Button>
        </div>
        <div className="col-span-16 grid grid-cols-subgrid min-h-48">
          {showKeyboard ?
            <Keyboard
              octaves={2}
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
