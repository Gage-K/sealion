import type { ReactNode } from "react";
import { WaveSquareIcon, WaveSawtoothIcon, WaveSineIcon, WaveTriangleIcon } from "@phosphor-icons/react";
import type { TrackState, Waveform } from "../../types/synth";
import Button from "../core/NewButton";
import RadioGroup from "../core/RadioGroup";
import RangeControl, { formatPan } from "../core/RangeControl";

export const waveOptions: { value: Waveform; label: ReactNode }[] = [
  { value: "sine", label: <WaveSineIcon size={20} /> },
  { value: "square", label: <WaveSquareIcon size={20} /> },
  { value: "triangle", label: <WaveTriangleIcon size={20} /> },
  { value: "sawtooth", label: <WaveSawtoothIcon size={20} /> },
];

export default function TrackPanel({
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
