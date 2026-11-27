import { describe, it, expect } from "vitest";
import { EFFECT_ORDER } from "../types/effects";
import { AUDIO_EFFECT_SPECS } from "./effectSpecs";

type FilterNode = Parameters<typeof AUDIO_EFFECT_SPECS.filter.apply>[0];
type FilterParams = Parameters<typeof AUDIO_EFFECT_SPECS.filter.apply>[2];

describe("audio effect specs", () => {
  it("has a spec for exactly the insert effects (no drift from EFFECT_ORDER)", () => {
    expect(Object.keys(AUDIO_EFFECT_SPECS).sort()).toEqual(
      [...EFFECT_ORDER].sort()
    );
  });

  it("filter.apply touches only the params that changed, against a fake node", () => {
    const freqRamps: number[] = [];
    const qRamps: number[] = [];
    const node = {
      frequency: { rampTo: (v: number) => freqRamps.push(v) },
      Q: { rampTo: (v: number) => qRamps.push(v) },
      type: "lowpass" as string,
    };
    const fake = node as unknown as FilterNode;

    const base: FilterParams = {
      enabled: true,
      cutoff: 1000,
      q: 1,
      type: "lowpass",
    };

    // Only cutoff differs.
    AUDIO_EFFECT_SPECS.filter.apply(fake, base, { ...base, cutoff: 2000 });
    expect(freqRamps).toEqual([2000]);
    expect(qRamps).toEqual([]);

    // Only type differs.
    AUDIO_EFFECT_SPECS.filter.apply(fake, base, { ...base, type: "highpass" });
    expect(node.type).toBe("highpass");

    // Nothing differs → nothing touched.
    freqRamps.length = 0;
    qRamps.length = 0;
    node.type = "lowpass";
    AUDIO_EFFECT_SPECS.filter.apply(fake, base, { ...base });
    expect(freqRamps).toEqual([]);
    expect(qRamps).toEqual([]);
    expect(node.type).toBe("lowpass");
  });
});
