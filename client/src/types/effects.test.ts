import { describe, it, expect } from "vitest";
import {
  EFFECT_ORDER,
  EFFECT_CONTROLS,
  DEFAULT_TRACK_EFFECTS,
  clampEffect,
} from "./effects";

// Tone-free: imports only the pure effect data, no audio nodes.

describe("effect control schema", () => {
  it("covers every insert effect, and every control names a real param", () => {
    for (const name of EFFECT_ORDER) {
      const entry = EFFECT_CONTROLS[name];
      expect(entry).toBeDefined();
      expect(entry.controls.length).toBeGreaterThan(0);

      const params = DEFAULT_TRACK_EFFECTS[name] as Record<string, unknown>;
      for (const control of entry.controls) {
        expect(control.param in params).toBe(true);
      }
    }
  });
});

describe("clampEffect", () => {
  it("clamps out-of-range numeric params to the range bounds", () => {
    const clamped = clampEffect("delay", {
      enabled: true,
      time: 5, // above max 1
      feedback: -1, // below min 0
      wet: 2, // above max 1
    });
    expect(clamped.time).toBe(1);
    expect(clamped.feedback).toBe(0);
    expect(clamped.wet).toBe(1);
  });

  it("falls back to the default when a param is NaN", () => {
    const clamped = clampEffect("filter", {
      enabled: true,
      cutoff: NaN,
      q: 1,
      type: "lowpass",
    });
    expect(clamped.cutoff).toBe(DEFAULT_TRACK_EFFECTS.filter.cutoff);
  });
});
