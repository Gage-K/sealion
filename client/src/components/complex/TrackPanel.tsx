import type { ReactNode } from "react";
import { WaveSquareIcon, WaveSawtoothIcon, WaveSineIcon, WaveTriangleIcon } from "@phosphor-icons/react";
import type { Waveform } from "../../types/synth";
import type { Envelope } from "../../types/crdt";
import Button from "../core/NewButton";
import RangeControl from "../core/RangeControl";

export const waveOptions: { value: Waveform; label: ReactNode }[] = [
  { value: "sine", label: <WaveSineIcon size={20} /> },
  { value: "square", label: <WaveSquareIcon size={20} /> },
  { value: "triangle", label: <WaveTriangleIcon size={20} /> },
  { value: "sawtooth", label: <WaveSawtoothIcon size={20} /> },
];

const formatSeconds = (v: number) => `${v}s`;

export default function TrackPanel({
  trackNames,
  envelopes,
  selectedTrack,
  onSelectTrack,
  onEnvelopeChange,
}: {
  trackNames: string[];
  envelopes: Envelope[];
  selectedTrack: number;
  onSelectTrack: (i: number) => void;
  onEnvelopeChange: (trackIndex: number, param: keyof Envelope, value: number) => void;
}) {
  const envelope = envelopes[selectedTrack];

  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <span className="text-zinc-500 text-xs">synth</span>
      <div className="grid grid-cols-8 gap-1">
        {trackNames.map((name, i) => (
          <Button
            key={i}
            className="col-span-1 text-[10px] px-0"
            active={selectedTrack === i}
            onClick={() => onSelectTrack(i)}
          >
            {name}
          </Button>
        ))}
      </div>
      <RangeControl
        label="atk"
        value={envelope.attack}
        min={0.001}
        max={2}
        step={0.001}
        onChange={(v) => onEnvelopeChange(selectedTrack, "attack", v)}
        formatValue={formatSeconds}
      />
      <RangeControl
        label="dec"
        value={envelope.decay}
        min={0.001}
        max={2}
        step={0.001}
        onChange={(v) => onEnvelopeChange(selectedTrack, "decay", v)}
        formatValue={formatSeconds}
      />
      <RangeControl
        label="sus"
        value={envelope.sustain}
        min={0.001}
        max={1}
        step={0.001}
        onChange={(v) => onEnvelopeChange(selectedTrack, "sustain", v)}
        formatValue={formatSeconds}
      />
      <RangeControl
        label="rel"
        value={envelope.release}
        min={0.001}
        max={2}
        step={0.001}
        onChange={(v) => onEnvelopeChange(selectedTrack, "release", v)}
        formatValue={formatSeconds}
      />
    </div>
  );
}
