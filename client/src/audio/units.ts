/**
 * Unit helpers shared by the audio engine and the control ui.
 *
 * The CRDT stores Tone-native units (seconds, hertz, decibels, 0-1 normals).
 * Anything that needs a different scale converts here at the edge rather
 * than in stored state.
 */

export const clamp = (value: number, lo: number, hi: number) =>
  Math.min(Math.max(value, lo), hi);

export const uiToLogFreq = (norm: number, lo = 20, hi = 20000) =>
  lo * Math.pow(hi / lo, clamp(norm, 0, 1));

/** Inverse of {@link uiToLogFreq}, for positioning the slider from a stored hz value. */
export const logFreqToUi = (hz: number, lo = 20, hi = 20000) =>
  clamp(Math.log(clamp(hz, lo, hi) / lo) / Math.log(hi / lo), 0, 1);
