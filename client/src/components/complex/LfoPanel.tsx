import type { LfoState, LfoTarget } from "../../types/synth";
import RadioGroup from "../core/RadioGroup";
import RangeControl from "../core/RangeControl";
import SelectControl from "../core/SelectControl";
import { waveOptions } from "./TrackPanel";

export const LFO_TARGET_OPTIONS: { value: LfoTarget; label: string }[] = [
  { value: "cutoff", label: "filter cutoff" },
  { value: "resonance", label: "filter resonance" },
  { value: "volume", label: "volume" },
  { value: "pan", label: "pan" },
  { value: "pitch", label: "pitch" },
];

export default function LfoPanel({
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
