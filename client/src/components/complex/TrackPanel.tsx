import type { ReactNode } from "react";
import { WaveSquareIcon, WaveSawtoothIcon, WaveSineIcon, WaveTriangleIcon } from "@phosphor-icons/react";
import type { Waveform } from "../../types/effects";
import type { Envelope, Mixer } from "../../types/crdt";
import Button from "../core/NewButton";
import KeyButton from "../core/KeyButton";
import RangeControl, { formatVolume } from "../core/RangeControl";

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
  mixers,
  selectedTrack,
  onSelectTrack,
  onEnvelopeChange,
  onTrackVolumeChange,
  onTrackMuteToggle,
}: {
  trackNames: string[];
  envelopes: Envelope[];
  mixers: Mixer[];
  selectedTrack: number;
  onSelectTrack: (i: number) => void;
  onEnvelopeChange: (trackIndex: number, param: keyof Envelope, value: number) => void;
  onTrackVolumeChange: (trackIndex: number, db: number) => void;
  onTrackMuteToggle: (trackIndex: number) => void;
}) {
  const envelope = envelopes[selectedTrack];
  const mixer = mixers[selectedTrack];

  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <div className="flex items-center justify-between">
        <span className="text-zinc-500 text-xs">synth · {trackNames[selectedTrack]}</span>
        <Button
          className="text-[10px] px-2"
          active={mixer.muted}
          activeClassName="bg-red-500 text-zinc-100"
          onClick={() => onTrackMuteToggle(selectedTrack)}
          ariaLabel={`${mixer.muted ? "Unmute" : "Mute"} ${trackNames[selectedTrack]}`}
        >
          mute
        </Button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {trackNames.map((name, i) => (
          <KeyButton
            key={i}
            className="[--key-font:0.45rem]"
            active={selectedTrack === i}
            led={mixers[i].muted ? "alert" : undefined}
            onClick={() => onSelectTrack(i)}
            ariaLabel={`Select ${name}${mixers[i].muted ? " (muted)" : ""}`}
          >
            {name}
          </KeyButton>
        ))}
      </div>
      <RangeControl
        label="vol"
        value={mixer.volume}
        min={-40}
        max={12}
        step={0.5}
        onChange={(v) => onTrackVolumeChange(selectedTrack, v)}
        formatValue={formatVolume}
      />
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
