import type { EffectsState, EffectName, FilterType } from "../../types/synth";
import Button from "../core/NewButton";
import RangeControl, { formatTime, formatPercent, formatFrequency } from "../core/RangeControl";
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

export default function EffectPanel({
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
