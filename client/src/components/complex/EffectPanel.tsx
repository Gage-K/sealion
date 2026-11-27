import type { TrackEffectsMap, EffectName } from "../../types/effects";
import { EFFECT_CONTROLS, EFFECT_TAB_ORDER } from "../../types/effects";
import Button from "../core/NewButton";
import EffectControls from "./EffectControls";

// Effects rack for a single track. The tab strip and enable toggle live here;
// the per-param controls are rendered generically by EffectControls from each
// effect's schema, so a new effect needs no change to this file.
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
        {EFFECT_TAB_ORDER.map((key) => (
          <Button
            key={key}
            className="flex-1 relative"
            active={selectedEffect === key}
            onClick={() => onSelectEffect(key)}
          >
            {EFFECT_CONTROLS[key].tabLabel}
            {/* Selection and bypass are different things: the tab highlight is
                selection, this dot is whether the effect is actually in the chain. */}
            {effects[key].enabled && (
              <span
                aria-hidden="true"
                className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${
                  selectedEffect === key ? "bg-zinc-900" : "bg-cyan-300"
                }`}
              />
            )}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr] gap-y-2 grid-rows-3">
        <EffectControls
          effect={selectedEffect}
          params={current}
          onChange={(param, value) =>
            onUpdateEffect(selectedEffect, {
              [param]: value,
            } as Partial<TrackEffectsMap[EffectName]>)
          }
        />
      </div>
    </div>
  );
}
