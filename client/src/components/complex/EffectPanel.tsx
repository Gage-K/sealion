import type {
  TrackEffectsMap,
  EffectName,
  FilterType,
} from "../../types/effects";
import { EFFECT_RANGES } from "../../types/effects";
import Button from "../core/NewButton";
import RangeControl, {
  formatMs,
  formatNormal,
  formatFrequency,
} from "../core/RangeControl";
import SelectControl from "../core/SelectControl";

export const EFFECT_TABS: { key: EffectName; label: string }[] = [
  { key: "delay", label: "dlay" },
  { key: "reverb", label: "rvrb" },
  { key: "chorus", label: "chrs" },
  { key: "distortion", label: "dist" },
  { key: "filter", label: "fltr" },
];

export const filterTypeOptions: { value: FilterType; label: string }[] = [
  { value: "lowpass", label: "lowpass" },
  { value: "highpass", label: "highpass" },
  { value: "bandpass", label: "bandpass" },
];

const R = EFFECT_RANGES;

// Effects rack for a single track
export default function EffectPanel({
  effects,
  trackName,
  selectedEffect,
  onSelectEffect,
  onUpdateEffect,
  onToggleEffect,
}: {
  effects: TrackEffectsMap;
  trackName: string;
  selectedEffect: EffectName;
  onSelectEffect: (e: EffectName) => void;
  onUpdateEffect: <K extends EffectName>(
    name: K,
    patch: Partial<TrackEffectsMap[K]>,
  ) => void;
  onToggleEffect: (name: EffectName) => void;
}) {
  const current = effects[selectedEffect];

  const renderControls = () => {
    switch (selectedEffect) {
      case "delay": {
        const d = effects.delay;
        return (
          <>
            <RangeControl
              label="tim"
              value={d.time}
              min={R.delay.time[0]}
              max={R.delay.time[1]}
              step={0.001}
              formatValue={formatMs}
              onChange={(v) => onUpdateEffect("delay", { time: v })}
            />
            <RangeControl
              label="fdb"
              value={d.feedback}
              min={R.delay.feedback[0]}
              max={R.delay.feedback[1]}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("delay", { feedback: v })}
            />
            <RangeControl
              label="wet"
              value={d.wet}
              min={0}
              max={1}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("delay", { wet: v })}
            />
          </>
        );
      }
      case "reverb": {
        const r = effects.reverb;
        return (
          <>
            <RangeControl
              label="rom"
              value={r.roomSize}
              min={R.reverb.roomSize[0]}
              max={R.reverb.roomSize[1]}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("reverb", { roomSize: v })}
            />
            <RangeControl
              label="dmp"
              value={r.dampening}
              min={R.reverb.dampening[0]}
              max={R.reverb.dampening[1]}
              curve="log"
              formatValue={formatFrequency}
              onChange={(v) => onUpdateEffect("reverb", { dampening: v })}
            />
            <RangeControl
              label="wet"
              value={r.wet}
              min={0}
              max={1}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("reverb", { wet: v })}
            />
          </>
        );
      }
      case "chorus": {
        const c = effects.chorus;
        return (
          <>
            <RangeControl
              label="frq"
              value={c.frequency}
              min={R.chorus.frequency[0]}
              max={R.chorus.frequency[1]}
              step={0.05}
              formatValue={formatFrequency}
              onChange={(v) => onUpdateEffect("chorus", { frequency: v })}
            />
            <RangeControl
              label="dpt"
              value={c.depth}
              min={0}
              max={1}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("chorus", { depth: v })}
            />
            <RangeControl
              label="wet"
              value={c.wet}
              min={0}
              max={1}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("chorus", { wet: v })}
            />
          </>
        );
      }
      case "distortion": {
        const dist = effects.distortion;
        return (
          <>
            <RangeControl
              label="amt"
              value={dist.amount}
              min={0}
              max={1}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("distortion", { amount: v })}
            />
            <RangeControl
              label="wet"
              value={dist.wet}
              min={0}
              max={1}
              step={0.01}
              formatValue={formatNormal}
              onChange={(v) => onUpdateEffect("distortion", { wet: v })}
            />
            <div aria-hidden="true" />
          </>
        );
      }
      case "filter": {
        const f = effects.filter;
        return (
          <>
            <RangeControl
              label="cut"
              value={f.cutoff}
              min={R.filter.cutoff[0]}
              max={R.filter.cutoff[1]}
              curve="log"
              formatValue={formatFrequency}
              onChange={(v) => onUpdateEffect("filter", { cutoff: v })}
            />
            <RangeControl
              label="res"
              value={f.q}
              min={R.filter.q[0]}
              max={R.filter.q[1]}
              step={0.1}
              onChange={(v) => onUpdateEffect("filter", { q: v })}
            />
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
      <div className="flex items-center justify-between">
        <span className="text-zinc-500 text-xs">effects · {trackName}</span>
        <Button
          className="text-[10px] px-2"
          active={current.enabled}
          onClick={() => onToggleEffect(selectedEffect)}
          ariaLabel={`${current.enabled ? "Bypass" : "Enable"} ${selectedEffect} on ${trackName}`}
        >
          {current.enabled ? "on" : "off"}
        </Button>
      </div>
      <div className="flex gap-2">
        {EFFECT_TABS.map((tab) => (
          <Button
            key={tab.key}
            className="flex-1 relative"
            active={selectedEffect === tab.key}
            onClick={() => onSelectEffect(tab.key)}
          >
            {tab.label}
            {/* Selection and bypass are different things: the tab highlight is
                selection, this dot is whether the effect is actually in the chain. */}
            {effects[tab.key].enabled && (
              <span
                aria-hidden="true"
                className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${
                  selectedEffect === tab.key ? "bg-zinc-900" : "bg-cyan-300"
                }`}
              />
            )}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr] gap-y-2 grid-rows-3">
        {renderControls()}
      </div>
    </div>
  );
}
