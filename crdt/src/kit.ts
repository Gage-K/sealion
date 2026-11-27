import type { TrackDefault } from "./crdt";

/**
 * The kit's CRDT seeds — one entry per track, giving each track's default
 * envelope and groove. This is the single source of truth for the document's
 * **track count**, shared by the client (which constructs documents from its
 * audio config) and the authoritative server (which must build a CRDT with the
 * same number of tracks, or it would silently drop merges to the extra ones).
 *
 * Only the track COUNT is load-bearing on the server: the server never authors
 * values (it only merges), so these envelope/pattern defaults are never written
 * into its state — they surface only through a client's own virtual defaults.
 * The client's audio engine keeps the richer per-voice config (Tone params) in
 * `DRUM_SYNTH_CONFIG`; the envelope/pattern here mirror it. The client asserts
 * the two agree in length at startup (see `config/makeCRDT.ts`).
 */
export const DEFAULT_KIT: TrackDefault[] = [
  // KICK
  { envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.2 }, pattern: [1, 3, 11] },
  // SNR
  { envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }, pattern: [5, 8, 13, 16] },
  // CLAP
  { envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.25 } },
  // CHH
  { envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 }, pattern: [1, 3, 5, 7, 9, 11, 13, 15] },
  // OHH
  { envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 } },
  // LTOM
  { envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.6 } },
  // MTOM
  { envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 } },
  // RIM
  { envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.03 } },
];
