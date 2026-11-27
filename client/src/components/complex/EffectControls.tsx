import RangeControl, {
  formatMs,
  formatNormal,
  formatFrequency,
} from "../core/RangeControl";
import SelectControl from "../core/SelectControl";
import { EFFECT_CONTROLS, EFFECT_RANGES } from "../../types/effects";
import type { EffectName, EffectValue } from "../../types/effects";

const FORMATTERS = {
  ms: formatMs,
  normal: formatNormal,
  frequency: formatFrequency,
} as const;

/**
 * Renders one effect's rack controls from its declarative schema in
 * types/effects.ts. Numeric bounds come from EFFECT_RANGES (the range owner).
 * Generic over every effect, so adding one never touches this file — the casts
 * here are the registry plumbing, kept out of the schema and the callers.
 */
export default function EffectControls({
  effect,
  params,
  onChange,
}: {
  effect: EffectName;
  params: EffectValue;
  onChange: (param: string, value: number | string) => void;
}) {
  const { controls } = EFFECT_CONTROLS[effect];
  const values = params as unknown as Record<string, number | string>;
  const ranges = EFFECT_RANGES[effect] as Record<
    string,
    readonly [number, number] | undefined
  >;

  return (
    <>
      {controls.map((control) =>
        control.kind === "range" ? (
          <RangeControl
            key={control.param}
            label={control.label}
            value={values[control.param] as number}
            min={ranges[control.param]?.[0]}
            max={ranges[control.param]?.[1]}
            step={control.step}
            curve={control.curve}
            formatValue={control.format ? FORMATTERS[control.format] : undefined}
            onChange={(v) => onChange(control.param, v)}
          />
        ) : (
          <SelectControl
            key={control.param}
            label={control.label}
            value={values[control.param] as string}
            options={control.options}
            onChange={(v) => onChange(control.param, v)}
          />
        )
      )}
    </>
  );
}
